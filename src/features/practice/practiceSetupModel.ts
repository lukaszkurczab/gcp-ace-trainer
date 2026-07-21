import {
  ALGORITHMS_TRACK_ID,
  type TrackId,
} from "../../domain";

export type PracticeReviewBehaviorCopy = {
  detail: string;
  showToggle: boolean;
  title: string;
};

export function getPracticeReviewBehaviorCopy(trackId: TrackId): PracticeReviewBehaviorCopy {
  if (trackId === ALGORITHMS_TRACK_ID) {
    return {
      detail: "Reinsert one missed item later in this session. Missed Algorithms items are always saved to the Review queue.",
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
