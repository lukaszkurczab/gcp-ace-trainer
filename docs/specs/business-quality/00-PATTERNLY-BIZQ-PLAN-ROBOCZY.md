# Patternly — jakość edukacyjna i biznesowa: pakiet BIZQ

**Data opracowania:** 2 października 2026  
**Zakres:** jeden dokument zbiorczy + sześć specyfikacji wykonawczych dla Codex  
**Status:** zadania do włączenia do istniejącej kolejki; nie jest to raport wykonania  
**Cel:** wiarygodne pytanie → użyteczne objaśnienie → wiarygodny zapis postępu → uzasadniona następna sesja → uczciwa demonstracja wartości.

## 1. Jak używać pakietu

Przeczytaj ten dokument przed każdym zadaniem. Następnie wykonuj tylko wybraną specyfikację BIZQ, w małych, weryfikowanych zmianach. Numer dokumentu identyfikuje zadanie, a nie bezwzględną kolejność implementacji.

Pakiet NIE zastępuje `docs/PATTERNLY-WORKING-PLAN.md` i nie tworzy drugiej kolejki statusów. Po przeniesieniu dokumentów do repozytorium wpisz sześć zadań i zależności do istniejącego planu; szczegółowe dokumenty pozostają specyfikacjami. Bieżący checkpoint utrzymuj w `.agent/WORKING_STATE.md`, a dowody bieżącego zadania w istniejącym modelu `docs/active/<ID>/`. Nie przywracaj zakończonych audytów tylko dlatego, że ich raporty przeniesiono do historii Git.

Proponowane miejsce dla tych siedmiu specyfikacji to `docs/specs/business-quality/`, o ile repo nie ma już odpowiedniego katalogu. Nie twórz obok nich kolejnego README, planu migracji ani osobnego systemu statusów.

### Dokumenty wykonawcze

| ID | Dokument | Priorytet | Oczekiwany rezultat |
| --- | --- | --- | --- |
| BIZQ-01 | [Jakość pytań i objaśnień](01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md) | P0 | Usunięcie wycieków odpowiedzi, niespójności scenariuszy i objaśnień; celowane bramki jakości. |
| BIZQ-02 | [Rzeczywisty postęp w planie](02-BIZQ-02-POSTEP-I-INTEGRACJA-PLANU.md) | P0 | Jedno źródło postępu, prawdziwy stan ukończenia, podłączona prognoza i ochrona przed nieaktualnymi propozycjami. |
| BIZQ-03 | [Plan adaptacyjny pod termin i czas](03-BIZQ-03-ADAPTACYJNY-PLAN-NAUKI.md) | P1 | Plan uwzględniający zakres, dostępność, koszt nauki, powtórki i wykonalność bez fikcyjnej pewności. |
| BIZQ-04 | [Naprawa błędów i utrwalanie](04-BIZQ-04-REMEDIACJA-I-UTRWALANIE.md) | P1 | Oddzielenie natychmiastowej korekty od sukcesów po terminie; zaplanowane utrwalanie także poprawnych odpowiedzi. |
| BIZQ-05 | [Diagnoza i transfer](05-BIZQ-05-DIAGNOZA-I-TRANSFER.md) | P1 | Diagnoza odpowiadająca rzeczywistemu zakresowi; nowe przykłady, kontrola podpowiedzi i uczciwy pomiar efektów. |
| BIZQ-06 | [Demonstracja wartości i przejście do aplikacji](06-BIZQ-06-DEMO-I-KONWERSJA-WEB.md) | P2 | Dobre przykłady dopasowane do celu użytkownika oraz działający, prawdziwy następny krok. |

## 2. Podstawa i poziom pewności

### 2.1. Co pochodzi z wcześniejszego audytu

Poprzednia odpowiedź opisywała publiczny stan aplikacji na `8d12b0c` z 1 października 2026. To punkt wejścia, nie automatyczne rozstrzygnięcie o bieżącym HEAD. Audyt wskazywał:

- wybór pierwszego trybu i jego domyślnej długości w generatorze propozycji;
- stałe `unknown` w projekcji ukończenia/tempa;
- podpowiedzi w `constraints`, słabe distractory i niespójne wyjaśnienia w próbkach contentu;
- potrzebę sprawdzenia odstępów między sukcesami w review i utrwalania poprawnych odpowiedzi;
- zbyt wąski zakres próbki diagnostycznej GCP;
- brak wyraźnego następnego kroku po przykładzie na stronie.

