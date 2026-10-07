#!/usr/bin/env node
// No-effect attestation: initialized public exports and named NONSECRET controls only.
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import WebSocket from 'ws';

const output = process.argv[2];
if (!output?.startsWith('docs/active/BIZQ-01/premium-completion-33/')) throw new Error('owned_output_required');

const provision = JSON.parse(readFileSync('docs/active/BIZQ-01/premium-completion-33/ACCOUNT-PROVISION-RESULT.json', 'utf8'));
const prior = JSON.parse(readFileSync('docs/active/BIZQ-01/premium-native-path-31/PUBLIC-RUNTIME-PREFLIGHT.json', 'utf8'));
if (provision.ok !== true || provision.created !== true || provision.distinctFromExistingAccounts !== true
  || typeof provision.accountIdSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(provision.accountIdSha256)
  || typeof provision.uidSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(provision.uidSha256)
  || prior.ok !== true || prior.profile?.kind !== 'guest'
  || typeof prior.profile?.selectedIdSha256 !== 'string'
  || !Array.isArray(prior.registry?.profileIdentityHashes)
  || !Array.isArray(prior.logout?.pendingPairHashes)
  || !Array.isArray(prior.logout?.pendingUidHashes)) throw new Error('safe_baseline_unavailable');

const marker = `[bizq33-account-profile-probe]:${randomUUID()}`;
const pages = await (await fetch('http://[::1]:8081/json/list', { signal: AbortSignal.timeout(5000) })).json();
const page = pages.find(p => p.appId === 'com.lkurczab.patternly' && p.deviceName === 'iPhone 17');
if (!page?.webSocketDebuggerUrl || !page.webSocketDebuggerUrl.startsWith('ws://[::1]:8081/')) throw new Error('existing_iphone17_inspector_unavailable');

