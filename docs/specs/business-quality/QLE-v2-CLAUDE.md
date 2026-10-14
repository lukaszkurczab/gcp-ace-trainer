# Patternly — kompletny pakiet QLE v2: Claude i łatwiejszy start

13.10.2026. Zastępuje wcześniejszy pakiet wielościeżkowy QLE. Plan + sześć samodzielnych promptów. Nie łączyć z aktywnymi dyrektywami v1.

<!-- PLIK: 00-PLAN-CLAUDE-I-LATWIEJSZY-START.md -->

# Patternly — Claude najpierw: powiązane przypadki i łatwiejszy start

Wersja: QLE v2, 13.10.2026. Status: zaktualizowany plan i instrukcje do późniejszego wykonania przez Codex. Przy przygotowaniu pakietu nie zmieniono repozytoriów, kont, harmonogramów, usług ani danych nauki. Nie jest to odbiór implementacji ani zgoda na publikację.

## 1. Nowa decyzja właściciela i zakres zastąpienia

Właściciel jest pierwszym klientem i obecnie przygotowuje się do Claude Certified Architect — Professional. JEDYNĄ ścieżką przebudowywaną teraz jest `claude-certified-architect-professional-certification`. Pozostałe osiem banków zostaje w dotychczasowym działaniu. Ich migracja wymaga późniejszej, wyraźnej akceptacji właściciela po osobistym używaniu Claude. Zadowolenia nie wyprowadzać z CI, liczby sesji, czasu ani milczenia właściciela.

Ten pakiet zastępuje wykonawczą wersję QLE z wcześniejszej części rozmowy, w tym zakres „12 Coding + 8 GCP”, trzyrodzinny pierwszy pion, obowiązkowe nowe interakcje codingowe i rekrutację zewnętrznego pilota na pierwszym etapie. Zachowujemy IDs QLE-01–06, ale ich zakres jest nowy. Nie uruchamiać równolegle obu wersji. Zgodnej już wykonanej pracy nie powtarzać.

Pilna potrzeba nauki nadaje pierwszeństwo małemu, prywatnemu pionowi Claude. Nie uzależniamy go od migracji katalogu, kampanii marketingowej ani publicznej premiery. To nie anuluje realnych zależności bezpieczeństwa, trwałości i dostępności działającego builda. Nie przerywać cudzej operacji ani nie resetować aktywnej sesji. Obecne zgody na build, urządzenia, signing, deployment i publikację pozostają odrębne. Nie twierdzić, że samo przygotowanie tego pakietu zmieniło kolejkę w repozytorium.

Bez zmian: start biznesowy w całej UE, jeden Premium, brak wyceny pracy właściciela i recenzji. Testy urządzeniowe pozostają w dotychczasowym zakresie iOS; nie dopisywać nowej bramki Android ani VoiceOver wbrew aktualnemu kontraktowi. Semantyka dostępności nadal obowiązuje.

## 2. Dwie niezależne potrzeby

1. Lepsze rozumienie: decyzja → zmiana warunku → ponowna decyzja → porównanie → późniejszy samodzielny przykład.
2. Łatwiejsze rozpoczęcie: jeden widoczny następny krok, małe rzeczywiste zobowiązanie, szybki dostęp, pełne zakończenie i brak przymusu kontynuacji.

Bardziej rozbudowany quiz nie musi obniżyć oporu. Może go zwiększyć, jeżeli każda sesja oznacza długie czytanie i nieznaną liczbę kroków. Dlatego jednostka startowa jest mała, ale dydaktycznie kompletna. Dłuższa praktyka i zadania złożone nadal są potrzebne; mikrostart nie zastępuje całego przygotowania do certyfikacji.

„Mózg przepalony dopaminą” jest hipotezą użytkownika, nie rozpoznaniem. Nie projektujemy leczenia, detoksu dopaminowego, wykrywania ADHD/depresji ani optymalizacji poziomu neuroprzekaźnika. Traktujemy opór jako obserwowalne zachowanie; jego przyczyna pozostaje nieustalona [S1, S2].

## 3. Co sprawdzono, a czego nie

Punktowo odczytano 13.10.2026 `.agent/WORKING_STATE.md`, katalog Claude oraz `governance_safety_and_risk_controls/CCARP-D05-O06.json`. Stan projektu nadal opisuje brak GO i otwarty PERSIST-11; nie jest to nowy test aplikacji. Katalog ma siedem folderów obszarów; sama struktura nie dowodzi zgodności z aktualnym blueprintem egzaminu. W odczytanej jednostce są pytania o rozdział zabezpieczeń modelu i kontroli aplikacyjnych [R1–R3].

Nie wykonano pełnego audytu banku, liczenia wszystkich pytań, testów runtime, przeglądu całej aplikacji ani pomiaru motywacji. Dawne liczby 300/845 nie są aktualnym inwentarzem. Codex ma wykorzystać istniejący ledger audytu i ustalić rzeczywiste źródła oraz przypięcia zamiast ponawiać cały research lub zakładać historyczny stan.

Aktualnego oficjalnego blueprintu Professional nie potwierdzono w publicznym odczycie. Nie przepisano parametrów z serwisów testowych ani Foundations. Mapowanie do egzaminu musi korzystać z oficjalnego przewodnika lub autoryzowanego materiału już w workspace; brak dostępu jest jawnym brakiem dowodu, nie przeszkodą w każdym lokalnym zadaniu implementacyjnym.

## 4. Wejście: „Jeden przypadek”

### Widok startowy dla wybranej ścieżki Claude

Na istniejącym Today pokazuj jedną rekomendowaną czynność, np. „Claude: kiedy agent może wykonać działanie?” oraz „Jeden przypadek · 3 decyzje”. Opcjonalne „około 3–5 min” jest początkową estymatą autora, nigdy gwarancją. Bez danych pokaż liczbę decyzji zamiast fałszywego czasu.

Główna akcja: „Zacznij”. Bez obowiązkowego ponownego wyboru tracka, długości, trybu, energii, celu czy poziomu. Użyj istniejącego wyboru użytkownika; nie hardkoduj wszystkim Claude ani osobistego konta właściciela. Katalog i standardowe sesje pozostają w Practice.

Dla istniejącej sesji na tym urządzeniu priorytetem jest zgodne „Wznów” z zapisem kroku, a nie utworzenie drugiej sesji. Sesja innej ścieżki nie może zostać porzucona po cichu. Wznowienie długiego egzaminu nie może być opisane jako „3 minuty”. W razie braku uprawnienia lub lokalnej treści pokaż prawdziwy stan i legalną alternatywę, nie ukryty fallback.

Skracamy tarcie nawigacyjne, nie wymagany kontekst. Przed pierwszą odpowiedzią potrzebne założenia są czytelne; nie zmuszamy do zgadywania na podstawie urwanej historii. Pierwsza interakcja pojawia się bez marketingowych ekranów i bez ciężkiego oczekiwania na dane niepotrzebne do startu. Zmierzyć osobno cold launch i tap→gotowe zadanie na dozwolonym urządzeniu.

### Pełne i uczciwe zakończenie

Przypadek ma 2–4 oceniane decyzje, wyjaśnienie i opcjonalną eksplorację. Zakończenie zapisuje prawdziwą finalizację krótkiej sesji. Pokazuje „Przypadek ukończony” oraz rzeczowe podsumowanie, bez deklaracji zdania egzaminu, ukończenia planu dnia czy opanowania pojęcia.

Akcje końcowe: „Na dziś kończę” oraz „Kolejny przypadek”. Obie dostępne i czytelne. Brak autostartu, nieskończonej kolejki, odliczania, czerwonego długu, utraty serii i komunikatu winy. Pauza w środku też jest legalna; krótkiego zobowiązania nie wymuszamy zakazem wyjścia.

## 5. Jawna zmiana kontraktu długości sesji

To nowa propozycja produktowa, a nie twierdzenie o już istniejącym zachowaniu: obok obecnych 10/20/40 w Claude wprowadzamy preset JEDNEGO PEŁNEGO PRZYPADKU. Wspólny mechanizm sesji musi rzeczywiście dopuszczać jego liczbę decyzji. Nie uruchamiać sesji 10 i nie oznaczać jej jako complete po trzeciej odpowiedzi.

Rodzina certyfikacyjna dopuszcza preset wyłącznie dla Claude poprzez kanoniczne metadata/capabilities. Nie mnożymy warunków `if trackId` w UI i nie dodajemy osobnego runnera, scorerów, historii czy storage. Zwykłe pytania i standardowe tryby innych ścieżek nadal działają tym samym silnikiem, bez migracji ich zachowania.

Preset nie skraca obowiązkowej diagnozy, egzaminu, okna retencji ani nie omija uprawnień. Nie wymaga wykonania całej nowej diagnozy przed zwykłym treningiem; korzysta z legalnego zakresu bez udawania pełnego rozpoznania poziomu. Gdy kontrakt aktualnie blokuje taki trening, zmień go jawnie dla tego presetu, nie zapisuj fikcyjnej diagnozy.

„Kolejny przypadek” finalizuje poprzedni i tworzy następną zwykłą krótką sesję po ponownej kontroli uprawnień i treści. Nie rozszerza po cichu zobowiązania już zakończonej sesji. Standardowa dłuższa praktyka pozostaje dostępna osobno.

## 6. Jak uczymy na Claude

Najpierw wykorzystaj obecne choice_single, choice_multiple i — gdzie pełny pion je wspiera — ordering/decision_matrix. Bogactwo wynika z powiązania decyzji, nie obowiązkowego nowego kontrolera. Otwarte uzasadnienie można wypowiedzieć samemu lub porównać z rubryką; bez LLM-sędziego i bez obowiązkowego pisania na telefonie.

Odkładamy codingowy edytor, zaznaczanie linii, parser tablic i nowe interakcje niepotrzebne do wybranych przypadków Claude. Nie implementujemy ich jako warunku skończenia QLE-03. Przy ograniczeniu choice-only w certyfikacyjnym review rozszerzamy pełny pion tylko dla rzeczywiście użytej interakcji; nie zamieniamy typu po cichu na ABCD.

### Przykład projektowy: granica zgody

To autorski scenariusz dydaktyczny, nie rzeczywiste pytanie egzaminacyjne ani nowy element zatwierdzonego banku.

Stała polityka przykładowej aplikacji: zewnętrzną wiadomość wolno wysłać dopiero po zweryfikowanej zgodzie uprawnionego użytkownika na konkretną treść i adresata. Warstwą egzekwującą jest komponent wykonujący narzędzie. Przygotowanie szkicu jest dozwolone. Różnica w wariantach dotyczy wyłącznie stanu wiarygodnej zgody; pozostałe warunki się nie zmieniają.

