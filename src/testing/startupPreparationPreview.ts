import { TARGET_LOCALES, type TargetLocale } from "../preferences/localeResolver";

export const STARTUP_PREVIEW_SCENES = [
  "profile-loading", "profile-unavailable", "content-opening-storage", "content-recovering-learning-state",
  "content-verifying-content", "content-resuming-session", "content-blocking", "active-unavailable",
  "active-confirm", "active-pending", "active-error", "account-restoring", "profile-transition-materialized",
  "profile-transition-retry", "recovery-base", "recovery-retry-limit", "recovery-removing", "recovery-error",
  "recovery-success", "ready-resume-denied", "ready-resume-unavailable",
] as const;
export type StartupPreviewScene = typeof STARTUP_PREVIEW_SCENES[number];
export type StartupPreviewParameters = Readonly<{ scene: StartupPreviewScene; locale: TargetLocale; theme: "light" | "dark" }>;
export type StartupPreviewEntry = Readonly<{ kind: "regular" | "preview" | "rejected" }>;
export function resolveStartupPreviewEntry(flag: unknown, development: boolean, runtimeMode: unknown, persistKind: string, perfKind: string): StartupPreviewEntry {
  if (flag === undefined) return { kind: "regular" };
  return { kind: flag === "1" && development && runtimeMode === "smoke" && persistKind === "regular" && perfKind === "regular" ? "preview" : "rejected" };
}
export function parseStartupPreviewUrl(url: unknown, enabled: boolean): StartupPreviewParameters | null {
  if (!enabled || typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "com.lkurczab.patternly:" || parsed.host !== "audit" || parsed.pathname !== "/startup-preview" || parsed.hash || parsed.username || parsed.password || parsed.port) return null;
    const keys = [...parsed.searchParams.keys()];
    if (keys.length !== 3 || new Set(keys).size !== 3 || keys.some(key => !["scene", "locale", "theme"].includes(key))) return null;
    const scene = parsed.searchParams.get("scene"), locale = parsed.searchParams.get("locale"), theme = parsed.searchParams.get("theme");
    if (!(STARTUP_PREVIEW_SCENES as readonly unknown[]).includes(scene) || !(TARGET_LOCALES as readonly unknown[]).includes(locale) || (theme !== "light" && theme !== "dark")) return null;
    return Object.freeze({ scene: scene as StartupPreviewScene, locale: locale as TargetLocale, theme });
  } catch { return null; }
}

/** Every request, including invalid input, supersedes pending language readiness. */
export function createStartupPreviewRequestFence() {
  let generation = 0;
  return Object.freeze({
    next: () => ++generation,
    isCurrent: (attempt: number) => attempt === generation,
    dispose: () => { generation++; },
    read: () => generation,
  });
}
