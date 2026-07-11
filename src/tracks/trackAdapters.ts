import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  type TrackId,
} from "../domain";
import type { TrainingItem } from "../domain/training";
import {
  type AlgorithmQuestion,
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

export const cloudCertificationAdapter = {
  content: cloudCertificationContentAdapter,
  review: cloudCertificationReviewAdapter,
  scoring: cloudCertificationScoringAdapter,
  trackId: CLOUD_CERTIFICATION_TRACK_ID,
} satisfies TrackAdapter<TrainingItem>;

export const algorithmsAdapter = {
  content: algorithmsContentAdapter,
  review: algorithmsReviewAdapter,
  scoring: algorithmsScoringAdapter,
  trackId: ALGORITHMS_TRACK_ID,
} satisfies TrackAdapter<AlgorithmQuestion>;

export const TRACK_ADAPTERS = [
  cloudCertificationAdapter,
  algorithmsAdapter,
] as const;

export function getTrackAdapter(
  trackId: typeof CLOUD_CERTIFICATION_TRACK_ID,
): typeof cloudCertificationAdapter;
export function getTrackAdapter(
  trackId: typeof ALGORITHMS_TRACK_ID,
): typeof algorithmsAdapter;
export function getTrackAdapter(
  trackId: TrackId,
): typeof cloudCertificationAdapter | typeof algorithmsAdapter;
export function getTrackAdapter(
  trackId: TrackId,
): typeof cloudCertificationAdapter | typeof algorithmsAdapter {
  const adapter = TRACK_ADAPTERS.find((item) => item.trackId === trackId);

  if (!adapter) {
    throw new Error(`Unknown track adapter id: ${trackId}`);
  }

  return adapter;
}
