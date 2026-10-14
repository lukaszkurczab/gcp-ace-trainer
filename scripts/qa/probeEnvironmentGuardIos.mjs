import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { parseOrigin, request, selectTarget } from "./readNativeStartupTrace.mjs";

export function buildEnvironmentProbeExpression(action = "inspect", expectedFingerprint) {
  if (!["inspect", "assign", "inventory"].includes(action) || (action !== "inspect" && !/^[a-f0-9]{64}$/u.test(expectedFingerprint ?? ""))) throw Error("arguments_rejected");
  return `(async()=>{
      if(!globalThis.HermesInternal || typeof __DEV__==='undefined' || !__DEV__)throw Error('controlled_runtime_required');
      const modules=Array.from(__r.getModules().entries());
      const owner=path=>{const found=modules.filter(([,v])=>v.verboseName===path);if(found.length!==1)throw Error('owner_unavailable');return found[0];};
      const initialized=path=>owner(path)[1].isInitialized;
      const load=path=>{const [id,module]=owner(path);if(!module.isInitialized)throw Error('owner_closed');return __r(id);};
      const identity=load('src/infrastructure/runtime/environmentIdentity.ts').readEnvironmentIdentity();
      if(identity.mode!=='smoke')throw Error('controlled_runtime_required');
      const rootInitialized=initialized('src/RegularApplicationRoot.tsx');
      const protectedModules=Object.fromEntries(['src/infrastructure/storage/mmkvClient.ts','src/infrastructure/firebase/firebaseAuthClient.ts','src/infrastructure/security/recoveryOperationVault.ts','src/infrastructure/purchases/index.ts','src/content/runtime/nodePackageStorage.ts'].map(path=>[path,initialized(path)]));
      const constants=load('node_modules/expo-constants/build/Constants.js').default;
      const configMatches=constants.expoConfig?.extra?.patternlyEnvironmentFingerprint===identity.fingerprint;
      const api=load('src/infrastructure/runtime/environmentGuard.ts');
      const guard=api.createEnvironmentGuard(api.createNativeEnvironmentMarkerStore(),identity.fingerprint);
      let state=await guard.inspect();
      if(${JSON.stringify(action)}==='assign'){
        if(identity.fingerprint!==${JSON.stringify(expectedFingerprint ?? null)} || !configMatches || rootInitialized || Object.values(protectedModules).some(Boolean) || state!=='unassigned')throw Error('assignment_precondition_rejected');
        state=await guard.assign();
      }
      let inventory;
      if(${JSON.stringify(action)}==='inventory'){
        if(identity.fingerprint!==${JSON.stringify(expectedFingerprint ?? null)} || !configMatches || !rootInitialized || state!=='ready')throw Error('inventory_precondition_rejected');
        // Only production owners that normal startup has already initialized.
        // In particular this action cannot open A's data while B is blocked.
        const storage=load('src/infrastructure/storage/mmkvClient.ts');
        const first=await storage.inspectPreparedQ13StorageInventory();
        if(first.kind!=='observed'||!first.complete)throw Error('inventory_unavailable');
        const {packagePointerSources,...sanitizedStorage}=first;
        const packages=await load('src/content/runtime/nodePackageStorage.ts').inspectExpoNodePackageInventory(packagePointerSources);
        const auth=await load('src/infrastructure/firebase/secureAuthPersistence.ts').inspectQ13SecureAuthPersistence();
        const vault=await load('src/infrastructure/security/recoveryOperationVault.ts').inspectQ13RecoveryOperationVault();
        const second=await storage.inspectPreparedQ13StorageInventory();
        if(second.kind!=='observed'||!second.complete||first.physicalInventorySha256!==second.physicalInventorySha256||first.registryChecksumSha256!==second.registryChecksumSha256)throw Error('inventory_changed');
        inventory={storage:sanitizedStorage,packages,auth,vault,purchases:{kind:'unavailable',reason:'native_sdk_cache_not_enumerated'}};
      }
      return {schema:'patternly.environment-native-probe.v1',action:${JSON.stringify(action)},hermes:true,mode:identity.mode,fingerprint:identity.fingerprint,configMatches,state,rootInitialized,
        protectedModules,...(inventory?{inventory}:{})};
    })()`;
}

