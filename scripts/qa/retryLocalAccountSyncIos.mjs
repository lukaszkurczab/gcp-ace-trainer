import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseOrigin, request, selectTarget } from "./readNativeStartupTrace.mjs";

const APP_IDS = new Set(["com.lkurczab.patternly", "com.lkurczab.patternly.sec03"]);
const FIREBASE_PROJECT = "patternly-app-sandbox";
const API_ORIGIN = "http://127.0.0.1:8080";
const AUTH_ORIGIN = "http://127.0.0.1:19099";
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const privateDirectory = resolve(repoRoot, ".agent/private/p0-atlas-completion-20261024/native-helper-worker");
const pendingPath = resolve(privateDirectory, "retry-local-account-sync.pending.json");
const beforeReceiptPath = resolve(repoRoot, "../.agent/private/p0-atlas-completion-20261024/ios-after-end.json");

const failures = new Set([
  "accountNotFound", "backendUnavailable", "conflict", "duplicate", "emailUnavailable", "expiredAction",
  "guestChoiceRequired", "invalid", "invalidCredential", "invalidEmail", "journalRecoveryFailure",
  "localCleanupFailure", "localDeletionFailure", "offline", "passwordMismatch", "pendingSyncRequiresNetwork",
  "providerUnavailable", "rateLimited", "reauthenticationRequired", "remoteDeletionPending", "remoteFailure",
  "revokedSession", "sessionRevocationPending", "signOutPending", "unverifiedIdentity", "weakPassword",
]);
const nextStates = new Set([
  "authenticated", "localOffline", "deletionAuthorized", "guest", "providerRegistrationRequired",
  "passwordResetEmailSent", "verificationPending", "verificationSent", "signedOut",
]);

function validateArguments(fingerprint, appId) {
  if (!/^[a-f0-9]{64}$/u.test(fingerprint ?? "") || !APP_IDS.has(appId)) throw Error("arguments_rejected");
}

function readExpectedIdentity(fingerprint, appId, path = beforeReceiptPath) {
  validateArguments(fingerprint, appId);
  let value;
  try { value = JSON.parse(readFileSync(path, "utf8")); } catch { throw Error("before_receipt_unavailable"); }
  const hashes = [value?.uidSha256, value?.accountIdSha256, value?.profile?.profileIdSha256, value?.profile?.accountIdSha256];
  if (value?.schema !== "patternly.offline-account-ios-read.v1" || value.fingerprint !== fingerprint || value.appId !== appId || value.state !== "authenticated"
    || value.profile?.kind !== "account" || hashes.some(hash => !/^[a-f0-9]{64}$/u.test(hash ?? ""))
    || value.accountIdSha256 !== value.profile.accountIdSha256) throw Error("before_receipt_rejected");
  return { uidSha256: value.uidSha256, accountIdSha256: value.accountIdSha256, profileIdSha256: value.profile.profileIdSha256 };
}

function validateExpectedIdentity(value) {
  if (!value || ![value.uidSha256, value.accountIdSha256, value.profileIdSha256].every(hash => /^[a-f0-9]{64}$/u.test(hash ?? ""))) {
    throw Error("before_receipt_rejected");
  }
}

