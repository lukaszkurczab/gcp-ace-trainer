// Read only an already-paused start capability or completed recovery; never loads app owners.
// Usage: node scripts/qa/readPersist13StartCutpoint.mjs <run-uuid-v4> <prewrite|postjournal> [recover]
import { createRequire } from "node:module";
import { request, selectTarget } from "./readNativeStartupTrace.mjs";
const [runId, boundary, recoveryMode, ...extra] = process.argv.slice(2);
if (extra.length || (recoveryMode !== undefined && recoveryMode !== "recover") || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(runId ?? "") || !["prewrite", "postjournal"].includes(boundary)) throw Error("Usage: readPersist13StartCutpoint.mjs <run-uuid-v4> <prewrite|postjournal> [recover]");
const stage = boundary === "prewrite" ? "before_start_journal_write" : "after_start_journal_durable_before_materialization";
const metro = new URL("http://localhost:8082");
const endpoint = selectTarget(await (await fetch(new URL("/json/list", metro))).json(), metro, "com.lkurczab.patternly");
const require = createRequire(new URL("../../node_modules/@react-native/dev-middleware/package.json", import.meta.url));
const WS = require("ws");
const socket = new WS(endpoint, { origin: "http://127.0.0.1:8082", handshakeTimeout: 10000, maxPayload: 256 * 1024, followRedirects: false });
try {
  await new Promise((resolve, reject) => { socket.once("open", resolve); socket.once("error", () => reject(Error("start_read_connect_failed"))); });
  const expression = `(()=>{if(typeof __DEV__==='undefined'||!__DEV__||!globalThis.HermesInternal)throw Error('runtime_rejected');const runId=${JSON.stringify(runId)},stage=${JSON.stringify(stage)},recover=${recoveryMode === "recover"};const owner=path=>{const matches=Array.from(__r.getModules().entries()).filter(([,v])=>v.verboseName?.endsWith(path));if(matches.length!==1||!matches[0][1].isInitialized)throw Error('owner_unavailable');return __r(matches[0][0]);};const storage=owner('src/infrastructure/storage/mmkvClient.ts'),lease=storage.captureActiveProfileStorageLease();if(!lease||lease.profile.id!==runId||lease.profile.kind!=='guest'||lease.profile.accountId!==null||!storage.isActiveProfileStorageLeaseCurrent(lease))throw Error('scope_rejected');const protocol=owner('src/application/runtimeAuditability/persist13ResetFixtureProtocol.ts'),mmkv=owner('node_modules/react-native-mmkv/src/index.ts'),ids=protocol.fixtureStoreIds(runId);if(!mmkv.existsMMKV(ids.dataStoreId)||!mmkv.existsMMKV(ids.controlStoreId))throw Error('stores_missing');const control=mmkv.createMMKV({id:ids.controlStoreId}),manifest=JSON.parse(control.getString(protocol.PERSIST13_FIXTURE_MANIFEST_KEY)??'null'),receipt=JSON.parse(control.getString('patternly:persist13:start-capability:v1')??'null');if(!protocol.isPersist13Manifest(manifest,runId)||receipt?.runId!==runId||receipt?.stage!==stage||receipt?.phase!=='paused'||receipt?.callbackPending!==true||(!recover&&receipt?.leaseGeneration!==lease.generation)||!protocol.isPersist13StartCapability(receipt,runId,stage))throw Error('receipt_rejected');const data=mmkv.createMMKV({id:ids.dataStoreId}),sha=owner('src/infrastructure/identity/sha256.ts').sha256Utf8;const actual=protocol.hashPersist13PhysicalSnapshot(data.getAllKeys().sort().map(k=>[k,data.getString(k)]),sha);const recovery=recover?JSON.parse(control.getString(protocol.PERSIST13_START_RECOVERY_KEY)??'null'):null;if(recover&&(!protocol.isPersist13StartRecovery(recovery,receipt)||!['boot1_complete','complete'].includes(recovery.phase)))throw Error('receipt_rejected');const expected=recover?(recovery.secondAfter??recovery.firstAfter):receipt.after;if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('paused_snapshot_changed');return JSON.stringify({manifest,receipt,recovery,actual,scopeVerified:true});})()`;
  const value = await request(socket, 1, "Runtime.evaluate", { expression, returnByValue: true, silent: true });
  if (value.error || value.result?.exceptionDetails) {
    const description = value.result?.exceptionDetails?.exception?.description ?? "";
    const category = ["runtime_rejected", "owner_unavailable", "scope_rejected", "stores_missing", "receipt_rejected", "paused_snapshot_changed"].find(item => description.startsWith(`Error: ${item}`));
    throw Error(`start_native_read_failed:${category ?? "evaluation"}`);
  }
  const result = JSON.parse(value.result?.result?.value ?? "null");
  if (!result?.scopeVerified) throw Error("start_scope_unverified");
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally { socket.terminate(); }
