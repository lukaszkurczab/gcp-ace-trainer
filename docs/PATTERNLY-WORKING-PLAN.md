# Patternly — główny plan roboczy

**Status dokumentu:** jedyne wersjonowane kanoniczne źródło kolejności, decyzji PO, epików i zależności.<br>
**Rewizja:** 24 września 2026; decyzje PO z 23.09 oraz uzgodnienie [przeglądu repozytoriów](PATTERNLY-REPO-PLAN-ADDITIONS.md).<br>
**Zakres:** cztery repozytoria Patternly; 9 tracków; pierwsze płatne wydanie w Polsce i EOG; iOS jako platforma referencyjna, Android odblokowany przez działającą implementację iOS i testowany później ręcznie.<br>
**Termin publikacji:** nieustalony; brak terminu granicznego.<br>
**Miejsce:** `patternly/docs/PATTERNLY-WORKING-PLAN.md` w repo aplikacji; dawna lokalna ścieżka root jest symlinkiem do tego pliku. Przegląd repozytoriów pozostaje źródłem dowodów, bez własnej kolejki wykonawczej.

> **Podstawa statusów:** stan implementacji i wyniki testów przeniesiono z dostarczonego planu z 22–23.09.2026; luki z przeglądu czterech repo z 24.09 potwierdzono tylko statycznie w wskazanych źródłach. Ta rewizja zmienia decyzje, organizację i zależności; nie jest nowym audytem repozytoriów ani dowodem wykonania testów. Nowe zadania i podziały oznaczono jako nowe. Szczegółowe dokumenty podlinkowane z poprzedniego planu trzeba odczytać podczas wykonania; ich aktualnego stanu nie zakładamy.

**Najbliższe działanie:** `ODK-116-A` — po walidacji platformowej opracować kanoniczną schema publicznych danych i szablonów; `PROFILE-02/A` jest wykonane, B czeka na decyzję PO, a lokalny AUD-02 wymaga izolowanego fixture do odbioru urządzeniowego. `PROFILE-01/A–D` są zamknięte: [kontrakt](active/PROFILE-01/CONTRACT.md), [granica storage B](active/PROFILE-01/B-REPORT.md), [start/Auth C](active/PROFILE-01/C-REPORT.md) oraz [lokalne wylogowanie offline D](active/PROFILE-01/D-REPORT.md). D potwierdziło na istniejącym iPhonie 17 wylogowanie bez API, ostrzeżenie pending po restarcie i powrót Gościa; zdalne revoke i wznowienie outboxa należą do `PROFILE-03`. B3b i urządzeniowa atestacja syntetycznego `legacy_owner` zostały wycofane z aktywnego zakresu decyzją PO z 24.09; nie odtwarzać ich jako blokady. B3a pozostaje niezależnym testem backendowego postępu. `CI-CONTRACT/A2b` czeka na aktualny kontrakt `AWS-02/CANDIDATE` dla readiness i review; kontrola samego draftu nie spełnia A2b. `CI-CONTRACT/A2a` naprawił bramki źródłowe contentu; cały workflow pozostaje otwarty. `PLAN-SYNC/B2` udokumentował bieżące dowody, unknowns i właścicieli dalszych kontraktów; całe PLAN-SYNC pozostaje `partial` do usunięcia rozbieżności AWS-02 i ustalenia dowodu SIMP-05. Brak danych prawnych, fizycznego iPhone’a lub ręcznego testu Androida nie zatrzymuje prac lokalnych i symulatorowych.

**Źródła dowodów:** audyt i macierz (`PATTERNLY-AUDIT-2026-09-22.md` — brak w workspace), kanoniczny pakiet AUD (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace). Raporty przechowują historię i evidence; wyłącznie ten plan steruje kolejnością.

## 1. Cel, odpowiedzialność i reguły wykonania

Doprowadzić pełne przepływy produktu do potwierdzonego działania na symulatorze iOS, następnie przygotować rzeczywistą konfigurację wydania i jeden dokładnie przypięty kandydat. Przeprowadzić go przez freeze, realnych providerów, końcową macierz na fizycznym iPhonie jawną decyzję PO `GO/NO-GO` oraz autoryzowaną publikację i odbiór po wydaniu. Nie redukować zakresu do MVP ani nie zastępować brakujących funkcji pozorem sukcesu.

| Rola | Odpowiedzialność | Granica uprawnień |
| --- | --- | --- |
| Codex | Implementacja w czterech repo, kontrakty, testy lokalne i iOS, tworzenie kont testowych, przygotowanie konfiguracji, decyzje o bankach pytań i dokładnych kandydatach treści. | Zapisuje rzeczywiste dowody; nie podszywa się pod PO; nie wymyśla danych prawnych; nie obchodzi uprawnień platform ani budżetu płatnych usług. |
| Niezależne QA | Walidacja podejścia i wyniku taska, zakres retestu, sprawdzenie kontraktów i evidence. | Lokalny PASS nie zastępuje bramek release. QA nie znosi decyzji PO o platformach ani nie dodaje automatycznych testów Androida. |
| PO | Rzeczywiste dane prawne i wymagane dane właściciela kont, niedelegowalne operacje dostępu, przegląd cen, zapewnienie iPhone’a, końcowe GO/NO-GO. | Nie zatwierdza ponownie banków, exact candidate ani technicznych rozwiązań możliwych do rozstrzygnięcia przez Codex. |
| PO / wyznaczony tester | Późniejszy ręczny test Androida. | Brak tego wyniku nie blokuje wspólnego postępu odblokowanego przez iOS; wyniku iOS nie nazywamy wynikiem Androida. |

### 1.1 Reguły pracy

1. Jeden mały task wykonawczy naraz. Następny rozpoczyna się po raporcie, wymaganych dowodach i niezależnym QA poprzedniego. Wiersz epika ani zakres `A1–A5` nie jest jednym taskiem do wykonania hurtowo.
2. Przed implementacją: briefing `Cel / Ustalenia / Podejście`, niezależna walidacja `gpt-6-luna/high` i cztery oceny: zgodność/architektura, prostota, bezpieczeństwo, utrzymywalność. Minimum poniżej 0,8 wymaga przeprojektowania. Nie przypisywać nowej rewizji planu ocen, których faktycznie nie wykonano.
3. Obowiązuje nadrzędna polityka modeli. Autonomiczna eskalacja kończy się na Luna High; **Sol i Astra nie mogą być uruchamiane autonomicznie**. Gdy wymagany model lub narzędzie są niedostępne, zapisać konkretny brak, bez cichej podmiany.
4. Aktualny kod i testy rozstrzygają fakty implementacyjne. Ten plan i zapisane decyzje PO rozstrzygają zakres oraz kolejność. Konflikt należy jawnie uzgodnić w dokumentacji przed implementacją; historycznych dowodów nie przepisywać.
5. Nie utrzymujemy równoległych aktywnych formatów, translatorów ani źródeł prawdy. Braków nie maskujemy filtrem, metadanymi, atrapą sukcesu lub fallbackiem. Jawne fixture testowe są dozwolone, ale nie stanowią alternatywnej implementacji produktu.
6. Zakończony task otwieramy ponownie tylko przy nowym dowodzie, regresji lub zmianie wymagań. Problem o niepotwierdzonej przyczynie dostaje ograniczoną diagnostykę, nie spekulacyjną przebudowę wspólnych komponentów.
7. Brak zewnętrznego wejścia blokuje tylko krok, który rzeczywiście go potrzebuje. Codex przechodzi do pierwszego niezależnego, dostępnego taska z kolejki. Nie powtarza identycznie zablokowanej próby i nie wraca do PO po już udzieloną zgodę.
8. Po zmianie SHA, artefaktu lub istotnej konfiguracji wyniki oceniamy według wpływu. Nie przenosimy PASS automatycznie, ale też nie uruchamiamy pełnego programu od początku bez uzasadnienia.
9. Gdy decyzja rzeczywiście wymaga konsultacji z PO, pytanie zawiera dokładny opis problemu, realne warianty i ich skutki oraz konkretny przykład z życia użytkownika. W oczekiwaniu na odpowiedź Codex wykonuje niezależną pracę.

### 1.2 Status, dostępność i bramka to osobne informacje

| Pole | Wartości / znaczenie |
| --- | --- |
| Status wykonania | `planned`, `partial`, `blocking`, `done`, `deferred`, `unknown / needs evidence`. `blocking` oznacza otwarty problem uniemożliwiający wymagany wynik, nie automatycznie brak możliwości podjęcia diagnostyki. |
| Dostępność następnego kroku | `READY` — można zacząć; `WAIT: ID` — konkretna zależność; `LATE` — celowo późniejszy etap; `CHECK` — najpierw ograniczone ustalenie stanu. |
| Bramka | `SIM-READY`, `FREEZE`, `PROVIDER`, `DEVICE`, `GO` albo `NON-GATING`. Kolumna określa najpóźniejszy wymagany etap, nie zakaz wcześniejszej pracy. |

Zadanie `partial` może mieć krok `READY`. Epik może być częściowo zablokowany, choć jego kolejny slice jest wykonalny. Ukończone zadania trafiają do zamkniętego baseline’u, nie pozostają w aktywnej kolejce.

## 2. Decyzje PO — obowiązujące zasady

### 2.1 Zmiany z 23.09.2026

| ID decyzji | Ustalenie | Skutek w planie |
| --- | --- | --- |
| DEC-23-IOS | Codex wykonuje testy mobilne tylko na iOS. Android zostanie następnie przetestowany ręcznie. Jedna działająca platforma odblokowuje obie. | Usunąć Android Back i zdublowane automatyczne przebiegi Androida z warunków zamknięcia AUD oraz wspólnych bramek. Zachować zadanie ręcznej weryfikacji, bez udawania dowodu Android PASS. Testy backendu, contentu i lokalnego web/admin pozostają. |
| DEC-23-DATE | Brak terminu publikacji. | Nie wprowadzać sztucznej daty, deadline’u ani automatycznego ograniczenia zakresu. Kolejność wynika z zależności i ryzyka. |
| DEC-23-LEGAL | Rzeczywiste dane prawne przygotowuje PO. Mają być zmiennymi konfiguracji i nie blokować tworzenia aplikacji. | Rozdzielić kontrakt/implementację konfiguracji od uzupełnienia wartości produkcyjnych. Brak tych wartości nie blokuje funkcji, lokalizacji szablonów ani `SIM-READY`; prawdziwe dane nadal są wymagane przed ich publikacją i wydaniem. |
| DEC-23-TEST-ACCOUNTS | Codex może sam tworzyć konta testowe. | Przygotowuje i sprząta własne konta oraz fixture w środowiskach testowych, w granicach dostępnych uprawnień. Nie potrzebuje osobnej zgody na każde konto. Nie usuwa zachowanych danych właściciela ani cudzych kont. |
| DEC-23-DEVICE | PO dostarczy fizyczny iPhone, gdy wszystko możliwe do sprawdzenia na symulatorze będzie działało. | Zgłosić zapotrzebowanie po `SIM-READY`, nie wcześniej. Dostarczenie urządzenia i rzeczywistych danych wydania może przebiegać równolegle. Fizyczne testy wykonuje się na zamrożonym kandydacie. |
| DEC-23-CONTENT | Codex sam rozstrzyga kwestie banków pytań z pełnymi uprawnieniami. | Usunąć oczekiwanie AWS-02 na PO approval dla exact ID. Codex podejmuje i zapisuje decyzje o treści, manifestach, akceptacji kandydata, synchronizacji i admission, przy zachowaniu obowiązkowych testów i QA. |

**Granica delegacji contentu:** dotyczy banków pytań, nie rachunków bankowych, danych wydawcy, końcowego GO/NO-GO ani nieograniczonych wydatków. Decyzję delegowaną zapisuje się jako decyzję Codex na podstawie `DEC-23-CONTENT`, nigdy jako osobisty podpis PO. Jeśli schema akceptacji tego nie obsługuje, Codex jawnie aktualizuje kontrakt z QA, zamiast fałszować istniejące pola.

**Skutek dla Androida:** wynik iOS odblokowuje wspólną implementację i wspólne bramki obu platform. Nie dokładamy osobnego automatycznego Android gate. Rejestr dowodów może jednocześnie wskazywać `iOS: PASS` i `Android: manual pending`. Rzeczywiście wykryty defekt nie jest ignorowany; ocenia się jego wpływ na wspólny kod lub konkretną platformę. Obowiązki konkretnego sklepu dotyczą publikacji w tym sklepie i nie stają się sztuczną zależnością wydania w drugim.

