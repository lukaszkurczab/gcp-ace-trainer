import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const runId = '12345678-1234-4234-8234-123456789abc';
const storeId = `patternly-clock-fixture-${runId}`;
const source = readFileSync(new URL('../../native/foreground-clock/fixtures/probe.js', import.meta.url), 'utf8');
function harness(options = {}) {
  const { scenario = 'countdown', development = true, smoke = true, stores = new Map(), revokeFails = false, operatingSystem = 'ios', partialFiles = [], leaveCrcOnDelete = false } = options;
  const mode = Object.hasOwn(options, 'mode') ? options.mode : 'seed';
  const calls = [];
  const listeners = [];
  let currentStore;
  let currentScope;
  const platform = {
    exists(id) { calls.push(['exists', id]); return stores.has(id); },
    open(id, publicKey) {
      calls.push(['open', id, publicKey]);
      if (!stores.has(id)) stores.set(id, new Map()); currentStore = stores.get(id);
      return { isEncrypted: true, getAllKeys: () => [...currentStore.keys()] };
    },
    delete(id) { calls.push(['delete', id]); stores.delete(id); if (leaveCrcOnDelete) partialFiles.push(`${id}.crc`); },
    createKey() { throw Error('Keychain/test-secret path forbidden'); },
    manifestStore: { get() { throw Error('Keychain forbidden'); }, set() { throw Error('Keychain forbidden'); } },
  };
  class File { constructor(name) { this.name = name; } }
  class Directory { list() { return [...[...stores.keys()].flatMap(id => [id, `${id}.crc`]), ...partialFiles].map(name => new File(name)); } }
  const context = vm.createContext({
    __DEV__: development,
    process: { env: { EXPO_PUBLIC_PATTERNLY_CLOCK_FIXTURE_MODE: mode, EXPO_PUBLIC_PATTERNLY_CLOCK_FIXTURE_RUN_ID: runId, EXPO_PUBLIC_PATTERNLY_CLOCK_FIXTURE_SCENARIO: scenario } },
    Platform: { OS: operatingSystem }, File, Directory, Paths: { document: 'documents' },
    AppState: { addEventListener(event, listener) { assert.equal(event, 'change'); listeners.push(listener); } }, performance: { now: () => 1234 },
    React: {}, useEffect() {}, useState() {}, AppRegistry: { registerComponent() {} }, Text: {}, View: {},
    isPatternlySmokeRuntime: () => smoke,
    createNativeEncryptedStoragePlatform: () => { calls.push(['platform']); return platform; },
    foregroundTimerPhysicalKey: id => `patternly:profile:v1:${id}:patternly%3Acanonical%3Av1%3Aactive-foreground-timer`,
    sha256Utf8: value => createHash('sha256').update(value).digest('hex'),
    createForegroundTimerState: value => Object.freeze({ ...value }),
    claimNativeForegroundClock(_slot, scope) {
      calls.push(['claim', scope.profileId, scope.physicalKey]); currentScope = scope;
      return {
        apply(before, after) { assert.equal(currentStore.get(scope.physicalKey), before); currentStore.set(scope.physicalKey, after); calls.push(['apply']); },
        read: () => currentStore.get(scope.physicalKey),
        arm(input) { assert.equal(input.expectedRaw, currentStore.get(scope.physicalKey)); calls.push(['arm', input.countdownMs]); },
        elapsed: () => JSON.parse(currentStore.get(scope.physicalKey)).payload.accumulatedForegroundMs,
        metrics: () => ({ checkpointCount: 0, maxOutstandingMs: 0, maxWriteMs: 0 }),
        revoke() { calls.push(['revoke']); if (revokeFails) throw Error('unknown revoke'); },
        enter() { throw Error('clock entry forbidden in bootstrap'); }, checkpoint() { throw Error('checkpoint forbidden in bootstrap'); }, pause() { throw Error('pause forbidden in bootstrap'); },
      };
    },
  });
  vm.runInContext(source.replace(/^import .*;$/gmu, '').replace(/^export /gmu, ''), context);
  return { context, calls, stores, listeners, scope: () => currentScope,
    boot: () => vm.runInContext('runClockFixture()', context),
    read: () => JSON.parse(JSON.stringify(context.__patternlyNativeClockFixture.read())) };
}

