import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseOrigin, request, selectTarget } from "./readNativeStartupTrace.mjs";

/** Read-only receipts from already initialized production owners. Never prepares a profile,
 * refreshes credentials, builds a mutating account snapshot, or returns learner payloads. */
export function buildOfflineAccountReadExpression(fingerprint, appId) {
  if (!/^[a-f0-9]{64}$/u.test(fingerprint ?? "") || !["com.lkurczab.patternly", "com.lkurczab.patternly.sec03"].includes(appId)) throw Error("arguments_rejected");
  return `(async()=>{
    if(!globalThis.HermesInternal||typeof __DEV__==='undefined'||!__DEV__)throw Error('runtime_rejected');
    const entries=Array.from(__r.getModules().entries());
    const load=path=>{const matches=entries.filter(([,m])=>m.isInitialized&&m.verboseName.endsWith(path));if(matches.length!==1)throw Error('owner_unavailable');return __r(matches[0][0]);};
    const identity=load('src/infrastructure/runtime/environmentIdentity.ts').readEnvironmentIdentity();
    const constants=load('node_modules/expo-constants/build/Constants.js').default;
    if(identity.mode!=='smoke'||identity.fingerprint!==${JSON.stringify(fingerprint)}||constants.expoConfig?.extra?.patternlyEnvironmentFingerprint!==identity.fingerprint||constants.expoConfig?.ios?.bundleIdentifier!==${JSON.stringify(appId)})throw Error('runtime_rejected');
    const hook=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    const findActor=()=>{const actors=[];for(const id of hook.renderers.keys())for(const root of hook.getFiberRoots(id)){const walk=f=>{if(!f)return;const v=f.memoizedProps?.value;if(v?.state&&typeof v.retryRecoveryOperation==='function')actors.push(v);walk(f.child);walk(f.sibling);};walk(root.current);}if(actors.length!==1)throw Error('actor_unavailable');return actors[0];};
    const actor=findActor(),hash=load('src/infrastructure/identity/sha256.ts').sha256Utf8;
    const actorIdentity=v=>JSON.stringify([v.state.kind,v.state.user?.uid??null,v.state.backendUser?.id??v.state.accountId??null,v.state.generation?.generation??null,v.recoveryOperation.kind,v.recoveryOperation.operationId??null]);
    const expectedActor=actorIdentity(actor);
    const actorFence=actor.captureHomeResumeActorFence();
    const storage=load('src/infrastructure/storage/mmkvClient.ts');
    const lease=storage.captureActiveProfileStorageLease();
    if(lease&&(!actorFence||!actorFence.isCurrent()))throw Error('actor_unavailable');
    const first=await storage.inspectPreparedQ13StorageInventory();
    if(first.kind!=='observed'||!first.complete)throw Error('inventory_unavailable');
    const {packagePointerSources,...inventory}=first;
    const recovery=actor.recoveryOperation;
    const accountId=actor.state.backendUser?.id??actor.state.accountId;
    const receipt={schema:'patternly.offline-account-ios-read.v1',fingerprint:identity.fingerprint,appId:${JSON.stringify(appId)},state:actor.state.kind,accountIdSha256:accountId?hash(accountId):null,uidSha256:actor.state.user?hash(actor.state.user.uid):null,profile:lease?{kind:lease.profile.kind,profileIdSha256:hash(lease.profile.id),accountIdSha256:lease.profile.accountId?hash(lease.profile.accountId):null}:null,recovery:{kind:recovery.kind,reason:recovery.reason??null,blocksProfilePreparation:recovery.blocksProfilePreparation,operationIdSha256:recovery.operationId?hash(recovery.operationId):null,status:recovery.status??null,savedIntent:recovery.savedIntent??null,codeCount:recovery.codes?.length??0},inventory};
    if(lease){
      const context=load('src/application/tracks/trackAdmissionContext.ts');
      const repo=load('src/storage/repositories/accountDataRepository.ts');
      const sync=await repo.getAccountSyncState(context.productionLearningDataAdmissionContext);
      const sessions=(await load('src/storage/repositories/trainingSessionRepository.ts').getTrainingSessions(context.productionTrackAdmissionContext)).value;
      const attempts=(await load('src/storage/repositories/trainingAttemptRepository.ts').getTrainingAttempts(context.productionTrackAdmissionContext)).value;
      const summarize=xs=>xs.map(x=>({idSha256:hash(x.id),sha256:hash(JSON.stringify(x)),status:x.status??null})).sort((a,b)=>a.idSha256.localeCompare(b.idSha256));
      receipt.learning={sessions:summarize(sessions),attempts:summarize(attempts)};
      receipt.sync={status:sync.status,lastFailureCode:sync.lastFailureCode,accountIdSha256:sync.accountId?hash(sync.accountId):null,pendingMutationCount:sync.pendingMutationCount,remoteAccountRevision:sync.remoteAccountRevision,outboxSha256:hash(JSON.stringify(sync.outbox)),outbox:sync.outbox.map(x=>({mutationIdSha256:hash(x.mutationId),recordIdSha256:hash(x.recordId),recordType:x.recordType,fingerprint:x.fingerprint,status:x.status,sequence:x.sequence,attemptCount:x.attemptCount})),acknowledgedCount:Object.keys(sync.acknowledged).length,acknowledgedSha256:hash(JSON.stringify(sync.acknowledged))};
      if(!storage.isActiveProfileStorageLeaseCurrent(lease)||JSON.stringify((await repo.getAccountSyncState(context.productionLearningDataAdmissionContext)).outbox)!==JSON.stringify(sync.outbox))throw Error('inventory_changed');
    }
    const second=await storage.inspectPreparedQ13StorageInventory();
    if(second.kind!=='observed'||!second.complete||second.physicalInventorySha256!==first.physicalInventorySha256||actorIdentity(findActor())!==expectedActor||(actorFence&&!actorFence.isCurrent()))throw Error('inventory_changed');
    return receipt;
  })()`;
}

