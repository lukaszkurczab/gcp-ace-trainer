# BIZQ-02 — rzeczywisty postęp i integracja istniejącego planu

**Priorytet:** P0  
**Główne repo:** aplikacja; content, jeżeli reguła nie dociera przez istniejący kontrakt; backend tylko dla rzeczywistej zmiany atomowej pary cel/plan  
**Zależności:** wspólny [plan BIZQ](00-PATTERNLY-BIZQ-PLAN-ROBOCZY.md); można rozpocząć niezależnie od redakcji BIZQ-01  
**Cel:** istniejący plan i Home mają wykorzystywać rzeczywiste dowody oraz właściwą regułę ukończenia, z jawnym `unknown` wyłącznie dla faktycznie brakującej reguły.

## 1. Bieżący stan i pozostały odbiór

Porównanie 07.10:  `learningEvidenceProjection.ts` kwalifikuje exact package attempts, deduplikuje, odrzuca conflicting/future evidence i wywołuje `evaluatePackageCompletion`. HomePlanSnapshotReader i ProposalCoordinator konsumują tę projekcję, forecast i freshness/profile fences; Progress ma już actual activity/completion presentation. Stały unknown niezależny od dowodów został zastąpiony. Nie wykonywać tych etapów od nowa.

`PackageCompletionRuleV1` i transport reguły ze źródła do artefaktu istnieją. Właściciel zatwierdził 07.10 konkretne progi dziewięciu ścieżek opisane poniżej, lecz nie zapisano ich jeszcze w aktywnych pakietach. Do dostarczenia rzeczywistej reguły wynik `unknown` pozostaje poprawny. Wybór powtarzanej sesji i szacowanie czasu należą do BIZQ-03.

Pozostałe zadanie to pełny odbiór P01–P20 na istniejących owners: identity/offline/restart, stale accept, submit→Home→proposal→restart, active-session conflict, reminders i Premium. Nie przedstawiać synthetic-rule testu jako realnego ukończenia pakietu ani snapshotu po ACK jako interrupted recovery. Zakres wymaganej brakującej implementacji wynika wyłącznie z nieprzechodzącego kontraktu tej macierzy.

To integracja postępu, nie nowy planner adaptacyjny. Zachować istniejącą shared projection i policy, bez nowego źródła prawdy.

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

**Decyzja właściciela z 07.10.2026 — zatwierdzone progi startowe:** każda ścieżka otrzymuje własną wersjonowaną regułę z poniższym minimum prób oraz `rollingWindowSize=40`, `qualityThreshold=0.8`. Ukończenie wymaga osiągnięcia minimum i co najmniej 32 wyników `correct` w ostatnich 40 kwalifikujących próbach. Wynik `partial` nie liczy się jako poprawny. To decyzja o polityce produktu; nie jest dowodem wdrożenia ani skuteczności nauki.

| Ścieżka (`trackId`) | Jednostki umiejętności w obecnym źródle | Zatwierdzone minimum prób | Wersja pakietu stanowiąca podstawę decyzji |
| --- | ---: | ---: | --- |
| AWS (`aws-certified-solutions-architect-associate`) | 145 | 580 | `aws-certified-solutions-architect-associate-authoring-v2026.09.21-odk096` |
| GCP (`google-cloud-associate-cloud-engineer`) | 152 | 620 | `google-cloud-associate-cloud-engineer-authoring-v2026.08.11` |
| Azure AZ-104 (`microsoft-azure-administrator-associate-az-104`) | 75 | 300 | `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15` |
| Azure AI-901 (`microsoft-azure-ai-fundamentals-ai-901`) | 64 | 260 | `microsoft-azure-ai-fundamentals-ai-901-authoring-v2026.08.15` |
| Claude (`claude-certified-architect-professional-certification`) | 38 | 160 | `ccarp-2026.10.07` |
| Coding Interview (`coding-interview-dsa-problem-solving`) | 213 | 860 | `coding-interview-dsa-problem-solving-authoring-v2026.10.02-bizq01-04` |
| Backend System Design (`backend-system-design-interview`) | 89 | 360 | `backend-system-design-interview-authoring-v2026.10.03-bizq01-14` |
| Frontend System Design (`frontend-system-design-interview`) | 88 | 360 | `frontend-system-design-interview-candidate-v2026.08.15` |
| Object-Oriented Design (`object-oriented-design-interview`) | 79 | 320 | `object-oriented-design-interview-authoring-v2026.10.05-bizq01-24` |

