# ODK-E2E-027 — projekt ekranu propozycji planu

Status: VERIFIED_CLOSED

## Cel

Użytkownik widzi jedną czytelną propozycję planu dla wybranego tracka przed jej akceptacją. Widok wyjaśnia cel, datę w jej właściwym znaczeniu, dni, godziny, długość sesji oraz ograniczenia zweryfikowanego pakietu.

Projekt zachowuje podział z ODK-E2E-052:

- `GoalSnapshot` jest intencją użytkownika i ma revision;
- `LearningPlanProposal` jest wyłącznie nietrwałą propozycją;
- tylko jawna akceptacja tworzy `LearningPlan`;
- `PlanStatus` nie jest częścią tego widoku.

## Poza zakresem

- ODK-E2E-027 nie zmienia Goal, generatora, repozytorium, tras runtime ani testów.
- Generator i koordynator należą do ODK-E2E-028. Edycja slotów i zapis CAS należą do ODK-E2E-029.
- ODK-E2E-053 najpierw ustala prezentację target date dla późniejszego tempa. ODK-E2E-028 zaczyna się dopiero po ODK-E2E-053.
- Nie ma trwałego zapisu, TTL, synchronizacji ani recovery propozycji.
- VoiceOver jest poza zakresem.

## Właściciel propozycji i route

ODK-E2E-028 wprowadza jeden przyszły właściciel application: `LearningPlanProposalCoordinator`. Jest in-memory. Generator publikuje do niego niemutowalną, typowaną propozycję pod nieprzezroczystym `proposalId`.

Koordynator przechowuje pełny, nieeksponowany przez route rekord:

```ts
type CoordinatedLearningPlanProposal = Readonly<{
  proposalId: ProposalId;
  trackId: TrackId;
  goalRevision: number;
  contentVersion: string;
  packagePin: ContentPackagePin;
  timezone: IanaTimezone;
  slots: readonly LearningPlanProposalSlot[];
  outcome: LearningPlanProposalOutcome;
}>;
```

Route oraz komendy niosą wyłącznie:

```ts
type LearningPlanProposalRouteInput = Readonly<{
  proposalId: ProposalId;
  trackId: TrackId;
}>;
```

Route nie przyjmuje slotów, revision, content version, package pina ani statusu jako parametrów. Po process death lub braku `proposalId` route pokazuje `stale`; dopiero jawne `Update plan` regeneruje propozycję z aktualnym celem. Propozycja nie jest odtwarzana z dysku.

Przed `editSchedule` i `acceptProposal` coordinator ponownie rozwiązuje `proposalId`, odczytuje aktualny `GoalSnapshot` i zweryfikowany pakiet, a następnie porównuje `trackId`, `goalRevision`, `contentVersion`, pełny `packagePin` i timezone. Niezgodność daje `stale`; nic nie jest lokalnie poprawiane ani akceptowane.

`acceptProposal` jest one-shot i ma guard in-flight. Drugi tap nie uruchamia drugiego zapisu. Po udanym zapisie coordinator usuwa propozycję. ODK-E2E-029 zapisuje `LearningPlan` przez CAS wobec revision celu i oczekiwanej tożsamości propozycji. Nie powstaje drugi store celu ani planu.

## Wymagany kontrakt GoalSnapshot dla ODK-E2E-028

Istniejące API repozytorium celu musi zostać najpierw rozszerzone o kanoniczny odczyt `GoalSnapshot = { record, revision }` oraz granicę zapisu CAS z `expectedRevision`. Nie wolno tworzyć drugiego store tylko dla proposal flow.

Po powrocie z `GoalCadence` route zawsze odczytuje snapshot ponownie i żąda nowej propozycji. ODK-E2E-027 dokumentuje ten wymóg; nie zmienia GoalCadence ani repozytorium.

## Komendy semantyczne

