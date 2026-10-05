# Independent semantic review: N09-B01 v1

**Verdict: REVISE.** This review covers only the frozen N09-B01 proposal. The case decisions and answer keys are supported, and the proposed question IDs preserve the existing test-seam objective. The current answer choices nevertheless show a cohort-wide cue: every correct choice is the longest and includes extra procedural detail already stated in the prompt, while the alternatives are shorter partial actions. Under BIZQ-01 §4.3, this makes form a reliable shortcut. Shorten the keys to the distinguishing seam and controlled input; do not pad distractors or enforce equal lengths.

## Bound inputs and method

- Frozen proposal: `review-inputs/N09-B01-v1.json`, SHA-256 `70a812eab3ddbcd0b20dc99eec741e08d04268b7546f9bc5ff68706c37884831`.
- Frozen before/current manifest: `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`.
- Frozen author hypotheses: `review-inputs/AUTHOR-N09-B01-v1.json`, SHA-256 `9bd38a23c47f91910f42b27165e1b433bae9a94cddbbdda9a7c3f962b6281bd0`.
- Canonical contract and guidance reviewed: BIZQ-01 §4.1–4.4 and §5C; `docs/07-content-guidelines.md` §766. These require a meaningful decision, credible alternatives and diagnostics, and preserve a question ID when its primary decision and accepted meaning remain. A changed option meaning receives a new option ID.
- The 18 whole-object fingerprints below use the repository’s `canonicalJson` representation and SHA-256. The source array SHA-256 is `6e75bf2e34178561b500500b2cb449a0e5642ea91cbfb251cc8a25b41277cd7a`.

I read the full before/current prompts, constraints, options, answer references, Reason, all five Details fields, wrong-option diagnostics, and identity notes for all 18 items. I compared each accepted answer by `answer.optionId`, not option position. I found no incorrect keyed decision or diagnostic-target mismatch. The author’s changed accepted-option meanings use fresh option IDs, as required.

## Item findings

For every row, the question identity action is **SAME_ID**: the current case remains a testability seam decision and concretizes the same accepted choice, controlling an external or variable input while exercising the real behavior. The accepted option’s new, case-specific meaning properly has a fresh option ID. Each keyed answer is semantically supported by the visible case facts; the blocker is the repeated answer-form cue, not key correctness.

