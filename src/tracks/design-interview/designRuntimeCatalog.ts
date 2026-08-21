import type { ContentItemRef, ContentPackagePin } from "../../domain/learning";
import type { FeedbackDocument, VerifiedPackageMode, VerifiedPackageModeConfiguration } from "../../content/contracts";

export type DesignChoiceInteraction = Readonly<{
  type: "choice";
  selectionMode: "single" | "multiple";
  options: readonly Readonly<{ id: string; text: string }>[];
  acceptedOptionIds: readonly string[];
}>;

export type DesignOrderingInteraction = Readonly<{
  type: "ordering";
  elements: readonly Readonly<{ id: string; text: string }>[];
  canonicalOrder: readonly string[];
  scoringMethod: "adjacent_relations";
}>;

export type DesignDecisionMatrixInteraction = Readonly<{
  type: "decision_matrix";
  dimensions: readonly Readonly<{
    dimensionId: string;
    label: string;
    values: readonly Readonly<{ valueId: string; text: string }>[];
    acceptedValueIds: readonly string[];
  }>[];
  scoringMethod: "dimension_exact";
}>;

export type DesignInteraction = DesignChoiceInteraction | DesignOrderingInteraction | DesignDecisionMatrixInteraction;

export type DesignQuestion = Readonly<{
  id: string;
  prompt: string;
  interaction: DesignInteraction;
  feedback: Readonly<{ reason: string; details: FeedbackDocument; wrongOptionExplanationsByOptionId: Readonly<Record<string, string>> }>;
  taxonomy: Readonly<{ roadmapNodeId: string; nodeId: string; mentalUnitId: string; primaryCompetencyId: string }>;
}>;

export interface DesignRuntimeCatalog {
  getTrackId(): string;
  getContentVersion(): string;
  getPackagePin(): ContentPackagePin;
  getItems(): readonly DesignQuestion[];
  getItemById(itemId: string): DesignQuestion;
  toContentItemRef(item: DesignQuestion): ContentItemRef;
  getMode(modeId: string): VerifiedPackageMode;
  getConfiguration(modeId: string): VerifiedPackageModeConfiguration;
  getFreeNodeId(): string;
}
