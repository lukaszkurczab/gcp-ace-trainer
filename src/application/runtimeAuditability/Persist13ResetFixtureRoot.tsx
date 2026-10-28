import { PERSIST13_START_CAPABILITY_KEY, PERSIST13_START_RECOVERY_KEY, assertPersist13StartRecoveryEntry, expectedPersist13StartRecoverySnapshot, isPersist13StartRecovery, type Persist13StartRecovery } from "./persist13ResetFixtureProtocol";
import { buildTrainingSessionStartJournal, commitTrainingSessionStart } from "../learningMutations/commitTrainingSessionStart";
import { applySynchronousForegroundTimerRaw } from "../../infrastructure/storage/foregroundTimerRawCas";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { bootstrapApplication } from "../bootstrap/applicationBootstrap";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { openProfileStorageRouter, type ProfileStorageRouter } from "../../infrastructure/storage/profileStorageRouter";
import { activatePreparedProfile, captureActiveProfileStorageLease, getKeyValueStorage, isActiveProfileStorageLeaseCurrent, isPersist13StorageOwnerCold, prepareProfileStorage, setProfileStoragePreparationFactoryForTests, closeActiveProfileStorage, type KeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { isPersist13LifecycleOwnerCold } from "../trainingLifecycle/applicationLifecycle";
import { isPersist13TimerOwnerCold } from "../trainingLifecycle/ForegroundSessionTimerFacade";
import { commitLearningStateReset, isPersist13ResetBarrierCold } from "../learningMutations/commitLearningStateReset";
import { areMutationPhysicalWritesAfter, getActiveForegroundTimer, getActiveMutationJournal, getActiveTrainingSession, getActiveTrainingSessionDraft, getGuestInstallation, getReviewQueueItems, getTrainingAttempts, getTrainingSessionResult, getTrainingSessions, readActiveForegroundTimer, readActiveTrainingSession, readReviewQueueItems, readTrainingAttempts, readTrainingSessionResult, readTrainingSessions, provisionGuestInstallation, saveTrainingSessionDraft } from "../../storage/repositories";
import { STORAGE_KEYS } from "../../storage/keys";
import { productionLearningDataAdmissionContext } from "../tracks/trackAdmissionContext";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { TrainingApplicationFailure } from "../trainingLifecycle/contracts";
import { MutationCommitFailure } from "../mutationBoundary";
import { getForegroundSessionTimerFacade } from "../trainingLifecycle/ForegroundSessionTimerFacade";
import { getTrainingLifecycleUseCases } from "../trainingLifecycle/applicationLifecycle";
import { advanceTrainingSession, createTrainingSessionDraft, getTrackRegistration, initialForegroundTimerForSession } from "../../domain";
import { CanonicalWriteOutcomeError } from "../../storage/errors";
import { reconcileTrainingSessionDraftWrite } from "../../storage/repositories/trainingSessionDraftRepository";
import type { CanonicalWriteAttempt } from "../../storage/repositories/canonicalRecordCodec";
import type { JournalWrite, MutationJournalRecord } from "../../storage/repositories/mutationJournalRepository";
import type { CanonicalQuestionResponse, Question } from "../../content/canonical";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { installPersist13StartPauseHook, installPersist13AdvanceMaterializedPauseHook, installPersist13MaterializedJournalPauseHook, installPersist13ResetPauseHook, installPersist13SubmitClearNextPauseHook, installPersist13VerifyClearPauseHook, isPersist13ResetPauseHookCold, PERSIST13_ADVANCE_MATERIALIZED_STAGE, PERSIST13_RESET_PAUSE_STAGE, PERSIST13_SUBMIT_CLEAR_NEXT_STAGE, PERSIST13_VERIFY_CLEAR_PAUSE_STAGE } from "./persist13ResetPauseHook";
import { areHashedSnapshotsEqual, arePersist13PracticeUiNextSnapshotsPreserved, arePersist13JournalPhysicalWriteTargetsExact, arePersist13JournalTargetDeltasScoped, arePersist13PhysicalSnapshotsEqual, isExactPersist13SessionCollectionAdvance, beginPersist13SubmitClearNextRecovery, createPersist13Manifest, fixtureInstallationId, fixtureModeAllowsManifest, fixtureStoreIds, hashPersist13PhysicalSnapshot, hashPersist13PracticeUiSessionState, hasPersist13PhysicalJournal, isPersist13ControlNamespace, isPersist13Manifest, isPersist13MaterializedJournalSidecar, isPersist13SubmitClearNextSidecar, isPersist13VerifyClearSidecar, isPersist13AdvanceMaterializedSidecar, isPersist13PracticeUiProbeSidecar, isPersist13PracticeUiNextSidecar, isPersist13PracticeUiNextObservation, isPersist13PracticeUiNextObservationCore, isPersist13ScenarioSidecar, PERSIST13_FIXTURE_CACHE_PREFIXES, PERSIST13_FIXTURE_MANIFEST_KEY, PERSIST13_MATERIALIZED_JOURNAL_SIDECAR_SCHEMA, PERSIST13_SUBMIT_CLEAR_NEXT_SIDECAR_SCHEMA, PERSIST13_VERIFY_CLEAR_SIDECAR_SCHEMA, PERSIST13_ADVANCE_MATERIALIZED_SIDECAR_SCHEMA, PERSIST13_PRACTICE_UI_PROBE_SIDECAR_SCHEMA, PERSIST13_PRACTICE_UI_NEXT_SIDECAR_SCHEMA, PERSIST13_SCENARIO_SIDECAR_KEY, persist13FixturePhysicalKey, withPersist13ManifestState, writeAndVerifyPersist13SubmitClearNextPhase, writeAndVerifyPersist13AdvanceMaterializedSidecar, writeAndVerifyPersist13PracticeUiProbeSidecar, writeAndVerifyPersist13PracticeUiNextSidecar, type Persist13FixtureManifest, type Persist13HashedPhysicalSnapshot, type Persist13MaterializedJournalSidecar, type Persist13SubmitClearNextSidecar, type Persist13VerifyClearSidecar, type Persist13AdvanceMaterializedSidecar, type Persist13PracticeUiProbeSidecar, type Persist13PracticeUiNextSidecar, type Persist13PracticeUiNextObservation, type Persist13PracticeUiNextObservationCore, type Persist13ScenarioSidecar } from "./persist13ResetFixtureProtocol";
import { seedPersist13ResetFixtureState } from "./persist13ResetFixtureSeed";
import type { Persist13Entry } from "./persist13Entry";
import { findPersist13FixtureErrorMetadata } from "./persist13FixtureErrorContext";
import { Persist13PracticeUiHost } from "./Persist13PracticeUiHost";
import { buildPracticeSessionConfig, type PracticeSessionRouteParams } from "../../features/practice/sessionConfig";
import { getAlgorithmsPracticeProjection } from "../coding-interview/codingInterviewSessionFacade";


type FixtureStage = "start_recovery_first" | "start_recovery_complete" | "start_cutpoint" | "preflight" | "cache_preflight" | "native_store_open" | "router_prepare" | "bootstrap" | "seed" | "reset_pause" | "journal_unknown" | "journal_materialized" | "verify_clear" | "submit_clear_next" | "advance_materialized" | "practice_ui_ready" | "practice_ui_host" | "practice_ui_next_observation" | "draft_unknown" | "recovery" | "verification" | "complete" | "cleanup";
type FixtureErrorCategory = "runtime_disabled" | "cold_owner_not_cold" | "store_collision" | "manifest_invalid" | "cache_collision" | "cache_unavailable" | "storage_unavailable" | "bootstrap_blocked" | "seed_failed" | "reset_failed" | "fault_injection_failed" | "recovery_failed" | "preservation_failed" | "native_store_cleanup_failed" | "unknown";
type FixtureReceipt = Readonly<{ result: "pending" | "observed" | "failed"; stage: FixtureStage; errorCategory?: FixtureErrorCategory; scenario?: string; targetCount?: number; preservedCount?: number; bootstrapReady?: boolean; journalAbsent?: boolean; targetsAbsent?: boolean; materializedTargetsVerified?: boolean; preservedEqual?: boolean; cleanupVerified?: boolean }>;

const FIXTURE_STAGES: readonly FixtureStage[] = Object.freeze(["start_recovery_first", "start_recovery_complete", "start_cutpoint", "preflight", "cache_preflight", "native_store_open", "router_prepare", "bootstrap", "seed", "reset_pause", "journal_unknown", "journal_materialized", "verify_clear", "submit_clear_next", "advance_materialized", "practice_ui_ready", "practice_ui_host", "practice_ui_next_observation", "draft_unknown", "recovery", "verification", "complete", "cleanup"]);
const FIXTURE_ERROR_CATEGORIES: readonly FixtureErrorCategory[] = Object.freeze(["runtime_disabled", "cold_owner_not_cold", "store_collision", "manifest_invalid", "cache_collision", "cache_unavailable", "storage_unavailable", "bootstrap_blocked", "seed_failed", "reset_failed", "fault_injection_failed", "recovery_failed", "preservation_failed", "native_store_cleanup_failed", "unknown"]);

type NativeMMKV = ReturnType<typeof import("react-native-mmkv").createMMKV>;
type FixtureFault = Readonly<{ arm(key: string): void; didWrite(): boolean; didDenyRead(): boolean; snapshotForAssertion(): ReturnType<typeof capturePhysicalSnapshot> }>;
type FixtureStores = { base: KeyValueStorage | null; router: ProfileStorageRouter | null; control: NativeMMKV | null; mmkv: typeof import("react-native-mmkv"); manifest: Persist13FixtureManifest; fault: FixtureFault | null };

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
let activePracticeUiNextObserver: ((runId: string) => Persist13PracticeUiNextObservationCore | null) | null = null;

/** Read-only hook for the already-mounted fixture owner; never creates or initializes a runtime owner. */
export function readPersist13PracticeUiNextObservation(runId: string): Persist13PracticeUiNextObservationCore | null {
  return activePracticeUiNextObserver?.(runId) ?? null;
}

export default function Persist13ResetFixtureRoot({ entry }: Readonly<{ entry: Persist13Entry }>) {
  const [receipt, setReceipt] = useState<FixtureReceipt>({ result: "pending", stage: "preflight" });
  const [practiceUiRoute, setPracticeUiRoute] = useState<PracticeSessionRouteParams | null>(null);
  const textStyle = { color: "#F6F8FB" } as const;
  useEffect(() => {
    let live = true;
    void runPersist13Fixture(entry, (next) => { if (live) setReceipt(next); }, (route) => { if (live) setPracticeUiRoute(route); })
      .catch((error: unknown) => { if (live) setReceipt({ result: "failed", stage: stageFromError(error), errorCategory: categoryFromError(error) }); });
    return () => { live = false; };
  }, [entry]);
  if (practiceUiRoute) return <Persist13PracticeUiHost routeParams={practiceUiRoute} />;
  return (
    <View accessibilityRole="summary" testID="persist13-fixture-root" style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#0C1324" }}>
      <Text style={textStyle} testID="persist13-fixture-result">PERSIST-13 {entry.kind === "fixture" ? `${entry.scenario} ${entry.mode}` : "configuration"}: {receipt.result}</Text>
      <Text style={textStyle} testID="persist13-fixture-stage">Stage: {receipt.stage}</Text>
      {receipt.errorCategory ? <Text style={textStyle} testID="persist13-fixture-error">Category: {receipt.errorCategory}</Text> : null}
      {receipt.targetCount !== undefined ? <Text style={textStyle} testID="persist13-fixture-target-count">Targets: {receipt.targetCount}</Text> : null}
      {receipt.preservedCount !== undefined ? <Text style={textStyle} testID="persist13-fixture-preserved-count">Preserved: {receipt.preservedCount}</Text> : null}
      {receipt.bootstrapReady !== undefined ? <Text style={textStyle} testID="persist13-fixture-bootstrap">Bootstrap ready: {String(receipt.bootstrapReady)}</Text> : null}
      {receipt.journalAbsent !== undefined ? <Text style={textStyle} testID="persist13-fixture-journal">Journal absent: {String(receipt.journalAbsent)}</Text> : null}
      {receipt.targetsAbsent !== undefined ? <Text style={textStyle} testID="persist13-fixture-targets-absent">Targets absent: {String(receipt.targetsAbsent)}</Text> : null}
      {receipt.materializedTargetsVerified !== undefined ? <Text style={textStyle} testID="persist13-fixture-materialized">Materialized targets verified: {String(receipt.materializedTargetsVerified)}</Text> : null}
      {receipt.preservedEqual !== undefined ? <Text style={textStyle} testID="persist13-fixture-preserved-equal">Preserved equal: {String(receipt.preservedEqual)}</Text> : null}
      {receipt.cleanupVerified !== undefined ? <Text style={textStyle} testID="persist13-fixture-cleanup">Fixture cleanup: {String(receipt.cleanupVerified)}</Text> : null}
    </View>
  );
}

async function runPersist13Fixture(entry: Persist13Entry, publish: (receipt: FixtureReceipt) => void, mountPracticeUi: (route: PracticeSessionRouteParams) => void): Promise<void> {
  if (entry.kind !== "fixture") throw Object.assign(new Error("persist13_fixture_configuration_invalid"), { stage: "preflight", category: "manifest_invalid" });
  activePracticeUiNextObserver = null;
  if (!fixtureRuntimeEnabled()) throw Object.assign(new Error("persist13_fixture_runtime_disabled"), { stage: "preflight", category: "runtime_disabled" });
  publish({ result: "pending", stage: "preflight" });
  assertColdOwners();
  let stores: FixtureStores | null = await openFixtureStores(entry);
  const manifest = stores.manifest;
  const writeManifest = (next: Persist13FixtureManifest) => {
    if (!stores?.control) throw Object.assign(new Error("persist13_control_store_unavailable"), { stage: "native_store_open", category: "storage_unavailable" });
    stores.control.set(PERSIST13_FIXTURE_MANIFEST_KEY, JSON.stringify(next));
  };
  const identity = Object.freeze({ async create() { return Object.freeze({ installationId: fixtureInstallationId(entry.runId), localDatasetId: entry.runId }); } });
  try {
    publish({ result: "pending", stage: "cache_preflight" });
    assertNoFixtureExportCache(manifest.fixtureProfileId);
    setProfileStoragePreparationFactoryForTests(async () => {
      if (!stores?.base || !stores.router) throw new Error("persist13_fixture_storage_owner_unavailable");
      return { base: stores.base, router: stores.router,
        // Raw fixture clock authority is explicit. It does not claim the iOS
        // native scheduler or bypass the published profile-generation fence.
        foregroundTimerCasForTests(before, after) {
          if (!stores?.base) throw new Error("persist13_fixture_storage_owner_unavailable");
          applySynchronousForegroundTimerRaw(stores.base,
            persist13FixturePhysicalKey(manifest.fixtureProfileId, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER), before, after);
        },
      };
    });
    const profile = await prepareProfileStorage();
    if (profile.id !== manifest.fixtureProfileId || profile.kind !== "guest" || profile.accountId !== null) throw Object.assign(new Error("persist13_profile_identity_mismatch"), { stage: "router_prepare", category: "storage_unavailable" });
    activatePreparedProfile(profile.id, profile.kind);
    const account = await provisionGuestInstallation(identity);
    if (account.installationId !== fixtureInstallationId(entry.runId) || account.localDatasetId !== entry.runId || account.bindingState !== "guest") throw Object.assign(new Error("persist13_guest_identity_mismatch"), { stage: "router_prepare", category: "storage_unavailable" });

    if (entry.scenario === "start_cutpoint") {
      if (entry.mode === "seed") await probeStartCutpoint(entry, stores, identity, publish);
      else {
        try { await recoverStartCutpoint(entry, stores, identity, publish); }
        catch (error) { throw Object.assign(error instanceof Error ? error : new Error("persist13_start_recovery_failed"), { stage: "recovery", category: "recovery_failed" }); }
      }
      return;
    }
    if (entry.scenario !== "reset") {
      if (entry.scenario === "practice_ui_next") {
        const nextEntry = { kind: "fixture" as const, mode: entry.mode, scenario: "practice_ui_next" as const, runId: entry.runId, ...(entry.observation === undefined ? {} : { observation: entry.observation }) };
        if (entry.mode === "seed") await seedPracticeUiNextScenario(nextEntry, stores, identity, publish);
        else {
          const sidecar = readScenarioSidecar(stores.control!, nextEntry);
          if (!isPersist13PracticeUiNextSidecar(sidecar, entry.runId)) throw Object.assign(new Error("persist13_practice_ui_next_sidecar_invalid"), { stage: "preflight", category: "manifest_invalid" });
          const observation = entry.observation === undefined ? null : parsePracticeUiNextObservation(entry.observation, entry.runId);
          await recoverPracticeUiNextScenario(nextEntry, sidecar, observation, stores, identity, publish, mountPracticeUi);
        }
        return;
      }
      if (entry.scenario === "practice_ui_probe") {
        const practiceEntry = { kind: "fixture" as const, mode: entry.mode, scenario: "practice_ui_probe" as const, runId: entry.runId };
        if (entry.mode === "seed") await seedPracticeUiProbeScenario(practiceEntry, stores, identity, publish);
        else {
          const sidecar = readScenarioSidecar(stores.control!, practiceEntry);
          if (!isPersist13PracticeUiProbeSidecar(sidecar, entry.runId)) throw Object.assign(new Error("persist13_practice_ui_sidecar_invalid"), { stage: "preflight", category: "manifest_invalid" });
          await recoverPracticeUiProbeScenario(practiceEntry, sidecar, stores, identity, publish, mountPracticeUi);
        }
        return;
      }
      if (entry.scenario === "advance_materialized") {
        const advanceEntry = { kind: "fixture" as const, mode: entry.mode, scenario: "advance_materialized" as const, runId: entry.runId };
        if (entry.mode === "seed") await seedAdvanceMaterializedScenario(advanceEntry, stores, identity, publish);
        else {
          const sidecar = readScenarioSidecar(stores.control!, advanceEntry);
          if (!isPersist13AdvanceMaterializedSidecar(sidecar, entry.runId)) throw Object.assign(new Error("persist13_advance_materialized_sidecar_invalid"), { stage: "preflight", category: "manifest_invalid" });
          await recoverAdvanceMaterializedScenario(advanceEntry, sidecar, stores, identity, publish);
        }
      }
      else {
        const scenarioEntry = { kind: "fixture" as const, mode: entry.mode, scenario: entry.scenario, runId: entry.runId };
        if (entry.mode === "seed") await seedJournalOrDraftScenario(scenarioEntry, stores, identity, publish);
        else await recoverJournalOrDraftScenario(scenarioEntry, stores, identity, publish);
      }
      return;
    }

    if (entry.mode === "seed") {
      if (!fixtureModeAllowsManifest(entry.mode, manifest.state)) throw Object.assign(new Error("persist13_seed_state_invalid"), { stage: "preflight", category: "manifest_invalid" });
      publish({ result: "pending", stage: "bootstrap" });
      await runProductionBootstrap(identity);
      publish({ result: "pending", stage: "seed" });
      const plan = await seedPersist13ResetFixtureState(entry.runId);
      if (plan.profile.id !== manifest.fixtureProfileId || plan.profile.kind !== "guest" || plan.profile.accountId !== null) {
        throw Object.assign(new Error("persist13_reset_plan_profile_mismatch"), { stage: "seed", category: "seed_failed" });
      }
      const targetEntries = plan.targets;
      const preservedEntries = plan.preserved;
      if (targetEntries.length === 0 || preservedEntries.length === 0) throw Object.assign(new Error("persist13_reset_fixture_empty_plan"), { stage: "seed", category: "seed_failed" });
      const currentManifest = withPersist13ManifestState(manifest, "paused", { targets: targetEntries, preserved: preservedEntries });
      writeManifest(currentManifest);
      installPersist13ResetPauseHook(async (stage) => {
        if (stage !== PERSIST13_RESET_PAUSE_STAGE) throw Object.assign(new Error("persist13_unexpected_pause_stage"), { stage: "reset_pause", category: "reset_failed" });
        const journal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
        const storage = getKeyValueStorage();
        const resetWrite = journal?.operation === "reset_learning_state" ? journal.writes[0] : null;
        const lease = captureActiveProfileStorageLease();
        const journalTargetsMatch = resetWrite?.kind === "clear_learning_state"
          && resetWrite.targetPlan.targets.length === targetEntries.length
          && resetWrite.targetPlan.targets.every((entry, index) => entry.key === targetEntries[index]?.key && entry.sha256 === targetEntries[index]?.sha256);
        if (journal?.operation !== "reset_learning_state" || journal.status !== "journal_durable"
          || !lease || lease.profile.id !== manifest.fixtureProfileId || lease.profile.kind !== "guest" || lease.profile.accountId !== null
          || resetWrite?.kind !== "clear_learning_state" || resetWrite.targetPlan.profile.id !== manifest.fixtureProfileId
          || resetWrite.targetPlan.profile.kind !== "guest" || resetWrite.targetPlan.profile.accountId !== null || !journalTargetsMatch
          || targetEntries.some(({ key }) => storage.getString(key) !== undefined)) {
          throw Object.assign(new Error("persist13_pause_postcondition_invalid"), { stage: "reset_pause", category: "reset_failed" });
        }
        publish({ result: "pending", stage: "reset_pause", targetCount: targetEntries.length, preservedCount: preservedEntries.length });
        return new Promise<never>(() => undefined);
      });
      publish({ result: "pending", stage: "seed", targetCount: targetEntries.length, preservedCount: preservedEntries.length });
      await commitLearningStateReset(new Date().toISOString());
      throw Object.assign(new Error("persist13_reset_pause_not_reached"), { stage: "reset_pause", category: "reset_failed" });
    }

    if (!fixtureModeAllowsManifest(entry.mode, manifest.state)) throw Object.assign(new Error("persist13_recover_state_invalid"), { stage: "preflight", category: "manifest_invalid" });
    await assertRecoverableManifestAuthority(manifest);
    writeManifest(withPersist13ManifestState(manifest, "recovering"));
    publish({ result: "pending", stage: "recovery", targetCount: manifest.targets.length, preservedCount: manifest.preserved.length });
    const first = await runProductionBootstrap(identity);
    const firstSnapshot = capturePhysicalSnapshot(getKeyValueStorage());
    const second = await runProductionBootstrap(identity);
    const secondSnapshot = capturePhysicalSnapshot(getKeyValueStorage());
    if (first.kind !== "ready" || second.kind !== "ready") throw Object.assign(new Error("persist13_production_bootstrap_blocked"), { stage: "recovery", category: "bootstrap_blocked" });
    if (!arePersist13PhysicalSnapshotsEqual(firstSnapshot, secondSnapshot)) throw Object.assign(new Error("persist13_bootstrap_not_idempotent"), { stage: "verification", category: "recovery_failed" });
    publish({ result: "pending", stage: "verification", targetCount: manifest.targets.length, preservedCount: manifest.preserved.length });
    const targetsAbsent = areFixtureTargetsAbsent(manifest);
    const journalAbsent = await getActiveMutationJournal(productionLearningDataAdmissionContext) === null;
    const preservedEqual = areFixturePreservedEntriesEqual(manifest);
    if (!targetsAbsent || !journalAbsent || !preservedEqual) throw Object.assign(new Error("persist13_recovery_postcondition_failed"), { stage: "verification", category: "preservation_failed" });
    writeManifest(withPersist13ManifestState(manifest, "recovered"));
    publish({ result: "pending", stage: "cleanup", targetCount: manifest.targets.length, preservedCount: manifest.preserved.length, bootstrapReady: true, journalAbsent, targetsAbsent, preservedEqual });
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
    const mmkv = stores.mmkv;
    stores.base = null;
    stores.router = null;
    stores.control = null;
    stores.fault = null;
    stores = null;
    const cleaned = deleteOwnedFixtureStores(mmkv, manifest);
    if (!cleaned) throw Object.assign(new Error("persist13_fixture_cleanup_unverified"), { stage: "cleanup", category: "native_store_cleanup_failed" });
    publish({ result: "observed", stage: "complete", targetCount: manifest.targets.length, preservedCount: manifest.preserved.length, bootstrapReady: true, journalAbsent, targetsAbsent, preservedEqual, cleanupVerified: true });
  } finally {
    // Failure and HMR leave the two owned native stores intact for safe diagnosis/recovery.
    void stores;
  }
}

async function seedPracticeUiProbeScenario(
  entry: Extract<Persist13Entry, { kind: "fixture" }> & Readonly<{ scenario: "practice_ui_probe" }>,
  stores: FixtureStores,
  identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>,
  publish: (receipt: FixtureReceipt) => void,
): Promise<never> {
  publish({ result: "pending", scenario: entry.scenario, stage: "bootstrap" });
  const boot = await runProductionBootstrap(identity, entry.scenario);
  if (boot.kind !== "ready" || boot.activeSessionId !== null) throw Object.assign(new Error("persist13_practice_ui_initial_bootstrap_blocked"), { stage: "bootstrap", category: "bootstrap_blocked" });
  publish({ result: "pending", scenario: entry.scenario, stage: "seed" });
  const plan = await seedPersist13ResetFixtureState(entry.runId, { includeActiveSession: false });
  if (plan.profile.id !== entry.runId || plan.profile.kind !== "guest" || plan.profile.accountId !== null
    || await getActiveTrainingSession(productionTrackAdmissionContext) !== null
    || await getActiveMutationJournal(productionLearningDataAdmissionContext) !== null) {
    throw Object.assign(new Error("persist13_practice_ui_seed_authority_invalid"), { stage: "seed", category: "seed_failed" });
  }
  const lifecycle = getTrainingLifecycleUseCases();
  const prepared = await lifecycle.startSession({
    trackId: "coding-interview-dsa-problem-solving",
    modeId: "coding-interview-learn-approach",
    source: "persist13-practice-ui-probe",
    request: { requestedLength: 10 },
  });
  if (prepared.session.status !== "active" || prepared.session.currentItemIndex !== 0 || !prepared.session.itemOrder[0]) {
    throw Object.assign(new Error("persist13_practice_ui_session_unavailable"), { stage: "seed", category: "seed_failed" });
  }
  await getForegroundSessionTimerFacade().initialize(prepared.session);
  const firstOccurrence = prepared.session.itemOrder[0];
  const sourceQuestion = (await loadCanonicalRuntimeCatalog()).getQuestion(firstOccurrence.item.trackId, firstOccurrence.item.questionId);
  if (!sourceQuestion) throw Object.assign(new Error("persist13_practice_ui_question_unavailable"), { stage: "seed", category: "seed_failed" });
  const response = incorrectCanonicalResponse(sourceQuestion);
  await lifecycle.submitPracticeResponse(response);
  if (await getActiveMutationJournal(productionLearningDataAdmissionContext) !== null
    || hasPersist13PhysicalJournal(capturePhysicalSnapshot(requireBase(stores)), entry.runId)) {
    throw Object.assign(new Error("persist13_practice_ui_submit_journal_remains"), { stage: "seed", category: "seed_failed" });
  }
  const observed = await readPracticeUiProbeObservation(entry.runId, prepared.session.id);
  await assertPracticeUiProbeObservation(observed, entry.runId, prepared.session.id, null, "seed");
  if (observed.projection.operation.kind !== "feedback" || !observed.projection.feedback
    || observed.projection.response?.source !== "materialized" || observed.timer.running !== false
    || JSON.stringify(observed.timer) !== JSON.stringify(initialForegroundTimerForSession(observed.session, getTrackRegistration(observed.session.trackId).familyId))) {
    throw Object.assign(new Error("persist13_practice_ui_committed_feedback_unavailable"), { stage: "seed", category: "seed_failed" });
  }
  const routeParams = buildPracticeSessionConfig({
    mode: "coding-interview-learn-approach",
    source: "practiceHub",
    topicId: sourceQuestion.nodeId,
    trackId: "coding-interview-dsa-problem-solving",
    sessionLength: observed.session.requestedLength,
  });
  if (routeParams.feedbackMode !== observed.session.configurationSnapshot.feedbackMode
    || routeParams.sessionLength !== observed.session.requestedLength) {
    throw Object.assign(new Error("persist13_practice_ui_route_configuration_mismatch"), { stage: "seed", category: "seed_failed" });
  }
  const snapshot = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  const sidecar = makePracticeUiProbeSidecar(entry.runId, stores.manifest, observed, snapshot);
  if (!writeAndVerifyPersist13PracticeUiProbeSidecar(stores.control!, sidecar)) {
    throw Object.assign(new Error("persist13_practice_ui_ready_sidecar_write_failed"), { stage: "seed", category: "manifest_invalid" });
  }
  publish({ result: "pending", scenario: entry.scenario, stage: "practice_ui_ready", bootstrapReady: true, journalAbsent: true, preservedEqual: true });
  return new Promise<never>(() => undefined);
}

async function recoverPracticeUiProbeScenario(
  entry: Extract<Persist13Entry, { kind: "fixture" }> & Readonly<{ scenario: "practice_ui_probe" }>,
  sidecar: Persist13PracticeUiProbeSidecar,
  stores: FixtureStores,
  identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>,
  publish: (receipt: FixtureReceipt) => void,
  mountPracticeUi: (route: PracticeSessionRouteParams) => void,
): Promise<void> {
  await assertPracticeUiProbeGuest(entry.runId, "preflight");
  if (sidecar.phase === "ready") {
    const initial = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
    if (!areHashedSnapshotsEqual(sidecar.readySnapshot, initial)) throw Object.assign(new Error("persist13_practice_ui_ready_snapshot_changed"), { stage: "preflight", category: "manifest_invalid" });
    const first = await runProductionBootstrap(identity, entry.scenario);
    const firstSnapshot = capturePhysicalSnapshot(requireBase(stores));
    const second = await runProductionBootstrap(identity, entry.scenario);
    const secondSnapshot = capturePhysicalSnapshot(requireBase(stores));
    if (first.kind !== "ready" || second.kind !== "ready" || first.activeSessionId !== second.activeSessionId
      || !arePersist13PhysicalSnapshotsEqual(firstSnapshot, secondSnapshot)
      || !areHashedSnapshotsEqual(sidecar.readySnapshot, hashPersist13PhysicalSnapshot(secondSnapshot, sha256Utf8))) {
      throw Object.assign(new Error("persist13_practice_ui_pre_mount_bootstrap_mismatch"), { stage: "verification", category: "recovery_failed" });
    }
    const active = await getActiveTrainingSession(productionTrackAdmissionContext);
    if (!active || sha256Utf8(active.id) !== sidecar.sessionIdSha256) throw Object.assign(new Error("persist13_practice_ui_session_identity_mismatch"), { stage: "verification", category: "preservation_failed" });
    const observed = await readPracticeUiProbeObservation(entry.runId, active.id);
    await assertPracticeUiProbeObservation(observed, entry.runId, active.id, sidecar, "verification");
    const question = (await loadCanonicalRuntimeCatalog()).getQuestion(observed.session.itemOrder[0]!.item.trackId, observed.session.itemOrder[0]!.item.questionId);
    if (!question) throw Object.assign(new Error("persist13_practice_ui_route_question_missing"), { stage: "verification", category: "recovery_failed" });
    const routeParams = buildPracticeSessionConfig({
      mode: "coding-interview-learn-approach",
      source: "practiceHub",
      topicId: question.nodeId,
      trackId: "coding-interview-dsa-problem-solving",
      sessionLength: observed.session.requestedLength,
    });
    if (routeParams.feedbackMode !== observed.session.configurationSnapshot.feedbackMode
      || routeParams.sessionLength !== observed.session.requestedLength) {
      throw Object.assign(new Error("persist13_practice_ui_recovery_route_mismatch"), { stage: "verification", category: "recovery_failed" });
    }
    const armed = Object.freeze({ ...sidecar, phase: "ui_armed" as const });
    if (!writeAndVerifyPersist13PracticeUiProbeSidecar(stores.control!, armed)) {
      throw Object.assign(new Error("persist13_practice_ui_arm_readback_failed"), { stage: "verification", category: "manifest_invalid" });
    }
    publish({ result: "pending", scenario: entry.scenario, stage: "practice_ui_host", bootstrapReady: true, journalAbsent: true, preservedEqual: true });
    mountPracticeUi(Object.freeze({ ...routeParams, expectedSessionId: observed.session.id }));
    return;
  }

  const initialSnapshot = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  const active = await getActiveTrainingSession(productionTrackAdmissionContext);
  if (!active || sha256Utf8(active.id) !== sidecar.sessionIdSha256) throw Object.assign(new Error("persist13_practice_ui_session_identity_mismatch"), { stage: "preflight", category: "preservation_failed" });
  if (!areHashedSnapshotsEqualExceptKeys(sidecar.readySnapshot, initialSnapshot, practiceUiDynamicPhysicalKeys(entry.runId, active.id))) {
    throw Object.assign(new Error("persist13_practice_ui_unapproved_physical_delta"), { stage: "preflight", category: "preservation_failed" });
  }
  if (hasPersist13PhysicalJournal(capturePhysicalSnapshot(requireBase(stores)), entry.runId)) {
    throw Object.assign(new Error("persist13_practice_ui_journal_remains"), { stage: "preflight", category: "preservation_failed" });
  }
  publish({ result: "pending", scenario: entry.scenario, stage: "recovery" });
  const first = await runProductionBootstrap(identity, entry.scenario);
  const firstObservation = await readPracticeUiProbeObservation(entry.runId, active.id);
  await assertPracticeUiProbeObservation(firstObservation, entry.runId, active.id, sidecar, "verification");
  const firstSnapshot = capturePhysicalSnapshot(requireBase(stores));
  assertPracticeUiProbeSnapshot(sidecar, firstObservation, hashPersist13PhysicalSnapshot(firstSnapshot, sha256Utf8), entry.runId, "verification");
  const second = await runProductionBootstrap(identity, entry.scenario);
  const observation = await readPracticeUiProbeObservation(entry.runId, active.id);
  await assertPracticeUiProbeObservation(observation, entry.runId, active.id, sidecar, "verification");
  const secondSnapshot = capturePhysicalSnapshot(requireBase(stores));
  assertPracticeUiProbeSnapshot(sidecar, observation, hashPersist13PhysicalSnapshot(secondSnapshot, sha256Utf8), entry.runId, "verification");
  if (first.kind !== "ready" || second.kind !== "ready" || first.activeSessionId !== active.id
    || second.activeSessionId !== active.id
    || observation.session.activeForegroundMs < firstObservation.session.activeForegroundMs
    || observation.timer.accumulatedForegroundMs < firstObservation.timer.accumulatedForegroundMs
    || observation.timer.checkpointRevision < firstObservation.timer.checkpointRevision
    || !areHashedSnapshotsEqual(hashPersist13PhysicalSnapshot(firstSnapshot, sha256Utf8), hashPersist13PhysicalSnapshot(secondSnapshot, sha256Utf8))) {
    throw Object.assign(new Error("persist13_practice_ui_post_mount_bootstrap_mismatch"), { stage: "verification", category: "recovery_failed" });
  }
  const journalAbsent = await getActiveMutationJournal(productionLearningDataAdmissionContext) === null
    && !hasPersist13PhysicalJournal(capturePhysicalSnapshot(requireBase(stores)), entry.runId);
  if (!journalAbsent) throw Object.assign(new Error("persist13_practice_ui_journal_remains"), { stage: "verification", category: "recovery_failed" });
  publish({ result: "pending", scenario: entry.scenario, stage: "cleanup", bootstrapReady: true, journalAbsent, preservedEqual: true });
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
  const mmkv = stores.mmkv;
  stores.base = null;
  stores.router = null;
  stores.control = null;
  stores.fault = null;
  if (!deleteOwnedFixtureStores(mmkv, stores.manifest)) throw Object.assign(new Error("persist13_fixture_cleanup_unverified"), { stage: "cleanup", category: "native_store_cleanup_failed" });
  publish({ result: "observed", scenario: entry.scenario, stage: "complete", bootstrapReady: true, journalAbsent, preservedEqual: true, cleanupVerified: true });
}

type PracticeUiNextEntry = Extract<Persist13Entry, { kind: "fixture" }> & Readonly<{ scenario: "practice_ui_next"; observation?: string }>;
type PracticeUiNextRead = Readonly<{
  session: NonNullable<ReturnType<typeof readActiveTrainingSession>>;
  sessions: ReturnType<typeof readTrainingSessions>["value"];
  attempts: ReturnType<typeof readTrainingAttempts>["value"];
  reviews: ReturnType<typeof readReviewQueueItems>["value"];
  resultHashes: readonly string[];
  currentResult: ReturnType<typeof readTrainingSessionResult>;
  projection: ReturnType<ReturnType<typeof getTrainingLifecycleUseCases>["getOperationProjection"]>;
  timer: NonNullable<ReturnType<typeof readActiveForegroundTimer>>;
}>;

async function seedPracticeUiNextScenario(
  entry: PracticeUiNextEntry,
  stores: FixtureStores,
  identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>,
  publish: (receipt: FixtureReceipt) => void,
): Promise<never> {
  publish({ result: "pending", scenario: entry.scenario, stage: "bootstrap" });
  const boot = await runProductionBootstrap(identity, entry.scenario);
  if (boot.kind !== "ready" || boot.activeSessionId !== null) throw Object.assign(new Error("persist13_practice_ui_next_initial_bootstrap_blocked"), { stage: "bootstrap", category: "bootstrap_blocked" });
  publish({ result: "pending", scenario: entry.scenario, stage: "seed" });
  const plan = await seedPersist13ResetFixtureState(entry.runId, { includeActiveSession: false });
  if (plan.profile.id !== entry.runId || plan.profile.kind !== "guest" || plan.profile.accountId !== null
    || await getActiveTrainingSession(productionTrackAdmissionContext) !== null
    || await getActiveMutationJournal(productionLearningDataAdmissionContext) !== null) {
    throw Object.assign(new Error("persist13_practice_ui_next_seed_authority_invalid"), { stage: "seed", category: "seed_failed" });
  }
  const lifecycle = getTrainingLifecycleUseCases();
  const prepared = await lifecycle.startSession({
    trackId: "coding-interview-dsa-problem-solving",
    modeId: "coding-interview-learn-approach",
    source: "persist13-practice-ui-next",
    request: { requestedLength: 10 },
  });
  if (prepared.session.status !== "active" || prepared.session.currentItemIndex !== 0 || !prepared.session.itemOrder[0] || !prepared.session.itemOrder[1]) {
    throw Object.assign(new Error("persist13_practice_ui_next_session_unavailable"), { stage: "seed", category: "seed_failed" });
  }
  await getForegroundSessionTimerFacade().initialize(prepared.session);
  const occurrence = prepared.session.itemOrder[0];
  const question = (await loadCanonicalRuntimeCatalog()).getQuestion(occurrence.item.trackId, occurrence.item.questionId);
  if (!question) throw Object.assign(new Error("persist13_practice_ui_next_question_unavailable"), { stage: "seed", category: "seed_failed" });
  await lifecycle.submitPracticeResponse(incorrectCanonicalResponse(question));
  if (await getActiveMutationJournal(productionLearningDataAdmissionContext) !== null
    || hasPersist13PhysicalJournal(capturePhysicalSnapshot(requireBase(stores)), entry.runId)) {
    throw Object.assign(new Error("persist13_practice_ui_next_submit_journal_remains"), { stage: "seed", category: "seed_failed" });
  }
  const observed = await readPracticeUiProbeObservation(entry.runId, prepared.session.id);
  await assertPracticeUiProbeObservation(observed, entry.runId, prepared.session.id, null, "seed");
  if (observed.projection.operation.kind !== "feedback" || !observed.projection.feedback
    || observed.projection.response?.source !== "materialized" || observed.timer.running !== false
    || JSON.stringify(observed.timer) !== JSON.stringify(initialForegroundTimerForSession(observed.session, getTrackRegistration(observed.session.trackId).familyId))) {
    throw Object.assign(new Error("persist13_practice_ui_next_committed_feedback_unavailable"), { stage: "seed", category: "seed_failed" });
  }
  const snapshot = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  const sidecar = makePracticeUiNextSidecar(entry.runId, stores.manifest, observed, snapshot);
  if (!writeAndVerifyPersist13PracticeUiNextSidecar(stores.control!, sidecar)) {
    throw Object.assign(new Error("persist13_practice_ui_next_ready_sidecar_write_failed"), { stage: "seed", category: "manifest_invalid" });
  }
  publish({ result: "pending", scenario: entry.scenario, stage: "practice_ui_ready", bootstrapReady: true, journalAbsent: true, preservedEqual: true });
  return new Promise<never>(() => undefined);
}

async function recoverPracticeUiNextScenario(
  entry: PracticeUiNextEntry,
  sidecar: Persist13PracticeUiNextSidecar,
  observation: Persist13PracticeUiNextObservation | null,
  stores: FixtureStores,
  identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>,
  publish: (receipt: FixtureReceipt) => void,
  mountPracticeUi: (route: PracticeSessionRouteParams) => void,
): Promise<void> {
  await assertPracticeUiNextGuestAndNoJournal(entry.runId, "preflight", stores);
  if (sidecar.phase === "ready") {
    if (observation !== null) throw Object.assign(new Error("persist13_practice_ui_next_observation_unexpected"), { stage: "preflight", category: "manifest_invalid" });
    const initial = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
    if (!areHashedSnapshotsEqual(sidecar.readySnapshot, initial)) throw Object.assign(new Error("persist13_practice_ui_next_ready_snapshot_changed"), { stage: "preflight", category: "manifest_invalid" });
    publish({ result: "pending", scenario: entry.scenario, stage: "recovery" });
    await assertPracticeUiNextGuestAndNoJournal(entry.runId, "preflight", stores);
    const first = await runProductionBootstrap(identity, entry.scenario);
    if (first.kind !== "ready" || first.activeSessionId === null || sha256Utf8(first.activeSessionId) !== sidecar.sessionIdSha256) {
      throw Object.assign(new Error("persist13_practice_ui_next_first_bootstrap_not_ready"), { stage: "recovery", category: "recovery_failed" });
    }
    const firstActive = await getActiveTrainingSession(productionTrackAdmissionContext);
    if (!firstActive || sha256Utf8(firstActive.id) !== sidecar.sessionIdSha256) throw Object.assign(new Error("persist13_practice_ui_next_session_identity_mismatch"), { stage: "verification", category: "preservation_failed" });
    const firstObservation = await readPracticeUiProbeObservation(entry.runId, firstActive.id);
    await assertPracticeUiProbeObservation(firstObservation, entry.runId, firstActive.id, null, "verification");
    const firstSnapshot = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
    if (!areHashedSnapshotsEqual(sidecar.readySnapshot, firstSnapshot)) throw Object.assign(new Error("persist13_practice_ui_next_first_bootstrap_changed_ready_snapshot"), { stage: "verification", category: "preservation_failed" });
    await assertPracticeUiNextGuestAndNoJournal(entry.runId, "preflight", stores);
    const second = await runProductionBootstrap(identity, entry.scenario);
    if (second.kind !== "ready" || second.activeSessionId !== firstActive.id) {
      throw Object.assign(new Error("persist13_practice_ui_next_second_bootstrap_not_ready"), { stage: "recovery", category: "recovery_failed" });
    }
    const active = await getActiveTrainingSession(productionTrackAdmissionContext);
    if (!active || sha256Utf8(active.id) !== sidecar.sessionIdSha256) throw Object.assign(new Error("persist13_practice_ui_next_session_identity_mismatch"), { stage: "verification", category: "preservation_failed" });
    const observed = await readPracticeUiProbeObservation(entry.runId, active.id);
    await assertPracticeUiProbeObservation(observed, entry.runId, active.id, null, "verification");
    const secondSnapshot = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
    if (!areHashedSnapshotsEqual(firstSnapshot, secondSnapshot) || !areHashedSnapshotsEqual(sidecar.readySnapshot, secondSnapshot)) {
      throw Object.assign(new Error("persist13_practice_ui_next_pre_mount_bootstrap_mismatch"), { stage: "verification", category: "recovery_failed" });
    }
    if (observed.projection.operation.kind !== "feedback" || !observed.projection.feedback
      || hashJsonForAssertion(observed.projection.feedback) !== sidecar.expectedFeedbackSha256
      || hashPersist13PracticeUiSessionState(observed.session, hashJsonForAssertion) !== sidecar.expectedSessionZeroSha256) {
      throw Object.assign(new Error("persist13_practice_ui_next_feedback_mismatch"), { stage: "verification", category: "preservation_failed" });
    }
    const question = (await loadCanonicalRuntimeCatalog()).getQuestion(observed.session.itemOrder[0]!.item.trackId, observed.session.itemOrder[0]!.item.questionId);
    if (!question) throw Object.assign(new Error("persist13_practice_ui_next_route_question_missing"), { stage: "verification", category: "recovery_failed" });
    const routeParams = buildPracticeSessionConfig({ mode: "coding-interview-learn-approach", source: "practiceHub", topicId: question.nodeId,
      trackId: "coding-interview-dsa-problem-solving", sessionLength: observed.session.requestedLength });
    const armed = Object.freeze({ ...sidecar, phase: "ui_armed" as const });
    if (routeParams.feedbackMode !== observed.session.configurationSnapshot.feedbackMode
      || routeParams.sessionLength !== observed.session.requestedLength
      || !writeAndVerifyPersist13PracticeUiNextSidecar(stores.control!, armed)) {
      throw Object.assign(new Error("persist13_practice_ui_next_arm_readback_failed"), { stage: "verification", category: "manifest_invalid" });
    }
    activePracticeUiNextObserver = (runId) => observePersist13PracticeUiNextState(runId, armed, stores);
    publish({ result: "pending", scenario: entry.scenario, stage: "practice_ui_host", bootstrapReady: true, journalAbsent: true, preservedEqual: true });
    mountPracticeUi(Object.freeze({ ...routeParams, expectedSessionId: observed.session.id }));
    return;
  }

  if (!observation || !isPersist13PracticeUiNextObservation(observation, entry.runId)) {
    throw Object.assign(new Error("persist13_practice_ui_next_observation_required"), { stage: "preflight", category: "manifest_invalid" });
  }
  const beforeBootstrap = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  if (!arePersist13PracticeUiNextSnapshotsPreserved(sidecar.readySnapshot, beforeBootstrap, entry.runId, sidecar.sessionPhysicalKeySha256)) {
    throw Object.assign(new Error("persist13_practice_ui_next_prebootstrap_delta_invalid"), { stage: "preflight", category: "preservation_failed" });
  }
  assertPracticeUiNextObservationAgainstSidecar(observation, sidecar, entry.runId, "preflight");
  publish({ result: "pending", scenario: entry.scenario, stage: "recovery" });
  await assertPracticeUiNextGuestAndNoJournal(entry.runId, "preflight", stores);
  const first = await runProductionBootstrap(identity, entry.scenario);
  if (first.kind !== "ready" || first.activeSessionId === null || sha256Utf8(first.activeSessionId) !== sidecar.sessionIdSha256) {
    throw Object.assign(new Error("persist13_practice_ui_next_first_bootstrap_not_ready"), { stage: "recovery", category: "recovery_failed" });
  }
  const firstRead = readPracticeUiNextState(entry.runId, sidecar.sessionIdSha256);
  assertPracticeUiNextRecoveredState(firstRead, sidecar, observation, stores, "verification");
  const firstSnapshot = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  if (!arePersist13PracticeUiNextSnapshotsPreserved(observation.afterSnapshot, firstSnapshot, entry.runId, sidecar.sessionPhysicalKeySha256)) {
    throw Object.assign(new Error("persist13_practice_ui_next_first_cold_snapshot_changed"), { stage: "verification", category: "preservation_failed" });
  }
  await assertPracticeUiNextGuestAndNoJournal(entry.runId, "preflight", stores);
  const second = await runProductionBootstrap(identity, entry.scenario);
  if (second.kind !== "ready" || second.activeSessionId !== firstRead.session.id) {
    throw Object.assign(new Error("persist13_practice_ui_next_second_bootstrap_not_ready"), { stage: "recovery", category: "recovery_failed" });
  }
  const secondRead = readPracticeUiNextState(entry.runId, sidecar.sessionIdSha256);
  assertPracticeUiNextRecoveredState(secondRead, sidecar, observation, stores, "verification");
  const secondSnapshot = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  if (!arePersist13PracticeUiNextSnapshotsPreserved(observation.afterSnapshot, secondSnapshot, entry.runId, sidecar.sessionPhysicalKeySha256)
    || !areHashedSnapshotsEqual(firstSnapshot, secondSnapshot)) {
    throw Object.assign(new Error("persist13_practice_ui_next_cold_bootstrap_mismatch"), { stage: "verification", category: "recovery_failed" });
  }
  const journalAbsent = getActiveMutationJournal(productionLearningDataAdmissionContext) === null
    && !hasPersist13PhysicalJournal(capturePhysicalSnapshot(requireBase(stores)), entry.runId);
  if (!journalAbsent) throw Object.assign(new Error("persist13_practice_ui_next_journal_remains"), { stage: "verification", category: "recovery_failed" });
  publish({ result: "pending", scenario: entry.scenario, stage: "cleanup", bootstrapReady: true, journalAbsent, preservedEqual: true });
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
  const mmkv = stores.mmkv;
  stores.base = null; stores.router = null; stores.control = null; stores.fault = null;
  if (!deleteOwnedFixtureStores(mmkv, stores.manifest)) throw Object.assign(new Error("persist13_fixture_cleanup_unverified"), { stage: "cleanup", category: "native_store_cleanup_failed" });
  activePracticeUiNextObserver = null;
  publish({ result: "observed", scenario: entry.scenario, stage: "complete", bootstrapReady: true, journalAbsent, preservedEqual: true, cleanupVerified: true });
}

function parsePracticeUiNextObservation(raw: string, runId: string): Persist13PracticeUiNextObservation {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw Object.assign(new Error("persist13_practice_ui_next_observation_invalid"), { stage: "preflight", category: "manifest_invalid" }); }
  if (!isPersist13PracticeUiNextObservation(parsed, runId)) throw Object.assign(new Error("persist13_practice_ui_next_observation_invalid"), { stage: "preflight", category: "manifest_invalid" });
  return parsed;
}

