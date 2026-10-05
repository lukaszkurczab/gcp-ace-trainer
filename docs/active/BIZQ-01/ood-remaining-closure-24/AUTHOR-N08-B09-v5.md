# N08-B09 v5 author notes

This additive v5 proposal replaces the 18 N08-B09 questions after the independent identity adjudication. The actual before objects ask where a retry/idempotency invariant belongs in the enforcing object boundary. The authored questions instead ask which operation identity recovers an uncertain retry while distinguishing a later operation. That is a primary-decision change, so every item uses its manifest-reserved i019–i036 question ID. All four option IDs per replacement were refreshed, the correct option ID was changed in the answer object, and each wrong-option feedback target was retargeted.

The v5 choice sets use case-specific complete retry policies: a fresh identity per retry, a resource-scoped identity, and a timeout-as-rejection/compensation policy. Their adverse consequences are explained in Reason, Details, and option-targeted feedback rather than appended to the option text. The supported N08-B09-i014 retry facet remains intact: finance reconciles the stable issue ID before a corrected reissue and avoids charging the same issue twice. The case does not assert an exactly-once transport guarantee.

| Before question | Replacement question | Identity action |
|---|---|---|
| ood-n08-b09-i001 | ood-n08-b09-i019 | replace_question_with_new_id |
| ood-n08-b09-i002 | ood-n08-b09-i020 | replace_question_with_new_id |
| ood-n08-b09-i003 | ood-n08-b09-i021 | replace_question_with_new_id |
| ood-n08-b09-i004 | ood-n08-b09-i022 | replace_question_with_new_id |
| ood-n08-b09-i005 | ood-n08-b09-i023 | replace_question_with_new_id |
| ood-n08-b09-i006 | ood-n08-b09-i024 | replace_question_with_new_id |
| ood-n08-b09-i007 | ood-n08-b09-i025 | replace_question_with_new_id |
| ood-n08-b09-i008 | ood-n08-b09-i026 | replace_question_with_new_id |
| ood-n08-b09-i009 | ood-n08-b09-i027 | replace_question_with_new_id |
| ood-n08-b09-i010 | ood-n08-b09-i028 | replace_question_with_new_id |
| ood-n08-b09-i011 | ood-n08-b09-i029 | replace_question_with_new_id |
| ood-n08-b09-i012 | ood-n08-b09-i030 | replace_question_with_new_id |
| ood-n08-b09-i013 | ood-n08-b09-i031 | replace_question_with_new_id |
| ood-n08-b09-i014 | ood-n08-b09-i032 | replace_question_with_new_id |
| ood-n08-b09-i015 | ood-n08-b09-i033 | replace_question_with_new_id |
| ood-n08-b09-i016 | ood-n08-b09-i034 | replace_question_with_new_id |
| ood-n08-b09-i017 | ood-n08-b09-i035 | replace_question_with_new_id |
| ood-n08-b09-i018 | ood-n08-b09-i036 | replace_question_with_new_id |

The JSON notes bind each before whole-object hash from the fixed manifest to the current proposal hash, record the visible case facts and nearest alternative, and explain the identity decision item by item. The immutable v4 proposal remains at proposals/N08-B09-v4.json (SHA-256 9e0251f2010279f88ca52d7e0e039dafae7f342ebd02152294c89662c973df71). The v5 proposal SHA-256 is 7068f9df47d5576317266e3e549574a4145307cfe211c6df2335b4fdb213032a. The Node 22 producer validation/scoring receipt is AUTHOR-N08-B09-v5-CHECKS.json; it verifies structure, score outcomes, reversed-option scoring, and feedback target binding only. It is not semantic acceptance.