test('disabled or malformed fixture configuration never opens any store', async () => {
  for (const options of [{ development: false }, { smoke: false }, { operatingSystem: 'android' }, { mode: undefined }, { mode: 'invalid' }, { scenario: 'invalid' }]) {
    const h = harness(options); await h.boot(); assert.equal(h.read().stage, 'disabled'); assert.deepEqual(h.calls, []);
  }
});
test('lifecycle diagnostics only capture sanitized memory receipts and never control the native clock', async () => {
  const h = harness(); await h.boot(); const before = [...h.calls];
  h.listeners[0]('background'); h.listeners[0]('active'); h.listeners[0]('inactive');
  const receipts = JSON.parse(JSON.stringify(h.context.__patternlyNativeClockFixture.lifecycle()));
  assert.deepEqual(receipts.map(r => r.state), ['background','active']);
  assert.equal(receipts[0].clock.durableElapsedMs, 0);
  assert.deepEqual(h.calls, before); assert.equal(JSON.stringify(receipts).includes('publicTestKey'), false);
});
test('seed uses only its original encrypted slot and returns sanitized numeric readiness without entering', async () => {
  const protectedStore = new Map([['retained', 'private sentinel']]);
  const h = harness({ stores: new Map([['patternly-secure-a', protectedStore]]) }); await h.boot();
  const receipt = h.read();
  assert.equal(receipt.stage, 'ready'); assert.equal(receipt.encrypted, true); assert.equal(receipt.durableElapsedMs, 0);
  assert.equal(receipt.metrics.checkpointCount, 0); assert.equal(receipt.running, false);
  assert.equal(h.calls.filter(c => c[0] === 'open').length, 1);
  assert.equal(h.calls.find(c => c[0] === 'open')[1], storeId);
  assert.equal(h.calls.find(c => c[0] === 'open')[2].length, 32);
  assert.deepEqual([...protectedStore], [['retained', 'private sentinel']]);
  assert.equal(JSON.stringify(receipt).includes('publicTestKey'), false);
  assert.equal(JSON.stringify(receipt).includes('physicalKey'), false);
  assert.equal(h.scope().isCurrent(), true);
});
test('collision and missing recover are rejected before opening; no automatic seed or overwrite', async () => {
  const collision = harness({ stores: new Map([[storeId, new Map([['unknown', 'retain']])]]) }); await collision.boot();
  assert.equal(collision.read().errorCategory, 'fixture_store_collision'); assert.equal(collision.calls.some(c => c[0] === 'open'), false);
  const absent = harness({ mode: 'recover' }); await absent.boot();
  assert.equal(absent.read().errorCategory, 'fixture_store_missing'); assert.equal(absent.calls.some(c => c[0] === 'open'), false);
});
test('cold recover preserves cap/overrun data; cleanup drains then deletes only the owned exact namespace', async () => {
  for (const scenario of ['cap', 'overrun']) {
    const seed = harness({ scenario }); await seed.boot();
    const before = [...seed.stores.get(storeId)];
    const recovered = harness({ mode: 'recover', scenario, stores: seed.stores }); await recovered.boot();
    assert.equal(recovered.read().durableElapsedMs, scenario === 'cap' ? 59500 : 61000);
    assert.deepEqual([...seed.stores.get(storeId)], before);
    const cleanup = harness({ mode: 'cleanup', scenario, stores: seed.stores }); await cleanup.boot();
    assert.equal(cleanup.read().cleanupVerified, true); assert.equal(cleanup.read().stage, 'complete');
    assert.equal(cleanup.scope().isCurrent(), false);
    assert.ok(cleanup.calls.findIndex(c => c[0] === 'revoke') < cleanup.calls.findIndex(c => c[0] === 'delete'));
    assert.equal(cleanup.stores.has(storeId), false);
  }
});
test('unknown keys and unknown revoke retain data and never delete', async () => {
  const seed = harness(); await seed.boot(); seed.stores.get(storeId).set('unknown', 'retain');
  const recover = harness({ mode: 'recover', stores: seed.stores }); await recover.boot();
  assert.equal(recover.read().errorCategory, 'fixture_namespace_rejected'); assert.equal(recover.calls.some(c => c[0] === 'delete'), false);
  seed.stores.get(storeId).delete('unknown');
  const cleanup = harness({ mode: 'cleanup', stores: seed.stores, revokeFails: true }); await cleanup.boot();
  assert.equal(cleanup.read().stage, 'failed'); assert.equal(cleanup.calls.some(c => c[0] === 'delete'), false); assert.equal(cleanup.stores.has(storeId), true);
});

test('a partial SDK file pair blocks seed before opening and cannot be reported as successful cleanup', async () => {
  for (const name of [storeId, `${storeId}.crc`, `${storeId}.unknown-sidecar`]) {
    const h = harness({ partialFiles: [name] }); await h.boot();
    assert.equal(h.read().errorCategory, 'fixture_store_collision');
    assert.equal(h.calls.some(c => c[0] === 'open'), false);
  }
  const seed = harness(); await seed.boot();
  const cleanup = harness({ mode: 'cleanup', stores: seed.stores, leaveCrcOnDelete: true });
  await cleanup.boot();
  assert.equal(cleanup.read().stage, 'failed');
  assert.equal(cleanup.read().cleanupVerified, false);
  assert.equal(cleanup.read().errorCategory, 'fixture_cleanup_unverified');
  assert.equal(cleanup.calls.filter(c => c[0] === 'delete').length, 1);
});
