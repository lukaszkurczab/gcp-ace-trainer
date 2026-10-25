import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { spacing, typography } from "../theme";
import { PatternlyMark } from "./PatternlyMark";
import { BackLink } from "./BackLink";
import { useAppPreferences, useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";

type AppShellHeaderProps = {
  backAction?: Readonly<{
    accessibilityLabel?: string;
    destinationLabel?: string;
    onPress: () => void;
  }>;
  context?: string;
  trailingAction?: ReactNode;
  placement?: "inline" | "stack" | "back";
};

export function AppShellHeader({ backAction, context, placement = "inline", trailingAction }: AppShellHeaderProps) {
  const styles = useThemedStyles(createStyles);
  const { colorMode } = useAppPreferences();
  const { fontScale } = useWindowDimensions();
  // Recreate native header measurements when Dynamic Type changes on an open screen.
  const layoutKey = `app-shell-header:${fontScale}`;
  if (backAction) {
    const link = <View style={styles.backSlot}><BackLink {...backAction} /></View>;
    if (placement === "stack") return <SafeAreaView edges={["top"]} key={layoutKey} style={styles.stackSafeArea}><View style={[styles.stackHeader, styles.header]}>{link}{trailingAction}</View></SafeAreaView>;
    return <View key={layoutKey} style={styles.header}>{link}{trailingAction}</View>;
  }

  const header = (
    <View key={layoutKey} style={[styles.header, placement === "stack" ? styles.stackHeader : null]}>
      <View style={styles.brandRow}>
        <PatternlyMark decorative size={30} treatment={colorMode === "dark" ? "mint" : "navy"} />
        <View style={styles.headerCopy}>
          <Text maxFontSizeMultiplier={2} style={styles.brandTitle}>Patternly</Text>
          {context ? <Text accessibilityLabel={context} maxFontSizeMultiplier={2} style={styles.headerMeta}>{context}</Text> : null}
        </View>
      </View>
      {trailingAction}
    </View>
  );

  if (placement === "stack") return <SafeAreaView edges={["top"]} key={layoutKey} style={styles.stackSafeArea}>{header}</SafeAreaView>;
  return header;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  backSlot: { flex: 1, minWidth: 0 },
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
    ...typography.navigationContext,
    color: palette.textPrimary,
    flexShrink: 1,
  },
  stackHeader: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  stackSafeArea: {
    backgroundColor: palette.surface,
    paddingTop: Platform.OS === "android" ? spacing.sm : 0,
  },
});