### 2.2 Wydanie, oferta i rynek — bez zmian

- Pierwsze płatne wydanie obejmuje Polskę i pozostałe kraje EOG; Wielka Brytania, USA i inne terytoria są poza zakresem.
- Zamierzony model wydawcy to osoba fizyczna bez działalności gospodarczej. To założenie planistyczne, nie potwierdzenie prawne lub podatkowe.
- Jedyna oferta Premium: automatycznie odnawialna subskrypcja miesięczna **29,99 PLN**, bez triala i wariantów fixed 30/90 dni. Lokalne ceny ustalają sklepy; PO przegląda odstępstwa.
- RevenueCat jest jedynym źródłem entitlementu. Offline tylko do ostatniej potwierdzonej daty wygaśnięcia; aplikacja nie dodaje własnych dni. Store grace: 3 dni w konfiguracji sklepów, widoczne dla aplikacji wyłącznie przez stan RevenueCat. Nie dopisujemy obowiązkowego testu obu sklepów przed odbiorem referencyjnego iOS.
- Produkt i sprzedaż: dokładnie `pl`, `en`, `de`, `fr`, `es`, `it`, `et`. Treści edukacyjne pozostają angielskie. Minimum 18+ we wszystkich krajach pierwszego wydania.
- Wsparcie e-mailowe prowadzi jedna osoba, best effort, bez SLA. Orientacyjne „do około 5 dni roboczych” nie jest gwarancją.
- Wybór dostawcy domeny i poczty pozostaje `deferred`; prawdziwe kontakty i konfiguracja są potrzebne przed wydaniem, nie przed implementacją.
- Konsultacja prawno-podatkowa ODK-115 pozostaje dobrowolna i `deferred`. Wymagane dane oraz obowiązki platformowe, trader/compliance, podatkowe i bankowe są wejściami do publikacji/GO. Ich kompletność trzeba zweryfikować; ten plan nie jest opinią prawną.

### 2.3 Web, konto, privacy, UI i App Check — zachowane kontrakty

| Obszar | Obowiązujący kontrakt |
| --- | --- |
| Hosted web | Wyłącznie marketing. Bez logowania, stanu konta, privacy intake/response i panelu administratora. Zgoda PO z 22.09 na publikację WEB-03C w `patternly-app-sandbox` pozostaje ważna; nie jest dowodem deployu. |
| Admin | Narzędzie lokalne PO: loopback/lokalny backend i emulatory, Firebase Authentication oraz autoryzacja administratora. |
| Privacy | Wnioski użytkownika zaczynają się w aplikacji, w `Settings`. Publiczny privacy web jest legacy do usunięcia; read-only informacje prawne nie są intake. |
| Stan użytkownika | Ścieżkę gościa widzi tylko rzeczywisty guest. `signed-out`, `loading`, `blocked`, `deletion-pending`, `revoked` mają odrębne, prawdziwe stany. |
| Profil i start — decyzja PO 24.09 | Ważna sesja konta otwiera jego dane; istniejący gość wraca do swojego postępu; pierwsze uruchomienie bez danych i sesji otwiera ekran powitalny; po wylogowaniu otwiera się ekran logowania. Jedna instalacja ma najwyżej jeden bieżący profil gościa. |
| Adopcja gościa — decyzja PO 24.09 | Przy zakładaniu konta użytkownik wybiera przeniesienie postępu gościa do konta i synchronizację albo rozpoczęcie od zera. Zatwierdzony wybór przeżywa restart; po zakończeniu nie utrzymuje się drugiej kopii starego gościa. Usunięcie aplikacji przed utworzeniem konta może spowodować utratę postępu gościa. |
| Wylogowanie — decyzja PO 24.09 | Wylogowanie lokalne działa również offline, natychmiast odcina dostęp w aplikacji i otwiera login. Postęp, rozpoczęte sesje i niewysłane zmiany pozostają lokalnie przypisane do tego konta; dopiero ponowne uwierzytelnienie tego samego konta pozwala je otworzyć i synchronizować. Inne konto i gość nie mogą ich odczytać. Zdalne unieważnienie sesji ma osobny kontrakt ponowienia; lokalne wylogowanie offline nie jest dowodem natychmiastowego unieważnienia serwera. Usunięcie konta ma odrębny kontrakt usuwania danych. |
| Niepełne odzyskanie danych — decyzja PO 24.09 | Dla potwierdzonej tożsamości pokazać odzyskany postęp i jawnie obsłużyć brakujące dane. Wyjątkowa awaria, która uniemożliwia bezpieczny dostęp, prowadzi do logowania; zwykły brak części postępu nie zmienia właściciela ani nie wymusza wylogowania. |
| Dane i dokumenty | `Your data`: kanoniczny reset z potwierdzeniem. Eksport: „Share or download” z rzeczywistym zakresem. `Legal information`: krótki hub; lokalne Privacy Policy i Terms są kanoniczne, zewnętrzny link tylko do Support. Prawne terminy bez fikcyjnego SLA. „Wnioski RODO” i „Odzyskanie danych nieosobowych” pozostają osobnymi wierszami. |
| Rejestracja | Sign in bez checkboxa wieku/privacy. Create account: jeden checkbox akceptacji Terms i potwierdzenia zapoznania się z Privacy Policy; 18+ wynika z Terms. |
| Język UI | Zgodność z językiem brandu Patternly, nie z przestarzałą Figmą; wcześniejsze ustalenie PO z 23.09. Wychwytywać redundancję, techniczny język, przeładowanie ekranów i zbędne opisy. Nie usuwać znaczenia, informacji o błędzie ani dostępności tylko dla skrócenia ekranu. |
| Mobilny App Check | Każde chronione żądanie, także gościa, wymaga App Check. Dla konta jest dodatkowy wobec Firebase Authentication i recent reauthentication. Brak/błąd/niedostępność failuje closed; UI unavailable/retry bez pozornego sukcesu, z idempotencją retry. |
| Inne kanały | Hosted web, lokalny admin i callbacki providerów nie używają mobilnego App Check; zachowują własne zabezpieczenia. Debug tokeny tylko w jawnych testach lokalnych/emulatorowych. Artefakt produkcyjny z debug configuration jest odrzucany. |
| Dostępność | Wyjątek ODK-E2E-114 dotyczący VoiceOver pozostaje lokalny dla tego taska. W pozostałych zadaniach sprawdzać wszystkie dostępne na symulatorze wymagania. Gdy konkretny dowód wykonania VoiceOver wymaga urządzenia, przenieść **ten dowód**, nie cały task, do jawnej pozycji ODK-088. Inspekcja semantyki nie jest dowodem rzeczywistego użycia VoiceOver. |

### 2.4 Content i nauka — ciągłość decyzji

| Obszar | Ustalenie |
| --- | --- |
| Banki | Zachować zakres 9 banków, w tym Claude 300 pytań. Historyczne akceptacje są przypięte do dokładnych manifestów. Nowe decyzje wykonuje Codex na podstawie delegacji, bez osobnego wiersza PO-APPROVE-CANDIDATE. |
| AWS ODK-096 | Zachować zatwierdzoną zamianę `managed-service-platform-patching` na `lambda-runtime-update-mode` (SAA 1.2). Historycznie zaakceptowano Free node 40 pytań: `8dd16df1d7c6741b373026547c35255aea97869542bbb8897a4f36c73730bc33`; track AWS 2604: `46697d0c4e395455084d5dc28206b83e9207109b6f803eb94a47d4b4b981ac45`. Nowe zmiany i nowe hashe Codex ocenia sam, z odtwarzalnym uzasadnieniem. |
| Tożsamość i builder | Jeden schema pytań, jedno `mentalUnitId`, jeden wspólny builder i dziewięć niezależnych artefaktów. Status SIMP-05 trzeba ustalić z dowodów; nie zakładać ani jego zakończenia, ani konieczności ponownej implementacji. Aktywne legacy adaptery mają zniknąć, nie stawać się stałym fallbackiem. |
| Admission | Uprawnienie do podjęcia decyzji nie jest wynikiem testu. Readiness, migration, publishing/runtime admission i app lock wymagają własnych aktualnych dowodów. Historycznego ACC-02 i starego `EVIDENCE_VALUE` nie przenosić na nowy candidate. |
| EPIC-09 | Uzupełniająca model-based evaluation po SIMP-05 i ustaleniu baseline’u. Nie blokuje release. Codex rozstrzyga rubrykę i kalibrację w ramach delegacji contentu; evaluator pozostaje rolą oceniającą, bez samodzielnej publikacji lub edycji pytań. Korekty wykonuje osobny task Codex z QA. Pełny płatny run wymaga ustalonego budżetu. |
| Reminders | Wyłącznie aktywny track. Edytor godzin ma checkbox osobnych godzin i listę dni. |
| Plan nauki | Target date zależy od celu; `own pace` bez daty. Completion rule wersjonowana per package: minimalna liczba prób i jakość z ruchomego okna. Brak reguły daje jawny stan nieznany. Shortfall jawny; skrócenie tylko gdy deklaruje je package, bez obcego materiału. |
| Synchronizacja i UI | Goal i zaakceptowany plan synchronizują się atomowo per track. Konflikt rozstrzygany jawnie przy bezpiecznym wejściu, bez przerywania sesji. Nazwa tracka ma subtelny pionowy akcent; tekst górnej nawigacji 16 pt. |

## 3. Baseline implementacji — nie mylić ze stanem docelowym

| Obszar | Status z materiału wejściowego | Otwarta luka |
| --- | --- | --- |
| Środowisko | `partial` | Lokalny profil, preflight i `/ready` działały; formularze sterownika i pełne lokalne flow RC nie są odebrane. Historyczny admin-local28080 dotyczył 8-trackowego release’u. |
| Bootstrap / owner / guest | `partial` | AUD-17 poprawił niedozwolone klucze SecureStore na kropkowe. Build, 23 testy i Maestro Account Entry wykonano lokalnie; brak pełnego owner→guest→owner E2E. |
| Sesja | `blocking` | AUD-13: historycznie piąta odpowiedź Coding i cold restart zawodzą; przyczyna niepotwierdzona. Brak świeżego logu ani działający ekran wejścia nie zamykają defektu. |
| Nawigacja | `partial` | Exam Back no-op poprawiony lokalnie; pełne iOS Back/swipe/cancel/leave/resume/result nadal bez odbioru. Android usunięty z tej bramki nową decyzją PO. |
| Pakiety Premium | `partial` | Cache/refresh i część entitlementu istnieją. AUD-04-A ukończył kontrakt; backend download/admission, weryfikacja i atomowa aktywacja mobile oraz discovery/preparation pozostają. |
| Recovery | `blocking` | AUD-08: brak uzgodnionej semantyki operation/ACK/token retention oraz współbieżności; wcześniejsze minima briefingów 0,58 i 0,65. To stan historyczny, nie wymaganie nowej zgody PO. |
| UI / dostępność | `partial` | AUD-11 i AUD-15 mają lokalne poprawki, ale brak części dowodów. AUD-14 wymaga reprodukcji Dynamic Type; AUD-16 jest planowane. |
| Lokalizacja | `partial` | EN/PL istnieją; DE/FR/ES/IT/ET i pochodzenie tekstów wymagają pracy. Wstępna inwentaryzacja: 1298 wpisów top-level, 1485 liści, 8 namespace i bezpośrednie literały. |
| Content | `partial` | AWS-02 ma draft v2: `95de91e8a0a9ff6d713c1c64ae8c8a7ebae651a2c60a0f59f608e58b5f705be4`. Brak pełnego readiness/admission/app lock. Nowa delegacja usuwa blokadę zgody PO, nie braki techniczne. |
| Web | `partial` | Lokalny katalog 9 ID i noty 5 certyfikacji, zgodność z registry `80ec9db`, lokalny verifier PASS. W poprzednim raporcie root 404 i odrzucone credentials CLI; bieżący stan zdalny wymaga sprawdzenia. |
| Konfiguracja wydania | `planned` | Prawdziwe dane jeszcze do przygotowania. Kontrakt zmiennych i testowe dane mogą być wdrażane od razu. |
| Realni providerzy / urządzenie | `unknown / needs evidence` | Brak dowodów dla finalnego kandydata. Wyniki symulatora nie dowodzą App Check/Store/RevenueCat/SMTP/ASC ani fizycznego odbioru. |