| Item | Accepted decision supported by the scenario | Identity | Canonical before → current fingerprint |
|---|---|---|---|
| i001 | Inject a per-instance clock and advance it across reservation expiry while running the real reservation operation. The parallel/no-sleep constraints rule out global-clock mutation and waiting. | SAME_ID; new option ID | `e3ab8a93109c45ce03fa6f2d78ac08013f6e845a8ef8a213315d7cc71b7faef5` → `86d6db8bbcc906cd5d4cd3740f4041b4e884ef141d9b6663b47675594ba76eec` |
| i002 | Substitute the repository edge with an in-memory fake that returns the merge conflict, then execute and inspect the real merge path. | SAME_ID; new option ID | `20250faa2fd123ffe3edd3faa7ed5c6e54862e6e387fb0a2320193eed0efb21f` → `4394528acfd35c492447b3caa32aac2503f79676066bf64e96fbb0e6e20ea6b6` |
| i003 | Record the policy call through a fake provider using the requested territory and expiry, then assert denial. | SAME_ID; new option ID | `c6122e92f7eaef084d38c01bd746f674e422c93dda97a5bee6edb73a6c6404f3` → `f71e3515351c9d186f86e4058e26475b9d1c2bb9fde0aa0371c0ca42650634a2` |
| i004 | Have the repository fake return the post-selection write conflict and exercise the actual retry/conflict branch. | SAME_ID; new option ID | `71f7ba13fed0726429bb361c781c9bfb8f2fac2a0035be051663190d22881bb5` → `878ec6b78e9387c4b2eb6a1305f7039bc89ba1f9d92d9b54f401ddca7e3e65ef` |
| i005 | Record the outbound sender call to prove the opted-out profile is excluded from the consent payload. | SAME_ID; new option ID | `20d8ceaab19cf208e899edd8753c1e236eadfffdcb4ae536a7a8c5fa3dd8bb56` → `44201a36ef36c3aeb213bc6343a009ea1425c55669519b04d40408b6f9e08407` |
| i006 | Return a versioned catalog snapshot from a fake and verify completion uses the attempt’s original catalog version. | SAME_ID; new option ID | `7a72541f2531911978e141b753998fb0d86b793278bcaaee6850d4473b2ccd8c` → `bc4b330ffaf27180985a592b7a90d0b1fbafac1d710efb74460272687f300012` |
| i007 | Supply controlled authorized/unauthorized identities at the collaborator edge and run the real payout authorization path. | SAME_ID; new option ID | `99094a4ddf733d62bbd390e6c8f1f0368e6c73bcc2f4d400919a18c4b3b62e26` → `e59dee0cdac3423d9fa743e10de3f38b0f4d851565547a233b72c38b2aa55a58` |
| i008 | Supply deterministic segment identifiers for old/new offsets and exercise the real remapping algorithm. | SAME_ID; new option ID | `7cce78df57c78afc30c13a72d630a49ee9d9a8f8bbb375bcdadf948e147d070e` → `8ec5bba40534492fefeb1359953ea05a9c31bd7f615a93b3fd388afaa83c9e5a` |
| i009 | Inject a controlled availability collaborator and run the actual approval rule for the proposed assignment. | SAME_ID; new option ID | `36c1d6e0f76db414d893db27eb88a38d8c4c6b414c04ee9222db44bc0118c8a5` → `61ecd25a337b8b8e953f5d65303c4b6140f8e7400120c5e2e70b510da16e7b2a` |
| i010 | Record the signer call and verify it receives the selected immutable revision even after a later draft edit. | SAME_ID; new option ID | `d9c6ffb01fc33c4adcb6abbb98d12f96537707bd8d28e265654db00fb57c73e5` → `fe0f405047b7d982176c5c35cd7c1eff20e4cad5e98438f7c3cfebe1eb280c57` |
| i011 | Script the payment port’s timeout followed by confirmation and verify the repeated request uses the same payout ID. No provider-level exactly-once guarantee is asserted. | SAME_ID; new option ID | `2c530176f2c79d8166003dc2887de813f25c23016f8c08c511a8df62edc79a4a` → `b1b590cb84de669c5775c94e2d8ac0dd883d949d98d553421b238f6f494d7cdd` |
| i012 | Record notification calls and compare order against effective-time values despite reversed request order. | SAME_ID; new option ID | `69a5d0263738293dae5b788cb8e30936e70644c0b0ba9128ed4d249fe56193ab` → `a653ea500d1c3d1a811f039c07e8d850fc71786d1889948ac122d7996579a6bf` |
| i013 | Seed an in-memory repository with partial prior overlap and exercise the actual import/history operation. | SAME_ID; new option ID | `7d7e687fcd37544b723f12f983f1aff9723b0b195ce5da8ea0a97f748f7d6402` → `f8027e7a14b12bc356b31ab0c949687582809c550b1e6a6988bc6b44a7bfb16d` |
| i014 | Inject two deterministic provider implementations, then exercise the real factory/switch and stream adapter error path. | SAME_ID; new option ID | `c52233717beb96ca91bdbad978507793ba1e706f2c6456bf56c4467549e09a49` → `dadd8e0aac6d33c3795028faf17d538ba607cdba82403dbcffe91ef1c8c8f685` |
| i015 | Provide controlled availability for both proposed assignments and run the genuine allocation decision. | SAME_ID; new option ID | `a4bbbab24f7c0b0c5ebdff706b294a4289615b753180216b040e171a335cb609` → `ae9e015edbf66704b4b96939cac2b51b28fa37f91957d4e53bf05d28c2f5acf6` |
| i016 | Script the sync transport’s accepted-geometry conflict and exercise the real merge/conflict path. | SAME_ID; new option ID | `a93964f223df01e801e34840a366fb9ab62780e7c1bdf43df46c46310bac04bb` → `809d9dcd47907ec1171e6adf965d1ec7e1c8969323fc55413ade7b303644aef7` |
| i017 | Supply active and closed campaign phases through the collaborator and exercise the actual reward operation in both cases. | SAME_ID; new option ID | `2d7bf1d120516cf4d4be6d569d406909ddb86b7322e79f155c977d4696832054` → `c15680921147795abc9d4a89d488e237e1d927f039860323b237067733df98e9` |
| i018 | Record the carrier adapter call and inspect the actual outbound reassignment payload without contacting the carrier. | SAME_ID; new option ID | `97f129c8c9e927b034944d844d9a479b3c284bf3fadcac200a84c969b9bc185d` → `a4e79cac666b976c12251bcd1d7e8964d6e78abbcf72ad01aaa8d0315a1cbc95` |

## Required correction and limits

The key choices repeatedly combine the seam with additional execution/assertion instructions already present in the stems. This distinction appears across otherwise valid cases, so the form signal is systematic rather than an isolated longer technical phrase. Revise the accepted choice text in all 18 items to retain the actual boundary and controlled input, while removing repeated test-run/reporting prose. Keep all currently correct decisions, question IDs, fresh accepted-option IDs, wrong alternatives, and diagnostics unless a specific wording change requires its aligned diagnostic to change. No choice-count or equal-length rule follows from this finding.

The constraint wording also repeats the typo “live the” (for example, “The test must not use the live the fleet service”). Correct it as editorial cleanup during the bounded revision; it does not change the decision. Item i009 additionally mentions a role-expiry factor that is not used by the key; removing or clarifying that unused detail is optional unless the author intends it to be decisive.

This is a unit-level semantic/identity review only. It does not accept the other 306 N08/N09 objects, their cross-unit identity map, producer implementation, runtime, admission, or any broader BIZQ-01 scope.
