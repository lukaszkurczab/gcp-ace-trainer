import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { parseOrigin, selectTarget, request } from './readNativeStartupTrace.mjs';

// Read-only real MMKV evidence for the existing local iPhone17 fixture; no credentials or answer keys.
const expectedSession = process.argv[2] ?? null;
if (expectedSession !== null && !/^[A-Za-z0-9:_-]{1,160}$/u.test(expectedSession)) throw Error('invalid_session_identity');
const origin = parseOrigin('http://localhost:8083');
const endpoint = selectTarget(await (await fetch(new URL('/json/list', origin))).json(), origin, 'com.lkurczab.patternly');
const require = createRequire(new URL('../../package.json', import.meta.url));
const socket = new (require('ws'))(endpoint, { origin: 'http://127.0.0.1:8083', maxPayload: 4 * 1024 * 1024 });
await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
let sequence = 0;
const key = `__ccarpRead_${randomUUID().replaceAll('-', '')}`;
const evaluate = async expression => {
  const response = await request(socket, ++sequence, 'Runtime.evaluate', { expression, returnByValue: true, silent: true });
  if (response.error || response.result?.exceptionDetails) throw Error('native_read_rejected');
  return response.result.result.value;
};
try {
  const expression = readFileSync(new URL('./ccarpNativeStateExpression.js', import.meta.url), 'utf8').replace('__CCARP_EXPECTED_SESSION__', JSON.stringify(expectedSession));
  await evaluate(`(()=>{globalThis[${JSON.stringify(key)}]={kind:'pending'};Promise.resolve().then(()=>${expression}).then(value=>globalThis[${JSON.stringify(key)}]={kind:'done',value}).catch(error=>globalThis[${JSON.stringify(key)}]={kind:'failed',category:(String(error?.message??'').startsWith('module_unavailable:src/')||['actor_not_authenticated','not_local_smoke','not_test_actor','profile_changed'].includes(error?.message))?error.message:'native_read_failed'});return true;})()`);
  let done = false;
  for (let index = 0; index < 100; index++) {
    const state = JSON.parse(await evaluate(`JSON.stringify(globalThis[${JSON.stringify(key)}])`));
    if (state.kind === 'done') { process.stdout.write(`${JSON.stringify(state.value)}\n`); done = true; break; }
    if (state.kind === 'failed') throw Error(state.category ?? 'native_read_failed_local_fixture_or_profile');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!done) throw Error('native_read_timeout');
} finally {
  await evaluate(`delete globalThis[${JSON.stringify(key)}]`).catch(() => {});
  socket.close();
}
