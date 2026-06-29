import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  type TrackId,
} from "../domain";
import {
  algorithmsContentAdapter,
  algorithmsReviewAdapter,
  algorithmsScoringAdapter,
} from "./algorithms";
import {
  cloudCertificationContentAdapter,
  cloudCertificationReviewAdapter,
  cloudCertificationScoringAdapter,
} from "./cloud-certification";
import type { TrackAdapter } from "./types";

export const cloudCertificationAdapter: TrackAdapter = {
  content: cloudCertificationContentAdapter,
  review: cloudCertificationReviewAdapter,
  scoring: cloudCertificationScoringAdapter,
  trackId: CLOUD_CERTIFICATION_TRACK_ID,
};

export const algorithmsAdapter: TrackAdapter = {
  content: algorithmsContentAdapter,
  review: algorithmsReviewAdapter,
  scoring: algorithmsScoringAdapter,
  trackId: ALGORITHMS_TRACK_ID,
};

export const TRACK_ADAPTERS = [
  cloudCertificationAdapter,
  algorithmsAdapter,
] as const satisfies readonly TrackAdapter[];

export function getTrackAdapter(trackId: TrackId): TrackAdapter {
  const adapter = TRACK_ADAPTERS.find((item) => item.trackId === trackId);

  if (!adapter) {
    throw new Error(`Unknown track adapter id: ${trackId}`);
  }

  return adapter;
}