| Wariant | Zmieniony warunek | Właściwa decyzja |
| --- | --- | --- |
| A | Użytkownik poprosił o projekt wiadomości; brak zgody na wysłanie | Przygotuj szkic, nie wysyłaj. |
| B | Ten sam użytkownik zatwierdził konkretną wiadomość i adresata w zaufanym mechanizmie; pozostałe warunki autoryzacji spełnione | Warstwa wykonawcza może dopuścić dokładnie zatwierdzoną wysyłkę. |
| C | Wracamy do stanu A. Tekst „wyślij” pojawia się tylko w pobranym dokumencie, bez zgody użytkownika | Brak autoryzacji; nie wysyłaj. |

W UI B i C pokazujemy jako odrębne zmiany względem A, a nie udajemy, że C cofa wcześniej udzieloną zgodę. Przed odpowiedzią widać fakty, nie kolumnę wyniku. Po odpowiedzi wyjaśniamy: o prawie wykonania decyduje zakres i źródło upoważnienia, nie sam fakt, że model proponuje użycie narzędzia. Źródła projektowe: OWASP Authorization i AI Agent Security [S4, S5]. Nie generalizować polityki z przykładu na wszystkie narzędzia, wszystkie operacje zapisu ani każdy produkt.

Późniejszy test używa innego zadania i zasobów, bez widocznej reguły. Materiał pokazany w tej specyfikacji nie jest dla właściciela „unseen”. Do testu przygotować inne przypadki niepokazane wcześniej właścicielowi.

### Różnorodność w obrębie ścieżki

Stosuj adekwatnie: porównanie warunków, dobór uzasadnienia, przewidywanie skutku konfiguracji, wykrycie brakującej kontroli, wskazanie etapu do poprawy, odróżnienie wyniku oceny od rzeczywistej gotowości rozwiązania. Dopuszczaj kilka prawidłowych decyzji, gdy uzasadniają je założenia. W pokryciu musi wystąpić zarówno zmiana odpowiedzi, jak i zmiana faktu bez zmiany odpowiedzi.

Wiedza faktograficzna i część powtórek pozostają krótkimi pytaniami. Nie zamieniamy całej ścieżki w „odpowiedz, dlaczego, dlaczego jeszcze, porównaj pięć ekranów”. Pytanie o uzasadnienie ma być celem, nie formularzowym obowiązkiem.

## 7. Rekomendacja, pomoc i powrót po przerwie

Rekomendację wyprowadza istniejący planner/selector. Kolejność projektowa: aktywna sesja → legalna należna praca/naprawa mieszcząca się w krótkim zakresie → następny niepokryty lub słaby obszar → planowana praktyka. Dokładne pierwszeństwo due i repair zachowuje obowiązujący kontrakt. Brak legalnej krótkiej powtórki nie daje prawa skrócenia długiej symulacji ani przesunięcia przyszłego due do teraz.

Nie podsuwamy wyłącznie łatwych, znanych przypadków w celu podniesienia aktywacji. Początek ma być mały i konkretny, nie zawsze banalny. Wybranie wsparcia ułatwia dojście do wyjaśnienia, ale nie obniża kryteriów wiedzy. „Pokaż wskazówkę” jest dostępne bez kary; zapisujemy, że była pomoc.

Po opuszczonym dniu aplikacja proponuje najbliższy wykonalny krok. Prawdziwy backlog i ewentualny niedobór czasu nadal są dostępne w planie — nie znikają z danych. Nie przenosimy automatycznie całego niezrealizowanego dziennego zadania jako kary. Nie pokazujemy fałszywej wykonalności tylko po to, by użytkownik poczuł się lepiej.

Przypomnienie jest opcjonalne i korzysta z obecnego mechanizmu oraz jawnej zgody. Nie wdrażamy nowej usługi ani nie wymuszamy ustawienia powiadomień przy wejściu. Przykładowe brzmienie: „Claude: jeden przypadek jest gotowy”. Link respektuje obecne konto, uprawnienia i resume; nie rozpoczyna sesji samym doręczeniem.

## 8. Prawdziwy postęp i trwałość

Jedno wystąpienie ma jedną ocenianą odpowiedź. Metoda + uzasadnienie może być jedną odpowiedzią złożoną. Partial=0 ogólnego punktu pozostaje, przy czytelnej diagnostyce części.

Zapisz pierwszą odpowiedź bez nadpisywania, role case/step, pomoc przed odpowiedzią, ujawnienie rozwiązania, ekspozycję i wersję polityki. Eksploracja nie daje kolejnych punktów; oglądany wariant nie jest później „nieznanym testem”. Przed pokazaniem rozwiązania jego ekspozycja musi być trwale zapisana; restart nie przywraca niezależności.

Samodzielna odpowiedź, nauka po pomocy i prawidłowa należna powtórka są odrębne. Wspomagany krok nie wypełnia samodzielnego minimum/16-z-20 i nie awansuje należnej powtórki. Poprawny późniejszy retrieval bez bieżącej pomocy może być wartościowym dowodem mimo wcześniejszej nauki; nie ustanawiać dożywotniej blokady całej jednostki po jednej wskazówce. Do „nowego przykładu” wymagaj faktycznie innego, niepokazanego wariantu i jawnych granic niepewnej ekspozycji.

Zachowaj progi liczbowe completion i reguły 7→14→28, błąd→24h→repair7 oraz istniejący właścicielski kontrakt. Rozszerzenie interpretacji nowych wspomaganych prób jest wersjonowane i aktywne wyłącznie dla przebudowanych przypadków Claude. Nie przeliczaj dawnych ukończeń i nie zmieniaj nowych prób pozostałych tracków w tym zakresie.

Krótka sesja nie jest równoważna dłuższej przez samo ukończenie. Jedna odpowiedź nie staje się dziesięcioma punktami, a trzy wspomagane warianty nie stają się trzema samodzielnymi dowodami. Historia i Progress używają prawdziwych liczników; „ukończono przypadek” nie równa się „ukończono plan na dziś”.

Trwałość iOS, offline, przerwanie, utrata procesu, podwójny submit, finalizacja, wygaśnięcie Premium i aktualizacja contentu muszą zachować to samo znaczenie wyników. Aktywna sesja jest własnością urządzenia; synchronizacja historii nie tworzy cross-device resume. Istniejące wymagania ograniczenia utraty aktywnego czasu nie są rozluźniane.

## 9. Planner i estymaty

Plan nadal uwzględnia rzeczywisty cel oraz datę, o ile użytkownik ją podał. Terminu egzaminu właściciela nie znamy; nie wpisywać daty na podstawie słowa „pilne”. Nie ustawiać automatycznie większego budżetu ani zakończenia całości po kilku minutach dziennie.

Koszt przypadku obejmuje decyzje, jeden wspólny kontekst i wymagany feedback. Rozmiar 3 decyzji nie oznacza 3 razy koszt dawnego single-choice. Dla krótkiego formatu użyj początkowych estymat i obecnej kalibracji dopiero przy spełnionych warunkach: >=5 porównywalnych ukończonych sesji i >=20 odpowiedzi, maksymalnie 10 ostatnich, mediana aktywnego czasu z feedbackiem. Nie obniżaj tych warunków pod mikrostart.

Uczenie się po pomocy może zużywać czas bez spełniania części wymagań samodzielności. Planner musi to pokazywać zamiast tworzyć optymistyczną prognozę na podstawie liczby kliknięć. Nieznany nakład pozostaje unknown; długie zadania nadal są potrzebne do szerszego pokrycia.

## 10. Zakres treści: cała ścieżka Claude, dostarczana pionami

Pierwszy pion ma około 3–5 rzeczywistych przypadków Claude z minimum dwoma typami decyzji. Wymaga pełnego przejścia Today→odpowiedź→porównanie→koniec→historia/review/plan, nie samych fixtures. Nie czeka na globalną migrację, nowe formaty Coding ani kompletny dashboard.

Następnie przebudowujemy CAŁĄ ścieżkę Claude partiami według sensownych granic obszarów i potrzeb właściciela. „Cała” znaczy: każdy obecny objective/jednostka ma decyzję zachować/przerobić/powiązać/naprawić wraz z dowodem; nie każdy rekord musi stać się przypadkiem. Zachowujemy przydatne niezależne pytania i prawdziwe pule standardowych sesji. Nie usuwamy materiału, aby mały pilot udawał kompletny kurs.

Mapa istniejących folderów do inwentarza, nie zamiennik oficjalnego blueprintu [R2]:
- solution_design_and_architecture;
- model_prompt_and_context_decisions;
- enterprise_tools_retrieval_and_integration;
- evaluation_diagnosis_and_optimization;
- governance_safety_and_risk_controls;
- stakeholder_decisions_and_delivery_lifecycle;
- team_workflows_and_operational_enablement.

Na start wskazanie kontroli aplikacyjnych jest uzasadnionym kandydatem z istniejącej jednostki `CCARP-D05-O06`; nie twierdzimy, że to najsłabszy obszar właściciela. Wyboru pozostałych dokonaj z aktualnego banku i dostępnych wyników, nie z domniemanych słabości.

Każda zmieniona treść: poprawny klucz, oficjalne źródła, wyraźne kryterium wyboru, brak ujawniania odpowiedzi, dobry błędny wariant, niezmienniki, sensowny transfer i czytelność mobilna. Wykorzystaj już wykonane audyty; nie powtarzaj ich bez zmiany źródeł. Nie opieraj pytań na odtwarzaniu realnych poufnych zadań egzaminacyjnych.

## 11. Zamrożenie pozostałych banków

Wspólne zmiany kodu są dozwolone tylko jako konieczna obsługa Claude. Pozostałe osiem zachowuje źródła, QID, właściwe artefakty/ich semantyczne payloady, uprawnienia, dostępne formaty, scoring, selekcję i historię. Zmiana wspólnego wrappera manifestu nie może ukrywać zmiany ich treści. Baseline hashów i kontraktów ustal z realnego workspace; wykonaj regresję wspólnych konsumentów.

Nie dodawaj teraz par do GCP, ćwiczeń Coding ani nowej polityki Design. Nie ma „przy okazji” czyszczenia innych banków. Niezależne pilne poprawki krytycznych błędów mogą przechodzić tylko jako odrębnie autoryzowane zadania, nie jako rozszerzenie QLE.

Nie potrzebujemy drugiego legacy runtime. Wspólny kontrakt ma umieć reprezentować istniejące samodzielne pytania oraz nowe przypadki. Nieznany format/capability/pin daje jawny błąd, nie silent fallback. Obsługa historii dawnych wersji nie jest zgodą na równoległe aktywne źródła prawdy.

## 12. Etapy i bramka właściciela

