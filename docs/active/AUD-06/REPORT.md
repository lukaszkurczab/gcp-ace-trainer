## Current canonical runner spawn-error cleanup — continuation 2026-10-01

Current backend canonical isolated runner was exercised with a deliberately absent private Firebase CLI executable twice serially, using fresh private temporary roots. Both attempts returned expected ENOENT before emulator startup, removed their temporary resources, and left all four isolated ports free. Independent Luna High QA repeated the probe twice and verified source/evidence/historical-controller hashes: PASS. No source changes or shared-fixture actions.

Evidence: `evidence/CANONICAL-SPAWN-ERROR-CLEANUP.json`. Historical private `/tmp` controllers retain their original known cleanup limitation and remain byte-identical historical evidence; all current v12c gates use the canonical runner with tested finally cleanup. This establishes the current runner's spawn-error path only. It does not establish the old controller's behavior, explain the non-reproduced historical HTTP500, or close native/AUD-06 acceptance.

# AUD-06 — partial local readiness inventory

**PARTIAL; SIM-READY not established.** Read-only Luna high inventory, root transcription, no app/device/provider runtime tests or accepted-task reruns. Independent no-tools briefing: fit .94, simplicity .90, risk .94, maintainability .91; minimum .90.

## Current evidence boundary

App main `8d12b0ccabf7b2c28659c78c10a7915abafb2672` and backend main `15e49d04dcf510cb7081b356a7182343d9d170ab` contain preserved unaccepted changes. Content master `0174e42fbe7634a54c1f5d87369063c7e01e8c7e` and web main `9585919b7d0c1a8396e6d255e49850e64e129d0e` are clean. These are inventory baselines, not a frozen release candidate.

## Verified source inventory

App `integration/contracts/content-release/release.lock.json` and content `reports/candidate-reconciliation/AWS-02-DRAFT/` release manifest contain nine identical track/version/checksum tuples. Locked producer commit 79060003 is an ancestor of current content HEAD; equality to current HEAD is not required. Tracks: AWS solutions architect associate; backend system design; Claude architect professional; coding DSA; frontend system design; Google cloud associate engineer; Azure administrator AZ-104; Azure AI fundamentals AI-901; object oriented design.

`src/i18n/i18n.ts` imports de/en/es/et/fr/it/pl, eight namespaces each (56 JSON files). Locale parity is covered by `src/i18n/i18nLocaleParity.test.ts`; source inventory alone is not a fresh runtime/parity PASS.

## Gates and missing current evidence

| Repository | Local gate | Evidence boundary |
| --- | --- | --- |
| App | `npm run qa:static`; `npm run test:content-release-cross-repo`; required recovery emulator gate | Final v11b current-source requiredHTTP4/0/0 + fullstatic1561/0/4dedicatedSKIP exit0/recovery/types/content/privacyPASS; independent scopedQA PASS and post46/27hashmatch. Historical gates remain separate. |
| Backend | `npm run ci` | Historical B2 integrated277/0/recovery15/operator4 retained. Fresh current decomposition: six static checks PASS; legacy finalv4 307total/302PASS/0FAIL/5dedicatedSKIP; v3 concurrent sync HTTP500 retained, cause unknown. No literal npm run ci PASS claimed. |
| Content | `npm test`; `npm run content:validate` | Current cleanHEAD; fresh full canonical80/0/0 and validate9tracks/16077authoringqs below. Current app fullstatic also exercises cross-repo contracts. |
| Web | `npm run verify:local` | Fresh verify:local exit0/syntheticlegal fixture; current cleanweb but appdirty. `prepare:web03c:local` needs clean app/web and cannot currently produce a clean combined candidate. |

## Exact remaining gaps

