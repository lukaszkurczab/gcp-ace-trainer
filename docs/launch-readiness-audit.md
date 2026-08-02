# Patternly — launch readiness audit

> **Scope correction — 2026-07-31:** this audit's original implementation plan
> started at release closure too early. The current application still requires
> full product-surface inventory, missing-surface closure and systematic visual
> completion before signing and store packaging. The canonical active plan is
> [`launch-completion-plan.md`](launch-completion-plan.md).

Status date: **2026-07-31**  
Application commit: `4a2c2abe045d13bb11018b9720c6bdf5ef85ca5b`  
Content release commit: `d780204eba858c05b94fdbce8de38ec4c3900a50`  
Public launch verdict: **NO-GO**

## Decision scope

This document replaces moderated-user-testing readiness as the active audit
objective. Internal product tests may run independently at every stage; they do
not authorize or block a store launch.

Manual item-by-item question review is not part of the launch process. The
launch audit evaluates visible large-text behaviour, deterministic
accessibility semantics covered by automated tests, release configuration and
store compliance.

## Executive answer on question quality

**The current evidence does not justify calling the entire refactored question
bank insufficient for launch.** The previous audit over-weighted advisory form
signals and the absence of a durable human-review record.

The refactor being assessed is already present in commit `bb18794`. It changed
218 files with 18,207 insertions and 15,033 deletions, covering both canonical
tracks and adding a deterministic explanation-quality audit. No newer content
refactor exists in either the local or fetched remote repository.

The correct status is:

- structural and publishing contract: `done` for the pinned release;
- automated explanation inspection: `done`;
- universal semantic correctness: `unknown / needs evidence`, because neither
  structural validation nor prose heuristics can prove it;
- manual question review: removed from the launch plan by owner decision;
- residual content risk: accepted and managed through automated release gates,
  direct correction of any demonstrated defect and release-to-release
  diagnostics.

This means content quality is a **controlled launch risk**, not a blanket
launch blocker.

## What the automated evidence proves

Fresh commands executed on 2026-07-31:

| Evidence | Result | What it proves |
| --- | --- | --- |
| `patternly-content npm test` | `45/45 PASS` | publishing architecture, taxonomy, immutable evidence, selection, mode readiness and exact content contracts |
| `npm run audit:explanations` | `PASS`, 2,735/2,735 items | every item is inspected exactly once and form-risk signals are deterministic |
| `patternly npm run qa:static` | `407/407 PASS` plus typecheck and boundaries | application behaviour, persistence, privacy boundary and pinned-content consumption |
| cross-repository release test | `PASS` | `patternly-core-0015` exactly matches producer manifest and bundled application bytes |

The explanation audit confirms substantial rich-format adoption:

- 1,212 heading blocks;
- 1,302 callouts;
- 410 bullet lists;
- 390 ordered lists;
- 2,709 paragraphs;
- one code block and one image where authored content chose those forms.

The low code/image counts are not quality defects by themselves. Most
conceptual decision questions do not require either form.

## What the automated evidence does not prove

The audit reports 1,411 items with at least one advisory signal:

| Signal | Count | Correct interpretation |
| --- | ---: | --- |
| paragraph-only details | 1,283 | format signal, not proof of weak teaching |
| short wrong-option explanation | 147 | review priority, not proof of incorrectness |
| reason repeated verbatim | 128 | likely redundancy, not automatically a wrong answer |
| short details | 24 | stronger risk, still content-dependent |
| ordering without sequence format | 5 | likely presentation mismatch requiring direct correction if reproduced in the app |

The tool itself states that these signals neither approve nor reject
pedagogical quality. They must not be converted into a fake percentage score or
a requirement to read all 2,735 questions manually.

Automated validation also cannot prove that:

- every accepted answer remains technically correct as external platforms
  change;
- every distractor is equally plausible;
- every prompt has exactly one intended interpretation;
- every explanation is optimal for every learner.

Those limits are normal product risk. A demonstrated content defect must be
fixed directly in canonical source; it must not be hidden, labelled or filtered
out.

## Launch content gate without manual review

Every public content release must satisfy all of the following:

1. `npm test` passes in `patternly-content`.
2. Both track validation commands pass for the exact technical-input commit.
3. The explanation audit covers exactly the published item count.
4. The release-to-release diagnostic report identifies every new or removed
   risk signal; new signals require a direct canonical correction or an
   explicit explanation of why the question form requires them.
5. The immutable release manifest, checksums and application bundle match
   byte-for-byte.
6. Certification source/version obligations are current where a question
   depends on a volatile cloud product rule.
