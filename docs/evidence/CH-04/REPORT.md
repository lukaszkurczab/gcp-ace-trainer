# CH-04 — Privacy admin response validation

Status: locally accepted; independent QA PASS. Owner: parallel CH-04 thread, 2026-10-03.

## Outcome and original acceptance criteria

Canonical plan §8 CH-04: separate list/detail guards; reject inherited enum names, malformed dates/revision/channel/subjectVerified/extension or delivery state/reportSubmissionIds; explicit errors, stable UI and no actions from unverified details. Accept actual minimal list and full nullable backend details. Preserve wire schema, auth, domain actions and revision guards. No CH-05 deadlines, backend/service configuration or publication.

Scope: web src/components/PrivacyRequestsPanel.jsx and scripts/admin-behavior.test.mjs; own plan/state hunks only. Backend privacy contracts.ts, store.ts PrivacyRequestListItem/PrivacyRequestDetails/toListItem/readAdmin are read-only contract evidence. Separate guard replaces validItem; GET/PATCH also bind requestId to requested identity. Old selection is cleared when opening another response; invalid PATCH confirmation clears actions and requires explicit reload. No new transport or state machine.

## Independence and repository evidence

All four local HEAD/upstreams and actual origin HEAD aligned at start: app b1397183cd87008f5a623391bdb2f6c0d850466a, backend019e48e7d8e074c2e45d7f5ebb639a4ad394ae8f, contentfada384746dfdfeb3f3153e1ebdeddc9fea0a672, web2e178fc11a4cac220f75a8164c46f96a53e9c7c0. Branches main/main/master/main. Stashes app6/backend4/content2/web0 untouched. Existing app plan/state/native15 and OOD16 drafts, SECURITY audit and untracked content exhaustive audit preserved. Read current BIZQ thread and current local WORKING_STATE: owner is implementing OOD119 with shared source-proof/admission/consumer activation; historical thread details do not supersede current files. Coordination sent directly to authorized BIZQ thread01a0fc57-a149-7973-9d96-daf906142348.

CH-01 has priority within CH but mutates shared review tooling/evidence; CH-04 is the earliest selected web task without those shared resources and precedes CH-05. BIZQ-02 progress/Home/proposal requires same verified evidence/identity; BIZQ-03 planner depends02/04/05 and ARCH02/05; BIZQ04 review policy/source depends ARCH01/02 and persistence review/journal; BIZQ05 pinned descriptors/summary depends ARCH06/05. ARCH01 runtime, ARCH02 family start/terminal, ARCH04 interaction, ARCH05 evidence projection and PERSIST01–14 touch app lifecycle/storage, not the admin privacy read model. No ownership transferred.

No writes to source questions, contentVersion, candidate/readiness/admission, generated banks, app lock or web demo provenance. Browser tests use own localhost25214, temporary legal test artifact, controlled fetch/Firebase, real mounted React. No mobile, Metro, emulator, installed app or existing iPhone17 actions. Vite cache is isolated in the temporary test directory. Future content pushes can change webHEAD independently: stage only owned paths, compare before commit.

## Approach and preflight

Fit .95, simplicity .94, risk .88, maintainability .93; minimum .88. Separate guards in existing panel, closed enum membership, nonnegative safe revision, UTC dates matching producer, nullable fields per actual DTO; no invented domain transition semantics. Independent read-only design review gpt-6-luna/high PASS WITH GAPS before production code: .95/.91/.84/.90 minimum .84. Required omitted-field negatives, non-null positives and strict date roundtrip incorporated; isolated cache and distinct port retained.

Actual current-source VM probe: inherited right toString and status constructor accepted, numeric reportSubmissionIds accepted (true/true/true). Mounted Chrome controlled browser regression RED3/3: first invalid list/detail/PATCH payload does not produce required error. Earlier path error changed no file; initial accidental plain-node runner on25204 stopped only own confirmed PID69218. Sandbox Chromium failed Mach rendezvous (not product evidence); escalated local run on25214 actually executed assertions. No false PASS.

## Verification boundary

Browser table across list/detail/PATCH, valid minimal list/full nullable detail, valid statuses/channels/extension notices; no pageerror/no PATCH for invalid detail, one PATCH only before invalid confirmation. Full existing admin behavior suite, admin config checks; independent LunaHigh acceptance review. A controlled browser transport proves UI behavior against wire payloads, not real Firebase auth/Firestore/SMTP integration. No production build or real-provider claim is required by CH-04; no release claims.

## Root implementation and verification

Removed the weak validItem, replacing it with strict list and detail guards in the existing panel. Own-key enum membership rejects inherited names; all producer DTO fields are validated, nullable fields require explicit null or correct type. UTC ISO date shape and toISOString roundtrip reject normalized invalid calendars. GET/PATCH details bind requested request identity. Opening details clears the previous selection; invalid PATCH confirmation clears selected mutation controls, without replay or invented rollback.

Delivered test fixture adds the actual required extendedAt/extensionNoticeStatus null fields. Vite uses a unique temporary cache within its existing legal fixture directory, with explicit25214 root and25224 QA ports. Existing production app imports, auth, backend wire, domain actions, revision guard, content/demo/generated artifacts and dependencies remain unchanged. No obsolete helper references remain.

Root final command: ADMIN_BEHAVIOR_PORT=25214 node --test scripts/admin-behavior.test.mjs, Node24.21.0/headless Chromium existing Playwright installation:38 tests PASS,0FAIL,0SKIP. CH04 four table-driven browser tests and existing positive privacy export test passed. Matrix:16 invalid list variants;33 invalid detail/PATCH variants each, including omitted detail fields;8 valid minimal list/full nullable/non-null detail shapes across all8 statuses,7 rights,2 channels and5 extension notice values. No page errors; no PATCH from invalid details; one PATCH per invalid confirmation, then no mutation controls. Existing38 includes other admin/report/legal/security/auth regression paths. Root node --test scripts/admin-config.test.mjs:3PASS/0FAIL. git diff --check PASS.

Earlier partial post-code run4/5 had actual HMR source edit during detail loop (page reload/detached button), retained as failed evidence and superseded by the final stable-source full run. No claim that the first run passed. Full final log stored beside report. Independent acceptance gpt-6-luna/high PASS; own mounted-browser focused run on25224:5PASS/0FAIL/0SKIP, diff check clean. See QA.md.

## Documentation attribution

The CH audit/queue section was entirely uncommitted at starting appHEAD. Current working plan removes only CH04 row/contract and marks its CH05 dependency accepted, preserving all other audit/BIZQ rows. The staged canonical plan contains only the own accepted-receipt marker, because committing the whole new CH audit would include foreign work. State staging likewise adds only the CH04 paragraph to HEAD. All foreign working-tree documentation changes remain unstaged for their owner. Evidence moved from active/CH04 to evidence/CH04 at closure per canonical plan.
