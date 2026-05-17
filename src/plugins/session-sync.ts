import * as fs from 'fs';
import * as path from 'path';
import type { PluginHook, PluginContext, PluginResult } from './types';

const sessionSync: PluginHook = {
  name: 'session-sync',
  event: 'session.idle',
  async handle(context: PluginContext): Promise<PluginResult> {
    const { engagementId } = context;

    // Generate handoff draft
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const handoffDir = path.resolve(process.cwd(), 'data', 'handoffs', engagementId);
    if (!fs.existsSync(handoffDir)) {
      fs.mkdirSync(handoffDir, { recursive: true });
    }

    const handoffPath = path.join(handoffDir, `handoff_${timestamp}.md`);
    const handoffContent = [
      `# Session Handoff Report`,
      `Generated: ${new Date().toISOString()}`,
      `Engagement: ${engagementId}`,
      ``,
      `## Session Summary`,
      `Session completed at ${new Date().toISOString()}`,
      ``,
      `## Pending Actions`,
      `- Review findings from this session`,
      `- Validate any unconfirmed vulnerabilities`,
      `- Continue with next pentest phase`,
      ``,
      `## Evidence`,
      `Evidence files saved to: data/evidence/${engagementId}/`,
    ].join('\n');

    fs.writeFileSync(handoffPath, handoffContent);

    return { allowed: true };
  },
};

export default sessionSync;
