import type { ContentItemRef } from "./contentItemRef";
import { createFamilyEnvelope, type FamilyEnvelope } from "./familyEnvelope";

export type EvidenceRef = Readonly<{
  axisId: string;
  nodeId: string;
  role?: string;
}>;

export type ReviewEvidence = Readonly<{
  sourceItem: ContentItemRef;
  taxonomyOrSkillRefs: readonly EvidenceRef[];
  evidence?: FamilyEnvelope;
}>;

export function createReviewEvidence(input: ReviewEvidence): ReviewEvidence {
  return Object.freeze({ sourceItem: Object.freeze({ ...input.sourceItem }), taxonomyOrSkillRefs: Object.freeze(input.taxonomyOrSkillRefs.map((ref) => Object.freeze({ ...ref }))), evidence: input.evidence ? createFamilyEnvelope(input.evidence) : undefined });
}
