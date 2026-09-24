import { ownerPreservationOracleRuntime } from "../../infrastructure/testing/ownerPreservationOracleRuntime";

export type OwnerPreservationOracleResult = "unchanged" | "changed" | "blocked";

/**
 * Smoke-only, read-only check of the logical legacy-owner storage scope.
 * Call arm immediately before the operation under test, verify after the
 * operation or an app restart, and cleanup explicitly at the end of the flow.
 */
export type OwnerPreservationOracle = Readonly<{
  arm(): Promise<OwnerPreservationOracleResult>;
  verify(): Promise<OwnerPreservationOracleResult>;
  cleanup(): Promise<OwnerPreservationOracleResult>;
}>;

export const ownerPreservationOracle: OwnerPreservationOracle = ownerPreservationOracleRuntime;