| Komenda | Wejście route | Wynik |
| --- | --- | --- |
| `regenerateProposal` | `proposalId`, `trackId` albo aktualny cel po braku ID | Generator publikuje nową propozycję do coordinatora i otwiera ją pod nowym ID. |
| `retryProposal` | `proposalId`, `trackId` | Dostępna tylko dla błędu retryable. Wykonuje regenerację. |
| `adjustGoal` | `trackId` | Otwiera `GoalCadence`; powrót wymusza nowy snapshot i regenerację. |
| `chooseAnotherTrack` | brak | Otwiera kanoniczny track picker. Nie zapisuje planu. |
| `editSchedule` | `proposalId`, `trackId` | Coordinator re-resolve i sprawdza świeżość; dopiero wtedy otwiera ODK-E2E-029. |
| `acceptProposal` | `proposalId`, `trackId` | Coordinator re-resolve, guard in-flight i przekazanie do CAS ODK-E2E-029. |
| `backToPractice` | `trackId` | Wraca do Practice. Nie zapisuje planu. |
| `goBack` | brak | Wraca bez zapisu. |

## Hierarchia ekranu

1. Nagłówek: Back, `Learning plan` / `Plan nauki` i nazwa tracka z subtelnym pionowym akcentem jak w `GoalCadenceScreen`.
2. Karta celu: typ celu, wybrane dni oraz data z semantyką T4.
3. Karta stanu: jeden stan primary z tabeli poniżej.
4. Dla świeżego wyniku: dni, lokalne godziny, liczba pytań i lista slotów. Wiersz slotu jest podsumowaniem, nie edytorem.
5. Dla świeżego, zweryfikowanego pakietu: spokojna informacja C3.
6. Sticky footer z primary CTA. Secondary CTA pozostaje widoczne nad footerem albo pod nim.

Nazwa tracka może się zawinąć; nie może zostać ukryta przez wielokropek. Lista jest przewijalna, a footer nie zakrywa ostatniego wiersza.

## T4: data celu i timezone

| Typ celu | Data do wygenerowania | Etykieta EN / PL | Znaczenie |
| --- | --- | --- | --- |
| Interview | Opcjonalna | `Event date` / `Data wydarzenia`; bez daty `No event date` / `Brak daty wydarzenia` | Jeżeli istnieje, sesje są ściśle przed wydarzeniem. Bez daty powstaje open-ended cadence. |
| Certification | Opcjonalna | `Exam date` / `Data egzaminu`; bez daty `No exam date` / `Brak daty egzaminu` | Jeżeli istnieje, sesje są ściśle przed egzaminem. Bez daty powstaje open-ended cadence. |
| Build foundations | Opcjonalna | `Target date` / `Termin celu` | Jeżeli istnieje, jest włączającym deadline. Bez daty powstaje open-ended cadence. |
| Keep skills fresh | Opcjonalna | `Checkpoint` / `Punkt kontrolny` | Jeżeli istnieje, jest włączającym checkpointem, nie automatycznym ukończeniem. Bez daty powstaje open-ended cadence. |
| Self-paced | Niedozwolona semantycznie | `No target date` / `Bez daty docelowej` | Nie pokazuje daty i tworzy open-ended cadence. |

`targetDate` jest opcjonalna dla każdego celu poza own pace. GoalCadence może nadal zapisać ją zgodnie z własnym kontraktem. Proposal flow nie zmienia GoalCadence. Brak daty interview albo certification nie prowadzi do korekty celu i nie blokuje planu; widok pokazuje odpowiednio `No event date` albo `No exam date`.

Gdy event date istnieje, każdy slot proposal ma lokalną datę ściśle wcześniejszą niż `targetDate` w timezone propozycji. Nie wystarczy porównanie daty UTC.

Propozycja ma IANA timezone ustaloną przy generacji. `targetDate` i sloty interpretuje się w tej timezone. Widok formatuje datę, dzień i lokalną godzinę przez locale użytkownika oraz timezone propozycji, a nie przypadkową bieżącą strefę urządzenia. IANA timezone jest walidowana przez `Intl`; brakująca albo nieprawidłowa wartość nie ma fallbacku. Jeżeli źródłem jest pakiet, wynik jest terminalnym `package_unavailable`; jeżeli źródłem jest generator lub urządzenie, wynik jest terminalnym `generator_error`. Zmiana device timezone czyni propozycję `stale` i wymaga `Update plan` przed akceptacją. Zaakceptowany `LearningPlan` zachowuje własną timezone.

