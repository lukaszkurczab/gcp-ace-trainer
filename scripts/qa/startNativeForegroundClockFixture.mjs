import { readFileSync, openSync, writeFileSync, closeSync } from 'node:fs';
import { lstat, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { isAbsolute, relative, resolve } from 'node:path';
import { parseDotenv, validateLocalProfile } from '../runLocalProfile.mjs';
import { validateFixtureInvocation } from './nativeForegroundClockFixtureReadback.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const ENTRY = 'native/foreground-clock/fixtures/probe.js';
export function fixtureEnvironment(parent, profile, mode, scenario, runId) {
  validateFixtureInvocation(mode, scenario, runId);
  if (['JEST_WORKER_ID', 'VITEST_WORKER_ID'].some(key => parent[key] !== undefined || profile[key] !== undefined)) throw Error('mock_runtime_rejected');
  if (Object.keys(profile).some(key => key.startsWith('EXPO_PUBLIC_PATTERNLY_') && (key.includes('FIXTURE') || key === 'EXPO_PUBLIC_PATTERNLY_FOREGROUND_CLOCK_RUN_ID'))) throw Error('fixture_conflict');
  const base = Object.fromEntries(Object.entries(parent).filter(([key]) => !key.startsWith('PATTERNLY_') && !key.startsWith('EXPO_PUBLIC_')));
  return validateLocalProfile('smoke', { ...base, ...profile, CI: '1', EXPO_OFFLINE: '1', EXPO_NO_DOTENV: '1',
    EXPO_PUBLIC_PATTERNLY_CLOCK_FIXTURE_MODE: mode, EXPO_PUBLIC_PATTERNLY_CLOCK_FIXTURE_SCENARIO: scenario,
    EXPO_PUBLIC_PATTERNLY_CLOCK_FIXTURE_RUN_ID: runId });
}
async function validatePaths(checkout, privateRoot) {
  for (const path of [checkout, privateRoot]) {
    if (!isAbsolute(path) || await realpath(path) !== path) throw Error('private_path_rejected');
    const inside = relative(resolve(ROOT, 'artifacts/private'), path);
    if (!inside || inside.startsWith('..') || isAbsolute(inside)) throw Error('private_path_rejected');
    const metadata = await lstat(path);
    if (!metadata.isDirectory() || metadata.uid !== process.getuid()) throw Error('private_path_rejected');
  }
  if (((await lstat(privateRoot)).mode & 0o777) !== 0o700) throw Error('private_path_rejected');
  const pkg = JSON.parse(readFileSync(resolve(checkout, 'package.json'), 'utf8'));
  if (pkg.main !== `./${ENTRY}`) throw Error('fixture_entry_rejected');
  const canonical = readFileSync(resolve(ROOT, ENTRY)); const candidate = readFileSync(resolve(checkout, ENTRY));
  if (!canonical.equals(candidate)) throw Error('fixture_source_rejected');
  return createHash('sha256').update(candidate).digest('hex');
}
async function assertPortFree() {
  await new Promise((accept, reject) => {
    const server = createServer();
    server.once('error', () => reject(Error('fixture_port_unavailable')));
    server.listen(8082, '127.0.0.1', () => server.close(error => error ? reject(Error('fixture_port_unavailable')) : accept()));
  });
}
export async function stopOwnedChild(child, graceMs = 2_000) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
  const waitForExit = () => new Promise(accept => {
    const done = () => { clearTimeout(timer); child.off('exit', done); accept(true); };
    const timer = setTimeout(() => { child.off('exit', done); accept(false); }, graceMs);
    child.once('exit', done);
    if (child.exitCode !== null || child.signalCode !== null) done();
  });
  const interrupted = waitForExit(); child.kill('SIGINT');
  if (await interrupted) return;
  const killed = waitForExit(); child.kill('SIGKILL');
  if (!await killed) throw Error('fixture_metro_exit_unconfirmed');
}
export async function startNativeForegroundClockFixture(mode, scenario, runId, checkout, privateRoot) {
  const environment = fixtureEnvironment(process.env, parseDotenv(readFileSync(resolve(ROOT, '.env.smoke.local'), 'utf8')), mode, scenario, runId);
  const sourceSha256 = await validatePaths(checkout, privateRoot);
  await assertPortFree();
  const receiptFd = openSync(resolve(privateRoot, 'metro-process.json'), 'wx', 0o600);
  let fd;
  try { fd = openSync(resolve(privateRoot, 'metro.log'), 'wx', 0o600); } catch (error) { closeSync(receiptFd); throw error; }
  const args = [resolve(ROOT, 'node_modules/expo/bin/cli'), 'start', '--localhost', '--port', '8082', '--max-workers', '2'];
  let child;
  let completion;
  try {
    child = spawn(process.execPath, args, { cwd: checkout, env: environment, stdio: ['ignore', fd, fd] });
    completion = new Promise((accept, reject) => {
      child.once('error', () => reject(Error('fixture_metro_failed')));
      child.once('exit', code => accept(code ?? 1));
    });
    // Attach immediately: a failed spawn must not become an unhandled rejection
    // while the private receipt is being written.
    void completion.catch(() => {});
    if (!Number.isSafeInteger(child.pid)) throw Error('fixture_metro_failed');
    writeFileSync(receiptFd, JSON.stringify({ pid: child.pid, cwd: checkout, command: [process.execPath, ...args], mode, scenario, runId, sourceSha256 }, null, 2) + '\n');
  } catch (error) {
    // Only this newly spawned child is owned here. Never leave it running if
    // disk exhaustion or another receipt failure prevents recording ownership.
    await stopOwnedChild(child);
    throw error;
  } finally {
    closeSync(receiptFd); closeSync(fd);
  }
  console.log(JSON.stringify({ stage: 'fixture_metro_started', pid: child.pid, mode, scenario }));
  return await completion;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, scenario, runId, checkout, privateRoot, ...extra] = process.argv.slice(2);
  if (!checkout || !privateRoot || extra.length) {
    console.error(JSON.stringify({ stage: 'error', category: 'arguments_rejected' })); process.exitCode = 1;
  } else {
    startNativeForegroundClockFixture(mode, scenario, runId, checkout, privateRoot).then(code => { process.exitCode = code; }).catch(() => {
      console.error(JSON.stringify({ stage: 'error', category: 'fixture_metro_configuration_or_start_failed' })); process.exitCode = 1;
    });
  }
}
