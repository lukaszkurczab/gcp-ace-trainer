# Independent semantic review — OOD-N01-B03

## Verdict

**FAIL — the frozen current proposal does not yet meet the source-quality contract.** This is a semantic content finding, separate from the independent schema/scoring check. Review is bound to [REVIEWED-B03-v3.json](./REVIEWED-B03-v3.json), SHA-256 `ab9ca9a6cc0d5436fc3dc8b6756a7574051699e4ee032d3689084c1b1008f35d`.

The item mapping and intended unit are coherent: the 17 replacements cover the old B03 positions and ask learners to classify identity-bearing concepts, descriptive values, and operations that span concepts. The visible scenarios usually supply the premises needed to reach one answer. However, three objects have answer/options copied from unrelated concepts, and several stable-ID wrong-option messages diagnose a different distractor than the one they target. Those are direct violations of BIZQ-01 §§4.1, 4.3, 4.4 and Q05; they are not style preferences.

## Findings requiring correction

| Item | Finding and minimum correction |
|---|---|
| `ood-n01-b03-i025` | The prompt is about notary seals and immutable revision digests, but the keyed option says to keep an amendable exception request; the remaining options describe an exception request and an approval coordinator. No option answers the seal question, so the keyed choice is false in this scenario. Re-author this item's options, key, and targeted feedback around distinct seal records versus the immutable revision they reference. |
| `ood-n01-b03-i029` | The prompt is about a caption-stream session and replaceable provider configuration. All three options and the key describe payouts and money. The keyed answer does not answer the prompt. Re-author the complete option/key/feedback set for the stream-session decision. |
| `ood-n01-b03-i032` | The prompt is about versioned campaign rules, claims, and captured point bundles. Its options and key describe caption-stream sessions and provider settings. No option answers the prompt. Re-author the complete option/key/feedback set for the rules/claim decision. |
| `ood-n01-b03-i022` | The feedback bound to option `b03_i022_b` discusses recorded outcomes versus mutable service state, which is the `c` distractor. Feedback bound to `b03_i022_c` says replacing a value loses amendment history, which is the `b` distractor. Swap or rewrite these two targeted messages so each diagnoses its own option. |
| `ood-n01-b03-i018` | Feedback for `b03_i018_c` says equal descriptive fields do not make separately auditable approvals the same approval; that diagnoses option `b`'s identity-by-fields choice, while option `c` discards retained approval records for a stateless calculation. Target `c` feedback to the lost-record/history error. |
| `ood-n01-b03-i019` | Feedback for `b03_i019_c` says a changing, nonunique charge measurement cannot identify a battery, which diagnoses option `b`'s charge-as-identity error. Option `c` instead creates an immutable battery/value for each reading; explain the broken physical-battery continuity. |
| `ood-n01-b03-i020` | Feedback for `b03_i020_c` says a specialty code cannot identify a referral or consent history, which diagnoses option `b`. Option `c` flattens the independently identified referral and revocable consent into a recreated tuple; target feedback to that lost independent history. |
| `ood-n01-b03-i027` | Feedback for `b03_i027_c` explains overwriting platform/time notices, which addresses option `b`; option `c` instead mistakes a downstream passenger notification for the controller's accepted domain notice. Correct the `c` message to explain that boundary. |
| `ood-n01-b03-i028` | Feedback for `b03_i028_c` explains why two customers' equal intervals can remain separate reservations, which addresses merging reservations in option `b`. Option `c` makes textual formatting define interval identity. Explain why equivalent start/end instants remain the same value despite different formatting. |
| `ood-n01-b03-i030` | Feedback for `b03_i030_c` says a display name does not own availability, but option `c` proposes inheritance between assignments. Explain that a temporary relationship between assignments is not a subtype relationship. |
| `ood-n01-b03-i033` | Feedback for `b03_i033_c` says a temperature range does not define a carrier subtype, which addresses option `b`. Option `c` instead confuses carrier name with shipment identity. Explain why shipment history remains under shipment identity when carrier choices change. |
| `ood-n01-b03-i034` | Feedback for `b03_i034_c` says equal amounts can be distinct payments, which addresses option `b`. Option `c` puts allocation in currency despite needing several current account balances. Explain why the value has no access to that multi-account decision context. |
| `ood-n01-b03-i026` | Feedback for `b03_i026_c` discusses why equal amounts cannot distinguish payouts, which diagnoses option `b`. Option `c` discards the release request after sending; target feedback to loss of the payout record and lifecycle. |

The wrong-option feedback issue is broader than the rows above: for several valid objects the second message targets a misconception from the other distractor, or only partly explains the targeted choice. Because BIZQ-01 §4.4 and Q05 require diagnostic feedback to be bound to the selected wrong option ID, review every B/C message pair in this fixed batch when making the focused corrections; do not merely swap all messages mechanically.

