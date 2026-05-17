import * as fs from 'fs';
import * as path from 'path';
import type { PluginHook, PluginContext, PluginResult } from './types';

function generateEvidenceFileName(tool: string, target: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const safeTool = tool.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const safeTarget = target.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 50);
  return `${safeTool}_${safeTarget}_${timestamp}.log`;
}

function extractToolName(command: string): string {
  const parts = command.trim().split(/\s+/);
  return parts[0] || 'unknown';
}

function extractPrimaryTarget(command: string): string {
  const ipRegex = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/;
  const domainRegex = /\b([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b/;
  const ipMatch = command.match(ipRegex);
  if (ipMatch) return ipMatch[1];
  const domainMatch = command.match(domainRegex);
  if (domainMatch) return domainMatch[1];
  return 'local';
}

const cmdAudit: PluginHook = {
  name: 'cmd-audit',
  event: 'tool.execute.after',
  async handle(context: PluginContext): Promise<PluginResult> {
    const { command, agent, engagementId, exitCode, duration, stdout, stderr } = context;

    const tool = extractToolName(command);
    const target = extractPrimaryTarget(command);
    const evidenceFile = generateEvidenceFileName(tool, target);

    // Write evidence file
    const evidenceDir = path.resolve(process.cwd(), 'data', 'evidence', engagementId);
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
    }

    const evidencePath = path.join(evidenceDir, evidenceFile);
    const logContent = [
      `# Command Audit Log`,
      `Agent: ${agent}`,
      `Command: ${command}`,
      `Exit Code: ${exitCode ?? 'N/A'}`,
      `Duration: ${duration ?? 'N/A'}ms`,
      `Timestamp: ${new Date().toISOString()}`,
      ``,
      `## STDOUT`,
      stdout || '(empty)',
      ``,
      `## STDERR`,
      stderr || '(empty)',
    ].join('\n');

    fs.writeFileSync(evidencePath, logContent);

    return { allowed: true, evidenceFile: evidencePath };
  },
};

export default cmdAudit;
