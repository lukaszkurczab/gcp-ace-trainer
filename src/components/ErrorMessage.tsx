import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

type ErrorMessageProps = {
  message: string;
};

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.dangerSoft,
    borderColor: colors.light.dangerSoft,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md
  },
  message: {
    ...typography.body,
    color: colors.light.danger
  }
});
