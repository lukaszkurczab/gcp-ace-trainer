import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import {
  buildPostcoldExpected,
  evaluatePostcoldExpression,
  selectPostcoldTarget,
  validatePostcoldResult,
} from './run-postcold.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const OLD = 'b880a3a8d1530601f6f1ed2f244078468f09f51f9d68ba5f6d3cec95cfa5e52d';
const NEW = '9713fdb2e895fdefbd4f304e3617151f55dfe9b286a226340c2824e1fd2ab6e3';
const digest = value => sha(value);

function evidenceFixture() {
  const accounts = Array.from({ length: 9 }, (_, index) => ({
    idSha256: digest(`account-profile-${index}`),
    kind: 'account',
    accountIdSha256: digest(`account-${index}`),
  }));
  const expectedProfiles = [...accounts, { idSha256: OLD, kind: 'guest', accountIdSha256: null }];
  const identityHash = sha(JSON.stringify([...expectedProfiles].sort((a, b) => a.idSha256.localeCompare(b.idSha256))));
  const recon = {
    schemaVersion: 'bizq01-guest-removal-reconciliation-v1', result: 'passed', stage: 'complete',
    profileTransitionActive: false, activeLearningWorkPresent: false, guestKind: 'guest', selectedGuestMatches: true,
    installationIdSha256: digest('old-installation'), datasetIdSha256: OLD,
    accountProfileCount: 9, guestProfileCount: 1, profileIdentityInventorySha256: identityHash,
    guestKeyCount: 84, guestRecordCount: 81, guestMetadataKeyCount: 3, guestKeyInventorySha256: digest('keys'),
    registrySlotAValid: true, registrySlotBValid: true, registrySlotsMatchBaseline: true,
    logoutControlValid: true, logoutControlMatchesBaseline: true, pendingPairCount: 6,
    pendingPairInventorySha256: digest('pairs'), pendingUidInventorySha256: digest('uids'), blockedPairSha256: null,
    canaryFamilyKeyCount: 0, canaryFamilyKeyInventorySha256: digest('canary'),
    accountStateSha256: digest('accounts-state'), globalStateSha256: digest('global-state'), protectedAdapterStateSha256: digest('adapter-state'),
  };
  return {
    stage1: {
      schemaVersion: 'bizq01-guest-removal-reconciliation-evidence-v1', result: 'passed', stage: 'complete', mode: 'reconcile',
      appId: 'com.lkurczab.patternly', deviceName: 'iPhone 17', sourceRef: 'a'.repeat(40), sourceSha256: digest('source'),
      toolSha256: digest('tool'), baselineSha256: digest('baseline'), capturedAt: '2026-10-07T12:00:00.000Z', reconciliation: recon,
    },
    removal: {
      schemaVersion: 'bizq01-guest-removal-34-evidence-v1', result: 'passed', stage: 'complete',
      appId: 'com.lkurczab.patternly', deviceName: 'iPhone 17', sourceRef: 'b'.repeat(40), sourceSha256: digest('removal-source'),
      toolSha256: digest('removal-tool'), baselineSha256: digest('removal-baseline'), operationNonceSha256: digest('operation'),
      capturedAt: '2026-10-07T12:01:00.000Z', replacementProfileIdSha256: NEW, removedProfileIdSha256: OLD,
      protectedAccountStateSha256: recon.accountStateSha256, protectedGlobalStateSha256: recon.globalStateSha256,
      logoutControlSha256: digest('logout'), removedKeyCount: 84,
    },
    baseline: { expectedProfiles },
  };
}

test('post-cold expectations bind the replacement while retaining exactly the nine account identities', () => {
  const { stage1, removal, baseline } = evidenceFixture();
  const expected = buildPostcoldExpected(stage1, removal, baseline);
  assert.equal(expected.oldDatasetIdSha256, OLD);
  assert.equal(expected.replacementDatasetIdSha256, NEW);
  assert.equal(expected.expectedProfiles.length, 10);
  assert.equal(expected.expectedProfiles.filter(profile => profile.kind === 'account').length, 9);
  assert.equal(expected.expectedProfiles.some(profile => profile.idSha256 === OLD), false);
  assert.equal(expected.expectedProfiles.some(profile => profile.idSha256 === NEW && profile.kind === 'guest'), true);
  assert.equal(expected.profileIdentityInventorySha256, sha(JSON.stringify(expected.expectedProfiles)));
});

test('post-cold expectations fail closed on wrong removed/replacement identities and malformed baseline', () => {
  const fixture = evidenceFixture();
  assert.throws(() => buildPostcoldExpected(fixture.stage1, { ...fixture.removal, removedProfileIdSha256: digest('other') }, fixture.baseline), /baseline_unavailable/u);
  assert.throws(() => buildPostcoldExpected(fixture.stage1, { ...fixture.removal, replacementProfileIdSha256: digest('other') }, fixture.baseline), /baseline_unavailable/u);
  assert.throws(() => buildPostcoldExpected({ ...fixture.stage1, result: 'failed' }, fixture.removal, fixture.baseline), /baseline_unavailable/u);
});

