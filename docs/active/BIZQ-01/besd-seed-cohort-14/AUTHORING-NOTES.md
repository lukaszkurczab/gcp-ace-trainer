# Authoring notes — BESD seed cohort 14

Source baseline: c272a4bfdcd419d5185e5b00e1fd3022772f073c. This is a proposal for the 32 remaining questions in the two fixed A1 seeds; accepted i017 and i019 are preserved evidence, not replacements.

Every constraint below is a scenario premise visible before the options. The package keeps the existing track, node, mental-unit, `choice_single` / `exact_selected_set`, and item counts. Each replacement has fresh question/option identities; wrong-option feedback targets every incorrect option only.

## BESD-N02-B01

### besd-n02-b01-i001 → besd-n02-b01-i018

- Learning objective: Choose a resource representation that exposes bounded freshness and distinguishes an absent asset from a temporarily unavailable metadata read.
- Decisive facts: The catalog is the authority for asset identity. A metadata projection may lag by at most 30 seconds. A missing asset and an unavailable origin are different outcomes.
- Closest alternatives and misconceptions: refresh_on_read: A read now initiates work and conflates a missing asset with an accepted refresh. / storage_row_contract: Storage schema leaks implementation details and the required outcome distinction is lost.
- Reversal condition: If the product later requires immediate read-your-writes after ingestion, callers need an accepted-operation or source-version contract in addition to this bounded read.
- Nearest-neighbor distinction: Nearest: N02 i028 stable query pagination; both define reads, but this item is about resource identity and truthful absence/failure outcomes, not a multi-page snapshot.
- Primary references: https://www.rfc-editor.org/rfc/rfc9110.html, https://spec.openapis.org/oas/v3.1.1.html

### besd-n02-b01-i003 → besd-n02-b01-i019

- Learning objective: Define an event identity and application ordering field so receivers can suppress redelivery and reject older shipment state without treating delivery order as guaranteed.
- Decisive facts: A carrier event has a stable source and event ID across redelivery. Each shipment has a monotonically increasing revision assigned by the carrier. The receiver may see events out of order.
- Closest alternatives and misconceptions: broker_delivery_once: The stated repeated and delayed deliveries violate both assumptions. / arrival_timestamp_order: Arrival order measures network timing, not the carrier’s state order.
- Reversal condition: If the carrier guarantees a single ordered stream per shipment and assigns no revisions, the consumer can rely on that explicit contract; no such guarantee is present here.
- Nearest-neighbor distinction: Nearest: preserved N02 i017 command/status/completion. That item distinguishes request, progress and completion for one physical action; this item distinguishes redelivery identity from ordering among factual events.
- Primary references: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md

### besd-n02-b01-i004 → besd-n02-b01-i020

- Learning objective: Use a representation version as a write precondition so concurrent document edits produce a visible conflict rather than silent last-write-wins.
- Decisive facts: Every document representation carries a strong version validator. A write based on an older revision must leave the newer document unchanged. The client can present a conflict and let its user merge.
- Closest alternatives and misconceptions: unconditional_replace: A stale full representation would erase the concurrent edit. / compare_then_write_client: The state can change between the client’s check and its write.
- Reversal condition: If the product later adopts a deterministic merge model, version preconditions may still detect concurrent inputs, but conflict presentation can be replaced by the specified merge behavior.
- Nearest-neighbor distinction: Nearest: N02 i023 price revision. Both carry version information, but this item uses a precondition to prevent a stale write; the price item separates immutable price revisions from a quote’s pinned revision.
- Primary references: https://www.rfc-editor.org/rfc/rfc9110.html, https://spec.openapis.org/oas/v3.1.1.html

### besd-n02-b01-i005 → besd-n02-b01-i021

