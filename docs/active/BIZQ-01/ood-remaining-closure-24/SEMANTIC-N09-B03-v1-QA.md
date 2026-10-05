# Independent semantic review: N09-B03 v1

**Verdict: PASS (bounded unit review).** All 18 cases instantiate the stated code-smell / misplaced-behavior objective with visible case facts and a clear design placement. The same question IDs are justified because each item still asks where behavior belongs relative to the data, invariant, or representation it concerns; the new accepted option IDs identify the new case-specific answer texts. I found no supported wrong key, hidden premise, stale diagnostic, or systematic correct-option form cue. This does not replace final cross-unit review.

## Frozen inputs and method

- Proposal: review-inputs/N09-B03-v1.json, SHA-256 184713fc55a2484453eec47e84f513b0f3cf0e88d0a96656d82e17e14764f8c8.
- Manifest: N08-N09-MANIFEST.json, SHA-256 0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612.
- Contract: N08-N09-CONTRACT.json, SHA-256 6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27.
- Author report: AUTHOR-N09-B03.json, SHA-256 8af67adbb2aea19aca6bcb0c1c867315ba7c32db864cc8f89e2293e6acf09ca2; Markdown SHA-256 259a89d8ebe5c80ed0edf7320046a6b1bb942f44163f82524275bc0e68eafe82.

I read all 18 whole before/current objects, resolving each accepted answer by answer.optionId. Fingerprints are SHA-256 of repository canonicalJson(question) (recursively sorted object keys). I checked every prompt, constraint, option, Reason, Details field, option-targeted diagnostic, source reference, and identity note. The official DDD references support general boundaries, entities/value objects, and validation with the domain model; they do not prove fictional scenario facts.

## Meaning, alternatives, feedback, and identity

The current keyed decisions are supported by the visible premises: Shipment provides approved label data while the printer formats; Room answers capacity while the scheduler coordinates; Exhibit validates mode-sensitive commands; Lesson retirement preserves progress identity; Session exports a stable post-close view; Conversation applies owner/deadline together; Listing guards publication; Request preserves split identity/promise; PlotReservation validates its transfer; ChargerReservation guards capacity/expiry; Asset preserves identity while merging descriptions; Battery guards assignment; ExerciseAttempt records the scoring-policy reference; ApprovalRecord validates complete bounded approvals; and the adapter translates stable segment identity to replaceable offsets.

Three cases use a different placement mechanism because their facts explicitly call for it: bundle pricing combines independently owned values and policy, so a pure calculator fits; territory and expiry travel and validate together after call sites swapped them, so a value object fits; consent policy is evaluated from referral facts before the separate delivery effect. Each still addresses the same question-level objective of placing behavior at the boundary suited to its facts. I therefore retain the existing question IDs. New accepted-option IDs are appropriate because the repeated old generic answer was replaced by specific answer meanings.

The nearest alternatives are materially wrong for the stated facts: duplicated caller checks, exposing mutable representation, moving unrelated coordination, or creating a subtype without a changed identity/contract. The targeted diagnostics explain the actual failure. Two keys are strictly longest and nine strictly shortest by character length; reading the choices in context showed no cohort-level pattern where key shape alone reliably identifies the answer. No length or option-count gate is applied.

## Per-item bindings

