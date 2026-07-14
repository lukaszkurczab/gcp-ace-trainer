import type { CertificationExamViewModel } from "../../tracks/cloud-certification";
import { STORAGE_KEYS } from "../keys";
import { readStoredJson, removeStoredValue, writeStoredJson } from "../storageCodec";
import { isTrainingSession } from "./trainingModelGuards";

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isExam(value: unknown): value is CertificationExamViewModel { return isRecord(value) && isTrainingSession(value.session) && isRecord(value.examState) && value.examState.sessionId === value.session.id && typeof value.examState.deadlineAt === "string" && isRecord(value.examState.responsesByItemId) && Array.isArray(value.examState.flaggedItemIds) && value.examState.flaggedItemIds.every((id) => typeof id === "string"); }
export async function getCertificationExam(): Promise<CertificationExamViewModel | null> { return readStoredJson(STORAGE_KEYS.ACTIVE_CERTIFICATION_EXAM, isExam); }
export async function saveCertificationExam(exam: CertificationExamViewModel): Promise<void> { writeStoredJson(STORAGE_KEYS.ACTIVE_CERTIFICATION_EXAM, exam); }
export async function clearCertificationExam(): Promise<void> { removeStoredValue(STORAGE_KEYS.ACTIVE_CERTIFICATION_EXAM); }
