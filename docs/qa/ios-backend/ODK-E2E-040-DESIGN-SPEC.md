# ODK-E2E-040 — komunikaty i stany celu po przejściu gość → konto

Status: ACCEPTED_PENDING_IMPLEMENTATION. ODK-E2E-039 wdraża kontrakt. ODK-E2E-041 wykonuje pełny retest E2E i dowód wizualny.

## Cel

Użytkownik ma zawsze rozumieć trzy rzeczy: jaki stan celu i planu zostanie zachowany, czy decyzja została już zapisana oraz jaka jest bezpieczna następna akcja. Teksty są krótkie, spokojne i równoważne w EN i PL.

## Zasady

- Przed potwierdzoną materializacją tekst mówi o przeglądzie lub planowanym wyniku. Nie mówi, że dane są już zapisane.
- Po potwierdzonej materializacji można powiedzieć, że dane są zapisane na koncie.
- Konflikt per track zawsze obejmuje razem cel i plan. Nie używamy „merge”, „combine” ani „połącz”.
- „Not now” / „Nie teraz” odracza wyłącznie zaproszenie do ustawienia celu. Nie usuwa celu, planu ani danych gościa.
- Odrzucenie danych urządzenia ma osobny destrukcyjny opis i osobne potwierdzenie.
- Nazwa tracka jest prezentowana przez kanoniczną nazwę lokalizowaną. Nie pokazujemy surowego `trackId`.
- Konto z celem bez planu nie dostaje zaproszenia do ustawienia celu. Może dostać osobne wejście do utworzenia planu poza tym zadaniem.
- Niepoprawna para celu i planu nie jest pustym stanem. Jest jawnym błędem danych.

## Macierz ekranu adopcji

| Stan | EN | PL | Akcje |
|---|---|---|---|
| Lokalne dane, brak konfliktu | **Review your saved learning** — Your progress, learning goals, and plans on this device are ready to save to your account. | **Sprawdź zapisaną naukę** — Postępy, cele i plany z tego urządzenia są gotowe do zapisania na koncie. | Primary: **Save to account** / **Zapisz na koncie**. Secondary: **Use account data instead** / **Użyj danych konta**. |
| Brak lokalnych danych | **Your account is ready** — We’ll use the learning data already saved to your account. | **Twoje konto jest gotowe** — Użyjemy danych nauki zapisanych już na Twoim koncie. | Primary: **Continue** / **Dalej**. |
| Identyczne wersje | **Same goal and plan found** — This device and your account have the same version for {{trackName}}. No choice is needed. | **Znaleziono ten sam cel i plan** — To urządzenie i konto mają tę samą wersję dla ścieżki {{trackName}}. Nie musisz nic wybierać. | Brak dodatkowego CTA per track. |
| Konflikt celu i planu | **Choose a goal and plan for {{trackName}}** — Keep one complete version. The goal and its plan stay together. | **Wybierz cel i plan dla ścieżki {{trackName}}** — Zachowaj jedną pełną wersję. Cel i jego plan pozostaną razem. | **Use this device’s version** / **Użyj wersji z tego urządzenia**; **Use account version** / **Użyj wersji z konta**. |
| Cel bez planu po jednej stronie | **Choose a goal for {{trackName}}** — One version has a goal without a plan. Choose the complete state you want to keep. | **Wybierz cel dla ścieżki {{trackName}}** — Jedna wersja ma cel bez planu. Wybierz pełny stan, który chcesz zachować. | Te same dwie akcje źródła. |
| Tombstone kontra żywa wersja | **Choose whether to keep this goal** — One version removed the goal and plan for {{trackName}}. Choose which complete state to keep. | **Wybierz, czy zachować ten cel** — W jednej wersji usunięto cel i plan dla ścieżki {{trackName}}. Wybierz pełny stan do zachowania. | Te same dwie akcje źródła. |
| Niepoprawna lub nieaktualna para | **Goal and plan need attention** — We can’t safely use this version for {{trackName}}. Your data stays on this device. | **Cel i plan wymagają uwagi** — Nie możemy bezpiecznie użyć tej wersji dla ścieżki {{trackName}}. Dane pozostają na tym urządzeniu. | Primary: **Try again** / **Spróbuj ponownie**. |
| Nieaktualne preview | **Review the latest changes** — This preview is out of date. Review the updated versions before continuing. | **Sprawdź najnowsze zmiany** — Ten podgląd jest nieaktualny. Przed przejściem dalej sprawdź aktualne wersje. | Primary: **Review again** / **Sprawdź ponownie**. |
| Zapis danych urządzenia w toku | **Saving your learning** — Keep Patternly open while we finish saving your choices to your account. | **Zapisujemy Twoją naukę** — Nie zamykaj Patternly, dopóki nie zapiszemy wyborów na koncie. | CTA zablokowane. |
| Zastosowanie danych konta w toku | **Restoring your account data** — Keep Patternly open while we finish restoring the learning saved to your account. | **Przywracamy dane konta** — Nie zamykaj Patternly, dopóki nie przywrócimy nauki zapisanej na koncie. | CTA zablokowane. |
| Zapis potwierdzony | **Your learning is saved** — Your selected progress, goals, and plans are now saved to your account. | **Twoja nauka jest zapisana** — Wybrane postępy, cele i plany są teraz zapisane na koncie. | Primary: **Continue to Home** / **Przejdź do Home**. |

