import { exec, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import DatabaseService from './DatabaseService';
import ScopeService from './ScopeService';
import scopeGate from '../../plugins/scope-gate';
import cmdAudit from '../../plugins/cmd-audit';
import type { Approval, NoiseLevel, ExecutionResult } from '../../shared/types';

interface RunningProcess {
  taskId: number;
  process: ChildProcess;
  stdout: string;
  stderr: string;
  startTime: number;
}

class ExecutionService {
  private db: DatabaseService;
  private scopeService: ScopeService;
  private runningProcesses: Map<number, RunningProcess> = new Map();

  constructor() {
    this.db = DatabaseService.getInstance();
    this.scopeService = new ScopeService();
  }

  async queueCommand(engagementId: string, agent: string, command: string, noiseLevel: NoiseLevel): Promise<{ approval: Approval; gateResult: { allowed: boolean; reason?: string } }> {
    const engagement = this.db.getEngagement(engagementId);
    const scopeDef = this.scopeService.parseScope(engagement.scope);

    // Run scope gate pre-check
    const gateResult = await scopeGate.handle({
      engagementId,
      scope: scopeDef,
      command,
      agent,
      noiseLevel,
    });

    if (!gateResult.allowed) {
      this.db.logAction(engagementId, agent, 'blocked', `Command blocked: ${gateResult.reason}`, command);
      throw new Error(`Scope gate rejected: ${gateResult.reason}`);
    }

    // Create approval record
    const approval = this.db.createApproval(engagementId, command, agent, noiseLevel);
    this.db.logAction(engagementId, agent, 'queued', `Command queued for approval: ${command.slice(0, 100)}`);

    return { approval, gateResult };
  }

  async approveCommand(approvalId: number, approver: string): Promise<ExecutionResult> {
    this.db.resolveApproval(approvalId, 'approved', approver);

    // Get the approval details
    const approval = this.db.getDb().prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId) as Approval;
    if (!approval) throw new Error(`Approval not found: ${approvalId}`);

    this.db.getDb().prepare("UPDATE approvals SET status = 'executed', updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), approvalId);

    // Create task
    const task = this.db.createTask(approval.engagement_id, approval.agent, approval.command_text);
    this.db.getDb().prepare("UPDATE task_state SET status = 'running', started_at = datetime('now') WHERE id = ?")
      .run(task.id);

    // Execute
    const result = await this.executeCommand(task.id, approval.engagement_id, approval.agent, approval.command_text);

    // Update task status
    const status = result.success ? 'completed' : 'failed';
    this.db.updateTaskStatus(task.id, status, result.success ? 'Command completed' : `Exit code: ${result.exitCode}`);

    return result;
  }

  denyCommand(approvalId: number, approver: string, reason: string): void {
    this.db.resolveApproval(approvalId, 'denied', approver, reason);
    const approval = this.db.getDb().prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId) as Approval;
    if (approval) {
      this.db.logAction(approval.engagement_id, approval.agent, 'denied', `Command denied: ${reason}`);
    }
  }

  cancelExecution(taskId: number): void {
    const running = this.runningProcesses.get(taskId);
    if (running) {
      running.process.kill('SIGTERM');
      this.runningProcesses.delete(taskId);
      this.db.updateTaskStatus(taskId, 'failed', 'Cancelled by user');
    }
  }

  private executeCommand(taskId: number, engagementId: string, agent: string, command: string): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';

      const child = exec(command, { timeout: 300000, maxBuffer: 10 * 1024 * 1024 });

      this.runningProcesses.set(taskId, { taskId, process: child, stdout: '', stderr: '', startTime });

      child.stdout?.on('data', (data: string) => {
        stdout += data;
      });

      child.stderr?.on('data', (data: string) => {
        stderr += data;
      });

      child.on('close', async (code) => {
        const duration = Date.now() - startTime;
        this.runningProcesses.delete(taskId);

        // Run cmd-audit post-hook
        const auditResult = await cmdAudit.handle({
          engagementId,
          scope: { entries: [], raw: '' },
          command,
          agent,
          exitCode: code || 0,
          duration,
          stdout,
          stderr,
        });

        // Log the action
        this.db.logAction(engagementId, agent, 'executed',
          `Command exited with code ${code} in ${duration}ms`,
          command);

        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code || 0,
          duration,
          evidenceFile: auditResult.evidenceFile || '',
        });
      });

      child.on('error', (err) => {
        const duration = Date.now() - startTime;
        this.runningProcesses.delete(taskId);

        this.db.logAction(engagementId, agent, 'error', `Command error: ${err.message}`, command);
        this.db.updateTaskStatus(taskId, 'failed', err.message);

        resolve({
          success: false,
          stdout: '',
          stderr: err.message,
          exitCode: -1,
          duration,
          evidenceFile: '',
        });
      });
    });
  }

  getRunningProcesses(): { taskId: number; command: string; duration: number }[] {
    const now = Date.now();
    return Array.from(this.runningProcesses.values()).map((p) => ({
      taskId: p.taskId,
      command: '', // Would need to store command
      duration: now - p.startTime,
    }));
  }
}

export default ExecutionService;
