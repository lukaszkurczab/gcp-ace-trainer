import { createRequire } from 'node:module';
import { open, lstat, realpath, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const APP_PACKAGE = resolve(APP_ROOT, 'package.json');
const CDP_TIMEOUT_MS = 5_000;
const INVENTORY_TIMEOUT_MS = 30_000;
const OPERATION_KEY = '__patternlyGuestExportReadbackV1';
const OPERATION_PROTOCOL = 'patternly-guest-export-readback-v2';
const PREVIOUS_OPERATION_PROTOCOL = 'patternly-guest-export-readback-v1';
const NATIVE_TITLE = 'com.lkurczab.patternly (iPhone 17)';

const ERROR_CATEGORIES = new Set([
  'input_rejected', 'private_root_invalid', 'private_file_invalid', 'private_path_invalid',
  'metro_origin_rejected',
  'expected_guest_hash_rejected', 'native_target_ambiguous', 'native_target_rejected',
  'native_connect_timeout', 'native_connect_failed', 'native_read_timeout',
  'native_owner_read_rejected', 'native_read_busy', 'native_guest_profile_mismatch',
  'native_inventory_timeout', 'native_inventory_unavailable', 'private_snapshot_write_failed',
]);

export function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    if (!['--private-root', '--expected-guest-sha256', '--output', '--metro-origin'].includes(name) || values.has(name)) throw new Error('input_rejected');
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error('input_rejected');
    values.set(name, value);
    index += 1;
  }
  if (values.size !== 4) throw new Error('input_rejected');
  if (!/^[a-f0-9]{64}$/u.test(values.get('--expected-guest-sha256') ?? '')) throw new Error('expected_guest_hash_rejected');
  const metroOrigin = parseMetroOrigin(values.get('--metro-origin'));
  return Object.freeze({
    privateRoot: values.get('--private-root'),
    expectedGuestProfileIdSha256: values.get('--expected-guest-sha256'),
    output: values.get('--output'),
    metroOrigin,
  });
}

export function parseMetroOrigin(value) {
  if (typeof value !== 'string') throw new Error('metro_origin_rejected');
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error('metro_origin_rejected'); }
  const port = Number(parsed.port);
  if (parsed.protocol !== 'http:' || parsed.hostname !== '127.0.0.1' || !parsed.port
    || !Number.isInteger(port) || port < 1 || port > 65_535
    || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash
    || parsed.origin !== value || value !== `http://127.0.0.1:${port}`) throw new Error('metro_origin_rejected');
  return parsed.origin;
}

export function validateNativeWebSocketEndpoint(value, metroOrigin) {
  let endpoint;
  let origin;
  try { endpoint = new URL(value); origin = new URL(metroOrigin); } catch { throw new Error('native_target_rejected'); }
  if (endpoint.protocol !== 'ws:' || endpoint.hostname !== '127.0.0.1' || endpoint.port !== origin.port
    || endpoint.username || endpoint.password || endpoint.hash || origin.protocol !== 'http:'
    || origin.hostname !== '127.0.0.1' || !origin.port) throw new Error('native_target_rejected');
  return endpoint;
}

export function nativeTargetConnectionSettings(webSocketDebuggerUrl, metroOrigin) {
  const endpoint = validateNativeWebSocketEndpoint(webSocketDebuggerUrl, metroOrigin);
  return Object.freeze({ listUrl: `${metroOrigin}/json/list`, webSocketUrl: endpoint.href, webSocketOrigin: metroOrigin });
}

function privateBasename(name) {
  if (typeof name !== 'string' || isAbsolute(name) || name.includes('/') || name.includes('\\')
    || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/u.test(name)) throw new Error('private_path_invalid');
  return name;
}

function resolvePrivateFile(privateRoot, name) {
  const basename = privateBasename(name);
  const path = resolve(privateRoot, basename);
  if (dirname(path) !== privateRoot || relative(privateRoot, path) !== basename || basename.startsWith('.')) throw new Error('private_path_invalid');
  return path;
}

export function resolveInitializedOwnerId(ownerEntries, suffix) {
  const matches = ownerEntries.filter(([, module]) => module?.isInitialized === true
    && typeof module.verboseName === 'string' && module.verboseName.endsWith(suffix));
  return matches.length === 1 ? matches[0][0] : null;
}