function makePracticeUiNextSidecar(runId: string, manifest: Persist13FixtureManifest, observed: PracticeUiProbeObservation,
  readySnapshot: Persist13PracticeUiNextSidecar["readySnapshot"]): Persist13PracticeUiNextSidecar {
  const { session, sessions, attempts, reviews, resultHashes, projection, timer } = observed;
  const first = session.itemOrder[0]; const next = session.itemOrder[1];
  if (!first || !next || session.currentItemIndex !== 0 || projection.operation.kind !== "feedback" || !projection.feedback) {
    throw Object.assign(new Error("persist13_practice_ui_next_feedback_unavailable"), { stage: "seed", category: "seed_failed" });
  }
  const expectedOne = advanceTrainingSession(session);
  return Object.freeze({ schema: PERSIST13_PRACTICE_UI_NEXT_SIDECAR_SCHEMA, owner: "persist13-reset-fixture", runId,
    scenario: "practice_ui_next", phase: "ready", dataStoreId: manifest.dataStoreId, controlStoreId: manifest.controlStoreId,
    fixtureProfileId: manifest.fixtureProfileId, readySnapshot, sessionIdSha256: sha256Utf8(session.id),
    sessionPhysicalKeySha256: sha256Utf8(persist13FixturePhysicalKey(runId, STORAGE_KEYS.trainingSession(session.id))),
    occurrenceIdSha256: sha256Utf8(first.occurrenceId), nextOccurrenceIdSha256: sha256Utf8(next.occurrenceId),
    expectedFeedbackSha256: hashJsonForAssertion(projection.feedback), sessionPinsSha256: hashPersist13SessionPins(session),
    expectedSessionZeroSha256: hashPersist13PracticeUiSessionState(session, hashJsonForAssertion),
    expectedSessionOneSha256: hashPersist13PracticeUiSessionState(expectedOne, hashJsonForAssertion),
    otherSessionsSha256: hashJsonForAssertion(sessions.filter((candidate) => candidate.id !== session.id).sort((a, b) => a.id.localeCompare(b.id))),
    attemptSetSha256: hashJsonForAssertion([...attempts].sort((a, b) => a.id.localeCompare(b.id))),
    reviewSetSha256: hashJsonForAssertion([...reviews].sort((a, b) => a.id.localeCompare(b.id))),
    resultSetSha256: hashJsonForAssertion(resultHashes),
    timerIdentitySha256: hashJsonForAssertion(timerIdentity(timer)), sessionCount: sessions.length, attemptCount: attempts.length,
    reviewCount: reviews.length, resultCount: resultHashes.length, currentItemIndex: 0,
    initialSessionElapsedMs: session.activeForegroundMs, initialTimerAccumulatedMs: timer.accumulatedForegroundMs,
    initialTimerCheckpointRevision: timer.checkpointRevision });
}

