# BIZQ-05 — wiarygodna diagnoza i sprawdzanie transferu

**Priorytet:** P1  
**Główne repo:** content + aplikacja; backend tylko dla już zatwierdzonych kontraktów danych  
**Zależności odbioru:** BIZQ-01, BIZQ-02, BIZQ-04  
**Konsument:** BIZQ-03 dobiera dalszą pracę z tych dowodów  
**Wspólna podstawa:** [00 — plan BIZQ](00-PATTERNLY-BIZQ-PLAN-ROBOCZY.md).

## 1. Potwierdzony punkt rozpoczęcia

Porównanie 07.10:  `productModeConfig.ts` definiuje GCP KnowledgeCheck40 jako exact ordered questions z Free N01 (B02=18/B03=20/B04=2). Wynik jest ograniczoną próbką; nie wykazano istniejącego false whole-track claim. Zachować bieżący mode, feedback i eligibility, nie zmieniać go w Exam ani nie przywracać wycofanej taxonomy.

Pierwszy spójny pakiet: istniejący verified GCP result→pinned sample breakdown→rzeczywista rekomendowana sesja przez obecne certification projections, family/lifecycle i shared evidence. ARCH-05/06 określa boundary exact descriptors i summary; BIZQ-02/04 dostarcza kwalifikację dowodów i review. Następnie9 tracków mapping/pool readiness, blueprint/scope/transfer i D01–D20. Używać źródeł official dla faktycznie zmienianego mappingu, bez nowego scoring engine, LLM egzaminatora albo claimu zdania.

Nie wystarczy zmiana etykiety. Nowe przykłady i protokół pomiaru muszą dostarczyć realnego wyniku; dotychczasowe lokalne tests nie dowodzą efficacy.

### 1.1. Przyjęty pierwszy pakiet wykonawczy — 08.10.2026

Rekonstrukcja aktualnych źródeł: GCP40 obejmuje 18 pytań B02,20 B03 i2 B04 z FreeN01. Pula N01 ma136 pytań w7 jednostkach, każda co najmniej18. To ograniczona próba z immediate feedback, nie pełny track ani czysty pretest. B02/B03 są w niej wyczerpane; późniejsza praktyka tych jednostek jest znanym materiałem, nie świeżym transferem. Nie zmieniać istniejącego trybu, feedbacku, punktów, uprawnień ani admission.

Istniejący family/application owner publikuje readonly podział wyłącznie zweryfikowanej ukończonej diagnozy: session/result/ordered itemOrder/attempts muszą pasować do tego samego tracka, wersji i SHA. Ponownie wykorzystać istniejącą CertificationPracticeReviewProjection i exact resolver; bez drugiego store lub scoring engine. Każda główna jednostka wnosi jeden wkład na occurrence; liczniki correct/partial/incorrect/unanswered i mianowniki są jawne. Metadane node/mentalUnit pochodzą z dokładnego materiału, nie z parsowania ID. Scope obejmuje rzeczywiście próbkowane jednostki, a niepróbkowane mają insufficient evidence, bez diagnozy słabości. First-vs-repeat oznacza pierwszą zarejestrowaną ekspozycję w dostępnej exact-pinned historii; przy niewiarygodnej/niedostępnej historii jawne unknown, bez twierdzenia o braku wcześniejszej ekspozycji człowieka. Brak/duplikat/obcy item lub result daje unavailable, nie syntetyczne zera.

Potwierdzona granica completed baseline: produkcyjna finalizacja per-item wymaga ostatniej pozycji i dokładnie jednej zweryfikowanej próby dla każdej occurrence; completed result ma unansweredOccurrenceIds=[] . Zero unanswered w tym raporcie jest rzeczywistym wynikiem kontraktu, nie imputacją. Abandon pozostaje osobnym statusem i nie otrzymuje raportu ukończonej diagnozy. Exact członkostwo wszystkich pytań próbki w przypiętej puli Focus musi być sprawdzone, nie tylko zgodność nazwy jednostki. W pakiecie nie ma autorskich human labels jednostek: prezentować neutralny numer ze stabilnej kolejności jednostek w exact Focus pool oraz lokalizowany canonical node label; zachować ID wyłącznie w kontrakcie runtime, bez semantycznej etykiety wymyślonej z pojedynczego objaśnienia.

Rekomendacja wybiera deterministycznie jednostkę z zaobserwowanymi incorrect/partial, pokazując faktyczny powód i liczby. Tie-break jest stabilny, bez losowości i synthetic readiness. Przy wszystkich correct wybór jest neutralną praktyką szerszego/niepróbkowanego zakresu, bez mastery/weakness/transfer claim. CTA przygotowuje rzeczywisty istniejący Focus na tym zakresie; tytuł nie może zastępować wyboru pytań. Jeśli nie ma wymaganej puli, rekomendacja jawnie unavailable; nie przenosić kwoty do sąsiedniej jednostki.

Najmniejsze rozszerzenie: opcjonalny mentalUnitId w istniejącym Certification Focus request. CanonicalTrainingRuntime waliduje go jako podzbiór dokładnej, już uprawnionej puli Focus wybranego node/artifact, filtruje przed istniejącym selectPracticeQuestions i zapisuje target w istniejącym immutable configurationSnapshot/planFingerprint. Nie zmieniać statycznej allowlisty ProductModeConfig ani dublować contentPackageRuntimeOwner, który rozwiązuje bundled/installed node i jego prawa. Inne tryby odrzucają taki dynamiczny scope. Zachować aktualną politykę lengths/minimum/short-pool; wymagane minimum niespełnione daje unavailable, bez fillera lub nowej polityki skracania. Facade/route/setup przenoszą scope i expected pin, nie stają się drugim selektorem. Resume odtwarza zapisany scope, sprawdza jego legalność i wszystkie zaplanowane item refs w tym scope; nie losuje ponownie. Stare nieskopowane sesje zachowują dotychczasowy kontrakt. Existing active session pozostaje exact resume/conflict; żadnego cichego zastąpienia. Profile fence i zmiana pakietu odrzucają stare odczyty/CTA.

