import type { CanonicalArtifact, CanonicalContentLockRecord, Question, QuestionInteractionType } from "./questionTypes";

const WHITESPACE = "\\u0009-\\u000D\\u001C-\\u001F\\u0020\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000\\uFEFF";
const HAS_CONTENT = new RegExp(`[^${WHITESPACE}]`, "u");
const EDGE_WHITESPACE = new RegExp(`^[${WHITESPACE}]|[${WHITESPACE}]$`, "u");
const SHA256 = /^[a-f0-9]{64}$/;
const TYPES = new Set<QuestionInteractionType>(["choice_single", "choice_multiple", "ordering", "complexity", "decision_matrix"]);
const METHODS: Record<QuestionInteractionType, string> = { choice_single: "exact_selected_set", choice_multiple: "exact_selected_set", ordering: "adjacent_relations", complexity: "dimension_exact", decision_matrix: "dimension_exact" };
const FEEDBACK_KINDS: Record<QuestionInteractionType, readonly string[]> = { choice_single: ["wrong_option"], choice_multiple: ["wrong_option", "omitted_option"], ordering: ["wrong_element", "broken_relation"], complexity: ["wrong_value", "omitted_dimension"], decision_matrix: ["wrong_value", "omitted_dimension"] };

export class CanonicalQuestionValidationError extends Error {
  readonly errors: readonly string[];
  constructor(message: string, errors: readonly string[]) { super(message); this.name = "CanonicalQuestionValidationError"; this.errors = Object.freeze([...errors]); }
}

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
function exact(value: unknown, allowed: readonly string[], required: readonly string[], path: string, errors: string[]): value is Record<string, unknown> {
  if (!record(value)) { errors.push(`${path}: must be an object`); return false; }
  for (const key of required) if (!Object.hasOwn(value, key)) errors.push(`${path}.${key}: is required`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) errors.push(`${path}.${key}: is not allowed`);
  return true;
}
function id(value: unknown, path: string, errors: string[]): value is string {
  if (typeof value !== "string" || value.length === 0 || EDGE_WHITESPACE.test(value)) { errors.push(`${path}: must be a non-empty, trim-clean identity`); return false; }
  return true;
}
export function isCanonicalSafeIdentity(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !EDGE_WHITESPACE.test(value) && value !== "." && value !== ".." && !/[\\/\u0000]/u.test(value);
}
function safeIdentity(value: unknown, path: string, errors: string[]): value is string { if (!id(value, path, errors)) return false; if (!isCanonicalSafeIdentity(value)) { errors.push(`${path}: must not contain unsafe path segments`); return false; } return true; }
function text(value: unknown, path: string, errors: string[]): value is string { if (typeof value !== "string" || !HAS_CONTENT.test(value)) { errors.push(`${path}: must contain a non-whitespace character`); return false; } return true; }
function uniqueIds(value: unknown, path: string, errors: string[], min: number): string[] {
  if (!Array.isArray(value)) { errors.push(`${path}: must be an array`); return []; }
  if (value.length < min) errors.push(`${path}: must contain at least ${min} item(s)`);
  const result: string[] = [];
  value.forEach((entry, index) => { if (id(entry, `${path}[${index}]`, errors)) result.push(entry); });
  if (new Set(result).size !== result.length) errors.push(`${path}: must not contain duplicates`);
  return result;
}
function json(value: unknown, path: string, errors: string[]): void {
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") { text(value, path, errors); return; }
  if (typeof value === "number") { if (!Number.isFinite(value)) errors.push(`${path}: must be a finite JSON number`); return; }
  if (Array.isArray(value)) { value.forEach((entry, index) => json(entry, `${path}[${index}]`, errors)); return; }
  if (record(value)) { Object.entries(value).forEach(([key, entry]) => json(entry, `${path}.${key}`, errors)); return; }
  errors.push(`${path}: must be a JSON value`);
}
function exactSet(actual: readonly string[], expected: readonly string[], path: string, errors: string[]): void {
  const a = new Set(actual), e = new Set(expected);
  if (actual.length !== expected.length || [...a].some((x) => !e.has(x)) || [...e].some((x) => !a.has(x))) errors.push(`${path}: must contain exactly the expected identities`);
}

