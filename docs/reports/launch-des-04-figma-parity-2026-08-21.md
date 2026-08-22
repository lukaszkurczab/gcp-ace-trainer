# Patternly Figma parity and design-system cutover

Date: 2026-08-22
Repository: `Patternly`  
Starting commit: `b16c20b456d62d42b6f1a75d62e69bae18b29755`
Branch at start: `main`, tracking `origin/main`
Implementation commits: `4b91494`, `4391884`, `6ee92db`, `db9c637`, `3fbb599`, `e4c9e99`, `50acdd6`, `dd02de1`, `8c75d9b`, `f5f87c2`, `9a6e48f`, `736d32a`, `3e6a282`, `f509e91`, `189ff31`, `d6ee92e`, `0459be1`, `98e3a66`
Verified and pushed SHA: `b987b87a00ec53053c2c37bbae1e7b2d5a928da5`
Current local verification SHA: `98e3a66`

## Outcome

This pass extends the repository-owned visual system across the reachable Home, track selection, Progress, Settings, practice summary, simulation runner, simulation navigator, simulation summary/review, answer review, and review-empty states. Result summaries now use the Figma flat metric and outcome-row contract. It does not invent routes, metrics, commands, persistence, or account behavior for Figma frames that the current product does not expose. Current-head dark/light iOS runtime evidence was also captured through the local Metro bundle without resetting learner state.

The implementation is not design-complete. Several Figma-backed operational states still need a fresh screenshot comparison, and the Figma file contains account, authentication, premium, content-trust, goal/cadence, and focus-area surfaces without a matching canonical runtime owner. The correct final status for this pass is `INCOMPLETE`.

## Figma authority

- File: `kZXD7cNBKUU7x0ceTHPFpR`
- Page: `0:1` (`Page 1`)
- Component/library page: `118:738` (`Patternly Library`)
- Relevant authority nodes: Home `55:445`; Practice Hub `55:993`; Practice Setup `55:2172`; Session states `68:549` through `68:1239`; Simulation states `74:539` through `74:1126`; Summary `750:6235`; Practice variants `750:6400` through `750:6403`; Screen Header `140:881`; Bottom Navigation `140:875`; Button `141:817`; Answer Option `248:2394`; Settings Content `822:7687`; Progress `842:9563`; Review Shell `765:6130`.

## Repository-owned design system

Updated canonical owners:

- `src/theme/tokens.ts`: Figma dark canvas/surface/border/text/action colors, light action colors, typography scale, radii, and navigation tokens.
- `src/theme/navigationTheme.ts`: Figma dark-canvas detection.
- `src/components/Button.tsx`: Figma button geometry and explicit pressed/disabled/destructive states.
- `src/components/Card.tsx`: default and layered surface geometry.
- `src/components/Screen.tsx`: shared page padding and footer geometry.
- `src/components/ScreenHeader.tsx`: local Figma screen-header contract with accessible back action, context, title, and description.
- `src/components/BottomTabBar.tsx`: safe-area, active indicator, top rule, and label geometry.
- `src/components/ProgressBar.tsx`: Figma four-pixel progress track.
- `src/features/coding-interview/session/SessionShell.tsx`: compact session top bar.
- `src/components/AnswerOption.tsx`: one canonical Figma answer-option primitive for default, selected, correct, incorrect, and omitted-compatible states.
- `src/features/practice/PracticeResponseControls.tsx` and `src/features/simulation/SimulationSessionSurface.tsx`: both choice renderers consume the shared answer-option primitive; correctness and persistence remain runtime-owned.
- `src/features/practice/PracticeFeedbackBlock.tsx`: Figma disclosure-row geometry and chevron states for answer details.

No second component library or compatibility styling path was introduced. Existing `AppShellHeader` remains the canonical branded/recovery header for loading, unavailable, and native-context states where the local Figma Screen Header is not the runtime owner.

## Reachable route/state parity matrix

Status meanings are the task-required classifications: `MATCHED` means the current route has a live Figma-backed visual contract and the implemented geometry/tokens are aligned; `DESIGN_MISSING` means no usable authority frame was found for the current reachable state; `CANONICAL_CONFLICT` means the frame exists but its content/command/data contract conflicts with the current product and cannot be copied without inventing behavior.

