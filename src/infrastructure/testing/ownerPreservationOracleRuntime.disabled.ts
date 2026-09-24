import type { OwnerPreservationOracle } from "../../application/testing/ownerPreservationOracle";

/** Non-smoke builds cannot capture or persist owner-scope observations. */
export const ownerPreservationOracleRuntime: OwnerPreservationOracle = Object.freeze({
  async arm() { return "blocked" as const; },
  async verify() { return "blocked" as const; },
  async cleanup() { return "blocked" as const; },
});
