import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const AGENTS_DIR = path.resolve(__dirname, '..', '..', '.claude', 'agents');

describe('Agent Loading', () => {
  const agentFiles = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md') && !f.startsWith('_'));

  it('should have 35 agent files (excluding _scope-guard)', () => {
    expect(agentFiles.length).toBe(35);
  });

  it.each(agentFiles)('agent %s should have valid YAML frontmatter', (file) => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
    const { data, content: body } = matter(content);

    expect(data).toBeDefined();
    expect(data.name || file.replace('.md', '')).toBeTruthy();
    expect(data.description).toBeTruthy();
    expect(body.trim().length).toBeGreaterThan(100);
  });

  it('should have _scope-guard.md', () => {
    const guardPath = path.join(AGENTS_DIR, '_scope-guard.md');
    expect(fs.existsSync(guardPath)).toBe(true);

    const content = fs.readFileSync(guardPath, 'utf-8');
    const { data } = matter(content);
    expect(data.name).toBe('_scope-guard');
  });
});

describe('Command Loading', () => {
  const COMMANDS_DIR = path.resolve(__dirname, '..', '..', '.claude', 'commands');

  it('should have 3 command files', () => {
    const files = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.md'));
    expect(files.length).toBe(3);
  });

  it('should have agents-for, recommend, and memory commands', () => {
    const files = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.md'));
    const names = files.map((f) => f.replace('.md', ''));
    expect(names).toContain('agents-for');
    expect(names).toContain('recommend');
    expect(names).toContain('memory');
  });

  it.each(['agents-for.md', 'recommend.md', 'memory.md'])('command %s should have valid frontmatter', (file) => {
    const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
    const { data, content: body } = matter(content);
    expect(data.name).toBeTruthy();
    expect(data.description).toBeTruthy();
    expect(body.trim().length).toBeGreaterThan(50);
  });
});
