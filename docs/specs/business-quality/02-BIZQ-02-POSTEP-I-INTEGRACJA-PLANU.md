# BIZQ-02 — rzeczywisty postęp i integracja istniejącego planu

**Priorytet:** P0  
**Główne repo:** aplikacja; content, jeżeli reguła nie dociera przez istniejący kontrakt; backend tylko dla rzeczywistej zmiany atomowej pary cel/plan  
**Zależności:** wspólny [plan BIZQ](00-PATTERNLY-BIZQ-PLAN-ROBOCZY.md); można rozpocząć niezależnie od redakcji BIZQ-01  
**Cel:** istniejący plan i Home mają wykorzystywać rzeczywiste dowody oraz właściwą regułę ukończenia, z jawnym `unknown` dla nieopublikowanej reguły lub definicji pełnego zakresu rozdziałów, a błędem dla uszkodzonego lub sprzecznego kontraktu.

## 1. Bieżący stan i odbiór

**08.10.2026: BIZQ-02 P01–P20 niezależnie PASS.** Jedna istniejąca projekcja kwalifikuje exact package/profile evidence, deduplikuje i odrzuca sprzeczne/future próby. Producer transport i evaluator v2 obejmują 117 wymaganych rozdziałów dziewięciu ścieżek; Home/Progress, propozycja i prognoza konsumują ten sam wynik. Nie ma globalnej kompensacji, partial nie zwiększa poprawności, a zamknięte Premium pozostają w wymaganym zakresie. Reguła min4×units ceil20 i16correct/last20 jest zatwierdzoną polityką bez claimu skuteczności edukacyjnej. Adaptacyjny dobór i kalibracja czasu pozostają BIZQ-03.

P01–P20 mają source owner/integration coverage: brak/uszkodzenie reguł, jakościowe okno i regresja, konflikty/deduplikacja, profile/pakiety, niedostateczne dane i ownpace, recovery/storage, actual start/submit/materialization, CAS/stale accept, A→B→A, kalendarz/wersja/cel, local/cloud conflict+ACK/outbox, reminders failure/retry, real Premium admission przed zapisami. P18 sieć poza canonical local-write lane; P14 verified localOffline i typed partial bootstrap zachowują actor/session/draft fences bez osłabienia Premium. Q13 exact-missing i journaled explicit end współdzielą tych owners, dlatego odebrany integracyjny app pakiet dostarcza je atomowo zamiast rozdzielać niespójne stany. Poprzednie projekty/przyczyny napraw zachowano dalej jako historię, nie polecenia odtwarzania.

Finalne źródłowe `qa:static`:2032 testy/2028PASS/0FAIL/4SKIP (rzeczywiste HTTP/Admin recovery integration nie wykonane). Minoralertcopy wykonana później:22/22+typecheck/diff, independent11/11 i rzeczywiste lookup siedmiu locale; nowa kopia nie była wyrenderowana native. Prywatny fullgate log `/private/tmp/patternly-bizq02-partial-bootstrap-static-ktml6mkx.log`; dowody/manifest `/private/tmp/patternly-bizq02-native/`0700/0600, bez surowych danych w repo.

Native na jednym iPhone17/iOS26.4: actual goal/proposal/accepted plan; OOD360→359/1qualifying, następnie rzeczywisty Free Coding1060→1059/1qualifying/firstchapter39 po submit i świeżej propozycji w tym samym procesie. Własny backend timeout, cold canonicalFree resume/submit i subsequentpausedcold zachowują poprawną odpowiedź i Progress. To APIunavailable, nie fizyczna sieć offline. Premium OOD typedpartialHome/Progress, canonical reconnectsameanswer oraz negativeResume retainedsession independentPASS; sesjaOOD2 zakończona normalnie. LightDetails próba faktycznie przesunęła cursor doCodingQ2 bez nowej odpowiedzi/Check; zapis i normalna pauza zachowane, nie przedstawiać jej jako samequestion/DetailsPASS.

NormalDark pełne Reason/Details/przykład/Source unavailable readable; LargeDark Reason/tekstDetails readable, wartośćSource poza końcowymkadrem. LightLargeHome/Appearance i Progress summary1/1059/0of26/first39/nextchapter scrolling independentimagePASS; reprezentatywna wspólna ścieżka renderowania plus sourceproperty26/117, nie indywidualny nativeaudyt każdego rozdziału. Aktywny Free9 nie ma zewnętrznych Source, więc jawne unavailable jest właściwe; nie twierdzić, że otwarto materiał/Reportanissue (wyłącznie widoczny). LocalOffline Settings pokazuje zachowaną tożsamość i jawne localbody; YourData actualtitle i brak export/resetPASS. Przywrócono AppearanceSystem i OScontent_size large.

Complete BEFORE i AFTER readonly receipts mają11profiles/89rows. Niezależne exact70/70 comparison chroni Guest+9oldaccounts: inventory i6kategorii każdego profilu bez dodania/usunięcia. Jedyny syntheticprofile ma własne jawnie wykonane learning/settings/lifecycle/cache deltas; globalcontrol/actor/SecureStore oceniono osobno. Journal absent, logout statuses bez zmiany,16secure slots/currentSDK UID affinity zachowane; agregat nie pozwala przypisać hashzmian do konkretnych pól/tokenu/przypomnienia. Preference-onlyroundtrip po AFTER przywrócił ustawienia tego samego aktora; bez nowych learningwrites. Dane kont/Guest, unfinishedaudits i6stashów zachowane. Usunięto41 własnych niepotrzebnych failed-artifact plików po refcheck; bieżące receipts/obrazy/manifesty i potrzebne tooling retained. Cleanup nie zmienił wejść źródłowej ani runtime weryfikacji.

Źródła i pełny P01–P20 niezależnie Luna high PASS; nie jest to GO, runtime/publishing grant, RevenueCat ani odbiór fizycznego urządzenia. Acceptedintegracyjny0c500a76 i CIfix09d2e655 pushed. ActualCI37751944348SUCCESS oba jobs,2033tests/2029PASS/0FAIL/4SKIP. Kontynuować BIZQ-04 według kanonicznego planu.

## 2. Kontrakt docelowy

Jedna aplikacyjna projekcja opisuje rzeczywisty stan nauki na potrzeby Home, propozycji planu i prognozy. Nazwa typu jest przykładowa; wykorzystaj istniejący model, jeżeli już spełnia tę rolę.

```text
bieżący profil + track + dokładny pakiet + snapshot celu/planu
  + zweryfikowane, utrwalone próby
  + istniejąca kolejka review
  + kanoniczny czas aktywny i konfiguracja
    → jedna interpretacja postępu przez właściwy domain/family owner
    → Home / proposal / pace forecast
```

Nie wprowadzaj osobnych liczników „progress for Home” i „progress for planner”. Nie zapisuj nowej kopii historii odpowiedzi. Projekcja może być obliczana/memoizowana przez istniejący read model, ale nie staje się drugim źródłem prawdy.

### 2.1. Stan ukończenia

**Nadrzędna korekta właściciela z 07.10.2026:** ukończenie wszystkich rozdziałów oznacza ukończenie ścieżki. Każdy wymagany rozdział ma własną regułę i wynik, a ścieżka jest ich agregacją. Duża liczba poprawnych odpowiedzi w jednym rozdziale nie zastępuje pracy w innym. Wcześniejsza zgoda na globalne minima dziewięciu ścieżek i globalne okno 40 odpowiedzi została zastąpiona tą korektą; nie wdrażać dawnej tabeli jako docelowego warunku. Jej historyczny zapis jest w Git `2ce70ec4`.

Rozdział oznacza istniejący węzeł materiału (`nodeId`) z wersjonowanego zakresu ścieżki. W obecnym inventory jest 117 takich węzłów w dziewięciu ścieżkach. Wynik ścieżki uwzględnia pełną, jawną listę wymaganych rozdziałów tego pakietu. Nie budować listy wyłącznie z odpowiedzi użytkownika, załadowanych plików lub aktualnych uprawnień. Ukończony rozdział Free pozostaje ukończonym rozdziałem, lecz blokada Premium nie usuwa pozostałych rozdziałów z zakresu całej ścieżki. Korekta nie zmienia uprawnień ani nie odblokowuje materiału.

**Decyzja właściciela z 07.10.2026 — zatwierdzone progi rozdziałów:** minimum prób rozdziału to czterokrotność liczby jego jednostek umiejętności, zaokrąglona w górę do wielokrotności 20; dla niepustego rozdziału minimum wynosi co najmniej 20. Jakość oceniać w ostatnich 20 kwalifikujących odpowiedziach wyłącznie tego rozdziału: wymagane 16 wyników `correct` (80%). Przykłady: 3–5 jednostek → 20 prób; 6–10 → 40; 11–15 → 60; 16 → 80. Właściciel osobno zatwierdził to okno 20 dla rozdziałów; zastępuje ono dawne globalne okno 40. Zgoda dotyczy polityki produktu, nie potwierdza implementacji.

