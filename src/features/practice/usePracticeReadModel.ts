import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import type { TrackId } from "../../domain";
import {
  loadPracticeReadData,
  STORED_TRACK_REQUEST_KEY,
  type PracticeReadData,
  type PracticeRequestKey,
} from "../../application/practiceReadModels";

export type PracticeReadState =
  | Readonly<{ kind: "pending"; requestKey: PracticeRequestKey }>
  | Readonly<{ kind: "ready"; requestKey: PracticeRequestKey } & PracticeReadData>
  | Readonly<{ kind: "unavailable"; reason: string; requestKey: PracticeRequestKey }>;

export function usePracticeReadModel(input: Readonly<{
  errorFallback: string;
  includeReviews?: boolean;
  requestedTrackId?: TrackId;
}>): Readonly<{
  readState: PracticeReadState;
  requestKey: PracticeRequestKey;
  retry: () => void;
}> {
  const requestKey: PracticeRequestKey = input.requestedTrackId ?? STORED_TRACK_REQUEST_KEY;
  const includeReviews = input.includeReviews ?? false;
  const [retryGeneration, setRetryGeneration] = useState(0);
  const [readState, setReadState] = useState<PracticeReadState>({ kind: "pending", requestKey });

  useFocusEffect(
    useCallback(() => {
      const capturedRequestKey = requestKey;
      let isActive = true;
      setReadState({ kind: "pending", requestKey: capturedRequestKey });

      void loadPracticeReadData({ includeReviews, requestedTrackId: input.requestedTrackId })
        .then((data) => {
          if (!isActive) return;
          setReadState({ kind: "ready", requestKey: capturedRequestKey, ...data });
        })
        .catch((error: unknown) => {
          if (!isActive) return;
          setReadState({
            kind: "unavailable",
            reason: describeOperationalFailure(error, input.errorFallback),
            requestKey: capturedRequestKey,
          });
        });

      return () => {
        isActive = false;
      };
    }, [includeReviews, input.errorFallback, input.requestedTrackId, requestKey, retryGeneration]),
  );

  const retry = useCallback(() => {
    setRetryGeneration((generation) => generation + 1);
  }, []);

  return { readState, requestKey, retry };
}
