# AUD-04-D — Premium discovery i przygotowanie node

**Status:** **PASS WITH ISSUES** według końcowego niezależnego QA; lokalna implementacja i Maestro potwierdzają fail-closed `unavailable` na Gate A. Bez publikacji treści i bez wdrożenia. Bazowy commit `9330fcef` nie był dowodem zakończenia D; niniejszy odbiór obejmuje dodatkowe poprawki ujawnione na urządzeniu.
**Data:** 25 września 2026  
**Briefing przed zmianą:** APPROVE; zgodność/architektura 0,88, prostota 0,83, ryzyko 0,81, utrzymywalność 0,84.

## Zakres i decyzje

- Dodano app-owned kontrakt `PremiumNodeOffer`. Mapa release/sandbox jest pusta; jedyny wpis to wyraźnie nazwany `aud-04-local-smoke-package-fixture`, dostępny wyłącznie w istniejącym runtime smoke po włączeniu `Premium access` w ustawieniach urządzenia testowego.
- Wpis fixture i jego transport mają jeden kanoniczny moduł wybierany przez Metro. Usunięto drugi alias transportu, który mógł rozwiązać wariant disabled i cicho skierować instalator do backendu. Fixture ma syntetyczne neutralne pytanie, przypięty contentVersion/hash i app-owned tryb; payload nie może dostarczyć konfiguracji trybu. Produkcyjne i sandboxowe rozwiązanie modułu wskazuje wariant bez fixture.
- `PracticeSetupScreen` pokazuje ofertę tylko po przejściu bramki oferty. Po naciśnięciu wywołuje istniejący installer i `ContentPackageRuntimeOwner`; przed nawigacją sprawdza pełną tożsamość, tryb oraz obecność dokładnego node. Zwykła Free discovery i jej konfiguracja pozostają oddzielne.
- Ponieważ fixture używa istniejącego identyfikatora trybu Focus Practice, `nodeId` z `topicId` jest przekazywany jako selektor do przygotowania. Tylko zgodność track/family/mode/node z aktywną, jawnie dostępną ofertą wybiera exact Premium artifact; zwykłe Free przygotowanie bez tego identyfikatora pozostaje na artefakcie wbudowanym.
- Pierwszy niezależny QA wykrył, że pierwotny route gubił selektor, zamieniając `topicId` na domenę Certification; groziło to wyborem Free i ominięciem Gate A. Naprawa dodaje osobny, jawny `nodeId` wyłącznie do konfiguracji Premium, przenosi go przez facade do lifecycle i nie zgaduje po formacie domeny. Integracyjna regresja potwierdza exact version/hash/pytanie, odmowę bez mutation/session oraz kolejność `resolve-package → authorize → mutation` dla dozwolonego startu.
- Nowa sesja w dalszym ciągu przechodzi istniejący `ODK-119-GATE/A` przed trwałym zapisem. Lokalny przełącznik Premium udostępnia testową ofertę, ale nie omija bramki nowej sesji.
- Klient binarny zachowuje status i kod odpowiedzi backendu. Installer mapuje odmowę, niedostępność entitlementu/pakietu, brak publikacji, auth/App Check/reauth, błędny pakiet, niezgodność tożsamości, minimum aplikacji oraz błąd storage na osobne błędy aplikacyjne. PL/EN mają copy; powtórzenie jest dostępne tylko dla błędów uznanych za przejściowe, a odmowa/brak publikacji oferuje jawną drogę Free.

## Zmiany

- `src/content/application/premiumNodeOffers*`, `premiumNodeOfferAccess.ts` — jawna mapa, runtime gate i izolowany transport w jednym smoke-only module; zastąpione moduły `premiumNodeOfferSmokeTransport*` usunięto.
- `src/content/application/nodePackageInstaller.ts`, `src/content/runtime/nodeContentPackage.ts`, `src/infrastructure/clients/PatternlyApiClientAdapter.ts` — exact install/reuse, activation guard i typowane odpowiedzi.
- `src/application/contentPackageRuntimeOwner.ts`, `src/application/trainingLifecycle/{contracts,TrainingLifecycleUseCases}.ts` — konfiguracja app-owned dla exact offer w tym samym runtime ownerze oraz dokładny wybór node przy przygotowaniu.
- `src/application/account/AccountSessionProvider.tsx`, `src/features/practice/{PracticeSetupScreen,sessionConfig}.ts`, locale PL/EN i runtime selector — wstrzyknięta kompozycja UI, bezpośredni start z oferty i widoczne stany błędu.
- `PracticeSetupScreen` układa ofertę pionowo, aby tekst i przycisk nie ściskały się w jednym wierszu.
- Natywny hasher przekazuje do `expo-crypto` należący do wywołania `Uint8Array`; wcześniejszy `ArrayBuffer` kończył instalację na iOS błędem castowania przed Gate A.
- Testy runtime/oferty, mapowania błędów, klienta HTTP, układu, natywnego kontraktu hashera i aliasów Metro; `scripts/fixtures/premium-node-offers.bundle-entry.js` sprawdza brak fixture w bundlu release.

## Weryfikacja lokalna

