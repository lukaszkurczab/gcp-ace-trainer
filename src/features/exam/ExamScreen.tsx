import { EmptyState, Screen } from "../../components";

/** Certification exam runtime has no canonical profile/lifecycle yet. */
export function ExamScreen() {
  return <Screen><EmptyState title="Exam runtime unavailable" description="Certification Exam Simulation is blocked until its canonical profile and application lifecycle are installed." /></Screen>;
}
