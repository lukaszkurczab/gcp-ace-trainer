import { StyleSheet, View } from "react-native";

import { colors } from "../theme";

export type IconName =
  | "chevron-right"
  | "grid"
  | "home"
  | "practice"
  | "progress"
  | "settings";

type IconProps = {
  color?: string;
  name: IconName;
  size?: number;
};

export function Icon({ color = colors.dark.textMuted, name, size = 24 }: IconProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.icon, { height: size, width: size }]}
    >
      {renderIcon(name, color, size)}
    </View>
  );
}

function renderIcon(name: IconName, color: string, size: number) {
  switch (name) {
    case "chevron-right":
      return (
        <>
          {bar(color, size * 0.36, 2, size * 0.34, size * 0.33, "45deg")}
          {bar(color, size * 0.36, 2, size * 0.34, size * 0.56, "-45deg")}
        </>
      );
    case "grid":
      return [0, 1, 2, 3].map((index) => {
        const x = index % 2 === 0 ? size * 0.18 : size * 0.56;
        const y = index < 2 ? size * 0.18 : size * 0.56;

        return (
          <View
            key={index}
            style={[
              styles.gridCell,
              {
                backgroundColor: color,
                borderRadius: size * 0.08,
                height: size * 0.26,
                left: x,
                top: y,
                width: size * 0.26,
              },
            ]}
          />
        );
      });
    case "home":
      return (
        <>
          {bar(color, size * 0.42, 2, size * 0.2, size * 0.37, "-35deg")}
          {bar(color, size * 0.42, 2, size * 0.45, size * 0.37, "35deg")}
          <View
            style={[
              styles.homeBody,
              {
                borderColor: color,
                borderRadius: size * 0.05,
                borderWidth: 2,
                height: size * 0.4,
                left: size * 0.25,
                top: size * 0.45,
                width: size * 0.5,
              },
            ]}
          />
        </>
      );
    case "practice":
      return (
        <>
          {bar(color, size * 0.58, 2, size * 0.2, size * 0.28)}
          {bar(color, size * 0.42, 2, size * 0.2, size * 0.48)}
          {bar(color, size * 0.3, 2, size * 0.2, size * 0.68)}
          {bar(color, size * 0.2, 2, size * 0.62, size * 0.62, "45deg")}
          {bar(color, size * 0.34, 2, size * 0.72, size * 0.58, "-45deg")}
        </>
      );
    case "progress":
      return (
        <>
          {bar(color, size * 0.64, 2, size * 0.18, size * 0.78)}
          {bar(color, size * 0.58, 2, size * 0.12, size * 0.48, "90deg")}
          {progressBar(color, size, 0.28, 0.58, 0.18)}
          {progressBar(color, size, 0.45, 0.4, 0.36)}
          {progressBar(color, size, 0.62, 0.22, 0.54)}
        </>
      );
    case "settings":
      return (
        <>
          <View
            style={[
              styles.settingsRing,
              {
                borderColor: color,
                borderRadius: size * 0.22,
                borderWidth: 2,
                height: size * 0.44,
                left: size * 0.28,
                top: size * 0.28,
                width: size * 0.44,
              },
            ]}
          />
          {bar(color, size * 0.18, 2, size * 0.41, size * 0.1, "90deg")}
          {bar(color, size * 0.18, 2, size * 0.41, size * 0.88, "90deg")}
          {bar(color, size * 0.18, 2, size * 0.1, size * 0.49)}
          {bar(color, size * 0.18, 2, size * 0.72, size * 0.49)}
        </>
      );
  }
}

function bar(
  color: string,
  width: number,
  height: number,
  left: number,
  top: number,
  rotate = "0deg",
) {
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: color,
          height,
          left,
          top,
          transform: [{ rotate }],
          width,
        },
      ]}
    />
  );
}

function progressBar(
  color: string,
  size: number,
  leftRatio: number,
  topRatio: number,
  heightRatio: number,
) {
  return (
    <View
      style={[
        styles.progressBar,
        {
          borderColor: color,
          borderWidth: 2,
          height: size * heightRatio,
          left: size * leftRatio,
          top: size * topRatio,
          width: size * 0.12,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    position: "relative",
  },
  bar: {
    borderRadius: 999,
    position: "absolute",
  },
  gridCell: {
    position: "absolute",
  },
  homeBody: {
    position: "absolute",
  },
  progressBar: {
    borderRadius: 3,
    position: "absolute",
  },
  settingsRing: {
    position: "absolute",
  },
});
