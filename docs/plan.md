# Patternly — Atomic Work Loop

Ten plik służy do wielokrotnego uruchamiania Codexa w krótkim loopie. Jedna iteracja wykonuje **dokładnie jeden atomowy task**, tworzy osobny commit i bezpośrednio pushuje go do właściwego brancha głównego.

## Repozytoria i branche

| Skrót     | Repozytorium                      | Branch docelowy |
| --------- | --------------------------------- | --------------- |
| `app`     | `lukaszkurczab/gcp-ace-trainer`   | `main`          |
| `content` | `lukaszkurczab/patternly-content` | `master`        |

Nie twórz branchy roboczych. Nie otwieraj PR-ów. Nie używaj force-push.

Dla taska cross-repo kolejność jest zawsze:

```text
content/master
→ push i weryfikacja remote head
→ synchronizacja bundle/lock w aplikacji
→ app/main
→ push i weryfikacja remote head
```

## Prompt sterujący loopem

Skopiuj poniższy prompt do Codexa przy każdej iteracji:

```text
Pracujesz w Patternly Atomic Work Loop.

Repozytoria:
- aplikacja: lukaszkurczab/gcp-ace-trainer, branch main
- content: lukaszkurczab/patternly-content, branch master

Odczytaj docs/patternly-atomic-work-loop.md z repozytorium aplikacji.
Wykonaj dokładnie jeden pierwszy gotowy task, którego completion commit nie istnieje jeszcze we właściwym repozytorium.

Completion marker:
- task single-repo jest wykonany wyłącznie wtedy, gdy właściwy branch zawiera commit z subjectem zaczynającym się od `Txx:`;
- task cross-repo jest wykonany wyłącznie wtedy, gdy oba wymagane branche zawierają commit z subjectem zaczynającym się od `Txx:`.

Procedura:
1. Zlokalizuj oba checkouty i potwierdź remote URL.
2. W każdym repo potrzebnym do taska:
   - przerwij, jeśli worktree jest brudny;
   - `git fetch origin`;
   - checkout bezpośrednio na main albo master;
   - `git pull --rebase origin <branch>`;
   - nigdy nie używaj force-push.
3. Sprawdź zależności taska. Nie wykonuj taska, jeśli wcześniejszy wymagany task nie ma completion commitu.
4. Odczytaj kanoniczny kontrakt i pliki należące do ownera zachowania.
5. Zmień dokładnie jedno zachowanie opisane w tasku. Bez pobocznych refactorów.
6. Przy zmianie zachowania zaktualizuj kanoniczny kontrakt w tym samym commicie.
7. Przy zmianie UI użyj wyłącznie zatwierdzonego designReferenceId. Jeśli go brak:
   - nie projektuj;
   - nie commituj;
   - zwróć `BLOCKED_DESIGN` i zakończ iterację.
8. Dodaj lub zaktualizuj szybki test na najniższej sensownej warstwie.
9. Nie uruchamiaj pełnego Maestro, chyba że bieżący task to T61 albo T62.
10. Uruchom dokładnie verification opisane w tasku oraz niezbędne szybkie gate’y repo.
11. Sprawdź diff, dead code, stare symbole i niezamierzone zmiany.
12. Commit:
   - subject musi być dokładnie zgodny z taskiem i zaczynać się od `Txx:`;
   - jeden task = jeden commit na repo;
   - cross-repo może mieć po jednym commicie w każdym repo.
13. Push bezpośrednio:
   - app → `origin main`;
   - content → `origin master`.
14. Po pushu wykonaj fetch i potwierdź, że remote head wskazuje wypchnięty commit.
15. Zakończ. Nie przechodź automatycznie do kolejnego taska.

Jeżeli push zostanie odrzucony, branch się rozjedzie, pojawi się konflikt, dirty worktree, brak dostępu albo niejasny kontrakt:
- nie używaj force;
- nie twórz obejścia;
- nie wykonuj kolejnego taska;
- podaj precyzyjny blocker.

Raport końcowy jednej iteracji:
- task;
- repo i branch;
- starting SHA;
- ending SHA;
- zmienione pliki;
- requirement IDs;
- testy i wyniki;
- design reference, jeśli dotyczy;
- usunięty dead code;
- push result;
- remaining risks.
```

