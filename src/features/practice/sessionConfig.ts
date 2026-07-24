import { ALGORITHMS_TRACK_ID, type ContentItemRef, type TrackId } from "../../domain";
import {
  ALGORITHM_MODE_IDS,
  getAlgorithmSessionNodeById,
  getAlgorithmMode,
  isAlgorithmModeId,
  type AlgorithmModeId,
} from "../../tracks/algorithms";
import type { AlgorithmSelectionScope } from "../../tracks/algorithms/algorithmSessionSelection";
import { getCertificationMode, type CertificationDomain } from "../../tracks/cloud-certification";

export type PracticeSessionSource =
  | "home"
  | "practiceHub"
  | "practiceSetup"
  | "modeShortcut";

export type CertificationPracticeSessionMode = "certification-diagnostic-baseline" | "certification-focus-practice" | "certification-scenario-practice" | "certification-weak-area-review" | "cloud-practice" | "cloud-review" | "cloud-exam-simulation";
export type PracticeSessionMode = AlgorithmModeId | CertificationPracticeSessionMode;

export type PracticeSessionLength = 10 | 20 | 40;

export type PracticeFeedbackMode = "afterEachAnswer" | "atSessionEnd";

export type PracticeReviewSource = "due_queue" | "session_misses";

export type PracticeSessionRouteParams = {
  algorithmScope?: AlgorithmSelectionScope;
  competencyId?: string;
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
const certificationPracticeModes: readonly CertificationPracticeSessionMode[] = ["certification-diagnostic-baseline", "certification-focus-practice", "certification-scenario-practice", "certification-weak-area-review", "cloud-practice", "cloud-review", "cloud-exam-simulation"];

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
    if (mode === ALGORITHM_MODE_IDS.customPractice && input.feedbackMode === undefined) {
      throw new Error("Algorithms Custom Practice requires an explicit feedback mode.");
    }
    const feedbackMode = input.feedbackMode ?? profile.feedbackMode;
    if (!profile.supportedFeedbackModes.includes(feedbackMode)) {
      throw new Error(`Algorithms mode ${mode} does not support feedback mode ${feedbackMode}.`);
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
      feedbackMode,
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

  const mode = input.mode ?? "certification-diagnostic-baseline";
  if (!certificationPracticeModes.some((candidate) => candidate === mode)) {
    throw new Error(`Unknown Certification practice mode id: ${mode}`);
  }

  const definition = getCertificationMode(mode);
  if (mode === "cloud-exam-simulation") throw new Error("Cloud Exam Simulation starts only from the canonical exam entry.");
  if (mode === "certification-diagnostic-baseline") {
    if (input.sessionLength !== undefined || input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined) throw new Error("Certification Diagnostic Baseline does not render or accept optional setup controls.");
    return { feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength: 40, source: input.source ?? "practiceHub", topicId: input.topicId, trackId: input.trackId };
  }
  if (mode === "certification-focus-practice") {
    if (!isCloudTopicId(input.topicId)) throw new Error("Certification Focus Practice requires an explicitly selected Cloud domain.");
    if (input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined) throw new Error("Certification Focus Practice does not render or accept undeclared setup controls.");
    const sessionLength = input.sessionLength ?? (definition.defaultQuestionCount as PracticeSessionLength | undefined);
    if (!sessionLength || ![10, 20, 40].includes(sessionLength)) throw new Error("Certification Focus Practice supports 10, 20, or 40 questions.");
    return { feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength, source: input.source ?? "practiceHub", topicId: input.topicId, trackId: input.trackId };
  }
  if (mode === "certification-scenario-practice") {
    if (!input.competencyId?.trim()) throw new Error("Certification Scenario Practice requires an explicitly selected competency.");
    if (input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined) throw new Error("Certification Scenario Practice does not render or accept undeclared setup controls.");
    const sessionLength = input.sessionLength ?? (definition.defaultQuestionCount as PracticeSessionLength | undefined);
    if (!sessionLength || ![10, 20, 40].includes(sessionLength)) throw new Error("Certification Scenario Practice supports 10, 20, or 40 questions.");
    return { competencyId: input.competencyId, feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength, source: input.source ?? "practiceHub", topicId: input.topicId, trackId: input.trackId };
  }
  if (mode === "certification-weak-area-review") {
    if (input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined || input.competencyId !== undefined || input.topicId) throw new Error("Certification Weak Area Review does not render or accept undeclared setup controls.");
    const sessionLength = input.sessionLength ?? (definition.defaultQuestionCount as PracticeSessionLength | undefined);
    if (!sessionLength || ![10, 20].includes(sessionLength)) throw new Error("Certification Weak Area Review supports 10 or 20 questions.");
    return { feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength, source: input.source ?? "practiceHub", topicId: "", trackId: input.trackId };
  }
  const sessionLength = input.sessionLength ?? (definition.defaultQuestionCount as PracticeSessionLength | undefined) ?? DEFAULT_PRACTICE_SESSION_LENGTH;
  if (![10, 20, 40].includes(sessionLength)) throw new Error("Cloud practice supports 10, 20, or 40 questions.");
  if (mode === "cloud-review" && input.topicId && !isCloudTopicId(input.topicId)) throw new Error("Cloud Review requires a canonical Cloud domain topic.");
  return {
    feedbackMode: input.feedbackMode ?? DEFAULT_FEEDBACK_MODE,
    algorithmScope: input.algorithmScope,
    mode,
    reviewBehaviorEnabled: input.reviewBehaviorEnabled ?? false,
    reviewItemRefs: input.reviewItemRefs,
    reviewSource: input.reviewSource,
    sessionLength,
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