export function buildReadExpression(expectedGuestProfileIdSha256, runId) {
  if (!/^[a-f0-9]{64}$/u.test(expectedGuestProfileIdSha256) || !/^[a-f0-9-]{36}$/u.test(runId)) throw new Error('input_rejected');
  const key = JSON.stringify(OPERATION_KEY);
  const expectedGuestHash = JSON.stringify(expectedGuestProfileIdSha256);
  const run = JSON.stringify(runId);
  return `(()=>{
    const operationKey=${key};
    const expectedGuestProfileIdSha256=${expectedGuestHash};
    const runId=${run};
    const existing=globalThis[operationKey];
    if(existing!==undefined){
      if(existing?.protocol!==${JSON.stringify(OPERATION_PROTOCOL)}&&existing?.protocol!==${JSON.stringify(PREVIOUS_OPERATION_PROTOCOL)})return {kind:"busy"};
      if(existing.state==="pending"){
        if(existing.protocol!==${JSON.stringify(OPERATION_PROTOCOL)}||existing.expectedGuestProfileIdSha256!==expectedGuestProfileIdSha256||!/^[A-Za-z0-9-]{36}$/.test(existing.runId??""))return {kind:"busy"};
        return {kind:"attached",runId:existing.runId,state:existing.state,phase:existing.phase};
      }
      if(existing.state!=="done"&&existing.state!=="failed")return {kind:"busy"};
      delete globalThis[operationKey];
      if(Object.prototype.hasOwnProperty.call(globalThis,operationKey))return {kind:"busy"};
    }
    const operation={protocol:${JSON.stringify(OPERATION_PROTOCOL)},expectedGuestProfileIdSha256,runId,state:"pending",phase:"scheduled",startedAt:Date.now(),result:null,failure:null};
    globalThis[operationKey]=operation;
    const reject=(category)=>{const error=new Error(category);error.guestReadCategory=category;throw error;};
    const owners=Array.from(__r.getModules().entries());
    const resolveOwner=${resolveInitializedOwnerId.toString()};
    const load=(suffix)=>{const id=resolveOwner(owners,suffix);if(id===null)reject("owner_unavailable");return __r(id);};
    const repo=(name)=>load("src/storage/repositories/"+name+"Repository.ts");
    const runtime=load("src/infrastructure/runtime/runtimeMode.ts");
    const storage=load("src/infrastructure/storage/mmkvClient.ts");
    const hash=load("src/infrastructure/identity/sha256.ts").sha256Utf8;
    const canonical=load("src/domain/identity/canonicalSerialization.ts").canonicalSerialize;
    const learningAdmission=load("src/application/tracks/trackAdmissionContext.ts").productionLearningDataAdmissionContext;
    const trackAdmission=learningAdmission.trackAdmission;
    const profileState=()=>storage.inspectPreparedProfileState();
    const scopeReader=load("src/storage/repositories/learningPlanInputSnapshot.ts");
    const capture=(state)=>{
      if(typeof __DEV__==="undefined"||!__DEV__||!runtime.isPatternlySmokeRuntime())reject("runtime_rejected");
      const lease=storage.captureActiveProfileStorageLease();
      if(!lease||!storage.isActiveProfileStorageLeaseCurrent(lease))reject("guest_lease_unavailable");
      const profile=storage.getActiveStorageProfileOrNull();
      if(!profile||profile.id!==lease.profile.id||profile.kind!==lease.profile.kind||profile.accountId!==null||profile.kind!=="guest")reject("guest_profile_required");
      const profileIdSha256=hash(profile.id);
      if(profileIdSha256!==expectedGuestProfileIdSha256)reject("guest_profile_hash_mismatch");
      if(state.selectedProfile.id!==profile.id||state.selectedProfile.kind!==profile.kind)reject("guest_selection_mismatch");
      const guests=state.profiles.filter((entry)=>entry.kind==="guest");
      if(guests.length!==1||guests[0]?.id!==profile.id)reject("guest_registry_not_unique");
      const guestInstallation=repo("guestInstallation").readGuestInstallation();
      if(!guestInstallation||guestInstallation.bindingState!=="guest"||guestInstallation.accountId!==null
        ||guestInstallation.localDatasetId!==profile.id)reject("guest_marker_invalid");
      const scope=scopeReader.readLearningPlanStorageScope();
      const journal=repo("mutationJournal").getActiveMutationJournal(learningAdmission);
      if(journal)reject("source_pending");
      try{
        repo("trainingEvidenceIntegrity").assertTrainingEvidenceIntegrity(trackAdmission);
        repo("contentIdentityUnavailable").assertContentIdentityRecordIntegrity();
      }catch{reject("source_invalid");}
      const sessionsResult=repo("trainingSession").readTrainingSessions(trackAdmission);
      const attemptsResult=repo("trainingAttempt").readTrainingAttempts(trackAdmission);
      const reviewResult=repo("reviewQueue").readReviewQueueSnapshot(trackAdmission);
      if(!sessionsResult.ok||sessionsResult.issues?.length||!attemptsResult.ok||attemptsResult.issues?.length||!reviewResult.ok||reviewResult.issues?.length)reject("source_invalid");
      const sessions=sessionsResult.value;
      if(new Set(sessions.map((entry)=>entry.id)).size!==sessions.length)reject("source_invalid");
      const activeSession=repo("trainingSession").readActiveTrainingSession(trackAdmission);
      const activeSessions=sessions.filter((entry)=>entry.status==="active");
      if(activeSessions.length>1||(activeSession===null)!==(activeSessions.length===0)||(activeSession!==null&&activeSessions[0]?.id!==activeSession.id))reject("source_invalid");
      const draft=repo("trainingSessionDraft").readActiveTrainingSessionDraft(trackAdmission);
      if(draft&&(!activeSession||draft.sessionId!==activeSession.id||draft.trackId!==activeSession.trackId))reject("source_invalid");
      const foregroundTimer=repo("foregroundTimer").readActiveForegroundTimer(trackAdmission);
      if(foregroundTimer&&(!activeSession||foregroundTimer.sessionId!==activeSession.id||foregroundTimer.trackId!==activeSession.trackId))reject("source_invalid");
      const results=sessions.flatMap((session)=>{
        const result=repo("trainingSessionResult").readTrainingSessionResult(session.id,trackAdmission);
        if(session.status==="completed"&&result===null)reject("source_invalid");
        if(result&&result.sessionId!==session.id)reject("source_invalid");
        return result?[{sessionId:session.id,result}]:[];
      });
      const domain=load("src/domain/index.ts");
      const goalPolicy=load("src/domain/tracks/trackGoalPolicies.ts").requireGoalPolicy;
      const goals=[];
      const acceptedPlans=[];
      for(const trackId of domain.LAUNCH_TRACK_IDS){
        const policy=goalPolicy(trackId);
        const goal=repo("goal").readGoalSnapshot(trackId,policy);
        const plan=repo("learningPlan").getLearningPlanSnapshot(trackId,policy);
        if(plan&&(!goal||plan.plan.goalRevision!==goal.revision||canonical(plan.plan.acceptedTarget)!==canonical(domain.acceptedTargetFromGoal(goal.record))))reject("source_invalid");
        if(goal)goals.push({trackId,goal:goal.record});
        if(plan)acceptedPlans.push({trackId,plan:plan.plan});
      }
      const onboarding=repo("goalOnboardingPreference").readGoalOnboardingPreferencesForExport();
      const reminder=repo("notificationSettings").readReminderPreferencesForExport();
      if(reminder.hasPendingJournal)reject("source_pending");
      const retainedContentHistory=repo("contentIdentityUnavailable").readContentIdentityRetainedHistory();
      const rawUserReports=repo("contentReportOutbox").getContentReportOutbox();
      const userReports=rawUserReports.map((entry)=>{
        const input=entry.input;
        return {
          trackId:input.trackId,contentVersion:input.contentVersion,itemId:input.itemId,reason:input.reason,description:input.description,
          context:{trackNode:input.context.trackNode,modeRoute:input.context.modeRoute,locale:input.context.locale,occurredAt:input.context.occurredAt},
          ...(input.contactEmail===undefined?{}:{contactEmail:input.contactEmail}),
        };
      });
      const exportInputs={
        schemaVersion:"patternly-local-guest-export-v1",
        profile:{kind:"local_guest"},
        activeTrackId:repo("activeTrack").readActiveTrackId(),
        settings:{
          application:repo("settings").readSettings(),
          goalOnboardingDismissedTrackIds:onboarding.dismissedTrackIds,
          reminders:reminder.preferences,
        },
        learning:{
          sessions,activeSessionId:activeSession?.id??null,activeSessionDraft:draft,foregroundTimer,
          attempts:attemptsResult.value,results,reviews:reviewResult.value.entries,goals,acceptedPlans,
          retainedContentHistory,
        },
        userReports,
        manifest:{
          included:["active track","learning progress evidence","sessions and saved draft","answers and results","review schedule","goals and accepted plans","retained history whose original question content is unavailable","app and goal onboarding preferences","reminder preferences","locally saved learning reports"],
          omitted:[
            {category:"profile and account identifiers",reason:"The export contains only the learning data owned by the active Guest profile; installation identifiers are not needed in the file."},
            {category:"notification delivery identifiers and transaction journals",reason:"These are device implementation details; user-selected reminder settings are included."},
            {category:"report delivery identifiers and transport state",reason:"The export includes the report content you submitted, not submission IDs, account-link choices, retry counts, or delivery errors."},
            {category:"report release, build, and platform diagnostics",reason:"These technical context fields are not needed to carry the report text and are omitted from this local copy."},
            {category:"account sync and cloud state",reason:"This is a local Guest export and does not include account or server state."},
            {category:"question banks and downloaded content cache",reason:"Learning content is not personal progress data and can be retrieved by the app."},
            {category:"unavailable question content",reason:"Some retained history refers to question content that is no longer available in this installation; the preserved session, answer, result, and review records are included, while missing question text cannot be reconstructed."},
            {category:"infrastructure and diagnostic logs",reason:"Technical records are not part of the learner's local data export."},
          ],
        },
      };
      if(repo("mutationJournal").getActiveMutationJournal(learningAdmission)||!storage.isActiveProfileStorageLeaseCurrent(lease)
        ||scopeReader.readLearningPlanStorageScope()!==scope)reject("source_changed");
      return {
        lease:{generation:lease.generation,profile:{id:lease.profile.id,kind:lease.profile.kind,accountId:lease.profile.accountId}},
        scope,profileId:profile.id,profileIdSha256,profileKind:profile.kind,guestInstallation,goalOnboardingRevision:onboarding.revision,reminderRevision:reminder.revision,
        exportInputs,rawUserReports,
        fingerprint:canonical({profileId:profile.id,guestInstallation,goalOnboardingRevision:onboarding.revision,reminderRevision:reminder.revision,exportInputs,rawUserReports}),
      };
    };
    const safeFailure=(error)=>{
        const allowed=new Set(["runtime_rejected","owner_unavailable","guest_lease_unavailable","guest_profile_required","guest_profile_hash_mismatch","guest_selection_mismatch","guest_registry_not_unique","guest_marker_invalid","source_pending","source_invalid","source_changed","inventory_unavailable"]);
      return allowed.has(error?.guestReadCategory)?error.guestReadCategory:"source_invalid";
    };
    const run=async()=>{
      try{
        operation.phase="registry_read";
        const firstState=await profileState();
        operation.phase="canonical_capture_before_inventory";
        const first=capture(firstState);
        operation.phase="inventory";
        const inventory=await storage.inspectPreparedQ13StorageInventory();
        if(inventory?.kind!=="observed"||inventory.complete!==true)reject("inventory_unavailable");
        const expectedInventoryProfiles=firstState.profiles.map((profile)=>({profileIdSha256:hash(profile.id),kind:profile.kind})).sort((left,right)=>left.profileIdSha256.localeCompare(right.profileIdSha256));
        const observedInventoryProfiles=inventory.profileInventories?.map((profile)=>({profileIdSha256:profile.profileIdSha256,kind:profile.kind})).sort((left,right)=>left.profileIdSha256.localeCompare(right.profileIdSha256));
        const inventoryGuests=inventory.profileInventories?.filter((profile)=>profile.profileIdSha256===expectedGuestProfileIdSha256&&profile.kind==="guest")??[];
        const expectedRegistryIdentityRows=firstState.profiles.map((profile)=>[hash(profile.id),profile.kind,profile.accountId===null?null:hash(profile.accountId)]).sort((left,right)=>JSON.stringify(left).localeCompare(JSON.stringify(right)));
        if(!Number.isSafeInteger(inventory.registryGeneration)||inventory.registryGeneration<0||!/^[a-f0-9]{64}$/u.test(inventory.registryChecksumSha256??"")
          ||inventory.profileCount!==firstState.profiles.length||!observedInventoryProfiles||inventory.profileInventories?.length!==inventory.profileCount
          ||canonical(expectedInventoryProfiles)!==canonical(observedInventoryProfiles)||inventoryGuests.length!==1
          ||inventoryGuests[0]?.kind!==first.profileKind
          ||inventory.profileInventories.filter((profile)=>profile.kind==="guest").length!==1
          ||inventory.profileInventorySha256!==hash(JSON.stringify(expectedRegistryIdentityRows)))reject("source_changed");
        operation.phase="canonical_revalidation";
        const secondState=await profileState();
        const second=capture(secondState);
        if(first.scope!==second.scope||first.lease.generation!==second.lease.generation||first.lease.profile.id!==second.lease.profile.id
          ||first.fingerprint!==second.fingerprint||canonical(firstState.profiles)!==canonical(secondState.profiles))reject("source_changed");
        operation.result={
          schemaVersion:1,stage:"native_guest_export_readback",capturedAt:new Date().toISOString(),
          registry:{selectedProfileKind:firstState.selectedProfile.kind,selectedProfileIdSha256:first.profileIdSha256,profileCount:firstState.profiles.length,guestCount:firstState.profiles.filter((entry)=>entry.kind==="guest").length},
          canonicalExportInputs:first.exportInputs,rawUserReports:first.rawUserReports,
          source:{fingerprintSha256:hash(first.fingerprint),goalOnboardingRevision:first.goalOnboardingRevision,reminderRevision:first.reminderRevision},
          inventory:{
            registryGeneration:inventory.registryGeneration,registryChecksumSha256:inventory.registryChecksumSha256,
            profileCount:inventory.profileCount,profileInventorySha256:inventory.profileInventorySha256,
            physicalKeyCount:inventory.physicalKeyCount,physicalInventorySha256:inventory.physicalInventorySha256,
            profileInventories:inventory.profileInventories?.map((profile)=>({
              profileIdSha256:profile.profileIdSha256,kind:profile.kind,keyCount:profile.keyCount,inventorySha256:profile.inventorySha256,
              categoryInventories:profile.categoryInventories?.map((category)=>({category:category.category,keyCount:category.keyCount,inventorySha256:category.inventorySha256})),
            })),
            globalInventories:inventory.globalInventories?.map((entry)=>({category:entry.category,keyCount:entry.keyCount,inventorySha256:entry.inventorySha256})),
            control:inventory.control?{
              kind:inventory.control.kind,slotCount:inventory.control.slotCount,slotInventorySha256:inventory.control.slotInventorySha256,
              accountBindingState:inventory.control.accountBindingState,journalState:inventory.control.journalState,
              logoutState:inventory.control.logoutState,logoutGlobalStatus:inventory.control.logoutGlobalStatus,logoutActorStatus:inventory.control.logoutActorStatus,
            }:null,
            secureControl:inventory.secureControl?{
              kind:inventory.secureControl.kind,slotCount:inventory.secureControl.slotCount,
              keyMaterialPresentCount:inventory.secureControl.keyMaterialPresentCount,inventorySha256:inventory.secureControl.inventorySha256,
            }:null,
          },
        };
        operation.state="done";operation.phase="settled";
      }catch(error){
        operation.failure=safeFailure(error);operation.state="failed";operation.phase="settled";
      }
    };
    Promise.resolve().then(run).catch(()=>{operation.failure="source_invalid";operation.state="failed";operation.phase="settled";});
    return {kind:"started",runId};
  })()`;
}

