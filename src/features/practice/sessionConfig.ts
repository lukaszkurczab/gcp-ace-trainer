import { ALGORITHMS_TRACK_ID, type ContentItemRef, type TrackId } from "../../domain";
import {
  ALGORITHM_MODE_IDS,
  getAlgorithmSessionNodeById,
  getAlgorithmMode,
  isAlgorithmModeId,
  type AlgorithmModeId,
} from "../../tracks/algorithms";
import type { AlgorithmSelectionScope } from "../../tracks/algorithms/algorithmSessionSelection";
import type { CertificationDomain } from "../../tracks/cloud-certification";

export type PracticeSessionSource =
  | "home"
  | "practiceHub"
  | "practiceSetup"
  | "modeShortcut";

export type CertificationPracticeSessionMode =
  | "learn"
  | "drill"
  | "review"
  | "weakArea"
  | "practice"
  | "default";
export type PracticeSessionMode = AlgorithmModeId | CertificationPracticeSessionMode;

export type PracticeSessionLength = 10 | 20 | 40;

export type PracticeFeedbackMode = "afterEachAnswer" | "atSessionEnd";

export type PracticeReviewSource = "due_queue" | "session_misses";

export type PracticeSessionRouteParams = {
  algorithmScope?: AlgorithmSelectionScope;
  feedbackMode: PracticeFeedbackMode;
  mode: PracticeSessionMode;
  reviewBehaviorEnabled: boolean;
  reviewItemRefs?: readonly ContentItemRef[];
  reviewSource?: PracticeReviewSource;
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

const cloudDomainTopicIds: readonly CertificationDomain[] = [
  "setup_environment",
  "planning_implementation",
  "operations",
  "access_security",
];
const certificationPracticeModes: readonly CertificationPracticeSessionMode[] = [
  "learn",
  "drill",
  "review",
  "weakArea",
  "practice",
  "default",
];

export function buildPracticeSessionConfig(
  input: PracticeSessionConfigInput,
): PracticeSessionRouteParams {
  if (input.trackId === ALGORITHMS_TRACK_ID) {
    const mode = input.mode ?? ALGORITHM_MODE_IDS.guidedPractice;
    if (!isAlgorithmModeId(mode)) {
      throw new Error(`Unknown Algorithms mode id: ${mode}`);
    }

    const profile = getAlgorithmMode(mode).profile;
    const sessionLength = input.sessionLength ?? profile.sessionLength;
    if (!profile.supportedLengths.includes(sessionLength)) {
      throw new Error(`Algorithms mode ${mode} does not support session length ${sessionLength}.`);
    }
    if (input.feedbackMode !== undefined && input.feedbackMode !== profile.feedbackMode) {
      throw new Error(`Algorithms mode ${mode} owns feedback mode ${profile.feedbackMode}.`);
    }
    if (input.reviewBehaviorEnabled !== undefined && input.reviewBehaviorEnabled !== profile.reinsertEnabled) {
      throw new Error(`Algorithms mode ${mode} owns reinsert setting ${profile.reinsertEnabled}.`);
    }
    if ((input.reviewSource || input.reviewItemRefs) && mode !== ALGORITHM_MODE_IDS.weakAreaReview) {
      throw new Error(`Algorithms review source requires mode ${ALGORITHM_MODE_IDS.weakAreaReview}.`);
    }
    if (mode === ALGORITHM_MODE_IDS.weakAreaReview && !input.reviewSource) {
      throw new Error("Algorithms Weak Area Review requires due_queue or session_misses source.");
    }
    if (input.reviewItemRefs && input.reviewSource !== "session_misses") {
      throw new Error("Algorithms review item refs require session_misses source.");
    }
    const topicId = getAlgorithmSessionNodeById(input.topicId).id;

    return {
      feedbackMode: profile.feedbackMode,
      algorithmScope: input.algorithmScope,
      mode,
      reviewBehaviorEnabled: profile.reinsertEnabled,
      reviewItemRefs: input.reviewItemRefs,
      reviewSource: input.reviewSource,
      sessionLength,
      source: input.source ?? "practiceHub",
      topicId,
      trackId: input.trackId,
    };
  }

  const mode = input.mode ?? "default";
  if (!certificationPracticeModes.some((candidate) => candidate === mode)) {
    throw new Error(`Unknown Certification practice mode id: ${mode}`);
  }

  return {
    feedbackMode: input.feedbackMode ?? DEFAULT_FEEDBACK_MODE,
    algorithmScope: input.algorithmScope,
    mode,
    reviewBehaviorEnabled: input.reviewBehaviorEnabled ?? false,
    reviewItemRefs: input.reviewItemRefs,
    reviewSource: input.reviewSource,
    sessionLength: input.sessionLength ?? DEFAULT_PRACTICE_SESSION_LENGTH,
    source: input.source ?? "practiceHub",
    topicId: input.topicId,
    trackId: input.trackId,
  };
}

export function getGeneralPracticeReviewSource(
  mode: PracticeSessionMode,
): PracticeReviewSource | undefined {
  return mode === ALGORITHM_MODE_IDS.weakAreaReview ? "due_queue" : undefined;
}

export function isCloudTopicId(topicId: string): topicId is CertificationDomain {
  return cloudDomainTopicIds.some((domain) => domain === topicId);
}

export function getCloudDomainForTopicId(topicId: string): CertificationDomain {
  if (!isCloudTopicId(topicId)) throw new Error(`Unknown Cloud Certification topic: ${topicId}`);
  return topicId;
}
