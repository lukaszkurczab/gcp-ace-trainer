# Launch 102 — learner report flow i administrator triage

Data: 2026-08-25  
Zakres: Task 2 z `docs/launch-completion-plan.md`

## Wynik

Task 2 jest zaimplementowany jako jedna spójna ścieżka:

- zgłoszenie można otworzyć z rozwiniętych szczegółów feedbacku praktyki oraz z Answer Review;
- aplikacja zapisuje zgłoszenie w jednym lokalnym outboxie i pokazuje jawne stany `queued`, `retrying`, `failed`, `accepted`;
- ponowienie zachowuje ten sam `clientSubmissionId`, a backend rozpoznaje powtórzenie idempotentnie;
- domyślne zgłoszenie pozostaje anonimowe, zawiera tylko ograniczony kontekst itemu i nie dołącza odpowiedzi, promptu ani pełnego feedbacku;
- App Check i backendowy rate limit pozostają wymagane przed zapisem raportu;
- backend ma kolejkę `open`/`in_review`, monotoniczną maszynę przejść do `resolved`/`closed` oraz audyt przejść;
- panel `patternly-web/admin` ma wyłącznie rzeczywisty login Firebase i odczyt kolejki przez API. Nie czyta Firestore i nie nadaje uprawnień przez UI.

## Potwierdzenie zgodności Task 1

Przed implementacją sprawdzono oba repozytoria aplikacyjne oraz repozytorium webowe. Backend pozostał na commit `092e0e9` z Task 1, a jego wcześniejsze zmiany robocze zostały zachowane. Potwierdzone ponownie:

- w aktywnym backendzie, testach i konfiguracji nie ma PostgreSQL, Drizzle, `DATABASE_URL` ani aktywnych migracji;
- aplikacja mobilna nie importuje Firestore ani nie wykonuje bezpośrednich odczytów Firestore;
- raport backendowy nadal zapisuje domyślne zgłoszenie bez `accountId` i `contactEmail`, a linkowanie jest możliwe wyłącznie przez jawne pola wejścia;
- Task 2 rozszerza istniejący kontrakt Task 1, nie przywraca starej ścieżki persistence, drugiego magazynu ani klientowego dostępu do Firestore.

## Walidacja planu przed implementacją

Pierwszy wariant — osobne formularze dla każdej powierzchni oraz niejawne pozyskiwanie App Check — został odrzucony z wynikiem `0.76`. Powodowałby duplikację, niejasną odpowiedzialność za token i ryzyko pozornego sukcesu.

Wybrany wariant — jeden komponent formularza, jeden repozytorium outboxu MMKV, zachowanie stabilnego ID, transakcyjna maszyna triage w Firestore, autoryzacja serwerowa i jawny stan niedostępności App Check — uzyskał:

- zgodność z celem i kontraktem: `0.90`;
- prostotę: `0.86`;
- ryzyko implementacyjne/operacyjne: `0.84`;
- utrzymywalność i testowalność: `0.87`.

Wynik końcowy, jako minimum ocen: `0.84`.

## Zmiany implementacyjne

### Aplikacja mobilna

- `src/features/practice/PracticeFeedbackBlock.tsx` i `src/features/review/ReviewFeedbackBlock.tsx` używają wspólnego `ContentReportSheet`.
- `PracticeSessionSurface`, podsumowanie praktyki, `AnswerReviewScreen` i podsumowanie symulacji przekazują stabilny `ContentItemRef` oraz bounded context: wydanie pakietu, item, węzeł, route, locale, build, platformę i czas.
- `src/application/contentReports/contentReportService.ts` centralizuje kolejkę, wysyłkę, retry, serializację flushu i klasyfikację jawnych błędów.
- `src/storage/repositories/contentReportOutboxRepository.ts` używa istniejącej granicy MMKV i jednego klucza outboxu. Reużycie ID z innym payloadem jest odrzucane.
- `src/infrastructure/clients/patternlyAppCheckToken.ts` jest tylko granicą kompozycji App Check. Gdy provider nie istnieje, aplikacja nie fabrykuje tokenu: zgłoszenie przechodzi do `failed` z `app_check_unavailable`.
- Formularz nie posiada pól ani automatycznego mapowania dla odpowiedzi użytkownika, promptu lub pełnego feedbacku. Poza `clientSubmissionId` nie ma osobnego identyfikatora raportu generowanego przy retry.

### Backend

- `contentReports` wymaga bounded `context` w kontrakcie Zod i OpenAPI.
- `listQueue()` zwraca wyłącznie `open` i `in_review`.
- `transitionStatus()` zapisuje zmianę i audyt w jednej transakcji. Dozwolone są tylko `open → in_review → resolved → closed`; powtórzenie tego samego statusu jest idempotentne i nie tworzy kolejnego audytu.
- `GET /v1/admin/content-reports` pozostaje chroniony tokenem Firebase i porównaniem e-maila administratora po stronie backendu.
- `PATCH /v1/admin/content-reports/{clientSubmissionId}` udostępnia wyłącznie statusową zmianę dla uwierzytelnionego administratora. Panel webowy nie udostępnia wolnych komend ani przycisków zmiany statusu.
- CORS/preflight jest ograniczony do skonfigurowanego `ADMIN_WEB_ORIGIN`; niezgodny origin otrzymuje `origin_not_allowed`.

