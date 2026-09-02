import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";

import AlertTriangleIcon from "../assets/icons/alert-triangle.svg";
import AppleIcon from "../assets/icons/apple.svg";
import BellIcon from "../assets/icons/bell.svg";
import BookOpenIcon from "../assets/icons/book-open.svg";
import CheckIcon from "../assets/icons/check.svg";
import ChevronDownIcon from "../assets/icons/chevron-down.svg";
import ChevronLeftIcon from "../assets/icons/chevron-left.svg";
import ChevronRightIcon from "../assets/icons/chevron-right.svg";
import ChevronUpIcon from "../assets/icons/chevron-up.svg";
import CircleSlashIcon from "../assets/icons/circle-slash.svg";
import CloseIcon from "../assets/icons/close.svg";
import ClipboardIcon from "../assets/icons/clipboard.svg";
import CloudIcon from "../assets/icons/cloud.svg";
import ClockCheckIcon from "../assets/icons/clock-check.svg";
import CodeBracketsIcon from "../assets/icons/code-brackets.svg";
import CopyIcon from "../assets/icons/copy.svg";
import CpuIcon from "../assets/icons/cpu.svg";
import DatabaseIcon from "../assets/icons/database.svg";
import DevicePhoneIcon from "../assets/icons/device-phone.svg";
import DotsHorizontalIcon from "../assets/icons/dots-horizontal.svg";
import ExternalLinkIcon from "../assets/icons/external-link.svg";
import EyeIcon from "../assets/icons/eye.svg";
import EyeOffIcon from "../assets/icons/eye-off.svg";
import FlagIcon from "../assets/icons/flag.svg";
import GridIcon from "../assets/icons/grid.svg";
import HomeIcon from "../assets/icons/home.svg";
import InfoCircleIcon from "../assets/icons/info-circle.svg";
import MailIcon from "../assets/icons/mail.svg";
import MoonHalfIcon from "../assets/icons/moon-half.svg";
import PlayIcon from "../assets/icons/play.svg";
import PracticeIcon from "../assets/icons/practice.svg";
import ProgressIcon from "../assets/icons/progress.svg";
import RotateCcwIcon from "../assets/icons/rotate-ccw.svg";
import RouteIcon from "../assets/icons/route.svg";
import ServerStackIcon from "../assets/icons/server-stack.svg";
import SettingsIcon from "../assets/icons/settings.svg";
import ShieldAlertIcon from "../assets/icons/shield-alert.svg";
import ShieldCheckIcon from "../assets/icons/shield-check.svg";
import ShieldIcon from "../assets/icons/shield.svg";
import SparkleIcon from "../assets/icons/sparkle.svg";
import TrashIcon from "../assets/icons/trash.svg";
import UserIcon from "../assets/icons/user.svg";
import WarningIcon from "../assets/icons/warning.svg";
import ZapIcon from "../assets/icons/zap.svg";
import { useAppPreferences } from "../preferences";

export type IconName =
  | "alert-triangle"
  | "apple"
  | "bell"
  | "book-open"
  | "check"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "circle-slash"
  | "close"
  | "clipboard"
  | "cloud"
  | "clock-check"
  | "code-brackets"
  | "copy"
  | "cpu"
  | "database"
  | "device-phone"
  | "dots-horizontal"
  | "external-link"
  | "eye"
  | "eye-off"
  | "flag"
  | "grid"
  | "home"
  | "info-circle"
  | "mail"
  | "moon-half"
  | "play"
  | "practice"
  | "progress"
  | "rotate-ccw"
  | "route"
  | "server-stack"
  | "settings"
  | "shield-alert"
  | "shield-check"
  | "shield"
  | "sparkle"
  | "trash"
  | "user"
  | "warning"
  | "zap";

type IconProps = {
  color?: string;
  name: IconName;
  size?: number;
};

const icons: Record<IconName, ComponentType<SvgProps>> = {
  "alert-triangle": AlertTriangleIcon,
  apple: AppleIcon,
  bell: BellIcon,
  "book-open": BookOpenIcon,
  check: CheckIcon,
  "chevron-down": ChevronDownIcon,
  "chevron-left": ChevronLeftIcon,
  "chevron-right": ChevronRightIcon,
  "chevron-up": ChevronUpIcon,
  "circle-slash": CircleSlashIcon,
  close: CloseIcon,
  clipboard: ClipboardIcon,
  copy: CopyIcon,
  cloud: CloudIcon,
  "clock-check": ClockCheckIcon,
  "code-brackets": CodeBracketsIcon,
  cpu: CpuIcon,
  database: DatabaseIcon,
  "device-phone": DevicePhoneIcon,
  "dots-horizontal": DotsHorizontalIcon,
  "external-link": ExternalLinkIcon,
  eye: EyeIcon,
  "eye-off": EyeOffIcon,
  flag: FlagIcon,
  grid: GridIcon,
  home: HomeIcon,
  "info-circle": InfoCircleIcon,
  mail: MailIcon,
  "moon-half": MoonHalfIcon,
  play: PlayIcon,
  practice: PracticeIcon,
  progress: ProgressIcon,
  "rotate-ccw": RotateCcwIcon,
  route: RouteIcon,
  "server-stack": ServerStackIcon,
  settings: SettingsIcon,
  "shield-alert": ShieldAlertIcon,
  "shield-check": ShieldCheckIcon,
  shield: ShieldIcon,
  sparkle: SparkleIcon,
  trash: TrashIcon,
  user: UserIcon,
  warning: WarningIcon,
  zap: ZapIcon,
};

export function Icon({ color, name, size = 24 }: IconProps) {
  const { colors } = useAppPreferences();
  const SvgIcon = icons[name];

  return (
    <SvgIcon
      accessibilityElementsHidden
      color={color ?? colors.textMuted}
      height={size}
      importantForAccessibility="no-hide-descendants"
      width={size}
    />
  );
}
