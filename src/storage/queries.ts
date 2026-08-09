import { buildCertificationExamSummaries, buildCertificationPracticeHistory, type CertificationExamSummaryViewModel, type CertificationPracticeAnswerViewModel } from "../tracks/certification";
import type { CertificationQuestion } from "../tracks/certification";
import { contentPackageRuntimeOwner } from "../application/contentPackageRuntimeOwner";
import { getTrainingAttempts, getTrainingSessions } from "./repositories";
const resolveCertificationItem = (ref: Parameters<typeof contentPackageRuntimeOwner.resolveItem>[0]) => contentPackageRuntimeOwner.resolveItem<CertificationQuestion>(ref);
export async function getAttempts(): Promise<CertificationExamSummaryViewModel[]> { const [sessions, attempts] = await Promise.all([getTrainingSessions(), getTrainingAttempts()]); return await buildCertificationExamSummaries(sessions.value, attempts.value, resolveCertificationItem); }
export async function getPracticeHistory(): Promise<CertificationPracticeAnswerViewModel[]> { return await buildCertificationPracticeHistory((await getTrainingAttempts()).value, resolveCertificationItem); }
