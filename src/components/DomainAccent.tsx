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
    backgroundColor: colors.dark.primarySoft
  },
  purpleFrame: {
    backgroundColor: colors.dark.accentPurpleSoft
  },
  tealFrame: {
    backgroundColor: colors.dark.accentTealSoft
  },
  orangeFrame: {
    backgroundColor: colors.dark.accentOrangeSoft
  },
  infoFrame: {
    backgroundColor: colors.dark.infoSoft
  },
  primary: {
    backgroundColor: colors.dark.primary
  },
  purple: {
    backgroundColor: colors.dark.accentPurple
  },
  teal: {
    backgroundColor: colors.dark.accentTeal
  },
  orange: {
    backgroundColor: colors.dark.accentOrange
  },
  info: {
    backgroundColor: colors.dark.info
  }
});
