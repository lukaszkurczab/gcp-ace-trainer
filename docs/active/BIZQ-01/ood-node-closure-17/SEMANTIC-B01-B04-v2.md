# Independent semantic review — OOD-N02-B01 through B04 corrected proposals

**Verdicts:** B01 **PASS**; B02 **REVISE**; B03 **REVISE**; B04 **REVISE**.

I reviewed each frozen whole object, including prompt, keyed and non-keyed options, stable-ID feedback, Reason, and all Details fields. The exact bindings are:

| Unit | Reviewed payload | SHA-256 |
|---|---|---|
| B01 | `REVIEWED-B01-v3.json` | `9ce1b243551a97356bcab6ae093df0a463dc2f9e978d96456329b555e8efff58` |
| B02 | `REVIEWED-B02-v2.json` | `d7051d82cee19833be1822aae0ce2043d94f3c4a8a6ca827fa8c296274abf0d1` |
| B03 | `REVIEWED-B03-v3.json` | `cf2d15bee31565279d142b1c68b0649935ade14091c472d4c7df4e948dc02d7b` |
| B04 | `REVIEWED-B04-v2.json` | `680191d15b7bf1842e9c1a2724565f6dc28a6ce54016c46ed601bcb06aca4cdd` |

This is semantic proposal review only; schema/scoring success does not resolve the findings below. I did not require unique prose, unrelated concepts, or numeric answer-shape thresholds. I treat responsibility/behavior-placement questions as distinct from lifecycle-outcome questions when the learner’s requested decision is actually different.

## B01 — PASS

All 19 corrected keys are the concrete action the visible facts support; the alternatives and target messages now address the relevant counter, cache, caller duplication, mutation, history, or boundary error. Reasons and Details lead from the invariant to the keyed action rather than presenting the correct action as a distractor. The v3 i024 correction is accurate: replacing a selected track version can change total runtime, while reordering those same tracks changes playback order but preserves the total.

The unit’s cohesion/derived-state objective is coherent across the range from derived measures and validity checks to historical values and nonmutating proposals. i024 (playlist runtime) and i033 (itinerary booked duration) are near neighbors because both derive a collection total after a member changes. Their actual decisive facts differ: selected track versions and ordered playback versus booked leg durations with connection waiting explicitly outside the measure. I do not treat this pair as a duplicate after the corrected i024 explanation. The other related examples—i023/i035’s committed batch calculation versus discardable proposal, and i022/i025/i036’s captured historical inputs—also make distinct decisions.

## B02 — REVISE

The 19 prompts now give clear transition guards and results; option meanings, target feedback, Reason, and Details align. I found one material accepted-item duplicate:

- **B02 i023 duplicates accepted OOD-N01-B04-i019.** Both ask whether to retain the current owner until the proposed recipient accepts a transfer. N01 uses Ada/Bo and a plot; B02 uses Agent A/Queue B and a case. B02’s unchanged response deadline adds a fact but does not change the primary decision: commit the handoff only after the new owner acknowledges. Only the new B02 replacement may change under the fixed scope; preserve the accepted N01 item and materially change the new decision/trigger.

Two close comparisons are not independent blockers. B02 i033 and accepted N01-B04-i026 both concern late exercise submission with pinned revision/policy, but the visible policy outcomes differ: N01 explicitly leaves a late attempt incomplete with no score; B02 explicitly allows submission, marks it late, and asks that the pinned interpretation remain. B02 i033 therefore teaches applying an explicit alternative policy, though the nearby setup primes the same scenario. B02 i035 (cancel booking now, refund remains pending) and accepted N01-B02-i033 (comment accepted, notification pending) both separate completed domain work from asynchronous follow-up, but ask different state outcomes for different objects; I do not count that shared pattern alone as a duplicate.

## B03 — REVISE

The corrected 19 objects generally make the encapsulation/behavior-placement decision clear. The caller has the relevant facts, and the keyed operation now names the domain behavior while the distractors test caller duplication, missing state, or an unsuitable technical owner. In this unit, repeated subject matter from B02 is often a legitimate different lens: B03 i025/i027/i031/i032/i035/i037 ask where to put behavior, while their B02 neighbors ask what state transition/result follows. I do not treat those pairs as duplicates solely because the domain nouns match.

- **B03 i031 has an underdetermined operation owner.** The prompt says the maintenance job stores the aircraft compatibility rule and candidate battery; callers fetch IDs and decide whether to release the old battery. It does not say that MaintenanceJob owns or references the aircraft’s current assignment. Yet the key asks `MaintenanceJob.replaceBattery(candidate)` to change that assignment. The facts support a compatibility check, but do not establish why this operation belongs to MaintenanceJob rather than Aircraft or a coordinating service. Add the missing ownership/reference fact to the stem, or make the key a named coordination operation that explicitly takes both job and aircraft context.

## B04 — REVISE

The shortened v2 keys remain readable, and all 19 prompts/options/messages/Reasons/Details still make the independent-change-boundary decision intelligible. The common domain-rule-versus-integration framing is appropriate for one mental unit; I do not require 19 unrelated architectural concepts. Two concrete same-decision repetitions remain:

- **B04 i020 and i035 are materially duplicate decisions.** Both use a loan repayment allocation whose rule changes with the loan contract and an external payment/clearing network whose message fields change independently. Both key the same boundary—LoanAccount owns allocation; an adapter translates network requests—and their alternatives test the same moves into an adapter or duplicated bank integration. The changed nouns do not create a different learner decision. Change one new item’s primary decision or decisive facts/options within the fixed replacement scope.
- **B04 i030 materially overlaps B03 i024.** Both use ExhibitController maintenance-mode command rejection and teach that the controller owns the rule while panel/protocol translation stays at the adapter boundary. B03 i024 asks how panels submit through the state-aware operation; B04 i030 asks where a remote protocol upgrade goes, but the domain example and resulting boundary are the same. Keep one or materially change the other item’s scenario and decision so this fixed 152-item closure cohort does not repeat this exact case. This is a concrete cross-unit repeat, not a ban on behavior-placement and responsibility-boundary questions appearing in the same bank.

B04 i020 and accepted N01-B06-i021 are also adjacent in adapter-boundary principle, but the operations differ: N01 maps inbound vendor response names into a shared value, while B04 i020 isolates outbound bank-message formatting from the domain allocation rule. I do not count that directionally distinct adapter task as an additional duplicate. Likewise, B04 i028’s carrier request mapping is related to accepted N01-B06-i021 but changes outbound label request shape versus inbound response normalization.

## Source and scope notes

The prompts themselves establish the fictional business guarantees (for example, accepted N01 handoff rules and each unit’s validation/retention rules). I did not treat generic architecture references as proof that a particular fictional provider, policy, or runtime guarantees those facts. No reachability, runtime, native, Premium, source activation, or full BIZQ-01 claim follows from this proposal-only review.

**Minimum corrections:** retain B01 as reviewed; materially change B02 i023; make B03 i031’s operation ownership visible; distinguish B04 i020 from i035 and B04 i030 from B03 i024. Re-review only those changed whole objects and nearest affected peers, then rebind the result to their frozen payload hashes.
