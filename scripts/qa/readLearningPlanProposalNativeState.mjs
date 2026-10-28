import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseOrigin, request, selectTarget } from "./readNativeStartupTrace.mjs";

const APP_ID = "com.lkurczab.patternly";
const PROJECT_ID = "patternly-app-sandbox";
const API_ORIGIN = "http://127.0.0.1:8080";
const DEBUGGER_ORIGIN = "http://127.0.0.1:8083";
const MAX_IDS = 100;
const SAFE_RUNTIME_ERRORS = new Set([
  "runtime_rejected", "runtime_identity_rejected", "actor_unavailable", "actor_scope_rejected",
  "runtime_source_rejected",
  "proposal_owner_unavailable", "proposal_owner_uninitialized", "proposal_map_unavailable",
  "proposal_id_rejected", "editor_owner_unavailable", "editor_map_unavailable", "editor_id_rejected",
  "profile_changed",
]);
const SAFE_ERRORS = new Set([
  "arguments_rejected", "origin_rejected", "discovery_failed", "target_rejected", "connect_failed",
  "read_timeout", "transport_closed", "protocol_rejected", "runtime_rejected", "runtime_identity_rejected",
  "actor_unavailable", "actor_scope_rejected", "runtime_source_rejected", "proposal_owner_unavailable", "proposal_owner_uninitialized",
  "proposal_map_unavailable", "proposal_id_rejected", "editor_owner_unavailable", "editor_map_unavailable",
  "editor_id_rejected", "profile_changed",
]);

function parseArguments(args) {
  const allowed = new Set(["--metro-origin", "--fingerprint", "--expected-actor-sha256", "--expected-profile-sha256"]);
  const values = new Map();
  for (let index = 0; index < args.length; index += 1) {
    const name = args[index];
    const value = args[index + 1];
    if (!allowed.has(name) || values.has(name) || !value || value.startsWith("--") || value.trim() !== value) throw Error("arguments_rejected");
    values.set(name, value);
    index += 1;
  }
  if (values.size !== allowed.size) throw Error("arguments_rejected");

  let metroOrigin;
  try { metroOrigin = parseOrigin(values.get("--metro-origin")); }
  catch { throw Error("origin_rejected"); }
  if (metroOrigin.origin !== "http://localhost:8083") throw Error("origin_rejected");
  for (const name of ["--fingerprint", "--expected-actor-sha256", "--expected-profile-sha256"]) {
    if (!/^[a-f0-9]{64}$/u.test(values.get(name))) throw Error("arguments_rejected");
  }
  return Object.freeze({
    metroOrigin,
    fingerprint: values.get("--fingerprint"),
    expectedActorSha256: values.get("--expected-actor-sha256"),
    expectedProfileSha256: values.get("--expected-profile-sha256"),
  });
}