async function validatePaths(args) {
  const privateRoot = resolve(args.privateRoot);
  const rootMetadata = await lstat(privateRoot);
  if (!rootMetadata.isDirectory() || rootMetadata.uid !== process.getuid() || (rootMetadata.mode & 0o777) !== 0o700 || await realpath(privateRoot) !== privateRoot) throw new Error('private_root_invalid');
  if (!/^[a-f0-9]{64}$/u.test(args.expectedGuestProfileIdSha256 ?? '')) throw new Error('expected_guest_hash_rejected');
  const outputPath = resolvePrivateFile(privateRoot, args.output);
  return { privateRoot, outputPath, expectedGuestProfileIdSha256: args.expectedGuestProfileIdSha256 };
}

async function connectToNativeTarget(WS, metroOrigin) {
  const response = await fetch(`${metroOrigin}/json/list`, { signal: AbortSignal.timeout(CDP_TIMEOUT_MS) });
  if (!response.ok) throw new Error('native_target_rejected');
  const targets = await response.json();
  const matches = targets.filter((target) => target.type === 'node' && target.title === NATIVE_TITLE);
  if (matches.length !== 1) throw new Error('native_target_ambiguous');
  const connection = nativeTargetConnectionSettings(matches[0].webSocketDebuggerUrl, metroOrigin);
  const socket = new WS(connection.webSocketUrl, { origin: connection.webSocketOrigin });
  await new Promise((resolveOpen, rejectOpen) => {
    const timer = setTimeout(() => { socket.terminate(); rejectOpen(new Error('native_connect_timeout')); }, CDP_TIMEOUT_MS);
    socket.once('open', () => { clearTimeout(timer); resolveOpen(); });
    socket.once('error', () => { clearTimeout(timer); rejectOpen(new Error('native_connect_failed')); });
  });
  return socket;
}

