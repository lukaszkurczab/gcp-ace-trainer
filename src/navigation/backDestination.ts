import { ROUTES } from "../constants/routes";

export type BackDestinationTranslation = Readonly<{
  key: string;
  namespace: "common" | "account" | "settings" | "data" | "legal" | "learningPlan";
}>;

export type BackDestinationRoute = Readonly<{
  name: string;
  params?: unknown;
}>;

const fixedDestinations: Readonly<Record<string, BackDestinationTranslation>> = {
  [ROUTES.ACTIVITY]: { namespace: "common", key: "Activity" },
  [ROUTES.APPEARANCE_SETTINGS]: { namespace: "common", key: "Appearance" },
  [ROUTES.LANGUAGE_SETTINGS]: { namespace: "common", key: "Language" },
  [ROUTES.LEGAL_INFORMATION]: { namespace: "common", key: "Legal information" },
  [ROUTES.PREMIUM_PURCHASE]: { namespace: "common", key: "Premium" },
  [ROUTES.NOTIFICATION_SETTINGS]: { namespace: "common", key: "Reminders" },
  [ROUTES.YOUR_DATA]: { namespace: "common", key: "Your data" },
  [ROUTES.PRIVACY_REQUESTS]: { namespace: "data", key: "privacyRequests.title" },
  [ROUTES.ACCOUNT_EMAIL_CHANGE_PENDING]: { namespace: "settings", key: "emailChangePendingTitle" },
  [ROUTES.BACKEND_DIAGNOSTICS]: { namespace: "settings", key: "backendDiagnostics" },
  [ROUTES.SELECT_TRACK]: { namespace: "common", key: "Choose a track" },
  [ROUTES.GOAL_CADENCE]: { namespace: "common", key: "Goal" },
  [ROUTES.LEARNING_PLAN_PROPOSAL]: { namespace: "learningPlan", key: "Learning plan" },
  [ROUTES.LEARNING_PLAN_EDITOR]: { namespace: "learningPlan", key: "Learning plan" },
  [ROUTES.PRACTICE_HUB]: { namespace: "common", key: "Practice" },
  [ROUTES.ALGORITHMS_SCOPE_SELECTION]: { namespace: "common", key: "Choose practice scope" },
  [ROUTES.TOPIC_ROADMAP]: { namespace: "common", key: "Choose topic" },
  [ROUTES.EXAM]: { namespace: "common", key: "Exam" },
  [ROUTES.EXAM_REVIEW]: { namespace: "common", key: "Exam Review" },
  [ROUTES.RESULT]: { namespace: "common", key: "Result" },
  [ROUTES.PRACTICE_SETUP]: { namespace: "common", key: "Practice setup" },
  [ROUTES.PRACTICE_SESSION]: { namespace: "common", key: "Practice Session" },
  [ROUTES.ALGORITHMS_PRACTICE_REVIEW]: { namespace: "common", key: "Answer review" },
  [ROUTES.ALGORITHMS_PRACTICE_SUMMARY]: { namespace: "common", key: "Session result" },
  [ROUTES.ALGORITHMS_INTERVIEW_SIMULATION]: { namespace: "common", key: "Interview Simulation" },
  [ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY]: { namespace: "common", key: "Simulation result" },
  [ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_REVIEW]: { namespace: "common", key: "Simulation review" },
  [ROUTES.DESIGN_INTERVIEW_SIMULATION]: { namespace: "common", key: "Design Interview Simulation" },
  [ROUTES.DESIGN_INTERVIEW_SIMULATION_RESULT]: { namespace: "common", key: "Simulation result" },
  [ROUTES.DESIGN_INTERVIEW_SIMULATION_REVIEW]: { namespace: "common", key: "Simulation review" },
  [ROUTES.MISTAKES_REVIEW]: { namespace: "common", key: "Review Mistakes" },
  [ROUTES.TERMS_OF_SERVICE]: { namespace: "account", key: "termsOfService" },
  [ROUTES.PRIVACY_POLICY]: { namespace: "common", key: "Privacy Policy" },
};

const homeTabDestinations: Readonly<Record<string, BackDestinationTranslation>> = {
  home: { namespace: "common", key: "Today" },
  practice: { namespace: "common", key: "Practice" },
  progress: { namespace: "common", key: "Progress" },
  settings: { namespace: "common", key: "Settings" },
};

const accountSecurityDestinations: Readonly<Record<string, BackDestinationTranslation>> = {
  email: { namespace: "settings", key: "changeEmail" },
  password: { namespace: "settings", key: "changePassword" },
  delete: { namespace: "account", key: "deleteAccount" },
  export: { namespace: "settings", key: "exportAuthentication" },
  privacy: { namespace: "settings", key: "privacyAuthentication" },
};

const accountEntryDestinations: Readonly<Record<string, BackDestinationTranslation>> = {
  entry: { namespace: "account", key: "account" },
  register: { namespace: "account", key: "register" },
  signIn: { namespace: "account", key: "signIn" },
  recovery: { namespace: "account", key: "forgotPassword" },
  resetPassword: { namespace: "account", key: "reset" },
};

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
}

/** Returns the localized title of a route that is actually behind the current screen. */
export function getBackDestinationTranslation(route: BackDestinationRoute | null | undefined): BackDestinationTranslation | null {
  if (!route) return null;
  const params = record(route.params);

  if (route.name === ROUTES.HOME) {
    const tab = typeof params.initialTab === "string" ? params.initialTab : "home";
    return homeTabDestinations[tab] ?? null;
  }
  if (route.name === ROUTES.ACCOUNT_SECURITY) {
    const screen = typeof params.screen === "string" ? params.screen : "";
    return accountSecurityDestinations[screen] ?? null;
  }
  if (route.name === ROUTES.ACCOUNT_ENTRY) {
    const mode = typeof params.initialMode === "string" ? params.initialMode : "entry";
    return accountEntryDestinations[mode] ?? null;
  }
  if (route.name === ROUTES.LEGAL_REQUESTS) {
    const kind = typeof params.kind === "string" ? params.kind : "";
    if (!["complaint", "withdrawal", "data_recovery", "suspension_appeal"].includes(kind)) return null;
    return { namespace: "legal", key: `legalRequests.kinds.${kind}.title` };
  }
  return fixedDestinations[route.name] ?? null;
}

export function getPreviousRoute(routes: readonly BackDestinationRoute[], index: number): BackDestinationRoute | null {
  if (!Number.isInteger(index) || index < 1 || index >= routes.length) return null;
  return routes[index - 1] ?? null;
}
