import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import Topography from "../assets/ambient/topography.svg";

/** Figma Page 1 ambient layers shared by dark Track, Practice, Activity, and Goal screens. */
export function AmbientBackdrop({ variant = "default" }: Readonly<{ variant?: "default" | "activity" | "goal" }>) {
  const glowId = variant === "goal" ? "ambient-goal-teal" : variant === "activity" ? "ambient-activity-teal" : "ambient-teal";
  const glowTransform = variant === "goal" ? "matrix(32 0 0 28 224 196)" : variant === "activity" ? "matrix(32 0 0 28 160 140)" : "matrix(16 0 0 14 160 140)";
  const glowColor = variant === "goal" ? "#20C997" : "#14B7A6";
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
                <Stop offset="0" stopColor="#4F46E5" stopOpacity={0.039216} />
                <Stop offset="1" stopColor="#4F46E5" stopOpacity={0} />
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

const styles = StyleSheet.create({
  canvas: { backgroundColor: "#081328" },
  goalGlow: { left: 0, position: "absolute", top: 0 },
  tealGlow: { left: -60, position: "absolute", top: -40 },
  indigoGlow: { left: 133, position: "absolute", top: 500 },
  topography: { left: 140, position: "absolute", top: -30 },
});
