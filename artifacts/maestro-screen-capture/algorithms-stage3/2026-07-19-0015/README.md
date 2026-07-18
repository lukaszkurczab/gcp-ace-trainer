# Algorithms Stage 3 visual QA evidence

## Environment

- Date: 2026-07-19
- Device: iPhone 16 Pro simulator, iOS 18.6
- App identifier: `com.lkurczab.gcpacetrainer`
- Theme: dark
- Build: local Expo development client served from `127.0.0.1:8081`
- Automation: Maestro 2.6.1; device hierarchy and route transitions were exercised with the flows in `.maestro/screenshot-capture/algorithms-stage3/`.

## Captured evidence

| Surface | Evidence | Result |
| --- | --- | --- |
| Track selection and Algorithms entry | `screenshots/screenshots/algorithms-stage3__entry__010__track-required__dark__ios-regular.png`, `...entry__020__track-selection__dark__ios-regular.png` | Captured |
| Practice hub and unanswered real Practice session | `screenshots/screenshots/algorithms-stage3__practice__020__practice-hub__dark__ios-regular.png`, `...practice__030__active-unanswered__dark__ios-regular.png` | Captured |
| Practice exit and abandonment confirmation | `screenshots/algorithms-stage3__practice__040__exit-confirmation__dark__ios-regular.png`, `...practice__050__abandon-confirmation__dark__ios-regular.png` | Captured and interaction exercised |
| Real Simulation, fixed-40 semantic navigator | `screenshots/algorithms-stage3__simulation__030__active-fixed-40__dark__ios-regular.png`; Maestro hierarchy recorded `1 of 40` and positions 1–16, with the application projection containing exactly 40 positions | Captured after Maestro started the real session |

Maestro saved named capture output in the repository working directory; it was moved unchanged into this evidence container after the run.

## Findings

- Fixed: the Simulation route now prepares its canonical fixed-40 session on first entry; before the fix it only attempted to load an active session.
- Fixed: Practice and Simulation confirmation actions reside in the persistent footer action region.
- Fixed: the mobile bundle no longer imports `node:crypto` through the mutation journal path.
- Fixed in source: compact timer text and narrower reserved shell slots prevent the three header regions from claiming overlapping fixed widths.

## Coverage boundary

This pack does **not** close G-D or Stage 3. It does not contain real-device screenshots for every injected failure/recovery state (P-03…P-15 and S-01…S-29) because the production bundle intentionally has no debug state injection or content fallback. The required error/recovery visual states need a sanctioned, non-production visual harness or an existing deterministic fault port before they can be captured without compromising the runtime contract.
