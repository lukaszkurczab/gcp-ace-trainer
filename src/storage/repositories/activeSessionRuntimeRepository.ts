import type { CertificationExamViewModel } from "../../tracks/cloud-certification";
import { STORAGE_KEYS } from "../keys";
import { isTrainingSession } from "./trainingModelGuards";
import { readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";

/**
 * A family-owned active-session runtime envelope. The repository validates
 * only record shape and ownership; it never scores or interprets answers.
 */
export type ActiveSessionRuntime = CertificationExamViewModel;

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean { return Object.keys(value).every((key) => allowed.includes(key)); }
function isActiveSessionRuntime(value: unknown): value is ActiveSessionRuntime {
  // `examState` is family-owned opaque payload. Its family runtime validates
  // it before use; this repository only validates the canonical session link.
  return isRecord(value) && hasOnlyKeys(value, ["session", "examState"]) && isTrainingSession(value.session) && isRecord(value.examState);
}

export async function getActiveSessionRuntime(): Promise<ActiveSessionRuntime | null> { return readCanonicalJson(STORAGE_KEYS.ACTIVE_SESSION_RUNTIME, isActiveSessionRuntime); }
export async function saveActiveSessionRuntime(runtime: ActiveSessionRuntime, expectedRevision?: number | null): Promise<void> { writeCanonicalJson(STORAGE_KEYS.ACTIVE_SESSION_RUNTIME, runtime, expectedRevision); }
export async function clearActiveSessionRuntime(): Promise<void> { removeCanonicalValue(STORAGE_KEYS.ACTIVE_SESSION_RUNTIME); }
