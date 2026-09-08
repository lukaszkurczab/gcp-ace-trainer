# ODK-E2E-024 — harmonogram dni celu

Status: DONE. PO wybrał wariant A. Harmonogram tygodniowy wdrożono i zweryfikowano E2E.

## Decyzja PO po audycie zbiorczym

PO zatwierdził `024=A`: reminders dotyczą wyłącznie aktualnie wybranego tracka. Licznik wcześniejszych prób pozostaje 5/5.

Historyczna decyzja dotyczyła przypomnień dla aktualnej ścieżki albo wszystkich aktywnych celów. PO wybrał A. Nie wdrożono wariantu B.

Wszystkie pięć próśb i nowe ustalenia zapisano w ODK-E2E-024-PREPARATION.md. W oczekiwaniu wykonano inspekcję modelu, platformy, miejsc integracji i testów oraz niezależny przegląd ryzyk gpt-5.6-luna / max. Potwierdzono globalny DAILY i brak pokrycia częściowych błędów dla wielu ID.

## Walidacja briefu

Pierwszy brief został odrzucony przez niezależny `gpt-5.6-luna / max`. Wynik minimalny 0,58. Powodem był brak trwałego recovery między operacjami systemowymi i zapisem.

Po przeprojektowaniu brief otrzymał: zgodność celu i architektury 0,95; prostota 0,82; ryzyko 0,86; utrzymywalność 0,88. Minimum 0,82. Wynik: APPROVE.

## Wdrożenie

- jeden lokalny `practiceReminder` dotyczy aktualnie wybranego tracka;
- każdy `preferredDay` tworzy osobny systemowy trigger WEEKLY;
- nie ma triggera DAILY ani codziennego fallbacku;
- wspólna godzina pozostaje zakresem ODK-E2E-024;
- zmiana dni, statusu celu lub tracka uruchamia wspólny coordinator;
- cel paused zachowuje preferowaną godzinę, ale usuwa aktywne triggery;
- brak celu daje jawny stan bez harmonogramu;
- legacy DAILY jest wejściem migracji i nie jest ponownie zapisywane;
- trwały journal zapisuje transakcję przed operacją systemową;
- `transactionId` w notification content pozwala odzyskać ID po przerwaniu procesu;
- recovery sprząta duplikaty, kończy częściowe tworzenie i anuluje stare ID;
- wszystkie operacje są serializowane przez jeden coordinator;
- błędy po zapisie celu lub tracka są jawne i nie udają sukcesu synchronizacji.

## Weryfikacja

- testy powiadomień obejmują WEEKLY, mapowanie dni, migrację DAILY, zmianę dni i tracka, paused, brak celu, częściowe schedule/cancel, retry, disable i równoległe zapisy;
- wąska brama: 17/17 testów powiadomień i prezentacji PASS;
- końcowy `npm test`: 898/898 PASS;
- typecheck: PASS;
- końcowy `npm run qa:static`: PASS; obejmuje kontrolę odzyskiwania, typów, 898 testów oraz granice treści i prywatności runtime;
- Maestro: uprawnienie systemowe, zapis `20:00`, pon./śr./sob., zmiana celu na pon./wt./sob. i automatyczna aktualizacja — PASS;
- Maestro: paused usuwa harmonogram, pokazuje jawny komunikat, a cel przywrócono do active — PASS;
- obejrzano dowody PL/dark dla kontekstu, edytora, zmiany dni i paused;
- VoiceOver pominięto zgodnie z poleceniem PO.

## Wynik

ODK-E2E-024 jest zakończone i usunięte z aktywnego rejestru. ODK-E2E-034 pozostaje zablokowane wyłącznie przez ODK-E2E-025 i ODK-E2E-029. Następne zadanie w ścieżce to ODK-E2E-025.
