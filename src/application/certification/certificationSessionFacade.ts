import { getCertificationContentCatalog } from "../../content/catalogRepository";
import type { TrainingSession, TrainingSessionDraft } from "../../domain";
import { loadActiveTrainingSession, loadActiveTrainingSessionDraft, loadTrainingAttempts } from "../learningReadModels";
import { getTrainingLifecycleUseCases, startTrainingSession, type PreparedSession } from "../trainingLifecycle";
import type { CertificationQuestion, CertificationResponse } from "../../tracks/cloud-certification";

let sequence = 0;
const nextSessionId = (modeId: string) => `certification:${modeId}:${++sequence}`;

export type CertificationPracticeProjection = Readonly<{
  session: TrainingSession;
  question: CertificationQuestion;
  occurrenceId: string;
  ordinal: number;
  total: number;
  committedResponse: CertificationResponse | null;
}>;
export type CertificationExamProjection = Readonly<{
  session: TrainingSession;
  draft: TrainingSessionDraft;
  question: CertificationQuestion;
  occurrenceId: string;
  ordinal: number;
  total: number;
  response: CertificationResponse | null;
  now: string;
}>;

/** A terminal Exam is a valid outcome, not a request to start a replacement session. */
export class CertificationExamExpiredError extends Error {
  constructor(readonly sessionId: string) {
    super("The Cloud exam reached its immutable deadline and was finalized.");
    this.name = "CertificationExamExpiredError";
  }
}

export async function startCertificationSession(input: Readonly<{ modeId: "cloud-practice" | "cloud-review"; requestedLength?: number; domain?: "setup_environment" | "planning_implementation" | "access_security" | "operations"; source?: string }>): Promise<PreparedSession> {
  return startTrainingSession({ trackId: "cloud-certification", modeId: input.modeId, source: input.source, request: { ...input, sessionId: nextSessionId(input.modeId) } });
}
export async function startCertificationExam(source = "practiceHub"): Promise<PreparedSession> {
  return startTrainingSession({ trackId: "cloud-certification", modeId: "cloud-exam-simulation", source, request: { sessionId: nextSessionId("cloud-exam-simulation") } });
}
export async function getCertificationPracticeProjection(): Promise<CertificationPracticeProjection> {
  const [session, attempts] = await Promise.all([requireActive(), loadTrainingAttempts()]);
  if (session.modeId === "cloud-exam-simulation") throw new Error("The active Cloud session is an exam simulation.");
  const occurrence = session.itemOrder[session.currentItemIndex];
  if (!occurrence) throw new Error("Cloud practice occurrence is unavailable.");
  const committed = attempts.value.find((attempt) => attempt.sessionId === session.id && attempt.occurrenceId === occurrence.occurrenceId)?.response ?? null;
  return Object.freeze({ session, question: getCertificationContentCatalog().getItemById(occurrence.item.itemId), occurrenceId: occurrence.occurrenceId, ordinal: session.currentItemIndex + 1, total: session.actualLength, committedResponse: committed as CertificationResponse | null });
}
export async function submitCertificationPracticeResponse(response: CertificationResponse): Promise<void> { await getTrainingLifecycleUseCases().submitPracticeResponse(response); }
export async function advanceCertificationPracticeSession(): Promise<TrainingSession> { return getTrainingLifecycleUseCases().advancePracticeSession(); }
export async function completeCertificationPracticeSession() { return getTrainingLifecycleUseCases().completeActivePracticeSession(); }
export async function abandonCertificationSession(): Promise<TrainingSession> { return getTrainingLifecycleUseCases().abandonActiveSession(); }

export async function getCertificationExamProjection(): Promise<CertificationExamProjection> {
  await assertCertificationExamIsActive();
  const [session, draft] = await Promise.all([requireActive(), loadActiveTrainingSessionDraft()]);
  if (session.modeId !== "cloud-exam-simulation" || !draft || draft.sessionId !== session.id) throw new Error("The active Cloud exam draft is unavailable.");
  const occurrence = session.itemOrder[session.currentItemIndex];
  if (!occurrence) throw new Error("Cloud exam occurrence is unavailable.");
  const raw = draft.responsesByOccurrenceId[occurrence.occurrenceId] ?? null;
  return Object.freeze({ session, draft, question: getCertificationContentCatalog().getItemById(occurrence.item.itemId), occurrenceId: occurrence.occurrenceId, ordinal: session.currentItemIndex + 1, total: session.actualLength, response: raw as CertificationResponse | null, now: getTrainingLifecycleUseCases().currentTime() });
}
export async function saveCertificationExamResponse(input: Readonly<{ occurrenceId: string; response: CertificationResponse }>): Promise<void> {
  await assertCertificationExamIsActive();
  const projection = await getCertificationExamProjection();
  if (projection.occurrenceId !== input.occurrenceId) throw new Error("Cloud exam response does not belong to the active occurrence.");
  const draft = { ...projection.draft, revision: projection.draft.revision + 1, updatedAt: getTrainingLifecycleUseCases().currentTime(), responsesByOccurrenceId: { ...projection.draft.responsesByOccurrenceId, [input.occurrenceId]: input.response } } as TrainingSessionDraft;
  await getTrainingLifecycleUseCases().saveSimulationDraft({ draft, expectedPreviousRevision: projection.draft.revision });
}
export async function navigateCertificationExamTo(index: number): Promise<TrainingSession> { await assertCertificationExamIsActive(); return getTrainingLifecycleUseCases().moveSimulationSessionTo(index); }
export async function finalizeCertificationExam(): Promise<string> {
  const lifecycle = getTrainingLifecycleUseCases();
  const expiredSessionId = await lifecycle.finalizeExpiredSimulationIfDue();
  if (expiredSessionId) return expiredSessionId;
  const session = await requireActive();
  await lifecycle.finalizeSimulation();
  return session.id;
}
export async function resumeCertificationSession(): Promise<TrainingSession> { return getTrainingLifecycleUseCases().resumeActiveSession(); }

async function assertCertificationExamIsActive(): Promise<void> {
  const expiredSessionId = await getTrainingLifecycleUseCases().finalizeExpiredSimulationIfDue();
  if (expiredSessionId) throw new CertificationExamExpiredError(expiredSessionId);
}

async function requireActive(): Promise<TrainingSession> {
  const session = await loadActiveTrainingSession();
  if (!session || session.trackId !== "cloud-certification") throw new Error("No active Cloud Certification session is available.");
  return session;
}
