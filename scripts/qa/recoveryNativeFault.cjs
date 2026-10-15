// Optional prelude for the existing local SEC03 development app only.
// Require and install before importing App so SDK/API clients capture this transport.
const key = '__patternlyRecovery14Fault';
exports.install = (fingerprint) => {
  const config = require('expo-constants').default.expoConfig;
  if (!__DEV__ || !globalThis.HermesInternal || config?.ios?.bundleIdentifier !== 'com.lkurczab.patternly.sec03'
    || config.extra?.patternlyEnvironmentFingerprint !== fingerprint) throw Error('runtime_rejected');
  if (globalThis[key]) throw Error('state_rejected');
  const fault = { original: globalThis.fetch, action: null, hits: [], armed: false, target: null, waiters: [] };
  globalThis[key] = fault;
  const hash = value => require('../../src/infrastructure/identity/sha256').sha256Utf8(value);
  const assertDeletionProfile = () => {
    const storage = require('../../src/infrastructure/storage/mmkvClient');
    const profile = storage.getActiveStorageProfileOrNull() ?? storage.capturePreparedProfileStorageLease()?.profile;
    if (profile?.kind !== 'account' || hash(profile.accountId) !== fault.target?.accountIdSha256) throw Error('fixture_profile_rejected');
  };
  // Real Keychain write port; the production drain has already checked the SDK
  // UID/generation before requesting this exact completion write.
  const secure = require('expo-secure-store/build/ExpoSecureStore').default;
  const secureSet = secure.setValueWithKeyAsync;
  secure.setValueWithKeyAsync = async (value, storageKey, options) => {
    if (fault.action === 'hold-revoke-completion' && storageKey === 'patternly.local-logout-control.v2'
      && options?.keychainService === 'com.lkurczab.patternly.encrypted-storage') {
      const next = JSON.parse(value);
      const pair = next.completed?.find(p => hash(p.uid) === fault.target?.uidSha256 && hash(p.operationId) === fault.target?.operationIdSha256);
      if (pair && next.pending.length === 0) {
        const sdk = require('firebase/auth');
        const app = require('firebase/app').getApps().find(app => app.name === 'patternly' && app.options.projectId === 'patternly-app-sandbox');
        if (!app) throw Error('fixture_identity_rejected');
        const auth = sdk.getAuth(app);
        const user = auth.currentUser;
        if (!user || user.uid !== pair.uid) throw Error('fixture_identity_rejected');
        const claims = await sdk.getIdTokenResult(user, false);
        if (!Number.isSafeInteger(claims.claims.authorizationGeneration)) throw Error('fixture_generation_rejected');
        fault.hits.push({ stage: 'sdk-session-before-local-ack', operationIdSha256: hash(pair.operationId), uidSha256: hash(user.uid), authorizationGeneration: claims.claims.authorizationGeneration });
        return new Promise(() => {});
      }
    }
    return secureSet.call(secure, value, storageKey, options);
  };
  globalThis.fetch = async (...args) => {
    const input = args[0];
    const url = new URL(typeof input === 'string' ? input : input?.url ?? String(input));
    if (url.origin !== 'http://127.0.0.1:8080' || !fault.action) return fault.original(...args);
    const path = url.pathname;
    if (fault.action === 'hold-deletion' && path === '/v1/account/deletion') {
      assertDeletionProfile();
      fault.hits.push({ stage: 'durable-intent-before-deletion-send', path });
      return new Promise(() => {});
    }
    if (fault.action === 'hold-deletion-proof' && path.startsWith('/v1/public/deletion-proofs/')) {
      assertDeletionProfile();
      const response = await fault.original(...args);
      if (!response.ok) return response;
      fault.hits.push({ stage: 'remote-proof-before-local-cleanup', status: response.status });
      await new Promise(resolve => fault.waiters.push(resolve));
      return response;
    }
    const revokeAction = ['hold-revoke', 'lose-revoke-response'].includes(fault.action);
    const target = revokeAction ? '/v1/account/session/revoke' : fault.action === 'lose-issue-response' ? '/v1/account/recovery-codes'
      : fault.action === 'lose-issue-ack-response' ? '/v1/account/recovery-codes/issue/saved-ack'
      : fault.action === 'lose-consume-response' ? '/v1/public/recovery-codes/consume'
      : '/v1/account/recovery-codes/consume/ack';
    const statusPath = fault.action === 'lose-consume-response' ? '/v1/public/recovery-codes/consume/status'
      : '/v1/account/recovery-codes/issue/status';
    if ((fault.action === 'hold-consume-ack' || fault.action === 'hold-revoke') && path === target) {
      fault.hits.push({ stage: 'before-send', path });
      return new Promise(() => {});
    }
    if (revokeAction && path === target && !fault.armed) {
      fault.hits.push({ stage: 'retry-before-send', path });
      throw TypeError('qa_response_lost');
    }
    if (fault.action !== 'hold-consume-ack' && path === statusPath) {
      fault.hits.push({ stage: 'status-before-send', path });
      throw TypeError('qa_response_lost');
    }
    const response = await fault.original(...args);
    if (path === target && response.ok && fault.armed) {
      fault.armed = false;
      fault.hits.push({ stage: 'after-http-success', path, status: response.status });
      throw TypeError('qa_response_lost');
    }
    return response;
  };
};
exports.arm = (action, target = null) => {
  if (!['lose-issue-response', 'lose-issue-ack-response', 'lose-consume-response', 'hold-consume-ack', 'hold-revoke', 'lose-revoke-response', 'hold-revoke-completion', 'hold-deletion', 'hold-deletion-proof', 'fail-deletion-cleanup', 'restore-fetch'].includes(action)) throw Error('arguments_rejected');
  const fault = globalThis[key];
  if (!fault) throw Error('owner_unavailable');
  fault.action = action === 'restore-fetch' ? null : action;
  fault.hits = [];
  fault.armed = true;
  fault.target = target;
  if (['hold-deletion', 'hold-deletion-proof', 'fail-deletion-cleanup'].includes(action)
    && !/^[a-f0-9]{64}$/.test(target?.accountIdSha256 ?? '')) throw Error('arguments_rejected');
  if (action === 'hold-revoke-completion' && (!/^[a-f0-9]{64}$/.test(target?.uidSha256 ?? '')
    || !/^[a-f0-9]{64}$/.test(target?.operationIdSha256 ?? ''))) throw Error('arguments_rejected');
  if (action === 'fail-deletion-cleanup' && !fault.cleanupInstalled) {
    const codec = require('../../src/storage/repositories/canonicalRecordCodec');
    const remove = codec.removeCanonicalValue;
    codec.removeCanonicalValue = storageKey => {
      if (fault.action !== 'fail-deletion-cleanup' || !fault.armed) return remove(storageKey);
      const storage = require('../../src/infrastructure/storage/mmkvClient');
      const profile = storage.getActiveStorageProfileOrNull();
      const hash = require('../../src/infrastructure/identity/sha256').sha256Utf8;
      if (profile?.kind !== 'account' || hash(profile.accountId) !== fault.target.accountIdSha256) throw Error('fixture_profile_rejected');
      const isLearning = require('../../src/storage/repositories/accountDataRepository').isGuestOwnedLearningKey;
      if (!isLearning(storageKey)) return remove(storageKey);
      remove(storageKey);
      fault.armed = false;
      fault.hits.push({ stage: 'after-one-local-learning-removal', removedKeySha256: hash(storageKey), remainingLearningKeys: storage.getKeyValueStorage().getAllKeys().filter(isLearning).length });
      throw Error('fixture_cleanup_interrupted');
    };
    fault.cleanupInstalled = true;
  }
  if (action === 'fail-deletion-cleanup') fault.waiters.splice(0).forEach(resolve => resolve());
  return { armed: fault.action };
};
