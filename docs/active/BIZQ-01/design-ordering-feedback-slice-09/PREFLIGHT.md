# Design ordering feedback slice 09 preflight

Run from the `patternly/` repository root:

```text
node --import tsx docs/active/BIZQ-01/design-ordering-feedback-slice-09/preflight.ts
```

After the Design feedback projection lands, run acceptance mode:

```text
node --import tsx docs/active/BIZQ-01/design-ordering-feedback-slice-09/preflight.ts --expect-delivered
```

Acceptance mode exits nonzero if either partial ordering response is missing its selected authored `broken_relation` messages. Default mode records observations; a baseline RED is historical evidence, not acceptance.

The probe loads the current canonical runtime and verifies that `fesd-n01-b01-i003` belongs to the real `design-interview-learn-framework` pool. For each case it asks the real `CanonicalTrainingRuntime` to prepare a one-item session, pins the eligible authored question into that occurrence, prepares the canonical control order, recomputes the immutable session fingerprint, and calls `validateResume`. It commits the start and answer through the actual journal-backed repositories on isolated in-memory storage, submits through the Design family facade, then rebinds the lifecycle and reads `getDesignInterviewPracticeProjection` again. One memory fixture is run at a time because the repository storage binding is process-global. A local Premium authorizer stub is present only for lifecycle composition; this probe does not exercise or claim provider Premium authorization.

The response cases constrain the relation behavior:

- Correct order preserves all three accepted adjacent relations and scores 3/3; expected `broken_relation` messages are empty.
- Swapping the last two elements preserves only `observe->preserve` and scores 1/3; the authored `expose->recover` and `preserve->expose` messages are expected.
- Moving the `[expose, recover]` block to the beginning preserves `expose->recover` and `observe->preserve` at new positions, breaks only `preserve->expose`, and scores 2/3. This guards against treating a preserved relation as wrong merely because its elements moved.

The default pre-change run exited 0 and recorded RED for both partial responses. Each response was durably submitted and produced exactly one persisted attempt; after lifecycle rebind, Design feedback contained only `details`, `reason`, `result`, and `sources`, with no `messages`. The correct response had no expected diagnostic. Selected fields from the emitted runtime report follow:

```json
{
  "track": {
    "trackId": "frontend-system-design-interview",
    "contentVersion": "frontend-system-design-interview-candidate-v2026.08.15",
    "artifactSha256": "7de3a0bd8860eef726c6bb11cbf8e0bbc88ff0282d1a4575cbf94cc5fb9dd9bf"
  },
  "question": {
    "questionId": "fesd-n01-b01-i003",
    "nodeId": "requirements_user_journeys_constraints_and_frontend_decomposition",
    "mentalUnitId": "FESD-N01-B01",
    "correctOrder": ["observe", "preserve", "expose", "recover"]
  },
  "eligibleMode": {
    "modeId": "design-interview-learn-framework",
    "selection": {
      "kind": "node",
      "nodeId": "requirements_user_journeys_constraints_and_frontend_decomposition"
    },
    "poolSize": 150,
    "containsQuestion": true
  },
  "cases": [
    {
      "name": "correct",
      "actualScore": {"kind": "correct", "earnedPoints": 3, "maxPoints": 3},
      "persistedAttemptsAfterRebind": 1,
      "activeJournalAfterRebind": false,
      "authoredBrokenRelationMessages": [],
      "facadeFeedbackKeys": ["details", "reason", "result", "sources"],
      "facadeMessages": [],
      "expectedMessagesDelivered": true
    },
    {
      "name": "swap-last-two",
      "actualScore": {"kind": "partial", "earnedPoints": 1, "maxPoints": 3},
      "persistedAttemptsAfterRebind": 1,
      "activeJournalAfterRebind": false,
      "authoredBrokenRelationMessages": [
        {"kind": "broken_relation", "targetId": "expose->recover", "text": "Breaking expose->recover loses the explicit ownership or recovery boundary for price tampering; the learner must preserve the sequence before claiming success."},
        {"kind": "broken_relation", "targetId": "preserve->expose", "text": "Breaking preserve->expose loses the explicit ownership or recovery boundary for price tampering; the learner must preserve the sequence before claiming success."}
      ],
      "facadeFeedbackKeys": ["details", "reason", "result", "sources"],
      "facadeMessages": [],
      "expectedMessagesDelivered": false
    },
    {
      "name": "shift-preserved-block",
      "actualScore": {"kind": "partial", "earnedPoints": 2, "maxPoints": 3},
      "persistedAttemptsAfterRebind": 1,
      "activeJournalAfterRebind": false,
      "authoredBrokenRelationMessages": [
        {"kind": "broken_relation", "targetId": "preserve->expose", "text": "Breaking preserve->expose loses the explicit ownership or recovery boundary for price tampering; the learner must preserve the sequence before claiming success."}
      ],
      "facadeFeedbackKeys": ["details", "reason", "result", "sources"],
      "facadeMessages": [],
      "expectedMessagesDelivered": false
    }
  ],
  "expectedRed": [
    "swap-last-two: Design facade omitted selected authored broken_relation messages",
    "shift-preserved-block: Design facade omitted selected authored broken_relation messages"
  ]
}
```

Source and artifact hashes at the RED observation:

| Input | SHA-256 |
|---|---|
| `src/application/canonical/CanonicalTrainingRuntime.ts` | `cc980c835227e253c287a1dd841b0892861d5ab8f9491b1c35d5b870253a2e83` |
| `src/application/design-interview/designInterviewSessionFacade.ts` | `39a40ed1abbc1e3f49deab2704afedd7ad24591d1ccf6e8a3438a60b5ab8697a` |
| `src/features/practice/DesignInterviewPracticeScreen.tsx` | `7ed55c1b4ad2b402ca3c19ff70a463ebf032d80d2106e9e824c5507f68ea5567` |
| `src/content/generated/canonical-content/frontend-system-design-interview.json` | `7de3a0bd8860eef726c6bb11cbf8e0bbc88ff0282d1a4575cbf94cc5fb9dd9bf` |

The probe does not launch a native screen or claim visual rendering, Premium-provider authorization, other diagnostics, decision-matrix delivery, post-session review delivery, or full BIZQ-01 acceptance. It tests only actual canonical scoring, journal-backed memory persistence, and the Design family feedback projection for ordering `broken_relation` messages.

Controller acceptance extension after implementation: `--expect-delivered` also submits sparse and inherited-hole ordering responses through the actual Design facade, asserts rejection, zero attempts/reviews, no active outcome journal, no committed response/feedback, and unchanged occurrence. Foreground-time checkpoint may change; this is not whole-store equality proof. Default historical observation mode retains the original three valid cases.

Final controller acceptance also fault-injects the composed outcome boundary after the real facade foreground checkpoint: failed journal write has no response/feedback; failed exact attempt-record materialization retains a committed response and durable journal but no feedback; recovery creates one attempt, clears that journal and exposes only the actual broken relation. Memory-layer proof only, not SDK/native interruption.
