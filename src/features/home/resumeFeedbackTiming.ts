import type { TrainingSession } from "../../domain";

export function feedbackTimingFromDurableSession(session: TrainingSession): "afterEachAnswer" | "atSessionEnd" {
  const feedbackMode = session.configurationSnapshot.feedbackMode;
  if (feedbackMode === "afterEachAnswer" || feedbackMode === "atSessionEnd") return feedbackMode;
  throw new Error("Active Algorithms session is missing its canonical feedback timing.");
}
