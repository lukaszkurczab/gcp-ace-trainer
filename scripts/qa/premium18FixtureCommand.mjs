// Guarded CDP control of the isolated fixture only. No credentials or app-data operations.
import { createRequire } from 'node:module';
import { parseOrigin, selectTarget, request } from './readNativeStartupTrace.mjs';
const [originValue, command] = process.argv.slice(2);
let socket;
let stage = "arguments";
try {
  const origin = parseOrigin(originValue);
  const input = JSON.parse(command ?? 'null');
  if (!input || !['select', 'purchase', 'restore', 'manage', 'approve', 'providerUpdate', 'read'].includes(input.action)) throw Error('arguments_rejected');
  if (input.action === 'select' && (!['en', 'pl', 'de', 'fr', 'es', 'it', 'et'].includes(input.locale) || !['ready', 'pending', 'unknown', 'cancelled', 'active', 'restore-failure', 'checkout-off', 'guest', 'offline', 'manage-unavailable', 'offer-failure'].includes(input.scenario))) throw Error('arguments_rejected');
  stage = 'discovery';
  const response = await fetch(new URL('/json/list', origin), { signal: AbortSignal.timeout(5000) });
  const endpoint = selectTarget(await response.json(), origin, "com.lkurczab.patternly.sec03");
  const WebSocket = createRequire(new URL('../../node_modules/@react-native/dev-middleware/package.json', import.meta.url))('ws');
  stage = 'connection';
  socket = new WebSocket(endpoint, { origin: `http://127.0.0.1:${origin.port}`, handshakeTimeout: 5000, maxPayload: 65536 });
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', () => reject(Error('connect_failed'))); });
  stage = 'capability';
  const capability = await request(socket, 1, 'Runtime.evaluate', { expression: "JSON.stringify({hermes:!!globalThis.HermesInternal,fixture:!!globalThis[Symbol.for('patternly.premium18.fixture')]})", returnByValue: true, silent: true });
  const flags = JSON.parse(capability.result?.result?.value ?? 'null');
  if (!flags?.hermes || !flags.fixture) throw Error('fixture_rejected');
  stage = 'command';
  const expression = `(()=>{const f=globalThis[Symbol.for('patternly.premium18.fixture')];const c=${JSON.stringify(input)};globalThis.__premium18Reply=null;void(async()=>{if(c.action==='select')await f.select(c.locale,c.scenario);else if(['purchase','restore','manage'].includes(c.action))await f.action(c.action);else if(c.action==='approve')f.approve();else if(c.action==='providerUpdate')await f.providerUpdate();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return globalThis[Symbol.for('patternly.premium18.fixture')].read();})().then(value=>globalThis.__premium18Reply={ok:true,value},()=>globalThis.__premium18Reply={ok:false});return 'scheduled';})()`;
  const scheduled = await request(socket, 2, 'Runtime.evaluate', { expression, returnByValue: true, silent: true });
  if (scheduled.error || scheduled.result?.exceptionDetails || scheduled.result?.result?.value !== 'scheduled') throw Error('fixture_command_failed');
  stage = 'readback';
  let reply = null;
  for (let attempt = 0; attempt < 50 && reply === null; attempt++) {
    const result = await request(socket, 3 + attempt, 'Runtime.evaluate', { expression: 'JSON.stringify(globalThis.__premium18Reply)', returnByValue: true, silent: true });
    reply = JSON.parse(result.result?.result?.value ?? 'null');
    if (!reply) await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (reply?.ok !== true || reply.value?.fixture !== true) throw Error('fixture_command_failed');
  console.log(JSON.stringify(reply.value));
} catch { console.error(`premium18_fixture_${stage}_unavailable`); process.exitCode = 1; }
finally { socket?.close(); }