- Learning objective: Place the stock invariant in one atomic reserve command at the inventory authority, not in a preceding availability query.
- Decisive facts: The available count can change between a browse and a reservation. Both buyers can submit before either receives a response. A losing buyer should learn that no reservation was created.
- Closest alternatives and misconceptions: read_then_reserve: Both buyers can read the same final unit before either write occurs. / cache_as_capacity: A later repair does not undo an already accepted oversell.
- Reversal condition: If inventory is split across independent authorities, a single atomic reserve is unavailable; the product would need to define allocation, compensation and the user-visible partial outcome.
- Nearest-neighbor distinction: Nearest: N02 i027 booking cancellation and N04 i029 stock display. This item is specifically the atomic command outcome for the last unit, not cache freshness or cancellation idempotency.
- Primary references: https://www.rfc-editor.org/rfc/rfc9110.html

### besd-n02-b01-i006 → besd-n02-b01-i022

- Learning objective: Model one-time module completion as an idempotent desired-state resource rather than an incrementing submission counter.
- Decisive facts: Completion is a binary state for each learner and module. Repeating the same completion request must not add another unit of progress. The service owns the durable progress record.
- Closest alternatives and misconceptions: increment_progress: A replay becomes additional progress because the operation is an increment. / client_suppress_retries: The client cannot know whether the server committed before the response was lost.
- Reversal condition: If progress is based on independently graded attempts, represent each attempt as a separately identified record; this question’s one-time module-completion rule would no longer apply.
- Nearest-neighbor distinction: Nearest: N02 i019 shipment event deduplication. That item identifies redelivered facts and orders revisions; this item uses a desired-state resource for a single binary completion.
- Primary references: https://www.rfc-editor.org/rfc/rfc9110.html, https://spec.openapis.org/oas/v3.1.1.html

### besd-n02-b01-i007 → besd-n02-b01-i023

- Learning objective: Pin each checkout quote to an immutable price revision so a retry cannot silently substitute a newer price.
- Decisive facts: A published price revision is immutable. A quote remains valid for five minutes and must keep the amount returned when it was created. A newer revision may become current while an existing quote remains valid.
- Closest alternatives and misconceptions: always_current_price: The same quote changes meaning during its validity period. / client_amount_authority: The amount can be stale or altered and is not bound to the catalog revision.
- Reversal condition: If the business requires emergency price withdrawal to invalidate open quotes, define an explicit revocation rule and return that outcome rather than silently replacing the pinned amount.
- Nearest-neighbor distinction: Nearest: N02 i020 conditional document update. Both prevent an unnoticed version change; this item pins an immutable revision for a read/quote lifetime, while i020 uses a precondition to reject a stale write.
- Primary references: https://www.rfc-editor.org/rfc/rfc9110.html, https://spec.openapis.org/oas/v3.1.1.html

### besd-n02-b01-i008 → besd-n02-b01-i024

- Learning objective: Define when a credential revocation response is success, given that copied credentials may still be presented to the service.
- Decisive facts: The API promises that a token is rejected for protected requests after revocation succeeds. The server makes the authorization decision for each protected request. A client may still hold a copied token after the revocation response.
- Closest alternatives and misconceptions: async_best_effort_revoke: A request can still be authorized after the API has promised revocation. / client_logout_only: A copied or offline token remains usable because the server does not enforce revocation.
- Reversal condition: If the product permits a measured revocation delay, the response can state that weaker bound and the checks can enforce it; immediate post-success rejection is the premise here.
- Nearest-neighbor distinction: Nearest: N02 i024 typed payment failure. Both make an outcome truthful; this item binds a success response to durable authorization state, while i030 separates decline from an unknown provider outcome.
- Primary references: https://www.rfc-editor.org/rfc/rfc9110.html, https://spec.openapis.org/oas/v3.1.1.html

### besd-n02-b01-i009 → besd-n02-b01-i025

