# Independent semantic review — OOD N02 B06 and B07 v1

**Verdict: REVISE both units.** I read the full frozen proposals, including the visible prompt, learning objective, keyed answer, every distractor and its option-ID feedback, Reason, and all Details fields. I compared them with the current accepted N01 source objects and the other N02 proposals. The reviewed inputs match the requested hashes:

- `REVIEWED-B06-v1.json`, SHA-256 `a104020732eb3f49c80759b67ff9d17a8f36818238cfe6a6195adc85e8029e4f` (19 objects).
- `REVIEWED-B07-v2.json`, SHA-256 `bd5c5c15eab63b832c29c8e53ab53eafb3a5c8389748545a5562c9c51ab5ec3b` (19 objects).

I treat distinct examples under one unit principle as legitimate practice. I do not require 19 unrelated concepts, unique prose, or a word-count threshold. The findings below identify concrete duplicate primary decisions, unsupported premises, and false feedback statements.

## B06 — entity identity, equality, and hash keys

The stable-ID key is supported by the facts in most prompts. The cases add meaningful discriminators—same-valued but independently reversible allocations, identical run output, separate comments, or retry versus reissue—so a repeated unit principle alone is not a defect. Three issues block this batch:

1. B06 i025 is materially the accepted N01 B03 i029 decision: a caption session keeps one session ID while provider endpoint/language/timing configuration changes and provider changes are recorded. Both ask whether provider configuration changes replace the session identity. The N02 replacement needs a different primary decision.
2. B06 i036 correctly distinguishes retry from corrected reissue in the prompt and key, but its Details then says the same issue ID stays attached “through delivery retry versus corrected reissue.” The prompt says a corrected reissue gets a new ID. This mechanism and scenarioApplication contradict the keyed answer’s own distinction; rewrite those fields and the targeted explanation around “retry reuses, reissue creates.”
3. B06 i038 says a label ID stays attached through address changes, while the prompt says a reprint after address correction is a new record. The stable-ID principle is correct, but the explanation incorrectly carries one label’s identity across the event that creates the new label.

The repeated mechanism/scenarioApplication/transfer wording across B06 is an optional quality concern, not a separate blocker by itself: the cases are within one identity unit and have distinct disambiguating facts. Make each explanation transfer the relevant trap (for example, non-unique parent versus retry identity) instead of merely substituting the entity name.

| Item | Item-level verdict | Evidence and nearest comparison |
|---|---|---|
| B06 i020 | PASS | Grant ID survives role/expiry correction, and the prompt says one approval can issue multiple grants. The key and four alternatives address the actual identity candidates. N01 B03 i018 also retains a clearance ID as territory/expiry change, but it asks a domain-identity/value decision rather than equality/hash behavior; this is close reinforcement, not the same task. |
| B06 i021 | PASS | Multiple seal records may cover one immutable revision, so digest equality would merge distinct seals; signer correction also does not replace the seal. N01 B04 i030 tests the legal result after signer rejection, not the seal’s identity key. |
| B06 i022 | PASS | The fixed payout ID resolves retries; same-amount payouts remain distinct. This is a useful identity case with an idempotency consequence. It is distinct from N01’s payout state-transition questions. |
| B06 i023 | PASS | The audit explicitly retains original and superseding notices even if time/platform match. N01 B04 i032 focuses on event order and appending a correction; B06 asks how separate notice records compare. |
| B06 i024 | PASS | Reservation ID remains stable through interval correction/cancellation while one meter may have several reservations. The competing meter-only and interval keys are falsified by visible facts. |
| B06 i025 | **REVISE** | Exact primary-decision duplicate of accepted N01 B03 i029 (caption session ID persists through provider configuration changes and history). Replace the new item’s decision, not merely its option wording. |
| B06 i026 | PASS | The prompt explicitly keeps two assignment records while swapping occupants. Assignment ID versus volunteer ID is a genuine assignment-versus-person identity distinction. |
| B06 i027 | PASS | Two identical-geometry submissions remain separately reviewable; the edit ID prevents content deduplication from erasing authorship/history. |
| B06 i028 | PASS | A saved reward claim must still resolve the same character after quest progress changes. This is distinct from the claim-eligibility outcome in N01 B02 i027 and B08 i038. |
| B06 i029 | PASS | Shipment ID remains stable across carrier reassignment; a carrier index is a separate lookup. N01 B04 i018 preserves a customer request through vendor splitting, but tests allocation and fulfillment state rather than key equality. |
| B06 i030 | PASS | Equal account/amount allocations must remain separately reversible, so an allocation ID is necessary. N01 B03 i034 models transaction/value allocation across loans; B06’s independently reversible allocation records are a distinct key decision. |
| B06 i031 | PASS | Match ID remains stable across state transitions while an event hash denotes one transition. N01 B04 i032 concerns ordering transit notices, not equality of a continuing match. |
| B06 i032 | PASS | The serial number tracks the physical item while inspection category changes. This distinguishes physical identity from a revisable classification. |
| B06 i033 | PASS | Run ID keeps two byte-identical executions auditable as separate runs. N01 B02 i032 tests a publication failure when a pinned code revision is missing; it does not ask whether equal outputs merge run identity. |
| B06 i034 | PASS | Two comments with same text/revision remain separately visible and one author may submit several; comment ID supports that. The prompt could state edit continuity more explicitly, but the answer does not depend on it. |
| B06 i035 | PASS | Submission ID remains fixed across queue/retry/acknowledgement and the retries target the same submission. The diagnostics accurately reject status/content keys. |
| B06 i036 | **REVISE** | Key correctly says retry reuses an issue ID and a corrected reissue receives a new ID, but Details falsely extends the existing identity through reissue. Update the mechanism, scenarioApplication, and correction so they preserve the distinction the prompt defines. |
| B06 i037 | PASS | Badge ID distinguishes an old revoked badge from its person and replacement badge; revocation changes status but does not erase the badge record. |
| B06 i038 | **REVISE** | Prompt says address correction produces a new print record; Details claims one label ID survives address change. Align the explanation with the new-record boundary (and explain why address equality does not merge print records). |

