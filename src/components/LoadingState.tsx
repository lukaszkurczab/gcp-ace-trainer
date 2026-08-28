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
              <PatternlyMark
                accessibilityLabel="Patternly logo"
                decorative={false}
                size={104}
                testID="patternly-startup-mark"
                treatment={colorMode === "dark" ? "white" : "mint"}
              />
              <Text maxFontSizeMultiplier={2} style={styles.startupName}>Patternly</Text>
            </View>
            <View style={styles.startupStatus}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={[styles.startupProgressTrack, colorMode === "dark" ? styles.startupProgressTrackDark : null]}
              >
                <View style={styles.startupProgressFill} />
              </View>
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
    paddingTop: 108,
    width: "100%",
  },
  startupBrand: {
    alignItems: "center",
    gap: spacing.xl,
  },
  startupName: {
    ...typography.display,
    color: palette.textPrimary,
    letterSpacing: -0.8,
  },
  startupStatus: {
    alignItems: "stretch",
    gap: spacing.xxxl,
    marginTop: 58,
    maxWidth: 453,
    minWidth: 0,
    width: "62.5%",
  },
  startupProgressTrack: {
    backgroundColor: "#D3D9E2",
    borderRadius: radius.pill,
    height: 4,
    overflow: "hidden",
    width: "100%",
  },
  startupProgressTrackDark: {
    backgroundColor: "#3A4860",
  },
  startupProgressFill: {
    backgroundColor: palette.primary,
    borderRadius: radius.pill,
    height: "100%",
    width: "42%",
  },
  startupCopy: {
    alignItems: "flex-start",
    gap: spacing.sm,
    minWidth: 0,
    width: "100%",
  },
  startupTitle: {
    ...typography.processingTitle,
    color: palette.textPrimary,
    flexShrink: 1,
    textAlign: "left",
  },
  startupDescription: {
    ...typography.processingDescription,
    color: palette.textSecondary,
    flexShrink: 1,
    textAlign: "left",
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
