# ODK-E2E-038 — raport realizacji

## Wynik

Status: COMPLETE. Powstał zaakceptowany projekt przejścia gość → konto dla celu i planu. Projekt wykorzystuje jeden istniejący mechanizm ODK-E2E-056 i nie dodaje drugiej migracji.

## Zmienione pliki

- `docs/qa/ios-backend/ODK-E2E-038-DESIGN-SPEC.md` — kanoniczny przepływ, macierz stanów, inwarianty, recovery, granice ODK-E2E-039/040/041 i kryteria akceptacji.

## Przyczyna

Kod miał trwałą synchronizację celu i planu, ale rejestr nie definiował pełnego zachowania po przejściu z gościa do konta. Brakowało też decyzji dla pustego celu, nowego urządzenia, tombstone i awarii podczas odrzucenia danych gościa.

## Usunięte ścieżki

Nie usunięto kodu. ODK-E2E-038 jest zadaniem projektowym. Po udanym pushu jego wpis zostanie usunięty z aktywnego rejestru. Specyfikacja pozostaje źródłem dla ODK-E2E-039/040/041.

## Walidacja briefu

`gpt-5.6-luna`, effort `max`, bez narzędzi: APPROVE. Oceny: zgodność celu i architektury 0,93; prostota 0,85; ryzyko 0,82; utrzymywalność 0,87. Minimum 0,82.

## Niezależne QA

`gpt-5.6-luna`, effort `max`: PASS. Pierwszy przegląd wykrył P1 dla tombstone konta i kolejności discard oraz P2 dla stabilności tombstone i opisu identity. Projekt jawnie przenosi trzy potwierdzone luki runtime do ODK-E2E-039. Identity rozdziela cel, plan, `recordId`, `planId` i `commandId`. Dwa retesty nie wykazały pozostałych P0–P2.

## Weryfikacja

- `git diff --check`: PASS.
- `npm run qa:static`: PASS, 1031/1031 testów.
- Kontrole granic treści i prywatności runtime: PASS.
- VoiceOver: pominięty zgodnie z decyzją właściciela.
- Maestro i dowód wizualny: `deferred` do ODK-E2E-041. ODK-E2E-038 nie zmienia runtime ani UI, więc zrzut bieżącej aplikacji nie dowodzi wdrożenia tego projektu.

## Pozostałe ograniczenia

- ODK-E2E-039 jest `partial` i ma trzy potwierdzone luki blokujące pełne wdrożenie: semantyka tombstone w preview, atomowa kolejność discard oraz stabilność tombstone po następnym syncu.
- ODK-E2E-040 definiuje finalne EN/PL copy i stany wizualne.
- ODK-E2E-041 dostarcza pełny retest E2E i dowód wizualny.
- Provider/release gate ODK-E2E-082–088 i 099 pozostają `deferred`.
