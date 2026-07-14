import { buildCertificationExamSummaries, buildCertificationPracticeHistory, type CertificationExamSummaryViewModel, type CertificationPracticeAnswerViewModel } from "../tracks/cloud-certification";
import { getTrainingAttempts, getTrainingSessions } from "./repositories";
export async function getAttempts(): Promise<CertificationExamSummaryViewModel[]> { const [sessions, attempts] = await Promise.all([getTrainingSessions(), getTrainingAttempts()]); return buildCertificationExamSummaries(sessions.value, attempts.value); }
export async function getPracticeHistory(): Promise<CertificationPracticeAnswerViewModel[]> { return buildCertificationPracticeHistory((await getTrainingAttempts()).value); }
