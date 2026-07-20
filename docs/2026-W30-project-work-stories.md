# Story prac na tydzień 2026-W30

**Okres:** 20–26 lipca 2026  
**Repozytoria źródłowe:**

- Patternly: `lukaszkurczab/gcp-ace-trainer`
- Fitaly frontend: `lukaszkurczab/fitaly`
- Fitaly backend: `lukaszkurczab/fitaly-backend`

## Cel tygodnia

Doprowadzić istniejące rozwiązania do stanu, w którym ich jakość i gotowość są potwierdzone wykonywalnymi gate’ami dla dokładnych commitów. Nie otwierać nowych funkcjonalności przed zamknięciem dwóch obecnych zakresów:

1. wiarygodnego Stage 3 closure w Patternly;
2. jednej zweryfikowanej pary release’owej Fitaly frontend–backend.

## Potwierdzony punkt wyjścia

Stan należy ponownie zweryfikować przy rozpoczęciu każdej story. W chwili przygotowania planu:

- `gcp-ace-trainer/main` wskazywał commit `1c76d2e2118bc00a590a8a999a927359be464378`;
- `docs/plan.md` w Patternly nadal deklarował audyt aplikacji dla wcześniejszego SHA `84bbfd0dca154ef85dc7d0853665f9f8f5ffab67` i aktywne zadanie `S3-CLOSURE-EVIDENCE-02`;
- testy runnerów iOS i Android w Patternly miały osobne skrypty `.test.mjs`, natomiast `qa:static` uruchamiał `npm test`, którego glob obejmował wyłącznie `tests/*.test.ts`;
- `fitaly/main` wskazywał commit `068b2e80f5c70fd4daa86c1725aa98af7304280a`;
- `fitaly-backend/main` wskazywał commit `99b314999e4eba85894ee77039859c2ed406bd49`;
- w `fitaly-backend` gałęzie `main` i `prod` były rozbieżne: `main` był trzy commity przed `prod`, a jednocześnie dwa commity za `prod` względem wspólnego przodka.

## Reguły wykonania

- Jedna story oznacza jeden etap prac i jeden rezultat możliwy do zweryfikowania.
- Story są wykonywane w podanej kolejności, poza jawnie wskazanym zakresem równoległym.
- Każdy prompt w story służy wyłącznie do wygenerowania osobnego pliku Markdown z małymi, konkretnymi promptami wykonawczymi dla Codexa.
- Prompt generujący zadania nie może implementować zmian. Ma najpierw zbadać repozytorium, a następnie przygotować wykonawczą kolejkę promptów.
- Każdy wygenerowany prompt wykonawczy musi mieć mały scope, jedno kryterium zakończenia i własną weryfikację.
- Nie stosować fallbacków, translatorów, compatibility layers, aliasów migracyjnych, równoległych wersji, placeholderów ani oznaczeń ukrywających niedokończony stan.
- Gdy zmiana ustanawia nowy kanoniczny model, stary model, jego importy, testy, dokumentację i ścieżki wykonania muszą zostać usunięte w tym samym spójnym zadaniu.
- Codex nie może zatrzymać zadania tylko dlatego, że znalazł problem. Powinien naprawić przyczynę i ponownie uruchomić walidację, chyba że blokada jest rzeczywiście zewnętrzna i niemożliwa do usunięcia w repozytorium.

---

# STORY 01 — Patternly: naprawa integralności kontraktu audytu Stage 3

## Rezultat story

Clean checkout Patternly ma zawierać jeden kompletny i spójny kontrakt audytu Algorithms Stage 3. Statyczna walidacja ma działać bez Android SDK, emulatora, urządzenia i lokalnie zbudowanego APK. Wymagania środowiskowe mają być sprawdzane dopiero przez jawny runtime preflight.

## Dlaczego ten etap jest pierwszy

Nie można wiarygodnie wykonywać screenshotów i testów dostępności, jeżeli sam runner może wskazywać nieistniejące wejścia albo jego testy nie należą do obowiązkowego QA. Zanim powstanie evidence, trzeba udowodnić, że narzędzie generujące evidence jest kompletne i kontrolowane przez CI.

## Zakres

- inwentaryzacja konfiguracji, manifestów, flow i runnerów iOS oraz Android;
- ustalenie jednego właściciela plików flow: committed files albo jeden deterministyczny generator;
- rozdzielenie statycznej walidacji kontraktu od runtime preflightu;
- włączenie testów runnerów `.test.mjs` do obowiązkowego QA i CI;
- dodanie regresji uruchamianej na rzeczywistym drzewie clean checkoutu;
- usunięcie zastąpionych single-state i legacy audit paths;
- aktualizacja dokumentacji wyłącznie w zakresie rzeczywiście zmienionego kontraktu audytu.

