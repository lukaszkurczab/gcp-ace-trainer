# AUD-08/B1b3d2 — atomowe zastosowanie transferu

**Data:** 24.09.2026  
**Backend:** `patternly-backend/main` `295be93`; lokalnie, bez wdrożenia  
**Odbiór:** niezależne QA `PASS WITH ISSUES`.

Apply przekazuje oczekiwaną generację uprawnień z żądania. Rezerwacja, każda partia i końcowa promocja odczytują konto, operację i metadane postępu w swoich transakcjach; porównują aktywny stan, generację uprawnień oraz przypiętą generację i rewizję postępu. Każda partia zapisuje docelowe rekordy **razem z** kursorem i odnowieniem lease. Partia ma najwyżej 200 dokumentów i szacowany payload do 6 MiB. Wznowienie po wygaśnięciu lease wymaga zgodnej przypiętej rewizji; jeśli sync wygrał, promocja starszych danych jest odrzucana. Końcowa transakcja ponownie sprawdza kompletność, lease i rewizję przed przełączeniem aktywnej generacji. Ukończony replay także sprawdza generację konta. Stary token nie uzyska statusu transferu.

Wykonawca potwierdził typecheck, lint, build, OpenAPI 57 operacji, `git diff --check` i **14/14** testów transferu na izolowanym emulatorze. Niezależne QA uruchomiło ten sam zestaw na osobnych portach `19100/18082`: **14/14**. Testy obejmują rotacje przed rezerwacją, podczas partii i przed promocją, ponad 200 rekordów, większe rekordy rozdzielone limitem bajtów, pusty transfer, wygaśnięcie lease i sync, równoległe apply, replay oraz stary token statusu. Emulatory zamknięto; współdzielone porty i dane pozostały nietknięte. Firebase CLI zgłosił błąd sprawdzenia aktualizacji po poprawnym zakończeniu skryptu testowego.

**Pozostała uwaga QA:** limit 6 MiB jest sprawdzany z serializacji zapisów i narzutem 512 B na rekord; test nie odczytuje wewnętrznego rozmiaru transakcji raportowanego przez Firestore. Zachowano zapas względem limitu usługi. Nie wykonano wdrożenia ani testu urządzeniowego.

**Ocena przed zmianą:** cel/architektura 0,91; prostota 0,82; ryzyko 0,83; utrzymywalność 0,84; minimum **0,82**. Większy, niepodzielony zakres D miał wcześniej ryzyko 0,78, dlatego D1 najpierw zabezpieczyło sync podczas lease.

Następny slice B1b4 obejmuje usunięcie konta oraz zapis webhook/admin. B1c pozostaje bramką lokalnej gotowości: pierwszy i odświeżony token Firebase, pełna macierz tras i typed reauth przed wydaniem.