function buildReadExpression(input) {
  const expected = JSON.stringify({
    fingerprint: input.fingerprint,
    actorSha256: input.expectedActorSha256,
    profileSha256: input.expectedProfileSha256,
  });
  return `JSON.stringify((()=>{try{
    const expected=${expected};
    const modules=Array.from(__r.getModules().entries());
    const owner=(path,required=true)=>{
      const matches=modules.filter(([,value])=>value.verboseName?.endsWith(path));
      if(matches.length===0&&!required)return null;
      if(matches.length!==1)throw Error(required?'proposal_owner_unavailable':'editor_owner_unavailable');
      const [id,module]=matches[0];
      if(!module.isInitialized)return required?(()=>{throw Error('proposal_owner_uninitialized')})():null;
      return __r(id);
    };
    const sourceOwner=path=>{
      const matches=modules.filter(([,value])=>value.verboseName?.endsWith(path));
      if(matches.length!==1)throw Error('runtime_source_rejected');
      const [id,module]=matches[0];
      if(!module.isInitialized)throw Error('runtime_source_rejected');
      return __r(id);
    };
    if(typeof __DEV__==='undefined'||__DEV__!==true||!globalThis.HermesInternal)throw Error('runtime_rejected');
    const identityOwner=owner('src/infrastructure/runtime/environmentIdentity.ts');
    const identity=identityOwner.readEnvironmentIdentity();
    const runtimeMode=owner('src/infrastructure/runtime/runtimeMode.ts');
    if(identity.mode!=='smoke'||identity.fingerprint!==expected.fingerprint||identity.apiOrigin!==${JSON.stringify(API_ORIGIN)}||
      identity.firebaseProjectId!==${JSON.stringify(PROJECT_ID)}||!runtimeMode.isPatternlySmokeRuntime())throw Error('runtime_identity_rejected');

    const storage=owner('src/infrastructure/storage/mmkvClient.ts');
    const sha256=owner('src/infrastructure/identity/sha256.ts').sha256Utf8;
    const hook=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if(!hook?.renderers||typeof hook.getFiberRoots!=='function')throw Error('actor_unavailable');
    const actors=new Set();
    const visit=fiber=>{
      if(!fiber)return;
      const value=fiber.memoizedProps?.value;
      if(value?.state&&typeof value.captureHomeResumeActorFence==='function')actors.add(value);
      visit(fiber.child);visit(fiber.sibling);
    };
    for(const rendererId of hook.renderers.keys())for(const root of hook.getFiberRoots(rendererId))visit(root.current);
    if(actors.size!==1)throw Error('actor_unavailable');
    const actor=[...actors][0];
    const actorUid=actor.state?.kind==='authenticated'?actor.state.user?.uid:null;
    if(typeof actorUid!=='string'||!actorUid||!actor.state.user?.email?.startsWith('ui-exam-ios-'))throw Error('actor_scope_rejected');
    const actorSha256=sha256(actorUid);
    if(actorSha256!==expected.actorSha256)throw Error('actor_scope_rejected');

    const lease=storage.captureActiveProfileStorageLease();
    const profile=storage.getActiveStorageProfileOrNull();
    const actorFence=actor.captureHomeResumeActorFence();
    if(!lease||!profile||profile.kind!=='account'||lease.profile?.kind!=='account'||lease.profile.id!==profile.id||
      lease.profile.accountId!==profile.accountId||storage.isProfileTransitionActive())throw Error('actor_scope_rejected');
    const profileSha256=sha256(lease.profile.id);
    if(profileSha256!==expected.profileSha256||!actorFence?.isCurrent?.()||!storage.isActiveProfileStorageLeaseCurrent(lease))throw Error('actor_scope_rejected');

    const summarizeMap=(map,pattern,errorCode)=>{
      if(!(map instanceof Map))throw Error(errorCode);
      const ids=[];let truncated=false;
      for(const id of map.keys()){
        if(typeof id!=='string'||!pattern.test(id))throw Error(errorCode==='proposal_map_unavailable'?'proposal_id_rejected':'editor_id_rejected');
        if(ids.length<${MAX_IDS})ids.push(id);else truncated=true;
      }
      return {initialized:true,count:map.size,ids,truncated};
    };
    const proposalRuntimeModule=sourceOwner('src/features/home/learningPlanProposalRuntime.ts');
    const routeLifetimeModule=sourceOwner('src/features/home/routeLifetime.ts');
    const productionRuntime=proposalRuntimeModule.productionLearningPlanProposalRuntime;
    if(typeof productionRuntime?.discardProposal!=='function'||typeof productionRuntime?.discardEditor!=='function'||
      typeof routeLifetimeModule.createRouteLifetime!=='function'||typeof routeLifetimeModule.useRouteLifetime!=='function')throw Error('runtime_source_rejected');
    const runtimeSource={
      proposalRuntimeModuleInitialized:true,
      routeLifetimeModuleInitialized:true,
      discardProposalAvailable:true,
      discardEditorAvailable:true,
      createRouteLifetimeAvailable:true,
      useRouteLifetimeAvailable:true,
    };
    const proposalOwner=owner('src/application/learningPlan/LearningPlanProposalCoordinator.ts');
    const proposalCoordinator=proposalOwner.learningPlanProposalCoordinator;
    const proposals=summarizeMap(proposalCoordinator?.proposals,/^proposal:[0-9]{1,16}:[0-9]{1,12}$/u,'proposal_map_unavailable');

    const editorOwner=owner('src/application/learningPlan/LearningPlanEditorCoordinator.ts',false);
    let editorSessions={initialized:false,count:null,ids:null,truncated:false};
    if(editorOwner){
      const editorCoordinator=editorOwner.learningPlanEditorCoordinator;
      editorSessions=summarizeMap(editorCoordinator?.sessions,/^editor:[0-9]{1,16}:[0-9]{1,12}$/u,'editor_map_unavailable');
    }

    if(actor.state?.kind!=='authenticated'||actor.state.user?.uid!==actorUid||
      !actorFence.isCurrent()||!storage.isActiveProfileStorageLeaseCurrent(lease)||
      storage.isProfileTransitionActive()||storage.getActiveStorageProfileOrNull()?.id!==lease.profile.id||
      storage.getActiveStorageProfileOrNull()?.accountId!==lease.profile.accountId||sha256(lease.profile.id)!==expected.profileSha256)throw Error('profile_changed');
    return {ok:true,value:{
      schema:'patternly.learning-plan-native-state.v1',
      fingerprint:identity.fingerprint,
      mode:identity.mode,
      apiOrigin:identity.apiOrigin,
      projectId:identity.firebaseProjectId,
      appId:${JSON.stringify(APP_ID)},
      actorSha256,
      profileSha256,
      actorFenceCurrentBefore:true,
      actorFenceCurrentAfter:true,
      profileLeaseCurrentBefore:true,
      profileLeaseCurrentAfter:true,
      profileTransitionActiveBefore:false,
      profileTransitionActiveAfter:false,
      runtimeSource,
      proposals,
      editorSessions,
      truncated:proposals.truncated||editorSessions.truncated,
    }};
  }catch(error){
    const safe=new Set(${JSON.stringify([...SAFE_RUNTIME_ERRORS])});
    const category=typeof error?.message==='string'?error.message:'';
    return {ok:false,error:safe.has(category)?category:'runtime_rejected'};
  }})())`;
}

