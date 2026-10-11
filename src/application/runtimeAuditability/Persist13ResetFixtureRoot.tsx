import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { bootstrapApplication } from "../bootstrap/applicationBootstrap";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { openProfileStorageRouter, type ProfileStorageRouter } from "../../infrastructure/storage/profileStorageRouter";
import { activatePreparedProfile, captureActiveProfileStorageLease, getKeyValueStorage, isPersist13StorageOwnerCold, prepareProfileStorage, setProfileStoragePreparationFactoryForTests, closeActiveProfileStorage, type KeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { isPersist13LifecycleOwnerCold } from "../trainingLifecycle/applicationLifecycle";
import { isPersist13TimerOwnerCold } from "../trainingLifecycle/ForegroundSessionTimerFacade";
import { isPersist13ResetBarrierCold } from "../learningMutations/commitLearningStateReset";
import { clearPatternlyLocalHistory } from "../../features/home/localReset";
import { getActiveMutationJournal, getActiveTrainingSession, getActiveTrainingSessionDraft, getReviewQueueItems, getTrainingAttempts, getTrainingSessionResult, getTrainingSessions, provisionGuestInstallation, saveTrainingSessionDraft } from "../../storage/repositories";
import { STORAGE_KEYS } from "../../storage/keys";
import { TrainingApplicationFailure } from "../trainingLifecycle/contracts";
import { MutationCommitFailure } from "../mutationBoundary";
import { getForegroundSessionTimerFacade } from "../trainingLifecycle/ForegroundSessionTimerFacade";
import { getTrainingLifecycleUseCases } from "../trainingLifecycle/applicationLifecycle";
import { createTrainingSessionDraft } from "../../domain";
import { CanonicalWriteOutcomeError } from "../../storage/errors";
import { reconcileTrainingSessionDraftWrite } from "../../storage/repositories/trainingSessionDraftRepository";
import type { CanonicalWriteAttempt } from "../../storage/repositories/canonicalRecordCodec";
import type { JournalWrite, MutationJournalRecord } from "../../storage/repositories/mutationJournalRepository";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { installPersist13ResetPauseHook, isPersist13ResetPauseHookCold, PERSIST13_RESET_PAUSE_STAGE } from "./persist13ResetPauseHook";
import { areHashedSnapshotsEqual, arePersist13PhysicalSnapshotsEqual, createPersist13Manifest, fixtureInstallationId, fixtureModeAllowsManifest, fixtureStoreIds, hashPersist13PhysicalSnapshot, isPersist13ControlNamespace, isPersist13Manifest, isPersist13ScenarioSidecar, PERSIST13_FIXTURE_CACHE_PREFIXES, PERSIST13_FIXTURE_MANIFEST_KEY, PERSIST13_SCENARIO_SIDECAR_KEY, persist13FixturePhysicalKey, withPersist13ManifestState, type Persist13FixtureManifest, type Persist13ScenarioSidecar } from "./persist13ResetFixtureProtocol";
import { seedPersist13ResetFixtureState } from "./persist13ResetFixtureSeed";
import type { Persist13Entry } from "./persist13Entry";

type FixtureStage = "preflight" | "cache_preflight" | "native_store_open" | "router_prepare" | "bootstrap" | "seed" | "reset_pause" | "journal_unknown" | "draft_unknown" | "recovery" | "verification" | "complete" | "cleanup";
type FixtureErrorCategory = "runtime_disabled" | "cold_owner_not_cold" | "store_collision" | "manifest_invalid" | "cache_collision" | "cache_unavailable" | "storage_unavailable" | "bootstrap_blocked" | "seed_failed" | "reset_failed" | "fault_injection_failed" | "recovery_failed" | "preservation_failed" | "native_store_cleanup_failed" | "unknown";
type FixtureReceipt = Readonly<{ result: "pending" | "observed" | "failed"; stage: FixtureStage; errorCategory?: FixtureErrorCategory; scenario?: string; targetCount?: number; preservedCount?: number; bootstrapReady?: boolean; journalAbsent?: boolean; targetsAbsent?: boolean; preservedEqual?: boolean; cleanupVerified?: boolean }>;

const FIXTURE_STAGES: readonly FixtureStage[] = Object.freeze(["preflight", "cache_preflight", "native_store_open", "router_prepare", "bootstrap", "seed", "reset_pause", "journal_unknown", "draft_unknown", "recovery", "verification", "complete", "cleanup"]);
const FIXTURE_ERROR_CATEGORIES: readonly FixtureErrorCategory[] = Object.freeze(["runtime_disabled", "cold_owner_not_cold", "store_collision", "manifest_invalid", "cache_collision", "cache_unavailable", "storage_unavailable", "bootstrap_blocked", "seed_failed", "reset_failed", "fault_injection_failed", "recovery_failed", "preservation_failed", "native_store_cleanup_failed", "unknown"]);

type NativeMMKV = ReturnType<typeof import("react-native-mmkv").createMMKV>;
type FixtureFault = Readonly<{ arm(key: string): void; didWrite(): boolean; didDenyRead(): boolean; snapshotForAssertion(): ReturnType<typeof capturePhysicalSnapshot> }>;
type FixtureStores = { base: KeyValueStorage | null; router: ProfileStorageRouter | null; control: NativeMMKV | null; mmkv: typeof import("react-native-mmkv"); manifest: Persist13FixtureManifest; fault: FixtureFault | null };

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export default function Persist13ResetFixtureRoot({ entry }: Readonly<{ entry: Persist13Entry }>) {
  const [receipt, setReceipt] = useState<FixtureReceipt>({ result: "pending", stage: "preflight" });
  const textStyle = { color: "#F6F8FB" } as const;
  useEffect(() => {
    let live = true;
    void runPersist13Fixture(entry, (next) => { if (live) setReceipt(next); })
      .catch((error: unknown) => { if (live) setReceipt({ result: "failed", stage: stageFromError(error), errorCategory: categoryFromError(error) }); });
    return () => { live = false; };
  }, [entry]);
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
      {receipt.preservedEqual !== undefined ? <Text style={textStyle} testID="persist13-fixture-preserved-equal">Preserved equal: {String(receipt.preservedEqual)}</Text> : null}
      {receipt.cleanupVerified !== undefined ? <Text style={textStyle} testID="persist13-fixture-cleanup">Fixture cleanup: {String(receipt.cleanupVerified)}</Text> : null}
    </View>
  );
}

