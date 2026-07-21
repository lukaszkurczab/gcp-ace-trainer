import { useFocusEffect, type NavigationProp } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { getAlgorithmsPracticeResultProjection, type AlgorithmsSessionResultProjection } from "../../application/algorithms";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import type { SimulationSurfaceProjection } from "./simulationProjection";
import { SimulationSessionSurface } from "./SimulationSessionSurface";
import { runtimeSelectors } from "../../testing/runtimeSelectors";

type SummaryProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY>;
type ReviewProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_REVIEW>;

export function AlgorithmsInterviewSimulationSummaryScreen({ navigation, route }: SummaryProps) {
  return <AlgorithmsInterviewSimulationResultSurface navigation={navigation} review={false} sessionId={route.params.sessionId} />;
}

export function AlgorithmsInterviewSimulationReviewScreen({ navigation, route }: ReviewProps) {
  return <AlgorithmsInterviewSimulationResultSurface navigation={navigation} review sessionId={route.params.sessionId} />;
}

function AlgorithmsInterviewSimulationResultSurface({ navigation, review, sessionId }: Readonly<{ navigation: NavigationProp<RootStackParamList>; review: boolean; sessionId: string }>) {
  const [result, setResult] = useState<AlgorithmsSessionResultProjection | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setResult(await getAlgorithmsPracticeResultProjection(sessionId)); setFailure(null); }
    catch (error) { setFailure(messageFor(error)); }
  }, [sessionId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const projection: SimulationSurfaceProjection = result?.score
    ? {
        state: "completed",
        title: review ? "Interview Simulation review" : "Interview Simulation complete",
        completion: {
          answeredCount: result.answeredOccurrenceIds.length,
          unansweredCount: result.unansweredOccurrenceIds.length,
          correctCount: result.score.correctCount,
          partialCount: result.score.partialCount,
          incorrectCount: result.score.incorrectCount,
          earnedPoints: result.score.pointsEarned,
          maxPoints: result.score.maxPoints,
          ...(review ? {} : { reviewAction: { id: "review-session", label: "Review session", onPress: () => navigation.navigate(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_REVIEW, { sessionId: result.sessionId }), variant: "secondary" as const } }),
        },
        actions: { primary: { id: "back-to-practice", label: "Back to practice", onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) } },
      }
    : {
        state: "verification_failed",
        title: "Verified result unavailable",
        notice: { tone: "error", message: failure ?? "The session result is not available because verification did not complete." },
        actions: { primary: { id: "retry", label: "Try again", onPress: () => { void load(); } }, secondary: { id: "back-to-practice", label: "Back to practice", onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB), variant: "secondary" } },
      };
  return <View testID={runtimeSelectors.summary.root(sessionId)}><SimulationSessionSurface projection={projection} /></View>;
}

function messageFor(error: unknown): string { return error instanceof Error && error.message.trim() ? error.message : "The session result is not available because verification did not complete."; }
