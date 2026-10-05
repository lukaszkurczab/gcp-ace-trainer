# N08-B03 v3 author correction

- Previous snapshot SHA-256: `0cb7df8cfb1c70ba4bfe488e3a657e5bd308602ec928a75df7757ac793e3788b` (proposals/N08-B03-v2.json)
- Current proposal SHA-256: `74ac35a41d3045172ee281c0aa6819a4fc275b627ee7882ee1d981bb85e6d4a1` (proposals/N08-B03-v3.json)
- Frozen source binding SHA-256: `f5d4bddc1bff1672949c81722bb919e15ed204a923a86726e9aae1a4b0969d41` (../patternly-content/content/object-oriented-design-interview/concurrency_thread_safety_resources_and_failure_handling/OOD-N08-B03.json)
- Scope: ood-n08-b03-i002 only.
- Mechanical checks are recorded separately; this is author rationale, not independent semantic acceptance.

## ood-n08-b03-i002

- Objective: Commit related approval fields atomically and resolve a retry to the same committed approval.
- Decisive visible fact: Each submission carries a stable request ID reused on retry; the retry after commit must return the existing approval with its exception and required control evidence.
- Nearest alternative: A status-first or client-display workflow can expose partial state and cannot resolve a retry to the committed approval.
- Changed condition and rationale: The visible request-identity fact and accepted operation now cover the already stated no-duplicate retry condition; the correct option meaning changes and receives a fresh stable ID.
- Identity: preserve_question_id_new_correct_option_id.
- Changed fields: `prompt`, `interaction.options[0].optionId`, `interaction.options[0].text`, `answer.optionId`, `feedback.reason`, `feedback.details.scenarioApplication`, `feedback.details.errorCorrection`, `feedback.details.boundaryOrTradeoff`, `feedback.details.transfer`, `feedback.messages[*]`.
- References: Fictional case contract stated in revised prompt; no external exactly-once or transport claim.
- Before whole-object SHA-256: `2ff49c6dfdef3d597189788f095ffda1020b8bb31ef129bc35e20375247d22da`; current: `711a1d010986715db4eccbf49e505f3e876c479bc0d129b8d72fee46cc6466bc`.
