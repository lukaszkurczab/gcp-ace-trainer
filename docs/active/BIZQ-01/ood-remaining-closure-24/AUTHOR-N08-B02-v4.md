# N08-B02 v4 author correction

- Previous snapshot SHA-256: `de9bb542883a708eb7f64cc5c2eabdf4dbe1ccd3c4a052a952cfd69753b0f7c7` (proposals/N08-B02-v3.json)
- Current proposal SHA-256: `33c0cbc1cd355618a5b55f2cd423e6f66a7014ce61b08fa9cf7fb317f6f09fe8` (proposals/N08-B02-v4.json)
- Frozen source binding SHA-256: `1db1cf0b1c16746d2899fadd9dd2afdfb2d40e3fc945e220a79404b0883efba8` (../patternly-content/content/object-oriented-design-interview/concurrency_thread_safety_resources_and_failure_handling/OOD-N08-B02.json)
- Scope: ood-n08-b02-i011, ood-n08-b02-i013, ood-n08-b02-i015 only.
- Mechanical checks are recorded separately; this is author rationale, not independent semantic acceptance.

## ood-n08-b02-i011

- Objective: Keep the accepted inspection evidence intact while refund review consumes it.
- Decisive visible fact: Inspection condition and evidence must remain the description of what was inspected.
- Nearest alternative: Replacing the inspection with a refund-only summary would discard both condition and evidence.
- Changed condition and rationale: The closest alternative now violates the stated fact-preservation requirement instead of merely choosing a different read-only representation.
- Identity: preserve_question_and_answer_meaning.
- Changed fields: `interaction.options[3].optionId`, `interaction.options[3].text`, `feedback.messages[target refund_replaces_inspection_record_11_v4]`, `feedback.reason`, `feedback.details.errorCorrection`.
- References: Fictional case contract stated in prompt; no external claim.
- Before whole-object SHA-256: `c618f42cb398c667f2414215b33a61650c3052003f5a149e087f88b109a46250`; current: `c0d070473f73bf4d60886d73cb6f5e6363bf2a7473c9084de364ef1a9cdcae70`.

## ood-n08-b02-i013

- Objective: Bind each notification to the accepted comment it describes.
- Decisive visible fact: Notification can be delayed or retried, but it must describe the same accepted comment and preserve its author and revision.
- Nearest alternative: Sending before acceptance can publish a comment that the workspace rejects.
- Changed condition and rationale: The queue-before-acceptance alternative is replaced with a direct violation of the accepted-comment association already stated in the case.
- Identity: preserve_question_and_answer_meaning.
- Changed fields: `interaction.options[3].optionId`, `interaction.options[3].text`, `feedback.messages[target notify_before_comment_acceptance_13_v4]`, `feedback.reason`, `feedback.details.errorCorrection`, `feedback.details.boundaryOrTradeoff`.
- References: Fictional case contract stated in prompt; no external claim.
- Before whole-object SHA-256: `2a5b0cf66d02592b2e6513f7c0014994f261e39aae7ea033bc97cdc9edcc8866`; current: `f9a0021f9893dd6a239d1a9e61dcbe6bb83ae04e726b9c207f045c2d07a62f06`.

## ood-n08-b02-i015

- Objective: Attach an exchange response to the exact invoice copy that was submitted.
- Decisive visible fact: A late response may arrive after a corrected issue begins; each result must attach to the matching submitted copy.
- Nearest alternative: A seller-only key conflates the original and corrected copies when a response arrives late.
- Changed condition and rationale: A global-queue policy that could preserve associations is replaced by a seller-only key that loses copy identity under the visible late-response condition.
- Identity: preserve_question_and_answer_meaning.
- Changed fields: `interaction.options[2].optionId`, `interaction.options[2].text`, `feedback.messages[target seller_only_response_key_15_v4]`, `feedback.reason`, `feedback.details.errorCorrection`, `feedback.details.boundaryOrTradeoff`.
- References: Fictional case contract stated in prompt; no external claim.
- Before whole-object SHA-256: `a2bbfc39bb7d37ef7c81c81464f3a5264b9884e089d7f2b18de7e64488e0de8e`; current: `18472d1fdec475865325877720448a13f0dc51c26cb4920f23ab4b0bb54fa461`.
