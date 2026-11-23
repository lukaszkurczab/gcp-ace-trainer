import { isPatternlyPerfBuild } from "../runtime/runtimeMode";

/**
 * Stage 0 of the J/B-full design (`Projekt-B-full.md` §6.1): sub-spans and
 * storage counters inside one `quiz_command`. Perf build with
 * `EXPO_PUBLIC_PATTERNLY_PERF_QUIZ_PROFILE=1` only; everywhere else every
 * helper is a direct call with no extra work.
 */
const ENABLED = process.env.EXPO_PUBLIC_PATTERNLY_PERF_QUIZ_PROFILE === "1" && isPatternlyPerfBuild();

/**
 * The trace emitter is installed by the command owner (which already depends
 * on the startup trace), so journal and storage code reach no trace module.
 */
type ProfileSink = Readonly<{ begin(stage: `quiz_seg:${string}`): () => void; mark(stage: `quiz_counter:${string}`): void }>;
let sink: ProfileSink | null = null;
export function installQuizCommandProfileSink(next: ProfileSink): void { if (ENABLED) sink = next; }

type Counters = { gets: number; chars: number; keyLists: number; sets: number; setChars: number; removes: number; getMs: number; setMs: number; maxSetMs: number; maxSetChars: number };
const emptyCounters = (): Counters => ({ gets: 0, chars: 0, keyLists: 0, sets: 0, setChars: 0, removes: 0, getMs: 0, setMs: 0, maxSetMs: 0, maxSetChars: 0 });
const now = (): number => (typeof globalThis.performance?.now === "function" ? globalThis.performance.now() : Date.now());
let active = 0;
let counters: Counters = emptyCounters();
/** T4.2: per key family (namespace stripped, first segment): [gets, chars, sets, setChars]. */
let families = new Map<string, [number, number, number, number]>();
function family(key: string): string {
  const parts = key.split(":");
  const start = parts[0] === "patternly" ? (parts[1] === "canonical" || parts[1] === "derived" ? 3 : 1) : 0;
  return `${parts.slice(0, start).join(".")}/${parts[start] ?? ""}`.replace(/[^a-zA-Z0-9_./-]/gu, "_");
}
function noteFamily(key: string | undefined, index: 0 | 2, chars: number): void {
  if (key === undefined) return;
  const name = family(key);
  const row = families.get(name) ?? [0, 0, 0, 0];
  row[index] += 1; row[index + 1] = (row[index + 1] ?? 0) + chars;
  families.set(name, row);
}
const completionListeners: (() => void)[] = [];

export function quizCommandProfileEnabled(): boolean { return ENABLED; }

/** Opens the counters of one command; the returned function emits them as one event. */
export function beginQuizCommandProfile(): () => void {
  if (!ENABLED || !sink) return () => undefined;
  active += 1;
  if (active === 1) { counters = emptyCounters(); families = new Map(); }
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    active -= 1;
    if (active === 0) {
      const c = counters;
      sink?.mark(`quiz_counter:gets=${c.gets}:chars=${c.chars}:keylists=${c.keyLists}:sets=${c.sets}:setchars=${c.setChars}:removes=${c.removes}:getms=${Math.round(c.getMs)}:setms=${Math.round(c.setMs)}:maxsetms=${Math.round(c.maxSetMs)}:maxsetchars=${c.maxSetChars}`);
      const top = [...families.entries()].sort((left, right) => (right[1][1] + right[1][3]) - (left[1][1] + left[1][3])).slice(0, 14);
      for (const [name, row] of top) sink?.mark(`quiz_counter:fam:${name}:gets=${row[0]}:chars=${row[1]}:sets=${row[2]}:setchars=${row[3]}`);
      for (const listener of completionListeners.splice(0)) { try { listener(); } catch { /* diagnostics only */ } }
    }
  };
}

/** Runs once after the next completed command (used by the storage microbenchmark). */
export function afterNextQuizCommand(listener: () => void): void { if (ENABLED) completionListeners.push(listener); }

/** One named sub-span of the current command (sync or async work). */
export function quizSegment<T>(name: string, work: () => T): T {
  if (!ENABLED || active === 0 || !sink) return work();
  const end = sink.begin(`quiz_seg:${name}`);
  let result: T;
  try { result = work(); } catch (error) { end(); throw error; }
  if (result instanceof Promise) result.then(end, end);
  else end();
  return result;
}

export function noteProfiledStorageRead(raw: string | undefined, key?: string): void {
  if (active === 0) return;
  noteFamily(key, 0, raw?.length ?? 0);
  counters.gets += 1;
  counters.chars += raw?.length ?? 0;
}
export function noteProfiledStorageKeyList(): void { if (active > 0) counters.keyLists += 1; }
export function noteProfiledStorageWrite(value: string | undefined, key?: string): void {
  if (active === 0) return;
  noteFamily(key, 2, value?.length ?? 0);
  if (value === undefined) counters.removes += 1;
  else { counters.sets += 1; counters.setChars += value.length; }
}

/** T4.2: time spent inside the storage call itself (the profiled wrapper calls these around it). */
export function profiledStorageClock(): number { return active > 0 ? now() : 0; }
export function noteProfiledStorageReadTime(startedAt: number): void { if (active > 0 && startedAt > 0) counters.getMs += now() - startedAt; }
export function noteProfiledStorageWriteTime(startedAt: number, value: string | undefined): void {
  if (active === 0 || startedAt <= 0) return;
  const elapsed = now() - startedAt;
  counters.setMs += elapsed;
  if (elapsed > counters.maxSetMs) { counters.maxSetMs = elapsed; counters.maxSetChars = value?.length ?? 0; }
}
