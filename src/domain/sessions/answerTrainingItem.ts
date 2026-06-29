import type {
  TrainingAttempt,
  TrainingAttemptConfidence,
  TrainingAttemptId,
  TrainingAttemptResponse,
  TrainingItem,
  TrainingItemTaxonomyRef,
  TrainingSession,
} from "../training";
import type { FeedbackSignal } from "../training/trainingFeedback";

export type AnswerTrainingItemInput = {
  answeredAt: string;
  confidence?: TrainingAttemptConfidence;
  durationSeconds?: number;
  feedbackSignals?: FeedbackSignal[];
  id?: TrainingAttemptId;
  item: TrainingItem;
  mistakeTypeRefs?: TrainingItemTaxonomyRef[];
  response: TrainingAttemptResponse;
  session: TrainingSession;
};

export function answerTrainingItem(input: AnswerTrainingItemInput): TrainingAttempt {
  const { item, session } = input;

  if (session.status !== "active") {
    throw new Error(`Cannot answer item in a ${session.status} training session.`);
  }

  if (item.trackId !== session.trackId) {
    throw new Error(`Training item ${item.id} does not belong to session track ${session.trackId}.`);
  }

  if (!session.itemRefs.some((itemRef) => itemRef.itemId === item.id)) {
    throw new Error(`Training item ${item.id} is not part of session ${session.id}.`);
  }

  return {
    answeredAt: input.answeredAt,
    confidence: input.confidence,
    durationSeconds: input.durationSeconds,
    feedbackSignals: input.feedbackSignals,
    id: input.id ?? buildTrainingAttemptId(session.id, item.id, input.answeredAt),
    itemId: item.id,
    itemType: item.type,
    mistakeTypeRefs: input.mistakeTypeRefs,
    modeId: session.modeId,
    response: input.response,
    sessionId: session.id,
    trackId: session.trackId,
  };
}

function buildTrainingAttemptId(
  sessionId: string,
  itemId: string,
  answeredAt: string,
): TrainingAttemptId {
  return `attempt:${sessionId}:${itemId}:${answeredAt}`;
}
