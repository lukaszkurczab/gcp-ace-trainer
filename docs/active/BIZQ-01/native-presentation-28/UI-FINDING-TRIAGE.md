# Native presentation 28 — UI finding triage

## Outcome

- Triage status: complete for the supplied large-text authored-diagnostic screenshots.
- UI result: one confirmed clipping finding; package 28 cannot claim its large-text diagnostic leg passes on this evidence.
- Scope: the selected wrong-option diagnostic and adjacent `Details` text for one GCP Certification Practice review item.
- Surface: Patternly iOS app.
- Evidence class: `LIVE_UI` screenshots, independently inspected; current source and canonical content also inspected.
- Scenario: iPhone 17 simulator `7F315654-3175-4F3C-BB24-B0263F59360C`, English, light and dark, supported capped accessibility-extra-extra-extra-large text. Capture commit recorded in the screenshot manifest: `4dc94d1315d3197651c121b833266cc686e326bb`.
- Date: 2026-10-05.

## User goal and contract

The learner is reviewing a saved incorrect response and needs to read the authored explanation of why the selected choice fails. Q12's frozen native-presentation brief calls for a readable authored diagnostic and complete `Details` in both themes at supported large text. The source contract requires complete authored `Details` and says dynamic text must not clip essential content (`docs/05-design-system.md`, “Accessibility baseline,” line 474; “Feedback,” lines 337–362). The training interaction contract preserves authored `wrong_option` messages by stable option ID (`docs/17-training-runtime-and-interaction-spec.md`, §8, lines 399–416).

## Evidence and coverage

| State | Theme / size | Evidence | Result |
|---|---|---|---|
| Saved wrong response, question 1 of 10, Details expanded | Light, supported capped accessibility-extra-extra-extra-large | `screens/native28-light-large-authored-diagnostic.png` | The D diagnostic's last line is clipped horizontally after “organization-wide attachme…”. |
| Same saved wrong response and item | Dark, same supported capped size | `screens/native28-dark-large-authored-diagnostic.png` | Same clipping at the same text segment. |
| Restored same 9/10 result screen, outcome distribution | Dark, supported capped size | `screens/final-restored-dark-large-result.png` | Inspected the two right-side zero counts; both glyphs and card margins are visible. No separate confirmed clipping finding from this screenshot. |

The sibling `boundaryOrTradeoff` detail later renders “organization-wide attachment scope” on two complete lines, so the key boundary is repeated elsewhere in `Details`. That does not make the option-specific diagnostic itself readable: the message row remains cut off in both captures. The screenshots show the actual rendered state, but do not identify the native text node's layout frame or accessibility behavior. I did not operate the simulator or alter source.

## Finding

### P2 — `Q12-AUTHORED-DIAGNOSTIC-CLIPPED` — Long wrong-option message is cut off at supported large text

