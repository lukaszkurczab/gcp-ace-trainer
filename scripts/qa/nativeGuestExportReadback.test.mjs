import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReadExpression, parseArguments, resolveInitializedOwnerId, __testables } from './nativeGuestExportReadback.mjs';

const guestProfileHash = 'a'.repeat(64);
const otherGuestProfileHash = 'b'.repeat(64);
const runId = '12345678-1234-4234-8234-123456789abc';

test('native Guest readback requires an explicit expected Guest hash and private output paths', () => {
  assert.deepEqual(parseArguments([
    '--private-root', '/private/tmp/patternly-private',
    '--expected-guest-sha256', guestProfileHash,
    '--output', 'guest-before.json',
  ]), {
    privateRoot: '/private/tmp/patternly-private',
    expectedGuestProfileIdSha256: guestProfileHash,
    output: 'guest-before.json',
  });
  assert.throws(() => parseArguments(['--private-root', '/tmp/a', '--expected-guest-sha256', guestProfileHash]), /input_rejected/u);
  assert.throws(() => parseArguments([
    '--private-root', '/tmp/a', '--expected-guest-sha256', 'not-a-hash', '--output', 'out.json',
  ]), /expected_guest_hash_rejected/u);
  assert.throws(() => parseArguments([
    '--private-root', '/tmp/a', '--expected-guest-sha256', guestProfileHash, '--output', 'out.json', '--unexpected',
  ]), /input_rejected/u);
});

test('private output names cannot escape the private directory', () => {
  assert.equal(__testables.resolvePrivateFile('/private/tmp/patternly-private', 'guest.json'), '/private/tmp/patternly-private/guest.json');
  for (const invalid of ['/private/tmp/guest.json', '../guest.json', 'sub/guest.json', '.hidden.json', 'guest.txt']) {
    assert.throws(() => __testables.resolvePrivateFile('/private/tmp/patternly-private', invalid), /private_path_invalid/u);
  }
});

function makeOwnerRuntime() {
  const modules = new Map([
    ['runtime', { isInitialized: true, verboseName: 'src/infrastructure/runtime/runtimeMode.ts' }],
    ['storage', { isInitialized: true, verboseName: 'src/infrastructure/storage/mmkvClient.ts' }],
    ['hash', { isInitialized: true, verboseName: 'src/infrastructure/identity/sha256.ts' }],
    ['canonical', { isInitialized: true, verboseName: 'src/infrastructure/identity/canonicalSerialization.ts' }],
    ['scope', { isInitialized: true, verboseName: 'src/storage/repositories/learningPlanInputSnapshot.ts' }],
  ]);
  const exports = {
    runtime: { isPatternlySmokeRuntime: () => true },
    storage: { inspectPreparedProfileState: () => Promise.reject(new Error('test stop before canonical reads')) },
    hash: { sha256Utf8: () => guestProfileHash },
    canonical: { canonicalSerialize: JSON.stringify },
    scope: { readLearningPlanStorageScope: () => ({}) },
  };
  let resolveCalls = 0;
  const resolver = (id) => { resolveCalls += 1; return exports[id]; };
  resolver.getModules = () => modules;
  return { resolver, getResolveCalls: () => resolveCalls };
}

function evaluateClaim(expectedHash, nextRunId, existing, ownerResolver = makeOwnerRuntime(), lockExisting = false) {
  const fakeGlobal = {};
  if (existing !== undefined) Object.defineProperty(fakeGlobal, __testables.operationKey, {
    value: existing, configurable: !lockExisting, writable: !lockExisting,
  });
  const expression = buildReadExpression(expectedHash, nextRunId);
  const evaluate = new Function('globalThis', '__r', '__DEV__', `return ${expression};`);
  return { result: evaluate(fakeGlobal, ownerResolver.resolver, true), fakeGlobal, ownerResolver };
}