| Etap | Zakres |
| --- | --- |
| QLE-01 v2 | Kontrakt Claude, rzeczywisty inwentarz, 3–5 przypadków oraz ochrona ośmiu banków. |
| QLE-02 v2 | Jedna pełna krótka sesja, zapis/resume/finalizacja. |
| QLE-03 v2 | Łatwy start, pełny kontekst, kontrast, eksploracja i dobrowolny koniec. |
| QLE-04 v2 | Wspomagane vs samodzielne evidence, review, postęp i nakład. |
| QLE-05 v2 | Partyjna przebudowa pełnego zakresu Claude. |
| QLE-06 v2 | QA od pierwszego pionu, rzeczywiste używanie przez właściciela i zapis jego decyzji. |

To granice odpowiedzialności, nie nakaz zbudowania sześciu poziomych frameworków przed pierwszym użyciem. Pierwszy pion przecina 01–04 i odpowiedni QA06 na kilku treściach05. Potem powtarzamy pełne małe piony tylko w Claude. QLE-06 zaczyna się wcześnie, nie dopiero po przeróbce wszystkiego.

Dwie różne decyzje: (a) pierwsze przypadki są wystarczająco użyteczne, by kontynuować Claude; (b) właściciel jest zadowolony z działania docelowej ścieżki i wyraźnie zezwala na kolejny bank. Pierwsza nie oznacza drugiej. Nawet po drugiej wybór następnego banku i zakresu musi być jawny, nie automatyczna migracja wszystkich.

Rejestr decyzji w istniejącym planie/raporcie: aktualny zakres/wersja, uwagi właściciela, rzeczywista data, status `not_requested` / `changes_requested` / `accepted`, dokładnie co zaakceptował, zakres dozwolonego rozszerzenia. Pola to wymagane znaczenie, nie nakaz stworzenia nowej bazy lub panelu. Początkowo BRAK AKCEPTACJI rozszerzenia.

## 13. Jak sprawdzamy wartość, bez nowego obowiązku dla użytkownika

Pierwszy pilot to właściciel, nie 12–50 rekrutowanych osób. Przykładowe okno obserwacji 7–10 dni jest propozycją, nie warunkiem zgody ani automatycznym unlockiem. Nie zatrzymywać pilnej nauki w oczekiwaniu na zakończenie badania.

Z istniejącej telemetrii i trwałych danych, z zachowaniem zgód: czas tap→zadanie gotowe; sesje otwarte bez pierwszej odpowiedzi; pełne małe przypadki; pauzy/wznowienia; dobrowolna kontynuacja; wyniki samodzielnych innych przykładów; potrzebna pomoc. Brak wejścia w aplikację sam z siebie nie mówi, czy powodem był opór, brak czasu czy wolny dzień. Nie interpretuj tego jako wykrytej motywacji.

Opcjonalnie po kilku użyciach krótka notatka poza obowiązkowym flow: „Co utrudniło start?”, „Gdzie rozumiałem różnicę?”, „Czy odczuwałem nacisk na ciąg dalszy?”. Nie wymagamy codziennego dziennika, skal energii, testu klinicznego ani ankiety po każdej sesji. Notatki prywatne, nie automatyczny przesył wrażliwych danych.

Osobno oceniaj: wygodę startu, poczucie jasności, samodzielny transfer, utrwalenie i pokrycie materiału. Szybki sukces po wskazówce nie jest dowodem wiedzy. Nowe zadania nie mogą być tymi, których klucze właściciel oglądał podczas authoringu/QA; zaznacz znaną lub nieznaną ekspozycję. Jedna osoba wystarczy do jej własnej decyzji produktowej, nie do deklaracji skuteczności populacyjnej lub wzrostu przychodów UE.

## 14. Co właściciel może przetestować przed przebudową

Oddziel sesję ucznia od sesji autora. Proponowany minimalny eksperyment: po jednym stabilnym, samodzielnie wybranym zdarzeniu dnia otworzyć gotowy materiał Claude, rozwiązać jeden sensowny fragment i zakończyć albo dobrowolnie kontynuować. Nie jest to cały wymagany plan pod egzamin ani stałe ograniczenie nauki do kilku minut. W obecnej sesji 10 można skorzystać z legalnej pauzy; nie liczyć jej jako ukończonej po jednym pytaniu.

Podczas nauki jedynie zanotować defekt; nie przechodzić od razu do kodu, layoutu i planowania produktu. Krytyczny błąd merytoryczny wymaga sprawdzenia oficjalnego źródła, nie utrwalania wadliwego klucza. To hipoteza ograniczenia mieszania ról, nie stwierdzenie, że właściciel już tak robi.

Na czas krótkiego bloku można ograniczyć rozpraszające powiadomienia, ale bez zakazu wszystkich przyjemności i obietnicy „resetowania dopaminy”. Konkretna sytuacja wyzwalająca działanie ma pewne wsparcie badawcze; małe badanie MCII na studentach nie dowodzi działania tej aplikacji ani nie rozstrzyga przyczyny trudności właściciela [S1, S3].

Gdy trudność dotyczy wielu aktywności, towarzyszy jej utrata zainteresowania, nasilone zmęczenie, problemy ze snem lub wyraźne pogorszenie funkcjonowania, warto skonsultować się z lekarzem lub psychologiem; nie trzeba czekać na określoną liczbę dni, gdy problem jest nasilony. Utrzymywanie się takich objawów przez około dwa tygodnie jest szczególnie istotne. To granica odpowiedzi produktowej, nie diagnoza [S2].

## 15. Źródła i ograniczenia

Źródła odczytane 13.10.2026. Nie są dowodem przeprowadzenia pilota ani bieżącej pełnej gotowości aplikacji.

[R1] Stan repo aplikacji (punktowy odczyt): https://github.com/lukaszkurczab/gcp-ace-trainer/blob/main/.agent/WORKING_STATE.md
[R2] Katalog źródeł Claude: https://github.com/lukaszkurczab/patternly-content/tree/master/content/claude-certified-architect-professional-certification
[R3] Jednostka CCARP-D05-O06, odczytany blob e8ec4aec599e1be3a7c1925f40eeed2ac2200201: https://github.com/lukaszkurczab/patternly-content/blob/master/content/claude-certified-architect-professional-certification/governance_safety_and_risk_controls/CCARP-D05-O06.json
[S1] Peter Grinspoon, Harvard Health (2020), ograniczenia pojęcia dopamine fasting: https://www.health.harvard.edu/blog/dopamine-fasting-misunderstanding-science-spawns-a-maladaptive-fad-2020022618917
[S2] NIMH, Depression (revised 2024): https://www.nimh.nih.gov/health/publications/depression
[S3] Zhou i in., Acta Psychologica 262 (2026), MCII, randomizowane badanie N=81, jeden ośrodek studencki, krótki follow-up: https://doi.org/10.1016/j.actpsy.2025.106168. Odczyt z indeksu publikacji; próba bezpośredniego otwarcia DOI nie powiodła się. Ostrożna przesłanka dla testu planu działania, nie protokół kliniczny ani gwarancja.
[S4] OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
[S5] OWASP AI Agent Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html

Źródła repo to punkty orientacyjne. Przed implementacją odczytaj aktualny workspace i przypięcia. Materiał kliniczny nie trafia do silnika rekomendacji jako diagnoza. Tezy dydaktyczne i zakres czasowy mikrostartu są hipotezami do sprawdzenia przez właściciela.

---

<!-- PLIK: 01-QLE-01-CLAUDE-KONTRAKT.md -->

# QLE-01 v2 — kontrakt Claude i pierwszy rzeczywisty pion

## Dyrektywa wspólna — QLE v2, Claude-only

Pracujesz nad Patternly w istniejącym workspace: APP `lukaszkurczab/gcp-ace-trainer`, CONTENT `lukaszkurczab/patternly-content`, BACKEND `lukaszkurczab/patternly-backend`, WEB `lukaszkurczab/patternly-web`. Ten prompt zastępuje wcześniejszą wersję tego samego QLE. Właściciel uczy się do Claude Certified Architect — Professional i jest pierwszym użytkownikiem. Przebudowuj WYŁĄCZNIE track `claude-certified-architect-professional-certification`. Pełny zakres Claude dostarczamy małymi pionami; pozostałe osiem banków i ich zachowanie są zamrożone do wyraźnej późniejszej zgody właściciela. Brak takiej zgody to stan domyślny. CI, liczba sesji, ocena Codex i brak uwag nie są zgodą.

Nie wykonuj dawnej fali Coding/GCP, przykładowego pionu Design, nowych codingowych typów odpowiedzi, kampanii, web demo ani rekrutacji zewnętrznych uczestników. Pierwszy prywatny pion Claude ma priorytet bez czekania na migrację katalogu lub publiczną premierę; nie omijaj bezpieczeństwa/trwałości, realnych zależności builda i zewnętrznych autoryzacji. Sam ten plik przygotowuje zlecenie, a nie zmienia usług. Wykonuj zakres po przekazaniu go przez właściciela.

Odczytaj aktualne AGENTS, `.agent/WORKING_STATE.md`, `docs/PATTERNLY-WORKING-PLAN.md` i normatywne kontrakty wskazane w głównym workspace. Sprawdź HEAD, worktree i już wykonane QLE/BIZQ/FCA-EDIT. Zachowaj kompatybilną implementację i dowody, usuń tylko rzeczywiście zastąpione ścieżki. Jedna kolejka i jeden uprawniony writer. Nie twórz drugiego klonu/worktree, nowego Gościa, resetu, stash ani nie nadpisuj cudzych zmian i profili. Nie powtarzaj zakończonych audytów bez zmiany źródeł. Nie wyceniaj pracy ani recenzji.

Zachowaj `mentalUnitId`, jeden lifecycle i scorer danego typu, jeden authoring, wersjonowane artefakty i content piny, lokalną własność aktywnej sesji, sync historii, atomowe goal+plan, Partial=0 i stare ukończenia. Obecne 10/20/40 pozostają. NOWA propozycja kontraktu dla Claude: jeden pełny przypadek 2–4 ocenianych decyzji jako rzeczywisty preset tego samego mechanizmu. Nie udawaj ukończonej sesji 10 po trzech krokach. Nie zmieniaj stałych diagnoz/egzaminów ani uprawnień. Zarejestruj jawnie zmianę polityki/capability w kanonicznym kontrakcie; nie przedstawiaj jej jako już działającej. Bez zmiany review 7→14→28 i error24h→repair7 oraz bez przeliczenia historii. Nowe zasady kwalifikacji wspomaganych prób dotyczą przebudowanych przypadków Claude, nie innych tracków.

Cel UX: małe zobowiązanie, konkretny przypadek, zmieniony fakt, własna decyzja, porównanie, pełny koniec i dobrowolny ciąg dalszy. Bez streaków, presji, nieskończonego feedu, LLM-sędziego, runtime generatora, IDE, drugiego storage, nowej bazy telemetrycznej lub diagnozowania motywacji. Nieznany typ/pin/capability to jawny błąd, nie fallback do ABCD.

