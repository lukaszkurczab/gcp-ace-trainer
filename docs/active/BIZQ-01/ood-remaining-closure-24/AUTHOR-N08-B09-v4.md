# N08-B09 v4 author notes

This additive revision preserves the frozen v3 proposal and all 18 question IDs, correct option IDs, and wrong-option IDs. It removes the explicit same-ID result rule from each stem while retaining the scenario facts needed to distinguish one retry from another valid operation. Each option set now states competing retry policies at comparable decision granularity, with case-specific consequences and feedback keyed to the unchanged option identities.

The accepted decision remains operation-scoped retry identity: reconcile the same operation under its ID, while a distinct later operation remains separate. The three wrong meanings also remain unchanged: assign a fresh ID per attempt, deduplicate too broadly by resource, or infer rejection from a missing acknowledgement. No exactly-once transport guarantee is added; i014 remains about traceably reissuing a rejected invoice and avoiding a duplicate charge while an outcome is unresolved.

All rewritten prompts, answer text, Reason, scenario application, wrong-option text, and exact target feedback are recorded per question in AUTHOR-N08-B09-v4.json. The unchanged source references are retained as existing context references, not evidence for an external transport guarantee. Prior input: proposals/N08-B09-v3.json.