## Zasady atomowości

1. Jedna iteracja zmienia jedno zachowanie lub jeden kontrakt.
2. Jeden task nie może zawierać „przy okazji” refaktoryzacji sąsiednich modułów.
3. Test ma działać w sekundach, chyba że task jest jawnie odbiorczy.
4. Maestro występuje wyłącznie w T61 i T62.
5. Design review nie jest końcową kosmetyką. User-facing implementacja wymaga zatwierdzonej referencji przed zmianą.
6. Dokumentacja nie jest osobnym backlogiem. Zmiana zachowania i kanonicznego kontraktu trafiają do tego samego commitu.
7. `main` i `master` są jedynymi branchami docelowymi.
8. Nigdy nie używaj `git push --force`, `--force-with-lease` ani resetu remote brancha.
9. Task cross-repo jest nieukończony do czasu poprawnego pushu obu repozytoriów.
10. Po każdej iteracji Codex kończy pracę. Następna iteracja zaczyna się ponownym użyciem promptu sterującego.

## Kolejność milestone’ów

```text
M0  T01–T12   jedno źródło prawdy
M1  T13–T22   Algorithms save/advance
M2  T23–T28   timer i concurrency
M3  T29–T35   design Algorithms Simulation
M4  T36–T42   ochrona Custom Practice
M5  T43–T53   kanoniczne Certification
M6  T54–T57   content governance
M7  T58–T64   CI i odbiór release candidate
```

## Taski

### T01 — Utworzyć kanoniczny kontrakt produktu

**Repo/branch:** `app/main`  
**Zakres:** Dodaj `docs/canonical-product-contract.yaml` i jego schemat. Plik ma być jedynym normatywnym źródłem zachowania produktu; dokumenty narracyjne nie mogą go nadpisywać.  
**Akceptacja:** Parser akceptuje poprawny kontrakt i odrzuca nieznane pola, brak wersji oraz duplikaty identyfikatorów.  
**Commit subject:** `T01: add canonical product contract`

### T02 — Przenieść macierz trybów Algorithms

**Repo/branch:** `app/main`  
**Zakres:** Zapisz w kontrakcie osiem trybów Algorithms: stabilne ID, etykiety, długości, scope, shortening, feedback, timer i reinsert.  
**Akceptacja:** Test kompletności wymaga dokładnie ośmiu trybów i wszystkich obowiązkowych pól.  
**Commit subject:** `T02: define algorithms mode matrix`

### T03 — Zamknąć kontrakt Custom Practice

**Repo/branch:** `app/main`  
**Zakres:** Zapisz: długości 10/20/40, `afterEachAnswer`, `atSessionEnd`, Guided Practice blueprint, jawny mental unit, profile-owned reinsert i wspólny lifecycle.  
**Akceptacja:** Test kontraktu nie pozwala usunąć ani zmienić żadnej z tych własności bez jawnej aktualizacji requirementu.  
**Commit subject:** `T03: lock custom practice contract`

### T04 — Przenieść macierz trybów Certification

**Repo/branch:** `app/main`  
**Zakres:** Zapisz siedem kanonicznych trybów Certification. Dla każdego dodaj status kontraktu, implementacji i weryfikacji.  
**Akceptacja:** Każdy tryb ma stabilne ID, ownera i jawny status; brak implementacji nie usuwa trybu z produktu.  
**Commit subject:** `T04: define certification mode matrix`

### T05 — Zdefiniować komendy użytkownika

