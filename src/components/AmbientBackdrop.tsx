import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Defs, Line, RadialGradient, Rect, Stop } from "react-native-svg";

import Topography from "../assets/ambient/topography.svg";
import { ambient, effects } from "../theme";

/** Figma Page 1 ambient layers shared by dark Track, Practice, Activity, and Goal screens. */
export function AmbientBackdrop({ variant = "default" }: Readonly<{ variant?: "default" | "activity" | "goal" | "auth" }>) {
  if (variant === "auth") {
    return (
      <View accessibilityElementsHidden pointerEvents="none" style={[StyleSheet.absoluteFill, styles.canvas]}>
        <Svg height={880} style={styles.authCircuit} viewBox="0 0 360 880" width={360}>
          <Line stroke={effects.authSignal} strokeWidth={1} x1={14} x2={14} y1={60} y2={166} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={14} x2={66} y1={166} y2={166} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={66} x2={66} y1={166} y2={214} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={300} x2={300} y1={42} y2={144} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={300} x2={336} y1={144} y2={144} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={336} x2={336} y1={144} y2={252} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={38} x2={38} y1={488} y2={590} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={38} x2={114} y1={590} y2={590} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={114} x2={114} y1={590} y2={676} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={252} x2={342} y1={700} y2={700} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={252} x2={252} y1={700} y2={774} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={182} x2={182} y1={274} y2={362} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={182} x2={246} y1={362} y2={362} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={74} x2={148} y1={412} y2={412} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={148} x2={148} y1={412} y2={476} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={286} x2={286} y1={510} y2={626} />
          <Line stroke={effects.authSignal} strokeWidth={1} x1={286} x2={350} y1={626} y2={626} />
        </Svg>
        <SignalPulse delay={400} direction="down" length={154} x={14} y={60} />
        <SignalPulse delay={2200} direction="down" length={210} x={336} y={42} />
        <SignalPulse delay={4100} direction="right" length={76} x={38} y={590} />
        <SignalPulse delay={5900} direction="up" length={74} x={252} y={774} />
        <SignalPulse delay={7100} direction="down" length={88} x={182} y={274} />
      </View>
    );
  }
  const glowId = variant === "goal" ? "ambient-goal-teal" : variant === "activity" ? "ambient-activity-teal" : "ambient-teal";
  const glowTransform = variant === "goal" ? "matrix(32 0 0 28 224 196)" : variant === "activity" ? "matrix(32 0 0 28 160 140)" : "matrix(16 0 0 14 160 140)";
  const glowColor = variant === "goal" ? ambient.goalTeal : ambient.teal;
  const glowOpacity = variant === "goal" ? 0.06 : variant === "activity" ? 0.04 : 0.05098;
  return (
    <View accessibilityElementsHidden pointerEvents="none" style={[StyleSheet.absoluteFill, styles.canvas]}>
      <Svg height={280} style={variant === "goal" ? styles.goalGlow : styles.tealGlow} width={320}>
        <Defs>
          <RadialGradient cx={0} cy={0} gradientTransform={glowTransform} id={glowId} r={10}>
            <Stop offset="0" stopColor={glowColor} stopOpacity={glowOpacity} />
            <Stop offset="1" stopColor={glowColor} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect fill={`url(#${glowId})`} height="280" width="320" />
      </Svg>
      {variant === "default" ? (
        <>
          <Svg height={300} style={styles.indigoGlow} width={320}>
            <Defs>
              <RadialGradient cx={0} cy={0} gradientTransform="matrix(16 0 0 15 160 150)" id="ambient-indigo" r={10}>
                <Stop offset="0" stopColor={ambient.indigo} stopOpacity={0.039216} />
                <Stop offset="1" stopColor={ambient.indigo} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect fill="url(#ambient-indigo)" height="300" width="320" />
          </Svg>
          <Topography height={260} style={styles.topography} width={300} />
        </>
      ) : null}
    </View>
  );
}

function SignalPulse({ delay, direction, length, x, y }: Readonly<{
  delay: number;
  direction: "down" | "right" | "up";
  length: number;
  x: number;
  y: number;
}>) {
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const runRef = useRef<Animated.CompositeAnimation | null>(null);
  const initialDelay = useMemo(() => delay + Math.round(Math.random() * 900), [delay]);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      progress.setValue(Math.random() * 0.18);
      opacity.setValue(0);
      const animation = Animated.sequence([
        Animated.delay(initialDelay + Math.round(Math.random() * 1200)),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 720, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]),
          Animated.timing(progress, { toValue: 1, duration: 1600 + Math.round(Math.random() * 1000), easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ]);
      runRef.current = animation;
      animation.start(({ finished }) => {
        if (finished && !cancelled) run();
      });
    };
    run();
    return () => {
      cancelled = true;
      runRef.current?.stop();
    };
  }, [initialDelay, opacity, progress]);

  const translateX = direction === "right"
    ? progress.interpolate({ inputRange: [0, 1], outputRange: [0, length] })
    : 0;
  const translateY = direction === "up"
    ? progress.interpolate({ inputRange: [0, 1], outputRange: [0, -length] })
    : direction === "down"
      ? progress.interpolate({ inputRange: [0, 1], outputRange: [0, length] })
      : 0;

  return (
    <Animated.View style={{ left: x - 9, opacity, position: "absolute", top: y - 9, transform: [{ translateX }, { translateY }] }}>
      <View style={styles.authSignalGlow} />
      <View style={styles.authSignal} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  canvas: { backgroundColor: ambient.canvas },
  authCircuit: { left: 0, position: "absolute", top: 0 },
  authSignal: {
    backgroundColor: effects.authSignalBright,
    borderColor: effects.authSignalTrail,
    borderRadius: 3,
    borderWidth: 2,
    height: 5,
    left: 7,
    position: "absolute",
    top: 7,
    width: 5,
  },
  authSignalGlow: {
    backgroundColor: effects.authSignalGlow,
    borderRadius: 9,
    height: 18,
    width: 18,
  },
  goalGlow: { left: 0, position: "absolute", top: 0 },
  tealGlow: { left: -60, position: "absolute", top: -40 },
  indigoGlow: { left: 133, position: "absolute", top: 500 },
  topography: { left: 140, position: "absolute", top: -30 },
});
