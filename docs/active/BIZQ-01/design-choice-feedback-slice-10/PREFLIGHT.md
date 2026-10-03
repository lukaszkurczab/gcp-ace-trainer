# Design choice feedback delivery preflight

This versioned probe checks whether authored stable-option-ID choice explanations reach the Design practice projection after a durable answer. It reads the current bundled canonical catalog, uses actual runtime preparation and resume validation, starts through the memory-backed journal, submits through the Design facade, and reads the projection after lifecycle rebind. The provider Premium boundary is an explicit in-memory stub; this probe makes no provider, native, or production authorization claim.

Run from `patternly/`:

```sh
node --import tsx docs/active/BIZQ-01/design-choice-feedback-slice-10/preflight.ts
node --import tsx docs/active/BIZQ-01/design-choice-feedback-slice-10/preflight.ts --expect-delivered
```

The first command records observation and exits successfully. The second is the acceptance mode: it exits nonzero while a selected incorrect option fails to deliver the existing helper’s exact message. That expected baseline failure is not an acceptance pass.

## Observed current behavior

On 2026-10-03, all three currently bundled Design tracks had eligible single-choice questions with authored `wrong_option` messages in the `design-interview-learn-framework` pool. The probe ran a wrong answer and a correct answer for the first such question in each track. Every wrong answer scored `incorrect` with `0/1`, persisted exactly one attempt, and cleared the active journal. A correct answer scored `correct` with `1/1` and persisted the attempt. Feedback remained `null` before submission in all six cases.

After each submission and lifecycle rebind, the Design facade returned only `details`, `reason`, `result`, and `sources`; its `messages` field was absent. Thus, the three wrong answers lost the authored stable-ID message already produced by `projectCanonicalChoiceFeedbackMessages`. Correct answers had no messages from that helper and the facade showed no false explanation; those cases are controls, not failures for wrong-answer selection behavior.

| Design track | Actual eligible probe item | Unit | Wrong selection | Expected helper result | Facade result |
| --- | --- | --- | --- | --- | --- |
| Backend | `besd-n01-b01-i001` | `BESD-N01-B01` | `ignore_failure` | one `wrong_option` message | absent |
| Frontend | `fesd-n01-b01-i001` | `FESD-N01-B01` | `browser_or_client_authority` | one `wrong_option` message | absent |
| Object-oriented Design | `ood-n01-b01-i001` | `OOD-N01-B01` | `coordinator_exports_state` | one `wrong_option` message | absent |

The bundled tracks contain respectively 1,569 / 601 / 1,413 single-choice questions with authored messages. Their `design-interview-learn-framework` pools contain 145 / 150 / 136 items, including 145 / 74 / 136 single-choice questions with authored messages. The two BIZQ replacement questions `besd-n02-b01-i017` and `besd-n04-b01-i019` are present in the Backend artifact, but neither is in any of its three Design mode pools. They are therefore not used as proof of ordinary Design-session reachability.

All three Design modes use the same choice feedback projection boundary; weak-area review is evidence-conditioned by `due_queue`. This probe uses the ordinary node-selected learn-framework mode only. Existing mode and Premium gates are unchanged.

## Captured identities

The probe prints full SHA-256 values for its source and artifact inputs. The run that established the baseline RED reported:

| Input | SHA-256 |
| --- | --- |
| `CanonicalTrainingRuntime.ts` | `cc980c835227e253c287a1dd841b0892861d5ab8f9491b1c35d5b870253a2e83` |
| `canonicalInteractionPresentation.ts` | `1608a8fd76eedfacd401d8a781360b47771f8d416d1fb0da94dc4f051077b2ae` |
| `designInterviewSessionFacade.ts` | `055c58e1149c21ea3a32195e4249caaa7187482ea66b9adc0eb7321dd7102371` |
| `DesignInterviewPracticeScreen.tsx` | `a18f3881c56b79ee2988c9bd4ee913f733822f715f96b72f4ff2d7d3b4b3feb9` |
| `productModeConfig.ts` | `a65e60a2ebf6f61813a1277b4058ab9b28c60b82e7b2fa7f592b08f640fe04f3` |
| Backend canonical artifact | `433246b061e1df9a4d96e28053e7e208ecae81a7319947edefd55a18157f5f49` |
| Frontend canonical artifact | `7de3a0bd8860eef726c6bb11cbf8e0bbc88ff0282d1a4575cbf94cc5fb9dd9bf` |
| Object-oriented Design canonical artifact | `613e5113e9d88caad18757d6167c781d2a19532b7654c7d0a28c493933ab8f9b` |

The observation run produced three RED findings, one per track. With `--expect-delivered`, the same three findings produce exit code 1. Correct-answer controls pass because no unrelated messages appear.

This is a focused choice-feedback slice. It does not establish delivery for multiple-choice, omitted-option, ordering, decision-matrix, or post-session review feedback, nor does it claim native UI or Premium-provider behavior.
