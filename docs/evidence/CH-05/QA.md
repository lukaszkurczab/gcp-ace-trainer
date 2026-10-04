# CH-05 independent acceptance — PASS

2026-10-04; reviewer `gpt-6-luna`, high, separate from implementation. Objective and criteria: [briefing](BRIEFING.md). Controller inspected the actual final TAP log and source/diff, not only the worker report.

From `patternly-web`:

```sh
ADMIN_BEHAVIOR_PORT=25245 node --test ../patternly/docs/evidence/CH-05/independent-qa.test.mjs
node --test scripts/admin-config.test.mjs
git diff --check
```

Final mounted React suite: **55 tests, 55 passed, zero failed/cancelled/skipped** (70.323 seconds). Config: **3/3 PASS**. Syntax checks of helper, main test and independent test passed. Diff check clean. [Final TAP evidence](admin-browser-final.tap), [accepted-source SHA256 manifest](ACCEPTED-SOURCE-SHA256.json).

The imported main suite contains 52 tests, including the complete 33-variant CH-04 invalid-PATCH matrix, bounded reads/token/body, timer cleanup, no late-token fetch, uncertain legal/privacy/security writes, exact response matching, digest/double-click/account races, cross-admin latches, independent-resource controls and reachable manual security recovery. Three independently authored cases verify old privacy data cannot publish after UID change with abort-ignoring fetch; an export body released after incident revision change cannot create Blob/download; and a dispatched notification timeout at 12,001ms releases loading but a pending read still blocks resend and exposes reconciliation.

The first full attempt ran during implementation HMR and is not acceptance evidence. The subsequent frozen run was 53/55: the existing export-executor test asserted before its second PATCH, and the independent export test searched a collapsed revision-keyed disclosure. Narrow test corrections now await actual `start_review`/`execute_export` dispatch and reopen the disclosure; original product-result assertions remain. The complete final rerun passed. No production source was changed between these two frozen runs.

Before/after hashes were identical for the manifest selection and web HEAD stayed `592098cad36eb12a8b9c5426e1b2869c3d93a303`. No source HMR occurred after startup dependency optimization. Harness uses a temporary Vite cache, its own port and controlled legal/auth/HTTP artifacts; no public tree or content/demo generation was modified. Artifact moved from active to evidence at the same relative directory depth after acceptance, without changing test bytes.

Limits: controlled fetch/Firebase aliases establish actual mounted frontend behavior, not real Firebase SDK/Auth, backend services, SMTP or production readiness. Volatile latch and unresolved backend-read limits are explicit in [report](REPORT.md), linked to AUD-08 rather than hidden by retry. No mobile/device or service action performed.
