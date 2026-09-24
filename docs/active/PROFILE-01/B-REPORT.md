# PROFILE-01/B — granica przygotowania i aktywacji profilu

**Data:** 24.09.2026
**Status:** `done` jako wewnętrzny slice storage; runtime izolacja konta pozostaje otwarta w `PROFILE-01/C`.
**Niezależne QA:** `gpt-6-luna/high`, `PASS WITH ISSUES` (opis niżej).

## Przyczyna i zmiana

Dotychczas `initializeKeyValueStorage()` od razu publikowało wybrany profil, a router umiał tworzyć nowych gości bez ponownego wyboru zachowanego guest ID. Dodano rozdzielone `prepareProfileStorage()` i `activatePreparedProfile(profileId, kind)` w `mmkvClient`, z walidacją dokładnego ID i rodzaju, zamknięciem starych referencji storage i ochroną przed równoległą aktywacją. Router ma atomowy wybór istniejącego guest ID, także legacy, bez tworzenia kolejnego profilu. Stare `initializeKeyValueStorage()` działa przejściowo jako jawnie opisany eager adapter do czasu `PROFILE-01/C`.

Zmiana obejmuje `src/infrastructure/storage/mmkvClient.ts`, `mmkvClient.test.ts`, `profileStorageRouter.ts` i `profileStorageRouter.test.ts`. Nie zmieniono App, providerów, backendu ani danych istniejącego gościa na iPhonie 17.

## Weryfikacja i granica dowodu

- Testy storage/router po dodaniu przypadków legacy: **18/18 PASS**. Prepare nie publikuje klienta, aktywacja wymaga zgodnego ID/rodzaju, błędy i stare referencje pozostają zamknięte; ponowny wybór gościa zachowuje ten sam profil i dane. Przy istniejącym legacy owner/guest jedynym odczytem przed aktywacją jest `GUEST_INSTALLATION` potrzebny do migracji; testy wykluczają odczyt ustawień, postępu i outboxa.
- Powiązane testy `mmkvClient`, routera, tożsamości konta i kanonicznych repozytoriów: **50/50 PASS** przed dodaniem dwóch testów legacy; wąski zestaw po tej zmianie: **18/18 PASS**.
- `npm run typecheck` oraz `git diff --check`: **PASS**.
- QA oceniło B jako **PASS WITH ISSUES**. Testy używają wstrzykniętego adaptera pamięciowego, bez natywnego MMKV. Produkcyjny App nadal uruchamia eager adapter przed Auth. To nie jest dowód izolacji w runtime; dokładny test i usunięcie starego entry pointu należą do C.

**Następny task:** `PROFILE-01/C` — root startup/Auth przed preferencjami i repozytoriami, bez odczytu wybranego konta przed zgodnym UID. C ma przetestować natywny start/restart na istniejącym iPhonie 17 bez kasowania danych gościa.
