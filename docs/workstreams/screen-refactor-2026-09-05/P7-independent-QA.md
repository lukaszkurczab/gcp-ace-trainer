# P7 independent QA

Reviewer gpt-5.6-luna/max, read-only inspection. Initial verdict: targeted corrections required, no redesign. Consistency .86, simplicity .90, safety .81, maintainability .86, min .81. Independently executed focused53/53 and lifecycle26/26 PASS.

Accepted findings:
1. Provider sets signingOut before preparation; preparation can reject on initial ACCOUNT_SYNC read outside service try. runWithAuth failure does not restore authenticated state, leaving busy stuck. Normalize preparation exceptions into retryable failure while preserving identity-generation and binding guards; test failing storage and retry.
2. Settings synced status must also account for unresolved lastFailureCode/pending count/conflict, so signout failure does not appear healthy after tab remount.
3. VerificationPending and guestAccessBlocked require distinct truthful state copy, not sync/retry/signout promises.

Correction author: original P7 author, sole source writer. Root handles native/docs. No auth backend, data reset or real account action is authorized for verification. Authenticated native account remains unavailable; existing service tests, source wiring guards and presentation tests must be reported as such, not renderer execution.

Root additionally verified all language persistence options and storage write failure retaining previous choice then retry: appPreferences.test.ts 5/5. Native system/pl/en plus returning to Settings passed in 2026-09-05_121126; PNGs inspected in dark/max-text. Earlier native test attempts failed due retained scroll position and aggregated accessibility labels; corrected automation used actual screen/row accessibility contracts. These were not hidden as application passes.

## Final recheck
Independent gpt-5.6-luna/max PASS, no blockers. Scores .95/.90/.91/.88, min .88. Reviewer reran62/62 and verified generation+UID before restoration, both thrown/returned failure exit before auth.signOut, preserved binding mismatch, metadata attention and correct recovery precedence. Non-blocking maintenance observation: healthy-account predicate and its inverse live in the two presentation owners; future account metadata fields must update both. Accepted as local presentation policy, not another read owner or lifecycle implementation.