- `npm run typecheck` — PASS; `git diff --check` — PASS.
- Ukierunkowany retest po poprawkach urządzeniowych: **7/7 PASS** (`premiumNodeOfferRuntime`, `certificationPremiumRouteLifecycle`, układ oferty, natywny kontrakt hashera i Metro smoke/release).
- Ukierunkowane testy runtime ownera, app-owned offer, install/rollback/hash/profile, mapowania błędów i klienta API — **23/23 PASS**.
- Testy runtime selectorów — **16/16 PASS**. Testy wyboru modułów/source graph Metro smoke/sandbox/release/invalid — **2/2 PASS**.
- `npm run validate:content-boundary` — PASS.
- Parsowanie i parzystość kluczy locale EN/PL — PASS; `git diff --check` — PASS.
- Pełne bundlowanie Metro smoke/release przekroczyło wcześniej timeout 120 s. Pierwsza powtórka smoke zawisła po odmowie zapisu Watchmana do `~/Library/LaunchAgents` i została przerwana kodem 130. Kontrolowana powtórka z tym samym repozytoryjnym configiem oraz wyłączonym Watchmanem tylko dla komendy dowodowej ukończyła rzeczywiste bundle smoke i release kodem 0. Smoke bundle zawiera identyfikatory oferty/pytania fixture, release nie zawiera żadnego z nich; test wyboru implementacji Metro i źródeł dodatkowo przeszedł 2/2.
- Controller ponownie uruchomił typecheck, testy oferty/runtime/transportu/selektorów 39/39, content boundary, locale 5/5 i diff check — PASS. Szerszy test copy początkowo wykrył brak klucza `Premium`; klucz dodano do EN/PL, a retest przeszedł 5/5.
- Maestro użyło jedynego istniejącego iPhone’a 17 bez `clearState`, reinstalacji i nowego urządzenia. Izolowane konto utworzono w lokalnym Auth emulatorze, a rejestrację aplikacyjną wykonano istniejącym lokalnym harness-em. Przed wysłaniem formularza hierarchy potwierdziło pełny adres i maskę hasła oczekiwanej długości, a prywatny zrzut został obejrzany. Konto osiągnęło Home; w Settings włączono lokalną ekspozycję oferty Premium.
- Pierwsza próba urządzeniowa ujawniła trzy rzeczywiste defekty: Metro działało w profilu local zamiast smoke, karta oferty ściskała tekst w wąskiej kolumnie, a rozdzielone aliasy pozwalały na cichy backend fallback. Po ich naprawie instalację nadal zatrzymywał natywny `expo-crypto`, ponieważ otrzymywał `ArrayBuffer` zamiast `TypedArray`; poprawiono granicę hashera i dodano test regresji.
- Końcowy flow Maestro na tym samym iPhonie 17: Practice → Setup → `patternly:practice:premium-offer:start` → instalacja i weryfikacja fixture → zwykła bramka Premium. Ekran pokazał „Cloud Practice unavailable / Reconnect to verify Premium access, then try again.” Prywatny screenshot `/tmp/patternly-aud04d-after-offer.png` został przechwycony i obejrzany. Jest to wynik `unavailable`, nie `denied`: urządzenie potwierdza fail-closed i brak przejścia na ekran sesji, ale samo UI nie odczytuje trwałego session pointer. Integracyjny test lifecycle osobno potwierdza dla `denied` kolejność `resolve-package → authorize` oraz brak `mutation` i `activeSession`.
- Jedna wcześniejsza próba automatyzacji użyła współrzędnej przeznaczonej do zamknięcia widocznego bannera developerskiego, gdy banneru nie było, i omyłkowo rozpoczęła zwykłą sesję Free. Sesję natychmiast zakończono przez jawny flow Leave → End session; nie użyto jej jako dowodu D. Końcowy przebieg używał współrzędnej dopiero po `assertVisible` bannera, a pozostałe kroki selektorów.
- Pełny `npm test`: 1255 PASS / 3 FAIL. Trzy błędy są niezależną bramką cross-repo content: historyczny checkout ma bieżący SHA `21707b6…` zamiast locka `cc3efca…`, a dwóm testom brakuje `PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA`. Nie dotyczą zmienionych plików D i nie są raportowane jako zielony pełny suite.

## Ograniczenia

- Dowód urządzeniowy D obejmuje legalny wariant `unavailable` Gate A, nie `denied` ani sukces entitlementu. Przełącznik testowy udostępnia ofertę, ale nie omija admission. Brak mutacji przy `denied` ma dowód integracyjny, nie bezpośredni odczyt urządzeniowego storage.
- Lokalny fixture nie jest publikacją ani treścią Premium. Nie znaleziono przyjętego producenta, cloud storage ani admission/publication source.
- Nie aktywowano recovery takeover, nie usunięto provider revoke i nie wykonano wdrożenia.

## Końcowe QA

Niezależne `qa-gate` wydało **PASS WITH ISSUES**. Oferta jest izolowana do smoke, exact install/preparation i natywny hash mają dowody testowe oraz urządzeniowe, a Gate A poprzedza mutację. Ograniczenia: iPhone pokazał `unavailable`, nie rzeczywiste `denied`; urządzeniowy UI nie odczytuje trwałego pointera, więc brak mutacji dla `denied` potwierdza test integracyjny. Pełny suite pozostaje 1255/1258 z trzema niezależnymi błędami konfiguracji cross-repo content.

Nie znaleziono przyjętego producenta ani admission/publication source; lokalny fixture nie jest publikacją. Nie zmieniano backendu/content, nie aktywowano recovery takeover, nie usuwano provider revoke, nie wykonano wdrożenia.
