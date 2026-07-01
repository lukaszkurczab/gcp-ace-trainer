import { BottomTabBar } from "../../components";
import { ROUTES } from "../../constants/routes";
import { MAIN_TAB_ITEMS } from "../home/shellModel";
import type { ShellTab } from "../home/types";

type BottomNavigationTarget = {
  navigate: (name: string, params?: object) => void;
};

type AppBottomNavigationProps = {
  activeId: ShellTab;
  navigation: BottomNavigationTarget;
  onHomeTabChange?: (tab: Exclude<ShellTab, "practice">) => void;
};

export function AppBottomNavigation({
  activeId,
  navigation,
  onHomeTabChange,
}: AppBottomNavigationProps) {
  function handleChange(tab: ShellTab) {
    if (tab === "practice") {
      navigation.navigate(ROUTES.PRACTICE_HUB);
      return;
    }

    if (onHomeTabChange) {
      onHomeTabChange(tab);
      return;
    }

    navigation.navigate(ROUTES.HOME, { initialTab: tab });
  }

  return (
    <BottomTabBar
      activeId={activeId}
      items={MAIN_TAB_ITEMS}
      onChange={handleChange}
      testID="main-tab-bar"
    />
  );
}