function createCdpEvaluator(socket) {
  let nextId = 0;
  const pending = new Map();
  socket.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      const resolveMessage = pending.get(message.id);
      if (resolveMessage) resolveMessage(message);
    } catch { /* malformed CDP frames are ignored; the bounded request reports timeout */ }
  });
  return (expression, timeoutMs = CDP_TIMEOUT_MS) => new Promise((resolveResult, rejectResult) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); rejectResult(new Error('native_read_timeout')); }, timeoutMs);
    pending.set(id, (message) => {
      clearTimeout(timer);pending.delete(id);
      if (message.error || message.result?.exceptionDetails) rejectResult(new Error('native_owner_read_rejected'));
      else resolveResult(message.result?.result?.value);
    });
    socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }), (error) => {
      if (!error) return;
      clearTimeout(timer);pending.delete(id);rejectResult(new Error('native_owner_read_rejected'));
    });
  });
}

async function settleRead(evaluate, expectedGuestProfileIdSha256, runId) {
  const startExpression = buildReadExpression(expectedGuestProfileIdSha256, runId);
  const started = await evaluate(startExpression);
  if (!started || !['started', 'attached'].includes(started.kind) || !/^[A-Za-z0-9-]{36}$/u.test(started.runId ?? '')) throw new Error('native_read_busy');
  const attachedRunId = started.runId;
  const deadline = Date.now() + INVENTORY_TIMEOUT_MS;
  let lastPhase = started.phase;
  while (Date.now() < deadline) {
    const remaining = Math.max(1, deadline - Date.now());
    let raw;
    try {
      raw = await evaluate(`JSON.stringify(globalThis[${JSON.stringify(OPERATION_KEY)}]??null)`, Math.min(remaining, INVENTORY_TIMEOUT_MS));
    } catch (cause) {
      if (cause?.message !== 'native_read_timeout') throw cause;
      const error = new Error(lastPhase === 'inventory' ? 'native_inventory_timeout' : 'native_read_timeout');
      error.runId = attachedRunId;
      throw error;
    }
    let state;
    try { state = JSON.parse(raw); } catch { throw new Error('native_owner_read_rejected'); }
    if (!state || state.protocol !== OPERATION_PROTOCOL || state.runId !== attachedRunId
      || state.expectedGuestProfileIdSha256 !== expectedGuestProfileIdSha256) throw new Error('native_read_busy');
    lastPhase = state.phase;
    if (state.state === 'failed') {
      const category = state.failure === 'inventory_unavailable' ? 'native_inventory_unavailable'
        : state.failure === 'guest_profile_hash_mismatch' ? 'native_guest_profile_mismatch' : 'native_owner_read_rejected';
      const error = new Error(category);
      error.runId = attachedRunId;
      throw error;
    }
    if (state.state === 'done') return { runId: attachedRunId, snapshot: state.result };
    if (state.state !== 'pending') throw new Error('native_owner_read_rejected');
    await new Promise((resolveWait) => setTimeout(resolveWait, Math.min(250, Math.max(1, deadline - Date.now()))));
  }
  const error = new Error(lastPhase === 'inventory' ? 'native_inventory_timeout' : 'native_read_timeout');
  error.runId = attachedRunId;
  throw error;
}