## Wynik

Ustal najmniejszy kontrakt pozwalający uruchomić kilka pełnych przypadków Claude i preset „Jeden przypadek”. Dostarcz realne treści akceptacyjne i ochronę zachowania pozostałych ścieżek; nie buduj ogólnego frameworka dla dziewięciu banków.

## Wykonaj

1. W istniejącym rejestrze PO zapisz bezpośrednią decyzję Claude-only i późniejszą zgodę na rozszerzenie jako oddzielną bramkę. Zastąp stare zakresy QLE, zachowaj zgodne wykonane fragmenty. Zaproponowane szczegóły mikrostartu oznacz jako nowy projekt kontraktu, nie cytat PO.
2. Ustal aktualny inwentarz Claude: węzły, mentalUnitId, QID, sourceRefs, aktywny artefakt/pin, tryby, freeNode, entitlement, historia audytu. Zweryfikuj mapowanie do oficjalnego Professional, nie Foundations. Brak źródła blueprintu zapisuj lokalnie jako evidence gap; nie kopiuj parametrów z nieoficjalnej strony.
3. Zapisz baseline źródeł, artefaktów/semantycznych payloadów i publicznych kontraktów pozostałych ośmiu tracków. Wykryj konieczne współdzielone zmiany; żadnego authoringu w innych bankach.
4. Zidentyfikuj istniejących właścicieli `questionRelation`, interakcji, planu sesji, wyniku i review. Użyj obecnego modelu pytania. Dodaj minimalną recepturę przypadku: wspólny kontekst, ordered QID/step IDs, jawna delta względem wskazanego wariantu bazowego, wymagany kontekst kroku, reveal policy i dozwolona rola. Receptura przechowywana raz w obecnym źródle; builder tworzy indeks. Nie utrzymuj równoległych edytowalnych relacji par i przypadków.
5. Preset jednej pełnej sekwencji dopuszczaj przez kanoniczne capabilities Claude, nie stan konta developera ani UI-only filtr. Zachowaj zwykłe samodzielne pytania, 10/20/40 i wszystkie dawne tryby. Obecny kontrakt ma obsługiwać oba kształty w jednym runnerze, nie adapter legacy do drugiego świata.
6. Evidence rozszerz o pierwszą odpowiedź, assistance before submit, solution exposure, case/step ID, known/unknown exposure i policy version. Reveal/eksploracja muszą być trwałe. Zdefiniuj rolę wspomaganą vs samodzielną bez dożywotniego wykluczenia jednostki po pomocy. Partial=0, liczby completion i historyczne wyniki pozostają.
7. Przygotuj 3–5 REALNYCH przypadków Claude. Kandydat z potwierdzonego źródła: `governance_safety_and_risk_controls/CCARP-D05-O06.json`; kolejne dobierz z aktualnego katalogu i potrzeb, nie losuj domniemanych słabych tematów. Każdy zwykle 2–4 decyzje; w katalogu pokryj zmianę rozstrzygającą i nierozstrzygającą. Nie wypełniaj produkcji fixtures.
8. Na start wystarczą istniejące typy wyboru, złożonego uzasadnienia i ordering, o ile są odebrane end-to-end. Nie zamawiaj edytora kodu, tablic numerycznych czy generycznego parsera bez realnej potrzeby Claude. Gdy nowy typ jest konieczny, jawnie uwzględnij certyfikacyjne summary/history/review.
9. Przygotuj inne zadania do późniejszego samodzielnego sprawdzenia. Nie traktuj przykładu ujawnionego właścicielowi w dokumencie jako unseen.

## AC

Nielegalny QID/obcy track, brak kontekstu, duplikat kroku, nieistniejący wariant, cykl, pusta sekwencja i niewspierany feedback są odrzucane. Każda wybieralna konfiguracja ma autorską odpowiedź. Neutralne metadane nie zawierają przyszłego klucza. Jeden compound response = jedna oceniana odpowiedź. Wynik pomocniczy nie tworzy fikcyjnego punktu. Capabilities nie zmieniają innych tracków lub diagnoz. Producent i konsument mają zgodne walidatory i realne acceptance fixtures z Claude. Historyczne sesje i wyniki zachowują dokładne piny/odczyty.

## Przekazanie

QLE-02 i QLE-03 dostają mały działający kontrakt, treści i expected outcomes. Nie wymagaj zakończenia wszystkich jednostek Claude, aby odebrać ten pion. Rozszerzanie całej ścieżki należy do QLE-05, a bieżące użycie/feedback do QLE-06.

## Odbiór i przekazanie

Uruchom rzeczywiste testy zmienionych granic i obowiązujące bramki. Raportuj polecenia, SHA, zakres i PASS/FAIL/SKIP/BLOCKED bez zamiany braku dowodu na sukces. Natywne testy w aktualnym zakresie iOS, z ochroną danych i autoryzowanego urządzenia. Nie reaktywuj wyłączonej bramki VoiceOver ani nie rozszerzaj automatycznie na Android. Semantyka dostępności pozostaje wymagana. Build/install/signing/deploy/publish i zewnętrzne konta wymagają właściwej, aktualnej zgody; zgoda na plan nie jest zgodą na te skutki.

W jedynej kolejce zapisz wersję QLE v2, co wykonano i najmniejszy następny zakres CLAUDE. Rozdziel techniczne działanie, merytoryczną jakość, osobiste użycie i faktyczną zgodę właściciela. Nie uruchamiaj migracji innych banków. Zachowaj uczciwy status pierwszego iOS i brak publicznego GO, dopóki nie ma odrębnego dowodu i decyzji.

---

<!-- PLIK: 02-QLE-02-JEDEN-PRZYPADEK-I-TRWALOSC.md -->

# QLE-02 v2 — krótka sesja Claude, wznowienie i trwałość

## Dyrektywa wspólna — QLE v2, Claude-only

Pracujesz nad Patternly w istniejącym workspace: APP `lukaszkurczab/gcp-ace-trainer`, CONTENT `lukaszkurczab/patternly-content`, BACKEND `lukaszkurczab/patternly-backend`, WEB `lukaszkurczab/patternly-web`. Ten prompt zastępuje wcześniejszą wersję tego samego QLE. Właściciel uczy się do Claude Certified Architect — Professional i jest pierwszym użytkownikiem. Przebudowuj WYŁĄCZNIE track `claude-certified-architect-professional-certification`. Pełny zakres Claude dostarczamy małymi pionami; pozostałe osiem banków i ich zachowanie są zamrożone do wyraźnej późniejszej zgody właściciela. Brak takiej zgody to stan domyślny. CI, liczba sesji, ocena Codex i brak uwag nie są zgodą.

Nie wykonuj dawnej fali Coding/GCP, przykładowego pionu Design, nowych codingowych typów odpowiedzi, kampanii, web demo ani rekrutacji zewnętrznych uczestników. Pierwszy prywatny pion Claude ma priorytet bez czekania na migrację katalogu lub publiczną premierę; nie omijaj bezpieczeństwa/trwałości, realnych zależności builda i zewnętrznych autoryzacji. Sam ten plik przygotowuje zlecenie, a nie zmienia usług. Wykonuj zakres po przekazaniu go przez właściciela.

Odczytaj aktualne AGENTS, `.agent/WORKING_STATE.md`, `docs/PATTERNLY-WORKING-PLAN.md` i normatywne kontrakty wskazane w głównym workspace. Sprawdź HEAD, worktree i już wykonane QLE/BIZQ/FCA-EDIT. Zachowaj kompatybilną implementację i dowody, usuń tylko rzeczywiście zastąpione ścieżki. Jedna kolejka i jeden uprawniony writer. Nie twórz drugiego klonu/worktree, nowego Gościa, resetu, stash ani nie nadpisuj cudzych zmian i profili. Nie powtarzaj zakończonych audytów bez zmiany źródeł. Nie wyceniaj pracy ani recenzji.

Zachowaj `mentalUnitId`, jeden lifecycle i scorer danego typu, jeden authoring, wersjonowane artefakty i content piny, lokalną własność aktywnej sesji, sync historii, atomowe goal+plan, Partial=0 i stare ukończenia. Obecne 10/20/40 pozostają. NOWA propozycja kontraktu dla Claude: jeden pełny przypadek 2–4 ocenianych decyzji jako rzeczywisty preset tego samego mechanizmu. Nie udawaj ukończonej sesji 10 po trzech krokach. Nie zmieniaj stałych diagnoz/egzaminów ani uprawnień. Zarejestruj jawnie zmianę polityki/capability w kanonicznym kontrakcie; nie przedstawiaj jej jako już działającej. Bez zmiany review 7→14→28 i error24h→repair7 oraz bez przeliczenia historii. Nowe zasady kwalifikacji wspomaganych prób dotyczą przebudowanych przypadków Claude, nie innych tracków.

Cel UX: małe zobowiązanie, konkretny przypadek, zmieniony fakt, własna decyzja, porównanie, pełny koniec i dobrowolny ciąg dalszy. Bez streaków, presji, nieskończonego feedu, LLM-sędziego, runtime generatora, IDE, drugiego storage, nowej bazy telemetrycznej lub diagnozowania motywacji. Nieznany typ/pin/capability to jawny błąd, nie fallback do ABCD.

## Wynik

Użytkownik może ukończyć jeden prawdziwy przypadek i wrócić później, bez utraty danych, fałszywego postępu i konieczności kończenia sesji dziesięciu pytań. Zależność: kontrakt i pierwsze treści QLE-01; QLE-03/04 rozwijaj pionowo, nie jako drugi runner.

## Wykonaj

