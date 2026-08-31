import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Polyline } from "react-native-svg";

import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";

type AmbientPoint = Readonly<{ x: number; y: number }>;
type AmbientRoute = Readonly<{ id: string; points: readonly AmbientPoint[] }>;
type MeasuredRoute = Readonly<{ id: string; points: readonly AmbientPoint[]; progress: readonly number[] }>;

const AUTH_ROUTES: readonly AmbientRoute[] = [
  { id: "left-upper", points: [{ x: -0.025, y: 0.1 }, { x: 0.08, y: 0.1 }, { x: 0.08, y: 0.17 }, { x: 0.02, y: 0.17 }, { x: 0.02, y: 0.3 }] },
  { id: "right-upper", points: [{ x: 0.92, y: -0.02 }, { x: 0.92, y: 0.09 }, { x: 1.025, y: 0.09 }, { x: 1.025, y: 0.27 }] },
  { id: "left-lower", points: [{ x: -0.025, y: 0.4 }, { x: 0.04, y: 0.4 }, { x: 0.04, y: 0.56 }, { x: 0.13, y: 0.56 }, { x: 0.13, y: 0.62 }] },
  { id: "right-middle", points: [{ x: 1.025, y: 0.34 }, { x: 0.96, y: 0.34 }, { x: 0.96, y: 0.52 }, { x: 0.87, y: 0.52 }, { x: 0.87, y: 0.58 }] },
  { id: "right-lower", points: [{ x: 1.025, y: 0.83 }, { x: 0.72, y: 0.83 }, { x: 0.72, y: 0.91 }, { x: 0.6, y: 0.91 }] },
  { id: "top-center", points: [{ x: 0.34, y: -0.02 }, { x: 0.34, y: 0.08 }, { x: 0.47, y: 0.08 }, { x: 0.47, y: 0.2 }] },
  { id: "center-left", points: [{ x: -0.025, y: 0.7 }, { x: 0.2, y: 0.7 }, { x: 0.2, y: 0.63 }, { x: 0.39, y: 0.63 }] },
  { id: "center-right", points: [{ x: 1.025, y: 0.67 }, { x: 0.82, y: 0.67 }, { x: 0.82, y: 0.74 }, { x: 0.63, y: 0.74 }] },
  { id: "bottom-left", points: [{ x: 0.08, y: 1.02 }, { x: 0.08, y: 0.91 }, { x: 0.28, y: 0.91 }, { x: 0.28, y: 0.82 }] },
  { id: "bottom-right", points: [{ x: 0.93, y: 1.02 }, { x: 0.93, y: 0.94 }, { x: 0.78, y: 0.94 }, { x: 0.78, y: 0.86 }, { x: 0.55, y: 0.86 }] },
] as const;

const ROUTE_VARIANTS = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [0, 2, 4, 6],
  [1, 3, 5, 8],
  [2, 5, 7, 9],
  [0, 3, 8, 9],
] as const;

const TRAIL_OFFSETS = [0.018, 0.034, 0.052, 0.072, 0.094] as const;

export function AmbientBackdrop({ variant = "default" }: Readonly<{ variant?: "default" | "activity" | "goal" | "auth" }>) {
  return <AuthAmbientBackdrop transparent={variant !== "auth"} />;
}

function AuthAmbientBackdrop({ transparent = false }: Readonly<{ transparent?: boolean }>) {
  const styles = useThemedStyles(createStyles);
  const { height, width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const variant = useMemo(() => ROUTE_VARIANTS[randomIndex(ROUTE_VARIANTS.length)]!, []);
  const routes = useMemo(() => variant.map((index) => measureRoute(AUTH_ROUTES[index]!, width, height)), [height, variant, width]);
  const [routeIndex, setRouteIndex] = useState(() => randomRouteIndex());
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const routeIndexRef = useRef(routeIndex);

  useEffect(() => {
    if (reduceMotion !== false) {
      animationRef.current?.stop();
      progress.setValue(0);
      opacity.setValue(0);
      return;
    }
    let cancelled = false;
    const runNext = () => {
      const gap = randomBetween(2200, 3800);
      const traversal = randomBetween(2000, 2900);
      progress.setValue(0);
      opacity.setValue(0);
      const animation = Animated.sequence([
        Animated.delay(gap),
        Animated.parallel([
          Animated.timing(progress, { duration: traversal, easing: Easing.inOut(Easing.sin), toValue: 1, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { duration: 180, toValue: 1, useNativeDriver: true }),
            Animated.delay(traversal - 480),
            Animated.timing(opacity, { duration: 300, toValue: 0, useNativeDriver: true }),
          ]),
        ]),
      ]);
      animationRef.current = animation;
      animation.start(({ finished }) => {
        if (!finished || cancelled) return;
        routeIndexRef.current = randomRouteIndex(routeIndexRef.current);
        setRouteIndex(routeIndexRef.current);
        runNext();
      });
    };
    runNext();
    return () => { cancelled = true; animationRef.current?.stop(); };
  }, [opacity, progress, reduceMotion]);

  const activeRoute = routes[routeIndex]!;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={[StyleSheet.absoluteFill, transparent ? styles.routeCanvas : styles.canvas]}>
      <Svg height={height} style={styles.authRoutes} width={width}>
        {routes.map((route) => (
          <Polyline fill="none" key={route.id} points={route.points.map((point) => `${point.x},${point.y}`).join(" ")} stroke={styles.authRoute.color} strokeLinejoin="round" strokeWidth={1} />
        ))}
      </Svg>
      {reduceMotion === false ? <RouteSignal opacity={opacity} progress={progress} route={activeRoute} /> : null}
    </View>
  );
}

function randomRouteIndex(excludedIndex?: number): number {
  if (ROUTE_VARIANTS[0].length < 2) return 0;
  let index = randomIndex(ROUTE_VARIANTS[0].length);
  while (index === excludedIndex) index = randomIndex(ROUTE_VARIANTS[0].length);
  return index;
}

function randomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
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
  const styles = useThemedStyles(createStyles);
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

const createStyles = (palette: AppColors) => StyleSheet.create({
  canvas: { backgroundColor: palette.ambient.canvas },
  routeCanvas: { backgroundColor: "transparent" },
  authRoute: { color: palette.effects.authSignal },
  authRoutes: { left: 0, position: "absolute", top: 0 },
  authSignalContainer: { height: 18, left: -9, position: "absolute", top: -9, width: 18 },
  authSignal: { backgroundColor: palette.effects.authSignalBright, borderColor: palette.effects.authSignalTrail, borderRadius: 3, borderWidth: 2, height: 5, left: 7, position: "absolute", top: 7, width: 5 },
  authSignalGlow: { backgroundColor: palette.effects.authSignalGlow, borderRadius: 9, height: 18, width: 18 },
  authSignalTrail: { backgroundColor: palette.effects.authSignalBright, borderRadius: 1.5, height: 3, left: -1.5, position: "absolute", top: -1.5, width: 3 },
});