## Odrzucenie danych urządzenia

Wejście z ekranu adopcji nie używa „Not now”. Używa **Use account data instead** / **Użyj danych konta**.

Potwierdzenie:

- EN title: **Use only your account data?**
- EN body: **Progress, goals, and plans saved only on this device will be removed. We’ll keep the data already saved to your account.**
- EN actions: **Keep device data**; **Remove device data**.
- PL title: **Użyć tylko danych konta?**
- PL body: **Postępy, cele i plany zapisane tylko na tym urządzeniu zostaną usunięte. Zachowamy dane zapisane już na koncie.**
- PL actions: **Zachowaj dane urządzenia**; **Usuń dane urządzenia**.

Sukces jest pokazywany dopiero po poprawnym zastosowaniu stanu konta. Błąd używa stanu recovery i nie zmienia tekstu na sukces.

## Home po synchronizacji

| Stan aktywnego tracka | EN | PL | Akcje |
|---|---|---|---|
| Cel z planem | Bez karty zaproszenia. Istniejące Home i Progress pokazują zapisany cel i plan. | Bez karty zaproszenia. Istniejące Home i Progress pokazują zapisany cel i plan. | Istniejące akcje zarządzania celem. |
| Cel bez planu | Bez karty zaproszenia do celu. Stan planu mówi prawdę: plan nie został jeszcze utworzony. | Bez karty zaproszenia do celu. Stan planu mówi prawdę: plan nie został jeszcze utworzony. | Istniejące wejście do celu; tworzenie planu zgodnie z jego właścicielem. |
| Brak celu, to samo urządzenie, bez odroczenia | **Set a goal when you’re ready** — Choose when and why you want to practise {{trackName}}. You can skip this for now. | **Ustaw cel, gdy będziesz gotowy** — Wybierz, kiedy i po co chcesz ćwiczyć ścieżkę {{trackName}}. Możesz teraz pominąć ten krok. | **Set a goal** / **Ustaw cel**; **Not now** / **Nie teraz**. |
| Brak celu, lokalnie odroczone | Karta pozostaje ukryta na tym urządzeniu. | Karta pozostaje ukryta na tym urządzeniu. | Cel nadal dostępny z Progress i Settings. |
| Brak celu, nowe urządzenie | **No goal is set for this track** — This account doesn’t have a goal for {{trackName}} yet. You can add one now or later. | **Brak celu dla tej ścieżki** — To konto nie ma jeszcze celu dla ścieżki {{trackName}}. Możesz go dodać teraz lub później. | **Set a goal** / **Ustaw cel**; **Not now** / **Nie teraz**. |
| Niepoprawna para | **Goal data is unavailable** — We couldn’t safely load the goal and plan for this track. | **Dane celu są niedostępne** — Nie udało się bezpiecznie wczytać celu i planu dla tej ścieżki. | **Try again** / **Spróbuj ponownie**. Brak karty pustego celu. |

Po wybraniu „Not now” / „Nie teraz” błąd zapisu brzmi:

- EN: **We couldn’t save your choice to hide this goal invitation. Try again. Your goal data was not changed.**
- PL: **Nie udało się zapisać decyzji o ukryciu tego zaproszenia do celu. Spróbuj ponownie. Dane celu nie zostały zmienione.**

## Recovery