Przed zmianą sklasyfikuj każdy punkt: `CONFIRMED`, `ALREADY_FIXED`, `NOT_REPRODUCED` albo `CONTRACT_GAP`. Brak reprodukcji nie oznacza automatycznie, że funkcja działa; opisz zakres odczytu i testu. Nie wykonuj ponownie poprawki, która już jest w aktualnym kodzie.

### 2.2. Co dodatkowo sprawdzono podczas przygotowania pakietu

Odczytano przez GitHub aktualny plan, stan pracy, zasady agentów, README contentu oraz implementację koordynatora i reguły ukończenia. Nie uruchamiano aplikacji, testów ani procesu budowania. Nie zmieniano repozytoriów.

W odczytanym `LearningPlanProposalCoordinator.ts` historia prób jest pobierana, ale `completionState` nadal jest ustawiany na `unknown`; wybór wynika z `resolved.track.modes[0]` i `defaultRequestedLength`. W `packageCompletionRule.ts` istnieje evaluator wykorzystujący minimalną liczbę prób oraz próg poprawności ruchomego okna. Gdy liczba prób została osiągnięta, ale próg jakości nie, stan pozostaje `in_progress`. Dlatego odejmowanie `minimum - attempts` nie jest wystarczającą prognozą ukończenia. Źródła: R4–R5 poniżej.

### 2.3. Co jest nową propozycją produktową

Model kosztu w minutach, rozdzielenie pracy planera, sposób rezerwowania przyszłych powtórek, rozszerzenie polityki odstępów i blueprint transferu są specyfikacjami nowych zmian, nie opisem istniejącego zachowania. W zadaniach oznaczono je jako **docelowa zmiana BIZQ**. Liczbowe parametry są polityką produktu lub wartościami fixture, a nie naukowo potwierdzonym optimum.

BIZQ nie dowodzi wzrostu retencji, przychodu, zdawalności ani gotowości interview. Ma usunąć konkretne ryzyka i umożliwić późniejszy pomiar. Wynik testów technicznych nie jest wynikiem badania skuteczności nauki.

## 3. Repozytoria i źródło prawdy

| Rola | Repozytorium | Orientacyjna gałąź; zawsze sprawdź |
| --- | --- | --- |
| Aplikacja, lokalny katalog zwykle `patternly` | `lukaszkurczab/gcp-ace-trainer` | `main` |
| Backend | `lukaszkurczab/patternly-backend` | `main` |
| Content | `lukaszkurczab/patternly-content` | `master` |
| Web | `lukaszkurczab/patternly-web` | `main` |

Sprawdź wszystkie cztery repo, ale modyfikuj tylko rzeczywistych producentów i konsumentów danej zmiany. Backend nie ma otrzymać silnika nauki tylko dlatego, że jest czwartym repozytorium. Nazwa robocza pozostaje Patternly / Patternly.it; rebranding jest poza zakresem.

### Hierarchia i jawne różnice względem starszych załączników

1. Przeczytaj wszystkie obowiązujące lokalne `AGENTS.md` oraz aktualny plan i stan pracy.
2. Rozpoznaj aktualne kanoniczne kontrakty produktu, danych, contentu i synchronizacji. Kod jest dowodem implementacji, nie automatycznym wymaganiem.
3. Zastosuj specyfikację BIZQ jako jawny zakres zmiany; przed kodem zaktualizuj odpowiedni kontrakt tam, gdzie zmiana rozszerza dotychczasową semantykę.
4. Nie kopiuj lipcowego `plan.md` jako aktualnego planu. Jego baseline to 15 lipca 2026. Załączniki opisujące brak kont, backendu, pobrań i sync nie są poleceniem usunięcia później wdrożonych funkcji.
5. Starsze wymaganie ręcznej akceptacji contentu nie może samoczynnie anulować aktualnej delegacji właściciela. Ustal obowiązujący mechanizm admission i uprawnionego zatwierdzającego. Nie podawaj wyniku agenta jako human review i nie rozszerzaj jego uprawnień przez domysł.
6. Przy rzeczywistej sprzeczności odnotuj oba źródła, proponowaną zmianę i skutki. Nie wprowadzaj ukrytego kompromisu ani adaptera utrzymującego obie wersje.

## 4. Kontrakty, których te zadania nie mogą naruszyć