- Type: confirmed visual problem.
- Category: accessibility / readability.
- Location: Certification Exam Review's shared `PracticeFeedbackBlock`, saved wrong-answer item, English, both light and dark themes at the supported capped large-text setting.
- Element and evidence: the selected D message is “This option selects at the billing account, but the decisive requirement is organization-wide attachment scope.” In both supplied captures, its last displayed line ends visibly at “organization-wide attachme…” at the right edge; the remaining letters and final punctuation are not shown. Light screenshot SHA-256: `9f08e2e84b27e7283b93c8e61992c00e1119f2b2d725ce73f2fdbd47e7bdc4db`. Dark screenshot SHA-256: `974d8fb395e3af79a3ac9b6fb73190ba490201a906e5d839f158c1af93f6706e`.
- Rule and source: the Q12 brief requires readable authored diagnostics and complete `Details`; `docs/05-design-system.md` requires dynamic text without clipped essential content. The authored message belongs to question `gcp-ace-gcpace-n01-b03-001`, wrong option ID `D`, in `src/content/generated/canonical-content/google-cloud-associate-cloud-engineer.json`.
- User impact and confidence: the learner cannot visually read the complete explanation for the selected wrong choice at this supported text size. The adjacent detail repeats the boundary, which partially mitigates comprehension loss but does not restore the diagnostic line. Confidence: high; the same truncation is visible in two themes.
- Priority: P2, because one educational diagnostic is incomplete at an in-scope accessibility text size, while the next detail line still exposes the key boundary and the learner can continue navigating.
- Recommendation: fix the rendered text layout so the full authored message wraps inside the available content width at this supported size. Preserve the canonical message text and its stable-ID mapping; do not shorten or replace the explanation to fit.
- Preserve: authored `wrong_option` text/order, complete `Details`, disclosure timing, scroll behavior, color theme, and Previous/Next/Back actions.
- Acceptance and retest: repeat this same saved review item in light and dark at the same supported capped size. The full D message, including “attachment scope.”, must be visible across wrapped lines without horizontal overflow; adjacent `Details` and navigation remain reachable. The visual retest is the acceptance check.
- Confirmed code/component: `src/features/exam/ExamReviewScreen.tsx:95` passes projected messages to `PracticeFeedbackBlock`; `src/features/practice/PracticeFeedbackBlock.tsx:33` renders each authored message as a React Native `Text` using `styles.detailText` and `maxFontSizeMultiplier={2}`; line 41 defines `detailText` from `typography.body`. The same component uses that style for ordinary detail lines. There is no explicit `numberOfLines` or `ellipsizeMode` on the message node in this source, so a source-level truncation rule is not established.

## Cause and limits

The clipping is confirmed; its cause is not. In the current source, message and detail strings use the same `Text`, style, and font cap, and the neighboring detail wraps correctly. That rules out an intentional message-only line clamp in this component but does not establish whether the native text frame is wider than its parent, whether the final glyphs are clipped by a parent, or whether a runtime measurement difference is involved. A native text-frame/line-layout capture is the smallest proposed debugging probe to distinguish those causes; it is not an added acceptance gate. If hierarchy data lacks per-line geometry, a narrowly scoped `onTextLayout` diagnostic in a test-only reproduction could supply that cause evidence. The fix can be accepted by the existing Q12 visual retest without requiring a specific debugging tool.

This is one-item UI triage, not a full Q12 acceptance. It does not assess VoiceOver, other content variants, every screen size, long repaired OOD options, native partial answers, Premium, or the whole BIZQ-01 objective. Root's final light/dark flows and restore evidence are separate from this finding; screenshot presence alone is not a suite verdict. I also inspected `final-restored-dark-large-result.png`: both zero counts in the right-hand outcome cards are fully visible in that capture, so I do not report a second count-display defect.

## Bindings

- Q12 brief: `docs/active/BIZQ-01/native-presentation-28/BRIEFING.md`, SHA-256 `238e0d78779b2974955ff4dda8bafe52ec10de220b924c953a92c7f5d95a8203`.
- Screenshot manifest: `docs/active/BIZQ-01/native-presentation-28/SCREENSHOT-MANIFEST.json`, SHA-256 `dff4bf4bcd45d4f0c2f200003d45ff7f4b39e577a99c2d24f95a5049f291aa97`.
- Source: `src/features/practice/PracticeFeedbackBlock.tsx`, SHA-256 `a0cd2b14e08d63260808727ac2fc775588f52b9e7101ce41e78cc604febbede5`; `src/features/exam/ExamReviewScreen.tsx`, SHA-256 `c3796b5f69660ff1b2c5bd60ed8bf557bdeb67f08dd0cde55ab2eee58a1b8458`.
- Current generated content source: `src/content/generated/canonical-content/google-cloud-associate-cloud-engineer.json`, SHA-256 `eea751e977cbfb468577ff4ea47702b914e1de6ad7fa06519a4e919889f0a6f9`.