[Zatwierdzony spis 117 rozdziałów](02-BIZQ-02-CHAPTER-COMPLETION.csv) zawiera trackId, nodeId, bazową wersję i skrót artefaktu, liczbę jednostek, minimum, okno i próg. Przygotowano go z walidowanych źródeł przez istniejące `patternly-content/scripts/model-evaluation/inventory.mjs`; wersje, skróty oraz przypisania i treść wszystkich pytań po przekształceniu przez kanoniczny mechanizm budowania porównano z dziewięcioma bieżącymi artefaktami. Dotyczy to również istniejącego przypisania pytań GCP do domen egzaminacyjnych. Spis jest wejściem zadania BIZQ-02, a nie produkcyjną konfiguracją lub dowodem wdrożenia. Bazowe skróty opisują materiał w chwili decyzji; pakiet z dostarczonymi regułami będzie miał nową tożsamość. Przed wykonaniem sprawdzić aktualność źródeł; zmiany zakresu wymagają jawnie wersjonowanego zapisu reguł, bez zmiany zainstalowanego pakietu w miejscu.

Powtórzenia pozostają dopuszczone, a `partial` nie liczy się jako poprawna odpowiedź. Warunek wszystkich rozdziałów nie jest wymaganiem rozwiązania każdego pytania ani gwarancją pokrycia każdej jednostki, opanowania materiału lub zdania egzaminu. Progi są zatwierdzoną polityką startową bez kalibracji empirycznej.

#### Wymagana zmiana kontraktu i właściciele

Kanoniczny dokument workspace `docs/04-data-model.md` opisuje obecny globalny `PackageCompletionRuleV1`; nie obsługuje jeszcze korekty właściciela. Przed kodem zaktualizować właściwe kanoniczne kontrakty 01/04 oraz wersjonowany kontrakt źródła i artefaktu. Nie rozszerzać po cichu kształtu v1 ani zachowywać równoległego globalnego warunku jako dodatkowej bramki ukończenia.

- Content: `patternly-content/content/catalog.json`, `scripts/content/question-contract.mjs`, `scripts/build.mjs` i właściwe schematy mają dostarczać kompletny wersjonowany zakres rozdziałów i ich reguły. Walidacja sprawdza brakujące, obce i powtórzone IDs oraz spójność źródła z artefaktem. Szczegółowy kształt nowego kontraktu wymaga projektu przed implementacją.
- Aplikacja: `src/content/canonical/questionTypes.ts`, `questionCatalog.ts`, `runtimeCatalog.ts`, `src/domain/learning/packageCompletionRule.ts` i `src/application/learningPlan/learningEvidenceProjection.ts` mają rozwiązywać reguły, kwalifikować próby rozdziału i agregować wynik ścieżki w jednym istniejącym źródle interpretacji. Repozytoria odczytują dane; UI nie ocenia progów.
- Przypisanie próby do rozdziału pochodzi z pytania znalezionego w dokładnie przypiętym artefakcie: `questionId` → `nodeId`. `ResolvedContentRef` obecnie ma tylko trackId, questionId, contentVersion i artifactSha256. Nie dopisywać mu pola ani migrować trwałej historii bez potrzeby; nie zgadywać rozdziału z formatu ID lub z pomocniczych referencji taksonomii.
- Home, Progress, propozycja i prognoza mają konsumować tę samą agregację. Pozostały nakład jest związany z nieukończonymi rozdziałami; nie używać globalnego odejmowania minimum i sumy wszystkich prób, które pozwalałoby ukryć braki jednego rozdziału. BIZQ-03 dobiera rzeczywistą pracę z tych potrzeb, bez drugiego oceniającego mechanizmu.
- Zachować kwalifikację według profilu, tracku, contentVersion i skrótu artefaktu, deduplikację, kontrolę spójności odczytu, wersjonowanie pakietów i istniejącą procedurę przypięcia. Nie zmieniać zainstalowanego artefaktu w miejscu. Zastąpione globalne wyliczenia, testy i opisy usunąć w tej samej zmianie; historyczne dane użytkownika zachować.

#### Przypięty dowód pochodzenia GCP

Nowa tożsamość pakietu z regułami ukończenia nie zmienia historycznego źródła przypisania pytań GCP do domen. `nodeDomainMapEvidence.contentVersion` i `artifactPath` pozostają przypięciem istniejącego opublikowanego wrappera, a nie aliasem bieżącej wersji kanonicznego pakietu. Wrapper, jego zawartość i checksum muszą zgadzać się z własnym przypięciem. Builder nadal wymaga pełnej i dokładnej zgodności bieżących `questionId → nodeId` z dowodem, liczby elementów, jednoznacznych domen oraz zgodności wyprowadzonej mapy z konfiguracją i generowanym `contentDomainId`. Brakujące, dodatkowe, powtórzone, przeniesione lub niejednoznaczne przypisania pozostają błędem. Nie kopiować ani nie zmieniać etykiety historycznego wrappera, aby udawał publikację nowej wersji. Rzeczywisty test obejmuje zmianę wersji wyłącznie z powodu reguł oraz negatywne zmiany inventory/przypisań. Niezależny przegląd tego rozdzielenia zakończył się PASS; nie oznacza odbioru implementacji.

#### Odbiór nowego modelu

Rozszerzyć istniejące testy transportu reguł, `packageCompletionRule.test.ts`, `learningPlanProjectionIntegration.test.mjs` oraz macierz P01–P20. Wymagane przypadki: wszystkie rozdziały spełniają reguły → ścieżka ukończona; jeden rozdział bez prób, poniżej minimum albo poniżej jakości → ścieżka nieukończona, niezależnie od nadwyżki innych rozdziałów; sesja z pytaniami z kilku rozdziałów rozdziela wkład poprawnie. Osobno sprawdzić brak reguły, pustą lub niepełną listę rozdziałów, obcy/nieznany node, brak pytania w przypiętym artefakcie, duplikat próby, `partial`, obcy profil i inną wersję pakietu. Uszkodzenie kontraktu nie staje się pustą listą dającą ukończenie.

Próby ze starej wersji lub innego skrótu nie kwalifikują się automatycznie do aktualnej oceny. Zachować je w historii i odróżnić historyczny wynik od bieżącego stanu rozdziałów; nie obiecywać przeniesienia ukończenia między pakietami bez zatwierdzonego kontraktu.

Dodatkowy przypadek odbioru P20: użytkownik Free ukończył wszystkie dostępne mu rozdziały, a wymagany rozdział Premium pozostaje zablokowany. Dostępne rozdziały zachowują swój wynik, ścieżka nie jest ukończona, Home/Progress i prognoza wskazują rzeczywistą przeszkodę dostępu, a test potwierdza brak obejścia uprawnień.

Free, Premium, Home, Progress i prognoza zachowują ten sam zakres ukończenia. Sam brak prawa do Premium nie jest błędem odczytu; ma wskazywać rzeczywisty stan dostępu. Nie tworzyć drugiego magazynu postępu ani samodzielnej bramki backendowej. Testy progów liczbowych muszą weryfikować zgodność każdej z 117 reguł ze spisem, minimum minus jedna próba oraz wyniki 15/20 i 16/20 przy osiągniętym minimum. Zmiana dokumentacji nie potwierdza implementacji.

- Reguła istnieje i jest poprawna: uruchom kanoniczny evaluator na właściwych dowodach.
- Reguła lub definicja pełnego zakresu rozdziałów nie została opublikowana: `unknown`, z prawdziwym powodem; nie domyślny próg. Zadeklarowany, lecz niepełny lub sprzeczny zakres jest błędem kontraktu, nie `unknown`.
- Reguła albo artefakt są niepoprawne: jawny błąd kontraktu, nie „brak postępu”.
- Historia poprawnie pusta: zero kwalifikujących prób i `in_progress`, jeżeli reguła istnieje.
- Repozytorium nie dało się odczytać: failure/unavailable, nie pusta historia.
- Próg osiągnięty: stan ukończenia wynikający z reguły, nie claim gotowości do egzaminu.

Zachowaj aktualną semantykę regresji po kolejnych błędnych wynikach: ustal, czy completion jest bieżącą oceną ruchomego okna, czy trwałym wydarzeniem. Odczytany evaluator liczy stan bieżący; nie zamieniaj go po cichu na monotoniczną odznakę. Gdy UI/kontrakt zakłada inaczej, rozwiąż sprzeczność jawnie przed kodem.

### 2.2. Cztery odrębne informacje

| Informacja | Znaczenie | Nie oznacza |
| --- | --- | --- |
| Liczba kwalifikujących prób | Wolumen zgodny z pakietem i profilem | Liczby różnych umiejętności ani różnych pytań. |
| Unique practiced items | Liczba różnych rzeczywiście ćwiczonych item IDs | Liczby wszystkich prób; nie używaj nazwy completed items dla attempt count. |
| Pokrycie mental units/obszarów | Gdzie istnieją dowody określonego typu | Mastery; pełne pokrycie nie gwarantuje wyniku. |
| Package completion | Wynik aktualnej wersjonowanej reguły | Gwarantowanego ukończenia przygotowania w realnym świecie. |

