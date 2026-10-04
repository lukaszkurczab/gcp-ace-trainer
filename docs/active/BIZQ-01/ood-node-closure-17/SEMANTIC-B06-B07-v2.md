# Independent semantic review — OOD N02 B06 v2 and B07 v3

**Verdict: B06 PASS; B07 REVISE (two object-level explanation defects).** The review is bound to the exact frozen inputs:

- `REVIEWED-B06-v2.json`, SHA-256 `46ba770ef4ebeb58c0f4a7e0dc312afb89c4d5efd17474612276276b6975249b` (19 items).
- `REVIEWED-B07-v3.json`, SHA-256 `fb538f857c66018ead26aa651669fb8ca63999c083a368dc2ced88d2c0b47238` (19 items).

For B06, only i025, i036, and i038 differ from v1; I reread those complete objects and reuse the prior PASS evidence for the 16 byte-identical objects. For B07, all 19 Details objects changed, so I read all whole questions and all explanations; the six primary-decision corrections are i022, i024, i027, i028, i037, and i038. This is proposal semantic review, not source admission, learner-pool reachability, or runtime acceptance.

I apply the actual-object standard in BIZQ-01 §4.1 and docs/07 §§4.1, 4.4, and Choice-item contract: one defensible single-choice answer from visible facts, plausible alternatives, accurate ID-bound diagnostics, and Details that teach the case mechanism. Shared unit concepts and repeated case types are acceptable when the decisive decision differs; I do not impose a prose or concept-count quota.

## B06 — entity identity, equality, and hash keys

The three changed questions now preserve their stated identity contracts. The prior duplicates and explanation contradictions are resolved. The new i025 question is a distinct equality/hash decision from accepted N01 B03 i029: both use a CaptionSession and provider-configuration changes, but N01 asks which domain identity survives those changes; B06 i025 asks that separately loaded objects with one immutable ID compare equal and derive the hash from the same fields. Its HashSet premise makes the equality/hash rule visible. B06 i036 distinguishes delivery retry of one issue from corrected reissue with a new linked issue ID; its Details and wrong-option messages preserve that distinction. B06 i038 now says address correction creates a new label record and explains why equal address/rendered content does not merge its label ID.

| Item | Verdict | Evidence |
|---|---|---|
| B06 i020 | PASS (reused) | Exact unchanged object from v1. Grant ID is the stated identity across role/expiry changes; other candidates are explicitly ruled out by separate grants and record history. |
| B06 i021 | PASS (reused) | Exact unchanged object. Multiple seals may reference one immutable revision; the seal ID still distinguishes separately retained seals. This is not N01 B04 i030’s signer-rejection transition. |
| B06 i022 | PASS (reused) | Exact unchanged object. A fixed payout ID identifies retry of the same payout; equal amount alone cannot merge different sellers’ payouts. |
| B06 i023 | PASS (reused) | Exact unchanged object. The prompt explicitly retains original and superseding notices even with equal time/platform, so notice ID is the record identity. |
| B06 i024 | PASS (reused) | Exact unchanged object. Multiple reservations may share a meter, and reservation identity persists through interval correction/cancellation. |
| B06 i025 | PASS | The updated prompt explicitly states same immutable session ID means one logical session across loaded instances while provider history/settings may differ. The key uses the same immutable ID for equality and hashing; every distractor violates either stated identity or the equality/hash contract. The objective remains broad but accurate: it names stable session identity across provider configuration history. |
| B06 i026 | PASS (reused) | Exact unchanged object. Two distinct assignment records remain separate as occupants change; volunteer identity is not assignment identity. |
| B06 i027 | PASS (reused) | Exact unchanged object. Separate identical-geometry submissions remain independently reviewable; content equality cannot replace edit identity. |
| B06 i028 | PASS (reused) | Exact unchanged object. A saved reward claim resolves the same character after quest progress changes; this is distinct from N01 B02 i027’s eligibility result. |
| B06 i029 | PASS (reused) | Exact unchanged object. Shipment identity survives carrier reassignment; the carrier is a separate reference. |
| B06 i030 | PASS (reused) | Exact unchanged object. Independently reversible allocations need distinct allocation identity even with equal account/amount values. |
| B06 i031 | PASS (reused) | Exact unchanged object. Match ID persists through state changes; an event hash identifies a transition rather than the continuing match. |
| B06 i032 | PASS (reused) | Exact unchanged object. Battery serial identifies the physical item while inspection classification changes. |
| B06 i033 | PASS (reused) | Exact unchanged object. Two byte-identical executions remain separately auditable by run ID. |
| B06 i034 | PASS (reused) | Exact unchanged object. Separate comments with equal text/revision remain separate records because author/creation history and comment ID matter. |
| B06 i035 | PASS (reused) | Exact unchanged object. Delivery retries retain the same submission ID; status and content are not the submission’s identity. |
| B06 i036 | PASS | The new text explicitly says a delivery retry repeats the issue ID while corrected reissue creates a new linked issue. Reason, all four distractor messages, and Details consistently preserve that boundary; the old contradiction is gone. |
| B06 i037 | PASS (reused) | Exact unchanged object. Badge ID separates an old revoked badge from its person and replacement badge. |
| B06 i038 | PASS | The prompt explicitly makes a corrected reprint a new record and allows distinct labels to share an address. Key, Reason, all option messages, and Details consistently use label ID and explain why content equality cannot merge print history. |