const expression = `(() => {
  const marker = ${JSON.stringify(marker)};
  const expectedAccountHash = ${JSON.stringify(provision.accountIdSha256)};
  const expectedGuestHash = ${JSON.stringify(prior.profile.selectedIdSha256)};
  const expectedProfiles = ${JSON.stringify(prior.registry.profileIdentityHashes)};
  const expectedPendingPairs = ${JSON.stringify([...prior.logout.pendingPairHashes].sort())};
  const expectedPendingUids = ${JSON.stringify([...prior.logout.pendingUidHashes].sort())};
  const expectedBlockedPair = ${JSON.stringify(prior.logout.blockedPairSha256 ?? null)};
  let stage = 'initialized_modules';
  const send = value => console.log(marker, JSON.stringify(value));
  const fail = reason => { throw new Error(reason); };
  const sortedEqual = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  (async () => {
    const registry = globalThis.__r;
    if (typeof registry?.getModules !== 'function') fail('module_registry_unavailable');
    const modules = [...registry.getModules().values()];
    const initialized = suffix => {
      const matches = modules.filter(m => m.verboseName === suffix || m.verboseName?.endsWith('/' + suffix));
      if (matches.length !== 1 || matches[0].isInitialized !== true) fail('required_module_uninitialized');
      return matches[0].publicModule.exports;
    };
    const mmkv = initialized('src/infrastructure/storage/mmkvClient.ts');
    const secure = initialized('node_modules/expo-secure-store/build/SecureStore.js');
    const sha = initialized('src/infrastructure/identity/sha256.ts').sha256Utf8;
    const runtime = initialized('src/infrastructure/runtime/runtimeMode.ts');
    const config = initialized('src/infrastructure/firebase/publicConfig.ts');
    if (typeof sha !== 'function' || typeof secure.getItemAsync !== 'function') fail('required_public_export_unavailable');
    stage = 'published_account_profile';
    const active = mmkv.getActiveStorageProfileOrNull();
    if (!active || active.kind !== 'account' || typeof active.accountId !== 'string' || mmkv.isProfileTransitionActive()) fail('active_profile_not_stable_account');
    if (runtime.readPatternlyRuntimeMode() !== 'smoke') fail('runtime_guard_mismatch');
    const firebase = config.readFirebaseClientConfiguration();
    if (firebase.kind !== 'configured' || firebase.value.projectId !== 'patternly-app-sandbox'
      || config.readDevelopmentFirebaseAuthEmulatorOrigin() !== 'http://127.0.0.1:19099') fail('sandbox_runtime_guard_mismatch');
    const activeAccountHash = sha(active.accountId);
    if (activeAccountHash !== expectedAccountHash) fail('active_account_does_not_match_provision');

    stage = 'nonsecret_registry_read';
    const options = { keychainAccessible: secure.WHEN_UNLOCKED_THIS_DEVICE_ONLY, keychainService: 'com.lkurczab.patternly.encrypted-storage' };
    const slots = await Promise.all(['patternly.profile-root.v1.a', 'patternly.profile-root.v1.b'].map(k => secure.getItemAsync(k, options)));
    const roots = slots.map(raw => {
      if (raw === null) return null;
      const value = JSON.parse(raw);
      const { checksum, ...body } = value;
      if (sha(JSON.stringify(body)) !== checksum || body.version !== 1 || !Number.isSafeInteger(body.generation) || !Array.isArray(body.profiles)) fail('registry_checksum_or_shape_invalid');
      return value;
    }).filter(Boolean).sort((a, b) => b.generation - a.generation);
    if (!roots.length) fail('registry_missing');
    if (roots.length === 2 && roots[0].generation === roots[1].generation) fail('registry_generation_ambiguous');
    const root = roots[0];
    const selected = root.profiles.find(p => p.id === root.selectedProfileId);
    if (!selected || selected.id !== active.id || selected.kind !== active.kind || selected.accountId !== active.accountId) fail('registry_active_profile_mismatch');
    const identities = root.profiles.map(p => ({ idSha256: sha(p.id), kind: p.kind, accountIdSha256: p.accountId === null ? null : sha(p.accountId) }));
    const guestProfiles = identities.filter(p => p.kind === 'guest' || p.kind === 'legacy_guest');
    if (guestProfiles.length !== 1 || guestProfiles[0].idSha256 !== expectedGuestHash) fail('original_guest_not_retained');
    if (!identities.some(p => p.idSha256 === sha(selected.id) && p.kind === 'account' && p.accountIdSha256 === expectedAccountHash)) fail('selected_account_registry_mismatch');
    for (const baseline of expectedProfiles) {
      if (!identities.some(current => current.idSha256 === baseline.idSha256 && current.kind === baseline.kind && current.accountIdSha256 === baseline.accountIdSha256)) fail('baseline_profile_missing');
    }

    stage = 'nonsecret_logout_read';
    const controlRaw = await secure.getItemAsync('patternly.local-logout-control.v2', options);
    const control = controlRaw === null ? { version: 2, blocked: null, pending: [], completed: [] } : JSON.parse(controlRaw);
    if (control.version !== 2 || !Array.isArray(control.pending) || !Array.isArray(control.completed)) fail('logout_control_shape_invalid');
    const pairHash = p => { if (typeof p?.uid !== 'string' || typeof p.operationId !== 'string') fail('logout_control_entry_invalid'); return sha(JSON.stringify({ uid: p.uid, operationId: p.operationId })); };
    const pendingPairs = control.pending.map(pairHash).sort();
    const pendingUids = control.pending.map(p => sha(p.uid)).sort();
    const blockedPair = control.blocked === null ? null : pairHash(control.blocked);
    if (!sortedEqual(pendingPairs, expectedPendingPairs) || !sortedEqual(pendingUids, expectedPendingUids) || blockedPair !== expectedBlockedPair) fail('unrelated_logout_control_changed');

    send({ ok: true, readonly: true, runtimeMode: 'smoke', project: 'patternly-app-sandbox',
      profile: { kind: 'account', selectedIdSha256: sha(active.id), accountIdSha256: activeAccountHash, matchesProvisionedAccount: activeAccountHash === expectedAccountHash, transitionActive: false },
      registry: { generation: root.generation, selectedMatchesActive: true, accountProfiles: identities.filter(p => p.kind === 'account').length, guestProfiles: guestProfiles.length, originalGuestRetained: true, profileIdentityHashes: identities },
      logout: { present: controlRaw !== null, blockedPairSha256: blockedPair, pendingPairHashes: pendingPairs, pendingUidHashes: pendingUids, matchesUnrelatedPendingBaseline: true },
      authUidBinding: 'not_attested_provider_access_prohibited',
      limits: 'Initialized public profile/runtime exports and named NONSECRET SecureStore controls only; no guest repository, bootstrap/factory/migration/writes, auth provider/session/token, credentials, encryption keys, config values, or whole-store claim' });
  })().catch(error => {
    const allowed = new Set(['module_registry_unavailable','required_module_uninitialized','required_public_export_unavailable','active_profile_not_stable_account','runtime_guard_mismatch','sandbox_runtime_guard_mismatch','active_account_does_not_match_provision','registry_checksum_or_shape_invalid','registry_missing','registry_generation_ambiguous','registry_active_profile_mismatch','original_guest_not_retained','selected_account_registry_mismatch','baseline_profile_missing','logout_control_shape_invalid','logout_control_entry_invalid','unrelated_logout_control_changed']);
    send({ ok: false, stage, reason: allowed.has(error?.message) ? error.message : 'unexpected_probe_failure' });
  });
})()`;

const socket = new WebSocket(page.webSocketDebuggerUrl, { origin: 'http://127.0.0.1:8081' });
let finished = false;
const timeout = setTimeout(() => finish({ ok: false, stage: 'inspector_timeout' }), 30000);
function finish(result) {
  if (finished) return;
  finished = true;
  clearTimeout(timeout);
  socket.close();
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
socket.on('open', () => socket.send(JSON.stringify({ id: 1, method: 'Runtime.enable' })));
socket.on('message', data => {
  let event;
  try { event = JSON.parse(data.toString()); } catch { return; }
  if (event.id === 1) {
    if (event.error) finish({ ok: false, stage: 'inspector_enable' });
    else socket.send(JSON.stringify({ id: 2, method: 'Runtime.evaluate', params: { expression, awaitPromise: false, returnByValue: true } }));
    return;
  }
  if (event.method !== 'Runtime.consoleAPICalled' || event.params?.args?.[0]?.value !== marker) return;
  try { finish(JSON.parse(event.params.args[1].value)); } catch { finish({ ok: false, stage: 'probe_message' }); }
});
socket.on('error', () => finish({ ok: false, stage: 'inspector_connection' }));
