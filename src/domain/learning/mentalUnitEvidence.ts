import type { ReviewEvidence } from "./reviewEvidence";

export type LearningUnitIdentity = Readonly<{ nodeId: string; mentalUnitId: string }>;

/** Use the attribution saved with the answer, never a successor question lookup. */
export function learningUnitIdentity(evidence: ReviewEvidence): LearningUnitIdentity | undefined {
  const axis = (axisId: string): string | undefined => {
    const refs = evidence.taxonomyOrSkillRefs.filter(ref => ref.axisId === axisId && (ref.role === undefined || ref.role === "primary"));
    if (refs.some(ref => typeof ref.nodeId !== "string" || !ref.nodeId.trim())) return undefined;
    const values = new Set(refs.map(ref => ref.nodeId));
    return values.size === 1 ? [...values][0] : undefined;
  };
  const nodeId = axis("node");
  const mentalUnitId = axis("mental_unit");
  return nodeId && mentalUnitId ? Object.freeze({ nodeId, mentalUnitId }) : undefined;
}

export function sameLearningUnit(left: ReviewEvidence, right: ReviewEvidence): boolean {
  const a = learningUnitIdentity(left), b = learningUnitIdentity(right);
  return left.sourceItem.trackId === right.sourceItem.trackId && a !== undefined && b !== undefined && a.nodeId === b.nodeId && a.mentalUnitId === b.mentalUnitId;
}

/** A legacy lookup is reliable only in the exact artifact named by its source. */
export function learningUnitInCurrentCatalog(
  evidence: ReviewEvidence,
  catalog: Readonly<{ trackId: string; contentVersion: string; artifactSha256: string; getQuestion(id: string): LearningUnitIdentity | undefined }>,
): LearningUnitIdentity | undefined {
  if (evidence.sourceItem.trackId !== catalog.trackId) return undefined;
  const saved = learningUnitIdentity(evidence);
  if (saved) return saved;
  if (evidence.taxonomyOrSkillRefs.some(ref => ref.axisId === "mental_unit")) return undefined;
  return evidence.sourceItem.contentVersion === catalog.contentVersion && evidence.sourceItem.artifactSha256 === catalog.artifactSha256
    ? catalog.getQuestion(evidence.sourceItem.questionId) : undefined;
}
