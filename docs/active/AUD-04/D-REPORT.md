# AUD-04-D — Premium discovery i przygotowanie node

**Status:** lokalna implementacja; bez niezależnego QA, dowodu Maestro, publikacji treści ani wdrożenia. Nie oznaczać jako PASS.  
**Data:** 25 września 2026  
**Briefing przed zmianą:** APPROVE; zgodność/architektura 0,88, prostota 0,83, ryzyko 0,81, utrzymywalność 0,84.

## Zakres i decyzje

- Dodano app-owned kontrakt `PremiumNodeOffer`. Mapa release/sandbox jest pusta; jedyny wpis to wyraźnie nazwany `aud-04-local-smoke-package-fixture`, dostępny wyłącznie w istniejącym runtime smoke po włączeniu `Premium access` w ustawieniach urządzenia testowego.
- Wpis fixture i transport są rozdzielane przez Metro build-only aliasy. Fixture ma syntetyczne neutralne pytanie, przypięty contentVersion/hash i app-owned tryb; payload nie może dostarczyć konfiguracji trybu. Produkcyjne i sandboxowe rozwiązanie modułu wskazuje wariant bez fixture.
- `PracticeSetupScreen` pokazuje ofertę tylko po przejściu bramki oferty. Po naciśnięciu wywołuje istniejący installer i `ContentPackageRuntimeOwner`; przed nawigacją sprawdza pełną tożsamość, tryb oraz obecność dokładnego node. Zwykła Free discovery i jej konfiguracja pozostają oddzielne.
- Ponieważ fixture używa istniejącego identyfikatora trybu Focus Practice, `nodeId` z `topicId` jest przekazywany jako selektor do przygotowania. Tylko zgodność track/family/mode/node z aktywną, jawnie dostępną ofertą wybiera exact Premium artifact; zwykłe Free przygotowanie bez tego identyfikatora pozostaje na artefakcie wbudowanym.
- Pierwszy niezależny QA wykrył, że pierwotny route gubił selektor, zamieniając `topicId` na domenę Certification; groziło to wyborem Free i ominięciem Gate A. Naprawa dodaje osobny, jawny `nodeId` wyłącznie do konfiguracji Premium, przenosi go przez facade do lifecycle i nie zgaduje po formacie domeny. Integracyjna regresja potwierdza exact version/hash/pytanie, odmowę bez mutation/session oraz kolejność `resolve-package → authorize → mutation` dla dozwolonego startu.
- Nowa sesja w dalszym ciągu przechodzi istniejący `ODK-119-GATE/A` przed trwałym zapisem. Lokalny przełącznik Premium udostępnia testową ofertę, ale nie omija bramki nowej sesji.
- Klient binarny zachowuje status i kod odpowiedzi backendu. Installer mapuje odmowę, niedostępność entitlementu/pakietu, brak publikacji, auth/App Check/reauth, błędny pakiet, niezgodność tożsamości, minimum aplikacji oraz błąd storage na osobne błędy aplikacyjne. PL/EN mają copy; powtórzenie jest dostępne tylko dla błędów uznanych za przejściowe, a odmowa/brak publikacji oferuje jawną drogę Free.

## Zmiany

- `src/content/application/premiumNodeOffers*`, `premiumNodeOfferAccess.ts`, `premiumNodeOfferSmokeTransport*` — jawna mapa, runtime gate i izolowany testowy transport.
- `src/content/application/nodePackageInstaller.ts`, `src/content/runtime/nodeContentPackage.ts`, `src/infrastructure/clients/PatternlyApiClientAdapter.ts` — exact install/reuse, activation guard i typowane odpowiedzi.
- `src/application/contentPackageRuntimeOwner.ts`, `src/application/trainingLifecycle/{contracts,TrainingLifecycleUseCases}.ts` — konfiguracja app-owned dla exact offer w tym samym runtime ownerze oraz dokładny wybór node przy przygotowaniu.
- `src/application/account/AccountSessionProvider.tsx`, `src/features/practice/{PracticeSetupScreen,sessionConfig}.ts`, locale PL/EN i runtime selector — wstrzyknięta kompozycja UI, bezpośredni start z oferty i widoczne stany błędu.
- Testy runtime/oferty, mapowania błędów, klienta HTTP i aliasów Metro; `scripts/fixtures/premium-node-offers.bundle-entry.js` sprawdza brak fixture w bundlu release.

## Weryfikacja lokalna

