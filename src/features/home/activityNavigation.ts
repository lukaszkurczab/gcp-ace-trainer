import type { NavigationProp } from "@react-navigation/native";

import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import type { ActivityItem } from "./tabs/activityModel";

type ActivityItemReference = Pick<ActivityItem, "modeId" | "sessionId" | "trackFamily">;

export type ActivityResultRoute =
  | Readonly<{ name: typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY; params: RootStackParamList[typeof ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY] }>
  | Readonly<{ name: typeof ROUTES.ALGORITHMS_PRACTICE_SUMMARY; params: RootStackParamList[typeof ROUTES.ALGORITHMS_PRACTICE_SUMMARY] }>
  | Readonly<{ name: typeof ROUTES.RESULT; params: RootStackParamList[typeof ROUTES.RESULT] }>;

export function buildActivityResultRoute(item: ActivityItemReference): ActivityResultRoute {
  if (item.modeId === "coding-interview-simulation") {
    return {
      name: ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY,
      params: { sessionId: item.sessionId },
    };
  }
  if (item.trackFamily === "coding_interview") {
    return {
      name: ROUTES.ALGORITHMS_PRACTICE_SUMMARY,
      params: { sessionId: item.sessionId },
    };
  }
  return {
    name: ROUTES.RESULT,
    params: { sessionId: item.sessionId },
  };
}

export function navigateToActivityResult(
  navigation: NavigationProp<RootStackParamList>,
  item: ActivityItemReference,
): void {
  const route = buildActivityResultRoute(item);
  if (route.name === ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY) {
    navigation.navigate(route.name, route.params);
    return;
  }
  if (route.name === ROUTES.ALGORITHMS_PRACTICE_SUMMARY) {
    navigation.navigate(route.name, route.params);
    return;
  }
  navigation.navigate(route.name, route.params);
}