function observePersist13PracticeUiNextState(runId: string, sidecar: Persist13PracticeUiNextSidecar, stores: FixtureStores): Persist13PracticeUiNextObservationCore | null {
  const lease = captureActiveProfileStorageLease();
  if (runId !== sidecar.runId || sidecar.phase !== "ui_armed" || !lease || lease.profile.id !== runId || lease.profile.kind !== "guest"
    || lease.profile.accountId !== null || !isActiveProfileStorageLeaseCurrent(lease)) {
    throw Object.assign(new Error("persist13_practice_ui_next_observer_scope_invalid"), { stage: "practice_ui_next_observation", category: "preservation_failed" });
  }
  if (getActiveMutationJournal(productionLearningDataAdmissionContext) !== null
    || hasPersist13PhysicalJournal(capturePhysicalSnapshot(requireBase(stores)), runId)) {
    throw Object.assign(new Error("persist13_practice_ui_next_observer_journal_present"), { stage: "practice_ui_next_observation", category: "preservation_failed" });
  }
  const before = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  const read = readPracticeUiNextState(runId, sidecar.sessionIdSha256);
  const after = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  if (!isActiveProfileStorageLeaseCurrent(lease)) throw Object.assign(new Error("persist13_practice_ui_next_observer_scope_changed"), { stage: "practice_ui_next_observation", category: "preservation_failed" });
  if (read.session.currentItemIndex === 0) return null;
  if (read.session.currentItemIndex !== 1) throw Object.assign(new Error("persist13_practice_ui_next_observer_index_invalid"), { stage: "practice_ui_next_observation", category: "preservation_failed" });
  if (!arePersist13PracticeUiNextSnapshotsPreserved(before, after, runId, sidecar.sessionPhysicalKeySha256)) return null;
  if (!practiceUiNextPhysicalPayloadMatches(requireBase(stores), runId, read.session.id, read.session)
    || !practiceUiNextPhysicalPayloadMatches(requireBase(stores), runId, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, read.timer)) return null;
  if (read.session.activeForegroundMs <= sidecar.initialSessionElapsedMs
    || read.timer.accumulatedForegroundMs <= sidecar.initialTimerAccumulatedMs
    || read.timer.checkpointRevision <= sidecar.initialTimerCheckpointRevision) return null;
  if (read.session.itemOrder[1] === undefined || read.session.status !== "active"
    || hashPersist13PracticeUiSessionState(read.session, hashJsonForAssertion) !== sidecar.expectedSessionOneSha256
    || sha256Utf8(read.session.itemOrder[1].occurrenceId) !== sidecar.nextOccurrenceIdSha256
    || read.projection?.family !== "practice" || read.projection.kind !== "unanswered"
    || read.timer.sessionId !== read.session.id || read.timer.accumulatedForegroundMs < read.session.activeForegroundMs
    || timerIdentityHash(read.timer) !== sidecar.timerIdentitySha256 || read.currentResult !== null) {
    throw Object.assign(new Error("persist13_practice_ui_next_observer_postcondition_failed"), { stage: "practice_ui_next_observation", category: "preservation_failed" });
  }
  assertPracticeUiNextPreservation(read, sidecar, "practice_ui_next_observation");
  const observation: Persist13PracticeUiNextObservationCore = Object.freeze({
    schema: "patternly:persist13-practice-ui-next-observation.v1", owner: "persist13-reset-fixture", runId,
    scenario: "practice_ui_next", phase: "ui_armed", sessionIdSha256: sha256Utf8(read.session.id),
    sessionPhysicalKeySha256: sidecar.sessionPhysicalKeySha256,
    occurrenceIdSha256: sha256Utf8(read.session.itemOrder[1].occurrenceId),
    sessionStableSha256: hashPersist13PracticeUiSessionState(read.session, hashJsonForAssertion),
    otherSessionsSha256: sidecar.otherSessionsSha256, attemptSetSha256: sidecar.attemptSetSha256,
    reviewSetSha256: sidecar.reviewSetSha256, resultSetSha256: sidecar.resultSetSha256,
    timerIdentitySha256: sidecar.timerIdentitySha256, sessionCount: read.sessions.length, attemptCount: read.attempts.length,
    reviewCount: read.reviews.length, resultCount: sidecar.resultCount, currentItemIndex: 1, projectionKind: "unanswered",
    sessionElapsedMs: read.session.activeForegroundMs, timerAccumulatedMs: read.timer.accumulatedForegroundMs,
    timerCheckpointRevision: read.timer.checkpointRevision, beforeSnapshot: before, afterSnapshot: after,
  });
  if (!isPersist13PracticeUiNextObservationCore(observation, runId)) throw Object.assign(new Error("persist13_practice_ui_next_observation_invalid"), { stage: "practice_ui_next_observation", category: "preservation_failed" });
  return observation;
}

function readPracticeUiNextState(runId: string, sessionIdSha256: string): PracticeUiNextRead {
  const lease = captureActiveProfileStorageLease();
  const session = readActiveTrainingSession(productionTrackAdmissionContext);
  const sessions = readTrainingSessions(productionTrackAdmissionContext);
  const attempts = readTrainingAttempts(productionTrackAdmissionContext);
  const reviews = readReviewQueueItems(productionTrackAdmissionContext);
  const timer = readActiveForegroundTimer(productionTrackAdmissionContext);
  const projection = session ? getTrainingLifecycleUseCases().getOperationProjection(session.id) : null;
  const currentResult = session ? readTrainingSessionResult(session.id, productionTrackAdmissionContext) : null;
  if (!lease || lease.profile.id !== runId || lease.profile.kind !== "guest" || lease.profile.accountId !== null
    || !isActiveProfileStorageLeaseCurrent(lease) || !session || sha256Utf8(session.id) !== sessionIdSha256
    || !sessions.ok || !attempts.ok || !reviews.ok || !timer || timer.sessionId !== session.id) {
    throw Object.assign(new Error("persist13_practice_ui_next_read_state_unavailable"), { stage: "verification", category: "preservation_failed" });
  }
  const resultHashes = sessions.value.map((candidate) => readTrainingSessionResult(candidate.id, productionTrackAdmissionContext))
    .filter((result): result is NonNullable<typeof result> => result !== null).map(hashJsonForAssertion).sort();
  return Object.freeze({ session, sessions: sessions.value, attempts: attempts.value, reviews: reviews.value,
    resultHashes, currentResult, projection, timer });
}

function assertPracticeUiNextPreservation(read: PracticeUiNextRead, sidecar: Persist13PracticeUiNextSidecar, stage: FixtureStage): void {
  const { session, sessions, attempts, reviews, resultHashes, timer } = read;
  if (session.status !== "active" || session.currentItemIndex !== 1 || session.modeId !== "coding-interview-learn-approach"
    || session.trackId !== "coding-interview-dsa-problem-solving" || sessions.filter((candidate) => candidate.status === "active").length !== 1
    || sessions.length !== sidecar.sessionCount || attempts.length !== sidecar.attemptCount || reviews.length !== sidecar.reviewCount
    || resultHashes.length !== sidecar.resultCount
    || hashPersist13PracticeUiSessionState(session, hashJsonForAssertion) !== sidecar.expectedSessionOneSha256
    || hashPersist13SessionPins(session) !== sidecar.sessionPinsSha256
    || hashJsonForAssertion(sessions.filter((candidate) => candidate.id !== session.id).sort((a, b) => a.id.localeCompare(b.id))) !== sidecar.otherSessionsSha256
    || hashJsonForAssertion([...attempts].sort((a, b) => a.id.localeCompare(b.id))) !== sidecar.attemptSetSha256
    || hashJsonForAssertion([...reviews].sort((a, b) => a.id.localeCompare(b.id))) !== sidecar.reviewSetSha256
    || hashJsonForAssertion(resultHashes) !== sidecar.resultSetSha256
    || hashJsonForAssertion(timerIdentity(timer)) !== sidecar.timerIdentitySha256
    || timer.accumulatedForegroundMs < session.activeForegroundMs || read.currentResult !== null) {
    throw Object.assign(new Error("persist13_practice_ui_next_preservation_failed"), { stage, category: "preservation_failed" });
  }
}

function assertPracticeUiNextRecoveredState(read: PracticeUiNextRead, sidecar: Persist13PracticeUiNextSidecar,
  observation: Persist13PracticeUiNextObservation, stores: FixtureStores, stage: FixtureStage): void {
  assertPracticeUiNextPreservation(read, sidecar, stage);
  if (read.projection?.family !== "practice" || read.projection.kind !== "unanswered"
    || sha256Utf8(read.session.itemOrder[1]?.occurrenceId ?? "") !== sidecar.nextOccurrenceIdSha256
    || hashPersist13PracticeUiSessionState(read.session, hashJsonForAssertion) !== observation.sessionStableSha256
    || read.session.activeForegroundMs < observation.sessionElapsedMs
    || read.timer.accumulatedForegroundMs < observation.timerAccumulatedMs
    || read.timer.checkpointRevision < observation.timerCheckpointRevision
    || !practiceUiNextPhysicalPayloadMatches(requireBase(stores), sidecar.runId, read.session.id, read.session)
    || !practiceUiNextPhysicalPayloadMatches(requireBase(stores), sidecar.runId, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, read.timer)) {
    throw Object.assign(new Error("persist13_practice_ui_next_observation_mismatch"), { stage, category: "preservation_failed" });
  }
}

function assertPracticeUiNextObservationAgainstSidecar(observation: Persist13PracticeUiNextObservation,
  sidecar: Persist13PracticeUiNextSidecar, runId: string, stage: FixtureStage): void {
  if (!isPersist13PracticeUiNextObservation(observation, runId) || observation.sessionIdSha256 !== sidecar.sessionIdSha256
    || observation.occurrenceIdSha256 !== sidecar.nextOccurrenceIdSha256
    || observation.sessionStableSha256 !== sidecar.expectedSessionOneSha256
    || observation.otherSessionsSha256 !== sidecar.otherSessionsSha256 || observation.attemptSetSha256 !== sidecar.attemptSetSha256
    || observation.reviewSetSha256 !== sidecar.reviewSetSha256 || observation.resultSetSha256 !== sidecar.resultSetSha256
    || observation.timerIdentitySha256 !== sidecar.timerIdentitySha256 || observation.sessionCount !== sidecar.sessionCount
    || observation.attemptCount !== sidecar.attemptCount || observation.reviewCount !== sidecar.reviewCount
    || observation.resultCount !== sidecar.resultCount || observation.sessionElapsedMs <= sidecar.initialSessionElapsedMs
    || observation.timerAccumulatedMs <= sidecar.initialTimerAccumulatedMs
    || observation.timerCheckpointRevision <= sidecar.initialTimerCheckpointRevision
    || !arePersist13PracticeUiNextSnapshotsPreserved(sidecar.readySnapshot, observation.afterSnapshot, runId, sidecar.sessionPhysicalKeySha256)
    || !arePersist13PracticeUiNextSnapshotsPreserved(observation.beforeSnapshot, observation.afterSnapshot, runId, sidecar.sessionPhysicalKeySha256)) {
    throw Object.assign(new Error("persist13_practice_ui_next_observation_mismatch"), { stage, category: "manifest_invalid" });
  }
}

async function assertPracticeUiNextGuestAndNoJournal(runId: string, stage: FixtureStage, stores: FixtureStores): Promise<void> {
  const lease = captureActiveProfileStorageLease();
  const guest = await getGuestInstallation();
  const snapshot = capturePhysicalSnapshot(requireBase(stores));
  if (!lease || lease.profile.id !== runId || lease.profile.kind !== "guest" || lease.profile.accountId !== null
    || !isActiveProfileStorageLeaseCurrent(lease) || !guest || guest.bindingState !== "guest" || guest.localDatasetId !== runId
    || getActiveMutationJournal(productionLearningDataAdmissionContext) !== null || hasPersist13PhysicalJournal(snapshot, runId)) {
    throw Object.assign(new Error("persist13_practice_ui_next_guest_or_journal_guard_failed"), { stage, category: "manifest_invalid" });
  }
}

function practiceUiNextPhysicalPayloadMatches(storage: KeyValueStorage, runId: string, logicalOrSessionId: string, value: unknown): boolean {
  const key = logicalOrSessionId === STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER ? logicalOrSessionId : STORAGE_KEYS.trainingSession(logicalOrSessionId);
  const raw = storage.getString(persist13FixturePhysicalKey(runId, key));
  if (raw === undefined) return false;
  try {
    const envelope: unknown = JSON.parse(raw);
    return typeof envelope === "object" && envelope !== null && !Array.isArray(envelope)
      && (envelope as Record<string, unknown>).schemaIdentity === "patternly:canonical:v1"
      && JSON.stringify((envelope as Record<string, unknown>).payload) === JSON.stringify(value);
  } catch { return false; }
}

function timerIdentity(timer: NonNullable<ReturnType<typeof readActiveForegroundTimer>>) {
  return { schemaVersion: timer.schemaVersion, timerVersion: timer.timerVersion, familyId: timer.familyId, sessionId: timer.sessionId, trackId: timer.trackId };
}

function timerIdentityHash(timer: NonNullable<ReturnType<typeof readActiveForegroundTimer>>): string { return hashJsonForAssertion(timerIdentity(timer)); }

type PracticeUiProbeObservation = Readonly<{
  session: NonNullable<Awaited<ReturnType<typeof getActiveTrainingSession>>>;
  sessions: Awaited<ReturnType<typeof getTrainingSessions>>["value"];
  attempts: Awaited<ReturnType<typeof getTrainingAttempts>>["value"];
  reviews: Awaited<ReturnType<typeof getReviewQueueItems>>["value"];
  resultHashes: readonly string[];
  currentResult: Awaited<ReturnType<typeof getTrainingSessionResult>>;
  projection: Extract<Awaited<ReturnType<typeof getAlgorithmsPracticeProjection>>, { kind: "practice" }>;
  timer: NonNullable<Awaited<ReturnType<typeof getActiveForegroundTimer>>>;
}>;

async function readPracticeUiProbeObservation(runId: string, sessionId: string): Promise<PracticeUiProbeObservation> {
  const lease = captureActiveProfileStorageLease();
  const [session, sessions, attempts, reviews, timer, projection, currentResult] = await Promise.all([
    getActiveTrainingSession(productionTrackAdmissionContext),
    getTrainingSessions(productionTrackAdmissionContext),
    getTrainingAttempts(productionTrackAdmissionContext),
    getReviewQueueItems(productionTrackAdmissionContext),
    getActiveForegroundTimer(productionTrackAdmissionContext),
    getAlgorithmsPracticeProjection(),
    getTrainingSessionResult(sessionId, productionTrackAdmissionContext),
  ]);
  if (!lease || lease.profile.id !== runId || lease.profile.kind !== "guest" || lease.profile.accountId !== null
    || !session || session.id !== sessionId || !timer || timer.sessionId !== sessionId
    || projection.kind !== "practice") {
    throw Object.assign(new Error("persist13_practice_ui_actor_or_state_unavailable"), { stage: "verification", category: "preservation_failed" });
  }
  const resultHashes = (await Promise.all(sessions.value.map((candidate) => getTrainingSessionResult(candidate.id, productionTrackAdmissionContext))))
    .filter((result): result is NonNullable<typeof result> => result !== null)
    .map(hashJsonForAssertion).sort();
  return Object.freeze({ session, sessions: sessions.value, attempts: attempts.value, reviews: reviews.value, resultHashes, currentResult, projection, timer });
}

function makePracticeUiProbeSidecar(
  runId: string,
  manifest: Persist13FixtureManifest,
  observed: PracticeUiProbeObservation,
  readySnapshot: Persist13PracticeUiProbeSidecar["readySnapshot"],
): Persist13PracticeUiProbeSidecar {
  const { session, sessions, attempts, reviews, resultHashes, projection, timer } = observed;
  const occurrence = session.itemOrder[0];
  if (!occurrence || !projection.feedback || projection.operation.kind !== "feedback" || projection.position.current !== 1
    || session.currentItemIndex !== 0 || session.modeId !== "coding-interview-learn-approach"
    || session.trackId !== "coding-interview-dsa-problem-solving") {
    throw Object.assign(new Error("persist13_practice_ui_feedback_not_committed"), { stage: "seed", category: "seed_failed" });
  }
  return Object.freeze({
    schema: PERSIST13_PRACTICE_UI_PROBE_SIDECAR_SCHEMA,
    owner: "persist13-reset-fixture",
    runId,
    scenario: "practice_ui_probe",
    phase: "ready",
    dataStoreId: manifest.dataStoreId,
    controlStoreId: manifest.controlStoreId,
    fixtureProfileId: manifest.fixtureProfileId,
    readySnapshot,
    sessionIdSha256: sha256Utf8(session.id),
    occurrenceIdSha256: sha256Utf8(occurrence.occurrenceId),
    expectedFeedbackSha256: hashJsonForAssertion(projection.feedback),
    sessionPinsSha256: hashPersist13SessionPins(session),
    sessionStateSha256: hashPersist13PracticeUiSessionState(session, hashJsonForAssertion),
    otherSessionsSha256: hashJsonForAssertion(sessions.filter((candidate) => candidate.id !== session.id).sort((left, right) => left.id.localeCompare(right.id))),
    attemptSetSha256: hashJsonForAssertion([...attempts].sort((left, right) => left.id.localeCompare(right.id))),
    reviewSetSha256: hashJsonForAssertion([...reviews].sort((left, right) => left.id.localeCompare(right.id))),
    resultSetSha256: hashJsonForAssertion(resultHashes),
    timerIdentitySha256: hashJsonForAssertion({ schemaVersion: timer.schemaVersion, timerVersion: timer.timerVersion, familyId: timer.familyId, sessionId: timer.sessionId, trackId: timer.trackId }),
    sessionCount: sessions.length,
    attemptCount: attempts.length,
    reviewCount: reviews.length,
    resultCount: resultHashes.length,
    currentItemIndex: 0,
    initialSessionElapsedMs: session.activeForegroundMs,
    initialTimerAccumulatedMs: timer.accumulatedForegroundMs,
    initialTimerCheckpointRevision: timer.checkpointRevision,
  });
}

