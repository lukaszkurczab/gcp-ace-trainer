import { CanonicalEvidenceIntegrityError } from "../errors";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../keys";
import { captureActiveProfileStorageLease, isActiveProfileStorageLeaseCurrent, type ActiveProfileStorageLease } from "../../infrastructure/storage/mmkvClient";
import type { StorageProfile } from "../../infrastructure/storage/profileStorageRouter";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { assertContentIdentityRecordIntegrity } from "./contentIdentityUnavailableRepository";
import { readCanonicalNamespaceEntries, removeCanonicalValue } from "./canonicalRecordCodec";
import { assertTrainingEvidenceIntegrity } from "./trainingEvidenceIntegrityRepository";
import { readActiveTrainingSession, readTrainingSessions } from "./trainingSessionRepository";
import { readActiveTrainingSessionDraft } from "./trainingSessionDraftRepository";
import { readActiveForegroundTimer } from "./foregroundTimerRepository";
import { canPersistTrainingSessionDraft } from "../../domain";

export type LearningStateResetEntry = Readonly<{ key: string; sha256: string }>;
export type LearningStateResetTargetPlan = Readonly<{
  schema: "patternly:learning-state-reset-targets.v1";
  profile: Readonly<{ id: string; kind: StorageProfile["kind"]; accountId: string | null }>;
  targets: readonly LearningStateResetEntry[];
  preserved: readonly LearningStateResetEntry[];
}>;

const TARGET_STATIC_KEYS = new Set<string>([
  STORAGE_KEYS.ACTIVE_TRAINING_SESSION,
  STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT,
  STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER,
  STORAGE_KEYS.TRAINING_SESSION_INDEX,
  STORAGE_KEYS.TRAINING_ATTEMPT_INDEX,
  STORAGE_KEYS.REVIEW_INDEX,
  STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX,
  STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX,
  STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX,
]);
const TARGET_RECORD_PREFIXES = Object.freeze([
  `${STORAGE_NAMESPACE}training-session:`,
  `${STORAGE_NAMESPACE}training-session-result:`,
  `${STORAGE_NAMESPACE}training-attempt:`,
  `${STORAGE_NAMESPACE}review-entry:`,
  `${STORAGE_NAMESPACE}archival-history:`,
  `${STORAGE_NAMESPACE}unavailable-active:`,
  `${STORAGE_NAMESPACE}unavailable-review:`,
]);
const SHA_256 = /^[a-f0-9]{64}$/;

function fail(): never { throw new CanonicalEvidenceIntegrityError(); }
function targetKey(key: string): boolean {
  if (TARGET_STATIC_KEYS.has(key)) return true;
  const prefix = TARGET_RECORD_PREFIXES.find((candidate) => key.startsWith(candidate));
  return Boolean(prefix && key.slice(prefix.length).trim().length > 0);
}
function entryFor(key: string, rawValue: string): LearningStateResetEntry {
  return Object.freeze({ key, sha256: sha256Utf8(rawValue) });
}
function sortedEntries(entries: readonly LearningStateResetEntry[]): readonly LearningStateResetEntry[] {
  return Object.freeze([...entries].sort((left, right) => left.key.localeCompare(right.key)));
}
function profileTuple(profile: StorageProfile): LearningStateResetTargetPlan["profile"] {
  return Object.freeze({ id: profile.id, kind: profile.kind, accountId: profile.accountId });
}
function currentLeaseFor(plan: LearningStateResetTargetPlan): ActiveProfileStorageLease {
  const lease = captureActiveProfileStorageLease();
  if (!lease || !isActiveProfileStorageLeaseCurrent(lease)
    || lease.profile.id !== plan.profile.id || lease.profile.kind !== plan.profile.kind
    || lease.profile.accountId !== plan.profile.accountId) fail();
  return lease;
}
function currentEntries() {
  return readCanonicalNamespaceEntries();
}
function assertLearningStateResetInputIntegrity(): void {
  assertTrainingEvidenceIntegrity();
  assertContentIdentityRecordIntegrity();
  const sessions = readTrainingSessions().value;
  const activeRecords = sessions.filter((session) => session.status === "active");
  const active = readActiveTrainingSession();
  if ((!active && activeRecords.length > 0)
    || (active && (activeRecords.length !== 1 || activeRecords[0]?.id !== active.id))) fail();
  const draft = readActiveTrainingSessionDraft();
  if (draft && (!active || draft.sessionId !== active.id || draft.trackId !== active.trackId)) fail();
  if (active && canPersistTrainingSessionDraft(active) && !draft) fail();
  const timer = readActiveForegroundTimer();
  if (timer && (!active || timer.sessionId !== active.id || timer.trackId !== active.trackId)) fail();
}
function hashesMatch(actual: readonly LearningStateResetEntry[], expected: readonly LearningStateResetEntry[]): boolean {
  return actual.length === expected.length && actual.every((entry, index) => entry.key === expected[index]?.key && entry.sha256 === expected[index]?.sha256);
}
function currentTargetEntries(entries: ReturnType<typeof currentEntries>): readonly LearningStateResetEntry[] {
  const candidates = entries.filter((entry) => TARGET_STATIC_KEYS.has(entry.key) || TARGET_RECORD_PREFIXES.some((prefix) => entry.key.startsWith(prefix)));
  if (candidates.some((entry) => !targetKey(entry.key))) fail();
  return sortedEntries(candidates.map((entry) => entryFor(entry.key, entry.rawValue)));
}
function currentPreservedEntries(entries: ReturnType<typeof currentEntries>): readonly LearningStateResetEntry[] {
  return sortedEntries(entries.filter((entry) => !targetKey(entry.key) && entry.key !== STORAGE_KEYS.ACTIVE_JOURNAL)
    .map((entry) => entryFor(entry.key, entry.rawValue)));
}

