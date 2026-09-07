# ODK-E2E-005 — Settings: loading screen

Data raportu: 2026-09-07
Status: `VERIFIED_CLOSED`.

## Ocena i zakres

- Wspólna walidacja briefu: `gpt-5.6-luna`, effort `max`; minimum **0,81 — APPROVE**.
- Porównano `SettingsLoadingSkeleton` z aktualnym `SettingsTab`, `ScreenHeader`, `SettingsGroup`, `ListRow`, `Button`, tokenami i testem ownership.

## Zmiana

Loading używa tego samego `ScreenHeader` co ekran gotowy, odtwarza blok identity, 48-punktową akcję konta oraz rzeczywiste grupowanie guest Settings: **2 / 3 / 2** wiersze. Wiersze mają tę samą bazową geometrię co grouped `ListRow`: `minHeight: 63`, poziomy padding `spacing.lg`, pionowy padding `14`. Tytuły grup mają `titleGap: 0`, a cały układ zachowuje odstępy `spacing.xl`. Nie dodano sztucznego opóźnienia ani danych zastępczych.

## Retest i wyniki

Normalny runtime potwierdził, że stan jest zbyt krótki do deterministycznego screenshotu po powrocie do Settings. Dlatego dowód wykonano istniejącym izolowanym harness-em renderującym aktualny eksport produkcyjny, a loaded reference pobrano z normalnego Settings. Finalny screenshot dark/standard oraz dark/AXXXL (góra i dół po scrollu) potwierdził wyrównanie header → identity → account action → Preferences → Learning → Data & Privacy. Macierz light/dark również przeszła.

- Testy celowane: **46/46**; typecheck i `git diff --check`: **pass**.
- `npm run qa:static`: **pass**, **850/850** testów.
- Regresje/blokery: brak; wariant authenticated ma więcej wierszy Security, ale wspólne kotwice i geometria wierszy pozostają te same, a skeleton nie fabrykuje stanu konta.
