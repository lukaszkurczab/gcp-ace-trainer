import { validateCaseRecipe, CLAUDE_CASE_TRACK } from "../caseRecipe";
import { hasCanonicalEdgeWhitespace, isCanonicalSafeIdentity } from "../../../domain/identity/canonicalIdentity";
import type { CanonicalQuestionRelation } from "./shared";

const whitespace = new RegExp("[^\\u0009-\\u000D\\u001C-\\u001F\\u0020\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000\\uFEFF]", "u");
export type ValidationDimension = Readonly<{ dimensionId: string; values: readonly string[]; accepted: readonly string[]; aliases?: Readonly<Record<string, string>> }>;

export const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
export function exact(value: unknown, allowed: readonly string[], required: readonly string[], path: string, errors: string[]): value is Record<string, unknown> {
  if (!record(value)) { errors.push(`${path}: must be an object`); return false; }
  for (const key of required) if (!Object.hasOwn(value, key)) errors.push(`${path}.${key}: is required`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) errors.push(`${path}.${key}: is not allowed`);
  return true;
}
export function id(value: unknown, path: string, errors: string[]): value is string {
  if (typeof value !== "string" || value.length === 0 || hasCanonicalEdgeWhitespace(value)) { errors.push(`${path}: must be a non-empty, trim-clean identity`); return false; }
  return true;
}
export function safeIdentity(value: unknown, path: string, errors: string[]): value is string { if (!id(value, path, errors)) return false; if (!isCanonicalSafeIdentity(value)) { errors.push(`${path}: must not contain unsafe path segments`); return false; } return true; }
export function text(value: unknown, path: string, errors: string[]): value is string { if (typeof value !== "string" || !whitespace.test(value)) { errors.push(`${path}: must contain a non-whitespace character`); return false; } return true; }
export function uniqueIds(value: unknown, path: string, errors: string[], min: number): string[] {
  if (!Array.isArray(value)) { errors.push(`${path}: must be an array`); return []; }
  if (value.length < min) errors.push(`${path}: must contain at least ${min} item(s)`);
  const result: string[] = [];
  value.forEach((entry, index) => { if (id(entry, `${path}[${index}]`, errors)) result.push(entry); });
  if (new Set(result).size !== result.length) errors.push(`${path}: must not contain duplicates`);
  return result;
}
export function exactSet(actual: readonly string[], expected: readonly string[], path: string, errors: string[]): void {
  const a = new Set(actual), e = new Set(expected);
  if (actual.length !== expected.length || [...a].some((x) => !e.has(x)) || [...e].some((x) => !a.has(x))) errors.push(`${path}: must contain exactly the expected identities`);
}
export function json(value: unknown, path: string, errors: string[]): void {
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") { text(value, path, errors); return; }
  if (typeof value === "number") { if (!Number.isFinite(value)) errors.push(`${path}: must be a finite JSON number`); return; }
  if (Array.isArray(value)) { value.forEach((entry, index) => json(entry, `${path}[${index}]`, errors)); return; }
  if (record(value)) { Object.entries(value).forEach(([key, entry]) => json(entry, `${path}.${key}`, errors)); return; }
  errors.push(`${path}: must be a JSON value`);
}

export function validateQuestionBase(value: unknown, type: string, errors: string[]): Record<string, unknown> | null {
  const common = ["questionId", "trackId", "nodeId", "mentalUnitId", "prompt", "constraints", "interaction", "answer", "feedback", "difficulty", "sourceRefs", "contentDomainId", "questionRelation", "caseRecipe", "examMetadata"];
  if (!exact(value, common, ["questionId", "trackId", "nodeId", "mentalUnitId", "prompt", "interaction", "answer", "feedback", "difficulty"], "question", errors)) return null;
  for (const key of ["questionId", "trackId", "nodeId", "mentalUnitId"]) safeIdentity(value[key], `question.${key}`, errors);
  if (Object.hasOwn(value, "contentDomainId")) safeIdentity(value.contentDomainId, "question.contentDomainId", errors);
  if (Object.hasOwn(value, "questionRelation")) validateQuestionRelation(value.questionRelation, value.questionId, "question.questionRelation", errors);
  if (Object.hasOwn(value, "examMetadata")) {
    if (exact(value.examMetadata, ["decisionSkill", "scenarioFamilyId"], ["decisionSkill"], "question.examMetadata", errors)) {
      if (!["knowledge", "diagnosis", "prerequisite", "next_action", "contextual_choice"].includes(String(value.examMetadata.decisionSkill))) errors.push("question.examMetadata.decisionSkill: unsupported decision skill");
      if (Object.hasOwn(value.examMetadata, "scenarioFamilyId") && (safeIdentity(value.examMetadata.scenarioFamilyId, "question.examMetadata.scenarioFamilyId", errors) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value.examMetadata.scenarioFamilyId))) errors.push("question.examMetadata.scenarioFamilyId: must be a lowercase kebab-case identity");
    }
    if (value.trackId !== "claude-certified-architect-professional-certification") errors.push("question.examMetadata: available only for CCAR-P exam selection");
  }
  if (Object.hasOwn(value, "caseRecipe")) { errors.push(...validateCaseRecipe(value.caseRecipe)); if (value.trackId !== CLAUDE_CASE_TRACK) errors.push("caseRecipe: unavailable for this track"); }
  text(value.prompt, "question.prompt", errors);
  if (value.difficulty !== null) id(value.difficulty, "question.difficulty", errors);
  if (Object.hasOwn(value, "constraints")) { if (!Array.isArray(value.constraints)) errors.push("question.constraints: must be an array"); else value.constraints.forEach((entry, i) => text(entry, `question.constraints[${i}]`, errors)); }
  if (Object.hasOwn(value, "sourceRefs")) { if (!Array.isArray(value.sourceRefs)) errors.push("question.sourceRefs: must be an array"); else value.sourceRefs.forEach((entry, i) => id(entry, `question.sourceRefs[${i}]`, errors)); }
  if (!record(value.interaction) || value.interaction.type !== type) { errors.push(`question.interaction.type: expected ${type}`); return null; }
  return value;
}

