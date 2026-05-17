import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

const TEST_DB = path.resolve(__dirname, '..', '..', 'data', 'test-redpen.db');
const SCHEMA_PATH = path.resolve(__dirname, '..', '..', 'db', 'schema.sql');

describe('Database Writes', () => {
  let db: Database.Database;

  beforeAll(() => {
    const dir = path.dirname(TEST_DB);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

    db = new Database(TEST_DB);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
  });

  afterAll(() => {
    db.close();
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  it('should create an engagement', () => {
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO engagements (id, client, type, scope, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run('test-eng-1', 'Test Client', 'external', '192.168.1.0/24', 'active', now, now);

    const eng = db.prepare('SELECT * FROM engagements WHERE id = ?').get('test-eng-1') as any;
    expect(eng).toBeDefined();
    expect(eng.client).toBe('Test Client');
    expect(eng.type).toBe('external');
    expect(eng.scope).toBe('192.168.1.0/24');
  });

  it('should add a host', () => {
    const now = new Date().toISOString();
    const info = db.prepare(`INSERT INTO hosts (engagement_id, ip, hostname, os, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run('test-eng-1', '192.168.1.10', 'target.local', 'Linux', 'discovered', now, now);

    const host = db.prepare('SELECT * FROM hosts WHERE id = ?').get(info.lastInsertRowid) as any;
    expect(host).toBeDefined();
    expect(host.ip).toBe('192.168.1.10');
  });

  it('should add a vuln', () => {
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO hosts (engagement_id, ip, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
      .run('test-eng-1', '192.168.1.20', 'discovered', now, now);
    const hostId = (db.prepare('SELECT MAX(id) as id FROM hosts').get() as any).id;

    const info = db.prepare(`INSERT INTO vulns (host_id, engagement_id, title, severity, cvss, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(hostId, 'test-eng-1', 'SQL Injection', 'high', 8.5, 'unconfirmed', now, now);

    const vuln = db.prepare('SELECT * FROM vulns WHERE id = ?').get(info.lastInsertRowid) as any;
    expect(vuln).toBeDefined();
    expect(vuln.title).toBe('SQL Injection');
    expect(vuln.severity).toBe('high');
  });

  it('should add a credential', () => {
    const now = new Date().toISOString();
    const info = db.prepare(`INSERT INTO credentials (engagement_id, username, secret, secret_type, domain, access_level, valid, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run('test-eng-1', 'admin', 'password123', 'password', 'test.local', 'admin', 1, now, now);

    const cred = db.prepare('SELECT * FROM credentials WHERE id = ?').get(info.lastInsertRowid) as any;
    expect(cred).toBeDefined();
    expect(cred.username).toBe('admin');
  });

  it('should add an approval', () => {
    const now = new Date().toISOString();
    const info = db.prepare(`INSERT INTO approvals (engagement_id, command_text, agent, noise_level, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run('test-eng-1', 'nmap -sV 192.168.1.10', 'recon-advisor', 'MODERATE', 'pending', now, now);

    const approval = db.prepare('SELECT * FROM approvals WHERE id = ?').get(info.lastInsertRowid) as any;
    expect(approval).toBeDefined();
    expect(approval.status).toBe('pending');
    expect(approval.noise_level).toBe('MODERATE');
  });

  it('should log a session action', () => {
    db.prepare(`INSERT INTO session_log (engagement_id, agent, action, summary) VALUES (?, ?, ?, ?)`)
      .run('test-eng-1', 'recon-advisor', 'executed', 'Nmap scan completed');

    const logs = db.prepare('SELECT * FROM session_log WHERE engagement_id = ?').all('test-eng-1') as any[];
    expect(logs.length).toBeGreaterThan(0);
  });
});