async function assertPracticeUiProbeObservation(
  observed: PracticeUiProbeObservation,
  runId: string,
  sessionId: string,
  sidecar: Persist13PracticeUiProbeSidecar | null,
  stage: FixtureStage,
): Promise<void> {
  const { session, sessions, attempts, reviews, resultHashes, currentResult, projection, timer } = observed;
  const occurrence = session.itemOrder[0];
  const fail = (): never => { throw Object.assign(new Error("persist13_practice_ui_postcondition_mismatch"), { stage, category: "preservation_failed" }); };
  if (!occurrence) throw Object.assign(new Error("persist13_practice_ui_postcondition_mismatch"), { stage, category: "preservation_failed" });
  if (!projection.feedback) throw Object.assign(new Error("persist13_practice_ui_feedback_missing"), { stage, category: "preservation_failed" });
  if (session.id !== sessionId || session.status !== "active" || session.currentItemIndex !== 0
    || session.modeId !== "coding-interview-learn-approach" || session.trackId !== "coding-interview-dsa-problem-solving"
    || sessions.filter((candidate) => candidate.status === "active").length !== 1
    || projection.session.id !== sessionId || projection.session.currentItemIndex !== 0 || projection.position.current !== 1
    || projection.operation.kind !== "feedback" || projection.response?.source !== "materialized"
    || projection.occurrenceId !== occurrence.occurrenceId || projection.item.questionId !== occurrence.item.questionId
    || timer.sessionId !== sessionId || timer.trackId !== session.trackId || timer.familyId !== "coding_interview"
    || timer.accumulatedForegroundMs < session.activeForegroundMs || !Number.isSafeInteger(timer.checkpointRevision)
    || timer.checkpointRevision < 1 || typeof timer.running !== "boolean") fail();
  if (!sidecar) return;
  if (sha256Utf8(session.id) !== sidecar.sessionIdSha256 || sha256Utf8(occurrence.occurrenceId) !== sidecar.occurrenceIdSha256
    || hashJsonForAssertion(projection.feedback) !== sidecar.expectedFeedbackSha256
    || hashPersist13SessionPins(session) !== sidecar.sessionPinsSha256
    || hashPersist13PracticeUiSessionState(session, hashJsonForAssertion) !== sidecar.sessionStateSha256
    || hashJsonForAssertion(sessions.filter((candidate) => candidate.id !== sessionId).sort((left, right) => left.id.localeCompare(right.id))) !== sidecar.otherSessionsSha256
    || hashJsonForAssertion([...attempts].sort((left, right) => left.id.localeCompare(right.id))) !== sidecar.attemptSetSha256
    || hashJsonForAssertion([...reviews].sort((left, right) => left.id.localeCompare(right.id))) !== sidecar.reviewSetSha256
    || hashJsonForAssertion(resultHashes) !== sidecar.resultSetSha256
    || hashJsonForAssertion({ schemaVersion: timer.schemaVersion, timerVersion: timer.timerVersion, familyId: timer.familyId, sessionId: timer.sessionId, trackId: timer.trackId }) !== sidecar.timerIdentitySha256
    || sessions.length !== sidecar.sessionCount || attempts.length !== sidecar.attemptCount || reviews.length !== sidecar.reviewCount || resultHashes.length !== sidecar.resultCount
    || session.activeForegroundMs < sidecar.initialSessionElapsedMs || timer.accumulatedForegroundMs < sidecar.initialTimerAccumulatedMs
    || timer.checkpointRevision < sidecar.initialTimerCheckpointRevision || timer.accumulatedForegroundMs < session.activeForegroundMs
    || currentResult !== null) fail();
}

function assertPracticeUiProbeSnapshot(
  sidecar: Persist13PracticeUiProbeSidecar,
  observed: PracticeUiProbeObservation,
  snapshot: Persist13PracticeUiProbeSidecar["readySnapshot"],
  runId: string,
  stage: FixtureStage,
): void {
  const dynamicKeys = practiceUiDynamicPhysicalKeys(runId, observed.session.id);
  if (!areHashedSnapshotsEqualExceptKeys(sidecar.readySnapshot, snapshot, dynamicKeys)) {
    throw Object.assign(new Error("persist13_practice_ui_unapproved_physical_delta"), { stage, category: "preservation_failed" });
  }
}

function practiceUiDynamicPhysicalKeys(runId: string, sessionId: string): ReadonlySet<string> {
  return new Set([
    persist13FixturePhysicalKey(runId, STORAGE_KEYS.trainingSession(sessionId)),
    persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER),
  ]);
}

async function assertPracticeUiProbeGuest(runId: string, stage: FixtureStage): Promise<void> {
  const [lease, guest, journal] = [captureActiveProfileStorageLease(), await getGuestInstallation(), await getActiveMutationJournal(productionLearningDataAdmissionContext)];
  if (!lease || lease.profile.id !== runId || lease.profile.kind !== "guest" || lease.profile.accountId !== null
    || !guest || guest.bindingState !== "guest" || guest.localDatasetId !== runId || journal !== null) {
    throw Object.assign(new Error("persist13_practice_ui_guest_or_journal_guard_failed"), { stage, category: "manifest_invalid" });
  }
}

function fixtureRuntimeEnabled(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__ && process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "smoke";
}

function assertColdOwners(): void {
  const cold = isPersist13StorageOwnerCold() && isPersist13LifecycleOwnerCold() && isPersist13TimerOwnerCold()
    && isPersist13ResetBarrierCold() && isPersist13ResetPauseHookCold();
  if (!cold) throw Object.assign(new Error("persist13_cold_owner_preflight_failed"), { stage: "preflight", category: "cold_owner_not_cold" });
}

