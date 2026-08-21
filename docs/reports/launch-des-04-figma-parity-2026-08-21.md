# Patternly Figma parity and design-system cutover

Date: 2026-08-22
Repository: `Patternly`  
Starting commit: `b16c20b456d62d42b6f1a75d62e69bae18b29755`
Branch at start: `main`, tracking `origin/main`
Implementation commits: `4b91494`, `4391884`

## Outcome

This pass extends the repository-owned visual system across the reachable Home, track selection, Progress, Settings, practice summary, simulation runner, simulation navigator, simulation summary/review, answer review, and review-empty states. It does not invent routes, metrics, commands, persistence, or account behavior for Figma frames that the current product does not expose.

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
- `src/features/practice/PracticeResponseControls.tsx`: Figma answer-option surfaces, borders, letter badges, and correctness states.

No second component library or compatibility styling path was introduced. Existing `AppShellHeader` remains the canonical branded/recovery header for loading, unavailable, and native-context states where the local Figma Screen Header is not the runtime owner.

## Reachable route/state parity matrix

Status meanings are the task-required classifications: `MATCHED` means the current route has a live Figma-backed visual contract and the implemented geometry/tokens are aligned; `DESIGN_MISSING` means no usable authority frame was found for the current reachable state; `CANONICAL_CONFLICT` means the frame exists but its content/command/data contract conflicts with the current product and cannot be copied without inventing behavior.

| Reachable surface/state | Current canonical owner | Figma authority | Status | Notes |
|---|---|---|---|---|
| Home ready, Coding track, no activity | `HomeScreen` / `HomeTab` | `55:445` | `MATCHED` | Shell, title, track context, recommendation card, action geometry, overview rows, colors, and bottom navigation aligned. Current recommendation copy remains data-driven. |
| Home track switch | `SelectTrackScreen` | `42:422`, `42:478`, `42:539` | `PARTIAL` | The local selection plus single footer Continue command now follows the Figma track-choice shell. Current-head screenshot capture remains pending; the safe capture path encountered the installed dev-client's cached pre-cutover route. |
| Home active session | `HomeScreen` / `HomeTab` | `55:539` | `PARTIAL` | Resume card, overview, focus, activity, and bottom navigation are implemented from real local session data; current-head screenshot comparison remains pending. |
| Home review due | `HomeScreen` / `HomeTab` | `55:632` | `PARTIAL` | Review weak areas, Start review, Manage settings, overview, focus, and activity are implemented without synthetic counts; current-head screenshot comparison remains pending. |
| Practice Hub ready/review available | `PracticeHubScreen` | `55:993` | `CANONICAL_CONFLICT` | Shell, topic context, hero card, grouped rows, and navigation were aligned. Figma's mode taxonomy and copy do not match the current canonical modes and commands, so no Figma-only mode or CTA was added. |
| Practice Hub unavailable | `PracticeHubScreen` | `55:1139` | `DESIGN_MISSING` | Runtime has an explicit unavailable state; the current Figma frame was not translated into a verified current-SHA implementation. |
| Coding Custom Practice setup/default | `PracticeSetupScreen` | `55:2172` | `CANONICAL_CONFLICT` | Local Screen Header, compact choice geometry, section rhythm, and footer align. Figma's Focus Areas and `Save settings` command do not exist in the canonical runtime; existing `Start session` behavior is preserved. |
| Coding Custom Practice setup feedback/length selections | `PracticeSetupScreen` | `55:2172` | `MATCHED` | Existing selection state and accessibility semantics now use the shared Figma geometry without changing session configuration behavior. |
| Coding practice active question, single choice unanswered | `PracticeSessionScreen` / `SessionShell` / `PracticeResponseControls` | `68:569`, `750:6400` | `MATCHED` | Session top bar, question card, answer-option spacing/borders/badges, disabled submit, and dark/light tokens verified by iOS capture. |
| Coding practice immediate feedback/details | `PracticeSessionScreen` / `PracticeResponseControls` / `PracticeFeedbackBlock` | `68:603`, `68:637`, `68:719` | `PARTIAL` | Question label/prompt, Figma answer-option badges, result label, bordered reason panel, and details disclosure now use the shared visual contract; fresh state-specific comparison is still pending. |
| Practice pause/end, final item, persistence/recovery states | Session route owners / `PracticeSessionSurface` | `68:804`, `68:844`, `68:1074`, `68:1115`, `68:1156`, `68:1200`, `68:1239` | `PARTIAL` | The canonical three-command exit behavior is preserved while the leave flow now renders as a bottom action sheet with Figma surface, border, radius, spacing, and shadow geometry; the remaining operational states still need fresh comparison. |
| Partial practice summary | `AlgorithmsPracticeSummaryScreen` | `750:6235`, `750:6109` | `PARTIAL` | Summary shell, truthful partial state, active time, completed-item count, outcome section, and real feedback disclosure are implemented. Current-head screenshot comparison remains pending. |
| Completed practice summary | `AlgorithmsPracticeSummaryScreen` | `750:6235` | `PARTIAL` | Completed summary now has the Figma summary hierarchy and real score distribution; current-head screenshot comparison remains pending. |
| Bottom navigation | `BottomTabBar` / `AppBottomNavigation` | `140:875` | `MATCHED` | Surface, top rule, active indicator, safe-area padding, label scale, and tab geometry verified in dark/light captures. |
| Shared Button | `Button` | `141:817` | `MATCHED` | Primary, pressed, disabled, secondary, ghost, and destructive contracts consolidated. |
| Shared Screen Header | `ScreenHeader` | `140:881` | `MATCHED` | Back touch target, context, title, description, and large-text multiplier implemented and tested. |
| Shared Answer Option | `PracticeResponseControls` | `248:2394` | `MATCHED` | Default, selected, correct, incorrect, and omitted-compatible letter-badge geometry implemented; correctness remains runtime-owned. |
| Progress tab | `ProgressTab` | `842:9563`, `842:10822`, `842:10949`, `842:11057`, `842:11192`, `842:11410`, `842:11466`, `842:11568`, `842:11692` | `PARTIAL` | Figma week/focus/attention hierarchy is implemented over real local evidence, including explicit empty performance evidence and the existing Algorithms roadmap/diagnostics. Goal/cadence and activity sub-surfaces remain canonical conflicts; current-head screenshot comparison remains pending. |
| Settings root and appearance | `SettingsTab` / `AppearanceSettingsScreen` | `822:7687`, `619:5237` | `MATCHED` | Root and appearance journeys pass in both dark and light iOS captures; current settings commands remain canonical. |
| Language, notifications, data, legal, diagnostics | Existing settings route owners | `822:7687` and related Page 1 sections | `DESIGN_MISSING` | Routes are reachable, but no verified Figma-specific frame-to-code parity was completed for each detail surface. |
| Exam, exam review, result, answer review | `ExamScreen`, `ExamReviewScreen`, `ResultScreen`, `AnswerReviewScreen` | No direct current-state authority mapped | `DESIGN_MISSING` | Existing behavior and actions remain unchanged. |
| Algorithms simulation active/navigator/recovery | `AlgorithmsInterviewSimulationScreen` and navigator | `74:539` through `74:1046` | `PARTIAL` | Choice rows, navigator sheet, Finish simulation action, and existing durable recovery states use the Figma geometry where the canonical projection exposes it; fresh state captures remain open. |
| Simulation summary | `AlgorithmsInterviewSimulationResultScreen` / `SimulationSessionSurface` | `74:1046`, `750:6109` | `PARTIAL` | Summary shell, active time, outcome distribution, review availability, and real back/review commands are implemented; fresh screenshot comparison remains open. |
| Simulation review | `AlgorithmsInterviewSimulationResultScreen` | `765:6130` and related review frames | `PARTIAL` | All/Missed filters, score, current item, feedback blocks, pager, and back-to-summary are implemented over the verified result; fresh screenshot comparison remains open. |
| Mistakes review and topic roadmap | Existing route owners | No direct current-state authority mapped | `DESIGN_MISSING` | Review now exposes an explicit no-active-track state; no direct Figma authority was found for the full queue/roadmap surfaces. |
| Auth, account, premium, content trust/reporting | No current runtime route | Page 1 sections `57:1952`, `95:1563`, `107:960`, `115:738`; Library account/content nodes | `DESIGN_MISSING` | These are present in Figma but absent from the current launch route graph. Adding them would invent product scope and commands. |