## Stany primary: precedence, copy, CTA i test

Pierwszy pasujący warunek przejmuje główną kartę oraz footer:

| Priorytet i stan | Warunek oraz dane | Copy EN / PL | Primary / secondary i przejście | Accept | Selector | E2E |
| --- | --- | --- | --- | --- | --- | --- |
| 1 `loading` | Odczyt snapshotu, pakietu lub generatora trwa. Skeleton; bez slotów jako faktów. | `Creating your plan…` / `Tworzymy plan…` | Brak primary. `Back` wraca bez zapisu. | Nie | `patternly:learning-plan:proposal:state:loading` | Skeleton, busy, brak akceptacji. |
| 2 `no_goal` | Aktualny snapshot nie ma celu dla `trackId`. | `Set a goal to create a plan.` / `Ustaw cel, aby utworzyć plan.` | `Set a goal` / `Ustaw cel` → GoalCadence. `Back to Practice` / `Wróć do ćwiczeń`. | Nie | `patternly:learning-plan:proposal:state:no-goal` | Brak celu dla właściwego tracka. |
| 3 `goal_paused` | Aktualny cel ma `status: paused`. | `This goal is paused.` / `Ten cel jest wstrzymany.` | `Adjust goal` / `Zmień cel` → GoalCadence. `Back to Practice` / `Wróć do ćwiczeń`. | Nie | `patternly:learning-plan:proposal:state:goal-paused` | Wstrzymany cel nie generuje planu. |
| 4 `package_error` | Retryable błąd odczytu lub weryfikacji pakietu. | `We could not load this learning package.` / `Nie udało się wczytać tego pakietu nauki.` | `Try again` / `Spróbuj ponownie` → `regenerateProposal`. `Back to Practice` / `Wróć do ćwiczeń`. | Nie | `patternly:learning-plan:proposal:state:package-error` | Retryable package error ma tylko realne ponowienie. |
| 5 `package_unavailable` | Terminalny brak pakietu, odrzucony pakiet lub nieprawidłowa IANA timezone pochodząca z pakietu. Brak wiarygodnego contextu ani C3. | `This learning package is unavailable.` / `Ten pakiet nauki jest niedostępny.` | `Choose another track` / `Wybierz inną ścieżkę` → kanoniczny track picker. `Go back` / `Wróć` → poprzednia route. | Nie | `patternly:learning-plan:proposal:state:package-unavailable` | Terminal package failure bez Adjust goal i Practice. |
| 6 `stale` | Proposal ID nie istnieje (w tym process death) albo identity, pin, revision, content version lub timezone nie zgadza się z bieżącym kontekstem. | `Your plan needs an update.` / `Plan wymaga aktualizacji.` | `Update plan` / `Aktualizuj plan` → `regenerateProposal`. `Go back` / `Wróć` wraca. | Nie | `patternly:learning-plan:proposal:state:stale` | Missing ID nie regeneruje automatycznie; pin mismatch i device timezone change. |
| 7 `generator_error` | Bieżący generator nie utworzył propozycji. Dane błędu: retryable, terminal albo unclassified. Brakująca/nieprawidłowa IANA timezone generatora lub urządzenia jest terminalna. | Retryable: `We could not create your plan. Try again.` / `Nie udało się utworzyć planu. Spróbuj ponownie.` Terminal: `This plan cannot be created.` / `Nie można utworzyć tego planu.` Unclassified: `Your plan is unavailable.` / `Plan jest niedostępny.` | Retryable: `Try again` / `Spróbuj ponownie` → regenerate, `Back to Practice`. Terminal/unclassified: `Adjust goal` → GoalCadence, `Back to Practice`. | Nie | `patternly:learning-plan:proposal:state:generator-error` | Osobno retryable, terminal i unclassified; fake retry jest zakazany. |
| 8 `shortfall` | Zweryfikowana pojemność nie daje requested ani dozwolonego minimum. Dane: requested, eligible, missing. | Trzy pełne zdania i18next z sekcji lokalizacji. | `Adjust goal` → GoalCadence. `Back to Practice`. | Nie | `patternly:learning-plan:proposal:state:shortfall` | Liczby i brak akceptacji; bez obcego fillera albo pustej sesji. |
| 9 `shortened` | Pakiet jawnie zezwala na skrócenie, a świeży generator podał actual length. | Dwa pełne zdania i18next z sekcji lokalizacji. | `Accept plan` → guarded CAS ODK029. `Edit schedule` → verified ODK029; `Go back` / `Wróć`. | Tak, po re-resolve | `patternly:learning-plan:proposal:state:shortened` | Dozwolone tylko explicit package policy. |
| 10 `ready` | Świeża, pełna propozycja ma sloty i pełną identity. | `Your proposed plan` / `Proponowany plan` | `Accept plan` → guarded CAS ODK029. `Edit schedule` → verified ODK029; `Go back` / `Wróć`. | Tak, po re-resolve | `patternly:learning-plan:proposal:state:ready` | Akceptacja one-shot i nowe pobranie identity. |

