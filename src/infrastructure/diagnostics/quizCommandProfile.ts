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

type Counters = { gets: number; chars: number; keyLists: number; sets: number; setChars: number; removes: number };
let active = 0;
let counters: Counters = { gets: 0, chars: 0, keyLists: 0, sets: 0, setChars: 0, removes: 0 };
const completionListeners: (() => void)[] = [];

export function quizCommandProfileEnabled(): boolean { return ENABLED; }

/** Opens the counters of one command; the returned function emits them as one event. */
export function beginQuizCommandProfile(): () => void {
  if (!ENABLED || !sink) return () => undefined;
  active += 1;
  if (active === 1) counters = { gets: 0, chars: 0, keyLists: 0, sets: 0, setChars: 0, removes: 0 };
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    active -= 1;
    if (active === 0) {
      const c = counters;
      sink?.mark(`quiz_counter:gets=${c.gets}:chars=${c.chars}:keylists=${c.keyLists}:sets=${c.sets}:setchars=${c.setChars}:removes=${c.removes}`);
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

export function noteProfiledStorageRead(raw: string | undefined): void {
  if (active === 0) return;
  counters.gets += 1;
  counters.chars += raw?.length ?? 0;
}
export function noteProfiledStorageKeyList(): void { if (active > 0) counters.keyLists += 1; }
export function noteProfiledStorageWrite(value: string | undefined): void {
  if (active === 0) return;
  if (value === undefined) counters.removes += 1;
  else { counters.sets += 1; counters.setChars += value.length; }
}
