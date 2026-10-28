import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { Icon, type IconName } from "../../../components/Icon";
import { useAppPreferences, useThemedStyles } from "../../../preferences/appPreferencesContext";
import { spacing, type AppColors } from "../../../theme";

type Props = Readonly<{
  largeText: boolean; stretchCopy: boolean; icon: IconName; muted: boolean; enabled: boolean;
  title: string; detail: string; primaryLabel: string; onPrimary: () => void;
  headingTestID?: string; titleTestID?: string; detailTestID?: string; primaryTestID?: string;
  secondary?: Readonly<{ label: string; chevron: boolean; onPress: () => void }>;
}>;
/** Shared by the real Home owner and inert startup preview; no session or store reads. */
export function HomeDecisionCard({ largeText, stretchCopy, icon, muted, enabled, title, detail, primaryLabel, onPrimary, headingTestID, titleTestID, detailTestID, primaryTestID, secondary }: Props) {
  const styles = useThemedStyles(createHomeDecisionStyles);
  const { colors: palette } = useAppPreferences();
  return <Card variant="layered" style={styles.decisionCard}>
    <View style={styles.cardRail} />
    <View style={[styles.decisionHeading, largeText ? styles.decisionHeadingLargeText : null]} testID={headingTestID}>
      <View style={styles.decisionIconTile}><Icon color={muted ? palette.textMuted : palette.accentTeal} name={icon} size={24} /></View>
      <View style={[styles.decisionCopy, stretchCopy ? styles.claudeDecisionCopyLargeText : null]}>
        <Text maxFontSizeMultiplier={2} style={styles.decisionTitle} testID={titleTestID}>{title}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.decisionDetail} testID={detailTestID}>{detail}</Text>
      </View>
    </View>
    <Button disabled={!enabled} onPress={onPrimary} style={styles.startButton} testID={primaryTestID} variant="primary">{primaryLabel}</Button>
    {secondary ? <Pressable accessibilityRole="button" onPress={secondary.onPress} style={({ pressed }) => [styles.secondaryAction, pressed ? styles.pressed : null]}>
      <Text maxFontSizeMultiplier={2} style={styles.secondaryActionText}>{secondary.label}</Text>
      {secondary.chevron ? <Icon color={palette.accentPurple} name="chevron-right" size={18} /> : null}
    </Pressable> : null}
  </Card>;
}
export const createHomeDecisionStyles = (palette: AppColors) => StyleSheet.create({
  decisionCard: {
    backgroundColor: palette.surface,
    borderColor: palette.navigation.active,
    borderRadius: 22,
    elevation: 0,
    gap: spacing.lg,
    overflow: "hidden",
    padding: spacing.xl,
    position: "relative",
    shadowOpacity: 0,
  },
  cardRail: {
    backgroundColor: palette.navigation.active,
    borderRadius: 2,
    height: 44,
    left: -1,
    position: "absolute",
    top: 19,
    width: 3,
  },
  decisionHeading: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  decisionHeadingLargeText: {
    alignItems: "flex-start",
    flexDirection: "column",
  },
  decisionTitle: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  decisionCopy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  claudeDecisionCopyLargeText: {
    alignSelf: "stretch",
    flex: 0,
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 0,
  },
  decisionIconTile: {
    alignItems: "center",
    backgroundColor: palette.surfaceInput,
    borderColor: palette.choice.active,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  startButton: {
    backgroundColor: palette.navigation.active,
    borderColor: palette.navigation.active,
    minHeight: 49,
    paddingVertical: 15,
  },
  decisionDetail: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  secondaryAction: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  secondaryActionText: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.78,
  },
});