| Stan | EN | PL | Prawdziwa akcja |
|---|---|---|---|
| Offline lub błąd API podczas zapisu danych urządzenia | **Your learning is still on this device** — We couldn’t finish saving it to your account. Connect to the internet and try again. | **Twoja nauka nadal jest na tym urządzeniu** — Nie udało się zapisać jej na koncie. Połącz się z internetem i spróbuj ponownie. | **Try again** / **Spróbuj ponownie**. |
| Offline lub błąd podczas użycia danych konta | **Your device data is still here** — We couldn’t finish restoring your account data. Connect to the internet and try again. | **Dane z urządzenia nadal są zachowane** — Nie udało się dokończyć przywracania danych konta. Połącz się z internetem i spróbuj ponownie. | **Try again** / **Spróbuj ponownie**. |
| Aktywna sesja | **Finish your current session first** — Your session and answers are saved on this device. Finish it or leave it before saving learning to your account. | **Najpierw zakończ bieżącą sesję** — Sesja i odpowiedzi są zapisane na tym urządzeniu. Zakończ ją lub opuść przed zapisaniem nauki na koncie. | **Return to session** / **Wróć do sesji**, jeżeli ODK-E2E-039 dostarczy route; w przeciwnym razie istniejący bezpieczny exit i ponowne logowanie. |
| Przerwany journal lub materializacja | **Finish restoring your learning** — Your choices are saved on this device. Try again to finish applying them. | **Dokończ przywracanie nauki** — Wybory są zapisane na tym urządzeniu. Spróbuj ponownie je zastosować. | **Try again** / **Spróbuj ponownie**. |
| Zmieniona rewizja | Użyj stanu **Review the latest changes**. | Użyj stanu **Sprawdź najnowsze zmiany**. | Ponowne preview, nie zapis starej decyzji. |

Dokument nie obiecuje nowego CTA powrotu do sesji. ODK-E2E-039 ma użyć go tylko wtedy, gdy istniejąca nawigacja może otworzyć dokładną aktywną sesję; w przeciwnym razie zachowuje obecny jawny exit.

## Mapowanie lokalizacji

Istniejące klucze do zastąpienia lub doprecyzowania:

- `accountEntryTitle`, `accountEntryDescription`, `transferGuestData`, `transferGuestDataDescription`, `discardGuestDataDescription`;
- `goalPlanConflictTitle`, `goalPlanConflictDescription`, `keepGuestData`, `keepAccountData`, `accountEntryContinue`;
- `accountReadyTitle`, `accountReadyDescription`, `accountRecoveryTitle`, `accountRecoveryDescription`;
- `activeSessionBlocked`, `journalBlocked`, `account_revision_conflict`, `version_conflict`;
- wspólne `Set a goal for this track`, `Set a goal`, `Not now`, `We couldn't save this choice. Try again.`.

Nowe klucze mają opisywać stan, a nie ekran. Minimalny zestaw:

- `accountAdoptionReviewTitle`, `accountAdoptionReviewDescription`, `accountAdoptionSave`, `accountAdoptionUseAccount`;
- `accountGoalPlanConflictTitle`, `accountGoalOnlyConflictTitle`, `accountGoalTombstoneConflictTitle`;
- `accountAdoptionSavingTitle`, `accountAdoptionSavedTitle`, `accountAdoptionSavedDescription`;
- `accountDiscardTitle`, `accountDiscardDescription`, `accountDiscardKeepDevice`, `accountDiscardConfirm`;
- `accountPreviewStaleTitle`, `accountPreviewStaleDescription`, `accountPreviewReviewAgain`;
- wspólne `goalInvitationTitle`, `goalInvitationDescription`, `goalInvitationNewDeviceTitle`, `goalInvitationNewDeviceDescription`, `goalInvitationDismissFailure`.

Każdy nowy klucz powstaje jednocześnie w EN i PL. Akcje mają samodzielne, jednoznaczne etykiety dostępności. Implementacja usuwa zastąpione klucze, jeżeli nie mają innych wywołań.

## Kryteria akceptacji

- Testy mapują każdy stan runtime na dokładnie jeden tytuł, opis i zestaw prawdziwych akcji.
- EN i PL mają pełną zgodność kluczy.
- Testy odróżniają: brak konfliktu, brak jednej strony, cel bez planu, plan bez celu, tombstone, niezgodny `goalRevision` i stare preview.
- Testy potwierdzają brak karty celu przy celu z planem i celu bez planu.
- Testy potwierdzają różne teksty dla tego samego i nowego urządzenia bez celu.
- Testy potwierdzają, że „Not now” nie uruchamia discard ani mutacji celu.
- Testy potwierdzają, że sukces nie jest widoczny przed potwierdzoną materializacją.
- ODK-E2E-041 rejestruje EN/PL, Light/Dark i duży tekst. VoiceOver jest pominięty zgodnie z decyzją właściciela.

## Walidacja briefu

Niezależna walidacja: `gpt-5.6-luna`, effort `max`, bez narzędzi. Wynik: zgodność celu i architektury 0,94; prostota 0,91; ryzyko 0,84; utrzymywalność 0,89. Minimum 0,84. Werdykt: `APPROVE`.

Warunki walidacji zostały uwzględnione: pełna wersja per track, brak przedwczesnego sukcesu, tombstone, częściowe pary, nowe urządzenie, jednoznaczne „Not now”, prawdziwe akcje recovery i parity EN/PL.
