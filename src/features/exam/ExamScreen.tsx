import { EmptyState, Screen } from "../../components";
import { useAppPreferences } from "../../preferences";

/** Certification exam runtime has no canonical profile/lifecycle yet. */
export function ExamScreen() {
  const { t } = useAppPreferences();
  return <Screen><EmptyState title={t("Exam runtime unavailable")} description={t("Certification Exam Simulation is blocked until its canonical profile and application lifecycle are installed.")} /></Screen>;
}
