# Patternly — trwały stan pracy

Aktualny kanoniczny plan: [`docs/PATTERNLY-WORKING-PLAN.md`](../docs/PATTERNLY-WORKING-PLAN.md).

## Obowiązujące decyzje

- Brak realnych użytkowników i danych produkcyjnych: kompatybilność lokalnych buildów sprzed pierwszego wydania nie jest wymaganiem.
- Jeden bieżący Gość; brak selektora i odzyskiwania wielu historycznych profili.
- Lokalne testy iOS na istniejącym iPhonie 17; bez duplikatu urządzenia/aplikacji bez nowej konkretnej potrzeby.
- Częściowo odzyskane poprawne dane pozostają dostępne. Komunikat incydentu można zamknąć trwale, a brakujący plan jest odzyskiwany automatycznie w tle z kontrolowanym backoffem. Dismiss nie zatrzymuje retry.
- Niepewna własność lub nieodseparowalne uszkodzenie pozostają fail-closed.

## Bieżący stan

- PROFILE-01–06, AUD-17 i powiązany historyczny fixture są zamkniętym baseline'em. Nie odtwarzać tych tasków ani ich raportów.
- `RECOVERY-01` jest zamknięte dowodowo i usunięte z aktywnego planu. Read-only retry działa na bootstrapie incydentu, reconnect, foreground i timerze; atomowy merge nie przesuwa globalnej rewizji konta.
- `I18N-01` jest zamknięte dowodowo. Runtime obsługuje siedem locale bez fallbacku, ręczny i systemowy wybór są trwałe, a DE/FR/ES/IT/ET przeszły osobne review i re-review `gpt-6-luna high`. Dokumenty prawne używają bezpośredniej mapy locale; niezatwierdzone drafty są jawne poza release, a release pozostaje fail-closed.
- Następne zadanie zgodnie z kolejką: `UI-26-07`.
- Następna pełna kolejka, kryteria i report targets są wyłącznie w planie.

## Higiena dokumentacji

`docs/active/` przechowuje wyłącznie materiały bieżących zadań. Git jest archiwum zakończonych raportów, screenshotów, manifestów i flow Maestro. Po zamknięciu zadania nie utrzymywać jego statusu w aktywnym planie ani osobnej historycznej kolejki.
