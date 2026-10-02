/** Read-only Admin evidence for one owned local native consume interruption. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const probe = 'ZZZZ-ZZZZ-ZZZZ-ZZZZ';
const reject = () => { throw new Error('owned_fixture_contract'); };

function readPrivate(file) {
  const before = fs.lstatSync(file);
  const parent = fs.lstatSync(path.dirname(file));
  if (!parent.isDirectory() || parent.isSymbolicLink()
    || (path.dirname(file) !== '/private/tmp' && (parent.uid !== process.getuid() || (parent.mode & 0o777) !== 0o700))
    || !before.isFile() || before.isSymbolicLink() || before.uid !== process.getuid() || before.nlink !== 1 || (before.mode & 0o777) !== 0o600 || before.size > 16384) reject();
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const opened = fs.fstatSync(fd);
    if (opened.ino !== before.ino || opened.dev !== before.dev) reject();
    const bytes = fs.readFileSync(fd);
    const after = fs.fstatSync(fd);
    const current = fs.lstatSync(file);
    if ([after, current].some((s) => s.ino !== opened.ino || s.dev !== opened.dev || s.size !== opened.size || s.mtimeMs !== opened.mtimeMs)) reject();
    return JSON.parse(bytes);
  } finally { fs.closeSync(fd); }
}

function writePrivate(file, data) {
  const parent = fs.lstatSync(path.dirname(file));
  if (!parent.isDirectory() || parent.isSymbolicLink() || parent.uid !== process.getuid() || (parent.mode & 0o777) !== 0o700) reject();
  const fd = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(data)); } finally { fs.closeSync(fd); }
}

function verifySources() {
  const result = {};
  for (const [name, repo] of [['CONSUMER-SOURCE-PINS-v17.json', 'patternly'], ['PRODUCER-SOURCE-PINS-v12c.json', 'patternly-backend']]) {
    const file = path.join(workspace, 'patternly/docs/active/AUD-08/evidence/B3', name);
    const bytes = fs.readFileSync(file);
    const manifest = JSON.parse(bytes);
    for (const [relative, digest] of Object.entries(manifest.files)) {
      if (path.isAbsolute(relative) || relative.split('/').includes('..') || sha(fs.readFileSync(path.join(workspace, repo, relative))) !== digest) reject();
    }
    result[name] = sha(bytes);
  }
  return result;
}

const [phase, root, bindingPath, codesPath] = process.argv.slice(2);
let app, db;
let stage = 'CONFIG';
try {
  if (!['prepare', 'probe', 'held', 'post', 'finish'].includes(phase) || !path.isAbsolute(root ?? '') || process.argv.length !== (phase === 'prepare' ? 6 : 4)) reject();
  const beforePins = verifySources();
  let config;
  if (phase === 'prepare') {
    const binding = readPrivate(bindingPath);
    const saved = readPrivate(codesPath);
    if (typeof binding.uid !== 'string' || typeof binding.userId !== 'string' || !Number.isSafeInteger(binding.authorizationGeneration) || binding.authorizationGeneration < 1
      || !Array.isArray(saved.codes) || saved.codes.length !== 10 || new Set(saved.codes).size !== 10
      || saved.codes.some((c) => typeof c !== 'string' || !/^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/u.test(c))) reject();
    // Index zero was consumed by the historical v14 run. Verify index one is
    // actually unused and still owned below; never infer validity from index.
    config = { uid: binding.uid, userId: binding.userId, generation: binding.authorizationGeneration, code: saved.codes[1] };
  } else config = readPrivate(path.join(root, 'config.private.json'));
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:18081';
  const require = createRequire(path.join(workspace, 'patternly-backend/package.json'));
  const admin = require('firebase-admin/app');
  app = admin.initializeApp({ projectId: 'patternly-app-sandbox' }, 'aud08-native-interruption-readonly');
  db = require('firebase-admin/firestore').getFirestore(app);
  stage = 'OWNED_READBACK';
  const baseline = phase === 'prepare' ? null : readPrivate(path.join(root, 'baseline.private.json'));
  const smokeSecrets = readPrivate(path.join(workspace, 'patternly-backend/.local/smoke/secrets.json'));
  if (!/^[a-f0-9]{64}$/u.test(smokeSecrets.hmacKey ?? '')) reject();
  const requesterHash = crypto.createHmac('sha256', smokeSecrets.hmacKey).update('patternly:recovery-operation-rate-limit:v1\0').update('127.0.0.1').digest('hex');
  let privateEvidence;
  const summary = await db.runTransaction(async (tx) => {
    const userRef = db.collection('users').doc(config.userId);
    const mappingRef = db.collection('identityMappings').doc(sha(`firebase:${config.uid}`));
    const codeRef = db.collection('recoveryCodeIndex').doc(sha(config.code));
    const fakeRef = db.collection('recoveryCodeIndex').doc(sha(probe));
    const [user, mapping, code, fake, metadata] = await tx.getAll(userRef, mappingRef, codeRef, fakeRef, userRef.collection('security').doc('recoveryCodes'));
    const operations = await tx.get(db.collection('accountRecoveryOperations').where('userId', '==', config.userId).limit(21));
    // dev:smoke fixes max=30/window=60s. Read the exact loopback bucket;
    // the synthetic request still consumes one rate-budget unit.
    const windowStartMs = Math.floor(Date.now() / 60000) * 60000;
    const rate = await tx.get(db.collection('rateLimitBuckets').doc(sha(`recovery-request:${requesterHash}:${windowStartMs}`)));
    const rateCount = rate.exists ? rate.data().count : 0;
    if (!Number.isSafeInteger(rateCount) || rateCount < 0 || rateCount > 30
      || (rate.exists && (rate.data().purpose !== 'recovery_request' || rate.data().requesterHash !== requesterHash || rate.data().windowStartMs !== windowStartMs))
      || (['prepare', 'probe'].includes(phase) && 30 - rateCount < 8)) reject();
    const u = user.data(), m = mapping.data(), c = code.data();
    if (!user.exists || !mapping.exists || !code.exists || fake.exists || !metadata.exists || operations.size > 20
      || m.provider !== 'firebase' || m.subject !== config.uid || m.userId !== config.userId || u.deletedAt !== undefined
      || c.userId !== config.userId || metadata.data().count !== 10 || c.generationId !== metadata.data().generationId) reject();
    const rows = operations.docs.map((d) => ({ id: d.id, data: d.data() }));
    if (phase === 'prepare' || phase === 'probe') {
      if (u.authorizationGeneration !== config.generation || u.securityOperation !== undefined || c.usedAt !== null || (u.authorizationState !== undefined && u.authorizationState !== 'active')) reject();
      if (phase === 'probe' && (rows.length !== baseline.operations.length || rows.some((r) => !baseline.operations.some((b) => b.id === r.id && b.digest === sha(JSON.stringify(r.data)))))) reject();
      if (phase === 'prepare') privateEvidence = { operations: rows.map((r) => ({ id: r.id, digest: sha(JSON.stringify(r.data)) })) };
      return { ok: true, phase, exactCodeUnused: true, syntheticCodeAbsent: true, ownedOperationCount: rows.length, priorOperationsUnchanged: phase === 'probe', currentRateWindowCount: rateCount, rateBudgetRemaining: 30 - rateCount, readOnlyAdmin: true };
    }
    const fresh = rows.filter((r) => !baseline.operations.some((b) => b.id === r.id));
    if (fresh.length !== 1 || rows.length !== baseline.operations.length + 1 || rows.some((r) => baseline.operations.some((b) => b.id === r.id && b.digest !== sha(JSON.stringify(r.data))))) reject();
    const current = fresh[0], op = current.data;
    const result = await tx.get(db.collection('accountRecoveryOperationResults').doc(current.id));
    if (op.kind !== 'recovery' || op.firebaseUid !== config.uid || op.expectedAuthorizationGeneration !== config.generation
      || op.resultingAuthorizationGeneration !== config.generation + 1 || u.authorizationGeneration !== config.generation + 1 || c.usedAt === null) reject();
    if (phase === 'held') {
      if (op.status !== 'result_available' || !result.exists || u.securityOperation?.operationId !== current.id || op.resultExpiresAt.toMillis() <= Date.now()) reject();
      privateEvidence = { operationId: current.id };
      return { ok: true, phase, exactlyOneNewOwnedConsume: true, resultAvailable: true, codeUsed: true, generationAdvancedByOne: true, priorOperationsUnchanged: true, currentRateWindowCount: rateCount, readOnlyAdmin: true };
    }
    const held = readPrivate(path.join(root, 'held.private.json'));
    if (current.id !== held.operationId || op.status !== 'acknowledged' || result.exists || u.securityOperation !== undefined
      || op.expiresAt.toMillis() - op.terminalAt.toMillis() !== 30 * 86400000) reject();
    return { ok: true, phase, sameOperationAcknowledged: true, resultAbsent: true, generationAdvancedByOne: true, securitySlotClear: true, priorOperationsUnchanged: true, currentRateWindowCount: rateCount, codeCount: 10, historyRetentionDays: 30, readOnlyAdmin: true };
  }, { readOnly: true });
  if (JSON.stringify(verifySources()) !== JSON.stringify(beforePins)) reject();
  if (phase === 'prepare') {
    writePrivate(path.join(root, 'baseline.private.json'), privateEvidence);
    writePrivate(path.join(root, 'config.private.json'), config);
  }
  if (phase === 'held') writePrivate(path.join(root, 'held.private.json'), privateEvidence);
  if (phase === 'finish') {
    // Advance only the local fixture handoff after the same-operation terminal
    // readback above; this does not write Auth or Firestore.
    stage = 'LOCAL_BINDING_HANDOFF';
    const bindingFile = '/private/tmp/aud08-owned-fixture-binding.json';
    const binding = readPrivate(bindingFile);
    if (binding.uid !== config.uid || binding.userId !== config.userId || binding.authorizationState !== 'active'
      || binding.pendingOperationId !== null || ![config.generation, config.generation + 1].includes(binding.authorizationGeneration)) reject();
    if (binding.authorizationGeneration === config.generation) {
      writePrivate(path.join(root, 'binding-before.private.json'), binding);
      const nextFile = path.join(root, 'binding-next.private.json');
      writePrivate(nextFile, { ...binding, authorizationGeneration: config.generation + 1, checkedAt: new Date().toISOString() });
      if (JSON.stringify(readPrivate(bindingFile)) !== JSON.stringify(binding)) reject();
      fs.renameSync(nextFile, bindingFile);
    }
    const verified = readPrivate(bindingFile);
    if (verified.uid !== config.uid || verified.userId !== config.userId || verified.authorizationGeneration !== config.generation + 1) reject();
    summary.localFixtureBindingAdvancedAndVerified = true;
    summary.authOrFirestoreWrites = false;
  }
  console.log(JSON.stringify(summary));
} catch {
  console.log(JSON.stringify({ ok: false, phase: ['prepare', 'probe', 'held', 'post', 'finish'].includes(phase) ? phase : 'invalid', stage, rawErrorEmitted: false }));
  process.exitCode = 1;
} finally {
  if (db) await db.terminate().catch(() => {});
  if (app) await createRequire(path.join(workspace, 'patternly-backend/package.json'))('firebase-admin/app').deleteApp(app).catch(() => {});
}
