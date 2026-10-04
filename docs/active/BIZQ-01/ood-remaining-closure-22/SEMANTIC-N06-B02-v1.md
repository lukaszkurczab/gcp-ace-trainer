# Independent semantic review — N06-B02 v1

**Verdict: REVISE.** This report binds to frozen `review-inputs/N06-B02-v1.json` (SHA-256 `4821f373e08c36feb7e066f7abe532aac0bb26ec11ce63e9824f83d82e178dd8`) and the frozen unit notes (`a3f388cafe3fd9cb7754c75e07a5f183f2f5d08548807c60e6ae6772e0fd782a`). I compared all 18 complete before/current objects, including every prompt, option, keyed answer, Reason, five Details fields, option-ID feedback, and source reference. The root’s 18/72 structural/scoring result is evidence for format and scoring only, not semantic acceptance.

The State-pattern objective is retained and the current vignettes make lifecycle facts much more concrete. Most current keys, causal explanations, and wrong-option feedback align with their visible scenarios. The blocking findings are bounded:

1. **The proposed question-ID replacements do not meet the existing identity rule.** All 18 old questions explicitly target the State pattern and their accepted key says to represent legal state-dependent operations as explicit states/transitions. All 18 current items still ask that same primary decision and use the State pattern; the vignettes and answer text now supply meaningful case facts, but the core accepted meaning has not changed. The author notes themselves describe the meaning as retained while labeling the action `replace_question_with_new_id`. Under the fixed N06 contract, these are repairs under `i001`–`i018`, not genuine primary-semantic/archetype changes that justify `i019`–`i036`. Preserve the original question IDs; keep distinct option IDs where the specific option meaning actually changed. Do not treat unused candidates as a replacement quota.

2. **`i019` supports state-specific behavior at the lifecycle owner, but not the stronger claim that separate State objects are required.** The visible contract covers one `transmit` operation across a received/consented referral, so an owner-local status conditional or transition table can enforce the same preservation-versus-handoff behavior. The existing State-pattern objective may remain; align the key and Details to explicit owner-local state-machine enforcement, or add visible multi-operation facts that justify separate state objects. Do not treat owner-local enforcement as invalid merely because it does not use separate State classes.

3. **`i021` relies on an unlisted `archived` stage.** The prompt enumerates received, under-review, and decided states, then says a repeated archive request returns the existing result. The key and scenario application require an archived state, which the learner was not given. Add that stage to the visible lifecycle or revise the key so it does not introduce it in feedback.

4. **`i025` names retries but does not establish the outcome after successful check-in.** The prompt says clients retry the same check-in endpoint, but describes only confirmed check-in and released rejection. It does not say whether a retry from `checked in` returns the existing result, rejects, or does something else; the keyed answer’s `checked in` behavior is likewise absent. Specify that result or remove retries as a decisive premise.

I did not find a stale cross-scenario explanation or wrong-ID feedback target in this frozen batch. The stage-specific transitions and distractor diagnoses generally match the current prompts; `i019`, `i021`, and `i025` are the content exceptions above. The current items reuse the same general State-pattern principle, which is legitimate practice for this unit; I am not imposing a unique-concept-per-item rule.

**Option-shape advisory:** the frozen console warning receipt flags the correct option as sole-longest in 15 B02 items (`i019`–`i021`, `i023`–`i027`, `i029`–`i031`, `i033`–`i036`). This count is not an automatic gate. Looking at the actual alternatives, the key often gives a complete multi-stage policy while each distractor is shorter and violates one obvious condition. That repeated “most complete option wins” shape can reveal the key without comparing the State-pattern tradeoff, so revise the affected alternatives qualitatively: keep realistic competing policies and make their decisive failure clear, without adding filler or enforcing equal word counts. The three unflagged items do not need padding.

The identity findings and `i019`/`i021`/`i025` conditions are tied to the fixed N06 contract and BIZQ-01 §§4.1, 4.3, 4.4, and 5C. This review does not accept source activation, producer migration, consumer/admission, native execution, the full N06 cohort, or full BIZQ-01.

| Existing item | Proposed item | Finding |
| --- | --- | --- |
| `ood-n06-b02-i001` | `ood-n06-b02-i019` | Same State-pattern decision; preserve the old question ID. The case supports owner-local state-machine enforcement, but does not justify requiring separate State objects. |
| `ood-n06-b02-i002` | `ood-n06-b02-i020` | Same State-pattern decision; preserve the old question ID. Three operations across three stages make the mechanism choice concrete. |
| `ood-n06-b02-i003` | `ood-n06-b02-i021` | Preserve the old question ID. Add `archived` to the listed lifecycle before relying on an archived-state repeat result. |
| `ood-n06-b02-i004` | `ood-n06-b02-i022` | Same State-pattern decision; preserve the old question ID. Cancellation versus unchanged published asset is coherent. |
| `ood-n06-b02-i005` | `ood-n06-b02-i023` | Same State-pattern decision; preserve the old question ID. Renew/reactivate distinction and expired eligibility check are explicit. |
| `ood-n06-b02-i006` | `ood-n06-b02-i024` | Same State-pattern decision; preserve the old question ID. The station’s no-status-read boundary makes the owner decision meaningful. |
| `ood-n06-b02-i007` | `ood-n06-b02-i025` | Preserve the old question ID. State the retry result after successful check-in; current prompt does not decide it. |
| `ood-n06-b02-i008` | `ood-n06-b02-i026` | Same State-pattern decision; preserve the old question ID. Response/reopen stage rules and shared API are coherent. |
| `ood-n06-b02-i009` | `ood-n06-b02-i027` | Same State-pattern decision; preserve the old question ID. Three distinct cancellation outcomes make the current state relevant. |
| `ood-n06-b02-i010` | `ood-n06-b02-i028` | Same State-pattern decision; preserve the old question ID. Multiple operations and the irreversible signed state support the choice. |
| `ood-n06-b02-i011` | `ood-n06-b02-i029` | Same State-pattern decision; preserve the old question ID. Approval, decline, capture, and repeated result are visible. |
| `ood-n06-b02-i012` | `ood-n06-b02-i030` | Same State-pattern decision; preserve the old question ID. Overdue return and returned-state receipt are distinct, supported outcomes. |
| `ood-n06-b02-i013` | `ood-n06-b02-i031` | Same State-pattern decision; preserve the old question ID. Lifecycle permissions are distinct from the explicitly separate role check. |
| `ood-n06-b02-i014` | `ood-n06-b02-i032` | Same State-pattern decision; preserve the old question ID. Multiple callers and stage-specific build operations support an object-owned rule. |
| `ood-n06-b02-i015` | `ood-n06-b02-i033` | Same State-pattern decision; preserve the old question ID. Carrier acceptance is a stated handoff boundary; Details correctly disclaims carrier outcome guarantees. |
| `ood-n06-b02-i016` | `ood-n06-b02-i034` | Same State-pattern decision; preserve the old question ID. Seat prerequisite, waitlist offer, and withdrawal are visible and distinct. |
| `ood-n06-b02-i017` | `ood-n06-b02-i035` | Same State-pattern decision; preserve the old question ID. Receipt-before-refund and stored repeat result are visible. |
| `ood-n06-b02-i018` | `ood-n06-b02-i036` | Same State-pattern decision; preserve the old question ID. Live-hold prerequisite and terminal cancellation behavior are visible. |
