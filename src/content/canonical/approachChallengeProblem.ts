import { isCanonicalSafeIdentity } from "../../domain/identity/canonicalIdentity";
import type { ApproachChoiceQuestion } from "./interactions/approachChoice";
import type { ChoiceSingleQuestion } from "./interactions/choiceSingle";
import { canonicalInteractionRegistry } from "./interactions/registry";
import { record } from "./interactions/validation";

export const APPROACH_CHALLENGE_SCHEMA_VERSION = "approach-challenge-problem-v1" as const;
export const APPROACH_CHALLENGE_TRACK_ID = "coding-interview-dsa-problem-solving" as const;
export type ApproachChallengeDifficulty = "easy" | "medium" | "hard";

export type ApproachChallengeProblem = Readonly<{
  schemaVersion: typeof APPROACH_CHALLENGE_SCHEMA_VERSION;
  problemId: string;
  problemVersion: string;
  trackId: typeof APPROACH_CHALLENGE_TRACK_ID;
  primaryFamilyId: string;
  requiredFamilyIds: readonly string[];
  difficulty: ApproachChallengeDifficulty;
  approachQuestion: ApproachChoiceQuestion;
  complexityQuestion: ChoiceSingleQuestion;
  analyzedApproachId: string;
  methodReveal: Readonly<{ title: string; description: string }>;
}>;

/** Exact point-in-time address for a complete, immutable two-stage problem. */
export type ApproachChallengeProblemRef = Readonly<{
  trackId: typeof APPROACH_CHALLENGE_TRACK_ID;
  problemId: string;
  problemVersion: string;
  contentVersion: string;
  artifactSha256: string;
  approachQuestionId: string;
  complexityQuestionId: string;
  analyzedApproachId: string;
}>;

const isId = (value: unknown): value is string => typeof value === "string" && isCanonicalSafeIdentity(value);
const hasText = (value: unknown): value is string => typeof value === "string" && /[^\u0009-\u000D\u001C-\u001F\u0020\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/u.test(value);
const isVersion = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(value);
const isSha256 = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);