function runtimeExpression({ fingerprint, appId, key, operation, expectedIdentity }) {
  validateArguments(fingerprint, appId);
  if (!/^__localAccountSync_[a-f0-9]{32}$/u.test(key ?? "") || !["run", "status"].includes(operation)) throw Error("arguments_rejected");
  if (operation === "run") validateExpectedIdentity(expectedIdentity);
  const requiredRunChecks = operation === "run" ? `
    const actor=findActor();
    const state=actor.state;
    if(state.kind!=="authenticated"||!state.user?.uid||!state.backendUser?.id||!state.accountData)throw Error("actor_not_authenticated");
    if(actor.isMaterializedAccountTransition)throw Error("account_materialization_pending");
    const uid=state.user.uid,accountId=state.backendUser.id;
    if(!/^[-a-f0-9]{36}$/iu.test(accountId)||state.backendUser.identity?.subject!==uid)throw Error("actor_not_authenticated");
    const fence=actor.captureHomeResumeActorFence();
    if(!fence||!fence.isCurrent())throw Error("actor_unavailable");
    const storage=load("src/infrastructure/storage/mmkvClient.ts");
    const lease=storage.captureActiveProfileStorageLease();
    if(!lease||lease.profile.kind!=="account"||lease.profile.accountId!==accountId||!storage.isActiveProfileStorageLeaseCurrent(lease)||storage.isProfileTransitionActive())throw Error("profile_not_ready");
    const hash=load("src/infrastructure/identity/sha256.ts").sha256Utf8;
    if(hash(uid)!==${JSON.stringify(expectedIdentity?.uidSha256)}||hash(accountId)!==${JSON.stringify(expectedIdentity?.accountIdSha256)}||hash(lease.profile.id)!==${JSON.stringify(expectedIdentity?.profileIdSha256)})throw Error("before_receipt_mismatch");
    const sameOwner=()=>{const current=findActor(),s=current.state,currentLease=storage.captureActiveProfileStorageLease();return s.kind==="authenticated"&&s.user?.uid===uid&&s.backendUser?.id===accountId&&s.accountData!=null&&currentLease?.generation===lease.generation&&currentLease.profile.id===lease.profile.id&&currentLease.profile.kind===lease.profile.kind&&currentLease.profile.accountId===lease.profile.accountId&&storage.isActiveProfileStorageLeaseCurrent(lease)&&!storage.isProfileTransitionActive()&&fence.isCurrent();};
    const context=load("src/application/tracks/trackAdmissionContext.ts");
    const sessions=load("src/storage/repositories/trainingSessionRepository.ts");
    if(await sessions.getActiveTrainingSession(context.productionTrackAdmissionContext))throw Error("active_session_present");
    const journals=load("src/storage/repositories/mutationJournalRepository.ts");
    if(journals.hasPendingMutationJournal())throw Error("mutation_journal_pending");
    const accountRepo=load("src/storage/repositories/accountDataRepository.ts");
    const sync=await accountRepo.getAccountSyncState(context.productionLearningDataAdmissionContext);
    if(sync.accountId!==accountId)throw Error("actor_not_authenticated");
    if(sync.pendingMutationCount!==0||sync.outbox.length!==0)throw Error("account_sync_pending");
    if(sync.materialization!==null)throw Error("account_materialization_pending");
    if(sync.pendingConfirmation!==null)throw Error("account_confirmation_pending");
    if(sync.resetGuard!=null)throw Error("account_reset_pending");
    if(sync.status==="syncing")throw Error("account_sync_busy");
    if(!sameOwner())throw Error("ownership_changed_during_preflight");
    if(globalThis[${JSON.stringify(key)}]&&globalThis[${JSON.stringify(key)}].kind!=="preflight")throw Error("attempt_state_exists");
    const runMarker={kind:"pending",stage:"retry_account_sync_started"};
    globalThis[${JSON.stringify(key)}]=runMarker;
    let command;
    try { if(!sameOwner())throw Error("ownership_changed_before_command"); command=await actor.retryAccountSync(); }
    catch { globalThis[${JSON.stringify(key)}]={kind:"unresolved",category:"command_threw"}; return globalThis[${JSON.stringify(key)}]; }
    const safeResult=command?.kind==="success"&&allowedNextStates.has(command.next)
      ? {kind:"success",next:command.next}
      : command?.kind==="failure"&&allowedFailures.has(command.failure)
        ? {kind:"failure",failure:command.failure} : null;
    if(!safeResult){globalThis[${JSON.stringify(key)}]={kind:"unresolved",category:"command_result_unavailable"};return globalThis[${JSON.stringify(key)}];}
    let after;
    try {
      after=findActor();
      const postState=after.state;
      const postStorage=load("src/infrastructure/storage/mmkvClient.ts");
      const postLease=postStorage.captureActiveProfileStorageLease();
      const sameActor=postState.kind==="authenticated"&&postState.user?.uid===uid&&postState.backendUser?.id===accountId&&postState.accountData!=null;
      const sameProfile=postLease?.profile.kind==="account"&&postLease.profile.id===lease.profile.id&&postLease.profile.accountId===accountId&&postStorage.isActiveProfileStorageLeaseCurrent(postLease)&&!postStorage.isProfileTransitionActive();
      const postFence=after.captureHomeResumeActorFence();
      if(!sameActor||!sameProfile||!postFence||!postFence.isCurrent())throw Error("postcondition_failed");
    } catch { globalThis[${JSON.stringify(key)}]={kind:"unresolved",category:"postcondition_unverified"};return globalThis[${JSON.stringify(key)}]; }
    globalThis[${JSON.stringify(key)}]={kind:"resolved",result:safeResult};
    return globalThis[${JSON.stringify(key)}];` : `
    const value=globalThis[${JSON.stringify(key)}];
    if(!value||!(["preflight","pending","blocked","unresolved","resolved"].includes(value.kind)))throw Error("attempt_state_unavailable");
    if(value.kind==="blocked"&&["runtime_rejected","owner_unavailable","actor_unavailable","actor_not_authenticated","profile_not_ready","before_receipt_mismatch","active_session_present","mutation_journal_pending","account_sync_pending","account_materialization_pending","account_confirmation_pending","account_reset_pending","account_sync_busy","attempt_state_exists","ownership_changed_during_preflight","runtime_unavailable"].includes(value.category))return value;
    if(value.kind==="resolved"&&(value.result?.kind==="success"&&allowedNextStates.has(value.result.next)||value.result?.kind==="failure"&&allowedFailures.has(value.result.failure)))return value;
    return value.kind==="pending"||value.kind==="preflight"?{kind:"pending",stage:value.kind==="preflight"?"preflight":"retry_account_sync_in_flight"}:{kind:"unresolved",category:["command_threw","command_result_unavailable","postcondition_unverified"].includes(value.category)?value.category:"attempt_state_unavailable"};`;

  return `${operation === "status" ? "(()=>{" : "(async()=>{"}
    if(!globalThis.HermesInternal||typeof __DEV__==="undefined"||!__DEV__)throw Error("runtime_rejected");
    const entries=Array.from(__r.getModules().entries());
    const load=path=>{const matches=entries.filter(([,module])=>module.isInitialized&&module.verboseName.endsWith(path));if(matches.length!==1)throw Error("owner_unavailable");return __r(matches[0][0]);};
    const identity=load("src/infrastructure/runtime/environmentIdentity.ts").readEnvironmentIdentity();
    const constants=load("node_modules/expo-constants/build/Constants.js").default;
    const publicConfig=load("src/infrastructure/firebase/publicConfig.ts");
    if(identity.mode!=="smoke"||identity.fingerprint!==${JSON.stringify(fingerprint)}||identity.apiOrigin!==${JSON.stringify(API_ORIGIN)}||identity.firebaseProjectId!==${JSON.stringify(FIREBASE_PROJECT)}
      ||publicConfig.readDevelopmentFirebaseAuthEmulatorOrigin()!==${JSON.stringify(AUTH_ORIGIN)}
      ||constants.expoConfig?.extra?.patternlyEnvironmentFingerprint!==identity.fingerprint
      ||constants.expoConfig?.ios?.bundleIdentifier!==${JSON.stringify(appId)})throw Error("runtime_rejected");
    const allowedFailures=new Set(${JSON.stringify([...failures])});
    const allowedNextStates=new Set(${JSON.stringify([...nextStates])});
    const hook=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    const findActor=()=>{if(!hook)throw Error("actor_unavailable");const actors=[];for(const id of hook.renderers.keys())for(const root of hook.getFiberRoots(id)){const walk=f=>{if(!f)return;const value=f.memoizedProps?.value;if(value&&typeof value.retryAccountSync==="function"&&typeof value.captureHomeResumeActorFence==="function"&&value.state)actors.push(value);walk(f.child);walk(f.sibling);};walk(root.current);}if(actors.length!==1)throw Error("actor_unavailable");return actors[0];};
    ${requiredRunChecks}
  })()`;
}

