# Patternly Figma parity and design-system cutover

Date: 2026-08-21  
Repository: `Patternly`  
Starting commit: `4adf8012224ea7d187da9b30fd081076ce6386d6`  
Branch at start: `main`, tracking `origin/main`

## Outcome

This change consolidates the reachable launch surfaces onto the repository-owned visual system and aligns the implemented slice with the live Figma authority. It does not invent routes, metrics, commands, or data for Figma frames that the current product does not expose.

The completed slice covers shared tokens and primitives, Home, Practice Hub, compact Coding Practice setup, the active practice question surface, answer options, session shell, partial practice summary, and bottom navigation. The full Figma file is broader than the current launch plan and contains several screens that have no canonical runtime owner yet.

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
| Home track switch | `SelectTrackScreen` | `42:422`, `42:478`, `42:539` | `DESIGN_MISSING` | Runtime state is reachable, but a complete current-SHA visual comparison was not established for the selection and switch-pending states. |
| Practice Hub ready/review available | `PracticeHubScreen` | `55:993` | `CANONICAL_CONFLICT` | Shell, topic context, hero card, grouped rows, and navigation were aligned. Figma's mode taxonomy and copy do not match the current canonical modes and commands, so no Figma-only mode or CTA was added. |
| Practice Hub unavailable | `PracticeHubScreen` | `55:1139` | `DESIGN_MISSING` | Runtime has an explicit unavailable state; the current Figma frame was not translated into a verified current-SHA implementation. |
| Coding Custom Practice setup/default | `PracticeSetupScreen` | `55:2172` | `CANONICAL_CONFLICT` | Local Screen Header, compact choice geometry, section rhythm, and footer align. Figma's Focus Areas and `Save settings` command do not exist in the canonical runtime; existing `Start session` behavior is preserved. |
| Coding Custom Practice setup feedback/length selections | `PracticeSetupScreen` | `55:2172` | `MATCHED` | Existing selection state and accessibility semantics now use the shared Figma geometry without changing session configuration behavior. |
| Coding practice active question, single choice unanswered | `PracticeSessionScreen` / `SessionShell` / `PracticeResponseControls` | `68:569`, `750:6400` | `MATCHED` | Session top bar, question card, answer-option spacing/borders/badges, disabled submit, and dark/light tokens verified by iOS capture. |
| Coding practice immediate feedback/details | `PracticeSessionScreen` / `PracticeResponseControls` | `68:603`, `68:637`, `68:719` | `DESIGN_MISSING` | Runtime state exists, but a fresh state-specific visual comparison was not completed in this slice. |
| Practice pause/end, final item, persistence/recovery states | Session route owners | `68:804`, `68:844`, `68:1074`, `68:1115`, `68:1156`, `68:1200`, `68:1239` | `DESIGN_MISSING` | Canonical behavior exists and is covered by tests, but no current-SHA Figma parity implementation was established for every operational state. |
| Partial practice summary | `AlgorithmsPracticeSummaryScreen` | `750:6235`, `750:6109` | `CANONICAL_CONFLICT` | Result card surface, title scale, radius, and action footer were aligned. Review-answer semantics and Figma summary data do not map to the current partial-summary contract, so no fake review CTA or score was added. |
| Completed practice summary | `AlgorithmsPracticeSummaryScreen` | `750:6235` | `DESIGN_MISSING` | Runtime route exists; the completed-state visual parity pass remains open. |
| Bottom navigation | `BottomTabBar` / `AppBottomNavigation` | `140:875` | `MATCHED` | Surface, top rule, active indicator, safe-area padding, label scale, and tab geometry verified in dark/light captures. |
| Shared Button | `Button` | `141:817` | `MATCHED` | Primary, pressed, disabled, secondary, ghost, and destructive contracts consolidated. |
| Shared Screen Header | `ScreenHeader` | `140:881` | `MATCHED` | Back touch target, context, title, description, and large-text multiplier implemented and tested. |
| Shared Answer Option | `PracticeResponseControls` | `248:2394` | `MATCHED` | Default, selected, correct, incorrect, and omitted-compatible letter-badge geometry implemented; correctness remains runtime-owned. |
| Progress tab | `ProgressTab` | `842:9563`, `842:10822`, `842:10949`, `842:11057`, `842:11192`, `842:11410`, `842:11466`, `842:11568`, `842:11692` | `CANONICAL_CONFLICT` | Figma describes week/focus/evidence/goal/activity views that do not match the current persisted progress model. No unsupported goal or evidence commands were invented. |
| Settings root and appearance | `SettingsTab` / `AppearanceSettingsScreen` | `822:7687`, `619:5237` | `MATCHED` | Root and appearance journeys pass in both dark and light iOS captures; current settings commands remain canonical. |
| Language, notifications, data, legal, diagnostics | Existing settings route owners | `822:7687` and related Page 1 sections | `DESIGN_MISSING` | Routes are reachable, but no verified Figma-specific frame-to-code parity was completed for each detail surface. |
| Exam, exam review, result, answer review | `ExamScreen`, `ExamReviewScreen`, `ResultScreen`, `AnswerReviewScreen` | No direct current-state authority mapped | `DESIGN_MISSING` | Existing behavior and actions remain unchanged. |
| Algorithms simulation active/navigator/recovery | `AlgorithmsInterviewSimulationScreen` and navigator | `74:539` through `74:1046` | `DESIGN_MISSING` | Figma frames exist, but the simulation-specific parity implementation and fresh state captures remain open. |
| Simulation review | `AlgorithmsInterviewSimulationResultScreen` | `765:6130` and related review frames | `DESIGN_MISSING` | Existing runtime route remains canonical; no unsupported review state was created. |
| Mistakes review and topic roadmap | Existing route owners | No direct current-state authority mapped | `DESIGN_MISSING` | Behavior is outside the verified Figma cutover slice. |
| Auth, account, premium, content trust/reporting | No current runtime route | Page 1 sections `57:1952`, `95:1563`, `107:960`, `115:738`; Library account/content nodes | `DESIGN_MISSING` | These are present in Figma but absent from the current launch route graph. Adding them would invent product scope and commands. |

