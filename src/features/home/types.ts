import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";

export type ShellTab = "home" | "practice" | "progress" | "settings";

export type HomeNavigation = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROUTES.HOME
>;