async function openFixtureStores(entry: Extract<Persist13Entry, { kind: "fixture" }>): Promise<FixtureStores> {
  const mmkv = require("react-native-mmkv") as typeof import("react-native-mmkv");
  const ids = fixtureStoreIds(entry.runId);
  const hasData = mmkv.existsMMKV(ids.dataStoreId);
  const hasControl = mmkv.existsMMKV(ids.controlStoreId);
  if (entry.mode === "seed") {
    if (hasData || hasControl) throw Object.assign(new Error("persist13_store_collision"), { stage: "native_store_open", category: "store_collision" });
    const control = createFixtureStore(mmkv, ids.controlStoreId);
    const initial = createPersist13Manifest(entry.runId, "allocating");
    control.set(PERSIST13_FIXTURE_MANIFEST_KEY, JSON.stringify(initial));
    const data = createFixtureStore(mmkv, ids.dataStoreId);
    const faulting = createFaultingStorage(data);
    const base = faulting.storage;
    const manifest = withPersist13ManifestState(initial, "allocated");
    control.set(PERSIST13_FIXTURE_MANIFEST_KEY, JSON.stringify(manifest));
    const router = await openFixtureRouter(entry, base, control);
    return { base, router, control, mmkv, manifest, fault: faulting.fault };
  }
  if (!hasData || !hasControl) throw Object.assign(new Error("persist13_store_missing"), { stage: "native_store_open", category: "manifest_invalid" });
  const control = createFixtureStore(mmkv, ids.controlStoreId);
  const controlKeys = control.getAllKeys();
  if (!controlKeys.includes(PERSIST13_FIXTURE_MANIFEST_KEY)) throw Object.assign(new Error("persist13_manifest_namespace_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
  let parsed: unknown;
  try { parsed = JSON.parse(control.getString(PERSIST13_FIXTURE_MANIFEST_KEY) ?? "null"); }
  catch { throw Object.assign(new Error("persist13_manifest_invalid"), { stage: "native_store_open", category: "manifest_invalid" }); }
  if (!isPersist13Manifest(parsed, entry.runId)
    || (entry.scenario === "reset" ? !fixtureModeAllowsManifest(entry.mode, parsed.state) : parsed.state !== "allocated")) {
    throw Object.assign(new Error("persist13_manifest_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
  }
  if (!isPersist13ControlNamespace(controlKeys, entry.scenario)) {
    throw Object.assign(new Error("persist13_control_namespace_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
  }
  if (entry.scenario !== "reset" && entry.scenario !== "start_cutpoint" && entry.mode === "recover") {
    const scenarioEntry = { kind: "fixture" as const, mode: entry.mode, scenario: entry.scenario, runId: entry.runId };
    readScenarioSidecar(control, scenarioEntry);
  }
  const data = createFixtureStore(mmkv, ids.dataStoreId);
  const faulting = createFaultingStorage(data);
  const base = faulting.storage;
  if (entry.scenario === "start_cutpoint") {
    const stage = entry.startStage;
    if (!stage) throw new Error("persist13_start_stage_missing");
    assertPersist13StartRecoveryEntry(JSON.parse(control.getString(PERSIST13_START_CAPABILITY_KEY) ?? "null"),
      JSON.parse(control.getString(PERSIST13_START_RECOVERY_KEY) ?? "null"), hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(base), sha256Utf8), entry.runId, stage);
  }
  const router = await openFixtureRouter(entry, base, control);
  return { base, router, control, mmkv, manifest: parsed, fault: faulting.fault };
}

function createFaultingStorage(instance: NativeMMKV): Readonly<{ storage: KeyValueStorage; fault: FixtureFault }> {
  let armedPhysicalKey: string | null = null;
  let readDeniedPhysicalKey: string | null = null;
  let didWrite = false;
  let didDenyRead = false;
  const storage: KeyValueStorage = Object.freeze({
    getString(key: string) {
      if (readDeniedPhysicalKey === key) {
        didDenyRead = true;
        throw new Error("persist13_one_shot_read_denial");
      }
      return instance.getString(key);
    },
    setString(key: string, value: string) {
      instance.set(key, value);
      if (armedPhysicalKey === key) {
        armedPhysicalKey = null;
        readDeniedPhysicalKey = key;
        didWrite = true;
      }
    },
    remove: (key: string) => { instance.remove(key); },
    contains: (key: string) => instance.getString(key) !== undefined,
    getAllKeys: () => instance.getAllKeys(),
  });
  const fault: FixtureFault = Object.freeze({
    arm(key: string) {
      if (armedPhysicalKey || readDeniedPhysicalKey || didWrite || didDenyRead || !key.startsWith("patternly:profile:v1:")) throw new Error("persist13_fault_arm_invalid");
      armedPhysicalKey = key;
    },
    didWrite: () => didWrite,
    didDenyRead: () => didDenyRead,
    snapshotForAssertion: () => capturePhysicalSnapshot(asUnfaultedStorage(instance)),
  });
  return Object.freeze({ storage, fault });
}

function asUnfaultedStorage(instance: NativeMMKV): KeyValueStorage {
  return Object.freeze({
    getString: (key: string) => instance.getString(key),
    setString: (key: string, value: string) => { instance.set(key, value); },
    remove: (key: string) => { instance.remove(key); },
    contains: (key: string) => instance.getString(key) !== undefined,
    getAllKeys: () => instance.getAllKeys(),
  });
}

function createFixtureStore(mmkv: typeof import("react-native-mmkv"), id: string): NativeMMKV {
  return mmkv.createMMKV({ id });
}

function createControlStore(instance: NativeMMKV) {
  return Object.freeze({ get: async (key: string) => instance.getString(key) ?? null, set: async (key: string, value: string) => { instance.set(key, value); }, remove: async (key: string) => { instance.remove(key); } });
}

async function openFixtureRouter(entry: Extract<Persist13Entry, { kind: "fixture" }>, base: KeyValueStorage, control: NativeMMKV): Promise<ProfileStorageRouter> {
  const router = await openProfileStorageRouter(base, createControlStore(control), {
    identity: Object.freeze({ async create() { return Object.freeze({ installationId: fixtureInstallationId(entry.runId), localDatasetId: entry.runId }); } }),
  });
  return router;
}

async function seedJournalOrDraftScenario(
  entry: Extract<Persist13Entry, { kind: "fixture" }> & Readonly<{ scenario: "journal" | "journal_materialized" | "verify_clear" | "submit_clear_next" | "draft" }>,
  stores: FixtureStores,
  identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>,
  publish: (receipt: FixtureReceipt) => void,
): Promise<never> {
  publish({ result: "pending", scenario: entry.scenario, stage: "bootstrap" });
  const boot = await runProductionBootstrap(identity, entry.scenario);
  if (boot.kind !== "ready" || boot.activeSessionId !== null) throw Object.assign(new Error("persist13_scenario_initial_bootstrap_blocked"), { stage: "bootstrap", category: "bootstrap_blocked" });

  let faultLogicalKey: string;
  let sessionId: string;
  let baselineAttemptCount: number;
  let baselineReviewCount = 0;
  let baselineSessionIndex: number;
  let expectedDraftRevision: number | undefined;
  let expectedDraftPayloadSha256: string | undefined;
  let expectedDraftEnvelopeSha256: string | undefined;
  let occurrenceIdSha256: string | undefined;
  let responseSha256: string | undefined;
  let expectedAttemptSha256: string | undefined;
  let expectedSessionSha256: string | undefined;
  let expectedReviewSha256: readonly string[] | undefined;
  if (entry.scenario === "journal" || entry.scenario === "journal_materialized" || entry.scenario === "verify_clear" || entry.scenario === "submit_clear_next") {
    publish({ result: "pending", scenario: entry.scenario, stage: "seed" });
    await seedPersist13ResetFixtureState(entry.runId, { includeActiveSession: false });
    const lifecycle = getTrainingLifecycleUseCases();
    const prepared = await lifecycle.startSession({ trackId: "coding-interview-dsa-problem-solving", modeId: "coding-interview-learn-approach", source: "persist13-journal-fixture", request: { requestedLength: 10 } });
    if (prepared.session.status !== "active" || prepared.session.actualLength < 2) throw Object.assign(new Error("persist13_free_practice_fixture_unavailable"), { stage: "seed", category: "seed_failed" });
    await getForegroundSessionTimerFacade().initialize(prepared.session);
    const firstOccurrence = prepared.session.itemOrder[0];
    if (!firstOccurrence) throw Object.assign(new Error("persist13_free_practice_occurrence_missing"), { stage: "seed", category: "seed_failed" });
    const question = await contentPackageRuntimeOwner.resolveItem(firstOccurrence.item);
    const sourceQuestion = (await loadCanonicalRuntimeCatalog()).getQuestion(firstOccurrence.item.trackId, firstOccurrence.item.questionId);
    if (!sourceQuestion) throw Object.assign(new Error("persist13_fixture_source_question_missing"), { stage: "seed", category: "seed_failed" });
    const before = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
    if (await getActiveMutationJournal(productionLearningDataAdmissionContext) !== null) throw Object.assign(new Error("persist13_unexpected_pending_journal"), { stage: "seed", category: "seed_failed" });
    const attempts = await getTrainingAttempts(productionTrackAdmissionContext);
    const reviewsBefore = await getReviewQueueItems(productionTrackAdmissionContext);
    baselineReviewCount = reviewsBefore.value.length;
    sessionId = prepared.session.id;
    baselineAttemptCount = attempts.value.length;
    baselineSessionIndex = prepared.session.currentItemIndex;
    occurrenceIdSha256 = sha256Utf8(firstOccurrence.occurrenceId);
    const response = entry.scenario === "journal_materialized" || entry.scenario === "verify_clear" || entry.scenario === "submit_clear_next" ? incorrectCanonicalResponse(sourceQuestion) : sourceQuestion.answer;
    responseSha256 = hashJsonForAssertion(response);
    if (entry.scenario === "journal_materialized") {
      const expectedResponseSha256 = responseSha256;
      if (!expectedResponseSha256) throw Object.assign(new Error("persist13_materialized_response_hash_missing"), { stage: "seed", category: "seed_failed" });
      await assertMaterializedJournalFixtureGuest(entry.runId, "seed");
      installPersist13MaterializedJournalPauseHook(async (stage) => {
        if (stage !== PERSIST13_RESET_PAUSE_STAGE) throw Object.assign(new Error("persist13_unexpected_materialized_pause_stage"), { stage: "journal_materialized", category: "fault_injection_failed" });
        const journal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
        const lease = captureActiveProfileStorageLease();
        if (!journal || journal.status !== "journal_durable" || journal.operation !== "submit_training_outcome"
          || journal.sessionId !== sessionId || !lease || lease.profile.id !== entry.runId || lease.profile.kind !== "guest" || lease.profile.accountId !== null) {
          throw Object.assign(new Error("persist13_materialized_journal_authority_missing"), { stage: "journal_materialized", category: "fault_injection_failed" });
        }
        assertExactPracticeOutcomeWrites(journal.writes, "seed");
        const targetKeys = materializedJournalDeltaKeys(entry.runId, journal);
        assertJournalWritesAreMaterialized(journal, entry.runId, targetKeys, "seed");
        const attemptsNow = await getTrainingAttempts(productionTrackAdmissionContext);
        const sessionsNow = await getTrainingSessions(productionTrackAdmissionContext);
        const reviewsNow = await getReviewQueueItems(productionTrackAdmissionContext);
        const expectedAttemptWrite = journal.writes.find((write) => write.kind === "put_attempt");
        const expectedSessionWrite = journal.writes.find((write) => write.kind === "put_session");
        const reviewWrites = journal.writes.filter((write) => write.kind === "put_review_entry" || write.kind === "update_review_entry");
        const actualAttempt = expectedAttemptWrite?.kind === "put_attempt" ? attemptsNow.value.find((attempt) => attempt.id === expectedAttemptWrite.record.id) : undefined;
        const actualSession = expectedSessionWrite?.kind === "put_session" ? sessionsNow.value.find((session) => session.id === expectedSessionWrite.record.id) : undefined;
        const actualReviewHashes = new Set(reviewsNow.value.map(hashJsonForAssertion));
        const expectedReviewCount = baselineReviewCount + reviewWrites.filter((write) => write.kind === "put_review_entry").length;
        if (!expectedAttemptWrite || expectedAttemptWrite.kind !== "put_attempt" || !actualAttempt
          || hashJsonForAssertion(actualAttempt) !== hashJsonForAssertion(expectedAttemptWrite.record)
          || !expectedSessionWrite || expectedSessionWrite.kind !== "put_session" || !actualSession
          || hashJsonForAssertion(actualSession) !== hashJsonForAssertion(expectedSessionWrite.record)
          || attemptsNow.value.length !== baselineAttemptCount + 1
          || reviewWrites.length === 0 || reviewsNow.value.length !== expectedReviewCount
          || reviewWrites.some((write) => !actualReviewHashes.has(hashJsonForAssertion(write.record)))) {
          throw Object.assign(new Error("persist13_materialized_journal_payload_mismatch"), { stage: "journal_materialized", category: "fault_injection_failed" });
        }
        expectedAttemptSha256 = hashJsonForAssertion(expectedAttemptWrite.record);
        expectedSessionSha256 = hashJsonForAssertion(expectedSessionWrite.record);
        expectedReviewSha256 = Object.freeze(reviewWrites.map((write) => hashJsonForAssertion(write.record)));
        const after = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
        assertOnlyDerivedJournalTargetsChanged(before, after, targetKeys);
        const sidecar: Persist13MaterializedJournalSidecar = Object.freeze({
          schema: PERSIST13_MATERIALIZED_JOURNAL_SIDECAR_SCHEMA,
          owner: "persist13-reset-fixture",
          runId: entry.runId,
          scenario: "journal_materialized",
          phase: "materialized",
          dataStoreId: stores.manifest.dataStoreId,
          controlStoreId: stores.manifest.controlStoreId,
          fixtureProfileId: stores.manifest.fixtureProfileId,
          before,
          after,
          sessionIdSha256: sha256Utf8(sessionId),
          occurrenceIdSha256: sha256Utf8(firstOccurrence.occurrenceId),
          responseSha256: expectedResponseSha256,
          expectedAttemptSha256: expectedAttemptSha256,
          expectedSessionSha256: expectedSessionSha256,
          expectedReviewSha256,
          expectedReviewCount,
          baselineAttemptCount,
          baselineSessionIndex,
        });
        writeScenarioSidecar(stores, sidecar);
        publish({ result: "pending", scenario: entry.scenario, stage: "journal_materialized", targetCount: targetKeys.size, materializedTargetsVerified: true });
        return new Promise<never>(() => undefined);
      });
      await lifecycle.submitPracticeResponse(response);
      throw Object.assign(new Error("persist13_materialized_pause_not_reached"), { stage: "journal_materialized", category: "fault_injection_failed" });
    }

    if (entry.scenario === "verify_clear") {
      await assertMaterializedJournalFixtureGuest(entry.runId, "seed");
      installPersist13VerifyClearPauseHook(async (stage) => {
        if (stage !== PERSIST13_VERIFY_CLEAR_PAUSE_STAGE) throw Object.assign(new Error("persist13_unexpected_verify_clear_pause_stage"), { stage: "verify_clear", category: "fault_injection_failed" });
        return await recordVerifiedPendingClearOutcome({
          entry: { kind: "fixture", mode: entry.mode, scenario: "verify_clear", runId: entry.runId }, stores, before, sessionId, occurrenceId: firstOccurrence.occurrenceId, responseSha256: responseSha256!,
          baselineAttemptCount, baselineReviewCount, baselineSessionIndex, publish,
        });
      });
      await lifecycle.submitPracticeResponse(response);
      throw Object.assign(new Error("persist13_verify_clear_pause_not_reached"), { stage: "verify_clear", category: "fault_injection_failed" });
    }
    if (entry.scenario === "submit_clear_next") {
      await assertMaterializedJournalFixtureGuest(entry.runId, "seed");
      installPersist13SubmitClearNextPauseHook(async (stage) => {
        if (stage !== PERSIST13_SUBMIT_CLEAR_NEXT_STAGE) throw Object.assign(new Error("persist13_unexpected_submit_clear_next_pause_stage"), { stage: "submit_clear_next", category: "fault_injection_failed" });
        return await recordPostClearSubmitOutcome({
          entry: { kind: "fixture", mode: entry.mode, scenario: "submit_clear_next", runId: entry.runId }, stores, before,
          sessionId, occurrenceId: firstOccurrence.occurrenceId, responseSha256: responseSha256!, baselineAttemptCount,
          baselineReviewCount, baselineSessionIndex, baselineAttempts: attempts.value, baselineReviews: reviewsBefore.value,
          sessionPinsSha256: hashPersist13SessionPins(prepared.session), publish,
        });
      });
      await lifecycle.submitPracticeResponse(response);
      throw Object.assign(new Error("persist13_submit_clear_next_pause_not_reached"), { stage: "submit_clear_next", category: "fault_injection_failed" });
    }

    faultLogicalKey = STORAGE_KEYS.ACTIVE_JOURNAL;
    const faultPhysicalKey = persist13FixturePhysicalKey(entry.runId, faultLogicalKey);
    requireFault(stores).arm(faultPhysicalKey);
    let attemptedJournal: MutationJournalRecord | null = null;
    try { await lifecycle.submitPracticeResponse(response); }
    catch (error) {
      if (error instanceof TrainingApplicationFailure && error.cause instanceof MutationCommitFailure) {
        const attempt = error.cause.commandProof?.attempt;
        if (typeof attempt === "object" && attempt !== null && "envelope" in attempt) {
          attemptedJournal = (attempt as CanonicalWriteAttempt<MutationJournalRecord>).envelope.payload;
        }
      }
    }
    const fault = requireFault(stores);
    if (!fault.didWrite() || !fault.didDenyRead()) throw Object.assign(new Error("persist13_journal_fault_not_observed"), { stage: "seed", category: "fault_injection_failed" });
    const operation = lifecycle.getOperationProjection(sessionId);
    if (!operation || operation.family !== "practice" || operation.kind !== "submit_journal_failed" || operation.error.durableState !== "unknown" || operation.error.allowedAction !== "reconcile") {
      throw Object.assign(new Error("persist13_journal_unknown_not_retained"), { stage: "seed", category: "fault_injection_failed" });
    }
    if (!attemptedJournal) throw Object.assign(new Error("persist13_journal_attempt_receipt_missing"), { stage: "seed", category: "fault_injection_failed" });
    const expectedAttempt = attemptedJournal.writes.find((write) => write.kind === "put_attempt");
    const expectedSession = attemptedJournal.writes.find((write) => write.kind === "put_session");
    if (expectedAttempt?.kind !== "put_attempt" || expectedSession?.kind !== "put_session") {
      throw Object.assign(new Error("persist13_journal_attempt_records_missing"), { stage: "seed", category: "fault_injection_failed" });
    }
    expectedAttemptSha256 = hashJsonForAssertion(expectedAttempt.record);
    expectedSessionSha256 = hashJsonForAssertion(expectedSession.record);
    expectedReviewSha256 = Object.freeze(attemptedJournal.writes.flatMap((write) =>
      write.kind === "put_review_entry" || write.kind === "put_review_entry_for_attempt" || write.kind === "update_review_entry"
        ? [hashJsonForAssertion(write.record)] : []));
    if (await lifecycle.reconcileUncertainMutation(sessionId) !== "unknown") throw Object.assign(new Error("persist13_journal_reconcile_was_not_unknown"), { stage: "seed", category: "fault_injection_failed" });
    const after = hashPersist13PhysicalSnapshot(fault.snapshotForAssertion(), sha256Utf8);
    assertOnlyFaultKeyChanged(before, after, faultPhysicalKey);
    const sidecar: Persist13ScenarioSidecar = Object.freeze({
      schema: "patternly:persist13-scenario-assertions.v2", owner: "persist13-reset-fixture", runId: entry.runId,
      scenario: "journal", phase: "faulted", dataStoreId: stores.manifest.dataStoreId, controlStoreId: stores.manifest.controlStoreId,
      fixtureProfileId: stores.manifest.fixtureProfileId, faultLogicalKey, faultPhysicalKey, before, after,
      sessionIdSha256: sha256Utf8(sessionId), occurrenceIdSha256, responseSha256, expectedAttemptSha256, expectedSessionSha256,
      expectedReviewSha256, baselineAttemptCount, baselineSessionIndex,
    });
    writeScenarioSidecar(stores, sidecar);
    publish({ result: "pending", scenario: entry.scenario, stage: "journal_unknown", targetCount: 1 });
  } else {
    publish({ result: "pending", scenario: entry.scenario, stage: "seed" });
    await seedPersist13ResetFixtureState(entry.runId);
    const active = await getActiveTrainingSession(productionTrackAdmissionContext);
    const draft = await getActiveTrainingSessionDraft(productionTrackAdmissionContext);
    if (!active || !draft || active.configurationSnapshot.submission !== "manualOrForegroundTimeout" || !active.itemOrder[0]) {
      throw Object.assign(new Error("persist13_registered_draft_fixture_unavailable"), { stage: "seed", category: "seed_failed" });
    }
    const question = await contentPackageRuntimeOwner.resolveItem(active.itemOrder[0].item);
    const sourceQuestion = (await loadCanonicalRuntimeCatalog()).getQuestion(active.itemOrder[0].item.trackId, active.itemOrder[0].item.questionId);
    if (!sourceQuestion) throw Object.assign(new Error("persist13_fixture_source_question_missing"), { stage: "seed", category: "seed_failed" });
    const occurrenceId = active.itemOrder[0].occurrenceId;
    const baseline = createTrainingSessionDraft({ ...draft, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: new Date().toISOString() });
    const savedBaseline = await saveTrainingSessionDraft(baseline, draft.revision, productionTrackAdmissionContext);
    const before = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
    if (await getActiveMutationJournal(productionLearningDataAdmissionContext) !== null) throw Object.assign(new Error("persist13_unexpected_pending_journal"), { stage: "seed", category: "seed_failed" });
    const attempts = await getTrainingAttempts(productionTrackAdmissionContext);
    sessionId = active.id;
    baselineAttemptCount = attempts.value.length;
    baselineSessionIndex = active.currentItemIndex;
    faultLogicalKey = STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT;
    const faultPhysicalKey = persist13FixturePhysicalKey(entry.runId, faultLogicalKey);
    const attempted = createTrainingSessionDraft({ ...savedBaseline, revision: savedBaseline.revision + 1, responsesByOccurrenceId: { [occurrenceId]: sourceQuestion.answer }, flaggedOccurrenceIds: [occurrenceId], updatedAt: new Date().toISOString() });
    expectedDraftPayloadSha256 = hashJsonForAssertion(createTrainingSessionDraft(attempted));
    requireFault(stores).arm(faultPhysicalKey);
    let attemptedReceipt: CanonicalWriteAttempt<typeof attempted> | null = null;
    try { await saveTrainingSessionDraft(attempted, savedBaseline.revision, productionTrackAdmissionContext); }
    catch (error) {
      if (error instanceof CanonicalWriteOutcomeError && error.outcome.kind === "unknown" && error.attempt && typeof error.attempt === "object") {
        attemptedReceipt = error.attempt as CanonicalWriteAttempt<typeof attempted>;
      }
    }
    const fault = requireFault(stores);
    if (!fault.didWrite() || !fault.didDenyRead() || !attemptedReceipt) throw Object.assign(new Error("persist13_draft_fault_not_observed"), { stage: "seed", category: "fault_injection_failed" });
    expectedDraftEnvelopeSha256 = sha256Utf8(attemptedReceipt.afterRaw);
    if (hashJsonForAssertion(attemptedReceipt.envelope.payload) !== expectedDraftPayloadSha256) throw Object.assign(new Error("persist13_draft_expected_payload_mismatch"), { stage: "seed", category: "fault_injection_failed" });
    if (await reconcileTrainingSessionDraftWrite(attemptedReceipt, productionTrackAdmissionContext) !== "unknown") throw Object.assign(new Error("persist13_draft_reconcile_was_not_unknown"), { stage: "seed", category: "fault_injection_failed" });
    const after = hashPersist13PhysicalSnapshot(fault.snapshotForAssertion(), sha256Utf8);
    assertOnlyFaultKeyChanged(before, after, faultPhysicalKey);
    expectedDraftRevision = attemptedReceipt.envelope.revision;
    if (after.find((row) => row.key === faultPhysicalKey)?.sha256 !== expectedDraftEnvelopeSha256) throw Object.assign(new Error("persist13_draft_native_envelope_mismatch"), { stage: "seed", category: "fault_injection_failed" });
    const sidecar: Persist13ScenarioSidecar = Object.freeze({
      schema: "patternly:persist13-scenario-assertions.v2", owner: "persist13-reset-fixture", runId: entry.runId,
      scenario: "draft", phase: "faulted", dataStoreId: stores.manifest.dataStoreId, controlStoreId: stores.manifest.controlStoreId,
      fixtureProfileId: stores.manifest.fixtureProfileId, faultLogicalKey, faultPhysicalKey, before, after,
      sessionIdSha256: sha256Utf8(sessionId), baselineAttemptCount, baselineSessionIndex, expectedDraftRevision, expectedDraftPayloadSha256, expectedDraftEnvelopeSha256,
    });
    writeScenarioSidecar(stores, sidecar);
    publish({ result: "pending", scenario: entry.scenario, stage: "draft_unknown", targetCount: 1 });
  }
  return new Promise<never>(() => undefined);
}

async function recoverJournalOrDraftScenario(
  entry: Extract<Persist13Entry, { kind: "fixture" }> & Readonly<{ scenario: "journal" | "journal_materialized" | "verify_clear" | "submit_clear_next" | "draft" }>,
  stores: FixtureStores,
  identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>,
  publish: (receipt: FixtureReceipt) => void,
): Promise<void> {
  const sidecar = readScenarioSidecar(stores.control!, entry);
  if (entry.scenario === "submit_clear_next") {
    if (!isPersist13SubmitClearNextSidecar(sidecar, entry.runId)) throw Object.assign(new Error("persist13_submit_clear_next_sidecar_invalid"), { stage: "preflight", category: "manifest_invalid" });
    await recoverSubmitClearNextScenario({ ...entry, scenario: "submit_clear_next" }, sidecar, stores, identity, publish);
    return;
  }
  if (entry.scenario === "journal_materialized") {
    if (!isPersist13MaterializedJournalSidecar(sidecar, entry.runId)) throw Object.assign(new Error("persist13_materialized_journal_sidecar_invalid"), { stage: "preflight", category: "manifest_invalid" });
    await recoverMaterializedJournalScenario({ ...entry, scenario: "journal_materialized" }, sidecar, stores, identity, publish);
    return;
  }
  if (entry.scenario === "verify_clear") {
    if (!isPersist13VerifyClearSidecar(sidecar, entry.runId)) throw Object.assign(new Error("persist13_verify_clear_sidecar_invalid"), { stage: "preflight", category: "manifest_invalid" });
    await recoverMaterializedJournalScenario({ ...entry, scenario: "verify_clear" }, sidecar, stores, identity, publish);
    return;
  }
  if (sidecar.scenario === "journal_materialized" || sidecar.scenario === "verify_clear" || sidecar.scenario === "submit_clear_next" || sidecar.scenario === "advance_materialized" || sidecar.scenario === "practice_ui_probe" || sidecar.scenario === "practice_ui_next") throw Object.assign(new Error("persist13_scenario_sidecar_scenario_mismatch"), { stage: "preflight", category: "manifest_invalid" });
  const beforeRecovery = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  if (!areHashedSnapshotsEqual(sidecar.after, beforeRecovery)) throw Object.assign(new Error("persist13_faulted_snapshot_changed_before_recovery"), { stage: "preflight", category: "manifest_invalid" });
  const targetRaw = requireBase(stores).getString(sidecar.faultPhysicalKey);
  const faultedExpectedTarget = sidecar.after.find((row) => row.key === sidecar.faultPhysicalKey);
  if (targetRaw === undefined || !faultedExpectedTarget || sha256Utf8(targetRaw) !== faultedExpectedTarget.sha256
    || (entry.scenario === "draft" && sha256Utf8(targetRaw) !== sidecar.expectedDraftEnvelopeSha256)) {
    throw Object.assign(new Error("persist13_faulted_target_mismatch"), { stage: "preflight", category: "manifest_invalid" });
  }
  if (entry.scenario === "journal") {
    const journal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
    if (!journal || journal.status !== "journal_durable" || journal.operation !== "submit_training_outcome" || sha256Utf8(journal.sessionId) !== sidecar.sessionIdSha256) {
      throw Object.assign(new Error("persist13_journal_authority_missing"), { stage: "preflight", category: "manifest_invalid" });
    }
    const journalTargetKeys = persist13PracticeJournalTargetKeys(entry.runId, journal.writes);
    writeScenarioSidecar(stores, Object.freeze({ ...sidecar, phase: "recovering" }));
    publish({ result: "pending", scenario: entry.scenario, stage: "recovery", targetCount: journalTargetKeys.size });
    const first = await runProductionBootstrap(identity, entry.scenario);
    const firstSnapshot = capturePhysicalSnapshot(requireBase(stores));
    const second = await runProductionBootstrap(identity, entry.scenario);
    const secondSnapshot = capturePhysicalSnapshot(requireBase(stores));
    if (!arePersist13PhysicalSnapshotsEqual(firstSnapshot, secondSnapshot)) throw Object.assign(new Error("persist13_scenario_bootstrap_not_idempotent"), { stage: "verification", category: "recovery_failed" });
    const journalAbsent = await getActiveMutationJournal(productionLearningDataAdmissionContext) === null;
    if (!journalAbsent) throw Object.assign(new Error("persist13_scenario_journal_remains"), { stage: "verification", category: "recovery_failed" });
    const physicalTarget = requireBase(stores).getString(sidecar.faultPhysicalKey);
    if (first.kind !== "ready" || second.kind !== "ready" || !first.activeSessionId || first.activeSessionId !== second.activeSessionId) {
      throw Object.assign(new Error("persist13_journal_bootstrap_not_resumed"), { stage: "verification", category: "bootstrap_blocked" });
    }
    const attempts = await getTrainingAttempts(productionTrackAdmissionContext);
    const sessions = await getTrainingSessions(productionTrackAdmissionContext);
    const reviews = await getReviewQueueItems(productionTrackAdmissionContext);
    const resumed = await getActiveTrainingSession(productionTrackAdmissionContext);
    const resumedOccurrence = resumed?.itemOrder[sidecar.baselineSessionIndex];
    const actualAttempt = attempts.value.find((attempt) => attempt.sessionId === resumed?.id && attempt.occurrenceId === resumedOccurrence?.occurrenceId);
    const actualSession = sessions.value.find((session) => session.id === resumed?.id);
    const actualReviewHashes = new Set(reviews.value.map(hashJsonForAssertion));
    const expectedSnapshot = hashPersist13PhysicalSnapshot(firstSnapshot, sha256Utf8);
    if (!areHashedSnapshotsEqualExceptKeys(sidecar.before, expectedSnapshot, journalTargetKeys)
      || attempts.value.length !== sidecar.baselineAttemptCount + 1 || !resumed || sha256Utf8(resumed.id) !== sidecar.sessionIdSha256
      || resumed.currentItemIndex !== sidecar.baselineSessionIndex || !resumedOccurrence
      || sha256Utf8(resumedOccurrence.occurrenceId) !== sidecar.occurrenceIdSha256
      || !actualAttempt || hashJsonForAssertion(actualAttempt) !== sidecar.expectedAttemptSha256
      || !actualSession || hashJsonForAssertion(actualSession) !== sidecar.expectedSessionSha256
      || !sidecar.expectedReviewSha256?.every((hash) => actualReviewHashes.has(hash))
      || sessions.value.filter((session) => session.status === "active").length !== 1
      || await getTrainingSessionResult(resumed.id, productionTrackAdmissionContext) !== null || physicalTarget !== undefined) {
      throw Object.assign(new Error("persist13_journal_recovery_postcondition_failed"), { stage: "verification", category: "recovery_failed" });
    }
    writeScenarioSidecar(stores, Object.freeze({ ...sidecar, phase: "recovered" }));
    publish({ result: "pending", scenario: entry.scenario, stage: "verification", bootstrapReady: true, journalAbsent, targetsAbsent: physicalTarget === undefined, preservedEqual: true });
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
    const mmkv = stores.mmkv;
    stores.base = null;
    stores.router = null;
    stores.control = null;
    stores.fault = null;
    const manifest = stores.manifest;
    const cleanupVerified = deleteOwnedFixtureStores(mmkv, manifest);
    if (!cleanupVerified) throw Object.assign(new Error("persist13_fixture_cleanup_unverified"), { stage: "cleanup", category: "native_store_cleanup_failed" });
    publish({ result: "observed", scenario: entry.scenario, stage: "complete", bootstrapReady: true, journalAbsent, targetsAbsent: true, preservedEqual: true, cleanupVerified: true });
    return;
  } else {
    if (await getActiveMutationJournal(productionLearningDataAdmissionContext) !== null) throw Object.assign(new Error("persist13_draft_has_pending_journal"), { stage: "preflight", category: "manifest_invalid" });
    const draft = await getActiveTrainingSessionDraft(productionTrackAdmissionContext);
    if (!draft || draft.revision !== sidecar.expectedDraftRevision || sha256Utf8(draft.sessionId) !== sidecar.sessionIdSha256
      || Object.keys(draft.responsesByOccurrenceId).length === 0 || draft.flaggedOccurrenceIds.length === 0) {
      throw Object.assign(new Error("persist13_draft_authority_mismatch"), { stage: "preflight", category: "manifest_invalid" });
    }
  }
  writeScenarioSidecar(stores, Object.freeze({ ...sidecar, phase: "recovering" }));
  publish({ result: "pending", scenario: entry.scenario, stage: "recovery", targetCount: 1 });
  const first = await runProductionBootstrap(identity, entry.scenario);
  const firstSnapshot = capturePhysicalSnapshot(requireBase(stores));
  const second = await runProductionBootstrap(identity, entry.scenario);
  const secondSnapshot = capturePhysicalSnapshot(requireBase(stores));
  if (!arePersist13PhysicalSnapshotsEqual(firstSnapshot, secondSnapshot)) throw Object.assign(new Error("persist13_scenario_bootstrap_not_idempotent"), { stage: "verification", category: "recovery_failed" });
  const journalAbsent = await getActiveMutationJournal(productionLearningDataAdmissionContext) === null;
  if (!journalAbsent) throw Object.assign(new Error("persist13_scenario_journal_remains"), { stage: "verification", category: "recovery_failed" });
  const physicalTarget = requireBase(stores).getString(sidecar.faultPhysicalKey);
  if (first.kind !== "home_ready_resume_unavailable" || second.kind !== "home_ready_resume_unavailable"
    || !["premium_entitlement_denied", "premium_entitlement_unavailable"].includes(first.reason)
    || !["premium_entitlement_denied", "premium_entitlement_unavailable"].includes(second.reason)) {
    throw Object.assign(new Error("persist13_draft_bootstrap_unavailable_outcome_missing"), { stage: "verification", category: "bootstrap_blocked" });
  }
  const draft = await getActiveTrainingSessionDraft(productionTrackAdmissionContext);
  const active = await getActiveTrainingSession(productionTrackAdmissionContext);
  const attempts = await getTrainingAttempts(productionTrackAdmissionContext);
  const sessions = await getTrainingSessions(productionTrackAdmissionContext);
  const expectedTarget = sidecar.after.find((row) => row.key === sidecar.faultPhysicalKey);
  if (!areHashedSnapshotsEqual(sidecar.after, hashPersist13PhysicalSnapshot(firstSnapshot, sha256Utf8))
    || !draft || draft.revision !== sidecar.expectedDraftRevision || sha256Utf8(draft.sessionId) !== sidecar.sessionIdSha256
    || hashJsonForAssertion(draft) !== sidecar.expectedDraftPayloadSha256
    || !active || sha256Utf8(active.id) !== sidecar.sessionIdSha256 || attempts.value.length !== sidecar.baselineAttemptCount
    || sessions.value.filter((session) => session.status === "active").length !== 1
    || physicalTarget === undefined || !expectedTarget || sha256Utf8(physicalTarget) !== expectedTarget.sha256
    || sha256Utf8(physicalTarget) !== sidecar.expectedDraftEnvelopeSha256) {
    throw Object.assign(new Error("persist13_draft_recovery_postcondition_failed"), { stage: "verification", category: "recovery_failed" });
  }
  writeScenarioSidecar(stores, Object.freeze({ ...sidecar, phase: "recovered" }));
  publish({ result: "pending", scenario: entry.scenario, stage: "verification", bootstrapReady: false, journalAbsent, targetsAbsent: false, preservedEqual: true });
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
  const mmkv = stores.mmkv;
  stores.base = null;
  stores.router = null;
  stores.control = null;
  stores.fault = null;
  const manifest = stores.manifest;
  // All scoped storage wrappers are dropped before deleting the two owned native stores.
  const cleanupVerified = deleteOwnedFixtureStores(mmkv, manifest);
  if (!cleanupVerified) throw Object.assign(new Error("persist13_fixture_cleanup_unverified"), { stage: "cleanup", category: "native_store_cleanup_failed" });
  publish({ result: "observed", scenario: entry.scenario, stage: "complete", bootstrapReady: false, journalAbsent, targetsAbsent: false, preservedEqual: true, cleanupVerified: true });
}

async function recoverMaterializedJournalScenario(
  entry: Extract<Persist13Entry, { kind: "fixture" }> & Readonly<{ scenario: "journal_materialized" | "verify_clear" }>,
  sidecar: Persist13MaterializedJournalSidecar | Persist13VerifyClearSidecar,
  stores: FixtureStores,
  identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>,
  publish: (receipt: FixtureReceipt) => void,
): Promise<void> {
  const initial = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  if (!areHashedSnapshotsEqual(sidecar.after, initial)) throw Object.assign(new Error("persist13_materialized_snapshot_changed_before_recovery"), { stage: "preflight", category: "manifest_invalid" });
  await assertMaterializedJournalFixtureGuest(entry.runId, "preflight");
  const journal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
  const expectedJournalStatus = entry.scenario === "journal_materialized" ? "journal_durable" : "verified_pending_clear";
  if (!journal || journal.status !== expectedJournalStatus || journal.operation !== "submit_training_outcome"
    || sha256Utf8(journal.sessionId) !== sidecar.sessionIdSha256) {
    throw Object.assign(new Error("persist13_materialized_journal_authority_missing"), { stage: "preflight", category: "manifest_invalid" });
  }
  assertExactPracticeOutcomeWrites(journal.writes, "preflight");
  const targetKeys = materializedJournalDeltaKeys(entry.runId, journal);
  assertJournalWritesAreMaterialized(journal, entry.runId, targetKeys, "preflight");
  assertOnlyDerivedJournalTargetsChanged(sidecar.before, sidecar.after, targetKeys);
  const attemptWrite = journal.writes.find((write) => write.kind === "put_attempt");
  const sessionWrite = journal.writes.find((write) => write.kind === "put_session");
  const reviewWrites = journal.writes.filter((write) => write.kind === "put_review_entry" || write.kind === "update_review_entry");
  if (attemptWrite?.kind !== "put_attempt" || sessionWrite?.kind !== "put_session"
    || hashJsonForAssertion(attemptWrite.record) !== sidecar.expectedAttemptSha256
    || hashJsonForAssertion(sessionWrite.record) !== sidecar.expectedSessionSha256
    || reviewWrites.length !== sidecar.expectedReviewSha256.length
    || (await getReviewQueueItems(productionTrackAdmissionContext)).value.length !== sidecar.expectedReviewCount
    || reviewWrites.some((write, index) => hashJsonForAssertion(write.record) !== sidecar.expectedReviewSha256[index])) {
    throw Object.assign(new Error("persist13_materialized_journal_receipt_mismatch"), { stage: "preflight", category: "manifest_invalid" });
  }
  writeScenarioSidecar(stores, Object.freeze({ ...sidecar, phase: "recovering" }));
  publish({ result: "pending", scenario: entry.scenario, stage: "recovery", targetCount: targetKeys.size, materializedTargetsVerified: true });
  const first = await runProductionBootstrap(identity, entry.scenario);
  const firstSnapshot = capturePhysicalSnapshot(requireBase(stores));
  const second = await runProductionBootstrap(identity, entry.scenario);
  const secondSnapshot = capturePhysicalSnapshot(requireBase(stores));
  if (!arePersist13PhysicalSnapshotsEqual(firstSnapshot, secondSnapshot)) throw Object.assign(new Error("persist13_materialized_bootstrap_not_idempotent"), { stage: "verification", category: "recovery_failed" });
  const journalAbsent = await getActiveMutationJournal(productionLearningDataAdmissionContext) === null;
  const rawJournalAbsent = !hasPersist13PhysicalJournal(capturePhysicalSnapshot(requireBase(stores)), entry.runId);
  const firstHasActiveSession = first.kind === "ready" && Boolean(first.activeSessionId);
  if (!journalAbsent || !rawJournalAbsent || first.kind !== "ready" || second.kind !== "ready"
    || !first.activeSessionId || first.activeSessionId !== second.activeSessionId) {
    throw Object.assign(new Error("persist13_materialized_journal_recovery_blocked"), { stage: "verification", category: "bootstrap_blocked" });
  }
  const attempts = await getTrainingAttempts(productionTrackAdmissionContext);
  const sessions = await getTrainingSessions(productionTrackAdmissionContext);
  const reviews = await getReviewQueueItems(productionTrackAdmissionContext);
  const active = await getActiveTrainingSession(productionTrackAdmissionContext);
  const occurrence = active?.itemOrder[sidecar.baselineSessionIndex];
  const actualAttempt = attempts.value.find((attempt) => attempt.id === (attemptWrite.kind === "put_attempt" ? attemptWrite.record.id : ""));
  const actualSession = sessions.value.find((session) => session.id === (sessionWrite.kind === "put_session" ? sessionWrite.record.id : ""));
  const reviewHashes = new Set(reviews.value.map(hashJsonForAssertion));
  const recoveredSnapshot = hashPersist13PhysicalSnapshot(firstSnapshot, sha256Utf8);
  const materializedTargetsVerified = Boolean(active && occurrence && actualAttempt && actualSession
    && hashJsonForAssertion(actualAttempt) === sidecar.expectedAttemptSha256
    && hashJsonForAssertion(actualAttempt.response) === sidecar.responseSha256
    && hashJsonForAssertion(actualSession) === sidecar.expectedSessionSha256
    && sidecar.expectedReviewSha256.every((hash) => reviewHashes.has(hash))
    && reviews.value.length === sidecar.expectedReviewCount
    && attempts.value.length === sidecar.baselineAttemptCount + 1
    && actualAttempt.sessionId === active.id && actualAttempt.occurrenceId === occurrence.occurrenceId
    && active.currentItemIndex === sidecar.baselineSessionIndex
    && sha256Utf8(active.id) === sidecar.sessionIdSha256
    && sha256Utf8(occurrence.occurrenceId) === sidecar.occurrenceIdSha256
    && sessions.value.filter((session) => session.status === "active").length === 1
    && await getTrainingSessionResult(active.id, productionTrackAdmissionContext) === null
    && areHashedSnapshotsEqualExceptKeys(sidecar.before, recoveredSnapshot, targetKeys));
  if (!firstHasActiveSession || !materializedTargetsVerified) throw Object.assign(new Error("persist13_materialized_journal_recovery_postcondition_failed"), { stage: "verification", category: "preservation_failed" });
  writeScenarioSidecar(stores, Object.freeze({ ...sidecar, phase: "recovered" }));
  publish({ result: "pending", scenario: entry.scenario, stage: "verification", bootstrapReady: true, journalAbsent, materializedTargetsVerified, preservedEqual: true });
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
  const mmkv = stores.mmkv;
  stores.base = null;
  stores.router = null;
  stores.control = null;
  stores.fault = null;
  const cleanupVerified = deleteOwnedFixtureStores(mmkv, stores.manifest);
  if (!cleanupVerified) throw Object.assign(new Error("persist13_fixture_cleanup_unverified"), { stage: "cleanup", category: "native_store_cleanup_failed" });
  publish({ result: "observed", scenario: entry.scenario, stage: "complete", bootstrapReady: true, journalAbsent, materializedTargetsVerified, preservedEqual: true, cleanupVerified: true });
}

async function recordVerifiedPendingClearOutcome(input: Readonly<{
  entry: Extract<Persist13Entry, { kind: "fixture" }> & Readonly<{ scenario: "verify_clear" }>;
  stores: FixtureStores;
  before: Persist13VerifyClearSidecar["before"];
  sessionId: string;
  occurrenceId: string;
  responseSha256: string;
  baselineAttemptCount: number;
  baselineReviewCount: number;
  baselineSessionIndex: number;
  publish: (receipt: FixtureReceipt) => void;
}>): Promise<never> {
  const { entry, stores, before, sessionId, occurrenceId, responseSha256, baselineAttemptCount, baselineReviewCount, baselineSessionIndex, publish } = input;
  const journal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
  const lease = captureActiveProfileStorageLease();
  if (!journal || journal.status !== "verified_pending_clear" || journal.operation !== "submit_training_outcome"
    || journal.sessionId !== sessionId || !lease || lease.profile.id !== entry.runId || lease.profile.kind !== "guest" || lease.profile.accountId !== null) {
    throw Object.assign(new Error("persist13_verify_clear_journal_authority_missing"), { stage: "verify_clear", category: "fault_injection_failed" });
  }
  assertExactPracticeOutcomeWrites(journal.writes, "seed");
  const targetKeys = materializedJournalDeltaKeys(entry.runId, journal);
  assertJournalWritesAreMaterialized(journal, entry.runId, targetKeys, "seed");
  const attemptsNow = await getTrainingAttempts(productionTrackAdmissionContext);
  const sessionsNow = await getTrainingSessions(productionTrackAdmissionContext);
  const reviewsNow = await getReviewQueueItems(productionTrackAdmissionContext);
  const attemptWrite = journal.writes.find((write) => write.kind === "put_attempt");
  const sessionWrite = journal.writes.find((write) => write.kind === "put_session");
  const reviewWrites = journal.writes.filter((write) => write.kind === "put_review_entry" || write.kind === "update_review_entry");
  const actualAttempt = attemptWrite?.kind === "put_attempt" ? attemptsNow.value.find((attempt) => attempt.id === attemptWrite.record.id) : undefined;
  const actualSession = sessionWrite?.kind === "put_session" ? sessionsNow.value.find((session) => session.id === sessionWrite.record.id) : undefined;
  const actualReviewHashes = new Set(reviewsNow.value.map(hashJsonForAssertion));
  const expectedReviewCount = baselineReviewCount + reviewWrites.filter((write) => write.kind === "put_review_entry").length;
  if (attemptWrite?.kind !== "put_attempt" || !actualAttempt || hashJsonForAssertion(actualAttempt) !== hashJsonForAssertion(attemptWrite.record)
    || sessionWrite?.kind !== "put_session" || !actualSession || hashJsonForAssertion(actualSession) !== hashJsonForAssertion(sessionWrite.record)
    || attemptsNow.value.length !== baselineAttemptCount + 1 || reviewWrites.length === 0 || reviewsNow.value.length !== expectedReviewCount
    || reviewWrites.some((write) => !actualReviewHashes.has(hashJsonForAssertion(write.record)))) {
    throw Object.assign(new Error("persist13_verify_clear_payload_mismatch"), { stage: "verify_clear", category: "fault_injection_failed" });
  }
  const after = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  assertOnlyDerivedJournalTargetsChanged(before, after, targetKeys);
  const sidecar: Persist13VerifyClearSidecar = Object.freeze({
    schema: PERSIST13_VERIFY_CLEAR_SIDECAR_SCHEMA,
    owner: "persist13-reset-fixture",
    runId: entry.runId,
    scenario: "verify_clear",
    phase: "verified_pending_clear",
    dataStoreId: stores.manifest.dataStoreId,
    controlStoreId: stores.manifest.controlStoreId,
    fixtureProfileId: stores.manifest.fixtureProfileId,
    before,
    after,
    sessionIdSha256: sha256Utf8(sessionId),
    occurrenceIdSha256: sha256Utf8(occurrenceId),
    responseSha256,
    expectedAttemptSha256: hashJsonForAssertion(attemptWrite.record),
    expectedSessionSha256: hashJsonForAssertion(sessionWrite.record),
    expectedReviewSha256: Object.freeze(reviewWrites.map((write) => hashJsonForAssertion(write.record))),
    expectedReviewCount,
    baselineAttemptCount,
    baselineSessionIndex,
  });
  writeScenarioSidecar(stores, sidecar);
  publish({ result: "pending", scenario: entry.scenario, stage: "verify_clear", targetCount: targetKeys.size, materializedTargetsVerified: true });
  return new Promise<never>(() => undefined);
}

async function recordPostClearSubmitOutcome(input: Readonly<{
  entry: Extract<Persist13Entry, { kind: "fixture" }> & Readonly<{ scenario: "submit_clear_next" }>;
  stores: FixtureStores;
  before: Persist13SubmitClearNextSidecar["before"];
  sessionId: string;
  occurrenceId: string;
  responseSha256: string;
  baselineAttemptCount: number;
  baselineReviewCount: number;
  baselineSessionIndex: number;
  baselineAttempts: Awaited<ReturnType<typeof getTrainingAttempts>>["value"];
  baselineReviews: Awaited<ReturnType<typeof getReviewQueueItems>>["value"];
  sessionPinsSha256: string;
  publish: (receipt: FixtureReceipt) => void;
}>): Promise<never> {
  const { entry, stores, before, sessionId, occurrenceId, responseSha256, baselineAttemptCount, baselineReviewCount, baselineSessionIndex, baselineAttempts, baselineReviews, sessionPinsSha256, publish } = input;
  await assertMaterializedJournalFixtureGuest(entry.runId, "seed");
  if (baselineSessionIndex !== 0 || await getActiveMutationJournal(productionLearningDataAdmissionContext) !== null
    || hasPersist13PhysicalJournal(capturePhysicalSnapshot(requireBase(stores)), entry.runId)) {
    throw Object.assign(new Error("persist13_submit_clear_journal_not_cleared"), { stage: "submit_clear_next", category: "fault_injection_failed" });
  }
  const attempts = await getTrainingAttempts(productionTrackAdmissionContext);
  const sessions = await getTrainingSessions(productionTrackAdmissionContext);
  const reviews = await getReviewQueueItems(productionTrackAdmissionContext);
  const active = await getActiveTrainingSession(productionTrackAdmissionContext);
  const baselineAttemptIdSet = new Set(baselineAttempts.map((attempt) => attempt.id));
  const newAttempts = attempts.value.filter((attempt) => !baselineAttemptIdSet.has(attempt.id));
  const actualAttempt = newAttempts.length === 1 ? newAttempts[0] : undefined;
  const actualSession = sessions.value.find((session) => session.id === sessionId);
  const baselineReviewById = new Map(baselineReviews.map((review) => [review.id, hashJsonForAssertion(review)]));
  const changedReviews = reviews.value.filter((review) => baselineReviewById.get(review.id) !== hashJsonForAssertion(review));
  const actualOccurrence = actualSession?.itemOrder[baselineSessionIndex];
  const actualSnapshot = capturePhysicalSnapshot(requireBase(stores));
  const after = hashPersist13PhysicalSnapshot(actualSnapshot, sha256Utf8);
  const allowed = new Set<string>([
    persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.trainingAttempt(actualAttempt?.id ?? "missing")),
    persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.TRAINING_ATTEMPT_INDEX),
    persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.trainingSession(sessionId)),
    persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.TRAINING_SESSION_INDEX),
    persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.ACTIVE_TRAINING_SESSION),
    persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.REVIEW_INDEX),
    ...changedReviews.map((review) => persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.reviewEntry(review.id))),
  ]);
  if (!actualAttempt || actualAttempt.sessionId !== sessionId || actualAttempt.occurrenceId !== occurrenceId
    || hashJsonForAssertion(actualAttempt.response) !== responseSha256 || attempts.value.length !== baselineAttemptCount + 1
    || !actualSession || actualSession.currentItemIndex !== baselineSessionIndex || hashPersist13SessionPins(actualSession) !== sessionPinsSha256 || !active || active.id !== sessionId || active.currentItemIndex !== baselineSessionIndex
    || !actualOccurrence || actualOccurrence.occurrenceId !== occurrenceId || !changedReviews.length
    || changedReviews.some((review) => review.sourceAttemptId !== actualAttempt.id || review.sourceSessionId !== sessionId)
    || reviews.value.length !== baselineReviewCount + changedReviews.filter((review) => !baselineReviewById.has(review.id)).length
    || await getTrainingSessionResult(sessionId, productionTrackAdmissionContext) !== null
    || !arePersist13JournalTargetDeltasScoped(before, after, allowed)) {
    throw Object.assign(new Error("persist13_submit_clear_materialization_invalid"), { stage: "submit_clear_next", category: "fault_injection_failed" });
  }
  const timerRaw = requireBase(stores).getString(persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER));
  const expectedAdvanced = advanceTrainingSession(actualSession);
  const sidecar: Persist13SubmitClearNextSidecar = Object.freeze({
    schema: PERSIST13_SUBMIT_CLEAR_NEXT_SIDECAR_SCHEMA,
    owner: "persist13-reset-fixture",
    runId: entry.runId,
    scenario: "submit_clear_next",
    phase: "postclear",
    dataStoreId: stores.manifest.dataStoreId,
    controlStoreId: stores.manifest.controlStoreId,
    fixtureProfileId: stores.manifest.fixtureProfileId,
    before,
    after,
    sessionIdSha256: sha256Utf8(sessionId),
    occurrenceIdSha256: sha256Utf8(occurrenceId),
    responseSha256,
    expectedAttemptSha256: hashJsonForAssertion(actualAttempt),
    expectedSessionSha256: hashJsonForAssertion(actualSession),
    sessionPinsSha256,
    expectedReviewSha256: Object.freeze(changedReviews.map(hashJsonForAssertion)),
    expectedReviewCount: reviews.value.length,
    baselineAttemptCount,
    baselineReviewCount,
    baselineSessionIndex,
    timerSha256: sha256Utf8(timerRaw ?? "<absent>"),
    expectedAdvancedSessionSha256: hashJsonForAssertion(expectedAdvanced),
  });
  persistSubmitClearNextPhase(stores, sidecar, "submit_clear_next");
  publish({ result: "pending", scenario: entry.scenario, stage: "submit_clear_next", targetCount: allowed.size, materializedTargetsVerified: true, journalAbsent: true });
  return new Promise<never>(() => undefined);
}