1. Dodaj do obecnego request/plan contract preset jednego przypadku. Plan zawiera stabilny case ID/version, wszystkie occurrences, prawdziwe N decyzji, odpowiedni feedback i piny. N=2–4 w pierwszych przypadkach; żadnego deklarowanego 10.
2. Legalność dotyczy pełnej sekwencji, zakresu wiedzy, uprawnienia i lokalnej kompletności treści. Nie można zacząć Free i zablokować ostatniej decyzji paywallem. Nie skracaj pełnej diagnozy, symulacji ani aktywnego egzaminu. Brak legalnej puli to jawny wynik, nie powielanie pytań.
3. W standardowym 10/20/40 planuj pełne przypadki i niezależne pytania bez urywania i duplikatów. To nie jest zgoda na nowe 20/40 we Free. Dobór nie może wyciekać przyszłą odpowiedzią ani pomijać trudnych obszarów tylko w celu podniesienia trafności.
4. Zapisuj istniejącym protokołem odpowiedź, rolę, pomoc/ekspozycję, step i next step. First response immutable. Zapis ekspozycji przed widocznym reveal; brak potwierdzonego zapisu nie daje prawa klasyfikować później próby jako niezależnej.
5. Wznowienie zachowuje dane, kolejność opcji, przeczytany feedback, pokazane warianty i aktywny czas. Nie powstaje drugi profil/Gość, nie przejmuj cudzej device-owned sesji. Przełączenie ścieżki nie czyści aktywnego quizu.
6. Ostatnia decyzja uruchamia rzeczywistą finalizację mikro-sesji. Eksploracja pozostaje niepunktowana; jej ekspozycje także po finalizacji są prawdziwie rejestrowane. „Kolejny przypadek” dopiero po intencji użytkownika tworzy nową sesję z aktualną legalnością. Brak autostartu i wydłużania poprzedniej sesji.
7. Obecny selector/planner wybiera następny legalny krok. Nie implementuj drugiej kolejki obok due/remediation. Należnej pracy nie przyspieszaj, długich obowiązków nie zaliczaj mikrostartem. Gdy nie ma krótkiego legalnego due, dopuszczalna jawna nauka nie wymazuje obowiązkowej powtórki.
8. Backend zmieniaj tylko dla niezbędnej ewolucji istniejących faktów; nie twórz nowego content API, równoległego outbox ani cross-device active resume. Synchronizacja ekspozycji/historii musi uwzględniać konflikt i nie cofać znanej pomocy.

## AC i obowiązkowe próby

- Pełny przypadek 3 kroki zapisuje 3 oceniane decyzje i jedną zakończoną krótką sesję, nie 10 i nie 3 samodzielne dowody po pomocy.
- Double tap submit/finalize/continue, retry i sync replay nie dublują ocen lub nowych sesji.
- Przerwanie przed/po submit, przed/po reveal, w porównaniu i podczas finalizacji zachowuje prawdę; nie resetuje niezależności.
- Offline i brak permission do powiadomień nie blokują lokalnego legalnego startu. Brak treści, uszkodzony pin i niezgodny plan są jawne.
- Content update nie zmienia aktywnego przypadku. Expiry/refund zachowuje bieżący kontrakt sesji rozpoczętej legalnie; nowa sesja wymaga świeżej legalności.
- Stary aktywny quiz pozostaje dostępny i nie jest cicho przenoszony do presetu jednego przypadku.
- Osiem innych tracków ma niezmieniony dostępny zakres i wynik, z regresją wspólnych ścieżek.

## Odbiór i przekazanie

Uruchom rzeczywiste testy zmienionych granic i obowiązujące bramki. Raportuj polecenia, SHA, zakres i PASS/FAIL/SKIP/BLOCKED bez zamiany braku dowodu na sukces. Natywne testy w aktualnym zakresie iOS, z ochroną danych i autoryzowanego urządzenia. Nie reaktywuj wyłączonej bramki VoiceOver ani nie rozszerzaj automatycznie na Android. Semantyka dostępności pozostaje wymagana. Build/install/signing/deploy/publish i zewnętrzne konta wymagają właściwej, aktualnej zgody; zgoda na plan nie jest zgodą na te skutki.

W jedynej kolejce zapisz wersję QLE v2, co wykonano i najmniejszy następny zakres CLAUDE. Rozdziel techniczne działanie, merytoryczną jakość, osobiste użycie i faktyczną zgodę właściciela. Nie uruchamiaj migracji innych banków. Zachowaj uczciwy status pierwszego iOS i brak publicznego GO, dopóki nie ma odrębnego dowodu i decyzji.

---

<!-- PLIK: 03-QLE-03-START-I-UCZENIE.md -->

# QLE-03 v2 — łatwy start Claude i poczucie zrozumienia

## Dyrektywa wspólna — QLE v2, Claude-only

Pracujesz nad Patternly w istniejącym workspace: APP `lukaszkurczab/gcp-ace-trainer`, CONTENT `lukaszkurczab/patternly-content`, BACKEND `lukaszkurczab/patternly-backend`, WEB `lukaszkurczab/patternly-web`. Ten prompt zastępuje wcześniejszą wersję tego samego QLE. Właściciel uczy się do Claude Certified Architect — Professional i jest pierwszym użytkownikiem. Przebudowuj WYŁĄCZNIE track `claude-certified-architect-professional-certification`. Pełny zakres Claude dostarczamy małymi pionami; pozostałe osiem banków i ich zachowanie są zamrożone do wyraźnej późniejszej zgody właściciela. Brak takiej zgody to stan domyślny. CI, liczba sesji, ocena Codex i brak uwag nie są zgodą.

Nie wykonuj dawnej fali Coding/GCP, przykładowego pionu Design, nowych codingowych typów odpowiedzi, kampanii, web demo ani rekrutacji zewnętrznych uczestników. Pierwszy prywatny pion Claude ma priorytet bez czekania na migrację katalogu lub publiczną premierę; nie omijaj bezpieczeństwa/trwałości, realnych zależności builda i zewnętrznych autoryzacji. Sam ten plik przygotowuje zlecenie, a nie zmienia usług. Wykonuj zakres po przekazaniu go przez właściciela.

Odczytaj aktualne AGENTS, `.agent/WORKING_STATE.md`, `docs/PATTERNLY-WORKING-PLAN.md` i normatywne kontrakty wskazane w głównym workspace. Sprawdź HEAD, worktree i już wykonane QLE/BIZQ/FCA-EDIT. Zachowaj kompatybilną implementację i dowody, usuń tylko rzeczywiście zastąpione ścieżki. Jedna kolejka i jeden uprawniony writer. Nie twórz drugiego klonu/worktree, nowego Gościa, resetu, stash ani nie nadpisuj cudzych zmian i profili. Nie powtarzaj zakończonych audytów bez zmiany źródeł. Nie wyceniaj pracy ani recenzji.

Zachowaj `mentalUnitId`, jeden lifecycle i scorer danego typu, jeden authoring, wersjonowane artefakty i content piny, lokalną własność aktywnej sesji, sync historii, atomowe goal+plan, Partial=0 i stare ukończenia. Obecne 10/20/40 pozostają. NOWA propozycja kontraktu dla Claude: jeden pełny przypadek 2–4 ocenianych decyzji jako rzeczywisty preset tego samego mechanizmu. Nie udawaj ukończonej sesji 10 po trzech krokach. Nie zmieniaj stałych diagnoz/egzaminów ani uprawnień. Zarejestruj jawnie zmianę polityki/capability w kanonicznym kontrakcie; nie przedstawiaj jej jako już działającej. Bez zmiany review 7→14→28 i error24h→repair7 oraz bez przeliczenia historii. Nowe zasady kwalifikacji wspomaganych prób dotyczą przebudowanych przypadków Claude, nie innych tracków.

Cel UX: małe zobowiązanie, konkretny przypadek, zmieniony fakt, własna decyzja, porównanie, pełny koniec i dobrowolny ciąg dalszy. Bez streaków, presji, nieskończonego feedu, LLM-sędziego, runtime generatora, IDE, drugiego storage, nowej bazy telemetrycznej lub diagnozowania motywacji. Nieznany typ/pin/capability to jawny błąd, nie fallback do ABCD.

## Wynik

Na istniejących ekranach użytkownik zaczyna konkretny przypadek, widzi różnicę warunków, rozumie konsekwencję i może bez nacisku zakończyć. Bez osobnej zakładki laboratorium, wielkiego redesignu i nowego systemu nagród.

## Wykonaj

1. Dla użytkownika z aktywnie wybranym Claude pokazuj w Today jedną główną rekomendację z konkretnym tematem, prawdziwym N decyzji i działającym CTA. Nie hardkoduj nazwiska/ID właściciela ani nie ustawiaj Claude wszystkim. Katalog i większe konfiguracje zostają dostępne, ale nie są obowiązkowym formularzem startu.
2. „Wznów” ma pierwszeństwo przy rzeczywistej aktywnej sesji. Nie opisuj wznowienia długiej symulacji jako mikrostartu. Po przełączeniu konta/ścieżki rekomendacja musi odpowiadać prawdziwemu lokalnemu stanowi; nie zrzucaj obcej sesji.
3. Tap ma prowadzić do czytelnego pierwszego zadania bez obowiązkowej ankiety, 40-pytaniowej diagnozy, konfiguracji czasu i prośby o notifications. Jeżeli obecny kontrakt wymaga diagnozy do danego trybu, użyj jawnie dopuszczonego treningu jednego przypadku, nie sfałszuj ukończenia diagnozy.
4. Estymata „około 3–5 min” wyłącznie jako początkowy szacunek autora dla danej treści. Lepiej „Jeden przypadek · 3 decyzje” niż gwarancja minut. Nie pokazuj odliczania i nie przyspieszaj czytania. Zmierz cold launch oraz tap→interaktywny prompt oddzielnie i pokaż rzeczywiste luki wydajności.
5. Każdy krok ma jedno główne polecenie. Pełne warunki są dostępne bez pamiętania ukrytej treści. Zmianę wskaż względem konkretnego wariantu bazowego, np. „Zgoda: brak → potwierdzona dla tej czynności”. Przed odpowiedzią nie ujawniaj wniosku w tytule, tooltipie, accessibility lub nazwie opcji.
6. Po decyzji: krótki powód odnoszący się do rzeczywistego wyboru, szczegóły zwinięte zgodnie z obecnym językiem brandu. Pytanie o uzasadnienie dodawaj tylko tam, gdzie to cel; nie zmuszaj do wpisywania zdania po każdej odpowiedzi.
7. Porównanie pokazuje warunki i własne pierwsze odpowiedzi. W eksploratorze tylko przygotowane warianty; przełączanie daje od razu konsekwencję po granicy reveal i trwałym exposure, bez kolejnych punktów. Nie otwieraj nieprzygotowanych kombinacji.
8. Koniec: „Przypadek ukończony”, rzeczowy wynik z informacją o wsparciu, dwa czytelne działania „Na dziś kończę” i „Kolejny przypadek”. Brak autostartu, ukrytego zamknięcia, winy, streak-loss, celebracji sugerującej mastery i sztucznego „zrobiony plan dnia”. Środek przypadku też może zostać prawidłowo wstrzymany.
9. Daj dostęp do wskazówki/objaśnienia bez kary i bez pozornego uznania poprawności. Użytkownik wybiera wsparcie w zadaniu; aplikacja nie wymaga diagnozy nastroju/energii przy każdym wejściu.
10. Powrót po przerwie ma normalny wykonalny CTA. Realnego backlogu nie usuwaj, ale nie nakładaj czerwonego długu na główny start. Dłuższa potrzebna praca pozostaje jawna w planie.
11. Istniejące przypomnienia: tylko opcjonalne, skonfigurowane zgodnie ze zgodą; treść konkretna, bez presji. Brak zezwolenia OS nie obniża funkcjonalności nauki. Link prowadzi do bezpiecznego startu/resume, nie odpala sesji w tle.

