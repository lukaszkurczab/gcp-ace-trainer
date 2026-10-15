import { readFileSync, realpathSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
// Guarded CDP control of isolated fixtures. Privacy21 reads its private RC input; only allowlisted results leave the command.
import { createRequire } from 'node:module';
import { parseOrigin, selectTarget, request } from './readNativeStartupTrace.mjs';
const [originValue, command] = process.argv.slice(2);
let socket;
let stage = "arguments";
try {
  const origin = parseOrigin(originValue);
  const input = JSON.parse(command ?? 'null');
  if (!input || !['probe', 'run', 'restartRead', 'cleanup'].includes(input.action)) throw Error('arguments_rejected');
  const fixture = input.fixture ?? "content19";
  if (!["content19", "privacy21"].includes(fixture) || (fixture === "privacy21" && input.action === "probe")) throw Error("arguments_rejected");
  let parameters;
  if (fixture === "privacy21" && input.action !== "cleanup") {
    if (!/^\/private\/tmp\/patternly21-[A-Za-z0-9-]+\/input.json$/.test(input.inputFile ?? "") || realpathSync(input.inputFile) !== input.inputFile || statSync(input.inputFile).uid !== process.getuid() || (statSync(input.inputFile).mode & 0o077) !== 0) throw Error("input_rejected");
    parameters = JSON.parse(readFileSync(input.inputFile, "utf8"));
    stage = "rc_identity_preflight";
    // Refuse before SDK configuration if input could create or switch a remote RC identity.
    const container = spawnSync("xcrun", ["simctl", "get_app_container", "7F315654-3175-4F3C-BB24-B0263F59360C", "com.lkurczab.patternly.sec03", "data"], { encoding: "utf8", timeout: 5000 });
    if (container.status !== 0) throw Error("container_unavailable");
    const identity = spawnSync("python3", ["-c", "import plistlib,sys; v=plistlib.load(open(sys.argv[1], 'rb')).get('com.revenuecat.userdefaults.appUserID.new'); assert isinstance(v,str); sys.stdout.write(v)", container.stdout.trim() + "/Library/Preferences/com.revenuecat.user_defaults.plist"], { encoding: "utf8", timeout: 5000 });
    if (identity.status !== 0) throw Error("rc_preferences_unavailable");
    const environment = JSON.parse(readFileSync("/private/tmp/patternly-sec03-isolated-YtnYlk/attempt-2/environment-A.json", "utf8"));
    if (parameters.accountId !== identity.stdout || parameters.apiKey !== environment.EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY) throw Error("rc_identity_or_key_mismatch");
  }
  const symbol = `patternly.${fixture}.fixture`;
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
    const capability = await request(socket, 1000 + attempt, 'Runtime.evaluate', { expression: `JSON.stringify({hermes:!!globalThis.HermesInternal,fixture:!!globalThis[Symbol.for(${JSON.stringify(symbol)})]})`, returnByValue: true, silent: true });
    flags = JSON.parse(capability.result?.result?.value ?? 'null');
    if (flags?.hermes && flags.fixture) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!flags?.hermes || !flags.fixture) throw Error('fixture_rejected');
  stage = 'command';
  const expression = `(()=>{const f=globalThis[Symbol.for(${JSON.stringify(symbol)})];globalThis.__content19Reply=null;void f[${JSON.stringify(input.action)}](${JSON.stringify(parameters)}).then(value=>globalThis.__content19Reply={ok:true,value},error=>globalThis.__content19Reply={ok:false,stage:String(error?.message??'unknown')});return 'scheduled';})()`;
  const scheduled = await request(socket, 2, 'Runtime.evaluate', { expression, returnByValue: true, silent: true });
  if (scheduled.error || scheduled.result?.exceptionDetails || scheduled.result?.result?.value !== 'scheduled') throw Error('fixture_command_failed');
  stage = 'readback';
  let reply = null;
  for (let attempt = 0; attempt < 500 && reply === null; attempt++) {
    const result = await request(socket, 3 + attempt, 'Runtime.evaluate', { expression: 'JSON.stringify(globalThis.__content19Reply)', returnByValue: true, silent: true });
    reply = JSON.parse(result.result?.result?.value ?? 'null');
    if (!reply) await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (reply?.ok !== true || reply.value?.fixture !== fixture) { if(reply?.stage) console.error(reply.stage); throw Error('fixture_command_failed'); }
  console.log(JSON.stringify(reply.value));
} catch { console.error(`content19_fixture_${stage}_unavailable`); process.exitCode = 1; }
finally { socket?.close(); }
