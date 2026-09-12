import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { EmptyState, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.EXAM_REVIEW>;
export function ExamReviewLoadingSkeleton() { return null; }
export function ExamReviewScreen(_props: Props) { const { t } = useTranslation("common"); return <Screen edges={["top", "bottom"]}><EmptyState title={t("Exam review is unavailable")} description={t("This exam mode is not available in the current canonical content release.")} actionLabel={t("Back")} onActionPress={() => undefined} /></Screen>; }