Powtarzanie poprawnie kwalifikujących się pytań pozostaje dopuszczone. Jawny warunek ukończenia wszystkich rozdziałów wynika z korekty właściciela. Nie rozszerzać go bez decyzji na każde unikalne pytanie lub każdą jednostkę umiejętności; nie zmienia uprawnień ani zasad odblokowania.

### 2.3. Szczególnie ważny przypadek: minimum osiągnięte, jakość nie

Przykład pojedynczego rozdziału z 8 jednostkami: reguła `minimumAttemptCount=40`, `rollingWindowSize=20`, `qualityThreshold=0.8`; użytkownik ma 45 kwalifikujących prób tego rozdziału, a w ostatnich 20 poprawnych jest 10. Evaluator musi nadal zwracać `in_progress`.

`max(0, 40 - 45) = 0` mówi tylko, że nie brakuje wolumenu. Nie oznacza, że praca się skończyła. Prognoza oparta wyłącznie na wymaganej liczbie prób nie może zwrócić dzisiejszej daty ukończenia, `completed` ani pozytywnego komunikatu gotowości. Wyświetl jawny stan „minimum prób osiągnięte, potrzebna dalsza praca nad wynikami” albo odpowiedni obecny wzorzec. Dodatkowej liczby prób potrzebnych do jakości nie da się ustalić jako gwarancji.

Minimum 40 odpowiada w tym przykładzie rozdziałowi z 8 jednostkami; nie jest wspólnym minimum wszystkich rozdziałów. Okno 20 i próg 80% wynikają z zatwierdzonej polityki. Nie przywracać globalnego progu ścieżki.

## 3. Dokładny zakres odczytu

| Punkt wejścia | Co ustalić |
| --- | --- |
| `src/application/learningPlan/LearningPlanProposalCoordinator.ts` | Pochodzenie celu, historii, pakietu, modeId, capacity i identity; proces create/resolve/accept. |
| `src/application/homePlanSnapshotReader.ts` | Snapshot consistency, actual rule/no-rule, C3, prognoza i prawdziwa ścieżka renderowania. |
| `src/domain/learning/packageCompletionRule.ts` i testy | Aktualny evaluator, walidacja, kwalifikacja dowodów i jakość. |
| `paceForecast.ts`, generator `generateLearningPlanProposal` | Rzeczywiste parametry wymaganej i obserwowanej prędkości; blokady prognozy. |
| `contentPackageRuntimeOwner`, resolved track/profile | Czy aktualna reguła faktycznie dociera z autorytatywnego źródła do aplikacji. |
| `src/features/home/homePlanUiContract.ts`, Home i ekrany propozycji | Jeden stan domenowy, mapowanie na copy i akcje. |
| `learningPlanMutationRuntime` i owner goal/plan sync | Atomowa akceptacja pary, konflikt, rewizja, reminders i restart. |
| Repozytoria profilu/prób/review | Granica izolacji użytkownika, trwałe odczyty i sygnały unieważniania cache. |

Ścieżki spoza potwierdzonych powyżej są symbolami do zlokalizowania, nie poleceniem tworzenia nowego pliku o tej nazwie.

## 4. Istniejący kontrakt do zachowania podczas odbioru

### Etap A — kontrakt source → consumer

Zbuduj w raporcie tabelę: każdy aktualny track, źródło reguły, jej wersja, miejsce walidacji, pole w artefakcie, resolved profile oraz tożsamość danych. Brak reguły to ważny wynik, nie polecenie wstawienia minimum 10 czy 120.

Jeżeli zatwierdzona reguła istnieje w źródle, lecz ginie w builderze/projekcji, napraw istniejącą ścieżkę producent–konsument. Jeżeli nie opublikowano zatwierdzonej reguły rozdziałów lub definicji pełnego zakresu, zachowaj `unknown` i wskaż precyzyjny brak kontraktu. Zadeklarowaną, lecz niepełną lub sprzeczną definicję odrzucić jako błąd; nie pomijać brakujących rozdziałów. Nie wolno ogłosić działającej prognozy ukończenia dla tracka, który nie ma semantyki ukończenia. Można nadal pokazywać faktyczną aktywność/pokrycie i plan pracy z odpowiednim ograniczeniem.

Wszelkie zmiany pola reguły przechodzą przez shared schema, walidator, builder, artefakt, app lock i consumer. Nie dodawaj hardcodowanego słownika progów w Home.

### Etap B — jedna spójna projekcja

Skorzystaj z istniejących gwarancji odczytu snapshotu. Odczyt celu, planu, profilu i dowodów nie może mieszać rewizji z dwóch różnych momentów. Jeżeli istniejący reader powtarza odczyt i porównuje rewizje, rozszerz go zamiast dodawać inny mechanizm.

Domyślny podział odpowiedzialności:

- repozytoria zwracają zweryfikowane dane bieżącego profilu;
- warstwa aplikacyjna pobiera spójny snapshot i rozwiązuje pakiet;
- evaluator/family policy wyznacza completion i interpretację dowodów;
- generator i forecast otrzymują ten sam wynik;
- UI mapuje wynik na istniejące stany bez własnych obliczeń.

Unieważniaj projekcję po materializacji próby, zmianie review, celu, planu, aktywnego profilu, pakietu lub odpowiedniej polityki. Nie przeliczaj nauki na podstawie samego otwarcia Details, renderu karty czy nieutrwalonej odpowiedzi.

Nie odrzucaj po cichu uszkodzonych rekordów, aby wynik się zgadzał. Użyj obecnej jawnej polityki częściowego odczytu/poprawnych danych, jeżeli została zatwierdzona; nie wymyślaj nowej polityki degradacji w tym zadaniu.

### Etap C — uruchomienie evaluatorów

Istniejące wywołanie evaluatora zachowuje `unknown` dla faktycznego braku reguły. Nie zmieniaj `evaluatePackageCompletion` na liczenie success-only ani unique-only, jeżeli obecny kontrakt tak nie stanowi.

Przypadki z tą samą tożsamością próby nie mogą liczyć się dwukrotnie przy sync/retry. Ten sam ID z różnymi payloadami pozostaje konfliktem. Kwalifikacja po content version i artifact hash musi być wspólna dla Home/proposal/forecast. Historyczne próby poza aktualnym pakietem nie mogą być arbitralnie zaliczone do bieżącego completion; jednocześnie nie usuwaj ich z historii.

### Etap D — prognoza i komunikacja niepewności

Zachowaj podłączony `paceForecast` w tych stanach, dla których jego model jest poprawny. Rozdziel:

1. **Wymagane tempo wolumenu:** zależne od celu i pozostałego minimum; może być liczone bez historii zachowania.
2. **Obserwowane tempo:** wymaga rzeczywistych kwalifikujących danych i odpowiedniego okna; brak wystarczających danych ma własny powód.
3. **Prognoza spełnienia reguły jakości:** nie wynika automatycznie z dwóch powyższych. Nie pokazuj daty zaliczenia jako gwarantowanej.

Nazwy i liczby w UI muszą odpowiadać temu, co model naprawdę przewiduje. Gdy obliczana data dotyczy tylko osiągnięcia minimum prób, tak ją nazwij albo nie pokazuj jej jako ogólnego ukończenia. Szybsze klikanie nie jest poprawą kompetencji.

W BIZQ-02 nie zmieniaj automatycznie liczby pytań lub dni; to odpowiedzialność BIZQ-03. Naprawa projekcji może pozostać użyteczna nawet zanim rozszerzony planner zostanie ukończony.

### Etap E — tożsamość i nieaktualne propozycje

Sprawdź pełny workflow, nie tylko mapę `proposals`. Efektywna identity musi chronić co najmniej:

- aktywny profil/konto i jego granicę sesji;
- track oraz rewizję celu i zaakceptowanego planu;
- dokładny pakiet/content/artifact;
- wersję interpretacji/polityki, jeżeli wpływa na propozycję;
- rewizję albo deterministyczny fingerprint danych wejściowych;
- kontekst kalendarza potrzebny do poprawnego planu, w tym strefę i granicę dnia.

To lista semantyczna, nie nakaz dodania nowego pola dla każdego punktu. Wykorzystaj istniejące rewizje i profile fences. Nie dodawaj nowego globalnego licznika dla wygody, jeżeli istniejący mechanizm już chroni spójność.

Przed akceptacją ponownie sprawdź identity w kanonicznym ownerze mutacji. Sam check podczas renderowania propozycji nie chroni przed zmianą pomiędzy renderem i kliknięciem. Stara propozycja ma przejść w jawny stale/rebuild state; nie może nadpisać nowszego planu.

Zmiana dowodów może odświeżyć prognozę, ale nie ma sama akceptować nowego planu. Nie przerywa aktywnej sesji ani nie przestawia lokalnych powiadomień.

