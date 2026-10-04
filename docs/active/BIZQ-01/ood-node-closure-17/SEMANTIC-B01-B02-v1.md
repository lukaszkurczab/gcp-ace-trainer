# Independent semantic review — OOD-N02-B01 and B02 v1

**Verdict: REVISE both units.** Frozen inputs reviewed in full:

- `REVIEWED-B01-v1.json`, SHA-256 `c28c4b9757fb907b6281567779cfa791c2f98fc1b2951327eb8947065cd7ff91` (19 whole objects).
- `REVIEWED-B02-v1.json`, SHA-256 `3c506a77f49228ad67afac096028fcce43e68bdc0271ef5c18ff03a676878c12` (19 whole objects).

This is source-semantic review only; schema/scoring checks do not resolve these findings. I assessed the complete prompt, keyed option, every other option and its stable-ID feedback, Reason, and all Details fields for each object. I did not require unique prose, 19 unrelated concepts, or a word-count/answer-length threshold.

## Blocking cohortwide option/feedback mismatch

All 38 objects repeat the same ambiguity. The keyed option gives a broad principle, while `alt_a` states the concrete action that applies that principle to the facts. The keyed principle and `alt_a` are both correct answers to the prompt. The remaining option generally states a failure consequence or diagnosis rather than proposing a competing decision. Feedback attached to the options then describes other, unoffered actions. This defeats §4.1's one-answer-from-visible-facts requirement and §4.4's requirement that stable-ID feedback explain the selected wrong response; it also weakens §4.3's requirement for plausible, comparable alternatives.

Examples make the mismatch concrete:

- B01 i020 keys “Place a calculation with the cohesive information it needs” while `b01_i020_alt_a` says “Let the ParcelQuote calculate billable mass from its dimensions and selected carrier class”—a direct implementation of the key. Its wrong-option message instead tells the learner to have checkout callers calculate it. `alt_b` describes a possible inconsistency, not a choice of where to put the calculation; its feedback proposes an unrelated editable stored field.
- B01 i021 keys deriving a summary from authoritative membership, while `alt_a` explicitly has `WorkshopSession` compute remaining places from that membership and capacity. The feedback for `alt_a` rejects a separate counter, an answer not present in `alt_a`.
- B02 i021 keys preserving the old valid state until all preconditions pass, while `b02_i021_alt_a` explicitly proposes replacing the confirmed slot only after both acceptances succeed. The feedback attached to that option instead recommends a partial write.
- B02 i035 keys keeping replacement pending until dependent state satisfies its contract, while `b02_i035_alt_a` says to keep the old recording active until all annotations map. That is the keyed behavior, not a plausible wrong answer; its feedback instead recommends dropping annotations.

The same key/`alt_a` equivalence is present across the entire frozen mapping:

| Unit | Items whose `alt_a` concretely implements the keyed general principle |
|---|---|
| B01 | i020 ParcelQuote calculation; i021 WorkshopSession remaining places; i022 InvoiceLine captured amount; i023 RecipeBatch scaling; i024 Playlist runtime; i025 SensorReading calibration; i026 allowance balance; i027 ImageCrop bounds; i028 Meeting elapsed duration; i029 HotelStay nights; i030 TemperatureBand membership; i031 ProjectBoard readiness; i032 InspectionFinding risk band; i033 itinerary duration; i034 ServiceWindow deadline; i035 CompostBatch proposal; i036 SupportCase due instant; i037 ThermostatZone hysteresis; i038 PrintJob sheet estimate. |
| B02 | i020 lesson retirement; i021 confirmed-room move; i022 retryable export; i023 acknowledged ownership transfer; i024 validated listing publication; i025 bounded return approval; i026 guarded plot transfer; i027 bundle activation; i028 reservation expiry; i029 metadata merge; i030 permit correction; i031 compatible battery replacement; i032 consent-gated dispatch; i033 late submission; i034 named-manager approval; i035 annotation-dependent recording replacement; i036 grant denial; i037 digest-bound seal; i038 payout retry. |

Repair each item as an actual decision question: retain one keyed action, replace the duplicated keyed option with a genuinely wrong but plausible competing action, and rewrite its feedback so the stable ID diagnoses that exact action. Convert consequence-only alternatives into explicit decisions where possible. Keep scenario facts authored in the prompt; do not rely on Reason/Details to disambiguate the key.

## Unit cohesion and cross-item distinctions

B01's umbrella objective—assigning behavior and derived or historical values to the state that defines them—is coherent. The examples span derived aggregates, captured historical values, validation, and nonmutating proposals, which is reasonable reinforcement for this unit. The cohort does contain close pairs worth separating during the option repair: i024 and i033 both derive a collection total after member changes; i023 and i035 both calculate a serving-size proposal from batch/recipe state; i022, i025, and i036 all preserve a captured interpretation across later policy/source changes. These are related principles, not automatically duplicates, but the repair should make the distinct decision (playlist membership vs booked legs; committed batch vs discardable proposal; captured unit price/calibration/deadline) carry the prompt and alternatives.

B02's lifecycle-transition objective is also coherent. i021, i026, i031, and i035 all exercise rejection without partial replacement, but their explicit preconditions differ (two acceptances, destination vacancy, compatibility, and complete annotation mapping). I regard that as valid transfer practice if each remains tied to its own condition and the wrong actions actually test it; the current answer template masks those distinctions. Likewise i033's late-but-pinned submission and i037's changed-digest confirmation both bind a transition to prior state, but ask different decisions.

One concrete cross-node duplicate remains after comparing with current accepted N01: B02 i035 is materially the same decision as accepted OOD-N01-B02 i018. Both say an annotation mapping is incomplete, prohibit partial activation, and require retaining the old recording while the unmatched annotation is repaired. Changing the podcast episode/recording wording does not create a new primary decision. The accepted N01 i018 object is preserved exactly; only the new B02 i035 may be changed under the fixed preservation scope. Give the new item a materially different decisive condition and decision mechanism, and do not count the N01 item as part of the new 152.

B01's nearest captured-input items i022/i025/i036 are distinct in what must be reconstructed (issued amount, corrected measurement, case deadline), and I did not flag a current N01 item as the same action. Shared ideas such as responsibility, invariants, guarded transitions, and preserved history are appropriate within these units; only the option duplication and B02 i035/N01 i018 decision overlap are blockers here.

## Explanation and source scope

In both units, Reason/Details frequently explain why a hypothetical failure would be bad, but the options do not present that failure as a chosen implementation, and the targeted feedback often introduces a third answer that was never offered. Rewrite Reason/Details and wrong-option messages together with the choices so each explanation supports the keyed action and each message addresses exactly its target option. I found no need to treat the vignette contracts as universal external guarantees: the prompt itself supplies such facts as whether an export is retryable, a grant is audited, or a provider repeats a reference. Generic Java/DDD source references do not establish those fictional guarantees, and I have not relied on them as doing so.

**Minimum coherent correction:** repair option semantics and per-ID feedback for all 38 items; resolve the concrete B02 i035 vs accepted N01 i018 duplicate. Then re-review the affected frozen whole objects and their nearest cross-item neighbors. No source activation or broader product/release condition is implied by this review.
