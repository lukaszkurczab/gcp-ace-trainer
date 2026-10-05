# Independent semantic review: N08-B06 v2

**Verdict: REVISE.** Two items require visible facts that distinguish the key’s extra cancellation or cleanup requirements from another valid contract. Separately, the cohort still has a material complete-key/short-distractor cue under §4.3. Question and accepted-option identities remain stable: each current case tests the same lifecycle-ownership decision instantiated by the old key.

## Frozen inputs and method

- Proposal `review-inputs/N08-B06-v2.json`, SHA-256 `5bb9402840b735f3b5516a0abe927266ef266cf5fbb0e7a1c12b7ec9a2b4ca72`.
- Manifest `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`; original before objects come from the B06 unit’s `beforeQuestion` snapshots.
- Contract `N08-N09-CONTRACT.json`, SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- Canonical BIZQ-01 quality criteria, SHA-256 `c10ce086ecd3b58d7d776a458cb453d0161ac4519ca2474deba952122ceac8a3`.
- Whole-object fingerprints use repository `canonicalJson(question)` and SHA-256; answers are selected by `answer.optionId`, never by array position.
- I read the full prompt, key, all alternatives, targeted messages, Reason, all Details fields, identity and source references for all 18 current and predecessor objects.

## Findings

### Two prompts do not distinguish the keyed extra obligation

For **i007**, the prompt requires buyers not see a candidate before validation commits and says a pre-commit cancellation leaves the prior revision visible. The key adds “discard an uncommitted candidate.” A policy that retains the candidate privately for retry still satisfies every visible requirement and leaves the old revision visible. The question does not state that retention leaks data, consumes a scarce resource, or is otherwise prohibited. The key’s disposal requirement is not uniquely best. Add a visible reason the candidate must be discarded, or remove that unnecessary requirement from the keyed policy and align its diagnosis.

For **i013**, the prompt requires approval remain absent until the external license check completes successfully, and a cancellation before its result leaves the territory unapproved. The key also requires cancellation to propagate to the pending check. Letting that check finish while ignoring its result preserves the stated approval boundary. The prompt does not say the check is cancellable or that continued work is costly or unsafe. State a relevant cancellation/resource condition, or narrow the key to the visible approval boundary. This is a one-best-answer defect under §4.1, not a request for a particular cancellation API.

### The cohort still has a qualitative form cue

Using raw JavaScript string length as a diagnostic, the correct option is strictly longer than every distractor on 17/18 items. That count is not a cutoff. The substantive pattern is that keys typically restate all scenario obligations as a complete multi-part operation policy, while alternatives often state one direct violation at a time. Examples include i001 (shared job, remaining consumers, file disposal), i007 (visibility, successful validation, cancellation), and i018 (file ownership, cleanup, pointer switch); the wrong choices split those obligations into shorter failures. This makes completeness of form a cohort hint even where the prompt supports the policy. Revise a limited number of alternatives into credible competing lifecycle contracts with comparable decision scope, or tighten keys where that preserves required facts. Do not equalize character counts or add filler.

- Strict-longest diagnostic item IDs: i001, i002, i004, i005, i006, i007, i008, i009, i010, i011, i012, i013, i014, i015, i016, i017, i018.

The v2 alternative rewrite improves on generic v1 choices: it names concrete competing policies such as treating a lost response as rejection, publishing before validation, or releasing a hold after commit. Many are plausible case mistakes. That does not remove the repeated complete-key/partial-error contrast across this cohort.

### Identity and nonblocking observations

The 18 question IDs and accepted option IDs remain the same. The original key applied the same rule—keep cancellation, timeout, completion and resource ownership with the operation that can observe its state—across cases. Current keys instantiate that rule with already-visible commit/resource boundaries, so this is continuity of answer meaning rather than an ID reuse for a different answer. Wrong-option IDs were replaced with case-specific IDs, and current messages target those IDs.

