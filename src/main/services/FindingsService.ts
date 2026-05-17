import DatabaseService from './DatabaseService';
import type { Host, Service, Vuln, Credential, Chain, EngagementStats } from '../../shared/types';

class FindingsService {
  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  // --- Hosts ---
  listHosts(engagementId: string, filters?: { status?: string }): Host[] {
    return this.db.listHosts(engagementId, filters);
  }

  bulkUpdateHostStatus(engagementId: string, ids: number[], status: string): void {
    const db = this.db.getDb();
    const stmt = db.prepare('UPDATE hosts SET status = ?, updated_at = ? WHERE id = ? AND engagement_id = ?');
    const now = new Date().toISOString();
    const update = db.transaction((hostIds: number[]) => {
      for (const id of hostIds) stmt.run(status, now, id, engagementId);
    });
    update(ids);
  }

  // --- Services ---
  listServices(hostId: number): Service[] {
    return this.db.listServices(hostId);
  }

  // --- Vulns ---
  listVulns(engagementId: string, filters?: { severity?: string; status?: string }): Vuln[] {
    return this.db.listVulns(engagementId, filters);
  }

  bulkUpdateVulnStatus(engagementId: string, ids: number[], status: string): void {
    const db = this.db.getDb();
    const stmt = db.prepare('UPDATE vulns SET status = ?, updated_at = ? WHERE id = ? AND engagement_id = ?');
    const now = new Date().toISOString();
    const update = db.transaction((vulnIds: number[]) => {
      for (const id of vulnIds) stmt.run(status, now, id, engagementId);
    });
    update(ids);
  }

  // --- Credentials ---
  listCredentials(engagementId: string): Credential[] {
    return this.db.listCredentials(engagementId);
  }

  // --- Chains ---
  listChains(engagementId: string): Chain[] {
    return this.db.listChains(engagementId);
  }

  // --- Stats ---
  getStats(engagementId: string): EngagementStats {
    return this.db.getEngagementStats(engagementId);
  }

  // --- Export ---
  exportEngagement(engagementId: string): object {
    return this.db.exportEngagement(engagementId);
  }

  // --- Search ---
  searchVulns(engagementId: string, query: string): Vuln[] {
    const db = this.db.getDb();
    return db.prepare(
      "SELECT * FROM vulns WHERE engagement_id = ? AND (title LIKE ? OR cve LIKE ? OR description LIKE ?) ORDER BY severity DESC"
    ).all(engagementId, `%${query}%`, `%${query}%`, `%${query}%`) as Vuln[];
  }
}

export default FindingsService;
