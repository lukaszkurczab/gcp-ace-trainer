# N08-B04 author notes — proposal v1

Before source SHA-256: `2585e5a74a146510e7b6d7cdcb6ac11f32326aca0ad9b920279b2b25479b0fab`
Proposal SHA-256: `5c64f591d9cbdfd16ec65ec3f47b27fa4249322b1033d119bb2665d9989de01f`

Proposal-only authorship rationale. The cases now include the lock acquisition or slow-wait facts needed to identify a progress problem and its scope. The prior question IDs and broad keyed objective are retained; every former wrong-choice meaning was replaced and assigned a new per-item option ID with exact-target feedback. The scenarios supply their own concurrency/protocol facts; the listed references are carried forward as supporting context, not as proof of a particular fictional application guarantee. This is not semantic acceptance or activation.

## ood-n08-b04-i001
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A fleet charging coordinator, A reservation worker locks the station before the reservation; an expiry worker locks the reservation before the station. They can wait on each other, and unrelated stations should keep reserving. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Keep the opposite orders and retry either operation whenever it times out.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “charger capacity and reservation expiry are coordinated” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: coordinator_exports_state → retry_same_order_01, inheritance_for_reuse → hold_during_wait_01, representation_leaks → global_stop_01
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i002
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A photo-archive curation tool, A merge locks two asset records. Curators can request the same pair in opposite order; the archive must also allow unrelated asset pairs to proceed. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Let each curator choose the first asset they happened to open, then wait for the second.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “asset identity remains stable while descriptive values are replaced” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: coordinator_exports_state → retry_same_order_02, inheritance_for_reuse → hold_during_wait_02, representation_leaks → global_stop_02
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i003
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A digital rights clearance tool, Granting a role needs both territory policy and role state. Approval currently locks territory then role, while expiry locks role then territory; a clearance check must remain available for unrelated territories. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Keep the current order and increase timeout duration so one path usually wins.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “approval requires an explicit territory and expiration” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: inheritance_for_reuse → retry_same_order_03, representation_leaks → hold_during_wait_03, speculative_indirection → global_stop_03
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i004
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A drone maintenance planner, Assigning a battery needs an aircraft record and a battery record. Two planners can swap batteries and aircraft in opposite order; a battery must never end assigned to two aircraft. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Lock the aircraft first on one path and the battery first on the swap path, then retry a rejected assignment.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “a battery cannot be assigned to two aircraft at once” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: representation_leaks → retry_same_order_04, speculative_indirection → hold_during_wait_04, coordinator_exports_state → global_stop_04
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i005
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A clinic referral coordinator, Consent and referral state are checked together, but sending the referral can wait on an external specialist. A retry should not make other referrals for the same patient wait on that response. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Keep patient and referral locks while waiting for the specialist's response, then record consent outcome.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “privacy and consent rules apply before external disclosure” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: speculative_indirection → retry_same_order_05, coordinator_exports_state → hold_during_wait_05, inheritance_for_reuse → global_stop_05
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i006
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A music practice tracker, Exercise publication locks the exercise then learner progress; completion locks learner progress then exercise. Both need a consistent revision, but different learners can complete in parallel. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Leave the opposite lock orders and retry the completion after a timeout.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “completion records the exercise version and score policy” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: coordinator_exports_state → retry_same_order_06, inheritance_for_reuse → hold_during_wait_06, representation_leaks → global_stop_06
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i007
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A procurement approval queue, Approval reads an exception and its control evidence. The approval path locks exception then evidence; the audit correction path locks evidence then exception; unrelated exceptions remain independent. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Keep the reverse orders and let a watchdog abandon whichever approval waits longer.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “approval is attributable, bounded, and cannot bypass required controls” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: coordinator_exports_state → retry_same_order_07, inheritance_for_reuse → hold_during_wait_07, representation_leaks → global_stop_07
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i008
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A podcast production desk, Replacing a recording locks the episode before its segment map; annotation editing locks the segment map before the episode. The producer needs a consistent mapping and other episodes must continue. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Allow each operation to keep its existing reverse order and retry when it detects a lock timeout.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “annotations follow stable segments rather than file offsets” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: inheritance_for_reuse → retry_same_order_08, representation_leaks → hold_during_wait_08, speculative_indirection → global_stop_08
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i009
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A permissions review service, The grant path acquires user then role, while the expiry worker acquires role then user. Expiry must complete even during repeated grant attempts; other users remain available. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Keep opposite orders and add another retry loop when a grant times out.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “the role expires and is attributable to a specific approval” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: representation_leaks → retry_same_order_09, speculative_indirection → hold_during_wait_09, coordinator_exports_state → global_stop_09
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i010
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A document notarization service, Sealing a revision locks its document then the seal registry; correction locks the registry then the document. Both operations can overlap, but unrelated documents should proceed. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Retain opposite lock orders and retry whichever handler detects a timeout.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “the seal covers the exact immutable revision” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: speculative_indirection → retry_same_order_10, coordinator_exports_state → hold_during_wait_10, inheritance_for_reuse → global_stop_10
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i011
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A marketplace payout service, Release acquires an order then seller balance; reconciliation acquires seller balance then order. Two releases for different sellers should not wait on a market-wide lock. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Leave the opposite orders and retry a payout whenever it times out.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “release is idempotent and tied to a settled order” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: coordinator_exports_state → retry_same_order_11, inheritance_for_reuse → hold_during_wait_11, representation_leaks → global_stop_11
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i012
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A public-transit disruption board, A route update locks the route before its subscriber list. Subscription changes lock the subscriber before the route. A publication should not wait for subscriber network acknowledgements while holding route state. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Keep the reverse orders and retry publication if it times out.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “passengers receive the change in the order in which it becomes effective” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: coordinator_exports_state → retry_same_order_12, inheritance_for_reuse → hold_during_wait_12, representation_leaks → global_stop_12
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i013
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A neighborhood energy-sharing service, A request can reserve two meters for one discharge window. Requests may name the same pair in reverse order; unrelated meter pairs should not block each other. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Acquire meters in request order and retry if the second acquisition times out.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “a meter cannot be committed twice for an overlapping window” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: inheritance_for_reuse → retry_same_order_13, representation_leaks → hold_during_wait_13, speculative_indirection → global_stop_13
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i014
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A live captioning studio, A provider switch locks the stream registry and then waits for callbacks; a callback can reacquire the registry while finishing a caption. A provider change may affect new streams without interrupting existing streams. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Keep the registry lock while waiting for every callback to finish before the switch returns.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “the current stream keeps its timing and error contract” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: representation_leaks → retry_same_order_14, speculative_indirection → hold_during_wait_14, coordinator_exports_state → global_stop_14
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i015
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A volunteer coordination hub, A shift swap locks two volunteer records. Different coordinators can request the same pair in reverse order; swaps for other volunteers should continue. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Lock the first volunteer named by the request, then wait for the second and retry on timeout.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “skills and availability constraints hold for both assignments” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: speculative_indirection → retry_same_order_15, coordinator_exports_state → hold_during_wait_15, inheritance_for_reuse → global_stop_15
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i016
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A local-first map editor, The merge path locks map then route; a route-edit path locks route then map. Conflicts must be reported, and independent maps should continue accepting edits. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Leave the opposite orders and run another merge after a timeout.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “conflicts are explicit and never silently overwrite accepted geometry” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: coordinator_exports_state → retry_same_order_16, inheritance_for_reuse → hold_during_wait_16, representation_leaks → global_stop_16
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i017
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A board-game campaign manager, Reward processing locks campaign then player; phase correction locks player then campaign. Each reward must use the current legal phase, and separate campaigns should continue. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Keep opposite orders and retry if a moderator reports that the reward waited too long.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “reward rules depend on the current legal campaign state” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: coordinator_exports_state → retry_same_order_17, inheritance_for_reuse → hold_during_wait_17, representation_leaks → global_stop_17
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b04-i018
Objective: Diagnose deadlock, starvation, or livelock from the visible wait order and select a coordination change that restores progress without blocking unrelated resources.
Decisive facts: In A cold-chain logistics console, The transfer path locks shipment then carrier; carrier acceptance locks carrier then shipment. A shipment has one new owner only after acceptance, and unrelated shipments should proceed. Which coordination change best restores progress without broadening the blocked scope?
Nearest alternative: Keep opposite orders and retry whichever hand-off times out.
Identity: preserve_question_id — The original keyed decision was: Define a consistent lock order or remove nested ownership so progress does not depend on timing. In this case, that keeps the rule “temperature restrictions and hand-off ownership travel with the shipment” inside the owner that can observe and enforce it. The current choice still targets the same deadlock/lock-ordering/progress decision; the revised case makes the conflicting resource order or slow-work boundary explicit instead of treating the domain invariant itself as evidence of a deadlock.
Option changes: inheritance_for_reuse → retry_same_order_18, representation_leaks → hold_during_wait_18, speculative_indirection → global_stop_18
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines
