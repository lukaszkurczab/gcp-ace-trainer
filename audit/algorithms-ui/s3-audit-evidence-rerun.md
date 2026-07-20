# Stage 3 audit-evidence rerun — 2026-07-19

## Verdict

**PARTIAL — Stage 3 remains `NEEDS_CORRECTION`; G-D and G-Q are not closed.**

This rerun repaired and exercised the isolated audit host. The bounded iOS
packet is **STALE — RECAPTURE REQUIRED** after the accessibility-control and
full-provenance-graph change (`6d5888…` stored versus `aa0f0f…` current). The
Android packet is also **STALE — RECAPTURE REQUIRED** (`0b4ae7…` stored versus
`0a20fd…` current). Neither packet is current visual evidence. Screen-reader,
large-type, reduced-motion, and
approved-packet comparison evidence remain
open, so the overall Stage 3 verdict does not change. A historical CI checkout
repair passed at another SHA; exact-SHA CI for this hardening remains open.

## Environment

| Field | Value |
| --- | --- |
| App SHA under review | `84bbfd0dca154ef85dc7d0853665f9f8f5ffab67`; production app source was unchanged, while the exact audit-only worktree is recorded in the capture manifest |
| iOS device | iPhone 16 Pro, iOS 18.6, regular portrait phone, UDID `57EE62FE-3589-43E9-A8BD-EB637F18B919` |
| Native runtime | Installed development build with the existing MMKV/Nitro native project |
| Audit entrypoint | `audit/algorithms-ui/index.ts`, launched through Expo development client on port 8082 |
| Content source | `algorithms-core-0002-b424faa6`, producer SHA `b424faa6d8c7209acb51ac23af812d08c31842dc`, checksum `fccc4c8564c61b1941d398712a2836ca980ce4fc1df1d1d02a12136112d41f0c`; the host creates no substitute content or session |
| State source | Immutable application projection fixtures in `fixtureCatalog.ts` |
| Persistence | Audit host has no MMKV write path; static isolation test passes |
| Capture settings | Dark app theme and English bundled content; simulator locale `pl_PL`, reduced motion `0`, and no explicit `UICTContentSizeCategory` preference were recorded after capture; portrait `ios-regular` |
| Capture interval | 2026-07-19 23:03:57–23:12:28 Europe/Warsaw |
| Android | `Medium_Phone`, Android API 37, `sdk_gphone16k_arm64`, explicit serial `emulator-5556`, 1080×2400 at 420 dpi; 44 states captured with font scale 1.0, transition/window animation scales 1.0, and no explicit animator scale, locale override, or accessibility service |

## iOS evidence — STALE / recapture required

All screenshots are ignored local audit artifacts under
`docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/maestro/screenshots/`.
Their repository evidence artifact, intended to be committed and not ignored,
is `audit/algorithms-ui/s3-ios-capture-manifest.json`. It is currently
untracked in this worktree. Its stored executable-source SHA-256 is
`6d5888808dea61c6b5d27ce28796df588cb199ff25b3ca323bbc5d05cdf0d53e`,
while the current full provenance graph computes to
`aa0f0fa680f9df328eda503e96e737c412c39d8b76162acb0dadf9e34dd41a80`.
The hashes differ, so the stored `captured_visual_review_pending` status and
the per-state result cells below are superseded until a fresh canonical
recapture publishes a matching manifest.
The runner starts the isolated host once. Each state flow then deep-links one
requested state, waits for the exact `algorithms-audit-current-<STATE>` testID,
and takes exactly one screenshot. All 44 bounded invocations exited successfully; the filesystem
inventory found 44/44 expected files with fresh timestamps in the capture
interval and no missing state.

After that replacement was proven, the old rejected
`algorithms-stage3-harness-entry-ios.png` and the accidental nested
`screenshots/screenshots/` duplicate directory were removed. The canonical
iOS evidence location now contains exactly the 44 files below.