## B07 — construction-time invariants versus changing operation checks

Most questions correctly distinguish local facts that make a request/value valid from external state that can change before an operation commits. The keyed choices generally follow the prompt. The batch still needs these concrete corrections:

- B07 i022 duplicates accepted N01 B03 i021: both ask to retain the exact exercise revision and scoring-policy version associated with a completed attempt. The new “what should construction require?” framing does not create a different primary decision.
- B07 i024 duplicates accepted N01 B02 i018: both use an incomplete stable-segment annotation mapping to prohibit partial replacement activation and retain the current recording until mapping is complete.
- B07 i026 overlaps accepted N01 B04 i030 on binding a notary seal to the exact immutable revision/digest. N01 asks the rejection outcome; B07 asks the factory reference, but both center the same exact-revision-before-seal decision. Replace the new item with a different constructor/operation-boundary problem.
- B07 i027 duplicates the newly proposed B06 i022 primary decision: both require the same payout key to resolve retries to the same payout. B07 adds a settled-order precondition, but the answer’s decisive mechanism remains stable retry identity. Change the new decision or make the task materially about a different construction boundary.
- B07 i028’s prompt permits an effective time equal to the latest accepted notice (`not earlier`), but the keyed answer requires a strictly later time. Also, the prompt puts a route-wide latest-notice check in construction without saying the check and acceptance are serialized or rechecked; a newer notice could be accepted after construction. The minimum correction is to make the predicate non-strict and state where the route-order check is atomic/rechecked.
- B07 i037’s wrong-option feedback says the report category is a “stated fixed report value,” but the prompt only restricts construction to a listed category and excludes refund eligibility. It does not say the category is immutable after submission. The key is supported; replace that distractor/diagnosis or add a necessary visible immutability premise.
- B07 i038 duplicates accepted N01 B02 i032: both require exact immutable dataset/code references before publishing a research result. The B07 factory wording does not make the primary decision distinct.

The five-field Details pattern is repeated almost verbatim across all 19 B07 items (“creation contract is limited to facts available and stable…” and “For this in…”), and the transfer field is identical. Several specific applications are accurate, but this formula is not a case-level explanation and becomes false or overbroad for mutable external facts such as B07 i028’s latest accepted route notice. Rewrite Details to explain each object’s actual local invariant, which fact is external/dynamic, and its exact check boundary. This is a cohortwide explanation blocker, not a request for 19 unrelated principles.