| Reachable surface/state | Current canonical owner | Figma authority | Status | Notes |
|---|---|---|---|---|
| Home ready, Coding track, no activity | `HomeScreen` / `HomeTab` | `55:445` | `MATCHED` | Shell, title, track context, recommendation card, action geometry, inline 40 px overview mini-bars, plain Current focus/activity rows, colors, and bottom navigation aligned. Existing topic-selection behavior remains canonical; no unowned View activity route was invented. |
| Home track switch | `SelectTrackScreen` | `42:422`, `42:478`, `42:539` | `PARTIAL` | Local selection cards, returning-state Tracks/safety context, and the single footer Continue command follow the Figma track-choice shell. The footer remains because it is the canonical commit command even though the returning Figma frame omits it. Current-head screenshot capture remains pending. |
| Home active session | `HomeScreen` / `HomeTab` | `55:539` | `PARTIAL` | Resume card, overview, focus, activity, and bottom navigation are implemented from real local session data; current-head screenshot comparison remains pending. |
| Home review due | `HomeScreen` / `HomeTab` | `55:632` | `PARTIAL` | Review weak areas, Start review, Manage settings, overview, focus, and activity are implemented without synthetic counts; current-head screenshot comparison remains pending. |
| Practice Hub ready/review available | `PracticeHubScreen` | `55:993` | `CANONICAL_CONFLICT` | Shell, topic context, hero card spacing/type, grouped rows, and navigation are aligned. Figma's mode taxonomy and copy do not match the current canonical modes and commands, so no Figma-only mode or CTA was added. |
| Practice Hub unavailable | `PracticeHubScreen` | `55:1139` | `CANONICAL_CONFLICT` | `55:1139` is the Practice screen with only the Review weak areas row unavailable, not a separate unavailable route. The canonical runtime already exposes that row with an explicit no-due reason; Figma's surrounding mode taxonomy and copy conflict with the current command model. |
| Coding Custom Practice setup/default | `PracticeSetupScreen` | `55:2172` | `CANONICAL_CONFLICT` | Local Screen Header, compact segmented session-size control, compact choice geometry, section rhythm, and footer align. Figma's Focus Areas and `Save settings` command do not exist in the canonical runtime; existing `Start session` behavior is preserved. |
| Coding Custom Practice setup feedback/length selections | `PracticeSetupScreen` | `55:2172` | `MATCHED` | Existing selection state and accessibility semantics now use the shared Figma geometry without changing session configuration behavior. |
| Coding practice active question, single choice unanswered | `PracticeSessionScreen` / `SessionShell` / `PracticeResponseControls` | `68:569`, `750:6400` | `MATCHED` | Session top bar, question card, answer-option spacing/borders/badges, disabled submit, and dark/light tokens verified by current-head iOS capture. |
| Coding practice immediate feedback/details | `PracticeSessionScreen` / `PracticeResponseControls` / `PracticeFeedbackBlock` | `68:603`, `68:637`, `68:719` | `PARTIAL` | Question label/prompt, Figma answer-option badges, result label, bordered reason panel, and details disclosure now use the shared visual contract; fresh state-specific comparison is still pending. |
| Practice pause/end, final item, persistence/recovery states | Session route owners / `PracticeSessionSurface` | `68:804`, `68:844`, `68:1074`, `68:1115`, `68:1156`, `68:1200`, `68:1239` | `PARTIAL` | The canonical three-command exit behavior is preserved while the leave flow now renders as a bottom action sheet with Figma surface, border, radius, spacing, and shadow geometry; the remaining operational states still need fresh comparison. |
| Partial practice summary | `AlgorithmsPracticeSummaryScreen` | `750:6235`, `750:6109` | `PARTIAL` | Summary shell, truthful partial state, active time, completed-item count, flat metric separators, and full-width vertical outcome rows now follow the Figma summary rhythm; current-head dark/light iOS capture completed. |
| Completed practice summary | `AlgorithmsPracticeSummaryScreen` | `750:6235` | `PARTIAL` | Completed summary now has the Figma summary hierarchy, flat metric separators, and full-width vertical score distribution; current-head screenshot comparison remains pending. |
| Bottom navigation | `BottomTabBar` / `AppBottomNavigation` | `140:875` | `MATCHED` | Surface, top rule, active indicator, safe-area padding, label scale, and tab geometry verified in current-head dark/light captures. |
| Shared Button | `Button` | `141:817` | `MATCHED` | Primary, pressed, disabled, secondary, ghost, and destructive contracts consolidated. |
| Shared Screen Header | `ScreenHeader` | `140:881` | `MATCHED` | Back touch target, context, title, description, and large-text multiplier implemented and tested. |
| Shared Answer Option | `AnswerOption` consumed by Practice and Simulation | `248:2394` | `MATCHED` | Default, selected, correct, incorrect, and omitted-compatible letter-badge geometry is one repository-owned primitive; correctness remains runtime-owned. |
| Progress tab | `ProgressTab` | `842:9563`, `842:10822`, `842:10949`, `842:11057`, `842:11192`, `842:11410`, `842:11466`, `842:11568`, `842:11692` | `PARTIAL` | Figma week/focus/attention hierarchy is implemented over real local evidence, including the 30/36 title, 28 px section rhythm, 40 px selector, borderless 14 px attention cards, compact Current focus card with truthful evidence-only percentage, and existing Algorithms roadmap/diagnostics. Goal/cadence and activity sub-surfaces remain canonical conflicts; current-head dark/light iOS capture completed. |
| Settings root | `SettingsTab` | `822:7687` | `CANONICAL_CONFLICT` | The live root keeps canonical Language, Legal, diagnostics, and local-data commands, while Figma also specifies Account & Plan, Sync & backup, Goal & cadence, Practice settings, and Help & information rows without matching runtime owners. No Figma-only route or command is invented. |
| Appearance | `AppearanceSettingsScreen` | `619:5237` | `MATCHED` | The appearance journey passes in both dark and light current-head iOS captures and preserves the canonical Dark/Light/System preference contract. |
| Language, notifications, data, legal, diagnostics | Existing settings route owners | `822:7687` and related Page 1 sections | `DESIGN_MISSING` | Routes are reachable, but no verified Figma-specific frame-to-code parity was completed for each detail surface. |
| Exam, exam review, result, answer review | `ExamScreen`, `ExamReviewScreen`, `ResultScreen`, `AnswerReviewScreen` | No direct current-state authority mapped | `DESIGN_MISSING` | Existing behavior and actions remain unchanged. |
| Algorithms simulation active/navigator/recovery | `AlgorithmsInterviewSimulationScreen` and navigator | `74:539` through `74:1046` | `PARTIAL` | Active unanswered/changed shells now use the Figma question hierarchy, compact top bar, stacked footer, and canonical `Save and continue` behavior; saved-response mode uses the reference saved shell; the navigator now matches the Figma sheet/grid geometry and removes the extra `Finish simulation` control. Save-failure/navigation-recovery notices, three-action recovery footers, and finish/pause confirmation bottom sheets now use the Figma operational geometry while retaining canonical command semantics. Fresh runtime captures remain blocked. |
| Simulation summary | `AlgorithmsInterviewSimulationResultScreen` / `SimulationSessionSurface` | `74:1046`, `750:6109` | `PARTIAL` | Figma summary title/mode hierarchy, flat metric separators, outcome distribution rows, review availability, and real back/review commands are implemented; fresh screenshot comparison remains open. |
| Simulation review | `AlgorithmsInterviewSimulationResultScreen` | `765:6130` and related review frames | `PARTIAL` | The canonical Review Shell now owns the compact back/context header, segmented All/Missed filter, persisted answer-option outcomes, Details disclosure, pager, six-column navigator sheet, and explicit unavailable-result state. Fresh screenshot comparison remains open. |
| Mistakes review and topic roadmap | Existing route owners | No direct current-state authority mapped | `DESIGN_MISSING` | Review now exposes an explicit no-active-track state; no direct Figma authority was found for the full queue/roadmap surfaces. |
| Auth, account, premium, content trust/reporting | No current runtime route | Page 1 sections `57:1952`, `95:1563`, `107:960`, `115:738`; Library account/content nodes | `DESIGN_MISSING` | These are present in Figma but absent from the current launch route graph. Adding them would invent product scope and commands. |

