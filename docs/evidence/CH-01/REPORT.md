# CH-01 — correct content review commits

2026-10-04. Accepted delivery: independent runtime PASS23/23 and full canonical PASS168/168.

## Outcome and scope

The confirmed P1 defects were direct destination writes, memory publication before persistence, and independent startup snapshots overwriting each other. The delivered coordinator serializes mutations by canonical store path in the Node process and uses an exclusive sidecar across processes. Every mutation rereads validated latest disk state under exclusion, computes a candidate, writes an exclusive same-directory temporary file, closes it, and atomically renames it before publishing the Map. A second process gets an explicit busy error without a write. Successful commits remain successful if lock cleanup fails, with a distinct retained-lock warning; no automatic stale reclamation or blind retry.

Existing CLI/API, source/item fingerprints, human-only outcome decisions, schema and sequential per-item batch behavior remain. A batch can retain a committed prefix if a later item fails; it is not a new transaction. Existing reads remain instance-local committed snapshots, while every write rereads current disk. Store permissions are not widened. Supported file/directory symlink aliases converge; dangling leaf symlinks and hardlinks are explicit unavailable paths. Replaced direct write and premature Map mutation are removed; two verified unused unexported definitions are removed. Tests use OS temporary directories and clean their fixtures.

## Independence and review

BIZQ explicitly confirmed N05 does not edit this console/test or write real outcomes. Its Q14 advisory warning and tests are preserved. No questions, catalog/version, candidate/readiness/admission, generated bank, app lock or web demo provenance changed. The review store has no downstream build/admission reader. SEC-06 Host/Origin remains a separate task. BIZQ-02..05 and ARCH/PERSIST learning runtime, progress, planner, review and durable-data responsibilities are untouched. Foreign emulator/Metro processes and the existing iPhone 17 are untouched.

Worker gpt-6-luna/high owns the coherent console/tests package; controller owns documentation and status only. Independent design LunaHigh accepted fit0.94/simplicity0.83/risk0.82/maintainability0.88, minimum0.82, with concrete conditions incorporated before code. Independent acceptance is a separate reviewer and runtime pass. [Design](DESIGN-REVIEW.md), [briefing](BRIEFING.md), [preflight](PREFLIGHT.json).

## Boundaries

Real filesystem/process/HTTP/CLI tests establish this local tool's commit boundary. Same-directory rename is the tested commit point; no fsync/power-loss durability guarantee is claimed. A stale lock requires verified operator recovery and is never automatically removed by age/PID. Manual/out-of-band writers ignoring the sidecar are outside cooperative serialization. No real human review outcome was created in the repository and no automated signal became approval. No deploy, publish, purchases, service configuration, native/device or content activation occurred.

Final verification and reproducible evidence: [QA](QA.md). Focused15/15, independent23/23, full canonical168/168; source hashes and app admission pins unchanged after all runs.

Implementation commit: `95b7e07f33d7808b9c879db37f11e63e25abcb01` (patternly-content/master).
