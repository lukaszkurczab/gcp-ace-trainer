# N07-B07 correction v2

Ready for independent bounded re-review; not semantic acceptance.

- Proposal SHA-256: `090f086b76bfc91d7d03ef6fbaec5b27a3cc1b1a53b7bdef38e1ecfd2a1d2ca1`
- Frozen v1 input SHA-256: `85c578e041b4b25b45f5e55173baa71cc5a8eff1afa2b3b1fbf0c5bacd8124bd`
- Manifest SHA-256: `07b9663946f5de9587434e9a3bd5836f71fa70dec772bfced94524ab3fc4fc01`
- Checker: PASS, 18 whole objects and 90 original/reversed option evaluations. 54/72 wrong-option messages differ from frozen v1 because the repeated answer-revealing suffix was removed; unaffected case-specific diagnoses remain byte-identical.
- Identity: all 18 QIDs and accepted option IDs are preserved.

The second constraint in each item now gives a case fact rather than its chosen query plan. The Reasons explain why that caller’s fields/scope matter; scenarioApplication describes what the response consumes. i008, i009, and i014 state fictional, case-specific two-read budgets, making their formerly viable per-row lookup alternatives violate a visible request contract. These premises are scenario facts, not claims about Patternly’s actual datastore or universal ORM guidance. The other alternatives retain their case-specific misconception diagnoses without the repeated contract sentence.

| Question | Prior keyed decision | Current keyed decision |
|---|---|---|
| ood-n07-b07-i001 | Return a station projection with the count computed in the query; load reservation details only on a station-specific view. | Project each station with its active-reservation count. |
| ood-n07-b07-i002 | Page the plots and fetch the gardener data for those page IDs in one bounded query, or project the needed name in the page query. | Fetch gardener names for only the 25 plots in the requested page. |
| ood-n07-b07-i003 | Use a grouped projection for count and latest time; fetch annotations only in the episode review screen. | Group by episode to return annotation count and latest time. |
| ood-n07-b07-i004 | Load the approver data in the export query or project the name before the read transaction ends. | Return approver names before the bounded read transaction closes. |
| ood-n07-b07-i005 | Load the bounded grant set with the title for this detail query. | Load the title and its capped grant set with expiries for this detail view. |
| ood-n07-b07-i006 | Project the replacement date into the report and load service notes only for the selected aircraft. | Project the next replacement date; read service notes after an aircraft is selected. |
| ood-n07-b07-i007 | Project clinic identity and capacity in the directory query without loading referral or note relationships. | Project clinic identity and capacity without referral or patient-note data. |
| ood-n07-b07-i008 | Load the selected meter page and batch the owner names for those meter IDs. | Fetch owner names in one batch for the 30 meter IDs. |
| ood-n07-b07-i009 | Fetch the shift’s assignment page and batch the required skill labels for those volunteer IDs. | Fetch skill labels for the assignment page in one scoped read. |
| ood-n07-b07-i010 | Return the list projection without execution logs; load the selected result’s commit and log in a separate detail query. | Project list fields and load the large execution log on result detail. |
| ood-n07-b07-i011 | Load the bounded photos and classification history with the selected return for this decision workflow. | Load the selected return’s photos and classification history before its decision. |
| ood-n07-b07-i012 | Project the three list fields and leave notice text to the selected notice detail query. | Project notice ID, effective time, and platform for search results. |
| ood-n07-b07-i013 | Load the asset’s current metadata for editing and query rendition history only if the archivist opens it. | Load current metadata for editing; query rendition history only when opened. |
| ood-n07-b07-i014 | Query the selected principal’s active grants with expiry data in the detail request. | Fetch the selected principal and active grants with expiries in one related-data read. |
| ood-n07-b07-i015 | Use a bundle summary projection for count and price; retrieve components for the opened bundle. | Project component count and current price; load components for the opened bundle. |
| ood-n07-b07-i016 | Project revision number and seal time for the search; fetch bytes for the selected sealed revision. | Project revision number and seal time; download bytes only for the selected revision. |
| ood-n07-b07-i017 | Use a grouped seller/window projection for totals and query payout rows only for the selected seller. | Group payout rows by seller and settlement window for dashboard totals. |
| ood-n07-b07-i018 | Load the account balance and recent allocation page for this operation; keep older history behind the separate query. | Read current balance and the 12-row recent allocation page; leave older history to search. |

Mechanical checks do not establish semantic correctness. The original review remains immutable and the current proposal awaits independent re-review. No canonical source, producer, catalog, runtime, queue, or admission files were changed.