## Verification

- `npm test`: 547 passed, 0 failed.
- `npm run typecheck`: passed.
- `npm run qa:static`: passed, including recovery inventory and both runtime/content boundary checks.
- `npm run validate:runtime-privacy-boundary`: passed.
- `npm run validate:content-boundary`: passed.
- Focused `algorithmsSessionAccessibility.test.ts`: 12 passed, including the shared AnswerOption geometry contract.
- Focused Home/Progress/large-text tests: 20 passed after the Home Overview metric-row cutover.
- Focused Progress projection/large-text tests: 12 passed after the Current focus card cutover.
- Focused track-selection/track-presentation tests: 7 passed after the returning-state shell cutover.
- Focused Practice Hub/session accessibility tests: 14 passed after the Figma spacing/type refinement.
- Focused Practice Setup/session accessibility tests: 44 passed after the compact segmented-control cutover.
- Focused Home/result/simulation parity tests: 26 passed after the result-summary row and title cutover.
- Focused Progress/Home shell/projection tests: 23 passed after the Progress spacing/card cutover.
- `git diff --check`: passed.
- `npx expo export --platform ios --output-dir /tmp/patternly-figma-export-2026-08-22-summary-rows`: passed; the post-summary-cutover source produced an iOS bundle with 1,343 modules.
- `npx expo export --platform ios --output-dir /tmp/patternly-figma-export-2026-08-22-progress-focus`: passed; the latest Home/Progress source produced an iOS bundle with 1,343 modules.
- `npx expo export --platform ios --output-dir /tmp/patternly-figma-export-2026-08-22-home-focus`: passed; the latest Home source produced an iOS bundle with 1,343 modules.
- `npx expo export --platform ios --output-dir /tmp/patternly-figma-export-2026-08-22-track-selection`: passed; the latest track-selection source produced an iOS bundle with 1,343 modules.
- `npx expo export --platform ios --output-dir /tmp/patternly-figma-export-2026-08-22-practice-hub`: passed; the latest Practice Hub source produced an iOS bundle with 1,343 modules.
- `npm run qa:static`: passed after the post-cutover source changes: recovery inventory, typecheck, 544 tests, content boundary, and runtime privacy boundary.
- `npm run qa:static`: passed again on `e4c9e99`: recovery inventory, typecheck, 544 tests, content boundary, and runtime privacy boundary.
- `npm run qa:static`: passed again on `50acdd6`: recovery inventory, typecheck, 544 tests, content boundary, and runtime privacy boundary.
- `npm run qa:static`: passed again on `dd02de1`: recovery inventory, typecheck, 544 tests, content boundary, and runtime privacy boundary.
- `npm run qa:static`: passed again on `8c75d9b`: recovery inventory, typecheck, 544 tests, content boundary, and runtime privacy boundary.
- `npm run qa:static`: passed on `9a6e48f`: recovery inventory, typecheck, 544/544 tests, content boundary, and runtime privacy boundary.
- `npx expo export --platform ios --output-dir /tmp/patternly-figma-export-2026-08-22-practice-setup`: passed; the compact Practice Setup source produced an iOS bundle with 1,343 modules.
- `npm run qa:static`: passed on `736d32a`: recovery inventory, typecheck, 544/544 tests, content boundary, and runtime privacy boundary.
- `npx expo export --platform ios --output-dir /tmp/patternly-figma-export-2026-08-22-summary-rows-v2`: passed; the latest practice and simulation summary source produced an iOS bundle with 1,343 modules.
- `npm run qa:static`: passed on `3e6a282`: recovery inventory, typecheck, 544/544 tests, content boundary, and runtime privacy boundary.
- `npm run qa:static`: passed on `f509e91`: recovery inventory, typecheck, 545/545 tests, content boundary, and runtime privacy boundary.
- `npm run qa:static`: passed on `189ff31`: recovery inventory, typecheck, 545/545 tests, content boundary, and runtime privacy boundary.
- `npm run qa:static`: passed on `d6ee92e`: recovery inventory, typecheck, 545/545 tests, content boundary, and runtime privacy boundary.
- Focused simulation shell/action/navigator tests: 26/26 passed after the active-shell and navigator cutover.
- `npm run qa:static`: passed on `0459be1`: recovery inventory, typecheck, 547/547 tests, content boundary, and runtime privacy boundary.
- `npx expo export --platform ios --output-dir /tmp/patternly-export-review-2026-08-22-v5`: passed after the simulation active-shell and navigator cutover; the iOS bundle contained 1,343 modules.
- `npm run qa:static`: passed on `98e3a66`: recovery inventory, typecheck, 547/547 tests, content boundary, and runtime privacy boundary.
- `npx expo export --platform ios --output-dir /tmp/patternly-export-review-2026-08-22-v6`: passed after the simulation recovery notices and confirmation-sheet cutover; the iOS bundle contained 1,343 modules.
- `npx expo export --platform ios --output-dir /tmp/patternly-export-review-2026-08-22-v2`: passed; the simulation review shell produced an iOS bundle with 1,343 modules.
- `npx expo export --platform ios --output-dir /tmp/patternly-export-review-2026-08-22-v3`: passed after the reduced-motion review-navigator change; the iOS bundle contained 1,343 modules.
- `npx expo export --platform ios --output-dir /tmp/patternly-export-review-2026-08-22-v4`: passed after the Review Shell unavailable-result copy correction; the iOS bundle contained 1,343 modules.
- `npx expo export --platform ios --output-dir /tmp/patternly-figma-export-2026-08-22-progress-v2`: passed; the latest Progress source produced an iOS bundle with 1,343 modules.
- Current-head iOS dev-client evidence was captured from `3e6a282` through the local Metro endpoint on one verified iPhone 16 Pro iOS 18.6 simulator, without invoking the destructive learning-state reset. Dark and light resetless Maestro journeys each completed six screenshots covering Home, Custom Practice setup, an unanswered coding question, a partial summary, Settings root, and Appearance; an additional Progress checkpoint was captured in both themes. Evidence is stored at `/tmp/patternly-figma-screens-2026-08-22-dark-current/` and `/tmp/patternly-figma-screens-2026-08-22-light-current/`.
- The first post-capture attempt used two pre-existing simulator bundles and produced mixed-version screenshots; those `*-v2/` artifacts are not treated as current-head evidence. The verified simulator was explicitly opened with `exp+patternly://expo-development-client/?url=http://127.0.0.1:8090`; the second simulator retained an older cached bundle and was excluded from current-head claims.
- The full RC runner remains intentionally unrun because its bootstrap step calls `audit/reset-learning-state` and would erase local learner records. The reference journey used the pre-`6ee92db` source bundle through an IPv4 Metro listener; it is retained as prior visual evidence, not as post-cutover proof.
- Automated accessibility/source checks: shared back geometry, title/description contracts, answer-option semantics, large-text multiplier, simulation option semantics, navigation ownership, route ownership, and reduced-motion navigator behavior tests pass.

