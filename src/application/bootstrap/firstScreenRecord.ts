/**
 * T2.5 (D18 path (i)): the record the native first screen draws before React Native starts.
 *
 * One small JSON value holds a display-ready view model: localized strings, a few numbers and
 * action ids. It contains no learning records and no logic. Today writes it with the strings it
 * has just rendered (`HomeTab` → `HomeScreen`). The account entry writes it as `welcome` when
 * nobody is signed in. Native code only reads it (`native/first-screen`) and never writes it.
 *
 * Storage: the native sink keeps the value in the keychain (`com.lkurczab.patternly.first-screen`,
 * when-unlocked, this device only), not in MMKV. Opening the encrypted MMKV slot natively before
 * React Native would share MMKV's process-wide instance before NitroMmkv installs its
 * recover-on-error handler. MMKV's default CRC handling discards data, so that coupling is not
 * worth ~1 ms. See the design document §2.2.
 *
 * Freshness without a native revision hash: every write or removal of a Today input key in the
 * active profile store (`createProfileScopedStorage` → `noteProfileKeyWrite`) drops the record
 * before the write is visible. A present record therefore matches the store it was rendered from.
 * The input epoch stops a late render of older data from writing it back. The record also expires
 * at the next local midnight (`validUntilMs`), because the plan and due reviews are day-scoped.
 *
 * D23: an exact `schema` match is required, with no migration. A mismatch shows the neutral screen.
 */
import { setProfileKeyWriteObserver, setProfileRegistryCommitObserver } from "../../infrastructure/storage/profileStorageRouter";

export const FIRST_SCREEN_SCHEMA = 2 as const;
/** Upper bound for the serialized record; larger views are not written (the native screen stays neutral). */
export const FIRST_SCREEN_MAX_BYTES = 16 * 1024;

export type FirstScreenAppearance = "system" | "light" | "dark";
/** Ids the native screen queues on a tap; React Native maps them back to the Home handlers. */
export type FirstScreenActionId = "primary" | "secondary" | "change_track" | "open_practice_topic" | "open_activity"
  | "goal_set" | "goal_not_now" | "secondary_plan" | "open_tab:practice" | "open_tab:progress" | "open_tab:settings" | "sign_in" | "create_account" | "continue_guest";

export type FirstScreenButton = Readonly<{ label: string; action: FirstScreenActionId }>;
export type FirstScreenTodayView = Readonly<{
  title: string;
  track: Readonly<{ label: string; icon: string; change: FirstScreenButton }>;
  decision: Readonly<{
    icon: string;
    title: string;
    detail: string;
    primary: FirstScreenButton;
    enabled: boolean;
    muted: boolean;
    secondary: (FirstScreenButton & Readonly<{ chevron: boolean }>) | null;
  }>;
  secondaryPlan: Readonly<{ title: string; detail: string; button: FirstScreenButton }> | null;
  goalInvitation: Readonly<{ title: string; detail: string | null; primary: FirstScreenButton; notNow: FirstScreenButton }> | null;
  firstUse: Readonly<{ title: string; detail: string }> | null;
  overview: Readonly<{ label: string; rows: readonly Readonly<{ label: string; value: string }>[] }> | null;
  focus: Readonly<{ label: string; title: string; button: FirstScreenButton }> | null;
  activity: Readonly<{ label: string; title: string | null; empty: string; button: FirstScreenButton }> | null;
  tabs: readonly Readonly<{ id: string; label: string; icon: string }>[];
  /** Shown by the native screen when React Native is not ready 10 s after the first frame. */
  loading: string;
}>;
export type FirstScreenWelcomeView = Readonly<{
  brand: string;
  title: string;
  detail: string;
  signIn: FirstScreenButton;
  register: FirstScreenButton;
  guest: FirstScreenButton;
  loading: string;
}>;

type RecordBase = Readonly<{ schema: typeof FIRST_SCREEN_SCHEMA; locale: string; appearance: FirstScreenAppearance; capturedAt: string; validUntilMs: number }>;
export type FirstScreenTodayRecord = RecordBase & Readonly<{ kind: "today"; profileId: string; actor: string; revision: string; view: FirstScreenTodayView }>;
export type FirstScreenWelcomeRecord = RecordBase & Readonly<{ kind: "welcome"; view: FirstScreenWelcomeView }>;
export type FirstScreenRecord = FirstScreenTodayRecord | FirstScreenWelcomeRecord;

