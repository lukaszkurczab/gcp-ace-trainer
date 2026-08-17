# FUI-006 — refresh-state reassessment

## Stan

Historyczna obserwacja nie jest reprodukowalna w aktualnym kanonicznym
`main`.

## Ustalenia

- bieżący `PracticeHubScreen` owns a full-screen pending branch with the
  shared `AppShellHeader` and `LoadingState`;
- no refresh banner, absolute overlay, or header-covering refresh surface is
  rendered by that screen;
- `tests/loadingStateOwnership.test.ts` verifies the canonical pending owner
  and its `LoadingState` branch;
- this does not close whole-product visual parity: current Figma authority and
  fresh device screenshots remain required by `DES-01` and `QA-05`.

## Wniosek

The old FUI-006 screenshot describes a superseded implementation path. No
runtime patch is warranted, and no replacement banner or fallback was added.
