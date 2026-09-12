import { createFamilyEnvelope, type FamilyEnvelope } from "./familyEnvelope";
import { createResolvedContentRef, type ResolvedContentRef } from "./resolvedContentRef";

export type EvidenceRef = Readonly<{
  axisId: string;
  nodeId: string;
  role?: string;
}>;

export type ReviewEvidence = Readonly<{
  sourceItem: ResolvedContentRef;
  taxonomyOrSkillRefs: readonly EvidenceRef[];
  evidence?: FamilyEnvelope;
}>;

export function createReviewEvidence(input: ReviewEvidence): ReviewEvidence {
  return Object.freeze({
    sourceItem: createResolvedContentRef(input.sourceItem),
    taxonomyOrSkillRefs: Object.freeze(input.taxonomyOrSkillRefs.map((ref) => Object.freeze({ ...ref }))),
    evidence: input.evidence ? createFamilyEnvelope(input.evidence) : undefined,
  });
}
