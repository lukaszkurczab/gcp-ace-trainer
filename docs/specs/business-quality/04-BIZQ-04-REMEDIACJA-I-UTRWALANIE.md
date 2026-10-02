# BIZQ-04 — rozdzielenie naprawy błędów i utrwalania

**Priorytet:** P1  
**Główne repo:** aplikacja; content dla jawnej polityki rodziny/pakietu; backend tylko przy rzeczywistej zmianie synchronizowanego kontraktu  
**Zależności:** tożsamość dowodów i snapshot z BIZQ-02; jakość materiału z BIZQ-01 do końcowego odbioru  
**Konsument wyniku:** BIZQ-03 i BIZQ-05  
**Reguły wspólne:** [00 — plan BIZQ](00-PATTERNLY-BIZQ-PLAN-ROBOCZY.md).

## 1. Problem

Audyt A1 wskazał dwa mechanizmy do odtworzenia: zaplanowanie powtórki nowej poprawnej odpowiedzi tylko dla Coding Interview oraz brak przesunięcia `dueAt` po pierwszym poprawnym podejściu do persistent review. Ten drugi wzorzec może pozwolić na dwa sukcesy w krótkim odstępie i usunięcie pozycji bez nowego okresu oczekiwania.

Nie przyjmuj, że dwa udane testy jednostkowe już dowodzą tego zachowania w aplikacji. Sprawdź aktualny runtime, eligibility trybów, selektor, deduplikację i zapis kolejki. Może istnieć dodatkowa bramka poza wskazaną funkcją. Testuj pełną ścieżkę.

Cel produktu jest precyzyjny: **natychmiastowa poprawa ma naprawić rozumowanie, a późniejsze odtworzenie ma dostarczyć osobnego dowodu po czasie**. Nie wdrażamy nowej blokady kolejnego noda, mastery ani obowiązku czekania na odblokowanie tracka.

## 2. Stan istniejący i nowy kontrakt

Starsze K2 mówią o dwóch poprawnych review attempts po terminie i braku rozwiązywania persistent review przez korektę w tej samej sesji. Nie wynika z tego automatycznie, jaki ma być odstęp między pierwszym i drugim sukcesem. Uzupełnienie tej luki jest **docelową zmianą BIZQ**, nie rzekomo zawsze istniejącym wymaganiem.

Zachowaj rozdzielenie:

- **remediation:** celowane naprawienie błędu;
- **scheduled retrieval:** ponowne sprawdzenie w określonym terminie;
- **persistent resolution:** spełnienie obowiązującej reguły kolejnych kwalifikowanych sukcesów;
- **maintenance:** dalsze, rzadsze przypomnienie po ustąpieniu konkretnego błędu.

To semantyki w jednej istniejącej kolejce i jej family policy, nie cztery kolejki i cztery runnery. Nie dodawaj nowego systemu fiszek ani nowej biblioteki SRS w tym zadaniu.

## 3. Rozpoznanie przed implementacją

Zlokalizuj bieżącego właściciela `CanonicalTrainingRuntime`, review outcome builder, selector review, merge/upsert, mutation journal, pola provenance, persistent counter, `retentionPassedAt` — jeżeli występuje — oraz adaptery sync.

Dla każdej istniejącej rodziny przygotuj macierz:

`trigger | eligible modes | queue key/granularity | initial due | success transition | partial/incorrect transition | maintenance | completion/progress effect`.

Przejdź przez zwykłą poprawną odpowiedź, błąd, partial, naprawę w tej samej sesji, due review, retry i merge. Uwzględnij Certification, Coding Interview i Design Interview według aktualnego rejestru, bez odtwarzania zamkniętej listy rodzin ze starych dokumentów.

Nie rób warunku `trackId === ...` w shared kernel. Polityka należy do rodziny/pakietu; współdzielona warstwa egzekwuje trwałość i identyfikację zdarzeń.

## 4. Docelowe zasady

### 4.1. Jawna polityka odstępów

