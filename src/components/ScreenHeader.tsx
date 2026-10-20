import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { spacing, typography } from "../theme";
import { useThemedStyles } from "../preferences/appPreferencesContext";
import type { AppColors } from "../theme";

type ScreenHeaderProps = Readonly<{
  context?: string;
  contextTone?: "muted" | "primary";
  description?: string;
  variant?: "default" | "activity" | "practiceSetup";
  titleTestID?: string;
  title: string;
}>;

/** Scrollable screen title and optional context or description. */
export function ScreenHeader({ context, contextTone = "muted", description, title, titleTestID, variant = "default" }: ScreenHeaderProps) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();

  return (
    <View style={[styles.container, variant === "activity" ? styles.activityContainer : null, variant === "practiceSetup" ? styles.practiceSetupContainer : null]}>
      {context ? <Text accessibilityLabel={context} ellipsizeMode="clip" key={`context:${fontScale}`} maxFontSizeMultiplier={2} numberOfLines={2} style={[styles.context, contextTone === "primary" ? styles.contextPrimary : null]}>{context}</Text> : null}
      <View style={[styles.copy, variant === "practiceSetup" ? styles.practiceSetupCopy : null]}>
        <Text key={`title:${fontScale}`} maxFontSizeMultiplier={2} style={[styles.title, variant === "activity" ? styles.activityTitle : null]} testID={titleTestID}>{title}</Text>
        {description ? <Text key={`description:${fontScale}`} maxFontSizeMultiplier={2} style={[styles.description, variant === "practiceSetup" ? styles.practiceSetupDescription : null]}>{description}</Text> : null}
      </View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  activityContainer: {
    gap: spacing.sm,
  },
  context: {
    ...typography.navigationContext,
    color: palette.textPrimary,
    flexShrink: 1,
    minWidth: 0,
  },
  contextPrimary: {
    color: palette.textPrimary,
  },
  copy: {
    gap: spacing.xs,
  },
  practiceSetupContainer: {
    gap: spacing.lg,
  },
  practiceSetupCopy: {
    gap: 6,
  },
  title: {
    ...typography.title,
    color: palette.textPrimary,
  },
  activityTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "600",
  },
  description: {
    ...typography.small,
    color: palette.textMuted,
  },
  practiceSetupDescription: {
    color: palette.textSecondary,
    fontSize: 13.5,
    fontWeight: "400",
    lineHeight: 19,
  },
});
