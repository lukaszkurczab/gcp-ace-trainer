# ODK-E2E-040 — raport realizacji

## Wynik

Status: COMPLETE. Powstał zaakceptowany kontrakt stanów i copy EN/PL dla celu po przejściu gość → konto.

## Zmienione pliki

- `docs/qa/ios-backend/ODK-E2E-040-DESIGN-SPEC.md` — macierz adopcji, Home, discard i recovery; finalne EN/PL; mapowanie kluczy; kryteria akceptacji.

## Przyczyna

Dotychczasowe teksty mówiły ogólnie o „setup” i „progress”. Nie rozróżniały celu, planu, potwierdzonego zapisu, odrzucenia danych urządzenia i pustego celu na nowym urządzeniu.

## Usunięte ścieżki

Nie usunięto kodu. Po udanym pushu wpis ODK-E2E-040 i ten raport zostaną usunięte. Specyfikacja pozostanie źródłem dla ODK-E2E-039 i ODK-E2E-041.

## Walidacja briefu

`gpt-5.6-luna`, effort `max`, bez narzędzi: APPROVE. Oceny: zgodność celu i architektury 0,94; prostota 0,91; ryzyko 0,84; utrzymywalność 0,89. Minimum 0,84.

## Niezależne QA

`gpt-5.6-luna`, effort `max`: PASS. Pierwszy przegląd wykrył trzy P2. Poprawiono semantykę „Not now”, neutralny stan starego preview oraz osobne komunikaty dla transferu i discard. Retest nie wykazał P0–P2.

## Weryfikacja

- `git diff --check`: PASS.
- `npm run qa:static`: PASS, 1031/1031 testów.
- Kontrole granic treści i prywatności runtime: PASS.
- VoiceOver: pominięty zgodnie z decyzją właściciela.
- Maestro i dowód wizualny: `deferred` do ODK-E2E-041. ODK-E2E-040 nie zmienia runtime ani UI.

## Pozostałe ograniczenia

- ODK-E2E-039 wdraża kontrakt oraz luki danych potwierdzone w ODK-E2E-038.
- ODK-E2E-041 wykonuje pełny retest E2E i dowód wizualny.
- Provider/release gate ODK-E2E-082–088 i 099 pozostają `deferred`.
