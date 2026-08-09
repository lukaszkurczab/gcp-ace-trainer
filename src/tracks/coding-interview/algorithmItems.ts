import type { AlgorithmQuestion } from "./algorithmQuestionTypes";
import { ALGORITHM_ROADMAP, type AlgorithmRoadmapNode, type AlgorithmRoadmapNodeId } from "./algorithmRoadmap";

export type AlgorithmQuestionEntry = Readonly<{ question: AlgorithmQuestion; roadmapNodeId: string }>;
export function getAlgorithmItemById(itemId: string, items: readonly AlgorithmQuestion[]): AlgorithmQuestion | undefined { return items.find((item) => item.id === itemId); }
export function getAlgorithmQuestionEntries(items: readonly AlgorithmQuestion[]): readonly AlgorithmQuestionEntry[] { return items.map((question) => Object.freeze({ question, roadmapNodeId: question.taxonomy.roadmapNodeId })); }
export function getAlgorithmItemsForRoadmapNode(nodeId: AlgorithmRoadmapNodeId, items: readonly AlgorithmQuestion[]): readonly AlgorithmQuestion[] { return items.filter((item) => item.taxonomy.roadmapNodeId === nodeId); }
export function getRoadmapNodesWithActiveItems(items: readonly AlgorithmQuestion[]): readonly AlgorithmRoadmapNode[] { const ids = new Set(items.map((item) => item.taxonomy.roadmapNodeId)); return ALGORITHM_ROADMAP.nodes.filter((node) => ids.has(node.id)); }
export function isAlgorithmRoadmapNodeSelectable(node: AlgorithmRoadmapNode, items: readonly AlgorithmQuestion[]): boolean { return getAlgorithmItemsForRoadmapNode(node.id, items).length >= node.minimumActiveItemCount; }
export function isAlgorithmItemSelectable(item: AlgorithmQuestion, items: readonly AlgorithmQuestion[]): boolean { const node = ALGORITHM_ROADMAP.nodes.find((candidate) => candidate.id === item.taxonomy.roadmapNodeId); return !!node && isAlgorithmRoadmapNodeSelectable(node, items); }
export function getSelectableAlgorithmItems(items: readonly AlgorithmQuestion[]): readonly AlgorithmQuestion[] { return items.filter((item) => isAlgorithmItemSelectable(item, items)); }
export function getFirstUsableAlgorithmRoadmapNode(items: readonly AlgorithmQuestion[]): AlgorithmRoadmapNode { const node = ALGORITHM_ROADMAP.nodes.find((candidate) => isAlgorithmRoadmapNodeSelectable(candidate, items)); if (!node) throw new Error("No selectable Algorithms roadmap node has items."); return node; }
