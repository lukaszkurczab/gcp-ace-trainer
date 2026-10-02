/** Local acceptance only: route this smoke bundle through the bounded proxy. */
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDotenv, validateLocalProfile } from '../runLocalProfile.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const origin = process.argv[2];
if (process.argv.length !== 3 || !['http://127.0.0.1:18080', 'http://127.0.0.1:8080'].includes(origin)) {
  console.error('native_metro_configuration_refused');
  process.exit(1);
}
const env = validateLocalProfile('smoke', {
  ...process.env,
  ...parseDotenv(readFileSync(path.join(root, '.env.smoke.local'), 'utf8')),
  EXPO_PUBLIC_PATTERNLY_API_ORIGIN: origin,
  PATTERNLY_METRO_DISABLE_WATCHMAN: '1',
  CI: '1',
});
// Match the fixed IPv4 simulator/proxy origin even when macOS resolves localhost to ::1 first.
const child = spawn(process.execPath, ['--dns-result-order=ipv4first', path.join(root, 'node_modules/expo/bin/cli'), 'start', '--localhost', '--port', '8081', '--clear'], { cwd: root, env, stdio: 'inherit' });
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => child.kill(signal));
child.once('error', () => { console.error('native_metro_spawn_failed'); process.exitCode = 1; });
child.once('exit', (code) => { process.exitCode = code ?? 1; });
