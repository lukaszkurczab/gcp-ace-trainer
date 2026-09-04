import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";

import { getAlgorithmsPracticeResultProjection, type AlgorithmsSessionResultProjection } from "../../application/coding-interview";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { createSimulationResultReadOwner, type SimulationResultReadOutcome, type SimulationResultReadToken } from "./simulationResultReadOwner";

export type SimulationResultReadState<Result> =
  | Readonly<{ kind: "pending"; requestKey: string }>
  | Readonly<{ kind: "ready"; requestKey: string; result: Result }>
  | Readonly<{ kind: "error"; requestKey: string; reason: string }>;

export function useSimulationResultRead(sessionId: string): Readonly<{
  retry: () => void;
  state: SimulationResultReadState<AlgorithmsSessionResultProjection>;
}> {
  const owner = useMemo(
    () => createSimulationResultReadOwner((requestKey) => getAlgorithmsPracticeResultProjection(requestKey)),
    [sessionId],
  );
  const activeRef = useRef(false);
  const currentTokenRef = useRef<SimulationResultReadToken | null>(null);
  const [state, setState] = useState<SimulationResultReadState<AlgorithmsSessionResultProjection>>({ kind: "pending", requestKey: sessionId });
  const publish = useCallback((token: SimulationResultReadToken, outcome: SimulationResultReadOutcome<AlgorithmsSessionResultProjection>) => {
    if (!owner.isCurrent(token) || outcome.kind === "stale") return;
    if (outcome.kind === "ready") setState({ kind: "ready", requestKey: token.requestKey, result: outcome.result });
    else setState({ kind: "error", reason: describeOperationalFailure(outcome.error, "The session result is not available because verification did not complete."), requestKey: token.requestKey });
  }, [owner]);
  const start = useCallback((): SimulationResultReadToken | null => {
    if (!activeRef.current) return null;
    const token = owner.begin(sessionId);
    currentTokenRef.current = token;
    setState({ kind: "pending", requestKey: token.requestKey });
    void owner.resolve(token).then((outcome) => publish(token, outcome));
    return token;
  }, [owner, publish, sessionId]);

  useFocusEffect(useCallback(() => {
    activeRef.current = true;
    start();
    return () => {
      activeRef.current = false;
      const token = currentTokenRef.current;
      if (token) owner.invalidate(token);
      currentTokenRef.current = null;
    };
  }, [owner, start]));

  const retry = useCallback(() => { start(); }, [start]);
  return { retry, state };
}
