# N07-B08 Details correction v3

Ready for independent bounded re-review; not semantic acceptance.

- Proposal SHA-256: `493b6658598afb8199ff392eaf682906dce27ef68ba74dadd159e13eb27d6030`
- Frozen v2 input SHA-256: `4d7c1657a4a8746ed0c12bbe8636a409b03a781894659c2b00f9b512c854e2e0`
- Existing checker: PASS, 18 questions and 90 original/reversed option evaluations.
- Serialized diff: exactly 36 fields, the two specified Details fields for each question. Prompts, constraints, options, keys, IDs, Reasons, other feedback fields, and source references are unchanged.

The two Details fields now add mechanism-level explanation and a case-specific consequence rather than repeating the Reason.

| Question | Mechanism/property | Scenario application |
|---|---|---|
| ood-n07-b08-i001 | An idempotency key names a command payload; storing its fingerprint distinguishes a retry from key reuse. | Operation op-428 remains tied to $80; the changed $95 request cannot silently claim that identity. |
| ood-n07-b08-i002 | A validation failure before persistence has no stored state to reconcile. | The corrected price can be evaluated as a fresh command because the rejected input never mutated storage. |
| ood-n07-b08-i003 | An expected revision is a compare-before-write condition for concurrent edits. | The edit based on revision 18 cannot replace the geometry already accepted as revision 19. |
| ood-n07-b08-i004 | A transactional outbox stores local intent so dispatch can resume after a process interruption. | The notice remains committed with dispatch intent even if the worker stops before publishing. |
| ood-n07-b08-i005 | Concurrent requests must coordinate at the shared persistence boundary after their reads race. | Only one overlapping meter reservation can commit even though both requests saw availability. |
| ood-n07-b08-i006 | A queued acknowledgement describes request receipt, not completion of remote business processing. | The referral remains pending until the specialist system reports its terminal decision. |
| ood-n07-b08-i007 | Per-item checkpoints distinguish confirmed effects from work that still needs resumption. | Confirmed assets are skipped on resume while unconfirmed assets remain eligible for processing. |
| ood-n07-b08-i008 | A partial outcome can be recorded without misclassifying an uncertain external remainder. | The original request keeps its seven confirmed units while the five-unit outcome is reconciled. |
| ood-n07-b08-i009 | A durable operation state distinguishes in-progress work from completed and newly requested work. | Run R-63 is reported as running after restart, without starting another execution. |
| ood-n07-b08-i010 | A delivery identifier scopes deduplication more narrowly than the recipient identity. | A repeated provider event is acknowledged once while later grants for the same principal remain distinct. |
| ood-n07-b08-i011 | A changing lease token fences completion from a worker whose claim has expired. | The first worker’s late result cannot complete the reminder under the second worker’s lease. |
| ood-n07-b08-i012 | A database transaction keeps related local writes within one commit boundary. | The balance and allocation row cannot become visible independently. |
| ood-n07-b08-i013 | Failure-stage knowledge determines whether a write outcome is uncertain or known absent. | The canceled seal attempt has no persisted record because execution stopped before the call. |
| ood-n07-b08-i014 | Persisting input revisions preserves the lineage needed to reproduce a historical calculation. | Review can retrieve the settlement snapshot and policy version used for the original payout amount. |
| ood-n07-b08-i015 | A transaction can couple validation, storage, and visibility for values sharing one local consistency rule. | A listing becomes visible only with the accepted price and stock combination. |
| ood-n07-b08-i016 | A stable external key maps repeated deliveries to one persisted identity. | The second batch updates descriptive fields on the existing archive asset. |
| ood-n07-b08-i017 | A status query can resolve uncertainty only through a capability the provider actually exposes. | The notice stays pending until the feed reports status for its request reference; resend safety is not assumed. |
| ood-n07-b08-i018 | A committed terminal command can resolve a repeated request from its stored outcome. | The reservation stays canceled and the same cancellation command returns its original result. |

Mechanical checking does not establish semantic correctness. Frozen v2 review inputs remain unchanged; this correction awaits independent review. No source, proof, producer, catalog, consumer, runtime, queue, or admission files were changed.
