# N05/21 independent app consumer review

**Verdict: PASS for the bounded source-to-app consumer contract.** The synchronized v21 artifact contains the exact 153 reviewed same-ID N05 objects, uses the current candidate and content locks, preserves the other OOD content and the ordinary N01 pools, and passes the focused consumer checks. This review stops before candidate admission, provenance export, and the broader app release gate.

## Frozen consumer inputs

The app checkout was at `f52e94d413a70eeb879115293f171ff19aca6340`, with the following synchronized files:

| File | SHA-256 |
|---|---|
| `src/content/generated/canonical-content/object-oriented-design-interview.json` | `03107b2ed9f096461ed7ffb843fa57bc6d4043d9cd09210317a1fbfed5093b5e` |
| `src/content/generated/canonical-content/content-lock.json` | `60d3bb79e645bcc1049f151d17260eca298d5df763c41765f1b518e3218211c9` |
| `integration/contracts/content-release/release.lock.json` | `cb39c5948cd2663e79a930e92536a9abf85acb9cba22d468adf1b9bdc87cfd26` |
| `src/content/bizq01OodNodeClosure21.test.ts` | `c29e9216f0b91a93f0bfba74bf13994762c2ab86589cd83ef072fded68673e1b` |
| `src/domain/tracks/runtimeAdmissionLaunchTracks.test.ts` | `1d8178b122cdb0353f83044f544b184f47abc4d545999121b09a2ec4ad97a451` |
| `docs/active/BIZQ-01/ood-remaining-closure-21/check-consumer-preservation.mjs` | `fcbf5e06b7265acac6f3b014baebcfa5552c3cd1469070d7b86d7244a3cfd2ef` |

The artifact is version `object-oriented-design-interview-authoring-v2026.10.04-bizq01-21`, with 1,413 questions and question-set hash `6d19a75e8eae86869b3ce31b63ad57a6be13fc30532c22e993db6fbc3d0d4d12`. The release lock binds the OOD artifact checksum and version to candidate `59d008662e6fab640d093c9ad29b30c566a6440d0fd549012078c80e8f26803d` and producer/source commit `19364f9a1167946f0b3d299a59b27864893ae01c`. `npm run check:content-release` independently confirmed the bundled artifact and locks agree (`CANONICAL_CONTENT_CHECK=passed`, inventory 9 tracks / 16,077 questions).

## Consumer and preservation evidence

I ran the focused N01–N05, historical, and source-replacement consumer suite:

```sh
node --import tsx --test \
  src/content/bizq01OodNodeClosure21.test.ts \
  src/content/bizq01OodNodeClosure20.test.ts \
  src/content/bizq01OodNodeClosure19.test.ts \
  src/content/bizq01OodReasonAmendment19a.test.ts \
  src/content/bizq01OodNodeClosure17.test.ts \
  src/content/bizq01OodNodeClosure16.test.ts \
  src/content/bizq01OodUnitCohort13.test.ts \
  src/content/bizq01OodSourceReplacement.test.ts \
  src/content/bizq01OodSourceReplacement12.test.ts
```

Result: **86/86 passed**. The new test verifies exact source/proof/runtime objects for all 153 retained question IDs; each answer and wrong-option feedback target; per-question option-ID uniqueness; scoring for every option before and after reversing display order; and a pre-answer view with no answer or feedback fields. It checks the accepted N01–N04 node counts and exact membership of all three ordinary 136-question N01 pools. The global cross-question option-ID uniqueness assertion identified in review was removed; the test does not create that extra contract.

I also ran the runtime catalog, product-mode, ODK-097 selection, and runtime-admission launch-track tests: **23/23 passed**. The current candidate ID is pinned by the existing runtime-admission launch-track test. `npm run check:content-release` passed against content HEAD `19364f9a1167946f0b3d299a59b27864893ae01c`.

The preservation check `node docs/active/BIZQ-01/ood-remaining-closure-21/check-consumer-preservation.mjs --consumer-only` passed. It compared the app artifact to its pre-change Git version and verified all 153 mapped questions, all 1,260 other OOD questions, the eight other canonical artifact bytes, and the historical release-lock bytes. Its receipt `ROOT-ARTIFACT-PRESERVATION.json` records the 153/1,260 counts and historical lock SHA `d5058e8678ceab38fbdb3fc6ea423b80e21571885549df9b42dd6e3916312195`. Demo payload checks are deliberately omitted in consumer-only mode because they depend on the later admission/provenance stage.

I also ran `node docs/active/BIZQ-01/ood-remaining-closure-21/resolve-review18-n05.mjs`. It passed the narrow metadata binding for the one changed OOD sample (`ood-n05-b01-i004`): the historical reconciliation fingerprint, current whole-object fingerprint, exact question, accepted option ID, and current semantic-review PASS all match. This associates a current verdict with that changed object without transferring its historical verdict or altering the raw reconciliation report. The helper SHA is `2ef2332f2f4788118fa6e03e16531ae3287ec4dfae588ecea01e079a4f055c75`; its current receipt is `ROOT-REVIEW18-CURRENT-ACCEPTANCE.json`, SHA `573031123097939b300a21dbf1f578b4a25ef62991f48e147448b1175a485128`.

Root’s matching focused run is preserved in `ROOT-CONSUMER-GREEN.log` (SHA-256 `534046d741bc6ba5b0b127d838e04657becbcc2fe807af349c1b30828302a7bc`) and its artifact-preservation receipt in `ROOT-ARTIFACT-PRESERVATION.json` (SHA-256 `538360b9fff3d41dc9b9daf26aa9fbaf169657f46b48a78a433df95537eec107`). The earlier pre-sync RED log is historical: it correctly observed v20 runtime content before synchronization and is superseded for current consumer state by the v21 GREEN results.

## Boundary

This verifies local source-to-artifact/runtime parity and preserved content selection. It does not verify or grant candidate admission, runtime/publishing admission, demo provenance, external publication, native/Premium behavior, app-wide release readiness, or full BIZQ-01 closure. Those remain separate downstream checks. The current test and artifact are in the app worktree; this report does not claim an app consumer commit.
