# Algorithms Interview Simulation accessibility audit — 2026-07-23

## Scope and environment

- Application commit inspected: `977437e90ce7bd801dd1f2bbb3b233b1bd05f971`.
- Device: booted iPhone 17, iOS 26.4, `7F315654-3175-4F3C-BB24-B0263F59360C`.
- Surface: production `SimulationSessionSurface` and `SimulationQuestionNavigator` source, checked against the approved active-screen and navigator references.

## Evidence and results

| Check | Result | Evidence |
| --- | --- | --- |
| Screen-reader semantics | Pass in source checks | Timer, position, progress, navigator trigger, choice roles and states, modal isolation, and polite durable notices have explicit semantic props. |
| Reading/focus structure | Pass in source checks | The render order is timer, position, progress, navigator trigger, then response controls; the navigator sheet is modal. |
| Touch targets | Fixed | The navigator trigger now has a 48-point minimum target; shared buttons and navigator cells already have 48-point minima. |
| Error recovery focus | Fixed | The navigator alert now contains only its message; `Try again` remains a separate focusable button. |
| Reduce Motion | Fixed in code | The navigator reads `AccessibilityInfo.isReduceMotionEnabled`, follows `reduceMotionChanged`, and uses no modal transition when enabled. |
| Timer announcements | Pass by intent | The timer is exposed as a timer, while terminal timer and durable-operation notices use polite alerts. The normal one-second countdown is not announced repeatedly. |
| Large Dynamic Type | Inconclusive native setting | Setting `UICTContentSizeCategoryAccessibilityXXXL` and restarting the audit host did not alter its render. Source checks still confirm flexible session chrome and four navigator columns at larger font scale. |

## Commands

```text
node --import tsx --test tests/algorithmsSessionAccessibility.test.ts
npm run typecheck
```

## Limits

The isolated iOS audit host currently fails before rendering a state because it does not provide the preferences dependency required by production surfaces. It cannot be registered as production UI ownership, so this task does not alter that non-production host. VoiceOver gesture traversal, spoken announcements, native Large Dynamic Type rendering, and native Reduce Motion rendering are therefore not reported as passed.