### Etap F — cutover bez drugiego ownera

Home, ekran propozycji i forecast muszą konsumować tę samą kanoniczną projekcję. Usuń zastąpione martwe stałe, duplicate helpers i testy utrwalające nieprawidłowe zachowanie. Nie usuwaj prawidłowych unknown/error states. Nie wykonuj globalnego porządkowania niezwiązanego z tą ścieżką.

## 5. Macierz testów obowiązkowych

| ID | Wejście/zdarzenie | Oczekiwany rezultat |
| --- | --- | --- |
| P01 | Poprawna reguła, zero prób | `in_progress`, prawdziwe minimum; nie `unknown`. |
| P02 | Brak reguły | `unknown` z prawdziwym powodem, bez domyślnego progu. |
| P03 | Uszkodzona reguła/artefakt | Jawne failure, nie zero postępu. |
| P04 | Próby spełniają minimum i jakość | Zgodny wynik Home/proposal/domain; brak claimu gotowości do egzaminu. |
| P05 | Minimum spełnione, wynik 15/20 w ostatnich 20 odpowiedziach przy progu 16/20 | Nadal `in_progress`; zero pozostałego wolumenu nie zamienia się w ukończenie. |
| P06 | Próg spełniony wcześniej, później seria błędów | Zachowanie zgodne z aktualną semantyką ruchomego okna, bez przypadkowej odznaki. |
| P07 | Partial/incorrect w oknie | Nie zwiększają liczby `correct` przez zaokrąglenie lub uproszczenie. |
| P08 | Duplikat tej samej próby po retry/sync | Jeden wkład w wynik. Sprzeczny payload tego samego ID → konflikt. |
| P09 | Próby z innego profilu/tracka/pakietu | Brak zaliczenia do bieżącej projekcji; dane drugiego konta niewidoczne. |
| P10 | Mniej danych niż wymaga tempo obserwowane | Wymagane tempo może istnieć, obserwowane ma jawne ograniczenie. |
| P11 | Brak daty w own pace | Brak sztucznego deadline'u i czerwonego „opóźnienia”. |
| P12 | Błąd storage/journal pending | Brak projekcji pozornej pustej historii; respektowany aktualny recovery boundary. |
| P13 | Submit → materializacja → Home | Postęp zmienia się po właściwej granicy bez ponownego uruchomienia aplikacji. |
| P14 | Restart/offline | Ten sam zweryfikowany stan; brak zależności obliczeń od backendu. |
| P15 | Nowe próby po utworzeniu propozycji | Stara propozycja nie jest akceptowana na nowszym snapshotcie bez sprawdzenia. |
| P16 | Zmiana profilu A→B i powrót | Propozycja A nie jest widoczna/akceptowalna dla B. |
| P17 | Nowy dzień/strefa/pakiet/goal revision | Rozstrzygnięcie stale/refresh zgodne z faktycznym wpływem zmiany. |
| P18 | Konflikt local/cloud planu podczas sesji | Sesja trwa; wybór pary odbywa się na bezpiecznym wejściu. |
| P19 | Akceptacja i failure schedulera reminders | Plan nie zostaje cofnięty ani pozornie powielony; powiadomienia mają własny prawdziwy stan. |
| P20 | Free i plan z płatnym trybem | Brak obejścia uprawnień przez create/prepare/resume/deep link. |

Testy czasu używają kontrolowanego zegara, daty lokalnej i jawnej strefy. Nie czekaj w testach na rzeczywistą północ. Integration test ma uruchamiać aplikacyjne komendy i prawdziwe projekcje; mock własnego nowego helpera nie dowodzi integracji.

## 6. Odbiór, dowody i granica zakończenia

Minimalne dowody: ścieżka source→profile→evaluator→Home, lista tracków z regułą/brakiem reguły, porównanie przed/po dla dwóch różnych profili danych, regresja minimum-osiągnięte/jakość-niespełniona, test stale accept oraz iOS flow submit→Home→proposal→restart.

W raporcie osobno podaj: działająca integracja, faktyczna dostępność reguł w aktywnych pakietach, ograniczenia forecast i elementy czekające na BIZQ-03. Nie ogłaszaj „adaptacyjnego planera” po samym usunięciu `unknown`.

Zadanie zamyka się, gdy rzeczywiste ścieżki korzystają ze wspólnego poprawnego stanu i nie przedstawiają brakujących danych jako dowodu. Brak reguł dla części tracków musi zostać jawnie rozliczony jako ograniczenie pokrycia, nie schowany przez fixture. Gdy kryterium końcowe ma obejmować ukończenie danego tracka, ten brak pozostaje otwartą zależnością produktową.

### Bieżący pakiet wiązań konsumenta — 08.10.2026

Odebrany producer v2 i candidate `9e05819c21304ff4b8f6ea4239efd5044a1b434749b736bbd32c771ba2d56697` mają technical readiness, bez publishing/runtime admission. Canonical writer `candidateContentReleaseLock.mjs write/check` przypina dziewięć aktualnych artefaktów do tego draftu; nie zmienia immutable historycznych admission ani nadaje uprawnień. Test katalogu sprawdza rzeczywiste wiązanie pakietu, nie deklaruje runtime admission. Eksport publicznego demo musi odmówić dla nowego draftu bez admission; pozytywny test pozostaje na dokładnych historycznych bajtach i grantach, bez przepisywania ich hashy. Nie wykonywać eksportu do web ani publikacji. Generated katalog pozostaje zamrożony podczas native Q13.

Niezależny projekt Luna high: PASS WITH GAPS; zgodność/prostota/kontrola ryzyka/utrzymywalność 0,95/0,92/0,90/0,90. Zakres: app release.lock oraz wąskie testy lock/catalog/demo i potrzebne immutable fixtures. Odbiór: canonical checks, pozytywna historia, jawna odmowa aktualnego draftu, zachowane negatywne asercje i niezależne QA. Nie zamyka P01–P20, Q13 ani wydania.

### P18 — ochrona lokalnych zmian podczas synchronizacji (08.10.2026)

Przegląd bieżącego kodu wykazał wyścig: bound sync materializuje po GET poza local learning write lane, a repozytorium sprawdza aktywną sesję tylko przed serią await i destrukcyjnym zastąpieniem historii oraz pary cel–plan. Wynik zakończonej sesji lub edycja pary podczas sieci może zostać nadpisana, a outbox wyzerowany. To konkretne ryzyko utraty danych, nie nowa bramka narzędziowa.

Kontrakt korekty: sieć poza krótkim istniejącym withLocalLearningWriteOperation; bazowy fingerprint/wersja lokalnego datasetu z istniejącego AccountSyncState/buildAccountDataSnapshot przy planowaniu uploadu. Przed jakimkolwiek clear/replace, we wspólnym local lane, świeże binding/profile/session/journal guards i porównanie snapshotu. Rzeczywiste app write owners celu/planu uczestniczą w tym samym lane; bez zmiany synchronicznego API niskich repozytoriów i bez zagnieżdżonego acquire. Zgodny snapshot pozwala na apply+finish; lokalna różnica zachowuje dane i pending outbox/status, bez false synced lub completion ACK, z kolejnym odczytem dopiero w bezpiecznym wejściu. Nie trzymać blokady przez sieć, nie dodawać globalnego frameworka/backend schema.

Potwierdzone applied wersje z odpowiedzi uploadu pozostają podstawą expectedVersion kolejnego lokalnego delta. Przy duplicate bez potwierdzenia odpowiadającego lastMutationId/version nie zgadywać wersji: zachować dane i jawny konflikt/pending, zamiast fake success. Serwerowy batch ACK nie jest lokalnym odbiorem materializacji.

Odbiór: rzeczywiste repozytoria/accountDataService, kontrolowana bariera tylko na API GET, prawdziwy session start/finalize i application goal/plan saves. Sprawdzić local session/results/attempts/para i pending podczas wyścigu, brak false synced/clear, resumeRequired przy active session, brak network pod write lane, normalny no-delta przebieg, transient failure/retry/remote version conflict i izolację profilu. Niezależny design Luna high PASS WITH REFINEMENTS po włączeniu powyższych ograniczeń; oceny0,94/0,82/0,86/0,82. Nie deklarować odbioru P18 przed kodem i testem odtwarzającym ryzyko.

### Następny pakiet odbioru P01/P13/P20 po P18 (08.10.2026)

