# Patternly — trwały stan pracy

Aktualny kanoniczny plan: [`docs/PATTERNLY-WORKING-PLAN.md`](../docs/PATTERNLY-WORKING-PLAN.md).

## Obowiązujące decyzje

- Brak realnych użytkowników i danych produkcyjnych: kompatybilność lokalnych buildów sprzed pierwszego wydania nie jest wymaganiem.
- Jeden bieżący Gość; brak selektora i odzyskiwania wielu historycznych profili.
- Lokalne testy iOS na istniejącym iPhonie 17; bez duplikatu urządzenia/aplikacji bez nowej konkretnej potrzeby.
- Częściowo odzyskane poprawne dane pozostają dostępne. Komunikat incydentu można zamknąć trwale, ale odzyskiwanie brakującego planu ma być ponawiane automatycznie w tle z kontrolowanym backoffem. Dismiss nie zatrzymuje retry.
- Niepewna własność lub nieodseparowalne uszkodzenie pozostają fail-closed.

## Bieżący stan

- PROFILE-01–06, AUD-17 i powiązany historyczny fixture są zamkniętym baseline'em. Nie odtwarzać tych tasków ani ich raportów.
- Brakującym delta-slice jest `RECOVERY-01`: aktualny kod ma trwałe dismiss i ręczne `Create plan`, ale nie ma automatycznego background retry.
- Niezatwierdzony zakres locale `de/fr/es/it/et` jest zachowany w stachu `I18N-01 partial seven-locale runtime 2026-09-26` i pozostaje `partial`: jego pełny typecheck ma 20 błędów. Zewnętrzni recenzenci nie będą dostępni; po domknięciu technicznym review wykona pięć izolowanych subagentów `gpt-6-luna high`, po jednym na język, niezależnie od autora tłumaczeń i z obowiązkowym re-review po poprawkach.
- Następna pełna kolejka, kryteria i report targets są wyłącznie w planie.

## Higiena dokumentacji

`docs/active/` przechowuje wyłącznie materiały bieżących zadań. Git jest archiwum zakończonych raportów, screenshotów, manifestów i flow Maestro. Po zamknięciu zadania nie utrzymywać jego statusu w aktywnym planie ani osobnej historycznej kolejki.
