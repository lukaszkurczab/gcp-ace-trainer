/** Authored once on the first question; never contains answer keys or a second scorer. */
export const CLAUDE_CASE_TRACK = "claude-certified-architect-professional-certification";
export const CASE_EVIDENCE_POLICY = "claude-case-evidence-v1";
export type CaseStep = Readonly<{ stepId: string; questionId: string; role: "baseline" | "contrast"; baseStepId?: string; changedCondition: string; requiredContext: string; hint: string }>;
export type CaseRecipe = Readonly<{ caseId: string; version: string; title: string; context: string; revealPolicy: "after_durable_submit"; policyVersion: typeof CASE_EVIDENCE_POLICY; /** Initial authored total for one shared context, all decisions and required feedback. */ initialEstimatedSeconds: number; steps: readonly CaseStep[] }>;
const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const text = (x: unknown): x is string => typeof x === "string" && !!x.trim();
const identity = (x: unknown): x is string => text(x) && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(x);
export function validateCaseRecipe(value: unknown): readonly string[] {
  const errors: string[] = [];
  const exact = (x: unknown, required: string[], optional: string[] = []) => record(x) && required.every(k => Object.hasOwn(x, k)) && Object.keys(x).every(k => [...required, ...optional].includes(k));
  if (!exact(value, ["caseId", "version", "title", "context", "revealPolicy", "policyVersion", "initialEstimatedSeconds", "steps"]) || !record(value)) return ["caseRecipe: invalid fields"];
  if (!identity(value.caseId) || !identity(value.version) || !text(value.title) || !text(value.context) || value.revealPolicy !== "after_durable_submit" || value.policyVersion !== CASE_EVIDENCE_POLICY || !Number.isSafeInteger(value.initialEstimatedSeconds) || Number(value.initialEstimatedSeconds) < 1) errors.push("caseRecipe: invalid identity, context, estimate or policy");
  if (!Array.isArray(value.steps) || value.steps.length < 2 || value.steps.length > 4) return [...errors, "caseRecipe.steps: requires 2–4 decisions"];
  const ids = new Set<string>(), qids = new Set<string>();
  value.steps.forEach((step, i) => {
    if (!exact(step, ["stepId", "questionId", "role", "changedCondition", "requiredContext", "hint"], ["baseStepId"]) || !record(step)) { errors.push("caseRecipe.step: invalid fields"); return; }
    if (!identity(step.stepId) || !identity(step.questionId) || !text(step.changedCondition) || !text(step.requiredContext) || !text(step.hint) || ids.has(String(step.stepId)) || qids.has(String(step.questionId))) errors.push("caseRecipe.step: invalid or duplicate identity/context");
    if (i === 0 ? step.role !== "baseline" || step.baseStepId !== undefined : step.role !== "contrast" || !ids.has(String(step.baseStepId))) errors.push("caseRecipe.step: invalid base (missing, forward or cyclic)");
    ids.add(String(step.stepId)); qids.add(String(step.questionId));
  });
  return errors;
}
export function validateCaseRecipes(questions: readonly Readonly<{ questionId: string; trackId: string; nodeId: string; mentalUnitId: string; interaction?: Readonly<{ type: string }>; interactionType?: string; questionRelation?: unknown; caseRecipe?: CaseRecipe }>[]): readonly string[] {
  const errors: string[] = [], caseIds = new Set<string>(), used = new Set<string>();
  const byId = new Map(questions.map(q => [q.questionId, q]));
  for (const owner of questions) {
    if (!owner.caseRecipe) continue;
    const recipe = owner.caseRecipe;
    const local = validateCaseRecipe(recipe); errors.push(...local);
    if (local.length) continue;
    if (owner.trackId !== CLAUDE_CASE_TRACK || recipe.steps[0]?.questionId !== owner.questionId || caseIds.has(recipe.caseId)) errors.push("caseRecipe: foreign track, duplicate case or wrong owner");
    caseIds.add(recipe.caseId);
    for (const step of recipe.steps) {
      const q = byId.get(step.questionId);
      if (!q || q.trackId !== owner.trackId || q.nodeId !== owner.nodeId || q.mentalUnitId !== owner.mentalUnitId || used.has(step.questionId) || q.questionRelation || !["choice_single", "choice_multiple"].includes(q.interaction?.type ?? q.interactionType ?? "")) errors.push("caseRecipe: missing/foreign/duplicate step or unsupported interaction/relation");
      used.add(step.questionId);
    }
  }
  return errors;
}
export function indexCaseRecipes<T extends { caseRecipe?: CaseRecipe }>(questions: readonly T[]): readonly CaseRecipe[] { return Object.freeze(questions.flatMap(q => q.caseRecipe ? [q.caseRecipe] : [])); }
