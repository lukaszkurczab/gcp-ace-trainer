import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";

import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import type { TrackId } from "../../domain";
import { readActiveTrackId, readLearningPlanStorageScope } from "../../application/learningReadModels";
import {
  loadPracticeReadData,
  STORED_TRACK_REQUEST_KEY,
  type PracticeReadData,
  type PracticeRequestKey,
} from "../../application/practiceReadModels";
import { isPracticeReadOwnerCurrent } from "./practiceReadOwner";
export { isPracticeReadOwnerCurrent } from "./practiceReadOwner";

export type PracticeReadState =
  | Readonly<{ kind: "pending"; requestKey: PracticeRequestKey }>
  | Readonly<{ kind: "ready"; requestKey: PracticeRequestKey } & PracticeReadData>
  | Readonly<{ kind: "unavailable"; reason: string; requestKey: PracticeRequestKey }>;

function currentScopeMatches(expected: object): boolean {
  try { return readLearningPlanStorageScope() === expected; } catch { return false; }
}

export function usePracticeReadModel(input: Readonly<{
  errorFallback: string;
  includeReviews?: boolean;
  requestedTrackId?: TrackId;
}>): Readonly<{
  ownerMatches: boolean;
  readState: PracticeReadState;
  requestKey: PracticeRequestKey;
  retry: () => void;
}> {
  const requestKey: PracticeRequestKey = input.requestedTrackId ?? STORED_TRACK_REQUEST_KEY;
  const includeReviews = input.includeReviews ?? false;
  const [retryGeneration, setRetryGeneration] = useState(0);
  const [readState, setReadState] = useState<PracticeReadState>({ kind: "pending", requestKey });
  const [readScope, setReadScope] = useState<object | null>(null);
  const [loadedTrackId, setLoadedTrackId] = useState<TrackId | null>(null);
  const readScopeRef = useRef(readScope);
  readScopeRef.current = readScope;
  let currentScope: object | null = null;
  try { currentScope = readLearningPlanStorageScope(); } catch { currentScope = null; }
  let currentTrackId: TrackId | null = null;
  try { currentTrackId = readActiveTrackId(); } catch { currentTrackId = null; }
  const ownerMatches = isPracticeReadOwnerCurrent({
    currentScope,
    currentTrackId,
    loadedScope: readScope,
    loadedTrackId,
    requestedTrackId: input.requestedTrackId,
  });

  useFocusEffect(
    useCallback(() => {
      const capturedRequestKey = requestKey;
      let capturedScope: object;
      try { capturedScope = readLearningPlanStorageScope(); }
      catch { setReadState({ kind: "pending", requestKey: capturedRequestKey }); return () => undefined; }
      let isActive = true;
      setReadState((current) => {
        let storedTrackMatches = input.requestedTrackId !== undefined;
        try { storedTrackMatches = storedTrackMatches || (current.kind === "ready" && readActiveTrackId() === current.activeTrackId); }
        catch { storedTrackMatches = false; }
        return current.kind === "ready" && current.requestKey === capturedRequestKey &&
          readScopeRef.current === capturedScope && storedTrackMatches
          ? current
          : { kind: "pending", requestKey: capturedRequestKey };
      });

      void loadPracticeReadData({ includeReviews, requestedTrackId: input.requestedTrackId })
        .then((data) => {
          if (!isActive) return;
          if (!currentScopeMatches(capturedScope)) return;
          setReadScope(capturedScope);
          setLoadedTrackId(data.activeTrackId);
          setReadState({ kind: "ready", requestKey: capturedRequestKey, ...data });
        })
        .catch((error: unknown) => {
          if (!isActive) return;
          if (!currentScopeMatches(capturedScope)) return;
          setReadScope(capturedScope);
          if (input.requestedTrackId !== undefined) setLoadedTrackId(input.requestedTrackId);
          else {
            try { setLoadedTrackId(readActiveTrackId()); } catch { setLoadedTrackId(null); }
          }
          setReadState({
            kind: "unavailable",
            reason: describeOperationalFailure(error, input.errorFallback),
            requestKey: capturedRequestKey,
          });
        });

      return () => {
        isActive = false;
      };
    }, [currentTrackId, includeReviews, input.errorFallback, input.requestedTrackId, requestKey, retryGeneration]),
  );

  const retry = useCallback(() => {
    setRetryGeneration((generation) => generation + 1);
  }, []);

  return { ownerMatches, readState, requestKey, retry };
}