**Ukończenie nie oznacza obejrzenia całego banku.** Aktualna reguła należy do wersjonowanego pakietu i opiera się na minimum prób oraz progu ruchomego okna. Nie zmieniaj jej po cichu na mastery, pokrycie wszystkich pytań lub zaliczenie wszystkich mental units. Pokrycie i transfer mogą zmieniać rekomendację, ale nie stanowią nowego ukrytego warunku odblokowania. Nie przywracaj globalnego `>120 pytań/node`.

**Czas powtórki nie jest blokadą progresji.** Nowe odstępy chronią interpretację utrwalenia. Nie przywracają odrzuconego time-spread gate ani wymogu czekania, żeby przejść do następnego noda.

**Cel i zaakceptowany plan są jedną atomową parą per track.** Nowa propozycja nie nadpisuje zaakceptowanego planu. Konflikt local/cloud rozwiązuje się w bezpiecznym momencie, bez przerywania sesji. Harmonogram powiadomień pozostaje lokalny dla urządzenia. Zmiana prognozy sama nie tworzy powiadomień.

**Uprawnienia obowiązują przed przygotowaniem i wznowieniem.** Aktualny plan wymaga Premium dla `Exam`, `Coding Mock Interview` i całej rodziny `Design Interview`, także gdy konkretne pytania pochodzą z obszaru inaczej dostępnego bezpłatnie. Design Interview nie ma darmowego noda. Pozostałe uprawnienia zachowaj według aktualnego kontraktu. Preview na stronie nie stanowi przyznania uprawnień do płatnego trybu.

**Jeden runtime, jedna kolejka review, jeden zapis prób.** Nie twórz drugiego silnika sesji, ukrytego magazynu wiedzy ani niezależnego planera na backendzie. Warstwa aplikacyjna koordynuje; polityka rodziny interpretuje naukę; UI renderuje i wysyła komendy.

**Jedno źródło contentu.** W odczytanym README ingress to `content/<trackId>/<nodeId>/<mentalUnitId>.json`, jeden schemat oraz generowane artefakty konsumowane podczas buildu. Nie dodawaj drugiej bazy pytań, nowego publish API, statusów „quality pending” w runtime ani ręcznie poprawianych wygenerowanych kopii.

**Trwałość i prawdziwe błędy.** Obowiązują aktualne kontrakty journal/revision/idempotency/resume. Brak danych oznacza jawny stan, a nie zero, losowe pytanie czy domyślną regułę. Nie kasuj danych z powodu samej trudności refaktoru. Stosuj aktualny pre-production reset/mismatch contract, bez nowych translatorów.

**Zakres testów mobilnych.** Automatyzacja i odbiór lokalny tylko iOS, na istniejącym iPhone 17 `7F315654-3175-4F3C-BB24-B0263F59360C`. Bez tworzenia kolejnego urządzenia/aplikacji. Android później ręcznie; brak jego automatycznych testów nie blokuje tego pakietu. Fizyczny iPhone to dalsza bramka, nie zamiennik lokalnego odbioru.

**VoiceOver.** Aktualny plan wyłącza testy VoiceOver: nie uruchamiaj odsłuchu, sterowania czytnikiem, odbioru focusu/announcement ani zastępczego „testu VoiceOver” przez hierarchię Simulatora. Implementuj poprawne accessibility props i sprawdzaj ich kontrakt w kodzie. Zachowaj inne uzgodnione testy UI, duży tekst, motywy i screenshoty.

**Brand zamiast przestarzałej Figmy.** Używaj aktualnych tokenów, komponentów i języka marki. Nie przywracaj starych ekranów. Unikaj redundantnego copy, technicznych identyfikatorów w UI i dodatkowych kart bez funkcji. Dostępne aktualne wzorce wykorzystuj ponownie; brak zatwierdzonego wzorca dla nowej interakcji oznacz jawnie, nie maskuj przypadkowym modalem.

**Bez skutków produkcyjnych.** Ten pakiet upoważnia do przygotowania i implementacji w normalnym workflow repo, nie do wdrożenia, publikacji aplikacji, EAS update, zmiany produkcyjnego RevenueCat, cen, kampanii czy wysyłki wiadomości. Push wykonuj tylko według bieżących uprawnień projektu. Push nie oznacza GO.

## 5. Kolejność i zależności

Rekomendowana sekwencja pełnych odbiorów:

```text
BIZQ-01 → BIZQ-02 → BIZQ-04 → BIZQ-05 → BIZQ-03 → BIZQ-06
```

