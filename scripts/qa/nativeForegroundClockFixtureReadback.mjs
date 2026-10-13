import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateNativeForegroundClock } from './nativeForegroundClockReadback.mjs';

const ORIGIN = 'http://127.0.0.1:8082';
const BASE_FIELDS = ['protocol', 'stage', 'runId', 'mode', 'scenario', 'errorCategory', 'cleanupVerified'];
export function validateFixtureInvocation(mode, scenario, runId) {
  if (!['seed', 'recover', 'cleanup'].includes(mode) || !['countdown', 'cap', 'overrun'].includes(scenario)
    || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(runId ?? '')) throw Error('fixture_invocation_rejected');
}
export function validateFixtureReceipt(value, mode, scenario, runId, {cold = true} = {}) {
  validateFixtureInvocation(mode, scenario, runId);
  if (!value || value.protocol !== 'patternly.native-clock-fixture.v1' || value.mode !== mode || value.scenario !== scenario
    || value.runId !== runId || value.errorCategory !== null) throw Error('fixture_receipt_rejected');
  const expected = mode === 'cleanup' ? [...BASE_FIELDS] : [...BASE_FIELDS, 'countdownMs', 'initialElapsedMs', 'durableElapsedMs', 'checkpointRevision', 'running', 'elapsedMs', 'metrics', 'encrypted'];
  if (Object.keys(value).sort().join(',') !== expected.sort().join(',')) throw Error('fixture_receipt_rejected');
  if (mode === 'cleanup') {
    if (value.stage !== 'complete' || value.cleanupVerified !== true) throw Error('fixture_cleanup_rejected');
    return value;
  }
  if (value.stage !== 'ready' || value.cleanupVerified !== false || value.encrypted !== true || typeof value.running !== 'boolean'
    || ![value.countdownMs, value.initialElapsedMs, value.durableElapsedMs, value.checkpointRevision, value.elapsedMs].every(Number.isSafeInteger)
    || value.countdownMs !== 60_000 || value.initialElapsedMs !== (scenario === 'cap' ? 59_500 : scenario === 'overrun' ? 61_000 : 0)
    || value.durableElapsedMs < value.initialElapsedMs || value.elapsedMs < value.durableElapsedMs
    || (cold && value.elapsedMs !== value.durableElapsedMs) || value.checkpointRevision < 1) throw Error('fixture_receipt_rejected');
  const metrics = value.metrics;
  if (!metrics || Object.keys(metrics).sort().join(',') !== 'checkpointCount,maxOutstandingMs,maxWriteMs'
    || !Number.isSafeInteger(metrics.checkpointCount) || metrics.checkpointCount < 0 || (cold && metrics.checkpointCount !== 0)
    || !Number.isFinite(metrics.maxOutstandingMs) || metrics.maxOutstandingMs < 0
    || !Number.isFinite(metrics.maxWriteMs) || metrics.maxWriteMs < 0) throw Error('fixture_receipt_rejected');
  return value;
}
export async function readNativeForegroundClockFixture(mode, scenario, runId) {
  validateFixtureInvocation(mode, scenario, runId);
  const expression = 'globalThis.__patternlyNativeClockFixture?.read() ?? null';
  return validateFixtureReceipt(await evaluateNativeForegroundClock(ORIGIN, expression), mode, scenario, runId);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, scenario, runId, ...extra] = process.argv.slice(2);
  if (extra.length) {
    console.error(JSON.stringify({ stage: 'error', category: 'arguments_rejected' })); process.exitCode = 1;
  } else {
    readNativeForegroundClockFixture(mode, scenario, runId).then(value => console.log(JSON.stringify(value))).catch(() => {
      console.error(JSON.stringify({ stage: 'error', category: 'native_fixture_read_failed' })); process.exitCode = 1;
    });
  }
}
