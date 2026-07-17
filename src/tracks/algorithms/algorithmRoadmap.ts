import { ALGORITHM_CONTENT_VERSION, type AlgorithmApproachId, type AlgorithmLearningStage, type AlgorithmPatternFamilyId } from "./algorithmContentTypes";
import { algorithmTaxonomyStructure } from "./generated/algorithmTaxonomyStructure.generated";
import { ALGORITHM_ROADMAP_PRESENTATION } from "./algorithmRoadmapPresentation";
import { ALGORITHM_QUESTION_TYPES, type AlgorithmQuestionType } from "./algorithmQuestionTypes";

export const ALGORITHM_FORBIDDEN_MODEL_TERMS = [
  "readiness", "retention", "mastery", "streak", "leaderboard", "leetcode", "ai-generated", "llm-generated", "mock", "demo", "legacy", "compatibility", "migration", "alias", "temporary", "provisional", "placeholder", "fallback", "draft",
] as const;

export type AlgorithmRoadmapNodeId = string;
export type AlgorithmRoadmapNodeKind = "foundation" | "approach" | "mechanics" | "contrast" | "strategy_selection" | "mixed_practice";
export type AlgorithmRoadmapStatus = "available";
export type AlgorithmRoadmapPrerequisite = { nodeId: AlgorithmRoadmapNodeId; reason: string };
export type AlgorithmRoadmapLearningObjective = { id: string; text: string };
export type AlgorithmRoadmapNode = {
  approachIds?: readonly AlgorithmApproachId[];
  contentVersion: string;
  id: AlgorithmRoadmapNodeId;
  kind: AlgorithmRoadmapNodeKind;
  label: string;
  learningObjectives: readonly AlgorithmRoadmapLearningObjective[];
  learningStage: AlgorithmLearningStage;
  minimumActiveItemCount: number;
  order: number;
  patternVariantIds?: readonly string[];
  prerequisiteNodeIds: readonly AlgorithmRoadmapNodeId[];
  prerequisites?: readonly AlgorithmRoadmapPrerequisite[];
  primaryPatternFamilyId?: AlgorithmPatternFamilyId;
  problemArchetypeIds?: readonly string[];
  recommendedItemTypes: readonly AlgorithmQuestionType[];
  shortDescription: string;
  skillAtomIds?: readonly string[];
  status: AlgorithmRoadmapStatus;
};
export type AlgorithmRoadmapEdge = { fromNodeId: AlgorithmRoadmapNodeId; reason: string; toNodeId: AlgorithmRoadmapNodeId };
export type AlgorithmRoadmapTrack = { contentVersion: string; description: string; edges: readonly AlgorithmRoadmapEdge[]; id: string; label: string; nodes: readonly AlgorithmRoadmapNode[]; status: AlgorithmRoadmapStatus };
export type AlgorithmRoadmapQualityIssueCode = "missing_presentation_metadata" | "orphan_presentation_metadata" | "unknown_recommended_item_type" | "forbidden_visible_term";
export type AlgorithmRoadmapQualityIssue = { code: AlgorithmRoadmapQualityIssueCode; message: string; nodeId?: AlgorithmRoadmapNodeId };
export type AlgorithmRoadmapQualityResult = { issues: AlgorithmRoadmapQualityIssue[]; valid: boolean };

const defaultRecommendedItemTypes = [
  "approach_primer", "approach_naming", "worked_example", "trace_next_step", "strategy_choice", "complexity_check", "solution_comparison", "edge_case_drill", "common_mistake_diagnosis", "test_case_selection", "state_selection", "output_contract_reasoning", "constraint_change", "complexity_reasoning",
] as const satisfies readonly AlgorithmQuestionType[];

const unitsByNode = new Map(
  algorithmTaxonomyStructure.roadmapNodes.map((node) => [
    node.id,
    algorithmTaxonomyStructure.mentalUnits.filter((unit) => unit.roadmapNodeId === node.id),
  ]),
);

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function kindFor(node: (typeof algorithmTaxonomyStructure.roadmapNodes)[number]): AlgorithmRoadmapNodeKind {
  if (node.id === "strategy_selection_core") return "strategy_selection";
  if (node.contentOwnership === "cross_family") return "contrast";
  return node.defaultLearningStage === "foundations" ? "foundation" : "mechanics";
}

