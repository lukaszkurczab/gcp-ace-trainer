import { canonicalInteractionRegistry } from "../../content/canonical/interactions/registry";
import { APPROACH_CHALLENGE_MODE_ID } from "../../tracks/coding-interview/domain/algorithmModes";
import { APPROACH_CHALLENGE_TRACK_ID, type ApproachChallengeProblem } from "../../content/canonical/approachChallengeProblem";
import type { PackageCompletionState } from "../../domain/learning/packageCompletionRule";
import type { TrainingAttempt, TrainingSession } from "../../domain";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { loadActiveTrainingSession, loadTrainingAttempts, loadTrainingSession, loadTrainingSessionResult } from "../learningReadModels";
import { getForegroundSessionTimerFacade } from "../trainingLifecycle";
import { TrainingApplicationFailure, type PreparedSession } from "../trainingLifecycle";
import { startTrainingSession, getTrainingLifecycleUseCases } from "../trainingLifecycle/applicationLifecycle";
import {
  selectApproachChallengeProblems,
  type ApproachChallengeSelection,
  type ApproachChallengeSelectionSettings,
} from "./approachChallengeSelection";
import {
  APPROACH_CHALLENGE_MANIFEST_KEY,
  approachChallengeStageForOccurrence,
  decodeApproachChallengeManifest,
  isApproachChallengeStageOperationResolved,
  projectApproachChallengeManifestIntegrity,
  projectApproachChallengeMethodReveal,
  resolveManifestEntryProblem,
} from "./approachChallengeSession";

export type ApproachChallengeUnavailable = Readonly<{ kind: "unavailable"; reason: "artifact_unavailable" | "operation_unresolved" | "selection_unavailable" | "session_unavailable" }>;
export type ApproachChallengeStageProjection = Readonly<{
  kind: "ready";
  sessionId: string;
  occurrenceId: string;
  problemId: string;
  problemIndex: number;
  problemCount: number;
  stage: "approach" | "complexity";
  questionId: string;
  prompt: string;
  constraints: readonly string[];
  interaction: Readonly<{ interactionType: string; model: unknown }>;
  accepted: boolean;
  result: Readonly<{ kind: "correct" | "partial" | "incorrect"; earnedPoints: number; maxPoints: number }> | null;
  feedback: Readonly<{ reason: string; details: unknown }> | null;
  analyzedApproachId: string | null;
  methodReveal: ApproachChallengeProblem["methodReveal"] | null;
}>;
export type ApproachChallengeHistoryEntry = Readonly<{
  sessionId: string;
  status: TrainingSession["status"];
  startedAt: string;
  completedAt?: string;
  problemCount: number | null;
  manifestIntegrity: "verified" | "unavailable";
  answeredStageCount: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  pointsEarned: number;
  maxPoints: number;
}>;
export type ApproachChallengeDetailedStage = Readonly<{
  stage: "approach" | "complexity";
  occurrenceId: string;
  questionId: string;
  prompt: string;
  constraints: readonly string[];
  interaction: Readonly<{ interactionType: string; model: unknown }>;
  response: unknown | null;
  result: Readonly<{ kind: "correct" | "partial" | "incorrect"; earnedPoints: number; maxPoints: number }> | null;
  feedback: Readonly<{ reason: string; details: unknown }> | null;
}>;
export type ApproachChallengeDetailedProblem = Readonly<{
  problemId: string;
  problemVersion: string;
  contentVersion: string;
  artifactSha256: string;
  primaryFamilyId: string;
  requiredFamilyIds: readonly string[];
  difficulty: ApproachChallengeProblem["difficulty"];
  analyzedApproachId: string | null;
  methodReveal: ApproachChallengeProblem["methodReveal"] | null;
  stages: readonly [ApproachChallengeDetailedStage, ApproachChallengeDetailedStage];
}>;
export type ApproachChallengeDetailedHistory = Readonly<{
  kind: "ready";
  sessionId: string;
  status: "completed" | "abandoned";
  startedAt: string;
  completedAt: string;
  contentVersion: string;
  artifactSha256: string;
  problems: readonly ApproachChallengeDetailedProblem[];
}>;

