import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "../theme";

type DomainAccentTone = "primary" | "purple" | "teal" | "orange" | "info";

type DomainAccentProps = {
  tone?: DomainAccentTone;
};

export function DomainAccent({ tone = "primary" }: DomainAccentProps) {
  return (
    <View style={[styles.frame, styles[`${tone}Frame`]]}>
      <View style={[styles.bar, styles[tone]]} />
      <View style={[styles.dot, styles[tone]]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.xxs,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  bar: {
    borderRadius: radius.pill,
    height: 14,
    width: 4
  },
  dot: {
    borderRadius: radius.pill,
    height: 6,
    width: 6
  },
  primaryFrame: {
    backgroundColor: colors.light.primarySoft
  },
  purpleFrame: {
    backgroundColor: colors.light.accentPurpleSoft
  },
  tealFrame: {
    backgroundColor: colors.light.accentTealSoft
  },
  orangeFrame: {
    backgroundColor: colors.light.accentOrangeSoft
  },
  infoFrame: {
    backgroundColor: colors.light.infoSoft
  },
  primary: {
    backgroundColor: colors.light.primary
  },
  purple: {
    backgroundColor: colors.light.accentPurple
  },
  teal: {
    backgroundColor: colors.light.accentTeal
  },
  orange: {
    backgroundColor: colors.light.accentOrange
  },
  info: {
    backgroundColor: colors.light.info
  }
});
