import { markStartup } from "../diagnostics/startupTrace";
import { afterNextQuizCommand, quizCommandProfileEnabled } from "../diagnostics/quizCommandProfile";
import { getKeyValueStorage } from "./mmkvClient";
import { openPerfBenchMmkv } from "./encryptedStorageNative";
import { STORAGE_KEYS } from "../../storage/keys";

/**
 * Stage 0 microbenchmark (perf build with the quiz profile only): cost of one
 * `getString` per value size on the encrypted profile store, on a temporary
 * plain MMKV and on a temporary AES-256 MMKV with the same bytes. Runs once per
 * launch, right after the first profiled quiz command, and removes its stores.
 */
let scheduled = false;
export function scheduleQuizStorageBench(): void {
  if (!quizCommandProfileEnabled() || scheduled) return;
  scheduled = true;
  afterNextQuizCommand(() => { try { runBench(); } catch (error) { markStartup(`quiz_bench:error:${String(error).slice(0, 80)}`); } });
}

const READS = 40;
function timeReads(read: () => string | undefined): Readonly<{ us: number; len: number }> {
  let len = 0;
  const started = globalThis.performance.now();
  for (let index = 0; index < READS; index += 1) len = read()?.length ?? 0;
  return { us: Math.round(((globalThis.performance.now() - started) * 1000) / READS), len };
}

function runBench(): void {
  const store = getKeyValueStorage();
  const indexRaw = store.getString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX);
  let firstAttemptKey: string | null = null;
  try {
    const ids = (JSON.parse(indexRaw ?? "null") as { payload?: unknown } | null)?.payload;
    if (Array.isArray(ids) && typeof ids[0] === "string") firstAttemptKey = STORAGE_KEYS.trainingAttempt(ids[0]);
  } catch { /* bench only */ }
  const samples: [string, string][] = [
    ["attempt_index", STORAGE_KEYS.TRAINING_ATTEMPT_INDEX],
    ["session_index", STORAGE_KEYS.TRAINING_SESSION_INDEX],
    ["account_sync", STORAGE_KEYS.ACCOUNT_SYNC],
    ...(firstAttemptKey ? [["attempt_record", firstAttemptKey] as [string, string]] : []),
  ];
  for (const [label, key] of samples) {
    const result = timeReads(() => store.getString(key));
    markStartup(`quiz_bench:profile:${label}:len=${result.len}:us=${result.us}`);
  }
  const keysStarted = globalThis.performance.now();
  let keyCount = 0;
  for (let index = 0; index < 10; index += 1) keyCount = store.getAllKeys().length;
  markStartup(`quiz_bench:profile:getAllKeys:n=${keyCount}:us=${Math.round(((globalThis.performance.now() - keysStarted) * 1000) / 10)}`);

  const values = samples.map(([label, key]) => [label, store.getString(key) ?? ""] as const).filter(([, value]) => value.length > 0);
  for (const variant of ["plain", "aes256"] as const) {
    const bench = openPerfBenchMmkv(`patternly-perf-bench-${variant}`, variant === "aes256");
    try {
      for (const [label, value] of values) {
        bench.set(label, value);
        const result = timeReads(() => bench.getString(label));
        markStartup(`quiz_bench:${variant}:${label}:len=${result.len}:us=${result.us}`);
      }
    } finally { bench.dispose(); }
  }
}
