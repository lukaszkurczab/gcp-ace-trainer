# Stage 3 audit-evidence rerun — 2026-07-19

## Verdict

**PARTIAL — Stage 3 remains `NEEDS_CORRECTION`; G-D and G-Q are not closed.**

This rerun repaired and exercised the isolated audit host. It produced native
iOS screenshots for P-01 through P-12 from the real Algorithms surfaces and
the pinned bundled artifact. It did not produce the remaining states, Android,
screen-reader, large-type, reduced-motion, or approved-packet comparison
evidence. The current pushed QA workflow is still red; its checkout defect is
fixed locally but has not been pushed or independently rerun.

## Environment

| Field | Value |
| --- | --- |
| App SHA under review | `a10678a` (pushed `main`) plus the uncommitted isolated-host and CI repair in this worktree |
| iOS device | iPhone 16 Pro, iOS 18.6, regular portrait phone, UDID `57EE62FE-3589-43E9-A8BD-EB637F18B919` |
| Native runtime | Installed development build with the existing MMKV/Nitro native project |
| Audit entrypoint | `audit/algorithms-ui/index.ts`, launched through Expo development client on port 8082 |
| Content source | The host reads the pinned bundled Algorithms artifact; it does not create question, fallback content, or a substitute session |
| State source | Immutable application projection fixtures in `fixtureCatalog.ts` |
| Persistence | Audit host has no MMKV write path; static isolation test passes |
| Android | No attached ADB device and no available AVD |

## Captured iOS evidence

All paths below are ignored local audit artifacts. They show the isolated host
with an audit-only state pager above the production Algorithms surface; that
pager is intentional and is not a production UI difference.

| State | Flow | Screenshot path | Result |
| --- | --- | --- | --- |
| P-01 | `algorithms-stage3-harness.ios.yaml` | `docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/maestro/screenshots/algorithms-stage3__p-01__preparing__ios-regular.png` | captured |
| P-02 | same | `docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/maestro/screenshots/algorithms-stage3__p-02__unanswered__ios-regular.png` | captured |
| P-03 | same | `docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/maestro/screenshots/algorithms-stage3__p-03__submitting-before-journal__ios-regular.png` | captured |
| P-04 | same | `docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/maestro/screenshots/algorithms-stage3__p-04__submit-journal-failed__ios-regular.png` | captured |
| P-05 | same | `docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/maestro/screenshots/algorithms-stage3__p-05__commit-pending__ios-regular.png` | captured |
| P-06 | same | `docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/maestro/screenshots/algorithms-stage3__p-06__commit-materialization-failed__ios-regular.png` | captured |
| P-07 | same | `docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/maestro/screenshots/algorithms-stage3__p-07__feedback-correct__ios-regular.png` | captured |
| P-08 | same | `docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/maestro/screenshots/algorithms-stage3__p-08__feedback-partial-long-details__ios-regular.png` | captured |
| P-09 | same | `docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/maestro/screenshots/algorithms-stage3__p-09__advancing__ios-regular.png` | captured |
| P-10 | same | `docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/maestro/screenshots/algorithms-stage3__p-10__advance-failed__ios-regular.png` | captured |
| P-11 | same | `docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/maestro/screenshots/algorithms-stage3__p-11__completed__ios-regular.png` | captured |
| P-12 | `algorithms-stage3-harness.ios-02.yaml` | `docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/maestro/screenshots/algorithms-stage3__p-12__leave-confirmation__ios-regular.png` | captured |

## What remains unverified

| Required evidence | Result | Reason |
| --- | --- | --- |
| P-13…P-15 and S-01…S-29 | not captured | The original long Maestro run ends before the full state set; it must be split into bounded capture flows. |
| Real interactive happy path | not captured | The host proves artifact-backed render states, not a live user interaction journey. |
| Android critical states | blocked | No Android target exists in this environment. |
| VoiceOver/TalkBack traversal | not captured | Hierarchy output does not establish the required spoken sequence. |
| Standard/large Dynamic Type, reduced motion, focus order, touch targets | not captured | No native assistive-technology or setting-specific run was performed. |
| Approved-packet screenshot comparison | not captured | No accepted comparison packet is attached to this rerun. |

## CI finding

GitHub Actions run [29687960595](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/29687960595)
failed in `qa-static` because the content checkout was nested inside the
application checkout, making the cross-repository integrity check correctly
see a dirty application tree. The local workflow repair now checks out the
application at `app` and the locked content producer at sibling
`patternly-content`, matching the already-correct cross-repository job. The
workflow-shape test passes, but a pushed green run is still required.

## Local verification

| Check | Result |
| --- | --- |
| `node --import tsx --test tests/algorithmsCrossRepoWorkflow.test.ts` | PASS |
| `npm run audit:algorithms-ui:fixtures` | PASS (2 tests) |
| `npm run typecheck` | PASS |
| `git diff --check` | PASS |
| `npm run test:algorithms-cross-repo` | blocked locally by its intentional clean-worktree guard; the current Stage 3 and P6 edits are uncommitted |

No production runtime semantics or Algorithms question content changed in this
rerun.
