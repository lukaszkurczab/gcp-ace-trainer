import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button, Icon } from "../../../components";
import { useAppPreferences, useThemedStyles } from "../../../preferences";
import { radius, spacing, typography, type AppColors } from "../../../theme";
import type { SimulationOperationPresentation } from "../simulationProjection";

type SimulationOperationPanelProps = Readonly<{ operation: SimulationOperationPresentation }>;

export function isSimulationOperationNotice(operation: SimulationOperationPresentation): boolean {
  return operation.kind === "save-failed" || operation.kind === "response-saved-navigation-failed";
}

/** Renders only the normalized operation state and CTA facts supplied by the screen projection. */
export function SimulationOperationPanel({ operation }: SimulationOperationPanelProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();
  const { t } = useTranslation("common");
  const notice = isSimulationOperationNotice(operation);
  const pending = operation.kind === "saving-response" || operation.kind === "navigating" || operation.kind === "finalizing";
  const failed = operation.kind === "save-failed" || operation.kind === "finalization-recovery-required";
  if (notice) return <View accessible accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.notice}><Icon color={palette.warning} name="alert-triangle" size={20} /><Text maxFontSizeMultiplier={2} style={styles.noticeText}>{t(operation.noticeMessage ?? operation.title)}</Text></View>;
  return (
    <View style={[styles.panel, pending ? styles.pending : failed ? styles.failed : styles.warning]}>
      <View
        accessible
        accessibilityLabel={pending ? `${t(operation.title)}. ${t(operation.description)}` : undefined}
        accessibilityLiveRegion="polite"
        accessibilityRole={pending ? "progressbar" : "alert"}
        accessibilityState={pending ? { busy: true } : undefined}
        style={styles.statusContent}
      >
        <View style={styles.titleRow}>
          {pending ? <ActivityIndicator accessibilityElementsHidden color={palette.primary} importantForAccessibility="no" size="small" /> : <Icon color={failed ? palette.danger : palette.warning} name={failed ? "alert-triangle" : "shield-check"} size={22} />}
          <Text maxFontSizeMultiplier={2} style={styles.title}>{t(operation.title)}</Text>
        </View>
        <Text maxFontSizeMultiplier={2} style={styles.description}>{t(operation.description)}</Text>
        <View style={styles.lockRow}><Icon color={palette.textSecondary} name="shield-check" size={16} /><Text maxFontSizeMultiplier={2} style={styles.lockMessage}>{t(operation.lockMessage)}</Text></View>
      </View>
      {operation.auxiliaryAction ? <Button disabled={operation.auxiliaryAction.disabled} loading={operation.auxiliaryAction.loading} onPress={operation.auxiliaryAction.onPress} variant={operation.auxiliaryAction.variant}>{t(operation.auxiliaryAction.label)}</Button> : null}
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  description: { ...typography.small, color: palette.textSecondary },
  failed: { backgroundColor: palette.dangerSoft, borderColor: palette.danger },
  lockMessage: { ...typography.caption, color: palette.textSecondary, flex: 1 },
  lockRow: { alignItems: "center", borderTopColor: palette.border, borderTopWidth: 1, flexDirection: "row", gap: spacing.sm, paddingTop: spacing.sm },
  notice: { alignItems: "center", backgroundColor: palette.elevatedSurface, borderColor: palette.warning, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", gap: spacing.md, padding: spacing.lg },
  noticeText: { ...typography.body, color: palette.warning, flex: 1 },
  panel: { borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  pending: { backgroundColor: palette.primarySoft, borderColor: palette.primary },
  title: { ...typography.bodyStrong, color: palette.textPrimary, flex: 1 },
  titleRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  statusContent: { gap: spacing.sm },
  warning: { backgroundColor: palette.warningSoft, borderColor: palette.warning },
});
