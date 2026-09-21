# ODK-124 — Claude question readability

Date: 2026-09-21  
Status: `VERIFIED_CLOSED`

## Outcome

Claude Certified Architect Professional questions now use a track-owned structured presentation without changing question content or the shared default renderer. The prompt keeps one authored text block, while declared `constraints[]` render as a separately headed, bordered semantic section. The variant is selected only from the canonical Claude track identity.

No prompt parser, content rewrite, schema migration, code-block renderer or application-wide restyle was introduced. Inventory of the accepted 300-question Claude artifact found 38 prompts with authored newlines, no prompt bullet markers and no code fences. Six prompts exceed 400 characters. The existing schema therefore proves only `prompt + constraints[]`; unsupported hypothetical structures were not inferred from plain text.

## Exact runtime evidence

- Track: `claude-certified-architect-professional-certification`
- Item: `CCARP-D01-O01-boundary`
- Runtime selector: `patternly:session:question:CCARP-D01-O01-boundary`
- Mode: `certification-focus-practice`
- Viewport: iPhone 17 simulator, 402 × 874 pt (943 × 2048 px capture)
- Prompt and both constraints remained byte-for-byte authored strings.

Evidence:

- [before](evidence/ODK-124/claude-question-before.png)
- [Light](evidence/ODK-124/claude-question-light.png)
- [Dark](evidence/ODK-124/claude-question-dark.png)
- [Dynamic Type — prompt](evidence/ODK-124/claude-question-dynamic-type.png)
- [Dynamic Type — scrolled answers](evidence/ODK-124/claude-question-dynamic-type-scrolled.png)

At standard text size the prompt, full constraint section and two answer surfaces are visible before scrolling. At accessibility-large text the content remains untruncated and scrollable; the paired captures prove access from the prompt through answer options while the action footer remains fixed. Light and Dark use the same item and exact session identity.

## Implementation

- `PracticeQuestionCard` exposes explicit `default` and `structuredCertificationPrompt` variants.
- `PracticeSessionSurface` selects the structured variant only for the canonical Claude track constant.
- The prompt uses 20/28 typography with stable wrapping; other tracks retain the previous 22/28 default.
- `constraints[]` remain separate authored strings under localized `Key constraints` / `Kluczowe ograniczenia` heading semantics and a stable test selector.
- Existing palette, typography, radius and spacing tokens own both themes.

## Runtime blocker found and corrected

The first device retest exposed a real local-reset race rather than a presentation defect. Journaled reset cleared the persisted foreground timer, but an in-memory timer interval could recreate the old timer after clear. A new session was then durably created and failed timer initialization with `LOCAL_OPERATION_FAILED`.

The correction adds one canonical, single-flight reset barrier. It closes new timer commands by generation, stops scheduling, waits for already-started root operations, holds quiescing through the journaled reset, clears session-owned runtime maps on success or failure, and covers the development recovery fallback. A fresh simulator then started the exact Claude question; a process restart plus the active-session conflict path resumed the same item in Dark Mode.

## Verification

| Gate | Result |
| --- | --- |
| Independent approach validation | **APPROVE**, minimum 0.83 after concurrency redesign |
| Independent implementation QA | **PASS**, no P0/P1; consistency 0.93, simplicity 0.86, risk 0.84, maintainability 0.85 |
| Question presentation + locale tests | **8/8 PASS** |
| Timer/reset/account/development focused tests | **46/46 PASS** |
| App typecheck | **PASS** |
| Runtime privacy boundary | **PASS** |
| Content boundary | **PASS** |
| `git diff --check` | **PASS** |
| Simulator Light/Dark/Dynamic Type | **PASS**, exact item and viewport above |

The repository-wide suite was not used as evidence because the working tree intentionally contains the sequential bootstrap and ODK-124 release-candidate changes; release-manifest cleanliness checks are expected to remain red until the candidate is committed/frozen.

## Removed/replaced paths

- Replaced Claude's use of the undifferentiated default prompt presentation with one explicit track-owned variant.
- Replaced non-atomic in-memory/durable local reset ordering with one reset barrier.
- Removed the development reset fallback's direct bypass of that barrier.
- Removed no question, answer, scoring, schema or other-track path.

## Remaining limitations

- A separate screenshot of one of the six prompts over 400 characters was not deterministically reachable without mutating session selection. The accepted item exercises the confirmed prompt plus two-constraint structure, and the artifact inventory preserves the exact long-item IDs for later deterministic harness coverage.
- The Claude artifact contains no declared code blocks or prompt bullet lists, so ODK-124 makes no unsupported claim about rendering those formats.
- Reset-barrier callback re-entry is not a supported production path and no installed callback re-enters it; a synthetic self-await re-entry test remains a nonblocking P2 contract-hardening opportunity.
