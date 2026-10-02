# BIZQ-02 — preflight and proposal freshness slice 01

Task statuses remain only in `docs/PATTERNLY-WORKING-PLAN.md`. Baseline app `c87d9e31d63c2b1dbce0f55811fffc3f59d4fd2a`, content `b3e4d007b89f45a2de3ebfc36ebdacbd8e0205cf`, backend `019e48e7d8e074c2e45d7f5ebb639a4ad394ae8f`, web `9585919b7d0c1a8396e6d255e49850e64e129d0e`. All four clean before preflight; local commits app2/content3, upstream ahead0 for backend/web. Stashes app6/backend4/content2/web0 unchanged. Prior goal turn made concrete progress: reproduced three stale-context defects on current code; first probe failed only because the app uses CJS, then the corrected async entrypoint established the actual RED result.

## Confirmed defects

[Reproducible preflight](preflight-stale-proposal.ts) uses the real canonical GCP catalog and real repositories. [RED result](PREFLIGHT-RED.log): proposal remained `ready` after a persisted attempt, a new local day and replacement of active storage with another store holding the same goal revision. All three should be `stale`. The Memory store probe establishes the application store-lease boundary, not native SDK/account switching.

Preflight source inspection before this correction: coordinator did not load the accepted plan at proposal creation; mutation owner captured the current plan revision only at acceptance. It awaited goal/plan reads after proposal resolve. In-flight/pending/terminal acceptance caches and editor sessions did not bind the active storage lease. Existing goal/plan CAS and durable-command idempotency are retained.

## Completion-rule inventory (independent Luna High, read-only)

All nine actual canonical tracks have no approved completion rule. The evaluator exists, but `CanonicalTrackRuntime`/`ResolvedPackageRuntime` and installed `NodeContentPayload` provide no rule. The optional `VerifiedContentPackage.profile.completionRule` is not consumed by the active path. No test-only thresholds are copied into production; `unknown` remains correct until a package-owned rule is approved and carried through the active source/schema/artifact/admission path.

The independent inventory also inspected all nine source Free profiles and nine configured package payloads: no rule in any of the eighteen. The Free profile schema forbids unknown fields. Those package-binding CI records are distinct from runtime admission and do not authorize reviving an obsolete runtime.

| Canonical track | Source Free profile version | Configured package suffix | Package profile version | Approved rule |
|---|---:|---|---:|---|
| aws-certified-solutions-architect-associate | 2 | free-node-0003 | 1 | absent |
| backend-system-design-interview | 2 | free-node-0003 | 1 | absent |
| coding-interview-dsa-problem-solving | 2 | free-node-0005 | 2 | absent |
| claude-certified-architect-professional-certification | 2 | free-node-0001 | 1 | absent |
| microsoft-azure-administrator-associate-az-104 | 1 | free-node-0004 | 1 | absent |
| microsoft-azure-ai-fundamentals-ai-901 | 1 | free-node-0004 | 1 | absent |
| google-cloud-associate-cloud-engineer | 2 | free-node-0006 | 2 | absent |
| frontend-system-design-interview | 2 | free-node-0003 | 1 | absent |
| object-oriented-design-interview | 2 | free-node-0003 | 1 | absent |

Authoritative paths: producer `content/catalog.json`, `config/free-node-experience-profiles/<track>.json`, `schemas/product/free-node-experience-profile.schema.json`, `config/bundled-free-node-packages.json`, configured `artifacts/bundled-free-nodes/<track>/<version>/package.json`; app `src/content/canonical/runtimeCatalog.ts`, `src/content/runtime/nodeContentPackage.ts`, `src/application/contentPackageRuntimeOwner.ts`, `src/domain/learning/packageCompletionRule.ts`. Source-profile and package-version lag is inventory evidence, not authorization to regenerate immutable packages.

## Coherent slice outcome

Protect actual proposal resolution and canonical acceptance from stale profile, accepted-plan, evidence and calendar inputs, using a single repository snapshot and a synchronous guard immediately before existing CAS. Scope input to an opaque current published-storage lease; no new persistent revision/history, permissions, package rules or runtime. Preserve uncertain-response acknowledgement of the same already-durable command in the same scope and local reminder failure semantics. Design review and implementation evidence follow here; this report does not claim full BIZQ-02 completion.

## Accepted briefing

Cel/Ustalenia/Podejście is recorded in the canonical queue. Independent no-tools Luna High proposal review: PASS WITH GAPS; fit/simplicity/risk/maintainability 0.95/0.89/0.84/0.90, min0.84. Incorporated conditions: retain semantically relevant evidence order; same-scope durable-command acknowledgement returns the original result without repeated writes/reminders, including active-journal retry. This accepts the design only. Root owns repository snapshot/editor and final verification; Luna High worker owns proposal coordinator/tests; separate Luna High acceptance follows actual code/evidence. No second status plan.

## Delivered implementation and removed paths