- `npm run typecheck` — PASS.
- Ukierunkowane testy runtime ownera, app-owned offer, install/rollback/hash/profile, mapowania błędów i klienta API — **23/23 PASS**.
- Testy runtime selectorów — **16/16 PASS**. Testy wyboru modułów/source graph Metro smoke/sandbox/release/invalid — **2/2 PASS**.
- `npm run validate:content-boundary` — PASS.
- Parsowanie i parzystość kluczy locale EN/PL — PASS; `git diff --check` — PASS.
- Pełne bundlowanie Metro smoke/release przekroczyło wcześniej timeout 120 s. Pierwsza powtórka smoke zawisła po odmowie zapisu Watchmana do `~/Library/LaunchAgents` i została przerwana kodem 130. Kontrolowana powtórka z tym samym repozytoryjnym configiem oraz wyłączonym Watchmanem tylko dla komendy dowodowej ukończyła rzeczywiste bundle smoke i release kodem 0. Smoke bundle zawiera identyfikatory oferty/pytania fixture, release nie zawiera żadnego z nich; test wyboru implementacji Metro i źródeł dodatkowo przeszedł 2/2.
- Controller ponownie uruchomił typecheck, testy oferty/runtime/transportu/selektorów 39/39, content boundary, locale 5/5 i diff check — PASS. Szerszy test copy początkowo wykrył brak klucza `Premium`; klucz dodano do EN/PL, a retest przeszedł 5/5.
- Maestro użyło jedynego istniejącego iPhone’a 17 bez `clearState`, reinstalacji i nowego urządzenia. Izolowane konto utworzono w lokalnym Auth emulatorze. Przed wysłaniem formularza hierarchy potwierdziło pełny adres i maskę hasła oczekiwanej długości, a prywatny zrzut został obejrzany. Po poprawnym wysłaniu aplikacja wróciła jednak do Sign in ze stanem `account-remote-revoke-pending`; zachowanego provider revoke nie wolno usuwać ani przejmować przed PASS B1c. Nie osiągnięto Home, oferty ani sesji, więc nie ma dowodu urządzeniowego sukcesu D i zadania nie wolno oznaczać jako PASS.

## Procedura dla controllera / ograniczenia

1. Po bezpiecznym zamknięciu zależności `account-remote-revoke-pending` uruchomić istniejącą aplikację na już używanym iPhonie 17 w trybie `smoke`; nie czyścić stanu, nie reinstalować i nie zmieniać danych profilu/Gościa.
2. Zalogować istniejącego testowego użytkownika, jeśli sesja wymaga Auth. W `Settings` włączyć `Premium access` (to tylko lokalna bramka ekspozycji oferty). Wrócić do Practice → Setup na AWS Certified Solutions Architect Associate.
3. Oczekiwany element testowy: `patternly:practice:premium-offer:start`; stan błędu: `patternly:practice:premium-offer:error`. Oferta i tekst są oznaczone „Local package installation test” / „Prepare local Premium topic”.
4. Tap start powinien pobrać lokalny fixture przez smoke transport, zweryfikować hash/schema, zapisać exact package i przygotować węzeł przez wspólnego ownera; potem trafia do zwykłego startu sesji. Do dowodu UI controller powinien przechwycić i obejrzeć prywatne zrzuty: ekran setup/oferty oraz wynik.
5. Uwaga: przełącznik testowy nie omija entitlement check `ODK-119-GATE/A`. Bez świeżego dozwolonego Premium entitlementu sesja musi zostać odrzucona bez zapisu aktywnego session pointer. Nie twierdzić, że sesja wystartowała na podstawie samego wejścia na ekran; jeśli lokalne Auth/entitlement fixture nie może dostarczyć legalnego wyniku `allowed`, zapisać konkretny stan jako blocker, bez fałszywego PASS.
6. Testy błędów można potwierdzić przez lokalne odpowiedzi transportu: `403 entitlement_required`, `503 entitlement_unavailable`/`package_unavailable`, `404 not_found`, 401 auth/App Check/reauth oraz poprawne HTTP z uszkodzonym bajtem/hash/schema. Brak/publikacja i odmowa oferują Free, przejściowe stany zachowują możliwość ponowienia.

Nie znaleziono przyjętego producenta ani admission/publication source; lokalny fixture nie jest publikacją. Nie zmieniano backendu/content, nie aktywowano recovery takeover, nie usuwano provider revoke, nie wykonano wdrożenia.
