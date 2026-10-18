import { useEffect, useRef } from "react";
import { AppState, Linking } from "react-native";
import { isAndroidClockPreparedRequest, parseAndroidClockProbeUrl } from "./androidClockProbeProtocol";
import { enabled, runId, receipt, captureAdvancing, captureAndroidClockProbeInventory, observeAndroidClockProbeProfileReady, prepareAndroidClockProbeStall, capturePreparedAndroidClockProbeStall, captureAndroidClockFaultPreservation } from "./androidClockProbeRuntime";
import { faultAndroidClockFixture, captureAndroidClockFixture, cleanupAndroidClockFixture, conflictAndroidClockFixture, enterAndroidClockFixture, pauseAndroidClockFixture, restoreAndroidClockFixture, seedAndroidClockFixture } from "./androidClockFixture";
import { PREPARED_STALL_TTL_MS, androidClockProbeErrorCategory, waitForAndroidClockProbe, androidClockProbeFailure } from "./androidClockProbeReadiness";
import { captureActiveProfileStorageLease, inspectPreparedQ13StorageInventory, onKeyValueStorageReady } from "../../storage/repositories/profileStorageRepository";
import { captureAndroidClockAccountProbe } from "./androidClockAccountProbe";
import { usePatternlyAccount } from "../account/AccountSessionProvider";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { readStartupTrace } from "../../infrastructure/diagnostics/startupTrace";

let busy = false;
const consumedCases = new Set<string>();

