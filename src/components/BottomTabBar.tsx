import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme";
import { Icon, type IconName } from "./Icon";

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
  return (
    <View accessibilityRole="tablist" style={styles.tabBar} testID={testID}>
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
              color={isActive ? colors.dark.primary : colors.dark.textMuted}
              name={item.icon}
              size={22}
            />
            <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    alignItems: "center",
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    left: 0,
    paddingBottom: spacing.lg,
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
    height: 3,
    width: 24,
  },
  activeIndicatorVisible: {
    backgroundColor: colors.dark.primary,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.dark.textMuted,
  },
  tabLabelActive: {
    color: colors.dark.primary,
  },
});
