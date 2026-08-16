export type ServerEnvironment = Readonly<{
  appCheckAppIds: readonly string[];
  appCheckMode: "debug" | "production";
  apiOrigin: string;
  environment: "sandbox" | "production";
  firebaseProjectId: "patternly-app-sandbox" | "patternly-app-production";
  port: number;
  schedulerAudience: string;
  schedulerEmail: string;
  schedulerSubject: string;
}>;

const expectedProject = (environment: ServerEnvironment["environment"]): ServerEnvironment["firebaseProjectId"] =>
  environment === "sandbox" ? "patternly-app-sandbox" : "patternly-app-production";

const requireValue = (source: NodeJS.ProcessEnv, name: string): string => {
  const value = source[name];
  if (value === undefined || value.trim() === "" || /[<>]|placeholder|change[-_ ]?me/iu.test(value)) {
    throw new Error(`invalid_environment:${name}`);
  }
  return value;
};

const exactHttpsOrigin = (value: string, name: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`invalid_environment:${name}`);
  }
  if (parsed.protocol !== "https:" || parsed.origin !== value || parsed.username || parsed.password) {
    throw new Error(`invalid_environment:${name}`);
  }
  return value;
};

const appCheckAppIds = (value: string): readonly string[] => {
  const ids = value.split(",").map((entry) => entry.trim());
  if (ids.length === 0 || ids.some((entry) => !/^[A-Za-z0-9:_-]{1,256}$/u.test(entry))) {
    throw new Error("invalid_environment:PATTERNLY_APPCHECK_APP_IDS");
  }
  const unique = new Set(ids);
  if (unique.size !== ids.length) throw new Error("invalid_environment:PATTERNLY_APPCHECK_APP_IDS");
  return ids;
};

export function loadServerEnvironment(source: NodeJS.ProcessEnv): ServerEnvironment {
  if (source.GOOGLE_APPLICATION_CREDENTIALS !== undefined) {
    throw new Error("service_account_key_path_prohibited");
  }
  const environmentValue = requireValue(source, "PATTERNLY_ENVIRONMENT");
  if (environmentValue !== "sandbox" && environmentValue !== "production") {
    throw new Error("invalid_environment:PATTERNLY_ENVIRONMENT");
  }
  const environment = environmentValue;
  const appCheckMode = requireValue(source, "PATTERNLY_APPCHECK_MODE");
  if (appCheckMode !== "debug" && appCheckMode !== "production") {
    throw new Error("invalid_environment:PATTERNLY_APPCHECK_MODE");
  }
  if (environment === "production" && appCheckMode !== "production") {
    throw new Error("production_app_check_debug_prohibited");
  }
  const configuredAppCheckIds = appCheckAppIds(requireValue(source, "PATTERNLY_APPCHECK_APP_IDS"));
  const firebaseProjectId = requireValue(source, "FIREBASE_PROJECT_ID");
  if (firebaseProjectId !== expectedProject(environment)) throw new Error("cross_environment_project");

  const runningOnCloudRun = typeof source.K_SERVICE === "string" && source.K_SERVICE !== "";
  if (!runningOnCloudRun) {
    const authEmulator = source.FIREBASE_AUTH_EMULATOR_HOST;
    const firestoreEmulator = source.FIRESTORE_EMULATOR_HOST;
    if (!/^127\.0\.0\.1:\d+$/u.test(authEmulator ?? "") || !/^127\.0\.0\.1:\d+$/u.test(firestoreEmulator ?? "")) {
      throw new Error("local_runtime_requires_declared_firebase_emulators");
    }
  }

  const portValue = source.PORT ?? "8080";
  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("invalid_environment:PORT");
  const apiOrigin = exactHttpsOrigin(requireValue(source, "PATTERNLY_API_ORIGIN"), "PATTERNLY_API_ORIGIN");
  const schedulerAudience = exactHttpsOrigin(requireValue(source, "PATTERNLY_SCHEDULER_AUDIENCE"), "PATTERNLY_SCHEDULER_AUDIENCE");
  if (schedulerAudience !== apiOrigin) throw new Error("scheduler_audience_mismatch");
  const schedulerEmail = requireValue(source, "PATTERNLY_SCHEDULER_EMAIL");
  const expectedSchedulerEmail = `patternly-scheduler@${firebaseProjectId}.iam.gserviceaccount.com`;
  if (schedulerEmail !== expectedSchedulerEmail) throw new Error("scheduler_email_mismatch");
  const schedulerSubject = requireValue(source, "PATTERNLY_SCHEDULER_SUBJECT");
  if (!/^\d{10,30}$/u.test(schedulerSubject)) throw new Error("invalid_scheduler_subject");

  return {
    apiOrigin,
    appCheckAppIds: configuredAppCheckIds,
    appCheckMode,
    environment,
    firebaseProjectId,
    port,
    schedulerAudience,
    schedulerEmail,
    schedulerSubject,
  };
}
