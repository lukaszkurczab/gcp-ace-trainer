# AUD-08/A0 — granica generacji autoryzacji

**Data:** 24.09.2026

**Status:** mapa wykonana; implementacja granicy wymaga osobnego projektu i briefingu. AUD-08/A pozostaje otwarte.

## Aktualne granice

- Mobile używa Firebase Auth do uzyskania ID tokenu i wysyła go do backend API. W runtime nie znaleziono bezpośredniego klienta Firestore ani Storage dla danych konta. Reguły Firestore w app i backend odmawiają wszystkich operacji klienta; konfiguracje Firebase nie udostępniają reguł Storage. Dopóki ta granica pozostaje zamknięta, nie ma client-side obejścia backendowej kontroli generacji.
- Backend centralnie weryfikuje bearer i mapuje UID na konto w `src/modules/auth/request.ts`/`src/api/app.ts`. Weryfikator sprawdza odwołanie ID tokenu, ale pomija custom claims w projekcji do `AuthenticatedIdentity` i nie porównuje generacji konta. Rejestr tras obejmuje zwykły bearer, opcjonalny bearer, admin, guest/App Check, webhook RevenueCat i publiczny consume recovery. Różne profile wymagają jawnej klasyfikacji, nie jednego ślepego middleware.
- Backendowe magazyny używają Admin SDK, które nie jest ograniczane przez reguły Firestore dla klientów. Dane konta leżą zarówno pod `users/{userId}`, jak i w kolekcjach indeksowanych po `userId` (progress, entitlement, wnioski, raporty, lifecycle). Istniejąca `generation` dotyczy progress/adoption, nie autoryzacji sesji.
- Odczyt generacji tylko w middleware nie jest wystarczający: zmiana może nastąpić między guardem a zapisem w magazynie. Zapisy wrażliwe na wyścig muszą porównać oczekiwaną generację w tej samej transakcji, która zapisuje dane. Webhook i ścieżki operatorskie wymagają osobnej semantyki, bo nie niosą zwykłego bearer użytkownika.

## Wniosek wykonawczy

Monotoniczna generacja autoryzacji jest wykonalna w obecnym modelu API, lecz nie jest wąskim patchem endpointu recovery. Przed projektem AUD-08/A trzeba zdefiniować źródło generacji, przypięcie jej do custom tokenu i zwykłych sesji, warunki jej zmiany, odmowę starej generacji dla wszystkich account-scoped tras, transakcyjne zabezpieczenie zapisów oraz wyjątki webhook/admin/guest. Test musi wstrzymać starego workera, podnieść generację, dopuścić późne mint/sign-in i potwierdzić odmowę jego żądań na każdej drodze danych. Same reguły Firestore oraz sam claim w tokenie nie dowodzą aktualności względem serwera.

**Dalszy slice `AUD-08/A1`:** kontrakt generacji z klasyfikacją tras i transakcji oraz oceną migracji istniejących sesji. Następnie `AUD-08/A2` ustali semantykę recovery/reissue i ACK. Implementacyjne części backend/mobile należą do B i wymagają niezależnego briefingu i QA. Do tego czasu nie wdrażać automatycznego zwalniania niepewnej rezerwacji recovery.

**Ocena implementacji generacji na obecnym mapowaniu:** cel 0,95; prostota 0,72; ryzyko 0,65; utrzymywalność 0,78; minimum **0,65**. Zgodnie z progiem 0,8 wymaga redesignu i podziału, nie patcha. **Ocena mapy A0:** cel 0,95; prostota 0,91; ryzyko 0,93; utrzymywalność 0,90; minimum **0,90**.
