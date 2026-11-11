/**
 * Release perf-build trace sink (Plan T0.1). Events are buffered in RAM and
 * appended in batches to `<documentDirectory>/perf-trace/<launchId>.jsonl`
 * after `setTimeout(0)` and when the app goes to the background. The host reads
 * the file through `xcrun simctl get_app_container … data`.
 *
 * Only `startupTrace.ts` loads this module, and only behind the compile-time
 * perf flag, so other bundles do not contain it. Write failures are ignored:
 * diagnostics must never change the measured operation.
 */
export type StartupTraceSinkEvent = Readonly<{ stage: string; edge: "begin" | "end" | "event"; atMs: number; epochMs: number; span?: number }>;

export type StartupTraceSinkPorts = Readonly<{
  /** Appends text to the launch file, creating it when needed. May throw. */
  append: (text: string) => void;
  schedule: (flush: () => void) => void;
  onBackground: (flush: () => void) => void;
}>;

export type StartupTraceSink = Readonly<{ push: (event: StartupTraceSinkEvent) => void; flush: () => void }>;

export const PERF_TRACE_DIRECTORY = "perf-trace";
/** Bounds RAM when writes keep failing; the harness reports a short trace as missing markers. */
export const MAX_PENDING_TRACE_LINES = 10_000;

export function createStartupTraceSink(ports: StartupTraceSinkPorts): StartupTraceSink {
  let pending: string[] = [];
  let scheduled = false;
  const flush = () => {
    scheduled = false;
    if (pending.length === 0) return;
    const batch = pending;
    pending = [];
    try { ports.append(batch.join("")); } catch { /* A lost batch only shortens the trace. */ }
  };
  try { ports.onBackground(flush); } catch { /* Background flush is best effort. */ }
  return Object.freeze({
    push(event: StartupTraceSinkEvent) {
      if (pending.length >= MAX_PENDING_TRACE_LINES) return;
      pending.push(`${JSON.stringify({ stage: event.stage, edge: event.edge, atMs: event.atMs, epochMs: event.epochMs, ...(event.span === undefined ? {} : { span: event.span }) })}\n`);
      if (scheduled) return;
      scheduled = true;
      try { ports.schedule(flush); } catch { scheduled = false; }
    },
    flush,
  });
}

export function createLaunchId(now: number = Date.now(), random: () => number = Math.random): string {
  return `${now}-${Math.floor(random() * 0x1000000).toString(16).padStart(6, "0")}`;
}

/** expo-file-system and AppState are loaded lazily, on the first write or at creation. */
export function createExpoStartupTraceSink(launchId: string = createLaunchId()): StartupTraceSink {
  let file: { exists: boolean; create: () => void; write: (text: string, options: { append: boolean }) => void } | null = null;
  return createStartupTraceSink({
    append(text) {
      if (!file) {
        const { Directory, File, Paths } = require("expo-file-system") as typeof import("expo-file-system");
        const directory = new Directory(Paths.document, PERF_TRACE_DIRECTORY);
        directory.create({ intermediates: true, idempotent: true });
        file = new File(directory, `${launchId}.jsonl`);
      }
      if (!file.exists) file.create();
      file.write(text, { append: true });
    },
    schedule: (flush) => { setTimeout(flush, 0); },
    onBackground(flush) {
      const { AppState } = require("react-native") as typeof import("react-native");
      AppState.addEventListener("change", (state) => { if (state === "background") flush(); });
    },
  });
}
