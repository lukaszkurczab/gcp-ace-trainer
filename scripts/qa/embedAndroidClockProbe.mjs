#!/usr/bin/env node
import { createRequire } from 'node:module';
import { existsSync, lstatSync, mkdirSync, openSync, closeSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

// Local-only production-Hermes embedding, without EAS build or device access.
// Use an isolated source snapshot and real node_modules: external symlinks alter
// Android resource names and can accidentally resolve another checkout's App.
try {
  const args = process.argv.slice(2), options = {};
  for (let index = 0; index < args.length; index += 2) {
    if (!['--project', '--output', '--env-file', '--run-id', '--fingerprint'].includes(args[index]) || !args[index + 1] || options[args[index]]) throw Error();
    options[args[index]] = args[index + 1];
  }
  if (Object.keys(options).length !== 5 || !/^[a-f0-9]{64}$/u.test(options['--fingerprint'])
    || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(options['--run-id'])) throw Error();
  const root = resolve(options['--project']), output = resolve(options['--output']);
  if (!lstatSync(join(root, 'node_modules')).isDirectory() || existsSync(output)) throw Error();
  const { parseDotenv, validateLocalProfile } = await import(pathToFileURL(join(root, 'scripts/runLocalProfile.mjs')));
  const environment = { ...process.env, ...parseDotenv(readFileSync(options['--env-file'], 'utf8')),
    PATTERNLY_RUNTIME_MODE: 'sandbox', EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: 'sandbox', EXPO_NO_DOTENV: '1', EAS_BUILD_PLATFORM: 'android',
    EXPO_PUBLIC_PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID: options['--run-id'] };
  for (const key of ['EXPO_PUBLIC_PATTERNLY_BACKEND_E2E', 'EXPO_PUBLIC_PATTERNLY_API_ORIGIN', 'EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN',
    'EXPO_PUBLIC_PATTERNLY_E2E_EMAIL', 'EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD', 'EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN']) delete environment[key];
  const checked = validateLocalProfile('sandbox', environment), require = createRequire(join(root, 'package.json'));
  const app = require(join(root, 'app.config.js')).createExpoConfig(checked).expo;
  if (app.extra.patternlyEnvironmentFingerprint !== options['--fingerprint']) throw Error();
  mkdirSync(output, { mode: 0o700 });
  const entry = join(root, 'patternly-android-clock-local-entry.js');
  writeFileSync(entry, 'import registerRootComponent from "expo/src/launch/registerRootComponent";\nimport App from "./App";\nregisterRootComponent(App);\n', { flag: 'wx', mode: 0o600 });
  const stdout = openSync(join(output, 'embed.stdout'), 'wx', 0o600), stderr = openSync(join(output, 'embed.stderr'), 'wx', 0o600);
  let result;
  try {
    result = spawnSync(process.execPath, [join(root, 'node_modules/expo/bin/cli'), 'export:embed', '--platform', 'android', '--entry-file', entry,
      '--dev', 'false', '--bytecode', '--max-workers', '1', '--bundle-output', join(output, 'index.android.bundle'),
      '--sourcemap-output', join(output, 'private.map'), '--assets-dest', join(output, 'resources')], { cwd: root, env: checked, stdio: ['ignore', stdout, stderr] });
  } finally { closeSync(stdout); closeSync(stderr); unlinkSync(entry); }
  if (result.error || result.status !== 0) throw Error();
  console.log(JSON.stringify({ stage: 'embedded', fingerprint: options['--fingerprint'], runId: options['--run-id'] }));
} catch { console.error(JSON.stringify({ stage: 'embed_refused_or_failed' })); process.exitCode = 1; }
