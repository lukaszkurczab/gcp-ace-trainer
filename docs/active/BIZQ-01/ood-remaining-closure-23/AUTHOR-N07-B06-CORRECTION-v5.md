# N07-B06 correction v5

Ready for independent bounded re-review; this is not semantic acceptance.

- Current proposal SHA-256: `495d6b144b2ad2d682b11d3fb771c108707026519456031982b8f9eb6e1d1136`
- Prior frozen v4 input SHA-256: `c0cc8fd32d0a19cd35d77fbe4d86e47b29ac0808bcd06e22bc42b436625d75ef`
- Manifest SHA-256: `07b9663946f5de9587434e9a3bd5836f71fa70dec772bfced94524ab3fc4fc01`
- Existing checker: PASS, 18 whole objects, 90 original/reversed option evaluations; 72 wrong-option messages actually differ from v4.
- Identity: QIDs and accepted option IDs are preserved because the core decision remains mapping external representation to the domain contract.

The earlier v4 diagnostic attempt used question IDs where the stored message targets use option IDs; the on-disk v4 therefore retained its original message texts. This v5 writes by the actual stored option IDs and compares serialized objects to the frozen v4 input. All 72 wrong-option messages changed. i005 explicitly binds D17 to signer-selected immutable revision R17 and makes the returned digest comparable to those bytes. i007 includes a provider-supplied numeric UTC offset and its counterfactual now correctly says what would be needed if that offset were absent. The i001 and i002 target diagnoses were checked against their actual options.

| Question | Prior keyed decision | Current keyed decision |
|---|---|---|
| ood-n07-b06-i001 | Translate the partner code to the stable exercise ID; carry score and policy revision into completion. | Translate the partner code to the stable exercise ID; carry score and policy revision into completion. |
| ood-n07-b06-i002 | Map recognized statuses; retain an unknown supplier value with a quarantined review record. | Map recognized statuses; retain an unknown supplier value with a quarantined review record. |
| ood-n07-b06-i003 | Resolve vendor offsets to stable segment IDs before replacing the recording. | Resolve vendor offsets to stable segment IDs before replacing the recording. |
| ood-n07-b06-i004 | Resolve the provider email to a verified principal; retain approval ID and UTC expiry in the grant command. | Resolve the provider email to a verified principal; retain approval ID and UTC expiry in the grant command. |
| ood-n07-b06-i005 | Verify the returned digest against the signer-selected revision; record that revision on the seal. | Verify the returned digest against the signer-selected revision; record that revision on the seal. |
| ood-n07-b06-i006 | Construct Money from cents and currency; pass it with the settled order identity to payout. | Construct Money from cents and currency; pass it with the settled order identity to payout. |
| ood-n07-b06-i007 | Parse the supplied offset into an instant; retain the original timestamp text for display. | Parse the supplied offset into an instant; retain the original timestamp text for display. |
| ood-n07-b06-i008 | Convert watt-hours to kilowatt-hours and resolve the registry meter ID before checking capacity. | Convert watt-hours to kilowatt-hours and resolve the registry meter ID before checking capacity. |
| ood-n07-b06-i009 | Translate supported language codes and provider errors; retain unknown codes in boundary diagnostics. | Translate supported language codes and provider errors; retain unknown codes in boundary diagnostics. |
| ood-n07-b06-i010 | Map both volunteer IDs, then invoke the domain’s joint swap operation. | Map both volunteer IDs, then invoke the domain’s joint swap operation. |
| ood-n07-b06-i011 | Map the patch and expected revision; let the domain apply its conflict rule. | Map the patch and expected revision; let the domain apply its conflict rule. |
| ood-n07-b06-i012 | Translate known reward codes; preserve an unknown code for support and reject it. | Translate known reward codes; preserve an unknown code for support and reject it. |
| ood-n07-b06-i013 | Resolve shipment identity and convert both temperatures before the handoff operation. | Resolve shipment identity and convert both temperatures before the handoff operation. |
| ood-n07-b06-i014 | Classify a positive repayment separately from a negative reversal; retain the bank reference. | Classify a positive repayment separately from a negative reversal; retain the bank reference. |
| ood-n07-b06-i015 | Translate the status and invoke the state-checked match result operation. | Translate the status and invoke the state-checked match result operation. |
| ood-n07-b06-i016 | Record scanner labels as evidence; evaluate refund eligibility with the return policy. | Record scanner labels as evidence; evaluate refund eligibility with the return policy. |
| ood-n07-b06-i017 | Resolve both handles to immutable dataset and code revisions before publishing provenance. | Resolve both handles to immutable dataset and code revisions before publishing provenance. |
| ood-n07-b06-i018 | Map markdown, author identity, and revision into the comment; notify only after acceptance. | Map markdown, author identity, and revision into the comment; notify only after acceptance. |

The check establishes mechanical shape, scoring/reversal, and diagnostic target bindings only. Independent semantic review remains required. Source, catalog, proof, consumer, runtime, queue, and admission files were not changed.
