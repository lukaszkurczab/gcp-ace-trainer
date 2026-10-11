# Zgodność pytań Claude Professional z oficjalnym kursem

Stan na 11 października 2026. Baza szeroko pokrywa tematykę kursu, ale nie można potwierdzić pełnego pokrycia. Potwierdzono dwie luki programowe, niezgodność odsyłaczy z oczekiwaniem przejścia do lekcji oraz błąd dotyczący pliku konfiguracji MCP. Zaliczenie pakietu nie stanowi dowodu przećwiczenia wszystkich jednostek nauki.

## Zakres i kryteria

Porównanie dotyczy pięciu modułów z `claude-study-export/materialy-v2`, kanonicznych pytań w `patternly-content/content/claude-certified-architect-professional-certification` oraz pakietu i konsumentów w `patternly`. Starszy katalog `materialy` jest niepełnym eksportem. Osobne checkouty `fesd-*` nie stanowią podstawy tego audytu.

Kryteria: pytania sprawdzają umiejętności opisane w materiale; klucz i objaśnienia nie przeczą źródłom; Details prowadzi do właściwego materiału; wszystkie egzaminacyjne cele kursu mają rzeczywiste ćwiczenia. Walidacja strukturalna i testy oceniania są metodami weryfikacji, a nie dowodem kompletności programu. Audyt nie zmienia banku, nie publikuje treści i nie nadaje akceptacji całym 845 pytaniom.

Eksport ma 107/107 zapisanych ekranów (34 + 21 + 22 + 20 + 10), ale `report.json` podaje `completeness: unverified`. Stany interaktywne zachowano w źródle bez ich wykonania; zasoby zewnętrzne pozostają niezweryfikowane. Wnioski odnoszą się do dostępnego materiału, nie do niewidocznych stanów ćwiczeń.

## Zweryfikowany stan

- 845 pytań, siedem rozdziałów, 38 jednostek nauki; każda jednostka ma 13–33 pytania.
- Wszystkie 845 rekordów źródłowych jest semantycznie identycznych z rekordami w pakiecie aplikacji. Wersja: `ccarp-2026.10.11-capacity-v1-bizq02-v2-bizq03-planning-v2`.
- Każdy identyfikator `sourceRefs` istnieje w rejestrze. Każdy URL w Details występuje w źródłach przypisanych do tego pytania.
- 50 różnych URL w Details; zero odsyłaczy do `anthropic-partners.skilljar.com`. Zgodność URL z rejestrem nie dowodzi adekwatności merytorycznej strony.

| Moduł kursu | Odpowiednie części banku | Ocena zakresu |
| --- | --- | --- |
| 1 Claude Platform and Solution Design | D01 architektura, D02 modele/prompt/kontekst, D03 retrieval i integracja | Szerokie pokrycie; brak wyboru platformy/trasy wdrożenia. Cowork wymaga uzupełnienia lub rozstrzygnięcia zakresu. |
| 2 Enterprise Integration and Production | D03 integracja, D04 ewaluacja i optymalizacja; części D01/D05 | Pokryte główne mechanizmy: evals, niezawodność, koszty, auth, obserwowalność. Nie jest to pełny odbiór semantyczny każdego pytania. |
| 3 Responsible AI Safety and Risk | D05 governance, bezpieczeństwo, ryzyko | Pokryte główne mechanizmy: kontrola dostępu, guardrails, HITL, fairness, compliance. |
| 4 Stakeholder Engagement Lifecycle and Go to Market | D06 discovery, tradeoffs, feedback, dokumentacja, lifecycle | Brak decyzji o wielu platformach i dokumentu wyniku biznesowego. Treści oznaczone jako partner-only nie są luką egzaminacyjną. |
| 5 Team Enablement and Operational Productivity | D07 konfiguracja, workflow, debugging | Główne cele obecne; potwierdzona sprzeczność konfiguracji MCP w pytaniach. |

Liczba pytań: D01 138, D02 115, D03 160, D04 125, D05 122, D06 113, D07 72. Liczby nie są miarą kompletności ani procentem gotowości do egzaminu.

## Ustalenia i wpływ

### P1 Brak ćwiczeń wyboru platformy i trasy wdrożenia

**VERIFIED / MISSING, wysoka pewność.** Module 1 sekcje 28–30 rozróżniają wejście użytkownika, interfejs budowania i trasę dostarczenia. Module 4 cel 5 oraz sekcje 14–17 wymagają porównania bezpośredniego API, Bedrock, Vertex i innych platform według zgodności, rezydencji danych, opóźnień i kosztów, także w systemie korzystającym z kilku tras.