Niezależna analiza Luna high: istniejąca integracja aktualnego producer/build→runtime→Home/proposal zapisuje próby bezpośrednio, więc nie zamyka P13; pojedynczy pusty rozdział nie dowodzi P01 całkowicie pustego banku. Dodać meaningful testy na aktualnym zweryfikowanym artefakcie: zero attempts i suma wszystkich prawdziwych chapter minimum; rzeczywiste composeTrainingLifecycleUseCases/start Free/submitPracticeResponse→journal/materialization→fresh Home/proposal bez restartu; Free completed chapter plus wszystkie wymagane locked Premium, nieukończona ścieżka i prawdziwa odmowa Premium przed zapisami. Bez nowego admission, fałszywego allowed ani ręcznej zmiany aktora. Scope: istniejące learningPlanProjectionIntegration, Home projection i premiumSessionAdmission tests oraz potrzebny versionowany test harness. Zmiany produkcyjne wyłącznie jeśli test potwierdzi konkretny defekt, po właściwym przeglądzie. Oceny0,93/0,91/0,90/0,91; minimum0,90. Independent QA oceni production-path fidelity i negatywne przypadki, nie samą liczbę testów.

Native submit→Home/proposal oraz cold/offline pozostają osobnym dowodem działania. Bieżący9e jest technical draft bez downstream runtime admission; source tests nie są jego dopuszczeniem. Najpierw odtworzyć właściwy approval contract i sprawdzić realną dostępność narzędzia offline małą próbą. Nie wprowadzać grantu, podmiany pakietu ani mocka offline dla wygody odbioru. Zachować obecnego aktora, Gościa i dziewięć wcześniejszych kont.

Doprecyzowanie niezależnej analizy źródeł: admission jest formalną bramką wydania, a nie runtime guardem lokalnego dev. CanonicalRuntimeCatalog weryfikuje statyczny bundle względem bundled content-lock; verifyBundledPackages→resolveForPreparation→startSession korzysta z niego i rzeczywistych Premium guards. Obecne zweryfikowane bytes9e mogą być badane w normalnym lokalnym debug runtime na istniejącym fixture w ramach autoryzowanego native odbioru. Nie wymaga to nowego PO approval ani zmiany grantów. Wynik opisujemy jako lokalne zachowanie9e bez admission, nie runtime grant/GO. Wcześniejsze przypuszczenie o blokadzie lokalnego startu przez release admission zostało odrzucone na podstawie kodu; gate wydania pozostaje blokujące.

### P18 odbiór oraz rzeczywista próba P14 (08.10.2026)

P18 niezależne re-QA PASS:50/50 lifecycle+21/21 adapter,typecheck/diff. Dodatkowy wykryty risk accountRevisionConflict został naprawiony w tym samym pakiecie: backend legalnie zwraca osobne pole z pustymi applied/conflicts, aplikacja zatrzymuje się teraz przed ACK/GET/materializacją ze statusem conflict i zachowuje dataset/outbox. Niepełne lub powtórzone pokrycie ACK kończy się invalid_response przed zapisami. Pełne qa:static z Node22/currentcontent2aae/historycc3:1996tests/1992PASS/0FAIL/4SKIP. Nie oznacza pełnego BIZQ02.

P14 ma rzeczywisty wynik wymagający analizy: potwierdzony własny smoke backend chwilowo SIGSTOP, health faktycznie timeout, jeden ordinary cold aplikacji, obserwacja ekranu Couldn't finish signing in zamiast Home, SIGCONT w finally i ten sam backend health200. Metro i emulatory z danymi pozostały aktywne. Flow obserwacyjny exit0 oznacza skuteczny odczyt ekranu, nie PASS wymagania. Prywatny manifest `/private/tmp/patternly-bizq02-native/manifest.json` wiąże commands/screenshot i warunki; nie kasować konta/Gościa dla obejścia. Wcześniej Home→Set a goal działało, żadnego save/nowego submit jeszcze nie wykonano. Niezależny projekt najmniejszej korekty offline/identity/security odebrano poniżej; sole worker Luna high wdraża pełną produkcyjną ścieżkę. P01/P13/P20 source acceptance PASS26/26; po usunięciu nieużywanych importu/parametru22/22+4/4PASS. Natywny submit/proposal/restart pozostaje do odbioru.

### P14 — zatwierdzony projekt lokalnego wznowienia konta offline

Właściciel: istniejący `profileStorageRouter.ts`, szyfrowany root store i aplikacyjna fasada `profileStorageRepository.ts`/`mmkvClient.ts`. Jeden osobny wersjonowany dual-slot envelope bindingów, bez drugiego registry, zmiany ROOT_VERSION lub semantyki GuestInstallation. Dokładny verified binding: profileId/profileKind, accountId, Firebase UID i monotoniczna **lokalna** verificationRevision. `/me` nie ma server accountRevision/generation; nie fabrykować pola ani zmieniać backendu. Właściwy kontrakt zapisano w workspace docs04. Zapis wyłącznie po online `/me`, zgodnym bieżącym SDK UID/runtime session fence i aktywacji dokładnego profilu/lease; synchronizacja zapisu i read-back, zachowanie innych bindingów/profili. Najwyższa poprawna rewizja jest kanoniczna; invalidacja/tombstone otrzymuje wyższą rewizję przed sprzątaniem. Corrupt/ambiguous/torn slots nie pozwalają spaść na wcześniejszy verified binding. Brak bindingu w starym profilu wymaga normalnego online proof, bez migracji/zgadywania lub cache Premium jako źródła tożsamości.

Kanoniczny nowy stan to `localOffline`, osobna nietrwała zdolność lokalnej nauki; nigdy authenticated z syntetycznym backendUser. Tylko transport_failed/request_timeout lub faktyczna sieciowa niedostępność SDK może uruchomić istniejący zweryfikowany profil tego samego UID. Auth401/account_deleted/token invalid/expired/disabled, profile/UID/account mismatch, logout/deletion/recovery guards i uszkodzony binding pozostają fail-closed. Profile tylko istniejące, bez create/adoption/Guest fallback. Canonical lifecycle odtwarza pending journal przed praktyką; recovery failure blokuje, odzyskiwalny journal nie jest permanentną blokadą offline. Właściciel local identity/fence wspiera Home/Progress/proposal/practice i istniejący bounded Premium cache; Q13 diagnostyczny scope authenticated pozostaje uczciwy. Brak transferu cache, dodatkowych dni lub offline download.

Wszystkie działania serwerowe/account-security/purchase/restore/export/download nadal wymagają online authority; lokalne zapisy zachowują outbox/pending. Lokalny sign-out może odwołać dostęp SDK i wykonać istniejącą trwałą politykę pending revocation, bez udawania sukcesu sieci. Known logout/deletion/revocation invaliduje binding przed możliwością ponownego lokalnego użycia; po potwierdzonym usunięciu binding nie przechowuje surowego UID/account mapping. Reconnect idzie przez bieżącą weryfikację konta i P18, bez transferu profilu lub kasowania faktów poza istniejącym autorytatywnym deleted-account cleanup.

Zakres: router/MMKV/profile façade oraz testy A/B CAS/invalidation/fencing; AccountSessionProvider/profileStartupCoordination i testy rzeczywistych ownerów; RootNavigator/ContentPreparationGate/produkcyjne identity fences/Home/Practice/Premium i account command guards według faktycznych referencji; minimalny czytelny lokalny status UI i tłumaczenia we właściwych ownerach. Jedyny wykonawca Luna high, zachowuje cudzy diff i10 wcześniejszych profili. Niezależny design PASS WITH REFINEMENTS0,95/0,83/0,84/0,84; final root0,94/0,82/0,85/0,84. Nie potrzeba nowej decyzji PO: docs08 już wymaga tej zdolności.

Odbiór: positive online binding→real product cold transport→local learning bez remote authority; brak/corrupt/torn/ambiguous binding, UID/profile/SDK generation transitions, pending logout/deletion/recovery, auth401/deleted/invalid token; interrupted tombstone cleanup nie przywraca bindingu; rzeczywisty submit/outbox/restart/reconnect P18; cached Premium expiry/denial/foreign identity; Q13 authenticated fences i Guest pozostają zgodne. Natywnie normalny online proof zapisuje binding (bez ręcznego seed), następnie real backend timeout/cold Home/Progress/proposal i lokalna odpowiedź/restart; wszystkie wcześniejsze profile i ich dane zachowane, backend przywrócony. Same helper mock/typecheck nie zamykają P14.


#### P14 — powtarzalny odbiór natywny niedostępności backendu

Niezależny przegląd Luna high: PASS WITH REFINEMENTS. Przepis odbioru korzysta z istniejącego iPhone17 i zwykłej ścieżki produktu; nie resetuje danych, nie tworzy nowego konta ani nie zastępuje profilu Gościem. To test `backend unavailable during cold start`: Auth/Firestore i Metro pozostają aktywne, więc nie oznacza fizycznego offline wszystkich usług.