**Repo/branch:** `app/main`  
**Zakres:** Dodaj kanoniczne komendy: submit, next, save, save-and-continue, navigator-jump, finish, leave-resumable, abandon i recover.  
**Akceptacja:** Każde user-facing CTA mapuje się na dokładnie jedną application command.  
**Commit subject:** `T05: define canonical user commands`

### T06 — Zdefiniować state machine sesji

**Repo/branch:** `app/main`  
**Zakres:** Zapisz dozwolone stany i przejścia practice oraz simulation, w tym recovery.  
**Akceptacja:** Test tabelaryczny akceptuje wyłącznie dozwolone przejścia i odrzuca pozostałe.  
**Commit subject:** `T06: define canonical session state machine`

### T07 — Zdefiniować kontrakt współbieżności

**Repo/branch:** `app/main`  
**Zakres:** Określ serializację save, navigation, timer checkpoint, foreground transition, finalization i abandonment dla jednej aktywnej sesji.  
**Akceptacja:** Test kontraktu nie dopuszcza równoległych mutacji tej samej sesji.  
**Commit subject:** `T07: define simulation concurrency contract`

### T08 — Ustalić parametry timera

**Repo/branch:** `app/main`  
**Zakres:** W kontrakcie rozdziel UI refresh, durable checkpoint interval, lifecycle checkpoints i maksymalny drift.  
**Akceptacja:** Wszystkie wartości są wersjonowane i wymagane; UI refresh nie oznacza zapisu MMKV co sekundę.  
**Commit subject:** `T08: define timer cadence and drift`

### T09 — Dodać rejestr design references

**Repo/branch:** `app/main`  
**Zakres:** Dodaj model: reference ID, ekran/stan, ścieżka do wzorca, wersja, status approval i owner.  
**Akceptacja:** User-facing task nie może mieć statusu ready bez zatwierdzonej referencji.  
**Commit subject:** `T09: add design reference registry`

### T10 — Dodać mapowanie requirement → test

**Repo/branch:** `app/main`  
**Zakres:** Każde wymaganie otrzymuje stabilny identyfikator i listę testów pokrywających.  
**Akceptacja:** Walidator wykrywa wymagania bez testów i testy wskazujące nieistniejące wymagania.  
**Commit subject:** `T10: map requirements to tests`

### T11 — Usunąć konkurencyjne definicje z docs

**Repo/branch:** `app/main`  
**Zakres:** Zastąp ręcznie utrzymywane, powielone macierze trybów i wartości odnośnikami lub generowanymi fragmentami z kontraktu.  
**Akceptacja:** Nie pozostaje ręcznie zduplikowana definicja trybów, długości, feedbacku, reinsertu lub timera.  
**Commit subject:** `T11: remove duplicated normative docs`

### T12 — Dodać merge gate kontraktu

**Repo/branch:** `app/main`  
**Zakres:** Dodaj walidację wymagającą requirement ID, zmiany kontraktu przy zmianie zachowania, testu i design reference dla UI.  
**Akceptacja:** Kontrola lokalna i CI odrzucają zmianę zachowania bez wymaganych elementów.  
**Commit subject:** `T12: enforce contract change gate`

### T13 — Test trwałego zapisu jednej odpowiedzi symulacji

**Repo/branch:** `app/main`  
**Zakres:** Dodaj application-level test: start, save response, reload draft, weryfikacja revision i response.  
**Akceptacja:** Test działa bez Reacta i Maestro, kończy się w sekundach.  
**Commit subject:** `T13: test durable simulation response save`

### T14 — Dodać saveSimulationResponseAndContinue

**Repo/branch:** `app/main`  
**Zakres:** Wprowadź jedną application command reprezentującą działanie użytkownika „Save and continue”.  
**Akceptacja:** Ekran nie składa tej operacji z dwóch niezależnych wywołań.  
**Commit subject:** `T14: add save and continue command`

### T15 — Połączyć zapis draftu i przesunięcie pozycji