7. Any defect found by automated checks, store review, support reports or
   internal product testing is corrected in canonical source and published as
   one coherent release.

No approval flag, temporary bucket, hidden filter or manual sign-off record is
part of this gate.

## Current status table

Only the statuses `done`, `partial`, `blocking`, `deferred`, `planned`, and
`unknown / needs evidence` are used.

| Area | Status | Current evidence / reason |
| --- | --- | --- |
| Refactored question bank | `done` | 2,735 items in the pinned immutable release; full structural validation |
| Complete route and competitive-gap inventory | `done` | all 21 current routes plus missing launch and category-baseline surfaces are classified in the active completion documents |
| Account/data contract | `done` | vendor-neutral account/data lifecycle and exhaustive parser guards passed independent QA after Slices 1A–1D |
| Account/data lifecycle implementation | `blocking` | current source still has no account, sync or deletion implementation |
| Content quality for launch | `partial` | strong automated contract; semantic correctness remains normal residual risk |
| Pinned content integration | `done` | cross-repository byte-exact test passes |
| Future content-release reproducibility | `partial` | both current-source `validate:real:*` commands return `MISSING_TECHNICAL_EVIDENCE`, although release `0015` remains pinned and byte-exact |
| Application static quality | `done` | typecheck, 407/407 tests, content and privacy boundaries pass |
| Algorithms runtime | `done` | deterministic answers, active timer, pause/resume, conflict recovery and truthful partial summary are covered |
| Certification exam simulation | `partial` | exam flow exists and has runtime evidence; result context remains thinner than Algorithms |
| Certification ordinary practice lifecycle | `blocking` | visible active time is not driven by the foreground timer; leave abandons directly; recovery, conflict and empty-response handling are not equivalent to the canonical Algorithms lifecycle |
| Large-text layout | `partial` | automated 200% contracts pass; prior rendered iOS XXL evidence shows excessive first-viewport hierarchy |
| Android target API | `done` | merged release manifest targets API 36, satisfying the Google Play requirement effective 2026-08-31 |
| Android production signing | `blocking` | release build is configured with `signingConfigs.debug` |
| iOS production archive/signing | `unknown / needs evidence` | no current signed archive or App Store upload evidence in the repository |
| Native configuration consistency | `partial` | iOS declares 12.0 while CocoaPods uses 15.1; tablet/orientation declarations need one public contract |
| Store privacy and product metadata | `blocking` | no public privacy-policy URL, support URL, store listing packet or completed store privacy declarations are evidenced |
| Study Activity and content issue reporting | `blocking` | no chronological session-history route or per-item report/correction path is evidenced |
| Store screenshots and launch copy | `planned` | current Maestro evidence is diagnostic, not a complete store-listing set |
| Production release smoke | `planned` | install and cold-start the signed store artifacts on physical iOS and Android devices |

## Actual public-launch blockers

### LAUNCH-001 — Certification practice lifecycle

The visible Cloud track cannot launch with a weaker ordinary-practice lifecycle
than Algorithms. The implementation must use one canonical session lifecycle:
foreground time, explicit leave decision, pause/resume, active-session conflict,
inline unanswered validation and truthful terminal summary.

Hiding Cloud or adding a compatibility branch is not an acceptable fix.

### LAUNCH-002 — Android release identity and signing

