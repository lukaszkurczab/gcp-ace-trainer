# Patternly — trwały stan pracy

Aktualny kanoniczny plan: [`docs/PATTERNLY-WORKING-PLAN.md`](../docs/PATTERNLY-WORKING-PLAN.md).

## Obowiązujące decyzje

- Brak realnych użytkowników i danych produkcyjnych: kompatybilność lokalnych buildów sprzed pierwszego wydania nie jest wymaganiem.
- Jeden bieżący Gość; brak selektora i odzyskiwania wielu historycznych profili.
- Lokalne testy iOS na istniejącym iPhonie 17; bez duplikatu urządzenia/aplikacji bez nowej konkretnej potrzeby.
- Częściowo odzyskane poprawne dane pozostają dostępne. Komunikat incydentu można zamknąć trwale, a brakujący plan jest odzyskiwany automatycznie w tle z kontrolowanym backoffem. Dismiss nie zatrzymuje retry.
- Niepewna własność lub nieodseparowalne uszkodzenie pozostają fail-closed.

## Bieżący stan

- `AUD-02A–D` są zamknięte i usunięte z aktywnej kolejki decyzją właściciela. A–C miały wcześniejsze dowody odbioru. D ma poprawkę flow `ae0d0f15` na `main`, targeted 20/20, typecheck i niezależny review Luna High PASS. Końcowy v42 został przerwany na polecenie właściciela po 13 zapisanych przypadkach PASS; nie osiągnął 20/20, nie objął lifecycle ani trzech suite'ów Premium i nie jest pełnym technicznym PASS. Nie wracać do AUD-02D ani nie odtwarzać usuniętego evidence.

- PROFILE-01–06, AUD-17 i powiązany historyczny fixture są zamkniętym baseline'em. Nie odtwarzać tych tasków ani ich raportów.
- `UI-26-07` ma gotową implementację, targeted 37/37, typecheck i runtime base/error/success/duży tekst. Diff zachowuje historycznie nazwany stash `UI-26-07 awaiting physical VoiceOver 2026-09-27`; VoiceOver nie jest już kryterium. Wznowić diff, sprawdzić go względem aktualnego kodu i ponowić QA.
- `UI-26-08` ma gotową implementację, siedem locale, targeted 53/53, typecheck i runtime password base/error/reauth→hold oraz light/duży tekst. Diff zachowuje historycznie nazwany stash `UI-26-08 awaiting physical VoiceOver 2026-09-27`; VoiceOver nie jest już kryterium. Wznowić diff i ponowić QA.
- `UI-26-09` ma gotową implementację, targeted 82/82, typecheck i runtime layout dark/standard oraz light/duży tekst. Pozostają rzeczywisty retry success/failure, sign-out failure i runtime najdłuższego locale. Diff zachowuje historycznie nazwany stash `UI-26-09 awaiting runtime and physical VoiceOver 2026-09-27`; VoiceOver nie jest już kryterium.
- `UI-26-11` ma gotową implementację, presentation/locale 14/14, szerszy subsystem 57/57, typecheck oraz runtime ready dark/standard, light/accessibility-extra-large i rzeczywisty edit/back/accept. Pozostają runtime shortened/shortfall/loading/stale/unavailable, warianty 1/7 dni i target present oraz błędy i rapid tap dla Edit/Accept. Diff zachowuje historycznie nazwany stash `UI-26-11 awaiting runtime matrix and physical VoiceOver 2026-09-27`; VoiceOver nie jest już kryterium.
- `UI-26-02B` ma gotową implementację w app oraz test-only backend evidence. App: focused 55/55, szeroki subsystem 237/237, typecheck i diff-check; backend: typecheck oraz izolowane Auth/Firestore exchange 2/2. Maestro na istniejącym iPhonie 17 potwierdziło providery wyłącznie na Sign in; Apple doszedł do systemowego wymagania zalogowania Apple ID. Niezależny końcowy `qa-gate` nie znalazł konkretnego defektu kodu, ale wydał `BLOCKED`: brakuje zintegrowanego runtime mapped-existing, unmapped-provisional i Guest A → account B isolation. App wraz z raportem zachowuje stash `UI-26-02B awaiting provider runtime matrix 2026-09-27`; backend evidence zachowuje stash `UI-26-02B exchange evidence awaiting provider runtime matrix 2026-09-27`.
- `AUD-15` pozostaje `blocking`. Historyczne usunięcie badge, style kart i semantyka przeszły controller 41/41, typecheck i niezależne testy 17/17. Read-only runtime na istniejącym iPhonie 17 potwierdził Certification single correct/incorrect oraz Algorithms radio/correct, ale żadna istniejąca próba nie zawiera multi-select partial; sesja Algorithms 1 nie ma review. Nie zapisano odpowiedzi ani Mark Needs Review do chronionego profilu. Do odblokowania potrzebny jest odseparowany fixture multi/partial; VoiceOver nie jest kryterium.
- Następne zadanie do wykonania: `UI-26-07`; wznowić nazwany stash, sprawdzić diff względem aktualnego kodu i ponowić QA bez VoiceOver.
- Następna pełna kolejka, kryteria i report targets są wyłącznie w planie.

## Higiena dokumentacji

`docs/active/` przechowuje wyłącznie materiały bieżących zadań. Git jest archiwum zakończonych raportów, screenshotów, manifestów i flow Maestro. Po zamknięciu zadania nie utrzymywać jego statusu w aktywnym planie ani osobnej historycznej kolejki.
