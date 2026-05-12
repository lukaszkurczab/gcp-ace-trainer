import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ROUTES } from "../constants/routes";
import { AnalyticsScreen } from "../features/analytics/AnalyticsScreen";
import { AttemptHistoryScreen } from "../features/attempts/AttemptHistoryScreen";
import { AnswerReviewScreen } from "../features/review/AnswerReviewScreen";
import { ExamReviewScreen } from "../features/exam/ExamReviewScreen";
import { ExamScreen } from "../features/exam/ExamScreen";
import { HomeScreen } from "../features/home/HomeScreen";
import { MistakesReviewScreen } from "../features/review/MistakesReviewScreen";
import { PracticeSessionScreen } from "../features/practice/PracticeSessionScreen";
import { PracticeSetupScreen } from "../features/practice/PracticeSetupScreen";
import { ResultScreen } from "../features/exam/ResultScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { colors } from "../theme";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.HOME}
      screenOptions={{
        contentStyle: { backgroundColor: colors.light.background },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.light.surface },
        headerTintColor: colors.light.textPrimary,
        headerTitleStyle: { fontWeight: "700" }
      }}
    >
      <Stack.Screen name={ROUTES.HOME} component={HomeScreen} options={{ title: "GCP ACE Trainer" }} />
      <Stack.Screen name={ROUTES.EXAM} component={ExamScreen} options={{ title: "Exam" }} />
      <Stack.Screen name={ROUTES.EXAM_REVIEW} component={ExamReviewScreen} options={{ title: "Exam Review" }} />
      <Stack.Screen name={ROUTES.RESULT} component={ResultScreen} options={{ title: "Result" }} />
      <Stack.Screen name={ROUTES.ANSWER_REVIEW} component={AnswerReviewScreen} options={{ title: "Answer Review" }} />
      <Stack.Screen name={ROUTES.PRACTICE_SETUP} component={PracticeSetupScreen} options={{ title: "Practice by Domain" }} />
      <Stack.Screen name={ROUTES.PRACTICE_SESSION} component={PracticeSessionScreen} options={{ title: "Practice Session" }} />
      <Stack.Screen name={ROUTES.MISTAKES_REVIEW} component={MistakesReviewScreen} options={{ title: "Review Mistakes" }} />
      <Stack.Screen name={ROUTES.ATTEMPT_HISTORY} component={AttemptHistoryScreen} options={{ title: "Attempt History" }} />
      <Stack.Screen name={ROUTES.ANALYTICS} component={AnalyticsScreen} options={{ title: "Analytics" }} />
      <Stack.Screen name={ROUTES.SETTINGS} component={SettingsScreen} options={{ title: "Settings" }} />
    </Stack.Navigator>
  );
}
