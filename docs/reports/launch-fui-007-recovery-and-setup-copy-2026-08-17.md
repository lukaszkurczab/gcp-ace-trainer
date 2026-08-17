# FUI-007 — recovery copy and canonical setup navigation

## Stan

Wdrożone na `main` w tym commicie.

## Root cause

Practice setup exposed the same back destination in the shared header and in a second bottom action. The active-session replacement alert described internal persistence with the phrase `durable records`, rather than stating the learner-visible consequence.

## Zmiana canonical

- usunięto dolny przycisk `Back`; the existing `AppShellHeader` is the single back action for setup;
- replacement copy now states that saved answers remain available while the session cannot be resumed;
- no new navigation path, visual layer, or fallback was introduced.

## Weryfikacja

- `npm run typecheck`
- `node --import tsx --test tests/visualShell.test.ts tests/maestroM1Guided10.test.ts tests/maestroM2Custom10AtSessionEnd.test.ts`
- `git diff --check`

The focused UI suite passed 11/11 tests; the canonical contract suite passed 33/33 tests and the contract-change gate passed. Physical-device and Figma parity evidence remain separate launch gates.