export async function readOfflineAccountIos(originValue, fingerprint, appId = "com.lkurczab.patternly.sec03") {
  const expression = buildOfflineAccountReadExpression(fingerprint, appId);
  const origin = parseOrigin(originValue);
  const response = await fetch(new URL("/json/list", origin), { signal: AbortSignal.timeout(5000), redirect: "error" });
  if (!response.ok) throw Error("discovery_failed");
  const endpoint = selectTarget(await response.json(), origin, appId);
  const require = createRequire(new URL("../../node_modules/@react-native/dev-middleware/package.json", import.meta.url));
  const WebSocket = require("ws");
  // Metro may listen on IPv6 localhost while its configured DevTools origin remains IPv4.
  const socket = new WebSocket(endpoint, { origin: `http://127.0.0.1:${origin.port}`, handshakeTimeout: 5000, maxPayload: 256 * 1024, followRedirects: false });
  let sequence = 0;
  const key = `__offlineAccountRead_${randomUUID().replaceAll("-", "")}`;
  const evaluate = async (source) => {
    const result = await request(socket, ++sequence, "Runtime.evaluate", { expression: source, returnByValue: true, silent: true });
    if (result.error || result.result?.exceptionDetails) throw Error("evaluation_rejected");
    return result.result?.result?.value;
  };
  try {
    await new Promise((accept, reject) => { socket.once("open", accept); socket.once("error", () => reject(Error("connect_failed"))); });
    await new Promise((accept) => setTimeout(accept, 300));
    await evaluate(`(()=>{globalThis[${JSON.stringify(key)}]={kind:'pending'};Promise.resolve().then(()=>${expression}).then(value=>globalThis[${JSON.stringify(key)}]={kind:'done',value}).catch(error=>{const allowed=['runtime_rejected','owner_unavailable','actor_unavailable','inventory_unavailable','inventory_changed'];globalThis[${JSON.stringify(key)}]={kind:'failed',category:allowed.includes(error?.message)?error.message:'read_failed'};});return 'scheduled';})()`);
    for (let attempt = 0; attempt < 100; attempt++) {
      const result = JSON.parse(await evaluate(`JSON.stringify(globalThis[${JSON.stringify(key)}])`));
      if (result.kind === "done") return result.value;
      if (result.kind !== "pending") throw Error(result.category);
      await new Promise((accept) => setTimeout(accept, 100));
    }
    throw Error("read_timeout");
  } finally {
    if (socket.readyState === WebSocket.OPEN) await evaluate(`delete globalThis[${JSON.stringify(key)}]`).catch(() => {});
    socket.terminate();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [origin, fingerprint, appId, ...extra] = process.argv.slice(2);
  const safe = new Set(["arguments_rejected", "origin_rejected", "target_rejected", "discovery_failed", "connect_failed", "runtime_rejected", "owner_unavailable", "actor_unavailable", "inventory_unavailable", "inventory_changed", "read_failed", "read_timeout", "evaluation_rejected", "transport_closed"]);
  Promise.resolve().then(() => { if (extra.length) throw Error("arguments_rejected"); return readOfflineAccountIos(origin, fingerprint, appId); })
    .then((receipt) => console.log(JSON.stringify(receipt)))
    .catch((error) => { console.error(JSON.stringify({ stage: "offline_account_read", category: safe.has(error?.message) ? error.message : "read_failed" })); process.exitCode = 1; });
}
