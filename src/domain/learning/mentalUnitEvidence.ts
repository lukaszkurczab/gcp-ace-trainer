import type { ReviewEvidence } from "./reviewEvidence";
import { createResolvedContentRef, isResolvedContentRef, resolvedContentRefsEqual, type ResolvedContentRef } from "./resolvedContentRef";

export type LearningUnitIdentity = Readonly<{ nodeId: string; mentalUnitId: string }>;
export type LegacyReviewUnitProof = LearningUnitIdentity & Readonly<{ sourceItem: ResolvedContentRef }>;
type LearningUnitCatalog = Readonly<{ trackId: string; contentVersion: string; artifactSha256: string; getQuestion(id: string): (LearningUnitIdentity & { trackId?: string }) | undefined }>;

export function isLegacyReviewUnitProof(value: unknown): value is LegacyReviewUnitProof {
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return false;
  const proof = value as Record<string, unknown>;
  return Reflect.ownKeys(proof).length === 3 && ["sourceItem", "nodeId", "mentalUnitId"].every(key => Object.hasOwn(proof, key)) &&
    isResolvedContentRef(proof.sourceItem) && typeof proof.nodeId === "string" && proof.nodeId.trim().length > 0 &&
    typeof proof.mentalUnitId === "string" && proof.mentalUnitId.trim().length > 0;
}

/** Every existing node reference must agree; a partial/conflicting unit ref cannot trigger a lookup. */
function permitsLegacyUnit(evidence: ReviewEvidence, unit: LearningUnitIdentity): boolean {
  return !evidence.taxonomyOrSkillRefs.some(ref => ref.axisId === "mental_unit") &&
    evidence.taxonomyOrSkillRefs.filter(ref => ref.axisId === "node").every(ref => ref.nodeId === unit.nodeId) &&
    typeof unit.nodeId === "string" && unit.nodeId.trim().length > 0 && typeof unit.mentalUnitId === "string" && unit.mentalUnitId.trim().length > 0;
}

/** Prepared evidence only: no attribution is added to the durable queue entry. */
export function createLegacyReviewUnitProof(evidence: ReviewEvidence, catalog: LearningUnitCatalog): LegacyReviewUnitProof | undefined {
  if (evidence.taxonomyOrSkillRefs.some(ref => ref.axisId === "mental_unit") || evidence.sourceItem.trackId !== catalog.trackId || evidence.sourceItem.contentVersion !== catalog.contentVersion || evidence.sourceItem.artifactSha256 !== catalog.artifactSha256) return undefined;
  const unit = catalog.getQuestion(evidence.sourceItem.questionId);
  if (!unit || (unit.trackId !== undefined && unit.trackId !== catalog.trackId) || !permitsLegacyUnit(evidence, unit)) return undefined;
  return Object.freeze({ sourceItem: createResolvedContentRef(evidence.sourceItem), nodeId: unit.nodeId, mentalUnitId: unit.mentalUnitId });
}

/** Submit supplies its exact catalog; journal/recovery validate the frozen A/proof/B without a lookup. */
export function reviewEvidenceMatchesAttempt(review: ReviewEvidence, answer: ReviewEvidence, proof?: LegacyReviewUnitProof, catalog?: LearningUnitCatalog): boolean {
  if (proof === undefined) return sameLearningUnit(review, answer) || resolvedContentRefsEqual(review.sourceItem, answer.sourceItem);
  if (!isLegacyReviewUnitProof(proof) || !resolvedContentRefsEqual(proof.sourceItem, review.sourceItem) || !permitsLegacyUnit(review, proof)) return false;
  const unit = learningUnitIdentity(answer);
  if (!unit || unit.nodeId !== proof.nodeId || unit.mentalUnitId !== proof.mentalUnitId ||
    answer.sourceItem.trackId !== proof.sourceItem.trackId || answer.sourceItem.contentVersion !== proof.sourceItem.contentVersion || answer.sourceItem.artifactSha256 !== proof.sourceItem.artifactSha256) return false;
  if (catalog) {
    const exact = createLegacyReviewUnitProof(review, catalog);
    return exact !== undefined && exact.nodeId === proof.nodeId && exact.mentalUnitId === proof.mentalUnitId;
  }
  return true;
}

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
  catalog: LearningUnitCatalog,
): LearningUnitIdentity | undefined {
  if (evidence.sourceItem.trackId !== catalog.trackId) return undefined;
  const saved = learningUnitIdentity(evidence);
  if (saved) return saved;
  const proof = createLegacyReviewUnitProof(evidence, catalog);
  return proof ? Object.freeze({ nodeId: proof.nodeId, mentalUnitId: proof.mentalUnitId }) : undefined;
}
