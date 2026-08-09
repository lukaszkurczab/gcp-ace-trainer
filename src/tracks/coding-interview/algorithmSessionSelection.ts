import type { ContentItemRef, ReviewQueueEntry, TrainingAttempt } from "../../domain";
import type { AlgorithmRuntimeCatalog } from "./algorithmRuntimeCatalog";
import type { AlgorithmQuestion } from "./algorithmQuestionTypes";
import { ALGORITHM_ROADMAP, type AlgorithmRoadmapNode } from "./algorithmRoadmap";
import { ALGORITHM_MODE_IDS, getAlgorithmMode, type AlgorithmModeId } from "./domain/algorithmModes";
import { selectAlgorithmReviewItems, type AlgorithmReviewSource } from "./algorithmReviewSelection";

export type { AlgorithmReviewSource } from "./algorithmReviewSelection";
export type AlgorithmSessionEntryPoint = "approach_primer" | "topic_default" | "pattern_recognition" | "contrast" | "due_queue" | "session_misses" | "mixed_practice" | "timed_validation";
export const ALGORITHM_ENTRY_MODE_IDS = Object.freeze({ approach_primer: ALGORITHM_MODE_IDS.learnApproach, topic_default: ALGORITHM_MODE_IDS.guidedPractice, pattern_recognition: ALGORITHM_MODE_IDS.recognizePatterns, contrast: ALGORITHM_MODE_IDS.contrastPractice, due_queue: ALGORITHM_MODE_IDS.weakAreaReview, session_misses: ALGORITHM_MODE_IDS.weakAreaReview, mixed_practice: ALGORITHM_MODE_IDS.independentPractice, timed_validation: ALGORITHM_MODE_IDS.interviewSimulation } as const satisfies Record<AlgorithmSessionEntryPoint, AlgorithmModeId>);
export type AlgorithmSelectionScope = Readonly<{ mentalUnitId?: string; roadmapNodeId?: string; recognitionSetId?: string; contrastRoadmapNodeId?: string; interleavedScopeId?: string; simulationProfileId?: string }>;
export type AlgorithmShorteningReason = "insufficient_compatible_content";
export type AlgorithmSessionSelection = Readonly<{ actualLength: number; items: readonly AlgorithmQuestion[]; requestedLength: number; shorteningReason?: AlgorithmShorteningReason }>;
export type SelectAlgorithmSessionItemsInput = Readonly<{ attempts?: readonly TrainingAttempt[]; contentCatalog?: AlgorithmRuntimeCatalog; mode: AlgorithmModeId; now?: string; reviewItemRefs?: readonly ContentItemRef[]; reviewQueueItems?: readonly ReviewQueueEntry[]; reviewSource?: AlgorithmReviewSource; scope?: AlgorithmSelectionScope; sessionLength: number }>;
export function getAlgorithmModeIdForEntryPoint(entryPoint: AlgorithmSessionEntryPoint): AlgorithmModeId { return ALGORITHM_ENTRY_MODE_IDS[entryPoint]; }
export function resolveAlgorithmSessionNode(nodeId: string): AlgorithmRoadmapNode { const node = ALGORITHM_ROADMAP.nodes.find((candidate) => candidate.id === nodeId); if (!node) throw new Error(`Unknown Algorithms topic: ${nodeId}`); return node; }
export const getAlgorithmSessionNodeById = resolveAlgorithmSessionNode;