The cases’ commit outcomes are generally aligned across prompts, keys, Reason and Details. I found no basis for guarantees beyond the scenario facts. Repeated Details mechanism/transfer text and grammar such as “In A …, A …” are editorial weaknesses, but not separate blockers. Source-array placement is not treated as a learner cue here; the persisted choice-order correction is a separately reviewed runtime concern.

## Per-item binding and disposition

| Item | Decision | Identity | Before → current canonical SHA-256 |
|---|---|---|---|
| ood-n08-b06-i001 | PASS — Detach one caller’s wait; let the shared job finish for remaining consumers and dispose its file at termination. | QID SAME_ID; accepted option SAME_ID | `6804310d49230d39e93b9223b2f11f8edc264144c36924f32ffe7ed676eea636` → `01bdea13d9ea0ed3f22ea19a9496e7702e4a5759083a8648e952207de0e2d7ce` |
| ood-n08-b06-i002 | PASS — Release the temporary slot only on pre-commit cancel or timeout; report the move if commit already occurred. | QID SAME_ID; accepted option SAME_ID | `9c1bc11393ce99c5b49e02e6b0f7c2eceaafeef95092b9bae5552e329ebe394b` → `959c6e649867c1c446ca25ed4a02e900cc40d62f2c26f16a2c1c49dc70a14ba2` |
| ood-n08-b06-i003 | PASS — Let the controller resolve cancellation at dispatch and report removed versus accepted. | QID SAME_ID; accepted option SAME_ID | `8783acd89dcada7c1f40fcd783e79e55ab9121e2dc0e18c1f32dbe91df034974` → `6406b5f7363f4218bcf13d33086f7415f16f80a316dc27e23bdb0bf6924172dc` |
| ood-n08-b06-i004 | PASS — Keep the old catalog visible until publication; after commit report the preserved identity mapping. | QID SAME_ID; accepted option SAME_ID | `f837951777d3eed62dc390883ffba18f42ce6caf2df7044de3ab7ffa269e213b` → `0dd0f96183f089c19961739f7d0598e6a6b7b0cf4a417864c0777089e9bf055b` |
| ood-n08-b06-i005 | PASS — Let export own its temporary file; close and remove it on cancellation while editing continues. | QID SAME_ID; accepted option SAME_ID | `e179fc2eae64ff805035f1389cbcbf56bd38c251df1bb15508440e1dd7a0ad47` → `4c31641042ab598bae92ac09c70df0437e48ebbf60dcc69854277e3e4681406b` |
| ood-n08-b06-i006 | PASS — Return an operation ID with pending/unknown status; let the owner report its committed result when known. | QID SAME_ID; accepted option SAME_ID | `b150dd00bc5512ac2e8cd553db2960bdee8d5ec7b547adb9a76ee4c5aed01bb4` → `f0d6496458ebdfdfb9325d76ae6abea2ec89248ccb72363a9cfdff643c39c555` |
| ood-n08-b06-i007 | REVISE — Keep the prior listing visible until validation succeeds; discard an uncommitted candidate on cancellation. | QID SAME_ID; accepted option SAME_ID | `22e90214f524715d5844b60f3f4a7a48da973f6dc7e04e23ea6c69ae1233e348` → `69f16e8f1a591eaabfe5092df6000d54c4378e10239111f42d06c15413ce039a` |
| ood-n08-b06-i008 | PASS — Wait for both vendor checks; split only after both pass, and stop remaining work on pre-commit failure. | QID SAME_ID; accepted option SAME_ID | `7bc16a2b808c18e4505fd4ef805c6a94b0d066ac10898b735dbfc6a782026ac3` → `23f85ac5b77536a8177ade41b6652415d1dec1cac95011194f66115e2d9265ab` |
| ood-n08-b06-i009 | PASS — Keep the current member until approval commits; release only the transfer’s pending hold on earlier cancellation. | QID SAME_ID; accepted option SAME_ID | `680bb6585e1200a969938b5f097d57bcc18c41ba128a8643761aa82ef206d609` → `2f65d00c28a8bbdfc34391620d59044da80b8c86188a384760868e0423b28216` |
| ood-n08-b06-i010 | PASS — Await pricing and component checks; publish only after all succeed and return their failure. | QID SAME_ID; accepted option SAME_ID | `57dbeeacf9e817fb90ee942c72f81937fd97aed63d228e9ac32994eacc60ad03` → `dc485931993adc75270f5f26e50b5de8d286496285c976e6f04b8e7192927b66` |
| ood-n08-b06-i011 | PASS — Release the pending hold on pre-acceptance cancellation; keep it as the reservation after acceptance. | QID SAME_ID; accepted option SAME_ID | `f9f27eb9d2a913911daf1b017bdc7b47ab5cb368c45307dfb2fdb90c57af1d96` → `845b19d275783484832b7ca75443a1f7464a2efbc0a67b93b060669e0cc10cef` |
| ood-n08-b06-i012 | PASS — Build off the current record; compare-and-replace on success and discard the candidate if canceled first. | QID SAME_ID; accepted option SAME_ID | `174088d9d1709e12ad147d164db11e9e6fe8788b0dc216e5df615e8ce796adfa` → `b06f21bdd80dd72d3e2b52f0da03175c472c414e5173417a3cf5c4bba72e2ec4` |
| ood-n08-b06-i013 | REVISE — Keep approval hidden until the license check succeeds; propagate cancellation to the pending check. | QID SAME_ID; accepted option SAME_ID | `98fd55d7d99c53b064f630d80e7267c804b564f8ec58211cb636c654b03be2a7` → `3ca49a024b362e89c7a1eaf799c92fea104e4b54ddedad1760470c4401d14fa6` |
| ood-n08-b06-i014 | PASS — Keep the current mapping until acceptance; release only this operation’s pending hold if it cancels first. | QID SAME_ID; accepted option SAME_ID | `369ce02bb9dc60201c1b8a59db14d26bde1779c3235d9dd44be1cd605ebef9f5` → `3172f3a07171a4a470ec2ff20f7e34d61a687e733f5cfe5627ee6c36373c9f31` |
| ood-n08-b06-i015 | PASS — Before disclosure honor cancellation; after specialist acknowledgement report the accepted send outcome. | QID SAME_ID; accepted option SAME_ID | `b12f05c13838bf37178bc78e22241301964076e1bc7c6772d3e753f8c1b473c7` → `3ee3a99e5d0232b0e4c4708e8bb53fd2c3877aaffa2970562cca19e0a9ef026a` |
| ood-n08-b06-i016 | PASS — Cancel the learner’s wait separately; bind any eventual result to the task’s captured revision and policy. | QID SAME_ID; accepted option SAME_ID | `6ac41762e3f3f690e3a20a700645ffaf6c297b8cc2bf05218347061c7d992a2d` → `595b657255f37997d3707dcc0dd14ae3c160782ff5f5d7fbd9c40d149518d91c` |
| ood-n08-b06-i017 | PASS — Await the approval result; expose approved only from its committed outcome and keep failure visible. | QID SAME_ID; accepted option SAME_ID | `23284fd82d6bff59832b7be1bd07fa65b7e9429fca2e24ffebdee3aa89bbce70` → `2df125595313999057d6179c410124fd2d315a5c90e8ae8ce54377fc464b2a14` |
| ood-n08-b06-i018 | PASS — Let replacement own the temp file; dispose it on cancellation and switch the pointer only when complete. | QID SAME_ID; accepted option SAME_ID | `c382e1094c9e59230459a6da90309c60e938f08a53778bd57e12d5f2b660ce56` → `ec9a6c9100b54b846f72ea88031280e1862612ab891fab9c269434e405ba037c` |

This is a bounded semantic/identity review of N08-B06 v2. It is not acceptance of other N08/N09 units, the full 324-item map, producer/source activation, runtime/admission, native/Premium, or full BIZQ-01. No proposal or source was edited.
