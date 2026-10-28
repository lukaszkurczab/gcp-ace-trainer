/** Only known useful descriptions cross the F01 learner boundary. Technical reasons stay diagnostic. */
const PREMIUM_FAILURE_COPY = [
  "This app version can't read the saved Premium package format. The data was left in place. Update Patternly to continue.",
  "Saved Premium content doesn't match this topic. The operation is blocked and the stored files were left in place.",
  "Patternly couldn't verify saved Premium content on this device. The operation is blocked and the stored files were left in place.",
  "Patternly couldn't confirm the saved Premium content state. This operation is blocked; try again later.",
  "Patternly couldn't read saved Premium content. Try again later.",
] as const;
export function startupFailureCopy(reason: unknown, fallback = "Application bootstrap failed."): string {
  return typeof reason === "string" && (PREMIUM_FAILURE_COPY as readonly string[]).includes(reason) ? reason : fallback;
}
