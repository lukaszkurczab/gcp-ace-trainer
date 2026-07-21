import { EmptyState, Screen } from "../../components";
import { useAppPreferences } from "../../preferences";

export function ExamReviewScreen() {
  const { t } = useAppPreferences();
  return <Screen><EmptyState title={t("Exam review unavailable")} description={t("There is no canonical Certification Exam Simulation to review.")} /></Screen>;
}
