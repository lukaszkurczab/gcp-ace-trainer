# Independent design review — native presentation 27

**Status: HOLD — the reviewed briefing is stale against a newly verified Product Owner decision.** The analysis below records the current code/contract evidence, but is not a final design verdict and does not authorize the proposed device-settings run.

## Binding and scope

- Reviewed `BRIEFING.md`, SHA-256 `4a7afe66f9947f2cbb352cad660f39296dd6dc1d27a048ad5bb25dc540c6338d`.
- Purpose: inspect one already-completed GCP review result in the existing iPhone 17 simulator with the app appearance preference left at System, while temporarily exercising simulator Light/Dark and the largest accessibility text category.
- The available data is the same completed result used in the accepted feedback slice: 10 answered, 9 correct, 1 incorrect, 0 partial. The proposed observations cover the real incorrect first item and a real correct second item, expanded Details, and the review navigation.
- The proposal explicitly limits its claim to this content and these rendered states. It does not call this full Q12, long-option coverage, partial-answer coverage, full native BIZQ-01 acceptance, or release readiness.
- No simulator, app, source, preference, session, or service state was changed during this review.

## Scope change requiring a revised briefing

A newly verified direct Product Owner decision authorizes preparing a real Premium test profile and using the app’s Premium settings toggle. That changes the reachability assumptions and the intended evidence scope. The current briefing instead says no Premium toggle/profile is needed and limits Q12 to the existing GCP completed session. It also excludes partial-answer evidence even though Q12 is explicitly named as an overall BIZQ-01 gap and the spec’s general native clause calls for correct, incorrect, and partial repaired-question examples. The parent is reconciling the exact native slice against the actual scorer/result-summary contract. Until the briefing binds that decision and the reconciled scope, the PASS assessment below applies only to the superseded bounded-session proposal.

## Contract and implementation fit

| Criterion | Evidence and result |
| --- | --- |
| Theme exercise does not change saved app appearance | `AppPreferencesProvider` resolves a saved `system` appearance from `useColorScheme`; the app setting can remain System while the simulator supplies Light and Dark. The accepted26 evidence records the app preference as System. **PASS** |
| The same real result can be inspected without altering learning state | `ExamReviewScreen` loads the exact session by `sessionId`, begins at the first review item, and returns to that result via `popTo(ROUTES.RESULT, { sessionId })`. The prior accepted26 native evidence binds the same 9/1/10 result. The proposal adds presentation observations only. **PASS** |
| Options and correctness remain distinguishable | Review builds controls from the saved review item; `PracticeResponseControls` and `AnswerOption` retain radio semantics, disabled state, labels, and non-color correct/incorrect treatment. The proposed check observes an actual incorrect and an actual correct response, without fabricating either state. **PASS** |
| Details and authored feedback remain available at large text | `PracticeFeedbackBlock` renders Reason, the Details disclosure, authored message text, remaining detail lines, and Sources inside the existing scrollable body. Text uses `maxFontSizeMultiplier={2}` and responds to `fontScale`; `DetailsDisclosure` exposes button role and expanded state. The proposal checks the authored D message and generic details by scrolling. **PASS for visible presentation; not a VoiceOver test** |
| Navigation stays available when content grows | `SessionShell` passes review actions as `Screen.footer`; `Screen` places the footer outside its scrolling body. Review actions are Previous/Next, and Back to results remains in the header. Existing `examReviewPresentation.test.ts` checks navigation destinations and disabled boundaries. **PASS by implementation fit; actual reachability remains to be observed on device** |
| Large-text behavior has relevant prior test coverage | `sessionShellLargeText.test.ts` checks large-text shell geometry and 200% button support. The question, choice, feedback, and disclosure components also use native font scaling. These tests support reuse; they do not replace the proposed live rendering check. **PASS** |
| Simulator state is protected | The briefing records the original `dark`/`large` simulator values and requires restoring and verifying those exact values even after failure, while keeping the app preference at System. This confines changes to reversible simulator presentation settings. **PASS as a method; execution must record readback** |
| Full Q12 boundary stays accurate | Q12’s owning row also names long options. The feasibility report states the existing GCP options are moderately short and that full Q12 remains open. The briefing excludes long-option coverage and labels this an available portion only. **PASS** |

## Provisional assessment of the superseded scope