async function recoverSubmitClearNextScenario(
  entry: Extract<Persist13Entry, { kind: "fixture" }> & Readonly<{ scenario: "submit_clear_next" }>,
  initialSidecar: Persist13SubmitClearNextSidecar,
  stores: FixtureStores,
  identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>,
  publish: (receipt: FixtureReceipt) => void,
): Promise<void> {
  await assertMaterializedJournalFixtureGuest(entry.runId, "preflight");
  if (!areHashedSnapshotsEqual(initialSidecar.after, hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8))
    || await getActiveMutationJournal(productionLearningDataAdmissionContext) !== null
    || hasPersist13PhysicalJournal(capturePhysicalSnapshot(requireBase(stores)), entry.runId)) {
    throw Object.assign(new Error("persist13_submit_clear_recovery_baseline_mismatch"), { stage: "preflight", category: "manifest_invalid" });
  }
  const actualSessionByHash = async () => {
    const attempts = await getTrainingAttempts(productionTrackAdmissionContext);
    const reviews = await getReviewQueueItems(productionTrackAdmissionContext);
    const active = await getActiveTrainingSession(productionTrackAdmissionContext);
    const occurrence = active?.itemOrder[0];
    const attempt = attempts.value.find((row) => row.sessionId === active?.id && row.occurrenceId === occurrence?.occurrenceId);
    const sessionRows = await getTrainingSessions(productionTrackAdmissionContext);
    const session = sessionRows.value.find((row) => row.id === active?.id);
    const hashes = new Set(reviews.value.map(hashJsonForAssertion));
    return { attempts, reviews, active, occurrence, attempt, session, hashes };
  };
  const verifyStoredAnswer = async (sessionIndex: number, expectedSessionHash: string) => {
    const state = await actualSessionByHash();
    const physical = capturePhysicalSnapshot(requireBase(stores));
    const timer = requireBase(stores).getString(persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER));
    const valid = state.active?.id && sha256Utf8(state.active.id) === initialSidecar.sessionIdSha256
      && state.active.currentItemIndex === sessionIndex && state.session && hashJsonForAssertion(state.session) === expectedSessionHash
      && hashPersist13SessionPins(state.session) === initialSidecar.sessionPinsSha256
      && state.occurrence && sha256Utf8(state.occurrence.occurrenceId) === initialSidecar.occurrenceIdSha256
      && state.attempt && hashJsonForAssertion(state.attempt.response) === initialSidecar.responseSha256
      && state.attempt.id !== undefined && hashJsonForAssertion(state.attempt) === initialSidecar.expectedAttemptSha256
      && state.attempts.value.length === initialSidecar.baselineAttemptCount + 1
      && state.reviews.value.length === initialSidecar.expectedReviewCount
      && state.reviews.value.filter((review) => initialSidecar.expectedReviewSha256.includes(hashJsonForAssertion(review))).every((review) => review.sourceAttemptId === state.attempt?.id && review.sourceSessionId === state.active?.id)
      && initialSidecar.expectedReviewSha256.every((hash) => state.hashes.has(hash))
      && await getTrainingSessionResult(state.active.id, productionTrackAdmissionContext) === null
      && !hasPersist13PhysicalJournal(physical, entry.runId)
      && await getActiveMutationJournal(productionLearningDataAdmissionContext) === null
      && sha256Utf8(timer ?? "<absent>") === initialSidecar.timerSha256;
    if (!valid) throw Object.assign(new Error("persist13_submit_clear_repository_state_invalid"), { stage: "verification", category: "recovery_failed" });
    return state;
  };

  const previousPhase = initialSidecar.phase;
  const preRecoverySession = await getActiveTrainingSession(productionTrackAdmissionContext);
  if (!stores.control || !beginPersist13SubmitClearNextRecovery(stores.control, initialSidecar, preRecoverySession?.currentItemIndex ?? -1)) {
    throw Object.assign(new Error("persist13_submit_clear_recovery_phase_uncertain"), { stage: "recovery", category: "recovery_failed" });
  }
  let sidecar: Persist13SubmitClearNextSidecar = Object.freeze({ ...initialSidecar, phase: "recovering" });
  publish({ result: "pending", scenario: entry.scenario, stage: "recovery" });
  const first = await runProductionBootstrap(identity, entry.scenario);
  const firstSnapshot = capturePhysicalSnapshot(requireBase(stores));
  const second = await runProductionBootstrap(identity, entry.scenario);
  const secondSnapshot = capturePhysicalSnapshot(requireBase(stores));
  if (first.kind !== "ready" || second.kind !== "ready" || !first.activeSessionId || first.activeSessionId !== second.activeSessionId
    || !arePersist13PhysicalSnapshotsEqual(firstSnapshot, secondSnapshot)) {
    throw Object.assign(new Error("persist13_submit_clear_bootstrap_not_idempotent"), { stage: "verification", category: "recovery_failed" });
  }
  const index = (await getActiveTrainingSession(productionTrackAdmissionContext))?.currentItemIndex;
  if (index === 1 && previousPhase !== "advance_started" && previousPhase !== "advanced") {
    throw Object.assign(new Error("persist13_submit_clear_advance_phase_missing"), { stage: "verification", category: "recovery_failed" });
  }
  if (index === 0) {
    const stored = await verifyStoredAnswer(0, initialSidecar.expectedSessionSha256);
    if (previousPhase === "advance_started" || previousPhase === "advanced") throw Object.assign(new Error("persist13_submit_clear_advance_uncertain"), { stage: "verification", category: "recovery_failed" });
    const lifecycle = getTrainingLifecycleUseCases();
    const operationProjection = lifecycle.getOperationProjection(stored.active!.id);
    if (!operationProjection || operationProjection.family !== "practice" || operationProjection.kind !== "feedback") {
      throw Object.assign(new Error("persist13_submit_clear_feedback_projection_missing"), { stage: "verification", category: "recovery_failed" });
    }
    sidecar = Object.freeze({ ...sidecar, phase: "bootstrap_verified" });
    persistSubmitClearNextPhase(stores, sidecar, "verification");
    publish({ result: "pending", scenario: entry.scenario, stage: "verification", bootstrapReady: true, journalAbsent: true, materializedTargetsVerified: true });
    sidecar = Object.freeze({ ...sidecar, phase: "advance_started" });
    persistSubmitClearNextPhase(stores, sidecar, "verification");
    const advanced = await lifecycle.advancePracticeSession();
    if (hashJsonForAssertion(advanced) !== sidecar.expectedAdvancedSessionSha256 || advanced.currentItemIndex !== 1) {
      throw Object.assign(new Error("persist13_submit_clear_advance_result_invalid"), { stage: "verification", category: "recovery_failed" });
    }
  }
  const afterAdvance = await getActiveTrainingSession(productionTrackAdmissionContext);
  if (!afterAdvance || afterAdvance.currentItemIndex !== 1 || hashJsonForAssertion(afterAdvance) !== sidecar.expectedAdvancedSessionSha256) {
    throw Object.assign(new Error("persist13_submit_clear_advance_postcondition_failed"), { stage: "verification", category: "recovery_failed" });
  }
  const countsBeforeCheck = await actualSessionByHash();
  const currentTimer = requireBase(stores).getString(persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER));
  if (countsBeforeCheck.attempts.value.length !== sidecar.baselineAttemptCount + 1 || countsBeforeCheck.reviews.value.length !== sidecar.expectedReviewCount
    || !countsBeforeCheck.attempt || hashJsonForAssertion(countsBeforeCheck.attempt) !== sidecar.expectedAttemptSha256
    || hashJsonForAssertion(countsBeforeCheck.attempt.response) !== sidecar.responseSha256
    || !sidecar.expectedReviewSha256.every((hash) => countsBeforeCheck.hashes.has(hash))
    || !countsBeforeCheck.session || hashPersist13SessionPins(countsBeforeCheck.session) !== sidecar.sessionPinsSha256
    || sha256Utf8(currentTimer ?? "<absent>") !== sidecar.timerSha256
    || await getTrainingSessionResult(afterAdvance.id, productionTrackAdmissionContext) !== null
    || await getActiveMutationJournal(productionLearningDataAdmissionContext) !== null
    || hasPersist13PhysicalJournal(capturePhysicalSnapshot(requireBase(stores)), entry.runId)) {
    throw Object.assign(new Error("persist13_submit_clear_advance_changed_history"), { stage: "verification", category: "recovery_failed" });
  }
  sidecar = Object.freeze({ ...sidecar, phase: "advanced" });
  persistSubmitClearNextPhase(stores, sidecar, "verification");
  const verifyOne = await runProductionBootstrap(identity, entry.scenario);
  const snapshotOne = capturePhysicalSnapshot(requireBase(stores));
  const verifyTwo = await runProductionBootstrap(identity, entry.scenario);
  const snapshotTwo = capturePhysicalSnapshot(requireBase(stores));
  const finalSession = await getActiveTrainingSession(productionTrackAdmissionContext);
  const finalTimer = requireBase(stores).getString(persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER));
  if (verifyOne.kind !== "ready" || verifyTwo.kind !== "ready" || !arePersist13PhysicalSnapshotsEqual(snapshotOne, snapshotTwo)
    || !finalSession || finalSession.currentItemIndex !== 1 || hashJsonForAssertion(finalSession) !== sidecar.expectedAdvancedSessionSha256
    || hashPersist13SessionPins(finalSession) !== sidecar.sessionPinsSha256
    || sha256Utf8(finalTimer ?? "<absent>") !== sidecar.timerSha256
    || !areHashedSnapshotsEqualExceptKeys(sidecar.after, hashPersist13PhysicalSnapshot(snapshotTwo, sha256Utf8), new Set([
      persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.trainingSession(finalSession.id)),
      persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.TRAINING_SESSION_INDEX),
    ]))) {
    throw Object.assign(new Error("persist13_submit_clear_final_verification_failed"), { stage: "verification", category: "recovery_failed" });
  }
  publish({ result: "pending", scenario: entry.scenario, stage: "cleanup", bootstrapReady: true, journalAbsent: true, preservedEqual: true });
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
  const mmkv = stores.mmkv;
  stores.base = null;
  stores.router = null;
  stores.control = null;
  stores.fault = null;
  if (!deleteOwnedFixtureStores(mmkv, stores.manifest)) throw Object.assign(new Error("persist13_fixture_cleanup_unverified"), { stage: "cleanup", category: "native_store_cleanup_failed" });
  publish({ result: "observed", scenario: entry.scenario, stage: "complete", bootstrapReady: true, journalAbsent: true, preservedEqual: true, cleanupVerified: true });
}

