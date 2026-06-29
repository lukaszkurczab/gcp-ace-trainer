import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";

import AlertTriangleIcon from "../assets/icons/alert-triangle.svg";
import BookOpenIcon from "../assets/icons/book-open.svg";
import ChevronRightIcon from "../assets/icons/chevron-right.svg";
import ClipboardIcon from "../assets/icons/clipboard.svg";
import CloudIcon from "../assets/icons/cloud.svg";
import DatabaseIcon from "../assets/icons/database.svg";
import GridIcon from "../assets/icons/grid.svg";
import HomeIcon from "../assets/icons/home.svg";
import PracticeIcon from "../assets/icons/practice.svg";
import ProgressIcon from "../assets/icons/progress.svg";
import RotateCcwIcon from "../assets/icons/rotate-ccw.svg";
import RouteIcon from "../assets/icons/route.svg";
import SettingsIcon from "../assets/icons/settings.svg";
import ShieldCheckIcon from "../assets/icons/shield-check.svg";
import TrashIcon from "../assets/icons/trash.svg";
import ZapIcon from "../assets/icons/zap.svg";
import { colors } from "../theme";

export type IconName =
  | "alert-triangle"
  | "book-open"
  | "chevron-right"
  | "clipboard"
  | "cloud"
  | "database"
  | "grid"
  | "home"
  | "practice"
  | "progress"
  | "rotate-ccw"
  | "route"
  | "settings"
  | "shield-check"
  | "trash"
  | "zap";

type IconProps = {
  color?: string;
  name: IconName;
  size?: number;
};

const icons: Record<IconName, ComponentType<SvgProps>> = {
  "alert-triangle": AlertTriangleIcon,
  "book-open": BookOpenIcon,
  "chevron-right": ChevronRightIcon,
  clipboard: ClipboardIcon,
  cloud: CloudIcon,
  database: DatabaseIcon,
  grid: GridIcon,
  home: HomeIcon,
  practice: PracticeIcon,
  progress: ProgressIcon,
  "rotate-ccw": RotateCcwIcon,
  route: RouteIcon,
  settings: SettingsIcon,
  "shield-check": ShieldCheckIcon,
  trash: TrashIcon,
  zap: ZapIcon,
};

export function Icon({ color = colors.dark.textMuted, name, size = 24 }: IconProps) {
  const SvgIcon = icons[name];

  return (
    <SvgIcon
      accessibilityElementsHidden
      color={color}
      height={size}
      importantForAccessibility="no-hide-descendants"
      width={size}
    />
  );
}