Objective/architecture fit: **0.95**. Simplicity: **0.94**. Risk: **0.90**. Maintainability: **0.94**. Minimum: **0.90**. This reuses the current completed result, common review renderer, and single authorized simulator; it neither changes the app’s saved theme nor introduces a fixture, session, or product path. The only execution discipline is to read simulator settings first, restore them in a failure-safe path, and verify the restoration afterward as the briefing requires.

The plan correctly treats code and previous static tests as supporting evidence rather than proof of visible rendering. Its screenshots can establish the particular theme/text-size presentation and visible reachability only; they do not establish VoiceOver behavior, all content lengths, all answer states, full Q12, or native acceptance beyond this bounded case. These merits do not resolve whether the newly authorized Premium/profile path and partial-result semantics should be included in the revised package.

## Requirements and evidence bindings

- `docs/specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md`, §6 Q12 and §7 acceptance: large text, Light/Dark, long options and reachable Details/actions; VoiceOver excluded; general native acceptance remains broader. SHA-256 `c10ce086ecd3b58d7d776a458cb453d0161ac4519ca2474deba952122ceac8a3`.
- `docs/05-design-system.md`, Feedback and Accessibility baseline: complete authored Details, collapsed disclosure by default, no domain side effect, dynamic text without clipped essential content, accessible state and touch targets. SHA-256 `45b5f5b259ef1ec5ee2c2ed2070cd9c50964e15c133b81ae8d6b84419da09929`.
- `docs/06-branding-and-style-direction.md`, “Colour and track signatures”: Light/Dark parity, System follows platform, semantic state cannot rely on color alone. SHA-256 `024eb16cf863f6c4720e9afbe4afa32fd86ab3b9bf374cd670f42633e074390f`.
- `docs/17-training-runtime-and-interaction-spec.md`, §8: post-session review uses the authored feedback contract. SHA-256 `f796b365bfbc16d82b5395d509a44a21ec86bd3a2adb2c29dc04ce8c7ace7c44`.
- Existing bounded26 feasibility and acceptance: `../post-session-feedback-26/NEXT-RUNTIME-FEASIBILITY.md` SHA-256 `838fb4a7cb1227f039008d267616fc632110092727101c4372416347d9a6e13c`; `../post-session-feedback-26/ACCEPTANCE-QA.md` SHA-256 `c05e4e5f31b570550b5520d980a9f8a0f92224c536c5cc9bf275bbfe7ac91fc4`.
- Inspected implementation at app commit `2d24ef611839a825be98bc056132211a05662f99`: `ExamReviewScreen.tsx` SHA-256 `c3796b5f69660ff1b2c5bd60ed8bf557bdeb67f08dd0cde55ab2eee58a1b8458`; `Screen.tsx` `e980d6b61b5717d53b7f4f9dd5a8f1a465fcb892c49a100cbf51d319ed878d7d`; `DetailsDisclosure.tsx` `421e22ae8600bfa5baece2e577069fb06baed02da532727d9883d76b42664909`; `PracticeFeedbackBlock.tsx` `a0cd2b14e08d63260808727ac2fc775588f52b9e7101ce41e78cc604febbede5`; `PracticeQuestionCard.tsx` `f8bed97ece78c1767820926f832601e998dd765d5d3c5dc0129e7caf2c53b25a`; `PracticeResponseControls.tsx` `bd6238fe06ab1481bc2a3a3ca4c766619758f15ff8e3cf4caa867fde51c21576f`; `AnswerOption.tsx` `010f7b82ae1f2b458164f7e6e46f274da621326a4da1f3bc8bf8ba6ed8edf4bd`; `AppPreferencesProvider.tsx` `2ca9b8336061593af4b0eeb48c4e3ceea9dd93dd0baa622970effedeecee1acc`.
- Reusable tests: `examReviewPresentation.test.ts` SHA-256 `67005993cf41217df091c944bc130558c8fa73d7799631801dd4e92a0d87b4a9`; `sessionShellLargeText.test.ts` SHA-256 `cffbc38d7486528a88027bced4c86200d0bcd526be49993455500ca55a330eb0`.

## Limitations

This was a code-and-contract review only. Actual theme/text-size rendering and exact restoration remain to be observed by the authorized device operator. The existing accepted26 screenshots do not cover these settings. VoiceOver, long options, partial answers, Premium paths, Q13 update behavior, full Q12, and full BIZQ-01 remain outside this review.