test('native expression attaches only to the same Guest hash while the operation is pending', () => {
  const pending = {
    protocol: __testables.operationProtocol,
    expectedGuestProfileIdSha256: guestProfileHash,
    runId,
    state: 'pending',
    phase: 'inventory',
  };
  const attached = evaluateClaim(guestProfileHash, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', pending);
  assert.deepEqual(attached.result, { kind: 'attached', runId, state: 'pending', phase: 'inventory' });
  assert.equal(attached.fakeGlobal[__testables.operationKey], pending);
  assert.equal(attached.ownerResolver.getResolveCalls(), 0);

  const mismatched = evaluateClaim(otherGuestProfileHash, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', pending);
  assert.deepEqual(mismatched.result, { kind: 'busy' });
  assert.equal(mismatched.fakeGlobal[__testables.operationKey], pending);
  assert.equal(mismatched.ownerResolver.getResolveCalls(), 0);

  const malformedPending = evaluateClaim(guestProfileHash, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', { ...pending, runId: 'bad' });
  assert.deepEqual(malformedPending.result, { kind: 'busy' });
  assert.equal(malformedPending.ownerResolver.getResolveCalls(), 0);
});

test('settled done and failed operations are discarded and never reused as fresh output', async () => {
  for (const state of ['done', 'failed']) {
    const stale = {
      protocol: __testables.operationProtocol,
      expectedGuestProfileIdSha256: guestProfileHash,
      runId,
      state,
      result: { privateData: 'stale cached result' },
    };
    const freshRunId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const claim = evaluateClaim(guestProfileHash, freshRunId, stale);
    assert.deepEqual(claim.result, { kind: 'started', runId: freshRunId });
    const replacement = claim.fakeGlobal[__testables.operationKey];
    assert.notEqual(replacement, stale);
    assert.equal(replacement.runId, freshRunId);
    assert.equal(replacement.expectedGuestProfileIdSha256, guestProfileHash);
    assert.equal(replacement.result, null);
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(claim.fakeGlobal[__testables.operationKey].result, null);
  }

  const lockedStale = {
    protocol: __testables.operationProtocol,
    expectedGuestProfileIdSha256: guestProfileHash,
    runId,
    state: 'done',
    result: { privateData: 'must not be reused' },
  };
  const locked = evaluateClaim(guestProfileHash, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', lockedStale, makeOwnerRuntime(), true);
  assert.deepEqual(locked.result, { kind: 'busy' });
  assert.equal(locked.fakeGlobal[__testables.operationKey], lockedStale);
  assert.equal(locked.ownerResolver.getResolveCalls(), 0);
});

test('generated expression enforces Guest hash, exact inventory identity, and canonical read boundaries', () => {
  const expression = buildReadExpression(guestProfileHash, runId);
  assert.match(expression, /isPatternlySmokeRuntime\(\)/u);
  assert.match(expression, /captureActiveProfileStorageLease\(\)/u);
  assert.match(expression, /isActiveProfileStorageLeaseCurrent\(lease\)/u);
  assert.match(expression, /profileIdSha256!==expectedGuestProfileIdSha256/u);
  assert.match(expression, /readGuestInstallation\(\)/u);
  assert.match(expression, /readTrainingSessions\(\)/u);
  assert.match(expression, /assertTrainingEvidenceIntegrity\(\)/u);
  assert.match(expression, /assertContentIdentityRecordIntegrity\(\)/u);
  assert.match(expression, /retainedContentHistory/u);
  assert.match(expression, /readContentIdentityRetainedHistory\(\)/u);
  assert.match(expression, /readActiveMutationJournal\(\)/u);
  assert.match(expression, /inspectPreparedQ13StorageInventory\(\)/u);
  assert.match(expression, /inventoryGuests\.length!==1/u);
  assert.match(expression, /inventoryGuests\[0\]\?\.kind!==first\.profileKind/u);
  assert.match(expression, /hasOwnProperty\.call\(globalThis,operationKey\)/u);
  assert.match(expression, /registryChecksumSha256/u);
  assert.match(expression, /profileInventorySha256!==hash\(JSON\.stringify\(expectedRegistryIdentityRows\)\)/u);
  assert.match(expression, /operation\.phase="canonical_revalidation"/u);
  assert.match(expression, /first\.fingerprint!==second\.fingerprint/u);
  assert.doesNotMatch(expression, /packagePointerSources|actorUidSha256|Share\.share|exportGuestData|\.setString\(/u);
});

test('learning-plan storage scope owner resolver matches the actual source path', () => {
  const ownerPath = fileURLToPath(new URL('../../src/storage/repositories/learningPlanInputSnapshot.ts', import.meta.url));
  assert.equal(existsSync(ownerPath), true);
  assert.equal(existsSync(ownerPath.replace(/\.ts$/u, 'Repository.ts')), false);
  const suffix = 'src/storage/repositories/learningPlanInputSnapshot.ts';
  const entries = [
    ['actual-owner', { isInitialized: true, verboseName: ownerPath }],
    ['uninitialized', { isInitialized: false, verboseName: ownerPath }],
  ];
  assert.equal(resolveInitializedOwnerId(entries, suffix), 'actual-owner');
  assert.equal(resolveInitializedOwnerId([...entries, ['duplicate', { isInitialized: true, verboseName: `/bundle/${suffix}` }],], suffix), null);
  assert.equal(resolveInitializedOwnerId(entries, 'src/storage/repositories/learningPlanInputSnapshotRepository.ts'), null);
});

test('inventory timeout is bounded and diagnostics stay sanitized', () => {
  assert.equal(__testables.INVENTORY_TIMEOUT_MS, 30_000);
  assert.ok(__testables.ERROR_CATEGORIES.has('native_inventory_timeout'));
  assert.ok(__testables.ERROR_CATEGORIES.has('native_inventory_unavailable'));
  assert.ok(__testables.ERROR_CATEGORIES.has('expected_guest_hash_rejected'));
});

test('readback summary counts user reports from the canonical export input root', () => {
  const snapshot = {
    stage: 'native_guest_export_readback',
    registry: { guestCount: 1, profileCount: 4 },
    canonicalExportInputs: {
      learning: { sessions: [], attempts: [], results: [], goals: [], acceptedPlans: [], retainedContentHistory: { archivalSessions: [{}], unavailableActiveSessions: [{}, {}], unavailableReviews: [{}] } },
      userReports: [{ trackId: 'track', itemId: 'item' }, { trackId: 'track', itemId: 'other' }],
    },
  };
  assert.deepEqual(__testables.summarizeSnapshot(snapshot), {
    stage: 'native_guest_export_readback', guestProfiles: 1, profiles: 4,
    sessions: 0, attempts: 0, results: 0, goals: 0, acceptedPlans: 0, userReports: 2,
    retainedArchiveSessions: 1, unavailableActiveSessions: 2, unavailableReviews: 1,
    inventoryComplete: true, privateOutputWritten: true,
  });
});

test('CLI errors expose only a stable category, never supplied private hashes or paths', () => {
  const privatePath = '/private/tmp/secret-controlled-actor-manifest.json';
  const result = spawnSync(process.execPath, [
    fileURLToPath(new URL('./nativeGuestExportReadback.mjs', import.meta.url)),
    '--private-root', privatePath, '--expected-guest-sha256', guestProfileHash, '--output', 'snapshot.json', '--unexpected',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.deepEqual(JSON.parse(result.stderr), {
    stage: 'native_guest_export_readback_stopped', category: 'input_rejected', storageMutationAttempted: false,
  });
  assert.doesNotMatch(result.stderr, /secret-controlled-actor|a{64}/u);
});
