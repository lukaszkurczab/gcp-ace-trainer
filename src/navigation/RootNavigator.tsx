import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ROUTES } from "../constants/routes";
import { AnswerReviewScreen } from "../features/review/AnswerReviewScreen";
import { ExamReviewScreen } from "../features/exam/ExamReviewScreen";
import { ExamScreen } from "../features/exam/ExamScreen";
import { HomeScreen } from "../features/home/HomeScreen";
import { SelectTrackScreen } from "../features/home/SelectTrackScreen";
import { MistakesReviewScreen } from "../features/review/MistakesReviewScreen";
import { PracticeHubScreen } from "../features/practice/PracticeHubScreen";
import { PracticeSessionScreen } from "../features/practice/PracticeSessionScreen";
import { PracticeSetupScreen } from "../features/practice/PracticeSetupScreen";
import { ResultScreen } from "../features/exam/ResultScreen";
import { TopicRoadmapScreen } from "../features/practice/TopicRoadmapScreen";
import { colors } from "../theme";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.HOME}
      screenOptions={{
        contentStyle: { backgroundColor: colors.dark.background },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.dark.surface },
        headerTintColor: colors.dark.textPrimary,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen
        name={ROUTES.HOME}
        component={HomeScreen}
        options={{ headerShown: false, title: "Patternly" }}
      />
      <Stack.Screen
        name={ROUTES.SELECT_TRACK}
        component={SelectTrackScreen}
        options={{ headerShown: false, title: "Choose track" }}
      />
      <Stack.Screen
        name={ROUTES.PRACTICE_HUB}
        component={PracticeHubScreen}
        options={{ headerShown: false, title: "Practice Hub" }}
      />
      <Stack.Screen
        name={ROUTES.TOPIC_ROADMAP}
        component={TopicRoadmapScreen}
        options={{ headerShown: false, title: "Topic Roadmap" }}
      />
      <Stack.Screen
        name={ROUTES.EXAM}
        component={ExamScreen}
        options={{ title: "Exam" }}
      />
      <Stack.Screen
        name={ROUTES.EXAM_REVIEW}
        component={ExamReviewScreen}
        options={{ title: "Exam Review" }}
      />
      <Stack.Screen
        name={ROUTES.RESULT}
        component={ResultScreen}
        options={{ title: "Result" }}
      />
      <Stack.Screen
        name={ROUTES.ANSWER_REVIEW}
        component={AnswerReviewScreen}
        options={{ title: "Answer Review" }}
      />
      <Stack.Screen
        name={ROUTES.PRACTICE_SETUP}
        component={PracticeSetupScreen}
        options={{ headerShown: false, title: "Practice Setup" }}
      />
      <Stack.Screen
        name={ROUTES.PRACTICE_SESSION}
        component={PracticeSessionScreen}
        options={{ headerShown: false, title: "Practice Session" }}
      />
      <Stack.Screen
        name={ROUTES.MISTAKES_REVIEW}
        component={MistakesReviewScreen}
        options={{ title: "Review Mistakes" }}
      />
    </Stack.Navigator>
  );
}