Podstawa propozycji: czterokrotność liczby jednostek umiejętności, zaokrąglona w górę do 20. Liczby jednostek i wersje odczytano z walidowanych źródeł dziewięciu aktywnych ścieżek przez `patternly-content/scripts/model-evaluation/inventory.mjs`, bez zapisu nowego raportu. Ten przelicznik służy wyłącznie do uzasadnienia zatwierdzonych minimów. Nie jest automatycznym algorytmem zmiany progów po rozbudowie banku ani wymogiem czterech odpowiedzi w każdej jednostce.

Właściciel zatwierdził propozycję po ujawnieniu, że powtórzenia są dopuszczone, a wąski zestaw pytań może spełnić regułę. Ukończenie nie potwierdza pokrycia wszystkich tematów, opanowania materiału ani gotowości do egzaminu lub rozmowy. Progi są polityką startową, nie wartościami skalibrowanymi na wynikach użytkowników. Nie dodawać ukrytej bramki pokrycia ani zmieniać punktacji.

Do wykonania w BIZQ-02: zapisać zatwierdzone reguły w kanonicznym źródle każdej ścieżki i dostarczyć je przez istniejący proces budowania, wersjonowania, dopuszczenia pakietu, przypięcia w aplikacji i odczytu profilu. Zachować dokładne przypisanie prób do wersji i skrótu artefaktu; nie zmieniać już przypiętego pakietu w miejscu ani wpisywać progów w Home. Do dostarczenia reguły pakiet zachowuje `unknown`.

Weryfikacja dostarczenia: dla każdej ścieżki odczytana reguła ma zgadzać się z tabelą oraz wartościami 40/0,8. Sprawdzić minimum minus jedna próba, osiągnięte minimum z wynikiem 31/40 oraz osiągnięte minimum z wynikiem 32/40. Powtórzenia liczą się zgodnie z obecnym kontraktem, duplikat tego samego ID nie liczy się drugi raz, `partial` i próby innego pakietu nie zwiększają liczby poprawnych odpowiedzi. Wykorzystać istniejące testy transportu i oceny reguły oraz macierz P01–P20. Zmiana dokumentacji sama nie spełnia tych kryteriów.

- Reguła istnieje i jest poprawna: uruchom kanoniczny evaluator na właściwych dowodach.
- Reguła nie istnieje: `unknown`, z prawdziwym powodem; nie domyślny próg.
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

Powtarzanie poprawnie kwalifikujących się pytań pozostaje dopuszczone przez obecną regułę. Nowe pola pokrycia nie mogą wprowadzić ukrytego warunku ukończenia ani odblokowania.

### 2.3. Szczególnie ważny przypadek: minimum osiągnięte, jakość nie

Przykład fixture: reguła `minimumAttemptCount=20`, `rollingWindowSize=10`, `qualityThreshold=0.8`; użytkownik ma 25 kwalifikujących prób, a w ostatnich 10 poprawnych jest 5. Evaluator musi nadal zwracać `in_progress`.

`max(0, 20 - 25) = 0` mówi tylko, że nie brakuje wolumenu. Nie oznacza, że praca się skończyła. Prognoza oparta wyłącznie na wymaganej liczbie prób nie może zwrócić dzisiejszej daty ukończenia, `completed` ani pozytywnego komunikatu gotowości. Wyświetl jawny stan „minimum prób osiągnięte, potrzebna dalsza praca nad wynikami” albo odpowiedni obecny wzorzec. Dodatkowej liczby prób potrzebnych do jakości nie da się ustalić jako gwarancji.

Liczby w tym przykładzie są wyłącznie danymi testu. Nie wdrażaj ich jako progów dla tracków.

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

Jeżeli zatwierdzona reguła istnieje w źródle, lecz ginie w builderze/projekcji, napraw istniejącą ścieżkę producent–konsument. Jeżeli nie ma zatwierdzonej reguły, zachowaj `unknown` i wskaż precyzyjny brak kontraktu. Nie wolno ogłosić działającej prognozy ukończenia dla tracka, który nie ma semantyki ukończenia. Można nadal pokazywać faktyczną aktywność/pokrycie i plan pracy z odpowiednim ograniczeniem.

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
| P05 | Minimum spełnione, jakość 5/10 przy 0.8 | Nadal `in_progress`; zero pozostałego wolumenu nie zamienia się w ukończenie. |
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