Najpierw wykorzystaj istniejące poprawne, wersjonowane wartości. Nie zamieniaj bez uzasadnienia wszystkich harmonogramów na nowe stałe. Brakujący odstęp po pierwszym sukcesie uzupełnij w jawnej polityce rodziny, z walidacją dodatniej wartości i testem.

Proponowana polityka startowa dla brakujących definicji:

| Parametr | Proponowana wartość | Znaczenie |
| --- | --- | --- |
| Pierwsze odroczone sprawdzenie błędu | 24 godziny | Natychmiastowa naprawa jest dostępna osobno, lecz nie stanowi sukcesu po tym terminie. |
| Pierwsze maintenance po nowej poprawnej pracy | 7 × 24 godziny | Nowe poprawne odpowiedzi nie wypadają całkowicie z utrwalania. |
| Odstęp po pierwszym kwalifikowanym persistent success | 7 × 24 godziny | Drugi kwalifikowany sukces wymaga nowego terminu. |
| Następne maintenance po poprawnym retrieval | 14, następnie 28 × 24 godziny | Prosta, jawna sekwencja; dalszy horyzont nie wymaga rozbudowanego modelu. |

To propozycje operacyjne BIZQ, nie wartości naukowo optymalne. Zapisz je w zatwierdzanej wersji polityki, nie jako ukryty fallback. Jeśli bieżąca zatwierdzona polityka ma inne sensowne wartości, zachowaj je i wyjaśnij, jak spełniają wymagane rozdzielenie zdarzeń. Nie przywracaj globalnego time-spread gate.

`dueAt` oznacza tu instant; „24 godziny” nie oznacza następnej lokalnej daty o północy. Sukces o 23:59 nie uprawnia do drugiego o 00:01. Powiadomienie może być planowane lokalnie, ale nie zmienia momentu kwalifikacji review.

### 4.2. Pierwsza poprawna odpowiedź też może wymagać powtórki

Rozszerz jawne scheduled retrieval na rodziny, dla których obecnie go brakuje, jeżeli pytanie/mode jest właściwym dowodem według family policy. Nie wkładaj każdego zdarzenia do kolejki bez rozróżnienia: guided primer, due review i finalized simulation mają różne źródła i mogą mieć różną politykę.

Zachowaj aktualną granulację queue key. Dla istniejącego klucza nie twórz duplikatu przy każdym poprawnym podejściu. Jeśli jednostka ma już nierozwiązany błąd, zwykła poprawna odpowiedź nie zastępuje jej błędu przez spokojniejsze maintenance ani nie przesuwa terminu w przyszłość.

Nie wprowadzaj przy okazji nowej agregacji „jedna powtórka per mental unit” bez zbadania utraty szczegółów o błędach. Połączenie kilku potrzeb jest dopuszczalne wyłącznie przez obecny, jawny kontrakt zgodności/provenance.

### 4.3. Kwalifikowany sukces

Sukces może zwiększyć persistent counter tylko wtedy, gdy wszystkie wymagania są spełnione:

1. Próba jest utrwalona i `correct`, nie `partial`.
2. Powstała w kontekście review dopuszczonym przez aktualną politykę rodziny.
3. Odnosi się do właściwej review obligation albo zatwierdzonego wariantu tej samej potrzeby.
4. Została udzielona po obowiązującym `dueAt`, zgodnie z dokładną regułą porównania.
5. Nie jest natychmiastową korektą, którą kontrakt wyklucza z persistent resolution.
6. Ten sam attempt ID nie został wcześniej skonsumowany do tej zmiany.
7. Tożsamość profilu, pakietu i snapshotu review jest poprawna.

Do kwalifikacji użyj kanonicznego czasu odpowiedzi (`answeredAt`), nie późniejszego czasu synchronizacji lub materializacji. Odpowiedź udzielona przed terminem nie staje się eligible tylko dlatego, że zapis albo sync zakończył się po terminie.

