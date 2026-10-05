# Current OOD N08/N09 source observations

**Stage:** read-only source preflight, completed for all 324 current N08/N09 objects. This is not authoring, producer approval, app readiness, or full BIZQ-01 acceptance.

## Bound sources

The current patternly-content commit is 27b7b7c9ece584e9904b343e63b49cd8a7f087c6. Its OOD catalog row is object-oriented-design-interview-authoring-v2026.10.05-bizq01-23 (catalog SHA-256 a4f02198a96cee3e554a0781eba612da198dccc696e75ce86bf3d68e75267fbe). The current app-generated OOD artifact is SHA-256 932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7 at version object-oriented-design-interview-authoring-v2026.10.05-bizq01-23; the app lock records 1413 questions and source hash 932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7. The bound app question-set hash is cdb6b644d1029b0ffc5d1a09cbaed2aecb3f7785d718bb056c5d6a0cbd5eeefa. These bindings describe the current v23 snapshot and do not authorize a new version or consumer change.

Prior review ledger: [SOURCE-PREFLIGHT.json](../ood-remaining-closure-21/SOURCE-PREFLIGHT.json), SHA-256 c72dddc00be6072b6efd06aa308a413f280e050dc889452767713f8cb4ed4d20.

## Coverage and disposition

| Node | Units | Questions | Prior exact CONFIRMED findings reused | Direct CONTRACT_GAP reads | Direct NOT_REPRODUCED controls |
|---|---:|---:|---:|---:|---:|
| N08 | 9 | 162 | 142 | 19 | 1 |
| N09 | 9 | 162 | 130 | 31 | 1 |
| Total | 18 | 324 | 272 | 50 | 2 |

The standard producer validateTrack API returned 1,413 questions for this current catalog. Every current file raw-byte hash and every current canonical whole-question hash matched the prior ledger: 18/18 files and 324/324 objects, zero mismatches. The 272 prior CONFIRMED item findings are reused on exact object identity. I directly inspected the 50 CONTRACT_GAP objects and both controls, including prompt, constraints, every option, answer/scoring, Reason, each Details field, every wrong-option message, and sourceRefs. Per-item bindings and observations are in the JSON.

## Current gap pattern

N08 defects are heterogeneous but align with the unit objectives. B02 synchronization/ownership cases do not state competing access or a handoff constraint; B03 atomicity cases do not state an interleaving or reader/writer schedule; B08 failure cases do not identify collaborator order, failure point, or already-committed effects; B09 retry cases do not specify retry identity or duplicate-request behavior. The answer keys may express sound general principles, but the stated facts do not distinguish the keyed mechanism from an ordinary state transition. The repeated broad alternatives and templated diagnostics do not supply that missing case evidence.

N09 gaps omit case context that selects the named maintainability mechanism. B01/B02 show time-sensitive outcomes but do not justify the full environment-seam list in their keys; B04 gives no current implementation/baseline or concrete refactoring sequence; B05 states caller-contract preservation without the public API consumers/version/deprecation context; B06 does not specify diagnostic content or exposure boundary; B07 supplies no measurable workload; B08 says “second workflow” without naming independent variation or substitution facts. These are decision-support gaps, not proof that the domain invariant or general key principle is wrong.

The controls are narrow. N08-B09-i014’s traceable, no-double-charge invoice retry supports its key’s retry-key/idempotent-boundary facet. N09-B01-i001’s reservation expiry and no-live-integration test requirement support a controllable clock seam. Neither validates the remaining breadth of its option or all repeated feedback as a whole.

## Scope recommendation and dependencies

I recommend preparing N08 and N09 as one bounded two-node content-package candidate, then reviewing proposals by mental unit before source integration. Both nodes are the final remaining N08/N09 source files in one OOD track and share the source-array format, validator/scorer, version/QSet identity, app artifact, and standard consumer path. One approved package can avoid a second version/proof/consumer cycle; unit-by-unit semantic review keeps decisions reviewable. This is not a requirement to rewrite 324 questions: supported primary decisions may remain, and same-meaning feedback/explanation repair may retain an ID under the existing identity contract.

Relevant producer paths are patternly-content/scripts/build.mjs (validateQuestion, validateTrack, scoreQuestion, artifact build), with regression precedents at patternly-content/tests/bizq01-ood-node-closure-23.test.mjs and patternly/src/content/bizq01OodNodeClosure23.test.ts. The app runtime pool accessor is patternly/src/content/canonical/runtimeCatalog.ts. Current ordinary mode pools remain the existing 136-item N01 pool; this preflight did not change or claim eligibility for N08/N09. Any future content change should preserve accepted N01–N07 and use the same producer/app paths to verify current track count/QSet, scoring, feedback, render disclosure, and three mode-pool behavior.

No source, contract, proposal, proof, consumer, or release files were edited for this preflight. See [CURRENT-SOURCE-OBSERVATIONS.json](CURRENT-SOURCE-OBSERVATIONS.json) for exact item bindings and per-item evidence.

