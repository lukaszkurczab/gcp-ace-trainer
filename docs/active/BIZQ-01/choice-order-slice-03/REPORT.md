# BIZQ-01 — choice-order slice03

Bounded source/runtime acceptance: **PASS WITH ISSUES** after independent Luna High review. BIZQ-01 remains partial; this is neither full-bank semantic acceptance nor native/release acceptance.

## Outcome and exact scope

Q08/Q09 preflight on app `b4885a5eee23ce4dec1cf07f21d76cf536d98077`: two actual GCP 10-item practice preparations with different session IDs exposed the same source order. Resume rejected a legal fingerprinted reversed choice order. The two regression tests were written before production; `preflight-red.log` preserves RED2/2, `preflight-green.log` GREEN2/2.

- `src/application/canonical/canonicalOptionOrder.ts`: one prepare/validate helper. Choice stable IDs are ranked by the existing platform-neutral SHA-256 over namespace, existing occurrence identity (including session ID), track/question and exact content pin. No accepted answer, source position, clock, random generator, new SDK call, dependency, seed field or storage owner. Different sessions may repeat permutations.
- `src/application/canonical/CanonicalTrainingRuntime.ts`: practice and simulation prepare orders once; resume validates exact membership/uniqueness plus the existing fingerprint rather than source equality. Ordering/dimension controls keep declared order. Unresolved ordinary branches match their stored occurrence, exact-source branches inherit the prepared source order; branch resolution still consumes the saved order. Removed the replaced private `optionIds` function; no remaining references in this area.
- `src/application/canonical/canonicalChoiceOrderIntegration.test.ts`: actual catalog/runtime, existing mutation journal, canonical repositories and memory rebind, production interaction view model and negative cases. No native storage/SDK or React render claim.
- Versioned diagnostic, logs, accepted briefing, independent QA, current handoff and only the BIZQ queue hunks accompany the source. Other audit additions are excluded from this checkpoint.

Before code, the existing parent `../docs/17-training-runtime-and-interaction-spec.md` received only the prepared/persisted order clause. It is outside all four Git repositories; current SHA-256 `1439dbad88fe41a3a089181b4b070e3a906779e66530b40a46fed73823e03aeb`. The existing wrong-zero scoring clause remains. No authored question, scorer, selector, profile, schema, generated artifact, lock, admission, Premium, atomic goal+plan, reminder, authentication or service-configuration change.

## Accepted approach

Cel/Ustalenia/Podejście is in the canonical queue and [BRIEFING.md](BRIEFING.md). Controller fit/simplicity/risk/maintainability 0.96/0.91/0.87/0.91, minimum0.87. Independent NO-TOOLS Luna High 0.96/0.90/0.82/0.91, minimum0.82, PASS WITH GAPS before production. Required seed clarification was incorporated: actual practice/simulation occurrence IDs are sessionId:occurrence:index. No-tools review assesses the proposal only; [QA.md](QA.md) separately records source acceptance.

## Actual verification

Controller **53/53** final tests, zero skip/failure:

```sh
node --import tsx --test src/application/canonical/canonicalChoiceOrderIntegration.test.ts
node --import tsx --test src/application/canonical/CanonicalTrainingRuntime.test.ts src/application/canonical/CanonicalTrainingSelection.test.ts src/application/canonical/canonicalChoiceFeedbackPresentation.test.ts src/application/canonical/multipleChoiceScoringIntegration.test.ts src/content/canonical/questionCore.test.ts src/infrastructure/identity/sha256.test.ts src/application/trainingLifecycle/premiumProductModeLifecycle.test.ts src/application/learningMutations/mutationJournal.test.ts
npm run typecheck
npm run validate:content-boundary
npm run validate:runtime-privacy-boundary
node --import tsx docs/active/BIZQ-01/choice-order-slice-03/source-reference-probe.ts
```

`integration-final.log` 7/7: actual 29 practice modes and 5 simulation profiles, same-seed stability and sample two-session variation; all16,077 current items (14,335 choice/1,742 other) have legal, frozen ID membership and unchanged other-interaction order. Actual production view-model checked IDs reconstruct the correct answer independently of display order; accessibility control IDs follow saved order. This is mechanical coverage, not semantic review of every prompt. Legacy valid source order resumes; missing/extra/foreign/cardinality/sparse/duplicate/pin/fingerprint negatives reject. A real Coding custom practice wrong answer followed by three durable intervening answers resolves the exact-source repeat, retains source order and survives canonical memory rebind.