const algorithmRoadmapNodes: readonly AlgorithmRoadmapNode[] = algorithmTaxonomyStructure.roadmapNodes.map((node) => {
  const presentation = ALGORITHM_ROADMAP_PRESENTATION[node.id];
  if (!presentation) throw new Error(`Missing Algorithms roadmap presentation metadata: ${node.id}`);
  const units = unitsByNode.get(node.id) ?? [];
  const primaryPatternFamilyId = "primaryPatternFamilyId" in node ? node.primaryPatternFamilyId : undefined;
  return {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    id: node.id,
    kind: kindFor(node),
    label: presentation.label,
    learningObjectives: presentation.learningObjectives.map((text, index) => ({ id: `${node.id}-objective-${index + 1}`, text })),
    learningStage: node.defaultLearningStage,
    minimumActiveItemCount: presentation.minimumActiveItemCount,
    order: node.order,
    patternVariantIds: unique(units.flatMap((unit) => unit.patternVariantIds)),
    prerequisiteNodeIds: node.prerequisiteNodeIds,
    ...(primaryPatternFamilyId ? { primaryPatternFamilyId } : {}),
    problemArchetypeIds: unique(units.flatMap((unit) => unit.problemArchetypeIds)),
    recommendedItemTypes: presentation.recommendedItemTypes ?? defaultRecommendedItemTypes,
    shortDescription: presentation.shortDescription,
    skillAtomIds: unique(units.flatMap((unit) => [unit.primarySkillAtomId, ...unit.secondarySkillAtomIds])),
    status: "available",
  };
});

const algorithmRoadmapEdges = algorithmRoadmapNodes.flatMap((node) => node.prerequisiteNodeIds.map((prerequisiteNodeId) => ({ fromNodeId: prerequisiteNodeId, reason: "Roadmap sequence prerequisite.", toNodeId: node.id })));

export const ALGORITHM_ROADMAP = {
  contentVersion: ALGORITHM_CONTENT_VERSION,
  description: "Curriculum from foundations through pattern mechanics, strategy selection, and contrast practice.",
  edges: algorithmRoadmapEdges,
  id: "algorithms-core-roadmap",
  label: "Algorithms Core Roadmap",
  nodes: algorithmRoadmapNodes,
  status: "available",
} as const satisfies AlgorithmRoadmapTrack;

export function validateAlgorithmRoadmap(roadmap: AlgorithmRoadmapTrack): AlgorithmRoadmapQualityResult {
  const issues: AlgorithmRoadmapQualityIssue[] = [];
  const structuralNodeIds = new Set<string>(algorithmTaxonomyStructure.roadmapNodes.map((node) => node.id));
  const presentationNodeIds = new Set(Object.keys(ALGORITHM_ROADMAP_PRESENTATION));
  const itemTypes = new Set<string>(ALGORITHM_QUESTION_TYPES);
  for (const id of structuralNodeIds) if (!presentationNodeIds.has(id)) issues.push({ code: "missing_presentation_metadata", message: `Missing presentation metadata: ${id}.`, nodeId: id });
  for (const id of presentationNodeIds) if (!structuralNodeIds.has(id)) issues.push({ code: "orphan_presentation_metadata", message: `Orphan presentation metadata: ${id}.`, nodeId: id });
  for (const node of roadmap.nodes) {
    if (node.recommendedItemTypes.some((itemType) => !itemTypes.has(itemType))) issues.push({ code: "unknown_recommended_item_type", message: `Unknown recommended item type in ${node.id}.`, nodeId: node.id });
    for (const term of ALGORITHM_FORBIDDEN_MODEL_TERMS) if (`${node.label} ${node.shortDescription} ${node.learningObjectives.map((objective) => objective.text).join(" ")}`.toLowerCase().includes(term)) issues.push({ code: "forbidden_visible_term", message: `Forbidden visible term in ${node.id}.`, nodeId: node.id });
  }
  return { issues, valid: issues.length === 0 };
}
