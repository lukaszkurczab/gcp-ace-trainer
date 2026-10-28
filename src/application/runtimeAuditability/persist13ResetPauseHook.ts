import type { ActiveProfileStorageLease, MutationJournalRecord } from "../../storage/repositories/mutationJournalRepository";
export const PERSIST13_RESET_PAUSE_STAGE = "after_materialization_before_phase_write" as const;
export const PERSIST13_VERIFY_CLEAR_PAUSE_STAGE = "after_final_verify_before_journal_clear" as const;
export const PERSIST13_SUBMIT_CLEAR_NEXT_STAGE = "after_journal_clear_before_submit_returns" as const;
export const PERSIST13_ADVANCE_MATERIALIZED_STAGE = "after_advance_materialization_before_phase_write" as const;

type ResetPauseHook = (stage: typeof PERSIST13_RESET_PAUSE_STAGE) => Promise<never>;
type VerifyClearPauseHook = (stage: typeof PERSIST13_VERIFY_CLEAR_PAUSE_STAGE) => Promise<never>;
type SubmitClearNextPauseHook = (stage: typeof PERSIST13_SUBMIT_CLEAR_NEXT_STAGE) => Promise<never>;
type AdvanceMaterializedPauseHook = (stage: typeof PERSIST13_ADVANCE_MATERIALIZED_STAGE) => Promise<never>;
export type Persist13StartStage = "before_start_journal_write" | "after_start_journal_durable_before_materialization";
type StartBinding = Readonly<{ commandFingerprint: string; planFingerprint: string; lease: ActiveProfileStorageLease }>;
let installedStart: Readonly<{ binding: StartBinding; stage: Persist13StartStage; runId: string; hook(stage: Persist13StartStage): Promise<never> }> | null = null;

let installedReset: ResetPauseHook | null = null;
let installedMaterializedJournal: ResetPauseHook | null = null;
let installedVerifyClear: VerifyClearPauseHook | null = null;
let installedSubmitClearNext: SubmitClearNextPauseHook | null = null;
let installedAdvanceMaterialized: AdvanceMaterializedPauseHook | null = null;

function enabledFixtureRuntime(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__
    && process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "smoke"
    && (process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE === "seed" || process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE === "recover")
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID ?? "");
}

function enabledSeedFixture(): boolean {
  return enabledFixtureRuntime() && process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE === "seed";
}

function enabledMaterializedJournalSeed(): boolean {
  return enabledFixtureRuntime()
    && process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE === "seed"
    && process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO === "journal_materialized";
}

function enabledVerifyClearSeed(): boolean {
  return enabledFixtureRuntime()
    && process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE === "seed"
    && process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO === "verify_clear";
}

function enabledSubmitClearNextSeed(): boolean {
  return enabledFixtureRuntime()
    && process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE === "seed"
    && process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO === "submit_clear_next";
}

function enabledAdvanceMaterializedSeed(): boolean {
  return enabledFixtureRuntime()
    && process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE === "seed"
    && process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO === "advance_materialized";
}

/** Test-only one-shot pause authority; installation is impossible in the ordinary app. */
export function installPersist13ResetPauseHook(hook: ResetPauseHook): void {
  if (!enabledSeedFixture()) throw new Error("persist13_fixture_disabled");
  if (installedReset !== null || installedMaterializedJournal !== null || installedVerifyClear !== null || installedSubmitClearNext !== null || installedAdvanceMaterialized !== null || installedStart !== null) throw new Error("persist13_hook_already_installed");
  installedReset = hook;
}

/** Test-only one-shot pause for the exact completed practice response materialization boundary. */
export function installPersist13MaterializedJournalPauseHook(hook: ResetPauseHook): void {
  if (!enabledMaterializedJournalSeed()) throw new Error("persist13_fixture_disabled");
  if (installedReset !== null || installedMaterializedJournal !== null || installedVerifyClear !== null || installedSubmitClearNext !== null || installedAdvanceMaterialized !== null || installedStart !== null) throw new Error("persist13_hook_already_installed");
  installedMaterializedJournal = hook;
}

/** Test-only one-shot pause after all production verification, immediately before journal clear. */
export function installPersist13VerifyClearPauseHook(hook: VerifyClearPauseHook): void {
  if (!enabledVerifyClearSeed()) throw new Error("persist13_fixture_disabled");
  if (installedReset !== null || installedMaterializedJournal !== null || installedVerifyClear !== null || installedSubmitClearNext !== null || installedAdvanceMaterialized !== null || installedStart !== null) throw new Error("persist13_hook_already_installed");
  installedVerifyClear = hook;
}

/** Test-only one-shot pause after the real submit journal was cleared and before submit returns. */
export function installPersist13SubmitClearNextPauseHook(hook: SubmitClearNextPauseHook): void {
  if (!enabledSubmitClearNextSeed()) throw new Error("persist13_fixture_disabled");
  if (installedReset !== null || installedMaterializedJournal !== null || installedVerifyClear !== null || installedSubmitClearNext !== null || installedAdvanceMaterialized !== null || installedStart !== null) throw new Error("persist13_hook_already_installed");
  installedSubmitClearNext = hook;
}

