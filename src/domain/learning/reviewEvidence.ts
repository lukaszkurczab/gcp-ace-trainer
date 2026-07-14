import type { ContentItemRef } from "./contentItemRef";

export type EvidenceRef = Readonly<{
  axisId: string;
  nodeId: string;
  role?: string;
}>;

export type ReviewEvidence = Readonly<{
  sourceItem: ContentItemRef;
  taxonomyOrSkillRefs: readonly EvidenceRef[];
}>;
