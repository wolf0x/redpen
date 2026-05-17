import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const OPENCODE_DIR = path.join(PROJECT_ROOT, '.opencode');

describe('Converter Output', () => {
  beforeAll(() => {
    // Run the converter
    execSync('npx tsx scripts/converter-cli.ts', { cwd: PROJECT_ROOT, stdio: 'pipe' });
  });

  it('should create .opencode directory', () => {
    expect(fs.existsSync(OPENCODE_DIR)).toBe(true);
  });

  it('should create agents directory with converted files', () => {
    const agentsDir = path.join(OPENCODE_DIR, 'agents');
    expect(fs.existsSync(agentsDir)).toBe(true);

    const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
    expect(files.length).toBe(35); // 36 total minus _scope-guard
  });

  it('should create commands directory with converted files', () => {
    const commandsDir = path.join(OPENCODE_DIR, 'commands');
    expect(fs.existsSync(commandsDir)).toBe(true);

    const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.md'));
    expect(files.length).toBe(3);
  });

  it('should generate migration-report.json', () => {
    const reportPath = path.join(OPENCODE_DIR, 'migration-report.json');
    expect(fs.existsSync(reportPath)).toBe(true);

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    expect(report.converted.length).toBeGreaterThan(0);
    expect(report.timestamp).toBeTruthy();
  });

  it('should skip _scope-guard.md', () => {
    const reportPath = path.join(OPENCODE_DIR, 'migration-report.json');
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    expect(report.skipped.some((s: any) => s.file === '_scope-guard.md')).toBe(true);
  });

  it('should generate opencode.json', () => {
    const configPath = path.join(PROJECT_ROOT, 'opencode.json');
    expect(fs.existsSync(configPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config.plugins).toBeDefined();
    expect(config.commands).toBeDefined();
  });
});
