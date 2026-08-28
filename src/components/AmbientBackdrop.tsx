import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Defs, Polyline, RadialGradient, Rect, Stop } from "react-native-svg";

import Topography from "../assets/ambient/topography.svg";
import { ambient, effects } from "../theme";

type AmbientPoint = Readonly<{ x: number; y: number }>;
type AmbientRoute = Readonly<{ id: string; points: readonly AmbientPoint[] }>;
type MeasuredRoute = Readonly<{ id: string; points: readonly AmbientPoint[]; progress: readonly number[] }>;

const AUTH_ROUTES: readonly AmbientRoute[] = [
  { id: "left-upper", points: [{ x: -0.025, y: 0.1 }, { x: 0.08, y: 0.1 }, { x: 0.08, y: 0.17 }, { x: 0.02, y: 0.17 }, { x: 0.02, y: 0.3 }] },
  { id: "right-upper", points: [{ x: 0.92, y: -0.02 }, { x: 0.92, y: 0.09 }, { x: 1.025, y: 0.09 }, { x: 1.025, y: 0.27 }] },
  { id: "left-lower", points: [{ x: -0.025, y: 0.4 }, { x: 0.04, y: 0.4 }, { x: 0.04, y: 0.56 }, { x: 0.13, y: 0.56 }, { x: 0.13, y: 0.62 }] },
  { id: "right-middle", points: [{ x: 1.025, y: 0.34 }, { x: 0.96, y: 0.34 }, { x: 0.96, y: 0.52 }, { x: 0.87, y: 0.52 }, { x: 0.87, y: 0.58 }] },
  { id: "right-lower", points: [{ x: 1.025, y: 0.83 }, { x: 0.72, y: 0.83 }, { x: 0.72, y: 0.91 }, { x: 0.6, y: 0.91 }] },
] as const;

const SIGNAL_SEQUENCE = [
  { gap: 2400, routeIndex: 0, traversal: 2200 },
  { gap: 3200, routeIndex: 3, traversal: 2500 },
  { gap: 2800, routeIndex: 1, traversal: 2100 },
  { gap: 3600, routeIndex: 4, traversal: 2400 },
  { gap: 2600, routeIndex: 2, traversal: 2700 },
] as const;
const TRAIL_OFFSETS = [0.018, 0.034, 0.052, 0.072, 0.094] as const;

/** Figma Page 1 ambient layers shared by dark Track, Practice, Activity, and Goal screens. */
export function AmbientBackdrop({ variant = "default" }: Readonly<{ variant?: "default" | "activity" | "goal" | "auth" }>) {
  if (variant === "auth") return <AuthAmbientBackdrop />;

  const glowId = variant === "goal" ? "ambient-goal-teal" : variant === "activity" ? "ambient-activity-teal" : "ambient-teal";
  const glowTransform = variant === "goal" ? "matrix(32 0 0 28 224 196)" : variant === "activity" ? "matrix(32 0 0 28 160 140)" : "matrix(16 0 0 14 160 140)";
  const glowColor = variant === "goal" ? ambient.goalTeal : ambient.teal;
  const glowOpacity = variant === "goal" ? 0.06 : variant === "activity" ? 0.04 : 0.05098;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={[StyleSheet.absoluteFill, styles.canvas]}>
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

function AuthAmbientBackdrop() {
  const { height, width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const routes = useMemo(() => AUTH_ROUTES.map((route) => measureRoute(route, width, height)), [height, width]);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const sequenceIndexRef = useRef(0);

  useEffect(() => {
    if (reduceMotion !== false) {
      animationRef.current?.stop();
      progress.setValue(0);
      opacity.setValue(0);
      return;
    }
    let cancelled = false;
    const runNext = () => {
      const sequence = SIGNAL_SEQUENCE[sequenceIndexRef.current]!;
      progress.setValue(0);
      opacity.setValue(0);
      const animation = Animated.sequence([
        Animated.delay(sequence.gap),
        Animated.parallel([
          Animated.timing(progress, { duration: sequence.traversal, easing: Easing.inOut(Easing.sin), toValue: 1, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { duration: 180, toValue: 1, useNativeDriver: true }),
            Animated.delay(sequence.traversal - 480),
            Animated.timing(opacity, { duration: 300, toValue: 0, useNativeDriver: true }),
          ]),
        ]),
      ]);
      animationRef.current = animation;
      animation.start(({ finished }) => {
        if (!finished || cancelled) return;
        sequenceIndexRef.current = (sequenceIndexRef.current + 1) % SIGNAL_SEQUENCE.length;
        setSequenceIndex(sequenceIndexRef.current);
        runNext();
      });
    };
    runNext();
    return () => { cancelled = true; animationRef.current?.stop(); };
  }, [opacity, progress, reduceMotion]);

  const activeRoute = routes[SIGNAL_SEQUENCE[sequenceIndex]!.routeIndex]!;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={[StyleSheet.absoluteFill, styles.canvas]}>
      <Svg height={height} style={styles.authRoutes} width={width}>
        {routes.map((route) => (
          <Polyline fill="none" key={route.id} points={route.points.map((point) => `${point.x},${point.y}`).join(" ")} stroke={effects.authSignal} strokeLinejoin="round" strokeWidth={1} />
        ))}
      </Svg>
      {reduceMotion === false ? <RouteSignal opacity={opacity} progress={progress} route={activeRoute} /> : null}
    </View>
  );
}