/** Test-only one-shot pause for the exact public practice-advance materialization boundary. */
export function installPersist13AdvanceMaterializedPauseHook(hook: AdvanceMaterializedPauseHook): void {
  if (!enabledAdvanceMaterializedSeed()) throw new Error("persist13_fixture_disabled");
  if (installedReset !== null || installedMaterializedJournal !== null || installedVerifyClear !== null || installedSubmitClearNext !== null || installedAdvanceMaterialized !== null || installedStart !== null) throw new Error("persist13_hook_already_installed");
  installedAdvanceMaterialized = hook;
}

/** Read-only startup assertion for a fixture-only pause hook. */
export function isPersist13ResetPauseHookCold(): boolean {
  return enabledFixtureRuntime() && installedReset === null && installedMaterializedJournal === null && installedVerifyClear === null && installedSubmitClearNext === null && installedAdvanceMaterialized === null && installedStart === null;
}

/** Synchronous no-op unless the exact submit fixture has installed its one-shot boundary. */
export function pausePersist13AfterJournalClear(operation: string): Promise<never> | undefined {
  if (operation !== "submit_training_outcome" || installedSubmitClearNext === null) return undefined;
  if (!enabledSubmitClearNextSeed()) throw new Error("persist13_fixture_disabled");
  const hook = installedSubmitClearNext;
  installedSubmitClearNext = null;
  return hook(PERSIST13_SUBMIT_CLEAR_NEXT_STAGE);
}

/** Synchronous no-op in ordinary execution; only the installed fixture hook creates an async pause. */
export function pausePersist13BeforeJournalClear(operation: string): Promise<never> | undefined {
  if (operation !== "submit_training_outcome" || installedVerifyClear === null) return undefined;
  if (!enabledVerifyClearSeed()) throw new Error("persist13_fixture_disabled");
  const hook = installedVerifyClear;
  installedVerifyClear = null;
  return hook(PERSIST13_VERIFY_CLEAR_PAUSE_STAGE);
}

/** Called after fixture-authorized materialization and before its journal phase write. */
export async function pausePersist13ResetAfterMaterialization(operation: string): Promise<void> {
  if (operation === "reset_learning_state" && installedReset) {
    if (!enabledSeedFixture()) throw new Error("persist13_fixture_disabled");
    const hook = installedReset;
    installedReset = null;
    await hook(PERSIST13_RESET_PAUSE_STAGE);
    return;
  }
  if (operation === "submit_training_outcome" && installedMaterializedJournal) {
    if (!enabledMaterializedJournalSeed()) throw new Error("persist13_fixture_disabled");
    const hook = installedMaterializedJournal;
    installedMaterializedJournal = null;
    await hook(PERSIST13_RESET_PAUSE_STAGE);
  }
  if (operation === "advance_training_session" && installedAdvanceMaterialized) {
    if (!enabledAdvanceMaterializedSeed()) throw new Error("persist13_fixture_disabled");
    const hook = installedAdvanceMaterialized;
    installedAdvanceMaterialized = null;
    await hook(PERSIST13_ADVANCE_MATERIALIZED_STAGE);
  }
}

/** Exact fixture-owned start authority; fingerprints/lease never leave this module. */
export function installPersist13StartPauseHook(binding: StartBinding, stage: Persist13StartStage, hook: (stage: Persist13StartStage) => Promise<never>): void {
  const runId = process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID ?? "";
  if (!enabledSeedFixture() || process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO !== "start_cutpoint"
    || process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_START_STAGE !== stage
    || (stage !== "before_start_journal_write" && stage !== "after_start_journal_durable_before_materialization")
    || binding.lease.profile.id !== runId || binding.lease.profile.kind !== "guest" || binding.lease.profile.accountId !== null
    || !/^[a-f0-9]{64}$/u.test(binding.commandFingerprint) || !/^[a-f0-9]{64}$/u.test(binding.planFingerprint)) throw new Error("persist13_start_authority_invalid");
  if (installedStart || installedReset || installedMaterializedJournal || installedVerifyClear || installedSubmitClearNext || installedAdvanceMaterialized) throw new Error("persist13_hook_already_installed");
  installedStart = Object.freeze({ binding: Object.freeze({ ...binding, lease: Object.freeze({ ...binding.lease, profile: Object.freeze({ ...binding.lease.profile }) }) }), stage, runId, hook });
}

/** Synchronous undefined in normal execution; only exact installed authority adds an await. */
export function pausePersist13Start(record: MutationJournalRecord, lease: ActiveProfileStorageLease | null, stage: Persist13StartStage, leaseCurrent: () => boolean): Promise<never> | undefined {
  const authority = installedStart;
  if (!authority || record.operation !== "start_training_session" || stage !== authority.stage
    || record.commandIdentity.fingerprint !== authority.binding.commandFingerprint || record.planFingerprint !== authority.binding.planFingerprint) return undefined;
  const expected = authority.binding.lease;
  if (!lease || lease.generation !== expected.generation || lease.profile.id !== expected.profile.id
    || lease.profile.kind !== expected.profile.kind || lease.profile.accountId !== expected.profile.accountId) return undefined;
  if (!enabledSeedFixture() || process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO !== "start_cutpoint"
    || process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID !== authority.runId
    || process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_START_STAGE !== stage || !leaseCurrent()) throw new Error("persist13_start_authority_changed");
  installedStart = null;
  return authority.hook(stage);
}
