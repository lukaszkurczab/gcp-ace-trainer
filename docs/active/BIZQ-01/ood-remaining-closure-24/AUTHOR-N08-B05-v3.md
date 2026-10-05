# N08-B05 v3 author correction

- Previous snapshot SHA-256: `8958fb3508390873dcafadc02beabfbb33cbd1f8209c9fb2b3cae99ff3984a93` (proposals/N08-B05-v2.json)
- Current proposal SHA-256: `ba8349e503dcfe6e6c58ef7cb1af63b312d2b8239c4ef0813f14716dede97677` (proposals/N08-B05-v3.json)
- Frozen source binding SHA-256: `9ed4fbc42e1526372553053432cdb1b91de22a78b5547a20647f0571c6fa5910` (../patternly-content/content/object-oriented-design-interview/concurrency_thread_safety_resources_and_failure_handling/OOD-N08-B05.json)
- Scope: ood-n08-b05-i011 only.
- Mechanical checks are recorded separately; this is author rationale, not independent semantic acceptance.

## ood-n08-b05-i011

- Objective: Preserve the collection-level completion identity and stored score policy on retry.
- Decisive visible fact: Learner plus exercise revision identify the completion; the record stores the score policy used.
- Nearest alternative: Including policy in the key makes a policy change look like a separate completion.
- Changed condition and rationale: Only scenarioApplication now aligns with the already accepted two-field identity and stored policy; no decision or option meaning changed.
- Identity: preserve_question_and_answer_meaning.
- Changed fields: `feedback.details.scenarioApplication`.
- References: Fictional case contract stated in prompt; no external claim.
- Before whole-object SHA-256: `ceaf35e7024820eb65d6b5e64303d412d7df0e7851b2f49f65125427ebf150d9`; current: `fa4fee67d19f2a4d7588fc1e38296060a5f3c19f355657b32a64156c0f41a9de`.
