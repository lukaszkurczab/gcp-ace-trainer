import { isDesignInterviewModeId } from "../../tracks/design-interview";

/** Product modes that always require Premium, regardless of their selected questions. */
export function requiresPremiumProductMode(modeId: string): boolean {
  return modeId === "certification-exam-simulation" || modeId === "coding-interview-simulation" || isDesignInterviewModeId(modeId);
}