The same unsupported phrase appears in all 17 `scenarioApplication` details: “the caller can follow the stated recovery or follow-up path.” These prompts do not state recovery or follow-up paths. Remove that assertion or replace it with a scenario-specific application sentence; the rest of each scenario application is generally aligned with the prompt. This is a small but systematic accuracy issue under §4.4.

## Per-item review

| Item | Semantic result |
|---|---|
| `i018` | Clear entity/value distinction: clearance identity and audit continuity persist while territory and expiry change. The visible facts select the keyed answer. |
| `i019` | Clear battery identity versus changing, possibly equal charge measurements. The alternatives test plausible identity/value confusions. |
| `i020` | Clear independent referral and consent histories versus a shared specialty code. The facts distinguish the records and the value. |
| `i021` | Clear historical association to the exact exercise revision and scoring-policy version. A reused title cannot resolve either reference. |
| `i022` | The request/decision model follows the stated amendment and audit history, but its two wrong-option messages are attached to the opposite misconception; see required correction above. |
| `i023` | The prompt supports annotation identity and stable-segment reference while text remains editable. The competing text-identity and byte-offset choices are recognizable errors. |
| `i024` | The grant's own ID, expiry, and approval reference distinguish it from a reusable role label. The key is supported by the prompt. |
| `i025` | Fail: all options are about request/approval concepts, not seals or immutable signed revisions. |
| `i026` | Clear payout lifecycle identity versus currency/amount value. Both distractors reflect recognizable mistakes about using amounts or transient request objects as identity. |
| `i027` | The notice ID and retained supersession history make the notice an entity; platform/time are descriptive. The answer is supported, but option C's message addresses B instead. |
| `i028` | Independent cancellation requires reservation identity; normalized interval endpoints define value equality. The answer is supported, but option C's message addresses B instead. |
| `i029` | Fail: all options are about payout identity and amount, not a caption session or provider configuration. |
| `i030` | The swap decision needs facts from both assignments, so a cross-assignment domain operation is a distinct objective from entity/value classification. Option C's feedback misses its inheritance misconception. |
| `i031` | Edit identity and parent revision preserve proposal lineage while geometry remains editable content. The alternatives address mutable geometry and lost edit history. |
| `i032` | Fail: all options are about stream sessions and provider settings, not rule versions, claims, or point bundles. |
| `i033` | The prompt expressly makes shipment and carrier independent identities and says the choice compares both with a value band; the cross-concept operation is uniquely supported. Option C's feedback addresses option B instead. |
| `i034` | The transaction ID preserves the repayment event, amount is value data, and allocation requires account-state facts across accounts. Option C's feedback addresses option B instead. |

## Distinctness, sources, and limits

The B03 objective is distinct from accepted B01's actor/goal/subject modeling and B05's vocabulary selection. The reviewed B02 outcomes ask what a caller should observe; B03 asks what concepts have identity/value or where a multi-concept decision belongs. A few contexts recur (meter reservations, caption-provider changes, signing), but the intended decisions differ: for example, B02's meter collision is a no-move caller outcome, while B03's meter item distinguishes reservation identity from normalized interval equality. This is not a duplicate by itself; the broken option content in `i025`, `i029`, and `i032` prevents counting those items as distinct, usable decisions until repaired.

The referenced Microsoft DDD material defines entities in terms of identity, continuity, and persistence over time and value objects as concepts without conceptual identity, supporting the core distinctions in the valid B03 prompts ([Microsoft Learn: Designing a microservice domain model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model)). The prompts themselves supply the operational facts; I do not treat scenario premises as universal guarantees or the UML reference as proof of these DDD classifications. The operation answers in `i030`, `i033`, and `i034` are scenario-derived placements of decisions whose required facts span separate concepts.

I checked all 17 frozen objects, including prompt, key text, all option texts, Reason, five Details fields, and each wrong-option message. There is no consistent longest-correct-option cue: only 6 of 17 correct choices tie or exceed the longest distractor by word count. This review does not certify the other five units, full OOD-N01 closure, runner rendering, source admission, or native eligibility.

## Version history

- `REVIEWED-B03-v1.json`, SHA-256 `0d82fae0cc37a0b1c294eb5fcfd0b45a044530c7e026bd14cf34e0d5affcea56`: **FAIL**. Seven keys pointed to literal `_a` options or cross-contaminated meanings, so the mapped answers were unusable.
- `REVIEWED-B03-v2.json`, SHA-256 `e7a08e132d75f070acf1c698036d38f1179fb33943fd26634c4543099d728093`: the literal-key defect was repaired, but the current whole-object review later found the wrong cross-item content in `i025`, `i029`, and `i032` plus targeted-feedback misalignment.
- `REVIEWED-B03-v3.json` is the reviewed payload and verdict above. The changed mechanism explanations were assessed in all 17 items. The remaining findings are in the actual keyed option/feedback text and cannot be closed by the mechanism edit.
