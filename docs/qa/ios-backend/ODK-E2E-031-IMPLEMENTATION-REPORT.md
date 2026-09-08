# ODK-E2E-031 — raport wdrożenia i weryfikacji

Status: VERIFIED_CLOSED

## Cel

Dostarczyć jeden kanoniczny model tekstowy dla stanów `TargetDateGuidance`. Model przygotowuje copy EN/PL, etykiety akcji i cztery fakty dla późniejszych widoków Home i Progress. Nie renderuje jeszcze tych widoków.

## Wynik

- Dodano czysty `targetDateGuidancePresentation` nad projekcją ODK-E2E-030.
- Model zachowuje `state`, `reason` i `tone`. Zwraca komunikat, primary CTA, opcjonalne secondary CTA oraz cztery fakty w stałej kolejności.
- Zamknięte mapy obejmują wszystkie stany, powody, komunikaty, akcje i warianty faktów.
- Brak klucza, fallback języka, nierozwinięty placeholder albo obcy wariant kończy się jawnym błędem.
- Daty cywilne `YYYY-MM-DD` są formatowane dla podanego locale i IANA timezone bez przesunięcia dnia przez UTC.
- Liczby używają natywnej pluralizacji i18next dla EN i PL.
- Secondary CTA jest dozwolone wyłącznie dla `at_risk` i `unreachable`.
- Poprawka po QA obsługuje także kanoniczny `overdue` z niedostępną prognozą i datowym targetem.
- Nie zmieniono kalkulacji ODK-E2E-030, ekranów Home/Progress, nawigacji ani selectorów. Te elementy należą do ODK-E2E-032/033.

## Zmienione pliki

- `src/application/learningPlan/targetDateGuidancePresentation.ts`
- `src/application/learningPlan/targetDateGuidancePresentation.test.ts`
- `src/application/learningPlan/index.ts`
- `src/locales/en/learningPlan.json`
- `src/locales/pl/learningPlan.json`

## Walidacja briefu

Niezależny model: `gpt-5.6-luna`, effort `max`, bez narzędzi.

- zgodność celu i architektury: 0,93;
- prostota: 0,91;
- ryzyko: 0,86;
- utrzymywalność: 0,90;
- minimum: 0,86;
- werdykt: APPROVE.

## Niezależne QA

Niezależny model: `gpt-5.6-luna`, effort `max`.

Pierwsze QA wykryło P1: poprawny `overdue` z niedostępną prognozą był odrzucany. Wykryło też luki testowe. Poprawiono kod i testy. Retest końcowej wersji: PASS, bez P0–P2.

## Weryfikacja

- Testy ukierunkowane guidance + presentation: 16/16 PASS.
- `npm run qa:static`: PASS.
- Recovery inventory: PASS.
- Typecheck: PASS.
- Pełny zestaw: 992/992 PASS.
- Content boundary: PASS.
- Runtime privacy boundary: PASS.
- `git diff --check`: PASS.

## Retest Maestro

Urządzenie: `Maestro_IOS_iPhone-17_26`, iOS 26.4.

Przepływ regresyjny potwierdził zapisany plan, stan `accepted`, trzy sloty Monday/Wednesday/Saturday, `18:00 · 10 questions` oraz akcję `Edit schedule`. Wynik: PASS.

Dowód tymczasowy:

- `/private/tmp/patternly-odk-e2e-031-evidence/2026-09-09_010739/ODK-E2E-031 learning plan regression/takeScreenshot/odk-e2e-031-saved-plan-regression.png`

Kontrola wizualna nie wykazała ucięć, nachodzenia elementów ani fałszywego sukcesu. Widoczne guidance nie jest częścią ODK-E2E-031. Zostanie dodane przez ODK-E2E-032/033. VoiceOver pominięto zgodnie z decyzją użytkownika.

## Następny krok

Po udanym pushu raport i dowody tymczasowe zostaną usunięte. ODK-E2E-032 i ODK-E2E-033 mogą zostać odblokowane, ponieważ ich zależności 028–031 są zakończone.
