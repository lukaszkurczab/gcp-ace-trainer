import { getAlgorithmContentCatalog } from "../../content/catalogRepository";
import type { AlgorithmQuestion } from "./algorithmQuestionTypes";
import { ALGORITHM_ROADMAP, type AlgorithmRoadmapNode, type AlgorithmRoadmapNodeId } from "./algorithmRoadmap";

export type AlgorithmQuestionEntry = Readonly<{ question: AlgorithmQuestion; roadmapNodeId: string }>;
export function getAlgorithmItems(): readonly AlgorithmQuestion[] { return getAlgorithmContentCatalog().getItems(); }
export function getAlgorithmItemById(itemId: string): AlgorithmQuestion | undefined { return getAlgorithmItems().find((item) => item.id === itemId); }
export function getAlgorithmQuestionEntries(items: readonly AlgorithmQuestion[] = getAlgorithmItems()): readonly AlgorithmQuestionEntry[] { return items.map((question) => Object.freeze({ question, roadmapNodeId: question.taxonomy.roadmapNodeId })); }
export function getAlgorithmItemsForRoadmapNode(nodeId: AlgorithmRoadmapNodeId, items: readonly AlgorithmQuestion[] = getAlgorithmItems()): readonly AlgorithmQuestion[] { return items.filter((item) => item.taxonomy.roadmapNodeId === nodeId); }
export function getRoadmapNodesWithActiveItems(items: readonly AlgorithmQuestion[] = getAlgorithmItems()): readonly AlgorithmRoadmapNode[] { const ids = new Set(items.map((item) => item.taxonomy.roadmapNodeId)); return ALGORITHM_ROADMAP.nodes.filter((node) => ids.has(node.id)); }
export function isAlgorithmRoadmapNodeSelectable(node: AlgorithmRoadmapNode, items: readonly AlgorithmQuestion[] = getAlgorithmItems()): boolean { return getAlgorithmItemsForRoadmapNode(node.id, items).length >= node.minimumActiveItemCount; }
export function isAlgorithmItemSelectable(item: AlgorithmQuestion, items: readonly AlgorithmQuestion[] = getAlgorithmItems()): boolean { const node = ALGORITHM_ROADMAP.nodes.find((candidate) => candidate.id === item.taxonomy.roadmapNodeId); return !!node && isAlgorithmRoadmapNodeSelectable(node, items); }
export function getSelectableAlgorithmItems(items: readonly AlgorithmQuestion[] = getAlgorithmItems()): readonly AlgorithmQuestion[] { return items.filter((item) => isAlgorithmItemSelectable(item, items)); }
export function getFirstUsableAlgorithmRoadmapNode(items: readonly AlgorithmQuestion[] = getAlgorithmItems()): AlgorithmRoadmapNode { const node = ALGORITHM_ROADMAP.nodes.find((candidate) => isAlgorithmRoadmapNodeSelectable(candidate, items)); if (!node) throw new Error("No selectable Algorithms roadmap node has items."); return node; }