export function buildRetryLocalAccountSyncExpression({ fingerprint, appId, key, operation = "run", expectedIdentity }) {
  return runtimeExpression({ fingerprint, appId, key, operation, expectedIdentity });
}

function readPendingAttempt(path = pendingPath) {
  if (!existsSync(path)) return null;
  const value = JSON.parse(readFileSync(path, "utf8"));
  if (value?.schema !== "patternly.local-account-sync-attempt.v1" || value.status !== "unresolved"
    || !APP_IDS.has(value.appId) || !/^[a-f0-9]{64}$/u.test(value.fingerprint ?? "")
    || !/^__localAccountSync_[a-f0-9]{32}$/u.test(value.key ?? "")) throw Error("attempt_state_invalid");
  validateExpectedIdentity(value.expectedIdentity);
  return value;
}

function writePrivateJson(path, value, flag = "w") {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, `${JSON.stringify(value)}\n`, { mode: 0o600, flag });
}

function finishAttempt(value, result, directory = privateDirectory) {
  const receiptPath = resolve(directory, `retry-local-account-sync-${value.runId}.json`);
  writePrivateJson(receiptPath, {
    schema: "patternly.local-account-sync-receipt.v1",
    appId: value.appId,
    fingerprint: value.fingerprint,
    outcome: result.kind === "resolved" ? result.result : { kind: "unresolved", category: result.category },
  }, "wx");
  rmSync(resolve(directory, "retry-local-account-sync.pending.json"), { force: true });
  return receiptPath;
}

