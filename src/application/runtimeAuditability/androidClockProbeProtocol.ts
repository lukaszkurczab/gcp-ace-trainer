const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const ACTIONS = ["inventory", "snapshot", "stall", "fixture-seed-elapsed", "fixture-seed-countdown", "fixture-seed-cap", "fixture-seed-overrun", "fixture-enter", "fixture-pause", "fixture-snapshot", "fixture-stall", "fixture-conflict", "fixture-cleanup"] as const;
export type AndroidClockProbeAction = typeof ACTIONS[number];

export function androidClockProbeEnabled(runId: string | undefined, runtime: string | undefined, os: string): runId is string {
  return os === "android" && runtime === "sandbox" && UUID.test(runId ?? "");
}

export function parseAndroidClockProbeUrl(url: string, runId: string): Readonly<{ caseId: string; action: AndroidClockProbeAction }> | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/");
    if (parsed.protocol !== "com.lkurczab.patternly:" || parsed.hostname !== "android-clock-probe"
      || parsed.search || parsed.hash || parsed.username || parsed.password || parsed.port
      || parts.length !== 4 || parts[1] !== runId || !UUID.test(parts[2] ?? "")
      || !ACTIONS.includes(parts[3] as AndroidClockProbeAction)) return null;
    return { caseId: parts[2]!, action: parts[3] as AndroidClockProbeAction };
  } catch { return null; }
}
