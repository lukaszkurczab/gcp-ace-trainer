# N07 B05–B08 author notes

This packet contains proposed rewrites for the four assigned N07 units. The canonical source is unchanged. These are author hypotheses for independent whole-object and cross-unit review; the mechanical checker does not approve semantics, item identity, or source activation.

The per-item JSON at `AUTHOR-B05-B08.json` binds each current question to its before-question ID, before/current accepted decision, unit objective, decisive scenario fact, nearest alternative, changed condition, identity action and rationale, and supporting references. B05 now follows the independent v1 map: 16 items use their corresponding reserved question IDs and i012/i015 preserve their prior IDs. B06–B08 identity notes remain hypotheses for their own reviews. Accepted options use item-specific IDs; the checker confirms their bindings but does not approve semantic identity.

| Unit | Objective | Proposal SHA-256 | Mechanical result |
|---|---|---|---|
| B05 | Serialization, versioning, compatibility, and defaults | `0c836263bf7f0724099436beedae72fd57b3c2e301d21b313b5fbb50da635f6f` | 18 items; 90 original/reversed score cases checked |
| B06 | DTO mapping, anti-corruption boundaries, and domain values | `bc2c4f9eb814271589557c6941071a7d6c574262e4b935b3ac079a2229f49066` | 18 items; 90 choices checked |
| B07 | Relationship loading and query ownership from access patterns | `85c578e041b4b25b45f5e55173baa71cc5a8eff1afa2b3b1fbf0c5bacd8124bd` | 18 items; 90 choices checked |
| B08 | Persistence failure, retry, idempotency, and consistency boundaries | `03261f032a56acf2a523096d8cfc40746f319abbd8288dbab7e1b4ae5071ae0a` | 18 items; 90 choices checked |

The checker command was `node docs/active/BIZQ-01/ood-remaining-closure-23/check-proposal-unit.mjs N07-B0x.json` for each unit. It validates the existing question schema, taxonomy, scoring, item mapping, authored feedback targets, actual scoring, and reversed-option scoring. It does not establish that the scenarios have exactly one valid answer, that each distractor is nearest/plausible, that explanations are technically accurate, or that retaining the question ID is semantically justified.

Primary references used for technical claims include the Protocol Buffers proto3 and ProtoJSON guides for B05, Fowler’s Data Transfer Object catalog entry and Microsoft’s anti-corruption/domain-model guidance for B06, SQLAlchemy 2.0 relationship-loading documentation and EF Core related-data documentation for B07, and EF Core concurrency and connection-resiliency guidance for B08. Case-specific business contracts are stated in the question stems; the references are not used to turn those hypothetical premises into universal framework guarantees. In particular, the retry cases distinguish known pre-write rejection, known local transaction boundaries, and unknown external outcomes. No case claims general exactly-once delivery or universal lazy-loading behavior.

The original source arrays contain five choices each, but neither the N07 checker nor the current task brief establishes a fixed choice-count requirement. Four-option drafts were mechanically valid; I had incorrectly inferred that five were mandatory from the source examples. The current five-choice files are simply the latest proposals, and option count is not asserted as a contract or gate. Independent review assesses whether each choice is meaningful under the existing schema and scoring.

A source-link limitation remains: the B05 items i012, i015 and i017 currently cite `https://martinfowler.com/eaaCatalog/versionNumber.html`, which the primary-source check could not access. Those stems state their own case premises; the cited page has not been verified as supporting them and needs review before any semantic acceptance.
