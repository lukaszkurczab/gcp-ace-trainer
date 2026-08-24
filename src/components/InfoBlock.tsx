import type { ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { radius, spacing, typography } from "../theme";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";

type InfoBlockTone = "neutral" | "success" | "warning";

type InfoBlockProps = {
  body: string;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  title: string;
  tone?: InfoBlockTone;
};

export function InfoBlock({ body, icon, style, testID, title, tone = "neutral" }: InfoBlockProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.base, styles[tone], style]} testID={testID}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <View style={styles.copy}>
        <Text maxFontSizeMultiplier={2} style={[styles.title, styles[`${tone}Title`]]}>{title}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  base: { alignItems: "flex-start", borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.md, padding: spacing.lg },
  neutral: { backgroundColor: palette.elevatedSurface, borderColor: palette.border },
  success: { backgroundColor: palette.successSoft, borderColor: palette.success },
  warning: { backgroundColor: palette.warningSoft, borderColor: palette.warning },
  icon: { alignItems: "center", backgroundColor: palette.surface, borderRadius: radius.sm, height: 40, justifyContent: "center", width: 40 },
  copy: { flex: 1, gap: spacing.xs },
  title: { ...typography.bodyStrong },
  neutralTitle: { color: palette.textPrimary },
  successTitle: { color: palette.success },
  warningTitle: { color: palette.warning },
  body: { ...typography.small, color: palette.textSecondary },
});
