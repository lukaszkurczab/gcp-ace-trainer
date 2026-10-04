# N07-B08 correction v2

Ready for independent bounded re-review; this is not semantic acceptance.

- Proposal SHA-256: `4d7c1657a4a8746ed0c12bbe8636a409b03a781894659c2b00f9b512c854e2e0`
- Frozen v1 input SHA-256: `03261f032a56acf2a523096d8cfc40746f319abbd8288dbab7e1b4ae5071ae0a`
- Manifest SHA-256: `07b9663946f5de9587434e9a3bd5836f71fa70dec772bfced94524ab3fc4fc01`
- Checker: PASS, 18 whole objects and 90 original/reversed option evaluations; 9/72 wrong-option messages changed.
- Correct option identities changed only for i001 and i009, whose keyed decisions changed. All QIDs are retained because each still tests persistence outcome handling under the same unit objective; independent identity review is pending.

Every second constraint now states a case fact instead of the answer policy. Reasons and scenarioApplication explain the failure boundary and case outcome. The two changed retry cases now test distinct states: i001 binds an operation ID to its original payload and rejects changed-payload reuse; i009 recognizes a persisted Running experiment and reports status without launching another worker. i006 distinguishes request queue acknowledgement from a terminal referral decision. i017 explicitly gives the provider’s status-feed-by-reference contract, while explicitly withholding any repeat-send deduplication guarantee. No external exactly-once or atomic-provider behavior is inferred.

| Question | Prior keyed decision | Current keyed decision |
|---|---|---|
| ood-n07-b08-i001 | Use that operation ID as a durable unique key and return the already recorded release result on retry. | Bind each operation ID to its first payload; reject reuse with a changed amount. |
| ood-n07-b08-i002 | Return the validation error and allow the corrected command as a new attempt; no persisted mutation needs replay protection for the rejected request. | Return the validation error; process corrected input as a new command. |
| ood-n07-b08-i003 | Use the expected revision in the write condition and return a conflict with the current revision when it no longer matches. | Use the expected revision in the write and report a conflict if it no longer matches. |
| ood-n07-b08-i004 | Record a pending notification in the same database transaction as the notice, then dispatch it and let receivers deduplicate by notice ID. | Commit the notice and dispatch intent together, then let the worker publish. |
| ood-n07-b08-i005 | Enforce the non-overlap rule at the persisted reservation boundary so concurrent writes cannot both commit as available. | Enforce the overlap rule at the shared write boundary, not with a process-local precheck. |
| ood-n07-b08-i006 | Persist a pending referral operation and reconcile it with the remote status before marking it accepted or rejected. | Keep the referral pending until a terminal remote outcome is confirmed. |
| ood-n07-b08-i007 | Persist each asset’s confirmed result or a resumable progress record, then continue from the first unconfirmed asset. | Persist per-asset confirmation and resume only work not yet confirmed. |
| ood-n07-b08-i008 | Persist the confirmed seven-unit allocation and keep the remaining five units pending under the same request, with vendor attempts separately identified. | Record the seven confirmed units and reconcile the uncertain remainder under the original request. |
| ood-n07-b08-i009 | Persist the run ID with its final result and return that result when the same completed run is retried. | Look up the durable run state and report it as running; do not start another worker. |
| ood-n07-b08-i010 | Store the provider event ID with the applied transition and recognize a repeated ID before applying it again. | Persist the provider event ID with the transition and recognize a duplicate delivery. |
| ood-n07-b08-i011 | Attach a monotonically changing lease token to the claim and accept completion only for the current token. | Accept completion only when its lease token is still current. |
| ood-n07-b08-i012 | Perform the balance update and allocation insert in one local transaction. | Commit the balance update and allocation row in one local transaction. |
| ood-n07-b08-i013 | Return the cancellation result without writing; a retry requires a new explicit user command. | Return the known cancellation result without creating a seal record. |
| ood-n07-b08-i014 | Store the settlement snapshot ID and policy revision with the payout calculation result. | Retain the settlement snapshot and policy revision used for the calculation. |
| ood-n07-b08-i015 | Validate both submitted values and persist them in one transaction before marking the listing visible. | Validate both values and commit them before the listing becomes visible. |
| ood-n07-b08-i016 | Upsert by the stable provider asset key and preserve the existing archive asset identity on repeat import. | Upsert by provider asset key while retaining the archive asset identity. |
| ood-n07-b08-i017 | Keep delivery status unresolved and reconcile the provider using the notice ID before retrying or marking delivered. | Keep delivery unresolved and consult the provider status feed by its request reference before retrying. |
| ood-n07-b08-i018 | Persist the cancellation operation identity and result so the retry can return the committed cancellation outcome. | Return the already committed cancellation outcome for the same command ID. |

Mechanical verification does not establish semantic correctness. The frozen independent review remains unchanged; this revision awaits bounded re-review. No source, producer, catalog, proof, consumer, runtime, queue, or admission files were changed.
