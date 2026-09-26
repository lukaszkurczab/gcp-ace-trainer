# PROFILE-05 — usunięcie oracle B1/B2

Status: **done / independent QA PASS WITH ISSUES**
Data: 2026-09-26

## Wynik

Usunięto syntetyczny owner-preservation oracle B1/B2 ze wszystkich aktywnych warstw aplikacji: komendy i wyniku w `AccountSessionProvider`, kontrolki i komunikaty UI, siedem kluczy locale, hook źródła MMKV, implementacje smoke/disabled, test harness, fixture bundle oraz trzy aliasy Metro.

Zachowano dwa odrębne, rzeczywiste kontrakty:

- ogólny lock `createGuestTransitionLock` / `runWithGuestTransitionLock`, używany przez produkcyjne `continueAsGuest`;
- reprezentację `legacy_owner` w routerze oraz jej testy migracji istniejącego lokalnego storage.

Backendowy fixture B3a nie został zmieniony. Historyczne raporty B1/B2 pozostają dowodem wcześniejszych prac, ale nie są aktywną bramką produktu.

## Ocena podejścia

- zgodność z celem: 0,91;
- prostota: 0,86;
- kontrola ryzyka: 0,83;
- utrzymywalność: 0,88;
- minimum: **0,83 — APPROVE**.

Największym ryzykiem było usunięcie wspólnego mechanizmu storage albo locka razem z oracle. Wyszukiwanie konsumentów potwierdziło, że hooki MMKV były specyficzne dla oracle, a lock pozostaje aktywny w zwykłej ścieżce gościa.

## Weryfikacja

- wyszukiwanie aktywnego kodu `ownerPreservation`, `owner-preservation`, `owner_preservation`: 0 trafień;
- `legacy_owner`: wyłącznie router i jego testy migracji/izolacji;
- targeted account/storage/router: **71/71 PASS**;
- Metro smoke/release selection dla pozostałego Premium fixture: **2/2 PASS**;
- pełny `npm test`: **1268/1274 PASS**, 6 błędów niezależnych od PROFILE-05 (ODK evidence, preparation source assertion, route shell count i trzy cross-repo content-release inputs/SHA);
- iOS smoke export: PASS, 1676 modułów, Hermes bundle wygenerowany w katalogu tymczasowym;
- `git diff --check`: PASS.

`npm run typecheck` pozostaje czerwony wyłącznie przez równoległe, niezacommitowane rozszerzenie locale ODK-117 z `en|pl` do siedmiu języków; 20 diagnostyk dotyczy konsumentów nadal przyjmujących `en|pl`, w tym cztery w `AccountEntryScreen`. Usunięty kod oracle nie występuje w żadnej diagnostyce.

## Zakres usunięty

- `src/application/testing/*ownerPreservation*` i README tego harnessu;
- `src/infrastructure/testing/*ownerPreservation*`;
- `scripts/ownerPreservationOracleMetro.test.mjs` i fixture bundle;
- specjalna komenda/test guest transition oracle;
- UI smoke, copy i wyniki po restarcie;
- trzy aliasy Metro i instalacja źródła oracle w MMKV.

## Następny krok

`PROFILE-06`: integracyjny odbiór iOS na istniejącym iPhonie 17 z Maestro i izolowanymi kontami testowymi.

## Niezależne QA

GPT-6 Luna High wydał werdykt **PASS WITH ISSUES**. Potwierdził kompletne usunięcie oracle, zachowanie produkcyjnego locka, zwykłej akcji gościa, migracji `legacy_owner` i backendowego B3a oraz niezależnie powtórzył 71/71, 2/2 i diff check. Issue jest nieblokujące: mieszany worktree ma równoległe zmiany ODK-117, przez które pełny typecheck i sześć testów poza zakresem pozostają czerwone; dokładna atrybucja wszystkich sześciu nie została przez QA ponownie udowodniona.