## C3: informacja o ukończeniu

Evaluator C3 zwraca dokładnie `unknown`, `in_progress` albo `completed`. Znana reguła nie oznacza automatycznie ukończenia. Informacja jest widoczna tylko z aktualnym zweryfikowanym kontekstem pakietu: w `shortfall`, `shortened` albo `ready`. Nie jest pokazywana w `loading`, `no_goal`, `goal_paused`, `package_error`, `package_unavailable`, `stale` ani `generator_error`.

| Wynik | Copy EN | Copy PL | Selector |
| --- | --- | --- | --- |
| `unknown` | `Completion status is not defined for this package yet.` | `Status ukończenia nie jest jeszcze określony dla tego pakietu.` | `patternly:learning-plan:proposal:completion:unknown` |
| `in_progress` | `Keep practising to meet this package’s completion rule.` | `Ćwicz dalej, aby spełnić regułę ukończenia tego pakietu.` | `patternly:learning-plan:proposal:completion:in-progress` |
| `completed` | `You have met this package’s completion rule.` | `Spełniasz regułę ukończenia tego pakietu.` | `patternly:learning-plan:proposal:completion:completed` |

Reguła nadal jest wersjonowaną własnością pakietu: minimalna liczba prób, rozmiar ruchomego okna i próg jakości. Widok nie wylicza średniej całej historii, nie wymaga unikalnych pytań i nie obiecuje wyniku egzaminu czy rozmowy.

## S12: shortfall i skrócenie

Shortfall zawsze pokazuje requested, eligible i missing. Nie dodaje materiału z innego tracka, trybu ani pakietu. Nie tworzy sesji zeroelementowej. Skrócenie jest widoczne wyłącznie, gdy pełny zweryfikowany package policy pozwala na tę konkretną krótszą długość.

## Lokalizacja

Poniższe klucze są propozycją dla implementacji. Nie istnieją jeszcze i ODK-E2E-027 nie twierdzi, że są wdrożone. Wszystkie należą do namespace `learningPlan`:

```text
learningPlan.title
learningPlan.state.loading
learningPlan.state.noGoal.title
learningPlan.state.goalPaused.title
learningPlan.state.packageError
learningPlan.state.packageUnavailable
learningPlan.state.stale
learningPlan.state.generatorError.retryable
learningPlan.state.generatorError.terminal
learningPlan.state.generatorError.unclassified
learningPlan.targetDate.noEventDate
learningPlan.targetDate.noExamDate
learningPlan.shortfall
learningPlan.shortened
learningPlan.completion.unknown
learningPlan.completion.inProgress
learningPlan.completion.completed
learningPlan.action.accept
learningPlan.action.editSchedule
learningPlan.action.adjustGoal
learningPlan.action.tryAgain
learningPlan.action.update
learningPlan.action.chooseAnotherTrack
learningPlan.action.backToPractice
```

Implementacja używa wyłącznie natywnej pluralizacji i18next. Nie dodaje parsera MessageFormat ani zależności `i18next-icu`. Komponent wywołuje każdy klucz z `count`, a następnie układa pełne, osobne zdania. Nie łączy fragmentów różnych gramatycznie.