## Verification

- `npm test`: 544 passed, 0 failed.
- `npm run typecheck`: passed.
- `npm run qa:static`: passed, including recovery inventory and both runtime/content boundary checks.
- `npm run validate:runtime-privacy-boundary`: passed.
- `npm run validate:content-boundary`: passed.
- `git diff --check`: passed.
- `npx expo export --platform ios --output-dir /tmp/patternly-figma-export-2026-08-22-final`: passed; current source produced an iOS bundle with 1,342 modules.
- A fresh current-head iOS dev-client was built and installed on a second iPhone 16 Pro simulator without invoking the destructive learning-state reset. Dark and light Maestro journeys each completed five screenshots covering Home, Practice Hub/setup, an unanswered coding question, the pause/end sheet, and a partial summary. Evidence is stored at `/tmp/patternly-figma-screens-2026-08-22-dark-fresh/` and `/tmp/patternly-figma-screens-2026-08-22-light-fresh/`.
- The full RC runner remains intentionally unrun because its bootstrap step calls `audit/reset-learning-state` and would erase local learner records. The fresh dev-client journey used the current source bundle through an IPv4 Metro listener and is the current-head visual evidence for this pass.
- Automated accessibility/source checks: shared back geometry, title/description contracts, answer-option semantics, large-text multiplier, simulation option semantics, navigation ownership, and route ownership tests pass.

Not verified here: Android, signed/distribution builds, physical-device rendering, full 200% large-text traversal across every route, reduced-motion runtime capture, and every Figma operational/recovery state.

## Deletion and dead-code review

No route was deleted because the current reachability graph does not prove any existing route obsolete. The superseded visual geometry was removed in place from the canonical primitives and route owners: old button sizing/pressed behavior, card radii, generic screen padding/footer geometry, navigation rule/padding, session top-bar height, answer-option circles, and the ready-state Practice Hub/AppShell header composition. No duplicate design-system path, hidden fallback, placeholder feature, or Figma-only command was left behind.

## Remaining work

The remaining gaps are explicit and blocking: extend the current-head dark/light screenshot matrix to immediate feedback, completed summaries, simulation, review, and recovery states; map or approve Figma frames for the current routes; decide whether the Figma-only account/auth/premium/content-trust surfaces are launch scope; and provide canonical data/commands for conflicting Practice Hub, Practice Setup focus areas, Progress goal/cadence, and account/settings designs. Until then the product cannot be reported as 99% design-complete.
