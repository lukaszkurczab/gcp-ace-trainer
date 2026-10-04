# N07-B07 Details correction v3

Ready for independent bounded re-review; not semantic acceptance.

- Proposal SHA-256: `a1594042e5fd1cbba6767f9941b87fb7975b964e02a2f6b99a99a5ed98d9de7d`
- Frozen v2 input SHA-256: `090f086b76bfc91d7d03ef6fbaec5b27a3cc1b1a53b7bdef38e1ecfd2a1d2ca1`
- Existing checker: PASS, 18 questions and 90 original/reversed option evaluations.
- Serialized diff: exactly 36 fields, the two specified Details fields for each question. Prompts, constraints, options, keys, IDs, Reasons, other feedback fields, and source references are unchanged.

The two Details fields now add mechanism-level explanation and a case-specific consequence rather than repeating the Reason.

| Question | Mechanism/property | Scenario application |
|---|---|---|
| ood-n07-b07-i001 | A read projection can calculate an aggregate without materializing the related entities. | The 40 station rows need a count; the screen never transfers reservation records. |
| ood-n07-b07-i002 | A page boundary limits the root records whose related values belong in the response. | Only gardeners for the 25 returned plots need to be present in this page. |
| ood-n07-b07-i003 | Aggregate queries return measures without creating annotation objects or loading their fields. | The archive report receives count and latest time, not annotation text or profile data. |
| ood-n07-b07-i004 | Deferred relationship access is unsafe when serialization occurs outside the read scope. | Approver names are already present in each exported row when the transaction closes. |
| ood-n07-b07-i005 | A bounded child collection can be materialized when the caller consumes all of it. | The selected title view displays all 12 current grants and their expiry dates. |
| ood-n07-b07-i006 | Separating list and detail shapes avoids carrying large payloads for unselected rows. | The fleet report keeps each aircraft’s date; notes arrive only after selection. |
| ood-n07-b07-i007 | A projection can include one required related scalar without traversing unrelated relationships. | Clinic capacity appears without retrieving referral or medical-note records. |
| ood-n07-b07-i008 | Batching related values keeps read count independent of the number of parent rows. | The 30 owner names fit in the single related-data read allowed for this refresh. |
| ood-n07-b07-i009 | A bounded page can fetch related labels in a fixed read budget rather than per-row. | Adding assignments to a page does not add database round trips for their skill labels. |
| ood-n07-b07-i010 | List and detail queries can select different columns according to their callers. | The large log is absent from search rows and fetched only for an opened result. |
| ood-n07-b07-i011 | Evidence needed for a decision must be available before the bounded read scope ends. | The inspection photos and history are accessible while the inspector submits the decision. |
| ood-n07-b07-i012 | A result projection avoids loading fields that belong to a later user action. | Search rows carry notice ID, effective time, and platform; body text stays on the notice page. |
| ood-n07-b07-i013 | An edit query can load current values without traversing historical versions. | The form edits current metadata and leaves rendition history unopened. |
| ood-n07-b07-i014 | A selected-principal boundary limits which grants and expiry values the query needs. | Only that principal’s at-most-ten active grants appear in the detail response. |
| ood-n07-b07-i015 | Summary reads can aggregate component information before any component collection is needed. | Search returns bundle count and price; component records wait for bundle selection. |
| ood-n07-b07-i016 | Metadata can identify a revision without transferring its content bytes. | The row displays revision number and seal time; bytes download only after selection. |
| ood-n07-b07-i017 | Grouped totals answer a summary caller without materializing the detail rows behind them. | Settlement-window totals appear on the dashboard; payout rows stay in seller detail. |
| ood-n07-b07-i018 | A bounded recent page and a separate history query serve different read scopes. | The account operation uses balance plus 12 recent allocations, not lifetime history. |

Mechanical checking does not establish semantic correctness. Frozen v2 review inputs remain unchanged; this correction awaits independent review. No source, proof, producer, catalog, consumer, runtime, queue, or admission files were changed.