### 3.1 Zamknięty baseline — poza aktywną kolejką

| ID | Zachowany wynik / granica | Dokument |
| --- | --- | --- |
| IDENTITY-CUTOVER | Jedna tożsamość contentu i kontrakt konta/API; usunięte runtime migratory i stare tryby. Historyczne testy i QA nie zastępują release gate. | Decyzja i wyniki (`IDENTITY-CUTOVER-2026-09-22.md` — brak w workspace) |
| AWS-01 | Uzgodnione ODK-096, inventory i konsumenci; historyczne inventory 9/117/943/16077. Nie oznacza nowego admission. | [Raport](https://github.com/lukaszkurczab/patternly-content/blob/618baae428d7d42e59834eaef322e57393d54c7d/reports/candidate-reconciliation/AWS-01-REPORT.md) |
| AUD-01 | Uzgodniono aktywne kontrakty: 9 tracków, 7 locale, expiry providera, kolejność bramek. Rewizję nowych decyzji wykonuje PLAN-SYNC, bez fikcyjnego unieważniania wcześniejszego PASS. | Raport (`AUD-01-REPORT.md` — brak w workspace) |
| AUD-03 | Lokalnie wspólna selekcja pokrycia i testy trzech rodzin. Nadal potrzebna macierz AUD-06. | Pakiet AUD (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace) |
| AUD-07 | Odrzucenie duplikatów przed transakcją; zapisano 9/9 testów kontraktu i 31/31 emulatora. | Pakiet AUD (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace) |
| AUD-09 | Lokalny neutralny stan po błędzie SMTP, resend, anti-enumeration i idempotencja. Realne delivery pozostaje w bramce providerów. | Pakiet AUD (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace) |
| AUD-10 | Lokalna walidacja odrzuca produkcyjne emulator hosty; narrow test i typecheck zapisane jako PASS. | Pakiet AUD (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace) |
| AUD-12 | Mapy/klastry Coding rozstrzygnięte bez zmiany banków; kanoniczne ścieżki treści określają tożsamość pytań. | [Raport](https://github.com/lukaszkurczab/patternly-content/blob/618baae428d7d42e59834eaef322e57393d54c7d/docs/planning/AUD-12-REPORT.md) |

## 4. Epiki i etapy

`WP-E01–WP-E08` to **nowe grupy zarządcze tego planu**, nie zmiana identyfikatorów epików w repozytoriach. Istniejące `EPIC-05` i `EPIC-09` zachowują własne znaczenie. Status taska znajduje się tylko w jego tabeli; epik pokazuje cel i agregat.

| Epik | Status | Wynik | Zadania / zakres | Warunek wyjścia |
| --- | --- | --- | --- | --- |
| WP-E01 — profile, środowisko i bezpieczne testowanie | `partial` | Jeden spójny kontrakt startu, gościa, konta i wylogowania oraz powtarzalne testy iOS bez naruszenia istniejących danych. | PROFILE-01–06, PLAN-SYNC/B, CI-CONTRACT, AUD-FIXTURE/B3a, AUD-02, AUD-17. | Izolacja danych między kontami i gościem, offline logout, oba wybory adopcji oraz pełne E2E na jednym iPhonie 17; lokalne środowisko odebrane. |
| WP-E02 — niezawodna sesja i nawigacja | `blocking` | Nauka działa przez zapis, wznowienie, restart, zakończenie i review. | AUD-13, AUD-05; regresja zamkniętego AUD-03 tylko według wpływu. | Potwierdzona przyczyna naprawiona albo historyczny problem rozstrzygnięty dowodowo; pełna macierz iOS bez pozornych sukcesów. |
| WP-E03 — kanoniczne banki i kandydat treści | `partial` | Jeden odtwarzalny, aktualny kandydat 9 banków. | SIMP-05, AWS-02. | Ustalony stan legacy, exact manifest, decyzja Codex, aktualne readiness/admission i zgodny app lock. |
| WP-E04 — rzeczywiście działające Premium | `partial` | Opłacony dostęp prowadzi do pobrania, weryfikacji, aktywacji i uruchomienia właściwego pakietu. | ODK-119-GATE, AUD-04; później ODK-119-PROVIDER/ODK-085. | Pełny lokalny lifecycle i odmowy dostępu; realny zakup/restore osobno po freeze. |
| WP-E05 — recovery i operacje na danych | `blocking` | Odporny na awarie kontrakt mobile/backend, czytelne operacje użytkownika i bezpieczna obsługa spraw produkcyjnych. | AUD-08, AUD-11, OPS-PRODUCTION; regresja AUD-07/09 według wpływu. | Recovery po przerwaniu/retry/reissue/deletion bez utraty możliwości dokończenia; właściwe retry i semantyka UI. |
| WP-E06 — UI i siedem locale | `partial` | Czytelny interfejs zgodny z brandem, bez redundancji i niewytłumaczonych literałów. | AUD-14/15/16, ODK-117. | Wszystkie 7 locale i wszystkie testowalne stany; działające szablony prawne z konfiguracji, bez czekania na prawdziwe dane. |
| WP-E07 — konfiguracja i marketing | `partial` | Oddzielone kod, publiczne dane wydania i sekrety; gotowy marketing bez hosted admin/privacy intake. | ODK-116-A/B, WEB-03C; zachowany kontekst repo `EPIC-05`. | Technicznie gotowe zmienne i szablony; później prawdziwa konfiguracja oraz rzeczywisty deploy/rollback. |
| WP-E08 — odbiór, freeze i wydanie | `planned` | Jedna spójna ścieżka dowodowa od symulatora do publikacji i odbioru. | RELEASE-CONTRACT, AUD-06, FREEZE, ODK-082–087, ODK-119-PROVIDER, ODK-088, ANDROID-MANUAL, GO/NO-GO, PUBLISH. | Referencyjne iOS przebadane; wymagane wejścia, decyzja PO, publikacja i odbiór. Android manual nie tworzy drugiego automatycznego gate. |
| EPIC-09 — dodatkowa ocena banków | `planned` | Skalibrowana model-based evaluation, z kontrolą kosztu. | 09-A–H, PO-09F. | Osobne wyniki jakościowe; brak zależności prowadzącej z EPIC-09 do freeze/GO bez nowej decyzji PO. |

### 4.1 Etapy i moment angażowania PO

| Etap | Wynik | Co może blokować | Co nie blokuje |
| --- | --- | --- | --- |
| 2. Domknięcie produktu | Implementacja i wszystkie dostępne testy lokalne/symulatorowe. | Potwierdzone defekty, brak fixture, niespójne kontrakty lub kandydat treści. | Prawdziwe dane prawne, fizyczny iPhone, test Androida, osobna zgoda PO na banki. |
| 3A. SIM-READY | AUD-06 potwierdza pełny zakres testowalny na symulatorze. PO otrzymuje prośbę o iPhone. | Braki funkcji lub dowodów możliwych do zebrania lokalnie. | Dowody z definicji wymagające realnego providera lub urządzenia. |
| 3B. Przygotowanie wydania i FREEZE | Rzeczywiste wartości konfiguracji, wymagany web, czyste SHA, przypięty build iOS i manifest. | Brak rzeczywistych wejść publikacyjnych albo regresja po ich wprowadzeniu. | Brak ręcznego Androida; wyniki providerów, które mają powstać dopiero po freeze. |
| 4. Realni providerzy | ODK-082–087 na tym samym kandydacie. | Rzeczywisty brak dostępu lub wymaganego urządzenia, nie hipotetyczny PO-PROVIDER. | Drugie wykonanie tego samego dowodu jako ODK-119 i ODK-085. |
| 5. Fizyczny iPhone | ODK-088: jedna końcowa macierz, także urządzeniowe dowody dostępności. | Krytyczne defekty kandydata lub brak wymaganych dowodów. | Powtórzenie całego lokalnego audytu bez nowego powodu. |
| 6. GO/NO-GO | Decyzja PO o dokładnym przebadanym kandydacie. | Niespełnione wymagania wydania, brak cen/decyzji PO lub aktualnych dowodów. | EPIC-09 i brak zdublowanego Android E2E. |
| 7. Publikacja i odbiór | Autoryzowana dystrybucja zatwierdzonego artefaktu i sprawdzenie działania po publikacji. | Brak GO, uprawnienia do sklepu lub niezgodna tożsamość artefaktu. | Ręczny Android jako warunek referencyjnego iOS. |

`SIM-READY` jest nowym kamieniem milowym odbioru lokalnego, nie drugim freeze i nie obietnicą gotowości do publicznej sprzedaży.

## 5. Rejestr zadań

### 5.1 Zadania PO — tylko rzeczywiste wejścia właściciela

| ID | Status / dostępność | Zadanie PO | Potrzebne przed | Efekt / data / dowód | Kontrakt |
| --- | --- | --- | --- | --- | --- |
| PO-116 | `planned` / READY | Przygotować prawdziwe dane operatora/administratora, kontakty i wymagane oświadczenia/dane właściciela do wydania. Dostarczyć wartości do uzgodnionych zmiennych, nie teksty zaszyte w kodzie. | Produkcyjne ODK-116-B i publikacja; nie ODK-116-A, implementacja ani SIM-READY. | Zadanie PO potwierdzone 23.09; wartości niedostarczone. | Pakiet wejść (`ODK-116-INPUTS-PACKET.md` — brak w workspace); Codex ma rozdzielić dane prawne od technicznych SKU i sekretów. |
| PO-ACCESS | `unknown / needs evidence` / CHECK | Wykonać tylko niedelegowalne czynności, których Codex realnie nie może wykonać: np. zatwierdzenie uprawnienia lub uwierzytelnienie właściciela. | Konkretny zablokowany krok publikacji/providera, po diagnozie Codex. | Brak listy potwierdzonych braków; nie traktować jako globalnego blockera. | [ODK-119](active/ODK-119/ODK-119-WORKING-BRIEF.md), właściwy pakiet platformowy; zastępuje ogólny PO-PROVIDER. |
| PO-PRICE | `planned` / LATE | Przejrzeć rzeczywiste ceny lokalne i zaakceptować/skorygować odstępstwa od oferty 29,99 PLN. | Końcowe dane sprzedaży i GO. | Niedostarczone. | Sekcja 2.2. |
| PO-DEVICE | `planned` / WAIT: SIM-READY | Zapewnić fizyczny iPhone po potwierdzeniu działania produktu na symulatorze. Konta testowe przygotowuje Codex. | ODK-088; również wcześniej w etapie providerów, gdy dana atestacja rzeczywiście wymaga urządzenia. | Deklaracja dostarczenia po SIM-READY, 23.09; urządzenie jeszcze niedostarczone. | Pakiet ODK-088 do przygotowania po freeze. |
| PO-09F | `planned` / LATE | Ustalić maksymalny koszt pełnego płatnego runu EPIC-09 po pilocie. | Płatne skalowanie 09-F/09-G, nie release. | Brak ustalonego budżetu. | [Specyfikacja EPIC-09](https://github.com/lukaszkurczab/patternly-content/blob/618baae428d7d42e59834eaef322e57393d54c7d/docs/planning/EPIC-09-MODEL-BASED-EVALUATION-DRAFT.md). |
| PO-GO | `planned` / LATE | Podjąć GO/NO-GO dla dokładnego kandydata i manifestu evidence. | Publiczne wydanie. | Brak decyzji. | Pakiet GO/NO-GO po ODK-088. |

Nie tworzyć zadań PO na zatwierdzanie exact candidate, rubryki banków, zakładanie każdego konta testowego lub wybór protokołu recovery. Dawne PO-09B zastępuje decyzja Codex w 09-B/C; ograniczenie kosztów PO-09F pozostaje. Techniczne SKU/entitlementy Codex ustala zgodnie z ofertą i rzeczywistą konfiguracją platform; brak uprawnień zgłasza precyzyjnie przez PO-ACCESS, bez wymyślania identyfikatorów udających istniejące produkty.

### 5.2 Zadania aplikacyjne, środowiskowe i contentowe

Właścicielem wykonania jest Codex. `AUD-FIXTURE`, `PLAN-SYNC` i podziały kroków oznaczone poniżej są nowe; istniejące ID nie są renumerowane.

| ID / epik | Status / dostępność | Najbliższy wynik i zależności | Warunek zamknięcia / bramka | Kontrakt i raport |
| --- | --- | --- | --- | --- |
| PLAN-SYNC / E01 | `partial` / CHECK: AWS-02, SIMP-05 | A — wersjonowanie planu i inventory zakończone; B1 — trwałe linki do planu w backend/content/web zakończone; B2 — evidence, unknowns i właściciele dalszych kontraktów zapisani. SIMP-05 pozostaje unknown; candidate approval/readiness reconciliation należy do AWS-02. | AC dokumentacyjny B2 spełniony; całe PLAN-SYNC pozostaje partial do rozstrzygnięcia kontraktu konsumentów AWS-02 i uzyskania dowodu SIMP-05 lub ograniczonego taska implementacyjnego. Bez zgadywania mapy ODK-082–087. | [Raport A](active/PLAN-SYNC/A-REPORT.md), [raport B1](active/PLAN-SYNC/B1-REPORT.md), [raport B2](active/PLAN-SYNC/B2-REPORT.md); historyczny pakiet AUD pozostaje niedostępny. |
| CI-CONTRACT / E01/E08 | `partial` / WAIT: AWS-02/CANDIDATE dla A2b | A1 — jawny testowy profil smoke dla clean prebuild wykonany; A2a — źródłowe build/scoring 9 tracków zastąpiły brakujące komendy; A2b — wdrożyć rzeczywiste bramki candidate readiness, review packets i manual release, bez pozorowania admission; A3 — rozdzielić historyczny release lock od exact SHA bieżącego buildera w app QA; B — włączyć testy kandydata do obowiązkowej bramki; C — uruchomić właściwy etap dla jawnych czterech SHA. A3 wymaga rozstrzygnięcia źródła SHA. A2b pozostaje otwarte: kontrola `draft_not_admitted` nie zastępuje rzeczywistych readiness/review i manual release. Nie mylić naprawy A1 z zielonym całym CI. | Po A2b nieistniejące komendy nie występują w workflow; celowo uszkodzony manifest daje FAIL; końcowa agregacja `continue-on-error` egzekwuje FAIL. C do SIM-READY, ponowny przebieg dla wydania do FREEZE. | [Przegląd, §3](PATTERNLY-REPO-PLAN-ADDITIONS.md#add-ci-contract--zgodność-pipelineu-z-rzeczywistymi-komendami-repo); [raport A1](active/CI-CONTRACT/A1-REPORT.md); [raport A2a](active/CI-CONTRACT/A2a-REPORT.md); [diagnoza A2b](active/CI-CONTRACT/A2b-DIAGNOSIS.md); raport i QA kolejnych slice. |
| AUD-FIXTURE / E01 | `partial` / B3a done; pozostały zakres w PROFILE-05/06 | B3a daje izolowany backendowy fixture postępu i cleanup po ID. Oracle B1/B2 powstał dla syntetycznego stanu sprzed profili; jego kod jest do usunięcia w PROFILE-05, a raporty pozostają historycznym dowodem. Nie budować osobnego środowiska dla tej ścieżki. | Powtarzalne testy realnych stanów gościa i konta zgodnie z PROFILE-01–06; backend B3a pozostaje przydatny. SIM-READY. | [Raport A](active/AUD-FIXTURE/A-REPORT.md), [B1](active/AUD-FIXTURE/B1-REPORT.md), [B2a](active/AUD-FIXTURE/B2a-REPORT.md), [B2b](active/AUD-FIXTURE/B2b-REPORT.md), [B3a](active/AUD-FIXTURE/B3a-REPORT.md); historia, nie aktywna bramka legacy ownera. |
| PROFILE-REDESIGN / E01 | `planned` / READY: PROFILE-01 | PROFILE-01 — kontrakt stanów i dostępu; PROFILE-02 — jeden gość i izolacja kont; PROFILE-03 — wylogowanie offline z zachowaniem danych konta; PROFILE-04 — oba trwałe wybory adopcji; PROFILE-05 — usunięcie testowej ścieżki starego ownera; PROFILE-06 — odbiór na jednym iPhonie 17. Zależności i kryteria w §6.1. | Start, restart, zmiana konta i wylogowanie nie ujawniają cudzych danych; pending zapis wznawia się tylko po logowaniu na to samo konto; oba wybory gościa przeżywają przerwanie. SIM-READY. | Decyzja PO 24.09 w §2.3; aktualny kod `AccountSessionProvider`, `profileStorageRouter`, `accountDataService`, `RootNavigator` i testy adopcji; raport i QA każdego slice. |
| AUD-02 / E01 | `partial` / READY: pozostały zakres lokalny | Raportowany local baseline obejmuje build i lokalne bramki, ale driver-form values i RC session flow nie mają odbioru; [diagnoza obecnego kodu i flow](active/AUD-02/LOCAL-FLOW-DIAGNOSIS.md) potwierdza historyczne M3/M4 dla 10 pytań i obu feedbacków; kontynuować na izolowanym fixture i przypiąć aktualny build do source SHA. Aktualny exact candidate/admission kierować do AWS-02. Nie wymaga FREEZE ani realnych sklepów. | Odbiór lokalnego flow i manifest/preflight dla 9 tracków. Historyczny test 8 tracków nie pokrywa 9. Wszystkie release-only dowody wydzielone do ODK-082–087. SIM-READY. | Pakiet AUD (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace), [raport AUD-02](active/AUD-02/REPORT.md). |
| AUD-17 / E01 | `blocking` / WAIT: PROFILE-02–04 | Zastąpić historyczny scenariusz owner-mismatch pełnym E2E rzeczywistych stanów: guest write/restart, adopcja transfer/reset, logout offline, restart i powrót tego samego konta oraz odmowa innemu kontu. Zachować poprawkę kluczy jako lokalny baseline. | Dowód braku mieszania profili i utraty pending postępu; nie zamykać na Account Entry ani samym buildzie. SIM-READY. | [Raport AUD-17](active/AUD-17/REPORT.md) jest historyczny; nowy raport i QA zgodny z PROFILE-06. |
| AUD-13 / E02 | `blocking` / WAIT: fixture i bezpieczne wejście ownera | Zebrać bezpieczną diagnostykę journal/timer i odtworzyć błąd piątej odpowiedzi/cold restart. Użyć istniejącego guided flow dopiero na właściwym fixture. Naprawić potwierdzoną przyczynę. | Zapis kolejnych odpowiedzi, resume/restart/result/review; zachowane dane diagnostyczne. Gdy błąd nie wystąpi, ograniczona reprodukcja i niezależne rozstrzygnięcie historycznego defektu, nie „brak logów = PASS”. SIM-READY. | Pakiet AUD (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace), [raport AUD-13](active/AUD-13/REPORT.md). |
| AUD-05 / E02 | `blocking` / WAIT: AUD-13 i fixture | Trzy runnery na iOS: Back/swipe, cancel/leave/resume z odpowiedzią i timerem, finish/result, rapid tap, unavailable/direct entry. Android Back przeniesiony do ręcznej macierzy. | Wszystkie wymagane iOS ścieżki i stany mają dowód. Brak Android E2E nie pozostawia taska otwartego. SIM-READY. | Pakiet AUD (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace), [raport AUD-05](active/AUD-05/REPORT.md). |
| AUD-08 / E05 | `blocking` / READY: kontrakt | A — Codex uzgadnia wspólny mobile/backend kontrakt zakończenia recovery, operation ID, ACK, retencji i współbieżności. B — implementacja po wymaganym briefingu i QA. Nie czeka na decyzję techniczną PO. | Retry po awarii, restart klienta, utracona odpowiedź, revoke/mint failure, współbieżne reissue/deletion i ochrona tokenu; pełny kontrakt, nie backend-only patch. SIM-READY. | Pakiet AUD (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace), [raport AUD-08](https://github.com/lukaszkurczab/patternly-backend/blob/e3c3fc6570faa13a802f47a19e17005b0c1eecd1/docs/active/AUD-08/REPORT.md). |
| AUD-11 / E05 | `blocking` / WAIT: fixture właściwego ekranu | Odbiór już wdrożonego retry/układu: przed/po, PL/EN, duży tekst, neutralna hierarchia usuwania, limit, anulowanie hold i dostępna semantyka. | Wymagane dowody symulatorowe; urządzeniowy VoiceOver, jeśli potrzebny, jako dokładny case ODK-088, nie fikcyjny PASS. SIM-READY. | Pakiet AUD (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace), [raport AUD-11](active/AUD-11/REPORT.md). |
| AUD-14 / E06 | `blocking` / WAIT: bezpieczny dostęp do ekranu | Odtworzyć Dynamic Type przed zmianą komponentów. Potwierdzić możliwość wykonania Maestro i odróżnić błąd środowiska od błędu UI. Nie powielać historycznych restartów usług. | Reprodukcja i poprawka albo dowodowe rozstrzygnięcie; layout i dostępna semantyka bez clippingu. SIM-READY. | Pakiet AUD (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace), [raport AUD-14](active/AUD-14/REPORT.md). |
| AUD-15 / E06 | `blocking` / WAIT: answer/review fixture | Zweryfikować usunięte badge: przed/po, PL/EN, standard/duży tekst, single/multi, wszystkie stany odpowiedzi i review. Nie dopisywać testów do chronionego profilu. | Wyróżnienie kart i semantyka poprawności zachowane; rzeczywiste screenshoty stanów. SIM-READY. | Pakiet AUD (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace), [raport AUD-15](active/AUD-15/REPORT.md). |
| AUD-16 / E06 | `planned` / READY | Skrócić zgodę Create account do maksymalnie 2 linii w standardowym układzie, zachowując znaczenie, oba linki i walidację. | PL/EN, dostępność i checkbox. Przy dużym tekście dopuszczalny wzrost wysokości zamiast obcięcia; pozostałe locale odbiera ODK-117. SIM-READY. | Pakiet AUD (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace). |
| SIMP-05 / E03 | `unknown / needs evidence` / CHECK w PLAN-SYNC | Odczytać stan kanonicznego schema/buildera i adapterów. Jeśli zadanie zakończono — wpisać dowód i przenieść do baseline’u. Jeśli aktywne legacy pozostało — wykonać brakujący, ograniczony zakres. | Brak aktywnych równoległych formatów i adapterów, odtwarzalne kontrakty. Wymagane dla SIM-READY, jeśli luka dotyczy aktualnego runtime; zawsze przed EPIC-09. | Właściwy kontrakt wskazać po odczycie repo; [specyfikacja EPIC-09](https://github.com/lukaszkurczab/patternly-content/blob/618baae428d7d42e59834eaef322e57393d54c7d/docs/planning/EPIC-09-MODEL-BASED-EVALUATION-DRAFT.md) jest tylko źródłem znanej zależności. |
| AWS-02 / E03 | `partial` / READY: CANDIDATE | **Podział wykonawczy:** CANDIDATE — Codex weryfikuje draft, podejmuje delegowaną akceptację exact manifestu i zapisuje readiness/migration. ADMISSION — publishing/runtime i app lock po gotowości wymaganych konsumentów. | 9 zgodnych artefaktów, hashe, aktualna decyzja i QA, konsumpcja właściwego kandydata. Brak oczekiwania na PO; brak zapożyczonego ACC-02. SIM-READY. | [Pakiet AWS](https://github.com/lukaszkurczab/patternly-content/blob/618baae428d7d42e59834eaef322e57393d54c7d/docs/planning/AWS-NEW-CANDIDATE-PACKET.md), [raport](https://github.com/lukaszkurczab/patternly-content/blob/618baae428d7d42e59834eaef322e57393d54c7d/reports/candidate-reconciliation/AWS-02-REPORT.md), [draft](https://github.com/lukaszkurczab/patternly-content/blob/618baae428d7d42e59834eaef322e57393d54c7d/reports/candidate-reconciliation/AWS-02-DRAFT/candidate/manifest.json). |
| ODK-119-GATE / E04 | `partial` / READY: A | **Podział wykonawczy:** A — lokalny kontrakt i reguła dostępu do nowej sesji/download. B — wszystkie rzeczywiste wejścia po AUD-04-B/C/D. Bez dodatkowych dni offline; realny provider osobno. | Active/grace/odmowy/offline, expiry/refund/hold i ponowny dostęp; jeden właściciel reguły, brak bypassów. SIM-READY. | [Kontrakt ODK-119](active/ODK-119/ODK-119-WORKING-BRIEF.md); powiązane raporty w 9.2. |
| AUD-04 / E04 | `partial` / WAIT: AWS-02/CANDIDATE + ODK-119-GATE/A | A pozostaje ukończone kontraktowo. B — backend admission/download; C — mobile verify/atomic activate; D — discovery/preparation. Każdy krok oddzielnie. Nie czeka na końcowy globalny release gate. | Prawdziwy package lifecycle, integralność i atomowość, poprawne błędy i retencja historii. Wspólne testy z GATE/B bez duplikacji entitlementu. SIM-READY. | Pakiet AUD (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace), [raport AUD-04](active/AUD-04/REPORT.md). |
| ODK-117 / E06 | `partial` / READY: A0 | A0 — mapa wszystkich tekstów i wyjątków; A1–A5 według istniejącego pakietu, każdy osobno. **Podział B:** B-CONTRACT — tłumaczenia szablonów i zmiennych po ODK-116-A; B-VALUES — kontrola rzeczywistych wartości po ODK-116-B. | Siedem locale, pełne pochodzenie zwykłych tekstów, brak cichych fallbacków i clippingu. A + B-CONTRACT do SIM-READY; B-VALUES do FREEZE. | Pakiet ODK-117 (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace), [raport](ODK-117-REPORT.md). |

### 5.3 Konfiguracja, web i wydanie

| ID / epik | Status / dostępność | Najbliższy wynik i zależności | Warunek zamknięcia / bramka | Kontrakt i raport |
| --- | --- | --- | --- | --- |
| ODK-116-A / E07 | `partial` — A1 done, dalsza schema READY | [A1: walidacja platformowa](active/ODK-116/A1-REPORT.md) ukończona; [A2: mapa repozytoriów i kontrakt](active/ODK-116/A2-CROSS-REPO-CONTRACT.md) przygotowane. **Dalszy podział ODK-116:** spisać istniejące źródła konfiguracji, schema zmiennych, walidację i jawne wartości testowe. Osobno publiczne dane, techniczne ID i sekrety. Zintegrować mobile/backend/web bez prawdziwych danych PO; w tym platformowo rozdzielić walidację builda iOS i Androida (dawne ADD-IOS-CONFIG). | Kod i szablony działają bez hardcode’u operatora; brak wartości produkcyjnych nie blokuje dev bootstrap. Niekompletna konfiguracja release jest wykrywana. Kompletny iOS przechodzi bez pól Androida, brak pola iOS failuje, a jawny Android nadal wymaga własnych pól i providerów. SIM-READY. | Pakiet wejść ODK-116 (`ODK-116-INPUTS-PACKET.md` — brak w workspace) do aktualizacji; wymagania w 6.2. |
| OPS-PRODUCTION / E05/E07 | `unknown / needs evidence` / READY: A po PLAN-SYNC | A — ustalić istniejący kanał obsługi rzeczywistych spraw lub kontrakt brakującego; B — tylko gdy potrzebny, zaimplementować autoryzowaną kolejkę i akcje bez hosted admina; C — potwierdzić dostęp operacyjny w docelowym środowisku. | A/B: synthetic request → autoryzowana obsługa → odpowiedź i audyt, z odmową nieuprawnionego dostępu oraz retry, do SIM-READY. C: kontrolowany dowód produkcyjny przed GO. Istniejący zweryfikowany kanał zamyka B bez nowego panelu. | [Przegląd, §3](PATTERNLY-REPO-PLAN-ADDITIONS.md#add-ops-production--droga-od-zgłoszenia-użytkownika-do-działania-operatora); raport i QA. |
| RELEASE-CONTRACT / E08 | `planned` / READY po PLAN-SYNC | A — rozdzielić lokalny, FREEZE i GO w istniejącym release gate; B — powiązać cztery SHA, app/content lock, build iOS, konfigurację oraz integralność evidence w jednym manifeście; C — określić i wdrożyć politykę OTA. | Brak provider/device evidence nie obala FREEZE; brak fizycznego ODK-088 obala GO. Zmiana badanego backendu, buildu, konfiguracji lub OTA wymaga rewizji/oceny wpływu; rzeczywiście uruchomiony artefakt jest identyfikowalny. A przed SIM-READY, B/C przed FREEZE. | [Przegląd, §3](PATTERNLY-REPO-PLAN-ADDITIONS.md#add-release-contract--bramki-etapowe-i-tożsamość-przebadanego-wydania); raport i QA każdego slice. |
| ODK-116-B / E07 | `planned` / WAIT: PO-116 + rzeczywista konfiguracja platform | Wprowadzić prawdziwe wartości do przygotowanych zmiennych. Codex uzupełnia techniczne ID z rzeczywistych platform; PO tylko swoje dane/niedelegowalne czynności. Zweryfikować config przed publikacją. | Kompletna konfiguracja i jej identyfikator bez ujawniania sekretów. Nie czeka na zdalny wynik WEB-03C; ten testuje linki po deployu. FREEZE. | Pakiet wejść ODK-116 (`ODK-116-INPUTS-PACKET.md` — brak w workspace). |
| WEB-03C / E07 | `partial` / READY: PREP; WAIT: ODK-116-B dla PUBLISH | **Podział wykonawczy:** PREP — katalog 9 tracków, konfiguracja i read-only informacje, odtworzenie build/preparation oraz sprawdzenie realnego dostępu. PUBLISH — po rzeczywistych danych deploy zatwierdzonego marketingu i rollback. | PREP technicznie do SIM-READY; produkcyjny/publiczny wynik do FREEZE. Zdalne `/`, brak hosted `/admin*` i `/privacy-request*`, prawdziwe linki i raport. | [Pakiet EPIC-05](https://github.com/lukaszkurczab/patternly-web/blob/b389009b38e80a9919337f7f9bd13dc76bdca2b7/docs/EPIC-05-WORKING-PACKET.md), [preparation](https://github.com/lukaszkurczab/patternly-web/blob/b389009b38e80a9919337f7f9bd13dc76bdca2b7/docs/WEB-03C-PREPARATION.md). |
| AUD-06 / E08 | `blocking` / WAIT: lokalne taski | Przekrojowy odbiór 4 repo, 9 tracków, 7 locale i pełnych kluczowych flow. Po uzupełnieniu danych wydania tylko odpowiedni delta-retest, nie audyt od zera. | Wszystkie krytyczne ścieżki testowalne lokalnie mają dowody; jawna lista późniejszych provider/device cases. Wynik SIM-READY; aktualność dowodów sprawdzana przed FREEZE. | Pakiet AUD (`PATTERNLY-AUDIT-TASKS-2026-09-22.md` — brak w workspace); macierz w audycie, nie w drugim planie. |
| FREEZE / E08 | `blocking` / WAIT: SIM-READY + konfiguracja release + WEB PUBLISH | Przypiąć cztery czyste SHA, wersję kandydata contentu, app lock, konfigurację i build iOS. Sprawdzić delta-retest po wartościach produkcyjnych. | Jeden niezmienny kandydat. Nie wymaga uprzedniego realnego ODK-085/ODK-088 ani Android E2E. | Pakiet freeze do przygotowania; pełne AC w 7.2. |
| ODK-082–087 / E08 | `unknown / needs evidence` / CHECK: pakiety, potem WAIT: FREEZE | Przed wykonaniem przypisać każde istniejące ID do jego kontraktu, wejść, evidence i właściciela operacyjnego. Codex przygotowuje konta testowe; konkretne czynności dostępowe właściciela kierować do PO-ACCESS. | Przenośne dowody providerów dla tych samych SHA/build/config. Tylko ODK-085 ma znany wspólny dowód z ODK-119-PROVIDER; pozostałe ID pozostają bez mapowania do czasu odnalezienia źródeł. PROVIDER. | Raport B2 zapisuje unknown per ID; Ograniczony PLAN-SYNC follow-up lokalizuje pakiety albo tworzy wąskie zadania kontraktowe bez dublowania bramek operacyjnych. |
| ODK-119-PROVIDER / E04/E08 | `planned` / WAIT: FREEZE + testowe konto/SKU | Wykonać razem z ODK-085, w jednym przebiegu dowodowym: active, grace, expiry, refund/revoke, hold, webhook ordering oraz przewidziane purchase/restore. Stany niedostępne u danego providera rozstrzygnąć jawnie w kontrakcie, nie fabrykować. | Realne iOS/RevenueCat evidence; jedna macierz, nie osobne zdublowane runy. Bez obowiązku Google/Android jako warunku iOS. PROVIDER. | [Kontrakt ODK-119](active/ODK-119/ODK-119-WORKING-BRIEF.md). |
| ODK-088 / E08 | `planned` / WAIT: providerzy + PO-DEVICE | Finalna macierz na fizycznym iPhonie, wraz z konkretnymi device-only przypadkami dostępności i zachowania runtime. | Ten sam zamrożony kandydat; brak krytycznych blockerów. Urządzenie może być potrzebne już do niektórych providerów, lecz finalny odbiór pozostaje po nich. DEVICE. | Pakiet do przygotowania po freeze. |
| ANDROID-MANUAL / E08 | `planned` / LATE po działającym iOS | **Nowe:** Codex przygotowuje z macierzy iOS krótki zestaw ręczny, z Android Back, stanami sesji i istotnymi różnicami platformowymi. PO/tester wykonuje później. | Zapisać rzeczywisty build Androida, wynik i defekty. Brak wyniku nie blokuje wspólnych bramek odblokowanych przez iOS. NON-GATING. | Ręczna część istniejącej macierzy odbioru; bez osobnego automatycznego pipeline’u. |
| PUBLISH / E08 | `planned` / READY: przygotowanie przed GO; WAIT: PO-GO i autoryzacja dla wykonania | Przygotować operację store i sygnały zatrzymania przed GO. Po GO wysłać dokładny zatwierdzony artefakt i odebrać status sklepu oraz kontrolowane działanie backendu/contentu/config/OTA po publikacji. | Zapisane ID artefaktu, status dystrybucji, konfiguracja obsługująca wydanie, wyniki odbioru i środki reakcji. Bez obietnicy cofnięcia instalacji; Android osobno. | Raport publikacji i odbioru; [przegląd, §3](PATTERNLY-REPO-PLAN-ADDITIONS.md#add-publish--wykonanie-zatwierdzonego-wydania-i-odbiór-po-publikacji). |
| GO/NO-GO / E08 | `planned` / WAIT: komplet release evidence + PO-PRICE + PO-GO | Przygotować manifest końcowy, ujawnić pozostałe ograniczenia i status Android manual, przekazać PO konkretny kandydat. | Jawna decyzja PO; brak utożsamiania autonomicznej akceptacji contentu ze zgodą na wydanie aplikacji. GO. | Pakiet decyzyjny do przygotowania po ODK-088. |

### 5.4 Opcjonalny EPIC-09

| ID | Status / dostępność | Następny krok | Bramka / kontrakt |
| --- | --- | --- | --- |
| 09-A | `blocking` / WAIT: aktualny AWS-02 baseline + rozstrzygnięty SIMP-05 | Powtórzyć inventory/verifier właściwego baseline’u, zero nieprzypisanych pytań. Historycznego `EVIDENCE_VALUE` nie maskować i nie traktować jako zgody na nowy candidate. | NON-GATING; [diagnoza](https://github.com/lukaszkurczab/patternly-content/blob/618baae428d7d42e59834eaef322e57393d54c7d/reports/model-evaluation/09-a-diagnostic.md), [specyfikacja](https://github.com/lukaszkurczab/patternly-content/blob/618baae428d7d42e59834eaef322e57393d54c7d/docs/planning/EPIC-09-MODEL-BASED-EVALUATION-DRAFT.md). |
| 09-B–09-H | `planned` / WAIT: poprzedni krok | Rubryka → kalibracja → piloty → koszt → scale gate → dziewięć banków → selektywny retest. Codex decyduje o rubryce i znaczeniu PASS/FAIL, dokumentując przykłady i QA. Pełny płatny run po PO-09F. | NON-GATING; [specyfikacja EPIC-09](https://github.com/lukaszkurczab/patternly-content/blob/618baae428d7d42e59834eaef322e57393d54c7d/docs/planning/EPIC-09-MODEL-BASED-EVALUATION-DRAFT.md) wymaga uzgodnienia delegacji. |

Potwierdzone błędy treści znalezione gdziekolwiek nie są automatycznie odroczone tylko dlatego, że EPIC-09 jest opcjonalne. Codex ocenia wpływ i wykonuje właściwy task korekty w ramach delegacji.

## 6. Kontrakty odblokowujące — obowiązkowe przed implementacją

### 6.1 PROFILE-REDESIGN: start, własność danych i testy na jednym iPhonie 17

Decyzja PO z 24.09 zastępuje aktywny test syntetycznego `legacy_owner`. Istniejące wybory transfer/reset i trwałe znaczniki operacji są punktem wyjścia, nie zadaniem do napisania ponownie. Obecny kod nie odróżnia pierwszego startu od powrotu po wylogowaniu, potrafi tworzyć kolejnych gości i może zatrzymać wylogowanie offline przy pending sync. Testy B1/B2 oraz plan B3b nie są bramką nowego kontraktu. Historyczne raporty zachowują prawdziwy przebieg prac; backendowy B3a pozostaje niezależnym fixture.

| Slice / status | Zakres i zależności | Akceptacja i dowód |
| --- | --- | --- |
| PROFILE-01 / `done` | `A` zamknął [kontrakt](active/PROFILE-01/CONTRACT.md) i [raport QA](active/PROFILE-01/A-REPORT.md); `B` dostarczył [granicę storage](active/PROFILE-01/B-REPORT.md); `C` podłączył [root startup/Auth przed repozytoriami](active/PROFILE-01/C-REPORT.md); `D` dodał [trwałą lokalną blokadę, logout offline i jawne pending revoke](active/PROFILE-01/D-REPORT.md) z dowodem iOS/Maestro. Zdalne wykonanie revoke i pełne wznowienie danych pozostają w PROFILE-03. | Konto→jego dane tylko po zgodnym Auth, guest→jego postęp, świeża instalacja→welcome, logout/restart→login; brak Auth nie otwiera profilu konta. Lokalny offline logout działa bez deklarowania zdalnego sukcesu. |
| PROFILE-02 / `partial` — A done, B WAIT: decyzja PO | [A: router ponownie używa jednego znanego Gościa](active/PROFILE-02/A-REPORT.md), zachowuje istniejące zakresy i odmawia niejawnego wyboru przy wielu historycznych Gościach. [Kontrakt B/C](active/PROFILE-02/CONTRACT.md): odzyskanie właściwego profilu po decyzji PO, a potem końcowa macierz izolacji. | Testy routera dowodzą ciągłości ID/danych i izolacji Guest/A/B; Maestro potwierdza Home po restarcie, ale nie identyfikuje profilu ani danych. QA: PASS WITH GAPS. |
| PROFILE-03 / `planned`, WAIT: PROFILE-01/02 | Przeprojektować wylogowanie tak, by od razu zamykało lokalny dostęp również offline, zachowując postęp, sesje nauki, outbox i niezbędne markery wznowienia pod ID konta. Usunąć lokalne poświadczenia, dostęp sesyjny i zależne cache; oddzielić od trwałego usunięcia konta. Obszary: `accountDataService`, `accountDataRepository`, `AccountSessionProvider`, lifecycle i ewentualnie kontrakt backendu. | Wylogowanie offline kończy się loginem; po restarcie dane konta są niedostępne bez jego Auth. To samo konto odzyskuje dane i wznawia sync, inne konto nie widzi ich ani nie wysyła starego outboxa. Przerwanie operacji, pending journal/materialization i zdalne revoke mają testy odmowy lub wznowienia bez fałszywego sukcesu. |
| PROFILE-04 / `planned`, WAIT: PROFILE-02/03 | Dostosować istniejący wybór adopcji przy **zakładaniu** konta: transfer do konta i sync albo porzucenie guest i start od zera. Zachować trwałe znaczniki po zatwierdzeniu decyzji i usunąć dawną kopię guest dopiero po bezpiecznym zakończeniu. Obszary: `AccountEntryScreen`, `accountDataService`, guest installation/adoption i testy lifecycle. Logowanie do istniejącego konta nie domyśla się transferu. | Oba wybory, restart w każdym krytycznym kroku, konflikt i offline retry dają wynik zgodny z zatwierdzoną decyzją; reset nigdy nie synchronizuje porzuconego postępu, transfer nie dubluje go. |
| PROFILE-05 / `planned`, WAIT: PROFILE-02–04 | Usunąć kod oracle B1/B2 wraz z UI smoke oraz martwymi testami/aliasami; zachować użyteczną blokadę równoczesnych przejść i backendowy test B3a. Niedokończony seed i plan B3b usunięto przy tej rewizji; raporty pozostają historyczne. | Brak aktywnej ścieżki `legacy_owner` w testowym/produkcyjnym przepływie startu; brak nieużywanych importów, kontroli UI i aliasów Metro. Targetowane testy i build smoke/release potwierdzają usunięcie. |
| PROFILE-06 / `planned`, WAIT: PROFILE-01–05 | Odbiór integracyjny iOS na jednym istniejącym iPhonie 17, z Maestro i izolowanymi kontami testowymi; bez globalnego resetu zachowanego Guest. Pokryć start/restart, guest, transfer/reset, logout offline, to samo i inne konto, częściowo odzyskany postęp oraz usunięcie konta. | Zapisane wyniki testów, screenshoty stanów UI i dowód izolacji po natywnym restarcie. Nie utożsamiać testu pamięciowego z dowodem urządzeniowym; niezależne QA i aktualizacja planu po każdym zamkniętym slice. SIM-READY. |

**Ocena planu przed implementacją:** zgodność 0,94; prostota 0,82; kontrola ryzyka 0,83; utrzymywalność 0,86; minimum **0,82**. Niezależny przegląd briefingu `gpt-6-luna/high` dał minimum **0,84** (spójność 0,91; prostota 0,87; ryzyko 0,84; utrzymywalność 0,89), z zastrzeżeniem, że lokalne wylogowanie offline nie dowodzi zdalnego unieważnienia poświadczeń. Każdy slice wymaga ponownej oceny dokładnego podejścia na aktualnym kodzie. Nie tworzyć dodatkowego symulatora dla starego fixture ani nie używać `clearState` jako skrótu do PASS.

### 6.2 ODK-116: zmienne zamiast twardo wpisanych danych

Nazwy kluczy i mechanizm dostarczania Codex ustala na podstawie istniejącej architektury. Poniższe kategorie są wymaganiami, nie twierdzeniem, że konkretny moduł już istnieje.

| Kategoria | Reguła |
| --- | --- |
| Publiczne wartości | Dane operatora/administratora, kontakt i zatwierdzone publiczne odnośniki występują jako typowane/zwalidowane wartości konfiguracji. Nazwa osoby, adres lub e-mail nie są rozsiane w źródłach ekranów ani tłumaczeń. |
| Szablony | Privacy Policy, Terms i odpowiednie UI korzystają z kanonicznych szablonów oraz jawnych zmiennych, we wszystkich siedmiu locale. Treść dokumentu i wartości interpolowane muszą mieć określone wersjonowanie. Nie tworzyć alternatywnego prawnego źródła prawdy na webie. |
| Środowisko testowe | Dopuszczalne są jawnie testowe dane spełniające schema. Nie przedstawiać ich jako danych prawdziwego wydawcy; nie publikować ich dla użytkowników. Brak produkcyjnych wartości nie ma blokować lokalnego logowania, nauki ani testów. |
| Sekrety | Klucze providerów, tokeny i dane uwierzytelniające poza publicznym repo i poza konfiguracją kliencką. Publiczny rekord konfiguracji nie może pełnić roli magazynu sekretów. |
| Dane platformowe | SKU, entitlement i inne ID odpowiadają rzeczywistym zasobom właściwego środowiska. Codex może je przygotować w ramach uprawnień i istniejącej oferty; wymagane czynności właściciela są osobnym, precyzyjnym wejściem. |
| Preflight wydania | Brak prawdziwego wymaganego pola lub obecność testowej konfiguracji ma dawać jawny FAIL przygotowania produkcyjnego. Nie ukrywać problemu przez usunięcie linku, pusty dokument lub fałszywy kontakt. |
| Freeze | Przypiąć wersję/fingerprint niesekretnej konfiguracji i bezpieczne odniesienia do wersji sekretów. Zmiana runtime configuration również podlega ocenie wpływu; zmiana danych nie zawsze wymaga rebuilda, ale nigdy nie może pozostawać poza manifestem. |

`ODK-117/B-CONTRACT` zależy od schema ODK-116-A, nie od danych PO. `ODK-117/B-VALUES` sprawdza rzeczywiste wartości przed release. Nie tłumaczyć nazw własnych ani nie wymyślać lokalnych danych wydawcy. Uzupełnienie danych może wymagać retestu layoutu i dokumentów, ale nie ponownego projektowania aplikacji.

### 6.2a PLAN-SYNC/A — zweryfikowany stan wejściowy (24.09.2026)

`done`: jedyny plan i raport źródłowy są wersjonowane w repo aplikacji; poprzednie lokalne ścieżki są symlinkami. [Raport A](active/PLAN-SYNC/A-REPORT.md) zawiera SHA, testy połączeń i luki. Nie jest to PASS dla `PLAN-SYNC/B`, `CI-CONTRACT` ani bramek wydania.

`done` (B1): aktywne pakiety backendu, contentu i webu wskazują bieżący plan przez publiczny adres repo aplikacji; historyczne raporty nie były przepisywane.

`partial`: lokalne AUD-02 pozostaje otwarte na driver forms i RC; exact candidate/admission należy do AWS-02. `SIMP-05` jest `unknown / needs evidence`: pakietu i raportu nie znaleziono, a źródła nadal wspominają legacy; trzeba sprawdzić aktywny consumer graph przed decyzją o implementacji. `ODK-082–087` nie mają pełnej mapy: wspólny dowód ODK-085/ODK-119-PROVIDER jest znany, a mapowanie pozostałych ID pozostaje `unknown / needs evidence`. `PO-ACCESS` pozostaje `unknown / needs evidence` bez konkretnej zablokowanej czynności.

`unknown / needs evidence` dla dalszych kontraktów: brak pięciu historycznych pakietów wskazanych w tej rewizji (`PATTERNLY-AUDIT-TASKS-2026-09-22.md`, `PATTERNLY-AUDIT-2026-09-22.md`, `ODK-116-INPUTS-PACKET.md`, `AUD-01-REPORT.md`, `IDENTITY-CUTOVER-2026-09-22.md`); wymagają odnalezienia albo wąskiego pakietu zastępczego z bieżących dowodów, a nie pozornego linku. Walidator candidate readiness nadal wymaga `humanApproval`; AWS-02 ustala i wdraża właściwy kontrakt delegowanej decyzji. Niespójne komendy CI są wejściem do `CI-CONTRACT/A`.

### 6.2a Uzupełnienia kontraktów z przeglądu repozytoriów

- `PLAN-SYNC` sprawdza zgodność reguł dokumentów, skryptów, schematów i CI oraz przypisuje lokalne wyniki do aktualnych commitów albo jawnego diffu. Dla aplikacji lokalny HEAD podczas scalenia to `488bdc17`, wobec `80ec9db` w przeglądzie; backend, content i web odpowiadają odczytanym SHA. Nie przenosić historycznych PASS na inny artefakt.
- `AWS-02` i `SIMP-05` weryfikują konsumentów delegowanej decyzji Codex, w tym readiness/release gate, oraz zgodność package lifecycle z rzeczywistym runtime. Nie fałszować pola `humanApproval` ani nie usuwać mechanizmu bez ustalenia konsumentów.
- `AUD-04` i `ODK-119-GATE` mają wskazać testy przerwanego downloadu, niezgodnego artefaktu, awarii aktywacji, zachowania sesji/historii, wygaśnięcia i powrotu dostępu. Najpierw porównać z istniejącymi AC; dopisać tylko brakujące case IDs.
- `AUD-06` sprawdza aktywny track, pauzę/ukończenie planu, zmianę strefy, odmowę powiadomień, retry/restart oraz konflikt goal/plan/package. Dowód dostarczenia na urządzeniu należy do `ODK-088`. `ODK-117` i `AUD-06` obejmują ograniczony przegląd pełnych ekranów i stanów brandu, hierarchii, redundancji, języka technicznego i pustych/błędnych/offline/Premium stanów.
- `PLAN-SYNC` zapisuje istniejący wspólny dowód ODK-085/ODK-119-PROVIDER oraz jawne braki mapowania ODK-082–084/086–087. Dalszy task lokalizuje ich kontrakty, wejścia i dowody oraz uzgadnia obsługę operatorską z `OPS-PRODUCTION`, bez dodatkowej równoległej bramki.

### 6.3 Rozcięcie zależności Premium / candidate / admission

```text
SIMP-05: dowód zakończenia albo konieczne domknięcie aktualnego formatu
    → AWS-02/CANDIDATE: dokładne artefakty + delegowana akceptacja + readiness

ODK-119-GATE/A: kanoniczna reguła i lokalny kontrakt dostępu
    + AWS-02/CANDIDATE
    → AUD-04-B → AUD-04-C → AUD-04-D
    → ODK-119-GATE/B: wszystkie rzeczywiste wejścia
    → AWS-02/ADMISSION: wymagane publishing/runtime evidence + app lock
    → AUD-06
```

To nowy podział wykonawczy, który PLAN-SYNC ma odwzorować w istniejących kontraktach. AUD-04 nie czeka na ukończone końcowe admission zależne od jego własnej implementacji. ODK-119-GATE/A nie czeka na package lifecycle, którego dopiero ma strzec. Globalny acceptance jest później; nie nadajemy go samym zbudowaniem artefaktów.

## 7. Bramki i macierz dowodów

### 7.1 SIM-READY — wszystko, co rzeczywiście można odebrać lokalnie

`SIM-READY` zapisuje się jako wynik AUD-06, nie jako nowe zadanie wdrożeniowe.

| Warunek | Wymagany wynik |
| --- | --- |
| Środowisko / profile | PLAN-SYNC, AUD-FIXTURE, AUD-02 i AUD-17 domknięte w zakresie lokalnym; brak zależności od danych lub urządzenia PO. |
| Nauka / Premium | AUD-13, AUD-05, AUD-04 i ODK-119-GATE lokalnie odebrane; regression check AUD-03 według wpływu. |
| Konto / dane | AUD-08 i AUD-11 odebrane lokalnie; zachowana aktualność dowodów AUD-07/09/10. |
| UI / locale | AUD-14, AUD-15 **i AUD-16** oraz ODK-117 A/B-CONTRACT są wymagane. Wszystkie siedem locale ma pokrycie, a dostępność device-only ma konkretne odwołania do ODK-088. |
| Content | AWS-02 z aktualnym lokalnym readiness/admission i app lock; stan SIMP-05 rozstrzygnięty, bez aktywnego legacy w bieżącym runtime. Brak oczekiwania na akceptację PO. |
| Konfiguracja / web | ODK-116-A, OPS-PRODUCTION A/B i WEB-03C/PREP technicznie gotowe. Testowe wartości jawne; brak danych prawnych nie jest defektem aplikacji. |
| Odbiór przekrojowy | CI-CONTRACT/A–C i RELEASE-CONTRACT/A odebrane; macierz 4 repo, 9 tracków i 7 locale; każdy wymagany lokalny case ma evidence albo jawne, uzasadnione rozstrzygnięcie zakresu. Nie oznaczać niewykonanej lokalnej ścieżki jako PASS. |

Macierz zapisuje co najmniej: flow, repo, track/rodzinę, locale, środowisko, SHA/candidate/build/config, oczekiwany wynik, wynik faktyczny, dowód, pozostały blocker i następny właściciel. Dobór reprezentatywnych stanów ma wynikać z kontraktów i ryzyka, nie z pozornego pełnego iloczynu wszystkich kombinacji. Dziewięć tracków i wszystkie locale muszą być rzeczywiście uwzględnione.

Po SIM-READY zgłosić PO gotowość do dostarczenia iPhone’a i dokładną listę jeszcze brakujących danych publikacyjnych. Nie wysyłać ogólnego żądania „przygotuj providerów”, jeśli Codex może sam skonfigurować testowe zasoby.

### 7.2 FREEZE — formalny kandydat wydania

| Warunek | Wymagany wynik |
| --- | --- |
| Aktualny produkt | SIM-READY nadal aktualne; otwarte AUD-15/16/17 nie mogą zniknąć z listy zależności przez pominięcie ich ID. |
| Dane wydania | ODK-116-B, ODK-117/B-VALUES, właściwe wartości platformowe i WEB-03C/PUBLISH. Żadnych fikcyjnych publicznych danych. |
| Delta po konfiguracji | Retest zmienionych dokumentów, linków, locale, konfiguracji i innych dotkniętych ścieżek. Brak automatycznego cofania całej implementacji. |
| Identyfikacja | RELEASE-CONTRACT/B–C: cztery czyste SHA, dokładny manifest 9 banków, app lock, build iOS, fingerprint niesekretnej konfiguracji, polityka OTA i integralne referencje dowodów. |
| Produkcyjna konfiguracja | Brak debug App Check i emulator hostów w artefakcie produkcyjnym; odpowiednie lokalne/kontraktowe bramki aktualnego kandydata są zielone. |
| Brak cyklu | AUD-02 obejmuje lokalny preflight, nie post-freeze release gate. FREEZE nie wymaga uprzednio ODK-082–087, ODK-119-PROVIDER, ODK-088 ani Android manual. |

Wartości prawne nie blokują SIM-READY, ale zamrożenie finalnej konfiguracji publikacyjnej nie może udawać ich kompletności. Jeżeli dane są dostarczane zdalnie, również przypina się ich wersję; aktualizacja po freeze wymaga rewizji manifestu i retestu wpływu.

### 7.3 Providerzy, urządzenie i GO

```text
AUD-06 / SIM-READY
    ├─ PO zapewnia iPhone (bez obowiązku przed SIM-READY)
    └─ realne dane → ODK-116-B → ODK-117/B-VALUES → WEB-03C/PUBLISH
         → delta-retest → FREEZE
         → ODK-082–087 [ODK-085 = wspólny dowód ODK-119-PROVIDER]
         → ODK-088 na fizycznym iPhonie + OPS-PRODUCTION/C
         → PO-PRICE + manifest evidence + PO-GO
         → GO albo NO-GO → autoryzowana publikacja → odbiór
```

Urządzenie może być wymaganym narzędziem podczas bramek providerów, np. gdy ich kontrakt przewiduje rzeczywistą mobilną atestację; nie zmienia to kolejności finalnego odbioru ODK-088. Płatne okno providerów uruchamiać dopiero po freeze i przygotowaniu dostępu, z zachowaniem ustalonych uprawnień i budżetu.

Kod lub konfiguracja wymagające nowego buildu po freeze oznaczają nową rewizję kandydata i retest według wpływu. Gdy zmienia się wyłącznie wersjonowana konfiguracja, również aktualizuje się manifest oraz odpowiednie dowody. Nie przepisywać historycznych wyników na nowy artefakt.

## 8. Kolejka wykonawcza

Kolejka nie duplikuje statusów z rejestru. Codex bierze pierwszy **dostępny** krok; przy `WAIT` zapisuje brakującą zależność i przechodzi dalej, bez resetu danych, ponawiania zgód i sztucznego zatrzymania całego programu. Po odblokowaniu wcześniejszego kroku wraca do jego priorytetu.

### 8.1 Kolejka główna — do gotowości symulatorowej

| Kolejność | Następny task / slice | Wynik i reguła przejścia |
| --- | --- | --- |
| 01 | PLAN-SYNC/B2 | Rozprowadzić zweryfikowane decyzje do aktywnych pakietów; uzupełnić brakujące kontrakty bez wymyślania wyników. [A: raport](active/PLAN-SYNC/A-REPORT.md), [B1: raport](active/PLAN-SYNC/B1-REPORT.md). |
| 02 | CI-CONTRACT/A2b — WAIT: AWS-02/CANDIDATE | Wdrożyć rzeczywiste bramki readiness/review i kontrakt manual release po aktualnej decyzji i readiness. [Diagnoza zależności](active/CI-CONTRACT/A2b-DIAGNOSIS.md); źródłowe bramki A2a: [raport](active/CI-CONTRACT/A2a-REPORT.md). |
| 03 | PROFILE-01/D — done | [Lokalna blokada i pending revoke](active/PROFILE-01/D-REPORT.md) odebrane z iOS/Maestro; zdalny retry jest zakresem PROFILE-03. |
| 04 | PROFILE-02–05 — PROFILE-02/A done, B WAIT: decyzja PO | A zamknięte [raportem](active/PROFILE-02/A-REPORT.md); po decyzji PO wrócić do B i C. Następnie offline logout z zachowaniem danych konta, oba wybory adopcji i usunięcie starego oracle. Każdy slice zamknąć osobnym raportem, QA, zmianą planu i push na `main`. |
| 05 | PROFILE-06 i AUD-17 | Pełny E2E rzeczywistych stanów na jednym iPhonie 17: guest, transfer/reset, logout offline, restart i zmiana konta. Backendowy [B3a](active/AUD-FIXTURE/B3a-REPORT.md) pozostaje fixture; raporty [B1](active/AUD-FIXTURE/B1-REPORT.md)/[B2](active/AUD-FIXTURE/B2b-REPORT.md) są historyczne. |
| 06 | AUD-13 | Reprodukcja/diagnoza, naprawa potwierdzonej przyczyny i pełna ścieżka sesji. Gdy wymagany jest osobny slice diagnostyczny, zamknąć go przed implementacją. |
| 07 | AUD-02 — diagnoza done, odbiór WAIT: izolowany fixture | [Diagnoza](active/AUD-02/LOCAL-FLOW-DIAGNOSIS.md) formularzy sterownika i lokalnego RC. Części wymagające aktualnego contentu zakończyć po AWS-02; nie tworzyć zależności od freeze. |
| 08 | AUD-05 | Nawigacja trzech runnerów na iOS, w tym leave/resume/result. |
| 09 | AUD-08/A | Wspólny protokół recovery i briefing/QA, bez pytania PO o techniczną semantykę. |
| 10 | AUD-08/B | Implementacja mobile/backend i testy scenariuszy awarii zgodnie z zaakceptowanym kontraktem. |
| 11 | ODK-116-A — A1 done | [Walidacja iOS/Android](active/ODK-116/A1-REPORT.md) ukończona; [mapa A2](active/ODK-116/A2-CROSS-REPO-CONTRACT.md) gotowa; dalej schema zmiennych i środowisko testowe. Gotowe wejście dla tłumaczeń dokumentów oraz web. |
| 12 | SIMP-05 — tylko potwierdzony brak | Gdy w PLAN-SYNC znaleziono dowód ukończenia, pominąć implementację i zachować zamknięcie. Gdy aktywne legacy istnieje, usunąć je przed finalizacją formatu kandydata. |
| 13 | AWS-02/CANDIDATE | Exact artefakty i delegowana decyzja Codex, aktualne readiness/migration. Brak oczekiwania na PO. |
| 14 | ODK-119-GATE/A | Jedna reguła dostępu i lokalne kontrakty, gotowe dla integracji pakietów. |
| 15 | AUD-04-B | Backend admission/download według istniejącego kontraktu. |
| 16 | AUD-04-C | Weryfikacja pobranego artefaktu i atomowa aktywacja w mobile. |
| 17 | AUD-04-D | Discovery/preparation oraz właściwe błędy pakietów. |
| 18 | ODK-119-GATE/B | Wszystkie wejścia do płatnej sesji/download i lokalna macierz uprawnień. |
| 19 | AWS-02/ADMISSION | Aktualne publishing/runtime evidence oraz app lock; bez fałszywego historycznego ACC-02. |
| 20 | AUD-11 | Odbiór retry, hierarchii operacji danych i dostępnej semantyki. |
| 21 | AUD-14 | Dynamic Type: reprodukcja, właściwa poprawka i dowód. |
| 22 | AUD-15 | Wizualne stany odpowiedzi/review po usunięciu badge. |
| 23 | AUD-16 | Zgoda rejestracji bez utraty znaczenia i dostępności. |
| 24 | ODK-117-A0 | Pełna mapa pochodzenia tekstów i wyjątków. Jest niezależnym dostępnym zadaniem, gdy wcześniejszy priorytet ma rzeczywistą zewnętrzną blokadę. |
| 25 | ODK-117-A1 → A2 → A3 → A4 → A5 | Pięć oddzielnych kroków według istniejącego pakietu, każdy z własnym AC, raportem i QA. Nie wykonywać całego zakresu jako jednego taska. |
| 26 | ODK-117/B-CONTRACT | Siedem wersji językowych szablonów i zmiennych na jawnych danych testowych. Nie czeka na PO-116. |
| 27 | WEB-03C/PREP | Technicznie gotowy marketing, przygotowany build/rollback i sprawdzony dostęp, bez publikacji fikcyjnych danych. |
| 28 | CI-CONTRACT/B–C → RELEASE-CONTRACT/A–C → OPS-PRODUCTION/A–B | Oddzielne slice’y: obowiązkowe testy kandydata i pipeline, etapowe bramki/manifest/OTA, operacyjny kanał dla syntetycznych spraw; A release do SIM-READY, B/C przed FREEZE. |
| 29 | AUD-06 → SIM-READY | Odbiór przekrojowy bez nowych blockerów lokalnych; prośba o iPhone i aktualizacja listy danych publikacyjnych. |

Wiersz zbiorczy CI/RELEASE/OPS oznacza osobne małe taski A, B i C, każdy z kontraktem, raportem i QA. Przed AUD-06 muszą być zamknięte CI-CONTRACT/A–C, RELEASE-CONTRACT/A i OPS-PRODUCTION/A–B; RELEASE-CONTRACT/B–C są wymagane przed FREEZE. Wcześniejsze umieszczenie kroku w kolejce nie tworzy nowej zależności technicznej. Przykładowo ODK-116-A, AUD-16 i ODK-117-A0 mogą zostać wykonane wcześniej po rzeczywistym zatrzymaniu innego taska. Nie wolno jednak traktować braku fixture jako trwałego powodu do omijania AUD-FIXTURE i kończenia wyłącznie drobnych poprawek UI.

### 8.2 Kolejka wydania — bez terminu kalendarzowego

| Kolejność | Task | Wejście / wynik |
| --- | --- | --- |
| R01 | ODK-116-B | Prawdziwe wartości od PO oraz rzeczywiste techniczne ID; walidacja konfiguracji przed publikacją. |
| R02 | ODK-117/B-VALUES | Kontrola rzeczywistych dokumentów i interpolacji we wszystkich locale. |
| R03 | WEB-03C/PUBLISH | Odtworzenie/przypięcie builda z właściwymi danymi, zatwierdzony deploy, zdalne trasy i rollback. |
| R04 | AUD-06 — delta konfiguracji | Utrzymanie aktualnego SIM-READY po zmianach publikacyjnych. |
| R05 | FREEZE | Cztery SHA, candidate, app lock, konfiguracja, iOS build i lokalne dowody. |
| R06 | ODK-082 → … → ODK-087 | Osobne bramki według istniejących kontraktów; ODK-085 i ODK-119-PROVIDER mają wspólny wynik. Każdy przebieg ma własny stop condition. |
| R07 | ODK-088 | Jedna finalna macierz na fizycznym iPhonie, także device-only accessibility. |
| R08 | OPS-PRODUCTION/C + przygotowanie PUBLISH | Kontrolowany dowód operatorski w docelowym środowisku i gotowa operacja dystrybucji. |
| R09 | GO/NO-GO | Aktualny manifest, PO-PRICE i jawna decyzja PO dla dokładnego kandydata. |

| R10 | PUBLISH | Po GO i wymaganej autoryzacji: wysłanie zatwierdzonego artefaktu, status sklepu, kontrolowany odbiór i raport. |

PO-116 i przygotowanie dostępu mogą przebiegać równolegle do prac Codex. PO-DEVICE uruchamia się po SIM-READY. ANDROID-MANUAL wykonuje się później według dostępności testera i builda; nie jest wstawiane między R05 a R09 jako dodatkowa bramka. Opcjonalny EPIC-09 nie wypiera pracy na ścieżce wydania; płatne skalowanie tylko po uzgodnieniu kosztu.

## 9. Ryzyka, źródła i utrzymanie planu

### 9.1 Otwarte ryzyka i odpowiedzialność

| Ryzyko | Reakcja | Właściciel / moment |
| --- | --- | --- |
| Profil konta lub outbox otwarty po wylogowaniu albo pod innym kontem | Trwałe odcięcie dostępu po lokalnym logout, wybór scope wyłącznie po zgodnym Auth, test restartu i zmiany konta. Zdalne unieważnienie opisać i ponawiać osobno, bez deklarowania sukcesu offline. | Codex/QA, PROFILE-01–03. |
| Utrata albo podwójne przeniesienie danych gościa | Zachować zatwierdzony wybór transfer/reset przez restart, jawnie kończyć operację przed usunięciem kopii guest; odrębne testy obu wariantów. | Codex/QA, PROFILE-04. |
| Historyczny defekt sesji nie daje się odtworzyć | Bezpieczna diagnostyka, znane warunki reprodukcji i niezależne rozstrzygnięcie; brak automatycznego PASS. | Codex/QA, AUD-13. |
| Niespójny stan recovery po awarii | Jeden kontrakt mobile/backend; ustalić semantykę zależności providera na podstawie aktualnej dokumentacji podczas taska, nie z samej oceny modelu. | Codex/QA, AUD-08. |
| Statyczny bank lub entitlement udają działające Premium | Odbiór pobrania, integralności, aktywacji i sesji; niezależna reguła dostępu. | Codex, AUD-04/GATE. |
| Delegacja banków pomylona z automatycznym admission | Decyzja, readiness i admission jako odrębne dowody dla exact hash; bez fałszowania autorstwa PO. | Codex/QA, AWS-02. |
| Historyczny `verify:migration` ma czerwone AWS `EVIDENCE_VALUE` | Zachować historyczny wynik; uruchomić właściwy verifier nowego baseline’u. Nie zmieniać etykiet, aby uzyskać zieloną bramkę. | Codex, AWS-02 i 09-A. |
| Dane prawne ponownie blokują kod | Pilnować podziału A/B i B-CONTRACT/B-VALUES; publiczne wartości w konfiguracji, sekrety osobno. | Codex, ODK-116/117. |
| Opóźnione wejścia publikacyjne | Jawna lista PO z momentem użycia; brak daty wydania nie znosi wymagań publikacji. W tym czasie prace aplikacyjne trwają. | PO + Codex. |
| Symulatorowy PASS uznany za fizyczny | W evidence pisać „symulator iPhone 17” dla CoreSimulator/Maestro; fizyczny wynik tylko po rzeczywistym teście. | QA, AUD-06/ODK-088. |
| Android pozostaje nieprzebadany ręcznie | Zapisać status manual pending i checklistę; nie fabrykować Android PASS ani drugiej automatycznej bramki. | PO/tester, ANDROID-MANUAL. |
| Provider wymaga urządzenia lub uprawnienia właściciela | Sprawdzić potrzeby w przygotowaniu kontraktu; iPhone po SIM-READY, konkretne uprawnienie przez PO-ACCESS. | Codex przed uruchomieniem okna providerów. |
| Plan/raport root nie jest trwale wersjonowany | PLAN-SYNC sprawdza znaną z AWS-01 kwestię repo root i śledzenia raportów. Zapewnić jeden uzgodniony, wersjonowany dokument, bez drugiego aktywnego planu. | Codex, PLAN-SYNC. |

### 9.2 Zachowane odnośniki do evidence ODK-119

Kanoniczny kontrakt: [ODK-119 Working Brief](active/ODK-119/ODK-119-WORKING-BRIEF.md). Powiązane raporty nie są osobnymi bramkami:

| Obszar | Raport |
| --- | --- |
| Backend | [Backend partial](https://github.com/lukaszkurczab/patternly-backend/blob/e3c3fc6570faa13a802f47a19e17005b0c1eecd1/docs/active/ODK-119/ODK-119-BACKEND-PARTIAL-REPORT.md) |
| Cache | [App cache](active/ODK-119/ODK-119-APP-CACHE-PARTIAL-REPORT.md) |
| Purchase/restore | [Purchase](active/ODK-119/ODK-119-PURCHASE-PARTIAL-REPORT.md) |
| Refresh | [Refresh](active/ODK-119/ODK-119-REFRESH-PARTIAL-REPORT.md) |
| Cleanup | [Cache clear](active/ODK-119/ODK-119-CACHE-CLEAR-PARTIAL-REPORT.md) |
| Reconnect | [Reconnect](active/ODK-119/ODK-119-RECONNECT-PARTIAL-REPORT.md) |

### 9.3 Reguły aktualizacji

1. Jeden task ma jeden kontrakt i jeden raport nadrzędny. Dla AUD kanonicznym pakietem jest `docs/PATTERNLY-AUDIT-TASKS-2026-09-22.md`; raport wskazuje evidence innych repo. Brak kontraktu oznacza konieczność przygotowania go przed implementacją, nie wymyślenia jego zawartości z nazwy taska.
2. Nowe kroki `/A`, `/B`, `/CANDIDATE`, `/ADMISSION`, `/PREP`, `/PUBLISH`, `/B-CONTRACT`, `/B-VALUES` są podziałem wykonawczym istniejących zadań. PLAN-SYNC uzgadnia te nazwy z pakietami; nie tworzyć duplikatów zakresu pod nowymi ID.
3. Po każdym tasku aktualizować status, dostępność kolejnego kroku, zależności i odnośnik do dowodów. Historia prób trafia do raportu, nie do długiego akapitu w kolejce. Nie powtarzać tego samego statusu w pięciu sekcjach.
4. `done` wymaga spełnionych AC, aktualnego evidence i QA. Gdy część dowodu jest wyłącznie urządzeniowa/providerowa, lokalny zakres można zamknąć tylko po jawnym przypisaniu konkretnego case do odpowiedniej późniejszej bramki. Nie usuwa to wymagania końcowego.
5. Usuwać zakończone zadania z aktywnych tabel i kolejki, pozostawiając zwięzły zamknięty baseline. Nie otwierać ich ponownie dla samego odświeżenia daty raportu.
6. Każda decyzja delegowana ma autora Codex, datę, exact manifest/zakres i podstawę `DEC-23-CONTENT`. Historyczne podpisy PO i manifesty pozostają niezmienione.
7. Zmiana danych produkcyjnych albo konfiguracji ma własną wersję i analizę wpływu. Sekretów, danych bankowych oraz materiałów uwierzytelniających nie wpisywać do planu lub publicznego repo.
8. Nie rozszerzać polityki iOS-only o wymaganie Android E2E; nie rozszerzać wyjątku Androida na pomijanie testów backendu/web/contentu. Nie zmieniać zakresu dziewięciu tracków, siedmiu locale i oferty bez decyzji PO.
9. Gdy znaleziony fakt przeczy planowi, najpierw poprawić zapis i zależności, a następnie kontynuować najbliższy dostępny task. Nie maskować niewykonanego testu jako PASS ani braku danych jako wykonanej konfiguracji.

### 9.4 Kontrola spójności tej rewizji

| Pytanie kontrolne | Odpowiedź / rozstrzygnięcie |
| --- | --- |
| Czy PO musi ponownie zatwierdzić exact candidate banków? | Nie. Decyzję wykonuje Codex; evidence i QA nadal obowiązują. |
| Czy brak prawdziwych danych prawnych zatrzymuje aplikację lub siedem locale? | Nie. ODK-116-A i ODK-117/B-CONTRACT są niezależne od wartości PO. Dane prawdziwe są wymagane przed publikacją i finalnym freeze konfiguracji. |
| Czy Codex może założyć konto testowe? | Tak, w ramach uprawnień i izolacji; bez osobnej zgody na każde konto. |
| Czy fizyczny iPhone jest warunkiem rozpoczęcia lub zakończenia prac symulatorowych? | Nie. PO zapewnia go po SIM-READY; końcowy dowód urządzeniowy nadal jest wymagany przed GO. |
| Czy Android Back blokuje AUD-05? | Nie. Trafia do ANDROID-MANUAL; iOS odblokowuje obie platformy. |
| Czy AUD-02 wymaga freeze, który sam wymaga AUD-02? | Nie. Lokalny preflight i kontrakty należą do AUD-02; realni providerzy do późniejszych bramek. |
| Czy AUD-04 czeka na własne globalne admission albo całe GATE/B? | Nie. Wejściem są zaakceptowane dokładne artefakty CANDIDATE i kontrakt GATE/A. |
| Czy AUD-15/16/17 mogą zostać pominięte przed freeze? | Nie. Wprost wchodzą do SIM-READY, które jest wejściem FREEZE. |
| Czy EPIC-09 albo Android manual blokują release? | Nie jako osobne bramki. Rzeczywiście wykrytych defektów nie ignorujemy. |
| Czy sam ten dokument potwierdza nowe PASS? | Nie. To poprawiony plan; aktualność implementacji i dowodów weryfikuje wykonawca podczas zadań. |
