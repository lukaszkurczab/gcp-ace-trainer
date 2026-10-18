import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { parseDotenv, validateLocalProfile } from '../runLocalProfile.mjs';

// Startup/error-state audit only. Keep every in-app environment and storage guard.
// Unlike normal smoke launch, this permits observing unavailable API dependencies.
// It does not start a backend, assign data, reset storage, install or open an app.
const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const port = Number(process.argv[2] ?? 8083);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('atlas/invalid-local-port');
const options = process.argv.slice(3);
if (options.length > 1 || options.some(option => option !== '--clear')) throw new Error('atlas/invalid-startup-option');
const environment = validateLocalProfile('smoke', parseDotenv(readFileSync(resolve(root, '.env.smoke.local'), 'utf8')));
const server = createServer();
await new Promise((done, fail) => {
  server.once('error', fail);
  server.listen(port, 'localhost', () => server.close(done));
});
console.log('atlas/startup-audit: validated smoke environment; backend readiness is a separate result; all application guards remain active.');
const child = spawn(process.execPath, [resolve(root, 'node_modules/expo/bin/cli'), 'start', '--localhost', '--port', String(port), ...options], {
  cwd: root, stdio: 'inherit', env: { ...process.env, ...environment, CI: '1', EXPO_NO_DOTENV: '1', EXPO_NO_WATCHMAN: '1' },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.once('error', () => { console.error('atlas/metro-spawn-failed'); process.exitCode = 1; });
child.once('exit', code => { process.exitCode = code ?? 1; });
