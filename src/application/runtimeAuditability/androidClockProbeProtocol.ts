const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const ACTIONS = ["inventory", "snapshot", "prepare-stall", "stall", "fixture-seed-elapsed", "fixture-seed-countdown", "fixture-seed-cap", "fixture-seed-overrun", "fixture-enter", "fixture-pause", "fixture-snapshot", "fixture-stall", "fixture-conflict", "fixture-cleanup", "fixture-fault-read", "fixture-fault-write-before", "fixture-fault-write-after", "fixture-fault-readback", "fixture-fault-backward"] as const;
export type AndroidClockProbeAction = typeof ACTIONS[number];

export { androidClockProbeEnabled } from "../../infrastructure/diagnostics/androidClockProbeGate";

export function isAndroidClockPreparedRequest(value: unknown, runId: string, caseId: string): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const request = value as Record<string, unknown>;
  return Object.keys(request).sort().join(",") === "caseId,protocol,runId"
    && request.protocol === "patternly.android-clock-probe.v1" && request.runId === runId && request.caseId === caseId
    && UUID.test(runId) && UUID.test(caseId);
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
