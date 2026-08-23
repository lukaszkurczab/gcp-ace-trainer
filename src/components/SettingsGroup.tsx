import { Children, Fragment, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing } from "../theme";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";


type SettingsGroupProps = {
  children: ReactNode;
  dividers?: boolean;
  titleGap?: number;
  title: string;
};

export function SettingsGroup({ children, dividers = false, title, titleGap = spacing.xs }: SettingsGroupProps) {
  const styles = useThemedStyles(createStyles);
  const rows = Children.toArray(children);
  return (
    <View style={[styles.group, { gap: titleGap }]}>
      <Text maxFontSizeMultiplier={2} style={styles.title}>{title}</Text>
      <View style={[styles.rows, dividers ? styles.dividedRows : null]}>
        {rows.map((row, index) => (
          <Fragment key={`${title}-${index}`}>
            {dividers && index > 0 ? <View style={styles.divider} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    lineHeight: 13,
    color: palette.textMuted,
    textTransform: "uppercase",
  },
  rows: {
    gap: spacing.sm,
  },
  dividedRows: {
    gap: 0,
    overflow: "hidden",
  },
  divider: {
    backgroundColor: palette.border,
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
});