Wynik w istniejącym ResultScreen pokazuje podział, ograniczenie próbki/feedbacku/ekspozycji oraz rzeczywistą akcję. Błędy projekcji/odczytu są jawne, zweryfikowany ogólny wynik może pozostać czytelny; nie przedstawiać niedostępnej analizy jako sukcesu. Nowe copy w7locale, semantyka dostępności, pełne teksty/przewijanie/duży tekst/motywy zgodnie z aktualnym UI gate. Bez VoiceOver. Pierwszy pakiet nie zamyka mapping9tracków, transferu, pilota ani całego D01–D20.

Weryfikacja: actual verified diagnostic→projection→different gap targets→actual prepared orders; missing/duplicate/foreign evidence; partial0 i mianowniki; no-sample vs wrong; allcorrect neutral; known/repeat limitation; target poza node/trybem/pinem, short pool, active conflict i profile fence; immutable resume/fingerprint, option order i cold/readback zgodnie ze zmienionym zakresem. Wymagany iOS flow: rzeczywista40-item diagnoza→summary prawdziwego zakresu→recommended Focus z dokładnym targetem. Bez resetu/usuwania profili, nowych kont, globalnego zegara i fałszywego materialu/odpowiedzi.

Niezależny projekt Luna high **PASS WITH REFINEMENTS** przed kodem; powyższe doprecyzowania zapisane. Oceny kontrolera/przeglądu: cel/architektura0,95; prostota0,84; kontrola ryzyka0,86; utrzymywalność0,87; minimum0,84. To odbiór propozycji, nie kodu ani runtime. Jeden sourcewriter Luna high, bez dzieci; root dokumentacja/integracja/native/Git, niezależne QA Luna high. Kontrakt workspace docs15/17 jest aktualizowany przed kodem.

### 1.2. Odbiór pierwszego pakietu — 08.10.2026, PASS WITH ISSUES

Kod i rzeczywista ścieżka: niezależne source QA48/48 PASS; pełna zamrożona bramka qa:static exit0,2081tests/2077PASS/0FAIL/4SKIP, recovery/typecheck/content/privacy PASS. Cztery HTTP/Admin SKIP nie są odbiorem działania emulatora. Pierwszy run wykrył przestarzały wzorzec catch w teście i brak Setup literals: poprawiono bez osłabiania behavior guards, uzupełniono wszystkie7locale/parity. Ostatnia korekta po QA przenosi tę samą kartę scope pod nagłówek, przed Topic; niezależne23/23 route/config/layout PASS i fresh-loaded native Light/Dark/Large potwierdzają pełną widoczność. Runtime/scoring/storage bez zmian przez tę korektę, zatem baseline/Focus dowody nadal pasują. Część7locale/fault scenarios CODE_ONLY; bez VoiceOver/physical-device/GO.

Na jednym istniejącym iPhone17/iOS26.4, English/Large, istniejącym syntetycznym aktorze, normalna GCP40 diagnoza zakończona12correct/0partial/28incorrect/0unanswered. Aktualny saved-result report: jednostki18/20/2, cztery niesprawdzone,35first-recorded/5repeat; targetunit2 B03 ma20/20 już użytych Focus questions i14wrong. Rzeczywista rekomendacja prowadzi do scoped Focus10, normal pause przed odpowiedziami→cold resume tego samego session4 i pierwszego item→normal complete10/10,4correct/0partial/6incorrect. Każdy z10itemów sprawdzony wobec dokładnych20ID wyprowadzonych z pinned node+mentalUnit metadata, nie z parsowaniaID. Native nie zbierał pełnej listy10unikalnych ID/fingerprint; source tests potwierdzają prepared uniqueness/order. To nie jest pomiar skuteczności ani transferu.

Pierwszy native report miał stary bundle z rawunitIDs: nie odebrano go jako aktualnego UI. Ponowne wczytanie i saved-result przez Activity potwierdziły obecny numbered UI bez ponownej diagnozy. Dwa zimne starty wykazały jawny15s timeout ContentPreparationGate; normal Try again przywróciłHome obu razy. Przyczyna operacyjna nieustalona, brak dowodu regresji§1.1: PERF-01 wymaga pomiaru granic bootstrap/recovery, bez podwyższania timeout/resetu. Prywatny jeden manifest `/private/tmp/patternly-bizq05-native/manifest.json`; pełne BEFORE11profiles89rows i bridgevsBIZQ04final70/70protected PASS. Final AFTER completeexit0:11profiles89rows; niezależny odczyt actualreceipts70/70protected exactrows bez braków/różnic. Osiem changedrows własnegoaktora/control oceniono osobno zgodnie z zakresem learning/lifecycle/cache/readiness; to nieglobalbyte-equality ani individualSecureStoretokenproof. Zakończono readonlyreceipt→Home, OSprzywróconoDark. Po refcheck usunięto30własnych niepotrzebnych plików3failedgroups bez zmiany acceptedinputs. Nie usuwano danych/nieukończonych zadań; zastąpione implementationpaths w tym pakiecie nie występują. Wersjonowany rzeczywisty reproducer `.maestro/bizq05-scoped-focus-native.yaml` identyczny z użytym przebiegiem; jego preconditions nie upoważniają do przywracania historycznej sesji lub zmiany profilu.

## 2. Trzy różne zastosowania

| Zastosowanie | Pytanie produktowe | Interpretacja |
| --- | --- | --- |
| Diagnoza zakresu | Jakie obszary sprawdziliśmy i gdzie wystąpiły błędy? | Jawny zakres próbki i jej ograniczenia; nie pełna wiedza o tracku. |
| Transfer | Czy użytkownik rozwiązuje zmieniony przykład bez podpowiedzi poprzedniego kontekstu? | Dowód konkretnego zastosowania/rozróżnienia, z kontrolą wcześniejszej ekspozycji. |
| Retrieval po czasie | Czy potrafi ponownie wykonać właściwą decyzję po due? | Rzeczywisty zdarzeniowy sygnał BIZQ-04, nie syntetyczne mastery. |