export function isLearningStateResetTargetPlan(value: unknown): value is LearningStateResetTargetPlan {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const plan = value as Record<string, unknown>;
  if (Object.keys(plan).length !== 4 || plan.schema !== "patternly:learning-state-reset-targets.v1"
    || typeof plan.profile !== "object" || plan.profile === null || Array.isArray(plan.profile)
    || !Array.isArray(plan.targets) || !Array.isArray(plan.preserved)) return false;
  const profile = plan.profile as Record<string, unknown>;
  if (Object.keys(profile).length !== 3 || typeof profile.id !== "string" || !profile.id.trim()
    || !["account", "guest"].includes(profile.kind as string)
    || !(profile.accountId === null || (typeof profile.accountId === "string" && profile.accountId.trim()))) return false;
  const validEntries = (entries: unknown[]): entries is LearningStateResetEntry[] => entries.every((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return false;
    const item = entry as Record<string, unknown>;
    return Object.keys(item).length === 2 && typeof item.key === "string" && item.key.startsWith(STORAGE_NAMESPACE)
      && typeof item.sha256 === "string" && SHA_256.test(item.sha256);
  }) && new Set(entries.map((entry) => (entry as LearningStateResetEntry).key)).size === entries.length;
  return validEntries(plan.targets) && plan.targets.every((entry) => targetKey(entry.key))
    && validEntries(plan.preserved) && plan.preserved.every((entry) => !targetKey(entry.key) && entry.key !== STORAGE_KEYS.ACTIVE_JOURNAL)
    && [...plan.targets, ...plan.preserved].every((entry, index, all) => all.findIndex((candidate) => candidate.key === entry.key) === index);
}

/** Full read-only integrity gate followed by an immutable exact physical snapshot. */
export function captureLearningStateResetTargetPlan(): LearningStateResetTargetPlan {
  const lease = captureActiveProfileStorageLease();
  if (!lease || !isActiveProfileStorageLeaseCurrent(lease)) fail();
  assertLearningStateResetInputIntegrity();
  const entries = currentEntries();
  const plan: LearningStateResetTargetPlan = Object.freeze({
    schema: "patternly:learning-state-reset-targets.v1",
    profile: profileTuple(lease.profile),
    targets: currentTargetEntries(entries),
    preserved: currentPreservedEntries(entries),
  });
  if (!isLearningStateResetTargetPlan(plan)) fail();
  return plan;
}

/** Rechecks exact bytes before a new reset journal becomes durable. */
export function assertLearningStateResetPlanBeforeJournal(plan: LearningStateResetTargetPlan): void {
  if (!isLearningStateResetTargetPlan(plan)) fail();
  currentLeaseFor(plan);
  assertLearningStateResetInputIntegrity();
  const entries = currentEntries();
  if (!hashesMatch(currentTargetEntries(entries), plan.targets)
    || !hashesMatch(currentPreservedEntries(entries), plan.preserved)) fail();
}

/** Existing-journal replay permits only captured target bytes or their deletion. */
export function assertLearningStateResetReplayState(plan: LearningStateResetTargetPlan): void {
  if (!isLearningStateResetTargetPlan(plan)) fail();
  currentLeaseFor(plan);
  const entries = currentEntries();
  const expected = new Map(plan.targets.map((entry) => [entry.key, entry.sha256]));
  const actual = currentTargetEntries(entries);
  if (actual.some((entry) => expected.get(entry.key) !== entry.sha256)) fail();
}

/** Delete only the already-preflighted physical set, then prove absence and preservation. */
export function materializeLearningStateReset(plan: LearningStateResetTargetPlan): void {
  assertLearningStateResetReplayState(plan);
  const beforeEntries = currentEntries();
  const entries = new Map(beforeEntries.map((entry) => [entry.key, entry.rawValue]));
  const preservedBefore = currentPreservedEntries(beforeEntries);
  for (const target of plan.targets) {
    const rawValue = entries.get(target.key);
    if (rawValue !== undefined) {
      if (sha256Utf8(rawValue) !== target.sha256) fail();
      removeCanonicalValue(target.key);
    }
    currentLeaseFor(plan);
    if (currentEntries().some((entry) => entry.key === target.key)) fail();
  }
  if (!hashesMatch(currentPreservedEntries(currentEntries()), preservedBefore)) fail();
  assertLearningStateResetMaterialized(plan);
}

export function assertLearningStateResetMaterialized(plan: LearningStateResetTargetPlan): void {
  assertLearningStateResetReplayState(plan);
  if (currentTargetEntries(currentEntries()).length !== 0) fail();
}
