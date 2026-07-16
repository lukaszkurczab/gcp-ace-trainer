import type { ContentItemRef, ReviewQueueEntry, TrainingAttempt } from "../../domain";
import { getAlgorithmContentCatalog } from "../../content/catalogRepository";
import type { AlgorithmContentCatalog } from "./algorithmContentCatalog";
import { getAlgorithmQuestionEntries, type AlgorithmQuestionEntry } from "./algorithmItems";
import type { AlgorithmQuestion } from "./algorithmQuestionTypes";
import { ALGORITHM_ROADMAP, type AlgorithmRoadmapNode, type AlgorithmRoadmapNodeId } from "./algorithmRoadmap";
import {
  ALGORITHMS_PRACTICE_BLUEPRINT,
  assertAlgorithmsPracticeBlueprint,
  type AlgorithmsInterviewSimulationProfile,
  type AlgorithmsPracticeBlueprint,
} from "./algorithmsBlueprints";
import { ALGORITHM_MODE_IDS, getAlgorithmMode, type AlgorithmModeId } from "./domain/algorithmModes";
import { selectAlgorithmReviewItems, type AlgorithmReviewSource } from "./algorithmReviewSelection";

export type { AlgorithmReviewSource } from "./algorithmReviewSelection";
export type AlgorithmSessionEntryPoint =
  | "approach_primer"
  | "topic_default"
  | "pattern_recognition"
  | "contrast"
  | "due_queue"
  | "session_misses"
  | "mixed_practice"
  | "timed_validation";

export const ALGORITHM_ENTRY_MODE_IDS = Object.freeze({
  approach_primer: ALGORITHM_MODE_IDS.learnApproach,
  topic_default: ALGORITHM_MODE_IDS.guidedPractice,
  pattern_recognition: ALGORITHM_MODE_IDS.recognizePatterns,
  contrast: ALGORITHM_MODE_IDS.contrastPractice,
  due_queue: ALGORITHM_MODE_IDS.weakAreaReview,
  session_misses: ALGORITHM_MODE_IDS.weakAreaReview,
  mixed_practice: ALGORITHM_MODE_IDS.independentPractice,
  timed_validation: ALGORITHM_MODE_IDS.interviewSimulation,
} as const satisfies Record<AlgorithmSessionEntryPoint, AlgorithmModeId>);

export type AlgorithmSelectionScope = Readonly<{
  contrastSet?: readonly AlgorithmRoadmapNodeId[];
  interleavedScope?: readonly AlgorithmRoadmapNodeId[];
  mentalUnitId?: AlgorithmRoadmapNodeId;
  recognitionScope?: readonly AlgorithmRoadmapNodeId[];
  simulationProfile?: AlgorithmsInterviewSimulationProfile;
}>;

export type AlgorithmShorteningReason = "insufficient_compatible_content";
export type AlgorithmSessionSelection = Readonly<{
  actualLength: number;
  items: readonly AlgorithmQuestion[];
  requestedLength: number;
  shorteningReason?: AlgorithmShorteningReason;
}>;

export type SelectAlgorithmSessionItemsInput = Readonly<{
  attempts?: readonly TrainingAttempt[];
  contentCatalog?: AlgorithmContentCatalog;
  mode: AlgorithmModeId;
  nodeId?: AlgorithmRoadmapNodeId;
  now?: string;
  practiceBlueprint?: AlgorithmsPracticeBlueprint;
  reviewItemRefs?: readonly ContentItemRef[];
  reviewQueueItems?: readonly ReviewQueueEntry[];
  reviewSource?: AlgorithmReviewSource;
  scope?: AlgorithmSelectionScope;
  sessionLength: number;
}>;

export function getAlgorithmModeIdForEntryPoint(entryPoint: AlgorithmSessionEntryPoint): AlgorithmModeId {
  const modeId = ALGORITHM_ENTRY_MODE_IDS[entryPoint];
  if (!modeId) throw new Error(`Unknown Algorithms entry point: ${entryPoint}`);
  return modeId;
}

export function resolveAlgorithmSessionNode(nodeId: string): AlgorithmRoadmapNode {
  const node = ALGORITHM_ROADMAP.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) throw new Error(`Unknown Algorithms topic: ${nodeId}`);
  return node;
}

export const getAlgorithmSessionNodeById = resolveAlgorithmSessionNode;