async function seedAdvanceMaterializedScenario(
  entry: Extract<Persist13Entry, { kind: "fixture" }> & Readonly<{ scenario: "advance_materialized" }>,
  stores: FixtureStores,
  identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>,
  publish: (receipt: FixtureReceipt) => void,
): Promise<never> {
  publish({ result: "pending", scenario: entry.scenario, stage: "bootstrap" });
  const boot = await runProductionBootstrap(identity, entry.scenario);
  if (boot.kind !== "ready" || boot.activeSessionId !== null) throw Object.assign(new Error("persist13_advance_initial_bootstrap_blocked"), { stage: "bootstrap", category: "bootstrap_blocked" });
  publish({ result: "pending", scenario: entry.scenario, stage: "seed" });
  await seedPersist13ResetFixtureState(entry.runId, { includeActiveSession: false });
  const lifecycle = getTrainingLifecycleUseCases();
  const prepared = await lifecycle.startSession({ trackId: "coding-interview-dsa-problem-solving", modeId: "coding-interview-learn-approach", source: "persist13-advance-materialized", request: { requestedLength: 10 } });
  await getForegroundSessionTimerFacade().initialize(prepared.session);
  const occurrence = prepared.session.itemOrder[0];
  if (!occurrence) throw Object.assign(new Error("persist13_advance_occurrence_missing"), { stage: "seed", category: "seed_failed" });
  const question = (await loadCanonicalRuntimeCatalog()).getQuestion(occurrence.item.trackId, occurrence.item.questionId);
  if (!question) throw Object.assign(new Error("persist13_advance_question_missing"), { stage: "seed", category: "seed_failed" });
  await lifecycle.submitPracticeResponse(incorrectCanonicalResponse(question));

  const baseline = await getActiveTrainingSession(productionTrackAdmissionContext);
  const attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value;
  const reviews = (await getReviewQueueItems(productionTrackAdmissionContext)).value;
  const sessions = (await getTrainingSessions(productionTrackAdmissionContext)).value;
  const timer = await getActiveForegroundTimer(productionTrackAdmissionContext);
  const projection = baseline ? await lifecycle.getPracticeOperationState(baseline, false) : null;
  const initialTimer = baseline ? initialForegroundTimerForSession(baseline, getTrackRegistration(baseline.trackId).familyId) : null;
  if (!baseline || baseline.id !== prepared.session.id || baseline.currentItemIndex !== 0 || projection?.kind !== "feedback"
    || !timer || timer.running || !initialTimer || hashJsonForAssertion(timer) !== hashJsonForAssertion(initialTimer)
    || await getActiveMutationJournal(productionLearningDataAdmissionContext) !== null
    || hasPersist13PhysicalJournal(capturePhysicalSnapshot(requireBase(stores)), entry.runId)) {
    throw Object.assign(new Error("persist13_advance_baseline_invalid"), { stage: "seed", category: "seed_failed" });
  }
  await assertMaterializedJournalFixtureGuest(entry.runId, "seed");
  const before = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  const expectedSession = advanceTrainingSession(baseline);
  const timerRaw = requireBase(stores).getString(persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER));
  const expectedLogicalKeys = [STORAGE_KEYS.ACTIVE_TRAINING_SESSION, STORAGE_KEYS.trainingSession(baseline.id), STORAGE_KEYS.TRAINING_SESSION_INDEX];
  const expectedPhysicalKeys = new Set(expectedLogicalKeys.map((key) => persist13FixturePhysicalKey(entry.runId, key)));
  installPersist13AdvanceMaterializedPauseHook(async (stage) => {
    if (stage !== PERSIST13_ADVANCE_MATERIALIZED_STAGE) throw Object.assign(new Error("persist13_advance_unexpected_pause_stage"), { stage: "advance_materialized", category: "fault_injection_failed" });
    await assertMaterializedJournalFixtureGuest(entry.runId, "seed");
    const journal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
    if (!journal || journal.operation !== "advance_training_session" || journal.status !== "journal_durable" || journal.sessionId !== baseline.id
      || journal.writes.length !== 1 || journal.writes[0]?.kind !== "put_session"
      || hashJsonForAssertion(journal.writes[0].record) !== hashJsonForAssertion(expectedSession)
      || !arePersist13JournalPhysicalWriteTargetsExact(expectedPhysicalKeys, journal.physicalWrites.map((write) => persist13FixturePhysicalKey(entry.runId, write.key)))
      || !areMutationPhysicalWritesAfter(journal.physicalWrites)) {
      throw Object.assign(new Error("persist13_advance_journal_materialization_invalid"), { stage: "advance_materialized", category: "fault_injection_failed" });
    }
    const current = await getActiveTrainingSession(productionTrackAdmissionContext);
    const attemptsAfter = (await getTrainingAttempts(productionTrackAdmissionContext)).value;
    const reviewsAfter = (await getReviewQueueItems(productionTrackAdmissionContext)).value;
    const sessionsAfter = (await getTrainingSessions(productionTrackAdmissionContext)).value;
    const timerAfter = await getActiveForegroundTimer(productionTrackAdmissionContext);
    const actualSnapshot = capturePhysicalSnapshot(requireBase(stores));
    const after = hashPersist13PhysicalSnapshot(actualSnapshot, sha256Utf8);
    const allowed = new Set([...expectedPhysicalKeys, persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.ACTIVE_JOURNAL)]);
    if (!current || hashJsonForAssertion(current) !== hashJsonForAssertion(expectedSession)
      || hashJsonForAssertion(sessionsAfter.find((row) => row.id === baseline.id)) !== hashJsonForAssertion(expectedSession)
      || hashJsonForAssertion(attemptsAfter) !== hashJsonForAssertion(attempts)
      || hashJsonForAssertion(reviewsAfter) !== hashJsonForAssertion(reviews)
      || !isExactPersist13SessionCollectionAdvance(sessions, sessionsAfter, baseline.id, expectedSession, (left, right) => hashJsonForAssertion(left) === hashJsonForAssertion(right))
      || hashJsonForAssertion(timerAfter) !== hashJsonForAssertion(timer)
      || await getTrainingSessionResult(baseline.id, productionTrackAdmissionContext) !== null
      || !hasPersist13PhysicalJournal(actualSnapshot, entry.runId)
      || !arePersist13JournalTargetDeltasScoped(before, after, allowed)) {
      throw Object.assign(new Error("persist13_advance_materialized_state_invalid"), { stage: "advance_materialized", category: "fault_injection_failed" });
    }
    const sidecar: Persist13AdvanceMaterializedSidecar = Object.freeze({
      schema: PERSIST13_ADVANCE_MATERIALIZED_SIDECAR_SCHEMA, owner: "persist13-reset-fixture", runId: entry.runId,
      scenario: "advance_materialized", phase: "materialized", dataStoreId: stores.manifest.dataStoreId,
      controlStoreId: stores.manifest.controlStoreId, fixtureProfileId: stores.manifest.fixtureProfileId,
      before, after, sessionIdSha256: sha256Utf8(baseline.id), expectedSessionSha256: hashJsonForAssertion(expectedSession),
      expectedSessionsSha256: hashJsonForAssertion(sessionsAfter), sessionPinsSha256: hashPersist13SessionPins(baseline), attemptSetSha256: hashJsonForAssertion(attempts),
      reviewSetSha256: hashJsonForAssertion(reviews), timerSha256: sha256Utf8(timerRaw ?? "<absent>"),
      attemptCount: attempts.length, reviewCount: reviews.length,
    });
    persistAdvanceMaterializedSidecar(stores, sidecar, "advance_materialized");
    publish({ result: "pending", scenario: entry.scenario, stage: "advance_materialized", targetCount: allowed.size, materializedTargetsVerified: true });
    return new Promise<never>(() => undefined);
  });
  await lifecycle.advancePracticeSession();
  throw Object.assign(new Error("persist13_advance_materialized_pause_not_reached"), { stage: "advance_materialized", category: "fault_injection_failed" });
}

async function recoverAdvanceMaterializedScenario(
  entry: Extract<Persist13Entry, { kind: "fixture" }> & Readonly<{ scenario: "advance_materialized" }>,
  sidecar: Persist13AdvanceMaterializedSidecar,
  stores: FixtureStores,
  identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>,
  publish: (receipt: FixtureReceipt) => void,
): Promise<void> {
  await assertMaterializedJournalFixtureGuest(entry.runId, "preflight");
  const beforeRecovery = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  const journal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
  if (!areHashedSnapshotsEqual(sidecar.after, beforeRecovery) || !journal || journal.operation !== "advance_training_session"
    || journal.status !== "journal_durable" || sha256Utf8(journal.sessionId) !== sidecar.sessionIdSha256
    || journal.writes.length !== 1 || journal.writes[0]?.kind !== "put_session"
    || hashJsonForAssertion(journal.writes[0].record) !== sidecar.expectedSessionSha256
    || !hasPersist13PhysicalJournal(capturePhysicalSnapshot(requireBase(stores)), entry.runId)) {
    throw Object.assign(new Error("persist13_advance_recovery_authority_mismatch"), { stage: "preflight", category: "manifest_invalid" });
  }
  const expectedTargets = new Set([
    persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.ACTIVE_TRAINING_SESSION),
    persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.trainingSession(journal.sessionId)),
    persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.TRAINING_SESSION_INDEX),
  ]);
  if (!arePersist13JournalPhysicalWriteTargetsExact(expectedTargets, journal.physicalWrites.map((write) => persist13FixturePhysicalKey(entry.runId, write.key)))
    || !areMutationPhysicalWritesAfter(journal.physicalWrites)) {
    throw Object.assign(new Error("persist13_advance_recovery_target_mismatch"), { stage: "preflight", category: "manifest_invalid" });
  }
  const attemptsBefore = (await getTrainingAttempts(productionTrackAdmissionContext)).value;
  const reviewsBefore = (await getReviewQueueItems(productionTrackAdmissionContext)).value;
  const sessionsBefore = (await getTrainingSessions(productionTrackAdmissionContext)).value;
  const activeBefore = await getActiveTrainingSession(productionTrackAdmissionContext);
  if (!activeBefore || activeBefore.currentItemIndex !== 1 || hashJsonForAssertion(activeBefore) !== sidecar.expectedSessionSha256
    || hashJsonForAssertion(attemptsBefore) !== sidecar.attemptSetSha256
    || hashJsonForAssertion(reviewsBefore) !== sidecar.reviewSetSha256 || attemptsBefore.length !== sidecar.attemptCount
    || reviewsBefore.length !== sidecar.reviewCount || hashPersist13SessionPins(activeBefore) !== sidecar.sessionPinsSha256
    || hashJsonForAssertion(sessionsBefore) !== sidecar.expectedSessionsSha256) {
    throw Object.assign(new Error("persist13_advance_recovery_baseline_invalid"), { stage: "preflight", category: "manifest_invalid" });
  }
  persistAdvanceMaterializedSidecar(stores, Object.freeze({ ...sidecar, phase: "recovering" }), "recovery");
  publish({ result: "pending", scenario: entry.scenario, stage: "recovery" });
  const first = await runProductionBootstrap(identity, entry.scenario);
  const firstSnapshot = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  const second = await runProductionBootstrap(identity, entry.scenario);
  const secondSnapshot = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  const expectedSession = await getActiveTrainingSession(productionTrackAdmissionContext);
  const attemptsAfter = (await getTrainingAttempts(productionTrackAdmissionContext)).value;
  const reviewsAfter = (await getReviewQueueItems(productionTrackAdmissionContext)).value;
  const sessionsAfter = (await getTrainingSessions(productionTrackAdmissionContext)).value;
  const timerState = await getActiveForegroundTimer(productionTrackAdmissionContext);
  const timerRaw = requireBase(stores).getString(persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER));
  const currentJournal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
  const journalKey = persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.ACTIVE_JOURNAL);
  const expectedAdvancedHash = sidecar.expectedSessionSha256;
  if (first.kind !== "ready" || second.kind !== "ready" || !areHashedSnapshotsEqual(firstSnapshot, secondSnapshot)
    || !expectedSession || expectedSession.currentItemIndex !== 1 || hashJsonForAssertion(expectedSession) !== expectedAdvancedHash
    || hashJsonForAssertion(sessionsAfter.find((row) => row.id === expectedSession.id)) !== expectedAdvancedHash
    || hashJsonForAssertion(sessionsAfter) !== sidecar.expectedSessionsSha256
    || hashJsonForAssertion(attemptsAfter) !== sidecar.attemptSetSha256 || hashJsonForAssertion(reviewsAfter) !== sidecar.reviewSetSha256
    || attemptsAfter.length !== sidecar.attemptCount || reviewsAfter.length !== sidecar.reviewCount
    || hashPersist13SessionPins(expectedSession) !== sidecar.sessionPinsSha256
    || !timerState || timerState.running || timerState.sessionId !== expectedSession.id
    || timerRaw === undefined || sha256Utf8(timerRaw) !== sidecar.timerSha256 || currentJournal !== null
    || hasPersist13PhysicalJournal(capturePhysicalSnapshot(requireBase(stores)), entry.runId)
    || await getTrainingSessionResult(expectedSession.id, productionTrackAdmissionContext) !== null
    || !areHashedSnapshotsEqualExceptKeys(sidecar.after, secondSnapshot, new Set([journalKey]))
    || !arePersist13JournalTargetDeltasScoped(sidecar.before, secondSnapshot, expectedTargets)) {
    throw Object.assign(new Error("persist13_advance_recovery_postcondition_failed"), { stage: "verification", category: "recovery_failed" });
  }
  if (sidecar.phase === "recovered") throw Object.assign(new Error("persist13_advance_recovery_already_completed"), { stage: "verification", category: "recovery_failed" });
  persistAdvanceMaterializedSidecar(stores, Object.freeze({ ...sidecar, phase: "recovered" }), "verification");
  publish({ result: "pending", scenario: entry.scenario, stage: "cleanup", bootstrapReady: true, journalAbsent: true, preservedEqual: true });
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
  const mmkv = stores.mmkv;
  stores.base = null;
  stores.router = null;
  stores.control = null;
  stores.fault = null;
  if (!deleteOwnedFixtureStores(mmkv, stores.manifest)) throw Object.assign(new Error("persist13_fixture_cleanup_unverified"), { stage: "cleanup", category: "native_store_cleanup_failed" });
  publish({ result: "observed", scenario: entry.scenario, stage: "complete", bootstrapReady: true, journalAbsent: true, preservedEqual: true, cleanupVerified: true });
}

function persistSubmitClearNextPhase(stores: FixtureStores, sidecar: Persist13SubmitClearNextSidecar, stage: FixtureStage): void {
  if (!stores.control || !writeAndVerifyPersist13SubmitClearNextPhase(stores.control, sidecar)) {
    throw Object.assign(new Error("persist13_submit_clear_phase_readback_mismatch"), { stage, category: "manifest_invalid" });
  }
}

function persistAdvanceMaterializedSidecar(stores: FixtureStores, sidecar: Persist13AdvanceMaterializedSidecar, stage: FixtureStage): void {
  if (!stores.control || !writeAndVerifyPersist13AdvanceMaterializedSidecar(stores.control, sidecar)) {
    throw Object.assign(new Error("persist13_advance_sidecar_readback_mismatch"), { stage, category: "manifest_invalid" });
  }
}

function hashPersist13SessionPins(session: Awaited<ReturnType<typeof getTrainingSessions>>["value"][number]): string {
  return hashJsonForAssertion({
    id: session.id,
    trackId: session.trackId,
    modeId: session.modeId,
    configurationSnapshot: session.configurationSnapshot,
    requestedLength: session.requestedLength,
    actualLength: session.actualLength,
    itemOrder: session.itemOrder,
    optionOrderByOccurrence: session.optionOrderByOccurrence,
    conditionalReinsertSlots: session.conditionalReinsertSlots,
    caseState: session.caseState,
    caseStates: session.caseStates,
    contentVersion: session.contentVersion,
    artifactSha256: session.artifactSha256,
    taxonomyVersion: session.taxonomyVersion,
    planFingerprint: session.planFingerprint,
    startedAt: session.startedAt,
  });
}


function requireBase(stores: FixtureStores): KeyValueStorage {
  if (!stores.base) throw new Error("persist13_fixture_storage_unavailable");
  return stores.base;
}

function requireFault(stores: FixtureStores): FixtureFault {
  if (!stores.fault) throw new Error("persist13_fixture_fault_adapter_unavailable");
  return stores.fault;
}

function assertOnlyFaultKeyChanged(before: ReturnType<typeof hashPersist13PhysicalSnapshot>, after: ReturnType<typeof hashPersist13PhysicalSnapshot>, faultKey: string): void {
  const beforeTarget = before.find((row) => row.key === faultKey);
  const afterTarget = after.find((row) => row.key === faultKey);
  if (!areHashedSnapshotsEqual(before, after, faultKey) || !afterTarget || (beforeTarget && beforeTarget.sha256 === afterTarget.sha256)) {
    throw Object.assign(new Error("persist13_fault_changed_unexpected_physical_keys"), { stage: "seed", category: "fault_injection_failed" });
  }
}

function writeScenarioSidecar(stores: FixtureStores, sidecar: Persist13ScenarioSidecar): void {
  const valid = sidecar.scenario === "advance_materialized"
    ? isPersist13AdvanceMaterializedSidecar(sidecar, sidecar.runId)
    : sidecar.scenario === "practice_ui_next"
      ? isPersist13PracticeUiNextSidecar(sidecar, sidecar.runId)
    : sidecar.scenario === "practice_ui_probe"
      ? isPersist13PracticeUiProbeSidecar(sidecar, sidecar.runId)
    : sidecar.scenario === "journal_materialized"
    ? isPersist13MaterializedJournalSidecar(sidecar, sidecar.runId)
    : sidecar.scenario === "verify_clear"
      ? isPersist13VerifyClearSidecar(sidecar, sidecar.runId)
      : sidecar.scenario === "submit_clear_next"
        ? isPersist13SubmitClearNextSidecar(sidecar, sidecar.runId)
    : isPersist13ScenarioSidecar(sidecar, sidecar.runId, sidecar.scenario);
  if (!stores.control || !valid) throw Object.assign(new Error("persist13_scenario_sidecar_invalid"), { stage: "seed", category: "manifest_invalid" });
  stores.control.set(PERSIST13_SCENARIO_SIDECAR_KEY, JSON.stringify(sidecar));
}

