import {
  CODING_INTERVIEW_TRACK_ID,
  type TrackId,
} from "../../domain";

export type PracticeReviewBehaviorCopy = {
  detail: string;
  showToggle: boolean;
  title: string;
};

export function getPracticeReviewBehaviorCopy(trackId: TrackId): PracticeReviewBehaviorCopy {
  if (trackId === CODING_INTERVIEW_TRACK_ID) {
    return {
      detail: "Reinsert one missed item later in this session. Missed Coding Interview items are always saved to the Review queue.",
      showToggle: true,
      title: "Reinsert missed items",
    };
  }

  return {
    detail: "Add missed items to an end-of-session correction pass. Extra review items are tracked separately from normal stats.",
    showToggle: true,
    title: "Review behavior",
  };
}

/** Review modes whose availability is evidence_conditioned in the product mode config. */
export const PRACTICE_SETUP_REVIEW_EVIDENCE_MODE_IDS: readonly string[] = Object.freeze([
  "certification-weak-area-review",
  "certification-quick-review",
  "design-interview-weak-area-review",
  "coding-interview-weak-area-review",
]);

/** Setup reads the review queue only for a review mode; other setups keep the Hub-only review read. */
export function practiceSetupNeedsReviewRead(mode: string | undefined): boolean {
  return mode !== undefined && PRACTICE_SETUP_REVIEW_EVIDENCE_MODE_IDS.includes(mode);
}

/**
 * Same gate as the Practice hub: an evidence-conditioned review mode needs a
 * due or manually requested review right now. A route that carries its own
 * evidence (session misses or explicit review item refs) is not gated here.
 */
export function isPracticeSetupReviewEvidenceMissing(input: Readonly<{
  availability: "immediate" | "evidence_conditioned";
  hasReviewEvidence: boolean;
  reviewSource?: string;
  hasReviewItemRefs?: boolean;
}>): boolean {
  if (input.availability !== "evidence_conditioned") return false;
  if (input.reviewSource === "session_misses" || input.hasReviewItemRefs === true) return false;
  return !input.hasReviewEvidence;
}
