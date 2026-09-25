export type PremiumRefreshResult = "verified" | "denied" | "pending";
export type PremiumSessionAdmissionResult = "allowed" | "denied" | "unavailable";

/** Cache access is valid only when reachability has explicitly confirmed offline. */
export async function resolvePremiumSessionAdmission(input: Readonly<{
  isConfirmedOffline: () => Promise<boolean>;
  hasOfflineAccess: () => boolean;
  refresh: () => Promise<PremiumRefreshResult>;
}>): Promise<PremiumSessionAdmissionResult> {
  let confirmedOffline = false;
  try { confirmedOffline = await input.isConfirmedOffline(); } catch { /* Unknown reachability takes the online path. */ }
  if (confirmedOffline) {
    try { return input.hasOfflineAccess() ? "allowed" : "denied"; }
    catch { return "denied"; }
  }

  try {
    const result = await input.refresh();
    if (result === "verified") return "allowed";
    if (result === "denied") return "denied";
  } catch { /* A failed current request is unavailable, never a cache grant. */ }
  return "unavailable";
}