W banku nie ma równoważnego zadania. D03-O07 porównuje API i MCP, czyli interfejsy integracji. D05-O04 sprawdza m.in. BAA/ZDR i zakres ochrony danych. D06-O02 omawia decyzje architektoniczne, lecz nie wybór trasy wdrożenia. Są to umiejętności sąsiednie, nie zamienniki wymaganej decyzji.

**Wpływ:** użytkownik może ukończyć bank bez umiejętności uzasadnienia wyboru platformy wymaganej przez kurs. **Następny krok:** dodać spójny zestaw scenariuszy w istniejących nodach: najpierw eliminacja tras niespełniających governance, następnie porównanie kosztu/latencji i przypisanie odpowiedzialności przy wielu trasach. Nie zmieniać zamrożonych granic nodów.

### P1 Brak dokumentu wyniku biznesowego

**VERIFIED / MISSING, wysoka pewność.** Module 4 cel 5, sekcje 14–17 wymagają dokumentowania wyniku wdrożenia: zakresu, biznesowego pomiaru przed i po, kontroli zapewniającej wiarygodność dowodu oraz właściciela pomiaru. Pytania o baselines/pilot w D01-O01, ewaluacje D04 i dokumentację architektury D06-O04 nie sprawdzają przygotowania tego dokumentu.

**Wpływ:** bank uczy oceny jakości i działania systemu, ale pomija końcowe wykazanie wartości wdrożenia odbiorcy biznesowemu. **Następny krok:** scenariusze wyboru właściwych pól dokumentu, odróżnienia metryki operacyjnej od efektu biznesowego oraz krytyki niepodpartego before/after. Element reuse potential / partner IP oraz go-to-market wyraźnie oznaczony jako nietestowany nie powinien być obowiązkowym kryterium egzaminacyjnym.

### P1 Zaliczenie pakietu nie wymaga pokrycia każdej jednostki

**VERIFIED / RISK, wysoka pewność.** `src/domain/learning/packageCompletionRule.ts:120` grupuje próby według noda i sprawdza ich liczbę oraz jakość ostatnich 20 prób. Nie wymaga różnych pytań ani odwiedzenia wszystkich mental units. Aktualny pakiet wymaga łącznie 200 prób: 40/40/20/20/40/20/20 według swoich rozdziałów, z jakością co najmniej 80% ostatnich 20 w każdym.

Istniejący test `completion stays unknown without a rule and otherwise requires every chapter independently` zalicza chapter-b o deklarowanych dwóch jednostkach poprzez wielokrotne odpowiedzi na jedno pytanie. Jest to dowód właściwości samej reguły, nie dowód, że standardowy scheduler zawsze dobierze taki przebieg.

**Wpływ:** komunikatu o ukończeniu nie można interpretować jako pokrycia pełnego materiału. **Następny krok:** ustalić osobny warunek pokrycia jednostek i cele nauki; zachować rozróżnienie pokrycia programu od jakości odpowiedzi i od gwarancji zdania egzaminu. Zmiana reguły postępu wymaga osobnego projektu uwzględniającego istniejące dane użytkowników.

### P2 Details nie prowadzi do lekcji kursu

**VERIFIED / PARTIAL, wysoka pewność.** Wszystkie 845 Details kierują do dokumentacji lub artykułów, nie do lekcji oficjalnego planu. Dotyczy to również prawidłowych, tematycznie użytecznych odsyłaczy. Rejestr identyfikuje 51 źródeł, w tym exam guide; zgodność referencji jest technicznie zachowana.

**Wpływ:** użytkownik szukający lekcji do uzupełnienia wiedzy nie trafia do wskazanego modułu. **Następny krok:** przypisać pytanie/jednostkę do konkretnego modułu i sekcji z eksportu oraz stabilnego URL Skilljar; dokumentację mechanizmu zachować jako odrębne źródło. Nie wymyślać fragmentów URL do ekranów SCORM — eksport potwierdza URL modułu, nie stabilne deep linki do każdego ekranu.

### P2 Błędny plik konfiguracji serwera MCP

