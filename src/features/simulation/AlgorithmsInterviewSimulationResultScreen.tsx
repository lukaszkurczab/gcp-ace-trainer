import type { NavigationProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { EmptyState, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";

type SummaryProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY>;
type ReviewProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_REVIEW>;

function unavailable() { return <UnavailableSimulationSurface />; }
function UnavailableSimulationSurface() { const { t } = useTranslation("common"); return <Screen edges={["top", "bottom"]}><EmptyState title={t("Simulation result is unavailable")} description={t("This simulation mode is not available in the current canonical content release.")} actionLabel={t("Back")} onActionPress={() => undefined} /></Screen>; }
export function AlgorithmsInterviewSimulationSummaryScreen(_props: SummaryProps) { return unavailable(); }
export function AlgorithmsInterviewSimulationReviewScreen(_props: ReviewProps) { return unavailable(); }
export function SimulationResultLoadingSkeleton() { return null; }
