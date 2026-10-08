import type { TrackId, TrainingSession } from "../../domain";
import { loadActiveTrainingSession, loadActiveTrainingSessionDraft, loadTrainingSession, loadTrainingSessionResult } from "../learningReadModels";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { getTrainingLifecycleUseCases, simulationHasReviewConflict, startTrainingSession, type SimulationDurableOperationState } from "../trainingLifecycle";
import { getProductSimulationModeConfig, ProductModeUnavailableError } from "../../content/canonical/productModeConfig";
import type { CanonicalDesignInterviewSimulationProfile } from "../../content/canonical/questionTypes";

export type DesignSimulationStage = "requirements" | "architecture" | "tradeoffs" | "final_answer";
export type DesignSimulationProjection = Readonly<{
  session: TrainingSession;
  profile: CanonicalDesignInterviewSimulationProfile;
  responsesByStage: Readonly<Record<DesignSimulationStage, string>>;
  stageCompleteness: Readonly<Record<DesignSimulationStage, boolean>>;
  remainingMs: number;
  operation: SimulationDurableOperationState;
  draftRevision: number;
}>;
export type DesignSimulationResultProjection = Readonly<{
  sessionId: string;
  trackId: TrackId;
  reviewConflict?: true;
  profile: CanonicalDesignInterviewSimulationProfile;
  responsesByStage: Readonly<Record<DesignSimulationStage, string>>;
  stageCompleteness: Readonly<Record<DesignSimulationStage, boolean>>;
  completedAt: string;
}>;

export class DesignInterviewSimulationExpiredError extends Error {
  constructor(readonly sessionId: string) {
    super("The Design Interview simulation reached its immutable deadline and was finalized.");
    this.name = "DesignInterviewSimulationExpiredError";
  }
}

const STAGE_IDS: readonly DesignSimulationStage[] = Object.freeze(["requirements", "architecture", "tradeoffs", "final_answer"]);

export function areDesignSimulationStagesComplete(completenessByStage: Readonly<Record<DesignSimulationStage, boolean>>): boolean {
  return STAGE_IDS.every((stageId) => completenessByStage[stageId] === true);
}

function exactProfile(trackId: string): CanonicalDesignInterviewSimulationProfile {
  const track = contentPackageRuntimeOwner.getPreparedDiscovery(trackId as TrackId).track;
  const resolved = getProductSimulationModeConfig(trackId, track.simulationProfiles);
  if (resolved.config.kind !== "design_interview_simulation" || resolved.profile.familyId !== "design_interview" || resolved.profile.modeId !== "design-interview-simulation") {
    throw new ProductModeUnavailableError(`Design Interview simulation is unavailable for ${trackId}.`);
  }
  return resolved.profile;
}

export async function openDesignInterviewSimulation(input: Readonly<{ trackId: TrackId; profileId: string; expectedSessionId?: string }>): Promise<DesignSimulationProjection> {
  const profile = exactProfile(input.trackId);
  if (profile.profileId !== input.profileId) throw new ProductModeUnavailableError("Design Interview simulation requires its exact canonical profile identity.");
  const expiredSessionId = await getTrainingLifecycleUseCases().finalizeExpiredSimulationIfDue();
  if (expiredSessionId) throw new DesignInterviewSimulationExpiredError(expiredSessionId);
  const active = await loadActiveTrainingSession();
  if (input.expectedSessionId) {
    if (!active || active.id !== input.expectedSessionId || active.trackId !== input.trackId || active.modeId !== "design-interview-simulation") throw new Error("The exact active Design Interview simulation is unavailable.");
    await getTrainingLifecycleUseCases().resumeActiveSession();
  } else if (!active) {
    await startTrainingSession({ trackId: input.trackId, modeId: "design-interview-simulation", source: "designInterviewSimulation", request: { scope: { simulationProfileId: profile.profileId } } });
  } else if (active.trackId !== input.trackId || active.modeId !== "design-interview-simulation") {
    throw new Error(`Active session ${active.id} must be resumed or abandoned first.`);
  } else {
    if (active.configurationSnapshot.simulationProfileId !== profile.profileId) throw new Error("Active Design Interview simulation profile identity does not match this track.");
    await getTrainingLifecycleUseCases().resumeActiveSession();
  }
  const session = await loadActiveTrainingSession();
  if (!session || session.trackId !== input.trackId || session.modeId !== "design-interview-simulation" || session.configurationSnapshot.simulationProfileId !== profile.profileId) throw new Error("The active Design Interview simulation was not verified.");
  return getDesignInterviewSimulationProjection();
}

