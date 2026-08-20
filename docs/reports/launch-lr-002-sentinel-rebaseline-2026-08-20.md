# LR-002 — verified-sentinel rebaseline — 2026-08-20

## Result

`VERIFIED` for the repository-side rebaseline. This report updates sentinel
identity after the latest pushed documentation and evidence commits; it does
not convert any commercial, provider, store, signing, device, package, or
human gate into a pass.

## Canonical identities

| Repository | Branch | Exact HEAD | Remote | Exact-SHA CI |
|---|---|---|---|---|
| application | `main` | `98fbbd5ac4ffa6febebdb1b6e0b385a435f87322` | aligned `0/0` | [QA run 32383014164](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/32383014164), Recovery QA and Multi-track content release contract successful |
| content/publishing | `master` | `ad6cbe1b6948ddb16b7c9f7f3a26ddb49c12e0de` | aligned `0/0` | [Content publishing run 31988928289](https://github.com/lukaszkurczab/patternly-content/actions/runs/31988928289), successful |

## Sentinel verification

- `S-FND-01`: application `npm test` passed 619/619 on `98fbbd5`; current
  exact-SHA QA also passed. Content exact-SHA publishing CI passed on
  `ad6cbe1`.
- `S-PLAT-01`, `S-ARCH-01`, `S-GUEST-01`, `S-LEARN-01`, `S-TRACK-01`,
  `S-PKG-01`, `S-PKG-04A`, and `S-CONTENT-01`: retained as regression
  sentinels; the current exact-SHA QA and content publishing run are the
  required pushed evidence. No changed production code invalidated their
  ownership in this documentation-only rebaseline.
- `S-CI-HEAD`: now points to application `98fbbd5` / run `32383014164` and
  content `ad6cbe1` / run `31988928289`; the former stale baseline references
  are retired from the current plan.

## Boundary

This rebaseline proves the pushed repositories and their regression gates are
current and green. It does not prove eight-track package completeness,
runtime/publishing admission, provider operations, legal rights, store
readiness, signing, physical-device coverage, or Product Owner GO.
