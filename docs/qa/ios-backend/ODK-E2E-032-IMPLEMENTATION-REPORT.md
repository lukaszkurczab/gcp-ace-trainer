# ODK-E2E-032 — raport wdrożenia i weryfikacji

Status: VERIFIED_CLOSED

## Cel

Pokazać na Home dzisiejsze zadanie z zaakceptowanego planu. Karta ma podawać stan dnia, liczbę pytań, obszar z dokładnego pakietu, liczbę powtórek i jedną właściwą akcję.

## Wynik

- Dodano jeden kanoniczny odczyt `HomePlanSnapshotReader`.
- Odczyt pobiera dwa razy cel, plan, aktywną sesję, sesje, próby i kolejkę powtórek. Publikuje wynik tylko wtedy, gdy obie generacje są identyczne.
- Pełna tożsamość obejmuje track, rewizję celu, plan, rewizję zapisu, wersję treści, pełny pin pakietu i timezone.
- Stany dnia to `scheduled`, `completed`, `skipped` i `rest`. Ukończenie ma pierwszeństwo przed pominięciem.
- Karta Home pokazuje stan, liczbę pytań, zlokalizowany obszar dokładnego pakietu, liczbę zaległych powtórek i guidance.
- Wszystkie dziewięć wbudowanych obszarów ma wpisy EN/PL oraz test zgodności zasobów.
- Akcja Practice przekazuje pełny pin i wersję treści. Ekran konfiguracji odrzuca zmianę pakietu jawnym stanem niedostępności.
- Brak danych i błędy nie są ukrywane przez fallback. Powody niedostępności mają zamknięte selektory runtime.
- ODK-E2E-033 nie zostało podłączone.

## Walidacja briefu

Niezależny model: `gpt-5.6-luna`, effort `max`, bez narzędzi.

- zgodność celu i architektury: 0,93;
- prostota: 0,81;
- ryzyko: 0,84;
- utrzymywalność: 0,88;
- minimum: 0,81;
- werdykt: APPROVE.

## Niezależne QA

Niezależny model: `gpt-5.6-luna`, effort `max`.

Pierwsze przeglądy wykryły brak pełnej tożsamości w handoffie, błędną precedencję aktywnej sesji, niepełne porównanie rekordu, błędną etykietę obszaru, zbyt ogólne selektory i niepełną lokalizację. Poprawiono kod oraz testy. Końcowy retest: PASS, bez P0–P2.

## Weryfikacja

- Testy ukierunkowane readera, kontraktu Home i selektorów: 30/30 PASS.
- `npm run qa:static`: PASS.
- Recovery inventory: PASS.
- Typecheck: PASS.
- Pełny zestaw: 1013/1013 PASS.
- Content boundary: PASS.
- Runtime privacy boundary: PASS.
- `git diff --check`: PASS.

## Retest Maestro

Urządzenie: `Maestro_IOS_iPhone-17_26`, iOS 26.4.

Przepływ potwierdził kartę Home dla dnia zaplanowanej sesji. Karta pokazała `Scheduled for today`, 10 pytań, obszar `Complexity and constraints`, 0 powtórek i jedną akcję `Continue plan`. Akcja otworzyła Practice setup z tym samym obszarem i 10 pytaniami. Wynik: PASS.

Dowody tymczasowe:

- `artifacts/odk-e2e-032/maestro/2026-09-09_021351/ODK E2E 032 Home proof from accepted plan/takeScreenshot/home-plan-ready.png`
- `artifacts/odk-e2e-032/maestro/2026-09-09_021351/ODK E2E 032 Home proof from accepted plan/takeScreenshot/home-plan-practice-route.png`

Kontrola wizualna nie wykazała ucięć, nachodzenia elementów ani fałszywego sukcesu. Stany `completed`, `skipped` i `rest` są pokryte testami aplikacyjnymi. Retest wizualny objął reprezentatywny stan `scheduled`. VoiceOver pominięto zgodnie z decyzją użytkownika.

## Następny krok

Po udanym pushu raport i dowody tymczasowe zostaną usunięte. Z aktywnego rejestru zostanie usunięte tylko ODK-E2E-032. Następnym zadaniem pozostanie ODK-E2E-033.
