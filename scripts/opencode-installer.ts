import * as fs from 'fs';
import * as path from 'path';

interface Args {
  mode: 'global' | 'project';
  source: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Args = { mode: 'project', source: '.claude' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mode' && args[i + 1]) result.mode = args[++i] as 'global' | 'project';
    if (args[i] === '--source' && args[i + 1]) result.source = args[++i];
  }
  return result;
}

function installGlobal(projectRoot: string): void {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const targetDir = path.join(homeDir, '.opencode');

  console.log(`Installing to global: ${targetDir}`);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copy agents
  const agentsSource = path.join(projectRoot, '.opencode', 'agents');
  const agentsTarget = path.join(targetDir, 'agents');
  if (fs.existsSync(agentsSource)) {
    copyDir(agentsSource, agentsTarget);
    console.log(`  Copied agents to ${agentsTarget}`);
  }

  // Copy commands
  const commandsSource = path.join(projectRoot, '.opencode', 'commands');
  const commandsTarget = path.join(targetDir, 'commands');
  if (fs.existsSync(commandsSource)) {
    copyDir(commandsSource, commandsTarget);
    console.log(`  Copied commands to ${commandsTarget}`);
  }

  // Copy plugins
  const pluginsSource = path.join(projectRoot, '.opencode', 'plugins');
  const pluginsTarget = path.join(targetDir, 'plugins');
  if (fs.existsSync(pluginsSource)) {
    copyDir(pluginsSource, pluginsTarget);
    console.log(`  Copied plugins to ${pluginsTarget}`);
  }

  // Copy opencode.json
  const configSource = path.join(projectRoot, 'opencode.json');
  if (fs.existsSync(configSource)) {
    fs.copyFileSync(configSource, path.join(targetDir, 'opencode.json'));
    console.log(`  Copied opencode.json`);
  }

  console.log('Global installation complete.');
}

function installProject(projectRoot: string): void {
  const opencodeDir = path.join(projectRoot, '.opencode');
  console.log(`Installing to project: ${opencodeDir}`);

  if (!fs.existsSync(opencodeDir)) {
    console.log('.opencode directory not found. Run converter-cli first.');
    process.exit(1);
  }

  // Ensure opencode.json exists at project root
  const configPath = path.join(projectRoot, 'opencode.json');
  if (!fs.existsSync(configPath)) {
    console.log('opencode.json not found. Run converter-cli first.');
    process.exit(1);
  }

  console.log('Project installation verified.');
  console.log(`  Commands: ${path.join(opencodeDir, 'commands')}`);
  console.log(`  Agents: ${path.join(opencodeDir, 'agents')}`);
  console.log(`  Plugins: ${path.join(opencodeDir, 'plugins')}`);
  console.log(`  Config: ${configPath}`);
}

function copyDir(src: string, dest: string): void {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main(): void {
  const { mode } = parseArgs();
  const projectRoot = process.cwd();

  console.log('RedPen OpenCode Installer');
  console.log(`Mode: ${mode}`);
  console.log('');

  if (mode === 'global') {
    installGlobal(projectRoot);
  } else {
    installProject(projectRoot);
  }
}

main();