Nie zmieniaj bez potrzeby istniejącego `>` na `>=`; zapisz i przetestuj dokładną granicę. Kluczowym wymaganiem jest nowy późniejszy `dueAt` po pierwszym sukcesie, a nie spór o jedną milisekundę.

### 4.4. Tabela przejść

| Zdarzenie | Counter i rodzaj potrzeby | Termin / inne skutki |
| --- | --- | --- |
| Błąd/partial w zwykłej praktyce | Dodaj/rozszerz remediation, zachowaj provenance i aktualne zasady resetu | Użyj polityki; nie odsuwaj istniejącej pilnej potrzeby tylko dlatego, że pojawiło się kolejne zwykłe zdarzenie. |
| Nowa poprawna zwykła praktyka | Dowód poprawności; ewentualne scheduled retrieval | Nie zwiększa countera istniejącego persistent review. |
| Poprawka w tej samej sesji lub przed due | Immediate correction, nie trwałe rozwiązanie | Counter persistent nie rośnie; nie ma nowego retention event. |
| Pierwszy eligible correct po due | Counter = 1 | Atomowo ustaw nowy `dueAt = attempt.answeredAt + configured interval`; nie pozostaw starego terminu. |
| Kolejna odpowiedź przed nowym due | Praktyka/korekta, nie drugi sukces | Bez zwiększenia countera i bez przesunięcia due przez sam poprawny wynik. |
| Drugi consecutive eligible correct po nowym due | Rozwiąż konkretną persistent obligation | Zachowaj fakty historyczne; dalsze maintenance według polityki, bez fałszywego dodatkowego sukcesu. |
| Eligible due partial/incorrect | Reset kolejnych sukcesów; remediation | Nowy termin odroczonego sprawdzenia według polityki; natychmiastowa naprawa jest osobnym działaniem. |
| Eligible poprawne maintenance | Rzeczywisty retrieval event | Następny dłuższy odstęp; nie musi udawać persistent error requiring two successes. |
| Retry identycznego zdarzenia | Brak nowego wkładu | Idempotencja; terminy i counter nie zmieniają się ponownie. |
| Merge/sync/import dowodów | Zachowaj rzeczywiste zdarzenia i unresolved reasons | Nie tworzy `retentionPassedAt`, success ani nowego attemptu. |

Po rozwiązaniu błędu dalsze maintenance powinno korzystać z tej samej kolejki i jej normalnego lifecycle. Nie tworzy się drugiej aktywnej pozycji dla identycznego klucza. Przejście persistent→maintenance nie może zgubić nierozwiązanej przyczyny ani sfabrykować zatwierdzonego wyniku.

### 4.5. `retentionPassedAt` i dowody

Jeśli bieżący model ma `retentionPassedAt`, ustawiaj je wyłącznie na podstawie rzeczywistego poprawnego due-qualified zdarzenia. Nie ustawiaj go przy merge, przygotowaniu sesji, due date arrival, odczycie Details, zwykłej poprawnej próbie ani samym rozwiązaniu rekordu w pamięci.

Nie utożsamiaj pierwszego faktycznego retrieval success z zakończeniem persistent review wymagającym dwóch sukcesów. Pole daty wydarzenia i stan nierozwiązanej potrzeby mają różne znaczenia. Zachowaj aktualny kontrakt historii przy późniejszym błędzie; nie przerabiaj wcześniejszego sukcesu na fakt, który nigdy nie wystąpił.

## 5. Trwałość, konflikt i sync

Counter, reasons, dueAt, provenance i ewentualny event/progress update muszą powstawać jako jeden deterministyczny wynik istniejącej operacji. Nie zapisuj countera w jednej ścieżce, a dueAt chwilę później bez wspólnej ochrony.

Zachowaj istniejący journal i expected revisions. Po zapisie durable journal retry odtwarza ten sam wynik; nie wylicza nowych terminów od aktualnego `now`, bo restart przesuwałby harmonogram.

