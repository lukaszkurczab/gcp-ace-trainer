export const DESIGN_INTERVIEW_MODE_IDS = Object.freeze([
  "design-interview-learn-framework",
  "design-interview-tradeoff-practice",
  "design-interview-weak-area-review",
] as const);

export type DesignInterviewModeId = (typeof DESIGN_INTERVIEW_MODE_IDS)[number];

export function isDesignInterviewModeId(value: string): value is DesignInterviewModeId {
  return DESIGN_INTERVIEW_MODE_IDS.includes(value as DesignInterviewModeId);
}

export function assertDesignInterviewModeId(value: string): DesignInterviewModeId {
  if (!isDesignInterviewModeId(value)) throw new Error(`Unknown Design Interview mode ${value}.`);
  return value;
}
