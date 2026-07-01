import type { TrackId } from "../../domain";
import type { ExamDomain } from "../../types";

export type PracticeSessionSource =
  | "home"
  | "practiceHub"
  | "practiceSetup"
  | "modeShortcut";

export type PracticeSessionMode =
  | "learn"
  | "drill"
  | "review"
  | "weakArea"
  | "practice"
  | "default";

export type PracticeSessionLength = 10 | 20 | 40;

export type PracticeFeedbackMode = "afterEachAnswer" | "atSessionEnd";

export type PracticeSessionRouteParams = {
  feedbackMode: PracticeFeedbackMode;
  mode: PracticeSessionMode;
  reviewBehaviorEnabled: boolean;
  sessionLength: PracticeSessionLength;
  source: PracticeSessionSource;
  topicId: string;
  trackId: TrackId;
};

export type PracticeSessionConfigInput = Partial<PracticeSessionRouteParams> & {
  topicId: string;
  trackId: TrackId;
};

export const DEFAULT_PRACTICE_SESSION_LENGTH: PracticeSessionLength = 20;
export const DEFAULT_FEEDBACK_MODE: PracticeFeedbackMode = "afterEachAnswer";

const cloudDomainTopicIds: readonly ExamDomain[] = [
  "setup_environment",
  "planning_implementation",
  "operations",
  "access_security",
];

export function buildPracticeSessionConfig(
  input: PracticeSessionConfigInput,
): PracticeSessionRouteParams {
  return {
    feedbackMode: input.feedbackMode ?? DEFAULT_FEEDBACK_MODE,
    mode: input.mode ?? "default",
    reviewBehaviorEnabled: input.reviewBehaviorEnabled ?? false,
    sessionLength: input.sessionLength ?? DEFAULT_PRACTICE_SESSION_LENGTH,
    source: input.source ?? "practiceHub",
    topicId: input.topicId,
    trackId: input.trackId,
  };
}

export function isCloudTopicId(topicId: string): topicId is ExamDomain {
  return cloudDomainTopicIds.includes(topicId as ExamDomain);
}

export function getCloudDomainForTopicId(topicId: string): ExamDomain {
  return isCloudTopicId(topicId) ? topicId : "access_security";
}