**Repo/branch:** `app/main`  
**Zakres:** Komenda zapisuje revision, weryfikuje ją, przesuwa pozycję, weryfikuje pozycję i publikuje następną projekcję.  
**Akceptacja:** Po wykonaniu pozycja wynosi 2, a odpowiedź z pozycji 1 pozostaje trwała.  
**Commit subject:** `T15: persist response and advance position`

### T16 — Obsłużyć częściowy sukces save/advance

**Repo/branch:** `app/main`  
**Zakres:** Dodaj jawny recovery state, gdy odpowiedź jest trwała, lecz advance nie został potwierdzony.  
**Akceptacja:** Retry nie dubluje odpowiedzi ani nie tworzy zbędnej revision.  
**Commit subject:** `T16: recover partial save and advance`

### T17 — Podłączyć CTA Save and continue

**Repo/branch:** `app/main`  
**Zakres:** Na pytaniach innych niż ostatnie CTA wywołuje wyłącznie komendę z T14.  
**Akceptacja:** Test komponentu potwierdza label, disabled state i pojedynczą komendę.  
**Commit subject:** `T17: wire save and continue CTA`

### T18 — Zdefiniować ostatnie pytanie symulacji

**Repo/branch:** `app/main`  
**Zakres:** Ostatnia odpowiedź zapisuje draft i przechodzi do zatwierdzonego review/finish state bez wyjścia poza plan.  
**Akceptacja:** Test obejmuje answered i unanswered final occurrence.  
**Commit subject:** `T18: define final simulation question behavior`

### T19 — Obsłużyć navigator z niezapisaną zmianą

**Repo/branch:** `app/main`  
**Zakres:** Zaimplementuj wyłącznie zachowanie wskazane przez zatwierdzony kontrakt/design: save-and-jump, block albo approved confirmation.  
**Akceptacja:** Nie wolno po cichu utracić lokalnej odpowiedzi.  
**Commit subject:** `T19: handle unsaved navigator transition`

### T20 — Test relaunch po pierwszej odpowiedzi

**Repo/branch:** `app/main`  
**Zakres:** Po ponownym złożeniu composition root odpowiedź 1, pozycja 2, timer checkpoint i jeden active session pozostają zgodne.  
**Akceptacja:** Test działa na rzeczywistych memory repositories.  
**Commit subject:** `T20: test simulation relaunch after first answer`

### T21 — Zabezpieczyć podwójne kliknięcie CTA

**Repo/branch:** `app/main`  
**Zakres:** Dwa szybkie wywołania nie mogą utworzyć dwóch zapisów ani przesunąć o dwie pozycje.  
**Akceptacja:** Test współbieżny potwierdza idempotencję/serializację.  
**Commit subject:** `T21: prevent duplicate save and continue`

### T22 — Pełne 40 pytań na poziomie aplikacji

**Repo/branch:** `app/main`  
**Zakres:** Przejdź cały immutable plan bez Maestro i sfinalizuj sesję.  
**Akceptacja:** 40 odpowiedzi, 40 occurrence IDs, jeden result, brak active session i draftu.  
**Commit subject:** `T22: test full algorithms simulation lifecycle`

### T23 — Aktualizować widoczny timer co sekundę

**Repo/branch:** `app/main`  
**Zakres:** UI korzysta z projekcji runtime i odświeża label co sekundę bez zapisu MMKV co sekundę.  
**Akceptacja:** Test kontrolowanym zegarem potwierdza kolejne etykiety.  
**Commit subject:** `T23: refresh simulation timer each second`

### T24 — Wdrożyć durable checkpoint interval

**Repo/branch:** `app/main`  
**Zakres:** Checkpoint trwały używa wartości z kontraktu T08.  
**Akceptacja:** Test kontrolowanym zegarem potwierdza dokładną liczbę zapisów.  
**Commit subject:** `T24: implement timer checkpoint interval`

### T25 — Checkpoint przy opuszczeniu foreground