export function validateQuestion(value: unknown): readonly string[] {
  const errors: string[] = [];
  const common = ["questionId", "trackId", "nodeId", "mentalUnitId", "prompt", "constraints", "interaction", "answer", "feedback", "difficulty", "sourceRefs"];
  if (!exact(value, common, ["questionId", "trackId", "nodeId", "mentalUnitId", "prompt", "interaction", "answer", "feedback", "difficulty"], "question", errors)) return errors;
  for (const key of ["questionId", "trackId", "nodeId", "mentalUnitId"]) safeIdentity(value[key], `question.${key}`, errors);
  text(value.prompt, "question.prompt", errors);
  if (value.difficulty !== null) id(value.difficulty, "question.difficulty", errors);
  if (Object.hasOwn(value, "constraints")) { if (!Array.isArray(value.constraints)) errors.push("question.constraints: must be an array"); else value.constraints.forEach((entry, i) => text(entry, `question.constraints[${i}]`, errors)); }
  if (Object.hasOwn(value, "sourceRefs")) { if (!Array.isArray(value.sourceRefs)) errors.push("question.sourceRefs: must be an array"); else value.sourceRefs.forEach((entry, index) => id(entry, `question.sourceRefs[${index}]`, errors)); }
  if (!record(value.interaction) || !TYPES.has(value.interaction.type as QuestionInteractionType)) { errors.push("question.interaction.type: unsupported interaction"); return errors; }
  const type = value.interaction.type as QuestionInteractionType;
  let refs: string[] = []; let dimensions: Array<{ id: string; values: string[]; accepted: string[]; aliases: Record<string, string> }> = [];
  if (type === "choice_single" || type === "choice_multiple") {
    if (exact(value.interaction, ["type", "scoringMethod", "options"], ["type", "scoringMethod", "options"], "question.interaction", errors)) {
      if (value.interaction.scoringMethod !== METHODS[type]) errors.push("question.interaction.scoringMethod: invalid method");
      if (!Array.isArray(value.interaction.options)) errors.push("question.interaction.options: must be an array"); else {
        if (value.interaction.options.length < 2) errors.push("question.interaction.options: must contain at least two options");
        for (const [i, option] of value.interaction.options.entries()) if (exact(option, ["optionId", "text", "explanation"], ["optionId", "text"], `question.interaction.options[${i}]`, errors)) { if (id(option.optionId, `question.interaction.options[${i}].optionId`, errors)) refs.push(option.optionId); text(option.text, `question.interaction.options[${i}].text`, errors); if (Object.hasOwn(option, "explanation")) text(option.explanation, `question.interaction.options[${i}].explanation`, errors); }
        if (new Set(refs).size !== refs.length) errors.push("question.interaction.options: option IDs must be unique");
      }
    }
    if (type === "choice_single") { if (exact(value.answer, ["type", "optionId"], ["type", "optionId"], "question.answer", errors)) { if (value.answer.type !== type) errors.push("question.answer.type: mismatched type"); if (id(value.answer.optionId, "question.answer.optionId", errors) && !refs.includes(value.answer.optionId)) errors.push("question.answer.optionId: unknown option"); } }
    else if (exact(value.answer, ["type", "optionIds"], ["type", "optionIds"], "question.answer", errors)) { if (value.answer.type !== type) errors.push("question.answer.type: mismatched type"); const selected = uniqueIds(value.answer.optionIds, "question.answer.optionIds", errors, 1); if (selected.some((x) => !refs.includes(x))) errors.push("question.answer.optionIds: unknown option"); }
  } else if (type === "ordering") {
    if (exact(value.interaction, ["type", "scoringMethod", "elements"], ["type", "scoringMethod", "elements"], "question.interaction", errors)) {
      if (value.interaction.scoringMethod !== METHODS[type]) errors.push("question.interaction.scoringMethod: invalid method");
      if (!Array.isArray(value.interaction.elements)) errors.push("question.interaction.elements: must be an array"); else { if (value.interaction.elements.length < 2) errors.push("question.interaction.elements: must contain at least two elements"); for (const [i, element] of value.interaction.elements.entries()) if (exact(element, ["elementId", "text"], ["elementId", "text"], `question.interaction.elements[${i}]`, errors)) { if (id(element.elementId, `question.interaction.elements[${i}].elementId`, errors)) refs.push(element.elementId); text(element.text, `question.interaction.elements[${i}].text`, errors); } if (new Set(refs).size !== refs.length) errors.push("question.interaction.elements: element IDs must be unique"); }
    }
    if (exact(value.answer, ["type", "orderedElementIds"], ["type", "orderedElementIds"], "question.answer", errors)) { if (value.answer.type !== type) errors.push("question.answer.type: mismatched type"); exactSet(uniqueIds(value.answer.orderedElementIds, "question.answer.orderedElementIds", errors, 2), refs, "question.answer.orderedElementIds", errors); }
  } else {
    if (exact(value.interaction, ["type", "scoringMethod", "dimensions"], ["type", "scoringMethod", "dimensions"], "question.interaction", errors)) {
      if (value.interaction.scoringMethod !== METHODS[type]) errors.push("question.interaction.scoringMethod: invalid method");
      if (!Array.isArray(value.interaction.dimensions)) errors.push("question.interaction.dimensions: must be an array"); else { if (!value.interaction.dimensions.length) errors.push("question.interaction.dimensions: must be non-empty"); for (const [i, dimension] of value.interaction.dimensions.entries()) { const keys = type === "complexity" ? ["dimensionId", "label", "values", "acceptedValueIds", "aliases"] : ["dimensionId", "label", "values", "acceptedValueIds"]; if (!exact(dimension, keys, ["dimensionId", "label", "values", "acceptedValueIds"], `question.interaction.dimensions[${i}]`, errors)) continue; const dimensionId = id(dimension.dimensionId, `question.interaction.dimensions[${i}].dimensionId`, errors) ? dimension.dimensionId : ""; text(dimension.label, `question.interaction.dimensions[${i}].label`, errors); const values: string[] = []; if (!Array.isArray(dimension.values)) errors.push(`question.interaction.dimensions[${i}].values: must be an array`); else { if (dimension.values.length < 2) errors.push(`question.interaction.dimensions[${i}].values: must contain at least two values`); for (const [j, item] of dimension.values.entries()) if (exact(item, ["valueId", "text"], ["valueId", "text"], `question.interaction.dimensions[${i}].values[${j}]`, errors)) { if (id(item.valueId, `question.interaction.dimensions[${i}].values[${j}].valueId`, errors)) values.push(item.valueId); text(item.text, `question.interaction.dimensions[${i}].values[${j}].text`, errors); } if (new Set(values).size !== values.length) errors.push(`question.interaction.dimensions[${i}].values: duplicate value IDs`); } const accepted = uniqueIds(dimension.acceptedValueIds, `question.interaction.dimensions[${i}].acceptedValueIds`, errors, 1); if (accepted.some((x) => !values.includes(x))) errors.push(`question.interaction.dimensions[${i}].acceptedValueIds: unknown value`); const aliases: Record<string, string> = {}; if (Object.hasOwn(dimension, "aliases")) { if (!record(dimension.aliases)) errors.push(`question.interaction.dimensions[${i}].aliases: must be an object`); else for (const [alias, target] of Object.entries(dimension.aliases)) { if (id(alias, `question.interaction.dimensions[${i}].aliases.${alias}`, errors) && values.includes(alias)) errors.push(`question.interaction.dimensions[${i}].aliases.${alias}: shadows a value`); if (!id(target, `question.interaction.dimensions[${i}].aliases.${alias}`, errors) || !values.includes(target)) errors.push(`question.interaction.dimensions[${i}].aliases.${alias}: unknown target`); else aliases[alias] = target; } } dimensions.push({ id: dimensionId, values, accepted, aliases }); } if (new Set(dimensions.map((x) => x.id)).size !== dimensions.length) errors.push("question.interaction.dimensions: duplicate dimension IDs"); }
    }
    if (exact(value.answer, ["type", "selectedValueIdsByDimension"], ["type", "selectedValueIdsByDimension"], "question.answer", errors)) { if (value.answer.type !== type) errors.push("question.answer.type: mismatched type"); if (!record(value.answer.selectedValueIdsByDimension)) errors.push("question.answer.selectedValueIdsByDimension: must be an object"); else { exactSet(Object.keys(value.answer.selectedValueIdsByDimension), dimensions.map((x) => x.id), "question.answer.selectedValueIdsByDimension", errors); for (const dimension of dimensions) { const selected = uniqueIds(value.answer.selectedValueIdsByDimension[dimension.id], `question.answer.selectedValueIdsByDimension.${dimension.id}`, errors, 1); if (selected.some((x) => !dimension.values.includes(x))) errors.push(`question.answer.selectedValueIdsByDimension.${dimension.id}: unknown value`); exactSet(selected, dimension.accepted, `question.answer.selectedValueIdsByDimension.${dimension.id}`, errors); } } }
  }
  validateFeedback(value.feedback, type, refs, dimensions, value.answer, errors);
  return Object.freeze(errors);
}