- Learning objective: Propagate a caller deadline through synchronous route computation and stop work when the caller no longer needs the result.
- Decisive facts: The caller’s 300 ms wait bound is explicit. A late route preview has no durable value. The server can observe cancellation or deadline expiry.
- Closest alternatives and misconceptions: unbounded_rpc: Server and downstream work continue after the only consumer has gone away. / durable_job_for_preview: Durable work adds state and retries for a result the scenario does not need to retain.
- Reversal condition: If dispatchers need to retrieve the route after leaving the screen, the result becomes durable work and should use an explicit operation resource with its own lifecycle.
- Nearest-neighbor distinction: Nearest: N02 i025 tenant quota. Both bound expensive work, but this item bounds one request lifetime and propagates cancellation; i029 defines admission across a tenant’s concurrent requests.
- Primary references: https://grpc.io/docs/guides/deadlines/

### besd-n02-b01-i010 → besd-n02-b01-i026

- Learning objective: Return a rollout decision without requiring each mobile client to implement the changing cohort rule.
- Decisive facts: The decision is evaluated for one authenticated account and one feature key. Operations can revise the assignment rule without releasing a new app. Clients need a stable decision and the rule revision used for it.
- Closest alternatives and misconceptions: ship_rule_to_each_client: Old clients can retain obsolete rules, so one account may receive inconsistent decisions during rollout. / client_random_assignment: The result is not tied to the account or the service’s current assignment rule.
- Reversal condition: If the rollout rule becomes a public, immutable client-side configuration and all active clients can update together, distributing it can be appropriate; neither condition holds in this scenario.
- Nearest-neighbor distinction: Nearest: N02 i031 additive fraud-case field. That item evolves response shape across mixed consumers; this item keeps cohort evaluation at the server boundary and returns one decision for the current rule revision.
- Primary references: https://spec.openapis.org/oas/v3.1.1.html

### besd-n02-b01-i011 → besd-n02-b01-i027

- Learning objective: Specify time-window boundaries and timezone offsets in the appointment search contract so adjacent slots are not duplicated or skipped.
- Decisive facts: Clients can send timestamps with an explicit UTC offset. Adjacent searches must cover every slot start once, with a boundary-start slot in the later range. The repeated local hour during a daylight-saving fall-back names two possible instants.
- Closest alternatives and misconceptions: local_time_without_zone: The same request can identify different instants across servers or daylight-saving transitions. / inclusive_both_ends: A slot ending at 10:15 and the next beginning at 10:15 both match the shared boundary.
- Reversal condition: If the product wants end-inclusive ranges, callers must advance the next range past the prior endpoint and the contract must state that behavior; the adjacent-slot premise favors half-open ranges.
- Nearest-neighbor distinction: Nearest: N02 i028 snapshot-bound search cursor. Both define query traversal; this item fixes temporal interval and timezone semantics, while i028 stabilizes pages over a changing index.
- Primary references: https://www.rfc-editor.org/rfc/rfc9110.html, https://www.rfc-editor.org/rfc/rfc3339.html

### besd-n02-b01-i012 → besd-n02-b01-i028

- Learning objective: Bind search pagination to one query snapshot so records changing between page requests do not create duplicates or gaps.
- Decisive facts: The index can change between page requests. The API can retain a snapshot token for the cursor lifetime. The query and sort order are part of the pagination identity.
- Closest alternatives and misconceptions: offset_live_index: Insertions or removals before the offset can shift results and cause gaps or duplicates. / client_deduplicate: Deduplication can hide duplicates but cannot recover omitted results or establish a stable view.
- Reversal condition: If the index cannot retain snapshots, use a stable keyset cursor over a monotonic ordering field and document which concurrent inserts may be excluded.
- Nearest-neighbor distinction: Nearest: N02 i018 media resource read; both define query behavior, while this item binds multiple pages to one result snapshot.
- Primary references: https://www.rfc-editor.org/rfc/rfc9110.html, https://spec.openapis.org/oas/v3.1.1.html

### besd-n02-b01-i013 → besd-n02-b01-i029