export function selectCurrentApproachChallengeProblems(input: Readonly<{
  completion: PackageCompletionState;
  access: "free" | "premium" | "unknown";
  settings?: Partial<ApproachChallengeSelectionSettings>;
}>): ApproachChallengeSelection | ApproachChallengeUnavailable {
  try {
    const track = contentPackageRuntimeOwner.getPreparedDiscovery(APPROACH_CHALLENGE_TRACK_ID, APPROACH_CHALLENGE_MODE_ID).track;
    const problems = track.approachChallengeProblems;
    if (!problems?.length) return unavailable("artifact_unavailable");
    return selectApproachChallengeProblems({ sources: problems.map((problem) => ({ problem })), contentVersion: track.contentVersion,
      artifactSha256: track.artifactSha256, completion: input.completion, access: input.access, settings: input.settings });
  } catch {
    return unavailable("artifact_unavailable");
  }
}

/** Starts only a selector-produced complete selection; lifecycle owns the single active session and journal. */
export async function startApproachChallengeSession(selection: ApproachChallengeSelection): Promise<PreparedSession | ApproachChallengeUnavailable> {
  if (selection.status !== "ready" || !selection.problems.length) return unavailable("selection_unavailable");
  const prepared = await startTrainingSession({ trackId: APPROACH_CHALLENGE_TRACK_ID, modeId: APPROACH_CHALLENGE_MODE_ID, source: "approachChallenge", request: { selection } });
  await getForegroundSessionTimerFacade().initialize(prepared.session);
  return prepared;
}

