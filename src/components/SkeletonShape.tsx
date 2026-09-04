import { useEffect, useId, useRef, useState } from "react";
import { AccessibilityInfo, Animated, AppState, Easing, StyleSheet, View, type AppStateStatus, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { useAppPreferences } from "../preferences";

const GLASS_MOTION_DURATION_MS = 1_800;

export function useSkeletonGlassMotion(): Animated.Value | null {
  const motion = useRef(new Animated.Value(0)).current;
  const [appState, setAppState] = useState<AppStateStatus | null>(AppState.currentState);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    let observedEvent = false;
    const appStateSubscription = AppState.addEventListener("change", setAppState);
    const reduceMotionSubscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      if (!active) return;
      observedEvent = true;
      setReduceMotion(enabled);
    });

    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!active || observedEvent) return;
        setReduceMotion(enabled);
      })
      .catch((error: unknown) => {
        if (!active || observedEvent) return;
        setReduceMotion(null);
        console.warn("[SkeletonShape] Reduce Motion preference could not be read; glass motion remains static.", error);
      });

    return () => {
      active = false;
      appStateSubscription.remove();
      reduceMotionSubscription.remove();
    };
  }, []);

  const shouldAnimate = appState === "active" && reduceMotion === false;

  useEffect(() => {
    motion.stopAnimation();
    motion.setValue(0);

    if (!shouldAnimate) return undefined;

    const animation = Animated.loop(
      Animated.timing(motion, {
        duration: GLASS_MOTION_DURATION_MS,
        easing: Easing.linear,
        isInteraction: false,
        toValue: 1,
        useNativeDriver: true,
      }),
    );
    animation.start();

    return () => {
      animation.stop();
      motion.stopAnimation();
      motion.setValue(0);
    };
  }, [motion, shouldAnimate]);

  return shouldAnimate ? motion : null;
}

type SkeletonShapeProps = Readonly<{
  motion: Animated.Value | null;
  style: StyleProp<ViewStyle>;
}>;

export function SkeletonShape({ motion, style }: SkeletonShapeProps) {
  const { colorMode } = useAppPreferences();
  const [width, setWidth] = useState(0);
  const gradientId = `patternly-skeleton-glass-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const bandWidth = width > 0 ? Math.max(48, Math.min(width * 0.36, 160)) : 0;
  const translateX = motion && width > 0
    ? motion.interpolate({ extrapolate: "clamp", inputRange: [0, 1], outputRange: [-width, width] })
    : 0;
  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setWidth((currentWidth) => currentWidth === nextWidth ? currentWidth : nextWidth);
  };
  const peakOpacity = colorMode === "dark" ? 0.3 : 0.7;

  return (
    <View
      accessibilityElementsHidden
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      onLayout={handleLayout}
      pointerEvents="none"
      style={[style, styles.base]}
    >
      {motion && width > 0 ? (
        <Animated.View pointerEvents="none" style={[styles.glassBand, { transform: [{ translateX }], width: bandWidth }]}>
          <Svg height="100%" pointerEvents="none" width="100%">
            <Defs>
              <LinearGradient id={gradientId} x1="0" x2="100%" y1="0" y2="0">
                <Stop offset="0" stopColor="white" stopOpacity={0} />
                <Stop offset="0.5" stopColor="white" stopOpacity={peakOpacity} />
                <Stop offset="1" stopColor="white" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect fill={`url(#${gradientId})`} height="100%" width="100%" />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
  glassBand: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
  },
});