## AC

Rzeczywisty przypadek Claude przechodzi cały flow na iOS. Sprawdź mały ekran, duży tekst, oba motywy, scroll, focus po przejściu, dostępne alternatywy dla gestów i neutralne etykiety przed odpowiedzią. Zatrzymanie i późniejszy powrót nie gubią kroku. Istniejące locale pozostają spójne; nie wprowadzaj mieszania języków UI. Zrozumiały błąd/dowód completion nie zależy tylko od animacji. Każda akcja jest podłączona do realnego lifecycle; żadne demo-only handler.

## Poza tym pakietem

Code selection, structured numeric/array inputs, IDE, swobodne ocenianie przez model, marketingowe demo, płatne kampanie, powszechna zmiana ekranów innych ścieżek. Nie dodawaj ich jako „niezbędnego następnego kroku”.

## Odbiór i przekazanie

Uruchom rzeczywiste testy zmienionych granic i obowiązujące bramki. Raportuj polecenia, SHA, zakres i PASS/FAIL/SKIP/BLOCKED bez zamiany braku dowodu na sukces. Natywne testy w aktualnym zakresie iOS, z ochroną danych i autoryzowanego urządzenia. Nie reaktywuj wyłączonej bramki VoiceOver ani nie rozszerzaj automatycznie na Android. Semantyka dostępności pozostaje wymagana. Build/install/signing/deploy/publish i zewnętrzne konta wymagają właściwej, aktualnej zgody; zgoda na plan nie jest zgodą na te skutki.

W jedynej kolejce zapisz wersję QLE v2, co wykonano i najmniejszy następny zakres CLAUDE. Rozdziel techniczne działanie, merytoryczną jakość, osobiste użycie i faktyczną zgodę właściciela. Nie uruchamiaj migracji innych banków. Zachowaj uczciwy status pierwszego iOS i brak publicznego GO, dopóki nie ma odrębnego dowodu i decyzji.

---

<!-- PLIK: 04-QLE-04-POSTEP-REVIEW-PLAN.md -->

# QLE-04 v2 — prawdziwy postęp i plan dla krótkich przypadków Claude

## Dyrektywa wspólna — QLE v2, Claude-only

Pracujesz nad Patternly w istniejącym workspace: APP `lukaszkurczab/gcp-ace-trainer`, CONTENT `lukaszkurczab/patternly-content`, BACKEND `lukaszkurczab/patternly-backend`, WEB `lukaszkurczab/patternly-web`. Ten prompt zastępuje wcześniejszą wersję tego samego QLE. Właściciel uczy się do Claude Certified Architect — Professional i jest pierwszym użytkownikiem. Przebudowuj WYŁĄCZNIE track `claude-certified-architect-professional-certification`. Pełny zakres Claude dostarczamy małymi pionami; pozostałe osiem banków i ich zachowanie są zamrożone do wyraźnej późniejszej zgody właściciela. Brak takiej zgody to stan domyślny. CI, liczba sesji, ocena Codex i brak uwag nie są zgodą.

Nie wykonuj dawnej fali Coding/GCP, przykładowego pionu Design, nowych codingowych typów odpowiedzi, kampanii, web demo ani rekrutacji zewnętrznych uczestników. Pierwszy prywatny pion Claude ma priorytet bez czekania na migrację katalogu lub publiczną premierę; nie omijaj bezpieczeństwa/trwałości, realnych zależności builda i zewnętrznych autoryzacji. Sam ten plik przygotowuje zlecenie, a nie zmienia usług. Wykonuj zakres po przekazaniu go przez właściciela.

Odczytaj aktualne AGENTS, `.agent/WORKING_STATE.md`, `docs/PATTERNLY-WORKING-PLAN.md` i normatywne kontrakty wskazane w głównym workspace. Sprawdź HEAD, worktree i już wykonane QLE/BIZQ/FCA-EDIT. Zachowaj kompatybilną implementację i dowody, usuń tylko rzeczywiście zastąpione ścieżki. Jedna kolejka i jeden uprawniony writer. Nie twórz drugiego klonu/worktree, nowego Gościa, resetu, stash ani nie nadpisuj cudzych zmian i profili. Nie powtarzaj zakończonych audytów bez zmiany źródeł. Nie wyceniaj pracy ani recenzji.

Zachowaj `mentalUnitId`, jeden lifecycle i scorer danego typu, jeden authoring, wersjonowane artefakty i content piny, lokalną własność aktywnej sesji, sync historii, atomowe goal+plan, Partial=0 i stare ukończenia. Obecne 10/20/40 pozostają. NOWA propozycja kontraktu dla Claude: jeden pełny przypadek 2–4 ocenianych decyzji jako rzeczywisty preset tego samego mechanizmu. Nie udawaj ukończonej sesji 10 po trzech krokach. Nie zmieniaj stałych diagnoz/egzaminów ani uprawnień. Zarejestruj jawnie zmianę polityki/capability w kanonicznym kontrakcie; nie przedstawiaj jej jako już działającej. Bez zmiany review 7→14→28 i error24h→repair7 oraz bez przeliczenia historii. Nowe zasady kwalifikacji wspomaganych prób dotyczą przebudowanych przypadków Claude, nie innych tracków.

Cel UX: małe zobowiązanie, konkretny przypadek, zmieniony fakt, własna decyzja, porównanie, pełny koniec i dobrowolny ciąg dalszy. Bez streaków, presji, nieskończonego feedu, LLM-sędziego, runtime generatora, IDE, drugiego storage, nowej bazy telemetrycznej lub diagnozowania motywacji. Nieznany typ/pin/capability to jawny błąd, nie fallback do ABCD.

## Wynik

Mikrostart obniża zobowiązanie czasowe, ale nie progi wiedzy. Wszystkie wyniki, review i prognozy muszą rozróżniać completed case, aktywny czas, samodzielne odpowiedzi, odpowiedzi ze wsparciem i faktyczne obowiązki.

## Wykonaj

1. Rozszerz istniejącą interpretację evidence wersjonowaną polityką dla przebudowanych przypadków Claude. Zachowaj semantykę pozostałych ośmiu ścieżek i historycznych prób. Nie dopisuj brakującej starej informacji jako „na pewno bez pomocy”.
2. Jedna złożona odpowiedź ma jeden ogólny wynik (partial=0), z diagnostyką części. Kolejne próby po pomocy nie naprawiają pierwszej odpowiedzi. Poprawa w kolejnym wariancie jest prawdziwą aktywnością nauki, nie retroaktywną trafnością.
3. Wspomagane nowe kroki nie zaliczają minimum samodzielnej praktyki, 16/20 ani due. Zachowaj obecne wartości minimum 4×units/ceil20 i pozostały kontrakt CompletionRules. Jawna zmiana dotyczy eligibility nowych evidence, nie historycznych progów lub cofania chapter completion.
4. Utrwalenie pozostaje według realnego due 7→14→28 oraz błędu→24h→repair7. Nie zaokrąglaj terminu do „dzisiaj dla motywacji”; nie przeliczaj poprawnej nauki po podpowiedzi jako retention pass. Po poprzedniej nauce późniejszy samodzielny retrieval może mieć wartość; unikaj permanent contamination całego mentalUnitId.
5. „Nowy przykład” to rzeczywiście inny kontekst/warunek, bez znanej ekspozycji w explorerze lub authoringu właściciela. „Samodzielne” oznacza brak bieżącego wsparcia; nie jest to synonim „nigdy wcześniej nie widziane”. Zachowaj oba rozróżnienia.
6. Nie wprowadzaj równoważności sesji po ich liczbie. 3-decision case nie liczy się jak 10-item practice. Stats/Activity/history pokazują true unique items i role; completedItemCount nie może rosnąć przez otwarcie objaśnienia lub przełączanie wariantów.
7. Wymagany review/summary/history dla wszystkich użytych w Claude interakcji działa end-to-end. Nieznany typ daje jawny stan, nie pominięcie błędnej próby lub zamianę na zwykły choice. Sam registry nie dowodzi kompatybilności trybu.
8. Planner liczy jeden wspólny kontekst, odpowiedzi i wymagany feedback. Nieudowodnione czasy to author estimates/unknown. Nowy format nie dziedziczy bezwarunkowo median starego quizu. Zachowaj >=5 comparable sessions i >=20 answers, max10 sessions oraz median active including errors/feedback; nie zmniejszaj warunków kalibracji pod krótkie sesje.
9. Ukończenie mikrostartu może nie wystarczyć do dnia/rozdziału/deadline. Planner musi pokazać prawdziwy pozostały nakład, brak danych i shortfall bez zawstydzania. Nie ukrywaj pozostających mandatory/Premium scopes ani nie dodawaj wolumenu fikcyjnie.
10. Zachowaj per-track budget i atomowy goal+plan. Nie znamy daty egzaminu właściciela — nie wymyślaj jej, nie wstawiaj domyślnego tygodnia i nie zakładaj, że kilka minut dziennie wystarczy. Korzystaj z już ustawionego celu.

## Testy

Porównaj tę samą historię przed/po zmianie: stare ukończenia i wyniki identyczne. Nowe assisted/correct nie awansuje due; nowy samodzielny correct/due awansuje tylko według kanonicznego terminu. Replay/restore/reinstall w granicach autoryzowanego testu nie tworzy nowego evidence. Znana ekspozycja nie znika po sync konfliktach; unknown nie staje się unseen. Mikro-sesja nie liczy wspólnego czasu kilka razy. Osiem innych tracków ma niezmienione projections dla tych samych wejść. Rezygnacja po completed case nie generuje porzuconej fikcyjnej sesji10.

## Odbiór i przekazanie

Uruchom rzeczywiste testy zmienionych granic i obowiązujące bramki. Raportuj polecenia, SHA, zakres i PASS/FAIL/SKIP/BLOCKED bez zamiany braku dowodu na sukces. Natywne testy w aktualnym zakresie iOS, z ochroną danych i autoryzowanego urządzenia. Nie reaktywuj wyłączonej bramki VoiceOver ani nie rozszerzaj automatycznie na Android. Semantyka dostępności pozostaje wymagana. Build/install/signing/deploy/publish i zewnętrzne konta wymagają właściwej, aktualnej zgody; zgoda na plan nie jest zgodą na te skutki.

W jedynej kolejce zapisz wersję QLE v2, co wykonano i najmniejszy następny zakres CLAUDE. Rozdziel techniczne działanie, merytoryczną jakość, osobiste użycie i faktyczną zgodę właściciela. Nie uruchamiaj migracji innych banków. Zachowaj uczciwy status pierwszego iOS i brak publicznego GO, dopóki nie ma odrębnego dowodu i decyzji.