| Przypadek | Baza klucza i wywołanie | Segmenty zdaniowe |
| --- | --- | --- |
| Shortfall | `t("learningPlan.shortfall.requested", { count: requested })`, `t("learningPlan.shortfall.eligible", { count: eligible })`, `t("learningPlan.shortfall.missing", { count: missing })` | Każdy segment jest pełnym zdaniem. Komponent pokazuje je kolejno. |
| Shortened | `t("learningPlan.shortened.actual", { count: actual })`, `t("learningPlan.shortened.requested", { count: requested })` | Każdy segment jest pełnym zdaniem. Komponent pokazuje je kolejno. |

Każda baza dostaje istniejące suffixy i18next: EN ma `_one` i `_other`; PL ma `_one`, `_few`, `_many` i `_other`. Przykładowe zasoby mają ten sam wzorzec dla każdej bazy:

```text
// en resource
learningPlan.shortfall.requested_one = "This plan needs {{count}} question per session."
learningPlan.shortfall.requested_other = "This plan needs {{count}} questions per session."
learningPlan.shortfall.eligible_one = "{{count}} question is available."
learningPlan.shortfall.eligible_other = "{{count}} questions are available."
learningPlan.shortfall.missing_one = "{{count}} more question is needed."
learningPlan.shortfall.missing_other = "{{count}} more questions are needed."
learningPlan.shortened.actual_one = "This package allows a shorter session of {{count}} question."
learningPlan.shortened.actual_other = "This package allows a shorter session of {{count}} questions."
learningPlan.shortened.requested_one = "The requested session has {{count}} question."
learningPlan.shortened.requested_other = "The requested session has {{count}} questions."

// pl resource
learningPlan.shortfall.requested_one = "Ten plan potrzebuje {{count}} pytania na sesję."
learningPlan.shortfall.requested_few = "Ten plan potrzebuje {{count}} pytań na sesję."
learningPlan.shortfall.requested_many = "Ten plan potrzebuje {{count}} pytań na sesję."
learningPlan.shortfall.requested_other = "Ten plan potrzebuje {{count}} pytania na sesję."
learningPlan.shortfall.eligible_one = "Dostępne jest {{count}} pytanie."
learningPlan.shortfall.eligible_few = "Dostępne są {{count}} pytania."
learningPlan.shortfall.eligible_many = "Dostępnych jest {{count}} pytań."
learningPlan.shortfall.eligible_other = "Dostępne jest {{count}} pytania."
learningPlan.shortfall.missing_one = "Brakuje {{count}} pytania."
learningPlan.shortfall.missing_few = "Brakuje {{count}} pytań."
learningPlan.shortfall.missing_many = "Brakuje {{count}} pytań."
learningPlan.shortfall.missing_other = "Brakuje {{count}} pytania."
learningPlan.shortened.actual_one = "Ten pakiet pozwala na krótszą sesję z {{count}} pytaniem."
learningPlan.shortened.actual_few = "Ten pakiet pozwala na krótszą sesję z {{count}} pytaniami."
learningPlan.shortened.actual_many = "Ten pakiet pozwala na krótszą sesję z {{count}} pytaniami."
learningPlan.shortened.actual_other = "Ten pakiet pozwala na krótszą sesję z {{count}} pytania."
learningPlan.shortened.requested_one = "Żądana sesja ma {{count}} pytanie."
learningPlan.shortened.requested_few = "Żądana sesja ma {{count}} pytania."
learningPlan.shortened.requested_many = "Żądana sesja ma {{count}} pytań."
learningPlan.shortened.requested_other = "Żądana sesja ma {{count}} pytania."
```

## Responsywność i React Native semantics

- EN i PL muszą pokazywać pełne copy. Daty, dni i godziny formatują locale oraz timezone propozycji.
- Tekst rośnie do skali 2. Wiersz slotu układa etykietę i wartość w dwóch wierszach. CTA układają się pionowo. Hitbox CTA ma co najmniej 44 pt.
- Dozwolone natywne role to `header`, `button` i `list`. Elementy slotu używają zwykłego `View`/`Text`, nie `listitem`. Komunikat stanu używa zwykłego tekstu/widoku, nie roli `status`.
- Aktualizacja komunikatu używa `accessibilityLiveRegion="polite"`. Loading ma `accessibilityState={{ busy: true }}`. Nie dodajemy zachowań VoiceOver poza tymi natywnymi semantykami.