BIZQ-01 i BIZQ-02 mogą być przygotowywane równolegle, jeżeli nie kolidują plikami i agentami. BIZQ-04 wymaga ustalenia tożsamości dowodów wspólnej z BIZQ-02. BIZQ-05 korzysta z naprawionego contentu i semantyki review. BIZQ-03 można projektować wcześniej, ale jego końcowy odbiór wymaga rzeczywistych wyjść BIZQ-02/04/05 — nie atrap. BIZQ-06 może wcześniej naprawić istniejące CTA, lecz demonstracja nowej jakości i copy planera wymagają odpowiednich zakończonych zadań.

Nie zatrzymuj niezależnej naprawy wycieku odpowiedzi do czasu ukończenia całego planera. Nie ogłaszaj też całego pakietu gotowym, bo jeden fragment działa.

Przy dołączaniu do aktualnej serii AUD zachowaj już rozpoczętą pracę i lokalne zmiany. Nie przestawiaj aktywnego taska innego wykonawcy. Dodanie BIZQ do kolejki jest odrębne od uruchomienia implementacji. Bramka jakości edukacyjnej ma wejść przed deklarację komercyjnej gotowości, ale nie unieważnia lokalnie odebranych funkcji bez dowodu regresji.

## 6. Wspólny protokół Codex

### 6.1. Preflight

Sprawdź aktualne katalogi i remotes, HEAD/upstream, dirty tree oraz stashe we wszystkich czterech repo. Nie wykonuj `reset --hard`, `clean`, automatycznego stash/pop, przełączenia gałęzi, nowego klona ani worktree jako sposobu omijania konfliktu. Nie zatrzymuj cudzych procesów i nie resetuj współdzielonych emulatorów backendu.

Bezpieczny zestaw odczytów, uruchamiany z faktycznie rozpoznanego repo:

```sh
git status --short --branch
git rev-parse HEAD
git branch -vv
git remote -v
git stash list
git diff --stat
git diff --cached --stat
```

Sprawdź aktualność remote zgodnie z polityką projektu; sam odczyt `WORKING_STATE` nie potwierdza HEAD. Zapisz SHA oraz zakres zastanych zmian, ale nie kopiuj sekretów ani danych kont do raportu. Ustal rzeczywiste scripts i wymagane środowisko z repo. Nie wymyślaj nazw komend QA.

### 6.2. Briefing i niezależna kontrola

Według odczytanego `AGENTS.md` autonomiczna praca delegowana używa `gpt-6-luna`: `medium` dla standardowej implementacji, `high` dla trudnej analizy i niezależnego odbioru. Sol i Astra wymagają osobnej jawnej decyzji użytkownika. Nie zmieniaj tej polityki w BIZQ.

Przed implementacją wyślij niezależnemu walidatorowi Luna High dokładnie trzy sekcje: **Cel**, **Ustalenia**, **Podejście**. Walidator tego briefingu nie czyta repo i nie wykonuje narzędzi; ocenia dostarczone fakty, prostotę, ryzyka i podejście. Oceny 0–1 dla consistency, simplicity, risk i maintainability; wynik końcowy to minimum, a wynik poniżej 0,8 odrzuca podejście. Rozstrzygaj uwagi wobec rzeczywistego repo. Ten briefing nie zastępuje końcowego QA, które musi badać kod i dowody.

Używaj istniejących skilli `execution-loop`, `qa-gate`, `working-memory`, a w odpowiednim zakresie `repo-audit`, `cross-repo-change` i `patternly-ui-audit`. Odczytaj je przed użyciem, nie odtwarzaj ich z pamięci. Zastosowanie skilla ogłaszaj zgodnie z aktualnym AGENTS. Brak skilla lub wymaganego delegowania opisz, nie udawaj ich wykonania.

### 6.3. Implementacja i odbiór

Najpierw test reprodukujący błąd albo kontrakt docelowej zmiany, potem najmniejsza spójna implementacja, następnie testy konsumentów i usunięcie zastąpionej ścieżki. Każdy slice ma własny zakres i wynik; nie wolno kończyć na nowym helperze, którego prawdziwa aplikacja nie używa.

Zmiana schematu contentu, artefaktu lub planu musi przejść przez producenta, walidator, builder, lock/version i wszystkich rzeczywistych konsumentów. Nie zmieniaj formatu tylko dla przyszłych możliwości. Fixture jest prawidłowym narzędziem testu deterministycznego, lecz nie dowodem działania realnego providera ani aktywnego banku.

### 6.4. Wspólna definicja ukończenia

