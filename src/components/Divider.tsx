import { StyleSheet, View } from "react-native";

import { colors, spacing } from "../theme";

type DividerProps = {
  inset?: boolean;
};

export function Divider({ inset = false }: DividerProps) {
  return <View style={[styles.divider, inset ? styles.inset : null]} />;
}

const styles = StyleSheet.create({
  divider: {
    backgroundColor: colors.light.border,
    height: StyleSheet.hairlineWidth,
    width: "100%"
  },
  inset: {
    marginHorizontal: spacing.lg
  }
});