export function AndroidClockProbeHost() {
  const account = usePatternlyAccount();
  const accountRef = useRef(account);
  accountRef.current = account;
  useEffect(() => {
    if (!enabled) return;
    // The initial account profile may not be active at mount. This callback is
    // synchronous inside notifyProfileStorageReady, before account bootstrap
    // publishes profilePreparing and mounts the content/lifecycle gate.
    const unsubscribeReady = onKeyValueStorageReady(observeAndroidClockProbeProfileReady);
    void waitForAndroidClockProbe(() => {
      if (!captureActiveProfileStorageLease()) throw androidClockProbeFailure("probe_profile_unavailable");
      return true;
    }, 30_000).then(() => restoreAndroidClockFixture()).catch(error => receipt("fixture-cold.json", { stage: "fixture_cold_failed", category: androidClockProbeErrorCategory(error) }));
    let stopRequestWatch = () => {};
    const watchPreparedRequest = (caseId: string) => {
      stopRequestWatch();
      const { File, Paths } = require("expo-file-system") as typeof import("expo-file-system");
      const file = new File(Paths.document, `android-clock-probe-${runId}`, "stall-request.json");
      const refuse = (category: string) => {
        stopRequestWatch();
        try { receipt(`${caseId}.json`, { stage: "pre_effect_refused", category }); } catch { /* diagnostic only */ }
      };
      const interval = setInterval(() => {
        try {
          if (!file.exists) return;
          if (!isAndroidClockPreparedRequest(JSON.parse(file.textSync()), runId!, caseId)) { refuse("probe_request_invalid"); return; }
          stopRequestWatch();
          file.delete();
          if (file.exists) { refuse("probe_request_delete_failed"); return; }
          handleCommand({ caseId, action: "stall" });
        } catch { refuse("probe_request_io_failed"); }
      }, 50);
      const timeout = setTimeout(() => refuse("probe_preparation_expired"), PREPARED_STALL_TTL_MS);
      const lifecycle = AppState.addEventListener("change", state => { if (state !== "active") refuse("probe_foreground_unavailable"); });
      stopRequestWatch = () => { clearInterval(interval); clearTimeout(timeout); lifecycle.remove(); };
    };
    const handleCommand = (command: NonNullable<ReturnType<typeof parseAndroidClockProbeUrl>>) => {
      const consumptionKey = command && `${command.caseId}:${command.action === "prepare-stall" ? "prepare" : "effect"}`;
      if (!command || !consumptionKey || busy || consumedCases.has(consumptionKey)) return;
      consumedCases.add(consumptionKey);
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
            const accountProbe = await captureAndroidClockAccountProbe();
            const state = accountRef.current.state;
            const data = "accountData" in state ? state.accountData : null;
            snapshot = { inventory: captureAndroidClockProbeInventory(), prepared, accountProbe, accountRuntime: {
              kind: state.kind, status: data?.status ?? null, activeSessionBlocked: data?.activeSessionBlocked ?? null,
              failureSha256: data?.lastFailureCode ? sha256Utf8(data.lastFailureCode) : null,
              conflictSha256: data?.blockingConflictCode ? sha256Utf8(data.blockingConflictCode) : null,
            } };
          } else if (command.action.startsWith("fixture-seed-")) {
            snapshot = await seedAndroidClockFixture(command.action.slice("fixture-seed-".length) as "countdown" | "cap" | "overrun" | "elapsed", () => { effectStarted = true; });
          } else if (command.action.startsWith("fixture-fault-")) {
            const preservation = await captureAndroidClockFaultPreservation();
            effectStarted = true;
            // The actual fault and its original-SDK T digest remain synchronous.
            snapshot = { ...faultAndroidClockFixture(command.action.slice("fixture-fault-".length)), preservationBinding: preservation.preservationBinding };
          } else if (["fixture-enter", "fixture-pause", "fixture-conflict", "fixture-cleanup"].includes(command.action)) {
            effectStarted = true;
            snapshot = command.action === "fixture-enter" ? enterAndroidClockFixture()
              : command.action === "fixture-pause" ? pauseAndroidClockFixture()
              : command.action === "fixture-conflict" ? conflictAndroidClockFixture() : cleanupAndroidClockFixture(command.caseId);
          } else if (command.action === "prepare-stall") snapshot = await prepareAndroidClockProbeStall(command.caseId);
          else if (command.action === "stall") snapshot = capturePreparedAndroidClockProbeStall(command.caseId);
          else snapshot = fixture ? await waitForAndroidClockProbe(captureAndroidClockFixture) : await captureAdvancing();
          if (command.action === "fixture-stall") {
            const state = snapshot as ReturnType<typeof captureAndroidClockFixture>;
            if (state.metrics.checkpointCount < 1 || (!state.running && (state.countdownMs === undefined || state.durableElapsedMs < state.countdownMs))) throw androidClockProbeFailure("fixture_not_running");
          }
          const receiptName = command.action === "prepare-stall" ? `${command.caseId}-prepared.json` : `${command.caseId}.json`;
          receipt(receiptName, { stage: command.action === "prepare-stall" ? "prepared" : stall ? "stall_started" : "snapshot", ...snapshot });
          if (command.action === "prepare-stall") watchPreparedRequest(command.caseId);
          if (stall) {
            effectStarted = true;
            const end = performance.now() + 12_000;
            while (performance.now() < end) { /* Intentional JS-only interruption, private diagnostic APK only. */ }
            const stopped = fixture ? pauseAndroidClockFixture() : snapshot;
            receipt(`${command.caseId}.json`, { stage: "stall_completed_without_kill", ...stopped });
          }
        } catch (error) { receipt(command.action === "prepare-stall" ? `${command.caseId}-prepared.json` : `${command.caseId}.json`, { stage: effectStarted ? "probe_failed_after_effect" : "pre_effect_refused", category: androidClockProbeErrorCategory(error), ...(command.action === "inventory" ? { startupTrace: readStartupTrace() } : {}) }); }
        finally { busy = false; }
      })();
    };
    const subscription = Linking.addEventListener("url", ({ url }) => {
      const command = parseAndroidClockProbeUrl(url, runId!);
      if (command) handleCommand(command);
    });
    return () => { stopRequestWatch(); unsubscribeReady(); subscription.remove(); };
  }, []);
  return null;
}