**Repo/branch:** `app/main`  
**Zakres:** Zamknij aktywny foreground segment i zapisz go przed przejściem w background.  
**Akceptacja:** Czas w tle nie zmniejsza Algorithms countdown.  
**Commit subject:** `T25: checkpoint timer on background`

### T26 — Checkpoint przed finalizacją

**Repo/branch:** `app/main`  
**Zakres:** Manual finish zapisuje aktualny segment przed freeze draftu.  
**Akceptacja:** Wynik czasu korzysta z ostatniego zweryfikowanego checkpointu.  
**Commit subject:** `T26: checkpoint timer before finalization`

### T27 — Serializować timer z save/navigation

**Repo/branch:** `app/main`  
**Zakres:** Timer checkpoint nie może nadpisać draft revision ani current position.  
**Akceptacja:** Test uruchamia checkpoint i save-and-continue równolegle.  
**Commit subject:** `T27: serialize timer and simulation mutations`

### T28 — Test force-close wokół checkpointu

**Repo/branch:** `app/main`  
**Zakres:** Dodaj przypadki zamknięcia tuż przed i tuż po checkpoint.  
**Akceptacja:** Odtworzony czas mieści się w zadeklarowanym drift bound.  
**Commit subject:** `T28: test timer force close boundaries`

### T29 — Zatwierdzić referencję active simulation screen

**Repo/branch:** `app/main`  
**Zakres:** Zarejestruj zatwierdzony wzorzec dla top bar, timer, counter, question, controls, save state, CTA, spacing i hierarchy. Nie projektuj samodzielnie.  
**Akceptacja:** Jeśli brak wzorca zatwierdzonego przez ownera, zakończ task jako `BLOCKED_DESIGN` bez zmian i bez pushu.  
**Commit subject:** `T29: register active simulation design reference`

### T30 — Doprowadzić active simulation screen do fidelity

**Repo/branch:** `app/main`  
**Zakres:** Zmień wyłącznie prezentację zgodnie z referencją T29; bez zmian lifecycle.  
**Akceptacja:** Screenshot comparison, component tests i manual design review przechodzą.  
**Commit subject:** `T30: match active simulation design`

### T31 — Zatwierdzić referencję navigatora

**Repo/branch:** `app/main`  
**Zakres:** Zarejestruj wzorzec current, answered/saved, unanswered, frozen i disabled. Nie projektuj bez approval.  
**Akceptacja:** Brak zatwierdzonej referencji oznacza `BLOCKED_DESIGN`.  
**Commit subject:** `T31: register simulation navigator design`

### T32 — Doprowadzić navigator do fidelity

**Repo/branch:** `app/main`  
**Zakres:** Wdrożenie wizualne i accessibility odpowiadają T31; bez correctness przed finalizacją.  
**Akceptacja:** Screenshot comparison i testy stanów przechodzą.  
**Commit subject:** `T32: match simulation navigator design`

### T33 — Zatwierdzić saving/error/frozen/finalizing

**Repo/branch:** `app/main`  
**Zakres:** Zarejestruj osobne wzorce i dozwolone CTA dla każdego stanu.  
**Akceptacja:** Brak wzorca któregokolwiek stanu blokuje task.  
**Commit subject:** `T33: register simulation operation state designs`

### T34 — Wdrożyć stany terminalne i recovery

**Repo/branch:** `app/main`  
**Zakres:** UI renderuje wyłącznie stan i akcje zwrócone przez application layer.  
**Akceptacja:** Nie istnieje generic retry ani wymyślony fallback.  
**Commit subject:** `T34: implement simulation recovery designs`

### T35 — Accessibility audit symulacji

**Repo/branch:** `app/main`  
**Zakres:** Sprawdź screen reader, focus order, Dynamic Type, touch targets, reduced motion i timer announcements.  
**Akceptacja:** Zapisz wyniki i napraw wyłącznie problemy w zakresie symulacji.  
**Commit subject:** `T35: audit simulation accessibility`