Not verified here: Android, signed/distribution builds, physical-device rendering, full 200% large-text traversal across every route, reduced-motion runtime capture, completed-summary and simulation/review/recovery screenshot comparison, and every Figma operational state.

The fresh simulator pass for the new Review Shell and the current simulation active/navigator/recovery cutover was blocked by CoreSimulatorService becoming unavailable after the export; no destructive state reset or alternate runtime claim was made.

## Deletion and dead-code review

No route was deleted because the current reachability graph does not prove any existing route obsolete. The superseded visual geometry was removed in place from the canonical primitives and route owners: old button sizing/pressed behavior, card radii, generic screen padding/footer geometry, navigation rule/padding, session top-bar height, answer-option circles, and the ready-state Practice Hub/AppShell header composition. No duplicate design-system path, hidden fallback, placeholder feature, or Figma-only command was left behind.

## Remaining work

The remaining gaps are explicit and blocking: extend the current-head dark/light screenshot matrix to immediate feedback, completed summaries, simulation, review, and recovery states; implement and compare the remaining Figma simulation operational states (`74:726`, `74:834`, `74:879`, `74:968`, `74:992`, `74:1046`); map or approve Figma frames for the current routes; decide whether the Figma-only account/auth/premium/content-trust surfaces are launch scope; and provide canonical data/commands for conflicting Practice Hub, Practice Setup focus areas, Progress goal/cadence, and account/settings designs. Until then the product cannot be reported as 99% design-complete.