async function connect(originValue, appId) {
  const origin = parseOrigin(originValue);
  const response = await fetch(new URL("/json/list", origin), { signal: AbortSignal.timeout(5000), redirect: "error" });
  if (!response.ok) throw Error("discovery_failed");
  const body = await response.text();
  if (body.length > 64 * 1024) throw Error("target_rejected");
  const endpoint = selectTarget(JSON.parse(body), origin, appId);
  const require = createRequire(new URL("../../node_modules/@react-native/dev-middleware/package.json", import.meta.url));
  const WebSocket = require("ws");
  const socket = new WebSocket(endpoint, { origin: `http://127.0.0.1:${origin.port}`, handshakeTimeout: 5000, maxPayload: 256 * 1024, followRedirects: false });
  await new Promise((accept, reject) => { socket.once("open", accept); socket.once("error", () => reject(Error("connect_failed"))); });
  let sequence = 0;
  const key = `__localAccountSync_${randomUUID().replaceAll("-", "")}`;
  return { socket, WebSocket, key, evaluate: async expression => {
    const result = await request(socket, ++sequence, "Runtime.evaluate", { expression, returnByValue: true, silent: true });
    if (result.error || result.result?.exceptionDetails) throw Error("evaluation_rejected");
    return result.result?.result?.value;
  } };
}

export async function retryLocalAccountSyncIos(originValue, fingerprint, appId = "com.lkurczab.patternly", expectedIdentity = readExpectedIdentity(fingerprint, appId)) {
  validateArguments(fingerprint, appId);
  validateExpectedIdentity(expectedIdentity);
  const existing = readPendingAttempt();
  if (existing) throw Error("attempt_unresolved");
  const channel = await connect(originValue, appId);
  const runId = randomUUID();
  const pending = { schema: "patternly.local-account-sync-attempt.v1", status: "unresolved", runId, key: channel.key, fingerprint, appId, expectedIdentity };
  writePrivateJson(pendingPath, pending, "wx");
  try {
    const scheduled = await channel.evaluate(`(()=>{globalThis[${JSON.stringify(channel.key)}]={kind:"preflight",stage:"preflight"};Promise.resolve().then(()=>${runtimeExpression({ fingerprint, appId, key: channel.key, operation: "run", expectedIdentity })}).then(result=>{globalThis[${JSON.stringify(channel.key)}]=result;}).catch(error=>{const safe=new Set(["runtime_rejected","owner_unavailable","actor_unavailable","actor_not_authenticated","profile_not_ready","before_receipt_mismatch","active_session_present","mutation_journal_pending","account_sync_pending","account_materialization_pending","account_confirmation_pending","account_reset_pending","account_sync_busy","attempt_state_exists","ownership_changed_during_preflight"]);const current=globalThis[${JSON.stringify(channel.key)}];globalThis[${JSON.stringify(channel.key)}]=current?.kind==="pending"?{kind:"unresolved",category:"runtime_failure"}:{kind:"blocked",category:safe.has(error?.message)?error.message:"runtime_unavailable"};});return "scheduled";})()`);
    if (scheduled !== "scheduled") throw Error("evaluation_rejected");
    const result = await pollStatus(channel.evaluate, fingerprint, appId, channel.key);
    if (result.kind === "resolved") {
      const receipt = finishAttempt(pending, result);
      await channel.evaluate(`delete globalThis[${JSON.stringify(channel.key)}]`).catch(() => {});
      return { schema: "patternly.local-account-sync-receipt.v1", appId, fingerprint, outcome: result.result, receiptPath: receipt };
    }
    if (result.kind === "blocked") {
      rmSync(pendingPath, { force: true });
      await channel.evaluate(`delete globalThis[${JSON.stringify(channel.key)}]`).catch(() => {});
      throw Error(result.category);
    }
    throw Error(result.kind === "pending" ? "command_timeout" : "attempt_unresolved");
  } catch (error) {
    throw error;
  } finally { channel.socket.terminate(); }
}

