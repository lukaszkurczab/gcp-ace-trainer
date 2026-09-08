declare const learningPlanSlotIdBrand: unique symbol;
declare const proposalSlotIdBrand: unique symbol;

/** Stable identity shared by persisted plan slots and proposal slots. */
export type LearningPlanSlotId = string & Readonly<{
  [learningPlanSlotIdBrand]: "LearningPlanSlotId";
}>;

/** Stable identity emitted by the proposal generator. */
export type ProposalSlotId = LearningPlanSlotId & Readonly<{
  [proposalSlotIdBrand]: "ProposalSlotId";
}>;

export function createLearningPlanSlotId(value: string): LearningPlanSlotId {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("A learning plan slot requires a stable identity.");
  }
  return value as LearningPlanSlotId;
}

export function createProposalSlotId(value: string): ProposalSlotId {
  if (!/^proposal-slot:v1:(?:mon|tue|wed|thu|fri|sat|sun):18-00$/u.test(value)) {
    throw new Error("A proposal slot requires the canonical v1 identity.");
  }
  return value as ProposalSlotId;
}