**VERIFIED / PARTIAL, wysoka pewność dla expansion-27.** `CCARP-D07-O01-expansion-27` mówi, że `.claude/settings.json` definiuje serwer projektowy MCP; `expansion-20` również przypisuje temu plikowi dodanie serwera. Tymczasem [dokumentacja MCP](https://code.claude.com/docs/en/mcp#project-scope) wskazuje `.mcp.json` dla definicji projektowych. Zatwierdzanie serwerów w settings to osobny mechanizm. Pytanie `CCARP-D07-O01-boundary` w tym samym pliku poprawnie wskazuje `.mcp.json`, więc bank zawiera wewnętrzną sprzeczność.

**Wpływ:** uczeń może zapamiętać nieprawidłową konfigurację mimo poprawnego ogólnego rozumowania o zaufaniu. **Następny krok:** naprawić założenia scenariusza i precyzyjnie rozdzielić definicję, workspace trust, approval i uwierzytelnienie. Sprawdzić pozostałe pytania tej jednostki i dopasować źródło Details; sama zmiana linku nie naprawi treści.

### P2 Cowork jako potencjalna luka kursowa

**INFERRED / PARTIAL.** Module 1 opisuje Cowork jako wejście użytkownika z dostępem do plików/aplikacji oraz konsekwencjami uprawnień. Nie ma równoważnego pytania. Formalna lista celów modułu nie wymienia jednak Cowork wprost, dlatego brak nie jest tu przedstawiany jako dowiedziona luka blueprintu egzaminu. Cztery właściwości modelu są natomiast ćwiczone w różnych jednostkach — ich rozproszenie nie oznacza braku pokrycia.

## Weryfikacja i granice

Wykonano:

- CONTENT `npm run content:validate -- --track claude-certified-architect-professional-certification`: 845 pytań PASS.
- CONTENT `npm run content:test -- --track claude-certified-architect-professional-certification`: 845 kanonicznych odpowiedzi PASS. To test oceniania, nie 845 niezależnych ocen merytorycznych klucza.
- CONTENT `node --test tests/claude-content-audit-20261007.test.mjs`: 12/12 PASS.
- APP `node --import tsx --test src/domain/learning/packageCompletionRule.test.ts src/features/practice/questionSourceSurface.test.ts`: 8/8 PASS.
- Porównanie rekordów source–bundle, wszystkich sourceRefs oraz przypisania Details URL: PASS.
- Odczyt online stron MCP i settings oraz czterech stron compliance: dostępne. Nie wykonano pełnego testu dostępności wszystkich 50 URL ani logowania/klikania lekcji Skilljar.

Nie wykonano pełnej niezależnej oceny każdego klucza, distractora i wszystkich objaśnień w 845 pytaniach. Nie podaje się procentu zgodności ani gotowości egzaminacyjnej. Nie uruchamiano aplikacji na urządzeniu; sprawdzono kod przepływu i wskazane testy. Lokalny pakiet nie dowodzi wersji zainstalowanej u użytkownika ani opublikowanej w sklepie.

Podział audytu: główny agent — inventory, zgodność source–bundle, progresja i testy; niezależny gpt-6-luna high — porównanie celów i treści kursu; drugi gpt-6-luna high — odsyłacze i przepływ Details. Nie wykonywano płatnego pipeline'u model-evaluation ani nie zmieniano istniejących akceptacji contentu. Skill EPIC-09 wskazuje nieistniejący dawny plan SIMP; bieżący README i EPIC-09 potwierdzają zakończoną migrację. Audyt czyta aktualny schemat bez odbudowy historycznych adapterów.

## Powtarzalność wejścia

SHA-256 pliku pakietu aplikacji: `eccfbe348fdb6767e54cf8f1b3ba7c05464d0abfce205dc0b430c876106727b4`.

| Module material.md | SHA-256 |
| --- | --- |
| 34cc01a57a7d | e567c92e298f64eb80954d4b49d95712804b4a59ed10adf94bdf22225b4725d1 |
| db6a58cae3d9 | d18b3aa321053615bb1062a2fd6644494c9f57f12efb28988e3bb6248dfcf6dd |
| ece42b22e9bc | fcf2ed72248043739fba3c9670e38c503762be354c246861416ae6591e2c7f43 |
| a8dc9dab7448 | 3fb702c4aba5a12c08ae09a0561b1b61fa0d6cd69caddc160a68e8e5580b4775 |
| ae31767048f4 | d5431a56bb5c5aea7c221df5d8c2722866b08a016bc433554b9268415fbbf4ea |

Materiały znajdują się w `/Users/lukaszkurczab/Desktop/Projects/claude-study-export/materialy-v2/modules/<id>/material.md`. Kanoniczne pliki pytań to `patternly-content/content/claude-certified-architect-professional-certification/<nodeId>/<mentalUnitId>.json`. Rejestr źródeł: `patternly-content/config/certification-source-registries/claude-certified-architect-professional-certification.json`.

## Kolejność dalszej pracy

Najpierw przypisać egzaminacyjne cele i sekcje pięciu modułów do istniejących jednostek, z jawnymi brakami. Następnie naprawić konfigurację MCP i uzupełnić dwa potwierdzone zakresy scenariuszami uczącymi decyzji, a nie metadanymi. Potem dodać właściwe odsyłacze do modułów obok dokumentacji mechanizmów. Osobno zaprojektować i zweryfikować regułę pełnego pokrycia programu. Pełny odbiór merytoryczny banku wymaga oceny każdego pytania względem przypisanego fragmentu źródła; istniejące testy techniczne tego nie zastępują.
