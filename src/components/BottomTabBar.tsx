import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing, typography } from "../theme";
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
      style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
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
            style={styles.tabButton}
            testID={`${testID ?? "bottom-tab-bar"}-${item.id}`}
          >
            <View
              style={[
                styles.activeIndicator,
                isActive ? styles.activeIndicatorVisible : null,
              ]}
            />
            <Icon
              color={isActive ? palette.primary : palette.textMuted}
              name={item.icon}
              size={22}
            />
            <Text
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.2}
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
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    left: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    position: "absolute",
    right: 0,
  },
  tabButton: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 52,
    paddingHorizontal: spacing.xs,
  },
  activeIndicator: {
    backgroundColor: "transparent",
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  activeIndicatorVisible: {
    backgroundColor: palette.primary,
  },
  tabLabel: {
    ...typography.caption,
    color: palette.textMuted,
  },
  tabLabelActive: {
    color: palette.primary,
  },
});