### T36 — Selektor długości Custom Practice

**Repo/branch:** `app/main`  
**Zakres:** Udostępnij wyłącznie 10, 20 i 40.  
**Akceptacja:** Test setup/config odrzuca wszystkie inne wartości.  
**Commit subject:** `T36: restore custom practice length selector`

### T37 — Selektor feedback timing

**Repo/branch:** `app/main`  
**Zakres:** Udostępnij `afterEachAnswer` i `atSessionEnd` jako jawny wybór.  
**Akceptacja:** Brak wartości lub wartość trzecia jest błędem.  
**Commit subject:** `T37: restore custom feedback timing selector`

### T38 — Ścieżka Custom afterEachAnswer

**Repo/branch:** `app/main`  
**Zakres:** Zweryfikuj submit, journal, feedback, advance i summary.  
**Akceptacja:** Szybki application integration test pokrywa całą ścieżkę.  
**Commit subject:** `T38: verify custom immediate feedback flow`

### T39 — Withholding dla Custom atSessionEnd

**Repo/branch:** `app/main`  
**Zakres:** Przed zakończeniem ukryj correctness, Reason, Details i distractor explanations.  
**Akceptacja:** Test negatywny sprawdza każdy element po każdym submit.  
**Commit subject:** `T39: withhold custom session end feedback`

### T40 — Canonical summary Custom atSessionEnd

**Repo/branch:** `app/main`  
**Zakres:** Po zakończeniu feedback jest ładowany z canonical result, nie ze stanu komponentu.  
**Akceptacja:** Test relaunch przed otwarciem summary nadal pokazuje pełny wynik.  
**Commit subject:** `T40: load custom feedback from canonical summary`

### T41 — Regresja reinsert w Custom Practice

**Repo/branch:** `app/main`  
**Zakres:** Custom Practice używa profile-owned reinsert i nie przyjmuje learner override.  
**Akceptacja:** Test obejmuje eligible, skipped i invalid override.  
**Commit subject:** `T41: protect custom practice reinsert`

### T42 — Design QA Custom Practice

**Repo/branch:** `app/main`  
**Zakres:** Zarejestruj i zastosuj zatwierdzone referencje setup, runner i summary. Nie zmieniaj semantyki.  
**Akceptacja:** Brak approval blokuje task; po wdrożeniu wymagany screenshot review.  
**Commit subject:** `T42: review custom practice design`

### T43 — Dodać GCP ExamExperienceProfile

**Repo/branch:** `content/master`  
**Zakres:** W repo contentowym dodaj wersjonowany profil: źródło, checked date, duration, count, blueprint, navigation, answer changes, flagging, navigator, sections i timeout.  
**Akceptacja:** Walidator profilu i content build przechodzą.  
**Commit subject:** `T43: add GCP exam experience profile`

### T44 — Aplikacja konsumuje ExamExperienceProfile

**Repo/branch:** `app/main`  
**Zakres:** Usuń hardcoded 50, 120 minut i 12/15/13/10 z runtime; konfiguracja pochodzi z profilu.  
**Akceptacja:** Test zmienia fixture profilu bez zmiany runtime i obserwuje nową sesję.  
**Commit subject:** `T44: consume certification exam profile`

### T45 — Diagnostic Baseline vertical slice

**Repo/branch:** `both: content/master → app/main`  
**Zakres:** Najpierw content contract/blueprint, potem runtime, setup, runner, summary i testy.  
**Akceptacja:** Jeden tryb, dokładnie 40 unikalnych pytań, brak shortening i jawne błędy.  
**Commit subject:** `T45: implement diagnostic baseline`

### T46 — Focus Practice vertical slice

**Repo/branch:** `both: content/master → app/main`  
**Zakres:** Jawny wybór topicu, 10/20/40, shortening wyłącznie w topicu.  
**Akceptacja:** Brak domyślnego topicu i brak uzupełniania sibling topics.  
**Commit subject:** `T46: implement focus practice`

