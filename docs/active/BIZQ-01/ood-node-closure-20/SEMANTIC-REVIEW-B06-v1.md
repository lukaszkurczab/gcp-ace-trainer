# Independent semantic review: OOD-N04-B06 v1

**Verdict: REVISE, one item.** Frozen input: proposal `review-inputs/v1/OOD-N04-B06.json`, SHA-256 `05cbc330e667a73e263962ca95122746b77f464b0fbbc3fd12a36768763c6c2c`; notes `review-inputs/v1/OOD-N04-B06-notes.json`, SHA-256 `33cf9c69a9ca472ae4c7f4e22d8f09eb3d29e7225237adb77f747ceadc14e3d0`. I read all 18 full question objects: prompt, options, keyed answer, Reason, Details and each wrong-option message. The primary objective is to select a focused extension/callback/registration contract that keeps the state owner and the case's stated failure, scope or lifecycle behavior.

## Item findings

| Item | Verdict | Evidence |
|---|---|---|
| i019 | REVISE | The prompt says tenants independently select published policy versions and leaves the assignment owner to apply/check swaps. It does not rule out one process-wide singleton that dispatches by tenant and selected version. Alt3 only says one singleton is shared, yet its message claims it cannot safely represent the two tenants. That alternative can satisfy the visible facts; the key is not uniquely supported under §4.1. Narrow alt3 to a single unversioned policy with no tenant/version dispatch, or state a concrete visible limitation that excludes tenant-aware singleton dispatch. No general singleton ban is justified. |
| i020 | PASS | The plug-in must return geometry and all conflicts; the aggregate alone accepts and unresolved conflicts require user choice. The proposal/result contract follows directly. |
| i021 | PASS | A calculator returns a proposal from a legal snapshot, and the command rechecks current state before applying; direct mutation conflicts with the stated boundary. |
| i022 | PASS | Tenant and configured carrier ID are both explicit lookup dimensions; a carrier-name-only registration is insufficient. |
| i023 | PASS | Allocation plan is needed by the ledger's exclusive atomic balance check/commit; boolean or direct writes fail the visible contract. |
| i024 | PASS | The prompt explicitly requires old in-flight calls to finish on their captured handler and new calls to use the replacement. Construct-then-swap meets it and avoids a construction-failure gap. |
| i025 | PASS | Purchase channel, receipt date and policy version select refund logic; inspection condition remains a distinct earlier result. |
| i026 | PASS | The exporter must use the immutable published snapshot and requested format, not reread mutable workspace state. |
| i027 | PASS | Persistence already determines comment acceptance; provider failure must be reported separately and cannot reject the accepted comment. |
| i028 | PASS | The adapter seam preserves the same inspection ID and the two stated results (`Complete`/`Retryable`) across retries and adapter replacement. |
| i029 | PASS | Account configuration selects the provider; the same rejected-invoice identity is sent and a receipt precedes ledger marking. |
| i030 | PASS | Explicit listener order and failure-blocks-grant conditions require ordered completion before access is granted. |
| i031 | PASS | The job captures approved shipment revision and scheme version at creation; retry-time latest lookup would change the stated job contract. |
| i032 | PASS | Tenant-specific policy is resolved before scheduler commit; visible missing-lookup behavior is unchanged state, with no fallback. |
| i033 | PASS | The controller observes maintenance mode and wraps every registered handler, so the guard belongs at the stable invocation boundary. |
| i034 | PASS | Source-version-specific converters return mapped and unmapped records; the library, not the converter, decides commit. |
| i035 | PASS | An export captures renderer and stable input for that invocation; registry removal affects later lookup, not work already in progress. |
| i036 | PASS | The target's acceptance of the case, rather than registration or a prior capability query, gates ownership transfer. |

The unit intentionally repeats the broader design principle of a focused extension behind stable ownership. Several pairs exercise adjacent but distinct decisions: i022 resolves a tenant-scoped implementation key, while i032 defines fail-closed behavior before a tenant-owned state change; i024 covers construction/publication and captured callbacks, while i035 also binds a stable input snapshot to an export invocation. I did not treat repeated use of extension vocabulary as a defect. The v1 blocker is narrower: i019's singleton distractor is compatible with the prompt as written.

The review applies the existing BIZQ §4.1 single-answer criterion and §4.3 plausible-alternative criterion. It does not establish producer/source admission, consumer readiness, native execution or whole BIZQ-01 closure.
