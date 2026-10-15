/** A revoke ID embeds first-use time; retries must reuse the persisted ID. */
export function createSessionRevocationOperationId(issuedAt = Date.now()): string {
  if (!Number.isSafeInteger(issuedAt) || issuedAt < 0 || issuedAt > 0xffffffffffff) throw new Error("secure_operation_id_unavailable");
  let random: string;
  if (typeof globalThis.crypto?.randomUUID === "function") random = globalThis.crypto.randomUUID();
  else {
    try {
      const crypto = require("expo-crypto") as typeof import("expo-crypto");
      random = crypto.randomUUID();
    } catch { throw new Error("secure_operation_id_unavailable"); }
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(random)) throw new Error("secure_operation_id_unavailable");
  const time = issuedAt.toString(16).padStart(12, "0");
  // Preserve 74 cryptographically random bits, the RFC variant and no PII.
  return `${time.slice(0, 8)}-${time.slice(8)}-7${random.slice(15)}`;
}