1. Potwierdzić właściciela bieżącego backendu i portu, health oraz pojedynczą instalację. Wykonać zwykłe online uruchomienie, które zapisuje binding przez prawdziwe `/me`. Nie seedować bindingu ręcznie.
2. Na istniejącym syntetycznym profilu normalnym UI zapisać cel i otworzyć rzeczywistą propozycję/plan. Uchwycić Home/Progress i niepuste wejścia/wynik planu. Jeżeli zapis nie zadziała, odczytać stan i przyczynę przed ponowieniem mutacji. Wykonać istniejący Q13 read-only receipt dopiero po tym przygotowaniu.
3. Wstrzymać wyłącznie potwierdzony własny proces backendu. Potwierdzić rzeczywisty timeout HTTP, zwyczajnie zamknąć i uruchomić tę samą aplikację. Sprawdzić jawny stan lokalny, ten sam profil oraz Home/Progress/goal/proposal bez zależności obliczeń od backendu; diagnostyka Q13 nie otrzymuje offline authority.
4. Zwykłym UI wykonać jedną lokalną odpowiedź i pauzę. Ponownie zwyczajnie uruchomić aplikację i potwierdzić zachowany postęp/plan oraz sesję. Przy błędzie profilu/journala/bootstrap zachować stan do diagnozy, bez resetowania i ślepych mutujących retry.
5. Zawsze przywrócić dokładnie ten sam proces backendu w `finally`, potwierdzić health, następnie zwyczajnie wznowić online przez istniejącą weryfikację i P18. Odbierać rzeczywiste potwierdzenie/outbox zgodnie z kontraktem; nie udawać sukcesu sieci.
6. Końcowy online receipt dopuszcza wyłącznie znane zmiany aktualnego aktora (cel/plan, odpowiedź/sesja, kontrolowane binding/sync). Pozostałe profile i chronione kategorie muszą pozostać zgodne. Surowe dane, sekrety i obrazy pozostają prywatne; bieżący manifest zapisuje źródła, warunki i odciski, nie tokeny ani identyfikatory kont.

Politykę SDK transport rejection, revoked/deleted/invalid auth, błędne bindingi, stale generation i zabronione komendy serwerowe odbierają odpowiednie rzeczywiste source/composition tests. Cached Premium zachowuje własne terminy i uprawnienia; odmowa wygasłego Premium nie jest błędem kontynuacji Free. Przepis jest przygotowaniem odbioru, nie dowodem wykonanego PASS.


#### Pozostały odbiór P01–P20 — niezależna mapa źródeł

Read-only analiza Luna high potwierdza źródłowe pokrycie P01–P12 i P15–P20 przez istniejące production-composition/evaluator/proposal/editor/lifecycle/reminder testy; nie wykonywała tych testów ponownie. P01/P13/P20 mają wcześniejszy niezależny PASS26/26, P18 lifecycle50/50+adapter21/21. P02 używa celowo modelowanego braku reguły, ponieważ wszystkie aktualne dziewięć artefaktów ma prawdziwe reguły; nie wymaga tworzenia pustego produkcyjnego tracka. P19 jest odbierane trwałym zapisem i prawdziwym reminder-ownerem z pending/retry/failure; macierz nie dodaje osobnej natywnej bramki schedulera.

Najmniejszy pozostały wynik: pełne source QA P14 po zamrożeniu; jeden rzeczywisty iOS ciąg P13 `Free submit → materializacja → Home → proposal` w tym samym procesie, następnie P14 restart przy niedostępnym backendzie, lokalny zapis/pauza/restart i reconnect/preservation; pełne `qa:static` z właściwymi cross-repo wejściami po P14, ponieważ zmienia ono wspólne account/storage/bootstrap ownery. Dopiero te wyniki mogą zamknąć cały obszar. Bieżąca analiza nie deklaruje nowych PASS wykonania ani admission/GO.


#### P14 — doprecyzowanie jawnej odmowy tożsamości

Niezależny przegląd rzeczywistego kontraktu `/v1/me`: PASS WITH REFINEMENTS. Trwała invalidacja bindingu opiera się na issuer/context/status/serverCode rzeczywistej weryfikacji tożsamości, nie samym ogólnym `AccountFailure`. App Check poprzedza identity guard: jego `app_check_required`/`app_check_invalid`401 i `app_check_not_configured`503 nie odrzucają powiązania konta i nie mogą go tombstonować. Jawne identity-denial401 (`authentication_required`, `account_deleted`, `authorization_generation_required`, `authorization_generation_invalid`, `authorization_generation_stale`, `firebase_authorization_generation_invalid`) oraz potwierdzony brak kanonicznego konta404 (`user_not_found` w rzeczywistej trasie lub `account_not_found`) blokują ponowne lokalne użycie również po cold starcie. Learning/profile facts pozostają zachowane.

Lokalny brak/mismatch SDK metadata (`auth/authorization-generation-invalid`) nie jest odpowiedzią autorytatywnego serwera; recent/reauth wymagane do odrębnej wrażliwej komendy nie unieważnia globalnie pozytywnego bindingu. Testy rozdzielają te sygnały, issuer i status, potwierdzają tombstone po ponownym otwarciu ownera oraz brak invalidacji po odmowie App Check. To doprecyzowanie istniejącego known-denial kontraktu, nie nowa decyzja produktu ani potwierdzenie odbioru kodu.


#### P14 — wynik pełnego source QA i następna korekta

Niezależne SOURCE QA **FAIL** po155/155 focused tests i dodatkowym21/22 accountCommandGuards. Dwa potwierdzone blokery: localOffline reconnect przez ogólny finalizeCurrent publikuje backendUnavailable po timeout i odbiera Home; nieudany commit tombstone może pozostawić verified binding, który następny cold/transport wskrzesi. Konieczna jest rzeczywista kontrola provider/finalizer i durable fail-closed przy fault/reopen, z zachowaniem learning/profile facts. Przed istotną korektą persistence wykonawca przedstawia propozycję, a kontroler zapisuje kontrakt i uzyskuje niezależny design review. Nie zamykać na helper tests ani samym UI revoked.

Root full qa:static na proper Node22/current2aae/historycc3:2010tests/2005PASS/1FAIL/4SKIP; log prywatny `/private/tmp/patternly-bizq02-p14-static-1vltj8v5.log`. Jedyny gate failure jest lexical count deletion call-site w accountCommandGuards: dwie istniejące ścieżki używają teraz callbacks invalidacji/reminders, a regex przecina średnik. Semantyczny guard/reminder contract musi pozostać sprawdzony; nie przywracać duplikacji dla licznika.

CODE_ONLY UI audit skorygowany do PASS WITH ISSUES: Premium adapter nie powstaje bez online authenticated accountId, więc Restore/Manage są prawidłowo blokowane; wcześniejsze P1 było false positive. Potwierdzone P2: mylący komunikat braku konta dla localOffline oraz brak `state.localOffline.title/body` we wszystkich siedmiu data.json. Uzupełnić minimalną prawdziwą kopię i sprawdzić klucze używane przez render. Native/rendering/theme są nadal NOT_VERIFIED; VoiceOver poza zakresem. Żaden powyższy wynik nie zamyka P14 ani całego BIZQ02.


#### P14 — propozycja proof barrier przed weryfikacją tożsamości

**Projekt zatwierdzony do implementacji po niezależnym PASS WITH REFINEMENTS; nie odbiór kodu ani native.** Wykonawca/root: zgodność0,94, prostota0,84, ryzyko0,83, utrzymywalność0,84; minimum0,83. W istniejącym canonical dual-slot binding ownerze, bez nowego store/klucza/schematu, exact wcześniej verified binding zostaje CAS-tombstonowany i odczytany przed wysłaniem identity proof. Poprzedni binding jest wyłącznie w pamięci żywej operacji. Brak trwałego barrier oznacza zero proof calls. Known denial pozostawia już trwały tombstone, więc nie zależy od zapisu dopiero po odmowie.

Qualified transport/timeout może w tej samej operacji odtworzyć poprzedni binding wyłącznie przez exact własny barrier revision/receipt, świeże UID/profile/lease/generation guards i canonical CAS/readback; dopiero po sukcesie wolno publikować localOffline. App Check i inne nie-identity błędy nie stają się globalnym revoke; odtworzenie previous binding także musi być trwałe i scope-safe. Failed/ambiguous restore pozostaje blocked. Po crashu brak poprzedniego proof w pamięci: trwały tombstone blokuje cold transport do zwykłego fresh online proof. To koszt przerwania security verification, bez usuwania danych nauki lub adopcji innego profilu. Brak matching wcześniejszego bindingu nie tworzy proof z UID ani cache.

Pytania do review: dokładny token własnego barrier musi wykluczyć restore po nowszej invalidacji; ordering musi objąć także SDK refresh/reload mogące zwrócić definitive denial, nie tylko późniejsze `/me`. Odbiór wymaga real owner/composition fault tests: barrier failure bez żądania; barrier+denial+reopen+timeout denied; same-process transport restore tylko po readback; restore failure/reopen denied; stale scope/revision na każdym await; App Check bez globalnego revoke; interruption bez odzyskiwania proof z danych obcego profilu. Niezależne rozstrzygnięcie i obowiązkowe refinements zapisano poniżej; można implementować zgodnie z nimi.