Utrwal wystarczający kontekst kwalifikacji review w już istniejącym planie/occurrence, tak aby można było odtworzyć źródło potrzeby i użyty termin/policy version. Nie twórz historycznego archiwum całych payloadów pytań. Jeżeli potrzebne pole jest nowe, dodaj je do właściwego kontraktu i konsumentów, nie do bocznego MMKV key.

Zmiana review przez inne urządzenie podczas aktywnej sesji wymaga jawnego rozstrzygnięcia rewizji. Nie zaliczaj kolejnego success przez rebase w ciemno. Zastosuj obecny konflikt/journal workflow: nieutrwalony outcome można zbudować ponownie wobec zweryfikowanej aktualnej wersji; już trwałego outcome nie przeliczaj. Nie gub zapisanej odpowiedzi ani nie pozwalaj na jej ponowne ocenienie po commit.

## 6. Selektor, koszt i UX

Użyj prawdziwej due queue. Kolejność wynika z family priority, terminu i przyczyny. Warianty muszą mieć udokumentowaną zgodność z błędem/mechanizmem; nie uzupełniaj sesji przypadkowym materiałem.

Nie zaliczaj jednocześnie dwóch pozycji kolejki tym samym poprawnym itemem, jeżeli obecny kontrakt nie definiuje takiej relacji. W szczególności wiele pytań w tym samym mental unit nie oznacza, że jedna odpowiedź naprawia wszystkie błędy.

BIZQ-03 otrzymuje realne pozycje, terminy i rodzaje pracy. Prognoza może rezerwować czas, ale nie ma prawa tworzyć entries, zmieniać dueAt ani rozwiązywać review. Deadline użytkownika nie jest parametrem skracającym minimalny odstęp do kwalifikowanego sukcesu.

W UI odróżnij natychmiastową naprawę od późniejszej powtórki, korzystając z istniejących ekranów. Możliwe znaczenia copy: „Try a related example” kontra „Review scheduled for …”. Nie pokazuj „mastered”, „retained 100%” ani nowego badge'a. Zwykła poprawka nie może usuwać widocznej informacji o przyszłej potrzebie tylko dlatego, że użytkownik odpowiedział drugi raz.

## 7. Testy obowiązkowe

| ID | Scenariusz | Oczekiwany wynik |
| --- | --- | --- |
| R01 | Błąd → natychmiastowa poprawka | Błąd pozostaje w historii; brak persistent resolution i retention event. |
| R02 | Correct przed due | Counter nie rośnie, due nie przesuwa się od zwykłej poprawnej próby. |
| R03 | Pierwszy correct po due | Counter 1 i nowy przyszły due zapisane razem. |
| R04 | Druga sesja pięć minut później | Nie jest drugim due-qualified sukcesem. |
| R05 | Sukces 23:59, kolejna próba 00:01 | Przekroczenie daty lokalnej nie zastępuje wymaganego odstępu. |
| R06 | Drugi correct po nowym due | Persistent obligation rozwiązana zgodnie z polityką; brak podwójnego maintenance. |
| R07 | Partial lub incorrect po pierwszym sukcesie | Counter reset, konkretna remediation i jej termin. |
| R08 | Poprawna nowa praca w każdej rodzinie | Jawny poprawny trigger maintenance albo jawne wyłączenie przez mode policy; brak przypadkowego pominięcia rodziny. |
| R09 | 20 zwykłych correct przy istniejącym błędzie | Nie kasują unresolved reason i nie odsuwają terminu za każdym razem. |
| R10 | Retry/force-close po każdej fazie mutacji | Identyczne counter, dueAt, event IDs i provenance. |
| R11 | Merge/sync bez nowego attemptu | Brak wymyślonego `retentionPassedAt` lub success. |
| R12 | Próba z innego profilu/pakietu | Brak zaliczenia; zgodny current mismatch contract. |
| R13 | Due item i approved variant | Poprawne powiązanie review; obcy mental unit nie wchodzi jako filler. |
| R14 | Za mała kompatybilna pula | Dozwolone skrócenie i jawna actual length, nie duplikacja. |
| R15 | Review zmieniło rewizję w innej sesji/urządzeniu | Jawny konflikt lub prawidłowa operacja wobec nowej wersji; bez utraty trwałej próby. |
| R16 | Zbliżenie deadline'u do jutra | Brak przyspieszenia due i fałszywego zakończenia retention. |
| R17 | Exam/Coding Mock/Design na Free | Review/propozycja nie obchodzi aktualnej bramki Premium. |
| R18 | Otwarcie Details lub samo wyświetlenie review | Żadnych domenowych sukcesów ani zmiany kolejki. |
| R19 | Background i DST | Kwalifikacja według instant i jawnej polityki; nie według liczby odwiedzin aplikacji. |
| R20 | Dwie różne obligations o zbliżonej treści | Brak przypadkowego połączenia przez podobny tekst/mentalUnit bez kontraktu. |
| R21 | `answeredAt` przed due, materializacja/sync po due | Odpowiedź nie kwalifikuje się jako after-due success. |