function validateFeedback(value: unknown, type: QuestionInteractionType, refs: readonly string[], dimensions: readonly { id: string; values: string[] }[], answer: unknown, errors: string[]): void {
  if (!exact(value, ["type", "reason", "details", "messages"], ["type", "reason", "details"], "question.feedback", errors)) return;
  if (value.type !== type) errors.push("question.feedback.type: mismatched type"); text(value.reason, "question.feedback.reason", errors); json(value.details, "question.feedback.details", errors);
  if (!Object.hasOwn(value, "messages")) return; if (!Array.isArray(value.messages)) { errors.push("question.feedback.messages: must be an array"); return; }
  const seen = new Set<string>(); const dimensionIds = new Set(dimensions.map((x) => x.id)); const targets = new Set(dimensions.flatMap((d) => d.values.map((v) => `${d.id}|${v}`))); const ordered = record(answer) && Array.isArray(answer.orderedElementIds) ? answer.orderedElementIds : []; const relations = new Set(ordered.slice(0, -1).map((x, i) => `${x}->${ordered[i + 1]}`));
  for (const [i, message] of value.messages.entries()) if (exact(message, ["kind", "targetId", "text"], ["kind", "targetId", "text"], `question.feedback.messages[${i}]`, errors)) { id(message.kind, `question.feedback.messages[${i}].kind`, errors); id(message.targetId, `question.feedback.messages[${i}].targetId`, errors); text(message.text, `question.feedback.messages[${i}].text`, errors); const key = `${message.kind}|${message.targetId}`; if (seen.has(key)) errors.push("question.feedback.messages: duplicate kind/target pair"); seen.add(key); if (!FEEDBACK_KINDS[type].includes(message.kind as string)) errors.push(`question.feedback.messages[${i}].kind: invalid kind`); const valid = message.kind === "wrong_option" || message.kind === "omitted_option" || message.kind === "wrong_element" ? refs.includes(message.targetId as string) : message.kind === "broken_relation" ? relations.has(message.targetId as string) : message.kind === "omitted_dimension" ? dimensionIds.has(message.targetId as string) : targets.has(message.targetId as string); if (!valid) errors.push(`question.feedback.messages[${i}].targetId: foreign target`); }
}

