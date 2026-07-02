import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";

type PracticeExitNavigation = Pick<
  NativeStackNavigationProp<RootStackParamList>,
  "reset"
>;

type PracticeHubResetRoutes = [
  { name: typeof ROUTES.HOME },
  {
    name: typeof ROUTES.PRACTICE_HUB;
    params?: RootStackParamList[typeof ROUTES.PRACTICE_HUB];
  },
];

export function buildPracticeHubResetRoutes(topicId?: string): PracticeHubResetRoutes {
  const practiceHubRoute: PracticeHubResetRoutes[1] = {
    name: ROUTES.PRACTICE_HUB,
  };

  if (topicId) {
    practiceHubRoute.params = { topicId };
  }

  return [
    { name: ROUTES.HOME },
    practiceHubRoute,
  ];
}

export function resetToPracticeHubAfterSession(
  navigation: PracticeExitNavigation,
  topicId?: string,
): void {
  navigation.reset({
    index: 1,
    routes: buildPracticeHubResetRoutes(topicId),
  });
}
