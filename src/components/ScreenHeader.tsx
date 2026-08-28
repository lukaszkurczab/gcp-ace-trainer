import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { spacing, typography } from "../theme";
import { useAppPreferences, useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";
import { IconButton } from "./IconButton";

type ScreenHeaderProps = Readonly<{
  backAction?: Readonly<{
    accessibilityLabel?: string;
    onPress: () => void;
  }>;
  context?: string;
  contextTone?: "muted" | "primary";
  description?: string;
  variant?: "default" | "activity" | "practiceSetup";
  titleTestID?: string;
  title: string;
}>;

/** Figma Patternly Library Screen Header: local context, title, and optional description. */
export function ScreenHeader({ backAction, context, contextTone = "muted", description, title, titleTestID, variant = "default" }: ScreenHeaderProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");

  return (
    <View style={[styles.container, variant === "activity" ? styles.activityContainer : null, variant === "practiceSetup" ? styles.practiceSetupContainer : null]}>
      {backAction || context ? (
        <View style={[styles.contextRow, variant === "activity" ? styles.activityContextRow : null, variant === "practiceSetup" ? styles.practiceSetupContextRow : null]}>
          {backAction ? (
            <IconButton
              accessibilityLabel={backAction.accessibilityLabel ?? t("Go back")}
              icon="chevron-left"
              onPress={backAction.onPress}
            />
          ) : null}
          {context ? <Text maxFontSizeMultiplier={2} style={[styles.context, contextTone === "primary" ? styles.contextPrimary : null, variant === "practiceSetup" ? styles.practiceSetupContext : null]}>{context}</Text> : null}
        </View>
      ) : null}
      <View style={[styles.copy, variant === "practiceSetup" ? styles.practiceSetupCopy : null]}>
        <Text maxFontSizeMultiplier={2} style={[styles.title, variant === "activity" ? styles.activityTitle : null]} testID={titleTestID}>{title}</Text>
        {description ? <Text maxFontSizeMultiplier={2} style={[styles.description, variant === "practiceSetup" ? styles.practiceSetupDescription : null]}>{description}</Text> : null}
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
  contextRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
  },
  activityContextRow: {
    gap: spacing.sm,
  },
  practiceSetupContainer: {
    gap: spacing.lg,
  },
  practiceSetupContextRow: {
    gap: spacing.sm,
  },
  context: {
    ...typography.bodyStrong,
    color: palette.textMuted,
  },
  practiceSetupContext: {
    fontWeight: "500",
    lineHeight: 17,
  },
  contextPrimary: {
    color: palette.textPrimary,
  },
  copy: {
    gap: spacing.xs,
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
