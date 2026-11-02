/** New sessions require Premium regardless of their selected questions. */
export function requiresPremiumProductMode(modeId: string): boolean {
  return premiumModeAdmission(modeId) !== null;
}

/** ACM keeps the admission of any already-durable session, including legacy sessions. */
export function requiresPremiumForSessionContinuation(modeId: string): boolean {
  return premiumModeAdmission(modeId) === "each_command";
}

function premiumModeAdmission(modeId: string): "session_start" | "each_command" | null {
  if (modeId === "coding-interview-approach-challenge") return "session_start";
  if (modeId === "certification-exam-simulation" || modeId === "coding-interview-simulation" || modeId === "design-interview-simulation") return "each_command";
  return null;
}
