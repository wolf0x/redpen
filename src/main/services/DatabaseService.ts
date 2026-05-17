import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import type {
  Engagement, Host, Service, Vuln, Credential, Chain,
  SessionLog, Approval, TaskState, ConfigVersion, EngagementStats,
} from '../../shared/types';

class DatabaseService {
  private static instance: DatabaseService;
  private db: Database.Database | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  init(dbPath: string): void {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    const schemaPath = path.resolve(__dirname, '..', '..', '..', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      this.db.exec(schema);
    }
  }

  private getDb(): Database.Database {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  // --- Engagement CRUD ---
  createEngagement(data: Partial<Engagement>): Engagement {
    const db = this.getDb();
    const id = data.id || `eng-${Date.now()}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO engagements (id, client, type, scope, roe, start_date, end_date, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.client || '', data.type || 'external', data.scope || '', data.roe || '',
      data.start_date || null, data.end_date || null, data.status || 'planning', data.notes || '', now, now);
    return this.getEngagement(id);
  }

  getEngagement(id: string): Engagement {
    const row = this.getDb().prepare('SELECT * FROM engagements WHERE id = ?').get(id);
    if (!row) throw new Error(`Engagement not found: ${id}`);
    return row as Engagement;
  }

  listEngagements(): Engagement[] {
    return this.getDb().prepare('SELECT * FROM engagements ORDER BY created_at DESC').all() as Engagement[];
  }

  updateEngagement(id: string, data: Partial<Engagement>): void {
    const now = new Date().toISOString();
    const fields = Object.keys(data).filter((k) => k !== 'id' && k !== 'created_at');
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => (data as Record<string, unknown>)[f]);
    this.getDb().prepare(`UPDATE engagements SET ${setClause}, updated_at = ? WHERE id = ?`).run(...values, now, id);
  }

  // --- Host CRUD ---
  addHost(engagementId: string, data: Partial<Host>): Host {
    const db = this.getDb();
    const now = new Date().toISOString();
    const info = db.prepare(`
      INSERT INTO hosts (engagement_id, ip, hostname, os, role, status, notes, discovered_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(engagementId, data.ip || '', data.hostname || '', data.os || '', data.role || '',
      data.status || 'discovered', data.notes || '', data.discovered_by || '', now, now);
    return db.prepare('SELECT * FROM hosts WHERE id = ?').get(info.lastInsertRowid) as Host;
  }

  listHosts(engagementId: string, filters?: { status?: string }): Host[] {
    let query = 'SELECT * FROM hosts WHERE engagement_id = ?';
    const params: unknown[] = [engagementId];
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    return this.getDb().prepare(query).all(...params) as Host[];
  }

  // --- Service CRUD ---
  addService(hostId: number, data: Partial<Service>): Service {
    const db = this.getDb();
    const now = new Date().toISOString();
    const info = db.prepare(`
      INSERT INTO services (host_id, port, protocol, service, version, banner, state, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(hostId, data.port || 0, data.protocol || 'tcp', data.service || '',
      data.version || '', data.banner || '', data.state || 'open', now, now);
    return db.prepare('SELECT * FROM services WHERE id = ?').get(info.lastInsertRowid) as Service;
  }

  listServices(hostId: number): Service[] {
    return this.getDb().prepare('SELECT * FROM services WHERE host_id = ?').all(hostId) as Service[];
  }

  // --- Vuln CRUD ---
  addVuln(engagementId: string, data: Partial<Vuln>): Vuln {
    const db = this.getDb();
    const now = new Date().toISOString();
    const info = db.prepare(`
      INSERT INTO vulns (host_id, service_id, engagement_id, title, severity, cvss, cve, description,
        evidence_file, status, poc_output, mitre_id, tool_used, found_by, confirmed_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.host_id || null, data.service_id || null, engagementId, data.title || '',
      data.severity || 'info', data.cvss || 0, data.cve || '', data.description || '',
      data.evidence_file || '', data.status || 'unconfirmed', data.poc_output || '',
      data.mitre_id || '', data.tool_used || '', data.found_by || '', data.confirmed_by || '', now, now);
    return db.prepare('SELECT * FROM vulns WHERE id = ?').get(info.lastInsertRowid) as Vuln;
  }

  listVulns(engagementId: string, filters?: { severity?: string; status?: string }): Vuln[] {
    let query = 'SELECT * FROM vulns WHERE engagement_id = ?';
    const params: unknown[] = [engagementId];
    if (filters?.severity) { query += ' AND severity = ?'; params.push(filters.severity); }
    if (filters?.status) { query += ' AND status = ?'; params.push(filters.status); }
    return this.getDb().prepare(query).all(...params) as Vuln[];
  }

  // --- Credential CRUD ---
  addCredential(engagementId: string, data: Partial<Credential>): Credential {
    const db = this.getDb();
    const now = new Date().toISOString();
    const info = db.prepare(`
      INSERT INTO credentials (engagement_id, host_id, username, secret, secret_type, domain, source, access_level, valid, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(engagementId, data.host_id || null, data.username || '', data.secret || '',
      data.secret_type || 'password', data.domain || '', data.source || '',
      data.access_level || 'user', data.valid !== false ? 1 : 0, now, now);
    return db.prepare('SELECT * FROM credentials WHERE id = ?').get(info.lastInsertRowid) as Credential;
  }

  listCredentials(engagementId: string): Credential[] {
    return this.getDb().prepare('SELECT * FROM credentials WHERE engagement_id = ?').all(engagementId) as Credential[];
  }

  // --- Chain CRUD ---
  addChain(engagementId: string, data: Partial<Chain>): Chain {
    const db = this.getDb();
    const now = new Date().toISOString();
    const info = db.prepare(`
      INSERT INTO chains (engagement_id, name, score, status, steps, mitre_ids, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(engagementId, data.name || '', data.score || 0, data.status || 'partial',
      data.steps || '[]', data.mitre_ids || '', now, now);
    return db.prepare('SELECT * FROM chains WHERE id = ?').get(info.lastInsertRowid) as Chain;
  }

  listChains(engagementId: string): Chain[] {
    return this.getDb().prepare('SELECT * FROM chains WHERE engagement_id = ?').all(engagementId) as Chain[];
  }

  // --- Session Log ---
  logAction(engagementId: string, agent: string, action: string, summary: string, detail?: string): void {
    this.getDb().prepare(`
      INSERT INTO session_log (engagement_id, agent, action, summary, detail) VALUES (?, ?, ?, ?, ?)
    `).run(engagementId, agent, action, summary, detail || '');
  }

  getSessionLog(engagementId: string, limit = 100): SessionLog[] {
    return this.getDb().prepare('SELECT * FROM session_log WHERE engagement_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(engagementId, limit) as SessionLog[];
  }

  // --- Approvals ---
  createApproval(engagementId: string, command: string, agent: string, noiseLevel: string): Approval {
    const db = this.getDb();
    const now = new Date().toISOString();
    const info = db.prepare(`
      INSERT INTO approvals (engagement_id, command_text, agent, noise_level, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `).run(engagementId, command, agent, noiseLevel, now, now);
    return db.prepare('SELECT * FROM approvals WHERE id = ?').get(info.lastInsertRowid) as Approval;
  }

  resolveApproval(id: number, status: 'approved' | 'denied', approver: string, reason?: string): void {
    const now = new Date().toISOString();
    this.getDb().prepare('UPDATE approvals SET status = ?, approved_by = ?, reason = ?, updated_at = ? WHERE id = ?')
      .run(status, approver, reason || '', now, id);
  }

  listApprovals(engagementId: string, status?: string): Approval[] {
    let query = 'SELECT * FROM approvals WHERE engagement_id = ?';
    const params: unknown[] = [engagementId];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC';
    return this.getDb().prepare(query).all(...params) as Approval[];
  }

  // --- Task State ---
  createTask(engagementId: string, agent: string, description: string): TaskState {
    const db = this.getDb();
    const info = db.prepare(`
      INSERT INTO task_state (engagement_id, agent, task_description, status, started_at)
      VALUES (?, ?, ?, 'queued', datetime('now'))
    `).run(engagementId, agent, description);
    return db.prepare('SELECT * FROM task_state WHERE id = ?').get(info.lastInsertRowid) as TaskState;
  }

  updateTaskStatus(id: number, status: string, resultSummary?: string): void {
    const completedAt = status === 'completed' || status === 'failed' ? new Date().toISOString() : null;
    this.getDb().prepare('UPDATE task_state SET status = ?, result_summary = ?, completed_at = ? WHERE id = ?')
      .run(status, resultSummary || '', completedAt, id);
  }

  // --- Stats ---
  getEngagementStats(engagementId: string): EngagementStats {
    const db = this.getDb();
    const hostCount = (db.prepare('SELECT COUNT(*) as c FROM hosts WHERE engagement_id = ?').get(engagementId) as { c: number }).c;
    const serviceCount = (db.prepare('SELECT COUNT(*) as c FROM services WHERE host_id IN (SELECT id FROM hosts WHERE engagement_id = ?)').get(engagementId) as { c: number }).c;
    const credCount = (db.prepare('SELECT COUNT(*) as c FROM credentials WHERE engagement_id = ?').get(engagementId) as { c: number }).c;
    const chainCount = (db.prepare('SELECT COUNT(*) as c FROM chains WHERE engagement_id = ?').get(engagementId) as { c: number }).c;

    const vulnCounts = db.prepare(`
      SELECT severity, COUNT(*) as c FROM vulns WHERE engagement_id = ? GROUP BY severity
    `).all(engagementId) as { severity: string; c: number }[];

    const vuln_count = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const row of vulnCounts) {
      if (row.severity in vuln_count) (vuln_count as Record<string, number>)[row.severity] = row.c;
    }

    const totalVulns = Object.values(vuln_count).reduce((a, b) => a + b, 0);
    const confirmed = (db.prepare("SELECT COUNT(*) as c FROM vulns WHERE engagement_id = ? AND status IN ('confirmed','exploited')").get(engagementId) as { c: number }).c;
    const confirmationRate = totalVulns > 0 ? Math.round((confirmed / totalVulns) * 100) : 0;

    const completedChains = (db.prepare("SELECT COUNT(*) as c FROM chains WHERE engagement_id = ? AND status = 'complete'").get(engagementId) as { c: number }).c;
    const chainCompletion = chainCount > 0 ? Math.round((completedChains / chainCount) * 100) : 0;

    return { host_count: hostCount, service_count: serviceCount, vuln_count, credential_count: credCount, chain_count: chainCount, chain_completion: chainCompletion, confirmation_rate: confirmationRate };
  }

  // --- Export ---
  exportEngagement(engagementId: string): object {
    const engagement = this.getEngagement(engagementId);
    const hosts = this.listHosts(engagementId);
    const vulns = this.listVulns(engagementId);
    const credentials = this.listCredentials(engagementId);
    const chains = this.listChains(engagementId);
    const sessionLog = this.getSessionLog(engagementId, 1000);
    return { engagement, hosts, vulns, credentials, chains, session_log: sessionLog, exported_at: new Date().toISOString() };
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export default DatabaseService;
