import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseDotenv} from '../runLocalProfile.mjs';
import {spawn} from 'node:child_process';
import {fixtureEnvironment, stopOwnedChild} from './startNativeForegroundClockFixture.mjs';
const runId = '12345678-1234-4234-8234-123456789abc';
const profile = {...parseDotenv(readFileSync(new URL('../../.env.smoke.example', import.meta.url), 'utf8')), EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: 'a'.repeat(64),
  EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY: 'local-api-key', EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID: '1:123:ios:local',
  EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN: 'patternly-app-sandbox.firebaseapp.com', EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: 'patternly-app-sandbox',
  EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID: 'local-android-client', EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID: 'local-ios-client', EXPO_PUBLIC_PATTERNLY_GOOGLE_WEB_CLIENT_ID: 'local-web-client'};
test('fixture environment strips ambient overrides and pins one explicit local phase', () => {
  const env = fixtureEnvironment({ EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE: 'seed', PATTERNLY_FOREIGN: 'retain-outside-child' }, profile, 'recover', 'cap', runId);
  assert.equal(env.EXPO_PUBLIC_PATTERNLY_CLOCK_FIXTURE_MODE, 'recover');
  assert.equal(env.EXPO_PUBLIC_PATTERNLY_CLOCK_FIXTURE_RUN_ID, runId);
  assert.equal(env.EXPO_PUBLIC_PATTERNLY_CLOCK_FIXTURE_SCENARIO, 'cap');
  assert.equal(env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE, undefined);
  assert.equal(env.PATTERNLY_FOREIGN, undefined); assert.equal(env.CI, '1'); assert.equal(env.EXPO_NO_DOTENV, '1');
});
test('invalid, mock-SDK and conflicting file profiles fail before starting Metro', () => {
  assert.throws(() => fixtureEnvironment({}, profile, 'invalid', 'cap', runId));
  assert.throws(() => fixtureEnvironment({ JEST_WORKER_ID: '1' }, profile, 'seed', 'cap', runId));
  assert.throws(() => fixtureEnvironment({}, { ...profile, EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE: 'seed' }, 'seed', 'cap', runId));
});
test('receipt-failure cleanup confirms exit even when the owned child ignores SIGINT', async () => {
  const child = spawn(process.execPath, ['-e', "process.on('SIGINT',()=>{});console.log('ready');setInterval(()=>{},1000)"], { stdio: ['ignore', 'pipe', 'ignore'] });
  try {
    await new Promise((accept, reject) => { child.once('error', reject); child.stdout.once('data', accept); });
    await stopOwnedChild(child, 50);
    assert.equal(child.signalCode, 'SIGKILL');
    await stopOwnedChild(child, 50);
  } finally { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); }
});