P1 local acceptance: B2 SMTP-family/terminal-retention decisions; B3 generation-mismatch policy; B4 native consume and persistence/restart; localHTTP logredaction and current-source gates/scopedQA now passed. Latest socket readiness is recorded in `ENVIRONMENT-SOCKETS.json`: sharedAuth/backend/Metro unavailable; this does not establish integration. Earlier read-only simctl probe found no booted simulator; current native/device state remains unverified. Retained fixture exactUID known privately; no matching Auth export/import path has been established for that UID. Auth restoration permission was requested in this chat and no answer has arrived; expired ISSUE cannot be ACKed or replayed blindly. Fixture password rotation and latest guest/vault state unconfirmed.

Critical-flow accepted histories (UI26-02B, UI26-11/12, AUD15, OPS-B4) retain their accepted scoped historical evidence; no regression has been established. The bounded mapping below preserves those historical acceptances and isolates account/session delta; current device proof remains missing for affected flows.

P1 release gates, separately: approved legal values, authorized WEB publication, four clean frozen SHAs/config/signing envelope, real provider matrix, physical iPhone, exact-artifact GO and PUBLISH. Android deferred; VoiceOver excluded by PO and not a blocker. These do not prevent this local inventory but prevent completing the entire plan.

Next: resolve native restoration and PO policies, then execute affected account/session native flows and final candidate evidence reconciliation. Content/web local checks below are complete. Do not claim SIM-READY while required native/policy gaps remain. Canonical acceptance: `docs/PATTERNLY-WORKING-PLAN.md` sections3,5,6.

## Fresh local checks (2026-10-01)

Node22 selected explicitly. Content `npm test`: **80 PASS / 0 FAIL / 0 SKIP**, exit0. Per-track canonical CLI validation: nine tracks, **16077 authoring questions**, all nine exit0; schema validation does not certify learning quality or bundled candidate count. Web `npm run verify:local`: exit0, build/legal/locale/route-boundary/marketing/local-admin checks passed using app-produced synthetic legal fixture. No deploy or provider calls claimed. Content/web remained clean at the same full HEADs after checks. Transcripts: `CONTENT-TEST.log`, `CONTENT-VALIDATE-NINE.log`, `WEB-VERIFY-LOCAL.log`; manifest records hashes. These checks close fresh local transcript gaps only, not AUD06/SIM-READY.

Independent Luna high bounded evidence-consistency QA: **PASS WITH ISSUES** (no product tests/services run by reviewer). Three log hashes, content80/0/0, nine validation counts/16077, web local PASS, cleancontent/webHEADs verified. Owner corrected chronology and runtime wording, added socket evidence and report pin. Whole AUD06 remains partial; affected native candidate proof and B2–B4 gaps remain.

## Critical-flow proof mapping (read-only, no reopened tasks)

App HEAD8d12b0c is a descendant of accepted654baa33(UI02B),a4dc53e7(AUD15),058ae2a1(UI12). Account/session/recovery B3 is the current delta. Historical acceptance is carried forward for unchanged areas; a missing current-device proof is not a finding of regression.

