import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAppPreferences, useThemedStyles } from "../preferences";
import { spacing, typography, type AppColors } from "../theme";
import { Card } from "./Card";

type LoadingStateProps = Readonly<{
  description?: string;
  title: string;
}>;

export function LoadingState({ description, title }: LoadingStateProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppPreferences();

  return (
    <Card style={styles.card}>
      <View
        accessibilityLabel={description ? `${title}. ${description}` : title}
        accessibilityLiveRegion="polite"
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        accessible
        style={styles.content}
      >
        <ActivityIndicator accessibilityElementsHidden color={colors.primary} importantForAccessibility="no" size="small" />
        <View style={styles.copy}>
          <Text maxFontSizeMultiplier={2} style={styles.title}>{title}</Text>
          {description ? <Text maxFontSizeMultiplier={2} style={styles.description}>{description}</Text> : null}
        </View>
      </View>
    </Card>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: palette.elevatedSurface,
  },
  content: {
    alignItems: "flex-start",
    gap: spacing.md,
  },
  copy: {
    gap: spacing.xs,
    minWidth: 0,
    width: "100%",
  },
  description: {
    ...typography.body,
    color: palette.textSecondary,
    flexShrink: 1,
  },
  title: {
    ...typography.heading,
    color: palette.textPrimary,
    flexShrink: 1,
  },
});
