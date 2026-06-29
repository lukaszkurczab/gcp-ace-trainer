import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { spacing } from "../theme";
import { Card } from "./Card";
import { SectionHeader } from "./SectionHeader";

type SettingsGroupProps = {
  children: ReactNode;
  title: string;
};

export function SettingsGroup({ children, title }: SettingsGroupProps) {
  return (
    <Card>
      <SectionHeader title={title} tight />
      <View style={styles.rows}>{children}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  rows: {
    gap: spacing.md,
  },
});