/** Returns feedback only after the matching stage attempt is durable in the existing attempt repository. */
export async function getApproachChallengeStageProjection(): Promise<ApproachChallengeStageProjection | ApproachChallengeUnavailable> {
  const session = await loadActiveTrainingSession();
  if (!session || session.trackId !== APPROACH_CHALLENGE_TRACK_ID || session.modeId !== APPROACH_CHALLENGE_MODE_ID) return unavailable("session_unavailable");
  try {
    await getTrainingLifecycleUseCases().resumeActiveSession();
    const manifest = decodeApproachChallengeManifest(session.configurationSnapshot[APPROACH_CHALLENGE_MANIFEST_KEY], session);
    const occurrence = session.itemOrder[session.currentItemIndex];
    if (!occurrence) throw new Error("Current stage is missing.");
    const stageInfo = approachChallengeStageForOccurrence(manifest, occurrence.occurrenceId);
    if (!stageInfo) throw new Error("Current stage is outside the pinned manifest.");
    const exact = await contentPackageRuntimeOwner.resolveExactArtifact({ trackId: session.trackId, contentVersion: session.contentVersion, artifactSha256: session.artifactSha256, modeId: session.modeId });
    if (exact.track.contentVersion !== session.contentVersion || exact.track.artifactSha256 !== session.artifactSha256 || !exact.track.approachChallengeProblems) throw new Error("Exact paired artifact is unavailable.");
    const problem = resolveManifestEntryProblem(stageInfo.entry, (problemId, version) => exact.track.approachChallengeProblems!.find((candidate) => candidate.problemId === problemId && candidate.problemVersion === version), session);
    const question = stageInfo.stage === "approach" ? problem.approachQuestion : problem.complexityQuestion;
    const attemptSet = (await loadTrainingAttempts()).value.filter((attempt) => attempt.sessionId === session.id && attempt.modeId === APPROACH_CHALLENGE_MODE_ID);
    const prior = session.itemOrder.slice(0, session.currentItemIndex);
    const currentAttempts = attemptSet.filter((candidate) => candidate.occurrenceId === occurrence.occurrenceId);
    const expectedAttemptCount = session.currentItemIndex + Number(currentAttempts.length === 1);
    if (attemptSet.length !== expectedAttemptCount || currentAttempts.length > 1 ||
      prior.some((entry) => attemptSet.filter((candidate) => candidate.occurrenceId === entry.occurrenceId).length !== 1) ||
      attemptSet.some((candidate) => !prior.some((entry) => entry.occurrenceId === candidate.occurrenceId) && candidate.occurrenceId !== occurrence.occurrenceId)) {
      throw new Error("Session contains an incomplete or unpaired attempt history.");
    }
    const operation = await getTrainingLifecycleUseCases().getPracticeOperationState(session, attemptSet.some((candidate) => candidate.occurrenceId === occurrence.occurrenceId));
    if (!isApproachChallengeStageOperationResolved(operation)) return unavailable("operation_unresolved");
    if (stageInfo.stage === "complexity" && !attemptSet.some((attempt) => attempt.occurrenceId === stageInfo.entry.approachOccurrenceId)) throw new Error("Stage two is locked until stage one is accepted.");
    const attempt = attemptSet.find((candidate) => candidate.occurrenceId === occurrence.occurrenceId);
    const evaluation = attempt ? canonicalInteractionRegistry.evaluate(question, attempt.response) : null;
    if (attempt && (!evaluation?.result || evaluation.result.kind !== attempt.result.kind || evaluation.result.earnedPoints !== attempt.result.earnedPoints)) throw new Error("Saved stage result does not match the pinned problem.");
    const reveal = projectApproachChallengeMethodReveal(problem, attemptSet.some((candidate) => candidate.occurrenceId === stageInfo.entry.approachOccurrenceId));
    return Object.freeze({ kind: "ready", sessionId: session.id, occurrenceId: occurrence.occurrenceId, problemId: stageInfo.entry.problemRef.problemId,
      problemIndex: stageInfo.problemIndex + 1, problemCount: manifest.actualProblemCount, stage: stageInfo.stage, questionId: question.questionId,
      prompt: question.prompt, constraints: Object.freeze([...(question.constraints ?? [])]),
      interaction: canonicalInteractionRegistry.present(question, attempt?.response ?? null, session.optionOrderByOccurrence[occurrence.occurrenceId] ?? []),
      accepted: Boolean(attempt), result: attempt ? Object.freeze({ kind: attempt.result.kind, earnedPoints: attempt.result.earnedPoints, maxPoints: attempt.result.maxPoints }) : null,
      feedback: attempt && evaluation?.feedback ? Object.freeze({ reason: evaluation.feedback.reason, details: evaluation.feedback.details }) : null,
      analyzedApproachId: reveal?.analyzedApproachId ?? null, methodReveal: reveal?.methodReveal ?? null });
  } catch {
    return unavailable("artifact_unavailable");
  }
}

export async function submitApproachChallengeStage(response: unknown): Promise<void> {
  const session = requireActiveApproachChallenge(await loadActiveTrainingSession());
  await getForegroundSessionTimerFacade().checkpointForResponseSave(session);
  await getTrainingLifecycleUseCases().submitPracticeResponse(response);
  if (session.modeId !== APPROACH_CHALLENGE_MODE_ID) throw new TrainingApplicationFailure("resume_unavailable", "Active session changed during Approach Challenge submission.");
}

export async function advanceApproachChallengeStage(): Promise<TrainingSession> {
  requireActiveApproachChallenge(await loadActiveTrainingSession());
  return getTrainingLifecycleUseCases().advancePracticeSession();
}

export async function retryApproachChallengeStageSubmission(): Promise<void> {
  requireActiveApproachChallenge(await loadActiveTrainingSession());
  return getTrainingLifecycleUseCases().retryPracticeSubmission();
}

export async function recoverApproachChallengeOperation(): Promise<void> {
  requireActiveApproachChallenge(await loadActiveTrainingSession());
  return getTrainingLifecycleUseCases().recoverActiveTrainingOperation();
}