## Poza zakresem

- zmiana semantyki Practice lub Simulation;
- zmiana persistence, scoringu, contentu lub taxonomy;
- wykonywanie finalnego native capture packetu;
- uznanie Stage 3 za zakończone;
- tworzenie mock evidence.

## Kryteria zakończenia

- [ ] Wszystkie statyczne wejścia wymagane przez runner istnieją albo są deterministycznie generowane przez jednego jawnego ownera.
- [ ] Statyczna walidacja przechodzi na clean checkout bez natywnego środowiska i bez APK.
- [ ] Runtime preflight jawnie sprawdza SDK, narzędzia, APK, AVD i urządzenie.
- [ ] Testy runnerów iOS i Android są uruchamiane przez główny QA oraz CI.
- [ ] Nie istnieje równoległa stara ścieżka audytu.
- [ ] `qa:static`, test cross-repo i walidacja audit config są zielone.

## Zależności

Brak. Jest to pierwsza story tygodnia.

## Prompt generujący plik z zadaniami dla Codexa

Skopiuj poniższy prompt do Codexa. Wynikiem ma być plik `2026-W30-story-01-patternly-audit-contract-tasks.md` zawierający uporządkowane prompty wykonawcze.

```text
Pracujesz nad repozytorium `lukaszkurczab/gcp-ace-trainer`.

Nie implementuj jeszcze zmian. Twoim zadaniem jest najpierw samodzielnie
zweryfikować aktualny stan repozytorium, a następnie utworzyć jeden plik
Markdown o nazwie:

`2026-W30-story-01-patternly-audit-contract-tasks.md`

Plik ma zawierać małe, uporządkowane prompty wykonawcze dla kolejnych sesji
Codexa. Każdy prompt będzie później uruchamiany osobno.

Cel story

Naprawić integralność kanonicznego systemu audytu Algorithms Stage 3 tak, aby:

1. committed static contract runnerów iOS oraz Android był kompletny i
   walidowalny z clean checkoutu;
2. wymagania środowiskowe, takie jak Android SDK, debug APK, emulator,
   urządzenie i Maestro, były sprawdzane dopiero przez jawny runtime preflight;
3. testy obu runnerów były obowiązkową częścią głównego QA i GitHub CI;
4. nie istniał równoległy stary i nowy audit path.

Najpierw zweryfikuj co najmniej:

- aktualny HEAD i stan worktree;
- `docs/plan.md`;
- `package.json`;
- `.github/workflows/qa.yml`;
- `.audit/ux-ui/android.audit.config.json`;
- `.audit/ux-ui/audit.config.json`;
- `.audit/ux-ui/maestro/flows/**`;
- `scripts/runAlgorithmsStage3AndroidAudit.mjs`;
- `scripts/runAlgorithmsStage3IosAudit.mjs`;
- `scripts/validateUxUiAuditConfig.mjs`;
- `scripts/auditRenderProvenance.mjs`;
- `tests/algorithmsStage3AndroidAuditRunner.test.mjs`;
- `tests/algorithmsStage3IosAuditRunner.test.mjs`;
- `tests/algorithmsVisualHarness.test.ts`;
- `audit/algorithms-ui/**`.

Sprawdź szczególnie hipotezy, ale nie uznawaj ich automatycznie za fakty:

- runner Android oczekuje bootstrap flow i pełnego zestawu state flows;
- część wymaganych ścieżek może nie istnieć w clean checkout;
- testy `.test.mjs` mogą nie być wykonywane przez `qa:static`;
- statyczna walidacja może błędnie wymagać lokalnego APK;
- mogą nadal istnieć zastąpione single-state harnessy lub konfiguracje.

Wymagany wynik analizy

1. Zbuduj inventory każdego pliku i ścieżki wymaganej przez konfiguracje i
   runnery.
2. Dla każdej pozycji określ:
   - czy jest committed;
   - czy jest kanonicznym źródłem;
   - czy jest deterministycznie generowana;
   - czy jest wyłącznie artefaktem build/runtime;
   - czy jej brak powinien zatrzymywać static QA, czy native run.
3. Ustal jeden docelowy ownership model dla flow. Nie dopuszczaj hybrydy bez
   jednego właściciela.
4. Zidentyfikuj wszystkie stare ścieżki, które trzeba usunąć po cutoverze.
5. Zidentyfikuj brakujące testy regresyjne i luki CI.

Następnie przygotuj od 2 do 5 promptów wykonawczych. Liczbę wyprowadź z
rzeczywistych zależności, a nie ze z góry przyjętego limitu. Preferuj mniej
promptów, ale każdy ma być mały, atomowy i możliwy do pełnego zakończenia w
jednej sesji Codexa.

Każdy prompt wykonawczy musi zawierać:

- identyfikator zadania, np. `S01-T01`;
- konkretny rezultat, a nie ogólny kierunek;
- potwierdzony stan wyjściowy i dowody z repozytorium;
- dokładne pliki i moduły do sprawdzenia;
- zakres analizy;
- zakres implementacji;
- jawne non-goals;
- wcześniejsze decyzje architektoniczne, których nie wolno naruszyć;
- kryteria akceptacji;
- wymagane komendy testów, typechecku, audit validation i CI-equivalent;
- wymaganie usunięcia zastąpionego kodu, testów i dokumentacji;
- wymaganie kontynuowania pracy po wykryciu naprawialnego błędu;
- format końcowego raportu: starting SHA, ending SHA, zmienione pliki,
  usunięte ścieżki, wyniki komend i pozostałe rzeczywiste blokery.

Każdy prompt musi zaczynać się od polecenia ponownego zweryfikowania aktualnego
stanu repozytorium. Nie może bezkrytycznie przyjmować tego planu jako prawdy.

Zakazy obowiązujące we wszystkich promptach:

- brak fallbacków i silent defaults;
- brak translatorów i compatibility layers;
- brak równoległych V1/V2, old/new lub legacy/current paths;
- brak placeholderów i fikcyjnego evidence;
- brak zmian runtime semantics Practice i Simulation;
- brak zmian persistence, scoringu, contentu i taxonomy;
- brak oznaczania Stage 3 jako zakończonego;
- brak kończenia pracy na samym opisie problemu, jeżeli przyczyna jest
  naprawialna w repozytorium.

Na początku pliku dodaj krótką sekcję:

- zweryfikowany HEAD;
- diagnoza;
- docelowy ownership model;
- kolejność promptów i ich zależności;
- Definition of Story Done.

Nie implementuj story. Utwórz wyłącznie kompletny plik Markdown z promptami.
```

---

# STORY 02 — Patternly: zamrożenie exact SHA i kanoniczny inventory evidence

## Rezultat story

Dla jednej dokładnej wersji aplikacji i jednej dokładnej wersji repozytorium contentowego powstaje kompletny, machine-readable inventory wszystkich wymaganych stanów Practice i Simulation. Każdy stan ma jedno kanoniczne miejsce, wymagane metadata i jawny status: brak evidence, kandydat, zaakceptowany albo blocker.

## Dlaczego ten etap jest osobny

Naprawa runnera nie jest jeszcze audytem produktu. Przed uruchomieniem urządzeń trzeba zamrozić zakres i ustalić, czego dokładnie brakuje. Inaczej screenshoty mogą pochodzić z różnych commitów, być duplikowane albo trafiać do niekanonicznych katalogów.

## Zakres

- zamrożenie exact application SHA i content SHA po zakończeniu Story 01;
- inventory stanów `P-01…P-15` i `S-01…S-29`;
- ustalenie kanonicznych ścieżek flow, screenshotów, manifestów i raportu;
- walidacja provenance istniejących captures;
- identyfikacja duplikatów, błędnych katalogów i brakujących metadata;
- przygotowanie bounded capture planu dla iOS, Androida i systemowej dostępności;
- aktualizacja `docs/plan.md` do dokładnego SHA dopiero po pozytywnej walidacji.

## Poza zakresem

- wykonywanie kompletnego native capture packetu;
- poprawianie UI bez potwierdzonego defektu;
- akceptowanie screenshotów bez provenance;
- uznawanie harnessu za dowód działania screen readera;
- zmiana contentu lub runtime’u.

## Kryteria zakończenia

- [ ] Jeden exact application SHA i jeden exact content SHA są zapisane w inventory.
- [ ] Każdy stan P i S ma dokładnie jeden rekord.
- [ ] Każdy istniejący screenshot został sklasyfikowany i ma zweryfikowane provenance albo został odrzucony.
- [ ] Nie istnieją nieopisane duplikaty ani równoległe katalogi dowodów.
- [ ] Dla każdego braku istnieje dokładny capture task z platformą i ustawieniami.
- [ ] `docs/plan.md` opisuje dokładnie audytowany SHA, nie wcześniejszy snapshot.

## Zależności

Story 01 zakończona i zielona.

## Prompt generujący plik z zadaniami dla Codexa

Wynikowy plik: `2026-W30-story-02-patternly-evidence-inventory-tasks.md`.

```text
Pracujesz nad repozytorium `lukaszkurczab/gcp-ace-trainer` oraz przypiętym
repozytorium `lukaszkurczab/patternly-content`.

Nie wykonuj jeszcze native captures i nie implementuj zmian UI. Najpierw
zweryfikuj, że Story 01 została rzeczywiście zakończona: static audit contract
jest kompletny, runner tests należą do głównego QA, a clean checkout przechodzi
wymagane gate’y.

Następnie utwórz jeden plik Markdown:

`2026-W30-story-02-patternly-evidence-inventory-tasks.md`

Cel story

Zamrozić jeden exact application SHA i jeden exact content SHA oraz zbudować
kanoniczny, machine-readable inventory evidence dla wszystkich stanów Practice
P-01–P-15 i Simulation S-01–S-29.

Najpierw sprawdź co najmniej:

- aktualny HEAD i content lock;
- `docs/plan.md`;
- `audit/algorithms-ui/s3-audit-evidence-rerun.md`;
- `audit/algorithms-ui/p4-visual-qa-report.md`;
- `audit/algorithms-ui/**`;
- `.audit/ux-ui/**`;
- `docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/**`;
- `docs/designs/algorithms_stage3_ui/DESIGN.md`;
- `integration/contracts/algorithms-content/content.lock.json`;
- wszystkie flow P-01–P-15 i S-01–S-29;
- screenshot directories, manifesty i metadata dla iOS i Android.

Weryfikacja musi ustalić dla każdego stanu:

- state ID i semantics;
- platformę;
- flow path;
- screenshot path;
- application SHA;
- content SHA;
- device i OS;
- theme i language;
- screen-reader setting;
- text-size setting;
- reduced-motion setting;
- provenance status;
- comparison status;
- acceptance status;
- blocker, jeżeli evidence nie istnieje.

Sprawdź szczególnie:

- screenshoty w zduplikowanych katalogach, w tym `screenshots/screenshots`;
- identyczne pliki używane jako dowód różnych stanów;
- captures bez exact SHA;
- captures wykonane przed zmianą audytowanej powierzchni;
- rozbieżność między `docs/plan.md` a aktualnym HEAD;
- stany, dla których harness istnieje, ale nie ma dowodu natywnego.

Po analizie wygeneruj małą kolejkę promptów wykonawczych, która doprowadzi do:

1. stworzenia lub naprawy jednego machine-readable inventory;
2. migracji dowodów do jednego kanonicznego układu bez compatibility layer;
3. odrzucenia lub usunięcia niekanonicznych duplikatów dopiero po potwierdzeniu,
   że nie są jedynym dowodem;
4. utworzenia bounded capture planu dla brakujących stanów;
5. aktualizacji execution-control docs do exact SHA.

Każdy prompt ma mieć mały scope, konkretne wejścia i wyjścia, acceptance,
non-goals, komendy walidacyjne oraz raport z exact SHA. Prompty nie mogą jeszcze
wykonywać pełnego Stage 3 capture ani poprawiać UI bez udowodnionego defektu.

Zakazy:

- brak mock evidence;
- brak uznawania harness screenshotu za VoiceOver lub TalkBack evidence;
- brak łączenia captures z różnych SHA w jeden zaakceptowany packet;
- brak placeholderów, `mostly complete`, `deferred pass` i podobnych statusów;
- brak zmian scoringu, persistence, contentu lub runtime semantics;
- brak równoległych inventory lub raportów o tym samym authority.

Na początku pliku umieść:

- verified application SHA;
- verified content SHA;
- diagnozę obecnego inventory;
- docelowy układ kanoniczny;
- kolejność promptów;
- Definition of Story Done.

Nie implementuj story. Utwórz wyłącznie kompletny plik Markdown z promptami.
```

---

# STORY 03 — Patternly: natywne i accessibility closure Stage 3

## Rezultat story

Dla exact application SHA i exact content SHA powstaje jeden kanoniczny raport Stage 3. Każde kryterium kończy się `PASS` albo konkretnym, udokumentowanym blockerem. Każdy naprawiony defekt unieważnia i odtwarza dotyczące go evidence.

## Zakres

- wykonanie brakujących bounded flows na iOS;
- wykonanie krytycznych stanów na Androidzie;
- testy VoiceOver i TalkBack;
- standard text i large text;
- normal motion i reduced motion;
- focus order, labels, announcements i touch targets;
- porównanie z zatwierdzonym design packetem;
- naprawa realnych defektów w minimalnym kanonicznym zakresie;
- ponowne wykonanie evidence po zmianie kodu;
- finalny raport `STAGE_3_PASS` albo `STAGE_3_BLOCKED`.

## Poza zakresem

- obchodzenie braków środowiska screenshotem z harnessu;
- nowe funkcjonalności i zmiany commercial contract;
- billing, localization, remote content, telemetry i nowe tracki;
- zmiana pytań lub approval contractu.

## Kryteria zakończenia

- [ ] Każdy stan P-01–P-15 i S-01–S-29 ma rozstrzygnięty rekord.
- [ ] Android critical states mają prawdziwe Android evidence albo konkretny blocker środowiskowy.
- [ ] VoiceOver i TalkBack mają zapisane wyniki kluczowych interakcji.
- [ ] Large text i reduced motion zostały sprawdzone systemowo.
- [ ] Każde zaakceptowane evidence ma exact app/content SHA i metadata.
- [ ] Każda zmiana UI ma powiązany rerun evidence.
- [ ] Finalny raport jest jednoznaczny i nie używa nieprecyzyjnych statusów.

## Zależności

Story 02 zakończona; exact SHA i inventory są zamrożone.

## Prompt generujący plik z zadaniami dla Codexa

Wynikowy plik: `2026-W30-story-03-patternly-stage3-closure-tasks.md`.

```text
Pracujesz nad repozytorium `lukaszkurczab/gcp-ace-trainer` oraz przypiętym
`lukaszkurczab/patternly-content`.

Nie implementuj od razu zmian. Najpierw potwierdź, że Story 01 i Story 02 są
zamknięte: runner contract jest zielony, testy należą do QA, exact application
SHA i content SHA są zamrożone, a machine-readable inventory obejmuje wszystkie
P-01–P-15 i S-01–S-29.

Następnie utwórz plik:

`2026-W30-story-03-patternly-stage3-closure-tasks.md`

Cel story

Doprowadzić Algorithms Stage 3 do jednej uczciwej decyzji:
`STAGE_3_PASS` albo `STAGE_3_BLOCKED`, opartej na reprodukowalnym evidence dla
jednego exact application SHA i jednego exact content SHA.

Na podstawie aktualnego inventory wygeneruj konkretne prompty wykonawcze dla:

- brakujących bounded iOS flows;
- wymaganych Android critical-state flows;
- VoiceOver;
- TalkBack;
- standard i large text;
- normal i reduced motion;
- focus order, labels, announcements, touch targets i ordering controls;
- design comparison;
- napraw realnych defektów;
- finalnego closure reportu i CI evidence.

Nie twórz jednego ogromnego promptu. Podziel zadania według rzeczywistych
platform, środowisk i zależności. Nie dziel jednak jednego spójnego defektu na
sztuczne fazy. Każdy prompt ma być możliwy do zakończenia w jednej sesji i mieć
jeden namacalny rezultat.

Każdy prompt musi zawierać:

- exact application SHA i content SHA;
- wymagane środowisko, urządzenie i ustawienia systemowe;
- dokładne state IDs i flow paths;
- wymagane screenshoty i metadata;
- kryteria porównania z design packetem;
- zasady provenance;
- acceptance criteria;
- komendy walidacyjne i CI-equivalent;
- regułę unieważnienia starego evidence po zmianie kodu;
- format raportu PASS albo konkretnego blockeru;
- zakaz kończenia na naprawialnym błędzie.

Jeżeli środowisko natywne jest niedostępne, prompt nie może proponować mocka,
harness substitute ani ręcznego wpisania PASS. Ma wymagać zapisania dokładnej
komendy, wyniku, brakującego elementu środowiska i jednego działania potrzebnego
do odblokowania. Story pozostaje wtedy `STAGE_3_BLOCKED`.

W promptach naprawczych obowiązuje:

- minimalny, kanoniczny scope;
- brak zmian runtime semantics, persistence, scoringu i contentu;
- brak fallbacków, compatibility layers i równoległych UI paths;
- po naprawie obowiązkowy rerun wszystkich dotkniętych states;
- brak akceptacji starych captures dla zmienionej powierzchni.

Na początku pliku dodaj:

- exact SHA pair;
- podsumowanie braków z inventory;
- mapę zależności między promptami;
- plan środowisk;
- Definition of Story Done.

Nie wykonuj Stage 3. Utwórz wyłącznie kompletny plik Markdown z promptami.
```

---

# STORY 04 — Fitaly: jeden kanoniczny model deploymentu backendu

## Rezultat story

Rola `main` i `prod` w `fitaly-backend` jest zgodna z faktycznym deploymentem. Istnieje jeden kanoniczny ref wdrożeniowy zawierający aktualne zmiany telemetryki, a dokumentacja i workflow nie opisują konkurencyjnych modeli.

## Dlaczego ten etap poprzedza Release Candidate

Frontendowy release gate wymaga dokładnego SHA backendu. Nie można certyfikować pary release’owej, jeżeli nie wiadomo, czy środowisko wdraża `main`, `prod`, tag czy inny ref. Obecna rozbieżność gałęzi może prowadzić do testowania innego kontraktu niż ten, który działa na środowisku smoke lub produkcji.

## Zakres

- ustalenie faktycznego deployment ref na podstawie konfiguracji Railway, GitHub i dokumentacji;
- porównanie `main` i `prod`, w tym unikalnych commitów obu gałęzi;
- wybór jednego modelu:
  - produkcja wdraża `main` lub exact SHA/tag;
  - `prod` jest wyłącznie kontrolowanym deployment pointerem;
- promocja zweryfikowanego SHA, jeżeli `prod` jest deployment pointerem;
- usunięcie sprzeczności w dokumentacji i workflow;
- pełne backend gates dla kandydata release.

## Poza zakresem

- nowe funkcje backendu;
- niezależny rozwój funkcjonalny na `prod`;
- cherry-picki tworzące równoległą historię poprawek;
- zmiany frontendowego kontraktu API bez potrzeby;
- uruchomienie finalnego Fitaly Release Candidate.

## Kryteria zakończenia

- [ ] Faktyczny deployment ref został potwierdzony dowodem z konfiguracji.
- [ ] `main` i `prod` nie są dwiema niezależnymi liniami rozwoju.
- [ ] Kanoniczny ref zawiera wymagane aktualne zmiany telemetryki.
- [ ] Dokumentacja opisuje faktyczny model.
- [ ] `pytest`, `compileall`, Ruff, Pyright, pip-audit i contract alignment przechodzą.
- [ ] Dokładny backend SHA jest gotowy do użycia w Story 05.

## Zależności i równoległość

Story może rozpocząć się równolegle ze Story 01. Musi zakończyć się przed Story 05.

## Prompt generujący plik z zadaniami dla Codexa

Wynikowy plik: `2026-W30-story-04-fitaly-backend-deployment-tasks.md`.

```text
Pracujesz nad repozytorium `lukaszkurczab/fitaly-backend`.

Nie zmieniaj jeszcze branchy ani konfiguracji. Najpierw samodzielnie zweryfikuj:

- aktualny HEAD `main`;
- aktualny HEAD `prod`;
- merge-base oraz pełny diff `prod...main`;
- unikalne commity po obu stronach;
- konfigurację Railway i innych deployment workflows dostępną w repozytorium;
- `CONTRIBUTING.md` i `AGENTS.md`;
- reguły promocji, release i rollbacku;
- aktualne zmiany telemetryki oraz ich testy;
- wymagane contract fixtures.

Następnie utwórz plik:

`2026-W30-story-04-fitaly-backend-deployment-tasks.md`

Cel story

Ustanowić jeden kanoniczny model deploymentu backendu Fitaly i przygotować
jeden exact backend SHA do Release Candidate.

Stan początkowy do sprawdzenia, nie do bezkrytycznego przyjęcia:

- `main` i `prod` są rozbieżne;
- `main` może zawierać nowsze zmiany telemetryki;
- `prod` może mieć własne commity promocyjne;
- dokumentacja może nie rozstrzygać jednoznacznie, który ref jest wdrażany.

Na podstawie rzeczywistych dowodów rozstrzygnij, który z modeli obowiązuje:

A. produkcja wdraża `main`, exact SHA albo tag;
B. `prod` jest wyłącznie kontrolowanym deployment pointerem przyjmującym
   zweryfikowane zmiany z `main`.

Model, w którym `main` i `prod` są niezależnymi liniami rozwoju, jest
niedopuszczalny.

Wygeneruj małą kolejkę promptów wykonawczych obejmującą tylko niezbędne etapy:

- audyt i zapis dowodu deployment ref;
- ewentualne uporządkowanie dokumentacji i workflow;
- bezpieczną promocję exact SHA, jeżeli jest potrzebna;
- pełne backend quality gates;
- potwierdzenie exact deployed/candidate SHA dla Story 05.

Każdy prompt musi zawierać:

- potwierdzony stan wyjściowy;
- dokładne refs i SHA;
- pliki do sprawdzenia;
- jeden rezultat;
- zakres i non-goals;
- ochronę przed zmianą realnych danych użytkowników;
- kryteria akceptacji;
- wymagane komendy:
  `pytest`, `python -m compileall app`, `ruff check .`, Pyright,
  `pip-audit -r requirements.txt` i contract alignment;
- zasady bezpiecznej promocji bez cherry-picków i równoległych poprawek;
- format raportu z starting SHA, ending SHA, deployed ref i wynikami gates.

Jeżeli faktycznego deployment ref nie można ustalić z dostępnych źródeł,
nie generuj promptu zgadującego promocję. Wygeneruj najpierw konkretny prompt
odblokowujący, który wskazuje dokładnie, jakiego dowodu brakuje i gdzie należy
go pozyskać. Nie twórz fallbackowego modelu deploymentu.

Zakazy:

- brak funkcjonalnych zmian na `prod` niezależnych od `main`;
- brak cherry-picków jako stałego procesu promocji;
- brak dwóch konkurencyjnych opisów deploymentu;
- brak zmian API bez aktualizacji obu repozytoriów i fixtures;
- brak deklarowania deployed SHA bez dowodu środowiska;
- brak nowych funkcji.

Na początku pliku dodaj:

- zweryfikowane refs i SHA;
- diagram docelowego modelu branch/deploy;
- kolejność promptów;
- Definition of Story Done.

Nie implementuj story. Utwórz wyłącznie kompletny plik Markdown z promptami.
```

---

# STORY 05 — Fitaly: dokładna para release’owa i pełny Release Candidate

## Rezultat story

Jedna dokładna para `mobile SHA + deployed backend SHA` przechodzi istniejący workflow Release Candidate i generuje prawdziwy release-evidence artifact. Jeżeli zewnętrzny warunek jest niedostępny, story kończy się jednym konkretnym blockerem, bez fikcyjnego statusu gotowości.

## Zakres

- potwierdzenie exact SHA frontendu i backendu;
- pełne backend gates;
- pełne frontend gates i ukierunkowane testy;
- cross-repo fixture alignment;
- potwierdzenie SHA raportowanego przez smoke environment;
- rzeczywiste delete evidence na zatwierdzonym koncie testowym;
- smoke telemetry, backup i restore drill;
- uruchomienie platformowego release gate’u;
- pobranie i inspekcja finalnego release-evidence artifactu.

## Poza zakresem

- nowe funkcje Fitaly;
- rozbudowa release workflow przed jego pełnym wykonaniem;
- uproszczony równoległy workflow;
- fikcyjne delete, backup, restore lub telemetry evidence;
- przywracanie fallbacków reminderów albo telemetryki;
- trwała kopia eksportowanego PDF.

## Kryteria zakończenia

- [ ] Exact mobile SHA i backend SHA są zapisane.
- [ ] Backend SHA odpowiada rzeczywiście wdrożonemu środowisku smoke.
- [ ] Wszystkie wymagane backend i frontend gates przechodzą.
- [ ] Cross-repo fixtures są zgodne.
- [ ] Delete evidence, telemetry smoke, backup i restore są rzeczywiste.
- [ ] Workflow Release Candidate jest zielony i wytworzył artifact albo zatrzymał się na jednym nazwanym zewnętrznym blockerze.
- [ ] Nie powstał alternatywny, osłabiony release path.

## Zależności

Story 04 zakończona. Może rozpocząć się po Story 04 niezależnie od tego, czy Story 03 oczekuje na zewnętrzne środowisko Android, o ile nie konkuruje o to samo środowisko lub czas właściciela.

## Prompt generujący plik z zadaniami dla Codexa

Wynikowy plik: `2026-W30-story-05-fitaly-release-pair-tasks.md`.

```text
Pracujesz na dwóch repozytoriach:

- `lukaszkurczab/fitaly`;
- `lukaszkurczab/fitaly-backend`.

Nie uruchamiaj od razu release’u. Najpierw zweryfikuj aktualny stan obu repo,
status Story 04, dokładny backend deployment ref oraz dostępne workflow i
środowiska.

Następnie utwórz plik:

`2026-W30-story-05-fitaly-release-pair-tasks.md`

Cel story

Certyfikować jedną dokładną parę release’ową Fitaly:

- mobile SHA;
- backend SHA rzeczywiście wdrożony do środowiska używanego przez smoke gate.

Najpierw sprawdź w frontendzie co najmniej:

- HEAD i stan worktree;
- `.github/workflows/release-candidate.yml`;
- `.github/workflows/ci.yml`;
- `.github/workflows/e2e-smoke-gate.yml`;
- skrypty release evidence i smoke verification;
- telemetry, reminders i export flows;
- targeted tests i contract fixtures;
- `AGENTS.md`.

W backendzie sprawdź co najmniej:

- exact canonical deployment SHA ustalony w Story 04;
- telemetry routes, schemas i service;
- contract fixtures;
- backup i restore workflows;
- firestore i storage rules;
- pełny zestaw quality gates;
- `AGENTS.md` i aktualną dokumentację deploymentu.

Wygeneruj uporządkowane prompty wykonawcze dla rzeczywistych zależności, np.:

- preflight i exact SHA pair lock;
- backend gate execution;
- frontend gate execution;
- cross-repo contract alignment;
- smoke deployed-SHA verification;
- manual delete evidence preparation i validation;
- backup/restore verification;
- uruchomienie Release Candidate;
- inspekcja finalnego artifactu i decyzja release-ready albo blocked.

Nie wymuszaj tej listy, jeżeli repozytorium wskazuje inną właściwą kolejność.
Nie łącz wszystkich działań w jeden ogromny prompt. Każdy prompt ma mieć jeden
rezultat i ma być możliwy do zakończenia w jednej sesji.

Każdy prompt musi zawierać:

- exact frontend i backend SHA;
- wymagane repozytoria i ścieżki;
- wymagane środowisko i sekrety bez ujawniania ich wartości;
- zakres i non-goals;
- kryteria akceptacji;
- konkretne testy, typecheck, lint, E2E i workflow;
- zasady bezpieczeństwa dla danych i disposable account;
- brak zgody na placeholder evidence;
- format raportu z run ID, job statusami i artifactem;
- regułę, że naprawialny błąd jest naprawiany i gate uruchamiany ponownie;
- regułę, że zewnętrzny blocker ma być opisany dokładnie, bez deklarowania
  release-ready.

Obowiązkowe zakazy:

- nie twórz uproszczonego alternatywnego release workflow;
- nie omijaj manual delete evidence;
- nie wyłączaj smoke telemetry, backupu, restore ani exact SHA checks;
- nie przywracaj fallbacku reminderów ani telemetryki;
- nie przywracaj trwałej kopii eksportowanego PDF;
- nie twórz compatibility layer między frontendem i backendem;
- nie wykonuj destrukcyjnych operacji na realnych danych użytkowników;
- nie dodawaj nowych funkcji.

Na początku pliku dodaj:

- verified frontend SHA;
- verified backend SHA i deployment ref;
- mapę wymaganych gate’ów;
- zależności między promptami;
- Definition of Story Done;
- jednoznaczną definicję `RELEASE_PAIR_PASS` i `RELEASE_PAIR_BLOCKED`.

Nie wykonuj release’u. Utwórz wyłącznie kompletny plik Markdown z promptami.
```

---

# Kolejność wykonania w tygodniu

## Ścieżka główna — Patternly

1. Story 01 — naprawa kontraktu audytu.
2. Story 02 — exact SHA i inventory evidence.
3. Story 03 — native i accessibility closure.

Nie przechodzić do kolejnej story tylko dlatego, że poprzednia jest „prawie gotowa”. Każdy etap musi spełnić własne kryteria zakończenia.

## Ścieżka równoległa — Fitaly

1. Story 04 może rozpocząć się równolegle ze Story 01.
2. Story 05 rozpoczyna się po ustaleniu i zweryfikowaniu kanonicznego backend deployment SHA.

## Podział uwagi

- Patternly: około dwóch trzecich dostępnego czasu.
- Fitaly: około jednej trzeciej, głównie na deployment contract i release evidence.

Nie jest wymagane tworzenie commitów w `fitaly`, jeżeli aktualny frontend przejdzie wszystkie gate’y bez zmian.

# Definition of Week Done

- [ ] Story 01 zakończona: Patternly ma wiarygodny, obowiązkowy audit gate.
- [ ] Story 02 zakończona: exact SHA pair i pełne inventory są kanoniczne.
- [ ] Story 03 zakończona wynikiem `STAGE_3_PASS` albo jednym zestawem konkretnych zewnętrznych blockerów.
- [ ] Story 04 zakończona: Fitaly backend ma jeden kanoniczny deployment model i exact SHA.
- [ ] Story 05 zakończona wynikiem `RELEASE_PAIR_PASS` albo konkretnym zewnętrznym blockerem bez fałszywej gotowości.
- [ ] Nie rozpoczęto billing SDK, remote content, localization runtime, nowych tracków ani nowych funkcji Fitaly.
- [ ] Nie pozostawiono nowych fallbacków, compatibility layers ani równoległych starych ścieżek.
- [ ] Każde repozytorium kończy wykonane zadania z zielonymi wymaganymi gate’ami i czystym worktree.