- Learning objective: Apply per-tenant concurrency admission to expensive route solves and return a retryable capacity outcome instead of silently queueing unbounded work.
- Decisive facts: The total service can run six solves concurrently. Each tenant has a separate limit of three in-flight solves. The client can retry after a capacity rejection.
- Closest alternatives and misconceptions: unbounded_wait_queue: This moves overload into retained work and violates the explicit no-unbounded-waiting constraint. / global_limit_only: One tenant could take four slots, exceeding its stated limit while service capacity remains available.
- Reversal condition: If callers require eventual execution instead of retrying, change the contract to an explicitly bounded queue with an operation resource and queue-capacity outcome.
- Nearest-neighbor distinction: Nearest: N02 i025 deadline-bounded preview. Both limit resource use; this item controls concurrent admission per tenant, while i025 controls one disposable request’s lifetime.
- Primary references: https://www.rfc-editor.org/rfc/rfc6585.html#section-4, https://www.rfc-editor.org/rfc/rfc9457.html

### besd-n02-b01-i014 → besd-n02-b01-i030

- Learning objective: Define machine-readable problem types for invalid payment input, a definitive issuer decline, and temporary capacity rejection without making clients parse human text.
- Decisive facts: The issuer decline is a final known result. Capacity rejection means the authorization was not submitted to the issuer. Human-readable text may be localized and can change.
- Closest alternatives and misconceptions: parse_detail_text: Localized or revised prose is not a stable machine contract. / success_with_error_body: Generic HTTP consumers cannot distinguish a failed authorization from a successful response.
- Reversal condition: If the processor later adds a timeout with unknown charge outcome, do not map it into these three types; add an explicit unresolved outcome and reconciliation path.
- Nearest-neighbor distinction: Nearest: N02 i024 credential revocation. That item binds success to an authorization state change; this item designs stable machine-readable error outcomes for a payment API.
- Primary references: https://www.rfc-editor.org/rfc/rfc9457.html, https://www.rfc-editor.org/rfc/rfc9110.html

### besd-n02-b01-i015 → besd-n02-b01-i031

- Learning objective: Evolve the fraud-case response additively while old and new workers coexist, preserving existing enum meanings and required fields.
- Decisive facts: Old workers ignore unknown response fields. The existing `status` values retain their meanings. The new field is informative and not required for existing case handling.
- Closest alternatives and misconceptions: reuse_status_enum: Existing consumers may misread a value whose meaning changed. / require_atomic_cutover: The stated mixed-version window makes simultaneous replacement unavailable.
- Reversal condition: If every consumer can be drained and upgraded before the new field becomes required, a versioned breaking change becomes feasible; the several-day coexistence premise rules that out.
- Nearest-neighbor distinction: Nearest: N02 i026 feature configuration evolution. Both add a field under mixed clients, but this item preserves case status semantics across workers; i026 separates flag meaning from optional explanation.
- Primary references: https://spec.openapis.org/oas/v3.1.1.html

### besd-n02-b01-i016 → besd-n02-b01-i032

- Learning objective: Address an export by an immutable snapshot that pins the payroll period, source watermark, and rules revision used to produce it.
- Decisive facts: The export is an audit artifact once approved. The source can change after export creation. The applicable payroll-rules revision is identifiable.
- Closest alternatives and misconceptions: recompute_latest: A retry can return a different artifact for the same apparent export identity. / client_snapshot_only: This provides no durable server-side identity or audit link to the approved result.
- Reversal condition: If audit policy requires a corrected export to replace the approved one, represent that as a new revision with a link to the superseded artifact.
- Nearest-neighbor distinction: Nearest: N02 i023 quote pinned to price revision. Both bind an artifact to immutable inputs; this item pins a multi-source payroll snapshot and rules revision for audit reproduction.
- Primary references: https://spec.openapis.org/oas/v3.1.1.html

## BESD-N04-B01

### besd-n04-b01-i001 → besd-n04-b01-i020

