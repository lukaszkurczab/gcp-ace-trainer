import { EmptyState, Screen } from "../../components";

export function ResultScreen() {
  return <Screen><EmptyState title="Exam result unavailable" description="Exam results remain unavailable until verified canonical finalization exists." /></Screen>;
}