/** Selects only a declared scope. It never fills a plan by widening taxonomy. */
export function selectAlgorithmSessionPlan(input: SelectAlgorithmSessionItemsInput): AlgorithmSessionSelection {
  const mode = getAlgorithmMode(input.mode);
  const blueprint = input.practiceBlueprint ?? ALGORITHMS_PRACTICE_BLUEPRINT;
  assertAlgorithmsPracticeBlueprint(blueprint);
  if (mode.id === ALGORITHM_MODE_IDS.weakAreaReview && !input.reviewSource) {
    throw new Error("Algorithms Weak Area Review requires due_queue or session_misses source.");
  }
  const allowedLengths = blueprint.supportedLengthsByMode[mode.id];
  if (!allowedLengths.includes(input.sessionLength)) {
    throw new Error(`Algorithms mode ${mode.id} does not support requested length ${input.sessionLength}.`);
  }
  const catalog = input.contentCatalog ?? getAlgorithmContentCatalog();
  const entries = [...getAlgorithmQuestionEntries(catalog.getGroups())].sort(compareEntries);
  const selected = selectWithinDeclaredBoundary(input, entries);
  const uniqueItems = uniqueById(selected);
  if (uniqueItems.length !== selected.length) throw new Error("Algorithms selection contains duplicate content identities.");
  const preparedItems = uniqueItems.slice(0, input.sessionLength);
  if (mode.profile.shortening === "prohibited" && preparedItems.length !== input.sessionLength) {
    throw new Error(`Algorithms fixed mode ${mode.id} cannot prepare ${input.sessionLength} unique items; declared scope produced ${preparedItems.length}.`);
  }
  if (mode.profile.shortening === "blueprintControlled" && !blueprint.independentPracticeMayShorten && preparedItems.length !== input.sessionLength) {
    throw new Error("Algorithms Independent Practice blueprint prohibits shortening.");
  }
  const items = Object.freeze(preparedItems);
  return Object.freeze({
    actualLength: items.length,
    items,
    requestedLength: input.sessionLength,
    ...(items.length < input.sessionLength ? { shorteningReason: "insufficient_compatible_content" as const } : {}),
  });
}

export function selectAlgorithmSessionItems(input: SelectAlgorithmSessionItemsInput): readonly AlgorithmQuestion[] {
  return selectAlgorithmSessionPlan(input).items;
}

function selectWithinDeclaredBoundary(
  input: SelectAlgorithmSessionItemsInput,
  entries: readonly AlgorithmQuestionEntry[],
): readonly AlgorithmQuestion[] {
  const scope = input.scope ?? {};
  switch (input.mode) {
    case ALGORITHM_MODE_IDS.learnApproach:
    case ALGORITHM_MODE_IDS.guidedPractice:
      return byNodes(entries, [requiredMentalUnit(input)]);
    case ALGORITHM_MODE_IDS.recognizePatterns:
      return byNodes(entries, requiredScope(scope.recognitionScope, "recognition"));
    case ALGORITHM_MODE_IDS.contrastPractice:
      return byNodes(entries, requiredScope(scope.contrastSet, "contrast"));
    case ALGORITHM_MODE_IDS.independentPractice:
      return byNodes(entries, requiredScope(scope.interleavedScope, "interleaved"));
    case ALGORITHM_MODE_IDS.interviewSimulation:
      return byNodes(entries, requiredSimulationScope(scope.simulationProfile));
    case ALGORITHM_MODE_IDS.weakAreaReview:
      if (!input.reviewSource) throw new Error("Algorithms Weak Area Review requires due_queue or session_misses source.");
      return selectAlgorithmReviewItems({
        entries,
        reviewedItemRefs: [
          ...(input.attempts ?? []).map((attempt) => attempt.item),
          ...(input.reviewQueueItems ?? []).map((entry) => entry.sourceItem),
        ].filter((ref) => ref.trackId === "algorithms"),
        requestedLength: input.sessionLength,
        source: input.reviewSource === "session_misses"
          ? { itemRefs: input.reviewItemRefs ?? [], kind: "session_misses" }
          : {
              kind: "due_queue",
              now: input.now ?? "",
              reviewQueueItems: (input.reviewQueueItems ?? []).filter((entry) => entry.sourceItem.trackId === "algorithms"),
            },
      }).items;
    default:
      throw new Error(`Unknown Algorithms mode id: ${input.mode}`);
  }
}

function requiredMentalUnit(input: SelectAlgorithmSessionItemsInput): AlgorithmRoadmapNodeId {
  const nodeId = input.scope?.mentalUnitId ?? input.nodeId;
  if (!nodeId) throw new Error(`Algorithms mode ${input.mode} requires one explicit mental unit.`);
  resolveAlgorithmSessionNode(nodeId);
  return nodeId;
}

function requiredScope(scope: readonly AlgorithmRoadmapNodeId[] | undefined, name: string): readonly AlgorithmRoadmapNodeId[] {
  if (!scope || scope.length === 0 || new Set(scope).size !== scope.length) {
    throw new Error(`Algorithms ${name} scope must contain unique declared mental units.`);
  }
  scope.forEach(resolveAlgorithmSessionNode);
  return scope;
}

function requiredSimulationScope(profile: AlgorithmsInterviewSimulationProfile | undefined): readonly AlgorithmRoadmapNodeId[] {
  if (!profile || profile.profileId !== "algorithms-interview-simulation" || profile.profileVersion !== "1" || profile.requiredLength !== 40) {
    throw new Error("Algorithms Interview Simulation requires a supported fixed simulation profile.");
  }
  return requiredScope(profile.includedRoadmapNodeIds, "simulation");
}

function byNodes(entries: readonly AlgorithmQuestionEntry[], nodeIds: readonly AlgorithmRoadmapNodeId[]): readonly AlgorithmQuestion[] {
  const allowed = new Set(nodeIds);
  return entries.filter((entry) => allowed.has(entry.group.roadmapNodeId)).map((entry) => entry.question);
}

function uniqueById(items: readonly AlgorithmQuestion[]): readonly AlgorithmQuestion[] {
  const seen = new Set<string>();
  return items.filter((item) => !seen.has(item.id) && (seen.add(item.id), true));
}

function compareEntries(left: AlgorithmQuestionEntry, right: AlgorithmQuestionEntry): number {
  return left.group.roadmapNodeId.localeCompare(right.group.roadmapNodeId) || left.question.id.localeCompare(right.question.id);
}
