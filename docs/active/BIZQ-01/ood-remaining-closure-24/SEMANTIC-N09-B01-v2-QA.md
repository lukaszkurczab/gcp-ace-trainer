# Bounded correction review: N09-B01 v2

**Verdict: PASS for the bounded correction.** The v1 answer-form defect is resolved: v2 trims the accepted choices to the distinguishing dependency seam and removes the repeated “live the” grammar error. The keys remain supported by the same scenario facts, answer IDs, wrong options, Reason, Details, and option-targeted diagnostics. The v1 SAME_ID question decisions remain valid. This accepts only the N09-B01 v2 unit correction; it is not acceptance of the complete N08/N09 cohort or its producer.

## Frozen evidence and exact delta

- Current proposal: `review-inputs/N09-B01-v2.json`, SHA-256 `665d4e8969561a28a36097c9aef64b05efd3b0a32e969c5005e61e4377071e1b`.
- Prior reviewed proposal: `review-inputs/N09-B01-v1.json`, SHA-256 `70a812eab3ddbcd0b20dc99eec741e08d04268b7546f9bc5ff68706c37884831`.
- V2 author notes: `AUTHOR-N09-B01-v2.json`, SHA-256 `240fe4ce1304e35a598351f194eee2f97429b5cf1efc7576bc83d034f5913a79`; Markdown SHA-256 `e587098062bc8f0d59032667b8377f2721568c33ef84c685c4cdd719fd9a7cf9`.
- Before/current manifest: `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`.

An independent recursive comparison of v1 and v2 found exactly 36 changed leaves: each of 18 items changes only `constraints[1]` (deleting the repeated extra “the”) and the text of the already-keyed accepted option. There is no i008 prompt change in these frozen bytes. Question IDs, answer option IDs, other options and option IDs, Reasons, Details, and all wrong-option diagnostics are unchanged. I therefore reused the v1 review of scenario adequacy, correct-key meaning, distractor meaning, feedback targeting, and question identity, and independently reviewed each revised key in its current context.

## Revised key decisions

| Item | V2 accepted choice | Finding |
|---|---|---|
| i001 | Inject fixed clock; exercise actual expiry decision across cutoff. | Preserves the per-instance clock seam and real operation. The prompt supplies before/after expiry and no-sleep/concurrency facts. |
| i002 | Use an in-memory repository around the actual merge operation. | Still tests the real merge and stored-result lookup without live storage. |
| i003 | Record requests in a scripted provider returning a controlled denial. | Retains the observable territory/expiry request and denial response required by the stem. |
| i004 | Script the write conflict after selection. | Names the conflict-producing repository boundary and keeps the assignment service active. |
| i005 | Record sends while running the real consent/referral flow. | Distinguishes an outbound recorder from testing only a predicate, stubbing the flow, or contacting the specialist. |
| i006 | Return attempt-time and current versions from the catalog fake. | Preserves the version-change input; the stem requires exercising the completion path. |
| i007 | Supply controlled actor contexts to the real approval operation. | Preserves the authorized/unauthorized input while running the actual decision. |
| i008 | Remap against two indexes with stable IDs and changed offsets. | Preserves the decisive ID-versus-offset contrast and real remapper. |
| i009 | Give the grant path approval records and a controlled clock. | Covers matching/mismatching approver records and the role-expiry input. |
| i010 | Record the payload passed by real seal preparation. | The prompt specifies the deterministic signer seam and exact revision input; the concise key points to the observed payload. |
| i011 | Script timeout then confirmation while observing both payout requests. | Retains the payment-port retry seam and makes no provider exactly-once claim. |
| i012 | Capture announcements emitted from the real ordering path. | Uses the notifier observation boundary while the real ordering path handles reversed inputs. |
| i013 | Supply controlled reservation history to the real overlap decision. | Preserves partial-overlap history and the real reservation rule. |
| i014 | Switch deterministic providers through the actual adapter. | Keeps both provider implementations in scope and exercises the adapter contract. |
| i015 | Return both availability outcomes to the real swap planner. | Preserves both schedules and the actual two-person decision. |
| i016 | Script a conflict response through the real sync workflow. | Keeps the server-conflict input controlled and the merge workflow active. |
| i017 | Run the reward operation with controlled open/closed campaign states. | Preserves the current-phase decision through the real operation. |
| i018 | Record the reassignment request from the real workflow. | Retains inspection of the actual outbound payload without a carrier call. |

The revised keys are concise but still identify the controlled input or observation point. Eight are shortest by raw character length, but this does not form a reliable shortcut: those answers still name the relevant seam and operation, while their alternatives describe distinct invalid setups such as live external calls, stubbing the behavior under test, or observing a result that bypasses the real ordering path. I found no residual systematic length cue under §4.3 and do not impose a length or option-count rule.

The unchanged `Reason`, all five Details fields, and wrong-choice messages remain consistent with the v2 choices; in particular, they provide the scenario-specific cause and clarify the seam that the shortened key now names compactly. The held N09-B01-i001 clock-control facet remains intact. I found no changed or unsupported premise in the bounded correction.

**Limit:** this is a unit-level semantic/identity correction review only. Cross-unit review of all 324 proposals, producer proof/source implementation, runtime, admission, native/Premium, and full BIZQ-01 acceptance remain outside this verdict.
