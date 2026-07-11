import type {
  TrackAdapter,
  TrackContentItem,
  TrackScoringContext,
} from "../../tracks";
import type {
  TrainingAttempt,
  TrainingAttemptResult,
  TrainingSession,
} from "../training";

export type ScoreTrainingResponseInput<Item extends TrackContentItem> = {
  adapter: TrackAdapter<Item>;
  context?: TrackScoringContext;
  item: Item;
  response: TrainingAttempt["response"];
  session?: TrainingSession;
};

export type ScoreTrainingAttemptInput<Item extends TrackContentItem> = {
  adapter: TrackAdapter<Item>;
  attempt: TrainingAttempt;
  item: Item;
  session?: TrainingSession;
};

export function scoreTrainingResponse<Item extends TrackContentItem>(
  input: ScoreTrainingResponseInput<Item>,
): TrainingAttemptResult {
  assertScoringTracksMatch(input.adapter, input.session);
  return input.adapter.scoring.scoreAttempt(input.item, input.response, input.context);
}

export function scoreTrainingAttempt<Item extends TrackContentItem>(
  input: ScoreTrainingAttemptInput<Item>,
): TrainingAttempt {
  assertScoringTracksMatch(input.adapter, input.session);

  if (input.attempt.trackId !== input.adapter.trackId) {
    throw new Error(
      `Training attempt ${input.attempt.id} does not belong to adapter track ${input.adapter.trackId}.`,
    );
  }

  if (input.attempt.itemId !== input.item.id) {
    throw new Error(
      `Training attempt ${input.attempt.id} does not reference item ${input.item.id}.`,
    );
  }

  if (input.session && input.attempt.sessionId !== input.session.id) {
    throw new Error(
      `Training attempt ${input.attempt.id} does not belong to session ${input.session.id}.`,
    );
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
  session?: TrainingSession,
): void {
  if (session && session.trackId !== adapter.trackId) {
    throw new Error(
      `Track adapter ${adapter.trackId} cannot score session track ${session.trackId}.`,
    );
  }
}