function RouteSignal({ opacity, progress, route }: Readonly<{ opacity: Animated.Value; progress: Animated.Value; route: MeasuredRoute }>) {
  return (
    <>
      {TRAIL_OFFSETS.map((offset, index) => (
        <SignalMark
          key={offset}
          opacity={Animated.multiply(opacity, progress.interpolate({ extrapolate: "clamp", inputRange: [0, offset, offset + 0.012, 1], outputRange: [0, 0, 0.58 - index * 0.09, 0.58 - index * 0.09] }))}
          progress={progress.interpolate({ extrapolate: "clamp", inputRange: [offset, 1], outputRange: [0, 1 - offset] })}
          route={route}
          trail
        />
      ))}
      <SignalMark opacity={opacity} progress={progress} route={route} />
    </>
  );
}

function SignalMark({ opacity, progress, route, trail = false }: Readonly<{
  opacity: Animated.AnimatedMultiplication<number> | Animated.Value;
  progress: Animated.AnimatedInterpolation<number> | Animated.Value;
  route: MeasuredRoute;
  trail?: boolean;
}>) {
  const translateX = progress.interpolate({ extrapolate: "clamp", inputRange: [...route.progress], outputRange: route.points.map((point) => point.x) });
  const translateY = progress.interpolate({ extrapolate: "clamp", inputRange: [...route.progress], outputRange: route.points.map((point) => point.y) });
  return (
    <Animated.View style={[trail ? styles.authSignalTrail : styles.authSignalContainer, { opacity, transform: [{ translateX }, { translateY }] }]}>
      {trail ? null : <><View style={styles.authSignalGlow} /><View style={styles.authSignal} /></>}
    </Animated.View>
  );
}

function measureRoute(route: AmbientRoute, width: number, height: number): MeasuredRoute {
  const points = route.points.map((point) => ({ x: point.x * width, y: point.y * height }));
  const lengths = points.slice(1).map((point, index) => Math.hypot(point.x - points[index]!.x, point.y - points[index]!.y));
  const totalLength = lengths.reduce((total, length) => total + length, 0);
  let travelled = 0;
  return { id: route.id, points, progress: [0, ...lengths.map((length) => (travelled += length) / totalLength)] };
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

const styles = StyleSheet.create({
  canvas: { backgroundColor: ambient.canvas },
  authRoutes: { left: 0, position: "absolute", top: 0 },
  authSignalContainer: { height: 18, left: -9, position: "absolute", top: -9, width: 18 },
  authSignal: { backgroundColor: effects.authSignalBright, borderColor: effects.authSignalTrail, borderRadius: 3, borderWidth: 2, height: 5, left: 7, position: "absolute", top: 7, width: 5 },
  authSignalGlow: { backgroundColor: effects.authSignalGlow, borderRadius: 9, height: 18, width: 18 },
  authSignalTrail: { backgroundColor: effects.authSignalBright, borderRadius: 1.5, height: 3, left: -1.5, position: "absolute", top: -1.5, width: 3 },
  goalGlow: { left: 0, position: "absolute", top: 0 },
  tealGlow: { left: -60, position: "absolute", top: -40 },
  indigoGlow: { left: 133, position: "absolute", top: 500 },
  topography: { left: 140, position: "absolute", top: -30 },
});
