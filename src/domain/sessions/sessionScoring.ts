import type { TrackAdapter, TrackScoringContext } from "../../tracks";
import type {
  TrainingAttempt,
  TrainingAttemptResult,
  TrainingItem,
  TrainingSession,
} from "../training";

export type ScoreTrainingResponseInput = {
  adapter: TrackAdapter;
  context?: TrackScoringContext;
  item: TrainingItem;
  response: TrainingAttempt["response"];
  session?: TrainingSession;
};

export type ScoreTrainingAttemptInput = {
  adapter: TrackAdapter;
  attempt: TrainingAttempt;
  item: TrainingItem;
  session?: TrainingSession;
};

export function scoreTrainingResponse(input: ScoreTrainingResponseInput): TrainingAttemptResult {
  assertScoringTracksMatch(input.adapter, input.item, input.session);
  return input.adapter.scoring.scoreAttempt(input.item, input.response, input.context);
}

export function scoreTrainingAttempt(input: ScoreTrainingAttemptInput): TrainingAttempt {
  assertScoringTracksMatch(input.adapter, input.item, input.session);

  if (input.attempt.trackId !== input.item.trackId) {
    throw new Error(`Training attempt ${input.attempt.id} does not belong to item track ${input.item.trackId}.`);
  }

  if (input.attempt.itemId !== input.item.id) {
    throw new Error(`Training attempt ${input.attempt.id} does not reference item ${input.item.id}.`);
  }

  if (input.session && input.attempt.sessionId !== input.session.id) {
    throw new Error(`Training attempt ${input.attempt.id} does not belong to session ${input.session.id}.`);
  }

  return {
    ...input.attempt,
    result: input.adapter.scoring.scoreAttempt(input.item, input.attempt.response, {
      answeredAt: input.attempt.answeredAt,
      modeId: input.attempt.modeId,
    }),
  };
}

function assertScoringTracksMatch(
  adapter: TrackAdapter,
  item: TrainingItem,
  session?: TrainingSession,
): void {
  if (adapter.trackId !== item.trackId) {
    throw new Error(`Track adapter ${adapter.trackId} cannot score item from track ${item.trackId}.`);
  }

  if (session && session.trackId !== item.trackId) {
    throw new Error(`Training item ${item.id} does not belong to session track ${session.trackId}.`);
  }
}
