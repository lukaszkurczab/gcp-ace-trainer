// Read initialized storage owners only, after timing collection. Redirect to a private file.
import { createRequire } from "node:module";
import { parseOrigin, selectTarget, request } from "./readNativeStartupTrace.mjs";

process.umask(0o077);
let socket;
let stage = "arguments";
try {
  const [metroUrl, originUrl, appId, ...extra] = process.argv.slice(2);
  if (!appId || extra.length) throw Error("arguments_rejected");
  const metro = parseOrigin(metroUrl), origin = parseOrigin(originUrl);
  stage = "target_discovery";
  if (metro.port !== origin.port) throw Error("origin_rejected");
  const response = await fetch(new URL("/json/list", metro), { signal: AbortSignal.timeout(5000), redirect: "error" });
  if (!response.ok) throw Error("discovery_failed");
  const body = await response.text();
  if (body.length > 64 * 1024) throw Error("target_rejected");
  const endpoint = selectTarget(JSON.parse(body), metro, appId);
  const require = createRequire(new URL("../../node_modules/@react-native/dev-middleware/package.json", import.meta.url));
  const WebSocket = require("ws");
  socket = new WebSocket(endpoint, { origin: origin.origin, handshakeTimeout: 5000, maxPayload: 512 * 1024, followRedirects: false });
  stage = "inspector_connect";
  await new Promise((accept, reject) => { socket.once("open", accept); socket.once("error", () => reject(Error("connect_failed"))); });
  let nextId = 0;
  const evaluate = async (expression) => {
    const result = await request(socket, ++nextId, "Runtime.evaluate", { expression, returnByValue: true, silent: true });
    if (result.error || result.result?.exceptionDetails) throw Error("read_rejected");
    return result.result?.result?.value;
  };
  // No module may be initialized by this read. No raw keys/values leave Hermes.
  const expression = `(()=>{
    if(!globalThis[Symbol.for("patternly.startup-trace.v1")]?.read()||globalThis.__perf01Preservation!==undefined)throw Error("runtime_rejected");
    const modules=Array.from(__r.getModules().entries());
    const load=s=>{const found=modules.filter(([,m])=>m.isInitialized&&m.verboseName?.endsWith(s));if(found.length!==1)throw Error("owner_unavailable");return __r(found[0][0])};
    const owner=load("src/infrastructure/storage/mmkvClient.ts"),hash=load("src/infrastructure/identity/sha256.ts").sha256Utf8;
    const lease=owner.captureActiveProfileStorageLease();if(!lease)throw Error("profile_unavailable");
    const keys=load("src/storage/keys.ts").STORAGE_KEYS,storage=owner.getKeyValueStorage();
    const logical=storage.getAllKeys();if(logical.length>2048)throw Error("inventory_limit");
    const names=Object.entries(keys).filter(([,v])=>typeof v==="string");
    const prefixes=Object.entries(keys).filter(([,v])=>typeof v==="function").map(([name,f])=>[name,f("")]);
    const rows=logical.map(key=>{const value=storage.getString(key);if(value===undefined)throw Error("read_failed");
      return {keySha256:hash(key),valueSha256:hash(value),family:names.find(([,v])=>v===key)?.[0]??prefixes.find(([,p])=>key.startsWith(p))?.[0]??"other"}}).sort((a,b)=>a.keySha256.localeCompare(b.keySha256));
    globalThis.__perf01Preservation={state:"pending"};
    const reads=load("src/application/learningReadModels.ts");
    Promise.all([owner.inspectPreparedQ13StorageInventory(),reads.loadActiveTrainingSession(),reads.loadTrainingAttempts(),reads.loadReviewQueueItems()]).then(([inventory,session,attempts,reviews])=>{
      if(!owner.isActiveProfileStorageLeaseCurrent(lease))throw Error("profile_changed");
      if(!session||!Array.isArray(attempts.value)||!Array.isArray(reviews.value))throw Error("session_read_unavailable");
      const descriptor=load("src/domain/tracks/trackAdmission.ts").findTrackDescriptor(session.trackId);
      const track=load("src/application/contentPackageRuntimeOwner.ts").contentPackageRuntimeOwner.getPreparedDiscovery(session.trackId).track;
      if(!descriptor||track.contentVersion!==session.contentVersion||track.artifactSha256!==session.artifactSha256)throw Error("session_pin_unavailable");
      const {activeForegroundMs,...pinnedSession}=session;
      const sessionProof={idSha256:hash(session.id),trackId:session.trackId,modeId:session.modeId,status:session.status,currentItemIndex:session.currentItemIndex,actualLength:session.actualLength,
        contentVersion:session.contentVersion,artifactSha256:session.artifactSha256,pinsSha256:hash(JSON.stringify(pinnedSession)),activeForegroundMs,
        activeAnswerCount:attempts.value.filter(a=>a.sessionId===session.id).length,attemptsSha256:hash(JSON.stringify(attempts.value)),reviewsSha256:hash(JSON.stringify(reviews.value)),
        freeNodeId:descriptor.freeNodeId,allItemsInFreeNode:session.itemOrder.every(o=>track.getQuestion(o.item.questionId)?.nodeId===descriptor.freeNodeId)};
      globalThis.__perf01Preservation={state:"done",value:{schema:"patternly.perf01-preservation.v1",activeProfileKind:owner.getActiveStorageProfile().kind,inventory,rows,sessionProof}};
    }).catch(()=>{globalThis.__perf01Preservation={state:"failed"}});
    return "scheduled";
  })()`;
  stage = "initialized_owner_read";
  if (await evaluate(expression) !== "scheduled") throw Error("read_rejected");
  let receipt;
  for (let attempt = 0; attempt < 20; attempt++) {
    const result = JSON.parse(await evaluate("JSON.stringify(globalThis.__perf01Preservation)"));
    if (result.state === "failed") throw Error("owner_read_failed");
    if (result.state === "done") { receipt = result.value; break; }
    await new Promise((accept) => setTimeout(accept, 100));
  }
  stage = "inventory_validation";
  // The canonical owner omits unclassifiedKeys on complete observed success;
  // every unknown-key branch returns unavailable before reaching that result.
  if (!receipt || receipt.inventory?.kind !== "observed" || receipt.inventory.complete !== true || (receipt.inventory.unclassifiedKeys?.keyCount ?? 0) !== 0) {
    console.error(JSON.stringify({ stage, category: "inventory_incomplete", kind: receipt?.inventory?.kind ?? "missing", complete: receipt?.inventory?.complete ?? false, unclassifiedCount: receipt?.inventory?.unclassifiedKeys?.keyCount ?? null, reason: receipt?.inventory?.reason ?? null }));
    process.exitCode = 1;
  } else {
  console.log(JSON.stringify(receipt));
  }
} catch {
  console.error(JSON.stringify({ stage, category: "read_stopped" }));
  process.exitCode = 1;
} finally {
  if (socket?.readyState === 1) {
    try { await request(socket, 9999, "Runtime.evaluate", { expression: "delete globalThis.__perf01Preservation;true", returnByValue: true, silent: true }); } catch { /* Connection may have closed. */ }
  }
  socket?.terminate();
}