export async function completeApproachChallengeSession(): Promise<void> {
  const session = requireActiveApproachChallenge(await loadActiveTrainingSession());
  await getForegroundSessionTimerFacade().completePracticeAfterCheckpoint(session, () => getTrainingLifecycleUseCases().completeActivePracticeSession(session.id));
}

export async function getApproachChallengeHistory(): Promise<readonly ApproachChallengeHistoryEntry[]> {
  const [sessions, attempts] = await Promise.all([getTrainingLifecycleUseCases().queryHistory(), loadTrainingAttempts()]);
  return Object.freeze(sessions.filter((session) => session.trackId === APPROACH_CHALLENGE_TRACK_ID && session.modeId === APPROACH_CHALLENGE_MODE_ID)
    .map((session) => projectHistoryEntry(session, attempts.value)).sort((left, right) => right.startedAt.localeCompare(left.startedAt)));
}

export async function getApproachChallengeSummary(sessionId: string): Promise<ApproachChallengeHistoryEntry | ApproachChallengeUnavailable> {
  const session = await loadTrainingSession(sessionId);
  if (!session || session.trackId !== APPROACH_CHALLENGE_TRACK_ID || session.modeId !== APPROACH_CHALLENGE_MODE_ID) return unavailable("session_unavailable");
  try {
    const manifest = decodeApproachChallengeManifest(session.configurationSnapshot[APPROACH_CHALLENGE_MANIFEST_KEY], session);
    if (session.status === "completed") {
      const result = await loadTrainingSessionResult(session.id);
      const details = result?.evidence.details;
      if (!result || !isRecord(details) || result.sessionId !== session.id || result.trackId !== session.trackId || result.totalOccurrences !== session.actualLength || details.modeId !== APPROACH_CHALLENGE_MODE_ID || details.problemCount !== manifest.actualProblemCount) throw new Error("Completed result does not match the pinned Approach Challenge session.");
    }
    const attempts = await loadTrainingAttempts();
    return projectHistoryEntry(session, attempts.value);
  } catch {
    return unavailable("artifact_unavailable");
  }
}

