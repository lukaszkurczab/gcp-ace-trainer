import type { NavigationProp } from "@react-navigation/native";

import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import type { ActivityItem } from "./tabs/activityModel";

type ActivityItemReference = Pick<ActivityItem, "interaction" | "sessionId">;

export type ActivityResultRoute =
  | Readonly<{ name: typeof ROUTES.ALGORITHMS_PRACTICE_SUMMARY; params: RootStackParamList[typeof ROUTES.ALGORITHMS_PRACTICE_SUMMARY] }>
  | Readonly<{ name: typeof ROUTES.RESULT; params: RootStackParamList[typeof ROUTES.RESULT] }>;

export function buildActivityResultRoute(item: ActivityItemReference): ActivityResultRoute {
  if (item.interaction.kind !== "open_result") throw new Error("Activity item has no available result route.");
  if (item.interaction.destination === "algorithms_practice_summary") {
    return {
      name: ROUTES.ALGORITHMS_PRACTICE_SUMMARY,
      params: { sessionId: item.sessionId },
    };
  }
  if (item.interaction.destination === "canonical_result") return {
    name: ROUTES.RESULT,
    params: { sessionId: item.sessionId },
  };
  throw new Error("Activity result destination is unavailable.");
}

export function navigateToActivityResult(
  navigation: NavigationProp<RootStackParamList>,
  item: ActivityItemReference,
): void {
  const route = buildActivityResultRoute(item);
  if (route.name === ROUTES.ALGORITHMS_PRACTICE_SUMMARY) {
    navigation.navigate(route.name, route.params);
    return;
  }
  navigation.navigate(route.name, route.params);
}