- Learning objective: Keep a short-lived copy of low-sensitivity notification preferences in the signed-in client because local reuse is sufficient and cross-device sharing is not required.
- Decisive facts: The user is signed in and the client knows the authenticated account. Five minutes of staleness is acceptable for this screen. The cache is for repeated reads on one device; writes remain server-owned.
- Closest alternatives and misconceptions: shared_edge_preference_cache: The key does not isolate user-specific preferences. / durable_client_authority: The cache becomes a second write authority, so other devices and server workflows can diverge.
- Reversal condition: If preferences become security-sensitive or must change across devices immediately, stop reusing this client copy until the stronger authorization and freshness requirements are satisfied.
- Nearest-neighbor distinction: Nearest: N04 i024 support search candidate cache. Both scope cached data by caller context; this item is an account-private client cache for one-device reuse, while i024 caches only unfiltered candidate IDs at a server boundary.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html

### besd-n04-b01-i003 → besd-n04-b01-i021

- Learning objective: Prevent a pre-update cache fill from restoring stale parcel state after an acknowledged update.
- Decisive facts: Parcel projections and update notifications share a monotonically increasing revision; the origin can return the latest committed projection; the cache must reuse unchanged projections rather than bypass on every read.
- Closest alternatives and misconceptions: evict_only: deleting the current value does not stop an older in-flight fill from restoring it. / wait_for_ttl: leaves the old state visible after the write has succeeded.
- Answer mechanism: Publish the committed revision floor to the cache read path before ACK; reject older fills and only then return success.
- Reversal condition: If projections and notifications cannot be compared by revision, do not claim read-after-acknowledgement; use an explicit unavailable or bounded-stale contract.
- Nearest-neighbor distinction: N02 i019 deduplicates and orders incoming domain events; this item fences a cache fill against the revision already committed to parcel state.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html. Source-claim coverage: RFC 9111 covers cache freshness and revalidation concepts; matching parcel revisions, pre-ACK floor visibility, and post-acknowledgement reads are explicit scenario premises.
### besd-n04-b01-i004 → besd-n04-b01-i022

- Learning objective: Reuse immutable extraction output by a key that includes the input digest and extractor version, while keeping tenant-private documents isolated.
- Decisive facts: The file has a stable content digest. The extractor version is recorded with every result. Results must not be shared across tenant boundaries.
- Closest alternatives and misconceptions: filename_global_cache: Names can collide, tenant data can leak, and the result may come from old processing logic. / cache_only_job_id: This key cannot identify deterministic work shared by repeated inputs.
- Reversal condition: If extraction becomes nondeterministic or depends on an external reference not captured in the key, either add that input to the key or stop reusing the result.
- Nearest-neighbor distinction: Nearest: N04 i033 transcode artifact cache. Both reuse deterministic outputs; this item additionally scopes private documents by tenant and extractor version, while i033 focuses on public immutable media artifacts.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html

### besd-n04-b01-i005 → besd-n04-b01-i023

- Learning objective: Cache immutable venue layout separately from exact seat availability so static traffic does not freeze a changing inventory fact.
- Decisive facts: A layout is immutable within a published venue-layout version. The origin cannot serve the repeated static layout traffic directly. Availability changes independently and must be fetched from its authority for each display.
- Closest alternatives and misconceptions: cache_combined_seat_map: Sales change availability without changing the layout version. / fetch_layout_every_view: The origin cannot serve the repeated layout traffic, and the layout is safely reusable by version.
- Reversal condition: If the availability service later allows a documented freshness window, a separate availability projection may be cached within that bound; it must remain independent from the immutable seat-map artifact.
- Nearest-neighbor distinction: Nearest: N04 i035 appointment availability. That item permits a bounded stale availability projection with write-time recheck; this item requires current seat availability on each display and caches only the independently versioned layout.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html

### besd-n04-b01-i006 → besd-n04-b01-i024

