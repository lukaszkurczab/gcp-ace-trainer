import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAppPreferences, useThemedStyles } from "../preferences";
import { spacing, typography, type AppColors } from "../theme";

type LoadingStateProps = Readonly<{
  description?: string;
  title: string;
}>;

export function LoadingState({ description, title }: LoadingStateProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppPreferences();

  return (
    <View
      accessibilityLabel={description ? `${title}. ${description}` : title}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessible
      style={styles.content}
    >
      <View style={styles.statusIcon}>
        <ActivityIndicator accessibilityElementsHidden color={colors.processing.icon} importantForAccessibility="no" size="small" />
      </View>
      <View style={styles.copy}>
        <Text maxFontSizeMultiplier={2} style={styles.title}>{title}</Text>
        {description ? <Text maxFontSizeMultiplier={2} style={styles.description}>{description}</Text> : null}
      </View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  content: {
    alignItems: "center",
    gap: spacing.md,
    width: "100%",
  },
  statusIcon: {
    alignItems: "center",
    backgroundColor: palette.processing.iconSurface,
    borderColor: palette.processing.statusBorder,
    borderRadius: 28,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  copy: {
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
    width: "100%",
  },
  description: {
    ...typography.processingDescription,
    color: palette.processing.textSecondary,
    flexShrink: 1,
    textAlign: "center",
  },
  title: {
    ...typography.processingTitle,
    color: palette.processing.textPrimary,
    flexShrink: 1,
    textAlign: "center",
  },
});