| Flow | Accepted source/evidence | Current delta or missing proof |
| --- | --- | --- |
| Entry/provider/signup/adoption/logout | `654baa33:docs/active/UI-26-02B/REPORT.md`, runtimec66419b; mapped/provisional, explicitadoption,cancel,cold/reentry | B3 changes provider/entry/session. Current affected cross-flow native proof required. |
| Guest isolation/reset/export | UI02B guest plan preserved at cancel/logout; backendexport `8936bac2:docs/active/AUD-08/B1B2B4-REPORT.md` | Full guest-domain identity preservation during current recovery unproved. Current reset/export proof not established by referenced reports; no regression alleged. |
| Practice/Review | `a4dc53e7:docs/active/AUD-15/REPORT.md`, five states/theme2x/storageidentical; Result→Review→Result058ae2a1 | No direct practice/review delta established; accepted proof retained. Account identity interactions remain B3 scope. |
| Goal/plan/progress | UI02B cold persistence/account-vs-guest isolation; canonical atomicpair contract | Current recovery identity transition/sync conflict proof missing; no independent progression rewrite authorized. |
| Reminders | `25f39af6:docs/active/UI-26-06/REPORT.md`, plan gating/localiPhone delivery | No reminder source delta established; historical acceptance retained, no task reopening. |
| Legal consent/hub | UI02B individualTerms/Privacy consent/retry/cold/immutableadoption | Consent proof does not prove separate hub navigation. Referenced reports do not establish currenthub native proof; missingproof notregression. |
| Privacy request/export | `986cd7f4:docs/active/AUD-08/B1B2B2-REPORT.md`, `8936bac2:…/B1B2B4-REPORT.md`, generation fences | Historicalbackend scope doesnot prove currentmobile path afterB3delta. |
| Operator/privacy | OPS-B4 backend15e49d0/exactCI36809141896 accepted | Syntheticoperator scope retained; doesnot close AUD08recovery/provider gates. |
| Recovery/ACK/resume | Finalv11b currentlocalHTTP+SDK4/0/0/fullstatic1561/0/4/scopedQAPASS | Nativeconsume/persistence/restart, fixturecleanup/passwordrotation and PO policies blocked. |
| Content/locales | Nine lock tuples; producer79060003 ancestor0174e42; freshcontent80/0/0/validate9; sevenlocale inventory and freshappstatic | Schema/parity gates do not claim learningquality or full device runtime. No acceptedcontent task reopened. |

Mapping collected by Luna high read-only (fit .90/simplicity .87/risk .89/maintainability .88 minimum .87). Review scope is evidence mapping; not fresh runtime acceptance. Current unavailable Auth/backend/Metro and unresolved policy choices block the missing affected native proofs. Laterrelease prerequisites remain separately listed above.

## Current backend gate decomposition

Six static commands lint/typecheck/TTL/OpenAPI/frontend-client/build exited0 (`BACKEND-STATIC.log`). Initial legacy run301/1/5 failed only piped-stdin CLI token prompt under restricted PTY. Focused five CLI tests with ownPTY access passed5/0/0; this supports a sandbox hypothesis, exact errno unretained. A second attempt stopped before emulator startup due to older defaultJava. Third attempt selected Java23 explicitly: legacy301/1/5, CLI passed, concurrent Firestore sync CAS returned actualHTTP500/internal_error instead of200 at tests/firestore.emulator.test.ts:885; cause unestablished. Own isolated19119/18119/4419/4519 ports freed after shutdown. SharedFirestore untouched; no imports/exports or source changes. Legacy failures preserved, no weakened assertion or retry limit. Dedicated gates completed sequentially: recovery15/0/0, operator4/0/0, operatoracceptance1/0/0, each exit0 with isolated shutdown. Focusedunchangedcase and fullv4 passed; nondeterministic v3 failure cause remains unknown; literal npm run ci was not executed. Independent no-tools Luna high diagnostic briefing approved fit.94/simplicity.90/risk.94/maintainability.91 minimum.90.

Read-only source investigation: v3 secondresponse failed after8.45s; store replay lookup precedes revisioncheck and intendedpath remains. Underlying Firestore exception not logged by current safeerrorhandler; contention/retry exhaustion is hypothesis only. Existing focusedcase unchanged passed1/0/0 exit0 on freshownedemulators, portsfreed. Full unchanged-source legacyv4 rerun completed307total/302PASS/0FAIL/5dedicatedSKIP exit0, ownedportsfree. Independent bounded Luna high QA PASS WITH ISSUES; controller spawnerror cleanup branch untested (normalexit only), reviewer disclosed premature recursive traversal of livev4log without extracting results before completion. See BACKEND-DECOMPOSITION-QA.md. Post27producer/46consumer pins match.

Final backend decomposition scope: current six static checks and legacyv4/recovery/operator/acceptance all exited0. This reproduces the constituent local CI gates with isolated legacyports; it is not a literal npm run ci invocation, provider proof, wholeB2 acceptance, or SIM-READY. Prior isolated failures remain in manifest. No source fix was applied for v3 transient; recurrence is an unresolved diagnostic limitation.