- Learning objective: Cache only tenant-scoped candidate case IDs and recheck each case’s current per-agent authorization before returning case content.
- Decisive facts: Candidate IDs can be shared within one tenant. Case-level authorization differs by agent and can change immediately. The case service can authorize each candidate before returning its contents.
- Closest alternatives and misconceptions: cache_final_agent_results: Tenant membership alone does not grant every agent the same case access. / key_by_agent_forever: A permission change leaves the old result eligible for that agent.
- Reversal condition: If the search index cannot safely expose candidate IDs across agents, scope candidate caching to the agent or move filtering into the authorized search boundary.
- Nearest-neighbor distinction: Nearest: accepted N04 i019 tenant-scoped audit cache. That item caches already authorized result projections under a permission-aware service key; this item caches only candidate IDs and reauthorizes each document because per-agent rights change immediately.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html

### besd-n04-b01-i007 → besd-n04-b01-i025

- Learning objective: Use conditional revalidation for frequently updated public metadata so edge copies can be reused briefly without presenting a representation beyond its freshness bound.
- Decisive facts: The metadata is public and identical for all viewers. The maximum stale age is 15 seconds. The origin limits full transfers to one per URL per 15 seconds and supports conditional validation.
- Closest alternatives and misconceptions: long_mutable_edge_ttl: The given bound would depend on a best-effort invalidation reaching every location. / unconditional_origin_fetch: This discards conditional validation even though the origin can confirm an unchanged representation.
- Reversal condition: If the product explicitly allows stale serving during origin failure, add a maximum stale-on-error window and expose that behavior; do not infer it from the normal 15-second bound.
- Nearest-neighbor distinction: Nearest: N04 i025 immutable media revisions. That item changes URL per publication so the representation never mutates; this item keeps one mutable URL and relies on bounded conditional revalidation.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html

### besd-n04-b01-i008 → besd-n04-b01-i026

- Learning objective: Cache immutable device capability manifests by model and firmware build, while fetching each device’s current operational state from its owning service.
- Decisive facts: A manifest is immutable for a model and firmware build. Operational state is per-device and can change without a firmware change. The portal can request manifest and operational state separately.
- Closest alternatives and misconceptions: cache_by_model_only: Capabilities can differ between firmware builds of the same model. / cache_device_snapshot: One device’s changing connectivity state is neither shared by model nor immutable.
- Reversal condition: If the portal only needs a historic “last known state,” it can cache that separately with a timestamp and explicit age label; the current view described here must use live state.
- Nearest-neighbor distinction: Nearest: N04 i033 content-addressed transcode output. Both cache immutable artifacts, but this item keys shared protocol capabilities by model/build and keeps live device state separate.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html

### besd-n04-b01-i009 → besd-n04-b01-i027

- Learning objective: Keep unsent document edits in a client-local draft cache, but identify the server revision they were based on before attempting to publish them.
- Decisive facts: The local draft must survive a refresh on the same device. The client can retain the server revision read before going offline. Conflicting edits must not silently overwrite the server version.
- Closest alternatives and misconceptions: publish_local_as_current: Offline state may be older than another collaborator’s saved revision. / discard_offline_draft: The explicit refresh/offline requirement is not met.
- Reversal condition: If the product explicitly chooses last-write-wins for this document type, it can omit conflict UI, but that would replace the stated no-silent-overwrite requirement.
- Nearest-neighbor distinction: Nearest: N02 i020 conditional document update. That item defines the server write precondition; this item defines the local cache lifecycle and preserves an offline draft across that conflict.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html, https://www.rfc-editor.org/rfc/rfc9110.html

### besd-n04-b01-i010 → besd-n04-b01-i028

- Learning objective: Keep immutable topology and changing restrictions separately identified, with response provenance that lets a route reviewer verify both inputs.
- Decisive facts: Graph is immutable by release; closures have a 30-second maximum age; each preview must expose the graph release ID and closure-observation timestamp for review.
- Closest alternatives and misconceptions: cache_combined_route: endpoint-only keys can hide changed topology or a new closure. / disable_topology_cache: fetches safe immutable data but omits the closure observation needed to verify the freshness limit.
- Reversal condition: If live restrictions need a tighter bound, change the closure freshness objective or validate the route against the authority; the immutable graph lifetime does not set that bound.
- Nearest-neighbor distinction: N04 i026 splits an immutable firmware manifest from live device status; this item splits versioned road topology from time-bounded closure observations and exposes both provenance values.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html. Source-claim coverage: RFC 9111 supports cache freshness; the graph release ID, closure-observation timestamp, 30-second limit, and required provenance fields are scenario premises.
### besd-n04-b01-i011 → besd-n04-b01-i029