async function clearSettledOperation(evaluate, runId) {
  const expression = `(()=>{const key=${JSON.stringify(OPERATION_KEY)};const operation=globalThis[key];if(operation?.runId===${JSON.stringify(runId)}&&operation.state!=="pending"){delete globalThis[key];return true;}return false;})()`;
  await evaluate(expression).catch(() => undefined);
}

async function writePrivateSnapshot(path, snapshot) {
  let handle;
  let created = false;
  try {
    handle = await open(path, 'wx', 0o600);
    created = true;
    await handle.writeFile(`${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    await handle.sync();
  } catch {
    if (created) await unlink(path).catch(() => undefined);
    throw new Error('private_snapshot_write_failed');
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

function summarizeSnapshot(snapshot) {
  const learning = snapshot.canonicalExportInputs.learning;
  return {
    stage: snapshot.stage, guestProfiles: snapshot.registry.guestCount, profiles: snapshot.registry.profileCount,
    sessions: learning.sessions.length, attempts: learning.attempts.length, results: learning.results.length,
    goals: learning.goals.length, acceptedPlans: learning.acceptedPlans.length,
    userReports: snapshot.canonicalExportInputs.userReports.length,
    retainedArchiveSessions: learning.retainedContentHistory.archivalSessions.length,
    unavailableActiveSessions: learning.retainedContentHistory.unavailableActiveSessions.length,
    unavailableReviews: learning.retainedContentHistory.unavailableReviews.length,
    inventoryComplete: true, privateOutputWritten: true,
  };
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArguments(argv);
  const paths = await validatePaths(args);
  const require = createRequire(APP_PACKAGE);
  const WS = require('ws');
  const socket = await connectToNativeTarget(WS, args.metroOrigin);
  const evaluate = createCdpEvaluator(socket);
  const proposedRunId = randomUUID();
  let settledRunId;
  let snapshot;
  let keepPendingOperation = false;
  try {
    const settled = await settleRead(evaluate, paths.expectedGuestProfileIdSha256, proposedRunId);
    settledRunId = settled.runId;
    snapshot = settled.snapshot;
  } catch (error) {
    if (error?.runId) settledRunId = error.runId;
    keepPendingOperation = ['native_inventory_timeout', 'native_read_timeout'].includes(error?.message);
    throw error;
  } finally {
    if (settledRunId && !keepPendingOperation) await clearSettledOperation(evaluate, settledRunId);
    await new Promise((resolveClose) => {
      const timer = setTimeout(() => { socket.terminate(); resolveClose(); }, 1_000);
      socket.once('close', () => { clearTimeout(timer); resolveClose(); });
      socket.close();
    });
  }
  if (!snapshot || snapshot.schemaVersion !== 1 || snapshot.stage !== 'native_guest_export_readback'
    || snapshot.registry?.guestCount !== 1 || snapshot.registry?.selectedProfileIdSha256 !== paths.expectedGuestProfileIdSha256
    || snapshot.inventory?.profileCount !== snapshot.registry.profileCount) throw new Error('native_owner_read_rejected');
  await writePrivateSnapshot(paths.outputPath, snapshot);
  console.log(JSON.stringify(summarizeSnapshot(snapshot)));
}

export const __testables = Object.freeze({
  privateBasename, resolvePrivateFile, resolveInitializedOwnerId, parseMetroOrigin, validateNativeWebSocketEndpoint, nativeTargetConnectionSettings, ERROR_CATEGORIES, INVENTORY_TIMEOUT_MS,
  operationKey: OPERATION_KEY, operationProtocol: OPERATION_PROTOCOL, previousOperationProtocol: PREVIOUS_OPERATION_PROTOCOL,
  summarizeSnapshot,
});

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const category = ERROR_CATEGORIES.has(error?.message) ? error.message : 'native_readback_stopped';
    console.error(JSON.stringify({ stage: 'native_guest_export_readback_stopped', category, storageMutationAttempted: false }));
    process.exitCode = 1;
  });
}