| State | Flow in `algorithms-stage3-ios-states/` | Screenshot filename | Result |
| --- | --- | --- | --- |
| P-01 | `p-01.yaml` | `algorithms-stage3__p-01__preparing__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| P-02 | `p-02.yaml` | `algorithms-stage3__p-02__unanswered__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| P-03 | `p-03.yaml` | `algorithms-stage3__p-03__submitting-before-journal__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| P-04 | `p-04.yaml` | `algorithms-stage3__p-04__submit-journal-failed__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| P-05 | `p-05.yaml` | `algorithms-stage3__p-05__commit-pending__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| P-06 | `p-06.yaml` | `algorithms-stage3__p-06__commit-materialization-failed__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| P-07 | `p-07.yaml` | `algorithms-stage3__p-07__feedback-correct__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| P-08 | `p-08.yaml` | `algorithms-stage3__p-08__feedback-partial-long-details__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| P-09 | `p-09.yaml` | `algorithms-stage3__p-09__advancing__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| P-10 | `p-10.yaml` | `algorithms-stage3__p-10__advance-failed__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| P-11 | `p-11.yaml` | `algorithms-stage3__p-11__completed__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| P-12 | `p-12.yaml` | `algorithms-stage3__p-12__leave-confirmation__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| P-13 | `p-13.yaml` | `algorithms-stage3__p-13__abandon-confirmation__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| P-14 | `p-14.yaml` | `algorithms-stage3__p-14__abandoning__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| P-15 | `p-15.yaml` | `algorithms-stage3__p-15__abandonment-failed__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-01 | `s-01.yaml` | `algorithms-stage3__s-01__preparing__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-02 | `s-02.yaml` | `algorithms-stage3__s-02__insufficient-content__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-03 | `s-03.yaml` | `algorithms-stage3__s-03__editable-choice__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-04 | `s-04.yaml` | `algorithms-stage3__s-04__editable-unsaved__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-05 | `s-05.yaml` | `algorithms-stage3__s-05__saving__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-06 | `s-06.yaml` | `algorithms-stage3__s-06__editable-saved__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-07 | `s-07.yaml` | `algorithms-stage3__s-07__save-failed__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-08 | `s-08.yaml` | `algorithms-stage3__s-08__stale-revision__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-09 | `s-09.yaml` | `algorithms-stage3__s-09__navigator-inventory__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-10 | `s-10.yaml` | `algorithms-stage3__s-10__navigator-mixed__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-11 | `s-11.yaml` | `algorithms-stage3__s-11__finish-confirmation__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-12 | `s-12.yaml` | `algorithms-stage3__s-12__leave-confirmation__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-13 | `s-13.yaml` | `algorithms-stage3__s-13__abandon-confirmation__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-14 | `s-14.yaml` | `algorithms-stage3__s-14__abandoning__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-15 | `s-15.yaml` | `algorithms-stage3__s-15__abandonment-failed__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-16 | `s-16.yaml` | `algorithms-stage3__s-16__expired__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-17 | `s-17.yaml` | `algorithms-stage3__s-17__frozen__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-18 | `s-18.yaml` | `algorithms-stage3__s-18__finalization-journal-pending__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-19 | `s-19.yaml` | `algorithms-stage3__s-19__finalization-journal-failed__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-20 | `s-20.yaml` | `algorithms-stage3__s-20__materializing__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-21 | `s-21.yaml` | `algorithms-stage3__s-21__materialization-failed__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-22 | `s-22.yaml` | `algorithms-stage3__s-22__verification-failed__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-23 | `s-23.yaml` | `algorithms-stage3__s-23__recovery-required__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-24 | `s-24.yaml` | `algorithms-stage3__s-24__recovered-finalizing__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-25 | `s-25.yaml` | `algorithms-stage3__s-25__timer-recovery-failed__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-26 | `s-26.yaml` | `algorithms-stage3__s-26__missing-draft__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-27 | `s-27.yaml` | `algorithms-stage3__s-27__version-mismatch__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-28 | `s-28.yaml` | `algorithms-stage3__s-28__corrupt-state__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |
| S-29 | `s-29.yaml` | `algorithms-stage3__s-29__completed__ios-regular.png` | CAPTURED / VISUAL REVIEW PENDING |

## Android evidence — STALE / recapture required

The Android P-01…P-15 and S-01…S-29 packet is **STALE — RECAPTURE REQUIRED**.
The canonical command requires both the SDK root and one exact emulator serial:

```sh
ANDROID_HOME=/Users/lukaszkurczab/Library/Android/sdk npm run audit:ux-ui:android -- --serial emulator-5556
```

The Android runner rejects a missing, malformed, unattached, offline, or wrong
serial and refuses a pre-existing process on port 8082. It owns one Metro
process, launches the installed `MainActivity` by explicit component with the
exact audit-host URI, and performs one bootstrap readiness assertion. Before
each of the 44 state-only Maestro flows it launches the same explicit component
with that state's exact URI. Each flow contains only its exact selector wait
and one screenshot command. The prior conditional tap and single-state harness
were removed because they were competing, incomplete host-entry paths.

The repository ignores the generated `android/` native tree. An initial local
build with an added debug URI scheme therefore could not be canonical. That
change was reverted, the APK was rebuilt without the scheme, and the final
capture proves the persistable explicit-component runner path instead. The
final local and installed APK SHA-256 are both
`53e25124e1b1442d14b4574a56f501bba7b224f54793c997cd73ce7cf6fdf741`.

The evidence manifest is
`audit/algorithms-ui/s3-android-capture-manifest.json`. It binds the exact
runner/config/bootstrap/all 44 state-flow/host sources, app/content identity,
device and settings metadata, and every screenshot path, dimension, and
SHA-256. The fresh capture ran from 2026-07-19T21:27:38.886Z through
2026-07-19T21:35:07.487Z and records
Android audit-source SHA-256
`0b4ae7a095e7d8abc4e52022a0bb7360b71377a3f554c7c8ae859b2f94a3f5ed`,
while the current Android executable source computes to
`0a20fdbdeb614edf4c14e2cb9f5abe31b82abe552da0005227f565f8563ea2d3`.
The hashes differ, so the ignored
canonical screenshot directory contains exactly 44 PNGs: 44 unique SHA-256
values, all 1080×2400, with zero missing, extra, or hash-mismatched files.
Those files are historical rather than current evidence. Android recapture and
approved-packet comparison remain pending.

## What remains unverified

| Required evidence | Result | Reason |
| --- | --- | --- |
| iOS P-01…P-15 and S-01…S-29 | STALE / RECAPTURE REQUIRED | Stored source `6d5888…` differs from current full-provenance source `aa0f0f…`. |
| Real interactive happy path | not captured | The host proves artifact-backed render states, not a live user interaction journey. |
| Android P-01…P-15 and S-01…S-29 | STALE / RECAPTURE REQUIRED | Stored source `0b4ae7…` differs from current full-provenance source `0a20fd…`. |
| VoiceOver/TalkBack traversal | not captured | Hierarchy output does not establish the required spoken sequence. |
| Standard/large Dynamic Type, reduced motion, focus order, touch targets | not captured | No native assistive-technology or setting-specific run was performed. |
| Approved-packet screenshot comparison | not captured | No accepted comparison packet is attached to this rerun. |

## Canonical-runner hardening evidence

The first execution of the new canonical command
`npm run audit:ux-ui -- --udid 57EE62FE-3589-43E9-A8BD-EB637F18B919`
completed 27 bounded states and then failed in the S-13 process before its
state deep link. The exact failing action was the repeated conditional
`Run flow when "Continue" is visible`; XCTest returned HTTP 500 with
`Error getting element frame kAXErrorInvalidUIElement`. The child did not exit
after a bounded wait and was terminated. No success manifest existed, the
canonical screenshot directory retained its prior 44 files and timestamps,
and the isolated staging directory contained 27 files before it was removed.

The failing hierarchy read was part of duplicated dev-client bootstrap logic
in every state flow, not the S-13 state assertion. The canonical correction
moves host launch/readiness into one runner-owned bootstrap process. Each of
the 44 capture flows now contains only its exact state deep link, exact state
selector wait, and one screenshot command. There is no retry path: bootstrap
or any state failure terminates the run without publishing a manifest.
Publication swaps the screenshot directory and manifest as one paired
transaction. Before commit, both previous artifacts are retained and restored
together on failure. A post-commit backup-cleanup failure is reported while the
new canonical pair remains intact; it is never presented as a rollback.
The Android runner now uses the same paired transaction semantics. Injected
screenshot-swap and manifest-publish failures restore the prior Android pair
without residue. An injected post-commit backup-cleanup failure keeps the new
pair, raises an explicit error, and exposes the remaining backup residue.

## CI finding

GitHub Actions run [29687960595](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/29687960595)
failed in `qa-static` because the content checkout was nested inside the
application checkout, making the cross-repository integrity check correctly
see a dirty application tree. The repair checks out the application at `app`
and the locked content producer at sibling `patternly-content`, matching the
already-correct cross-repository job. The follow-up run
[29689913577](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/29689913577)
passed both the Recovery QA gate and the Algorithms cross-repository contract
for its historical pushed SHA. It is not exact-SHA CI evidence for
`84bbfd0dca154ef85dc7d0853665f9f8f5ffab67` plus the current audit hardening;
that CI gate remains open.

## Local verification

| Check | Result |
| --- | --- |
| `node --import tsx --test tests/algorithmsCrossRepoWorkflow.test.ts` | PASS |
| `npm run audit:algorithms-ui:fixtures` | PASS (2 tests) |
| `npm run audit:ux-ui:report` | PASS; all 44 iOS states reference their exact bounded flow |
| `npm run audit:ux-ui:runner:test` | PASS (12 tests: arguments, device, invariants, PNG, exact XY status, executable provenance, failed-publication isolation, paired publication failures, published-manifest integrity) |
| `npm run audit:ux-ui:android:runner:test` | PASS (12 tests: explicit serial/device, 44-state inventory, exact commands, fail-fast serial execution, source provenance, unique screenshots, atomic publication failures, current manifest integrity) |
| `./gradlew assembleDebug` | PASS (586 tasks; final scheme-free APK SHA-256 `53e25124…fdf741`) |
| `adb -s emulator-5556 install -r android/app/build/outputs/apk/debug/app-debug.apk` | PASS (`Success`); installed APK hash equals local APK hash |
| `ANDROID_HOME=… npm run audit:ux-ui:android -- --serial emulator-5556` | Historical 44/44 capture; current provenance is STALE and Android recapture remains open |
| Published Android screenshot inventory, SHA-256, and dimensions | Historical files pass inventory checks but are not current evidence because provenance is STALE |
| `npm run typecheck` | PASS |
| `npm run audit:ux-ui -- --udid 57EE62FE-3589-43E9-A8BD-EB637F18B919` | Historical 44/44 capture; current provenance is STALE and iOS recapture is required |
| Published iOS screenshot inventory, SHA-256, and dimensions | Historical files pass inventory checks but are not current evidence because provenance is STALE |
| `git diff --check` | PASS |
| `npm run test:algorithms-cross-repo` | blocked locally by its intentional clean-worktree guard; the current Stage 3 and P6 edits are uncommitted |

No production runtime semantics or Algorithms question content changed in this
rerun.
