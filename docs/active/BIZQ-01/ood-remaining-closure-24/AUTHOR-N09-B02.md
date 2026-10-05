# N09 B02 authoring handoff

This inactive proposal retains all 18 `OOD-N09-B02` question IDs and the existing constructor/assembly testability objective. Each item makes a construction input explicit in its own scenario: deadline time, regional policy, child identity, approval history, selected revision/version, actor context, or another controlled collaborator. The revised options distinguish explicit per-instance assembly from ambient state, post-construction repair, a live dependency, or a result stub where those alternatives fit the case. All option IDs are new because the former generic choice set was replaced.

Mechanical checks used `validateQuestion` and `scoreQuestion` from `scripts/content/question-contract.mjs`: all 18 objects validate, feedback targets match every actual wrong-option ID, and original/reversed option orders produce 180 correct/incorrect score checks. The original source array remains bound to the preflight manifest; no source, catalog, proof, verifier, consumer, or admission file was changed.

| File | SHA-256 |
|---|---|
| `proposals/N09-B02.json` | `12b0af8142102ad33689c605503c2c0cb25bcfae39d2ff97f97766f4e29ae2b1` |
| `AUTHOR-N09-B02.json` | `f84c7c5838dc71b4c83d16727739201bfcff0bad8130ed5112aea3848588ec5d` |

Microsoft’s official unit-testing guidance supports isolated tests and controlled substitutes for dependencies. TimeProvider is cited only on the time-dependent construction cases. These are authoring and mechanical-validation handoffs, not semantic acceptance.
