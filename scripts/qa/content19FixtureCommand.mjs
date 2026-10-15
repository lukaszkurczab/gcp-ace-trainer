// Guarded CDP control of the isolated fixture only. No credentials or app-data operations.
import { createRequire } from 'node:module';
import { parseOrigin, selectTarget, request } from './readNativeStartupTrace.mjs';
const [originValue, command] = process.argv.slice(2);
let socket;
let stage = "arguments";
try {
  const origin = parseOrigin(originValue);
  const input = JSON.parse(command ?? 'null');
  if (!input || !['probe', 'run', 'restartRead', 'cleanup'].includes(input.action)) throw Error('arguments_rejected');
  stage = 'discovery';
  let targets;
  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await fetch(new URL('/json/list', origin), { signal: AbortSignal.timeout(5000) });
    targets = await response.json();
    if (!Array.isArray(targets) || targets.length > 0) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const endpoint = selectTarget(targets, origin, "com.lkurczab.patternly.sec03");
  const WebSocket = createRequire(new URL('../../node_modules/@react-native/dev-middleware/package.json', import.meta.url))('ws');
  stage = 'connection';
  socket = new WebSocket(endpoint, { origin: `http://127.0.0.1:${origin.port}`, handshakeTimeout: 5000, maxPayload: 65536 });
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', () => reject(Error('connect_failed'))); });
  stage = 'capability';
  let flags;
  for (let attempt = 0; attempt < 30; attempt++) {
    const capability = await request(socket, 1000 + attempt, 'Runtime.evaluate', { expression: "JSON.stringify({hermes:!!globalThis.HermesInternal,fixture:!!globalThis[Symbol.for('patternly.content19.fixture')]})", returnByValue: true, silent: true });
    flags = JSON.parse(capability.result?.result?.value ?? 'null');
    if (flags?.hermes && flags.fixture) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!flags?.hermes || !flags.fixture) throw Error('fixture_rejected');
  stage = 'command';
  const expression = `(()=>{const f=globalThis[Symbol.for('patternly.content19.fixture')];globalThis.__content19Reply=null;void f[${JSON.stringify(input.action)}]().then(value=>globalThis.__content19Reply={ok:true,value},error=>globalThis.__content19Reply={ok:false,stage:String(error?.message??'unknown')});return 'scheduled';})()`;
  const scheduled = await request(socket, 2, 'Runtime.evaluate', { expression, returnByValue: true, silent: true });
  if (scheduled.error || scheduled.result?.exceptionDetails || scheduled.result?.result?.value !== 'scheduled') throw Error('fixture_command_failed');
  stage = 'readback';
  let reply = null;
  for (let attempt = 0; attempt < 500 && reply === null; attempt++) {
    const result = await request(socket, 3 + attempt, 'Runtime.evaluate', { expression: 'JSON.stringify(globalThis.__content19Reply)', returnByValue: true, silent: true });
    reply = JSON.parse(result.result?.result?.value ?? 'null');
    if (!reply) await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (reply?.ok !== true || reply.value?.fixture !== 'content19') { if(reply?.stage) console.error(reply.stage); throw Error('fixture_command_failed'); }
  console.log(JSON.stringify(reply.value));
} catch { console.error(`content19_fixture_${stage}_unavailable`); process.exitCode = 1; }
finally { socket?.close(); }
