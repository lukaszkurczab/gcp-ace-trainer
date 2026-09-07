# ODK-E2E-072 — raport wykonania

Status: `FIXED_PENDING_RETEST`

Data: 2026-09-07

## Wynik

Oba istniejące miejsca prezentujące recovery codes ostrzegają przed kopiowaniem, zanim użytkownik uruchomi akcję. Po skopiowaniu aplikacja zapisuje w SecureStore wyłącznie SHA-256 treści i termin, a po 5 minutach porównuje bieżący schowek. Czyści go tylko przy identycznym skrócie. Zmieniona później zawartość pozostaje nietknięta.

Marker jest zapisywany przed umieszczeniem kodów w schowku, więc kill w trakcie kopiowania nie pozostawia niezarządzanej treści. Próba jest planowana podczas działania aplikacji oraz wznawiana przy starcie i powrocie na pierwszy plan; nieudane czyszczenie jest ponawiane. Kody z onboardingu znikają z pamięci widoku po przejściu aplikacji w tło. Nie dodano nowego ekranu, modala ani dodatkowego kroku.

## Zmiany i pliki

- `src/infrastructure/security/recoveryCodeClipboard.ts` — jedna kolejka kopiowania i cleanup, pięciominutowy termin, bez jawnego utrwalania kodów;
- `src/infrastructure/security/RecoveryCodeClipboardGuard.tsx` i `App.tsx` — wznowienie po foreground i restarcie;
- `src/features/account/AccountEntryScreen.tsx` i `src/features/account/AccountSecurityScreen.tsx` — wspólna bezpieczna akcja oraz ostrzeżenie przed przyciskiem;
- `src/locales/en/account.json` i `src/locales/pl/account.json` — krótka, niegwarantująca copy;
- `src/infrastructure/security/recoveryCodeClipboard.test.ts` — niezmieniony schowek, nadpisanie, restart i rollback po błędzie;
- `src/application/account/accountIdentityComposition.test.ts` — obecność ostrzeżenia przed akcją w obu miejscach;
- `src/components/visualShell.test.ts` — zsynchronizowana liczba istniejących tras po wcześniejszym dodaniu Privacy Requests.

## Weryfikacja

- typecheck: PASS;
- pełny zestaw aplikacji: 838/838 PASS;
- testy ukierunkowane bezpieczeństwa i UI contract: 27/27 PASS;
- content boundary: PASS;
- runtime privacy boundary: PASS;
- niezależny QA po poprawkach: PASS, bez P0/P1;
- `git diff --check`: PASS.

## Ryzyka i ograniczenia

- system operacyjny jest właścicielem schowka, więc aplikacja uczciwie opisuje próbę, a nie gwarantowane usunięcie;
- odczyt schowka po terminie może uruchomić systemowy komunikat prywatności albo zostać zablokowany; rekord pozostaje wtedy do ponownej próby;
- zachowanie wymaga jeszcze retestu na fizycznym iOS/Android: 5 minut, tło, kill/restart, nadpisanie oraz VoiceOver/TalkBack.

## Ocena rozwiązania

- dopasowanie do celu i architektury: `0.94`;
- prostota: `0.91`;
- kontrola ryzyka: `0.92`;
- utrzymywalność: `0.90`.

Minimalna ocena: `0.90`.

## Następne zadanie

`ODK-E2E-078` — obsługa naruszeń danych.