export function validateApproachChallengeProblem(value: unknown): readonly string[] {
  const errors: string[] = [];
  const keys = ["schemaVersion", "problemId", "problemVersion", "trackId", "primaryFamilyId", "requiredFamilyIds", "difficulty", "approachQuestion", "complexityQuestion", "analyzedApproachId", "methodReveal"];
  if (!record(value)) return Object.freeze(["problem: must be an object"]);
  for (const key of keys) if (!Object.hasOwn(value, key)) errors.push(`problem.${key}: is required`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) errors.push(`problem.${key}: is not allowed`);
  if (value.schemaVersion !== APPROACH_CHALLENGE_SCHEMA_VERSION) errors.push("problem.schemaVersion: unsupported version");
  if (!isId(value.problemId)) errors.push("problem.problemId: invalid stable identity");
  if (!isVersion(value.problemVersion)) errors.push("problem.problemVersion: invalid version");
  if (value.trackId !== APPROACH_CHALLENGE_TRACK_ID) errors.push("problem.trackId: foreign track");
  if (!isId(value.primaryFamilyId)) errors.push("problem.primaryFamilyId: invalid identity");
  if (!Array.isArray(value.requiredFamilyIds) || value.requiredFamilyIds.length === 0) errors.push("problem.requiredFamilyIds: must be a non-empty array");
  else {
    const ids = value.requiredFamilyIds;
    if (ids.some((entry) => !isId(entry))) errors.push("problem.requiredFamilyIds: contains an invalid identity");
    if (new Set(ids).size !== ids.length) errors.push("problem.requiredFamilyIds: contains duplicate identities");
    if (typeof value.primaryFamilyId === "string" && !ids.includes(value.primaryFamilyId)) errors.push("problem.requiredFamilyIds: must include primaryFamilyId");
  }
  if (value.difficulty !== "easy" && value.difficulty !== "medium" && value.difficulty !== "hard") errors.push("problem.difficulty: unsupported value");
  const approachErrors = canonicalInteractionRegistry.validate(value.approachQuestion);
  errors.push(...approachErrors.map((entry) => `problem.approachQuestion.${entry.replace(/^question\.?/u, "")}`));
  const complexityErrors = canonicalInteractionRegistry.validate(value.complexityQuestion);
  errors.push(...complexityErrors.map((entry) => `problem.complexityQuestion.${entry.replace(/^question\.?/u, "")}`));
  const approach = value.approachQuestion;
  const complexity = value.complexityQuestion;
  if (record(approach) && record(approach.interaction) && approach.interaction.type !== "approach_choice") errors.push("problem.approachQuestion.interaction.type: must be approach_choice");
  if (record(complexity) && record(complexity.interaction) && complexity.interaction.type !== "choice_single") errors.push("problem.complexityQuestion.interaction.type: must be choice_single");
  if (record(approach) && record(complexity)) {
    if (approach.questionId === complexity.questionId) errors.push("problem.complexityQuestion.questionId: must differ from approachQuestion.questionId");
    for (const key of ["trackId", "nodeId", "mentalUnitId", "difficulty"]) if (approach[key] !== complexity[key]) errors.push(`problem.questions.${key}: both stages must match`);
    if (approach.trackId !== APPROACH_CHALLENGE_TRACK_ID || complexity.trackId !== APPROACH_CHALLENGE_TRACK_ID) errors.push("problem.questions.trackId: foreign track");
  }
  if (!isId(value.analyzedApproachId)) errors.push("problem.analyzedApproachId: invalid stable identity");
  else if (record(approach) && record(approach.interaction) && Array.isArray(approach.interaction.options) && !approach.interaction.options.some((option) => record(option) && option.approachId === value.analyzedApproachId && option.grade === "correct")) errors.push("problem.analyzedApproachId: must reference a correct approach option");
  if (!record(value.methodReveal)) errors.push("problem.methodReveal: must be an object");
  else {
    const revealKeys = ["title", "description"];
    for (const key of revealKeys) if (!Object.hasOwn(value.methodReveal, key)) errors.push(`problem.methodReveal.${key}: is required`);
    for (const key of Object.keys(value.methodReveal)) if (!revealKeys.includes(key)) errors.push(`problem.methodReveal.${key}: is not allowed`);
    if (!hasText(value.methodReveal.title)) errors.push("problem.methodReveal.title: must contain text");
    if (!hasText(value.methodReveal.description)) errors.push("problem.methodReveal.description: must contain text");
    if (typeof value.methodReveal.description === "string" && /\bO\s*\(/u.test(value.methodReveal.description)) errors.push("problem.methodReveal.description: must not reveal Big-O before stage two");
  }
  return Object.freeze(errors);
}

export function validateApproachChallengeProblemRef(value: unknown, problem: ApproachChallengeProblem, pin: Readonly<{ contentVersion: string; artifactSha256: string }>): readonly string[] {
  const errors: string[] = [];
  const keys = ["trackId", "problemId", "problemVersion", "contentVersion", "artifactSha256", "approachQuestionId", "complexityQuestionId", "analyzedApproachId"];
  if (!record(value)) return Object.freeze(["problemRef: must be an object"]);
  for (const key of keys) if (!Object.hasOwn(value, key)) errors.push(`problemRef.${key}: is required`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) errors.push(`problemRef.${key}: is not allowed`);
  if (value.trackId !== problem.trackId) errors.push("problemRef.trackId: foreign reference");
  if (value.problemId !== problem.problemId || value.problemVersion !== problem.problemVersion) errors.push("problemRef: foreign problem or version");
  if (value.approachQuestionId !== problem.approachQuestion.questionId || value.complexityQuestionId !== problem.complexityQuestion.questionId || value.analyzedApproachId !== problem.analyzedApproachId) errors.push("problemRef: foreign stage or target reference");
  if (value.contentVersion !== pin.contentVersion || !isVersion(value.contentVersion)) errors.push("problemRef.contentVersion: does not match the pinned content version");
  if (value.artifactSha256 !== pin.artifactSha256 || !isSha256(value.artifactSha256)) errors.push("problemRef.artifactSha256: does not match the pinned artifact");
  return Object.freeze(errors);
}

export function isApproachChallengeProblem(value: unknown): value is ApproachChallengeProblem {
  return validateApproachChallengeProblem(value).length === 0;
}

export function assertApproachChallengeProblem(value: unknown): asserts value is ApproachChallengeProblem {
  const errors = validateApproachChallengeProblem(value);
  if (errors.length) throw new Error(`Approach challenge problem is invalid: ${errors.join("; ")}`);
}

