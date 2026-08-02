import { ROUTES } from "../constants/routes";

type BackNavigation = Readonly<{
  canGoBack: () => boolean;
  goBack: () => void;
  navigate: (name: typeof ROUTES.HOME, params: { initialTab: "home" }) => void;
}>;

/** Preserves stack history when present and names Home as the direct-entry fallback. */
export function goBackOrHome(navigation: BackNavigation): void {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  navigation.navigate(ROUTES.HOME, { initialTab: "home" });
}