---

<!-- PLIK: 05-QLE-05-CALY-BANK-CLAUDE.md -->

# QLE-05 v2 — pełna ścieżka Claude, migracja partiami

## Dyrektywa wspólna — QLE v2, Claude-only

Pracujesz nad Patternly w istniejącym workspace: APP `lukaszkurczab/gcp-ace-trainer`, CONTENT `lukaszkurczab/patternly-content`, BACKEND `lukaszkurczab/patternly-backend`, WEB `lukaszkurczab/patternly-web`. Ten prompt zastępuje wcześniejszą wersję tego samego QLE. Właściciel uczy się do Claude Certified Architect — Professional i jest pierwszym użytkownikiem. Przebudowuj WYŁĄCZNIE track `claude-certified-architect-professional-certification`. Pełny zakres Claude dostarczamy małymi pionami; pozostałe osiem banków i ich zachowanie są zamrożone do wyraźnej późniejszej zgody właściciela. Brak takiej zgody to stan domyślny. CI, liczba sesji, ocena Codex i brak uwag nie są zgodą.

Nie wykonuj dawnej fali Coding/GCP, przykładowego pionu Design, nowych codingowych typów odpowiedzi, kampanii, web demo ani rekrutacji zewnętrznych uczestników. Pierwszy prywatny pion Claude ma priorytet bez czekania na migrację katalogu lub publiczną premierę; nie omijaj bezpieczeństwa/trwałości, realnych zależności builda i zewnętrznych autoryzacji. Sam ten plik przygotowuje zlecenie, a nie zmienia usług. Wykonuj zakres po przekazaniu go przez właściciela.

Odczytaj aktualne AGENTS, `.agent/WORKING_STATE.md`, `docs/PATTERNLY-WORKING-PLAN.md` i normatywne kontrakty wskazane w głównym workspace. Sprawdź HEAD, worktree i już wykonane QLE/BIZQ/FCA-EDIT. Zachowaj kompatybilną implementację i dowody, usuń tylko rzeczywiście zastąpione ścieżki. Jedna kolejka i jeden uprawniony writer. Nie twórz drugiego klonu/worktree, nowego Gościa, resetu, stash ani nie nadpisuj cudzych zmian i profili. Nie powtarzaj zakończonych audytów bez zmiany źródeł. Nie wyceniaj pracy ani recenzji.

Zachowaj `mentalUnitId`, jeden lifecycle i scorer danego typu, jeden authoring, wersjonowane artefakty i content piny, lokalną własność aktywnej sesji, sync historii, atomowe goal+plan, Partial=0 i stare ukończenia. Obecne 10/20/40 pozostają. NOWA propozycja kontraktu dla Claude: jeden pełny przypadek 2–4 ocenianych decyzji jako rzeczywisty preset tego samego mechanizmu. Nie udawaj ukończonej sesji 10 po trzech krokach. Nie zmieniaj stałych diagnoz/egzaminów ani uprawnień. Zarejestruj jawnie zmianę polityki/capability w kanonicznym kontrakcie; nie przedstawiaj jej jako już działającej. Bez zmiany review 7→14→28 i error24h→repair7 oraz bez przeliczenia historii. Nowe zasady kwalifikacji wspomaganych prób dotyczą przebudowanych przypadków Claude, nie innych tracków.

Cel UX: małe zobowiązanie, konkretny przypadek, zmieniony fakt, własna decyzja, porównanie, pełny koniec i dobrowolny ciąg dalszy. Bez streaków, presji, nieskończonego feedu, LLM-sędziego, runtime generatora, IDE, drugiego storage, nowej bazy telemetrycznej lub diagnozowania motywacji. Nieznany typ/pin/capability to jawny błąd, nie fallback do ABCD.

## Wynik

Przebuduj całą ścieżkę Claude wokół sensownych decyzji, nie tworząc nowego banku obok niej. Najpierw 3–5 używalnych przypadków i odbiór pionu, potem następne obszary Claude. Nie przerabiaj reszty katalogu do osobistej zgody właściciela.

## Źródła i inwentarz

Kanoniczna ścieżka: `content/claude-certified-architect-professional-certification/<nodeId>/<mentalUnitId>.json`. Odczyt z 13.10.2026 wskazywał foldery: solution_design_and_architecture; model_prompt_and_context_decisions; enterprise_tools_retrieval_and_integration; evaluation_diagnosis_and_optimization; governance_safety_and_risk_controls; stakeholder_decisions_and_delivery_lifecycle; team_workflows_and_operational_enablement. Sprawdź aktualny katalog i ledger, nie traktuj listy jako blueprintu ani gwarancji kompletności.

Odczytana jednostka `governance_safety_and_risk_controls/CCARP-D05-O06.json` zawierała application authorization vs trained refusals i business rules; to kandydat do pierwszego kontrastu. Nie zakładaj, że właściciel nie zna tego materiału lub że to jego słaby punkt. Nie powielaj dawnych 300/845 bez aktualnego policzenia. Wykorzystaj już odebrane poprawki kluczy i sourceRefs.

## Praca na każdym obszarze

1. Powiąż wszystkie obecne objectives/mentalUnits z aktualnym oficjalnym źródłem Professional i istniejącymi ledgerami. Nie kopiuj realnych poufnych pytań. Gdy dostęp wymaga konta, wykorzystaj wyłącznie uprawnione materiały; brak weryfikacji oznacz, nie zastępuj SEO bankiem.
2. Dla każdego obecnego pytania zdecyduj zachować / naprawić / powiązać / zastąpić nowym zadaniem. Nie każda faktografia potrzebuje historii. „Cała ścieżka przebudowana” wymaga pokrycia wszystkich obecnych jednostek, nie mechanicznej zamiany wszystkich QID na sekwencje.
3. Dla rozróżnienia zaprojektuj granicę decyzji, wspólne założenia i zwykle 2–4 decyzje. Zmieniaj kontrolowany warunek, nie pięć niezależnych faktów naraz. Przy wariancie wywiedzionym z A pokaż A jako punkt odniesienia; nie udawaj zmiany tylko jednego faktu względem B.
4. Pokaż zmiany, które wpływają na odpowiedź, i takie, które jej nie zmieniają. Nie ucz heurystyki „nowy ekran → inna litera”. Dopuszczaj równoważne rozwiązania zgodnie z kryterium zadania.
5. Dystraktory mają odpowiadać prawdopodobnym pomyłkom, nie być oczywiście absurdalne. Nie ujawniaj klucza długością jedynej merytorycznej odpowiedzi, powtarzalnym stylem, tytułem lub tekstem constraints. Wyjaśnij konkretny błąd i regułę, nie używaj tego samego ogólnika dla każdej opcji.
6. Przygotuj zwięzły feedback i rozszerzane szczegóły, nie rozbudowuj obowiązkowego czytania bez celu. Każdy kasus da się domknąć bez oglądania wszystkich opcjonalnych wariantów. Początkowy szacunek czasu obejmuje wymagane czytanie; oznacz go jako niekalibrowany.
7. Oddziel przykłady nauki od późniejszych niezależnych zadań. Zmiana imienia/liczby nie wystarcza na nowy kontekst. Nie ujawniaj właścicielowi kluczy planowanych held-out zadań w raporcie; materiały, które widział przy authoringu/QA, oznacz jako exposed/unknown dla właściwego pomiaru. Nie zapisuj tajnych danych użytkownika do raportów.
8. Każdy nowy przypadek ma właściwy mentalUnitId, źródła, pin, legalny node/tier i komplet kroków. Nie mieszaj Free/Premium wewnątrz jednej sekwencji. Nie przenoś innych banków do Claude jako wypełniaczy puli.
9. Zachowaj potrzebne niezależne pytania i możliwości istniejących standardowych sesji/symulacji. Jeżeli nowy format nie jest dopuszczony w egzaminie, nie włączaj go globalnie. Zbyt mała pula jest jawnym problemem do naprawy, nie zgodą na powtórki lub usunięcie trybu.
10. Małą spójną partię buduj, sprawdź w pełnym przepływie, odbierz z właścicielem i iteruj dalej tylko w Claude. Nie czekaj na przebudowę całego banku, aby dać pierwsze rzeczywiste ćwiczenia. Nie nazywaj pierwszych pięciu przypadków pełną ścieżką.

## Migracja i kontrola jakości

Zachowaj QID tam, gdzie semantyczna tożsamość jest zachowana; nowemu zadaniu daj nowy ID i relację. Publikacja artefaktu/pina spójna; aktywne sesje nie zmieniają treści. Zachowaj historyczne wyniki bez regradingu. Nie utrzymuj drugiego authoringu, równoległego banku demo ani runtime generatora.

Waliduj każdy zmieniony item i scenariusz, a nie tylko losową próbkę. Sprawdź wszystkie kroki, kombinacje i źródła; test JSON nie jest recenzją merytoryczną. Reuse istniejących dowodów jest pożądany. Osiem innych banków: źródła i semantyczne payloady byte/hash-identical względem baseline; niezmienione QID, uprawnienia i scoring. Wspólne bramki uruchom po zmianie wspólnego kodu, lecz nie zmieniaj ich treści.

## Raport

Podaj rzeczywiste pokrycie jednostek Claude, zachowane/zmienione rekordy, dostępne cases, source gaps, wyniki testów, zakres owner feedback i następny mały obszar Claude. Domyślny status rozszerzenia: NIEZATWIERDZONE. Nie generuj gotowych kolejnych zadań migracji GCP/Coding „na zapas” w aktywnej kolejce.

## Odbiór i przekazanie

Uruchom rzeczywiste testy zmienionych granic i obowiązujące bramki. Raportuj polecenia, SHA, zakres i PASS/FAIL/SKIP/BLOCKED bez zamiany braku dowodu na sukces. Natywne testy w aktualnym zakresie iOS, z ochroną danych i autoryzowanego urządzenia. Nie reaktywuj wyłączonej bramki VoiceOver ani nie rozszerzaj automatycznie na Android. Semantyka dostępności pozostaje wymagana. Build/install/signing/deploy/publish i zewnętrzne konta wymagają właściwej, aktualnej zgody; zgoda na plan nie jest zgodą na te skutki.

W jedynej kolejce zapisz wersję QLE v2, co wykonano i najmniejszy następny zakres CLAUDE. Rozdziel techniczne działanie, merytoryczną jakość, osobiste użycie i faktyczną zgodę właściciela. Nie uruchamiaj migracji innych banków. Zachowaj uczciwy status pierwszego iOS i brak publicznego GO, dopóki nie ma odrębnego dowodu i decyzji.

---

<!-- PLIK: 06-QLE-06-QA-I-AKCEPTACJA-WLASCICIELA.md -->