/** Rebuilds both historical stages from the exact saved artifact and durable attempts; no legacy review API is involved. */
export async function getApproachChallengeDetailedHistory(sessionId: string): Promise<ApproachChallengeDetailedHistory | ApproachChallengeUnavailable> {
  const session = await loadTrainingSession(sessionId);
  if (!session || session.trackId !== APPROACH_CHALLENGE_TRACK_ID || session.modeId !== APPROACH_CHALLENGE_MODE_ID ||
    (session.status !== "completed" && session.status !== "abandoned") || !session.completedAt) return unavailable("session_unavailable");
  try {
    const manifest = decodeApproachChallengeManifest(session.configurationSnapshot[APPROACH_CHALLENGE_MANIFEST_KEY], session);
    const exact = await contentPackageRuntimeOwner.resolveExactArtifact({ trackId: session.trackId, contentVersion: session.contentVersion, artifactSha256: session.artifactSha256, modeId: session.modeId });
    if (exact.track.contentVersion !== session.contentVersion || exact.track.artifactSha256 !== session.artifactSha256 || !exact.track.approachChallengeProblems) throw new Error("The exact historical paired-task artifact is unavailable.");
    if (session.itemOrder.length !== manifest.actualProblemCount * 2 || (session.conditionalReinsertSlots?.length ?? 0) !== 0) throw new Error("Historical stage order does not match its manifest.");
    const attempts = (await loadTrainingAttempts()).value.filter((attempt) => attempt.sessionId === session.id);
    const byOccurrence = new Map<string, TrainingAttempt<unknown>>();
    for (const attempt of attempts) {
      if (attempt.trackId !== session.trackId || attempt.modeId !== session.modeId || byOccurrence.has(attempt.occurrenceId)) throw new Error("Historical attempt identity is invalid or duplicated.");
      byOccurrence.set(attempt.occurrenceId, attempt);
    }
    const planned = new Set(session.itemOrder.map(({ occurrenceId }) => occurrenceId));
    if ([...byOccurrence.keys()].some((occurrenceId) => !planned.has(occurrenceId)) || attempts.length > session.itemOrder.length ||
      (session.status === "completed" && attempts.length !== session.itemOrder.length)) throw new Error("Historical attempt coverage does not match the saved session.");
    for (let index = 0; index < session.itemOrder.length; index += 1) {
      const occurrence = session.itemOrder[index]!;
      const attempt = byOccurrence.get(occurrence.occurrenceId);
      if (attempt && index > 0 && !byOccurrence.has(session.itemOrder[index - 1]!.occurrenceId)) throw new Error("Historical answers are not a sequential prefix.");
      if (index % 2 === 1 && attempt && !byOccurrence.has(session.itemOrder[index - 1]!.occurrenceId)) throw new Error("Historical complexity answer has no accepted approach stage.");
      if (attempt && (attempt.item.trackId !== occurrence.item.trackId || attempt.item.questionId !== occurrence.item.questionId || attempt.item.contentVersion !== session.contentVersion || attempt.item.artifactSha256 !== session.artifactSha256)) throw new Error("Historical attempt is outside its exact pinned stage.");
    }
    let result = null;
    if (session.status === "completed") {
      result = await loadTrainingSessionResult(session.id);
      const details = result?.evidence.details;
      if (!result || !isRecord(details) || result.sessionId !== session.id || result.trackId !== session.trackId || result.totalOccurrences !== session.actualLength ||
        result.answeredOccurrenceIds.length !== session.actualLength || result.unansweredOccurrenceIds.length !== 0 ||
        new Set(result.answeredOccurrenceIds).size !== session.actualLength || session.itemOrder.some(({ occurrenceId }) => !result!.answeredOccurrenceIds.includes(occurrenceId)) || details.modeId !== APPROACH_CHALLENGE_MODE_ID ||
        details.problemCount !== manifest.actualProblemCount || details.correctCount !== attempts.filter(({ result: value }) => value.kind === "correct").length ||
        details.partialCount !== attempts.filter(({ result: value }) => value.kind === "partial").length || details.incorrectCount !== attempts.filter(({ result: value }) => value.kind === "incorrect").length ||
        details.pointsEarned !== attempts.reduce((sum, attempt) => sum + attempt.result.earnedPoints, 0) || details.maxPoints !== attempts.reduce((sum, attempt) => sum + attempt.result.maxPoints, 0)) throw new Error("Historical completed result does not match its durable attempts.");
    }
    const problems = manifest.entries.map((entry, problemIndex): ApproachChallengeDetailedProblem => {
      const problem = resolveManifestEntryProblem(entry, (problemId, version) => exact.track.approachChallengeProblems!.find((candidate) => candidate.problemId === problemId && candidate.problemVersion === version), session);
      const stageRows = (["approach", "complexity"] as const).map((stage): ApproachChallengeDetailedStage => {
        const question = stage === "approach" ? problem.approachQuestion : problem.complexityQuestion;
        const occurrence = session.itemOrder[problemIndex * 2 + (stage === "approach" ? 0 : 1)]!;
        if (occurrence.item.questionId !== question.questionId) throw new Error("Historical question identity does not match the exact paired problem.");
        const attempt = byOccurrence.get(occurrence.occurrenceId);
        if (!attempt) return Object.freeze({ stage, occurrenceId: occurrence.occurrenceId, questionId: question.questionId, prompt: question.prompt,
          constraints: Object.freeze([...(question.constraints ?? [])]), interaction: canonicalInteractionRegistry.present(question, null), response: null, result: null, feedback: null });
        const evaluation = canonicalInteractionRegistry.evaluate(question, attempt.response);
        if (!evaluation.complete || !evaluation.result || evaluation.result.kind !== attempt.result.kind || evaluation.result.earnedPoints !== attempt.result.earnedPoints || evaluation.result.maxPoints !== attempt.result.maxPoints) throw new Error("Historical response no longer matches its pinned result.");
        return Object.freeze({ stage, occurrenceId: occurrence.occurrenceId, questionId: question.questionId, prompt: question.prompt,
          constraints: Object.freeze([...(question.constraints ?? [])]), interaction: canonicalInteractionRegistry.present(question, attempt.response, session.optionOrderByOccurrence[occurrence.occurrenceId] ?? []),
          response: attempt.response, result: Object.freeze({ kind: attempt.result.kind, earnedPoints: attempt.result.earnedPoints, maxPoints: attempt.result.maxPoints }),
          feedback: evaluation.feedback ? Object.freeze({ reason: evaluation.feedback.reason, details: evaluation.feedback.details }) : null });
      }) as [ApproachChallengeDetailedStage, ApproachChallengeDetailedStage];
      const approachAccepted = byOccurrence.has(entry.approachOccurrenceId);
      return Object.freeze({ problemId: problem.problemId, problemVersion: problem.problemVersion, contentVersion: entry.problemRef.contentVersion,
        artifactSha256: entry.problemRef.artifactSha256, primaryFamilyId: problem.primaryFamilyId, requiredFamilyIds: Object.freeze([...problem.requiredFamilyIds]),
        difficulty: problem.difficulty, analyzedApproachId: approachAccepted ? entry.problemRef.analyzedApproachId : null,
        methodReveal: approachAccepted ? problem.methodReveal : null, stages: Object.freeze(stageRows) as readonly [ApproachChallengeDetailedStage, ApproachChallengeDetailedStage] });
    });
    return Object.freeze({ kind: "ready", sessionId: session.id, status: session.status, startedAt: session.startedAt, completedAt: session.completedAt,
      contentVersion: session.contentVersion, artifactSha256: session.artifactSha256, problems: Object.freeze(problems) });
  } catch {
    return unavailable("artifact_unavailable");
  }
}

