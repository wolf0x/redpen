import { ipcMain } from 'electron';
import DatabaseService from './services/DatabaseService';
import AgentService from './services/AgentService';
import ScopeService from './services/ScopeService';
import ExecutionService from './services/ExecutionService';
import FindingsService from './services/FindingsService';
import ReportService from './services/ReportService';

const db = DatabaseService.getInstance();
const agentService = new AgentService();
const scopeService = new ScopeService();
const executionService = new ExecutionService();
const findingsService = new FindingsService();
const reportService = new ReportService();

// Initialize database
ipcMain.handle('db:init', async (_event, dbPath: string) => {
  db.init(dbPath);
  return { status: 'ok' };
});

// Ping
ipcMain.handle('ping', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// --- Engagement ---
ipcMain.handle('engagement:create', async (_event, data) => db.createEngagement(data));
ipcMain.handle('engagement:get', async (_event, id: string) => db.getEngagement(id));
ipcMain.handle('engagement:list', async () => db.listEngagements());
ipcMain.handle('engagement:update', async (_event, id: string, data) => { db.updateEngagement(id, data); return { status: 'ok' }; });
ipcMain.handle('engagement:stats', async (_event, id: string) => db.getEngagementStats(id));
ipcMain.handle('engagement:export', async (_event, id: string) => db.exportEngagement(id));

// --- Agents ---
ipcMain.handle('agents:load', async () => agentService.loadAgents());
ipcMain.handle('agents:get', async (_event, name: string) => agentService.getAgent(name));
ipcMain.handle('agents:getContent', async (_event, name: string) => agentService.getAgentContent(name));
ipcMain.handle('agents:updatePrompt', async (_event, name: string, body: string) => agentService.updateAgentPrompt(name, body));
ipcMain.handle('agents:getVersions', async (_event, name: string) => agentService.getAgentVersions(name));
ipcMain.handle('agents:byDomain', async (_event, domain: string) => agentService.getAgentsByDomain(domain));
ipcMain.handle('agents:domains', async () => agentService.getDomains());

// --- Scope ---
ipcMain.handle('scope:parse', async (_event, scopeText: string) => scopeService.parseScope(scopeText));
ipcMain.handle('scope:validate', async (_event, engagementId: string, target: string) => {
  const eng = db.getEngagement(engagementId);
  return scopeService.validateScopeForEngagement(eng, target);
});
ipcMain.handle('scope:checkConflict', async (_event, newScope: string) => {
  const engagements = db.listEngagements();
  return scopeService.checkConflict(newScope, engagements);
});

// --- Execution ---
ipcMain.handle('execution:queue', async (_event, engagementId: string, agent: string, command: string, noiseLevel: string) => {
  return executionService.queueCommand(engagementId, agent, command, noiseLevel as any);
});
ipcMain.handle('execution:approve', async (_event, approvalId: number, approver: string) => {
  return executionService.approveCommand(approvalId, approver);
});
ipcMain.handle('execution:deny', async (_event, approvalId: number, approver: string, reason: string) => {
  executionService.denyCommand(approvalId, approver, reason);
  return { status: 'ok' };
});
ipcMain.handle('execution:cancel', async (_event, taskId: number) => {
  executionService.cancelExecution(taskId);
  return { status: 'ok' };
});
ipcMain.handle('execution:listApprovals', async (_event, engagementId: string, status?: string) => {
  return db.listApprovals(engagementId, status);
});

// --- Findings ---
ipcMain.handle('findings:hosts', async (_event, engagementId: string, filters?: any) => findingsService.listHosts(engagementId, filters));
ipcMain.handle('findings:addHost', async (_event, engagementId: string, data: any) => db.addHost(engagementId, data));
ipcMain.handle('findings:services', async (_event, hostId: number) => findingsService.listServices(hostId));
ipcMain.handle('findings:addService', async (_event, hostId: number, data: any) => db.addService(hostId, data));
ipcMain.handle('findings:vulns', async (_event, engagementId: string, filters?: any) => findingsService.listVulns(engagementId, filters));
ipcMain.handle('findings:addVuln', async (_event, engagementId: string, data: any) => db.addVuln(engagementId, data));
ipcMain.handle('findings:creds', async (_event, engagementId: string) => findingsService.listCredentials(engagementId));
ipcMain.handle('findings:addCred', async (_event, engagementId: string, data: any) => db.addCredential(engagementId, data));
ipcMain.handle('findings:chains', async (_event, engagementId: string) => findingsService.listChains(engagementId));
ipcMain.handle('findings:addChain', async (_event, engagementId: string, data: any) => db.addChain(engagementId, data));
ipcMain.handle('findings:bulkUpdateVulns', async (_event, engagementId: string, ids: number[], status: string) => {
  findingsService.bulkUpdateVulnStatus(engagementId, ids, status);
  return { status: 'ok' };
});
ipcMain.handle('findings:search', async (_event, engagementId: string, query: string) => findingsService.searchVulns(engagementId, query));

// --- Session Log ---
ipcMain.handle('session:log', async (_event, engagementId: string, agent: string, action: string, summary: string, detail?: string) => {
  db.logAction(engagementId, agent, action, summary, detail);
  return { status: 'ok' };
});
ipcMain.handle('session:getLog', async (_event, engagementId: string, limit?: number) => db.getSessionLog(engagementId, limit));

// --- Reports ---
ipcMain.handle('reports:generate', async (_event, engagementId: string, type: string) => {
  return reportService.generateReport(engagementId, type as any);
});
ipcMain.handle('reports:exportMarkdown', async (_event, data: any, type: string) => {
  return reportService.exportMarkdown(data, type as any);
});
ipcMain.handle('reports:exportJSON', async (_event, data: any) => reportService.exportJSON(data));
ipcMain.handle('reports:save', async (_event, engagementId: string, content: string, type: string) => {
  return reportService.saveReport(engagementId, content, type as any);
});