Te funkcje mogą korzystać z istniejących trybów. Nie wymagają trzech nowych przycisków. Prawdziwy score sesji, diagnostyczna interpretacja i stan ukończenia pakietu pozostają oddzielne.

## 3. Inwentaryzacja i mapping

Dla każdego obecnie oferowanego tracka ustal:

- zakres obiecywany użytkownikowi i faktycznie dostępny na jego tierze;
- kanoniczny blueprint i jego wersję;
- domeny/kompetencje/node/mentalUnit/skill mapping;
- istniejący diagnostic/mixed/independent/simulation mode;
- rozmiar, timing feedbacku, timer, zasady skracania i review;
- rozkład aktywnej puli oraz rzeczywiste braki;
- źródło wag/priorytetów, jeśli są używane.

Przed poprawką przygotuj raport puli: ile unikalnych zgodnych item IDs istnieje dla każdego wymaganego stratum. Nie wnioskuj o pokryciu egzaminu z samej liczby pytań lub nazwy folderu.

Dla certyfikacji odwzorowanie oficjalnego zakresu i wag wymaga aktualnego oficjalnego przewodnika; Codex ma sprawdzić źródło, wersję i datę. Nie kopiuj pytań egzaminacyjnych ani remembered dumps. Gdy źródło nie podaje wag lub ma luki, zapisz jawny Patternly-defined blueprint, bez udawania oficjalności.

Dla Coding/Design Interview scope jest zakresem ćwiczeń Patternly. Nie nazywaj go pełnym odwzorowaniem rekrutacji do konkretnej firmy.

### 3.1. Aktualna inwentaryzacja puli i źródeł — 08.10.2026

Niezależny odczyt Luna high aktualnych generated canonical artifacts i PRODUCT_MODE_CONFIGS, bez pełnego audytu pytań, bez zmiany materiału/pinów/admission. Każdy track ma unikalne item IDs; łącznie9tracków/117nodes/943mentalUnits/16622questions. Pula Free oznacza rzeczywiście oferowany node scope, nie pełny blueprint egzaminu.

| Track | Questions / nodes / mental units | Free node: questions / units |
| --- | --- | --- |
| AWS SAA | 2604 / 21 /145 | 40 /12 |
| Backend System Design | 1569 /10 /89 | 145 /9 |
| Claude Architect Professional | 845 /7 /38 | 138 /6 |
| Coding Interview | 3404 /26 /213 | 158 /8 |
| Frontend System Design | 1766 /10 /88 | 150 /8 |
| Google Cloud ACE | 2981 /20 /152 | 136 /7 |
| Azure AZ-104 | 1288 /9 /75 | 132 /8 |
| Azure AI-901 | 752 /5 /64 | 144 /12 |
| Object-Oriented Design | 1413 /9 /79 | 136 /8 |

GCP40 baseline to wyłącznie N01/domain1 (B02=18/B03=20/B04=2), nie diagnoza przekrojowa. Osobna GCP Premium simulation ma profil50–60/120min i4-domain blueprint; obecny runtime używa jego konkretnej stałej długości, zakres profilu nie dowodzi wyboru każdej długości przez UI. Coding Premium simulation40/45min; design ma po jednym staged case. AWS/AZ104/AI901/CCAR-P nie mają obecnie canonical exam simulation. Node-bounded practice i due-conditioned review nie są zbalansowaną diagnozą całego tracka.

