# ODK-E2E-024 — przygotowanie odczytowe

Nie rozpoczęto implementacji. Audyt podczas oczekiwania na PO020 wykonał gpt-5.6-luna / max. Bez zmian kodu, testów i usług.

## Fakty

Cel jest lokalny i przypisany do tracka. Powiadomienie jest globalne dla urządzenia: jeden dailyReminder z godziną, minutą i notificationId. Platforma tworzy trigger DAILY. Hook odświeża ustawienia po powrocie aplikacji, ale nie zna celu. Ustawienia powiadomień są device-owned i pozostają po usunięciu danych konta.

Sprawdzono goalContracts.ts, goalRepository.ts, notificationPreferences.ts, notificationSettingsRepository.ts, expoNotificationPlatform.ts, useNotificationSettings.ts, NotificationSettingsScreen.tsx, routing i testy accountLifecycle oraz powiadomień.

## Hipoteza najmniejszej zmiany

Cel pozostaje źródłem dni. Globalny rekord zachowuje wspólną godzinę, ale przechowuje dni i kilka native IDs. Dla każdego dnia powstaje trigger tygodniowy. Jedna funkcja uzgadnia cel, harmonogram i storage. Zmiana dni musi anulować stare ID bez osieroconych przypomnień, z rollbackiem przy błędzie.

Do rozstrzygnięcia przed briefem wdrożenia: zakres aktywnego tracka wobec globalnego przypomnienia; migracja starego DAILY; brak celu i paused; reaktywne uzgodnienie po zapisie celu i zmianie tracka. Wspólna godzina należy do024, projekt godzin per dzień do025. Nie traktować propozycji audytu jako decyzji PO.

## Wąskie sprawdzenia

Mapowanie weekday, trzy dni bez DAILY, zmiana dni bez osieroconych ID, migracja z rollbackiem, brak celu/paused, zmiana tracka, device-owned settings i wyścigi odświeżenia. Rozszerzyć istniejące testy notificationPreferences, notificationSettingsState i notificationPresentation. Brak wyników testów024.

## Decyzja PO — zakres ścieżek

Próba 1/5, 2026-09-08. Pytanie wysłano podczas niezależnych prac022–023. Wariant A: jedno przypomnienie dla aktualnie wybranej ścieżki; zmiana ścieżki zmienia harmonogram. Wariant B: osobne przypomnienia dla każdej ścieżki z aktywnym celem; mogą działać równolegle. Obecny zapis jest globalny, więc wariant B wymaga szerszego modelu. Odpowiedź oczekiwana; niczego nie przyjęto za decyzję.

Próba 2/5. Po inspekcji zapisu potwierdzono, że obecną wspólną godzinę można zachować w obu wariantach. Poproszono o prosty wybór A (aktualna ścieżka) albo B (wszystkie aktywne cele, początkowo ta sama godzina). Nadal brak odpowiedzi.

## Niezależny przegląd ryzyk

Gpt-5.6-luna / max, tylko odczyt. Obecny zapis: schedule nowego ID, persist, cancel starego. Rollback jest best effort. Disable: cancel, persist, ewentualne odtworzenie. Guard działa tylko w jednej instancji hooka.

Brakuje testów częściowej porażki schedule/cancel/storage, migracji DAILY, mapowania weekday, crash/retry, wielu ID i dwóch równoległych wywołań. Istniejące notificationPreferences.test.ts dowodzą happy path i permission. notificationSettingsState.test.ts testuje sam guard. Przy kilku WEEKLY trzeba obsłużyć częściowe anulowanie oraz retry bez fałszywego sukcesu.

Punkty integracji: zapis/pauza Goal, zapis aktywnego tracka w SelectTrackScreen, refresh przy AppState. Kontekst rout jest właśnie naprawiany w023; uwagi audytora o stałym Settings dotyczyły wcześniejszego stanu. Ustawienia są urządzeniowe i zachowywane po zmianie/usunięciu danych konta. Przyszły harmonogram musi uzgadniać aktualnie dostępne cele także po takim zdarzeniu. To wymaga jawnego kontraktu, nie tylko zmiany triggera.

Próba 3/5. Po niezależnym przeglądzie ryzyk zaproponowano A jako mniejszy zakres migracji. Pytanie: Tak–A (aktualna ścieżka) albo Nie–B (wszystkie aktywne cele). Brak odpowiedzi; zakres nie został zatwierdzony.

Próba 4/5. Przekazano nowy wynik bramy885/885 dla022–023 i poproszono o jedną literę A lub B. Odpowiedź nadal nie dotarła.

Próba 5/5. Po zakończeniu E2E023 poproszono po raz ostatni o A/B. Wyjaśniono, że brak odpowiedzi spowoduje oznaczenie024 jako BLOCKED i przejście do025. Nadal oczekiwanie; nie wybrano wariantu.

Po piątej prośbie, odczekaniu i odczytowym przechwyceniu aktualnego edytora godziny odpowiedź nie dotarła. Status BLOCKED. Przechodzimy do025.
