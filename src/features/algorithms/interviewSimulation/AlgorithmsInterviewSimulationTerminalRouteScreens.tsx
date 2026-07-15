import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";

import { createAlgorithmsInterviewSimulationController, type AlgorithmsInterviewSimulationControllerState } from "../../../application/algorithms";
import { EmptyState, Screen } from "../../../components";
import { ROUTES } from "../../../constants";
import type { RootStackParamList } from "../../../navigation";
import { AlgorithmsInterviewSimulationReviewScreen } from "./AlgorithmsInterviewSimulationReviewScreen";
import { AlgorithmsInterviewSimulationSummaryScreen } from "./AlgorithmsInterviewSimulationSummaryScreen";

type SummaryProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY>;
type ReviewProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_REVIEW>;

/** Reloads only the finalized projection for a serializable terminal route. */
export function AlgorithmsInterviewSimulationSummaryRouteScreen({ navigation, route }: SummaryProps) {
  const controller = useTerminalController(route.params.sessionId);
  if (!controller) return <TerminalLoadingState />;
  return (
    <AlgorithmsInterviewSimulationSummaryScreen
      completionKind={route.params.completionKind}
      controller={controller}
      onReturnHome={() => navigation.reset({ index: 0, routes: [{ name: ROUTES.HOME }] })}
      onReviewAnswers={() => navigation.navigate(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_REVIEW, { sessionId: route.params.sessionId })}
      onStartRecommendedPractice={() => navigation.navigate(ROUTES.PRACTICE_HUB)}
    />
  );
}

export function AlgorithmsInterviewSimulationReviewRouteScreen({ navigation, route }: ReviewProps) {
  const controller = useTerminalController(route.params.sessionId);
  if (!controller) return <TerminalLoadingState />;
  return (
    <AlgorithmsInterviewSimulationReviewScreen
      controller={controller}
      onBackToSummary={() => navigation.goBack()}
      onReturnHome={() => navigation.reset({ index: 0, routes: [{ name: ROUTES.HOME }] })}
    />
  );
}

function useTerminalController(sessionId: string) {
  const controllerRef = useRef<ReturnType<typeof createAlgorithmsInterviewSimulationController> | null>(null);
  if (!controllerRef.current) controllerRef.current = createAlgorithmsInterviewSimulationController();
  const controller = controllerRef.current;
  const [state, setState] = useState<AlgorithmsInterviewSimulationControllerState>(() => controller.getState());
  useEffect(() => controller.subscribe(setState), [controller]);
  useEffect(() => { void controller.loadTerminal(sessionId); }, [controller, sessionId]);
  // The terminal screen renders a concrete unavailable state when immutable
  // records cannot be read; it must not mask that failure behind loading.
  return state.status === "terminal" || state.status === "error" ? controller : null;
}

function TerminalLoadingState() {
  return <Screen><EmptyState title="Loading simulation results" description="Reading the immutable submitted outcomes." /></Screen>;
}
