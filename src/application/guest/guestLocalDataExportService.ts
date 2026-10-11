import type { ForegroundTimerState, GoalRecord, LearningPlan, TrackId, TrainingAttempt, TrainingSession, TrainingSessionDraft, TrainingSessionResult } from "../../domain";
import { acceptedTargetFromGoal, LAUNCH_TRACK_IDS } from "../../domain";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { cleanupProfileExportFiles, createRuntimeProfileExportFileStore, type ProfileExportFile, type ProfileExportFileStore } from "../account/profileExportFileStore";
import { captureActiveProfileStorageLease, isActiveProfileStorageLeaseCurrent, getActiveStorageProfileOrNull, type ActiveProfileStorageLease } from "../../storage/repositories/profileStorageRepository";
import { readLearningPlanStorageScope } from "../../storage/repositories/learningPlanInputSnapshot";
import { readActiveTrackId } from "../../storage/repositories/activeTrackRepository";
import { readGuestInstallation, type GuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { readActiveMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { readTrainingSessions, readActiveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { readActiveTrainingSessionDraft } from "../../storage/repositories/trainingSessionDraftRepository";
import { readActiveForegroundTimer } from "../../storage/repositories/foregroundTimerRepository";
import { readTrainingSessionResult } from "../../storage/repositories/trainingSessionResultRepository";
import { readTrainingAttempts } from "../../storage/repositories/trainingAttemptRepository";
import { readReviewQueueSnapshot } from "../../storage/repositories/reviewQueueRepository";
import { readGoalSnapshot } from "../../storage/repositories/goalRepository";
import { getLearningPlanSnapshot } from "../../storage/repositories/learningPlanRepository";
import { readSettings } from "../../storage/repositories/settingsRepository";
import { readGoalOnboardingPreferencesForExport } from "../../storage/repositories/goalOnboardingPreferenceRepository";
import { readReminderPreferencesForExport, type ReminderPreferencesForExport } from "../../storage/repositories/notificationSettingsRepository";
import { getContentReportOutbox } from "../../storage/repositories/contentReportOutboxRepository";
import { assertContentIdentityRecordIntegrity, readContentIdentityRetainedHistory } from "../../storage/repositories/contentIdentityUnavailableRepository";
import { assertTrainingEvidenceIntegrity } from "../../storage/repositories/trainingEvidenceIntegrityRepository";
import { withLocalLearningWriteOperation } from "../learningMutations/localLearningWriteOperation";

export const GUEST_LOCAL_DATA_EXPORT_FILE_PREFIX = "patternly-guest-local-data-";

export type GuestLocalDataExportDocument = Readonly<{
  schemaVersion: "patternly-local-guest-export-v1";
  exportId: string;
  exportedAt: string;
  profile: Readonly<{ kind: "local_guest" }>;
  activeTrackId: TrackId | null;
  settings: Readonly<{
    application: Awaited<ReturnType<typeof readSettings>>;
    goalOnboardingDismissedTrackIds: readonly TrackId[] | null;
    reminders: ReminderPreferencesForExport["preferences"];
  }>;
  learning: Readonly<{
    sessions: readonly TrainingSession[];
    activeSessionId: string | null;
    activeSessionDraft: TrainingSessionDraft | null;
    foregroundTimer: ForegroundTimerState | null;
    attempts: readonly TrainingAttempt<unknown>[];
    results: readonly Readonly<{ sessionId: string; result: TrainingSessionResult }>[];
    reviews: readonly Readonly<Record<string, unknown>>[];
    goals: readonly Readonly<{ trackId: TrackId; goal: GoalRecord }>[];
    acceptedPlans: readonly Readonly<{ trackId: TrackId; plan: LearningPlan }>[];
    retainedContentHistory: Readonly<{
      archivalSessions: ReturnType<typeof readContentIdentityRetainedHistory>["archivalSessions"];
      unavailableActiveSessions: ReturnType<typeof readContentIdentityRetainedHistory>["unavailableActiveSessions"];
      unavailableReviews: ReturnType<typeof readContentIdentityRetainedHistory>["unavailableReviews"];
    }>;
  }>;
  userReports: readonly Readonly<Record<string, unknown>>[];
  manifest: Readonly<{
    included: readonly string[];
    omitted: readonly Readonly<{ category: string; reason: string }>[];
  }>;
}>;

export type GuestLocalDataExportFailure =
  | "guestProfileUnavailable"
  | "sourcePending"
  | "sourceInvalid"
  | "sourceChanged"
  | "fileFailure"
  | "sharingFailed"
  | "cleanupFailed";

export type GuestLocalDataExportResult = Readonly<
  | { kind: "handoff"; disposition: "shared" | "dismissed" }
  | { kind: "failure"; failure: GuestLocalDataExportFailure }
>;

export type GuestLocalDataExportDependencies = Readonly<{
  files: ProfileExportFileStore;
  share: (uri: string) => Promise<"sharedAction" | "dismissedAction">;
  createExportId: () => string;
  now: () => Date;
}>;

type CapturedGuestSource = Readonly<{
  lease: ActiveProfileStorageLease;
  profileId: string;
  guestMarkerFingerprint: string;
  storageScope: object;
  sourceFingerprint: string;
  source: Omit<GuestLocalDataExportDocument, "exportId" | "exportedAt">;
}>;

function projectUserReport(entry: ReturnType<typeof getContentReportOutbox>[number]): Readonly<Record<string, unknown>> {
  const { input } = entry;
  return Object.freeze({
    trackId: input.trackId,
    contentVersion: input.contentVersion,
    itemId: input.itemId,
    reason: input.reason,
    description: input.description,
    context: Object.freeze({
      trackNode: input.context.trackNode,
      modeRoute: input.context.modeRoute,
      locale: input.context.locale,
      occurredAt: input.context.occurredAt,
    }),
    ...(input.contactEmail === undefined ? {} : { contactEmail: input.contactEmail }),
  });
}

function runtimeDependencies(): GuestLocalDataExportDependencies {
  const { randomUUID } = require("expo-crypto") as typeof import("expo-crypto");
  const { Share } = require("react-native") as typeof import("react-native");
  return {
    files: createRuntimeProfileExportFileStore(),
    share: async (uri) => {
      const result = await Share.share({ url: uri, title: "Patternly learning data" });
      return result.action === Share.sharedAction ? "sharedAction" : "dismissedAction";
    },
    createExportId: () => randomUUID(),
    now: () => new Date(),
  };
}

function isActiveGuestLease(lease: NonNullable<ReturnType<typeof captureActiveProfileStorageLease>>, installation: GuestInstallation | null): boolean {
  const profile = lease.profile;
  return (profile.kind === "guest" || profile.kind === "legacy_guest")
    && profile.accountId === null
    && installation !== null
    && installation.bindingState === "guest"
    && installation.accountId === null
    // Modern profiles are provisioned with matching namespace and dataset IDs.
    // Earlier guest markers predate that invariant and the router intentionally
    // preserves their independently generated dataset identity.
    && (profile.kind === "legacy_guest" || installation.localDatasetId === profile.id);
}

function readGuestSource(): CapturedGuestSource {
  const lease = captureActiveProfileStorageLease();
  const profile = getActiveStorageProfileOrNull();
  const storageScope = readLearningPlanStorageScope();
  const installation = readGuestInstallation();
  if (!lease || !profile || profile.id !== lease.profile.id || profile.kind !== lease.profile.kind
    || profile.accountId !== lease.profile.accountId || !isActiveGuestLease(lease, installation)) {
    throw new GuestLocalExportError("guestProfileUnavailable");
  }
  if (readActiveMutationJournal()) throw new GuestLocalExportError("sourcePending");

  try {
    assertTrainingEvidenceIntegrity();
    assertContentIdentityRecordIntegrity();
  } catch {
    throw new GuestLocalExportError("sourceInvalid");
  }

  const sessionResult = readTrainingSessions();
  const attemptResult = readTrainingAttempts();
  const reviewResult = readReviewQueueSnapshot();
  if (!sessionResult.ok || sessionResult.issues?.length || !attemptResult.ok || attemptResult.issues?.length || !reviewResult.ok || reviewResult.issues?.length) {
    throw new GuestLocalExportError("sourceInvalid");
  }
  const sessions = sessionResult.value;
  const sessionIds = new Set(sessions.map((session) => session.id));
  if (sessionIds.size !== sessions.length) throw new GuestLocalExportError("sourceInvalid");
  const activeSession = readActiveTrainingSession();
  const activeSessions = sessions.filter((session) => session.status === "active");
  if (activeSessions.length > 1 || (activeSession === null) !== (activeSessions.length === 0)
    || (activeSession !== null && activeSessions[0]?.id !== activeSession.id)) throw new GuestLocalExportError("sourceInvalid");

  const draft = readActiveTrainingSessionDraft();
  if (draft && (!activeSession || draft.sessionId !== activeSession.id || draft.trackId !== activeSession.trackId)) {
    throw new GuestLocalExportError("sourceInvalid");
  }
  const foregroundTimer = readActiveForegroundTimer();
  if (foregroundTimer && (!activeSession || foregroundTimer.sessionId !== activeSession.id || foregroundTimer.trackId !== activeSession.trackId)) {
    throw new GuestLocalExportError("sourceInvalid");
  }
  const results = sessions.flatMap((session) => {
    const result = readTrainingSessionResult(session.id);
    if (session.status === "completed" && result === null) throw new GuestLocalExportError("sourceInvalid");
    if (result && result.sessionId !== session.id) throw new GuestLocalExportError("sourceInvalid");
    return result ? [Object.freeze({ sessionId: session.id, result })] : [];
  });

  const goals: Array<Readonly<{ trackId: TrackId; goal: GoalRecord }>> = [];
  const acceptedPlans: Array<Readonly<{ trackId: TrackId; plan: LearningPlan }>> = [];
  for (const trackId of LAUNCH_TRACK_IDS) {
    const goal = readGoalSnapshot(trackId);
    const plan = getLearningPlanSnapshot(trackId);
    if (plan && (!goal || plan.plan.goalRevision !== goal.revision
      || canonicalSerialize(plan.plan.acceptedTarget) !== canonicalSerialize(acceptedTargetFromGoal(goal.record)))) {
      throw new GuestLocalExportError("sourceInvalid");
    }
    if (goal) goals.push(Object.freeze({ trackId, goal: goal.record }));
    if (plan) acceptedPlans.push(Object.freeze({ trackId, plan: plan.plan }));
  }

  const reminderSnapshot = readReminderPreferencesForExport();
  if (reminderSnapshot.hasPendingJournal) throw new GuestLocalExportError("sourcePending");
  const goalOnboardingPreferences = readGoalOnboardingPreferencesForExport();
  const retainedContentHistory = readContentIdentityRetainedHistory();

  const source: Omit<GuestLocalDataExportDocument, "exportId" | "exportedAt"> = Object.freeze({
    schemaVersion: "patternly-local-guest-export-v1",
    profile: Object.freeze({ kind: "local_guest" }),
    activeTrackId: readActiveTrackId(),
    settings: Object.freeze({
      application: readSettings(),
      goalOnboardingDismissedTrackIds: goalOnboardingPreferences.dismissedTrackIds,
      reminders: reminderSnapshot.preferences,
    }),
    learning: Object.freeze({
      sessions: Object.freeze([...sessions]),
      activeSessionId: activeSession?.id ?? null,
      activeSessionDraft: draft,
      foregroundTimer,
      attempts: Object.freeze([...attemptResult.value]),
      results: Object.freeze(results),
      reviews: Object.freeze([...reviewResult.value.entries]) as readonly Readonly<Record<string, unknown>>[],
      goals: Object.freeze(goals),
      acceptedPlans: Object.freeze(acceptedPlans),
      retainedContentHistory: Object.freeze({
        archivalSessions: retainedContentHistory.archivalSessions,
        unavailableActiveSessions: retainedContentHistory.unavailableActiveSessions,
        unavailableReviews: retainedContentHistory.unavailableReviews,
      }),
    }),
    userReports: Object.freeze(getContentReportOutbox().map(projectUserReport)),
    manifest: Object.freeze({
      included: Object.freeze(["active track", "learning progress evidence", "sessions and saved draft", "answers and results", "review schedule", "goals and accepted plans", "retained history whose original question content is unavailable", "app and goal onboarding preferences", "reminder preferences", "locally saved learning reports"]),
      omitted: Object.freeze([
        Object.freeze({ category: "profile and account identifiers", reason: "The export contains only the learning data owned by the active Guest profile; installation identifiers are not needed in the file." }),
        Object.freeze({ category: "notification delivery identifiers and transaction journals", reason: "These are device implementation details; user-selected reminder settings are included." }),
        Object.freeze({ category: "report delivery identifiers and transport state", reason: "The export includes the report content you submitted, not submission IDs, account-link choices, retry counts, or delivery errors." }),
        Object.freeze({ category: "report release, build, and platform diagnostics", reason: "These technical context fields are not needed to carry the report text and are omitted from this local copy." }),
        Object.freeze({ category: "account sync and cloud state", reason: "This is a local Guest export and does not include account or server state." }),
        Object.freeze({ category: "question banks and downloaded content cache", reason: "Learning content is not personal progress data and can be retrieved by the app." }),
        Object.freeze({ category: "unavailable question content", reason: "Some retained history refers to question content that is no longer available in this installation; the preserved session, answer, result, and review records are included, while missing question text cannot be reconstructed." }),
        Object.freeze({ category: "infrastructure and diagnostic logs", reason: "Technical records are not part of the learner's local data export." }),
      ]),
    }),
  });

  const verifiedInstallation = readGuestInstallation();
  if (readActiveMutationJournal() || !isActiveProfileStorageLeaseCurrent(lease)
    || readLearningPlanStorageScope() !== storageScope || !isActiveGuestLease(lease, verifiedInstallation)
    || canonicalSerialize(verifiedInstallation) !== canonicalSerialize(installation)) {
    throw new GuestLocalExportError("sourceChanged");
  }
  return Object.freeze({
    lease,
    profileId: lease.profile.id,
    guestMarkerFingerprint: canonicalSerialize(installation),
    storageScope,
    sourceFingerprint: canonicalSerialize({ source, goalOnboardingPreferenceRevision: goalOnboardingPreferences.revision }),
    source,
  });
}

class GuestLocalExportError extends Error {
  constructor(readonly failure: GuestLocalDataExportFailure) { super(failure); this.name = "GuestLocalExportError"; }
}

async function captureGuestSource(): Promise<CapturedGuestSource> {
  return withLocalLearningWriteOperation(async () => readGuestSource());
}

function removeTemporaryFile(file: ProfileExportFile | null): boolean {
  if (!file) return true;
  try { if (file.exists()) file.delete(); return true; } catch { return false; }
}

function canContinueWithLease(lease: ActiveProfileStorageLease, canContinue: () => boolean): boolean {
  try { return canContinue() && isActiveProfileStorageLeaseCurrent(lease); } catch { return false; }
}

export async function exportGuestLocalData(
  dependencies: GuestLocalDataExportDependencies = runtimeDependencies(),
  canContinue: () => boolean = () => true,
): Promise<GuestLocalDataExportResult> {
  let first: CapturedGuestSource;
  try { first = await captureGuestSource(); }
  catch (error) { return { kind: "failure", failure: error instanceof GuestLocalExportError ? error.failure : "sourceInvalid" }; }

  if (!canContinueWithLease(first.lease, canContinue)) return { kind: "failure", failure: "sourceChanged" };

  let document: GuestLocalDataExportDocument;
  let exportId: string;
  try {
    exportId = dependencies.createExportId();
    const exportedAt = dependencies.now().toISOString();
    if (!/^[A-Za-z0-9_-]{8,128}$/u.test(exportId) || !Number.isFinite(Date.parse(exportedAt))) {
      return { kind: "failure", failure: "fileFailure" };
    }
    document = Object.freeze({ ...first.source, exportId, exportedAt });
  } catch { return { kind: "failure", failure: "fileFailure" }; }
  let file: ProfileExportFile | null = null;
  try {
    file = dependencies.files.createCacheFile(`${GUEST_LOCAL_DATA_EXPORT_FILE_PREFIX}${first.profileId}-${exportId}.json`);
    file.write(JSON.stringify(document, null, 2));
  } catch {
    return { kind: "failure", failure: removeTemporaryFile(file) ? "fileFailure" : "cleanupFailed" };
  }

  try {
    const current = await captureGuestSource();
    if (!canContinueWithLease(first.lease, canContinue)
      || current.storageScope !== first.storageScope
      || current.guestMarkerFingerprint !== first.guestMarkerFingerprint
      || current.sourceFingerprint !== first.sourceFingerprint) {
      return { kind: "failure", failure: removeTemporaryFile(file) ? "sourceChanged" : "cleanupFailed" };
    }
  } catch (error) {
    const failure = canContinueWithLease(first.lease, canContinue)
      ? error instanceof GuestLocalExportError ? error.failure : "sourceChanged"
      : "sourceChanged";
    return { kind: "failure", failure: removeTemporaryFile(file) ? failure : "cleanupFailed" };
  }

  let disposition: "shared" | "dismissed";
  try {
    if (!canContinueWithLease(first.lease, canContinue)) {
      return { kind: "failure", failure: removeTemporaryFile(file) ? "sourceChanged" : "cleanupFailed" };
    }
    disposition = (await dependencies.share(file.uri)) === "sharedAction" ? "shared" : "dismissed";
  } catch {
    return { kind: "failure", failure: removeTemporaryFile(file) ? "sharingFailed" : "cleanupFailed" };
  }
  return removeTemporaryFile(file)
    ? { kind: "handoff", disposition }
    : { kind: "failure", failure: "cleanupFailed" };
}

export function cleanupOrphanedGuestLocalDataExports(
  files: Pick<ProfileExportFileStore, "listCacheFiles"> = createRuntimeProfileExportFileStore(),
  profile = getActiveStorageProfileOrNull(),
): void {
  if (!profile || (profile.kind !== "guest" && profile.kind !== "legacy_guest")) return;
  cleanupProfileExportFiles(files, [GUEST_LOCAL_DATA_EXPORT_FILE_PREFIX], profile.id);
}