- `src/storage/repositories/learningPlanInputSnapshot.ts`: one synchronous, validated goal/accepted-plan/attempt/review snapshot; opaque existing published-storage lease; active journal and read/corruption failures are explicit. Shared synchronous readers extracted in `goalRepository`, `trainingAttemptRepository`, `reviewQueueRepository`, `mutationJournalRepository`; existing async APIs wrap the same implementation, not a second data path. Canonical codecs, writes, revision counters and journal recovery are unchanged.
- `LearningPlanProposalCoordinator.ts`: replaces separate async goal/evidence reads with that snapshot; captures calendar/timezone before package await and checks inputs after it. Private bounded SHA-256 fingerprint includes exact package/modes/pool, goal, accepted-plan record/revision, exact-package evidence in preserved order, effective due review count, local day/timezone. Exact duplicate IDs deduplicate, conflicts fail closed. `resolveForCommit` reads current inputs and existing owner's prepared package synchronously. Removed unused completion evaluator/type imports; persistent domain identity/schema unchanged. Actual absent approved rule remains explicit unknown.
- `LearningPlanEditorCoordinator.ts`: existing editors and pending/in-flight/terminal acceptance results bind the same lease. Final synchronous evidence/calendar/package guard immediately precedes existing CAS, with current goal/plan revision checks. Exact same-scope already-durable commands are acknowledged without a second repository save, even when a learning journal blocks a new proposal. Internal lease/counter is excluded from public editor snapshots. Replaced retry-through-save path and redundant unreachable branch; removed old unscoped cached-success path. Terminal replay after a later plan edit returns stale rather than forwarding an old snapshot to reminder reconciliation. Pending accept/editor durable acknowledgements also require the current goal revision; editor retry rechecks it synchronously after the async read.
- Tests: actual catalog/repositories/router/application mutation composition; existing editor tests adapted to explicit synchronous dependencies and acknowledgement save counts; stale/error reminder composition added. No new runtime, native scheduler owner, persistent history/revision, completion policy, content artifact, auth or service setting.

The normative clause was written before code in parent `docs/04-data-model.md` (lines128–140; SHA-256 `f25a29f02ce4f4a46990bd56b3f85b35f70550fc4ece7fdf039550e178869e34`). Shared `docs/01..17` reside outside all four Git repos; this local canonical edit is not silently claimed to be included in an app commit. Other canonical rules remain as read. [Briefing review](BRIEFING-REVIEW.md) is separate from acceptance.

## Controller verification

Root personally inspected the final diff and ran checks; the worker report and typecheck alone do not establish acceptance. [Original preflight RED](PREFLIGHT-RED.log) → [GREEN](PREFLIGHT-GREEN.log) uses actual GCP catalog/repositories; the versioned probe was migrated to the new dependency API. Additional [terminal replay RED](TERMINAL-REPLAY-RED.log) exposed a cached old result reaching reminder composition after a later edit; the final integration regression now rejects it with zero extra reconciliation. [Pending durable acknowledgement RED](DURABLE-STALE-GOAL-RED.log) exposed both old-plan acknowledgements after a new goal; [async goal read RED](DURABLE-ASYNC-GOAL-RED.log) isolated an editor retry race inside its async read. Final actual mutation-composition tests return stale(goal), keep one save, leave the durable pair unchanged and perform zero extra reminder reconciliation.

[Final application/repository suite](ACCEPTANCE-FINAL.log): **88 passed, 0 failed, 0 skipped** across proposal/editor, actual storage-router A/B/A, final await/CAS races, current-plan revisions, effective due/timezone/day, corruption/journal, exact-ID dedup/conflicts/order, immutable replay, uncertain durable acknowledgement, mutation/reminder composition, existing reminder idempotency/failure recovery, canonical goal/plan CAS, journal and MMKV lease tests. Scope switching uses the real profile router/published wrappers backed by memory storage; it proves application lease lifecycle, not native SDK/account transitions. Injected package identity tests are contract evidence, not downloaded-package installation evidence.

[Premium entry contracts](PREMIUM-ENTRY.log): **5 passed, 0 failed**, including session admission and actual Premium entrypoint boundaries. [Typecheck](TYPECHECK-FINAL.log), [content boundary](CONTENT-BOUNDARY.log), [runtime/privacy boundary](PRIVACY-BOUNDARY.log), and final diff whitespace check PASS. No full app suite or content build/admission rerun: the nine artifacts, locks, current candidate/admission and BIZQ-01 implementation are unchanged. Existing matching artifact/source evidence remains applicable; a new planner commit alone does not invalidate it.

Reproduce from the app repo with Node22 and existing dependencies:

```sh
node --import tsx docs/active/BIZQ-02/preflight-stale-proposal.ts
node --import tsx --test src/application/learningPlan/LearningPlanProposalCoordinator.test.ts src/application/learningPlan/LearningPlanEditorCoordinator.test.ts src/application/learningPlan/LearningPlanEditorCoordinator.freshness.test.ts src/application/learningPlan/learningPlanMutationRuntime.test.ts src/application/learningPlanReminderRuntime.test.ts src/storage/repositories/learningPlanRepository.test.ts src/storage/repositories/mutationJournalRepository.test.ts src/infrastructure/storage/mmkvClient.test.ts
node --import tsx --test src/application/trainingLifecycle/premiumSessionAdmission.test.ts src/application/trainingLifecycle/premiumEntryPointsContract.test.ts
npm run typecheck
npm run validate:content-boundary
npm run validate:runtime-privacy-boundary
git diff --check
```

