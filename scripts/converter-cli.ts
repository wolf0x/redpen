import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

interface ConversionEntry {
  source: string;
  target: string;
  status: 'ok' | 'warning' | 'error';
}

interface WarningEntry {
  file: string;
  field: string;
  reason: string;
}

interface SkippedEntry {
  file: string;
  reason: string;
}

interface MigrationReport {
  converted: ConversionEntry[];
  warnings: WarningEntry[];
  skipped: SkippedEntry[];
  timestamp: string;
}

interface Args {
  source: string;
  dest: string;
  dryRun: boolean;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Args = { source: '.claude', dest: '.opencode', dryRun: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && args[i + 1]) result.source = args[++i];
    if (args[i] === '--dest' && args[i + 1]) result.dest = args[++i];
    if (args[i] === '--dry-run') result.dryRun = true;
  }
  return result;
}

function convertFrontmatter(data: Record<string, unknown>, fileName: string): { frontmatter: Record<string, unknown>; warnings: WarningEntry[] } {
  const warnings: WarningEntry[] = [];
  const frontmatter: Record<string, unknown> = {};

  // Map description
  if (data.description) {
    frontmatter.description = data.description;
  } else {
    warnings.push({ file: fileName, field: 'description', reason: 'Missing description field' });
  }

  // Map name to agent
  if (data.name) {
    frontmatter.agent = data.name;
  }

  // Map model
  if (data.model) {
    frontmatter.model = data.model;
  } else {
    warnings.push({ file: fileName, field: 'model', reason: 'Missing model field, using default' });
    frontmatter.model = 'claude-sonnet-4-5-20250514';
  }

  // Tools - no direct OpenCode equivalent
  if (data.tools) {
    warnings.push({ file: fileName, field: 'tools', reason: 'Tools field has no direct OpenCode equivalent, preserved as metadata' });
    frontmatter.tools = data.tools;
  }

  // Add subtask hint
  frontmatter.subtask = true;

  return { frontmatter, warnings };
}

function formatFrontmatter(data: Record<string, unknown>): string {
  const lines: string[] = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: ${value.join(', ')}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function convertFile(
  sourcePath: string,
  destPath: string,
  report: MigrationReport,
  dryRun: boolean
): void {
  const fileName = path.basename(sourcePath);
  const content = fs.readFileSync(sourcePath, 'utf-8');
  const { data, content: body } = matter(content);

  // Skip _scope-guard.md
  if (fileName === '_scope-guard.md') {
    report.skipped.push({ file: fileName, reason: 'System guard, handled by plugins' });
    return;
  }

  const { frontmatter, warnings } = convertFrontmatter(data, fileName);
  report.warnings.push(...warnings);

  const output = `${formatFrontmatter(frontmatter)}\n\n${body}`;

  if (!dryRun) {
    const destDir = path.dirname(destPath);
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(destPath, output);
  }

  report.converted.push({ source: sourcePath, target: destPath, status: warnings.length > 0 ? 'warning' : 'ok' });
}

function generateOpencodeJson(destDir: string, dryRun: boolean): void {
  const config = {
    plugins: [
      './plugins/scope-gate.ts',
      './plugins/cmd-audit.ts',
      './plugins/session-sync.ts',
    ],
    commands: './commands',
    agents: './agents',
    instructions: '../AGENTS.md',
    settings: {
      bashApproval: 'gate',
      skillPermissions: 'auto',
    },
  };

  if (!dryRun) {
    fs.writeFileSync(path.join(destDir, 'opencode.json'), JSON.stringify(config, null, 2));
  }
}

function main(): void {
  const { source, dest, dryRun } = parseArgs();
  const projectRoot = path.resolve(__dirname, '..');
  const sourceDir = path.resolve(projectRoot, source);
  const destDir = path.resolve(projectRoot, dest);

  const report: MigrationReport = {
    converted: [],
    warnings: [],
    skipped: [],
    timestamp: new Date().toISOString(),
  };

  console.log(`RedPen Converter CLI`);
  console.log(`Source: ${sourceDir}`);
  console.log(`Dest:   ${destDir}`);
  console.log(`DryRun: ${dryRun}`);
  console.log('');

  // Convert agents
  const agentsDir = path.join(sourceDir, 'agents');
  if (fs.existsSync(agentsDir)) {
    const agentFiles = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
    console.log(`Converting ${agentFiles.length} agent files...`);

    for (const file of agentFiles) {
      const sourcePath = path.join(agentsDir, file);
      const destPath = path.join(destDir, 'agents', file);
      convertFile(sourcePath, destPath, report, dryRun);
    }
  }

  // Convert commands
  const commandsDir = path.join(sourceDir, 'commands');
  if (fs.existsSync(commandsDir)) {
    const commandFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.md'));
    console.log(`Converting ${commandFiles.length} command files...`);

    for (const file of commandFiles) {
      const sourcePath = path.join(commandsDir, file);
      const destPath = path.join(destDir, 'commands', file);
      convertFile(sourcePath, destPath, report, dryRun);
    }
  }

  // Generate opencode.json
  if (!dryRun) {
    generateOpencodeJson(destDir, false);
    console.log('Generated opencode.json');
  }

  // Write migration report
  if (!dryRun) {
    fs.writeFileSync(path.join(destDir, 'migration-report.json'), JSON.stringify(report, null, 2));
  }

  console.log('');
  console.log(`Conversion complete:`);
  console.log(`  Converted: ${report.converted.length}`);
  console.log(`  Warnings:  ${report.warnings.length}`);
  console.log(`  Skipped:   ${report.skipped.length}`);

  if (report.warnings.length > 0) {
    console.log('\nWarnings:');
    for (const w of report.warnings) {
      console.log(`  - ${w.file}: ${w.field} - ${w.reason}`);
    }
  }

  if (report.skipped.length > 0) {
    console.log('\nSkipped:');
    for (const s of report.skipped) {
      console.log(`  - ${s.file}: ${s.reason}`);
    }
  }
}

main();