| Item | Accepted design decision | Identity | Before → current whole-object SHA-256 |
|---|---|---|---|
| i001 | Let Shipment provide an approved label snapshot; keep byte/layout formatting in the printer. | SAME_ID | 1bc5a2cfb54cd0e0c774e2516b5f81175e9fab68cd3ba77661a0cf419bc11867 → 5b874fcba3478188773ac68ad55666f14e1fed7f394063b0ef6b057e0f3b5355 |
| i002 | Ask Room whether it can host the Booking; leave reschedule coordination in the scheduler. | SAME_ID | 563f21c583adcf645a81f37cf55d16d9b730e44fdfed89fd13897d498a2836d5 → ed65d1e634f0450fb91787332084f1f95786743a2fa2f5e38eb52f01ed5fd0a8 |
| i003 | Have Exhibit reject commands that are invalid in its current mode. | SAME_ID | 20063fdc4908b0b4a241a2af71f9be6dc50e06b49344f69f0c89be4fbbdbdb78 → f2b4b15e6f94715fc0a4727929039c5ce6117a740660cfdbd619ffc4fedf6c45 |
| i004 | Retire the Lesson without changing its identity, and let progress continue to reference that ID. | SAME_ID | 6ded73dc3787bcb60984f62d187c51fadd39a2be53b307c3d49585a9eb5e94a7 → 368c1ce0a8cda08e8dcd258be668a73968b235c90b610986eeaf4dbd7ef37356 |
| i005 | Ask the Session to produce a snapshot after it has entered the closed state; keep file serialization in the exporter. | SAME_ID | a7dd431d888f79cce6926609e361530eb18332e1994aa1555b69c2f70f5e124b → a89f2f2a74c356eea607a48f52f790a41ce1b2ed0f87304cae46923bdf2c1cb8 |
| i006 | Give Conversation one escalation operation that changes owner and deadline together. | SAME_ID | f8982fd1495132269662509043f49c99a37eb33f24b662600fee06e307c384c1 → 7292d22a559de27233343ab4cdd6a4c07cdd739e12cd29f506e9d2fd282a912d |
| i007 | Make Listing’s publish operation validate its own price and stock before becoming visible. | SAME_ID | d05647ae7b79f84b5144ecdd676fd4600bbee7654016a663f8e9316faf0889df → 26c2dc249eb61e520bf2296fd32bc4e23a05f008cbe263fbe305e98450c0b393 |
| i008 | Have the request create split records that carry its identity and delivery promise. | SAME_ID | 7ab4c8126b861e0c479de74c5da9f54f191a49c2653f36598feb93cd7f830dae → 25b4149dde6c7d81b53d7beccb4e1b3626b1dcc7e9b483d0a619ba599ad918e3 |
| i009 | Make PlotReservation perform the transfer using its boundary and approval history. | SAME_ID | a7941eea4e607e331cd6622490003ae5c5aa100903ca11dcc9a5bc7f50e6d444 → 4f037faf531a4dff1e92345acc27f062a245a19f4405098c3da812f9be406b0d |
| i010 | Use a small pure BundlePricer that receives component prices and the regional policy. | SAME_ID | 5541628a76033c71f045509589dd2014156ead997cc28500893e502172272677 → 508e2af9bf94c333b9cf466409e9b6f67678267a67be81dfd5135c179d4dcf99 |
| i011 | Put the capacity-and-expiry acceptance check on ChargerReservation. | SAME_ID | ce7d1ddb31daae895ebc54951334c694ef0f53971a34dcd1f76ac4f6c67b0b4c → ae587bb4b9976fc777d7e4d86ce5ca93cc3e6ce447896b88bc5e5930c52f5959 |
| i012 | Have Asset merge descriptive values while retaining its existing identity. | SAME_ID | a57654ae6c0ac7623432fc44cf7904b94578f629048a76f4e56f2b6e2393b2a9 → 935f1a976e07415af257c635c4584fd4d741616ff4e819b2d5e4a2c4203f909d |
| i013 | Introduce a ClearanceScope value that carries and validates the territory-expiry pair. | SAME_ID | dc15b7a607602500ebae528ddec2ffc1ffada35feaea1199397169954046cb86 → 1e75fe90726549bbca52305f551ba663c92ae06ed8bc16be7c58fa31b59cc2a8 |
| i014 | Have Battery accept an assignment only when it is not already assigned elsewhere. | SAME_ID | d368cc78a852de6514a36e3d5506562b5f376fbc703802ad94376d80b2e2a7c5 → a3050c05bc93d3674a7fc7163fbff1056028128ee78be55e89b9b330376dc63f |
| i015 | Ask a consent policy built from the referral’s recorded permissions before the dispatcher sends. | SAME_ID | 965bca25c5d23eda5a51534781aedfba61c48a4a629c1a7a65f40a853f93e862 → 92e3b202245d1d3f841e0a1fc64c9134ac8ddd108c03999b99ea59843e8eec76 |
| i016 | Have ExerciseAttempt capture the policy ID at completion and use that recorded ID for its result. | SAME_ID | 427245e27c20137f9c15d321010d1875631835b0675af868cef2aef5ad1571ca → d37b9a61d3fcd99bcb501b34133d489e8895efce0ed518c2d4168eaefb20e879 |
| i017 | Make ApprovalRecord reject records missing attribution, amount bounds, or required evidence. | SAME_ID | 4cb81868224d0c544b57ea19c5d6d6b642ad6be802988e01ff19f3e51e109adb → 4e82f32793cf70a255304806ac4729def69d99ef753a22bd35d59926623dc9be |
| i018 | Resolve annotation anchors by stable segment ID behind an adapter that owns offset translation. | SAME_ID | 06848e7c9b69a9a0558216a2fdd985995d7d23affff496b1ba62463ddaa2ef77 → 71c1fe2d26995f1f447a41d15e443af8886e513dd3ae809d8311af692dd899d0 |

This PASS is limited to N09-B03 semantics and identity. It does not accept remaining N08/N09 units, the whole324 map, producer/source/runtime/admission, native/Premium, or full BIZQ-01.