Niezależny design review proof barrier **PASS WITH REFINEMENTS**,0,94/0,84/0,83/0,84. Atomowy owner CAS przechowuje exact preimage verified entry/checksum/revision i wydaje receipt trwałego tombstone z checksum/revision/envelope generation. Restore sprawdza receipt wewnątrz tego samego ownera/lock, nie przez zewnętrzny read-check-write; nowy verified wpis otrzymuje nową monotoniczną rewizję. Wyższy tombstone/generation, niejednoznaczność, zmiana UID/profile/lease/session lub niedokończony odczyt blokują restore. Brak trwałego barrier/readback blokuje wszystkie proof calls.

Barrier musi poprzedzać także SDK `reload`, forced token/claims i exchange: istniejące refreshAccountIdentity, refreshVerification i cold getMeWithExchangedSession→getAuthorizationGeneration są w tym zakresie. Współdzielą jedną canonical orchestration zamiast równoległych ścieżek. Po przerwaniu barrier zwykły pozytywny online proof odnawia exact account binding; transport nie odtwarza utraconego in-memory poprzedniego proof. Profile/facts są nienaruszone. App Check i inne nie-identity errors mogą scope-safe odtworzyć wcześniej verified binding, ale nie są nowym transportowym dowodem localOffline; cold entry pozostaje ograniczone do rzeczywistego kwalifikowanego transportu. Istniejąca lokalna sesja nie może zostać odebrana przez samo nieautorytatywne niepowodzenie reconnect.

Wymagane fault/race/ordering tests obejmują zero SDK claims/reload/exchange/API przed trwałą barierą, refreshVerification, denial/reopen/timeout deny, exact transport restore dopiero po readback, failed restore/reopen deny, App Check bez globalnego revoke i bez fałszywego transportu, nowszą invalidację oraz każdą zmianę actor/session/profile/lease. Skutki po crashu jawnie należą do istniejącej fail-closed recovery boundary; nie kasować profili ani zastępować ich Gościem.


CODE_ONLY re-audit poprawionej kopii **PASS**: oba P2 zamknięte źródłowo,21/21 niezależnych testów Node22 (YourData/Settings presentation, Premium i locale parity), diffcheckPASS. Premium jasno odróżnia localOffline konto od braku konta; YourData ma rzeczywiste title/body we wszystkich siedmiu locale. Adapter/online-only blokady zachowane. Native rendering/scroll/duży tekst/motywy nadal niezweryfikowane; VoiceOver poza zakresem. Binding/provider i cały P14 nie są objęte tym ograniczonym PASS.


Fault-stage design refinement niezależnie **PASS WITH REFINEMENT**: dla restore po kwalifikowanym transport/timeout bez known denial rozróżniać przed-set failure (najwyższy tombstone, cold deny), torn/malformed/ambiguous write (owner error, cold deny) i pełny trwały verified commit z błędem wyłącznie późniejszego readback/ACK. Ostatni przypadek nie publikuje localOffline w żywej operacji; nowy proces może odebrać rzeczywisty najwyższy poprawny verified wpis przez fresh canonical read i zwykłe UID/profile/lease/journal fences. Nie dodawać mocniejszego obowiązku cold-deny po rzeczywiście poprawnym restore tylko z powodu utraconego ACK. Known identity denial nigdy nie wykonuje restore i zawsze pozostawia trwały barrier, więc gwarancja denial/reopen deny pozostaje bez zmian. Bieżąca już-localOffline operacja po failed restoreACK także zamyka lokalny capability do rozstrzygnięcia; nie kontynuuje ślepo z tombstonem. Testy oznaczają dokładny moment awarii względem set/readback/publish.


#### P14 — propozycja zachowania trwałej odmowy zapisanej przez sync

**Zatwierdzone do implementacji po niezależnym PASS WITH REFINEMENTS; nie odbiór kodu/native.** Actual sync utrwala lastFailureCode, lecz dotychczas generic401 stawało się revokedSession, local read pomijał marker, a rozpoczęcie retry go czyściło. Propozycja zachowuje istniejący schema marker revokedSession, także stare rekordy o utraconym issuerze; rozpoznaje go dla precyzyjnej identity status/code allowlist. App Check, sensitive-only recent/reauth i client-only brak tokena nie są autorytatywną odmową serwera. Lokalny odczyt blokuje canonical known marker, nie dowolny failed/status/error.

Start sync i transient retry nie mogą usuwać ani przykrywać znanej odmowy. Wyłącznie świeży pozytywny exact `/me` dla tego samego opaque accountId/FirebaseUID rozwiązuje marker przez mały API istniejącego accountDataService, pod aktualnym profile lease/session guard i canonical local lane przed P18sync. Sieć pozostaje poza write lane. Bez nowego store/schematu i bez uznawania generic sync200 za nowe mapowanie konta. Testy na rzeczywistych ownerach: deny→retrytransport→marker zachowany/localread denied; AppCheck/recent controls; exact positiveproof clearsmarker, wrong/stale profile/account/UID/generation nie; P18 ACK/outbox/race bez regresji. Scores0,95/0,84/0,84/0,86, minimum0,84; to projekt, nie wynik kodu/native.


Niezależny sync-denial design review PASS WITH REFINEMENTS0,95/0,84/0,84/0,86: existing AccountSyncState waliduje lastFailureCode jako niepusty string, bez migracji. Zachować dokładne autorytatywne identity status/serverCode oraz legacy revokedSession; client-only authentication_required bez serwerowego status/issuer musi dostać odrębny nieautorytatywny marker, aby nie był mylony z tym samym kodem serwera401. App Check i recent-only pozostają poza identity allowlistą.

Guard działa przed resetem/request zarówno synchronizeBoundAccount, jak i retryPendingAccountDataSync; powtórzyć w local planning lane przed lastFailureCode:null. Tylko explicit local-only service operation po pozytywnym exact `/me` może usunąć matching account-scoped denial. Current UID/session generation/profile lease musi być sprawdzony wewnątrz lane. Nie kasować outboxu, pending confirmation, conflict ani innych pól; sieć poza lane. Failed clear po positive `/me` blokuje do ponownego normalnego proof, bez fake success. Zwykły sync GET/POST200 nie zastępuje `/me`. Obowiązkowe actual owner testy: exact/legacy marker zachowany przy retry bez sieci, nonidentity controls, fresh correct proof clears only marker, wrong/stale scopes deny, P18 retry/outbox bez regresji.

#### P14 — ordering recovery po niezależnym przeglądzie

Drain przed profile preparation pozostaje: durable pending/blocked marker nie jest usuwany przed pełnym revoke/custom-token/UID/generation acknowledgement; jego błąd kończy signOutPending i blokuje localOffline. Nie dodawać redundantnego barrier przed drain. W istniejącym proof-barrier podejściu guardRecoveryBeforePreparation musi rozróżniać definitive SDK identity denial od transportu i zachować tombstone. Explicit recovery utrzymuje barrier aż do końca dalszych SDK generation checks, nie tylko do odpowiedzi /me. Lokalny generation mismatch/authorization-generation-invalid nie jest samodzielną odmową serwera. Independent Luna high PASS WITH REFINEMENTS; korekty w tym samym zatwierdzonym pakiecie, bez rozszerzenia auth i bez deklaracji odbioru kodu.

Po successful completeExplicitRecoveryAccountTransition provider-first-use pomija wyłącznie redundantny forced SDK read/reconcile, ponownie sprawdzając aktualne UID/session i exact issue/deferredFor identity/generation oraz blocksProfilePreparation=false przed exchange. Transition już sprawdził te generation reads pod barrier. Generic guard pozostaje dla null/no-transition i innych callers; wymagany forced proof read przy istniejącym matching binding nadal pod durable barrier albo bez ponownego read przy już exact validated identity. Independent Luna high PASS WITH REFINEMENT; regression obejmuje brak post-restore forced read na success i zachowanie gate na innych ścieżkach.

#### P14 — jeden proof scope recovery guard (zatwierdzony projekt)

Niezależny Luna high PASS WITH REFINEMENTS; scores0,95/0,83/0,82/0,84. Root0,95/0,82/0,84/0,83. Istniejący binding owner, bez nowego auth/store: guard-owned scope lazily przed pierwszym forced generation/exchange/signin lub identity-bound reconcile/status. Optional caller-owned generation/barrier w finalize/startPrep nie tworzy nested tombstone i nie jest rozwiązywany przez guard przed zewnętrznym /me. Direct callers current-or-begin token; selected prepared profile/storage generation pozwalają użyć istniejącego prepared binding także przy closed active lease. Brak/stale exact scope fail-closed.

Po każdym await (load/reconcile/SDK/status/exchange/signin) aktualne UID/session token/profile/storage generation/recovery operation muszą odpowiadać captured scope. Denial nigdy restore; barrier pre-set/torn/readback fault zero proof calls; qualified transient exact receipt restore przy niezmienionym scope. AppCheck/recent nonidentity mogą restore proof, lecz nie usuwają recovery gate i nie tworzą localOffline. Positive generation/status przy nadal blocking recovery nie stanowi fresh exact /me i może pozostawić tombstone; po rozliczeniu recovery normalny online proof odtwarza mapping. Semantyka recovery vault/drain/sensitive authorization pozostaje.

