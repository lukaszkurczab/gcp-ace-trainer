# Independent Reason-quality reopen — OOD N03 cohort 19

**Verdict: REVISE under existing BIZQ-01 §4.4.** I reviewed the Reason field for all 162 current N03 questions against each prompt, keyed option, and the relevant feedback explanation. Twenty-five Reasons need wording-only repair. The source/consumer/admission acceptance reports remain historical evidence of those scopes; this finding reopens only the Reason-quality criterion and does not invalidate unrelated producer, consumer, admission, or provenance checks.

## Bound evidence

- Content checkout: `1d024bb62328bdb81490d713dc41a6f7d155e9b6`.
- Bundled OOD artifact SHA-256: `9632bd529f51a9ad29e5dd54a7e22684c668db22d3f5a6c49764c405689a95fb`.
- Existing criterion: [`01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md`](../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md), SHA-256 `67aba008969eb570c86e1fbefc5b88a5e65f422d160fc7dcfd38084b59ff67d5`, §4.4: Reason identifies the decisive condition and decision, and is not a paraphrase of the correct option or a praise string.
- Current canonical N03 source file hashes and exact item-level Reason/key excerpts are recorded in [`REASON-QUALITY-REOPEN.json`](REASON-QUALITY-REOPEN.json). Each file contains 18 current questions; all nine files were checked.

## Findings

In **OOD-N03-B02**, these 16 Reason values exactly equal their keyed option text after normalizing punctuation and whitespace:

`ood-n03-b02-i019`, `i020`, `i021`, `i022`, `i023`, `i024`, `i025`, `i026`, `i027`, `i028`, `i029`, `i030`, `i031`, `i033`, `i034`, `i036`.

For example, B02-i019 uses “Make the Session–Provider association navigable in both directions…” as both the correct option and Reason. The same problem occurs across multiple relationship questions: the learner receives the keyed action again instead of the decisive condition that makes that navigation direction appropriate. B02-i032 and B02-i035 are exceptions: their Reasons explain the forward paths/event-specific distinction and indexed alternatives without copying their keyed option.

In **OOD-N03-B03**, these eight Reasons paraphrase the keyed lifecycle outcome without a distinct decisive explanation: `ood-n03-b03-i019`, `i020`, `i021`, `i023`, `i028`, `i030`, `i032`, and `i033`. Examples include the expiry/record-retention decision at i019 and the retirement/completion-retention decision at i030. Their Reasons repeat the answer’s transition in synonyms; the item prompts or keyed options already state that transition.

In **OOD-N03-B08**, `ood-n03-b08-i021` says, “The prompt explicitly states that the caller retains the stream after this operation.” That echoes the stem’s caller-retention premise and does not connect it to the disposal decision. The Reason should explain the ownership consequence of the caller continuing to use the stream.

I found no additional material §4.4 Reason defect in the other 137 items. In particular, B01’s concise lifecycle/cardinality Reasons, B03’s other boundary explanations, and B04–B07/B09’s causal condition-to-decision Reasons were not rejected just for sharing domain vocabulary or mentioning the selected decision.

## Smallest correction

Rewrite only the 25 listed Reason strings. Preserve each question ID, prompt, constraints, options and option IDs, answer, Details, taxonomy, source references, scoring, and accepted learning decision. These are feedback-only edits with the same primary decision, so the existing identity policy requires retaining the current IDs. Each replacement Reason should name a decisive condition/property from that item and state why it supports the unchanged answer, without merely repeating the option or prompt. Do not regenerate the bank or broaden eligibility.

This review does not accept proposed replacement wording, source integration, follow-up proof, app rendering, or the broader BIZQ-01 objective. Those remain for their existing owners and pipeline.
