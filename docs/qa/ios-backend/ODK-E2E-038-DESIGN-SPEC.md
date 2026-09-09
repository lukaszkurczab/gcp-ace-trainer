# ODK-E2E-038 — przejście gość → konto dla celu i planu

Status: ACCEPTED_PENDING_IMPLEMENTATION. ODK-E2E-039 pozostaje częściowo zrealizowane przez ODK-E2E-056. ODK-E2E-040 jest właścicielem finalnego copy.

## Cel

Po uwierzytelnieniu użytkownik zachowuje świadomie wybraną, kompletną wersję celu i planu dla każdego tracka. Aplikacja nie powtarza onboardingu celu, jeżeli wynikowy aktywny track ma cel. Błąd lub przerwanie nie powoduje utraty ani mieszania danych.

## Przepływ kanoniczny

1. Uwierzytelnienie nie otwiera Home, dopóki pierwsza synchronizacja lub adopcja nie zakończy się jednoznacznie.
2. Już powiązana instalacja wykonuje zwykłą synchronizację. Nie pokazuje ponownie adopcji.
3. Niepowiązana instalacja buduje preview z lokalnego i zdalnego snapshotu.
4. Użytkownik podejmuje decyzję tylko przy konflikcie albo możliwej utracie lokalnych danych.
5. Dla każdego tracka wybiera się kompletną wersję `goal + learning_plan`. Pól obu wersji nie wolno łączyć.
6. Materializacja wiąże decyzję z rewizją snapshotu i trwałym `commandId`. Retry jest idempotentny.
7. Home otwiera się dopiero po potwierdzeniu materializacji i zastosowaniu jednego spójnego snapshotu.

## Inwarianty danych

- Każdy rekord zachowuje `recordType`, `recordId` i `trackId`.
- Tożsamość celu obejmuje `trackId`, identyfikator rekordu i rewizję celu. Cel nie otrzymuje sztucznej tożsamości pakietu ani rewizji planu.
- Tożsamość planu obejmuje `recordId`, zagnieżdżony `planId`, `trackId`, `contentPackagePin`, `contentVersion`, `timezone`, rewizję planu oraz `goalRevision`.
- `planId` identyfikuje treść planu. `commandId` identyfikuje jedną próbę materializacji lub jej idempotentne wznowienie. Nie wolno używać tych pól zamiennie.
- Plan może istnieć wyłącznie z celem dla tego samego tracka i pakietu. `goalRevision` planu nie może wyprzedzać celu.
- Cel bez planu jest poprawnym stanem. Plan bez celu, obca tożsamość pakietu i niezgodna rewizja są jawnym błędem danych.
- Tombstone jest wersjonowaną decyzją o braku rekordu. Nie wolno zamienić go w pustą atrapę ani pominąć podczas konfliktu. Żywy rekord po jednej stronie i tombstone po drugiej wymagają jawnego rozstrzygnięcia całej wersji tracka.
- Zgodne rekordy są deduplikowane. Jedyna poprawna wersja jest zachowywana bez dodatkowego pytania.
- Rozbieżne poprawne wersje wymagają jednego wyboru źródła per track. Wybór dotyczy atomowej pary.
- Konflikt `active_track` pozostaje osobną decyzją globalną. Po adopcji Home używa dokładnie wybranego aktywnego tracka.
- Nieaktualne preview nie może zostać zapisane. Zmiana rewizji wymaga nowego preview i ponownej decyzji.

## Macierz zachowania

| Dane gościa | Dane konta | Wynik |
|---|---|---|
| cel i zgodny plan | brak | Zachowaj lokalną parę po potwierdzeniu adopcji. |
| cel bez planu | brak | Zachowaj cel. Plan pozostaje nieutworzony. |
| brak | cel z planem lub bez | Przywróć wersję konta. Nie pokazuj onboardingu celu. |
| brak | brak | Zakończ synchronizację. W Home pokaż opcjonalne zaproszenie do ustawienia celu. |
| wersje identyczne | wersje identyczne | Deduplikuj bez dodatkowego wyboru. |
| wersje rozbieżne | wersje rozbieżne | Wymagaj wyboru pełnej wersji lokalnej albo konta per track. |
| poprawna wersja | niepoprawna para lub tożsamość | Zatrzymaj adopcję z jawnym błędem. Nie naprawiaj danych po cichu. |
| tombstone | rekord lub tombstone | Rozstrzygnij wersją i regułami konfliktu. Nie wskrzeszaj rekordu bez wybranej wersji. |

Macierz obowiązuje niezależnie dla wszystkich tracków obecnych w snapshotach. Wybrany `active_track` określa pierwszy widok Home, ale nie usuwa danych innych tracków.

## Onboarding i zaproszenie do celu

