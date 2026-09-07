# ODK-E2E-063 — RevenueCat lifecycle uprawnień Premium

Status: `FIXED_PENDING_RETEST`

Data: 2026-09-07

## Wynik

Backend otrzymał kanoniczny, uwierzytelniony endpoint webhooka RevenueCat oraz
atomową projekcję uprawnienia Premium w Firestore. Implementacja obsługuje
zakup, odnowienie, anulowanie bez przedwczesnego odebrania dostępu, wygaśnięcie,
refund, billing issue, zmianę produktu, replay, zdarzenia poza kolejnością i
transfer/restore między identyfikatorami istniejących kont.

## Ocena przed wdrożeniem

- zgodność z celem i architekturą: 0,86;
- prostota: 0,82;
- ryzyko: 0,81;
- utrzymywalność: 0,87;
- minimum: 0,81 — `APPROVE` po doprecyzowaniu kolejności i transferów.

## Zmiany

- `src/modules/billing/revenuecatWebhook.ts` — parser, autoryzacja i reducer;
- `src/modules/billing/revenuecatWebhookStore.ts` — atomowa idempotencja,
  monotoniczna projekcja i transfer;
- `src/api/app.ts` i `src/api/openapi.ts` — publiczny endpoint z jawnym
  kontraktem envelope;
- `src/config/environment.ts`, `.env.example` i dokumentacja Cloud Run —
  produkcyjny fail-closed i komplet wymaganych wartości;
- `src/infrastructure/firestore/stores.ts` — kompozycja store'u;
- `tests/revenuecatWebhook.test.ts` i
  `tests/revenuecatWebhook.emulator.test.ts` — testy jednostkowe i Firestore;
- `docs/decision-register.md` — BE-DEC-001 przestała być odroczona.

## Weryfikacja

- testy modułu: 3/3 PASS;
- testy RevenueCat na Firestore Emulator: 4/4 PASS;
- pełny backend: 100/100 PASS;
- typecheck: PASS;
- lint: PASS;
- OpenAPI check: PASS;
- build: PASS;
- `git diff --check`: PASS;
- niezależny review po dwóch iteracjach naprawczych: PASS, brak P0/P1/P2.

## Ryzyka i blokery

Kod nie został skonfigurowany ani wywołany w prawdziwym projekcie RevenueCat.
Przed publikacją trzeba uzupełnić prawdziwy App ID, entitlement ID, product ID,
środowisko i sekret, zarejestrować endpoint HTTPS oraz przejść sandboxowy i
produkcyjny lifecycle. Checkout mobilny pozostaje zakresem ODK-E2E-059.

Następne zadanie: `ODK-E2E-059` po ODK-E2E-063 zgodnie z kolejnością.
