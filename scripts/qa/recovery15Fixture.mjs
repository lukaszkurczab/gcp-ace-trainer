import { createRequire } from 'node:module';
import { readFile, writeFile, lstat } from 'node:fs/promises';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { FirestoreUserStore } from '../../../patternly-backend/src/modules/users/store.ts';
import { PseudonymKeyRing } from '../../../patternly-backend/src/infrastructure/security/pseudonymKeyRing.ts';

// Owner-authorized disposable fixture only. No delete command: deletion must
// pass through the real app lifecycle and its proof-gated local cleanup.
const [action, manifestPath, operationHash, ...extra] = process.argv.slice(2);
if (!['prepare', 'inspect'].includes(action) || !manifestPath || extra.length) throw Error('arguments_rejected');
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:19099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:18081';
const require = createRequire(new URL('../../../patternly-backend/package.json', import.meta.url));
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const hash = value => createHash('sha256').update(value).digest('hex');
const app = initializeApp({ projectId: 'patternly-app-sandbox' }, 'b4-disposable-native15');
const db = getFirestore(app), auth = getAuth(app);
try {
  let manifest;
  if (action === 'prepare') {
    if (operationHash) throw Error('arguments_rejected');
    const uid = `b4-native15-${randomUUID()}`;
    const email = `${uid}@example.invalid`;
    manifest = { fixtureOnly: true, projectId: 'patternly-app-sandbox', uid, uidSha256: hash(uid), email, password: randomBytes(32).toString('hex'), accountId: null, accountIdSha256: null };
    await writeFile(manifestPath, JSON.stringify(manifest), { mode: 0o600, flag: 'wx' });
    const secretsPath = new URL('../../../patternly-backend/.local/smoke/secrets.json', import.meta.url);
    if (((await lstat(secretsPath)).mode & 0o077) !== 0) throw Error('private_input_rejected');
    const secrets = JSON.parse(await readFile(secretsPath, 'utf8'));
    const ring = new PseudonymKeyRing([{ version: 'local-v1', status: 'active', keyBase64: Buffer.from(secrets.storageKey, 'hex').toString('base64') }]);
    await auth.createUser({ uid, email, password: manifest.password, emailVerified: true });
    const result = await new FirestoreUserStore(db, ring).registerUser({ provider: 'firebase', subject: uid, email, emailVerified: true, authTime: Math.floor(Date.now() / 1000) }, { termsVersion: 'qa15', termsLocale: 'en', privacyPolicyVersion: 'qa15', privacyPolicyLocale: 'en', privacyPolicyAcknowledged: true });
    if (!result.created) throw Error('fixture_identity_rejected');
    manifest = { ...manifest, accountId: result.user.id, accountIdSha256: hash(result.user.id) };
    await writeFile(manifestPath, JSON.stringify(manifest), { mode: 0o600 });
  } else {
    if (((await lstat(manifestPath)).mode & 0o077) !== 0) throw Error('private_input_rejected');
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  }
  if (manifest.fixtureOnly !== true || manifest.projectId !== 'patternly-app-sandbox' || !manifest.uid?.startsWith('b4-native15-')
    || hash(manifest.uid) !== manifest.uidSha256 || hash(manifest.accountId ?? '') !== manifest.accountIdSha256) throw Error('fixture_identity_rejected');
  let authExists = true;
  try { await auth.getUser(manifest.uid); } catch (error) { if (error.code !== 'auth/user-not-found') throw error; authExists = false; }
  const user = await db.collection('users').doc(manifest.accountId).get();
  const docs = operationHash ? (await db.collection('accountDeletionOperations').get()).docs.filter(doc => hash(doc.id) === operationHash) : (await db.collection('accountDeletionOperations').where('userId', '==', manifest.accountId).get()).docs;
  const operations = await Promise.all(docs.map(async doc => {
    const data = doc.data();
    const proof = data.proofId ? await db.collection('deletionProofs').doc(data.proofId).get() : null;
    return { operationIdSha256: hash(doc.id), phase: data.phase, status: data.status, operationSecretSha256: data.operationSecretHash, proofIdSha256: data.proofId ? hash(data.proofId) : null, proofPresent: proof?.exists ?? false, proofStatus: proof?.get('status') ?? null };
  }));
  console.log(JSON.stringify({ fixtureOnly: true, uidSha256: manifest.uidSha256, accountIdSha256: manifest.accountIdSha256, authExists, userExists: user.exists, authorizationGeneration: user.get('authorizationGeneration') ?? null, operations }));
} catch { console.error(JSON.stringify({ stage: 'native_deletion_fixture', category: 'fixture_failed' })); process.exitCode = 1; }
finally { await db.terminate(); await deleteApp(app); }