/** Resolves one bank-declared blueprint; it never derives support from all items. */
export function selectAlgorithmSessionPlan(input: SelectAlgorithmSessionItemsInput): AlgorithmSessionSelection {
  const mode = getAlgorithmMode(input.mode); const catalog = input.contentCatalog;
  if (!catalog) throw new Error("Algorithms selection requires an explicit verified package catalog.");
  if (input.mode === ALGORITHM_MODE_IDS.weakAreaReview) return selectWeakReview(input, catalog);
  const blueprint = catalog.getPracticeBlueprint(mode.contentBlueprintModeId); if (!blueprint) throw new Error(`Algorithms catalog has no blueprint for declared content mode ${mode.contentBlueprintModeId}.`);
  if (!blueprint.requestedLengths.includes(input.sessionLength)) throw new Error(`Algorithms blueprint does not support requested length ${input.sessionLength}.`);
  const resolved = blueprint.resolvedItemIds.map((id) => catalog.getItemById(id)); const scoped = applyExplicitScope(input.mode, input.scope, catalog, resolved);
  const items = mode.profile.shortening === "prohibited" ? Object.freeze([...scoped]) : takeDeclaredItems(scoped, input.sessionLength);
  if (mode.profile.shortening === "prohibited" && (items.length !== input.sessionLength || input.sessionLength !== 40 || new Set(items.map((item) => item.id)).size !== 40)) throw new Error("Algorithms Interview Simulation requires exactly 40 declared unique occurrences.");
  if (items.length < blueprint.minimumActualLength) throw new Error(`Algorithms blueprint cannot prepare minimum actual length for ${input.mode}.`);
  return Object.freeze({ actualLength: items.length, items, requestedLength: input.sessionLength, ...(items.length < input.sessionLength ? { shorteningReason: "insufficient_compatible_content" as const } : {}) });
}
export function selectAlgorithmSessionItems(input: SelectAlgorithmSessionItemsInput): readonly AlgorithmQuestion[] { return selectAlgorithmSessionPlan(input).items; }
function takeDeclaredItems(items: readonly AlgorithmQuestion[], requestedLength: number): readonly AlgorithmQuestion[] { const selected: AlgorithmQuestion[] = []; for (const item of items) { if (selected.length === requestedLength) break; selected.push(item); } return Object.freeze(selected); }
function applyExplicitScope(mode: AlgorithmModeId, scope: AlgorithmSelectionScope | undefined, catalog: AlgorithmRuntimeCatalog, items: readonly AlgorithmQuestion[]): readonly AlgorithmQuestion[] {
  if (mode === ALGORITHM_MODE_IDS.learnApproach || mode === ALGORITHM_MODE_IDS.guidedPractice || mode === ALGORITHM_MODE_IDS.customPractice) { const mentalUnitId = scope?.mentalUnitId; const roadmapNodeId = scope?.roadmapNodeId; if (!!mentalUnitId === !!roadmapNodeId) throw new Error(`Algorithms ${mode} requires exactly one explicit mental unit or roadmap node.`); return mentalUnitId ? items.filter((item) => item.taxonomy.primaryMentalUnitId === mentalUnitId) : items.filter((item) => item.taxonomy.roadmapNodeId === roadmapNodeId); }
  const structureId = mode === ALGORITHM_MODE_IDS.recognizePatterns ? scope?.recognitionSetId : mode === ALGORITHM_MODE_IDS.independentPractice ? scope?.interleavedScopeId : mode === ALGORITHM_MODE_IDS.interviewSimulation ? scope?.simulationProfileId : undefined;
  if (mode === ALGORITHM_MODE_IDS.contrastPractice) {
    const roadmapNodeId = scope?.contrastRoadmapNodeId;
    if (!roadmapNodeId) throw new Error("Algorithms Contrast Practice requires one declared contrast roadmap topic.");
    const contrastItemIds = new Set(catalog.getContrastSets().flatMap((set) => {
      const topicIds = new Set(set.itemIds.map((itemId) => catalog.getItemById(itemId).taxonomy.roadmapNodeId));
      if (topicIds.size !== 1) throw new Error("Algorithms contrast set crosses roadmap topics.");
      return topicIds.has(roadmapNodeId) ? set.itemIds : [];
    }));
    if (!contrastItemIds.size) throw new Error("Unknown Algorithms contrast roadmap topic.");
    return items.filter((item) => contrastItemIds.has(item.id));
  }
  if (!structureId) throw new Error(`Algorithms ${mode} requires an explicit declared structure identity.`);
  if (mode === ALGORITHM_MODE_IDS.recognizePatterns) {
    const set = catalog.getRecognitionSets().find((entry) => entry.setId === structureId);
    if (!set) throw new Error("Unknown Algorithms recognition set.");
    return items.filter((item) => set.itemIds.includes(item.id));
  }
  if (mode === ALGORITHM_MODE_IDS.independentPractice) {
    const set = catalog.getInterleavedScopes().find((entry) => entry.scopeId === structureId);
    if (!set) throw new Error("Unknown Algorithms interleaved scope.");
    return items.filter((item) => set.itemIds.includes(item.id));
  }
  if (mode === ALGORITHM_MODE_IDS.interviewSimulation) { const profile = catalog.getSimulationProfile(structureId); if (!profile || profile.totalOccurrences !== 40 || profile.foregroundDurationMs !== 2_700_000 || profile.selectionPolicy.uniqueItems !== true || profile.selectionPolicy.replacement !== false || profile.selectionPolicy.deterministic !== true) throw new Error("Unknown Algorithms simulation profile."); }
  return items;
}
function selectWeakReview(input: SelectAlgorithmSessionItemsInput, catalog: AlgorithmRuntimeCatalog): AlgorithmSessionSelection { if (!input.reviewSource) throw new Error("Algorithms Weak Area Review requires due_queue or session_misses source."); if (![10, 20].includes(input.sessionLength)) throw new Error("Algorithms Weak Area Review requested length is invalid."); return selectAlgorithmReviewItems({ catalog, reviewedItemRefs: [...(input.attempts ?? []).map((attempt) => attempt.item), ...(input.reviewQueueItems ?? []).map((entry) => entry.sourceItem)], requestedLength: input.sessionLength, source: input.reviewSource === "session_misses" ? { kind: "session_misses", itemRefs: input.reviewItemRefs ?? [] } : { kind: "due_queue", now: input.now ?? "", reviewQueueItems: (input.reviewQueueItems ?? []).filter((entry) => entry.sourceItem.trackId === "coding-interview-dsa-problem-solving") } }); }
