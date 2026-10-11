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
import { getActiveMutationJournal, provisionGuestInstallation } from "../../storage/repositories";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { installPersist13ResetPauseHook, isPersist13ResetPauseHookCold, PERSIST13_RESET_PAUSE_STAGE } from "./persist13ResetPauseHook";
import { arePersist13PhysicalSnapshotsEqual, createPersist13Manifest, fixtureInstallationId, fixtureModeAllowsManifest, fixtureStoreIds, isPersist13Manifest, PERSIST13_FIXTURE_CACHE_PREFIXES, PERSIST13_FIXTURE_MANIFEST_KEY, withPersist13ManifestState, type Persist13FixtureManifest } from "./persist13ResetFixtureProtocol";
import { seedPersist13ResetFixtureState } from "./persist13ResetFixtureSeed";
import type { Persist13Entry } from "./persist13Entry";

type FixtureStage = "preflight" | "cache_preflight" | "native_store_open" | "router_prepare" | "bootstrap" | "seed" | "reset_pause" | "recovery" | "verification" | "cleanup" | "complete";
type FixtureErrorCategory = "runtime_disabled" | "cold_owner_not_cold" | "store_collision" | "manifest_invalid" | "cache_collision" | "cache_unavailable" | "storage_unavailable" | "bootstrap_blocked" | "seed_failed" | "reset_failed" | "recovery_failed" | "preservation_failed" | "native_store_cleanup_failed" | "unknown";
type FixtureReceipt = Readonly<{ result: "pending" | "observed" | "failed"; stage: FixtureStage; errorCategory?: FixtureErrorCategory; targetCount?: number; preservedCount?: number; bootstrapReady?: boolean; journalAbsent?: boolean; targetsAbsent?: boolean; preservedEqual?: boolean; cleanupVerified?: boolean }>;

const FIXTURE_STAGES: readonly FixtureStage[] = Object.freeze(["preflight", "cache_preflight", "native_store_open", "router_prepare", "bootstrap", "seed", "reset_pause", "recovery", "verification", "cleanup", "complete"]);
const FIXTURE_ERROR_CATEGORIES: readonly FixtureErrorCategory[] = Object.freeze(["runtime_disabled", "cold_owner_not_cold", "store_collision", "manifest_invalid", "cache_collision", "cache_unavailable", "storage_unavailable", "bootstrap_blocked", "seed_failed", "reset_failed", "recovery_failed", "preservation_failed", "native_store_cleanup_failed", "unknown"]);

type NativeMMKV = ReturnType<typeof import("react-native-mmkv").createMMKV>;
type FixtureStores = { base: KeyValueStorage | null; router: ProfileStorageRouter | null; control: NativeMMKV | null; mmkv: typeof import("react-native-mmkv"); manifest: Persist13FixtureManifest };

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
      <Text style={textStyle} testID="persist13-fixture-result">PERSIST-13 {entry.kind === "fixture" ? entry.mode : "configuration"}: {receipt.result}</Text>
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
    const base = asKeyValueStorage(data);
    const manifest = withPersist13ManifestState(initial, "allocated");
    control.set(PERSIST13_FIXTURE_MANIFEST_KEY, JSON.stringify(manifest));
    const router = await openFixtureRouter(entry, base, control);
    return { base, router, control, mmkv, manifest };
  }
  if (!hasData || !hasControl) throw Object.assign(new Error("persist13_store_missing"), { stage: "native_store_open", category: "manifest_invalid" });
  const control = createFixtureStore(mmkv, ids.controlStoreId);
  const controlKeys = control.getAllKeys();
  if (!controlKeys.includes(PERSIST13_FIXTURE_MANIFEST_KEY)) throw Object.assign(new Error("persist13_manifest_namespace_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
  let parsed: unknown;
  try { parsed = JSON.parse(control.getString(PERSIST13_FIXTURE_MANIFEST_KEY) ?? "null"); }
  catch { throw Object.assign(new Error("persist13_manifest_invalid"), { stage: "native_store_open", category: "manifest_invalid" }); }
  if (!isPersist13Manifest(parsed, entry.runId) || !fixtureModeAllowsManifest(entry.mode, parsed.state)) throw Object.assign(new Error("persist13_manifest_invalid"), { stage: "native_store_open", category: "manifest_invalid" });
  const data = createFixtureStore(mmkv, ids.dataStoreId);
  const base = asKeyValueStorage(data);
  const router = await openFixtureRouter(entry, base, control);
  return { base, router, control, mmkv, manifest: parsed };
}

function asKeyValueStorage(instance: NativeMMKV): KeyValueStorage {
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

async function runProductionBootstrap(identity: Readonly<{ create(): Promise<Readonly<{ installationId: string; localDatasetId: string }>> }>) {
  return bootstrapApplication(
    () => contentPackageRuntimeOwner.verifyBundledPackages(),
    async () => { throw new Error("persist13_unexpected_active_session"); },
    async () => { composeTrainingLifecycleUseCases({ packages: contentPackageRuntimeOwner }); },
    { repositories: { guestInstallationIdentity: identity } },
  );
}

function capturePhysicalSnapshot(storage: KeyValueStorage): ReadonlyArray<readonly [string, string | undefined]> {
  return Object.freeze([...storage.getAllKeys()].sort().map((key) => Object.freeze([key, storage.getString(key)] as const)));
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
