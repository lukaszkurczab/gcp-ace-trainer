# Independent semantic review — OOD-N01-B02

**Verdict: FAIL for this reviewed proposal version.** This is a semantic proposal review, not producer admission, consumer acceptance, native runner acceptance, or full BIZQ-01 closure.

## Reviewed bytes and criteria

- Frozen review target: `REVIEWED-B02-v1.json`, SHA-256 `1fc96428cf8703b37242de6ffca4b1fbc9e3d55ed5d021f80a7355e8dbb7db7b`. This freeze includes the visible premise and feedback changes present when it was copied; it is the binding review target regardless of later edits to `PROPOSED-B02.json`.
- Current source: `../patternly-content/content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B02.json`, SHA-256 `bc53d9c2d7fc8b2e0a9274631a361388d0d7ab6760bda056313b6dc52fedccf2`.
- Frozen manifest: `PREFLIGHT-MANIFEST.json`, SHA-256 `0e73411ca847b7b4861f31025d39fa5cee9d982a734294716ec7c9d288df3f16`.
- Independently confirmed: the manifest contains the 17 current B02 source IDs and source-object hashes, and the frozen proposal maps them in order to new IDs i018–i034 (17/17 exact source matches). The old objects' `owner_preserves_contract` answer and shared distractor template are the documented repair leads, not accepted semantic evidence.
- Criteria: BIZQ-01 §4.1 requires one answer determined by visible facts, a reasoned nearest alternative, and a meaningful transfer boundary; §4.3 requires real, comparable misconceptions and removal of systematic answer-length cues; §4.4 requires scenario-grounded Reason/Details and stable-ID diagnostics. The unit scope is the caller-visible happy, alternate, failure, and exceptional outcomes stated in `BRIEFING.md`.