## Verification

- `npm test`: 544 passed, 0 failed.
- `npm run typecheck`: passed.
- `npm run validate:runtime-privacy-boundary`: passed.
- `npm run validate:content-boundary`: passed.
- `git diff --check`: passed.
- iOS Release simulator build/install: 0 errors, 2 existing Xcode warnings.
- Maestro visual-shell flow: passed in dark and light on `Maestro_IOS_iPhone-16-Pro_18`, iOS 18.6. Captured Home, compact setup, active session, partial summary, settings root, and appearance in each theme.
- Local capture artifacts: `artifacts/maestro-screen-capture/current-head/2026-08-21-figma-cutover-dark/` and `artifacts/maestro-screen-capture/current-head/2026-08-21-figma-cutover-light/`. These are ignored evidence artifacts and are not committed.
- Automated accessibility/source checks: shared back geometry, title/description contracts, answer-option semantics, large-text multiplier on the new Screen Header, and route ownership tests pass.

Not verified here: Android, signed/distribution builds, physical-device rendering, full 200% large-text traversal across every route, reduced-motion runtime capture, and every Figma operational/recovery state.

## Deletion and dead-code review

No route was deleted because the current reachability graph does not prove any existing route obsolete. The superseded visual geometry was removed in place from the canonical primitives and route owners: old button sizing/pressed behavior, card radii, generic screen padding/footer geometry, navigation rule/padding, session top-bar height, answer-option circles, and the ready-state Practice Hub/AppShell header composition. No duplicate design-system path, hidden fallback, placeholder feature, or Figma-only command was left behind.

## Remaining work

The remaining gaps are product/design-contract gaps, not silent UI fallbacks: map or approve Figma frames for the current routes, decide whether the Figma-only account/progress/premium/content-trust surfaces are launch scope, and provide canonical data/commands for the conflicting Practice Hub, Practice Setup, Home overview, and Summary designs. Only after those decisions should the `DESIGN_MISSING` and `CANONICAL_CONFLICT` rows be promoted to implementation work.
