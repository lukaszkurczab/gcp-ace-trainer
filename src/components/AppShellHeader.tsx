import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { colorWithOpacity, spacing, typography } from "../theme";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import { PatternlyMark } from "./PatternlyMark";
import { useAppPreferences, useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";

type AppShellHeaderProps = {
  backAction?: Readonly<{
    accessibilityLabel?: string;
    onPress: () => void;
  }>;
  context?: string;
  placement?: "inline" | "stack" | "back";
};

export function AppShellHeader({ backAction, context, placement = "inline" }: AppShellHeaderProps) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  const { colorMode, colors: palette } = useAppPreferences();
  const { t } = useTranslation("common");
  const header = (
    <View style={[styles.header, placement === "stack" ? styles.stackHeader : null]}>
      <View style={styles.brandRow}>
        {backAction ? (
          <IconButton
            accessibilityLabel={backAction.accessibilityLabel ?? t("Go back")}
            icon="chevron-left"
            onPress={backAction.onPress}
          />
        ) : null}
        <View style={styles.brandMark}>
          <PatternlyMark decorative size={30} treatment={colorMode === "dark" ? "mint" : "navy"} />
        </View>
        <View style={styles.headerCopy}>
          <Text key={`app-shell-brand-${fontScale}`} maxFontSizeMultiplier={2} style={styles.brandTitle}>Patternly</Text>
          {context ? <Text key={`app-shell-context-${fontScale}`} maxFontSizeMultiplier={2} style={styles.headerMeta}>{context}</Text> : null}
        </View>
      </View>
    </View>
  );

  if (placement === "back") {
    return (
      <View style={styles.backNavigation}>
        <Pressable
          accessibilityLabel={backAction?.accessibilityLabel ?? t("Go back")}
          accessibilityRole="button"
          disabled={!backAction}
          hitSlop={4}
          onPress={backAction?.onPress}
          style={({ pressed }) => [styles.backChevron, pressed ? styles.backPressed : null]}
        >
          <Icon color={palette.textSecondary} name="chevron-left" size={16} />
        </Pressable>
        <Text key={`app-shell-back-${fontScale}`} maxFontSizeMultiplier={2} style={styles.backLabel}>Patternly</Text>
      </View>
    );
  }

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
  headerMeta: {
    ...typography.caption,
    color: palette.textSecondary,
    flexShrink: 1,
  },
  stackHeader: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  stackSafeArea: {
    backgroundColor: palette.surface,
  },
  backNavigation: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 36,
  },
  backChevron: {
    alignItems: "center",
    backgroundColor: colorWithOpacity(palette.textPrimary, 0.06),
    borderRadius: spacing.md,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  backPressed: {
    backgroundColor: colorWithOpacity(palette.textPrimary, 0.1),
  },
  backLabel: {
    color: palette.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
});
