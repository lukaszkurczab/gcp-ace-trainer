# BIZQ-02 quality slice02 — preflight and evidence

Statuses remain only in the canonical queue. Baseline app `24dd6c5dc914d215e9760a72ddf912683819fc0a` ahead3/behind0, content `b3e4d007b89f45a2de3ebfc36ebdacbd8e0205cf` ahead3/behind0; backend `019e48e7d8e074c2e45d7f5ebb639a4ad394ae8f`, web `9585919b7d0c1a8396e6d255e49850e64e129d0e` both0/0. Four working trees clean at start; stash hashes/counts app6/content2/backend4/web0 unchanged. AUD-08 unaffected. Previous goal turn was progress: implemented/verified freshness slice01, commit24dd6c5d.

## Confirmed preflight

`src/application/learningPlan/learningPlanQualityGuard.test.ts` uses actual canonical GCP identity/question, actual repository writes/snapshot, canonical evaluator, accepted plan and domain generator/forecast. Explicit P05 policy20/10/0.8 exists only in this test, never in production. 25 persisted attempts with5correct in latest10 yield in_progress as required. [Original RED](PREFLIGHT-RED.log) then proves forecast available/today/on_track with remaining0 and generator achievable/remaining0. Both assertions fail at the required outputs, not during setup.

Reproduce from app with existing Node22 dependencies: `node --import tsx --test src/application/learningPlan/learningPlanQualityGuard.test.ts`.

## Bounded plan

Cel/Ustalenia/Podejście and file-level AC are in the one canonical queue. Normative rule entered parent `docs/04-data-model.md` before production code. That shared contract is outside all four Git repositories; local edit will not be silently claimed as an app commit. Controller scores fit/simplicity/risk/maintainability0.95/0.94/0.90/0.92, min0.90. Independent no-tools Luna High design review **PASS WITH GAPS**, scores0.94/0.91/0.83/0.90, min0.83. Conditions incorporated: absent rule stays unknown before the new branch; existing continue-plan Practice action receives explicit contextual “Work on results” label. The action kind/destination and scheduler owner remain unchanged. This is design review, not code acceptance.

No default production rules, source/schema/artifact/admission changes or new runtime/storage. Existing actual packages retain unknown. This slice integrates the existing evaluator output through forecast/proposal and actual UI presentation; full Home/proposal shared snapshot projection remains open, as do P01..P20 coverage and policy transport. It does not change cadence, accepted plan, reminders or Premium.

## Delivered boundary and actual verification

`paceForecast.ts` and `learningPlanProposalGenerator.ts` now expose `quality_requirement_unmet` for in-progress/minimum-met instead of completion today/on-track or achievable zero-work. Existing guidance maps it to neutral unavailable facts and the existing Practice action, with contextual “Work on results” copy. Existing `homePlanUiContract.ts` owns the two pure copy functions consumed by `LearningPlanProposalScreen.tsx`; their former private definitions were removed. Seven learningPlan locales cover message, reason, fact and action. No replaced imports remain. A temporary new `learningPlanProposalCopy.ts` was removed before delivery; no parallel copy owner remains.

Six actual repository→evaluator→domain→presentation integration cases cover P05, exact minimum, seven locales, missing rules, open-ended/shortfall precedence, completed zero-work and later rolling regression. The two explicit smoke-only presentation fixtures use the existing closed command enum and generator; acceptance is still a storage-error/unavailable fixture, never a successful persistence simulation. Disabled production peer and Metro selection tests pass.

Final controller verification after helper relocation: **67/67** in [ACCEPTANCE-FINAL.log](ACCEPTANCE-FINAL.log), plus **6/6** actual Home snapshot/Progress regressions in [SNAPSHOT-PROGRESS-FINAL.log](SNAPSHOT-PROGRESS-FINAL.log), total **73/73**. The first final invocation accidentally named two nonexistent nested test paths; Node skipped them, so the second invocation explicitly ran their actual paths. No omitted tests are counted. Typecheck, content boundary and runtime privacy boundary PASS in their final logs. Independent read-only Luna High acceptance is **PASS WITH GAPS**, focused **48/48**, typecheck/diff PASS; see [QA](QA.md). This acceptance is stronger than typecheck and is limited to the source/application integration boundary.