export function validateChoiceOptions(interaction: Record<string, unknown>, type: string, errors: string[], allowRequiredSelectionCount = false): string[] {
  const refs: string[] = [];
  const keys = ["type", "scoringMethod", "options"];
  if (exact(interaction, allowRequiredSelectionCount ? [...keys, "requiredSelectionCount"] : keys, keys, "question.interaction", errors)) {
    if (interaction.scoringMethod !== "exact_selected_set") errors.push("question.interaction.scoringMethod: invalid method");
    if (!Array.isArray(interaction.options)) errors.push("question.interaction.options: must be an array");
    else {
      if (interaction.options.length < 2) errors.push("question.interaction.options: must contain at least two options");
      for (const [i, option] of interaction.options.entries()) if (exact(option, ["optionId", "text", "explanation"], ["optionId", "text"], `question.interaction.options[${i}]`, errors)) {
        if (id(option.optionId, `question.interaction.options[${i}].optionId`, errors)) refs.push(option.optionId);
        text(option.text, `question.interaction.options[${i}].text`, errors);
        if (Object.hasOwn(option, "explanation")) text(option.explanation, `question.interaction.options[${i}].explanation`, errors);
      }
      if (new Set(refs).size !== refs.length) errors.push("question.interaction.options: option IDs must be unique");
    }
  }
  return refs;
}

export function validateFeedback(value: unknown, type: string, allowedKinds: readonly string[], isValidTarget: (kind: string, targetId: string) => boolean, errors: string[]): void {
  if (!exact(value, ["type", "reason", "details", "course", "messages"], ["type", "reason", "details"], "question.feedback", errors)) return;
  if (value.type !== type) errors.push("question.feedback.type: mismatched type");
  text(value.reason, "question.feedback.reason", errors); json(value.details, "question.feedback.details", errors);
  if (Object.hasOwn(value, "course")) validateCourseSource(value.course, "question.feedback.course", errors);
  if (!Object.hasOwn(value, "messages")) return;
  if (!Array.isArray(value.messages)) { errors.push("question.feedback.messages: must be an array"); return; }
  const seen = new Set<string>();
  for (const [i, message] of value.messages.entries()) if (exact(message, ["kind", "targetId", "text"], ["kind", "targetId", "text"], `question.feedback.messages[${i}]`, errors)) {
    id(message.kind, `question.feedback.messages[${i}].kind`, errors); id(message.targetId, `question.feedback.messages[${i}].targetId`, errors); text(message.text, `question.feedback.messages[${i}].text`, errors);
    const key = `${message.kind}|${message.targetId}`; if (seen.has(key)) errors.push("question.feedback.messages: duplicate kind/target pair"); seen.add(key);
    if (!allowedKinds.includes(message.kind as string)) errors.push(`question.feedback.messages[${i}].kind: invalid kind`);
    if (!isValidTarget(message.kind as string, message.targetId as string)) errors.push(`question.feedback.messages[${i}].targetId: foreign target`);
  }
}

function validateCourseSource(value: unknown, path: string, errors: string[]): void {
  if (!exact(value, ["title", "url", "section", "requiresAccount"], ["title", "url", "requiresAccount"], path, errors)) return;
  text(value.title, `${path}.title`, errors);
  if (text(value.url, `${path}.url`, errors)) {
    if (!/^https:\/\/[^\s/?#]+(?:[/?#][^\s]*)?$/u.test(value.url)) errors.push(`${path}.url: must be an absolute HTTPS URL without whitespace`);
    else try { if (new URL(value.url).protocol !== "https:") errors.push(`${path}.url: must use HTTPS`); } catch { errors.push(`${path}.url: must be an absolute HTTPS URL`); }
  }
  if (Object.hasOwn(value, "section")) text(value.section, `${path}.section`, errors);
  if (typeof value.requiresAccount !== "boolean") errors.push(`${path}.requiresAccount: must be a boolean`);
}

function validateQuestionRelation(value: unknown, questionId: unknown, path: string, errors: string[]): void {
  const keys = ["counterpartQuestionId", "kind", "changedCondition", "decisionBoundary"];
  if (!exact(value, keys, keys, path, errors)) return;
  safeIdentity(value.counterpartQuestionId, `${path}.counterpartQuestionId`, errors);
  if (value.counterpartQuestionId === questionId) errors.push(`${path}.counterpartQuestionId: cannot reference the same question`);
  if (value.kind !== "near_variant" && value.kind !== "condition_contrast") errors.push(`${path}.kind: unsupported relation kind`);
  text(value.changedCondition, `${path}.changedCondition`, errors); text(value.decisionBoundary, `${path}.decisionBoundary`, errors);
}