Native YAML files in this directory preserve each stage. They operate on the existing guest GCP fixture and do mutate its local goal/plan/answer state; do not run them concurrently or infer a clean-state whole-flow pass from the final continuation alone. Only the authorized existing UUID is valid.

Trailing whitespace in three preserved RED TAP logs was normalized for the staged whitespace gate; assertions, failure text and results are retained. Failed preparation attempts are preserved: the original probe CJS top-level-await error was corrected before RED; `EDITOR-INTERMEDIATE.log` ran while the worker was replacing its owned source file and failed to import it; initial `TYPECHECK.log` found the old probe dependency shape, then the probe was migrated and final typecheck passed. These are not claimed as product failures or passing checks.

## Independent acceptance

[Separate read-only Luna High acceptance](QA.md): **PASS WITH GAPS**, after source inspection, actual focused tests **43/43**, typecheck and diff check. The reviewer found the pending durable-ack goal defect; controller then found the narrower async editor retry race. Both were corrected and independently reviewed within the accepted approach. No remaining blocker for this bounded freshness slice; full BIZQ-02 and exact native time entry remain open.

## Native evidence and limits

Only existing iPhone17 `7F315654-3175-4F3C-BB24-B0263F59360C`, iOS26.4; guest, Premium toggle disabled. No installation, data clearing, new device, purchases or VoiceOver. It was initially shut down; booted that same device. Screens and log assertions use ordinary UI selectors; no hierarchy is inspected as VoiceOver evidence.

[Bootstrap](NATIVE-BOOTSTRAP.log) PASS. Actual GCP create/accept reached persisted plan in [plan flow](NATIVE-PLAN.log). Exact time input09:15 is **RED**: saved screen shows09:00; [differentiated input probe](NATIVE-INPUT.log) and [field read after hiding keyboard](NATIVE-FIELD.log) show09:00 already before the second commit. It establishes observed-field persistence, not correct09:15 entry; cause of native time entry remains unresolved and is not relabeled PASS.

[Days edit and restart](NATIVE-DAYS-RESTART.log) PASS: added Tuesday in actual existing-plan editor, saved, cold app restart without data clear, then Progress exposes an existing open-ended accepted plan and completionunknown. This is post-ACK persistence, not interrupted-operation recovery; it does not assert exact durable slot values after restart.

[Actual answer/feedback and Home](NATIVE-SUBMIT.log) passed before the navigation stage failed. The final corrected [post-submit proposal/restart continuation](NATIVE-SUBMIT-FINISH-FINAL.log) PASS after explicit screen waits and centering the Goal action above the bottom tabs. Root inspected the resulting screenshots: the new proposal is displayed after the actual persisted answer; it is left unaccepted, then a cold restart exposes the existing accepted plan with completion unavailable. These sequential segments establish submit→Home→proposal→restart; they do not assert a second acceptance or exact durable slots. Earlier failed navigation logs are retained with their stage, not rewritten as passing runs.

Screens: [proposal](screens/02-proposal.png), [accepted](screens/03-accepted.png), [time after save RED](screens/04-input-after-save-red.png), [time before save RED](screens/05-input-before-save-red.png), [day edit](screens/06-days-edited.png), [post-restart plan](screens/07-restarted-plan.png). Additional [durable feedback](screens/08-durable-submit-feedback.png), [Home after submit](screens/09-home-after-submit.png), [Progress after submit](screens/10-progress-after-submit.png), [proposal after submit](screens/11-proposal-after-submit.png), [post-submit restart](screens/12-post-submit-restart.png). Own raw Maestro debug directories were removed after preserving the versioned flows, logs and selected screenshots; no hierarchy was used as VoiceOver evidence. The native guard faults remain covered only by application tests; no native cross-profile or local-clock fault claim.

## Remaining work and safe continuation

Full BIZQ-02 remains in the canonical queue: shared Home/proposal/forecast projection, all P01..P20 and actual approved package completion-policy transport/validation. No policy may be inferred from the fixture20/10/0.8. The existing forecast/generator volume-versus-quality regression still needs its own coherent integration slice; reaching the minimum must not produce a completion date when quality remains insufficient. Native exact time entry needs a bounded separate diagnosis before claiming that behavior. The post-submit Progress screenshot also labels the abandoned one-answer session as “1 session completed”; its current counter/label requires a bounded shared-projection preflight rather than claiming full-session completion. BIZQ-01 native Premium/new-ID reachability and full-bank quality remain open as already recorded.

Next safe slice: use the validated evidence/scope contract for one shared Home/proposal/forecast projection, preserving explicitunknown when the actual package rule is absent; preflight the minimum-versus-quality fixture and review a bounded correction before implementing. Carry approved rules only through the current canonical source/schema/artifact/admission path, never revive the obsolete Free-package runtime or introduce default policies. AUD-08 B2/B4 and other agent ownership remain where they were.