function readScenarioSidecar(control: NativeMMKV, entry: Extract<Persist13Entry, { kind: "fixture" }> & Readonly<{ scenario: "journal" | "journal_materialized" | "verify_clear" | "submit_clear_next" | "advance_materialized" | "practice_ui_probe" | "practice_ui_next" | "draft" }>): Persist13ScenarioSidecar {
  let parsed: unknown;
  try { parsed = JSON.parse(control.getString(PERSIST13_SCENARIO_SIDECAR_KEY) ?? "null"); }
  catch { throw Object.assign(new Error("persist13_scenario_sidecar_invalid"), { stage: "native_store_open", category: "manifest_invalid" }); }
  if (entry.scenario === "advance_materialized") {
    if (!isPersist13AdvanceMaterializedSidecar(parsed, entry.runId)) throw Object.assign(new Error("persist13_scenario_sidecar_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
    if (entry.mode === "recover" && parsed.phase === "materialized") return parsed;
    throw Object.assign(new Error("persist13_scenario_sidecar_state_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
  }
  if (entry.scenario === "practice_ui_probe") {
    if (!isPersist13PracticeUiProbeSidecar(parsed, entry.runId)) throw Object.assign(new Error("persist13_scenario_sidecar_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
    if (entry.mode === "recover" && (parsed.phase === "ready" || parsed.phase === "ui_armed")) return parsed;
    throw Object.assign(new Error("persist13_scenario_sidecar_state_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
  }
  if (entry.scenario === "practice_ui_next") {
    if (!isPersist13PracticeUiNextSidecar(parsed, entry.runId)) throw Object.assign(new Error("persist13_scenario_sidecar_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
    if (entry.mode === "recover" && (parsed.phase === "ready" || parsed.phase === "ui_armed")) return parsed;
    throw Object.assign(new Error("persist13_scenario_sidecar_state_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
  }
  if (entry.scenario === "journal_materialized") {
    if (!isPersist13MaterializedJournalSidecar(parsed, entry.runId)) throw Object.assign(new Error("persist13_scenario_sidecar_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
    if (entry.mode === "recover" && ["materialized", "recovering", "recovered"].includes(parsed.phase)) return parsed;
    throw Object.assign(new Error("persist13_scenario_sidecar_state_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
  }
  if (entry.scenario === "verify_clear") {
    if (!isPersist13VerifyClearSidecar(parsed, entry.runId)) throw Object.assign(new Error("persist13_scenario_sidecar_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
    if (entry.mode === "recover" && ["verified_pending_clear", "recovering", "recovered"].includes(parsed.phase)) return parsed;
    throw Object.assign(new Error("persist13_scenario_sidecar_state_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
  }
  if (entry.scenario === "submit_clear_next") {
    if (!isPersist13SubmitClearNextSidecar(parsed, entry.runId)) throw Object.assign(new Error("persist13_scenario_sidecar_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
    if (entry.mode === "recover") return parsed;
    throw Object.assign(new Error("persist13_scenario_sidecar_state_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
  }
  if (!isPersist13ScenarioSidecar(parsed, entry.runId, entry.scenario)) throw Object.assign(new Error("persist13_scenario_sidecar_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
  if (entry.mode === "recover" && parsed.phase === "faulted") return parsed;
  if (entry.mode === "recover" && (parsed.phase === "recovering" || parsed.phase === "recovered")) return parsed;
  throw Object.assign(new Error("persist13_scenario_sidecar_state_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
}

function assertNoFixtureExportCache(profileId: string): void {
  try {
    const { Directory, File, Paths } = require("expo-file-system") as typeof import("expo-file-system");
    const entries = new Directory(Paths.cache).list();
    const prefixes = PERSIST13_FIXTURE_CACHE_PREFIXES.map((prefix) => `${prefix}${profileId}-`);
    if (entries.some((entry) => entry instanceof File && prefixes.some((prefix) => entry.name.startsWith(prefix)))) {
      throw Object.assign(new Error("persist13_fixture_export_cache_collision"), { stage: "cache_preflight", category: "cache_collision" });
    }
  } catch (error) {
    if (categoryFromError(error) === "cache_collision") throw error;
    throw Object.assign(new Error("persist13_fixture_cache_unavailable"), { stage: "cache_preflight", category: "cache_unavailable" });
  }
}

async function runProductionBootstrap(identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>, scenario: "start_cutpoint" | "reset" | "journal" | "journal_materialized" | "verify_clear" | "submit_clear_next" | "advance_materialized" | "practice_ui_probe" | "practice_ui_next" | "draft" = "reset") {
  return bootstrapApplication(
    () => contentPackageRuntimeOwner.verifyBundledPackages(),
    async (sessionId) => {
      if (scenario === "reset") throw new Error("persist13_reset_unexpected_active_session");
      const lifecycle = getTrainingLifecycleUseCases();
      try {
        const session = await lifecycle.resumeActiveSession();
        if (session.id !== sessionId) throw new Error("persist13_active_session_identity_changed");
        if (session.configurationSnapshot.timer === "countdownForeground" || session.configurationSnapshot.timer === "elapsedForeground") {
          await getForegroundSessionTimerFacade().restoreForResume(session);
        }
      } catch (error) {
        if (error instanceof TrainingApplicationFailure
          && (error.code === "premium_entitlement_denied" || error.code === "premium_entitlement_unavailable")) {
          return { kind: "premium_resume_unavailable", reason: error.code } as const;
        }
        throw error;
      }
      return undefined;
    },
    async () => { composeTrainingLifecycleUseCases({ packages: contentPackageRuntimeOwner }); },
    { repositories: { guestInstallationIdentity: identity } },
  );
}

function capturePhysicalSnapshot(storage: KeyValueStorage): ReadonlyArray<readonly [string, string | undefined]> {
  return Object.freeze([...storage.getAllKeys()].sort().map((key) => Object.freeze([key, storage.getString(key)] as const)));
}

function persist13PracticeJournalTargetKeys(runId: string, writes: readonly JournalWrite[]): ReadonlySet<string> {
  const logicalKeys = new Set<string>();
  for (const write of writes) {
    switch (write.kind) {
      case "put_attempt":
        logicalKeys.add(STORAGE_KEYS.trainingAttempt(write.record.id));
        logicalKeys.add(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX);
        break;
      case "put_session":
        logicalKeys.add(STORAGE_KEYS.trainingSession(write.record.id));
        logicalKeys.add(STORAGE_KEYS.TRAINING_SESSION_INDEX);
        logicalKeys.add(STORAGE_KEYS.ACTIVE_TRAINING_SESSION);
        break;
      case "put_review_entry":
      case "put_review_entry_for_attempt":
      case "update_review_entry":
      case "delete_review_entry":
      case "delete_review_entry_for_attempt":
        logicalKeys.add(STORAGE_KEYS.reviewEntry(write.record.id));
        logicalKeys.add(STORAGE_KEYS.REVIEW_INDEX);
        break;
      default:
        throw Object.assign(new Error("persist13_journal_write_set_unexpected"), { stage: "preflight", category: "manifest_invalid" });
    }
  }
  if (!writes.some((write) => write.kind === "put_attempt") || !writes.some((write) => write.kind === "put_session")) {
    throw Object.assign(new Error("persist13_journal_write_set_incomplete"), { stage: "preflight", category: "manifest_invalid" });
  }
  return new Set([...logicalKeys].map((key) => persist13FixturePhysicalKey(runId, key)));
}

function materializedJournalDeltaKeys(runId: string, journal: MutationJournalRecord): ReadonlySet<string> {
  const writes = persist13PracticeJournalTargetKeys(runId, journal.writes);
  const physicalWriteKeys = journal.physicalWrites.map((write) => persist13FixturePhysicalKey(runId, write.key));
  if (!arePersist13JournalPhysicalWriteTargetsExact(writes, physicalWriteKeys)) {
    throw Object.assign(new Error("persist13_journal_physical_target_set_mismatch"), { stage: "verification", category: "fault_injection_failed" });
  }
  return new Set([...writes, persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL)]);
}

function assertExactPracticeOutcomeWrites(writes: readonly JournalWrite[], stage: "seed" | "preflight"): void {
  const attempts = writes.filter((write) => write.kind === "put_attempt");
  const sessions = writes.filter((write) => write.kind === "put_session");
  const reviews = writes.filter((write) => write.kind === "put_review_entry" || write.kind === "update_review_entry");
  const onlyExpectedWrites = writes.every((write) => write.kind === "put_attempt" || write.kind === "put_session"
    || write.kind === "put_review_entry" || write.kind === "update_review_entry");
  if (!onlyExpectedWrites || attempts.length !== 1 || sessions.length !== 1 || reviews.length === 0
    || writes.length !== attempts.length + sessions.length + reviews.length) {
    throw Object.assign(new Error("persist13_practice_outcome_write_set_invalid"), { stage, category: "fault_injection_failed" });
  }
}

function assertJournalWritesAreMaterialized(journal: MutationJournalRecord, runId: string, targetKeys: ReadonlySet<string>, stage: "seed" | "preflight"): void {
  const journalKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL);
  if (!targetKeys.has(journalKey) || journal.physicalWrites.length === 0
    || journal.physicalWrites.some((write) => !targetKeys.has(persist13FixturePhysicalKey(runId, write.key)))
    || !areMutationPhysicalWritesAfter(journal.physicalWrites)) {
    throw Object.assign(new Error("persist13_journal_target_not_materialized"), { stage, category: "fault_injection_failed" });
  }
  const physical = getKeyValueStorage();
  if (physical.getString(STORAGE_KEYS.ACTIVE_JOURNAL) === undefined) {
    throw Object.assign(new Error("persist13_durable_journal_missing_at_pause"), { stage, category: "fault_injection_failed" });
  }
}

function assertOnlyDerivedJournalTargetsChanged(
  before: Persist13MaterializedJournalSidecar["before"],
  after: Persist13MaterializedJournalSidecar["after"],
  targetKeys: ReadonlySet<string>,
): void {
  if (!arePersist13JournalTargetDeltasScoped(before, after, targetKeys)) {
    throw Object.assign(new Error("persist13_materialized_journal_delta_invalid"), { stage: "verification", category: "fault_injection_failed" });
  }
}

async function assertMaterializedJournalFixtureGuest(runId: string, stage: "seed" | "preflight"): Promise<void> {
  const lease = captureActiveProfileStorageLease();
  const guest = await getGuestInstallation();
  if (!lease || lease.profile.id !== runId || lease.profile.kind !== "guest" || lease.profile.accountId !== null
    || !guest || guest.localDatasetId !== runId || guest.bindingState !== "guest") {
    throw Object.assign(new Error("persist13_materialized_fixture_guest_authority_mismatch"), { stage, category: "manifest_invalid" });
  }
}

function incorrectCanonicalResponse(question: Question): CanonicalQuestionResponse {
  if (question.interaction.type === "choice_single" && question.answer.type === "choice_single") {
    const answer = question.answer;
    const wrong = question.interaction.options.find((option) => option.optionId !== answer.optionId);
    if (wrong) return { type: "choice_single", optionId: wrong.optionId };
  } else if (question.interaction.type === "choice_multiple" && question.answer.type === "choice_multiple") {
    const answer = question.answer;
    const wrong = question.interaction.options.find((option) => !answer.optionIds.includes(option.optionId));
    if (wrong) return { type: "choice_multiple", optionIds: [wrong.optionId] };
  } else if (question.interaction.type === "ordering" && question.answer.type === "ordering" && question.answer.orderedElementIds.length > 1) {
    return { type: "ordering", orderedElementIds: [...question.answer.orderedElementIds].reverse() };
  } else if ((question.interaction.type === "complexity" || question.interaction.type === "decision_matrix")
    && question.answer.type === question.interaction.type) {
    const selectedValueIdsByDimension = { ...question.answer.selectedValueIdsByDimension };
    for (const dimension of question.interaction.dimensions) {
      const current = selectedValueIdsByDimension[dimension.dimensionId]?.[0];
      const wrong = dimension.values.find((value) => value.valueId !== current);
      if (wrong) {
        selectedValueIdsByDimension[dimension.dimensionId] = [wrong.valueId];
        return { type: question.interaction.type, selectedValueIdsByDimension };
      }
    }
  }
  throw Object.assign(new Error("persist13_incorrect_response_unavailable"), { stage: "seed", category: "seed_failed" });
}

function areHashedSnapshotsEqualExceptKeys(left: Persist13HashedPhysicalSnapshot, right: Persist13HashedPhysicalSnapshot, ignoredKeys: ReadonlySet<string>): boolean {
  const leftRows = left.filter((entry) => !ignoredKeys.has(entry.key));
  const rightRows = right.filter((entry) => !ignoredKeys.has(entry.key));
  return leftRows.length === rightRows.length && leftRows.every((entry, index) => entry.key === rightRows[index]?.key && entry.sha256 === rightRows[index]?.sha256);
}

function hashJsonForAssertion(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw Object.assign(new Error("persist13_assertion_value_not_serializable"), { stage: "verification", category: "recovery_failed" });
  return sha256Utf8(serialized);
}

function areFixtureTargetsAbsent(manifest: Persist13FixtureManifest): boolean {
  const storage = getKeyValueStorage();
  const keys = new Set(storage.getAllKeys());
  return manifest.targets.every(({ key }) => !keys.has(key));
}

function areFixturePreservedEntriesEqual(manifest: Persist13FixtureManifest): boolean {
  const storage = getKeyValueStorage();
  return manifest.preserved.every(({ key, sha256 }) => {
    const value = storage.getString(key);
    return value !== undefined && sha256Utf8(value) === sha256;
  });
}

async function assertRecoverableManifestAuthority(manifest: Persist13FixtureManifest): Promise<void> {
  const journal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
  const lease = captureActiveProfileStorageLease();
  if (!lease || lease.profile.id !== manifest.fixtureProfileId || lease.profile.kind !== "guest" || lease.profile.accountId !== null) {
    throw Object.assign(new Error("persist13_recovery_profile_mismatch"), { stage: "preflight", category: "manifest_invalid" });
  }
  if (journal) {
    const write = journal.operation === "reset_learning_state" ? journal.writes[0] : null;
    const profile = write?.kind === "clear_learning_state" ? write.targetPlan.profile : null;
    const targets = write?.kind === "clear_learning_state" ? write.targetPlan.targets : [];
    const matches = journal.operation === "reset_learning_state"
      && (journal.status === "journal_durable" || journal.status === "materialized" || journal.status === "verified_pending_clear")
      && journal.journalId === `journal:${journal.commandIdentity.fingerprint}`
      && /^[a-f0-9]{64}$/u.test(journal.planFingerprint)
      && journal.writes.length === 1
      && write?.kind === "clear_learning_state"
      && profile?.id === manifest.fixtureProfileId && profile.kind === "guest" && profile.accountId === null
      && sameFixtureEntries(manifest.targets, targets)
      && sameFixtureEntries(manifest.preserved, write.targetPlan.preserved);
    if (!matches) throw Object.assign(new Error("persist13_recovery_journal_mismatch"), { stage: "preflight", category: "manifest_invalid" });
    return;
  }

  if (manifest.state === "paused" || !areFixtureTargetsAbsent(manifest) || !areFixturePreservedEntriesEqual(manifest)) {
    throw Object.assign(new Error("persist13_recovery_without_journal_invalid"), { stage: "preflight", category: "manifest_invalid" });
  }
}

function sameFixtureEntries(left: Persist13FixtureManifest["targets"], right: Persist13FixtureManifest["targets"]): boolean {
  return left.length === right.length && left.every((entry, index) => entry.key === right[index]?.key && entry.sha256 === right[index]?.sha256);
}


function deleteOwnedFixtureStores(mmkv: typeof import("react-native-mmkv"), manifest: Persist13FixtureManifest): boolean {
  const ids = [manifest.dataStoreId, manifest.controlStoreId];
  if (!ids.every((id) => id === fixtureStoreIds(manifest.runId).dataStoreId || id === fixtureStoreIds(manifest.runId).controlStoreId)) return false;
  for (const id of ids) {
    if (mmkv.existsMMKV(id) && !mmkv.deleteMMKV(id)) return false;
  }
  return ids.every((id) => !mmkv.existsMMKV(id));
}

function stageFromError(error: unknown): FixtureStage {
  const stage = findPersist13FixtureErrorMetadata(error, isFixtureStage, isFixtureErrorCategory).stage;
  if (stage) return stage;
  return "preflight";
}

function categoryFromError(error: unknown): FixtureErrorCategory {
  const category = findPersist13FixtureErrorMetadata(error, isFixtureStage, isFixtureErrorCategory).category;
  if (category) return category;
  return "unknown";
}

function isFixtureStage(value: string): value is FixtureStage { return FIXTURE_STAGES.includes(value as FixtureStage); }
function isFixtureErrorCategory(value: string): value is FixtureErrorCategory { return FIXTURE_ERROR_CATEGORIES.includes(value as FixtureErrorCategory); }

/** Seed-only capability probe: production start commit, isolated raw MMKV, no recovery or reset. */
async function probeStartCutpoint(entry: Extract<Persist13Entry, { kind: "fixture" }>, stores: FixtureStores,
  identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>,
  publish: (receipt: FixtureReceipt) => void): Promise<never> {
  const stage = entry.startStage;
  if (entry.mode !== "seed" || (stage !== "before_start_journal_write" && stage !== "after_start_journal_durable_before_materialization")) throw new Error("persist13_start_stage_invalid");
  const boot = await runProductionBootstrap(identity, "start_cutpoint");
  const lease = captureActiveProfileStorageLease();
  if (boot.kind !== "ready" || boot.activeSessionId !== null || !lease || lease.profile.id !== entry.runId
    || lease.profile.kind !== "guest" || lease.profile.accountId !== null
    || await getActiveMutationJournal(productionLearningDataAdmissionContext) !== null) throw new Error("persist13_start_baseline_invalid");
  const resolved = await contentPackageRuntimeOwner.resolveForPreparation({ trackId: "coding-interview-dsa-problem-solving", familyId: "coding_interview", modeId: "coding-interview-learn-approach" });
  const createdAt = new Date().toISOString();
  const prepared = await resolved.runtime.prepare({ trackId: resolved.track.trackId, modeId: "coding-interview-learn-approach",
    request: { sessionId: `persist13-start-${entry.runId}`, requestedLength: 10 }, attempts: [], reviews: [], now: createdAt });
  await resolved.runtime.validateResume(prepared);
  const session = prepared.session;
  const input = { session, draft: prepared.draft, createdAt };
  const plan = await buildTrainingSessionStartJournal(input);
  const before = capturePhysicalSnapshot(requireBase(stores));
  const baseline = hashPersist13PhysicalSnapshot(before, sha256Utf8);
  const journalKey = persist13FixturePhysicalKey(entry.runId, STORAGE_KEYS.ACTIVE_JOURNAL);
  const receiptKey = "patternly:persist13:start-capability:v1";
  const common = { schema: "patternly:persist13-start-capability.v2", resumeValidated: true, requestedLength: 10, runId: entry.runId, stage, ...fixtureStoreIds(entry.runId),
    profile: lease.profile, leaseGeneration: lease.generation, commandFingerprint: plan.commandIdentity.fingerprint, planFingerprint: plan.planFingerprint,
    baseline, sessionIdSha256: sha256Utf8(session.id), capability: "production_start_commit_raw_mmkv", recoveryRun: false };
  if (!stores.control) throw new Error("persist13_start_control_missing");
  stores.control.set(receiptKey, JSON.stringify({ ...common, phase: "armed" }));
  installPersist13StartPauseHook({ commandFingerprint: plan.commandIdentity.fingerprint, planFingerprint: plan.planFingerprint, lease }, stage, async (actualStage) => {
    const journal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
    const after = capturePhysicalSnapshot(requireBase(stores));
    const beforeMap = new Map(before); const afterMap = new Map(after);
    const delta = [...new Set([...beforeMap.keys(), ...afterMap.keys()])].filter(key => beforeMap.get(key) !== afterMap.get(key)).sort();
    const journalExpected = stage === "after_start_journal_durable_before_materialization";
    if (actualStage !== stage || !isActiveProfileStorageLeaseCurrent(lease)
      || (journalExpected ? !journal || journal.operation !== "start_training_session" || journal.status !== "journal_durable"
        || journal.commandIdentity.fingerprint !== plan.commandIdentity.fingerprint || journal.planFingerprint !== plan.planFingerprint
        || JSON.stringify(journal) !== JSON.stringify(plan) || delta.length !== 1 || delta[0] !== journalKey
        : journal !== null || delta.length !== 0)) throw new Error("persist13_start_cutpoint_mismatch");
    if (await getActiveTrainingSession(productionTrackAdmissionContext) !== null || await getActiveTrainingSessionDraft(productionTrackAdmissionContext) !== null
      || await getActiveForegroundTimer(productionTrackAdmissionContext) !== null) throw new Error("persist13_start_materialization_detected");
    stores.control!.set(receiptKey, JSON.stringify({ ...common, phase: "paused", journalStatus: journal?.status ?? "absent",
      journalSha256: journal ? sha256Utf8(JSON.stringify(journal)) : null, after: hashPersist13PhysicalSnapshot(after, sha256Utf8), changedPhysicalKeys: delta,
      targetsAbsent: true, callbackPending: true }));
    publish({ result: "pending", scenario: "start_cutpoint", stage: "start_cutpoint", journalAbsent: !journal,
      targetsAbsent: true, preservedEqual: true, materializedTargetsVerified: false });
    return new Promise<never>(() => undefined);
  });
  await commitTrainingSessionStart(input);
  throw new Error("persist13_start_pause_not_reached");
}

/** One normal production bootstrap per cold recover process. No new start or data cleanup. */
async function recoverStartCutpoint(entry: Extract<Persist13Entry, { kind: "fixture" }>, stores: FixtureStores,
  identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>, publish: (receipt: FixtureReceipt) => void): Promise<void> {
  const control = stores.control; const stage = entry.startStage;
  if (!control || !stage || entry.mode !== "recover") throw new Error("persist13_start_recovery_authority_invalid");
  const snapshot = () => hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  const { capability, evidence } = assertPersist13StartRecoveryEntry(JSON.parse(control.getString(PERSIST13_START_CAPABILITY_KEY) ?? "null"),
    JSON.parse(control.getString(PERSIST13_START_RECOVERY_KEY) ?? "null"), snapshot(), entry.runId, stage);
  const lease = captureActiveProfileStorageLease();
  if (!lease || lease.profile.id !== entry.runId || lease.profile.kind !== "guest" || lease.profile.accountId !== null || !isActiveProfileStorageLeaseCurrent(lease)) throw new Error("persist13_start_recovery_lease_invalid");
  if (evidence?.phase === "complete") { publish({ result: "observed", scenario: "start_cutpoint", stage: "start_recovery_complete", journalAbsent: true, preservedEqual: true }); return; }
  let record: Persist13StartRecovery;
  if (!evidence) {
    const journal = await getActiveMutationJournal(productionLearningDataAdmissionContext);
    if (stage === "before_start_journal_write" ? journal !== null
      : !journal || journal.operation !== "start_training_session" || journal.status !== "journal_durable"
        || journal.commandIdentity.fingerprint !== capability.commandFingerprint || journal.planFingerprint !== capability.planFingerprint
        || sha256Utf8(JSON.stringify(journal)) !== capability.journalSha256) throw new Error("persist13_start_recovery_journal_mismatch");
    record = { schema: "patternly:persist13-start-recovery.v1", runId: entry.runId, stage, phase: "prepared",
      commandFingerprint: capability.commandFingerprint, planFingerprint: capability.planFingerprint, before: snapshot(),
      expectedAfter: expectedPersist13StartRecoverySnapshot(snapshot(), entry.runId, journal), firstAfter: null, secondAfter: null };
    control.set(PERSIST13_START_RECOVERY_KEY, JSON.stringify(record));
    const verified = JSON.parse(control.getString(PERSIST13_START_RECOVERY_KEY) ?? "null");
    if (!isPersist13StartRecovery(verified, capability) || JSON.stringify(verified) !== JSON.stringify(record)) throw new Error("persist13_start_recovery_prepare_unverified");
  } else {
    record = { ...evidence, phase: "prepared" };
    control.set(PERSIST13_START_RECOVERY_KEY, JSON.stringify(record));
    if (!isPersist13StartRecovery(record, capability) || control.getString(PERSIST13_START_RECOVERY_KEY) !== JSON.stringify(record)) throw new Error("persist13_start_second_prepare_unverified");
  }
  // This exact prepared record is durable before any recovery effect; exceptions do not erase it.
  const boot = await runProductionBootstrap(identity, "start_cutpoint");
  if (boot.kind !== "ready" || !isActiveProfileStorageLeaseCurrent(lease)) throw new Error("persist13_start_recovery_bootstrap_blocked");
  const actual = snapshot();
  if (!areHashedSnapshotsEqual(actual, record.expectedAfter) || await getActiveMutationJournal(productionLearningDataAdmissionContext) !== null
    || hasPersist13PhysicalJournal(capturePhysicalSnapshot(requireBase(stores)), entry.runId)) throw new Error("persist13_start_recovery_after_mismatch");
  const sessions = (await getTrainingSessions(productionTrackAdmissionContext)).value;
  const active = await getActiveTrainingSession(productionTrackAdmissionContext);
  const attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value;
  const reviews = (await getReviewQueueItems(productionTrackAdmissionContext)).value;
  if (attempts.length !== 0 || reviews.length !== 0 || sessions.length !== (stage === "before_start_journal_write" ? 0 : 1)
    || (stage === "before_start_journal_write" ? active !== null || boot.activeSessionId !== null
      : !active || sha256Utf8(active.id) !== capability.sessionIdSha256 || boot.activeSessionId !== active.id)) throw new Error("persist13_start_recovery_semantic_mismatch");
  if (active && await getTrainingSessionResult(active.id, productionTrackAdmissionContext) !== null) throw new Error("persist13_start_recovery_result_unexpected");
  const next: Persist13StartRecovery = record.firstAfter === null ? { ...record, phase: "boot1_complete", firstAfter: actual }
    : { ...record, phase: "complete", secondAfter: actual };
  if (!isPersist13StartRecovery(next, capability)) throw new Error("persist13_start_recovery_not_idempotent");
  control.set(PERSIST13_START_RECOVERY_KEY, JSON.stringify(next));
  if (control.getString(PERSIST13_START_RECOVERY_KEY) !== JSON.stringify(next)) throw new Error("persist13_start_recovery_completion_unverified");
  publish({ result: "observed", scenario: "start_cutpoint", stage: next.phase === "complete" ? "start_recovery_complete" : "start_recovery_first", journalAbsent: true, preservedEqual: true, bootstrapReady: true });
}
