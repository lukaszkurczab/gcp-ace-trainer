# AUD-08/B1b1 — generacja w żądaniu i dwóch transakcjach

**Data:** 24.09.2026  
**Backend:** `patternly-backend/main` `38ce127`  
**Odbiór:** niezależne QA `PASS WITH GAPS`; pozostała bramka Firebase initial/refresh i pełna macierz należy do B1c.

## Wykonanie

Bearer konta wymaga teraz podpisanego, dodatniego claimu `authorizationGeneration` równego wartości aktywnego konta. Weryfikacja obejmuje mapping UID, tombstone i stan konta; dla aktywnego konta sprzed migracji brak pola w dokumencie nadal oznacza `1`. Żądanie niesie `expectedAuthorizationGeneration` do handlera. Rejestracja i wymiana sesji pozostają `verify-only`, a opcjonalny bearer bez nagłówka jest gościem; dostarczony stary lub pozbawiony claimu token dostaje odmowę, nie przejście na gościa.

Akceptacja warunków oraz potwierdzenie zakupu sprawdzają aktywny stan i oczekiwaną generację **we własnej transakcji**, przed zapisem i przed idempotentnym zwróceniem wcześniejszego wyniku. Obrót pomiędzy guardem a transakcją odmawia zapisu (`409`); brak/błędny/stary claim i niedostępne konto dają jawne `401`. Kontrakt odpowiedzi i wygenerowany OpenAPI są zsynchronizowane.

## Weryfikacja i granica

- Wykonawca: typecheck, lint, `openapi:check`, 22 testy OpenAPI oraz 2 skupione testy Firestore emulatora — PASS. Test emulatora użył izolowanych portów `19100/18082`, ponieważ istniejący zestaw na `19099/18081` zawiera dane i plik testowy czyści bazę przy starcie. Tymczasowe porty i pliki wyłączono/usunięto po teście; wspólny emulator pozostał nietknięty.
- Niezależne QA: samodzielnie potwierdziło typecheck, lint i OpenAPI parity 57 operacji; przejrzało testy brakującego, błędnego, starego i aktualnego claimu, opcjonalnego bearer oraz wyścigu guard→legal/purchase. QA nie powtarzało izolowanego testu emulatorowego.
- `git diff --check` bez błędów przed commitem. Nie wykonywano testu urządzeniowego ani wdrożenia; użytkownik wymaga pracy lokalnej.

B1b2 zabezpieczy pozostałe zwykłe zapisy według [macierzy](B1B0-ROUTE-MATRIX.md), B1b3 transfer, B1b4 delete i mutacje niesesyjne. B1c musi potwierdzić claim w pierwszym ID tokenie Firebase i po odświeżeniu, typed reauth po obrocie i pełną macierz przed gotowością do wydania. Recovery takeover i usunięcie bieżącego `revokeRefreshTokens` pozostają wyłączone.

**Ocena przed zmianą:** cel/architektura 0,90; prostota 0,88; ryzyko 0,84; utrzymywalność 0,88; minimum **0,84**. Niezależny walidator zatwierdził lokalny slice, QA potwierdziło wynik w jego granicach.
