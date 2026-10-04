# Independent semantic review — N07-B05 v1

**Verdict: REVISE this frozen unit before semantic acceptance.** The current answer choices mostly make coherent, supported serialization decisions, and all 18 use new accepted-option IDs. I found three bounded issues: question identity is retained across materially changed decisions in 16 items; the keyed option is uniquely longest in 14; and i003 does not make the old field name’s textual-format relevance visible.

This review is bound to `review-inputs/N07-B05-v1.json` SHA-256 `7e127c0bbe6bdc367f747b00a0cc3cbe1e65c6568aceb2325d1dad2785a1af1d` and the predecessor objects in `N07-MANIFEST.json` SHA-256 `07b9663946f5de9587434e9a3bd5836f71fa70dec772bfced94524ab3fc4fc01`. I compared all 18 complete before/current objects, resolving each answer through `answer.optionId`, and read the prompt, every option and keyed diagnostic, Reason, all five Details fields, and source references. The mechanical receipt records 18 objects and 90 original/reversed score cases; it establishes schema/scoring/diagnostic binding, not semantic acceptance.

## Blocking findings

1. **Question identity does not follow the actual before/current decision (§5C).** For 16 items, the predecessor key is `owner_preserves_contract`: a generic serialization/defaulting principle applied to a distinct business invariant. The current prompt replaces that primary case with a concrete wire-format or persisted-representation decision. Examples: i001 changes from idempotent release for a settled payout to additive proto3 memo compatibility; i006 changes from preserving explicit route-merge conflicts to selecting among three stored decoders; i010 changes from legal match-state advancement to cross-implementation signing bytes; i017 changes from “current approved shipment data” to the particular address revision approved when the queued job was created. An unchanged B05 unit name does not prove the same question identity. Use the corresponding reserved i019–i036 identity for those 16 changed decisions.

   I would preserve the question IDs for i012 and i015: the predecessor and current cases both ask for reproducible published-result provenance and traceable corrected-invoice history, respectively. In all 18 cases, the current accepted option has a new ID, which is appropriate because its specific keyed operation differs from the former broad owner/defaulting text. This is a meaning-based identity recommendation, not a replacement quota.

2. **A repeated longest-answer cue is present (§4.3).** By raw character count, the keyed option is uniquely longest in 14 of 18 items: i001, i002, i003, i005, i006, i007, i009, i010, i011, i013, i014, i015, i017, i018. Several keyed options combine multiple protocol conditions while alternatives are short fragments. That creates a recurring answer-form cue even though many distractors describe recognizable mistakes. Correct the actual comparisons by making the nearest competing policy complete and case-specific or making the key concise without dropping a necessary condition. I do not require equal lengths, a fixed number of choices, or zero warnings.

3. **B05-i003 has no visible basis for reserving the old field name (§§4.1, 4.3).** The stem establishes an archived field number and says future code must not reinterpret old bytes. That supports reserving the protobuf wire number. The key also requires reserving the name, whose compatibility effect is for JSON/TextFormat payloads; the stem does not say that such textual payloads are archived or replayed. State that they are retained, or narrow the answer to the visible binary-tag condition.

## Item dispositions

The current protocol facts generally select the keyed answer, and wrong-option messages track their stable IDs. The table records the identity judgment and any item-specific semantic issue; the §4.3 cue applies to every flagged row.