## B07 — construction-time invariants versus changing operation checks

The six primary-decision repairs are supported by their visible facts and differ from the closest accepted N01 or B06 peers. In particular, i022 tests the completed score’s local numeric invariant rather than N01 B03 i021’s revision/policy association; i024 tests duplicate mapping destinations rather than N01 B02 i018’s missing mapping and no-partial-replacement result; i027 uses the settled order’s final amount/currency rather than payout retry identity; i028 now states an inclusive nondecreasing route-time rule and an acceptance-time reload/recheck; and i038 tests requiring a succeeded run’s terminal output, distinct from N01 B02 i032’s missing code-version provenance. The i026 factory-input versus signer-rejection distinction is covered by the separate whole-object adjudication `ADJUDICATION-B07-i026.md`; I find no duplicate blocker there.

The previous repeated generic Details have been replaced across all 19 items. The new Details generally name the actual local invariant, apply its facts, diagnose the tempting alternative, state a bounded consequence, and provide a case-relevant transfer rule. Two remaining statements fail that standard:

1. **i023 scenarioApplication is factually reversed.** It says “an empty constructor cannot create the partial record described by the rejected option.” But the rejected option is specifically to expose a public empty constructor and set fields later; that is exactly how a partial record can be created. The same object’s option-specific message correctly says the public empty constructor permits a partially attributed exception. Rewrite the scenarioApplication so it does not deny the distractor’s stated behavior and instead explains how the accepted-evidence factory keeps the created record complete.
2. **i037 local4 feedback is stale and false for the current option.** The current option says to put “refund pending” in the condition category even though it is not an inspection category. Its message still says “Changing submitted category later violates its stated fixed report value,” but the prompt expressly limits categories and separates refund eligibility; it never says a submitted category is immutable. Bind the message to the actual error: a downstream refund outcome is not an allowed inspection category and mixes two distinct decisions.