- Problem został odtworzony albo brakujący kontrakt jawnie zapisany.
- Kod korzysta z jednego kanonicznego właściciela i jest osiągalny z prawdziwej ścieżki produktu.
- Testy pozytywne, negatywne, izolacji profilu, restartu i odpowiednich konsumentów przechodzą.
- Wymagane kontrole contentu i zatwierdzenie przeprowadziła faktycznie uprawniona osoba/rola według bieżących zasad.
- UI ma sprawdzone standardowe i duże teksty oraz wymagane motywy; nie deklarowano testu VoiceOver.
- Nie ma ukrytych fallbacków, martwego starego właściciela ani regresji Premium/sync/offline.
- Raport podaje wykonane komendy, wyniki, SHA/artefakty, faktycznie testowane środowisko i obszary niezweryfikowane.
- Niezależne QA potwierdziło wynik. Wpis planu i stan pracy aktualizuje się dopiero na podstawie tych dowodów.

Używaj statusów istniejącego planu. Nie dodawaj drugiego, konkurencyjnego workflow statusów. „Kod zaimplementowany, brak runtime evidence” to wynik częściowy, nie ukończenie.

## 7. Ryzyka przekrojowe i testy końcowe

| Ryzyko | Wymagany kontrtest |
| --- | --- |
| Plan pozornie kompletny po wielu łatwych pytaniach | Minimum prób osiągnięte, ruchome okno poniżej progu: nadal `in_progress`, bez daty gwarantowanego ukończenia. |
| Stara propozycja po zmianie profilu lub wyników | Nie można zaakceptować planu przygotowanego dla innego profilu, celu, pakietu lub nieaktualnego snapshotu. |
| Przyspieszenie przez skrócenie powtórek | Zbliżenie terminu nie przesuwa `dueAt` wstecz i nie tworzy kwalifikowanego sukcesu. |
| Brak wykonalności schowany w stałej sesji | Budżet krótszy niż wymagany: jawny niedobór czasu, brak samowolnego zwiększenia dostępności. |
| Korekta błędu uznana za trwałą naukę | Dwa poprawne podejścia przed nowym `dueAt` nie rozwiązują persistent review. |
| Płatny tryb uruchomiony przez plan lub deep link | Free nie może przygotować/wznowić Exam, Coding Mock Interview ani Design Interview. |
| Dziewięć banków „zaakceptowanych” równa się dziewięć banków bez wad | Wykryte błędy dostają naprawy i nowe dowody; historyczne approval nie zamyka nowego defektu. |
| Efekt edukacyjny udawany przez fixture | Raport odróżnia poprawność implementacji od wyniku pomiaru u ludzi. |

Pełny odbiór pakietu obejmuje co najmniej nowego i powracającego użytkownika, błędne i poprawne odpowiedzi, dużą kolejkę review, brak reguły ukończenia, cel bez daty, krótki deadline, zmianę daty, offline/restart, konflikt sync oraz zmianę Premium. Wartości testowe są syntetyczne i wyraźnie oznaczone.

## 8. Prompt startowy — import i wybór pierwszego bezpiecznego zadania

```text
Przeczytaj 00-PATTERNLY-BIZQ-PLAN-ROBOCZY.md i sześć powiązanych specyfikacji.
Pracujemy nad jakością edukacyjną i biznesową Patternly, bez zmiany nazwy,
modelu sprzedaży, uprawnień ani autoryzacji do publikacji.

Najpierw odczytaj wszystkie obowiązujące AGENTS.md, aktualny
 docs/PATTERNLY-WORKING-PLAN.md i .agent/WORKING_STATE.md.
Sprawdź cztery repozytoria: app, backend, content i web, wraz z HEAD/upstream,
stashami oraz lokalnymi zmianami. Nie naruszaj pracy w toku. Nie używaj
lipcowego załącznika plan.md jako aktualnego planu i nie przywracaj starych
kontraktów local-only ani ręcznych bramek sprzecznych z nowszą delegacją PO.

Włącz BIZQ-01..06 do istniejącej kolejki, z linkami i zależnościami, bez
utworzenia drugiego planu statusów. Wpisz nowe wymagania do właściwych
kanonicznych kontraktów przed implementacją; nie zmieniaj przy okazji innych
reguł. Nie przestawiaj aktywnej pracy innego agenta.

Dla pierwszego dostępnego BIZQ-01 lub BIZQ-02 wykonaj ograniczony preflight:
odtwórz wskazany problem na aktualnym kodzie, ustal konkretne pliki i testy,
a następnie zastosuj obowiązujący briefing Cel/Ustalenia/Podejście oraz
niezależną walidację Luna High. Po akceptacji wykonaj pierwszy spójny slice,
nie cały pakiet naraz. Jeżeli istniejąca praca koliduje, zapisz zależność
i wykonaj tylko niezależną część; nie chowaj zmian w stashu.

Zachowaj atomową parę cel+zaakceptowany plan, lokalne reminders, jeden runtime,
rzeczywiste bramki Premium i istniejące zasady content admission. Testy mobile
wyłącznie na istniejącym iPhone 17 7F315654-3175-4F3C-BB24-B0263F59360C.
VoiceOver poza testami zgodnie z planem; semantyka accessibility nadal obowiązuje.
Bez deploy, publikacji, produkcyjnych zakupów i zmian konfiguracji usług.

Po slice przedstaw dokładne zmiany, testy, ograniczenia i następny bezpieczny
krok. Nie zamykaj zadania na podstawie samego typechecku ani raportu wykonawcy.
```

