import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import Topography from "../assets/ambient/topography.svg";

/** Figma Page 1 ambient layers shared by dark Track, Practice, and Activity screens. */
export function AmbientBackdrop({ variant = "default" }: Readonly<{ variant?: "default" | "activity" }>) {
  return (
    <View accessibilityElementsHidden pointerEvents="none" style={[StyleSheet.absoluteFill, styles.canvas]}>
      <Svg height={280} style={styles.tealGlow} width={320}>
        <Defs>
          <RadialGradient cx={0} cy={0} gradientTransform={variant === "activity" ? "matrix(32 0 0 28 160 140)" : "matrix(16 0 0 14 160 140)"} id={variant === "activity" ? "ambient-activity-teal" : "ambient-teal"} r={10}>
            <Stop offset="0" stopColor="#14B7A6" stopOpacity={0.05098} />
            <Stop offset="1" stopColor="#14B7A6" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect fill={variant === "activity" ? "url(#ambient-activity-teal)" : "url(#ambient-teal)"} height="280" width="320" />
      </Svg>
      {variant === "activity" ? null : (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { backgroundColor: "#081328" },
  tealGlow: { left: -60, position: "absolute", top: -40 },
  indigoGlow: { left: 133, position: "absolute", top: 500 },
  topography: { left: 140, position: "absolute", top: -30 },
});
