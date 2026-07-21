import { EmptyState, Screen } from "../../components";
import { useAppPreferences } from "../../preferences";

export function ResultScreen() {
  const { t } = useAppPreferences();
  return <Screen><EmptyState title={t("Exam result unavailable")} description={t("Exam results remain unavailable until verified canonical finalization exists.")} /></Screen>;
}
