import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
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
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);
    if (!startup || reduceMotion !== false) return;
    const animation = Animated.loop(
      Animated.timing(progress, {
        duration: 1400,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => {
      animation.stop();
      progress.stopAnimation();
      progress.setValue(0);
    };
  }, [progress, reduceMotion, startup]);

  const segmentWidth = trackWidth > 0 ? Math.min(Math.max(trackWidth * 0.34, 56), 128) : 84;
  const segmentTranslateX = progress.interpolate({
    extrapolate: "clamp",
    inputRange: [0, 1],
    outputRange: [-segmentWidth, trackWidth],
  });
  const segmentTransform = reduceMotion === false
    ? [{ translateX: segmentTranslateX }]
    : [{ translateX: Math.max((trackWidth - segmentWidth) / 2, 0) }];
  const handleTrackLayout = (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width);

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
                onLayout={handleTrackLayout}
                style={styles.startupProgressTrack}
              >
                <Animated.View style={[styles.startupProgressFill, { transform: segmentTransform, width: segmentWidth }]} />
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

function useReducedMotion(): boolean | null {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  useEffect(() => {
    let subscribed = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => { if (subscribed) setReduceMotion(enabled); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { subscribed = false; subscription.remove(); };
  }, []);
  return reduceMotion;
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
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.pill,
    height: 4,
    overflow: "hidden",
    width: "100%",
  },
  startupProgressFill: {
    backgroundColor: palette.primary,
    borderRadius: radius.pill,
    height: "100%",
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
