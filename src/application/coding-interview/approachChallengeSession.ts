import { createResolvedContentRef, type ResolvedContentRef } from "../../domain/learning/resolvedContentRef";
import {
  APPROACH_CHALLENGE_TRACK_ID,
  validateApproachChallengeProblem,
  validateApproachChallengeProblemRef,
  type ApproachChallengeProblem,
  type ApproachChallengeProblemRef,
} from "../../content/canonical/approachChallengeProblem";
import { APPROACH_CHALLENGE_MODE_ID } from "../../tracks/coding-interview/domain/algorithmModes";

export const APPROACH_CHALLENGE_MANIFEST_KEY = "approachChallengeManifestV1" as const;
export const APPROACH_CHALLENGE_MANIFEST_VERSION = 1 as const;

export type ApproachChallengeManifestEntry = Readonly<{
  problemRef: ApproachChallengeProblemRef;
  primaryFamilyId: string;
  requiredFamilyIds: readonly string[];
  difficulty: "easy" | "medium" | "hard";
  approachOccurrenceId: string;
  complexityOccurrenceId: string;
}>;

export type ApproachChallengeManifest = Readonly<{
  schemaVersion: typeof APPROACH_CHALLENGE_MANIFEST_VERSION;
  modeId: typeof APPROACH_CHALLENGE_MODE_ID;
  accessAtStart: "free" | "premium";
  admissionGrant: "session_start";
  requestedProblemCount: 5 | 10 | 20;
  actualProblemCount: number;
  shortenedConfirmed: boolean;
  entries: readonly ApproachChallengeManifestEntry[];
}>;

export type ApproachChallengeMethodRevealProjection = Readonly<{
  analyzedApproachId: string;
  methodReveal: ApproachChallengeProblem["methodReveal"];
}> | null;
export type ApproachChallengeManifestIntegrityProjection = Readonly<{
  manifestIntegrity: "verified" | "unavailable";
  problemCount: number | null;
}>;

export function isApproachChallengeStageOperationResolved(operation: Readonly<{ kind: string }>): boolean {
  return operation.kind === "unanswered" || operation.kind === "feedback";
}

/** Q1's durable result keeps its method visible while Q2 is active or restored after relaunch. */
export function projectApproachChallengeMethodReveal(
  problem: ApproachChallengeProblem,
  approachAccepted: boolean,
): ApproachChallengeMethodRevealProjection {
  return approachAccepted ? Object.freeze({ analyzedApproachId: problem.analyzedApproachId, methodReveal: problem.methodReveal }) : null;
}

export function projectApproachChallengeManifestIntegrity(value: unknown, pin: Readonly<{ contentVersion: string; artifactSha256: string }>): ApproachChallengeManifestIntegrityProjection {
  try {
    const manifest = decodeApproachChallengeManifest(value, pin);
    return Object.freeze({ manifestIntegrity: "verified", problemCount: manifest.actualProblemCount });
  } catch {
    return Object.freeze({ manifestIntegrity: "unavailable", problemCount: null });
  }
}

export function encodeApproachChallengeManifest(manifest: ApproachChallengeManifest): string {
  validateApproachChallengeManifest(manifest, { contentVersion: manifest.entries[0]?.problemRef.contentVersion ?? "", artifactSha256: manifest.entries[0]?.problemRef.artifactSha256 ?? "" });
  return JSON.stringify(manifest);
}

export function decodeApproachChallengeManifest(value: unknown, pin: Readonly<{ contentVersion: string; artifactSha256: string }>): ApproachChallengeManifest {
  if (typeof value !== "string") throw new Error("Approach Challenge session manifest is unavailable.");
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { throw new Error("Approach Challenge session manifest is corrupt."); }
  validateApproachChallengeManifest(parsed, pin);
  return parsed as ApproachChallengeManifest;
}