- Wynikowy aktywny track z celem nie pokazuje onboardingu ani zaproszenia.
- Wynikowy aktywny track bez celu nie uruchamia pełnego onboardingu. Home może pokazać nieblokujące zaproszenie.
- Lokalne odroczenie zaproszenia jest zachowane przez rejestrację na tym samym urządzeniu. Dzięki temu użytkownik nie dostaje od razu ponownego pytania.
- Na nowym urządzeniu konto bez celu może pokazać zaproszenie jeden raz dla aktywnego tracka.
- Zmiana aktywnego tracka ocenia stan celu i odroczenie dla nowego tracka.
- ODK-E2E-040 definiuje finalne teksty, etykiety i stany wizualne. Copy nie może sugerować łączenia pól, gdy użytkownik wybiera całą wersję.

## Błędy i odzyskiwanie

- Brak sieci, błąd API, błędny snapshot i przerwana materializacja pozostawiają użytkownika w jawnym stanie retry lub recovery.
- Trwały marker i `commandId` pozwalają wznowić ten sam zapis po restarcie bez podwójnej materializacji.
- Aktywna sesja lub niezamknięty dziennik blokują adopcję. Użytkownik może wrócić do sesji, zakończyć ją albo jawnie ją porzucić. Samo wejście na ekran konta nie usuwa danych.
- Odrzucenie danych gościa usuwa dane lokalne dopiero po potwierdzonym pobraniu i zastosowaniu poprawnego stanu konta.
- Niepowodzenie odrzucenia pozostawia dane gościa i stan pending. Nie wolno pokazać fałszywego sukcesu ani mieszaniny źródeł.
- Kod odzyskiwania konta pozostaje niezależny od decyzji o adopcji.

## Potwierdzone luki wdrożeniowe

- Backend ODK-E2E-056 traktuje obecnie tombstone konta jak brak rekordu. Może przez to przyjąć lokalną żywą parę bez konfliktu. ODK-E2E-039 musi zachować tombstone w preview i wymagać jawnego wyboru.
- Obecna ścieżka odrzucenia czyści dane gościa przed pełnym zastosowaniem stanu konta. ODK-E2E-039 musi zmienić kolejność lub użyć atomowej materializacji tak, aby błąd nie pozostawił częściowo usuniętego datasetu.
- Lokalny tombstone po materializacji może zostać ponownie utworzony i wysłany przy kolejnym syncu. ODK-E2E-039 musi utrzymać stabilne potwierdzenie albo dowieść, że kolejny sync nie podnosi rewizji.
- Te luki są stanem `blocking` dla ODK-E2E-039. Nie unieważniają istniejącej infrastruktury ODK-E2E-056 i nie mogą być zamknięte samym copy lub testem E2E.

## Zakres dalszych zadań

- ODK-E2E-039: stan `partial`. ODK-E2E-056 dostarczyło synchronizację, preview, konflikt per track i trwałe wznowienie. Pozostały zakres to trzy potwierdzone luki danych opisane wyżej, prezentacja przejścia, zaproszenie dla zalogowanego konta bez celu, zachowanie lokalnego odroczenia i testy jednostkowe/integracyjne.
- ODK-E2E-040: stan `planned`. Definiuje finalne EN/PL copy i stany wizualne bez zmiany kontraktu danych.
- ODK-E2E-041: stan `planned`. Dostarcza testy E2E i dowód wizualny po implementacji 039 i 040.
- ODK-E2E-082–088 i 099: stan `deferred`. Provider i release gate pozostają osobną kolejką.

## Kryteria akceptacji implementacji

- Testy obejmują: cel z planem, cel bez planu, brak celu, plan bez celu, tombstone, niezgodny `goalRevision`, pełny `contentPackagePin`, konflikt `active_track` i konflikt per track.
- Testy obejmują: to samo urządzenie, nowe urządzenie, ponowne logowanie, konto bez celu i brak ponownego zaproszenia po lokalnym odroczeniu.
- Testy awarii obejmują: zmianę rewizji po preview, retry z tym samym `commandId`, restart w trakcie materializacji, błąd pobrania przy odrzuceniu oraz aktywną sesję.
- Dowód UI potwierdza brak powtórnego onboardingu z celem oraz nieblokujące zaproszenie bez celu.
- Żaden stan błędu nie otwiera Home ani nie usuwa danych.

## Walidacja briefu

Niezależna walidacja: `gpt-5.6-luna`, effort `max`, bez narzędzi. Wynik: zgodność celu i architektury 0,93; prostota 0,85; ryzyko 0,82; utrzymywalność 0,87. Minimum 0,82. Werdykt: `APPROVE`.

Warunki walidacji zostały uwzględnione: częściowe pary, tombstone, związanie decyzji z rewizją, idempotentne wznowienie, aktywna sesja, bezpieczne odrzucenie i pełna macierz testów.