### T47 — Scenario Practice vertical slice

**Repo/branch:** `both: content/master → app/main`  
**Zakres:** Jawny wybór competency i tylko scenario-valid content.  
**Akceptacja:** Testy zakresu, shortening i braku widening przechodzą.  
**Commit subject:** `T47: implement scenario practice`

### T48 — Certification Weak Area Review

**Repo/branch:** `both: content/master → app/main`  
**Zakres:** Eligible review evidence, 10/20, shortening i persistent-resolution policy.  
**Akceptacja:** Nie ma substitute practice przy pustej kolejce.  
**Commit subject:** `T48: implement certification weak area review`

### T49 — Mixed Practice vertical slice

**Repo/branch:** `both: content/master → app/main`  
**Zakres:** Wersjonowany blueprint, unikalny interleaved content i jawna polityka shortening.  
**Akceptacja:** Test selection determinism i uniqueness przechodzi.  
**Commit subject:** `T49: implement certification mixed practice`

### T50 — Quick Review vertical slice

**Repo/branch:** `both: content/master → app/main`  
**Zakres:** Maksymalnie 10 due items, bez uzupełniania not-yet-due lub unrelated content.  
**Akceptacja:** Test empty, partial i full due queue przechodzi.  
**Commit subject:** `T50: implement certification quick review`

### T51 — Usunąć stare cloud mode IDs

**Repo/branch:** `both: content/master → app/main`  
**Zakres:** Usuń `cloud-practice`, `cloud-review`, stare routes, declarations, aliases, testy i dead code po pełnym cutover.  
**Akceptacja:** Negative suite potwierdza brak starych ID.  
**Commit subject:** `T51: remove legacy cloud mode ids`

### T52 — Certification design QA

**Repo/branch:** `app/main`  
**Zakres:** Zarejestruj i zastosuj zatwierdzone referencje setup, practice runner, exam runner, summary, review i expiry/finalization.  
**Akceptacja:** Brak zatwierdzonego wzorca blokuje odpowiedni ekran; wymagany screenshot review.  
**Commit subject:** `T52: review certification design`

### T53 — Profile-driven Certification regression

**Repo/branch:** `app/main`  
**Zakres:** Pełny application-level egzamin: early/mid/late resume, expiry, unanswered, review, mismatch i dokładnie jedna finalizacja.  
**Akceptacja:** Bez Maestro; testy działają deterministycznie.  
**Commit subject:** `T53: add certification profile regression suite`

### T54 — Wybrać jeden model content approval

**Repo/branch:** `both: app/main → content/master`  
**Zakres:** Zapisz jedną decyzję governance: real human editorial approval albo jawna owner activation. Usuń normatywne odniesienia do modelu odrzuconego.  
**Akceptacja:** Kontrakt i pipeline mają dokładnie jeden model.  
**Commit subject:** `T54: choose canonical content approval model`

### T55 — Usunąć sprzeczne skrypty i records

**Repo/branch:** `content/master`  
**Zakres:** Usuń automaty udające human review oraz zakończone jednorazowe migratory, jeśli nie należą do wybranego modelu.  
**Akceptacja:** Search/negative tests potwierdzają brak starej ścieżki.  
**Commit subject:** `T55: remove obsolete content governance paths`

### T56 — Dostosować release gate

**Repo/branch:** `content/master`  
**Zakres:** Pipeline weryfikuje dokładnie model wybrany w T54.  
**Akceptacja:** Walidacja akceptuje legalny release i odrzuca brak wymaganej akceptacji/aktywacji.  
**Commit subject:** `T56: enforce canonical content release gate`

### T57 — Opublikować nowe immutable releases

