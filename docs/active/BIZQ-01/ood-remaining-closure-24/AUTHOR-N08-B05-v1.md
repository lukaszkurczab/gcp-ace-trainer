# N08-B05 author notes — proposal v1

Before source SHA-256: `9ed4fbc42e1526372553053432cdb1b91de22a78b5547a20647f0571c6fa5910`
Proposal SHA-256: `379a3176955d92dd842b6bb0682b4ddd49844907105766bca115d5692bd8e0ba`

Proposal-only authorship rationale. Every stem states the collection-level condition and its read/write interleaving. The existing decision—individual method safety does not imply compound-operation atomicity—remains the objective, so IDs are retained. Former generic alternatives were replaced with case-specific options and new option IDs; feedback targets those current meanings. Statements about the collection are explicit fictional scenario premises, not general claims inferred from the references. Not semantic acceptance or activation.

## ood-n08-b05-i001
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A customer-support escalation desk, The conversation is stored in a thread-safe map. Two updates can overlap: one changes assignee and the other deadline. Each map call is safe by itself, but readers must never see the assignee from one escalation paired with the deadline from another. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Keep separate safe map writes for assignee and deadline and assume both calls together form one update.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “the escalation keeps ownership and response deadlines” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: coordinator_exports_state → method_calls_only_01, inheritance_for_reuse → global_collection_lock_01, representation_leaks → repair_afterward_01
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i002
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A regional produce marketplace, A catalog entry stores price and available stock. Its map safely replaces one value at a time, but buyers must see a listing only when both values belong to the same approved revision; other listings should update independently. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Write price and stock with two individually safe map updates and assume readers will observe them together.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “a listing cannot become visible before its price and stock rule are valid” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: coordinator_exports_state → method_calls_only_02, inheritance_for_reuse → global_collection_lock_02, representation_leaks → repair_afterward_02
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i003
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A repair-parts marketplace, A backordered request is split into two vendor subrequests. The shared request record must list both child IDs and retain its original request ID and promised date; the map only makes each put safe separately. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Put each child into the vendor map and update the parent request in separate safe calls.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “each split retains the original request identity and delivery promise” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: inheritance_for_reuse → method_calls_only_03, representation_leaks → global_collection_lock_03, speculative_indirection → repair_afterward_03
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i004
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A community garden allocation tool, A reservation transfer changes the plot's current member and appends approval history. The collection safely handles each set insertion, but readers must not see the new member without the corresponding transfer record. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Use two safe set/map calls, first replacing the member and later adding approval history.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “transfer preserves the plot boundary and approval history” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: representation_leaks → method_calls_only_04, speculative_indirection → global_collection_lock_04, coordinator_exports_state → repair_afterward_04
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i005
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A subscription packaging service, A bundle points to component revisions and a pricing rule. A manager can edit components while the catalog publishes; customers must see one complete bundle revision and other bundles can publish independently. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Replace component entries one at a time in the live bundle map and calculate the price after publication.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “the bundle pricing policy remains consistent with its components” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: speculative_indirection → method_calls_only_05, coordinator_exports_state → global_collection_lock_05, inheritance_for_reuse → repair_afterward_05
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i006
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A fleet charging coordinator, A station has four chargers. A thread-safe collection supports count and add separately, but two overlapping requests for the final charger must not both be accepted; other stations remain independent. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Call safe count, then safe add, treating the pair as if it were atomic.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “charger capacity and reservation expiry are coordinated” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: coordinator_exports_state → method_calls_only_06, inheritance_for_reuse → global_collection_lock_06, representation_leaks → repair_afterward_06
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i007
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A photo-archive curation tool, Two metadata merges target one stable asset ID. A curator may have edited the record since another curator read it; the collection's replace call is individually safe but does not check that the input revision is still current. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Perform a thread-safe unconditional replace and keep the old metadata in a separate history list.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “asset identity remains stable while descriptive values are replaced” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: coordinator_exports_state → method_calls_only_07, inheritance_for_reuse → global_collection_lock_07, representation_leaks → repair_afterward_07
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i008
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A digital rights clearance tool, Each territory approval has a territory ID, expiry, and audit record. The collection can safely store individual fields, but an approval is visible only when all three belong to the same decision. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Set approval=true, then add expiry and audit in separate safe map calls.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “approval requires an explicit territory and expiration” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: inheritance_for_reuse → method_calls_only_08, representation_leaks → global_collection_lock_08, speculative_indirection → repair_afterward_08
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i009
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A drone maintenance planner, Aircraft and battery collections each support safe individual updates. A replacement must preserve a one-battery-per-aircraft rule across both indexes; assignments for separate aircraft should continue. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Write the aircraft-to-battery map, then update the battery-to-aircraft map in a separate safe call.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “a battery cannot be assigned to two aircraft at once” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: representation_leaks → method_calls_only_09, speculative_indirection → global_collection_lock_09, coordinator_exports_state → repair_afterward_09
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i010
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A clinic referral coordinator, A referral map stores consent status and referral destination. Consent can be revoked while referral is prepared; disclosure is allowed only if the accepted referral uses the consent revision that was checked. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Read consent from its safe map call and append the referral in a later call without checking the revision again.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “privacy and consent rules apply before external disclosure” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: speculative_indirection → method_calls_only_10, coordinator_exports_state → global_collection_lock_10, inheritance_for_reuse → repair_afterward_10
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i011
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A music practice tracker, A completion key contains learner, exercise revision, and score policy. The map safely inserts a completion, but a resubmission for the same revision must not replace the policy used for the accepted score. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Insert by learner ID alone and update the score-policy field whenever the learner retries.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “completion records the exercise version and score policy” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: coordinator_exports_state → method_calls_only_11, inheritance_for_reuse → global_collection_lock_11, representation_leaks → repair_afterward_11
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i012
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A procurement approval queue, An exception is approved only when its required control IDs are present and attributed to the reviewer. A set supports safe add, but control checks and approval status are separate operations. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Add each control with a safe set call, then let the client mark approval after its local checks.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “approval is attributable, bounded, and cannot bypass required controls” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: coordinator_exports_state → method_calls_only_12, inheritance_for_reuse → global_collection_lock_12, representation_leaks → repair_afterward_12
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i013
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A podcast production desk, Replacing a recording changes its segment map, but annotation records point to stable segment IDs. Readers must use the mapping from the same recording revision as the annotation lookup. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Replace the recording pointer and update the segment map with separate safe writes.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “annotations follow stable segments rather than file offsets” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: inheritance_for_reuse → method_calls_only_13, representation_leaks → global_collection_lock_13, speculative_indirection → repair_afterward_13
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i014
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A permissions review service, A role grant is stored in a concurrent collection. Each grant must include role, expiry, and approving decision; revocation can overlap grant publication and should leave one complete visible revision. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Update role, expiry, and approval reference using separate individually safe map operations.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “the role expires and is attributable to a specific approval” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: representation_leaks → method_calls_only_14, speculative_indirection → global_collection_lock_14, coordinator_exports_state → repair_afterward_14
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i015
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A document notarization service, A seal record is keyed by the exact immutable document revision. A correction can create a new revision while the old seal remains valid only for its old key. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Store one seal under the document ID and replace it whenever a new revision appears.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “the seal covers the exact immutable revision” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: speculative_indirection → method_calls_only_15, coordinator_exports_state → global_collection_lock_15, inheritance_for_reuse → repair_afterward_15
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i016
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A marketplace payout service, A payout request has an order ID and settlement revision. A thread-safe set can safely add IDs, but the release record must be tied to the settled revision that was checked. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Add the order ID to a released set, then independently read settlement and write the payout record.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “release is idempotent and tied to a settled order” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: coordinator_exports_state → method_calls_only_16, inheritance_for_reuse → global_collection_lock_16, representation_leaks → repair_afterward_16
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i017
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A public-transit disruption board, A route has an effective sequence number; subscribers must not see sequence 12 before sequence 11 is applied. A thread-safe queue accepts items but does not order them by effective sequence. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Append updates as they arrive and use a thread-safe FIFO queue without comparing sequence numbers.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “passengers receive the change in the order in which it becomes effective” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: coordinator_exports_state → method_calls_only_17, inheritance_for_reuse → global_collection_lock_17, representation_leaks → repair_afterward_17
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b05-i018
Objective: Distinguish individually thread-safe collection methods from an atomic compound check/update that preserves a collection-level invariant.
Decisive facts: In A neighborhood energy-sharing service, A meter schedule stores reservations in a collection. The system must reject any new interval that overlaps an existing one; two requests can race after each has read the same schedule. Which operation makes the stated collection-level contract reliable?
Nearest alternative: Call safe read, check overlap in the client, then call safe add.
Identity: preserve_question_id — The old key was: Treat compound operations as a separate atomicity decision even when the collection methods are thread-safe. In this case, that keeps the rule “a meter cannot be committed twice for an overlapping window” inside the owner that can observe and enforce it. The current answer continues to teach that method-level safety does not make a compound operation atomic; the revised stem supplies the collection and exact invariant needed to apply that same decision.
Option changes: inheritance_for_reuse → method_calls_only_18, representation_leaks → global_collection_lock_18, speculative_indirection → repair_afterward_18
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines
