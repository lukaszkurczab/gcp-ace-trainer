import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const [accountIdSha256, ...extra] = process.argv.slice(2);
if (extra.length || !/^[a-f0-9]{64}$/u.test(accountIdSha256 ?? '')) throw Error('arguments_rejected');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:18081';
const require = createRequire(new URL('../../../patternly-backend/package.json', import.meta.url));
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const hash = value => createHash('sha256').update(value).digest('hex');
const app = initializeApp({ projectId: 'patternly-app-sandbox' }, 'recovery14-read');
const db = getFirestore(app);
try {
  const matches = (await db.collection('users').get()).docs.filter(doc => hash(doc.id) === accountIdSha256);
  if (matches.length !== 1) throw Error('account_rejected');
  const user = matches[0], data = user.data();
  const operations = await db.collection('accountRecoveryOperations').where('userId', '==', user.id).get();
  const receipts = await Promise.all(operations.docs.map(async doc => {
    const op = doc.data(), result = await db.collection('accountRecoveryOperationResults').doc(doc.id).get();
    return { operationIdSha256: hash(doc.id), kind: op.kind, status: op.status,
      generation: op.expectedAuthorizationGeneration ?? op.resultingAuthorizationGeneration ?? null, resultExists: result.exists,
      acknowledgedAt: op.acknowledgedAt ?? null, expiresAt: op.expiresAt?.toMillis?.() ?? null };
  }));
  const indices = await db.collection('recoveryCodeIndex').where('userId', '==', user.id).get();
  const revokes = await db.collection('sessionRevocationOperations').where('userId', '==', user.id).get();
  console.log(JSON.stringify({ schema: 'patternly.recovery-local-remote.v1', accountIdSha256,
    authorizationGeneration: data.authorizationGeneration, securityOperation: data.securityOperation ? { kind: data.securityOperation.kind, operationIdSha256: hash(data.securityOperation.operationId) } : null,
    operations: receipts.sort((a,b)=>a.operationIdSha256.localeCompare(b.operationIdSha256)),
    revokes: revokes.docs.map(doc=>({operationIdSha256:hash(doc.id),status:doc.get('status'),authorizationGeneration:doc.get('expectedAuthorizationGeneration')})).sort((a,b)=>a.operationIdSha256.localeCompare(b.operationIdSha256)),
    recoveryCodeIndices: indices.docs.map(doc=>({ indexSha256: hash(doc.id), used: doc.get('usedAt') != null })).sort((a,b)=>a.indexSha256.localeCompare(b.indexSha256)) }));
} catch { console.error(JSON.stringify({ stage: 'recovery_remote_read', category: 'read_failed' })); process.exitCode = 1; }
finally { await db.terminate(); await deleteApp(app); }