**Repo/branch:** `both: content/master → app/main`  
**Zakres:** Zbuduj i opublikuj nowe releases, następnie zsynchronizuj bundle/lock w aplikacji.  
**Akceptacja:** Cross-repo contract, checksum i pinned artifact tests przechodzą.  
**Commit subject:** `T57: publish canonical content releases`

### T58 — Szybkie CI aplikacji

**Repo/branch:** `app/main`  
**Zakres:** Na każdy push uruchamiaj typecheck, unit, application integration, repositories/recovery, contract validation, architecture i accessibility component tests.  
**Akceptacja:** Workflow przechodzi na main i nie uruchamia pełnego Maestro.  
**Commit subject:** `T58: add fast application CI`

### T59 — Szybkie CI contentu

**Repo/branch:** `content/master`  
**Zakres:** Na każdy push: architecture tests, validate tracks, artifact verification i approval/activation gate.  
**Akceptacja:** Workflow przechodzi na master.  
**Commit subject:** `T59: add fast content CI`

### T60 — Cross-repo CI

**Repo/branch:** `both: content/master → app/main`  
**Zakres:** Aplikacja checkoutuje commit contentu wskazany przez lock i sprawdza schemat, taxonomy, release i artifact identity.  
**Akceptacja:** CI odrzuca mismatch i akceptuje pinned commit będący ancestor aktualnego master.  
**Commit subject:** `T60: add cross repository CI`

### T61 — Algorithms Maestro acceptance

**Repo/branch:** `app/main`  
**Zakres:** Dopiero tutaj uruchom pełną ścieżkę urządzenia: 40 pytań, save-and-continue, timer, relaunch, finalization, summary i review.  
**Akceptacja:** Zapisz artifacts/logi poza worktree lub w zatwierdzonej lokalizacji evidence.  
**Commit subject:** `T61: verify algorithms simulation with Maestro`

### T62 — Certification Maestro acceptance

**Repo/branch:** `app/main`  
**Zakres:** Track selection, practice, pełny egzamin, relaunch, expiry, finalization i review.  
**Akceptacja:** Evidence wskazuje build, platformę, datę i wynik.  
**Commit subject:** `T62: verify certification flows with Maestro`

### T63 — Natywny visual QA

**Repo/branch:** `app/main`  
**Zakres:** iOS i Android: fidelity do design references, Dynamic Type, screen reader, reduced motion i error states.  
**Akceptacja:** Wszystkie odchylenia są naprawione albo jawnie zapisane jako blokery wydania.  
**Commit subject:** `T63: complete native visual QA`

### T64 — Release evidence pack

**Repo/branch:** `app/main`  
**Zakres:** Zbierz requirements, tests, design references, CI, Maestro, visual QA, unverified areas i risks.  
**Akceptacja:** Raport rozdziela implemented+verified, implemented+unverified, planned i blocked.  
**Commit subject:** `T64: publish release evidence pack`

## Definition of done taska

Task jest ukończony wyłącznie wtedy, gdy:

- zależności są ukończone;
- diff dotyczy jednego zachowania;
- kanoniczny kontrakt odpowiada kodowi;
- szybkie testy przechodzą;
- design reference jest wskazane dla UI;
- nie pozostała równoległa ani legacy ścieżka;
- commit ma wymagany subject;
- commit został wypchnięty bezpośrednio do `main` lub `master`;
- remote head został zweryfikowany;
- raport końcowy nie przedstawia nieweryfikowanej pracy jako ukończonej.

## Warunki przerwania loopa

Loop zatrzymuje się natychmiast przy:

- dirty worktree;
- konflikcie rebase;
- odrzuconym pushu;
- branch protection uniemożliwiającym bezpośredni push;
- braku zatwierdzonego design reference;
- sprzecznym lub niekompletnym kanonicznym kontrakcie;
- nieprzechodzącym szybkim teście;
- potrzebie zmiany wykraczającej poza bieżący task;
- wymaganiu force-pusha lub utraty historii.

Nie omijaj blokady. Raportuj ją precyzyjnie.
