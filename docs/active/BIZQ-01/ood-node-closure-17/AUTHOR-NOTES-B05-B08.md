# Author notes — OOD N02 closure17, B05–B08

These records describe the exact current serialized proposal objects and their fixed old-source mappings. The new IDs replace the 001–019 rows with manifest-reserved 020–038 IDs; old source objects remain unchanged. The decision and diagnostics below are transcribed from the proposals, with one plausible close wrong option identified for discussion. Scenario guarantees are explicit prompt premises; references support only the general concept, not scenario-specific policy. This is author documentation, not independent semantic acceptance, source activation, producer proof, or runtime readiness.

## Cross-unit / accepted-neighbor map

- **B05 — immutable/value semantics:** snapshots, canonical values, safe sharing, and retained captured data. i032 keeps full-set conflict checking and coherent immutable publication in one concise answer; i034 retains all four review facts without repeating their favorable consequence. These decisions differ from B06 entity identity/equality/hash rules and B01–B04 ownership, transitions, command placement, and reasons-to-change. B05-i036 is copy-on-write progress-set replacement; accepted N01-B03-i021 associates a completion with exact exercise/scoring revisions.

- **B06 — identity/equality/hashing/lifecycle:** tests the exact identity contract stated for an entity or key; i025 focuses on Equals/GetHashCode consistency for rehydrated sessions with the same stable ID. Potential nearest neighbor is B03’s entity/value classification and multi-concept operation placement; reviewer should compare the keyed rule and consequence.

- **B07 — valid construction/factories:** focuses on creation-time preconditions and which values can be formed, distinct from B02 state-transition legality and B03 where command logic executes. i022 validates a local score range, i024 distinct mapping targets, i027 final settled-order money values, and i038 successful terminal output; i028 uses a route-local inclusive ordering predicate rechecked at acceptance.

- **B08 — optional/result/error contracts:** preserves distinctions among valid domain states, confirmed absence, invalid input, conflict, and inability to evaluate. Contexts near accepted N01-B04-i025 (referral consent), N01-B04-i026 (attempt/score), and N01-B04-i030 (seal verification) are surfaced for cross-unit comparison. i029 tests partial-update intent (keep/clear/replace); i034 distinguishes confirmed write outcomes from uncertainty after lost acknowledgement. These are authored contracts, not claims about a language SDK’s built-in result type.

## B05 — ac6e20b5eb4d2602ddf294185809d49465de9444d1f725330e5793dcfe4b455c

**Objective lens:** OOD-N02-B05; each row below carries its own explicit objective. **Fixed source action:** preserve each old source object and map old ID to the unused manifest ID shown in the heading.