Te same rzeczywiste forced generation/recovery-exchange boundaries w issueRecoveryCodes, requestRecoveryCodeReplacement i sameUID resumePendingRecovery używają tego samego minimalnego scope; nie rozszerzać na niepowiązaną reauthentication. Testy: prepared-only closed owner, zero calls przy barrier failure, denial→terminal clear→coldtransportdeny, exact transient restore, caller-owned bez nested barrier, stale UID/token/profile/storage/recovery operation, Guest/no-proof zero barrier i command denial/writefailure. Projekt PASS nie oznacza source/native acceptance.

Recovery operation successor fence: actual vault previousIssue już potwierdza exact predecessor operationId, same UID/generation i prior delivery_unconfirmed; replacementPending boolean nie dowodzi lineage. Nowy opId zaakceptować wyłącznie w explicit status-confirmed replace z poprzednikiem równym captured opId. Ephemeral coordinator snapshot predecessor ID lub typed transition receipt może wyprowadzać istniejący record.previousIssue bez zmiany durable schema. Same-operation oraz terminal exact accepted operationId zachowują dotychczasowe reguły; arbitrary sameUID/gen issue, changed identity/deferred/malformed/uncertain state blokują. Independent Luna high PASS WITH REFINEMENT.


### Bieżący natywny odbiór P13/P14 — 08.10

P13: rzeczywisty currentOOD24 submit bez Next/restartu zmienił Progress i fresh proposal360→359/1qualifying/0of9complete; independent actual-image narrow PASS. Weekly Home activity ma osobny zatwierdzony filtr aktywnej sesji; nie zmieniać go dla tej bramki. UI confirmed gap: rawchapterIDs w Progress z powodu stale displaymap; naprawić display-only po diagnostyce P14, nie dodawać selectable nodes dla samego label.

P14 source re-QA110/110 i fullqa2021PASS/0FAIL/4SKIP nie wystarczyły: actual ownbackendSIGSTOP/healthtimeout/ordinarycold pokazał Home shellReadError „Patternly is unavailable”. Finally ten samPIDCONT/health200; zwykłe Try again online otworzyło tę samą pausedsession2. Prywatne dowody `/private/tmp/patternly-bizq02-native/manifest.json`. To FAIL, nie environmentalBLOCKED ani dowód utraty danych. OOD23 historyczne jest błędną próbą, OOD24 aktywną poprawną; hipoteza exactoldcontentfailure nie wyjaśnia onlinePASS bez retained23.

Najmniejsza zmiana diagnostyczna odebrana independentLunaHighPASS: lokalne wrappers istniejących Home read/fence etapów, wyłącznie dev console fixedprefix/stage/existingwhitelistedoperationalcode, rethrow exacterror; zero rawmessage/stack/records/IDs, persystencji, UI fallback lub nowegoowner. Scores0,98/0,94/0,95/0,93. SolewriterLunaHigh, root posiada nativeprobe i cleanup. Następna rzeczywista próba dopiero po odróżnieniu etapów; usunąć tymczasową diagnostykę po potwierdzeniu i naprawie przyczyny.


P14 actual safe-stage evidence: cloud_progress/LOCAL_OPERATION_FAILED. Source+independentreview potwierdzają lifecycle race: completeProfilePreparation publikuje localOffline wewnątrz gate bootstrap, App.needsContent pomija ten stan i odmontowuje gate przed verifyBundledPackages/resume/ready. Canonical correction: localOffline korzysta z tej samej ContentPreparationGate do pełnego ready/unavailable outcome i application-session NavigationContainer key co authenticated/Guest. Callback statepublish nie zmienia dependency identity; brak nowegoowner/prepareadHoc/skipGCP. Offline→online zachowuje trasę i pełne guards. Q13 exactmissing pozostaje jawne w gate. Design independentLunaHigh PASS WITH REFINEMENTS, root scores0,98/0,95/0,90/0,94. Weryfikacja actualAppcomposition gatehold/ready/unavailable/keytransition oraz realcoldtimeout; remove temporarydevdiagnostic po poprawce.


### P14 — lokalna gotowość aplikacji i dostęp do wznowienia

Actual safe diagnostic: resuming-session/lifecycle_resume/premium_entitlement_unavailable; timer restore nieosiągnięty. Design Interview Learn Framework jest Premium (wcześniejsza klasyfikacja Free w recipe/brief była błędna). Zachować NetInfo/cache expiration/actor i authorization-before-exact kolejność; nie wykonać exact resolvera lub validateResume przed autoryzacją.

Zatwierdzony wynik `home_ready_resume_unavailable` jest odrębny od ready/resumed i content_identity_unavailable. Tylko typed TrainingApplicationFailure premium_entitlement_denied/unavailable podczas resuming-session, po successful storage/journal recovery/verifybundle i structural active-pointer/session/draft validation, pozwala udostępnić lokalny shell z zachowaną sesją. Exact identity pozostaje jawnie niezweryfikowana z braku dostępu; nie twierdzić, że sesja wznowiona. Nie mutować session/pointer/draft/attempt/timer przy odmowie. Wszystkie inne errors zachowują blocking/unavailable.

Przed publikacją ponownie sprawdzić istniejącego ownera actor/profile lease/generation oraz canonical active session/draft snapshot. LocalOffline fence należy do AccountSessionProvider przy existing isCurrentLocalOfflineActor; nie rozszerzać Q13receipt admission i nie tworzyć persistent UID/schema. Stale actor/profile/session nie może dostać partialready.

Gate posiada tylko ephemeral scoped UIprojection(sessionId/reason/scope), nie nowego właściciela danych. Home pokazuje zachowaną niewznowioną sesję i umożliwia retry przez tę samą canonical resume; status nie daje dostępu ani nie wyłącza retry. Clear dopiero po successful canonical resume i exact session/track/mode match lub zmianie scope/actor; przy reconnect marker wygasa bez rebootstrap/remount nawigacji. Design Simulation preauth grant nie czyści statusu; successful openDesignInterviewSimulation z expectedsessionmatch tak. UI nie ujawnia IDs/technicznych informacji o exact validation. Usunąć całą tymczasową diagnostykę w tym pakiecie.

Independent Luna high design PASS WITH REFINEMENTS0,94/0,82/0,86/0,82; root0,95/0,82/0,87/0,84. Weryfikacja oba Premium failures→partialready/no mutations/real gatedretry, stable+stale actor/session/profile, successful resume/reconnect clear, content/journal/draft failures nadalblocking/unavailable. Fullgate po rendererfix i tym pakiecie; realcoldbackendtimeout→Home/Progress/proposal z właściwym statusem, negativeResume i zachowanie danych; następnie rzeczywisty Free workflow w tym samym syntetycznym profilu po normalnym zakończeniu własnej sesji, bez resetu/nowego konta.

### CI — rzeczywista zależność przygotowania producenta (08.10.2026)

Integracyjny app commit `0c500a7667e6c9701fce67ca5496aecc4a3bb31a` pushed. CI37750902021 zatrzymało oba jobs przed testami: lock reader importuje sync module, a ten canonical producer `question-contract.mjs`, zanim workflow pobierze current producer. To setup-order defect, nie niedostępność wejścia ani failure testów produktu. Oba istniejące current checkout kroki (repo/refmaster/path/fetchdepth bez zmiany) mają poprzedzać Read immutable content lock. Historicalexactpin/checkout, actualcurrentSHA, candidatecommit reachability oraz candidatecheck pozostają po przygotowaniu ich wejść i nadal obowiązują. Nie zmieniać validatora/pinu/locka/admission i nie dodawać fallbacku. Projekt independentLunahighPASS; zgodność/prostota/ryzyko/utrzymywalność0,99/0,98/0,95/0,97. Odbiór: dependency-order regresja obu jobs, actualisolated missingproducerfailsclosed→presentproducerpin/historicalpin/candidatecheckPASS, focusedlocktests i niezależny QA, zwykły push+actualCI. Runtime/native dowody BIZQ02 nie zmieniają się przez tę korektę pipeline.

CI preparation correction SOURCE niezależnie PASS: Node22 focused23/23, installedYAMLparserpotwierdza oba joby i unchanged repo/ref/path/fetchdepth, whole2filediff/diffcheckPASS. Actualisolatedprobe missingproducer ERR_MODULE_NOT_FOUND→presentproducer bothpins/exacthistoricalcheckout/candidatecheckPASS. Własny privatecopiedprobe usunięto po QA; canonicalcurrent/history repos oraz reprotools zachowane. Rzeczywisty następny CI po pushu nadal wymagany.

ActualGitHubCI po correctedpipeline09d2e655:37751944348SUCCESS RecoveryQA iMulti-trackcontentcontract;2033tests/2029PASS/0FAIL/4SKIP. Nie zmienia toHTTP/Admin4SKIP naPASS ani admission/GO.
