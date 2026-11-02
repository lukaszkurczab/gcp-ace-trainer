import type { ApproachChallengeStageProjection } from "../../application/coding-interview/approachChallengeSessionFacade";
import { PracticeFeedbackContent } from "./PracticeFeedbackBlock";
import { approachChallengeDetailLines } from "./feedbackDetails";

/** Used by both the live stage and exact historical detail; never evaluates or saves an answer. */
export function ApproachChallengeFeedback({ stage }: Readonly<{
  stage: Pick<ApproachChallengeStageProjection, "occurrenceId" | "feedback" | "result">;
}>) {
  if (!stage.feedback || !stage.result) return null;
  return <PracticeFeedbackContent key={stage.occurrenceId} itemId={stage.occurrenceId} feedback={{
    reason: stage.feedback.reason,
    result: stage.result.kind,
    details: [...approachChallengeDetailLines(stage.feedback)],
    messages: stage.feedback.messages,
  }} />;
}