**References:** [https://learn.microsoft.com/en-us/dotnet/api/system.collections.immutable?view=net-10.0](https://learn.microsoft.com/en-us/dotnet/api/system.collections.immutable?view=net-10.0); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/net-core-microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/net-core-microservice-domain-model). These support general concepts only; all vignette-specific guarantees come from the individual prompt.

### ood-n02-b05-i020 ← ood-n02-b05-i001

- **Objective:** Capture one coherent provider configuration per stream while later streams receive a published replacement.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “the current stream keeps its timing and error contract” inside the owner that can observe and enforce it. → Choose immutable config snapshots for each stream’s captured provider/timing pair, with a replacement active config for future streams.
- **Case fact:** The stream’s timing and provider form one captured configuration; publication affects new streams while existing streams keep their original pair.
- **Close alternative / diagnosis:** Cache a stream’s timing value but resolve its provider from the latest global configuration on every frame. — The provider would be live while timing remains captured, mixing configuration versions.
- **Boundary that would change the choice:** The per-stream capture point is the boundary; immediate switching of an already open stream would require a different explicit contract.

### ood-n02-b05-i021 ← ood-n02-b05-i002

- **Objective:** Copy a mutable nested assignment graph so editing a draft cannot alter a submitted proposal.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “skills and availability constraints hold for both assignments” inside the owner that can observe and enforce it. → Copy the assignment graph, including each mutable note, into a separate draft; leave the submitted proposal unchanged.
- **Case fact:** The mutable notes are reachable from both lists unless copied or converted to immutable values; the prompt requires the submitted text to remain reviewable.
- **Close alternative / diagnosis:** Copy only the assignment list and edit the same note objects from the draft. — The shared note is still mutable through the draft alias.
- **Boundary that would change the choice:** Drafts may remain editable; only the submitted proposal and its reachable mutable notes must be isolated.

### ood-n02-b05-i022 ← ood-n02-b05-i003

- **Objective:** Keep an accepted route revision as a conflict baseline while editing a separate pending value.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “conflicts are explicit and never silently overwrite accepted geometry” inside the owner that can observe and enforce it. → Create a separate pending route revision; retain accepted geometry as the baseline until the pending revision is accepted.
- **Case fact:** The key boundary is accepted versus pending revision; this does not require the pending draft itself to be immutable while it is being edited.
- **Close alternative / diagnosis:** Apply pending points directly to the accepted geometry and label the result pending. — This edits the baseline before the pending revision is accepted.
- **Boundary that would change the choice:** This freezes accepted geometry, not the pending draft before acceptance.

### ood-n02-b05-i023 ← ood-n02-b05-i004

- **Objective:** Capture the minimal immutable inputs for a transient calculation without turning it into permanent history.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “reward rules depend on the current legal campaign state” inside the owner that can observe and enforce it. → Use an ephemeral immutable calculation input; do not persist a permanent result snapshot for a preview that is discarded.
- **Case fact:** This is an ephemeral calculation boundary: capture the inputs together for one preview, while reserving permanent provenance snapshots for published results.
- **Close alternative / diagnosis:** Persist a permanent historical copy of every character field and rules object even though the preview is discarded. — The transient preview does not require permanent archival storage.
- **Boundary that would change the choice:** Discard the captured values after the preview; persistence is needed only if the result becomes a published record.

### ood-n02-b05-i024 ← ood-n02-b05-i005

- **Objective:** Safely share an immutable child value while replacing the coupled plan that must be validated as a whole.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “temperature restrictions and hand-off ownership travel with the shipment” inside the owner that can observe and enforce it. → Replace the plan value while reusing its immutable temperature-band value; validate the new shipment and custody fields together.
- **Case fact:** The approval condition spans the shipment, its temperature band, and its custody handoff; the planner must validate that combined value before publication.
- **Close alternative / diagnosis:** Validate temperature and custody separately, then publish without checking them together against the shipment as one approved plan. — Separate checks do not establish that the combined shipment, temperature band, and custody handoff form the approved plan.
- **Boundary that would change the choice:** Share the immutable child but replace the mutable composite plan whose fields are validated together.

### ood-n02-b05-i025 ← ood-n02-b05-i006

- **Objective:** Model a composite amount as a value whose currency and minor units both determine equivalence.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “a repayment cannot reduce the outstanding balance below zero” inside the owner that can observe and enforce it. → Represent the allocation amount as an immutable value containing both currency and minor units.
- **Case fact:** This is value semantics for a composite amount, not entity identity: all stated components participate in the value.
- **Close alternative / diagnosis:** Treat each amount as a separate identity even when both currency and minor units match. — The prompt defines equal component pairs as interchangeable values.
- **Boundary that would change the choice:** Use these equivalence components only because the prompt explicitly defines them; do not infer other amount rules.

### ood-n02-b05-i026 ← ood-n02-b05-i007

- **Objective:** Represent a correction as a new immutable record linked to the finalized result it supersedes.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “the bracket advances only from a legal match state” inside the owner that can observe and enforce it. → Append a correction record that points to the finalized result; retain the original result as an immutable historical fact.
- **Case fact:** Immutable records work here because the domain needs a durable before/after trail, not merely a replaceable current value.
- **Close alternative / diagnosis:** Overwrite the finalized winner and keep the original result ID. — This destroys the finalized result that the correction must supersede.
- **Boundary that would change the choice:** The original result and correction are distinct audit records; the prompt does not require a new tournament identity.

### ood-n02-b05-i027 ← ood-n02-b05-i008

- **Objective:** Freeze submitted condition facts while keeping a later eligibility decision in its own lifecycle.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “classification and refund eligibility are not the same responsibility” inside the owner that can observe and enforce it. → Submit an immutable condition-report value and keep the later refund decision outside that report.
- **Case fact:** Freeze the report at submission, but do not mistake immutability for freezing the entire workflow or merging later decisions into it.
- **Close alternative / diagnosis:** Add a mutable refundEligible flag to the report and let inspection change it after submission. — The refund decision is separate from the submitted condition observation.
- **Boundary that would change the choice:** Freeze the condition report at submission; the later refund decision remains outside that snapshot.

### ood-n02-b05-i028 ← ood-n02-b05-i009

- **Objective:** Retain exact immutable input-version references on a published computation for later audit.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “published outputs reference immutable inputs and code versions” inside the owner that can observe and enforce it. → Persist exact immutable dataset/code revision references on the audit-retained result; do not resolve “current” inputs later.
- **Case fact:** This is durable provenance for a published computation, unlike a transient preview that only needs a consistent input during calculation.
- **Close alternative / diagnosis:** Copy the dataset bytes but store “current” instead of the exact code revision used for the published run. — The run would lack its exact code revision, so later readers could not identify the code that produced it.
- **Boundary that would change the choice:** The result needs both exact dataset and code revisions; the prompt does not require copying dataset bytes.

### ood-n02-b05-i029 ← ood-n02-b05-i010

- **Objective:** Separate the immutable accepted comment from delivery state that changes during retries.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “accepted comments must retain their author and document revision” inside the owner that can observe and enforce it. → Keep accepted comment text, author, and revision in an immutable value; track retry status in a separate delivery record.
- **Case fact:** Separate an accepted immutable value from the operational state that legitimately changes after acceptance.
- **Close alternative / diagnosis:** Copy the text but read author and revision from the live editor whenever retry runs. — The accepted author and revision must not be read from mutable editor state.
- **Boundary that would change the choice:** Delivery attempts can change independently without changing accepted comment facts.

### ood-n02-b05-i030 ← ood-n02-b05-i011

- **Objective:** Retry the exact submitted payload rather than rebuilding it from a subsequently edited draft.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “a submission is either complete or explicitly retryable” inside the owner that can observe and enforce it. → Capture the submitted request as an immutable payload and retry that same payload.
- **Case fact:** The immutable boundary starts at submission, not while the inspector is still editing the draft.
- **Close alternative / diagnosis:** Rebuild the request from the latest offline form on every retry. — The retry would send edited values rather than the accepted request.
- **Boundary that would change the choice:** The immutable payload begins at submit, not while the local form is still being edited.

### ood-n02-b05-i031 ← ood-n02-b05-i012

- **Objective:** Keep each invoice issue’s timestamp and exact inputs fixed when a corrected issue is created.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “the new issue is traceable and does not double-charge the customer” inside the owner that can observe and enforce it. → Create a new immutable issue snapshot for the corrected address/tax values and leave the rejected issue intact.
- **Case fact:** The customer/sequence continuity and the per-issue historical values are separate facts; immutable issue values preserve the latter.
- **Close alternative / diagnosis:** Edit the rejected issue’s address and tax values while keeping its original timestamp. — That changes the historical inputs while retaining the original issue timestamp.
- **Boundary that would change the choice:** The prior issue remains a historical record; reissue values get a separate issue snapshot.

### ood-n02-b05-i032 ← ood-n02-b05-i013

- **Objective:** Validate related command rules together and publish one immutable set only when no cross-entry conflict remains.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “revocation is visible to the door policy before access is granted” inside the owner that can observe and enforce it. → Validate cross-entry conflicts across the full set; publish an immutable replacement only when coherent.
- **Case fact:** The permit/prohibit conflict can span two rows; publishing only individually valid rows does not prove the combined rules are valid.
- **Close alternative / diagnosis:** Edit the active collection while the cross-entry validation is still running. — Readers could observe a mixture of old and new rows before the complete set passes validation.
- **Boundary that would change the choice:** After a complete set passes, later policy edits create another replacement; this does not freeze policy forever.

### ood-n02-b05-i033 ← ood-n02-b05-i014

- **Objective:** Apply only the service’s stated normalization rules when constructing a postal value.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “the printed label represents the current approved shipment data” inside the owner that can observe and enforce it. → Construct an immutable canonical postal value using those stated normalization rules before comparing or printing it.
- **Case fact:** The label stores the canonical address produced under the stated country/postal rule; later source-form edits cannot rewrite that generated value.
- **Close alternative / diagnosis:** Remove punctuation and accents from every address field even though the prompt defines no such normalization. — Those extra transformations are not authorized by the stated normalization.
- **Boundary that would change the choice:** The prompt defines the exact normalization and requires the generated label to retain the result; it does not define extra address-cleaning rules.

### ood-n02-b05-i034 ← ood-n02-b05-i015

- **Objective:** Review a proposed booking against the exact room and attendee facts captured for that proposal.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “the room capacity and cancellation policy must remain consistent” inside the owner that can observe and enforce it. → Review the immutable proposal using captured destination, attendee count, capacity, and cancellation policy.
- **Case fact:** The captured policy travels with the room and capacity facts, so later policy or attendee edits cannot change what the review approved.
- **Close alternative / diagnosis:** Update the confirmed booking’s room before checking the proposal’s captured capacity. — Confirmation is a later boundary; changing confirmed state first violates it.
- **Boundary that would change the choice:** The confirmed booking remains unchanged until the proposal is confirmed; the prompt requires capturing the policy but not freezing future policy versions globally.

### ood-n02-b05-i035 ← ood-n02-b05-i016

- **Objective:** Break a mutable caller alias when accepting input into a published immutable collection.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “unsafe commands are rejected while maintenance is active” inside the owner that can observe and enforce it. → Copy the mutable form input into an immutable collection at construction so no caller retains a write alias.
- **Case fact:** The form still holds the mutable list after publication, so the published configuration must own an immutable copy rather than a wrapper over the form’s collection.
- **Close alternative / diagnosis:** Store the form’s mutable list directly and wrap only the configuration getter in a read-only interface. — The form still owns and can mutate the shared list reference.
- **Boundary that would change the choice:** The published rule set is immutable; a future edit constructs another value rather than freezing the controller forever.

### ood-n02-b05-i036 ← ood-n02-b05-i017

- **Objective:** Return a new immutable progress-set value so a later completion does not mutate a snapshot already held by report readers.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “progress refers to a stable lesson identity” inside the owner that can observe and enforce it. → Return a new immutable progress set with the completed lesson ID; retain the old snapshot for readers already using it.
- **Case fact:** The profile can advance with one added lesson ID while an already loaded report continues to use its unchanged snapshot.
- **Close alternative / diagnosis:** Assign a new lesson identity for the completion so the old set does not need updating. — Completing a lesson records progress against its existing identity; it does not create another lesson.
- **Boundary that would change the choice:** Only the progress collection value is replaced; retired lesson identity remains present for existing progress.

### ood-n02-b05-i037 ← ood-n02-b05-i018

- **Objective:** Capture all fields needed for a coherent export from one board revision.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “export observes a stable session state” inside the owner that can observe and enforce it. → Capture strokes and labels together into one immutable export input before rendering.
- **Case fact:** Capture only the fields needed for a coherent export; the board can remain editable after that snapshot.
- **Close alternative / diagnosis:** Copy strokes at the start but resolve participant labels from the live board later. — Those fields can come from different revisions.
- **Boundary that would change the choice:** Editing can continue after capture; the export builder reads the fixed snapshot.

### ood-n02-b05-i038 ← ood-n02-b05-i019

- **Objective:** Keep transfer-time owner and deadline facts fixed while the support case continues to change.
- **Decision changed:** Use value semantics when replacement is safer than coordination and identity is not part of the concept. In this case, that keeps the rule “the escalation keeps ownership and response deadlines” inside the owner that can observe and enforce it. → Store an immutable transfer value with the owner and deadline effective at the transfer.
- **Case fact:** Freeze the transfer facts in the receipt without freezing the ongoing support case.
- **Close alternative / diagnosis:** Render old transfer receipts from the case’s current owner and deadline. — That changes the receipt after the transfer it records.
- **Boundary that would change the choice:** The receipt is immutable while the support case continues its live lifecycle.

These proposal bytes remain hypotheses pending independent whole-object and cross-cohort review. No source/catalog/proof/candidate/admission/runtime file is changed by this notes document.

## B06 — 46ba770ef4ebeb58c0f4a7e0dc312afb89c4d5efd17474612276276b6975249b

**Objective lens:** OOD-N02-B06; each row below carries its own explicit objective. **Fixed source action:** preserve each old source object and map old ID to the unused manifest ID shown in the heading.

**References:** [https://learn.microsoft.com/en-us/dotnet/api/system.object.gethashcode?view=net-10.0](https://learn.microsoft.com/en-us/dotnet/api/system.object.gethashcode?view=net-10.0); [https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/statements-expressions-operators/how-to-define-value-equality-for-a-type](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/statements-expressions-operators/how-to-define-value-equality-for-a-type). These support general concepts only; all vignette-specific guarantees come from the individual prompt.

### ood-n02-b06-i020 ← ood-n02-b06-i001

- **Objective:** Keep a temporary authorization record addressable while its role and expiry change.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “the role expires and is attributable to a specific approval” inside the owner that can observe and enforce it. → Use grant ID; role and expiry are grant attributes.
- **Case fact:** For this grant ID, the key stays attached to the record through role or expiry; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** Use role plus expiry, so a corrected expiry creates a different key. — Changing role or expiry would change the key for a grant the prompt says remains the same record.
- **Boundary that would change the choice:** If a role correction actually revoked one grant and issued another, the prompt would need that separate lifecycle.

### ood-n02-b06-i021 ← ood-n02-b06-i002

- **Objective:** Distinguish separate seal records even when they cover the same immutable document.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “the seal covers the exact immutable revision” inside the owner that can observe and enforce it. → Use seal ID for equality; revision digest and signer metadata are not the seal’s identity.
- **Case fact:** For this seal ID, the key stays attached to the record through signer metadata; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** Use signer plus timestamp, so correcting signer metadata changes the seal key. — Correcting signer metadata must not change the seal’s stable identity.
- **Boundary that would change the choice:** If the model were a set of signed revision contents rather than seal records, content identity could be a different contract.

### ood-n02-b06-i022 ← ood-n02-b06-i003

- **Objective:** Make retries resolve to the same payout record without merging equal-valued payouts.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “release is idempotent and tied to a settled order” inside the owner that can observe and enforce it. → Use payout ID for equality and key lookup; amount and status may change without changing the payout.
- **Case fact:** For this payout ID, the key stays attached to the record through release status and retry state; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** Create a new payout key for every retry. — A retry repeats the same payout request key rather than creating a new payout.
- **Boundary that would change the choice:** If a retry represented a genuinely new payout, it would need a new payout ID and a separate business intent.

### ood-n02-b06-i023 ← ood-n02-b06-i004

- **Objective:** Preserve superseded notices as distinct audit records.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “passengers receive the change in the order in which it becomes effective” inside the owner that can observe and enforce it. → Use notice ID so the original and superseding notice remain separate records.
- **Case fact:** For this notice ID, the key stays attached to the record through supersession; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** Use only the latest notice per station and discard the superseded record. — Discarding the superseded notice violates the stated audit history.
- **Boundary that would change the choice:** A live board of current platform state may choose one current value; this collection is explicitly an audit history.

### ood-n02-b06-i024 ← ood-n02-b06-i005

- **Objective:** Keep a reservation addressable when its interval is corrected or it is cancelled.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “a meter cannot be committed twice for an overlapping window” inside the owner that can observe and enforce it. → Use reservation ID; a corrected interval does not replace the reservation.
- **Case fact:** For this reservation ID, the key stays attached to the record through interval correction and cancellation; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** Use meter ID alone, allowing only one historical reservation per meter. — One meter has multiple non-overlapping reservations; meter ID alone cannot distinguish them.
- **Boundary that would change the choice:** If each interval amendment were an independently auditable booking, the prompt would give each amendment its own identity.

### ood-n02-b06-i025 ← ood-n02-b06-i006

- **Objective:** Keep session identity stable across provider-configuration history.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “the current stream keeps its timing and error contract” inside the owner that can observe and enforce it. → Compare the immutable session ID for equality and derive the hash from that same ID; exclude provider settings and history.
- **Case fact:** Two separately loaded objects for the same session ID must compare equal even if one has a newer provider-history entry. Using the ID for both equality and hashing preserves that result.
- **Close alternative / diagnosis:** Compare session IDs but include the current provider endpoint only in the hash. — The same session ID could then produce different hashes after provider changes, breaking the equality/hash contract.
- **Boundary that would change the choice:** If the system assigned tenant-scoped IDs, the prompt would need that scope in the identity key. It states a single immutable session ID here.

### ood-n02-b06-i026 ← ood-n02-b06-i007

- **Objective:** Preserve assignment identity when volunteers are swapped between assignments.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “skills and availability constraints hold for both assignments” inside the owner that can observe and enforce it. → Use assignment ID; volunteer and availability are current assignment data.
- **Case fact:** For this assignment ID, the key stays attached to the record through occupying volunteer; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** Use volunteer ID, which would make an assignment follow a person when the prompt says assignments are retained. — The assignment remains the record being swapped; it does not follow the volunteer to a different assignment.
- **Boundary that would change the choice:** If the business operation replaced assignments rather than reassigning them, new IDs could represent that different lifecycle.

### ood-n02-b06-i027 ← ood-n02-b06-i008

- **Objective:** Keep independent edit submissions reviewable even when their geometry matches.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “conflicts are explicit and never silently overwrite accepted geometry” inside the owner that can observe and enforce it. → Use edit ID so equal geometry from separate edit records does not merge.
- **Case fact:** For this edit ID, the key stays attached to the record through geometry and review state; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** Use author ID alone, merging that author’s separate edits. — Two edits by one author can still be separate submissions.
- **Boundary that would change the choice:** If the product only kept unique geometries, it would need a content-deduplication contract instead of edit-history identity.

### ood-n02-b06-i028 ← ood-n02-b06-i009

- **Objective:** Keep character identity stable while quest progress changes.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “reward rules depend on the current legal campaign state” inside the owner that can observe and enforce it. → Use character ID; progress is mutable character state.
- **Case fact:** For this character ID, the key stays attached to the record through quest progress; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** Create a new character identity each time quest progress changes. — A progress update does not create a new character under the stated lifecycle.
- **Boundary that would change the choice:** If a character were cloned into a distinct campaign participant, that new participant would need its own ID.

### ood-n02-b06-i029 ← ood-n02-b06-i010

- **Objective:** Keep a shipment hash key stable across carrier reassignment.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “temperature restrictions and hand-off ownership travel with the shipment” inside the owner that can observe and enforce it. → Use shipment ID; carrier assignment is mutable shipment state.
- **Case fact:** For this shipment ID, the key stays attached to the record through carrier assignment; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** Use carrier ID, merging every shipment assigned to that carrier. — Carrier ID would group many shipments rather than resolve this shipment.
- **Boundary that would change the choice:** A separate index from carrier to shipments can use carrier ID as its key without changing shipment identity.

### ood-n02-b06-i030 ← ood-n02-b06-i011

- **Objective:** Distinguish separately reversible allocations with equal account and amount.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “a repayment cannot reduce the outstanding balance below zero” inside the owner that can observe and enforce it. → Use allocation ID; amount and account do not merge separately reversible allocations.
- **Case fact:** For this allocation ID, the key stays attached to the record through reversal state; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** Use the account ID alone, allowing only one allocation per account. — One account can have more than one allocation record.
- **Boundary that would change the choice:** A balance total may be a value derived from allocations; it is not the identity of an individual allocation.

### ood-n02-b06-i031 ← ood-n02-b06-i012

- **Objective:** Keep one match addressable through status transitions while events remain separate.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “the bracket advances only from a legal match state” inside the owner that can observe and enforce it. → Match ID only; status is mutable lifecycle state.
- **Case fact:** For this match ID, the key stays attached to the record through match status; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** A new match ID for each state transition. — The prompt keeps one match ID, not a new match record per state transition.
- **Boundary that would change the choice:** Individual transition events can have their own IDs while referring to the match ID.

### ood-n02-b06-i032 ← ood-n02-b06-i013

- **Objective:** Keep physical-item identity stable through inspection corrections.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “classification and refund eligibility are not the same responsibility” inside the owner that can observe and enforce it. → Use serial number; condition is a revisable inspection fact.
- **Case fact:** For this serial number, the key stays attached to the record through condition category; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** Use the condition’s hash as a unique item identifier. — A condition hash cannot serve as a unique serial number.
- **Boundary that would change the choice:** A replacement physical unit would have a different serial number and therefore a different identity.

### ood-n02-b06-i033 ← ood-n02-b06-i014

- **Objective:** Distinguish executions even when outputs are byte-identical.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “published outputs reference immutable inputs and code versions” inside the owner that can observe and enforce it. → Use run ID; identical output does not make two executions the same run.
- **Case fact:** For this run ID, the key stays attached to the record through output equality and run status; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** Use output digest and merge the two executions. — Equal output does not merge the two explicitly separate execution records.
- **Boundary that would change the choice:** A separate artifact catalog may de-duplicate identical outputs while each run keeps its own ID.

### ood-n02-b06-i034 ← ood-n02-b06-i015

- **Objective:** Retain separate comments with same text/revision and different authors.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “accepted comments must retain their author and document revision” inside the owner that can observe and enforce it. → Use comment ID; text/revision equality does not merge distinct comments.
- **Case fact:** For this comment ID, the key stays attached to the record through comment text; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** Use text plus revision and merge matching comments regardless of author. — Two comments by different authors can share the same text and revision; text equality would merge them.
- **Boundary that would change the choice:** A normalized text value could be compared for search or duplicate suggestions without redefining comment identity.

### ood-n02-b06-i035 ← ood-n02-b06-i016

- **Objective:** Resolve the same submission across sync retries and status changes.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “a submission is either complete or explicitly retryable” inside the owner that can observe and enforce it. → Use submission ID; sync status is lifecycle state, not the submission’s identity.
- **Case fact:** For this submission ID, the key stays attached to the record through sync status; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** Use sync status so acknowledgement changes the key. — Acknowledgement changes sync status, not submission identity.
- **Boundary that would change the choice:** A newly authored inspection should receive a new submission ID; transport retry should reuse the existing one.

### ood-n02-b06-i036 ← ood-n02-b06-i017

- **Objective:** Differentiate re-delivery retry of one invoice issue from a new corrected issue.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “the new issue is traceable and does not double-charge the customer” inside the owner that can observe and enforce it. → Retry uses the existing issue ID; corrected reissue is a new issue record with a new ID and a link to the rejected one.
- **Case fact:** A retry therefore keeps the rejected invoice’s issue ID. Once corrected fields are issued, the new invoice receives a new issue ID and a link back to the rejected issue.
- **Close alternative / diagnosis:** Create a new issue ID for every delivery retry. — A delivery retry repeats the same issue ID by the stated contract.
- **Boundary that would change the choice:** This rule distinguishes invoice issue records and their delivery attempts; it does not redefine the customer’s identity or deduplicate invoices by address.

### ood-n02-b06-i037 ← ood-n02-b06-i018

- **Objective:** Keep a revoked badge record distinct from its owner and any replacement badge.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “revocation is visible to the door policy before access is granted” inside the owner that can observe and enforce it. → Use badge ID; revocation changes status, while a replacement physical badge is a different badge record.
- **Case fact:** For this badge ID, the key stays attached to the record through revocation; the related values can be compared or indexed separately.
- **Close alternative / diagnosis:** Keep the badge ID but compare equality only when it is active. — The prompt gives each badge its own ID; active state does not erase revoked-record identity.
- **Boundary that would change the choice:** The person can link multiple badge entities without becoming their shared badge identity.

### ood-n02-b06-i038 ← ood-n02-b06-i019

- **Objective:** Preserve separate print records even when labels show the same address.
- **Decision changed:** Keep equality and hashing aligned with stable identity or value semantics across the object's lifecycle. In this case, that keeps the rule “the printed label represents the current approved shipment data” inside the owner that can observe and enforce it. → Use label ID; address equality does not merge separate print records.
- **Case fact:** The original print keeps its label ID. After an address correction, the service creates a new print record with a new label ID, even if its address or rendered bytes happen to match another label.
- **Close alternative / diagnosis:** Use normalized address as the label key and keep only one print per address. — Equal addresses do not merge separate label print records.
- **Boundary that would change the choice:** Addresses or rendered bytes may support search or comparison, but the prompt requires each print event to remain separately identifiable.

These proposal bytes remain hypotheses pending independent whole-object and cross-cohort review. No source/catalog/proof/candidate/admission/runtime file is changed by this notes document.

## B07 — 781ed817fdddc5e6533e46136ecbae1aef116ab53ae7b4ed2f3c9cf7d198881e

**Objective lens:** OOD-N02-B07; each row below carries its own explicit objective. **Fixed source action:** preserve each old source object and map old ID to the unused manifest ID shown in the heading.

**References:** [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/net-core-microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/net-core-microservice-domain-model). These support general concepts only; all vignette-specific guarantees come from the individual prompt.

### ood-n02-b07-i020 ← ood-n02-b07-i001

- **Objective:** Validate stable request identifiers at construction, but check changing fleet exclusivity at commit.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “a battery cannot be assigned to two aircraft at once” inside the owner that can observe and enforce it. → Require both IDs at request creation; check current assignment exclusivity at commit.
- **Case fact:** Creating a complete request makes it usable by the fleet scheduler; the scheduler must check current assignment when it commits the replacement reservation. Another reservation may appear after the request is created.
- **Close alternative / diagnosis:** Query current fleet assignment in the request constructor and assume it stays true until commit. — Assignment status may change after this constructor check; the prompt assigns exclusivity to commit.
- **Boundary that would change the choice:** A valid request guarantees both identifiers are present, not that the battery remains available or that a later reservation will succeed.

### ood-n02-b07-i021 ← ood-n02-b07-i002

- **Objective:** Require complete referral facts without treating stored consent evidence as current send authorization.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “privacy and consent rules apply before external disclosure” inside the owner that can observe and enforce it. → Construct only with patient, specialty, and consent reference; authorize any external send separately.
- **Case fact:** The factory rejects an incomplete referral before routing. The send operation separately obtains a fresh authorization result immediately before external disclosure.
- **Close alternative / diagnosis:** Treat possession of a consent reference as permanent send authorization. — Consent evidence is not the fresh authorization check the prompt separately requires before sending.
- **Boundary that would change the choice:** A valid Referral means its required identity and evidence fields exist; it is neither proof of current authorization nor permission to send by itself.

### ood-n02-b07-i022 ← ood-n02-b07-i003

- **Objective:** Validate the completed-attempt score as an integer from zero through one hundred.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “completion records the exercise version and score policy” inside the owner that can observe and enforce it. → Require an integer earned-points value from 0 through 100 inclusive before constructing CompletedAttempt.
- **Case fact:** The factory accepts 0 and 100 and rejects fractional or out-of-range values before a completion record is constructed; it preserves rather than clamps the scorer’s result.
- **Close alternative / diagnosis:** Clamp values below zero to zero and above 100 to 100 before storing them. — Clamping changes the scorer’s result instead of rejecting a value that violates the contract.
- **Boundary that would change the choice:** This check concerns the stored score field only. It does not recompute scoring policy or assert anything about a missing score outcome.

### ood-n02-b07-i023 ← ood-n02-b07-i004

- **Objective:** Require approval evidence and bounded scope before constructing an exception record.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “approval is attributable, bounded, and cannot bypass required controls” inside the owner that can observe and enforce it. → Create through a factory that requires approver, bounded scope, and approval evidence.
- **Case fact:** The keyed factory call receives the named approver, bounded scope, and approval reference together. The alternative public empty constructor would create a second path that can expose a partial record before those fields are supplied.
- **Close alternative / diagnosis:** Expose a public empty constructor and let callers set approver and scope in any order. — A public empty constructor permits a partially attributed exception.
- **Boundary that would change the choice:** Construction validates presence and shape of the supplied record facts; it does not perform or impersonate the independent approval operation.

### ood-n02-b07-i024 ← ood-n02-b07-i005

- **Objective:** Reject two annotation segments that map to the same replacement segment ID.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “annotations follow stable segments rather than file offsets” inside the owner that can observe and enforce it. → Require distinct replacement segment IDs for distinct old segments before creating the revision.
- **Case fact:** The revision factory checks destination IDs before creating the replacement revision; the check prevents two annotations from sharing one replacement anchor.
- **Close alternative / diagnosis:** Keep only the first mapping when two old segments target the same replacement segment. — Dropping one complete mapping loses an annotation instead of rejecting the collision.
- **Boundary that would change the choice:** This question tests duplicate destinations, not whether an annotation is missing or whether a partial revision may become active.

### ood-n02-b07-i025 ← ood-n02-b07-i006

- **Objective:** Enforce grant field and expiry invariants while consuming already-checked approval evidence.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “the role expires and is attributable to a specific approval” inside the owner that can observe and enforce it. → Require grant ID, approval reference, and expiry; reject expiry at or before grant time.
- **Case fact:** The factory rejects a grant with no expiry or an expiry at/before its grant time; approver authorization has already been checked before the call.
- **Close alternative / diagnosis:** Make the grant constructor call the approval provider and infer the approver ID. — Approver authorization is checked before this factory; construction should validate supplied facts rather than infer a different approver.
- **Boundary that would change the choice:** The factory validates the supplied grant facts; it does not independently re-authorize the approver or guarantee the grant remains active later.

### ood-n02-b07-i026 ← ood-n02-b07-i007

- **Objective:** Bind a seal to the exact immutable document revision supplied at creation.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “the seal covers the exact immutable revision” inside the owner that can observe and enforce it. → Construct the seal from the exact immutable revision reference.
- **Case fact:** The factory receives the supplied immutable revision reference, so a subsequent edit to the current document cannot silently substitute another revision into the request.
- **Close alternative / diagnosis:** Use a title string as a substitute for the immutable revision reference. — A title is descriptive and does not select the immutable revision named by the prompt.
- **Boundary that would change the choice:** Creation fixes the requested revision; the signing operation may still fail and does not make the result successful merely because a request object exists.

### ood-n02-b07-i027 ← ood-n02-b07-i008

- **Objective:** Take payout amount and currency from the settled order’s final values.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “release is idempotent and tied to a settled order” inside the owner that can observe and enforce it. → Require a settled order and copy its final amount and currency into the payout.
- **Case fact:** The factory requires settlement and copies the order’s final amount/currency into the payout record; it does not reconstruct money from mutable draft or catalog data.
- **Close alternative / diagnosis:** Create from the order ID alone and fill amount and currency after publication. — A payout cannot represent the required amount and currency if they are deferred until after publication.
- **Boundary that would change the choice:** This construction rule identifies the payout’s money values; it does not define retry identity, payment delivery, or ledger settlement.

### ood-n02-b07-i028 ← ood-n02-b07-i009

- **Objective:** Allow equal route effective times and recheck the nondecreasing predicate at acceptance.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “passengers receive the change in the order in which it becomes effective” inside the owner that can observe and enforce it. → Require station, platform, and effective instant; allow equality with the observed latest time and atomically recheck that it is not earlier at acceptance.
- **Case fact:** The factory compares with the observed route time, then the acceptance transaction reloads the latest route notice and repeats the nondecreasing comparison before acceptance.
- **Close alternative / diagnosis:** Allow a missing effective time and sort the notice at display time. — Without the supplied instant, neither the factory nor acceptance can apply the route’s ordering rule.
- **Boundary that would change the choice:** The guarantee is bounded to the stated acceptance transaction and route sequence. It does not impose order across routes or promise future notices cannot be accepted later.

### ood-n02-b07-i029 ← ood-n02-b07-i010

- **Objective:** Validate interval shape at value creation and defer changing schedule overlap to commit.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “a meter cannot be committed twice for an overlapping window” inside the owner that can observe and enforce it. → Validate start < end on interval creation; check overlap at commit.
- **Case fact:** The constructor rejects an empty or reversed interval using only its two instants; the commit operation checks whether that well-formed interval overlaps the then-current meter schedule.
- **Close alternative / diagnosis:** Defer start/end validation until a meter is physically committed. — The interval’s own constructor invariant is violated when start is not before end.
- **Boundary that would change the choice:** A planning operation against an explicitly supplied immutable schedule snapshot could evaluate overlap against that snapshot, but construction of the interval remains local.

### ood-n02-b07-i030 ← ood-n02-b07-i011

- **Objective:** Create a provider configuration only when language and timing support the stream contract.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “the current stream keeps its timing and error contract” inside the owner that can observe and enforce it. → Create config only for supported language/timing; retain the stream’s public error contract.
- **Case fact:** The factory compares the candidate’s declared support with the stream’s language/timing inputs and records the unchanged outward error contract before the switch is attempted.
- **Close alternative / diagnosis:** Replace the stream’s error contract with the provider’s raw errors. — Passing through provider-specific errors changes the public stream contract.
- **Boundary that would change the choice:** A well-formed compatible configuration does not guarantee the provider will be reachable or that the later switch succeeds.

### ood-n02-b07-i031 ← ood-n02-b07-i012

- **Objective:** Reject swaps that repeat an assignment ID and recheck changing availability at execution.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “skills and availability constraints hold for both assignments” inside the owner that can observe and enforce it. → Reject identical assignment IDs; recheck current skills and availability at execution.
- **Case fact:** Construction rejects a self-swap before execution; at commit the operation reloads current assignment facts and checks both volunteers’ skills and availability.
- **Close alternative / diagnosis:** Make assignment construction itself enforce both volunteers’ current availability. — Assignment construction cannot establish current availability of both volunteers.
- **Boundary that would change the choice:** A request with distinct IDs is syntactically valid, not a promise that both assignments remain eligible when the swap commits.

### ood-n02-b07-i032 ← ood-n02-b07-i013

- **Objective:** Capture a route edit’s parent revision so a stale submission remains an explicit branch.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “conflicts are explicit and never silently overwrite accepted geometry” inside the owner that can observe and enforce it. → Require the parent revision ID; retain a branch and compare it at acceptance.
- **Case fact:** The factory records which revision the offline edit began from. If the route advances, acceptance retains the edit as a branch for review rather than overwriting newer geometry.
- **Close alternative / diagnosis:** Construct an edit without a parent and attach whichever revision is latest when submitted. — Without the parent ID, conflict review cannot tell which route revision the edit branched from.
- **Boundary that would change the choice:** A recorded parent proves the edit’s ancestry, not that it can be merged or that its branch will be accepted.

### ood-n02-b07-i033 ← ood-n02-b07-i014

- **Objective:** Construct a reward claim only from eligibility tied to the campaign revision used.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “reward rules depend on the current legal campaign state” inside the owner that can observe and enforce it. → Require the eligibility result and campaign revision before claim creation.
- **Case fact:** The factory receives the eligibility result and its campaign revision; it does not infer eligibility from current quest fields or mutate them to make a claim possible.
- **Close alternative / diagnosis:** Store “eligible” without the campaign revision used to determine it. — Without the revision, the claim cannot say which campaign rules produced eligibility.
- **Boundary that would change the choice:** A later campaign revision can govern future claims but does not rewrite the revision recorded by an already-created claim.

### ood-n02-b07-i034 ← ood-n02-b07-i015

- **Objective:** Require both temperature compatibility and custody acknowledgement before carrier reassignment.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “temperature restrictions and hand-off ownership travel with the shipment” inside the owner that can observe and enforce it. → Require compatible temperature band and custody acknowledgement before reassignment.
- **Case fact:** The factory checks the accepted carrier record against the shipment band and requires its custody acknowledgement before producing the new assignment.
- **Close alternative / diagnosis:** Create the reassignment after checking temperature but before custody is acknowledged. — Temperature compatibility alone does not satisfy the separate custody acknowledgement condition.
- **Boundary that would change the choice:** A valid assignment reflects the recorded capability and acknowledgement; the factory cannot manufacture carrier acceptance or promise later operational performance.

### ood-n02-b07-i035 ← ood-n02-b07-i016

- **Objective:** Validate an allocation against its stated balance snapshot and recheck at posting.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “a repayment cannot reduce the outstanding balance below zero” inside the owner that can observe and enforce it. → Validate amount against the supplied balance snapshot; recheck current balance at posting.
- **Case fact:** Construction validates the proposed amount against the snapshot passed with it; posting reloads the ledger balance and repeats the current-balance guard.
- **Close alternative / diagnosis:** Treat a valid snapshot check as a guarantee the balance will still be sufficient at posting. — A snapshot only validates the proposed amount against that earlier balance; the current balance can differ at posting.
- **Boundary that would change the choice:** This validates the proposal against its stated snapshot but does not guarantee commit success or reserve funds.

### ood-n02-b07-i036 ← ood-n02-b07-i017

- **Objective:** Check timeout and active state when creating a forfeit decision, then recheck before commit.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “the bracket advances only from a legal match state” inside the owner that can observe and enforce it. → Check active match and elapsed timeout, then recheck match state at commit.
- **Case fact:** The decision path checks both facts when forming the forfeit decision and checks active state again when committing; a match finalized in between cannot be advanced by stale eligibility.
- **Close alternative / diagnosis:** Allow a forfeit after a match is finalized because timeout once elapsed. — Timeout elapsed alone does not override a match that has since finalized.
- **Boundary that would change the choice:** The decision can be constructed only from the stated active/elapsed facts; commit still decides against current match state.

### ood-n02-b07-i037 ← ood-n02-b07-i018

- **Objective:** Require an allowed condition category without putting a later refund outcome into the report.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “classification and refund eligibility are not the same responsibility” inside the owner that can observe and enforce it. → Create only from an allowed condition category; do not store the later refund outcome.
- **Case fact:** The constructor accepts an inspection category; it does not accept refund language as a category or try to evaluate refund policy before the report exists.
- **Close alternative / diagnosis:** Use a refund outcome such as “refund pending” as the condition category, although it is not an inspection category. — “Refund pending” is a downstream policy outcome, not one of the inspection categories the report is allowed to carry.
- **Boundary that would change the choice:** This rule constrains category membership only; the prompt does not say a submitted category can never be corrected or prescribe refund results.

### ood-n02-b07-i038 ← ood-n02-b07-i019

- **Objective:** Construct a published result only from a succeeded run with terminal output.
- **Decision changed:** Make invalid construction impossible or explicitly rejected before the object is observable. In this case, that keeps the rule “published outputs reference immutable inputs and code versions” inside the owner that can observe and enforce it. → Require a succeeded run and its terminal output before constructing PublishedResult.
- **Case fact:** The factory requires both succeeded state and terminal output before constructing PublishedResult; failure diagnostics stay in their separate failure record.
- **Close alternative / diagnosis:** Treat failure diagnostics as the terminal output of a successful result. — Failure diagnostics explain a failed run; they are not its successful published output.
- **Boundary that would change the choice:** This factory validates run outcome and output presence; it does not make the run succeed or define how it was executed.

These proposal bytes remain hypotheses pending independent whole-object and cross-cohort review. No source/catalog/proof/candidate/admission/runtime file is changed by this notes document.

## B08 — d0e6d4dce12cbb74caf50d7fc41d7637abd4f133e6fe22016a0555c355a17169

**Objective lens:** OOD-N02-B08; each row below carries its own explicit objective. **Fixed source action:** preserve each old source object and map old ID to the unused manifest ID shown in the heading.

**References:** [https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/null-safety/nullable-reference-types](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/null-safety/nullable-reference-types); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations). These support general concepts only; all vignette-specific guarantees come from the individual prompt.

### ood-n02-b08-i020 ← ood-n02-b08-i001

- **Objective:** Represent a confirmed missing reservation separately from a failed lookup.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “transfer preserves the plot boundary and approval history” inside the owner that can observe and enforce it. → Return absent reservation as a normal optional result; return lookup failure separately.
- **Case fact:** The plot steward needs three distinguishable observations here: a reservation, a confirmed absence, or an unsuccessful read.
- **Close alternative / diagnosis:** Return null for both no reservation and database failure. — The empty option is a normal value; an outage is an operation failure.
- **Boundary that would change the choice:** If this operation required a reservation to transfer, confirmed absence could be a command-level not-found outcome. This operation is the preceding read.

### ood-n02-b08-i021 ← ood-n02-b08-i002

- **Objective:** Keep a valid zero quote distinct from missing required component pricing.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “the bundle pricing policy remains consistent with its components” inside the owner that can observe and enforce it. → Return a valid quote, including zero, or a missing-component-price error.
- **Case fact:** The bundle may total zero even though every component price is present; a missing component price is a different condition and blocks a quote.
- **Close alternative / diagnosis:** Return no quote for both a valid zero total and a missing component price. — An optional quote alone cannot explain which required price is missing.
- **Boundary that would change the choice:** If a component were optional, the prompt would need to say how omission affects the quote. Here every required component price is needed.

### ood-n02-b08-i022 ← ood-n02-b08-i003

- **Objective:** Distinguish no available charger from inability to read the schedule.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “charger capacity and reservation expiry are coordinated” inside the owner that can observe and enforce it. → Use separate outcomes for available, no match, and schedule-read failure.
- **Case fact:** The result must preserve whether a charger was found, the search completed with no match, or the store could not answer.
- **Close alternative / diagnosis:** Return no match when the schedule read fails, so the caller reports “none available.” — A schedule timeout did not confirm an empty search, so this would falsely tell the operator that no charger is available.
- **Boundary that would change the choice:** An optional charger plus a distinct read error could encode the same meanings. The important contract is that the two outcomes remain distinguishable.

### ood-n02-b08-i023 ← ood-n02-b08-i004

- **Objective:** Preserve the difference between absent caption metadata and intentionally blank text.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “asset identity remains stable while descriptive values are replaced” inside the owner that can observe and enforce it. → Represent caption as optional text so absent differs from stored empty.
- **Case fact:** The field must carry both whether caption metadata was supplied and, when present, its text.
- **Close alternative / diagnosis:** Make caption required and invent placeholder text when it is absent. — A placeholder creates content the curator never supplied.
- **Boundary that would change the choice:** If the archive later defines absent and blank captions as equivalent, normalization could be valid; the current contract expressly keeps them distinct.

### ood-n02-b08-i024 ← ood-n02-b08-i005

- **Objective:** Return actionable validation errors for missing required licensing inputs.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “approval requires an explicit territory and expiration” inside the owner that can observe and enforce it. → Return field-specific validation errors for missing territory or expiry.
- **Case fact:** The analyst must know which of the two mandatory inputs to repair; neither a broad false value nor a search result supplies that guidance.
- **Close alternative / diagnosis:** Treat missing territory as worldwide and missing expiry as permanent. — The prompt supplies no worldwide scope or permanent duration, so these defaults would authorize more than the request states.
- **Boundary that would change the choice:** If policy introduced a default, it would have to be stated as a rule. The prompt instead makes both fields mandatory.

### ood-n02-b08-i025 ← ood-n02-b08-i006

- **Objective:** Distinguish an unknown battery from a known battery that is already assigned.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “a battery cannot be assigned to two aircraft at once” inside the owner that can observe and enforce it. → Report unknown serial separately from a found-but-assigned battery.
- **Case fact:** The coordinator needs to tell the operator whether the serial identifies a battery and whether that battery is currently assignable.
- **Close alternative / diagnosis:** Return an unassigned battery even when the serial is unknown. — The prompt explicitly distinguishes no record from a record that cannot be scheduled.
- **Boundary that would change the choice:** An availability-only search could filter assigned batteries if that behavior were explicitly requested. This lookup is required to distinguish the two cases.

### ood-n02-b08-i026 ← ood-n02-b08-i007

- **Objective:** Keep not-recorded, denied, and granted consent distinguishable; only granted permits sending.
- **Decision changed:** Preserve the three completed consent states and the independent send restriction. → Return distinct not-recorded, denied, and granted outcomes; permit referral sending only for granted.
- **Case fact:** The caller needs to distinguish not-recorded from denied for follow-up, and may send only on the granted outcome.
- **Close alternative / diagnosis:** Return granted as true and collapse denied and not recorded into one null result. — The prompt requires the caller to distinguish those two states for follow-up.
- **Boundary that would change the choice:** The representation may be enum, tagged union, nullable encoding, or another form; the visible outcomes and send rule must remain intact.

### ood-n02-b08-i027 ← ood-n02-b08-i008

- **Objective:** Keep a valid zero score distinct from no score and its timeout status.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “completion records the exercise version and score policy” inside the owner that can observe and enforce it. → Keep score optional; zero is a score, while timeout status explains absence.
- **Case fact:** The exercise history must record both the numeric result when awarded and the separate reason an attempt has no score.
- **Close alternative / diagnosis:** Drop timeout status and infer it from the absent score. — The status field already records why scoring did not occur.
- **Boundary that would change the choice:** If timeout attempts could earn partial credit, the policy would need to define that combination; this prompt says no answer means no score.

### ood-n02-b08-i028 ← ood-n02-b08-i009

- **Objective:** Represent approval lifecycle states, missing requests, and query failure distinctly.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “approval is attributable, bounded, and cannot bypass required controls” inside the owner that can observe and enforce it. → Return request states, not-found, and query failure as distinct outcomes.
- **Case fact:** A boolean can project whether approval is sufficient, but the authoritative query must preserve lifecycle state, request existence, and ability to read it.
- **Close alternative / diagnosis:** Return “rejected” when no request ID is found. — No request is not a rejection of an existing request.
- **Boundary that would change the choice:** A consumer that needs only “may proceed” can derive that projection after receiving the richer result; it should not erase status at the query boundary.

### ood-n02-b08-i029 ← ood-n02-b08-i010

- **Objective:** Preserve omitted, explicit-null, and supplied-value intents in a partial update.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “annotations follow stable segments rather than file offsets” inside the owner that can observe and enforce it. → Preserve omitted, explicit null, and supplied string as keep, clear, and replace.
- **Case fact:** The handler leaves the existing note untouched for omission, clears it for null, and replaces it for a string; the parser must not erase which case arrived.
- **Close alternative / diagnosis:** Treat omitted and explicit null as the same instruction to clear the current note. — This clears the note on omission even though omission means leave the current value unchanged.
- **Boundary that would change the choice:** This is the authored profile-update contract. It does not claim all APIs assign these meanings to omitted or null fields.

### ood-n02-b08-i030 ← ood-n02-b08-i011

- **Objective:** Distinguish no grant record from an existing expired grant.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “the role expires and is attributable to a specific approval” inside the owner that can observe and enforce it. → Return absent only for no record; include expired status for an existing grant.
- **Case fact:** The security reviewer needs a found grant with its expiry state, an active grant, or confirmed absence.
- **Close alternative / diagnosis:** Treat expired as absent and hide the audit record. — The lookup answers record existence while status answers whether it is currently usable.
- **Boundary that would change the choice:** A separate active-only query may filter expired records, but the full lookup described here must preserve their existence and status.

### ood-n02-b08-i031 ← ood-n02-b08-i012

- **Objective:** Separate named verification outcomes from verifier unavailability.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “the seal covers the exact immutable revision” inside the owner that can observe and enforce it. → Return each verification outcome plus a separate verifier-unavailable error.
- **Case fact:** The caller must distinguish a completed negative verdict that has a specific remedy from an inability to obtain any verdict.
- **Close alternative / diagnosis:** Return invalid for verifier outage even though no verification occurred. — No verification ran during the outage, so it establishes neither invalidity nor any other verdict about the seal.
- **Boundary that would change the choice:** The programming-language representation may vary, but the visible contract must retain all three completed outcomes and the unavailable case.

### ood-n02-b08-i032 ← ood-n02-b08-i013

- **Objective:** Distinguish confirmed absence of a payout from unknown status during ledger failure.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “release is idempotent and tied to a settled order” inside the owner that can observe and enforce it. → Use optional status for confirmed absence and a distinct ledger failure.
- **Case fact:** The finance operator needs to know whether the keyed release is absent, pending, or settled, while an outage must not be converted into “no payout.”
- **Close alternative / diagnosis:** Return null for both no payout and a ledger outage. — Null would erase whether absence was confirmed or unknown.
- **Boundary that would change the choice:** If an authoritative cached status were allowed during outages, the prompt would need to establish its freshness and authority. No such source is specified.

### ood-n02-b08-i033 ← ood-n02-b08-i014

- **Objective:** Keep empty notice history separate from an unknown route and read failure.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “passengers receive the change in the order in which it becomes effective” inside the owner that can observe and enforce it. → Return an empty list for known routes; distinguish unknown route and read failure.
- **Case fact:** The controller needs to tell a valid empty history from an invalid route reference and from a board that could not be read.
- **Close alternative / diagnosis:** Return null for an empty list and for an unknown route. — No published notices does not make the route unknown.
- **Boundary that would change the choice:** If an endpoint is defined to return empty for unknown routes, that would be a different contract; this prompt requires unknown IDs to be reported separately.

### ood-n02-b08-i034 ← ood-n02-b08-i015

- **Objective:** Use the continuation marker, not the current page length, to determine whether a filtered search is complete.
- **Decision changed:** Continue according to the local API's `nextCursor` marker even when filtering leaves the current page empty; finish only when the marker is absent.
- **Case fact:** In this authored API contract, an empty `items` page may still return an opaque `nextCursor`; the cursor is passed with the same search to retrieve the next page.
- **Close alternative / diagnosis:** Treat any empty items array as the end of the search. — A filtered empty page can still carry a cursor to a later page with matches.
- **Boundary that would change the choice:** The cursor behavior is stated as a premise of this scenario, not a universal pagination or SDK guarantee; unrelated APIs may define completion differently. The redundant “continue only when a page is nonempty” distractor and its matching message were removed.

### ood-n02-b08-i035 ← ood-n02-b08-i016

- **Objective:** Preserve the working provider on inconclusive discovery; report confirmed incompatibility separately from a registry timeout.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “the current stream keeps its timing and error contract” inside the owner that can observe and enforce it. → Distinguish confirmed no match from registry unavailability; keep the current provider until a replacement is confirmed.
- **Case fact:** The current stream has a working provider. A failed discovery must not be converted into a claim that no replacement exists or trigger removal of the current provider.
- **Close alternative / diagnosis:** Return a null provider for both no match and registry failure. — Null hides whether discovery succeeded and found none.
- **Boundary that would change the choice:** If discovery had an authoritative local registry snapshot, the prompt would need to define its freshness. Here it specifies retry after registry timeout.

### ood-n02-b08-i036 ← ood-n02-b08-i017

- **Objective:** Return specific missing-reference and availability-conflict errors for a swap.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “skills and availability constraints hold for both assignments” inside the owner that can observe and enforce it. → Return missing-ID and availability-conflict errors with affected IDs.
- **Case fact:** An unknown assignment ID needs reference repair; a known but unavailable volunteer needs an eligibility resolution. Both outcomes leave the original pair unchanged.
- **Close alternative / diagnosis:** Treat an unknown assignment as unavailable without saying it was missing. — Unknown identity and present-but-unavailable are not the same state.
- **Boundary that would change the choice:** The prompt permits these two validation failures and promises no partial swap. It does not say every skill or availability change is a storage error.

### ood-n02-b08-i037 ← ood-n02-b08-i018

- **Objective:** Separate malformed geometry from a valid stale branch that must be retained.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “conflicts are explicit and never silently overwrite accepted geometry” inside the owner that can observe and enforce it. → Report geometry errors separately from a retained stale-parent conflict.
- **Case fact:** The cartographer needs two different next steps: repair malformed coordinates or review the preserved stale branch.
- **Close alternative / diagnosis:** Treat stale parent as invalid geometry. — Staleness does not make the geometry malformed.
- **Boundary that would change the choice:** Retaining the branch does not mean it is automatically mergeable; the prompt promises preservation for conflict review only.

### ood-n02-b08-i038 ← ood-n02-b08-i019

- **Objective:** Distinguish confirmed ineligibility from a missing character and failed evaluation.
- **Decision changed:** Choose an explicit absence or failure contract so callers cannot confuse missing data with a valid value. In this case, that keeps the rule “reward rules depend on the current legal campaign state” inside the owner that can observe and enforce it. → Return not-eligible, unknown-character, and rules-service-failure outcomes separately.
- **Case fact:** The caller’s next action differs: the learner may meet the quest condition, the character ID may need correction, or the rules service may need retry.
- **Close alternative / diagnosis:** Return eligible if the rules service does not respond. — No response cannot establish positive eligibility.
- **Boundary that would change the choice:** If a missing character were treated as not eligible, the prompt would need that mapping rule. It instead requires the missing character to be identified separately.

These proposal bytes remain hypotheses pending independent whole-object and cross-cohort review. No source/catalog/proof/candidate/admission/runtime file is changed by this notes document.