- Learning objective: Meet the planner response bound by reusing a forecast keyed to its dimensions and rules revision, while exposing its source watermark.
- Decisive facts: The calculation takes 45 seconds but the page limit is two seconds; output varies by facility set, horizon, and rules revision; stock arrives in ten-minute batches and the result identifies its batch.
- Closest alternatives and misconceptions: cache_by_report_name: merges different facility/horizon/rule inputs. / live_recompute_every_read: a 45-second computation misses the two-second response bound and omits rules provenance.
- Reversal condition: If planners need a forecast beyond the latest available batch, wait for that watermark or report it unavailable; do not relabel an older result.
- Nearest-neighbor distinction: N04 i028 keeps fast-changing road restrictions separate from static topology; this item materializes a slow aggregate calculation and identifies both its rule revision and source batch.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html. Source-claim coverage: RFC 9111 supports cache freshness and reuse concepts; the compute time, response objective, batch cadence, rules revision, and watermark are explicit scenario guarantees.
### besd-n04-b01-i012 → besd-n04-b01-i030

- Learning objective: Cache a course outline under its immutable release identity, while resolving the current course alias and reading learner progress separately.
- Decisive facts: Outlines are public and immutable within release; each page open resolves to the currently published release; learner progress is private, mutable, and separately requested.
- Closest alternatives and misconceptions: cache_combined_payload: exposes one learner’s private progress to other learners. / cache_mutable_course_alias: can continue serving an old outline after the alias resolves to a new published release.
- Reversal condition: If a documented local progress freshness bound is introduced, add a learner-scoped progress cache with that bound; it does not change outline release identity.
- Nearest-neighbor distinction: N04 i020 scopes one-device preferences to the signed-in account; this item separates public release content from per-learner progress and resolves a moving course alias.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html. Source-claim coverage: RFC 9111 supports cache freshness; course release immutability, alias resolution, and progress privacy are explicit scenario/system premises.
### besd-n04-b01-i013 → besd-n04-b01-i031

- Learning objective: Publish public prices under immutable revision URLs and keep checkout on the authoritative current-price path for final acceptance.
- Decisive facts: Published price revisions are immutable and public. The browsing pointer may lag 15 seconds. Checkout can revalidate the revision before accepting payment.
- Closest alternatives and misconceptions: mutable_price_long_cache: A stale edge copy can set the accepted payment amount beyond the allowed 15-second browse lag. / purge_is_authority: The scenario states only a bounded pointer lag, not a globally synchronous purge guarantee.
- Reversal condition: If the merchant contract guarantees the displayed price for a quote lifetime, checkout should validate that quote’s pinned revision rather than require the latest catalog revision.
- Nearest-neighbor distinction: Nearest: N04 i025 immutable media metadata. Both cache immutable public revisions behind a mutable pointer; this item adds a separate purchase-time revalidation boundary.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html

### besd-n04-b01-i014 → besd-n04-b01-i032

- Learning objective: Bound any authorization cache from a non-lagging identity source by the five-second revocation objective, and fail closed when current state cannot be established.
- Decisive facts: The authoritative identity store reflects a revocation immediately; authorization reads do not use a lagging replica. A protected request must be rejected within five seconds after revocation commit. If current credential state is unavailable, the protected request must not be authorized.
- Closest alternatives and misconceptions: long_lived_positive_cache: A credential revoked during that hour remains usable beyond the stated bound. / unbounded_fail_open: This turns unknown state into permission despite the fail-closed requirement.
- Reversal condition: If the operation is non-sensitive and the product explicitly allows bounded stale authorization, define that separate exception and do not apply it to the protected operation in this scenario.
- Nearest-neighbor distinction: Nearest: N04 i024 support search reauthorization. Both make current permissions decisive; this item sets a hard revocation-age limit and failure policy for credential state.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html

