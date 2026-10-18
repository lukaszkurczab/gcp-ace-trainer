import assert from 'node:assert/strict';
import test from 'node:test';
import { faultPreservationChanges, preservationChanges } from './androidForegroundClockKillProbe.mjs';

function pair() {
  const hash = value => value.repeat(64);
  const observation = { profileSha256: hash('a'), accountSha256: hash('b'), contentSha256: hash('c'),
    providerObservedMs: 1000, serverObservedMs: 1000, maxObservedWallTime: 1000, observedWallMs: 1000 };
  const binding = { profileSha256: hash('a'), accountSha256: hash('b'), uidSha256: hash('d'), checksum: hash('e'),
    schema: 'patternly.account-binding.v1', profileKind: 'account', verificationRevision: 1 };
  const before = { inventory: [{ key: 'patternly:premium-cache:v2', sha256: hash('1'), premiumObservation: observation }], preservationBinding: binding };
  const after = structuredClone(before);
  after.inventory[0].sha256 = hash('2');
  Object.assign(after.inventory[0].premiumObservation, { providerObservedMs: 2000, serverObservedMs: 2000, observedWallMs: 2000, maxObservedWallTime: 2000 });
  return [before, after];
}

test('only fault comparison admits bounded valid cache observation refresh', () => {
  const [a, b] = pair();
  assert.equal(preservationChanges(a.inventory, b.inventory)[0].category, 'premium_cache_requires_review');
  assert.equal(faultPreservationChanges(a, b)[0].category, 'premium_observation_refresh');
  b.preservationBinding.verificationRevision++;
  b.preservationBinding.checksum = 'f'.repeat(64);
  assert.equal(faultPreservationChanges(a, b)[0].bindingRevisionAdvanced, true);
});

test('cache comparison rejects scope, metadata, observation rollback and unrelated data changes', () => {
  const edits = [
    (a, b) => { delete b.preservationBinding; },
    (a, b) => { b.preservationBinding.accountSha256 = 'f'.repeat(64); },
    (a, b) => { b.preservationBinding.uidSha256 = 'f'.repeat(64); },
    (a, b) => { b.preservationBinding.profileSha256 = 'f'.repeat(64); },
    (a, b) => { b.preservationBinding.profileKind = 'guest'; },
    (a, b) => { b.preservationBinding.schema = 'other'; },
    (a, b) => { b.preservationBinding.checksum = 'f'.repeat(64); },
    (a, b) => { a.preservationBinding.verificationRevision = 2; },
    (a, b) => { delete b.inventory[0].premiumObservation; },
    (a, b) => { b.inventory[0].premiumObservation.contentSha256 = 'f'.repeat(64); },
    ...['profileSha256', 'accountSha256'].map(key => (a, b) => { b.inventory[0].premiumObservation[key] = 'f'.repeat(64); }),
    ...['providerObservedMs', 'serverObservedMs', 'maxObservedWallTime', 'observedWallMs'].map(key => (a, b) => { b.inventory[0].premiumObservation[key] = 999; }),
    (a, b) => { b.inventory[0].premiumObservation.maxObservedWallTime = 3001; },
  ];
  for (const edit of edits) {
    const [a, b] = pair(); edit(a, b);
    assert.equal(faultPreservationChanges(a, b)[0].category, 'premium_cache_requires_review');
  }
  const [a, b] = pair();
  a.inventory.push({ key: 'progress', sha256: 'before' }); b.inventory.push({ key: 'progress', sha256: 'after' });
  assert.equal(faultPreservationChanges(a, b)[1].category, 'unexplained_change');
});

test('verified binding is required independently of inventory byte changes', () => {
  for (const mutate of [b => { delete b.preservationBinding; },
    b => { b.preservationBinding.accountSha256 = 'f'.repeat(64); },
    b => { b.preservationBinding.uidSha256 = 'f'.repeat(64); },
    b => { b.preservationBinding.verificationRevision = 0; }]) {
    const [a] = pair(), b = structuredClone(a); mutate(b);
    assert.equal(faultPreservationChanges(a, b).at(-1).category, 'account_binding_scope_changed');
  }
  const [a] = pair(), b = structuredClone(a);
  b.preservationBinding.verificationRevision = 2; b.preservationBinding.checksum = 'f'.repeat(64);
  assert.equal(faultPreservationChanges(a, b)[0].category, 'verified_binding_revision_advanced');
});
