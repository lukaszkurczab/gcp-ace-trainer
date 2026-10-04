# Independent semantic review — N03 B01–B04

**Verdict: PASS for these 72 proposal objects only.** Combined with the separate B05–B09 review, this supplies semantic review evidence for the proposed 162-object set; it does not itself accept source integration, consumer/admission, native or Premium behavior, or full BIZQ-01.

## Inputs and binding

| Unit | Proposal SHA-256 |
|---|---|
| B01 | `c23224df332377b45f718bc10d903a7c9fe645954dd9778f30af503bbabef58b` |
| B02 | `d70ee871a3ee7087c1b5d3d03f2feaedf041fd1d1cbb6267df2439a953abd237` |
| B03 | `830a1fb12385d084279054f3d32db5261af24e7501700847b75e25f1c83ef0de` |
| B04 | `25c09577a8ebcb0116dd1bf5ce2a763eaa011e8f58f42ebeb3e00f0591126360` |

The associated B01–B04 objective, identity and nearest-peer notes are bound to SHA-256 `f66e00a55958eb51f535ef69edf2d938446493c8a7458101f187c2dc676cbc2e`. The frozen manifest identifies 18 replacements per unit. Current items and identity decisions were read against the current proposal objects; the root structure record is used only for the exact hash/count binding and is not treated as semantic acceptance.

## Review and outcome

The prior whole-object review covered the 72 prompts, constraints, options, keys, Reason, Details, and keyed wrong-option feedback. I reread all six newly frozen corrections in full and checked their decision boundaries against the nearest relevant accepted and proposed items. Their current whole objects and identity notes now agree:

- **B01 i025 — PASS.** The prompt distinguishes current exclusive installation from reuse after removal and states that modules survive instrument deletion. The key’s `0..1` multiplicity at both ends follows those facts; composition and simultaneous many-to-many are diagnosed separately. Its decision is different from retaining historical records: this is about current link cardinality versus lifecycle ownership.
- **B01 i031 — PASS.** Venue-local SeatLabels identify a Seat from a Venue, so the UML qualifier Property is attached to the association end whose instances are the related Seats. The prompt states the lookup start, local-key scope, and at-most-one result. The opposite-end and global-key distractors represent distinct path errors. This is the semantic association-end relationship in the normative [OMG UML 2.5.1 specification](https://www.omg.org/spec/UML/2.5.1/PDF), not a claim about the placement of a qualifier rectangle in a particular drawing; the authored venue facts remain scenario premises.
- **B02 i021 — PASS.** The prompt now explicitly states that Edit detail and evaluation follow the stored Edit→RouteRevision reference. This resolves the prior missing-client-path concern. The query handles reverse lookup, so the key can omit a revision-owned inverse collection.
- **B02 i032 — PASS.** The stated client path traverses Shipment→RouteRevision→Publisher, while no named client needs either inverse collection. The correct choice preserves the two required forward paths without adding a duplicate Shipment→Publisher shortcut.
- **B02 i035 — PASS.** Hub is event-specific: a Shipment visits multiple Hubs through ScanEvents and has no single Shipment-level Hub. Keeping the path on ScanEvent preserves sequence granularity; the repository covers the reverse query. This is distinct from i032’s question about which ends of a two-association display path must be navigable.
- **B04 i031 — PASS.** The prompt now makes `Profile` query-only, states that no operation mutates it, and preserves the documented unavailable-field result. The subtype therefore preserves every base operation while adding a provenance badge; the Details reversal condition no longer supplies a hidden requirement.

The remaining 66 objects in these four units retain their previously reviewed semantic content; they were not rewritten as part of the six corrections. Across the 72, repeated UML and relationship concepts serve different decisions and scenario facts. I found no material same-answer repetition, missing decisive premise, or option-feedback mapping error. Alternative choices represent recognizable modeling approaches or specific misconceptions rather than filler. Similar story domains alone do not make the learning decision duplicate.

## Limits

This report does not certify production source identity or any runtime pool’s reachability. The final combined cross-unit review still needs to bind these exact four proposal hashes and the B05–B09 hashes, compare all 162 objects with the accepted N01/N02 controls, and check that there is no material repeated learner decision across the final set. Source proof, consumer, admission, full canonical gates, native/Premium eligibility, and full BIZQ-01 closure remain outside this semantic verdict.