### besd-n04-b01-i015 → besd-n04-b01-i033

- Learning objective: Cache transcoded artifacts by immutable input digest and complete encoding recipe so a changed source or codec setting cannot reuse the wrong output.
- Decisive facts: Each source file has a content digest. The full encoding recipe and codec version are recorded. Published outputs are immutable and public.
- Closest alternatives and misconceptions: cache_by_asset_name: A replacement source or changed recipe can collide with the old artifact. / cache_job_response: An accepted job record is not the immutable output bytes.
- Reversal condition: If the encoder is nondeterministic or depends on uncaptured data, include the missing input or stop treating the result as content-addressable.
- Nearest-neighbor distinction: Nearest: N04 i022 document extraction cache. Both reuse deterministic transformations keyed by versioned inputs; this item serves public immutable outputs, while i022 isolates tenant-private documents.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html

### besd-n04-b01-i016 → besd-n04-b01-i034

- Learning objective: Use a bounded edge cache for rollout configuration and make the emergency disable path meet the same 15-second staleness limit under failed invalidation.
- Decisive facts: The configuration is identical across callers and is safe to share. After its 15-second freshness window, an old enabled value must not be used if revalidation fails. The origin caps revalidation to one request per key per 15-second window.
- Closest alternatives and misconceptions: fetch_every_request: This exceeds the origin limit of one revalidation per key in each 15-second window. / serve_stale_enabled: An expired value is explicitly unusable when revalidation fails.
- Reversal condition: If a faster emergency-disable objective is needed, state it separately and support it with a verified invalidation path; the 15-second freshness window does not imply a stronger guarantee.
- Nearest-neighbor distinction: Nearest: N04 i025 media revision pointer. Both use a freshness bound on mutable configuration; this item’s emergency-disable guarantee must survive lost invalidation.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html

### besd-n04-b01-i017 → besd-n04-b01-i035

- Learning objective: Cache read-only appointment availability by provider and time window, but invalidate on schedule changes and recheck the authoritative slot when confirming a booking.
- Decisive facts: The calendar is a read-only availability projection. Schedule changes normally invalidate affected provider/time-window entries. The booking service can recheck and claim a slot atomically.
- Closest alternatives and misconceptions: cache_booking_authority: Two users can act on the same stale open-slot result. / global_calendar_key: The key merges distinct schedules and cannot identify which change should invalidate it.
- Reversal condition: If the business promises that a displayed slot is reserved for a user, add a durable expiring-hold contract instead of treating the availability cache as a reservation.
- Nearest-neighbor distinction: Nearest: N04 i023 ticket count and i029 forecast. All separate approximate display reads from a write invariant; this item adds targeted provider/window invalidation for a calendar projection rather than a count or aggregate forecast.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html

### besd-n04-b01-i018 → besd-n04-b01-i036

- Learning objective: Coalesce concurrent refreshes for the same expensive public query while serving a bounded stale result during one refresh.
- Decisive facts: The response is public and identical for the same normalized query and locale. At most one origin refresh may run for a cache key at a time. A previously computed result may be served until it is 20 seconds old while one refresh is in progress.
- Closest alternatives and misconceptions: independent_refresh_per_request: This violates the one-refresh-per-key limit and multiplies the expensive work. / single_global_result: Different normalized queries can have different results and cannot share one cache key.
- Reversal condition: If each request carries caller-specific filters or authorization, include those dimensions in the key or avoid sharing the response; the scenario only permits sharing a public normalized query.
- Nearest-neighbor distinction: Nearest: accepted N04 i019 permission-scoped audit snapshot and N02 i028 search cursor. Those bind a result to a permission or index snapshot; this item coalesces simultaneous recomputation for one public query key.
- Primary references: https://www.rfc-editor.org/rfc/rfc9111.html

