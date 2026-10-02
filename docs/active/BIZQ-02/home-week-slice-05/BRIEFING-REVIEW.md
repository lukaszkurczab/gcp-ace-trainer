# BIZQ-02 slice05 independent design briefing

Reviewer: existing bizq_brief, gpt-6-luna High (qa_luna); NO TOOLS, supplied Cel/Ustalenia/Podejście only. Full brief and file scope remain in the canonical queue; this document is evidence, not a parallel status plan.

Original approach: REJECTED/redesign; consistency0.93/simplicity0.90/risk0.76/maintainability0.87, minimum0.76. Requirement-linked concern: Home might publish A's answers in profileB after its asynchronous loaders; current-profile scope is not established by the inner Activity fence alone.

Resolution against current repository: exact production nested Home read command AST, real application reads and actual Memory profile router reproduce both A/B and A/B/A after Activity, during loadGoal; unchanged-profile control PASS. Normative docs04 updated before implementation. Extract existing Activity lease fence to application/profileReadFence, capture at Home command entry and assert synchronously immediately before success publication after all awaits. No new storage, revision counter, automatic retry or account behavior.

Revised approach: PASS; consistency0.95/simplicity0.89/risk0.84/maintainability0.90, minimum0.84. Reviewer accepted the bounded common fence and unchanged aggregate ownership. Acceptance must inspect all success sinks, actual profile-router failure cases and existing error routing. AST source pipeline evidence is not React/native SDK proof. Metro HTTP500 remains explicit runtime limitation, not a new artificial gate for bounded source acceptance. Root revised scores0.95/0.90/0.86/0.90 minimum0.86.

A separate repository-reading/code-testing Luna High QA follows; this design briefing does not verify source correctness or runtime readiness.