# QLE-06 v2 — QA, pierwszy klient i wyraźna zgoda na rozszerzenie

## Dyrektywa wspólna — QLE v2, Claude-only

Pracujesz nad Patternly w istniejącym workspace: APP `lukaszkurczab/gcp-ace-trainer`, CONTENT `lukaszkurczab/patternly-content`, BACKEND `lukaszkurczab/patternly-backend`, WEB `lukaszkurczab/patternly-web`. Ten prompt zastępuje wcześniejszą wersję tego samego QLE. Właściciel uczy się do Claude Certified Architect — Professional i jest pierwszym użytkownikiem. Przebudowuj WYŁĄCZNIE track `claude-certified-architect-professional-certification`. Pełny zakres Claude dostarczamy małymi pionami; pozostałe osiem banków i ich zachowanie są zamrożone do wyraźnej późniejszej zgody właściciela. Brak takiej zgody to stan domyślny. CI, liczba sesji, ocena Codex i brak uwag nie są zgodą.

Nie wykonuj dawnej fali Coding/GCP, przykładowego pionu Design, nowych codingowych typów odpowiedzi, kampanii, web demo ani rekrutacji zewnętrznych uczestników. Pierwszy prywatny pion Claude ma priorytet bez czekania na migrację katalogu lub publiczną premierę; nie omijaj bezpieczeństwa/trwałości, realnych zależności builda i zewnętrznych autoryzacji. Sam ten plik przygotowuje zlecenie, a nie zmienia usług. Wykonuj zakres po przekazaniu go przez właściciela.

Odczytaj aktualne AGENTS, `.agent/WORKING_STATE.md`, `docs/PATTERNLY-WORKING-PLAN.md` i normatywne kontrakty wskazane w głównym workspace. Sprawdź HEAD, worktree i już wykonane QLE/BIZQ/FCA-EDIT. Zachowaj kompatybilną implementację i dowody, usuń tylko rzeczywiście zastąpione ścieżki. Jedna kolejka i jeden uprawniony writer. Nie twórz drugiego klonu/worktree, nowego Gościa, resetu, stash ani nie nadpisuj cudzych zmian i profili. Nie powtarzaj zakończonych audytów bez zmiany źródeł. Nie wyceniaj pracy ani recenzji.

Zachowaj `mentalUnitId`, jeden lifecycle i scorer danego typu, jeden authoring, wersjonowane artefakty i content piny, lokalną własność aktywnej sesji, sync historii, atomowe goal+plan, Partial=0 i stare ukończenia. Obecne 10/20/40 pozostają. NOWA propozycja kontraktu dla Claude: jeden pełny przypadek 2–4 ocenianych decyzji jako rzeczywisty preset tego samego mechanizmu. Nie udawaj ukończonej sesji 10 po trzech krokach. Nie zmieniaj stałych diagnoz/egzaminów ani uprawnień. Zarejestruj jawnie zmianę polityki/capability w kanonicznym kontrakcie; nie przedstawiaj jej jako już działającej. Bez zmiany review 7→14→28 i error24h→repair7 oraz bez przeliczenia historii. Nowe zasady kwalifikacji wspomaganych prób dotyczą przebudowanych przypadków Claude, nie innych tracków.

Cel UX: małe zobowiązanie, konkretny przypadek, zmieniony fakt, własna decyzja, porównanie, pełny koniec i dobrowolny ciąg dalszy. Bez streaków, presji, nieskończonego feedu, LLM-sędziego, runtime generatora, IDE, drugiego storage, nowej bazy telemetrycznej lub diagnozowania motywacji. Nieznany typ/pin/capability to jawny błąd, nie fallback do ABCD.

## Wynik

Odbierz pierwszy realny pion, wspieraj osobiste używanie przez właściciela i rejestruj jego faktyczne uwagi. Oddziel działanie techniczne, jakość merytoryczną, łatwość rozpoczęcia, samodzielne zastosowanie oraz zgodę na migrację innych banków. Brak rekrutacji dużego badania jako warunku pilnej nauki.

## Techniczny QA od pierwszego pionu

1. Prawdziwe Claude source→builder→artifact/pin→admission→single-case request→UI→answer→scorer→durable attempt→summary→history→review→planner. Nie poprzestawaj na mocked UI i jednostkowym handlerze.
2. Sprawdź wybór zmieniony i niezmieniony, jedno compound uzasadnienie, pomoc, porównanie, eksplorację i późniejszy niezależny przykład. Rodzaje nieużyte w pierwszym Claude nie są blokadą — nie uruchamiaj obowiązkowego codingowego code-selection/array-input z v1.
3. Start Claude po wybraniu tracka; bez konfiguracji przy każdym wejściu; legalne resume; aktywna inna ścieżka bez utraty sesji; brak notes/notification-permission gate. Warm i cold start zmierz na właściwym buildzie. Nie wnioskuj o czasie reakcji urządzenia z Node benchmarku.
4. Prawdziwa finalizacja małego przypadku, jawne przerwanie, ponowny start po zgodzie użytkownika. Brak autostartu, zadania „w tle”, loss of streak, czerwonego długu i fake daily completion.
5. Restart/kill w dozwolonym środowisku: przed/po submit i reveal, porównaniu, finalizacji, next case; double tap, retry/sync replay, content update, expired Premium, account switch i offline. Nie zwiększają evidence, nie gubią ekspozycji ani tożsamości.
6. Zachowaj historyczne wyniki, ukończenia i progi; new assisted nie awansuje due. Brak regradingu dawnych prób. Mikro-sesja nie jest równa pełnej dziesiątce. Samodzielny retrieval po nauce nie jest dożywotnio blokowany.
7. Regresja pozostałych ośmiu banków: treść/QID/piny payloadów, legalne tryby/tier, scoring/projections. Zmiany shared code nie dopuszczają im nowych przypadków i polityk. Gdy wrapper manifestu się zmienił, pokaż niezmienność ich rzeczywistego payloadu.
8. iOS: mały ekran, duży tekst, oba motywy, scroll/focus, brak answer leak w labels i możliwość obsługi bez wymagania złożonego gestu. Jawnie rozdziel źródłowy, native i physical odbiór; nie dodawaj niedozwolonej bramki VoiceOver/Android.

## Obserwacja osobistego użycia

Zaproponuj właścicielowi zwykłe używanie zamiast obowiązkowej rekrutacji. Okno np. 7–10 dni jest pomocnicze; to on określa, kiedy wystarczająco ocenił działanie. Nie ustawiaj zadania harmonogramu ani powiadomień bez jego prośby. Krótki format ma pozwalać zacząć, nie stanowić dowodu, że tyle wystarczy na egzamin.

W istniejącej analityce i danych, z odpowiednimi zgodami, raportuj: app open vs first response, tap→ready, zakończenie pełnego przypadku, legalne pauzy/resume, dobrowolną kontynuację, użycie pomocy i samodzielne wyniki. Każda metryka z mianownikiem i liczbą obserwacji. Nie licz kroków jednego użytkownika jako niezależnych uczestników. Brak app open nie dowodzi problemu z motywacją i wymaga wyjaśnienia użytkownika, nie modelu nastroju.

Opinie zbieraj po kilku sesjach, opcjonalnie: co zatrzymało przed startem; czy różnica była zrozumiała; czy tekst był za długi; czy można było swobodnie skończyć. Brak codziennej obowiązkowej ankiety, skali dopaminy lub rozbudowanego dziennika. Nie przesyłaj notatek klinicznych lub swobodnego tekstu w telemetrycznych eventach.

Po czasie sprawdź inne autorskie zadania bez bieżącej pomocy, zgodnie z realnym review schedule; nie przyspieszaj zegara na koncie właściciela. Oznacz przypadki już widziane podczas authoringu/QA; nie są unseen. Samopoczucie po sesji, jakość nauki i zakres przygotowania są różne. Nie publikuj tezy o zdanym egzaminie/wzroście przychodów/populacyjnej skuteczności na podstawie N=1.

## Proponowana karta odbioru właściciela

Przechowaj w istniejącym raporcie/planie, nie w nowej bazie:
- wersja aplikacji/contentu i zakres Claude;
- czy start był prosty, a zakończenie bez presji;
- czy właściciel potrafił wyjaśnić warunek rozstrzygający;
- które zadania były znane / samodzielne / po wsparciu;
- otwarte błędy i uwagi;
- decyzja: not_requested / changes_requested / accepted, rzeczywista data i treść;
- dokładny zakres akceptacji: pion Claude / kontynuacja Claude / pozwolenie na wskazany następny bank.

Początkowo rozszerzenie poza Claude jest not_requested. Akceptacja pierwszych kilku przypadków nie jest zgodą na inne banki. Nawet zakończenie całej ścieżki i zielony QA nie zastępują opinii właściciela. Zachowaj jego prawo do decyzji bez sztucznej minimalnej liczby dni; nie sfabrykuj daty lub akceptacji.

## Warunki dalszej iteracji

Gdy łatwiej wystartować, ale zadania uczą mniej, popraw trudność/treść zamiast ogłaszać sukces aktywacji. Gdy jasność rośnie, ale nowe zadania nadal zawodzą, popraw transfer. Gdy ciężko wystartować mimo dobrych pytań, sprawdź liczbę wyborów, czas oczekiwania i długość pierwszego kontekstu. Problemów ogólnego samopoczucia nie rozwiązuj eskalacją streaków lub przypomnień.

Wynik: działający, jasno opisany pion Claude, potem odbiory jego kolejnych partii i PRAWDZIWA właścicielska decyzja. Web demo, kampanie i szerszy test rynkowy pozostają odłożone; nie są kryteriami tego pakietu.

## Odbiór i przekazanie

Uruchom rzeczywiste testy zmienionych granic i obowiązujące bramki. Raportuj polecenia, SHA, zakres i PASS/FAIL/SKIP/BLOCKED bez zamiany braku dowodu na sukces. Natywne testy w aktualnym zakresie iOS, z ochroną danych i autoryzowanego urządzenia. Nie reaktywuj wyłączonej bramki VoiceOver ani nie rozszerzaj automatycznie na Android. Semantyka dostępności pozostaje wymagana. Build/install/signing/deploy/publish i zewnętrzne konta wymagają właściwej, aktualnej zgody; zgoda na plan nie jest zgodą na te skutki.

W jedynej kolejce zapisz wersję QLE v2, co wykonano i najmniejszy następny zakres CLAUDE. Rozdziel techniczne działanie, merytoryczną jakość, osobiste użycie i faktyczną zgodę właściciela. Nie uruchamiaj migracji innych banków. Zachowaj uczciwy status pierwszego iOS i brak publicznego GO, dopóki nie ma odrębnego dowodu i decyzji.