export function validateApproachChallengeManifest(value: unknown, pin: Readonly<{ contentVersion: string; artifactSha256: string }>): asserts value is ApproachChallengeManifest {
  if (!isRecord(value) || !hasExactKeys(value, ["schemaVersion", "modeId", "accessAtStart", "admissionGrant", "requestedProblemCount", "actualProblemCount", "shortenedConfirmed", "entries"]) ||
    value.schemaVersion !== APPROACH_CHALLENGE_MANIFEST_VERSION || value.modeId !== APPROACH_CHALLENGE_MODE_ID ||
    (value.accessAtStart !== "free" && value.accessAtStart !== "premium") || value.admissionGrant !== "session_start" ||
    ![5, 10, 20].includes(Number(value.requestedProblemCount)) || !Number.isSafeInteger(value.actualProblemCount) || Number(value.actualProblemCount) < 1 || Number(value.actualProblemCount) > Number(value.requestedProblemCount) ||
    typeof value.shortenedConfirmed !== "boolean" || (Number(value.actualProblemCount) < Number(value.requestedProblemCount) && value.shortenedConfirmed !== true) ||
    !Array.isArray(value.entries) || value.entries.length !== value.actualProblemCount) {
    throw new Error("Approach Challenge session manifest is invalid.");
  }
  const seen = new Set<string>();
  const seenOccurrences = new Set<string>();
  for (const entry of value.entries) {
    if (!isRecord(entry) || !hasExactKeys(entry, ["problemRef", "primaryFamilyId", "requiredFamilyIds", "difficulty", "approachOccurrenceId", "complexityOccurrenceId"]) ||
      typeof entry.primaryFamilyId !== "string" || !entry.primaryFamilyId.trim() || !Array.isArray(entry.requiredFamilyIds) || entry.requiredFamilyIds.length === 0 ||
      entry.requiredFamilyIds.some((id) => typeof id !== "string" || !id.trim()) || new Set(entry.requiredFamilyIds).size !== entry.requiredFamilyIds.length || !entry.requiredFamilyIds.includes(entry.primaryFamilyId) ||
      !["easy", "medium", "hard"].includes(String(entry.difficulty)) || typeof entry.approachOccurrenceId !== "string" || !entry.approachOccurrenceId.trim() ||
      typeof entry.complexityOccurrenceId !== "string" || !entry.complexityOccurrenceId.trim() || entry.approachOccurrenceId === entry.complexityOccurrenceId ||
      !isProblemRef(entry.problemRef) || entry.problemRef.contentVersion !== pin.contentVersion || entry.problemRef.artifactSha256 !== pin.artifactSha256 ||
      entry.problemRef.approachQuestionId === entry.problemRef.complexityQuestionId) {
      throw new Error("Approach Challenge session manifest contains an invalid pair.");
    }
    if (seen.has(entry.problemRef.problemId) || seenOccurrences.has(entry.approachOccurrenceId) || seenOccurrences.has(entry.complexityOccurrenceId)) throw new Error("Approach Challenge session manifest contains duplicate task or occurrence IDs.");
    seen.add(entry.problemRef.problemId);
    seenOccurrences.add(entry.approachOccurrenceId);
    seenOccurrences.add(entry.complexityOccurrenceId);
  }
}

/** Resolves the immutable content behind a session pin; never falls back to a newer artifact. */
export function resolveManifestEntryProblem(
  manifestEntry: ApproachChallengeManifestEntry,
  resolver: (problemId: string, problemVersion: string) => ApproachChallengeProblem | undefined,
  session: Readonly<{ contentVersion: string; artifactSha256: string }>,
): ApproachChallengeProblem {
  const problem = resolver(manifestEntry.problemRef.problemId, manifestEntry.problemRef.problemVersion);
  if (!problem || validateApproachChallengeProblem(problem).length > 0 ||
    validateApproachChallengeProblemRef(manifestEntry.problemRef, problem, session).length > 0 ||
    manifestEntry.problemRef.contentVersion !== session.contentVersion || manifestEntry.problemRef.artifactSha256 !== session.artifactSha256 ||
    problem.analyzedApproachId !== manifestEntry.problemRef.analyzedApproachId) {
    throw new Error("The exact pinned Approach Challenge task is unavailable.");
  }
  return problem;
}

export function approachChallengeStageForOccurrence(manifest: ApproachChallengeManifest, occurrenceId: string): Readonly<{ entry: ApproachChallengeManifestEntry; stage: "approach" | "complexity"; problemIndex: number }> | undefined {
  for (const [problemIndex, entry] of manifest.entries.entries()) {
    if (entry.approachOccurrenceId === occurrenceId) return Object.freeze({ entry, stage: "approach", problemIndex });
    if (entry.complexityOccurrenceId === occurrenceId) return Object.freeze({ entry, stage: "complexity", problemIndex });
  }
  return undefined;
}

export function approachChallengeOccurrenceRef(questionId: string, pin: Readonly<{ contentVersion: string; artifactSha256: string }>): ResolvedContentRef {
  return createResolvedContentRef({ trackId: APPROACH_CHALLENGE_TRACK_ID, questionId, contentVersion: pin.contentVersion, artifactSha256: pin.artifactSha256 });
}

function isProblemRef(value: unknown): value is ApproachChallengeProblemRef {
  return isRecord(value) && hasExactKeys(value, ["trackId", "problemId", "problemVersion", "contentVersion", "artifactSha256", "approachQuestionId", "complexityQuestionId", "analyzedApproachId"]) &&
    value.trackId === APPROACH_CHALLENGE_TRACK_ID && Object.values(value).every((entry) => typeof entry === "string" && entry.trim().length > 0);
}
function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean { return Object.keys(value).sort().join("\0") === [...expected].sort().join("\0"); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