Dla R03–R06 użyj deterministycznego zegara. Test natywny może korzystać z istniejącego bezpiecznego fixture time provider; nie zmieniaj globalnego zegara systemowego i nie dodawaj produkcyjnego obejścia daty.

## 8. Kryteria odbioru

Wymagane są: macierz rodzin/trybów, jawna polityka odstępów, rzeczywiste zdarzenia w tej samej kolejce, nowy due po pierwszym sukcesie, brak manipulacji datą przez planner, idempotencja i poprawny sync. Cała ścieżka od odpowiedzi do kolejnego wyboru review musi działać w realnym runtime.

Raport pokazuje timeline jednej potrzeby: błąd → naprawa → due success 1 → próba zbyt wcześnie → due success 2 → dalsze maintenance. Dołącz scenariusz późniejszej porażki oraz dowód, że nie powstała nowa blokada progresji.

Wynik nie jest dowodem naukowo optymalnego harmonogramu. To sprawdzona implementacja jawnej polityki odróżniającej natychmiastowe wykonanie od późniejszego odtworzenia.

## 9. Prompt wykonawczy dla Codex

```text
Wykonaj BIZQ-04 zgodnie z tym dokumentem i dokumentem 00. Celem jest
rozdzielenie remediation, due retrieval i persistent resolution w jednej
kanonicznej kolejce, nie budowa nowego SRS ani time-spread gate.

Po preflight i wymaganym briefingu odtwórz aktualne przejścia review we
wszystkich rodzinach. Zweryfikuj dwa punkty A1: zaplanowanie poprawnych nowych
odpowiedzi oraz dueAt po pierwszym sukcesie. Nie zakładaj braku dodatkowej
bramki bez sprawdzenia pełnego runtime i selektora.

Zachowaj prawidłowe wersjonowane polityki. Brakujące odstępy zapisz jawnie
w family/package contract. Po pierwszym eligible after-due correct ustaw
counter=1 i nowy przyszły dueAt w tej samej deterministycznej mutacji.
Druga szybka poprawka, retry, merge, otwarcie Details ani upływ terminu
nie tworzą kolejnego sukcesu. Partial/incorrect prowadzą do remediation.

Poprawne nowe odpowiedzi uwzględniaj w jawnej maintenance policy, bez
przypadkowego pomijania rodzin, duplikacji i odsuwania unresolved error.
retentionPassedAt, jeśli istnieje, pochodzi wyłącznie z rzeczywistego
kwalifikowanego zdarzenia. Nie zmieniaj reguły odblokowania kolejnego noda.

Przejdź przez queue, provenance, revisions, journal, sync, selector i UI.
Zachowaj aktywną sesję, profile isolation, Premium i bieżące tryby.
Wykonaj R01–R21, failure injection i timeline na istniejącym iPhone 17,
bez VoiceOver tests, publikacji i resetów współdzielonego środowiska.

Raportuj wersję polityki, dokładny zakres zmian, testy, timeline, ograniczenia
i independent QA. Nie nazywaj wdrożonego harmonogramu naukowo optymalnym.
```