Reproduce the final 67 from app:

```sh
node --import tsx --test src/application/learningPlan/learningPlanQualityGuard.test.ts src/domain/learning/packageCompletionRule.test.ts src/domain/learning/paceForecast.test.ts src/domain/learning/learningPlanProposalGenerator.test.ts src/application/learningPlan/targetDateGuidance.test.ts src/application/learningPlan/targetDateGuidancePresentation.test.ts src/features/home/learningPlanProposalPresentation.test.ts src/features/home/learningPlanProposalFixtureCommand.test.ts src/features/home/learningPlanProposalFixtureRuntime.test.ts scripts/learningPlanProposalFixtureMetro.test.mjs src/i18n/i18nLocaleParity.test.ts
node --import tsx --test src/application/homePlanSnapshotReader.test.ts src/features/home/progressPlanPresentationModel.test.ts
npm run typecheck
npm run validate:content-boundary
npm run validate:runtime-privacy-boundary
```

## Failed attempts and native limit

Original P05 assertions RED are preserved. Intermediate typecheck failed because the moved translator type was still used by screen props and a test default narrowed the completion union; both were corrected. First expanded fixture suite was72/73 because its exact closed-list expectation omitted the new cases; the expectation and enabled/disabled parsing of all cases were corrected. These failures are preserved separately from final PASS.

Only existing iPhone17 `7F315654-3175-4F3C-BB24-B0263F59360C` was used. Initial Maestro dependency chmod was sandbox-blocked before launch, then the same flow ran under approved local-tool execution. Existing ready1 presentation probe PASS ([log](NATIVE-PROBE.log), [screen](native-existing-fixture-probe.png)); it proves the cached smoke fixture route only. New quality fixture did not reach the proposal ([log](NATIVE-QUALITY.log), [Home at failure](native-quality-not-rendered-RED.png)). Direct current-bundle probe established HTTP500 UnableToResolveError: first the temporary copy module, then the earlier committed `learningPlanInputSnapshot` after relocation to the existing UI owner. The new quality copy **has not been verified on device**.

Live Metro8081 PID45720 is launched by PID45717 using the earlier `scripts/aud08/startNativeMetro.mjs` launcher, absent from the checkout. We did not kill/reconfigure/recreate that runtime or guess its environment; local backend8080 also stayed unchanged. App explicitly terminated at handoff; guest GCP and Premium toggle off preserved. No accept/answer/persist/reset/install/new device/VoiceOver/purchase in these fixture probes. Own two raw Maestro directories removed after preserving selected evidence. Safe next native step: coordinated refresh of the existing launcher/config, then rerun the versioned quality flow against a successfully resolved current bundle. This is a verification dependency, not a newly invented release gate.

## Remaining work and ownership

Full BIZQ-02 remains partial: Home snapshot still explicitly returns unknown, package policy transport and P01..P20 are open. All nine actual canonical tracks lack an approved rule;20/10/0.8 is test-only. Current quality fix does not silently introduce such a rule. Native09:15 and account-switch gaps from slice01 remain open. A read-only independent consumer map confirms Progress labels total attempt/practiced-item counters as weekly completed sessions; diagnose/correct that in its own bounded slice, coordinated with the existing architecture/performance projection work. Do not combine it with this P05 change.

Canonical `docs/04-data-model.md` was edited before code outside all four Git repositories; its current SHA256 is `594ca349a615d0e21ac6f180726cd59a6281777f8734de194f2734200eed46c8`. It is a local canonical contract edit, not part of the app Git commit. One canonical status queue/state updated; other agents' appended CH/PERSIST/SEC/PERF/ARCH material and untracked audit reports stay untouched and outside this commit. Four-repository HEAD/upstream/stash snapshot retained in [REPOSITORIES](REPOSITORIES.json). No stash, deploy, publication, push, service configuration or permission/model-sales change.