| Item | Verdict | Evidence and nearest comparison |
|---|---|---|
| B07 i020 | PASS | Required IDs are local request facts; assignment exclusivity can change and is checked at commit. Details explicitly explains the stale-read race and limits request validity to field presence. |
| B07 i021 | PASS | Patient, specialty, and consent-reference are required durable referral facts; current send authorization is rechecked at the external action. This is distinct from N01 B04 i025’s already-revoked send request. |
| B07 i022 | PASS | The repaired decision is integer score in inclusive 0–100 with zero valid; clamping changes the scorer’s result. This differs from N01 B03 i021, which associates a completion with exact exercise and scoring-policy revisions. New Details correctly explain the local numeric invariant. |
| B07 i023 | **REVISE** | Keyed fields/evidence and alternatives are supported, but Details.scenarioApplication says an empty public constructor cannot create a partial record even though the targeted distractor expressly can. |
| B07 i024 | PASS | Completeness is given; the corrected decision is injective mapping of distinct old segment IDs to distinct destination IDs. This differs from N01 B02 i018, which tests a missing target and whether partial replacement activation is allowed. Details make completeness versus duplicate destination explicit. |
| B07 i025 | PASS | Grant ID, approval reference, and expiry after grant time are local creation invariants; current approver authority is stated as checked beforehand. Feedback and Details distinguish supplied record facts from external authorization. |
| B07 i026 | PASS | The whole-object adjudication compares the factory’s immutable revision input with N01 B04 i030’s post-rejection legal state. The decision boundary and action differ; shared version context is reinforcement, not a duplicate. The revised Details explain the mutable-pointer risk and bound creation versus signing success. |
| B07 i027 | PASS | Payout amount/currency copy from the settled order’s final values; the option feedback rejects mutable draft/catalog values. Distinct from N01 B02 i021’s already-paid retry outcome and B06 i022’s payout identity. |
| B07 i028 | PASS | The predicate is now explicitly `newTime >= latestAcceptedTime`, equality is allowed, and the prompt places the same check in the acceptance transaction after reload. This is near accepted N01 B04 i032’s event-history ordering case, but adds a visible equality boundary and a mutable latest-time race that determine the factory/acceptance split. Details and messages match that inclusive rule. |
| B07 i029 | PASS | `start < end` is local to the interval; overlap depends on current shared schedule and is checked at commit. The two checks and alternatives are supported. |
| B07 i030 | PASS | Candidate config requires both language and timing compatibility and preserves the stream-facing error contract. Details correctly says this does not guarantee reachability or switch success; distinct from provider identity and handover questions. |
| B07 i031 | PASS | Distinct assignment IDs are local; mutable skills/availability are rechecked at execution. Details correctly distinguishes a valid request from later eligibility. |
| B07 i032 | PASS | Captured parent revision retains an offline branch for later conflict review without overwriting current geometry. The prompt supports that ancestry and acceptance boundary. |
| B07 i033 | PASS | Claim creation requires a prior eligible result tied to the campaign revision; this is a construction premise, not N01 B02 i027’s result for an incomplete quest. Details do not let construction manufacture eligibility. |
| B07 i034 | PASS | Both temperature compatibility and custody acknowledgement are required before reassignment. Each alternative omits or substitutes one of the explicit facts; Details are case-specific. |
| B07 i035 | PASS | The amount is validated against the supplied balance snapshot, then mutable current balance is rechecked at posting. It is not the N01 B02 i029 command-level over-balance outcome. |
| B07 i036 | PASS | A forfeit decision requires active state and elapsed timeout, then checks state again at commit. N01 B02 i030 asks the outcome for an already finalized match without correction authority; this item adds the time predicate and stale-decision boundary. Details and all messages match that distinction. |
| B07 i037 | **REVISE** | The current wrong option is refund vocabulary in an inspection-category field. Its message instead claims submitted categories are immutable, which is not a prompt fact. The accepted category-set/later-policy decision is otherwise supported. It is close to N01 B02 i031’s “record classification without deciding refund” outcome, but the v3 item additionally tests category membership at construction; the remaining finding is the stale option message, not a duplicate verdict. |
| B07 i038 | PASS | The factory requires succeeded state plus terminal output and keeps failed-run diagnostics separate. This differs from accepted N01 B02 i032’s missing code-version provenance decision; the new alternatives and Details explain the execution-state/output boundary. |

## Minimum correction and limits

Correct only the B07 i023 scenarioApplication contradiction and B07 i037 local4 diagnostic, then re-review those exact whole objects. Reuse the applicable prior PASS evidence for unchanged B06 objects; do not infer cohort/source/runtime acceptance from this report. I made no proposal, source, verifier, proof, or test changes.