/** Native side of the record (the `PatternlyFirstScreen` Nitro object); null where the module is absent. */
export type FirstScreenSink = Readonly<{
  /** Stores the serialized record; returns false when it could not be stored. */
  write(json: string): boolean;
  /** Removes the record. Never throws. */
  clear(): void;
}>;

let sink: FirstScreenSink | null = null;
let inputKeyFilter: ((key: string) => boolean) | null = null;
let inputEpoch = 0;
// A record from the previous launch may be present: the first input write of this launch drops it.
let maybePresent = true;
let lastWritten: string | null = null;

export function setFirstScreenSink(next: FirstScreenSink | null): void {
  sink = next;
  maybePresent = true;
  lastWritten = null;
}

/**
 * Which profile keys are Today inputs (registered by the Home module). Until it is registered,
 * every profile write counts as an input write: dropping the record too often is safe.
 */
export function setFirstScreenInputKeyFilter(filter: ((key: string) => boolean) | null): void {
  inputKeyFilter = filter;
}

/** Called by the profile-scoped storage on every set/remove, before the write lands. */
export function noteProfileKeyWrite(key: string): void {
  if (inputKeyFilter && !inputKeyFilter(key)) return;
  inputEpoch += 1;
  if (maybePresent) clearFirstScreenRecord();
}

/** Captured with the Today read: a write is accepted only while no input changed since. */
export function captureFirstScreenInputEpoch(): number {
  return inputEpoch;
}

/** Next local midnight after `capturedAt` (the plan, due reviews and streaks are day-scoped). */
export function firstScreenValidUntil(capturedAt: string): number {
  const date = new Date(Date.parse(capturedAt));
  date.setHours(24, 0, 0, 0);
  return date.getTime();
}

export type FirstScreenWriteResult = "written" | "unchanged" | "stale" | "unavailable" | "too_large";

function store(record: FirstScreenRecord): FirstScreenWriteResult {
  if (!sink) return "unavailable";
  const json = JSON.stringify(record);
  if (json === lastWritten) return "unchanged";
  if (json.length > FIRST_SCREEN_MAX_BYTES) {
    clearFirstScreenRecord();
    return "too_large";
  }
  let ok = false;
  try { ok = sink.write(json); } catch { ok = false; }
  if (!ok) {
    clearFirstScreenRecord();
    return "unavailable";
  }
  lastWritten = json;
  maybePresent = true;
  return "written";
}

export function writeFirstScreenToday(input: Readonly<{
  inputEpoch: number;
  profileId: string;
  actor: string;
  revision: string;
  capturedAt: string;
  locale: string;
  appearance: FirstScreenAppearance;
  view: FirstScreenTodayView;
}>): FirstScreenWriteResult {
  if (input.inputEpoch !== inputEpoch) return "stale";
  return store({
    schema: FIRST_SCREEN_SCHEMA,
    kind: "today",
    profileId: input.profileId,
    actor: input.actor,
    revision: input.revision,
    capturedAt: input.capturedAt,
    validUntilMs: firstScreenValidUntil(input.capturedAt),
    locale: input.locale,
    appearance: input.appearance,
    view: input.view,
  });
}

/** Signed-out entry. Valid for a week: it holds no user data and only changes with the language. */
export function writeFirstScreenWelcome(input: Readonly<{ capturedAt: string; locale: string; appearance: FirstScreenAppearance; view: FirstScreenWelcomeView }>): FirstScreenWriteResult {
  return store({
    schema: FIRST_SCREEN_SCHEMA,
    kind: "welcome",
    capturedAt: input.capturedAt,
    validUntilMs: Date.parse(input.capturedAt) + 7 * 24 * 60 * 60 * 1000,
    locale: input.locale,
    appearance: input.appearance,
    view: input.view,
  });
}

/** Sign-out, deletion, history reset, actor change, profile registry commit, any input write. Never throws. */
export function clearFirstScreenRecord(): void {
  lastWritten = null;
  if (!sink) {
    maybePresent = true;
    return;
  }
  try {
    sink.clear();
    maybePresent = false;
  } catch {
    maybePresent = true;
  }
}

setProfileKeyWriteObserver(noteProfileKeyWrite);
setProfileRegistryCommitObserver(clearFirstScreenRecord);

/** Tests only. */
export function resetFirstScreenRecordForTests(): void {
  sink = null;
  inputKeyFilter = null;
  inputEpoch = 0;
  maybePresent = true;
  lastWritten = null;
}