Natural MC reachability is confirmed without selection-policy changes. Completed canonical Coding **learn-approach** sessions, persisted attempts, finalization and rebind first reach MC in round7; Claude focus in round5. The independent readonly Luna High diagnosis found Coding guided round7/Claude focus round5 using valid referenced history facts, without journal persistence. These are different evidence scopes; neither establishes native timing or a first-session diversity requirement.

`regressions.log` 46/46 covers existing runtime/selection, authored choice feedback, the wrong-zero 440MC/8,960-subset oracle, question core, reused SHA, real Premium lifecycle gate and journal. Final typecheck and both boundaries PASS. Independent Luna High ran integration7/7 and current typecheck; final **PASS WITH ISSUES**, see QA. Its earlier 7/7 is reused after checking that only the diagnostic changed; runtime/test did not.

Producer/app artifacts and lock are unchanged inputs. Reuse scoring02's actual buildAll9/raw byte parity (9 artifacts plus lock), exact admission and producer23/cross2 checks; producer HEAD is still `ddd45c83f47a77d425dd016f949f58e9dad0d3a9`, no tracked producer changes. No rebuild is claimed this turn.

## Failures, corrections and limits

The extended first integration run (`integration.log`) was 6/7: the test awaited malformed domain construction before `assert.rejects`; the domain correctly rejected it. The assertion now encloses the entire async operation; no production validation was weakened. Final7/7 is the applicable result.

Diagnostic setup: `.mjs` named import failed with the local TS/CommonJS loader (`source-reference.log`); a TS top-level-await attempt failed under CJS (`source-reference-ts-attempt.log`). Using a TS async main resolved those loader failures. Independent QA then caught TS5097/TS2339 because docs TS files are included by the real tsconfig. The stored earlier `typecheck.log` predates this script and is not final-tree evidence. Extensionless import and explicit interaction narrowing repaired the actual errors; tsconfig/excludes/gates were not changed. Current `typecheck-final.log` and independent rerun PASS.

Known source-copy risk: `alg-contrast-binary-scan-correctness-006` names methods “Option A/B”, which may be confused with displayed letters after a permutation. The actual-current-catalog diagnostic (`source-reference-final.log`) finds no current Coding practice pool or eligible Coding Mock profile containing it. No hiding/filter/flag or admission rewrite was added. Independent no-tools reviewer and source QA treat it as a disclosed dependency for semantic source review before broader reachability or a future authored-content batch. Whole-bank semantics remain open; the broad scan and mechanical inventory do not establish educational quality.

Fresh read-only runtime probe: existing Metro8081 `/status` HTTP200/running; current iOS AppEntry HTTP500 cannot resolve committed `learningPlanInputSnapshot` in `LearningPlanEditorCoordinator`. No process restart, cache reset, installation, device/data clearing or config change. Native rendering, actual SDK restart, themes/large text and Premium user session remain unverified. Only iPhone17 `7F315654-3175-4F3C-BB24-B0263F59360C` is authorized. No VoiceOver test; source accessibility semantics remain applicable.

## Repository and next action

Four origin fetches succeeded without upstream changes. Baseline identities/stashes are in [REPOSITORIES-BEFORE.json](REPOSITORIES-BEFORE.json); app8ahead/content5ahead, backend/web0/0 before this checkpoint. Stashes6/2/4/0 unchanged. Concurrent security/privacy queue/report and content full-content-audit remain untouched outside this commit; existing AUD-08 owners/positions retained. The audit is not admission authority. No push, deploy, publication, production purchase, service configuration or stash operation.

Next safe step: a bounded source-copy/semantic review of the named-method candidate and other position-dependent content, with authored changes and existing admission only after a separate concrete preflight/brief. Await the PO decision before changing valid partial-score denominator. Native acceptance waits for coordination with the existing runtime owner. Full BIZQ-01..06 remains active in the one canonical queue.
