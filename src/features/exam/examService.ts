import { EXAM_DURATION_MINUTES } from "../../constants";
import { CLOUD_CERTIFICATION_TRACK_ID, createTrainingAttempt, createTrainingSession, type TrainingAttempt } from "../../domain";
import { addReviewQueueItems, addTrainingAttempt, addTrainingSession, clearCertificationExam, getCertificationExam, getQuestions, saveCertificationExam, saveTrainingSessions, getTrainingSessions } from "../../storage";
import { certificationContentCatalog, createCertificationReviewEntry, scoreCertificationQuestion, type CertificationExamSummaryViewModel, type CertificationExamViewModel, type CertificationQuestion, type CertificationResponse } from "../../tracks/cloud-certification";
import { buildQuestionBankSummary } from "../questions/questionBankStats";
import { buildExamQuestionViewsFromSession, selectExamQuestions } from "./examGeneration";
import { buildExamSummaryViewModel, scoreExamSession } from "./scoringService";

export type ExamGenerationResult = { ok: true; session: CertificationExamViewModel } | { ok: false; reason: string };
export type ExamQuestionView = CertificationQuestion & { shuffledOptions: CertificationQuestion["options"] };
function createId(prefix: string): string { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

export function getRemainingSeconds(runtime: CertificationExamViewModel, now = Date.now()): number { return Math.max(0, Math.ceil((new Date(runtime.examState.deadlineAt).getTime() - now) / 1000)); }
export function isExamExpired(runtime: CertificationExamViewModel, now = Date.now()): boolean { return getRemainingSeconds(runtime, now) <= 0; }

export async function createExamSession(): Promise<ExamGenerationResult> {
  const questions = await getQuestions();
  if (!buildQuestionBankSummary(questions).examReady) return { ok: false, reason: "The question bank does not have enough questions for the exam blueprint." };
  const selection = selectExamQuestions(questions);
  if (!selection.ok) return { ok: false, reason: "The question bank does not have enough questions for the exam blueprint." };
  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + EXAM_DURATION_MINUTES * 60 * 1000).toISOString();
  const session = createTrainingSession({ id: createId("exam"), trackId: CLOUD_CERTIFICATION_TRACK_ID, modeId: "cloud-exam-simulation", requestedLength: selection.questions.length, actualLength: selection.questions.length, itemOrder: selection.questions.map((question) => certificationContentCatalog.toContentItemRef(question)), optionOrderByItem: selection.optionOrderByQuestionId, activeForegroundMs: 0, contentVersion: certificationContentCatalog.getContentVersion(), status: "active", startedAt: startedAt.toISOString() });
  const runtime: CertificationExamViewModel = { session, examState: { sessionId: session.id, deadlineAt, responsesByItemId: {}, flaggedItemIds: [], currentItemId: session.itemOrder[0]?.itemId } };
  await Promise.all([saveCertificationExam(runtime), addTrainingSession(session)]);
  return { ok: true, session: runtime };
}

export function buildExamQuestionViews(runtime: CertificationExamViewModel, questions: readonly CertificationQuestion[]): ExamQuestionView[] { return buildExamQuestionViewsFromSession(runtime, questions); }
export async function updateCurrentQuestionIndex(index: number): Promise<CertificationExamViewModel | null> {
  const runtime = await getCertificationExam(); if (!runtime) return null;
  const bounded = Math.max(0, Math.min(index, runtime.session.itemOrder.length - 1));
  const next = { ...runtime, examState: { ...runtime.examState, currentItemId: runtime.session.itemOrder[bounded]?.itemId } };
  await saveCertificationExam(next); return next;
}
export async function updateExamAnswer(itemId: string, selectedOptionIds: string[]): Promise<CertificationExamViewModel | null> {
  const runtime = await getCertificationExam(); if (!runtime) return null;
  const responses = { ...runtime.examState.responsesByItemId };
  if (selectedOptionIds.length === 0) delete responses[itemId]; else responses[itemId] = { kind: "option_selection", selectedOptionIds };
  const next = { ...runtime, examState: { ...runtime.examState, responsesByItemId: responses } };
  await saveCertificationExam(next); return next;
}
export async function toggleExamFlag(itemId: string): Promise<CertificationExamViewModel | null> {
  const runtime = await getCertificationExam(); if (!runtime) return null;
  const flagged = new Set(runtime.examState.flaggedItemIds); flagged.has(itemId) ? flagged.delete(itemId) : flagged.add(itemId);
  const next = { ...runtime, examState: { ...runtime.examState, flaggedItemIds: [...flagged] } };
  await saveCertificationExam(next); return next;
}

export async function submitCertificationExam(autoSubmitted = false): Promise<CertificationExamSummaryViewModel | null> {
  const runtime = await getCertificationExam(); if (!runtime) return null;
  const questions = buildExamQuestionViews(runtime, await getQuestions());
  const completedAt = new Date().toISOString();
  const score = scoreExamSession(runtime, questions, completedAt);
  const attempts: TrainingAttempt<CertificationResponse>[] = [];
  for (const question of questions) {
    const response = runtime.examState.responsesByItemId[question.id];
    if (!response) continue;
    const result = scoreCertificationQuestion(question, response);
    const attempt = createTrainingAttempt({ id: createId(autoSubmitted ? "auto-answer" : "exam-answer"), sessionId: runtime.session.id, trackId: CLOUD_CERTIFICATION_TRACK_ID, modeId: runtime.session.modeId, item: certificationContentCatalog.toContentItemRef(question), response, result, reviewEvidence: { sourceItem: certificationContentCatalog.toContentItemRef(question), taxonomyOrSkillRefs: [{ axisId: "cloud-domain", nodeId: question.domain }, ...question.tags.map((tag) => ({ axisId: "tag", nodeId: tag }))] }, answeredAt: completedAt, committedAt: completedAt });
    attempts.push(attempt); await addTrainingAttempt(attempt);
    const review = createCertificationReviewEntry(attempt); if (review) await addReviewQueueItems([review]);
  }
  const completedSession = createTrainingSession({ ...runtime.session, status: "completed", completedAt });
  const sessions = await getTrainingSessions();
  await saveTrainingSessions([completedSession, ...sessions.value.filter((session) => session.id !== completedSession.id)]);
  const durationSeconds = Math.max(0, Math.round((Date.parse(completedAt) - Date.parse(runtime.session.startedAt)) / 1000));
  const summary = buildExamSummaryViewModel({ id: runtime.session.id, runtime, completedAt, durationSeconds, score });
  await clearCertificationExam();
  return summary;
}
