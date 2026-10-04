# N06/22 consumer acceptance review

**Verdict: PASS for the bounded app consumer.** The app's synchronized v22 artifact contains the exact 180 reviewed same-ID N06 objects, exposes them through the loaded runtime, and preserves the tested scorer, feedback, pre-answer projection, ordinary N01 pools, and unrelated content artifacts. This review does not grant or verify runtime/publishing admission, native or Premium behavior, external release, or full BIZQ-01 completion.

## Bound inputs

The immutable semantic acceptance is `SEMANTIC-CURRENT-ACCEPTED-QA.json` (SHA-256 `3ddac680b864069af4295ac5c2f90d8a83564431b996188b85bdc49effe84ff8`); the source producer map is `ROOT-N06-PRODUCER-MAP.json` (`9369a886d8c091b4ee68bbb34818ec2001f1ff42698e59721548074729ef9e68`), and the accepted producer report is `PRODUCER-QA.json` (`fba82f9a5026b6338160e199dea93df779bae923b00ab7b8b453b48b9b6ef995`). The map's `beforeProducerCommit` is `b7034f16bb77db4dde2ae27c13ef706b0301f6bb`. The new source-bearing local checkpoint is recorded separately in `SOURCE-CHECKPOINT.json` and the candidate-readiness record as `7648782e57ef6927b90c687f7ae67c62b8ae5ed2`; the synchronized content snapshot reports `PATTERNLY_CONTENT_HEAD=335e5fdbac29ba3789536baabbc65e2f7b0677c0`.

At review time the app checkout was `7448b85e134fe0b18c51d40cb4d0e32d7eeb1afe`. The exact files relevant to the consumer check were:

| File | SHA-256 |
|---|---|
| `src/content/bizq01OodNodeClosure22.test.ts` | `0bf638a4680822c6d08bc3e88f1a65248ce9822bd4355fcfd6eb921f86dd5e20` |
| `src/content/bizq01OodNodeClosure21.test.ts` | `413265be4e868fdf1cb8f86a5d683d2c551baa8bbd9ec462aa48795ae2faf91d` |
| `src/domain/tracks/runtimeAdmissionLaunchTracks.test.ts` | `3baf05de415cc9a54454b534ad6a1d33ad8f93597cbbec3a16aa6b5f34e9f61e` |
| `src/content/generated/canonical-content/object-oriented-design-interview.json` | `d6a8ed4f946eb7e90690c0d6e2efe1cb9a3a8ecfa9217a487b612054acc4129d` |
| `src/content/generated/canonical-content/content-lock.json` | `e693efb6dd4a59a3105fe45ce1fdb9031913c2f235c0cc9a0215d6643b25060c` |
| `integration/contracts/content-release/release.lock.json` | `8620d09ea044d4ac37bad664adc59194c5bd7083c41e52702abc1dd6c46d92a7` |
| `check-consumer-preservation.mjs` | `64a7c1ce82f9613d772962091178d1f2c00971b33be38e4df38843730ac1a0f3` |

The generated artifact is v22 with 1,413 questions and QSet SHA-256 `c6cf903178b823fb71ac29040f3c5fa5f72c619d3adbb525fc7791756654ac3e`. Its artifact digest is bound by the content lock. The release lock pins candidate `ba35f8ad99a562858b76d0222f62dcc0c67178f1bc5ee996c76d316b0c701ffd` and the same bundled content-lock digest. The bound readiness record reports `result=PASS` for candidate readiness while explicitly leaving both publishing and runtime admission `not_granted`; no admission claim follows from this consumer review.

## Consumer behavior checked

The new test verifies every map entry against the loaded runtime's complete question object, not only IDs or counts. It checks the exact 180-question N06 set and QSet, validates each response by option ID before and after reversing display order, confirms wrong-option feedback targets match actual wrong IDs, and confirms the pre-answer view contains only prompt, constraints, and selectable option data. It also asserts N01 ordinary pools remain the same exact 136 IDs and N02–N05 counts remain stable. The uniqueness assertion is scoped to option IDs within each question; no global option-ID uniqueness rule was introduced.

The runtime-launch test checks the exact candidate and content-lock binding. The v21 consumer test remains bound to its historical v21 map while its current runtime-version pin advances to v22. This preserves the previously accepted cohort and its historical proof boundary.

## Independent verification

| Check | Result |
|---|---|
| `PATH=/opt/homebrew/opt/node@22/bin:$PATH node --import tsx --test src/content/bizq01OodNodeClosure22.test.ts src/content/bizq01OodNodeClosure21.test.ts src/domain/tracks/runtimeAdmissionLaunchTracks.test.ts` | PASS, 9/9; Node v22.22.3. This includes four v22 tests, four matching v21 preservation tests, and the candidate-lock launch test. |
| `PATH=/opt/homebrew/opt/node@22/bin:$PATH node docs/active/BIZQ-01/ood-remaining-closure-22/check-consumer-preservation.mjs --consumer-only` | PASS: exact 180 N06 objects, 1,233 other OOD objects, eight unchanged artifacts, historical release-lock digest preserved; current OOD artifact digest matches. Demo payloads are not checked in this consumer-only mode. Receipt `ROOT-CONSUMER-PRESERVATION.json`, SHA-256 `afe15a0e8d3d1fb19958ab5f4e01e4f0d7649b8c07c658c5e2f22a983fdbc60f`. |
| Consumer sync receipt | PASS, `ROOT-CONSUMER-SYNC.log` SHA-256 `09c0374c9f8175d7150721237ac224e78ffb6f24ad7a82ea063f40900a5444a2`; content inventory reports `9/117/943/16077`. |
| Candidate readiness binding | PASS, `ROOT-CANDIDATE-READINESS.json` SHA-256 `fc7e29f9c4924282db65d92ec0ce1f0a0f7ef6cff79fedb260ebd711fb864cf2`; positive bound log `ROOT-CANDIDATE-READINESS-BOUND.log` SHA-256 `4042fa4eb2855b3c193c222f0cfaef2dd341e78ea3d17c5eb814fe4eba7c4fda`. Readiness is distinct from admission. |
| `git diff --check` on the consumer tests, runtime pin, content lock and generated artifact | PASS. |

## Boundary

This accepts the synchronized N06 consumer behavior and the specified preservation checks. Candidate readiness is evidenced, but its record explicitly says runtime and publishing admission are not granted. Admission, app-wide static/release checks, exporter and demo-payload provenance, native/Premium behavior, and full BIZQ-01 completion are outside this verdict and remain separate. The old failed candidate-readiness transcription log is retained as history; it is not used as a positive receipt or as evidence of a consumer defect.
