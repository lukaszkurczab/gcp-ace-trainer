import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AppShellHeader } from "../components";
import { ROUTES } from "../constants/routes";
import { AnswerReviewScreen } from "../features/review/AnswerReviewScreen";
import { ExamReviewScreen } from "../features/exam/ExamReviewScreen";
import { ExamScreen } from "../features/exam/ExamScreen";
import { HomeScreen } from "../features/home/HomeScreen";
import { ActivityScreen } from "../features/home/ActivityScreen";
import { AppearanceSettingsScreen } from "../features/home/AppearanceSettingsScreen";
import { LegalInformationScreen } from "../features/home/LegalInformationScreen";
import { NotificationSettingsScreen } from "../features/home/NotificationSettingsScreen";
import { YourDataScreen } from "../features/home/YourDataScreen";
import { BackendDiagnosticsScreen } from "../features/home/BackendDiagnosticsScreen";
import { AccountEntryScreen } from "../features/account/AccountEntryScreen";
import { SelectTrackScreen } from "../features/home/SelectTrackScreen";
import { GoalCadenceScreen } from "../features/home/GoalCadenceScreen";
import { MistakesReviewScreen } from "../features/review/MistakesReviewScreen";
import { PracticeHubScreen } from "../features/practice/PracticeHubScreen";
import { AlgorithmsScopeSelectionScreen } from "../features/practice/AlgorithmsScopeSelectionScreen";
import { PracticeSessionScreen } from "../features/practice/PracticeSessionScreen";
import { AlgorithmsPracticeSummaryScreen } from "../features/practice/AlgorithmsPracticeSummaryScreen";
import { PracticeSetupScreen } from "../features/practice/PracticeSetupScreen";
import { ResultScreen } from "../features/exam/ResultScreen";
import {
  AlgorithmsInterviewSimulationReviewScreen,
  AlgorithmsInterviewSimulationSummaryScreen,
} from "../features/simulation/AlgorithmsInterviewSimulationResultScreen";
import { AlgorithmsInterviewSimulationScreen } from "../features/simulation/AlgorithmsInterviewSimulationScreen";
import { TopicRoadmapScreen } from "../features/practice/TopicRoadmapScreen";
import { useAppPreferences } from "../preferences";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors, t } = useAppPreferences();
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.HOME}
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        header: ({ back, navigation, options }) => (
          <AppShellHeader
            backAction={back ? { onPress: () => navigation.goBack() } : undefined}
            context={options.title}
            placement="stack"
          />
        ),
      }}
    >
      <Stack.Screen
        name={ROUTES.HOME}
        component={HomeScreen}
        options={{ headerShown: false, title: "Patternly" }}
      />
      <Stack.Screen
        name={ROUTES.ACTIVITY}
        component={ActivityScreen}
        options={{ headerShown: false, title: t("Activity") }}
      />
      <Stack.Screen
        name={ROUTES.APPEARANCE_SETTINGS}
        component={AppearanceSettingsScreen}
        options={{ headerShown: false, title: t("Appearance") }}
      />
      <Stack.Screen
        name={ROUTES.YOUR_DATA}
        component={YourDataScreen}
        options={{ headerShown: false, title: t("Your data") }}
      />
      <Stack.Screen
        name={ROUTES.BACKEND_DIAGNOSTICS}
        component={BackendDiagnosticsScreen}
        options={{ title: "Backend diagnostics" }}
      />
      <Stack.Screen
        name={ROUTES.ACCOUNT_ENTRY}
        component={AccountEntryScreen}
        options={{ headerShown: false, title: t("Account") }}
      />
      <Stack.Screen
        name={ROUTES.LEGAL_INFORMATION}
        component={LegalInformationScreen}
        options={{ headerShown: false, title: t("Legal information") }}
      />
      <Stack.Screen
        name={ROUTES.NOTIFICATION_SETTINGS}
        component={NotificationSettingsScreen}
        options={{ headerShown: false, title: t("Notifications") }}
      />
      <Stack.Screen
        name={ROUTES.SELECT_TRACK}
        component={SelectTrackScreen}
        options={{ headerShown: false, title: t("Choose a track") }}
      />
      <Stack.Screen
        name={ROUTES.GOAL_CADENCE}
        component={GoalCadenceScreen}
        options={{ headerShown: false, title: t("Goal & cadence") }}
      />
      <Stack.Screen
        name={ROUTES.PRACTICE_HUB}
        component={PracticeHubScreen}
        options={{ headerShown: false, title: t("Practice Hub") }}
      />
      <Stack.Screen
        name={ROUTES.ALGORITHMS_SCOPE_SELECTION}
        component={AlgorithmsScopeSelectionScreen}
        options={{ headerShown: false, title: t("Choose practice scope") }}
      />
      <Stack.Screen
        name={ROUTES.TOPIC_ROADMAP}
        component={TopicRoadmapScreen}
        options={{ headerShown: false, title: t("Topic Roadmap") }}
      />
      <Stack.Screen
        name={ROUTES.EXAM}
        component={ExamScreen}
        options={{ title: t("Exam") }}
      />
      <Stack.Screen
        name={ROUTES.EXAM_REVIEW}
        component={ExamReviewScreen}
        options={{ title: t("Exam Review") }}
      />
      <Stack.Screen
        name={ROUTES.RESULT}
        component={ResultScreen}
        options={{ title: t("Result") }}
      />
      <Stack.Screen
        name={ROUTES.ANSWER_REVIEW}
        component={AnswerReviewScreen}
        options={{ headerShown: false, title: t("Answer Review") }}
      />
      <Stack.Screen
        name={ROUTES.PRACTICE_SETUP}
        component={PracticeSetupScreen}
        options={{ headerShown: false, title: t("Practice setup") }}
      />
      <Stack.Screen
        name={ROUTES.PRACTICE_SESSION}
        component={PracticeSessionScreen}
        options={{ headerShown: false, title: t("Practice Session") }}
      />
      <Stack.Screen
        name={ROUTES.ALGORITHMS_PRACTICE_SUMMARY}
        component={AlgorithmsPracticeSummaryScreen}
        options={{ headerShown: false, title: t("Session result") }}
      />
      <Stack.Screen
        name={ROUTES.ALGORITHMS_INTERVIEW_SIMULATION}
        component={AlgorithmsInterviewSimulationScreen}
        options={{ headerShown: false, title: t("Interview Simulation") }}
      />
      <Stack.Screen
        name={ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY}
        component={AlgorithmsInterviewSimulationSummaryScreen}
        options={{ title: t("Simulation complete") }}
      />
      <Stack.Screen
        name={ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_REVIEW}
        component={AlgorithmsInterviewSimulationReviewScreen}
        options={{ title: t("Simulation review") }}
      />
      <Stack.Screen
        name={ROUTES.MISTAKES_REVIEW}
        component={MistakesReviewScreen}
        options={{ title: t("Review Mistakes") }}
      />
    </Stack.Navigator>
  );
}