export function assertValidQuestion(value: unknown): asserts value is Question { const errors = validateQuestion(value); if (errors.length) throw new CanonicalQuestionValidationError("Question does not satisfy the canonical contract.", errors); }

export function validateCanonicalArtifact(value: unknown, lock: CanonicalContentLockRecord, expectedTrackId: string): CanonicalArtifact {
  const errors: string[] = [];
  if (!exact(value, ["schemaVersion", "trackId", "contentVersion", "questions"], ["schemaVersion", "trackId", "contentVersion", "questions"], "artifact", errors)) throw new CanonicalQuestionValidationError("Artifact does not satisfy the canonical contract.", errors);
  if (value.schemaVersion !== "patternly-content-artifact-v1") errors.push("artifact.schemaVersion: invalid version"); safeIdentity(expectedTrackId, "expectedTrackId", errors); if (value.trackId !== expectedTrackId) errors.push("artifact.trackId: foreign path identity"); safeIdentity(value.trackId, "artifact.trackId", errors); id(value.contentVersion, "artifact.contentVersion", errors);
  if (!exact(lock, ["trackId", "contentVersion", "questionCount", "sha256"], ["trackId", "contentVersion", "questionCount", "sha256"], "lock", errors)) throw new CanonicalQuestionValidationError("Artifact lock is invalid.", errors);
  if (lock.trackId !== expectedTrackId || lock.trackId !== value.trackId || lock.contentVersion !== value.contentVersion || !Number.isSafeInteger(lock.questionCount) || lock.questionCount < 1 || !SHA256.test(lock.sha256)) errors.push("lock: identity, version, count, or SHA-256 is inconsistent");
  if (!Array.isArray(value.questions)) errors.push("artifact.questions: must be an array"); else { if (value.questions.length !== lock.questionCount) errors.push("artifact.questions: count differs from lock"); const ids = new Set<string>(); for (const [i, question] of value.questions.entries()) { const child = validateQuestion(question); errors.push(...child.map((x) => `artifact.questions[${i}].${x.replace(/^question\.?/, "")}`)); if (record(question)) { if (question.trackId !== expectedTrackId) errors.push(`artifact.questions[${i}].trackId: foreign track`); if (typeof question.questionId === "string") { if (ids.has(question.questionId)) errors.push(`artifact.questions[${i}].questionId: duplicate identity`); ids.add(question.questionId); } } } }
  if (errors.length) throw new CanonicalQuestionValidationError("Artifact does not satisfy the canonical contract.", errors);
  return deepFreeze(value as CanonicalArtifact);
}
function deepFreeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child); Object.freeze(value); } return value; }