test('target selection requires one exact app/device node target at IPv6 loopback', () => {
  const target = { appId: 'com.lkurczab.patternly', deviceName: 'iPhone 17', type: 'node', webSocketDebuggerUrl: 'ws://[::1]:8081/inspector/1' };
  assert.equal(selectPostcoldTarget([target]), target);
  assert.throws(() => selectPostcoldTarget([target, { ...target, webSocketDebuggerUrl: 'ws://[::1]:8081/inspector/2' }]), /inspector_target_identity_ambiguous/u);
  assert.throws(() => selectPostcoldTarget([{ ...target, deviceName: 'other' }]), /inspector_target_identity_ambiguous/u);
  assert.throws(() => selectPostcoldTarget([{ ...target, type: 'page' }]), /inspector_target_identity_invalid/u);
  assert.throws(() => selectPostcoldTarget([{ ...target, webSocketDebuggerUrl: 'ws://127.0.0.1:8081/inspector/1' }]), /inspector_target_identity_invalid/u);
});

test('a post-cold pass requires exact old-prefix absence, guest cleanup, both registries, and protected controls', () => {
  const { stage1, removal, baseline } = evidenceFixture();
  const expected = buildPostcoldExpected(stage1, removal, baseline);
  const result = {
    schemaVersion: 'bizq01-guest-removal-postcold-v1', result: 'passed', stage: 'complete',
    profileTransitionActive: false, activeLearningWorkPresent: false, guestKind: 'guest', selectedGuestMatches: true,
    datasetIdSha256: NEW, installationIdSha256: digest('new-installation'), accountProfileCount: 9, guestProfileCount: 1,
    profileIdentityInventorySha256: expected.profileIdentityInventorySha256, guestKeyCount: 3, guestRecordCount: 0, guestMetadataKeyCount: 3,
    guestKeyInventorySha256: digest('guest-keys'), canaryFamilyKeyCount: 0, canaryFamilyKeyInventorySha256: digest('canary-keys'),
    oldPrefixKeyCount: 0, registrySlotAValid: true, registrySlotBValid: true, registrySlotsMatchExpected: true,
    oldGuestAbsentBothSlots: true, replacementSelectedBothSlots: true, logoutControlValid: true, logoutControlMatchesRemoval: true,
    pendingPairCount: 6, pendingPairInventorySha256: expected.pendingPairInventorySha256, pendingUidInventorySha256: expected.pendingUidInventorySha256,
    removalJournalAbsent: true, accountStateSha256: expected.accountStateSha256, globalStateSha256: expected.globalStateSha256,
    logoutControlSha256: expected.logoutControlSha256,
  };
  assert.equal(validatePostcoldResult(result, expected), result);
  for (const mutation of [
    { oldPrefixKeyCount: 1 }, { profileTransitionActive: true }, { activeLearningWorkPresent: true },
    { removalJournalAbsent: false }, { oldGuestAbsentBothSlots: false }, { accountStateSha256: digest('changed') },
  ]) assert.throws(() => validatePostcoldResult({ ...result, ...mutation }, expected), /postcold_result_invalid/u);
  assert.throws(() => validatePostcoldResult({ ...result, fabricated: true }, expected), /postcold_result_invalid/u);
  assert.deepEqual(validatePostcoldResult({ schemaVersion: result.schemaVersion, result: 'failed', stage: 'old_prefix_inspection_failed' }, expected), {
    schemaVersion: result.schemaVersion, result: 'failed', stage: 'old_prefix_inspection_failed',
  });
  assert.throws(() => validatePostcoldResult({ schemaVersion: result.schemaVersion, result: 'failed', stage: 'other_error' }, expected), /postcold_result_invalid/u);
});

test('Inspector expression uses only initialized read surfaces and the exact four SecureStore controls', () => {
  const expression = evaluatePostcoldExpression('fixed-private-marker', { replacementDatasetIdSha256: NEW });
  assert.match(expression, /inspectRemovedOriginalGuest34/u);
  assert.match(expression, /oldPrefixKeyCount!==0/u);
  assert.match(expression, /patternly\.profile-root\.v1\.a/u);
  assert.match(expression, /patternly\.profile-root\.v1\.b/u);
  assert.match(expression, /patternly\.local-logout-control\.v2/u);
  assert.match(expression, /patternly\.profile-removal\.v1/u);
  assert.doesNotMatch(expression, /remove\(|setString\(|setItemAsync\(|loadModule\(|awaitPromise\s*:\s*true/u);
  assert.match(expression, /console\.log\(marker,JSON\.stringify\(x\)\)/u);
});
