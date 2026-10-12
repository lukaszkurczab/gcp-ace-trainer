import { buildCertificationExamSummaries, buildCertificationPracticeHistory, type CertificationExamSummaryViewModel, type CertificationPracticeAnswerViewModel } from "../tracks/certification";
import { contentPackageRuntimeOwner } from "../application/contentPackageRuntimeOwner";
import { getTrainingAttempts, getTrainingSessions } from "./repositories";
import type { TrackAdmissionContext } from "../domain/tracks/trackAdmissionContext";
const resolveCertificationItem = (ref: Parameters<typeof contentPackageRuntimeOwner.resolveItem>[0]) => contentPackageRuntimeOwner.resolveItem(ref);
export async function getAttempts(admission: TrackAdmissionContext): Promise<CertificationExamSummaryViewModel[]> { const [sessions, attempts] = await Promise.all([getTrainingSessions(admission), getTrainingAttempts(admission)]); return await buildCertificationExamSummaries(sessions.value, attempts.value, resolveCertificationItem); }
export async function getPracticeHistory(admission: TrackAdmissionContext): Promise<CertificationPracticeAnswerViewModel[]> { return await buildCertificationPracticeHistory((await getTrainingAttempts(admission)).value, resolveCertificationItem); }
