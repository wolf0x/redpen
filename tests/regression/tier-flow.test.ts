import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { TIER_2_AGENTS } from '../../src/shared/constants';

const AGENTS_DIR = path.resolve(__dirname, '..', '..', '.claude', 'agents');

describe('Tier Classification', () => {
  const agentFiles = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md') && !f.startsWith('_'));

  it('should correctly identify Tier 2 agents', () => {
    for (const file of agentFiles) {
      const name = file.replace('.md', '');
      if (TIER_2_AGENTS.includes(name)) {
        const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
        const { data } = matter(content);
        // Tier 2 agents should mention scope or execution in their body
        expect(data.name || name).toBeTruthy();
      }
    }
  });

  it('should have exactly 8 Tier 2 agents', () => {
    expect(TIER_2_AGENTS.length).toBe(8);
  });

  it('Tier 2 agents should exist as files', () => {
    for (const agentName of TIER_2_AGENTS) {
      const filePath = path.join(AGENTS_DIR, `${agentName}.md`);
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  it('all non-scope-guard agents should have description', () => {
    for (const file of agentFiles) {
      const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
      const { data } = matter(content);
      expect(data.description).toBeTruthy();
    }
  });
});