function validateReadback(value, input) {
  const validSummary = (summary) => summary && Number.isSafeInteger(summary.count) && summary.count >= 0 &&
    Array.isArray(summary.ids) && summary.ids.length <= MAX_IDS && typeof summary.truncated === "boolean" &&
    (summary.truncated ? summary.count > MAX_IDS && summary.ids.length === MAX_IDS : summary.ids.length === summary.count);
  if (!value || value.schema !== "patternly.learning-plan-native-state.v1" || value.fingerprint !== input.fingerprint ||
    value.mode !== "smoke" || value.apiOrigin !== API_ORIGIN || value.projectId !== PROJECT_ID || value.appId !== APP_ID ||
    value.actorSha256 !== input.expectedActorSha256 || value.profileSha256 !== input.expectedProfileSha256 ||
    value.actorFenceCurrentBefore !== true || value.actorFenceCurrentAfter !== true ||
    value.profileLeaseCurrentBefore !== true || value.profileLeaseCurrentAfter !== true ||
    value.profileTransitionActiveBefore !== false || value.profileTransitionActiveAfter !== false ||
    value.runtimeSource?.proposalRuntimeModuleInitialized !== true || value.runtimeSource?.routeLifetimeModuleInitialized !== true ||
    value.runtimeSource?.discardProposalAvailable !== true || value.runtimeSource?.discardEditorAvailable !== true ||
    value.runtimeSource?.createRouteLifetimeAvailable !== true || value.runtimeSource?.useRouteLifetimeAvailable !== true ||
    value.proposals?.initialized !== true || !validSummary(value.proposals) || typeof value.truncated !== "boolean") throw Error("runtime_identity_rejected");
  if (value.editorSessions?.initialized === true && !validSummary(value.editorSessions)) throw Error("runtime_identity_rejected");
  if (value.editorSessions?.initialized === false && (value.editorSessions.count !== null || value.editorSessions.ids !== null)) throw Error("runtime_identity_rejected");
  if (value.truncated !== (value.proposals.truncated || value.editorSessions.truncated)) throw Error("runtime_identity_rejected");
  return value;
}

async function readNativeState(input) {
  let response;
  try { response = await fetch(new URL("/json/list", input.metroOrigin), { signal: AbortSignal.timeout(5_000), redirect: "error" }); }
  catch { throw Error("discovery_failed"); }
  if (!response.ok) throw Error("discovery_failed");
  const body = await response.text();
  if (body.length > 64 * 1024) throw Error("target_rejected");
  let targets;
  try { targets = JSON.parse(body); }
  catch { throw Error("target_rejected"); }
  const endpoint = selectTarget(targets, input.metroOrigin, APP_ID);
  const require = createRequire(new URL("../../node_modules/@react-native/dev-middleware/package.json", import.meta.url));
  const WebSocket = require("ws");
  const socket = new WebSocket(endpoint, { origin: DEBUGGER_ORIGIN, handshakeTimeout: 5_000, maxPayload: 128 * 1024, followRedirects: false });
  try {
    await new Promise((accept, reject) => {
      const timer = setTimeout(() => { socket.terminate(); reject(Error("connect_failed")); }, 5_000);
      const opened = () => { clearTimeout(timer); socket.off("error", failed); accept(); };
      const failed = () => { clearTimeout(timer); socket.off("open", opened); reject(Error("connect_failed")); };
      socket.once("open", opened);
      socket.once("error", failed);
    });
    const result = await request(socket, 1, "Runtime.evaluate", {
      expression: buildReadExpression(input), returnByValue: true, silent: true,
    });
    if (result.error) throw Error("protocol_rejected");
    let envelope;
    try { envelope = JSON.parse(result.result?.result?.value ?? "null"); }
    catch { throw Error("protocol_rejected"); }
    if (envelope?.ok === false) throw Error(SAFE_RUNTIME_ERRORS.has(envelope.error) ? envelope.error : "runtime_rejected");
    if (result.result?.exceptionDetails) throw Error("protocol_rejected");
    if (envelope?.ok !== true) throw Error("protocol_rejected");
    return validateReadback(envelope.value, input);
  } finally { socket.terminate(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const input = parseArguments(process.argv.slice(2));
    const value = await readNativeState(input);
    console.log(JSON.stringify({ ...value, capturedAt: new Date().toISOString() }));
  } catch (error) {
    const reason = SAFE_ERRORS.has(error?.message) ? error.message : "readback_failed";
    console.error(JSON.stringify({ error: reason }));
    process.exitCode = 1;
  }
}
