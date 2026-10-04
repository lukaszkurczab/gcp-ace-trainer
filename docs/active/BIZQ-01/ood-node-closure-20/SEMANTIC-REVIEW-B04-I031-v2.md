# Bounded semantic re-review: N04 B04-i031

**Verdict: REVISE this item.** This addendum supersedes the earlier B04-i031 PASS in `SEMANTIC-REVIEW-B02-B04-v1.md`; the frozen proposal bytes are unchanged.

- Proposal SHA-256: `072730a2c70fa61ee32408743d6b0437c5f991101a8ba0b7f4907880664df41e`
- Question: `ood-n04-b04-i031`
- Existing requirement: BIZQ-01 §4.1, one answer under the visible facts.

The stem says analytics reads reservation counts by interval and cannot allocate or cancel. It does not say analytics may see only aggregate counts or may not read individual reservation records. Option `n04b04_13_leak`—a read-only client iterating the live reservation collection and computing those counts—therefore remains compatible with every stated permission. It could be a broader dependency than the keyed count-query interface, but that makes the key a preferred design, not the only correct design established by the stem.

The Details claim that this alternative “can observe an inconsistent set during reservation changes” is not an adequate discriminator. The prompt provides no concurrent-read, snapshot, or consistency requirement, and the question does not say aggregate counts must be computed by the service. This re-review does not rely on that claim or impose a consistency rule.

The smallest correction is to add a visible role/data boundary consistent with the existing interface-segregation objective: state that analytics is allowed to receive interval counts only and must not receive individual reservation records. Then the live-collection option violates a stated constraint and the narrow query is uniquely supported. Alternatively, replace that option with a choice that clearly grants the forbidden allocation/cancel authority. Do not use concurrency as a newly invented gate.

Other B04 items and the B02/B03 conclusions are unchanged by this bounded re-review. This is not source, consumer, native, or full BIZQ-01 acceptance.
