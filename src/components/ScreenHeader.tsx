import { StyleSheet, Text, View } from "react-native";

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
  description?: string;
  titleTestID?: string;
  title: string;
}>;

/** Figma Patternly Library Screen Header: local context, title, and optional description. */
export function ScreenHeader({ backAction, context, description, title, titleTestID }: ScreenHeaderProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();

  return (
    <View style={styles.container}>
      {backAction || context ? (
        <View style={styles.contextRow}>
          {backAction ? (
            <IconButton
              accessibilityLabel={backAction.accessibilityLabel ?? t("Go back")}
              icon="chevron-left"
              onPress={backAction.onPress}
            />
          ) : null}
          {context ? <Text maxFontSizeMultiplier={2} style={styles.context}>{context}</Text> : null}
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text maxFontSizeMultiplier={2} style={styles.title} testID={titleTestID}>{title}</Text>
        {description ? <Text maxFontSizeMultiplier={2} style={styles.description}>{description}</Text> : null}
      </View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  contextRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 44,
  },
  context: {
    ...typography.small,
    color: palette.textMuted,
    fontWeight: "600",
  },
  copy: {
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: palette.textPrimary,
  },
  description: {
    ...typography.small,
    color: palette.textSecondary,
  },
});
