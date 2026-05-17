-- RedPen Findings Database Schema
-- Compatible with pentest-ai-agents findings structure + GUI extensions

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Engagement: represents a pentest engagement
CREATE TABLE IF NOT EXISTS engagements (
  id TEXT PRIMARY KEY,
  client TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'external' CHECK(type IN ('external','internal','web','cloud','wireless','red-team')),
  scope TEXT NOT NULL DEFAULT '',
  roe TEXT NOT NULL DEFAULT '',
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK(status IN ('planning','active','paused','completed','archived')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Host: discovered target hosts
CREATE TABLE IF NOT EXISTS hosts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id TEXT NOT NULL,
  ip TEXT NOT NULL DEFAULT '',
  hostname TEXT NOT NULL DEFAULT '',
  os TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'discovered' CHECK(status IN ('discovered','scanned','vulnerable','compromised','pivoted')),
  notes TEXT NOT NULL DEFAULT '',
  discovered_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hosts_engagement ON hosts(engagement_id);
CREATE INDEX IF NOT EXISTS idx_hosts_ip ON hosts(ip);

-- Service: discovered services on hosts
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host_id INTEGER NOT NULL,
  port INTEGER NOT NULL DEFAULT 0,
  protocol TEXT NOT NULL DEFAULT 'tcp',
  service TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL DEFAULT '',
  banner TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT 'open' CHECK(state IN ('open','closed','filtered')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (host_id) REFERENCES hosts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_services_host ON services(host_id);

-- Vuln: discovered vulnerabilities
CREATE TABLE IF NOT EXISTS vulns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host_id INTEGER,
  service_id INTEGER,
  engagement_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'info' CHECK(severity IN ('critical','high','medium','low','info')),
  cvss REAL NOT NULL DEFAULT 0,
  cve TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  evidence_file TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'unconfirmed' CHECK(status IN ('unconfirmed','confirmed','exploited','mitigated','fixed','accepted')),
  poc_output TEXT NOT NULL DEFAULT '',
  mitre_id TEXT NOT NULL DEFAULT '',
  tool_used TEXT NOT NULL DEFAULT '',
  found_by TEXT NOT NULL DEFAULT '',
  confirmed_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (host_id) REFERENCES hosts(id) ON DELETE SET NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vulns_engagement ON vulns(engagement_id);
CREATE INDEX IF NOT EXISTS idx_vulns_severity ON vulns(severity);
CREATE INDEX IF NOT EXISTS idx_vulns_status ON vulns(status);

-- Credential: discovered credentials
CREATE TABLE IF NOT EXISTS credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id TEXT NOT NULL,
  host_id INTEGER,
  username TEXT NOT NULL DEFAULT '',
  secret TEXT NOT NULL DEFAULT '',
  secret_type TEXT NOT NULL DEFAULT 'password' CHECK(secret_type IN ('password','hash','token','key','certificate')),
  domain TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  access_level TEXT NOT NULL DEFAULT 'user' CHECK(access_level IN ('user','admin','system','domain-admin')),
  valid INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE,
  FOREIGN KEY (host_id) REFERENCES hosts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_creds_engagement ON credentials(engagement_id);

-- Chain: attack chains linking multiple findings
CREATE TABLE IF NOT EXISTS chains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  score REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'partial' CHECK(status IN ('partial','complete','validated')),
  steps TEXT NOT NULL DEFAULT '[]',
  mitre_ids TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chains_engagement ON chains(engagement_id);

-- Session Log: audit trail of all actions
CREATE TABLE IF NOT EXISTS session_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id TEXT NOT NULL,
  agent TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_log_engagement ON session_log(engagement_id);
CREATE INDEX IF NOT EXISTS idx_session_log_agent ON session_log(agent);

-- Approvals: command approval queue (GUI extension)
CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id TEXT NOT NULL,
  command_text TEXT NOT NULL DEFAULT '',
  agent TEXT NOT NULL DEFAULT '',
  noise_level TEXT NOT NULL DEFAULT 'QUIET' CHECK(noise_level IN ('QUIET','MODERATE','LOUD')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','denied','executed')),
  requested_by TEXT NOT NULL DEFAULT '',
  approved_by TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_approvals_engagement ON approvals(engagement_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);

-- Task State: tracks execution tasks (GUI extension)
CREATE TABLE IF NOT EXISTS task_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id TEXT NOT NULL,
  agent TEXT NOT NULL DEFAULT '',
  task_description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','completed','failed')),
  started_at TEXT,
  completed_at TEXT,
  result_summary TEXT NOT NULL DEFAULT '',
  evidence_files TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_state_engagement ON task_state(engagement_id);

-- Config Versions: tracks configuration changes (GUI extension)
CREATE TABLE IF NOT EXISTS config_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id TEXT NOT NULL,
  config_key TEXT NOT NULL DEFAULT '',
  config_value TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_config_engagement ON config_versions(engagement_id);