`android/app/build.gradle` signs `release` with the debug keystore. Google Play
requires a release build and signing flow; new Play apps are published as
Android App Bundles. Configure one production upload key/Play App Signing path,
keep secrets outside the repository and verify the produced AAB. Official
references: [Android publishing](https://developer.android.com/studio/publish/)
and [app signing](https://developer.android.com/studio/publish/app-signing).

### LAUNCH-003 — iOS release configuration and archive

Choose one supported iOS minimum and one tablet/orientation policy, then align
Expo config, plist, Podfile and Xcode build settings. Produce a signed archive,
upload it to App Store Connect and perform a clean TestFlight install.

### LAUNCH-004 — privacy, support and store declarations

The app stores local learning data and integrates third-party platform code.
The public privacy statement, in-app privacy access, support route and store
declarations must describe the actual binary. Apple requires a privacy-policy
URL and App Privacy answers, including third-party partners:
[App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy).
Apple also requires the policy to be accessible in the app:
[App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).

### LAUNCH-005 — store release packet

Prepare final name, subtitle/short description, long description, keywords,
category, age/content rating, rights statement, support URL, privacy URL and
store screenshots for supported device classes. Do not reuse diagnostic
screenshots with development chrome or transient states.

### LAUNCH-006 — signed-artifact smoke

Run cold start, content preparation, one Algorithms session, one Certification
practice, one exam finalization, pause/relaunch/resume, data reset and offline
restart from the actual signed artifacts. This is release verification, not an
internal research session.

## Implementation-ready work

### Task 1 — canonical Certification practice lifecycle

- **Goal:** make the visible Certification practice modes product-safe.
- **Scope:** timer, leave/pause/resume, active-session matching, unanswered
  response, summary and behavioural tests.
- **Non-goals:** new modes, new question content, compatibility path or hiding
  the track.
- **Inputs:** Algorithms lifecycle, shared training use cases, Certification
  family scoring.
- **Acceptance criteria:** all practice modes use one active-session contract;
  foreground time advances and resumes; leaving requires an explicit decision;
  a different active configuration cannot be resumed silently; unanswered
  submit stays on the question with actionable copy; terminal summary is
  truthful.
- **Verification:** focused unit tests, full `qa:static`, two-platform Maestro
  lifecycle flow.
- **Evidence:** implementation report and screenshots of every terminal/recovery
  branch.
- **Risk:** preserving the current screen as a second implementation would
  retain the architectural defect.
- **Report target:** `docs/reports/launch-001-certification-practice-lifecycle.md`.

### Task 2 — restore future content-release validation

- **Goal:** make both `validate:real:*` commands pass for the exact current
  technical inputs without changing the pinned bank silently.
- **Scope:** diagnose manifest/evidence identity mismatch, correct the canonical
  publishing path and produce a coherent new content release only if input bytes
  must change.
- **Non-goals:** manual question review, metadata flags or bypassing evidence.
- **Acceptance criteria:** both validations pass from a clean checkout and the
  cross-repository round-trip remains byte-exact.
- **Verification:** 45/45 content tests, both track validations, artifact
  verification and application cross-repository test.
- **Evidence:** exact commits, fingerprints and command output.
- **Risk:** regenerating evidence against the wrong commit would produce false
  reproducibility.
- **Report target:** `docs/reports/launch-002-content-release-validation.md`.

### Task 3 — production distribution configuration

- **Goal:** produce uploadable signed iOS and Android artifacts.
- **Scope:** signing, version/build identity, native configuration alignment,
  AAB and iOS archive.
- **Non-goals:** store copy and new product features.
- **Acceptance criteria:** release never uses debug signing; secrets stay
  outside Git; target API is at least 36 for submissions from 2026-08-31; signed
  artifacts install and identify as Patternly.
- **Verification:** signature inspection, archive validation and clean install.
- **Evidence:** sanitized build reports and artifact checksums.
- **Risk:** signing material must not enter logs or repository files.
- **Report target:** `docs/reports/launch-003-distribution-artifacts.md`.

### Task 4 — public privacy and store packet

- **Goal:** create complete, truthful store submission inputs.
- **Scope:** policy/support pages, in-app links, privacy/data declarations,
  rights, ratings, descriptions and screenshots.
- **Non-goals:** billing or analytics. Account privacy, deletion and data-safety
  declarations are in scope after the account contract and implementation.
- **Acceptance criteria:** every declaration matches the signed binary; privacy
  and support URLs are public; all required device screenshots are current.
- **Verification:** App Store Connect and Play Console draft validation.
- **Evidence:** exported metadata checklist without private account data.
- **Risk:** future SDK or analytics changes invalidate declarations.
- **Report target:** `docs/reports/launch-004-store-packet.md`.

### Task 5 — signed-artifact release gate

- **Goal:** decide GO/NO-GO on the actual store candidates.
- **Scope:** physical-device smoke, offline restart, recovery, local data reset,
  core Algorithms and Certification flows, privacy links and store artifact
  identity.
- **Non-goals:** moderated research or broad exploratory testing.
- **Acceptance criteria:** no blocking failure, exact content lock, truthful
  user states and completed store metadata.
- **Verification:** release checklist on both signed artifacts.
- **Evidence:** build IDs, device/OS, screenshots and command results.
- **Risk:** dev-client results cannot substitute for signed artifacts.
- **Report target:** `docs/reports/launch-005-final-go-no-go.md`.

## First next task

Execute **Task 2 — canonical visual shell and component rules** from
[`launch-completion-plan.md`](launch-completion-plan.md). The route/state and
competitive-gap inventory and account/data contract are complete. The next
bounded implementation unifies shell, header, safe-area, scrolling and shared
state primitives against the approved design reference before per-screen work.

## Evidence limitations

- No signed store artifact was built in this documentation-only reconciliation.
- App Store Connect and Play Console account state were not inspected.
- Current-source technical-evidence validation still fails even though the
  pinned release integration passes; the mismatch requires a separate focused
  implementation task.