/** Uses only initialized owners in the one existing iPhone 17 Hermes target.
 * assign is an explicit owner-authorized enrollment, never a fixture reset.
 * Does not import/open protected stores or SDKs merely to inspect a blocked build. */
export async function probeEnvironmentGuardIos(originValue, action = "inspect", expectedFingerprint) {
  const expression = buildEnvironmentProbeExpression(action, expectedFingerprint);
  const origin = parseOrigin(originValue);
  const targets = await (await fetch(new URL("/json/list", origin), { signal: AbortSignal.timeout(5000) })).json();
  const endpoint = selectTarget(targets, origin);
  const require = createRequire(new URL("../../node_modules/@react-native/dev-middleware/package.json", import.meta.url));
  const WebSocket = require("ws");
  const socket = new WebSocket(endpoint, { origin: origin.origin, handshakeTimeout: 5000, maxPayload: 128 * 1024, followRedirects: false });
  const key = `__patternlyEnvironmentProbe_${randomUUID().replaceAll("-", "")}`;
  let sequence = 0;
  const evaluate = async (expression) => {
    const result = await request(socket, ++sequence, "Runtime.evaluate", { expression, returnByValue: true, silent: true });
    if (result.error || result.result?.exceptionDetails) throw Error("native_evaluation_rejected");
    return result.result?.result?.value;
  };
  try {
    await new Promise((accept, reject) => { socket.once("open", accept); socket.once("error", () => reject(Error("connect_failed"))); });
    await evaluate(`(()=>{const key=${JSON.stringify(key)};if(Object.hasOwn(globalThis,key))throw Error('probe_busy');globalThis[key]={kind:'pending'};Promise.resolve().then(()=>${expression}).then(value=>globalThis[key]={kind:'done',value}).catch(error=>{const allowed=['inventory_precondition_rejected','inventory_unavailable','inventory_changed','owner_closed','owner_unavailable','assignment_precondition_rejected'];globalThis[key]={kind:'failed',category:allowed.includes(error?.message)?error.message:'native_probe_rejected'};});return 'started';})()`);
    for (let attempt = 0; attempt < 40; attempt++) {
      const value = JSON.parse(await evaluate(`JSON.stringify(globalThis[${JSON.stringify(key)}])`));
      if (value.kind === "done") return value.value;
      if (value.kind !== "pending") throw Error(value.category ?? "native_probe_rejected");
      await new Promise((accept) => setTimeout(accept, 50));
    }
    throw Error("native_probe_timeout");
  } finally {
    if (socket.readyState === WebSocket.OPEN) await evaluate(`delete globalThis[${JSON.stringify(key)}]`).catch(() => {});
    socket.terminate();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [origin, action = "inspect", fingerprint, ...extra] = process.argv.slice(2);
  const categories = new Set(["arguments_rejected", "origin_rejected", "target_rejected", "connect_failed", "native_evaluation_rejected", "native_probe_rejected", "native_probe_timeout", "transport_closed", "read_timeout", "inventory_precondition_rejected", "inventory_unavailable", "inventory_changed", "owner_closed", "owner_unavailable", "assignment_precondition_rejected"]);
  if (!origin || extra.length) { console.error(JSON.stringify({ stage: "environment_probe", category: "arguments_rejected" })); process.exitCode = 1; }
  else probeEnvironmentGuardIos(origin, action, fingerprint).then((receipt) => console.log(JSON.stringify(receipt))).catch((error) => {
    console.error(JSON.stringify({ stage: "environment_probe", category: categories.has(error?.message) ? error.message : "native_probe_unavailable" })); process.exitCode = 1;
  });
}
