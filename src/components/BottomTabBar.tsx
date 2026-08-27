import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { effects, radius, spacing, typography } from "../theme";
import { Icon, type IconName } from "./Icon";
import { useAppPreferences, useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";


export type BottomTabBarItem<TId extends string> = {
  icon: IconName;
  id: TId;
  label: string;
};

type BottomTabBarProps<TId extends string> = {
  activeId: TId;
  items: readonly BottomTabBarItem<TId>[];
  onChange: (id: TId) => void;
  testID?: string;
};

export function BottomTabBar<TId extends string>({
  activeId,
  items,
  onChange,
  testID,
}: BottomTabBarProps<TId>) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 34) }]}
      testID={testID}
    >
      {items.map((item) => {
        const isActive = activeId === item.id;

        return (
          <Pressable
            accessibilityLabel={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={item.id}
            onPress={() => onChange(item.id)}
            style={({ pressed }) => [
              styles.tabButton,
              isActive ? styles.tabButtonActive : null,
              pressed ? styles.tabButtonPressed : null,
            ]}
            testID={`${testID ?? "bottom-tab-bar"}-${item.id}`}
          >
            <View
              style={[
                styles.activeIndicator,
                isActive ? styles.activeIndicatorVisible : null,
              ]}
            />
            <Icon
              color={isActive ? palette.navigation.active : palette.navigation.textMuted}
              name={item.icon}
              size={24}
            />
            <Text
              adjustsFontSizeToFit
              maxFontSizeMultiplier={2}
              numberOfLines={1}
              style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  tabBar: {
    alignItems: "center",
    backgroundColor: palette.navigation.surface,
    borderColor: palette.navigation.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 0,
    paddingTop: 0,
    shadowColor: effects.shadowColor,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  tabButton: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 60,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  tabButtonActive: {
    minHeight: 66,
  },
  tabButtonPressed: {
    backgroundColor: palette.navigation.pressedSurface,
    borderRadius: radius.lg,
  },
  activeIndicator: {
    backgroundColor: "transparent",
    borderRadius: 1,
    height: 2,
    width: 20,
  },
  activeIndicatorVisible: {
    backgroundColor: palette.navigation.active,
  },
  tabLabel: {
    ...typography.navigationLabel,
    color: palette.navigation.textMuted,
  },
  tabLabelActive: {
    color: palette.navigation.textPrimary,
  },
});
