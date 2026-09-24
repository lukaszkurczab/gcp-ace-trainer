# Owner preservation oracle

The oracle is a smoke-only, read-only check for the logical `legacy_owner` profile scope. Its public result is one of `unchanged`, `changed`, or `blocked`; it never returns keys, values, digests, salts, or profile identifiers.

When a smoke flow needs this check, call `ownerPreservationOracle.arm()` immediately before the operation that may select another profile. After the operation and any app restart, call `verify()`. The oracle reacquires the persisted `legacy_owner` scope from the storage router and exposes it only through a mutation-rejecting view. Always call `cleanup()` explicitly in the flow's finalization path. An `arm()` result of `unchanged` means the baseline was captured; a `verify()` result of `unchanged` means the owner scope matched that baseline. A `blocked` result means the check is unusable and must not be interpreted as preservation. The record expires after 15 minutes and is single-use; cleanup is required before another run.

Do not call this API with guest/account storage, and do not add writes, removals, or repair behavior to the legacy-owner scope. Metro includes the recording implementation only when `PATTERNLY_RUNTIME_MODE=smoke`; sandbox and release bundles resolve to an unavailable stub.
