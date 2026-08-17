# FUI-004 — truthful certification result

## Stan

Wdrożone na `main` w tym commicie.

## Root cause

Certification result derived its title and score from the finalized result
alone. A session finalized with zero submitted answers was therefore shown as
`Session complete`, without the session configuration or active time needed to
interpret the zero correctly.

## Zmiana canonical

- result loads the verified summary and durable `TrainingSession` record
  together;
- zero-answer endings are explicitly titled `Session ended without answers`;
- the summary now shows status, requested and actual lengths, answered and
  unanswered counts, active foreground time, mode, and recorded domains;
- missing domain metadata is shown explicitly as `Not recorded`;
- the existing PKG-04A approved interaction reference now owns this existing
  result-summary surface; no new visual system, navigation path, or fallback
  was introduced.

## Weryfikacja

- `npm run typecheck`
- `npm run gate:contract-change -- HEAD^`
- focused certification, contract, and visual-shell tests: 37/37 passed
- `git diff --cached --check`

This change is source- and contract-verified. Live Figma inspection remains
unavailable until the current approved Figma file/node is supplied; the
implementation uses the repository's Product Owner-approved PKG-04A reference.
