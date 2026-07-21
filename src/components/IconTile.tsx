import { StyleSheet, View } from "react-native";

import { radius } from "../theme";
import { Icon, type IconName } from "./Icon";
import { useAppPreferences, useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";


type IconTileTone = "danger" | "info" | "muted" | "primary" | "success" | "warning";

type IconTileProps = {
  name: IconName;
  size?: number;
  tone?: IconTileTone;
};

export function IconTile({ name, size = 40, tone = "primary" }: IconTileProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();
  const toneStyle = getToneStyles(palette)[tone];

  return (
    <View style={[styles.tile, { backgroundColor: toneStyle.backgroundColor, height: size, width: size }]}>
      <Icon color={toneStyle.color} name={name} size={Math.round(size * 0.56)} />
    </View>
  );
}

function getToneStyles(palette: AppColors): Record<IconTileTone, { backgroundColor: string; color: string }> {
  return {
    danger: { backgroundColor: palette.dangerSoft, color: palette.danger },
    info: { backgroundColor: palette.infoSoft, color: palette.info },
    muted: { backgroundColor: palette.elevatedSurface, color: palette.textMuted },
    primary: { backgroundColor: palette.primarySoft, color: palette.primary },
    success: { backgroundColor: palette.successSoft, color: palette.success },
    warning: { backgroundColor: palette.warningSoft, color: palette.warning },
  };
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  tile: {
    alignItems: "center",
    borderRadius: radius.md,
    justifyContent: "center",
  },
});