function projectHistoryEntry(session: TrainingSession, attempts: readonly TrainingAttempt<unknown>[]): ApproachChallengeHistoryEntry {
  const own = attempts.filter((attempt) => attempt.sessionId === session.id && attempt.trackId === APPROACH_CHALLENGE_TRACK_ID && attempt.modeId === APPROACH_CHALLENGE_MODE_ID);
  const counts = own.reduce((result, attempt) => ({ correctCount: result.correctCount + Number(attempt.result.kind === "correct"),
    partialCount: result.partialCount + Number(attempt.result.kind === "partial"), incorrectCount: result.incorrectCount + Number(attempt.result.kind === "incorrect"),
    pointsEarned: result.pointsEarned + attempt.result.earnedPoints, maxPoints: result.maxPoints + attempt.result.maxPoints }),
  { correctCount: 0, partialCount: 0, incorrectCount: 0, pointsEarned: 0, maxPoints: 0 });
  const { problemCount, manifestIntegrity } = projectApproachChallengeManifestIntegrity(session.configurationSnapshot[APPROACH_CHALLENGE_MANIFEST_KEY], session);
  return Object.freeze({ sessionId: session.id, status: session.status, startedAt: session.startedAt, ...(session.completedAt ? { completedAt: session.completedAt } : {}),
    problemCount, manifestIntegrity, answeredStageCount: own.length, correctCount: counts.correctCount, partialCount: counts.partialCount, incorrectCount: counts.incorrectCount,
    pointsEarned: counts.pointsEarned, maxPoints: counts.maxPoints });
}

function requireActiveApproachChallenge(session: TrainingSession | null): TrainingSession {
  if (!session || session.trackId !== APPROACH_CHALLENGE_TRACK_ID || session.modeId !== APPROACH_CHALLENGE_MODE_ID || session.status !== "active") throw new TrainingApplicationFailure("no_active_session", "No active Approach Challenge session is available.");
  return session;
}

function unavailable(reason: ApproachChallengeUnavailable["reason"]): ApproachChallengeUnavailable { return Object.freeze({ kind: "unavailable", reason }); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
