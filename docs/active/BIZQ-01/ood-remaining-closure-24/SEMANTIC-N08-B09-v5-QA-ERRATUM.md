# N08-B09 v5 QA receipt-binding erratum

This erratum corrects one evidence reference in the frozen `SEMANTIC-N08-B09-v5-QA.json`. The original report and its semantic findings are unchanged.

In the original report, `inputs.independentCheckSha256` contains `c8f4697c5f50eb36a7317fdf8e74db971984d15e3f1463e4d61b8050296d2229`, the SHA-256 of the checker script `INDEPENDENT-CHECK-N08-B09-v5.mjs`. That field is intended to identify the check receipt, so its correct value is `07f927bbf7922bc6aa3efc893c2535db31bad1eab1268ed956bb09b9026cfd12`, the SHA-256 of `INDEPENDENT-CHECK-N08-B09-v5.json`. The script hash remains recorded separately in this erratum.

The receipt binds the same frozen proposal, manifest, contract, source, author notes, and identity adjudication recorded by the QA. It contains 18 per-question bindings and records 18 valid questions, 18 accepted answers, 54 incorrect distractors, 18 reversed-answer checks, 18 matching feedback-target sets, and 18 reserved identity bindings. The source bytes match the manifest's `beforeSourceText`. No semantic re-review was performed or needed for this metadata correction; the original verdict and review content remain authoritative and unmodified.

## Bound artifacts

- Original QA JSON: `SEMANTIC-N08-B09-v5-QA.json`, SHA-256 `53ac4e4ec5efef506b601e5806cb1f458f166a02c3ce6c57bf5aeb44da04d94d`.
- Original QA Markdown: `SEMANTIC-N08-B09-v5-QA.md`, SHA-256 `45917294597dab162c875e46ea18970f202652491375193ef1024067768e5fa6`.
- Frozen proposal input: `review-inputs/N08-B09-v5.json`, SHA-256 `7068f9df47d5576317266e3e549574a4145307cfe211c6df2335b4fdb213032a`.
- Manifest: `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`.
- Contract: `N08-N09-CONTRACT.json`, SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- Current source: `patternly-content/content/object-oriented-design-interview/concurrency_thread_safety_resources_and_failure_handling/OOD-N08-B09.json`, SHA-256 `093bdea05d1a2e9854c474025fea368aac46a1c70f57f4a8371c990f0461e15d`.
- Check script: `INDEPENDENT-CHECK-N08-B09-v5.mjs`, SHA-256 `c8f4697c5f50eb36a7317fdf8e74db971984d15e3f1463e4d61b8050296d2229`.
- Check receipt: `INDEPENDENT-CHECK-N08-B09-v5.json`, SHA-256 `07f927bbf7922bc6aa3efc893c2535db31bad1eab1268ed956bb09b9026cfd12`.

The correction is limited to the receipt reference. It does not alter the review's scope, evidence, identity conclusions, or verdict.