| Item | Item-level verdict | Evidence and nearest comparison |
|---|---|---|
| B07 i020 | PASS | Battery serial and aircraft ID are stable request inputs; assignment exclusivity can change and is checked at commit. The operation boundary is visible. |
| B07 i021 | PASS | Patient/specialty/consent-reference are required to construct the referral, while a fresh send authorization is a separate check. This differs from N01 B04 i025, which tests the blocked send after consent revocation. |
| B07 i022 | **REVISE** | Same completed-attempt revision/policy association as accepted N01 B03 i021. Replace the primary learner decision, not only the phase label. |
| B07 i023 | PASS | The exception’s named approver/scope/reference are local record facts; the separate approval operation supplies evidence. N01 B05 i033 distinguishes exception approval from order authorization, which is a terminology decision rather than this construction boundary. |
| B07 i024 | **REVISE** | Same incomplete annotation mapping/no partial recording activation as accepted N01 B02 i018. Replace with a non-duplicate creation invariant. |
| B07 i025 | PASS | The grant’s ID, approval reference, and expiry ordering are local creation requirements; approver authorization is stated to have been checked beforehand. |
| B07 i026 | **REVISE** | Near-exact accepted N01 B04 i030 seal/revision boundary. The new item’s key is clear, but its primary decision is already represented. |
| B07 i027 | **REVISE** | Same stable payout key/retry idempotency decision as proposed B06 i022. The settled-order fact is a valid precondition but does not change the primary answer. |
| B07 i028 | **REVISE** | Strict `later` conflicts with permitted equality; route-wide latest state may change between construction and acceptance. Use `not earlier` and make the operation boundary explicit. |
| B07 i029 | PASS | The interval’s `start < end` is local, while schedule overlap can change and must be checked at commit. The two checks and reversal condition are explicit. |
| B07 i030 | PASS | Provider language/timing compatibility and the preserved public error contract are visible configuration requirements; this differs from B06 i025’s session identity question. The generic Details still needs case-specific repair as part of the cohortwide blocker. |
| B07 i031 | PASS | Distinct assignment IDs are fixed request validity; current skills/availability are rechecked at execution. No unsupported validity claim found. |
| B07 i032 | PASS | Parent revision is captured so a stale edit remains a branch; acceptance later compares it and does not overwrite newer geometry. Distinct from B06 i027’s edit-record identity. |
| B07 i033 | PASS with near-neighbor note | Campaign revision-bound reward eligibility is explicit. N01 B02 i027 tests a failed claim result for an incomplete quest; B06 i028 tests character identity. Those are related campaign examples but ask different decisions. |
| B07 i034 | PASS | Temperature capability and custody acknowledgement are separately required before reassignment; each distractor omits or fabricates one visible fact. |
| B07 i035 | PASS | Positive amount and supplied-balance-snapshot checks belong to the proposed allocation; current balance is rechecked at posting. N01 B02 i029 asks whether to reject a single over-balance command, not where the snapshot/current checks belong. |
| B07 i036 | PASS | Active status and elapsed timeout are checked for the decision, then match state is rechecked at commit. This is distinct from B06 i031’s match identity/hash key. |
| B07 i037 | **REVISE** | The option that makes category mutable is not contradicted by the stated “listed category” constraint; its feedback invents immutability. Replace that option/diagnosis or make immutability a visible premise. |
| B07 i038 | **REVISE** | Exact dataset/code revision provenance is already the key decision in accepted N01 B02 i032. Replace this item’s primary decision. |

## Minimum coherent correction

Keep the sound local-versus-dynamic check split in B07 i020, i021, i023, i025, i029–i036. Change the duplicate primary decisions B06 i025 and B07 i022/i024/i027/i038; treat B07 i026 as a near-neighbor per the addendum; correct B06 i036/i038 explanation contradictions; correct B07 i028’s strictness and route-state check boundary; and repair B07 i037’s unsupported immutability diagnosis. Then update B06/B07 Details to connect the mechanism to each scenario’s specific fact and nearest error rather than repeating the cohort template. Preserve all accepted N01 objects exactly. This review is semantic only; the root’s reported shape/scoring passes do not establish these content fixes.

## Addendum — 2026-10-04 comparison correction

After a direct comparison of the full stems and keyed actions, I withdraw the B07 i026 duplicate-decision blocker. Accepted N01 B04 i030 asks for the legal state after a signer rejects a seal; proposed B07 i026 asks which revision reference the seal factory must receive before an editable document can change. Both use the exact immutable revision invariant, but the learner decisions occur at different lifecycle boundaries and call for different actions. Treat i026 as a near-neighbor / legitimate reinforcement, not as a duplicate. This does not clear B07 overall: the independent i022, i024, i028, i037, and i038 findings and the case-specific Details concern remain as recorded above. No B07 proposal object was changed by this addendum.