Źródło ACE rozstrzygnięto po kontroli konfliktu: [aktualna strona certyfikacji](https://cloud.google.com/learn/certification/cloud-engineer) bezpośrednio linkuje Standard Exam Guide do [oficjalnego PDF](https://services.google.com/fh/files/misc/associate_cloud_engineer_exam_guide_english.pdf), który ma4domeny20/30/30/20 i AI-assisted tooling. [Oddzielna HTML guide page](https://cloud.google.com/learn/certification/guides/cloud-engineer) nadal ma5sekcji20/17.5/25/20/17.5 i odsyła do innego registration surface; nie jest jawnie deprecated i nie publikuje effective date. PDF/landing/FAQ także nie mają jawnego revision/effective date. Przyjmujemy „Standard Exam Guide bezpośrednio wskazany przez aktualną stronę egzaminu, odczyt08.10”; nie twierdzimy, że lokalne4domain są stale, i nie przebudowujemy mapy na5. Wcześniejszy wniosek analizy o koniecznym5-way update był nieuzasadniony i został skorygowany przed jakąkolwiek zmianą.

GCP ma contentDomainId wszystkich2981items i zgodne2981slot mappings,20nodeDomainMap entries z zadeklarowanym0ambiguity. To dowód zgodności obecnych metadanych/mapy z pakietem, nie niezależny semantyczny odbiór każdego przypisania ani efficacy. Główne strata innych certification registries: AWS4domains/14objectives, AZ1045/15, AI9012/7, CCAR-P7/38; canonical item nie ma dla nich contentDomainId. Dlatego liczby node/mentalUnit nie są jeszcze oficjalnym domain coverage. Coding taksonomia ma7stages/21pattern families/87archetypes/213skill atoms. Design curricula mają cele i sloty, lecz bez zweryfikowanego item-to-objective consumer denominator nie stanowią gotowego aktywnego coverage metric. Braki mappingów pozostają do domknięcia we właściwym pakiecie BIZQ05; nie przenosić pełnego audytu pytań przed iOS.

Sprawdzone official sources: [AWS SAA-C03](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html), [AZ104](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104) skills measured17.04.2026, [AI901](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-901)15.04.2026. CCAR-P registry przypina guidev1.0 effectiveJuly2026/checked03.09; [Partner Academy](https://anthropic-partners.skilljar.com/page/partner-certifications) potwierdza certyfikację i guide, samPDF nie był niezależnie dostępny w ponownej próbie. To jawny brak re-verificationPDF, nie potwierdzenie nowej wersji. Coding/Design są Patternly-defined, bez company recruitment/official weights claim.

D14: znane publiczne demo IDs to `aws-saa-c03-architecture-001-odk096` i `alg-complexity-time-005`; oba należą do bieżących ordinary Free practice pools. GCPdemo brak. Ordinary practice może korzystać z tych elementów; przyszły niezależny assessment musi wyłączyć świadomie ujawnione stałe demo ze swego blueprintu, o ile wymagana pula nadal wystarcza. Bez cross-site identity tracking, bez używania tego wyłączenia do ukrywania wad contentu. Intersection IDs nie dowodzą braku semantycznego podobieństwa innych itemów.

### 3.2. Przegląd projektu następnego pakietu mapowania — 08.10.2026

Niezależny przegląd Luna high: PASS WITH REFINEMENTS dla source-owned primary-unit map → istniejący builder → dokładny artifact → obecny release/admission pipeline. Oceny: zgodność z celem/architekturą 0,93; prostota 0,82; kontrola ryzyka 0,85; utrzymywalność 0,84; minimum 0,82. To przegląd propozycji, nie odbiór implementacji ani zgoda na runtime admission/publikację. Pakiet zostanie wdrożony po domknięciu pierwszego pakietu §1.1, z jednym wykonawcą i osobnym odbiorem.

Aktualne curricula są źródłem propozycji do przeglądu, nie kanonicznym runtime authority: AWS i GCP mają not_admitted/historical_noncanonical; AZ104 i AI901 not_admitted/unapproved; CCAR-P nie dostarcza zaakceptowanej podstawy statusowej. Każde wykorzystanie wymaga niezależnego semantic owner review deklarowanego celu jednostki, objective registry i przypisania aktywnego banku. Nie przenosić uprawnień admission z równości identyfikatorów ani z technicznego przejścia buildera.

Zweryfikowany join: AWS ma obecnie 145 jednostek/21 nodes wobec 39 curriculum blocks/3 nodes; tylko 12 jednostek ma zgodny block ID, a 3 z tych zgodności są wielodomenowe. Pozostałe 133 oraz 3 niejednoznaczne wymagają jawnego primary objective/domain z uzasadnieniem, bez majority, fuzzy ID, parsowania promptów lub zgadywania z nazwy. AZ104 75/75, AI901 64/64 i CCAR-P 38/38 mają dokładny unit→block join, który pozostaje kandydatem do semantic review. Zachować odrębny istniejący GCP pinned published-item proof.

Skorygowana hipoteza kontraktu po dodatkowej analizie AWS: dokładnie jedno primary objective dla każdego exact questionId; domena wyprowadzana z objective.parentDomainId przypiętego registry. Unit-level shorthand jest dopuszczalny tylko po jawnym semantic review jednorodności wszystkich pytań jednostki. Powiązać registry ID/version, sprawdzony guide/source, wersję i checksumę mapy oraz dokładny source inventory/content pin. Ponowny niezależny przegląd tej istotnej korekty: Luna high PASS WITH REFINEMENTS, oceny 0,95/0,84/0,88/0,85, minimum 0,84; nadal jest to projekt, nie odbiór kodu/admission. Brakujące, obce, nieużywane i wielokrotne wiersze powodują jawny błąd. Pole contentDomainId już istnieje w schema/types, ale bieżące questionValidation oraz syncBundledContentRelease dopuszczają je wyłącznie dla GCP z simulation profile: rozszerzenie wymaga skoordynowanej zmiany buildera, walidatorów i testów, nie samego dopisania metadanych. Coding/Design zachowują jawnie Patternly-defined primary scope, bez udawania oficjalnego domain standardu.

Dodatkowa READ_ONLY analiza nie oceniała całego banku: dziewięć bieżących pytań w trzech AWS overlap units pokazuje ryzyko błędnego wspólnego domain. architecture_review obejmuje koszt rezerwacji i odporność/failover; retention_backup_replication obejmuje kontrolę dostępu do vault i odzyskiwanie; requirements_and_constraints łączy availability/latency/residency/budget bez jawnego autorskiego primary celu. Przypisania domen w tej analizie są semantic inference, nie dowodem autorskiego bindingu. Review packet ma402 nadal obecne item IDs ze starszego2568-item banku, ale bez official objectives i bez tych dziewięciu przykładów; nie przenosić zakresu jego approval na pozostałe2202 bieżące item IDs. Nie zbadano jednorodności pozostałych jednostek; liczba dziewięciu dotyczy pytań z trzech analizowanych jednostek, nie dziewięciu jednostek. Brak autorskiego bindingu pozostaje jawny; obecny curriculum nie zastępuje decyzji o primary celu.

Najmniejszy dostępny pakiet bez brakujących semantycznych przypisań: source-owned manifest contract/provenance validator i read-only readiness z mapped/unmapped/orphan/ambiguous, unique domain/unit counts oraz odrębnymi candidate joins. Track zadeklarowany jako mapped musi mieć dokładny komplet bieżących item IDs; częściowy nie zasila runtime domain projection. Nie tworzyć pustej mapy udającej gotowość ani guessed AWS bindings. Unit shorthand odłożyć, jeśli nie ma pinned homogeneity proof. GCP dotychczasowy proof potwierdza item→domain, nie exact primary objective każdego pytania. Nowe przypisania wymagają semantic owner review, nie ponownego pytania PO o zatwierdzone reguły.

Kolejność: zatwierdzony source mapping i exact-input provenance → walidowany build/proof → zwykły candidate release/sync i wymagane admission → consumer dokładnego artifactu. Ten pakiet sam nie grantuje admission. Read-only pool summary liczy unikalne exact item IDs osobno według domain/unit i rzeczywiście istniejącego mode/tier; oddziela aktualną pulę runtime od kandydackich strata blueprintu. Count nie dowodzi gotowości przygotowania: minimum, legalny node/tier, brak duplicate/filler oraz rzeczywisty prepared plan podlegają osobnemu sprawdzeniu. Niedobór pozostaje unavailable/gap, bez przenoszenia kwot lub odblokowania Premium. Nie zmieniać GCP na pięć domen ani nie wprowadzać nowego trybu/scoring/telemetry.

### 3.3. Konkretny następny pakiet readiness-only — PASS WITH REFINEMENTS, design only

Cel: odtwarzalny odczyt gotowości aktualnych dziewięciu ścieżek, bez fabricated bindingów i bez zmian builder/artifact/runtime/admission. Oceny kontrolera: zgodność0,95/prostota0,88/ryzyko0,90/utrzymywalność0,89, minimum0,88. Niezależny Luna high review PASS WITH REFINEMENTS;§1.1 odebrany, implementacja dopiero po uwzględnieniu poniższych refinements. Nie stanowi to odbioru kodu/runtime/admission.

Content jest jedynym właścicielem `config/primary-strata-readiness.json`, `scripts/content/verify-primary-strata-readiness.mjs`, `tests/primary-strata-readiness.test.mjs` i komendy wpackage.json; dodać schema tylko jeśli istniejący mechanizm walidacji jej wymaga, bez dwóch konkurencyjnych walidatorów. Jeden manifest ma dokładnie dziewięć actualcatalog entries: trackId/contentVersion, questionCount, SHA deterministycznego posortowanego unique questionId set oraz SHA kanonicznego source inventory. Inventory obejmuje catalog entry, relative sourceFile+rawbytes SHA oraz PEŁNY rzeczywisty zestaw wejść validateTrack: track configuration, taxonomy, właściwe simulation-profile i published-evidence files oraz wersję/hash właściciela loadera. Lista przypiętych dependencies musi być sprawdzona wobec aktualnej ścieżki czytającej; zmiana każdego consumedinput powoduje staleprovenance, nie tylko zmiana pytań. Bez absolute machine paths. Registry/profile/published-evidence path+SHA/version przypięte do faktycznych źródeł; sourcecurrentness z guideVersion/checkedDate zachowuje not_documented/unverified, nie dopisuje nowej daty sprawdzenia źródła na podstawie mtime.

Dwie odrębne osie: primaryObjective status jawnie `unavailable`, `partial` albo `complete`: unavailable z konkretnym powodem bez pustych rows; partial/complete używają `question_objective_bindings` z niepustymi exactitem rows i pinnedregistry; stratum `published_item_domain`, `patternly_node` albo `unavailable`. Obecnie nie tworzyć pustych rows udających completedmap: objective unavailable, GCP domain counts z istniejącego validateTrack().artifactQuestions i pinnedpublisheditemproof, cztery interview node counts z exactcanonical nodeId jako Patternly-defined scope; pozostałe certstrata unavailable. Nie łączyć registry/runtime domain labels po nazwie. Futureexplicitobjective daje tylko jednego primaryperitem, domain z registryparent; orphan/ambiguous wiersze jawny błąd. Currentvalidunavailable/partial pokazuje not_ready, nie verifier failure ani runtime success. Declaredcomplete maexactfullset bez missing/extra/duplicate; brakujące assignments wpartial liczone unmapped. Oddzielić strukturalną poprawność od readiness i semantycznego ownerapproval.

Verifier korzysta z istniejącego validateTrack i canonicalJson/sha256, nie czyta drugą heurystyczną ścieżką banku. Własne wyniki tylko compactstdout, nie report tree. Nie zmienia build/mode/selection/scoring/store/pin/admission; app nie wymaga zmiany walidatorów, ponieważ artifactbytes pozostają te same. Implementacja i kolejność zwykłego merge/push: content contract→verifier+tests→independentQA/actualsource run; potem app plan/state z pairedcontentcommit przy następnym spójnym sourcepackage, bezmetadata-onlypush. Deployment/release/admission nie wykonywane. Rollback dotyczy tylko read-onlytool+manifest, istniejący runtimecontent bez migracji. Appconsumer istniejących29mode pools/getPool/freeNode i dynamicdue counts podlega następnemu pakietowi, bez kopiowania ProductModeConfig/tierzgadywania doproducer.

Kryteria: actual nine-track run musi podać exactquestioncounts/node/unit counts i osobne objective/stratum readiness, GCP proof zweryfikowany currentloaderem, interviewstrata uczciwiePatternly-defined, certgaps jawne. Negatywne przypadki: catalog/source/version/setSHA drift, foreign/duplicate track, empty/unknown/foreign/duplicate primary rows, stale registry/publishedsource SHA, ambiguous primary, wrong objectiveparent/domain i declaredfullmissing. Focusedtests potem requiredcontent validate/test/build z bieżącymi źródłami; buildnieaktualizuje źródeł ani grants. Żaden mapped-count nie jest semantycznym odbiorem wszystkich pytań albo efficacy proof.

## 4. Reprezentatywny dobór — bez udawania pełnego pokrycia

### 4.1. Blueprint obejmujący właściwy zakres

Zastąp listę ograniczoną do pierwszego noda doborem z jawnie zadeklarowanych warstw właściwych dla celu. Zachowaj stałą długość, jeżeli obecny kontrakt ją wymaga. Gdy zmiana zakresu wymaga brakujących pytań, zapisz dokładne luki i przygotuj ograniczone nowe/zastępcze elementy zgodnie z BIZQ-01; nie generuj masowo fillerów.

Warstwa może oznaczać domenę egzaminacyjną, kompetencję albo rodzinę decyzji. Jedno pytanie ma jeden główny wkład w licznik pokrycia; dodatkowe tagi nie mogą sprawiać, że wygląda jak pięć niezależnych prób.

Jeżeli liczba umiejętności przekracza długość diagnozy, nie obiecuj, że każda została sprawdzona. Wynik mówi o próbkowaniu szerokich obszarów, nie o wyczerpaniu całej taxonomy.

### 4.2. Deterministyczny podział liczby pytań

Użyj istniejącego mechanizmu blueprint selection. Jeśli potrzebne jest rozdzielenie kwot według wag, zastosuj jeden prosty, testowalny algorytm, np. największych reszt z deterministycznym tie-break po stabilnym ID. Minimalne pokrycie warstw, jeżeli wymagane, jest częścią blueprintu, nie improwizacją generatora.

Przykład syntetyczny: 40 miejsc i pięć warstw o wagach 25/25/20/20/10% daje 10/10/8/8/4. To dane fixture, nie zakres prawdziwego egzaminu. Przy innych wagach suma przydziałów musi dokładnie wynosić N.

Brak pozycji dla wymaganego stratum w stałym trybie to błąd przygotowania albo jawny brak pokrycia wymagający naprawy contentu — nie ciche przeniesienie miejsc do pierwszego noda. Nie używaj duplikatu item ID do domknięcia liczby.

### 4.3. Dostęp Free/Premium

Pełny blueprint nie może omijać uprawnień. Jeżeli Free obejmuje tylko ograniczony zakres danego tracka, legalny preview/diagnosis ma nazwać ten zakres albo istniejący CTA ma prowadzić do paywalla. Nie uruchamiaj płatnego trybu jako „darmowej diagnozy” przez zmianę nazwy.

`Exam`, `Coding Mock Interview` i Design Interview pozostają Premium według aktualnego planu. Nie twórz wyjątku dlatego, że wylosowane pytania pochodzą z darmowego źródła. Jeżeli legalna darmowa wersja diagnostyki nie istnieje, nie wymyślaj jej w tym zadaniu.

## 5. Sprawdzanie nowych przykładów

### 5.1. Co znaczy „nowy”

Rozróżnij nowy item ID od nowego wymagania rozumowania. Zmiana nazwy firmy albo wartości liczbowej może pozostawić identyczny schemat z widoczną odpowiedzią. Takie pytanie może służyć ćwiczeniu, ale nie powinno automatycznie być mocnym dowodem transferu.

Wykorzystaj istniejące metadata stage/archetype/contrast/review variant. Jeśli brakuje jednego niezbędnego oznaczenia relacji bliskich wariantów, dodaj minimalne pole ze wskazanym konsumentem selekcji i testami. Nie twórz drugiej taxonomy ani nowej warstwy „AI quality score”. Heurystyka podobieństwa z BIZQ-01 jest sygnałem redakcyjnym, nie runtime dowodem tożsamości umiejętności.

„Brak wcześniejszej ekspozycji” oznacza brak zarejestrowanej ekspozycji w dostępnej historii danego profilu. Nie jest dowodem, że człowiek nigdy nie widział podobnego pytania w sieci. Nie obiecuj więcej. Gdy historia jest niepełna, zachowaj jawne ograniczenie interpretacji.

### 5.2. Kontrakt zadania transferowego

Dobre sprawdzenie transferu musi obejmować co najmniej jeden sensowny typ zmiany:

- ten sam mechanizm w innym archetypie, wymagającym rozpoznania jego warunków;
- podobny kontekst, ale zmieniony warunek powodujący inną decyzję;
- kontrast dwóch realnie konkurencyjnych podejść;
- zastosowanie bez wcześniejszej podpowiedzi etapu/tematu.

Nie wystarczy nowe ID i odrobinę zmienione copy. W batchu autor opisuje, co zmieniono i dlaczego ta zmiana sprawdza transfer. Reason/Details tłumaczą konkretną granicę, a nie powtarzają ogólny slogan.

W selekcji preferuj zgodne, niewidziane pytania i unikaj bliskiego wariantu pokazanego chwilę wcześniej. Jeśli nie ma odpowiedniej puli, pokaż ograniczenie „practice, not fresh transfer evidence” zgodnie z realnym mode contract albo zgłoś brak wymaganej puli. Nie nazywaj starego pytania nowym, by test przeszedł.

### 5.3. Brak podpowiedzi kontekstowych

Gdy celem jest rozpoznanie wzorca, nagłówek nie może zdradzać jego nazwy. Zachowaj widoczną tożsamość tracka, ale zbędny szczegół topic/mentalUnit ujawnij dopiero w odpowiedniej fazie. Sprawdź także accessibility props, route-derived labels, nazwy odpowiedzi i poprzednią kartę, nie tylko prompt.

Nie usuwaj prawdziwych warunków problemu. Test ma wymagać samodzielnego rozpoznania, a nie zgadywania brakujących założeń.

### 5.4. Granica feedbacku

Nie zmieniaj automatycznie diagnostyki z immediate feedback na end-feedback. To zmiana kontraktu trybu. Jeśli obecny diagnostic udziela feedbacku po każdym pytaniu, jego wynik jest zbiorem obserwacji podczas nauki; feedback może wpływać na późniejsze odpowiedzi. Raport i interpretacja nie mogą udawać czystego pretestu.

Do sprawdzenia z odroczonym feedbackiem wykorzystaj istniejący właściwy tryb, z jego uprawnieniami i timerem. Nie twórz ukrytej symulacji na bazie zwykłego runnera. Pary blisko powiązanych przykładów mogą wspierać naukę w contrast practice, ale nie służą jako niezależne próby potwierdzające transfer natychmiast po objaśnieniu.

## 6. Interpretacja wyników i następne kroki

### 6.1. Właściwy wynik

Pokaż prawdziwy scope, liczbę prób i ograniczenie dowodów. Dla małej liczby zadań w danej domenie lepszy jest opis „2 z 3 odpowiedzi poprawne, mała próbka” niż stanowczy status „obszar opanowany”. Nie wprowadzaj nowego syntetycznego wskaźnika gotowości.

Zachowaj bieżące zasady scoringu: partial, incorrect i unanswered są różnymi kategoriami, chyba że konkretny egzaminowy wynik ma zdefiniowany sposób agregacji. Nie zaliczaj pominiętej odpowiedzi jako dowodu konkretnej błędnej reguły. Liczniki numerator/denominator muszą być jawne w modelu i testach.

### 6.2. Reguły rekomendacji

| Sygnał | Dopuszczalna interpretacja i akcja |
| --- | --- |
| Brak próbek z danego obszaru | Potrzebujemy sprawdzenia/wprowadzenia; nie diagnozuj braku umiejętności. |
| Wiele poprawnych odpowiedzi guided, brak niezależnych prób | Zaproponuj mniej podpowiadające zastosowanie; nie deklaruj transferu. |
| Powtarzalny, autorsko opisany błąd | Zaproponuj konkretną remediation/contrast zgodnie z family policy. |
| Dobre wyniki na znanych przykładach, słabsze na nowych | Priorytet zróżnicowanego zastosowania, nie kolejnych kopii znanych pytań. |
| Słabszy wynik na due retrieval | Wróć do istniejącej remediation z BIZQ-04. |
| Prawidłowy transfer w badanym zakresie | Można zaproponować szerszy zakres; to nie dowód całego tracka. |

Te reguły są rekomendacjami. Nie wprowadzają mastery gate ani blokady kolejnego noda. Każda rekomendacja ma powód wskazujący rzeczywiste dowody. Nie diagnozuj trwałej cechy osoby na podstawie jednej błędnej opcji.

### 6.3. Kontrakt wyjściowy do planera

BIZQ-03 potrzebuje co najmniej: zakres zbadany, obszary bez wystarczających dowodów, etapy praktyki, powtarzalne błędy, dostępność następnego sensownego sprawdzenia i ograniczenia ekspozycji. Zwracaj ten wynik z istniejącego family read model/recommendation ownera, nie nowego scoring repozytorium.

Nie zapisuj drugiego `completionStatus` zbudowanego z tych sygnałów. Istniejąca reguła ukończenia i kryterium odblokowania pozostają kanoniczne. Gdy wynik pakietu i szersza ocena pokrycia różnią się, pokaż oba znaczenia uczciwie.

## 7. Weryfikacja wartości edukacyjnej — bez wymyślonych wyników

Zadanie obejmuje przygotowanie definicji pomiaru i możliwość jego wykonania na istniejących danych, nie deklarację poprawy u użytkowników. Produkt według R1 nie ma jeszcze danych produkcyjnych umożliwiających taki wniosek.

### 7.1. Wskaźniki wewnętrzne

- poprawne odpowiedzi na pierwszej zarejestrowanej próbie nowych, mniej podpowiadających przykładów, z jawnym mianownikiem;
- poprawne odpowiedzi na due-qualified retrieval, osobno od natychmiastowych poprawek;
- ponowne wystąpienia tego samego autorsko zdefiniowanego błędu;
- rzeczywisty foreground time realizacji planu wobec jego estymaty;
- rozkład pokrycia między obszarami i etapami, nie tylko liczba sesji.

Preferuj istniejące lokalne zapytania/test harness i obecny dozwolony zakres danych. Nowe zagregowane zdarzenie albo transmisja wymaga aktualnego kontraktu privacy/telemetry. Nie loguj odpowiedzi i nie uruchamiaj analityki serwerowej tylko po to, by zamknąć zadanie.

### 7.2. Minimalny protokół przyszłego pilota

Przygotuj w raporcie wykonalny opis: określony zakres nauki → nowa, porównywalna próba początkowa → nauka → odroczony test na innych przykładach → porównanie wyników z kontrolą wcześniejszej ekspozycji i czasu. Obie wersje muszą korzystać z poprawnego, dopuszczonego materiału; nie wracaj do wadliwych odpowiedzi jako grupy kontrolnej.

Nie testuj efektu objaśnień przez powtórzenie identycznego pytania tuż po ich przeczytaniu. Nie przypisuj poprawy jednej zmianie, jeśli jednocześnie zmieniły się content, ekspozycja i planner. Pilot wymaga realnych uczestników i właściwego zakresu zgód; Codex nie ma ich fabrykować ani kontaktować bez upoważnienia.

Bez takiego pilota raport brzmi „mechanizm i definicja pomiaru zaimplementowane, efekt edukacyjny niezmierzony”. Jest to prawidłowe ograniczenie, nie powód do fałszowania skuteczności.

### 7.3. Zrekonstruowane źródła pomiaru i protokół — 08.10.2026

Niezależna analiza Luna high, READ_ONLY: TrainingAttempt przechowuje exact item ref, session/mode/occurrence, wynik i answeredAt/committedAt. TrainingSession zachowuje itemOrder/configurationSnapshot oraz activeForegroundMs, a result answered/unanswered. Odczyt musi pozostać w jednym profilu, zweryfikowanej ukończonej sesji i dokładnym pinie; resolver dostarcza primary mentalUnit/node. To pozwala liczyć recorded exposure, odpowiedzi i rzeczywiste mianowniki pokrycia bez nowego store/scoring/telemetry. Równe answeredAt różnych prób tego samego itemu nie wyznacza wiarygodnego first-attempt order; taki tie jest unknown/group, nie arbitralną kolejnością po ID. Dostępność immediate feedback przed późniejszą odpowiedzią nie dowodzi, że użytkownik je przeczytał.

Nie utożsamiać answer/time/snapshot z zaakceptowanym przejściem review: semantic/CAS conflict zachowuje attempt i pomija zmianę review. Po ACK bieżący rekord nie zachowuje trwałego lastTransitionAttemptId wcześniejszych etapów. Terminal completedByAttemptId wiąże exact końcowy sukces retention28, lecz nie pozwala odtworzyć wszystkich intermediate qualified retrieval. Journal transition jest miarodajny wyłącznie tam, gdzie rzeczywisty commit i correlation nadal są potwierdzone. W historycznym lokalnym raporcie intermediate credit bez takiego dowodu jest unavailable, nie zero ani sukces. Nie dopisywać nowego trwałego event schema tylko dla zamknięcia wskaźnika.

Canonical attempt writer emituje node i mental_unit; nie emituje autorsko zdefiniowanego mistake_type. Wrong option/message/prose nie są stabilnym kodem błędu. Recurrence określonego autorskiego błędu pozostaje unavailable, dopóki właściwy content/evidence contract go nie dostarczy. activeForegroundMs jest rzeczywistym łącznym czasem sesji, nie pomiarem każdego pytania; normalny writer nie ustawia opcjonalnego attempt.durationMs. Obecny PlanSlot.sessionLength nie jest estymatą minut. Actual-vs-estimate wymaga estymaty zamrożonej przed pomiarem; nie tworzyć arbitralnego przelicznika liczby pytań. Kalibracja BIZQ-03 pozostaje osobnym zatwierdzonym kontraktem.

Wykonalny przyszły pilot: przed badaniem zamrozić ograniczony blueprint oraz równoważne dopuszczone formy A/B z exact IDs/pinami, primary-unit coverage i trudnością. Wykluczyć znane stałe demo i bliskie warianty z niezależnego assessmentu, jeżeli obowiązująca pula to umożliwia; niedobór jawny, bez fillerów. Określić rejestrowaną ekspozycję profilu i osobno ograniczenie wcześniejszej ekspozycji poza aplikacją. Przeprowadzić porównywalną próbę początkową, naukę w istniejącym feedback/UI contract, a następnie odroczony test na innych przykładach w tym samym zakresie. Porównać z baseline/control lub counterbalanced form przy ustalonym czasie i opóźnieniu; uwzględnić różnice contentu, exposure i planera. Zamrozić foreground estimate przed badaniem i porównać z session.activeForegroundMs. Nie powtarzać identycznego pytania tuż po objaśnieniu jako testu efektu.

Realni uczestnicy, właściwa zgoda i dozwolony privacy scope są warunkami przyszłego pilota, nie uzyskanymi odbiorami ani autoryzacją kontaktu. Bez pilota: mechanizm/definicja pomiaru przygotowane, efekt edukacyjny niezmierzony. Analiza nie uruchomiła nowej transmisji, nie czytała surowych danych kont i nie ustanawia nowej bramki produktu.

## 8. Testy obowiązkowe

| ID | Przypadek | Oczekiwany wynik |
| --- | --- | --- |
| D01 | Blueprint całego tracka, pytania tylko pierwszego noda | Brak fałszywego pełnego zakresu; odrzucone przygotowanie albo prawdziwie ograniczona, legalna konfiguracja. |
| D02 | 40 miejsc, wagi fixture 25/25/20/20/10 | Dokładnie 10/10/8/8/4 i 40 różnych ID. |
| D03 | Wagi z niecałkowitymi kwotami | Suma N, stabilny tie-break, brak losowego zwiększania liczby pytań. |
| D04 | Brak puli w wymaganej domenie | Jawny błąd/brak pokrycia, nie filler z innego noda. |
| D05 | Wiele tagów jednego pytania | Nie udaje wielu niezależnych dowodów. |
| D06 | Nowe ID, prawie ten sam wariant | Nie jest automatycznie uznane za niezależny transfer. |
| D07 | Prompt sprawdza rozpoznanie, nagłówek zdradza wzorzec | Brak niedozwolonej podpowiedzi w widoku i propsach. |
| D08 | Pierwsza zarejestrowana ekspozycja i powtórka | Oddzielne liczniki; nie nabijają dwa razy first-attempt evidence. |
| D09 | Immediate feedback w diagnozie | Zachowana semantyka trybu; brak claimu czystego pretestu. |
| D10 | End-feedback tryb | Brak poprawności/Details przed właściwym finalization. |
| D11 | Wysokie guided score, brak niezależnych przykładów | Rekomendacja dalszego sprawdzenia, nie mastery/ready. |
| D12 | Partial/unanswered | Scoring zgodny z trybem, bez dopisywania nieistniejącego błędu. |
| D13 | Free kontra pełna/płatna diagnoza | Brak obejścia Premium; scope i CTA prawdziwe. |
| D14 | Wybrany content z web demo | Kontrola ekspozycji: nie przedstawiaj świadomie pokazanej próbki jako niezależnego testu. |
| D15 | Sesja restartowana | To samo prepared order/scope; brak ponownego losowania łatwiejszej puli. |
| D16 | Zmiana pakietu lub profilu | Właściwa izolacja i jawne ograniczenie porównywalności danych. |
| D17 | Mało danych w domenie | Mianownik i ograniczenie, bez stanowczej klasyfikacji umiejętności. |
| D18 | Planner konsumuje wynik | Inny uzasadniony scope pracy dla różnych luk; nie tylko inny tytuł karty. |
| D19 | Brak użytkowników/pomiarów | Brak fikcyjnego wyniku skuteczności, wykresu poprawy lub percent uplift. |
| D20 | Test repozytorium/telemetry boundary | Brak nowej nieautoryzowanej transmisji odpowiedzi, danych i identyfikatorów. |

Kontrola ekspozycji na web w D14 nie wymaga śledzenia osoby między stroną i aplikacją. Znane stałe przykłady demo mogą być jawnie wyłączone z puli niezależnego assessmentu przez jego blueprint, o ile ten nadal ma wystarczającą pulę. To konfiguracja rzeczywistego trybu, nie lista ukrywania wad contentu.

## 9. Odbiór

Raport musi pokazać mapping i pool readiness dla aktualnych tracków, before/after diagnozy GCP, przykład prawdziwego kontrastu/transferu, rzeczywiste źródło danych rekomendacji i ograniczenia pomiaru. Materiał nowy lub zmieniony przechodzi właściwe admission BIZQ-01.

Wymagany iOS flow: przygotowanie diagnozy → rzeczywista sesja → summary o prawdziwym zakresie → rekomendowana sesja na konkretną lukę. Dodatkowo test uprawnień oraz brak wycieku odpowiedzi. Motywy i duży tekst według aktualnego UI gate, bez testów VoiceOver.

Samo dodanie `transfer=true` do pytania nie zamyka zadania. Potrzebne są znaczące różnice między przykładami, działający selector i poprawna interpretacja. Pełne przygotowanie do egzaminu/rozmowy nadal nie jest gwarantowane przez żaden wewnętrzny score.
