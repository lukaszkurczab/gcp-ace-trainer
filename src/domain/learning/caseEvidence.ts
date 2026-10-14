/** Versioned facts for rebuilt Claude cases only. Old and other-track attempts retain their policy. */
export const CASE_TRACK_ID = "claude-certified-architect-professional-certification";
export const CASE_POLICY_VERSION = "claude-case-evidence-v1";
export type CaseLearningState = Readonly<{ policyVersion: typeof CASE_POLICY_VERSION; caseId: string; caseVersion: string; priorExposedStepIds: readonly string[]; hintShownStepIds: readonly string[]; solutionExposedStepIds: readonly string[] }>;
export type CaseAttemptEvidence = Readonly<{ policyVersion: typeof CASE_POLICY_VERSION; caseId: string; caseVersion: string; stepId: string; role: "baseline" | "contrast"; assistanceBeforeSubmit: boolean; priorExposure: "known" | "unknown"; revealPolicy: "after_durable_submit" }>;
export const CASE_REVIEW_POLICY = "claude-case-review-v1";
export const CASE_BLOCK_POLICY = "claude-case-blocks-v1";
type SessionCaseFields = Readonly<{ caseState?: CaseLearningState; caseStates?: readonly CaseLearningState[] }>;
/** The single-case field remains readable for already pinned sessions. */
export function sessionCaseStates(session: SessionCaseFields): readonly CaseLearningState[] {
  return session.caseState ? [session.caseState] : session.caseStates ?? [];
}
export function freezeCaseLearningState(state: CaseLearningState): CaseLearningState {
  return Object.freeze({ ...state, priorExposedStepIds: Object.freeze([...state.priorExposedStepIds]), hintShownStepIds: Object.freeze([...state.hintShownStepIds]), solutionExposedStepIds: Object.freeze([...state.solutionExposedStepIds]) });
}
export function caseStatesAreMonotonic(previous: readonly CaseLearningState[], next: readonly CaseLearningState[]): boolean {
  return previous.length === next.length && previous.every((before, index) => {
    const after = next[index];
    return !!after && before.caseId === after.caseId && before.caseVersion === after.caseVersion && before.policyVersion === after.policyVersion &&
      before.priorExposedStepIds.every(id => after.priorExposedStepIds.includes(id)) && before.hintShownStepIds.every(id => after.hintShownStepIds.includes(id)) && before.solutionExposedStepIds.every(id => after.solutionExposedStepIds.includes(id));
  });
}
const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const identity = (x: unknown): x is string => typeof x === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(x);
const ids = (x: unknown): x is readonly string[] => Array.isArray(x) && x.every(identity) && new Set(x).size === x.length;
export function isCaseLearningState(x: unknown): x is CaseLearningState { return record(x) && Object.keys(x).length === 6 && x.policyVersion === CASE_POLICY_VERSION && identity(x.caseId) && identity(x.caseVersion) && ids(x.priorExposedStepIds) && ids(x.hintShownStepIds) && ids(x.solutionExposedStepIds); }
export function isCaseAttemptEvidence(x: unknown): x is CaseAttemptEvidence { return record(x) && Object.keys(x).length === 8 && x.policyVersion === CASE_POLICY_VERSION && identity(x.caseId) && identity(x.caseVersion) && identity(x.stepId) && ["baseline", "contrast"].includes(String(x.role)) && typeof x.assistanceBeforeSubmit === "boolean" && ["known", "unknown"].includes(String(x.priorExposure)) && x.revealPolicy === "after_durable_submit"; }
export function isIndependentCaseAttempt(attempt: { trackId: string; reviewEvidence: { evidence?: { details: unknown } } }): boolean {
  const details = attempt.reviewEvidence.evidence?.details;
  return attempt.trackId !== CASE_TRACK_ID || !isCaseAttemptEvidence(details) || !details.assistanceBeforeSubmit;
}
