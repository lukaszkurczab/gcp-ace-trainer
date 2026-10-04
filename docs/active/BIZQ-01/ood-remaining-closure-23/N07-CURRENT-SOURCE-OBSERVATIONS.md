# N07 current-source observations

**Stage:** read-only current-source binding and targeted gap recheck complete. This is evidence for closure planning only; it is not authoring approval, production acceptance, semantic acceptance of the full node, or BIZQ-01 closure.

## Bound source inventory

I used the actual `patternly-content/scripts/build.mjs` `validateTrack` API with Node 22.22.3 and `rootDirectory=patternly-content`. It validated the current object-oriented-design track at version `object-oriented-design-interview-authoring-v2026.10.04-bizq01-22`: 1,413 questions across 79 source files, question-set SHA-256 `c6cf903178b823fb71ac29040f3c5fa5f72c619d3adbb525fc7791756654ac3e`.

The eight current N07 arrays contain 18 questions each, 144 total. I compared each file's raw SHA-256 and every canonical whole-question SHA-256 with the N07 entries in [the completed source preflight](../ood-remaining-closure-21/SOURCE-PREFLIGHT.json). All eight raw hashes and all 144 whole-object hashes match. The machine-readable evidence lists each binding and prior disposition in [N07-CURRENT-SOURCE-OBSERVATIONS.json](./N07-CURRENT-SOURCE-OBSERVATIONS.json). Reproduce the read-only source/QSet/item comparison from the repository root with `PATH=/opt/homebrew/opt/node@22/bin:$PATH node patternly/docs/active/BIZQ-01/ood-remaining-closure-23/check-current-source.mjs`. The earlier preflight's full reads can therefore be reused for exact-matching objects; this update does not present those reused reads as new independent review.

| Unit | Current objective | Questions | Current disposition reused |
| --- | --- | ---: | --- |
| N07-B01 | Repositories and domain-oriented collection access | 18 | Prior item-level findings; `i004` is a supported key with a narrow feedback defect. |
| N07-B02 | Aggregate boundaries, invariants, and transaction scope | 18 | 9 `CONTRACT_GAP` items rechecked; remaining prior findings reused. |
| N07-B03 | ORM mapping and leaky persistence abstractions | 18 | Prior exact-object findings reused. |
| N07-B04 | Identity Map and Unit of Work | 18 | Prior exact-object findings reused. |
| N07-B05 | Serialization, versioning, compatibility, and defaults | 18 | `i012` gap rechecked; remaining prior findings reused. |
| N07-B06 | DTOs, mappers, anti-corruption boundaries, and domain objects | 18 | Prior exact-object findings reused. |
| N07-B07 | Lazy/eager loading, proxies, and query ownership | 18 | Prior exact-object findings reused. |
| N07-B08 | Persistence failures, idempotency, retries, and consistency | 18 | `i016` gap rechecked; remaining prior findings reused. |

Across N07, the current accepted option ID is `owner_preserves_contract`; the same four broad wrong-option concepts recur and the prompt explicitly names the intended interview lens. This is corroborating evidence for the earlier per-item findings, not a count-based quality rule. Each case still needs its own decision and nearest alternative. The exact current hashes also match the older dispositions; a track-version change alone did not count as new evidence.

## Rechecked prior gaps

The 11 prior `CONTRACT_GAP` objects were reread as whole questions, including prompt, constraints, all options, answer, Reason, all five Details fields, wrong-option messages, and source references. These remain gaps rather than confirmed false answers: each has a relevant business fact, but lacks a visible discriminator that makes the keyed aggregate, serialization, or persistence-retry mechanism preferable to a plausible simpler implementation. The examples below identify the specific uncertainty without treating a preferred architecture as a product rule.

| Current object | Supported fact | Still unresolved from the prompt |
| --- | --- | --- |
| `ood-n07-b02-i003` | Room capacity and cancellation policy must remain consistent. | No storage boundary or all-or-nothing commit rule says both changes belong in one transaction. A room operation plus service coordination remains plausible. |
| `ood-n07-b02-i005` | Lesson retirement must preserve progress tied to stable lesson identity. | No record-migration or atomicity fact establishes aggregate scope; a retirement operation preserving references also fits. |
| `ood-n07-b02-i007` | Escalation keeps ownership and response deadlines; invalid intermediate states matter. | No persistence boundary or multi-record commit rule locates the aggregate. A single escalation command could enforce the stated rule. |
| `ood-n07-b02-i008` | A listing is not visible before price and stock are valid. | This supports validation before publication, but does not say price and stock must be one persisted aggregate or transaction. |
| `ood-n07-b02-i009` | Request splits retain original identity and delivery promise. | No storage/failure contract says which split records must commit together; a split command with vendor coordination remains plausible. |
| `ood-n07-b02-i011` | Bundle pricing stays consistent with components; repeating must not create a second effect. | Idempotency is relevant, but the prompt does not define replay identity or which writes must be atomic. |
| `ood-n07-b02-i012` | Charger capacity and reservation expiry are coordinated. | The prompt does not define the atomic create/expire rule or which owner holds it; a reservation service coordinating both remains plausible. |
| `ood-n07-b02-i015` | A battery cannot be assigned to two aircraft at once. | No concurrent assignment, durable uniqueness, or transaction fact determines aggregate placement; a scheduling operation could serialize the assignment. |
| `ood-n07-b02-i018` | Approval must be attributable, bounded, and respect required controls. | No records or writes are specified that must share a transaction; an approval command can enforce these constraints. |
| `ood-n07-b05-i012` | Published outputs reference immutable inputs and code versions. | No serialized schema change, old-reader compatibility, or missing-field default is stated. Snapshot provenance is supported, but schema-versioning/defaults are not selected. |
| `ood-n07-b08-i016` | Payout release is idempotent and tied to a settled order. | Retry is plausible, but there is no persistence failure, uncertain acknowledgement, replay source, or consistency boundary. A local idempotent payout operation fits the facts. |

The closest alternatives in each row are not necessarily the best design. Their relevance is that the current prompt does not rule them out. A future rewrite can add only case facts that belong to the intended learning decision, or retarget the decision; it should not add unstated product-wide transaction or delivery guarantees.

## Supported control and closure scope

`ood-n07-b01-i004` is the counterexample to a blanket “all keys are unsupported” claim. Its repair-parts split case explicitly requires a deterministic test seam while preserving request identity and delivery promise; the repository/domain-access key is supported. One wrong-option message (`speculative_indirection`) nevertheless says no delivery requirement exists and dismisses a second workflow, contradicting visible facts. The prior ledger's narrow feedback correction remains appropriate without changing its key.

The preflight supports planning one fixed N07 source package across the eight arrays if authoring is later approved: N07 is a single node, and its objective/key/explanation pattern spans all eight files. That scope does **not** mean all 144 objects must be rewritten or get new IDs. Each item should retain its current meaning where supported, receive a same-ID correction where only wording/diagnosis changes, and use a reserved new ID only for a real primary-decision change. A smaller edit batch could still be useful for authoring/review sequencing, but it would not close the full N07 inventory. This report assigns no final identity actions.

N07 work must preserve accepted N01–N06 content and other source bytes under the project’s established fixed-cohort contract. This preflight makes no claim about N07 runtime eligibility, Premium behavior, or full BIZQ-01 acceptance. No source, catalog, proof, verifier, test, app, artifact, candidate, admission, queue, runtime, or service files were changed.
