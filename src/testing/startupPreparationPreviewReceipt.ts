export const STARTUP_PREVIEW_ACTIONS = ["retry", "remove", "continue", "return", "removing-presented", "cancel", "confirm", "ask", "resume"] as const;
export type StartupPreviewAction = typeof STARTUP_PREVIEW_ACTIONS[number];
/** No handler injection, domain imports, scene transitions or storage writes. */
export function createStartupPreviewActions() {
  const counts = Object.fromEntries(STARTUP_PREVIEW_ACTIONS.map(key => [key, 0])) as Record<StartupPreviewAction, number>;
  const actions = Object.fromEntries(STARTUP_PREVIEW_ACTIONS.map(key => [key, () => { counts[key] = Math.min(999, counts[key] + 1); }])) as Record<StartupPreviewAction, () => void>;
  return Object.freeze({ actions: Object.freeze(actions), read: () => Object.freeze({ ...counts }) });
}
