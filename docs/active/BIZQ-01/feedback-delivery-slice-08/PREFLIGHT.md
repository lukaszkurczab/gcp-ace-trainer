# BIZQ-01 feedback delivery slice 08 preflight

This is a bounded single/multiple-choice consumer probe for the current locked GCP and Coding artifacts. It does not claim coverage for ordering, complexity, other interactions, terminal review screens, or full BIZQ-01 acceptance.

Run from the `patternly/` repository root:

```text
node --import tsx docs/active/BIZQ-01/feedback-delivery-slice-08/preflight.ts
```

After the consumer implementation lands, run the same actual-runtime probe in acceptance mode:

```text
node --import tsx docs/active/BIZQ-01/feedback-delivery-slice-08/preflight.ts --expect-delivered
```

Acceptance mode exits nonzero if any selected authored message is missing. The default mode only reports observations; it does not treat missing messages as acceptance.

The probe submits GCP q001's selected wrong option through the actual `CanonicalTrainingRuntime`, commits the outcome twice through the mutation journal, rebinds the in-memory repositories, and reads the single persisted attempt. It then checks the real canonical composer and Certification immediate-feedback projection. It also checks a correct response gets no wrong-option explanation and deferred Certification feedback remains null. Coding q006 is loaded from the actual canonical artifact and passed to the same composer with a wrong stable option ID.

The original pre-change run exited 0 while recording the expected RED: the selected authored explanation existed on each loaded question, but neither composer nor the GCP immediate Certification projection returned it. Correct-answer and deferred-timing assertions passed. That output records the pre-change baseline only.

Current locked inputs observed:

- GCP: `google-cloud-associate-cloud-engineer-authoring-v2026.08.11`, artifact SHA-256 `eea751e977cbfb468577ff4ea47702b914e1de6ad7fa06519a4e919889f0a6f9`.
- Coding: `coding-interview-dsa-problem-solving-authoring-v2026.10.02-bizq01-04`, artifact SHA-256 `4ceb71ebf2edd963dd6f1bdd274dface6da667dd7d3586fa44b52efe45f263f6`.

This uses isolated in-memory persistence and actual application/runtime projection functions. It does not launch the UI or prove native rendering; `PracticeFeedbackBlock`'s existing source maps `feedback.messages` when present, while family screen adapters currently omit that property. No content, storage, service, or runtime configuration is changed.

Exact output:

```json
{
  "fixture": "current locked canonical artifact; GCP wrong response was submitted through actual CanonicalTrainingRuntime and journaled to memory repositories twice, then read after repository rebind",
  "mode": "observation only: baseline absence is historical evidence, not acceptance",
  "artifacts": {
    "gcp": {
      "contentVersion": "google-cloud-associate-cloud-engineer-authoring-v2026.08.11",
      "artifactSha256": "eea751e977cbfb468577ff4ea47702b914e1de6ad7fa06519a4e919889f0a6f9"
    },
    "coding": {
      "contentVersion": "coding-interview-dsa-problem-solving-authoring-v2026.10.02-bizq01-04",
      "artifactSha256": "4ceb71ebf2edd963dd6f1bdd274dface6da667dd7d3586fa44b52efe45f263f6"
    }
  },
  "gcp": {
    "questionId": "gcp-ace-gcpace-n01-b02-001",
    "persistedAttemptsAfterRebind": 1,
    "selectedWrongOptionId": "B",
    "authoredMessageText": "This option selects create a billing export dataset, but the decisive requirement is managed identity and organization root.",
    "canonicalComposerMessage": null,
    "certificationImmediateMessage": null,
    "correctResponseWrongOptionMessages": 0,
    "correctCertificationWrongOptionMessages": 0,
    "deferredFeedback": null
  },
  "coding": {
    "questionId": "alg-contrast-binary-scan-correctness-006",
    "selectedWrongOptionId": "sort_binary",
    "authoredMessageText": "This ignores the preprocessing cost required to make binary search legal.",
    "canonicalComposerMessage": null
  },
  "expectedRed": [
    "GCP canonical composer drops the selected authored wrong-option message",
    "GCP immediate Certification projection drops the selected authored wrong-option message after durable submit",
    "Coding canonical composer drops the selected authored wrong-option message"
  ]
}
```

During the follow-up run, the Certification projector changed concurrently. The same artifact and persisted/rebound attempt then showed the Certification immediate message present, while the GCP and Coding composer messages were still null. This is a partial post-change observation, not the original baseline and not full acceptance. Re-run with `--expect-delivered` after the assigned consumer implementation is complete to establish GREEN.