The `sourceRefs` in all 17 proposals point to the official [OMG UML 2.5.1 specification](https://www.omg.org/spec/UML/2.5.1/PDF). It defines a modeling language; it does not establish the scenario-specific atomicity, authorization, idempotency, dispatch, payment, or publication guarantees. I treated those as authored premises only where the prompt states them. I did not infer them from UML.

## Findings

1. **Systematic key-length cue remains across the whole unit.** In 16/17 questions, the correct option is the longest by character count; in 13/17 it is the longest by word count. Examples: i018's key is 142 characters versus a 93-character longest distractor; i020 is 115 versus 62; i029 is 104 versus 59; i034 is 97 versus 60. i025 differs by only five characters, and i019 is nearly tied. Correct positions vary, but the repeated length signal is conspicuous. This fails the explicit BIZQ-01 §4.3 requirement to remove a systematic “longest is correct” cue. Rework answer and distractor content so wrong alternatives remain plausible and comparably concrete; do not impose equal word counts or a numeric cutoff.

2. **i020 and i034 teach the same primary decision.** Both give an external write, timeout after sending, uncertain acknowledgement, a queryable stable key, and a no-duplicate constraint. Both key the same answer: report unknown/pending and query the same key before retrying. The notary/seal and offline-inspection nouns change, but the caller decision and transfer rule do not. Replace one with a materially different outcome contract, not just a different domain wrapper. This is an in-unit near-duplicate against the unit's single-decision quality requirement.

3. **i024 repeats accepted B01 i019's same branch and scenario.** Current accepted `OOD-N01-B01` i019 is already the CaptionStudio live caption-provider switch: it specifies that the current provider remains active if preparation fails and asks for the supervisor-visible success/failure contract. B02 i024 reuses that same domain, provider-preparation failure, and outcome (reject with retryable/startup error while the current stream remains active), narrowed to one branch. This is not a materially distinct B02 learning decision. Preserve accepted B01; replace B02 i024 with a different scenario/outcome contract. This finding is based on comparing current B01 i019, not reopening its prior acceptance.

4. **i027 leaves a plausible command-authority alternative open.** The prompt says reward is claimable after quest completion and that the quest is incomplete, but never says the claim command cannot complete the quest. Option `b02_i027_b` proposes exactly that side effect and is rejected only by the Details assertion that “the reward command is not authorized” to do it. BIZQ-01 §4.1 forbids deciding the answer from a premise introduced only in Details. State in the prompt that claim checks existing quest completion and cannot change quest progress, or replace the alternative with one ruled out by visible facts.

## Per-item assessment

| Item | Assessment of key, nearest wrong option, and feedback |
| --- | --- |
| i018 | **Pass after the frozen prompt revision.** “Only complete replacement revisions; no partial revision becomes active” now supports the rejected replacement key. Option B is a plausible partial-commit mistake; C is a weaker heuristic remap but is tied to the stated stable-ID issue. Error feedback maps to both stable IDs. |
| i019 | **Pass.** Revocation before processing defeats a time-of-submission snapshot; the rejected-grant key and both wrong-option diagnostics follow visible facts. The temporary grant distractor models a fail-open error. |
| i020 | **Revise.** Its timeout/key-reconciliation outcome is sound and the wrong choices represent common retry/acknowledgement errors, but it duplicates i034's primary decision. |
| i021 | **Pass.** A recorded payment under the same stable key supports “already applied”; a new HTTP request does not itself authorize a second payout. The generic-success alternative misses the caller's explicit need to know whether money moved. |
| i022 | **Pass with a weak distractor.** The immutable published-time rule and explicit review requirement support returning both proposals without changing the board. “Let passengers choose” is substantially less plausible than the last-write-wins distractor, but the latter is a credible conflict-resolution mistake and has an explanation. |
| i023 | **Pass after the frozen prompt revision.** “At most one committed window” now makes the collision decisive, and operator consent rules out silently shifting it. The suggestions-versus-reservation boundary is explained. |
| i024 | **Revise.** The key is consistent with the prompt, but it repeats the already accepted B01 i019 caption-provider failure branch and outcome. |
| i025 | **Pass.** The prompt explicitly forbids a half-swap; stale availability at commit supports rejecting the whole exchange. Both partial-update and stale-check distractors are plausible and specifically corrected. |
| i026 | **Pass.** The deleted segment endpoint and requirement to preserve both branches support a first-class conflict result. Timestamp winner and nearest-geometry merge are plausible but unsupported resolution policies. |
| i027 | **Revise.** The missing claim-command authority fact makes option B a reasonable competing model; Details cannot supply that deciding assumption. |
| i028 | **Pass.** The prompt requires both temperature compatibility and custody acknowledgement and explicitly retains current custody until a new carrier accepts. The key and wrong-option feedback match those facts. |
| i029 | **Pass after the frozen prompt revision.** The prompt now states full-amount-or-no-change and reserves excess credit for another command. That makes the atomic rejection decisive; the two wrong outcomes violate those visible constraints. |
| i030 | **Pass.** A terminal result has already advanced the bracket and the command lacks correction authority; “already final” with no second advancement is distinguishable from authorized correction. |
| i031 | **Pass.** Inspection classification is complete while a separate later review owns refund eligibility. The key does not invent the refund decision; both alternatives represent plausible boundary errors. |
| i032 | **Pass.** The snapshot pins code provenance and the requested code version is absent; publishing latest or blanking the reference breaks the visible reproducibility premise. |
| i033 | **Pass.** Comment persistence and notification retry are independently stated. Reporting accepted comment plus pending notification is the only option that neither loses accepted work nor falsely claims delivery. |
| i034 | **Revise.** The unknown-acknowledgement key and stable-key diagnostics fit this prompt, but the primary decision duplicates i020. |

## Feedback, disclosure, and boundaries

No answer is placed in `constraints` (the proposals have none), and prompts do not name the target pattern. Each keyed option is referenced in the answer object; wrong-option messages point to the two active wrong IDs. The answer position varies, so I found no fixed-position cue. The concrete disclosure issue is length, above.

The `mechanismOrProperty` Details sentence is identical in all 17 proposals (“An alternate-path decision is complete only when…”). Each `scenarioApplication` now restates the prompt and then names the keyed outcome; `errorCorrection`, boundary, and transfer are mostly specific. I regard the repeated mechanism sentence as a material quality warning rather than a separate automatic failure: it does not explain whether this item is about atomic rejection, a stable-key retry, or a completed effect with a pending side effect. Rewrite those mechanism lines per decision as part of the required revisions; keep the distinct scenario-grounded corrections and transfer limits.

There is a close but distinguishable pair at i022/i023: both return explicit conflict without silently changing a contested schedule/resource, but i022 protects an already-published effective dispatch decision while i023 protects an exclusive reservation pending operator review. Keep that distinction explicit during the required B03–B08 cross-unit decision review. This report does not assess those future proposals, all 119 items, source admission, rendering, native interactions, or full-area acceptance.

**Minimum correction before accepting this B02 proposal:** resolve i020/i034 and i024's B01 overlap, add the missing visible i027 command boundary, and remove the systematic key-length signal; revise each repeated mechanism sentence to explain its actual outcome mechanism. Then bind a new immutable proposal hash and review only the changed objects plus affected cross-item comparisons. No production source or runtime changes were made.

## Version-specific addendum — newer proposal freeze

The author materially changed option text after the preceding review. I froze and independently assessed those bytes as `REVIEWED-B02-v2.json`, SHA-256 `b7715098eeb3876364f2aeb2018bbd9bacd6efc964669980cac1376efc8d7db6`. **Verdict for v2: FAIL.** This supersedes v1 as the latest reviewed proposal but does not alter the v1 finding record above.

Eight items now have the literal learner-visible text `_a` on the option whose ID remains designated by `answer.optionId`: i018, i020, i022, i023, i026, i029, i032, and i034. In each, another option contains the previously keyed correct response, but the answer still points to the `_a` placeholder. The wrong-option feedback also retains the prior mapping and now diagnoses the newly moved correct response as wrong. Examples: i018 `b02_i018_a` is `_a`, while `b02_i018_b` says to reject and keep the current recording; i020 `b02_i020_a` is `_a`, while `b02_i020_b` says to query the existing signing request; i029 `b02_i029_a` is `_a`, while `b02_i029_b` says to reject without posting. The same mismatch is present in all eight listed IDs. This directly breaks correct-answer identity and option-specific feedback; schema/scoring shape alone cannot accept it.

The other nine items have non-placeholder keyed text. In those nine, seven keys are longest by character count; do not infer that the full v2 length cue is repaired while eight key texts remain placeholders. Re-evaluate option plausibility and relative specificity across all 17 after the keyed text and feedback are restored. The duplicated outcome remains between i020 and i034, i024 still overlaps accepted B01 i019, and i027 still lacks the visible command-authority premise noted above. i018/i023/i029's earlier missing premises remain corrected in this freeze.

Minimum v2 repair is to restore/author meaningful text on all eight keyed options, then set the correct IDs and wrong-option feedback to match the actual meanings. Re-evaluate the length cue and resolve the retained duplicate/ambiguity findings. This review does not accept later mutable proposal bytes; any further review must name a new exact hash.
