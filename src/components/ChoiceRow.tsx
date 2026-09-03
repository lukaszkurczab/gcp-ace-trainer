import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { radius, spacing, typography } from "../theme";
import { useAppPreferences, useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";

type ChoiceRowProps = {
  appearancePreview?: "dark" | "light" | "system";
  accessibilityLabel?: string;
  detail: string;
  density?: "comfortable" | "compact";
  disabled?: boolean;
  onPress: () => void;
  selected: boolean;
  testID?: string;
  title: string;
};

/** Canonical radio row from Figma's Choice Group pattern. */
export function ChoiceRow({ accessibilityLabel, appearancePreview, density = "comfortable", detail, disabled = false, onPress, selected, testID, title }: ChoiceRowProps) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  const compact = density === "compact";
  const radio = <View style={[styles.radio, selected ? styles.radioSelected : styles.radioUnselected]}>{selected ? <View style={styles.dot} /> : null}</View>;
  const content = <View style={styles.content}><Text key={`choice-row-title-${fontScale}`} maxFontSizeMultiplier={2} style={[styles.title, appearancePreview ? styles.appearanceTitle : null]}>{title}</Text>{!compact ? <Text key={`choice-row-detail-${fontScale}`} maxFontSizeMultiplier={2} style={[styles.detail, appearancePreview ? styles.appearanceDetail : null]}>{detail}</Text> : null}</View>;
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radio"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.row, compact ? styles.compactRow : null, selected ? styles.selected : styles.unselected, disabled ? styles.disabled : null]}
      testID={testID}
    >
      {appearancePreview ? <AppearancePreview mode={appearancePreview} /> : null}
      {appearancePreview ? content : radio}
      {appearancePreview ? radio : content}
    </Pressable>
  );
}

function AppearancePreview({ mode }: Readonly<{ mode: "dark" | "light" | "system" }>) {
  const styles = useThemedStyles(createStyles);
  const light = mode === "light";
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={[styles.preview, light ? styles.previewLight : styles.previewDark]}>
      <View style={[styles.previewSurface, light ? styles.previewLightSurface : styles.previewDarkSurface]}>
        <View style={[styles.previewPrimaryBar, light ? styles.previewLightPrimaryBar : styles.previewDarkPrimaryBar]} />
        <View style={[styles.previewSecondaryBar, light ? styles.previewLightSecondaryBar : styles.previewDarkSecondaryBar]} />
      </View>
      <View style={styles.previewAccent} />
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  row: {
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: spacing.md,
  },
  compactRow: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: spacing.md,
  },
  selected: {
    backgroundColor: palette.choice.surface,
    borderColor: palette.choice.active,
  },
  unselected: {
    backgroundColor: palette.choice.surface,
    borderColor: palette.choice.border,
  },
  disabled: {
    opacity: 0.6,
  },
  radio: {
    alignItems: "center",
    borderRadius: radius.lg - 2,
    borderWidth: 2,
    flexShrink: 0,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  radioSelected: {
    borderColor: palette.choice.active,
  },
  radioUnselected: {
    borderColor: palette.choice.border,
  },
  dot: {
    backgroundColor: palette.choice.active,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  appearanceDetail: {
    fontSize: 12.5,
    lineHeight: 15.125,
  },
  appearanceTitle: {
    fontSize: 15,
    lineHeight: 18,
  },
  title: {
    ...typography.listRowTitle,
    color: palette.choice.textPrimary,
  },
  detail: {
    ...typography.listRowDetail,
    color: palette.choice.textSecondary,
  },
  preview: {
    borderRadius: 8,
    flexShrink: 0,
    height: 48,
    justifyContent: "flex-start",
    padding: 6,
    width: 60,
  },
  previewAccent: {
    backgroundColor: palette.appearancePreview.accent,
    borderRadius: 2,
    height: 3,
    marginTop: 3,
    width: 16,
  },
  previewDark: { backgroundColor: palette.appearancePreview.darkCanvas },
  previewDarkPrimaryBar: { backgroundColor: palette.appearancePreview.darkPrimaryBar },
  previewDarkSecondaryBar: { backgroundColor: palette.appearancePreview.darkSecondaryBar },
  previewDarkSurface: { backgroundColor: palette.appearancePreview.darkSurface },
  previewLight: { backgroundColor: palette.appearancePreview.lightCanvas },
  previewLightPrimaryBar: { backgroundColor: palette.appearancePreview.lightPrimaryBar },
  previewLightSecondaryBar: { backgroundColor: palette.appearancePreview.lightSecondaryBar },
  previewLightSurface: { backgroundColor: palette.appearancePreview.lightSurface },
  previewPrimaryBar: {
    borderRadius: 1,
    height: 2,
    marginLeft: 4,
    marginTop: 3,
    width: 28,
  },
  previewSecondaryBar: {
    borderRadius: 1,
    height: 2,
    marginLeft: 4,
    marginTop: 2,
    opacity: 0.4,
    width: 18,
  },
  previewSurface: {
    borderRadius: 4,
    height: 14,
    width: "100%",
  },
});
