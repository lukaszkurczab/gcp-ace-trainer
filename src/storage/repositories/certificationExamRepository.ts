import type { CertificationExamViewModel } from "../../tracks/cloud-certification";
import { STORAGE_KEYS } from "../keys";
import { readStoredJson, removeStoredValue, writeStoredJson } from "../storageCodec";
import { isTrainingSession } from "./trainingModelGuards";

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean { return Object.keys(value).every((key) => allowed.includes(key)); }
function isNonEmptyString(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function isTimestamp(value: unknown): value is string { return isNonEmptyString(value) && !Number.isNaN(Date.parse(value)); }
function isResponse(value: unknown): boolean { return isRecord(value) && hasOnlyKeys(value, ["kind", "selectedOptionIds"]) && value.kind === "option_selection" && Array.isArray(value.selectedOptionIds) && value.selectedOptionIds.every(isNonEmptyString); }
export function isCertificationExam(value: unknown): value is CertificationExamViewModel { return isRecord(value) && hasOnlyKeys(value, ["session", "examState"]) && isTrainingSession(value.session) && isRecord(value.examState) && hasOnlyKeys(value.examState, ["sessionId", "profileId", "deadlineAt", "responsesByItemId", "flaggedItemIds"]) && value.examState.sessionId === value.session.id && (value.examState.profileId === undefined || isNonEmptyString(value.examState.profileId)) && isTimestamp(value.examState.deadlineAt) && isRecord(value.examState.responsesByItemId) && Object.values(value.examState.responsesByItemId).every(isResponse) && Array.isArray(value.examState.flaggedItemIds) && value.examState.flaggedItemIds.every(isNonEmptyString); }
export async function getCertificationExam(): Promise<CertificationExamViewModel | null> { return readStoredJson(STORAGE_KEYS.ACTIVE_CERTIFICATION_EXAM, isCertificationExam); }
export async function saveCertificationExam(exam: CertificationExamViewModel): Promise<void> { writeStoredJson(STORAGE_KEYS.ACTIVE_CERTIFICATION_EXAM, exam); }
export async function clearCertificationExam(): Promise<void> { removeStoredValue(STORAGE_KEYS.ACTIVE_CERTIFICATION_EXAM); }
