# ODK-E2E-047 — raport wdrożenia i weryfikacji

Status: VERIFIED_CLOSED

## Wynik

- Ekran szczegółowy ma tytuł `Your data` / `Twoje dane`.
- Kontekst powrotu ma nazwę `Settings` / `Ustawienia`.
- Powrót nadal używa `navigation.goBack()`.
- Kafelek `Your data` i grupa `Data & privacy` na głównym Settings nie zmieniły się.
- Globalna konfiguracja i18n nie zmieniła się.

## Walidacja briefu

Niezależny `gpt-5.6-luna / max`, bez narzędzi:

- zgodność celu i architektury: 0,98;
- prostota: 0,96;
- ryzyko: 0,94;
- utrzymywalność: 0,97;
- minimum: 0,94;
- werdykt: APPROVE.

## Zmienione pliki

- `src/features/home/YourDataScreen.tsx`
- `src/locales/en/data.json`
- `src/locales/pl/data.json`
- `src/preferences/settingsPresentation.test.ts`

Dodano dwa płaskie klucze w namespace `data`: `settings` i `yourData`. Omijają one znany, osobny problem z zagnieżdżonymi kluczami ODK-E2E-104.

## Testy

- `settingsPresentation.test.ts`: 17/17 PASS;
- typecheck: PASS;
- `git diff --check`: PASS.

Wspólna brama `qa:static` zostanie ponowiona na granicy pełnej ścieżki 044–049.

## Retest iOS

Artefakt: `/private/tmp/patternly-path07/evidence047/2026-09-08_063845/ODK047 Your data heading and return`.

- wynik: 28/28 `COMPLETED`;
- urządzenie: `Patternly_QA_Guest_20260908`, iOS 26.4;
- języki: EN i PL;
- sprawdzono wejście z Settings, tytuł, kontekst i rzeczywisty powrót;
- obejrzano 2 zrzuty;
- język EN przywrócono po teście.

## Regresje, ryzyka i blokery

- Nie znaleziono regresji zakresu 047.
- Niezależne QA `gpt-5.6-luna / max`: PASS. Potwierdzono header, `navigation.goBack()`, niezmieniony kafelek Settings, EN/PL i brak zmian `keySeparator`.
- Surowe klucze w treści Your data pozostają widoczne. Są osobnym ODK-E2E-104 i nie zostały ukryte.
- Główne urządzenie konta nadal wymaga ponownego logowania. Retest wykonano na niezależnym symulatorze gościa.
- Nie wykonano VoiceOver zgodnie z zakresem właściciela.