export async function getDesignInterviewSimulationProjection(): Promise<DesignSimulationProjection> {
  const expiredSessionId = await getTrainingLifecycleUseCases().finalizeExpiredSimulationIfDue();
  if (expiredSessionId) throw new DesignInterviewSimulationExpiredError(expiredSessionId);
  const session = await requireActiveSimulation();
  const profile = exactProfile(session.trackId);
  const draft = await loadActiveTrainingSessionDraft();
  if (!draft || draft.sessionId !== session.id || draft.trackId !== session.trackId || draft.familyId !== "design_interview") throw new Error("The durable Design Interview simulation draft is unavailable.");
  const occurrenceId = session.itemOrder[0]?.occurrenceId;
  if (!occurrenceId) throw new Error("The Design Interview simulation session plan is unavailable.");
  const responsesByStage = parseResponses(draft.responsesByOccurrenceId[occurrenceId]);
  const stageCompleteness = completeness(responsesByStage);
  const deadline = Date.parse(String(session.configurationSnapshot.timerDeadlineAt));
  const now = Date.parse(getTrainingLifecycleUseCases().currentTime());
  return Object.freeze({ session, profile, responsesByStage, stageCompleteness, remainingMs: Math.max(0, deadline - now), draftRevision: draft.revision, operation: await getTrainingLifecycleUseCases().getSimulationOperationState(session) });
}

export async function saveDesignInterviewSimulationStage(stageId: DesignSimulationStage, response: string): Promise<void> {
  if (!STAGE_IDS.includes(stageId) || typeof response !== "string") throw new Error("Design Interview stage response is invalid.");
  const projection = await getDesignInterviewSimulationProjection();
  const occurrenceId = projection.session.itemOrder[0]!.occurrenceId;
  const draft = await loadActiveTrainingSessionDraft();
  if (!draft || draft.revision !== projection.draftRevision) throw new Error("Design Interview simulation draft changed before save.");
  await getTrainingLifecycleUseCases().saveSimulationDraft({
    expectedPreviousRevision: draft.revision,
    draft: { ...draft, revision: draft.revision + 1, updatedAt: getTrainingLifecycleUseCases().currentTime(), responsesByOccurrenceId: { ...draft.responsesByOccurrenceId, [occurrenceId]: { ...projection.responsesByStage, [stageId]: response } } },
  });
}

export async function finishDesignInterviewSimulation(): Promise<void> {
  const projection = await getDesignInterviewSimulationProjection();
  if (!areDesignSimulationStagesComplete(projection.stageCompleteness)) throw new Error("Complete all four required stages before finishing the simulation.");
  const expiredSessionId = await getTrainingLifecycleUseCases().finalizeExpiredSimulationIfDue();
  if (expiredSessionId) throw new DesignInterviewSimulationExpiredError(expiredSessionId);
  await getTrainingLifecycleUseCases().finalizeSimulation();
}

export async function recoverDesignInterviewSimulationOperation(): Promise<void> { await getTrainingLifecycleUseCases().recoverActiveTrainingOperation(); }

export async function getDesignInterviewSimulationResult(sessionId: string): Promise<DesignSimulationResultProjection> {
  const [session, result] = await Promise.all([loadTrainingSession(sessionId), loadTrainingSessionResult(sessionId)]);
  if (!session || session.modeId !== "design-interview-simulation" || session.status !== "completed" || !result || result.sessionId !== session.id || result.evidence.familyId !== "design_interview") throw new Error("Completed Design Interview simulation result is unavailable.");
  const profile = exactProfile(session.trackId);
  const details = result.evidence.details as Record<string, unknown>;
  if (details.profileId !== profile.profileId || details.profileVersion !== profile.profileVersion || details.caseId !== profile.familyConfig.caseId || details.caseVersion !== profile.familyConfig.caseVersion) throw new Error("Completed Design Interview simulation profile identity is unavailable.");
  const responsesByStage = parseResponses(details.responsesByStage);
  const stageCompleteness = completeness(responsesByStage);
  if (JSON.stringify(details.stageCompleteness) !== JSON.stringify(stageCompleteness)) throw new Error("Completed Design Interview simulation completeness evidence is inconsistent.");
  const operation = await getTrainingLifecycleUseCases().getSimulationOperationState(session);
  const reviewConflict = simulationHasReviewConflict(operation);
  return Object.freeze({ sessionId, trackId: session.trackId, profile, responsesByStage, stageCompleteness, completedAt: result.completedAt, ...(reviewConflict ? { reviewConflict: true as const } : {}) });
}

async function requireActiveSimulation(): Promise<TrainingSession> {
  const session = await loadActiveTrainingSession();
  if (!session || session.status !== "active" || session.modeId !== "design-interview-simulation") throw new Error("No active Design Interview simulation is available.");
  return session;
}
function parseResponses(value: unknown): Readonly<Record<DesignSimulationStage, string>> {
  const source = value === undefined ? {} : value;
  if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("Design Interview stage responses are invalid.");
  const record = source as Record<string, unknown>;
  if (Object.keys(record).some((key) => !STAGE_IDS.includes(key as DesignSimulationStage)) || STAGE_IDS.some((stageId) => record[stageId] !== undefined && typeof record[stageId] !== "string")) throw new Error("Design Interview stage response identities are invalid.");
  return Object.freeze(Object.fromEntries(STAGE_IDS.map((stageId) => [stageId, record[stageId] ?? ""])) as Record<DesignSimulationStage, string>);
}
function completeness(responses: Readonly<Record<DesignSimulationStage, string>>) { return Object.freeze(Object.fromEntries(STAGE_IDS.map((stageId) => [stageId, responses[stageId].trim().length > 0])) as Record<DesignSimulationStage, boolean>); }
