import { NavigationContext } from "@react-navigation/native";
import { useContext, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";

import { useThemedStyles } from "../preferences";
import { spacing, typography, type AppColors } from "../theme";
import { getBackDestinationTranslation, getPreviousRoute } from "../navigation/backDestination";
import { Icon } from "./Icon";

export type BackLinkProps = Readonly<{
  onPress: () => void;
  destinationLabel?: string;
  accessibilityLabel?: string;
  testID?: string;
}>;

/** Shared accessible return action. It names the route it will return to. */
export function BackLink({ accessibilityLabel, destinationLabel, onPress, testID = "patternly:navigation:back" }: BackLinkProps) {
  const styles = useThemedStyles(createStyles);
  const navigation = useContext(NavigationContext);
  const { t } = useTranslation(["common", "account", "settings", "data", "legal", "learningPlan"]);
  const [navigationState, setNavigationState] = useState(() => navigation?.getState());

  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener("state", () => setNavigationState(navigation.getState()));
    setNavigationState(navigation.getState());
    return unsubscribe;
  }, [navigation]);

  const resolvedDestination = useMemo(() => {
    if (destinationLabel?.trim()) return destinationLabel.trim();
    const route = navigationState ? getPreviousRoute(navigationState.routes, navigationState.index) : null;
    const translated = getBackDestinationTranslation(route);
    return translated ? t(translated.key, { ns: translated.namespace }) : null;
  }, [destinationLabel, navigationState, t]);

  if (!resolvedDestination) return null;
  const label = `< ${resolvedDestination}`;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.link, pressed ? styles.pressed : null]}
      testID={testID}
    >
      <Icon color={styles.arrow.color} name="chevron-left" size={18} />
      <Text maxFontSizeMultiplier={2} style={styles.label}>{resolvedDestination}</Text>
    </Pressable>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  link: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.navigationContext,
    color: palette.textPrimary,
    flexShrink: 1,
    minWidth: 0,
  },
  arrow: {
    color: palette.textPrimary,
  },
  pressed: {
    opacity: 0.6,
  },
});
