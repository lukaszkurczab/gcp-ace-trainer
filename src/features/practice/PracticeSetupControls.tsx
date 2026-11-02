import { Pressable, StyleSheet, Text, useWindowDimensions, View, type TextStyle, type ViewProps } from "react-native";
import { useThemedStyles } from "../../preferences";
import { radius, spacing, type AppColors } from "../../theme";

/** Shared compact settings recipe used by Practice and Approach Challenge. */
export function PracticeSetupSectionHeader({ title, subtitle }: Readonly<{ title: string; subtitle?: string }>) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  return <View style={styles.header}>
    <Text key={`title:${fontScale}`} accessibilityRole="header" maxFontSizeMultiplier={2} style={styles.title}>{title.toUpperCase()}</Text>
    {subtitle ? <Text key={`subtitle:${fontScale}`} maxFontSizeMultiplier={2} style={styles.subtitle}>{subtitle}</Text> : null}
  </View>;
}

export function PracticeSetupSegmentGroup({ style, ...props }: ViewProps) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  return <View {...props} style={[styles.group, fontScale >= 1.3 ? styles.largeGroup : null, style]} />;
}

export function PracticeSetupSegment({ label, meta, selected, onPress, disabled = false, accessibilityLabel, role = "radio", testID, labelWeight = "700" }: Readonly<{
  label: string; meta?: string; selected: boolean; onPress: () => void; disabled?: boolean;
  accessibilityLabel?: string; role?: "radio" | "checkbox"; testID?: string;
  labelWeight?: TextStyle["fontWeight"];
}>) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  return <Pressable accessibilityRole={role} accessibilityLabel={accessibilityLabel ?? [label, meta].filter(Boolean).join(" ")}
    accessibilityState={{ checked: selected, selected, disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.option, fontScale >= 1.3 ? styles.largeOption : null, selected ? styles.selected : null, pressed && !disabled ? styles.pressed : null, disabled ? styles.disabled : null]} testID={testID}>
    <Text key={`value:${fontScale}`} maxFontSizeMultiplier={2} style={[styles.value, { fontWeight: labelWeight }, selected ? styles.selectedText : null]}>{label}</Text>
    {meta ? <Text key={`meta:${fontScale}`} maxFontSizeMultiplier={2} style={[styles.meta, selected ? styles.selectedText : null]}>{meta}</Text> : null}
  </Pressable>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  header: { gap: spacing.xs },
  title: { color: palette.textPrimary, fontSize: 13, fontWeight: "700", lineHeight: 16 },
  subtitle: { color: palette.textMuted, fontSize: 12.5, lineHeight: 15 },
  group: { backgroundColor: palette.surfaceInput, borderColor: palette.border, borderRadius: radius.button, borderWidth: 1, flexDirection: "row", gap: spacing.xs, minHeight: 54, padding: spacing.xs },
  largeGroup: { flexDirection: "column" },
  option: { alignItems: "center", justifyContent: "center", backgroundColor: "transparent", borderColor: "transparent", borderRadius: 10, borderWidth: 1, flex: 1, minHeight: 44, minWidth: 0, paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
  largeOption: { flex: 0 },
  selected: { backgroundColor: palette.primary, borderColor: palette.primary },
  value: { color: palette.textSecondary, fontSize: 15, lineHeight: 18, fontVariant: ["tabular-nums"] },
  meta: { color: palette.textMuted, fontSize: 11, lineHeight: 15 },
  selectedText: { color: palette.onPrimary },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.6 },
});
