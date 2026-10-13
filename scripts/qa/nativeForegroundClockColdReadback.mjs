import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateNativeForegroundClock } from './nativeForegroundClockReadback.mjs';

export function validateIdentity(runId, profileHash, sessionHash) {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(runId ?? '')
    || !/^[a-f0-9]{64}$/u.test(profileHash ?? '') || !/^[a-f0-9]{64}$/u.test(sessionHash ?? '')) throw Error('cold_receipt_identity_rejected');
}
export function validateColdReceipt(value, runId, profileHash, sessionHash) {
  validateIdentity(runId, profileHash, sessionHash);
  if (!value || Object.keys(value).sort().join(',') !== 'checkpointRevision,durableElapsedMs,profileIdSha256,protocol,runId,running,sessionElapsedMs,sessionIdSha256'
    || value.protocol !== 'patternly.foreground-clock-cold-receipt.v1' || value.runId !== runId
    || value.profileIdSha256 !== profileHash || value.sessionIdSha256 !== sessionHash
    || !Number.isSafeInteger(value.durableElapsedMs) || !Number.isSafeInteger(value.sessionElapsedMs)
    || value.sessionElapsedMs < 0 || value.durableElapsedMs < value.sessionElapsedMs
    || !Number.isSafeInteger(value.checkpointRevision) || value.checkpointRevision < 1 || typeof value.running !== 'boolean') throw Error('cold_receipt_rejected');
  return value;
}
export async function readNativeForegroundClockColdReceipt(origin, runId, profileHash, sessionHash) {
  validateIdentity(runId, profileHash, sessionHash);
  const expression = `(()=>{
    const matches=Array.from(__r.getModules().entries()).filter(([,module])=>module.isInitialized===true&&module.verboseName?.endsWith('src/application/runtimeAuditability/foregroundClockColdReceipt.ts'));
    if(matches.length!==1)return null;
    return __r(matches[0][0]).readForegroundClockColdReceipt(${JSON.stringify(runId)},${JSON.stringify(profileHash)},${JSON.stringify(sessionHash)});
  })()`;
  return validateColdReceipt(await evaluateNativeForegroundClock(origin, expression), runId, profileHash, sessionHash);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [origin, runId, profileHash, sessionHash, ...extra] = process.argv.slice(2);
  if (!origin || extra.length) {
    console.error(JSON.stringify({ stage: 'error', category: 'arguments_rejected' })); process.exitCode = 1;
  } else {
    readNativeForegroundClockColdReceipt(origin, runId, profileHash, sessionHash).then((value) => console.log(JSON.stringify(value))).catch(() => {
      console.error(JSON.stringify({ stage: 'error', category: 'cold_receipt_read_failed' })); process.exitCode = 1;
    });
  }
}
