# Patternly Core UX/UI Audit Checklist

Use this checklist for the first configured UX/UI audit of Patternly's core mobile flow. Treat it as project-specific product criteria, not a universal audit rubric.

## Product Fit

- The screen supports the intended user task in the product loop: track, session mode, training item, attempt, feedback, review, progress.
- The screen has one dominant user goal and one visually dominant next action.
- The UI feels like a calm technical training workspace, not a game, official Google product, LeetCode clone, course marketplace, or dense admin dashboard.
- Track context is visible where useful, but the screen does not visually become a separate app per track.

## Visual System

- Dark-first Focus Lab direction is followed: calm, technical, high-contrast, low-noise, and not decorative.
- Visual treatment is consistent with shared components: cards, badges, metric cards, list rows, progress bars, section headers, and bottom tabs.
- Primary, success, warning, error, info, and neutral colors communicate state or hierarchy rather than decoration.
- CTA hierarchy is clear: primary actions are dominant, secondary actions are available without competing, destructive actions are explicit.
- Typography follows the repo scale: screen titles, section headers, body copy, metadata, badges, and diagnostics have clear hierarchy.
- Spacing and grouping make scan order obvious, especially on session, feedback, summary, progress, and settings screens.

## Navigation

- Bottom navigation remains visible and consistent on shell screens.
- Practice and session screens preserve clear exit/back behavior.
- Returning from completion keeps the user oriented and does not strand them in a hidden state.
- Selected tab and selected control states are visually and semantically clear.

## States

- Empty states are honest, specific, and actionable where action is available.
- Loading states are explicit where data loading can be perceived by the user; absence of loading UI should be recorded as a gap when it creates ambiguity.
- Error and degraded states are explicit, observable, and product-safe. They must not be hidden by fallback content.
- Selected states for session length, feedback mode, answer options, and tabs are visibly distinct without relying only on color.
- Completed states show what happened, what it means, and the next action.

## Copy And Terminology

- Copy is short, analytical, calm, and precise.
- The app uses Patternly as the umbrella product name.
- The app uses neutral product concepts such as track, session, training item, attempt, feedback, review, and progress.
- Certification and algorithm terminology is contextual, not the whole app identity.
- Legal-brand safety is preserved: no official Google affiliation, no official exam-question claims, no guaranteed pass language, and no LeetCode replacement language.
- Forbidden terms from `audit.config.json` do not appear in visible UI unless explicitly quoted as an example of disallowed copy in docs, not product UI.

## Scroll Behavior

- Screens that exceed the viewport can be scrolled to all meaningful content and actions.
- Fixed footers and bottom tabs do not cover content.
- Long feedback, summary, progress, and settings screens preserve context while scrolling.
- Scroll capture includes top and bottom states for screens marked with `scrollCapture.enabled`.

## Accessibility Basics

- Tappable controls have clear accessible names or stable testIDs where automation depends on them.
- Touch targets appear large enough for mobile use.
- Text has sufficient contrast against dark surfaces.
- State is not communicated by color alone.
- Destructive controls and unavailable controls are distinguishable from normal secondary actions.

## Audit Discipline

- Do not mark missing screens or states as passed.
- Do not rely on remote backend state.
- Do not treat screenshot presence as proof of accessibility traversal, gesture quality, persistence, or animation quality.
- Record selector gaps as capture risks instead of redesigning UI during this audit configuration task.
