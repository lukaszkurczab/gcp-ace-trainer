# ODK-126 — Report an issue affordance

Date: 2026-09-21  
Status: `VERIFIED_CLOSED`

## Outcome

`Report an issue` is now an explicit secondary action with a bounded surface, flag icon and label. It uses the canonical design-system `Button`, retains a minimum 48 × 48 pt target, and inherits the shared pressed, disabled and loading states plus native accessibility state.

The existing `open` handler, report form, privacy copy, payload construction, transport and outbox are unchanged. Activating the trigger only opens the existing form; it does not submit a report.

## Exact runtime evidence

- Track: `claude-certified-architect-professional-certification`
- Mode: `certification-focus-practice`
- Item: `CCARP-D01-O01-boundary`
- Viewport: iPhone 17 simulator, 402 × 874 pt (943 × 2048 px capture)
- Trigger accessibility node: `Report an issue`, enabled, bounds `[37,614][217,666]`, no accessible icon child

Evidence:

- [Light](evidence/ODK-126/report-affordance-light.png)
- [Dark](evidence/ODK-126/report-affordance-dark.png)
- [Maximum Dynamic Type](evidence/ODK-126/report-affordance-xxxlarge.png)
- [Increase Contrast](evidence/ODK-126/report-affordance-increased-contrast.png)
- [Form open without submit](evidence/ODK-126/report-form-open-no-submit.png)
- [Accessibility hierarchy](evidence/ODK-126/accessibility-hierarchy.json)
- [Repeatable runtime flow](evidence/ODK-126/runtime-flow.yaml)
- [Maximum-text reachability flow](evidence/ODK-126/large-text-scroll.yaml)

The runtime flow opens Details, finds the exact trigger, activates it once, verifies the existing form and `Send report`, verifies that no accepted state is present, and closes the form without submission.

## Implementation

- `Button` accepts an optional typed `leadingIcon` and renders the existing accessibility-hidden `Icon` component.
- Loading replaces the leading icon with the existing spinner, avoiding competing progress and action glyphs.
- Icon and spinner color use the same resolved content color as the label for every variant and disabled state.
- `ContentReportSheet` uses `variant="secondary"` with `leadingIcon="flag"` and removes the local zero-horizontal-padding override.
- The report surface retains the same `onPress={open}` handler and all report-domain behavior.

## Verification

| Gate | Result |
| --- | --- |
| Independent approach validation | **APPROVE**, minimum 0.86 |
| Independent implementation QA | **PASS**, no P0–P2; consistency 0.98, simplicity 0.95, risk 0.92, maintainability 0.93 |
| Focused Button/report/privacy/outbox tests | **39/39 PASS** |
| Final focused regression after color alignment | **34/34 PASS** |
| App typecheck | **PASS** |
| Runtime privacy boundary | **PASS** |
| Content boundary | **PASS** |
| `git diff --check` | **PASS** |
| Simulator Light/Dark/Maximum Text/Increase Contrast | **PASS** |
| Single activation opens form without submit | **PASS** |
| Accessibility tree | **PASS**, one label, no duplicated icon node, 180 × 52 pt bounds |

The repository-wide suite was not used as evidence because the working tree intentionally contains the sequential bootstrap and ODK-124–126 release-candidate changes. The focused tests cover the changed component, report surface, privacy boundary and report outbox.

## Removed/replaced paths

- Replaced the ghost/text-like trigger and local zero-padding override with the canonical secondary Button surface.
- Added no duplicate report button, form, transport or state path.
- Removed no payload, privacy, submission or outbox behavior.

## Remaining limitations

- Pressed, disabled and loading are shared `Button` contract states verified statically; this trigger has no product state that truthfully makes it disabled or loading, so no fake local state was introduced for screenshots.
- The maximum-text screenshot exposes pre-existing horizontal clipping in surrounding long Details copy. The report action itself remains fully visible and reachable; the unrelated copy issue is outside ODK-126.
