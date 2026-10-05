# Independent semantic QA: N08-B08 v4 correction

**Verdict: PASS for this bounded correction.** The three Details corrections resolve the exact v3 findings without changing the accepted decisions or introducing transaction, transport, or publication guarantees beyond the case facts.

## Inputs and method

- Frozen v4 proposal: `review-inputs/N08-B08-v4.json`, SHA-256 `5a535122196cd793b893cf518a1afcac36aa044166cafdfb009260dbed8fd1f2`.
- Frozen v3 comparison: `review-inputs/N08-B08-v3.json`, SHA-256 `c8e7e4fab99c5d297c07a5dc497df0c541f2cd1ae13c15e9f1162e9fff3d47a1`; the mutable proposal copy is byte-identical.
- Source manifest: `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`. The current source bytes match its bound SHA-256 `b222555c7a79b975fde1a321c045b516733612f8f88b483c9c329a1438f5785c`.
- Contract: `N08-N09-CONTRACT.json`, SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- I reused the prior review only for the 15 exact whole objects whose canonical content is unchanged. I reread the three corrected cases with their full prompt, constraints, options, keyed answer, Reason, and all Details fields. The checker also compares the exact changed-leaf set, validates all 18 questions, scores each key and all 54 distractors, checks reversed option order, and verifies feedback target coverage.

## Findings

- **i003 — pre-commit validation:** the scenario application now names the repayment-entry validation failure and accurately states that neither local effect is visible. The boundary explains why retaining one side or compensating would invent an effect that never committed. The transfer limits compensation to a case that actually committed an effect. This fixes the old unrelated “allocation” phrase and the false committed-effect boundary.
- **i009 — unknown external result:** the scenario and boundary preserve the outcome as unknown after a lost acknowledgement and retain the original issue identity for reconciliation. The transfer correctly distinguishes a transport failure from evidence of rejection. It does not assert that the external exchange committed.
- **i014 — pre-publication validation:** the corrected details state that the current lesson remains visible, progress retains its current identity, and the retirement is failed until valid mapping publication. They no longer describe this pre-publication failure as an already committed effect.

All 15 other whole objects match v3 exactly. The three corrected objects retain their question IDs and `owner_preserves_contract` key IDs; their prompts, constraints, options, Reason, messages, and source references are unchanged. The content of those unaffected fields was previously reviewed in the full v3 QA.

## Verification

The independent check passed: **18/18 valid, 18/18 keyed answers correct, 54/54 distractors incorrect, 18/18 keys correct after option reversal, 18/18 feedback target sets match, 15 unchanged whole objects, 3 corrected whole objects with only the nine expected Details leaves changed.** See `INDEPENDENT-CHECK-N08-B08-v4-CORRECTION.json` (checker SHA-256 `614826f2aff065bf10e259438e2e7a54387f86c7549b3fbe269fd5dcc6f2c667`).

This is scoped to the N08-B08 v4 correction. It does not accept the complete N08/N09 cohort, source activation, producer readiness, consumer/admission/runtime, native or Premium coverage, or full BIZQ-01 closure.
