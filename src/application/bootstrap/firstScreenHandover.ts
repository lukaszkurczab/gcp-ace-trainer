/**
 * T2.5 stage 4: handover from the native first screen to React Native (design doc §3.2).
 *
 * - `installFirstScreenHandover` (RegularApplicationRoot) connects the record writer to the native keychain
 *   sink and makes sure the overlay always leaves: any startup surface that reaches the first usable frame
 *   without reporting itself (a gate's terminal surface, the 3 s fallback) reports `other`.
 * - Today reports `today` with the profile and revision it rendered, then takes the one tapped action:
 *   it runs only when profile and revision still equal the ones the overlay drew; otherwise the user sees
 *   "Today changed. Choose again." The signed-out entry reports `account` and runs a welcome action.
 */
import {
  createFirstScreenNativeSink,
  reportFirstScreenReady,
  takeFirstScreenPendingAction,
  type FirstScreenPendingAction,
} from "../../infrastructure/runtime/firstScreenNative";
import { setFirstScreenSink } from "./firstScreenRecord";
import { whenStartupFirstUsableFrame } from "./parallelBoot";

export const FIRST_SCREEN_TODAY_ACTIONS = Object.freeze([
  "primary", "secondary", "change_track", "open_practice_topic", "open_activity", "goal_set", "goal_not_now", "secondary_plan",
  "open_tab:practice", "open_tab:progress", "open_tab:settings",
] as const);
export type FirstScreenTodayAction = (typeof FIRST_SCREEN_TODAY_ACTIONS)[number];
export const FIRST_SCREEN_WELCOME_ACTIONS = Object.freeze(["sign_in", "create_account", "continue_guest"] as const);
export type FirstScreenWelcomeAction = (typeof FIRST_SCREEN_WELCOME_ACTIONS)[number];

let installed = false;

export function installFirstScreenHandover(): void {
  if (installed) return;
  installed = true;
  const sink = createFirstScreenNativeSink();
  if (sink) setFirstScreenSink(sink);
  void whenStartupFirstUsableFrame().promise.then(() => reportFirstScreenReady("other"));
}

export type FirstScreenTodayTake =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "run"; id: string; action: FirstScreenTodayAction }>
  | Readonly<{ kind: "stale"; id: string }>;

function isTodayAction(action: string): action is FirstScreenTodayAction {
  return (FIRST_SCREEN_TODAY_ACTIONS as readonly string[]).includes(action);
}

/** Decides a pending overlay tap against the Today that React Native has just rendered. Pure. */
export function decideFirstScreenTodayAction(pending: FirstScreenPendingAction | null, current: Readonly<{ profileId: string; revision: string }>): FirstScreenTodayTake {
  if (!pending) return { kind: "none" };
  if (!isTodayAction(pending.action) || pending.profileId !== current.profileId || pending.revision !== current.revision) return { kind: "stale", id: pending.id };
  return { kind: "run", id: pending.id, action: pending.action };
}

/** Today's first usable frame: report it, then take the tapped action (at most once per process). */
export function handOverFirstScreenToToday(current: Readonly<{ profileId: string; revision: string }>): FirstScreenTodayTake {
  reportFirstScreenReady("today", current);
  return decideFirstScreenTodayAction(takeFirstScreenPendingAction(), current);
}

/** The signed-out entry's first frame: report it and return a welcome action tapped on the overlay. */
export function handOverFirstScreenToAccount(): FirstScreenWelcomeAction | null {
  reportFirstScreenReady("account");
  const pending = takeFirstScreenPendingAction();
  return pending && (FIRST_SCREEN_WELCOME_ACTIONS as readonly string[]).includes(pending.action) ? pending.action as FirstScreenWelcomeAction : null;
}

/** Tests only. */
export function resetFirstScreenHandoverForTests(): void {
  installed = false;
}
