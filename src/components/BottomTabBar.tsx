import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme";

export type BottomTabBarItem<TId extends string> = {
  icon: string;
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
            <Text style={[styles.tabIcon, isActive ? styles.tabIconActive : null]}>
              {item.icon}
            </Text>
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
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    left: 0,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    position: "absolute",
    right: 0,
  },
  tabButton: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 52,
  },
  tabIcon: {
    ...typography.heading,
    color: colors.light.textMuted,
  },
  tabIconActive: {
    color: colors.light.primary,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.light.textMuted,
  },
  tabLabelActive: {
    color: colors.light.primary,
  },
});
