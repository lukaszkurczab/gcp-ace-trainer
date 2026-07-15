import { Text } from "react-native";

import { Button, Card, EmptyState, Screen } from "../../../components";
import type { SimulationCompletionKind, SimulationTerminalController } from "./model";
import { readSimulationTerminal } from "./model";
import { SimulationSummaryPanel } from "./components";

type AlgorithmsInterviewSimulationSummaryScreenProps = {
  completionKind?: SimulationCompletionKind;
  controller: SimulationTerminalController;
  onReturnHome: () => void;
  onReviewAnswers: () => void;
  onStartRecommendedPractice: () => void;
};

/**
 * Terminal-only summary. It reads the controller's immutable projection and
 * deliberately has no path to active draft, runtime commands, or repositories.
 */
export function AlgorithmsInterviewSimulationSummaryScreen({
  completionKind = "unknown",
  controller,
  onReturnHome,
  onReviewAnswers,
  onStartRecommendedPractice,
}: AlgorithmsInterviewSimulationSummaryScreenProps) {
  const terminal = readSimulationTerminal(controller);
  if (terminal.kind === "unavailable") {
    return <Screen><EmptyState title="Simulation summary unavailable" description={terminal.message} /></Screen>;
  }

  return (
    <Screen footer={<SummaryActions onReturnHome={onReturnHome} onReviewAnswers={onReviewAnswers} onStartRecommendedPractice={onStartRecommendedPractice} />}>
      <SimulationSummaryPanel completionKind={completionKind} projection={terminal.value} />
    </Screen>
  );
}

function SummaryActions({ onReturnHome, onReviewAnswers, onStartRecommendedPractice }: Pick<AlgorithmsInterviewSimulationSummaryScreenProps, "onReturnHome" | "onReviewAnswers" | "onStartRecommendedPractice">) {
  return <Card variant="tonal"><Text>Review the submitted outcomes or continue with the next recommended practice.</Text><Button onPress={onReviewAnswers}>Review answers</Button><Button onPress={onStartRecommendedPractice} variant="secondary">Start recommended practice</Button><Button onPress={onReturnHome} variant="ghost">Return home</Button></Card>;
}
