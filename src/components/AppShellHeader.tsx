import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { radius, spacing, typography } from "../theme";
import { Icon } from "./Icon";
import { PatternlyMark } from "./PatternlyMark";
import { useAppPreferences, useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";

type AppShellHeaderProps = {
  backAction?: Readonly<{
    accessibilityLabel?: string;
    onPress: () => void;
  }>;
  context?: string;
  placement?: "inline" | "stack";
};

export function AppShellHeader({ backAction, context, placement = "inline" }: AppShellHeaderProps) {
  const styles = useThemedStyles(createStyles);
  const { colorMode, colors: palette, t } = useAppPreferences();
  const header = (
    <View style={[styles.header, placement === "stack" ? styles.stackHeader : null]}>
      <View style={styles.brandRow}>
        {backAction ? (
          <Pressable
            accessibilityLabel={backAction.accessibilityLabel ?? t("Go back")}
            accessibilityRole="button"
            onPress={backAction.onPress}
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
          >
            <View style={styles.backIcon}>
              <Icon color={palette.textSecondary} name="chevron-right" size={20} />
            </View>
          </Pressable>
        ) : null}
        <View style={styles.brandMark}>
          <PatternlyMark decorative size={30} treatment={colorMode === "dark" ? "mint" : "navy"} />
        </View>
        <View style={styles.headerCopy}>
          <Text maxFontSizeMultiplier={2} style={styles.brandTitle}>Patternly</Text>
          {context ? <Text maxFontSizeMultiplier={2} style={styles.headerMeta}>{context}</Text> : null}
        </View>
      </View>
    </View>
  );

  if (placement === "stack") {
    return <SafeAreaView edges={["top"]} style={styles.stackSafeArea}>{header}</SafeAreaView>;
  }

  return header;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brandRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    minWidth: 0,
  },
  brandMark: {
    alignItems: "center",
    flexShrink: 0,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  brandTitle: {
    ...typography.heading,
    color: palette.textPrimary,
    flexShrink: 1,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  backIcon: {
    transform: [{ rotate: "180deg" }],
  },
  headerMeta: {
    ...typography.caption,
    color: palette.textSecondary,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.78,
  },
  stackHeader: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  stackSafeArea: {
    backgroundColor: palette.surface,
  },
});