async function pollStatus(evaluate, fingerprint, appId, key) {
  const source = runtimeExpression({ fingerprint, appId, key, operation: "status" });
  for (let attempt = 0; attempt < 100; attempt++) {
    const raw = await evaluate(`JSON.stringify(${source})`);
    const result = JSON.parse(raw);
    if (result.kind !== "pending") return result;
    await new Promise(accept => setTimeout(accept, 100));
  }
  return { kind: "pending", stage: "retry_account_sync_in_flight" };
}

export async function inspectRetryLocalAccountSyncIos(originValue, fingerprint, appId = "com.lkurczab.patternly") {
  validateArguments(fingerprint, appId);
  const pending = readPendingAttempt();
  if (!pending || pending.fingerprint !== fingerprint || pending.appId !== appId) throw Error("attempt_state_unavailable");
  const expectedIdentity = readExpectedIdentity(fingerprint, appId);
  if (JSON.stringify(pending.expectedIdentity) !== JSON.stringify(expectedIdentity)) throw Error("attempt_state_unavailable");
  const channel = await connect(originValue, appId);
  try {
    const raw = await channel.evaluate(`JSON.stringify(${runtimeExpression({ fingerprint, appId, key: pending.key, operation: "status" })})`);
    const result = JSON.parse(raw);
    if (result.kind === "resolved") {
      const receiptPath = finishAttempt(pending, result);
      await channel.evaluate(`delete globalThis[${JSON.stringify(pending.key)}]`).catch(() => {});
      return { schema: "patternly.local-account-sync-receipt.v1", appId, fingerprint, outcome: result.result, receiptPath };
    }
    if (result.kind === "blocked") {
      rmSync(pendingPath, { force: true });
      await channel.evaluate(`delete globalThis[${JSON.stringify(pending.key)}]`).catch(() => {});
      return result;
    }
    return result;
  } finally { channel.socket.terminate(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [operation, origin, fingerprint, appId, ...extra] = process.argv.slice(2);
  const safe = new Set(["arguments_rejected", "before_receipt_unavailable", "before_receipt_rejected", "before_receipt_mismatch", "ownership_changed_during_preflight", "origin_rejected", "target_rejected", "discovery_failed", "connect_failed", "runtime_rejected", "owner_unavailable", "actor_unavailable", "actor_not_authenticated", "profile_not_ready", "active_session_present", "mutation_journal_pending", "account_sync_pending", "account_materialization_pending", "account_confirmation_pending", "account_reset_pending", "account_sync_busy", "attempt_state_exists", "attempt_state_invalid", "attempt_state_unavailable", "attempt_unresolved", "command_timeout", "evaluation_rejected", "transport_closed", "runtime_unavailable"]);
  Promise.resolve().then(() => {
    if (extra.length || !["run", "status"].includes(operation)) throw Error("arguments_rejected");
    return operation === "run" ? retryLocalAccountSyncIos(origin, fingerprint, appId) : inspectRetryLocalAccountSyncIos(origin, fingerprint, appId);
  }).then(value => console.log(JSON.stringify(value))).catch(error => {
    console.error(JSON.stringify({ stage: "local_account_sync_retry", category: safe.has(error?.message) ? error.message : "retry_unavailable" }));
    process.exitCode = 1;
  });
}
