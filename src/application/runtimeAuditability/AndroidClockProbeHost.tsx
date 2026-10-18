import { useEffect } from "react";
import { AppState, Linking } from "react-native";
import { parseAndroidClockProbeUrl } from "./androidClockProbeProtocol";
import { enabled, runId, receipt, captureAdvancing, captureAndroidClockProbeInventory } from "./androidClockProbeRuntime";
import { captureAndroidClockFixture, cleanupAndroidClockFixture, conflictAndroidClockFixture, enterAndroidClockFixture, pauseAndroidClockFixture, restoreAndroidClockFixture, seedAndroidClockFixture } from "./androidClockFixture";
import { androidClockProbeErrorCategory, waitForAndroidClockProbe, androidClockProbeFailure } from "./androidClockProbeReadiness";
import { captureActiveProfileStorageLease, inspectPreparedQ13StorageInventory } from "../../storage/repositories/profileStorageRepository";

let busy = false;
const consumedCases = new Set<string>();

export function AndroidClockProbeHost() {
  useEffect(() => {
    if (!enabled) return;
    void waitForAndroidClockProbe(() => {
      if (!captureActiveProfileStorageLease()) throw androidClockProbeFailure("probe_profile_unavailable");
      return true;
    }, 30_000).then(() => restoreAndroidClockFixture()).catch(error => receipt("fixture-cold.json", { stage: "fixture_cold_failed", category: androidClockProbeErrorCategory(error) }));
    const subscription = Linking.addEventListener("url", ({ url }) => {
      const command = parseAndroidClockProbeUrl(url, runId!);
      if (!command || busy || consumedCases.has(command.caseId)) return;
      consumedCases.add(command.caseId);
      busy = true;
      void (async () => {
        let effectStarted = false;
        try {
          await waitForAndroidClockProbe(() => {
            if (AppState.currentState !== "active") throw androidClockProbeFailure("probe_foreground_unavailable");
            return true;
          });
          const fixture = command.action.startsWith("fixture-");
          const stall = command.action === "stall" || command.action === "fixture-stall";
          let snapshot: object;
          if (command.action === "inventory") {
            const { packagePointerSources: _rawPointers, ...prepared } = await inspectPreparedQ13StorageInventory();
            snapshot = { inventory: captureAndroidClockProbeInventory(), prepared };
          } else if (command.action.startsWith("fixture-seed-")) {
            effectStarted = true;
            snapshot = await seedAndroidClockFixture(command.action.slice("fixture-seed-".length) as "countdown" | "cap" | "overrun" | "elapsed");
          } else if (["fixture-enter", "fixture-pause", "fixture-conflict", "fixture-cleanup"].includes(command.action)) {
            effectStarted = true;
            snapshot = command.action === "fixture-enter" ? enterAndroidClockFixture()
              : command.action === "fixture-pause" ? pauseAndroidClockFixture()
              : command.action === "fixture-conflict" ? conflictAndroidClockFixture() : cleanupAndroidClockFixture(command.caseId);
          } else snapshot = fixture ? await waitForAndroidClockProbe(captureAndroidClockFixture) : await captureAdvancing();
          if (command.action === "fixture-stall") {
            const state = snapshot as ReturnType<typeof captureAndroidClockFixture>;
            if (state.metrics.checkpointCount < 1 || (!state.running && (state.countdownMs === undefined || state.durableElapsedMs < state.countdownMs))) throw androidClockProbeFailure("fixture_not_running");
          }
          receipt(`${command.caseId}.json`, { stage: stall ? "stall_started" : "snapshot", ...snapshot });
          if (stall) {
            effectStarted = true;
            const end = performance.now() + 12_000;
            while (performance.now() < end) { /* Intentional JS-only interruption, private diagnostic APK only. */ }
            const stopped = fixture ? pauseAndroidClockFixture() : snapshot;
            receipt(`${command.caseId}.json`, { stage: "stall_completed_without_kill", ...stopped });
          }
        } catch (error) { receipt(`${command.caseId}.json`, { stage: effectStarted ? "probe_failed_after_effect" : "pre_effect_refused", category: androidClockProbeErrorCategory(error) }); }
        finally { busy = false; }
      })();
    });
    return () => subscription.remove();
  }, []);
  return null;
}
