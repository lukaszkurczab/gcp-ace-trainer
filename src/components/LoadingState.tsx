import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { useAppPreferences, useThemedStyles } from "../preferences";
import { radius, spacing, typography, type AppColors } from "../theme";
import { PatternlyMark } from "./PatternlyMark";

type LoadingStateProps = Readonly<{
  description?: string;
  title: string;
  variant?: "default" | "startup";
}>;

export function LoadingState({ description, title, variant = "default" }: LoadingStateProps) {
  const styles = useThemedStyles(createStyles);
  const { colorMode, colors } = useAppPreferences();
  const startup = variant === "startup";

  return (
    <>
      {startup ? <StatusBar style={colorMode === "dark" ? "light" : "dark"} /> : null}
      <View
        accessibilityLabel={description ? `${title}. ${description}` : title}
        accessibilityLiveRegion="polite"
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        accessible
        style={startup ? styles.startupContent : styles.content}
      >
        {startup ? (
          <>
            <View style={styles.startupBrand}>
              <View style={styles.startupMarkFrame}>
                <PatternlyMark
                  accessibilityLabel="Patternly logo"
                  decorative={false}
                  size={104}
                  testID="patternly-startup-mark"
                  treatment={colorMode === "dark" ? "mint" : "navy"}
                />
              </View>
              <Text maxFontSizeMultiplier={2} style={styles.startupName}>Patternly</Text>
            </View>
            <View style={styles.startupStatus}>
              <ActivityIndicator accessibilityElementsHidden color={colors.primary} importantForAccessibility="no" size="small" />
              <View style={styles.startupCopy}>
                <Text maxFontSizeMultiplier={2} style={styles.startupTitle}>{title}</Text>
                {description ? <Text maxFontSizeMultiplier={2} style={styles.startupDescription}>{description}</Text> : null}
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.statusIcon}>
              <ActivityIndicator accessibilityElementsHidden color={colors.processing.icon} importantForAccessibility="no" size="small" />
            </View>
            <View style={styles.copy}>
              <Text maxFontSizeMultiplier={2} style={styles.title}>{title}</Text>
              {description ? <Text maxFontSizeMultiplier={2} style={styles.description}>{description}</Text> : null}
            </View>
          </>
        )}
      </View>
    </>
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
  startupContent: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xxxl,
    justifyContent: "center",
    width: "100%",
  },
  startupBrand: {
    alignItems: "center",
    gap: spacing.lg,
  },
  startupMarkFrame: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.xxl,
    borderWidth: 1,
    height: 136,
    justifyContent: "center",
    width: 136,
  },
  startupName: {
    ...typography.title,
    color: palette.textPrimary,
    letterSpacing: -0.4,
  },
  startupStatus: {
    alignItems: "center",
    gap: spacing.md,
    maxWidth: 320,
    minWidth: 0,
    width: "100%",
  },
  startupCopy: {
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
    width: "100%",
  },
  startupTitle: {
    ...typography.processingTitle,
    color: palette.textPrimary,
    flexShrink: 1,
    textAlign: "center",
  },
  startupDescription: {
    ...typography.processingDescription,
    color: palette.textSecondary,
    flexShrink: 1,
    textAlign: "center",
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
