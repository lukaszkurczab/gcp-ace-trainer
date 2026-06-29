import { StyleSheet, View } from "react-native";

import { colors, radius } from "../theme";
import { Icon, type IconName } from "./Icon";

type IconTileTone = "danger" | "info" | "muted" | "primary" | "success" | "warning";

type IconTileProps = {
  name: IconName;
  size?: number;
  tone?: IconTileTone;
};

const toneStyles: Record<IconTileTone, { backgroundColor: string; color: string }> = {
  danger: { backgroundColor: colors.dark.dangerSoft, color: colors.dark.danger },
  info: { backgroundColor: colors.dark.infoSoft, color: colors.dark.info },
  muted: { backgroundColor: colors.dark.elevatedSurface, color: colors.dark.textMuted },
  primary: { backgroundColor: colors.dark.primarySoft, color: colors.dark.primary },
  success: { backgroundColor: colors.dark.successSoft, color: colors.dark.success },
  warning: { backgroundColor: colors.dark.warningSoft, color: colors.dark.warning },
};

export function IconTile({ name, size = 40, tone = "primary" }: IconTileProps) {
  const toneStyle = toneStyles[tone];

  return (
    <View style={[styles.tile, { backgroundColor: toneStyle.backgroundColor, height: size, width: size }]}>
      <Icon color={toneStyle.color} name={name} size={Math.round(size * 0.56)} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    borderRadius: radius.md,
    justifyContent: "center",
  },
});
