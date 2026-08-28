import { BottomTabBar } from "../../components";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../../constants/routes";
import { MAIN_TAB_ITEMS } from "../home/shellModel";
import type { ShellTab } from "../home/types";
import { useAppPreferences } from "../../preferences";

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
  const { t } = useTranslation("common");
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
      items={MAIN_TAB_ITEMS.map((item) => ({ ...item, label: t(item.label) }))}
      onChange={handleChange}
      testID="main-tab-bar"
    />
  );
}