## 9. Rejestr źródeł dla całego pakietu

Linki do gałęzi są zmienne. Przed implementacją zastąp je w raporcie dokładnymi commitami użytymi do odbioru. Identyfikatory `blob` poniżej pochodzą z odpowiedzi GitHub i identyfikują plik, nie commit ani kandydata release.

- **R1:** aktualny plan, odczyt przy przygotowaniu: [docs/PATTERNLY-WORKING-PLAN.md](https://github.com/lukaszkurczab/gcp-ace-trainer/blob/main/docs/PATTERNLY-WORKING-PLAN.md), rewizja treści 1 października 2026. Źródło aktualnych reguł Premium, celu/planu, iOS, VoiceOver i pracy w toku.
- **R2:** [AGENTS.md aplikacji](https://github.com/lukaszkurczab/gcp-ace-trainer/blob/main/AGENTS.md), blob `52116606f7c26b78afef6c17960555cdf39a254c`; oraz [AGENTS contentu](https://github.com/lukaszkurczab/patternly-content/blob/master/AGENTS.md), blob `4729e398c23cbfcdde1ac28999fa662130a80943`.
- **R3:** [.agent/WORKING_STATE.md](https://github.com/lukaszkurczab/gcp-ace-trainer/blob/main/.agent/WORKING_STATE.md), blob `bcded82aed88b95c5bcc50ce5cfa1102b67360c6`. Checkpoint pracy; nie zastępuje fresh HEAD.
- **R4:** [LearningPlanProposalCoordinator.ts](https://github.com/lukaszkurczab/gcp-ace-trainer/blob/main/src/application/learningPlan/LearningPlanProposalCoordinator.ts), blob `ea1f8eefd95c294bca3a87df01d98d8db35b45a9`.
- **R5:** [packageCompletionRule.ts](https://github.com/lukaszkurczab/gcp-ace-trainer/blob/main/src/domain/learning/packageCompletionRule.ts), blob `01eaee12bcbcbd315fbdf92571d250169704f5e3`.
- **R6:** [README patternly-content](https://github.com/lukaszkurczab/patternly-content/blob/master/README.md), blob `491386b16b97e4e1d0df403a7bae1e05a9b2d145`. Kanoniczny ingress, KISS, dziewięć zaakceptowanych banków, brak globalnego minimum 120, komendy buildu.
- **A1:** poprzedni audyt w tej rozmowie, datowany na 1 października 2026, odniesienie aplikacji `8d12b0ccabf7b2c28659c78c10a7915abafb2672`. Próbki contentu i pozostałe ustalenia wymagają ponownego odtworzenia.
- **K1:** załączone `07-content-guidelines(4).md`, sekcje Prompt and decision quality, Authored feedback, Choice-item contract, Stable item and interaction identity. Podstawa jakości dydaktycznej; nie źródło aktualnego katalogu ani automatyczne nadpisanie nowszych zasad admission.
- **K2:** załączone `01-product-definition(3).md`, `04-data-model(7).md`, `15-certification-track-learning-system(5).md`, `16-leetcode-like-learning-system(3).md`, `17-training-runtime-and-interaction-spec(3).md`, `12-testing-strategy(5).md`. Starsze kontrakty pomagające zidentyfikować odpowiedzialności; aktualne odpowiedniki i jawne decyzje PO trzeba odczytać w repo.

W pozostałych dokumentach skróty R/A/K odnoszą się do tego rejestru. Nowe przykłady, algorytmy planowania i test fixtures są propozycjami BIZQ, nie faktami odczytanymi z tych źródeł.