## Typowane factory selectorów

ODK-E2E-028 dodaje factory do `runtimeSelectors`. Komponenty nie interpolują stringów selektorów:

```ts
learningPlanProposal: {
  root(): RuntimeSelectorId;
  state(state: LearningPlanProposalPrimaryState): RuntimeSelectorId;
  track(trackId: TrackId): RuntimeSelectorId;
  targetDate(): RuntimeSelectorId;
  slot(slotId: ProposalSlotId): RuntimeSelectorId;
  completion(state: "unknown" | "in-progress" | "completed"): RuntimeSelectorId;
  accept(): RuntimeSelectorId;
  editSchedule(): RuntimeSelectorId;
  adjustGoal(): RuntimeSelectorId;
  tryAgain(): RuntimeSelectorId;
  update(): RuntimeSelectorId;
  chooseAnotherTrack(): RuntimeSelectorId;
  backToPractice(): RuntimeSelectorId;
}
```

Factory wydaje kanoniczne wartości `patternly:learning-plan:proposal:*`. `ProposalSlotId` jest trwałym ID generatora, nie indeksem listy.

## Kryteria akceptacji ODK-E2E-028

- Najpierw powstaje canonical `GoalSnapshot` read/revision i CAS boundary w istniejącym repozytorium celu.
- `LearningPlanProposalCoordinator` jest jedynym in-memory właścicielem proposal; route i komendy zawierają wyłącznie `proposalId` oraz `trackId`.
- Coordinator utrzymuje immutable full identity, timezone i sloty; re-resolve wykrywa stale oraz missing ID.
- Generator obsługuje kolejność: `loading` > `no_goal` > `goal_paused` > `package_error` > `package_unavailable` > `stale` > `generator_error` > `shortfall` > `shortened` > `ready`, T4, S12 i C3.
- Generator zapewnia IANA timezone walidowaną przez `Intl`; package timezone invalid daje terminal `package_unavailable`, a device/generator timezone invalid daje terminal `generator_error`. Device timezone change wymusza `stale` i `Update plan`.
- Namespace i zasoby `learningPlan` są zarejestrowane w `src/i18n.ts`, a EN i PL mają pełną parity kluczy i suffixów pluralizacji i18next. Nie dodano `i18next-icu` ani nowej zależności.
- Unit render sprawdza EN `_one` i `_other` oraz PL `_one`, `_few`, `_many` i `_other` dla segmentów shortfall i shortened.
- Focused S12 test sprawdza minimum większe niż 1: `shortfall` poniżej minimum i `shortened` dokładnie na minimum.

## Kryteria akceptacji ODK-E2E-029

- `editSchedule` i `acceptProposal` re-resolve przez coordinator, porównują snapshot revision, full pin, content version i timezone.
- Akceptacja jest one-shot/in-flight guarded, zapisuje przez CAS i po sukcesie usuwa proposal z coordinatora.
- Po process death/missing ID flow pokazuje `stale` i czeka na jawne `Update plan`. Nie zapisuje propozycji na dysku, nie synchronizuje i nie ma TTL.
- Brak akceptacji w każdym stanie poza świeżym `ready` i `shortened`.
- E2E obejmuje wszystkie primary states, retryable `package_error`, terminal `package_unavailable`, retryable/terminal/unclassified generator error, missing proposal ID, invalid IANA timezone z obu źródeł, event z datą i bez daty, completion `unknown`/`in_progress`/`completed`, EN/PL, długą nazwę tracka i font scale 2. VoiceOver jest pominięty.

## Walidacja briefu

Niezależny `gpt-5.6-luna / max`, bez narzędzi:

- zgodność celu i architektury: 0,95;
- prostota: 0,84;
- ryzyko: 0,82;
- utrzymywalność: 0,91;
- minimum: 0,82;
- werdykt: APPROVE.
