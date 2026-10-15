// Isolated JS-only fixture for the already installed dev client; no build/install/data operations.
import { readFileSync, statSync, mkdtempSync, cpSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
try {
  const [environmentFile] = process.argv.slice(2);
  if (process.argv.length !== 3 || !environmentFile || (statSync(environmentFile).mode & 0o077) !== 0) throw Error('fixture_environment_rejected');
  const environment = JSON.parse(readFileSync(environmentFile, 'utf8'));
  if (environment.PATTERNLY_RUNTIME_MODE !== 'smoke') throw Error('fixture_environment_rejected');
  const source = fileURLToPath(new URL('../../', import.meta.url));
  const project = mkdtempSync(join(tmpdir(), 'patternly-content19-ui-'));
  for (const name of ['src', 'assets', 'config', 'plugins', 'scripts/qa']) cpSync(join(source, name), join(project, name), { recursive: true });
  for (const name of ['metro.config.js', 'app.config.js', 'tsconfig.json']) cpSync(join(source, name), join(project, name));
  const pkg = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
  pkg.main = 'scripts/qa/content19Fixture.tsx'; writeFileSync(join(project, 'package.json'), JSON.stringify(pkg));
  symlinkSync(resolve(source, 'node_modules'), join(project, 'node_modules'), 'dir');
  console.log(`Content19 isolated fixture: ${project}`);
  const child = spawn(process.execPath, [join(project, 'node_modules/expo/bin/cli'), 'start', '--localhost', '--port', '8081'], {
    cwd: project, env: { ...process.env, ...environment, CI: '1', NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --dns-result-order=ipv4first`, EXPO_OFFLINE: '1', EXPO_NO_DOTENV: '1', PATTERNLY_METRO_DISABLE_WATCHMAN: '1' }, stdio: 'inherit',
  });
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
  child.on('exit', (code) => { process.exitCode = code ?? 1; });
} catch { console.error('content19_fixture_start_unavailable'); process.exitCode = 1; }
