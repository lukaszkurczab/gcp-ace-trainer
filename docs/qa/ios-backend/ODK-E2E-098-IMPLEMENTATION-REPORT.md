# ODK-E2E-098 — raport implementacji

## Zakres

Naprawiono akcję powrotu na ekranie Account recovery. Zmiana dotyczy tylko decyzji, czy ekran ma pokazywać akcję `Go back`. Nie zmienia synchronizacji, tożsamości konta, danych lokalnych ani wylogowania.

## Przyczyna

`navigation.canGoBack()` było odczytywane podczas renderowania. Ten odczyt nie powoduje ponownego renderowania po zmianie stosu nawigacji. Po przejściu RootNavigator na stos konta ekran mógł zachować nieaktualną akcję powrotu i wywołać `GO_BACK was not handled`.

## Implementacja

- `src/features/account/AccountEntryScreen.tsx` używa reaktywnego `useNavigationState`.
- Akcja powrotu powstaje tylko dla `navigationIndex > 0`.
- Sam handler dodatkowo sprawdza `navigation.canGoBack()` przed `goBack()`.
- `src/application/account/accountIdentityComposition.test.ts` sprawdza kontrakt źródła i brak starego odczytu render-time.

Nie dodano atrap, cichego fallbacku, fałszywego sukcesu ani usuwania danych.

## Briefing i ocena

Briefing miał sekcje `Cel`, `Ustalenia` i `Podejście`. Niezależna walidacja Luna (`gpt-5.6-luna`, effort `max`, bez narzędzi) zakończyła się `APPROVE`.

| Kryterium | Ocena |
|---|---:|
| Dopasowanie celu | 0,97 |
| Zgodność architektury | 0,94 |
| Prostota | 0,95 |
| Ryzyko | 0,92 |
| Utrzymywalność | 0,95 |
| Minimum | **0,92** |

Minimum przekracza próg 0,80. Niezależne QA Luna/max również zakończyło się `APPROVE`, z minimum 0,98.

## Weryfikacja

- focused test: `node --import tsx --test src/application/account/accountIdentityComposition.test.ts` — 23/23 PASS;
- `npm run typecheck` — PASS;
- `npm run qa:static` — PASS, 1058/1058 testów;
- `git diff --check` — PASS;
- Maestro: `continue-account.yaml` — PASS; `account-sync-failed` widoczny, `Go back` niewidoczne;
- screenshot i hierarchia: `artifacts/maestro-screen-capture/odk-e2e-098/20260909-224913/`.

Maestro użył kontrolowanej niedostępności lokalnego API przy akcji Continue. Stan błędu jest rzeczywistym wynikiem ścieżki synchronizacji. Screenshot pokazuje `Account data is unavailable`, `Retry sync` i `Sign out`. Nie pokazuje `Go back`.

VoiceOver pominięto zgodnie z zakresem zadania. Zmiany użytkownika poza tym zadaniem pozostały nienaruszone.
