import { StyleSheet, View } from "react-native";

import { radius, spacing } from "../theme";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";


type DomainAccentTone = "primary" | "purple" | "teal" | "orange" | "info";

type DomainAccentProps = {
  tone?: DomainAccentTone;
};

export function DomainAccent({ tone = "primary" }: DomainAccentProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.frame, styles[`${tone}Frame`]]}>
      <View style={[styles.bar, styles[tone]]} />
      <View style={[styles.dot, styles[tone]]} />
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
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
    backgroundColor: palette.primarySoft
  },
  purpleFrame: {
    backgroundColor: palette.accentPurpleSoft
  },
  tealFrame: {
    backgroundColor: palette.accentTealSoft
  },
  orangeFrame: {
    backgroundColor: palette.accentOrangeSoft
  },
  infoFrame: {
    backgroundColor: palette.infoSoft
  },
  primary: {
    backgroundColor: palette.primary
  },
  purple: {
    backgroundColor: palette.accentPurple
  },
  teal: {
    backgroundColor: palette.accentTeal
  },
  orange: {
    backgroundColor: palette.accentOrange
  },
  info: {
    backgroundColor: palette.info
  }
});
