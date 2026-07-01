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

export type StaticCta = {
  enabled: false;
  label: string;
};

export type HomeRecommendation = {
  detail: string;
  label: string;
  route?: VisibleCta["route"];
  title: string;
};

export const MAIN_TAB_ITEMS: readonly ShellTabItem[] = [
  { icon: "home", id: "home", label: "Home" },
  { icon: "practice", id: "practice", label: "Practice" },
  { icon: "progress", id: "progress", label: "Progress" },
  { icon: "settings", id: "settings", label: "Settings" },
];

export const HOME_PRIMARY_CTA: VisibleCta = {
  label: "Start learning",
  route: ROUTES.PRACTICE_HUB,
};

export const HOME_CHANGE_FOCUS_CTA: VisibleCta = {
  label: "Change track",
  route: ROUTES.SELECT_TRACK,
};

export const PRACTICE_PRIMARY_CTA: VisibleCta = {
  label: "Start session",
  route: ROUTES.PRACTICE_HUB,
};

export const PRACTICE_EXAM_CTA: VisibleCta = {
  label: "Exam simulation",
  route: ROUTES.EXAM,
};

export const PRACTICE_REVIEW_CTA = {
  label: "Review weak items",
  route: ROUTES.MISTAKES_REVIEW,
} satisfies VisibleCta;

export const HOME_RECOMMENDATIONS: readonly HomeRecommendation[] = [
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
  homeRecommendationRoutes: readonly VisibleCta["route"][];
  primaryHomeRoute: VisibleCta["route"];
  primaryPracticeRoute: VisibleCta["route"];
  practiceReviewRoute: VisibleCta["route"] | null;
  tabLabels: readonly ShellTabItem["label"][];
};

export type SettingsRowBehavior = "static" | "destructive";

export type SettingsRowModel = {
  behavior: SettingsRowBehavior;
  id: string;
  label: string;
  section: "learning" | "app" | "data" | "account";
};

export const SETTINGS_ROWS: readonly SettingsRowModel[] = [
  { behavior: "static", id: "activeTracks", label: "Active tracks", section: "learning" },
  { behavior: "static", id: "sessionLength", label: "Session length", section: "learning" },
  { behavior: "static", id: "reviewPriority", label: "Review priority", section: "learning" },
  { behavior: "static", id: "notifications", label: "Notifications", section: "app" },
  { behavior: "static", id: "dailyReminder", label: "Daily reminder", section: "app" },
  { behavior: "static", id: "appearance", label: "Appearance", section: "app" },
  { behavior: "static", id: "soundEffects", label: "Sound effects", section: "app" },
  { behavior: "static", id: "localOnlyData", label: "Local-only data", section: "data" },
  { behavior: "static", id: "legalSafety", label: "Legal safety", section: "data" },
  { behavior: "destructive", id: "clearLocalHistory", label: "Clear local history", section: "data" },
  { behavior: "static", id: "accountStatus", label: "Account status", section: "account" },
  { behavior: "static", id: "subscription", label: "Subscription", section: "account" },
  { behavior: "static", id: "helpFeedback", label: "Help and feedback", section: "account" },
];

export function buildShellSafetyModel(): ShellSafetyModel {
  return {
    gamifiedFields: [],
    homeRecommendationRoutes: HOME_RECOMMENDATIONS.flatMap((item) =>
      item.route ? [item.route] : [],
    ),
    primaryHomeRoute: HOME_PRIMARY_CTA.route,
    primaryPracticeRoute: PRACTICE_PRIMARY_CTA.route,
    practiceReviewRoute: PRACTICE_REVIEW_CTA.route,
    tabLabels: MAIN_TAB_ITEMS.map((item) => item.label),
  };
}