async function runPersist13Fixture(entry: Persist13Entry, publish: (receipt: FixtureReceipt) => void): Promise<void> {
  if (entry.kind !== "fixture") throw Object.assign(new Error("persist13_fixture_configuration_invalid"), { stage: "preflight", category: "manifest_invalid" });
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
      return { base: stores.base, router: stores.router };
    });
    const profile = await prepareProfileStorage();
    if (profile.id !== manifest.fixtureProfileId || profile.kind !== "guest" || profile.accountId !== null) throw Object.assign(new Error("persist13_profile_identity_mismatch"), { stage: "router_prepare", category: "storage_unavailable" });
    activatePreparedProfile(profile.id, profile.kind);
    const account = await provisionGuestInstallation(identity);
    if (account.installationId !== fixtureInstallationId(entry.runId) || account.localDatasetId !== entry.runId || account.bindingState !== "guest") throw Object.assign(new Error("persist13_guest_identity_mismatch"), { stage: "router_prepare", category: "storage_unavailable" });

    if (entry.scenario !== "reset") {
      const scenarioEntry = { kind: "fixture" as const, mode: entry.mode, scenario: entry.scenario, runId: entry.runId };
      if (entry.mode === "seed") await seedJournalOrDraftScenario(scenarioEntry, stores, identity, publish);
      else await recoverJournalOrDraftScenario(scenarioEntry, stores, identity, publish);
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
        const journal = await getActiveMutationJournal();
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
      await clearPatternlyLocalHistory();
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
    const journalAbsent = await getActiveMutationJournal() === null;
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
  if (entry.scenario !== "reset" && entry.mode === "recover") {
    const scenarioEntry = { kind: "fixture" as const, mode: entry.mode, scenario: entry.scenario, runId: entry.runId };
    readScenarioSidecar(control, scenarioEntry);
  }
  const data = createFixtureStore(mmkv, ids.dataStoreId);
  const faulting = createFaultingStorage(data);
  const base = faulting.storage;
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
  entry: Extract<Persist13Entry, { kind: "fixture" }> & Readonly<{ scenario: "journal" | "draft" }>,
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
  let baselineSessionIndex: number;
  let expectedDraftRevision: number | undefined;
  let expectedDraftPayloadSha256: string | undefined;
  let expectedDraftEnvelopeSha256: string | undefined;
  let occurrenceIdSha256: string | undefined;
  let responseSha256: string | undefined;
  let expectedAttemptSha256: string | undefined;
  let expectedSessionSha256: string | undefined;
  let expectedReviewSha256: readonly string[] | undefined;
  if (entry.scenario === "journal") {
    publish({ result: "pending", scenario: entry.scenario, stage: "seed" });
    await seedPersist13ResetFixtureState(entry.runId, { includeActiveSession: false });
    const lifecycle = getTrainingLifecycleUseCases();
    const prepared = await lifecycle.startSession({ trackId: "coding-interview-dsa-problem-solving", modeId: "coding-interview-learn-approach", source: "persist13-journal-fixture", request: { requestedLength: 10 } });
    if (prepared.session.status !== "active" || prepared.session.actualLength < 2) throw Object.assign(new Error("persist13_free_practice_fixture_unavailable"), { stage: "seed", category: "seed_failed" });
    await getForegroundSessionTimerFacade().initialize(prepared.session);
    const firstOccurrence = prepared.session.itemOrder[0];
    if (!firstOccurrence) throw Object.assign(new Error("persist13_free_practice_occurrence_missing"), { stage: "seed", category: "seed_failed" });
    const question = await contentPackageRuntimeOwner.resolveItem(firstOccurrence.item);
    const before = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
    if (await getActiveMutationJournal() !== null) throw Object.assign(new Error("persist13_unexpected_pending_journal"), { stage: "seed", category: "seed_failed" });
    const attempts = await getTrainingAttempts();
    sessionId = prepared.session.id;
    baselineAttemptCount = attempts.value.length;
    baselineSessionIndex = prepared.session.currentItemIndex;
    occurrenceIdSha256 = sha256Utf8(firstOccurrence.occurrenceId);
    responseSha256 = hashJsonForAssertion(question.answer);
    faultLogicalKey = STORAGE_KEYS.ACTIVE_JOURNAL;
    const faultPhysicalKey = persist13FixturePhysicalKey(entry.runId, faultLogicalKey);
    requireFault(stores).arm(faultPhysicalKey);
    let attemptedJournal: MutationJournalRecord | null = null;
    try { await lifecycle.submitPracticeResponse(question.answer); }
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
    const active = await getActiveTrainingSession();
    const draft = await getActiveTrainingSessionDraft();
    if (!active || !draft || active.configurationSnapshot.submission !== "manualOrForegroundTimeout" || !active.itemOrder[0]) {
      throw Object.assign(new Error("persist13_registered_draft_fixture_unavailable"), { stage: "seed", category: "seed_failed" });
    }
    const question = await contentPackageRuntimeOwner.resolveItem(active.itemOrder[0].item);
    const occurrenceId = active.itemOrder[0].occurrenceId;
    const baseline = createTrainingSessionDraft({ ...draft, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: new Date().toISOString() });
    const savedBaseline = await saveTrainingSessionDraft(baseline, draft.revision);
    const before = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
    if (await getActiveMutationJournal() !== null) throw Object.assign(new Error("persist13_unexpected_pending_journal"), { stage: "seed", category: "seed_failed" });
    const attempts = await getTrainingAttempts();
    sessionId = active.id;
    baselineAttemptCount = attempts.value.length;
    baselineSessionIndex = active.currentItemIndex;
    faultLogicalKey = STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT;
    const faultPhysicalKey = persist13FixturePhysicalKey(entry.runId, faultLogicalKey);
    const attempted = createTrainingSessionDraft({ ...savedBaseline, revision: savedBaseline.revision + 1, responsesByOccurrenceId: { [occurrenceId]: question.answer }, flaggedOccurrenceIds: [occurrenceId], updatedAt: new Date().toISOString() });
    expectedDraftPayloadSha256 = hashJsonForAssertion(createTrainingSessionDraft(attempted));
    requireFault(stores).arm(faultPhysicalKey);
    let attemptedReceipt: CanonicalWriteAttempt<typeof attempted> | null = null;
    try { await saveTrainingSessionDraft(attempted, savedBaseline.revision); }
    catch (error) {
      if (error instanceof CanonicalWriteOutcomeError && error.outcome.kind === "unknown" && error.attempt && typeof error.attempt === "object") {
        attemptedReceipt = error.attempt as CanonicalWriteAttempt<typeof attempted>;
      }
    }
    const fault = requireFault(stores);
    if (!fault.didWrite() || !fault.didDenyRead() || !attemptedReceipt) throw Object.assign(new Error("persist13_draft_fault_not_observed"), { stage: "seed", category: "fault_injection_failed" });
    expectedDraftEnvelopeSha256 = sha256Utf8(attemptedReceipt.afterRaw);
    if (hashJsonForAssertion(attemptedReceipt.envelope.payload) !== expectedDraftPayloadSha256) throw Object.assign(new Error("persist13_draft_expected_payload_mismatch"), { stage: "seed", category: "fault_injection_failed" });
    if (await reconcileTrainingSessionDraftWrite(attemptedReceipt) !== "unknown") throw Object.assign(new Error("persist13_draft_reconcile_was_not_unknown"), { stage: "seed", category: "fault_injection_failed" });
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
  entry: Extract<Persist13Entry, { kind: "fixture" }> & Readonly<{ scenario: "journal" | "draft" }>,
  stores: FixtureStores,
  identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>,
  publish: (receipt: FixtureReceipt) => void,
): Promise<void> {
  const sidecar = readScenarioSidecar(stores.control!, entry);
  const beforeRecovery = hashPersist13PhysicalSnapshot(capturePhysicalSnapshot(requireBase(stores)), sha256Utf8);
  if (!areHashedSnapshotsEqual(sidecar.after, beforeRecovery)) throw Object.assign(new Error("persist13_faulted_snapshot_changed_before_recovery"), { stage: "preflight", category: "manifest_invalid" });
  const targetRaw = requireBase(stores).getString(sidecar.faultPhysicalKey);
  const faultedExpectedTarget = sidecar.after.find((row) => row.key === sidecar.faultPhysicalKey);
  if (targetRaw === undefined || !faultedExpectedTarget || sha256Utf8(targetRaw) !== faultedExpectedTarget.sha256
    || (entry.scenario === "draft" && sha256Utf8(targetRaw) !== sidecar.expectedDraftEnvelopeSha256)) {
    throw Object.assign(new Error("persist13_faulted_target_mismatch"), { stage: "preflight", category: "manifest_invalid" });
  }
  if (entry.scenario === "journal") {
    const journal = await getActiveMutationJournal();
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
    const journalAbsent = await getActiveMutationJournal() === null;
    if (!journalAbsent) throw Object.assign(new Error("persist13_scenario_journal_remains"), { stage: "verification", category: "recovery_failed" });
    const physicalTarget = requireBase(stores).getString(sidecar.faultPhysicalKey);
    if (first.kind !== "ready" || second.kind !== "ready" || !first.activeSessionId || first.activeSessionId !== second.activeSessionId) {
      throw Object.assign(new Error("persist13_journal_bootstrap_not_resumed"), { stage: "verification", category: "bootstrap_blocked" });
    }
    const attempts = await getTrainingAttempts();
    const sessions = await getTrainingSessions();
    const reviews = await getReviewQueueItems();
    const resumed = await getActiveTrainingSession();
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
      || await getTrainingSessionResult(resumed.id) !== null || physicalTarget !== undefined) {
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
    if (await getActiveMutationJournal() !== null) throw Object.assign(new Error("persist13_draft_has_pending_journal"), { stage: "preflight", category: "manifest_invalid" });
    const draft = await getActiveTrainingSessionDraft();
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
  const journalAbsent = await getActiveMutationJournal() === null;
  if (!journalAbsent) throw Object.assign(new Error("persist13_scenario_journal_remains"), { stage: "verification", category: "recovery_failed" });
  const physicalTarget = requireBase(stores).getString(sidecar.faultPhysicalKey);
  if (first.kind !== "home_ready_resume_unavailable" || second.kind !== "home_ready_resume_unavailable"
    || !["premium_entitlement_denied", "premium_entitlement_unavailable"].includes(first.reason)
    || !["premium_entitlement_denied", "premium_entitlement_unavailable"].includes(second.reason)) {
    throw Object.assign(new Error("persist13_draft_bootstrap_unavailable_outcome_missing"), { stage: "verification", category: "bootstrap_blocked" });
  }
  const draft = await getActiveTrainingSessionDraft();
  const active = await getActiveTrainingSession();
  const attempts = await getTrainingAttempts();
  const sessions = await getTrainingSessions();
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
  if (!stores.control || !isPersist13ScenarioSidecar(sidecar, sidecar.runId, sidecar.scenario)) throw Object.assign(new Error("persist13_scenario_sidecar_invalid"), { stage: "seed", category: "manifest_invalid" });
  stores.control.set(PERSIST13_SCENARIO_SIDECAR_KEY, JSON.stringify(sidecar));
}

function readScenarioSidecar(control: NativeMMKV, entry: Extract<Persist13Entry, { kind: "fixture" }> & Readonly<{ scenario: "journal" | "draft" }>): Persist13ScenarioSidecar {
  let parsed: unknown;
  try { parsed = JSON.parse(control.getString(PERSIST13_SCENARIO_SIDECAR_KEY) ?? "null"); }
  catch { throw Object.assign(new Error("persist13_scenario_sidecar_invalid"), { stage: "native_store_open", category: "manifest_invalid" }); }
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

async function runProductionBootstrap(identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>, scenario: "reset" | "journal" | "draft" = "reset") {
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

function areHashedSnapshotsEqualExceptKeys(left: Persist13ScenarioSidecar["before"], right: Persist13ScenarioSidecar["after"], ignoredKeys: ReadonlySet<string>): boolean {
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
  const journal = await getActiveMutationJournal();
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
  if (typeof error === "object" && error !== null && "stage" in error && typeof error.stage === "string" && isFixtureStage(error.stage)) return error.stage;
  return "preflight";
}

function categoryFromError(error: unknown): FixtureErrorCategory {
  if (typeof error === "object" && error !== null && "category" in error && typeof error.category === "string" && isFixtureErrorCategory(error.category)) return error.category;
  return "unknown";
}

function isFixtureStage(value: string): value is FixtureStage { return FIXTURE_STAGES.includes(value as FixtureStage); }
function isFixtureErrorCategory(value: string): value is FixtureErrorCategory { return FIXTURE_ERROR_CATEGORIES.includes(value as FixtureErrorCategory); }
