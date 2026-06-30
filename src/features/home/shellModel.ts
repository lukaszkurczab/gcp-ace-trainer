import { ROUTES } from "../../constants/routes";
import type { IconName } from "../../components/Icon";
import type { ShellTab } from "./types";

export type ShellTabItem = {
  icon: IconName;
  id: ShellTab;
  label: "Home" | "Practice" | "Progress" | "Settings";
};

export type VisibleCta = {
  label: string;
  route: (typeof ROUTES)[keyof typeof ROUTES];
};

export const MAIN_TAB_ITEMS: readonly ShellTabItem[] = [
  { icon: "home", id: "home", label: "Home" },
  { icon: "practice", id: "practice", label: "Practice" },
  { icon: "progress", id: "progress", label: "Progress" },
  { icon: "settings", id: "settings", label: "Settings" },
];

export const HOME_PRIMARY_CTA: VisibleCta = {
  label: "Start learning",
  route: ROUTES.PRACTICE_SETUP,
};

export const HOME_CHANGE_FOCUS_CTA: VisibleCta = {
  label: "Change focus",
  route: ROUTES.SELECT_TRACK,
};

export const PRACTICE_PRIMARY_CTA: VisibleCta = {
  label: "Start session",
  route: ROUTES.PRACTICE_SETUP,
};

export const PRACTICE_EXAM_CTA: VisibleCta = {
  label: "Exam simulation",
  route: ROUTES.EXAM,
};

export const PRACTICE_REVIEW_CTA: VisibleCta = {
  label: "Review weak items",
  route: ROUTES.MISTAKES_REVIEW,
};

export const HOME_RECOMMENDATIONS = [
  {
    detail: "Suggested because of recent practice gaps.",
    label: "Recommended",
    title: "Review IAM policies",
  },
  {
    detail: "Concepts will appear after practice history is available.",
    label: "After practice",
    title: "Due for review",
  },
  {
    detail: "Access-control scenarios from Cloud Certification practice.",
    label: "Focus area",
    title: "IAM roles",
  },
] as const;

export type ShellSafetyModel = {
  gamifiedFields: readonly string[];
  primaryHomeRoute: VisibleCta["route"];
  primaryPracticeRoute: VisibleCta["route"];
  tabLabels: readonly ShellTabItem["label"][];
};

export function buildShellSafetyModel(): ShellSafetyModel {
  return {
    gamifiedFields: [],
    primaryHomeRoute: HOME_PRIMARY_CTA.route,
    primaryPracticeRoute: PRACTICE_PRIMARY_CTA.route,
    tabLabels: MAIN_TAB_ITEMS.map((item) => item.label),
  };
}