### Web

- `patternly-web/admin/index.html` i `admin/admin.js` zawierają wejście email/password Firebase oraz odczyt kolejki z API.
- Konfiguracja Firebase i origin API są podawane wyłącznie w deployment-time globals. Przy ich braku panel pokazuje jawny stan niedostępności.
- Dane raportu są renderowane przez `textContent`. Nie ma klientowego Firestore, symulowanych rekordów, klientowego sprawdzania administratora ani sekretów w repozytorium.

### Kontrakt i dokumentacja

- Kanoniczny YAML, schema, walidator i test kanoniczny używają dokładnej nazwy `retrying` oraz nowego requirementu `ANALYTICS-REPORTS-002`.
- OpenAPI i klient mobilny zmieniono, bo API rzeczywiście dostało bounded context i endpoint przejść administratora.
- Plan launch-completion oznacza Task 1 i implementacyjną część Task 2 jako zakończone; Task 3 jest następnym aktywnym taskiem.

## Dead-code check

- Usunięto starą nazwę wąskiej kolejki `listOpen()` na rzecz jednej kanonicznej `listQueue()` obejmującej `open` i `in_review`.
- Zastąpiono webowy placeholder „niedostępne do czasu konfiguracji” rzeczywistym wejściem uwierzytelniającym i odczytem API; brak konfiguracji pozostał jawnym stanem niedostępności.
- Nie dodano adaptera zgodności, dual-write, drugiego outboxu, drugiej ścieżki raportowej ani ukrytego fallbacku.
- Log `firestore-debug.log` wytworzony przez Emulator Suite został usunięty i dodany do ignorowanych artefaktów testowych.
- Wyszukiwanie aktywnego kodu nie wykazało bezpośredniego klientowego Firestore, starego `listOpen`, ani automatycznych pól odpowiedzi/promptu/feedbacku w payloadzie raportu.

## Weryfikacja

Zielone wyniki:

- `patternly`: `npm run typecheck` — PASS.
- `patternly`: `npm test` — **600/600** PASS.
- Testy raportów i powierzchni: **9/9** PASS.
- `patternly-backend`: `npm run typecheck` — PASS.
- `patternly-backend`: `npm run lint` — PASS.
- `patternly-backend`: `npm run build` — PASS.
- Firebase Emulator Suite: **11/11** PASS, w tym App Check, rate limit, anonimowość, idempotencja retry, autoryzacja administratora, CORS i audyt przejść.
- `npm run frontend:client:check` — PASS, 9 wersjonowanych ścieżek API.
- `npm run openapi:generate` — PASS; druga regeneracja była bajtowo stabilna.
- Walidacja kontraktu i `npm run gate:contract-change -- HEAD` — PASS.
- `node --check admin/admin.js` — PASS.
- Lokalny serwer statyczny i odczyt `admin/` przez `curl` — PASS; dokument zawiera konfigurację runtime, `admin.js` i jawny komunikat o braku bezpośredniego Firestore.
- `git diff --check` w trzech repozytoriach — PASS.

Pierwsza próba Emulator Suite w sandboxie nie mogła otworzyć lokalnych portów (`EPERM`); powtórzenie z dostępem do lokalnych portów zakończyło się 11/11 PASS.

## Obszary nieweryfikowane

- Nie wykonano wymaganego browser smoke z nieadministratorem i administratorem: połączenie z in-app browserem kończyło się błędem procesu połączenia. Zastąpienie tego wyniku `curl` nie jest traktowane jako smoke UI.
- Nie zweryfikowano prawdziwego tokenu App Check z natywnej aplikacji w projekcie Firebase. Mobilna kompozycja App Check nie jest jeszcze częścią repozytorium; obecny kod zachowuje jawny brak providera i nie wysyła fałszywego tokenu.
- Nie wykonano testu produkcyjnego Cloud Run/Firebase, wdrożenia panelu webowego ani realnego logowania kontem administratora.
- Nie wykonano iOS Maestro screenshotów dla nowego formularza.

## Pozostałe ryzyka operacyjne

- Produkcja musi skonfigurować `ADMIN_WEB_ORIGIN`, `ADMINISTRATOR_EMAIL`, `REPORT_RATE_LIMIT_HASH_SECRET`, limity oraz prawdziwy provider App Check.
- Panel webowy pozostanie jawnie niedostępny bez deployment-time Firebase config i HTTPS API originu; nie należy usuwać tego warunku przez wpisywanie sekretów do statycznych plików.
- Przejścia triage są backendowo gotowe, ale panel webowy jest celowo tylko do odczytu zgodnie z zakresem Task 2. Operacyjny proces wywoływania przejść wymaga kontrolowanego, uwierzytelnionego narzędzia lub kolejnego zatwierdzonego zakresu.
- TTL, PITR, IAM, App Check enforcement w projekcie produkcyjnym oraz retencja wymagają zewnętrznej konfiguracji i dowodów wdrożeniowych.
