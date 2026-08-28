import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppPreferences, useThemedStyles } from "../preferences";
import { radius, spacing, type AppColors } from "../theme";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import { Screen } from "./Screen";

export type ReviewFilter = "all" | "missed";

type ReviewShellProps = Readonly<{
  children: ReactNode;
  contextLabel: string;
  filter: ReviewFilter;
  missedCount: number;
  nextDisabled: boolean;
  onBack: () => void;
  onFilterChange: (filter: ReviewFilter) => void;
  onNext: () => void;
  onNavigator: () => void;
  onPrevious: () => void;
  previousDisabled: boolean;
  testID?: string;
  totalOccurrences: number;
  backLabel?: string;
  contentVariant?: "default" | "unavailable";
}>;

/** Shared Figma Review Shell used by simulation and answer-level review routes. */
export function ReviewShell({
  backLabel,
  children,
  contextLabel,
  filter,
  missedCount,
  nextDisabled,
  onBack,
  onFilterChange,
  onNext,
  onNavigator,
  onPrevious,
  previousDisabled,
  testID,
  totalOccurrences,
  contentVariant = "default",
}: ReviewShellProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  return (
    <Screen
      edges={["top", "bottom"]}
      style={styles.screen}
      footerVariant="review"
      footer={(
        <View style={styles.footer}>
          <Button
            disabled={previousDisabled}
            labelStyle={previousDisabled ? styles.footerDisabledLabel : undefined}
            onPress={onPrevious}
            style={[styles.footerButton, previousDisabled ? styles.footerButtonDisabled : null]}
            variant="secondary"
          >{t("Previous")}</Button>
          <Button disabled={nextDisabled} onPress={onNext} style={styles.footerButton}>{t("Next")}</Button>
        </View>
      )}
    >
      <View style={styles.headerBar} testID={testID}>
        <IconButton accessibilityLabel={backLabel ?? t("Back to summary")} icon="chevron-left" onPress={onBack} />
        <Text maxFontSizeMultiplier={2} style={styles.headerTitle}>{t("Answer review")}</Text>
      </View>
      <View style={styles.contextRow}>
        <Text maxFontSizeMultiplier={2} style={styles.contextText}>{contextLabel}</Text>
        <Pressable accessibilityLabel={t("Open answer navigator")} accessibilityRole="button" onPress={onNavigator} style={styles.navigatorAction}>
          <Icon color={styles.navigatorLabel.color} name="grid" size={16} />
          <Text maxFontSizeMultiplier={2} style={styles.navigatorLabel}>{t("Navigator")}</Text>
        </Pressable>
      </View>
      <View style={styles.filterRow}>
        <View accessibilityRole="tablist" style={styles.filterShell}>
          <FilterTab active={filter === "all"} label={`${t("All")} ${totalOccurrences}`} onPress={() => onFilterChange("all")} styles={styles} />
          <FilterTab active={filter === "missed"} label={`${t("Missed")} ${missedCount}`} onPress={() => onFilterChange("missed")} styles={styles} />
        </View>
      </View>
      <View style={[styles.scrollableContent, contentVariant === "unavailable" ? styles.scrollableContentUnavailable : null]}>{children}</View>
    </Screen>
  );
}

function FilterTab({ active, label, onPress, styles }: Readonly<{ active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof createStyles> }>) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.filterTab, active ? styles.filterTabActive : null]}>
      <Text maxFontSizeMultiplier={2} style={[styles.filterTabLabel, active ? styles.filterTabLabelActive : null]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  contextRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 64, paddingHorizontal: spacing.xl, paddingVertical: 10 },
  contextText: { color: palette.textSecondary, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  filterRow: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  filterShell: { alignItems: "center", backgroundColor: palette.surfaceInput, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", minHeight: 44, padding: 4 },
  filterTab: { alignItems: "center", borderRadius: 10, justifyContent: "center", minHeight: 34, paddingHorizontal: spacing.xl, paddingVertical: spacing.xs },
  filterTabActive: { backgroundColor: palette.primary, borderColor: palette.primary, borderWidth: 1 },
  filterTabLabel: { color: palette.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, lineHeight: 16 },
  filterTabLabelActive: { color: palette.onPrimary },
  footer: { alignItems: "center", flexDirection: "row", gap: 0, width: "100%" },
  footerButton: { flex: 1, minWidth: 0 },
  footerButtonDisabled: { backgroundColor: palette.surfaceInput, borderColor: palette.border },
  footerDisabledLabel: { color: palette.textMuted },
  headerBar: { alignItems: "center", flexDirection: "row", gap: 10, paddingHorizontal: spacing.xl, paddingVertical: 14 },
  headerTitle: { color: palette.textPrimary, fontSize: 15, fontWeight: "600", lineHeight: 18 },
  navigatorAction: { alignItems: "center", flexDirection: "row", gap: spacing.xs, minHeight: 44, paddingHorizontal: spacing.xs },
  navigatorLabel: { color: palette.primary, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, lineHeight: 16 },
  screen: { gap: 0, paddingBottom: 0, paddingHorizontal: 0, paddingTop: 0 },
  scrollableContent: { flex: 1, gap: spacing.xl, paddingBottom: spacing.xxl, paddingHorizontal: spacing.xl, paddingLeft: spacing.xxl, paddingTop: spacing.xxl },
  scrollableContentUnavailable: { gap: 0, overflow: "hidden", padding: 0 },
});
