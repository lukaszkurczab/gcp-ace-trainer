# Independent semantic review — OOD-N02-B01 through B04 bounded corrections

**Verdicts: B01 PASS (reused); B02 PASS; B03 PASS; B04 PASS.** This review binds the current frozen payloads:

| Unit | Frozen payload | SHA-256 | Scope reviewed now |
|---|---|---|---|
| B01 | `REVIEWED-B01-v3.json` | `9ce1b243551a97356bcab6ae093df0a463dc2f9e978d96456329b555e8efff58` | Reuse prior whole-unit PASS; bytes unchanged |
| B02 | `REVIEWED-B02-v3.json` | `7dc905a9e5e34cc5bbad7d14e17c1a11b1fdedb1ac7ac02d6b9f1b6d34a9a22e` | Re-reviewed i023; reuse the other 18 exact objects |
| B03 | `REVIEWED-B03-v4.json` | `1e2ffd502acc9ee098e51c80633151ec2b9009590455b2726701a733c97fe795` | Re-reviewed i031; reuse the other 18 exact objects |
| B04 | `REVIEWED-B04-v3.json` | `61b729c8d159391deef0a1d0cebd17b3e19e5ee339fde49c9a586d579819fd33` | Re-reviewed i020 and i030; reuse the other 17 exact objects |

The bounded-change manifest records exactly those replacements. I read each changed whole object, including keyed and non-keyed options, stable-ID feedback, Reason, and all Details fields. For unchanged objects, I rely on the prior reviews only where their payload bytes match. This is semantic proposal review; it does not claim source activation, runtime readiness, or full BIZQ-01 acceptance.

## B02 i023 — PASS

The revised scenario is a delayed response to a proposal that has been superseded. It explicitly says the response may affect publication only if it names the currently pending proposal, and that a stale response must neither publish its old package nor clear the newer proposal. The key applies the acceptance only on a matching pending proposal ID. The stable-ID messages address the two offered errors: applying stale P1, and rejecting every response even when current P2 matches.

This resolves the former overlap with accepted N01-B04-i019. That item asks whether a transfer can commit before the recipient accepts; i023 instead asks whether an asynchronous acceptance belongs to the currently pending publication attempt after replacement. One is a recipient-acknowledgement precondition, the other stale-result correlation. The visible trigger and correct action are different, not merely renamed actors.

## B03 i031 — PASS

The added facts establish that the maintenance job references the aircraft’s current battery assignment and holds the candidate and compatibility rule. `MaintenanceJob.replaceBattery(candidate)` is therefore supported as the operation that can check compatibility and replace the assignment. The alternative assigning compatibility to the battery lacks the current assignment context; the screen-level alternative moves the rule to one caller and clears state before the operation. Feedback tracks those actual choices. The previous missing-ownership premise is resolved without asserting a general UML rule as a scenario fact.

## B04 i020 and i030 — PASS

**i020** now asks how to place a confirmed reservation, the capacity hold that must change with it, and independently changing email delivery. The prompt makes the shared transition rule explicit: neither a confirmed reservation without its hold nor a released hold with a confirmed reservation is valid. The key keeps reservation and hold transitions together and isolates the notifier. Each wrong-option message identifies either the half-updated state or the unrelated provider-format coupling. This is a distinct decision from the prior loan-allocation/provider-adapter duplicate at i020/i035: the new i020 concerns a coupled booking invariant and separate notification change cause; it no longer selects the same allocation/translation boundary as i035.

**i030** asks whether role, territory, expiry, and review status belong to one grant revision when they cannot be changed independently, receive one review, and have no separate field owner. The key keeps them within AccessGrant’s lifecycle; the alternatives introduce caller-coordinated field revisions or substitute reviewer-session lifetime for the continuing grant. The scenario and diagnostics support the selected boundary. This does not repeat B03’s maintenance operation placement or B04 i020’s capacity-hold transition: the actual decision is whether fields sharing one accepted revision should be split by field name.

The prior cross-unit concern that B04 i030 repeated B03 i024’s controller/adapter maintenance example is gone in the reviewed bytes; i030 is now the access-grant lifecycle case. No other changed-object blocker remains in this bounded review.

## Reused scope and limitations

The earlier B01 PASS remains bound to unchanged v3 bytes. B02’s other 18, B03’s other 18, and B04’s other 17 objects remain covered by the exact prior versions after confirming the bounded correction manifest. This does not assert that every possible cross-item relation in the full 152-item cohort has been newly re-audited. The scenario-specific guarantees above come from their prompts; cited general design sources are not treated as proof of fictional business policies. No prose-length, unique-concept, or numeric option-shape rule was used.
