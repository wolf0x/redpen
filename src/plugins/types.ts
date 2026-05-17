export type PluginEvent = 'tool.execute.before' | 'tool.execute.after' | 'session.idle';

export interface PluginContext {
  engagementId: string;
  scope: { entries: Array<{ type: string; value: string; valid: boolean }>; raw: string };
  command: string;
  agent: string;
  noiseLevel?: string;
  exitCode?: number;
  duration?: number;
  stdout?: string;
  stderr?: string;
}

export interface PluginResult {
  allowed: boolean;
  reason?: string;
  evidenceFile?: string;
}

export interface PluginHook {
  name: string;
  event: PluginEvent;
  handle: (context: PluginContext) => Promise<PluginResult>;
}