| Item | Before → current primary decision | Question ID | Current keyed meaning | Item result |
| --- | --- | --- | --- | --- |
| i001 | Settled-payout idempotency → additive memo/default compatibility | Use ood-n07-b05-i019 (current ood-n07-b05-i001 retained) | Add the memo at a fresh field number and make its absent value preserve the existing empty-memo behavior. | §4.3 cue |
| i002 | Transit announcement order → omitted vs explicit-zero presence | Use ood-n07-b05-i020 (current ood-n07-b05-i002 retained) | Use explicit field presence for `delay_minutes`, so zero and absent remain different states. | §4.3 cue |
| i003 | Meter overlap rule → retire/reserve field identity | Use ood-n07-b05-i021 (current ood-n07-b05-i003 retained) | Remove the field from the active message and reserve both its field number and name. | REVISE i003: binary tag fact does not establish retained ProtoJSON/TextFormat name requirement |
| i004 | Live-stream contract → stable ProtoJSON name | Use ood-n07-b05-i022 (current ood-n07-b05-i004 retained) | Declare `json_name: "captionErrorCode"` on the renamed proto field. | PASS |
| i005 | Assignment constraints → safe enum default | Use ood-n07-b05-i023 (current ood-n07-b05-i005 retained) | Declare `REWARD_STATE_UNSPECIFIED = 0` first and require an explicit grant state before granting. | §4.3 cue |
| i006 | Offline merge conflict → versioned decoder dispatch | Use ood-n07-b05-i024 (current ood-n07-b05-i006 retained) | Persist an explicit format version and dispatch each snapshot through its matching decoder or migration. | §4.3 cue |
| i007 | Reward legality → unknown-field binary relay | Use ood-n07-b05-i025 (current ood-n07-b05-i007 retained) | Keep the unknown field in the parsed message and serialize that message object onward. | §4.3 cue |
| i008 | Shipment hand-off → ordered repeated scans | Use ood-n07-b05-i026 (current ood-n07-b05-i008 retained) | Keep the scans in an ordered repeated message field. | PASS |
| i009 | Nonnegative repayment → exact int64 JSON representation | Use ood-n07-b05-i027 (current ood-n07-b05-i009 retained) | Keep the protobuf `int64` and use its ProtoJSON string representation in the JavaScript contract. | §4.3 cue |
| i010 | Legal match advancement → canonical signing input | Use ood-n07-b05-i028 (current ood-n07-b05-i010 retained) | Define a canonical, versioned signing projection and hash those canonical bytes rather than raw protobuf serialization. | §4.3 cue |
| i011 | Refund/classification split → enum-alias rollout | Use ood-n07-b05-i029 (current ood-n07-b05-i011 retained) | Add the new enum name as an alias, deploy it below the old name first, then switch serializer order and remove the old alias only after old data no longer needs parsing. | §4.3 cue |
| i012 | Published immutable inputs/code → exact revision provenance | Preserve | Store the immutable dataset and code revision identifiers with the published result snapshot. | PASS |
| i013 | Comment author/revision → absent vs present-empty JSON | Use ood-n07-b05-i031 (current ood-n07-b05-i013 retained) | Emit the field only when present, including an empty string when the sender explicitly clears the note. | §4.3 cue |
| i014 | Complete/retryable inspection → partial-update no-op/set/clear | Use ood-n07-b05-i032 (current ood-n07-b05-i014 retained) | Represent the update as an explicit operation or field mask that distinguishes “leave unchanged” from “clear note.” | §4.3 cue |
| i015 | Traceable invoice reissue → immutable linked issue history | Preserve | Append a new versioned issue record with its own payload and a reference to the prior issue. | §4.3 cue |
| i016 | Revocation-before-access → historical policy identity | Use ood-n07-b05-i034 (current ood-n07-b05-i016 retained) | Store the immutable policy-revision identifier with the allow or deny decision. | PASS |
| i017 | Current approved label data → enqueue-time approved revision | Use ood-n07-b05-i035 (current ood-n07-b05-i017 retained) | Capture the approved shipment revision identifier in the queued job and render from that immutable revision. | §4.3 cue |
| i018 | Room/cancellation consistency → absent default vs explicit value | Use ood-n07-b05-i036 (current ood-n07-b05-i018 retained) | Apply the published default only when the field is absent, and preserve any explicitly serialized window value. | §4.3 cue |

## Technical support and scope

The official Protocol Buffers references support the protocol mechanics used here: the [proto3 guide](https://protobuf.dev/programming-guides/proto3/) covers additive fields, unknown fields, defaults, enums, and retired field identities; [Field Presence](https://protobuf.dev/programming-guides/field_presence/) explains explicit/implicit presence; [ProtoJSON](https://protobuf.dev/programming-guides/json/) documents JSON names, `int64` strings, enum names, and null behavior; [serialization is not canonical](https://protobuf.dev/programming-guides/serialization-not-canonical/) explains why even deterministic protobuf bytes are not a cross-version canonical signature. The current hypothetical facts and those references support the keyed mechanisms above, except for the textual-name premise in i003. The Fowler Version Number URL used by i012/i015/i017 could not be opened during this review; the prompt facts themselves make the immutable-reference/history requirement explicit, but that reference is not counted as verified support for a protobuf claim.

The current cases cover distinct serialization decisions; no 18-unique-concepts rule is being imposed. This is a whole-object B05 review only. Full cross-unit comparison against the accepted945 N01–N06 decisions and the remaining N07 units is still pending, as are source, producer, consumer, admission, runtime, native, Premium, and full BIZQ-01 acceptance.

## Frozen evidence

- Proposal: `review-inputs/N07-B05-v1.json`, SHA-256 `7e127c0bbe6bdc367f747b00a0cc3cbe1e65c6568aceb2325d1dad2785a1af1d`.
- Before/current manifest: `N07-MANIFEST.json`, SHA-256 `07b9663946f5de9587434e9a3bd5836f71fa70dec772bfced94524ab3fc4fc01`.
- B05 source: `patternly-content/content/object-oriented-design-interview/persistence_repositories_serialization_and_domain_boundaries/OOD-N07-B05.json`, SHA-256 `5b83e98882bd8172df47be1e02dd1cadfdaa107afd1753edf8af90b36343a76b`.
- Mechanical-only evidence: `ROOT-N07-B05-v1-MECHANICAL.json`, SHA-256 `70a3d49e1443dc0f0227f51c8b46509bd0503e86f4beca7b8c361eee667ec8c8` (18 items, 90 original/reversed score cases).
- Author notes snapshot: `AUTHOR-B05-B08.json`, SHA-256 `7ea1f5a224be0560d93227592305f466919b5261e24bb475b9c1416b50833d52`; treated as hypotheses only.
- N07 contract/brief: `79c6dd8d2861d21eec0122675659840ba6f04883f546ec9ef4326f29320d4720` / `9370339439c25f7fe065e3753af31f0436d0e0e78e9084815d83c5ad9039e4d3`.
- BIZQ-01 spec: `c10ce086ecd3b58d7d776a458cb453d0161ac4519ca2474deba952122ceac8a3`.

**Boundary:** This verdict is limited to the exact frozen B05 v1 proposal. It is not N07 whole-node acceptance or source/runtime/consumer/admission approval. Resolve these findings in a frozen revision and request bounded re-review; preserve this report as historical v1 evidence.
