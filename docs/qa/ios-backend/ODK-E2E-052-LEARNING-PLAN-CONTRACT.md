# ODK-E2E-052 — kanoniczny kontrakt planu nauki

Status: ACCEPTED

## Decyzja

Plan ma jednego właściciela domenowego: moduł `learning-plan` w warstwie domain/application.

Źródła prawdy są rozdzielone:

1. `GoalRecord` zapisuje zamiar i preferencje użytkownika dla tracka.
2. `LearningPlan` zapisuje wyłącznie zaakceptowany harmonogram dla tego celu.
3. Sesje, próby i kolejka powtórek zapisują fakty wykonanej nauki.
4. `TargetDateGuidance` jest kanoniczną, wyliczaną projekcją statusu planu. Nie jest osobnym zapisem.
5. Reminders tworzy lokalne powiadomienia z zaakceptowanego planu. Nie posiada planu.

## Potwierdzony stan obecny

- `GoalRecord` jest lokalny i zapisany per track. Jego canonical envelope ma revision, lecz `goalRepository` nie udostępnia go dziś konsumentom.
- Odczyt normalizuje `weeklySessionTarget` do liczby `preferredDays`. Guard kształtu dopuszcza legacy mismatch i puste dni. Zapis wymaga co najmniej jednego dnia.
- Cel nie jest częścią synchronizacji konta.
- Home i Practice nie używają celu do planowania.
- Progress używa celu tylko do wejścia w edycję.
- Reminders zapisuje jeden lokalny reminder dzienny.
- Synchronizacja konta obejmuje aktywny track, ukończone sesje, wyniki, próby i review.
- Nie istnieje zapisany plan, prognoza ani wspólny status realizacji.

## GoalRecord v1

Obecny kontrakt pozostaje wejściem planu:

```ts
type GoalRecord = {
  goalType: GoalTemplateId;
  preferredDays: GoalDay[];
  status: "active" | "paused";
  targetDate?: string;
  trackId: TrackId;
  weeklySessionTarget: number;
};
```

`weeklySessionTarget` nadal musi być równy liczbie `preferredDays`.

Docelowe API repozytorium zwraca `GoalSnapshot = { record: GoalRecord; revision: number }`. Revision pochodzi z istniejącego `CanonicalRecordEnvelope`. Zapis używa `expectedRevision`.

## LearningPlan v1

```ts
type AcceptedTargetSnapshot = Readonly<{
  meaning: "event" | "deadline" | "checkpoint" | "none";
  targetDate: string | null; // strict YYYY-MM-DD calendar date; null is canonical
}>;

type LearningPlan = {
  schemaVersion: 1;
  planId: string;
  trackId: TrackId;
  goalRevision: number;
  status: "accepted" | "paused" | "completed";
  timezone: string;
  contentPackagePin: ContentPackagePin;
  acceptedTarget: AcceptedTargetSnapshot;
  createdAt: string;
  updatedAt: string;
  planRevision: number;
  slots: PlanSlot[];
};

type PlanSlot = {
  slotId: string;
  day: GoalDay;
  localTime: string;
  sessionLength: number;
};
```

Plan nie kopiuje wyników sesji ani kolejki review. `goalRevision` pochodzi z `GoalSnapshot`. `contentPackagePin` jest pełnym, zweryfikowanym pinem pakietu, a nie samą wersją. `sessionLength` opisuje planowaną liczbę pytań. Konkretne pytania są wybierane przy starcie sesji z aktualnego zakresu i review.

Nie ma migracji tego pola: runtime nie posiada jeszcze trwałego `LearningPlan`.

`acceptedTarget` jest snapshotem semantyki zaakceptowanej razem z planem. `targetDate` ma dokładnie format `YYYY-MM-DD` i musi być prawidłową datą kalendarza (np. `2027-02-29` jest odrzucane); pusty string, `undefined` i inne substytuty nie są dozwolone. Brak daty zawsze zapisuje się jako `null`. `meaning: "none"` wymaga `targetDate: null`; `event`, `deadline` i `checkpoint` mogą mieć `null`, gdy dany cel nie ma daty.

Snapshot powstaje z bieżącego celu według T4: interview i certification dają `event`, build foundations daje `deadline`, keep skills fresh daje `checkpoint`, a self-paced daje `none`. Brak `GoalRecord.targetDate` jest normalizowany do `null`; legacy date przy self-paced pozostaje ignorowana zgodnie z istniejącą semantyką celu. Równość targetu oznacza dokładnie tę samą parę `meaning` + kanoniczne `targetDate`, a nie samo porównanie daty.

Propozycja jest nietrwałym `LearningPlanProposal`. Nie jest synchronizowana. Dopiero jawna akceptacja tworzy `LearningPlan` z `planRevision: 1`.

## ODK-E2E-053 — kontrakt UX `TargetDateGuidance`

Status tego rozszerzenia: `VERIFIED_CLOSED`.

### Właściciel i granice

`TargetDateGuidance` ma jednego właściciela w warstwie application. Buduje kompletną projekcję na podstawie kanonicznego celu, zaakceptowanego planu, zweryfikowanego pakietu, C3, niezmiennych faktów i otagowanej prognozy. Home i Progress nie odtwarzają warunków, nie wyliczają tempa i nie wybierają CTA. Otrzymują tę samą projekcję i różnią się wyłącznie układem: Home pokazuje jedną zwartą kartę, a Progress ten sam status i cztery fakty.

`TargetDateGuidance` nie jest zapisem i nie zastępuje `LearningPlan`, `GoalSnapshot`, C3 ani faktów sesji. Projekcja jest czysta i deterministyczna dla jednego wejścia. Nie wolno przechowywać jej jako starego statusu ani używać do cichego uzupełniania brakujących danych.

### Typy wejścia i wyjścia

```ts
type C3Result = "unknown" | "in_progress" | "completed";

type PaceForecastUnavailableReason =
  | "unknown_completion_rule"
  | "no_target"
  | "no_future_slots"
  | "insufficient_elapsed_evidence"
  | "calculation_error";

type ForecastSource = Readonly<{
  planId: string;
  planRevision: number;
  goalRevision: number;
  target: AcceptedTargetSnapshot;
  contentPackagePin: ContentPackagePin;
}>;

type PaceForecast =
  | Readonly<{
      kind: "unavailable";
      reason: PaceForecastUnavailableReason;
    }>
  | Readonly<{
      kind: "available";
      source: ForecastSource;
      requiredQuestionsPerWeek: number;
      actualQuestionsPerWeek: number;
      projectedCompletionDate: string;
      targetDate: string;
      remainingRequiredAttempts: number;
      remainingPlannedCapacity: number;
      status: "on_track" | "at_risk";
      trend: "improving" | "stable" | "slowing";
    }>;

type CompletedSessionFact = Readonly<{
  completedAt: string;
  completedQuestions: number;
  plannedQuestions: number;
}>;

type CompletedAttemptFact = Readonly<{
  answeredAt: string;
  countsTowardCompletion: boolean;
}>;

type ImmutableCompletedFacts = Readonly<{
  sessions: readonly CompletedSessionFact[];
  attempts: readonly CompletedAttemptFact[];
}>;

type TargetDateGuidanceInput = Readonly<{
  currentGoal: GoalSnapshot | null;
  acceptedPlan: LearningPlan | null;
  currentVerifiedPackagePin: ContentPackagePin;
  c3Result: C3Result;
  today: string; // fixed local YYYY-MM-DD in acceptedPlan.timezone
  completedFacts: ImmutableCompletedFacts;
  paceForecast: PaceForecast;
}>;

type GuidanceFact =
  | Readonly<{ kind: "numeric"; value: number; unit: "questions_per_week" }>
  | Readonly<{ kind: "date"; value: string }>
  | Readonly<{ kind: "text"; value: "goal_complete" | "flexible" | "no_target_date" | "completed" }>
  | Readonly<{ kind: "unavailable"; reason: GuidanceFactUnavailableReason }>;

type GuidanceFactUnavailableReason =
  | "no_goal"
  | "goal_paused"
  | "no_plan"
  | "update_required"
  | "plan_paused"
  | "completed"
  | PaceForecastUnavailableReason;

type TargetDateGuidanceState =
  | "no_goal"
  | "goal_paused"
  | "no_plan"
  | "update_required"
  | "plan_paused"
  | "completed"
  | "overdue"
  | "unreachable"
  | "at_risk"
  | "on_track"
  | "open_ended"
  | "unavailable";

type TargetDateGuidanceReason =
  | "no_goal"
  | "goal_paused"
  | "no_plan"
  | "target_changed"
  | "package_changed"
  | "cadence_changed"
  | "plan_paused"
  | "completed"
  | "overdue"
  | "insufficient_sessions"
  | "no_future_slots"
  | "at_risk"
  | "on_track"
  | "no_target"
  | PaceForecastUnavailableReason;

type GuidanceAction =
  | Readonly<{ kind: "set_goal"; destination: "GoalCadence" }>
  | Readonly<{ kind: "adjust_goal"; destination: "GoalCadence" }>
  | Readonly<{ kind: "create_plan"; destination: "LearningPlanProposal" }>
  | Readonly<{ kind: "review_updated_plan"; destination: "LearningPlanProposal" }>
  | Readonly<{ kind: "resume_plan"; destination: "LearningPlanEditor" }>
  | Readonly<{ kind: "adjust_schedule"; destination: "LearningPlanEditor" }>
  | Readonly<{ kind: "view_progress"; destination: "Progress" }>
  | Readonly<{ kind: "start_next_session"; destination: "Practice" }>
  | Readonly<{ kind: "continue_plan"; destination: "Practice" }>
  | Readonly<{ kind: "try_again"; destination: "TargetDateGuidanceRecompute" }>;

type GuidanceMessageKey =
  | "targetDateGuidance.noGoal"
  | "targetDateGuidance.goalPaused"
  | "targetDateGuidance.noPlan"
  | "targetDateGuidance.planPaused"
  | "targetDateGuidance.updateRequired.targetChanged"
  | "targetDateGuidance.updateRequired.packageChanged"
  | "targetDateGuidance.updateRequired.cadenceChanged"
  | "targetDateGuidance.completed"
  | "targetDateGuidance.overdue"
  | "targetDateGuidance.unreachable.insufficientSessions"
  | "targetDateGuidance.unreachable.noFutureSlots"
  | "targetDateGuidance.atRisk"
  | "targetDateGuidance.onTrack"
  | "targetDateGuidance.openEnded"
  | "targetDateGuidance.unavailable.unknownCompletionRule"
  | "targetDateGuidance.unavailable.insufficientElapsedEvidence"
  | "targetDateGuidance.unavailable.calculationError"
  | "targetDateGuidance.unavailable.noTarget";

type TargetDateGuidance = Readonly<{
  state: TargetDateGuidanceState;
  reason: TargetDateGuidanceReason;
  tone: "neutral" | "positive" | "warning" | "danger" | "muted";
  messageKey: GuidanceMessageKey;
  home: Readonly<{ primary: GuidanceAction }>;
  progress: Readonly<{ primary: GuidanceAction; secondary: GuidanceAction | null }>;
  facts: Readonly<{
    requiredPace: GuidanceFact;
    actualPace: GuidanceFact;
    forecast: GuidanceFact;
    target: GuidanceFact;
  }>;
}>;
```

`CompletedSessionFact` i `CompletedAttemptFact` są snapshotem immutable facts dostarczonym przez właściciela faktów. Projekcja ich nie zmienia, nie sortuje w miejscu i nie tworzy nowych wyników sesji. Daty faktów są walidowane przez właściciela; `today`, `projectedCompletionDate` i daty targetu przechodzą tę samą ścisłą walidację daty kalendarzowej.

`PaceForecast` jest otagowaną sumą `available`/`unavailable`. Wariant `available` musi mieć wszystkie liczby, daty i `status`/`trend`; `status` (`on_track` albo `at_risk`) oraz `trend` (`improving`, `stable`, `slowing`) są wynikiem ODK-E2E-030. ODK-E2E-030 jest właścicielem formuł i progów. UI nigdy nie odtwarza tych progów z liczb.

Wariant `available` jest przyjmowany tylko wtedy, gdy `source` pasuje do bieżącego `acceptedPlan`: `planId`, `planRevision`, `goalRevision`, pełny `target` oraz pełny `contentPackagePin` muszą być identyczne. `targetDate` prognozy musi być równy `acceptedTarget.targetDate`. Rozbieżność nie może użyć starych liczb; kończy się jawnym `calculation_error` albo wcześniejszym `update_required` zgodnie z precedencją.

Wspólne porównanie pakietu używa `contentPackagePinsEqual` i wszystkich trzech pól `ContentPackagePin`: `packageIdentity`, `packageVersion` oraz `contentReleaseId`. Porównanie tylko `packageVersion` jest błędem. `currentVerifiedPackagePin` pochodzi z aktualnie zweryfikowanego runtime pakietu; nie jest nazwą wyświetlaną użytkownikowi.

### Precedencja i świeżość

Pierwszy pasujący warunek zwraca stan:

`no_goal > goal_paused > no_plan > update_required > plan_paused > completed > overdue > unreachable > at_risk > on_track > open_ended > unavailable`.

1. `no_goal`: `currentGoal === null`.
2. `goal_paused`: cel istnieje, ale `currentGoal.record.status === "paused"`. Stan ma pierwszeństwo przed brakiem planu.
3. `no_plan`: cel aktywny i `acceptedPlan === null`.
4. `update_required`: plan istnieje, lecz kontekst nie jest świeży. Najpierw tworzy się bieżący target z `currentGoal.record`; `target_changed` oznacza inną semantykę albo inną kanoniczną datę. `package_changed` oznacza nierówność bieżącego zweryfikowanego pina i pina planu. `cadence_changed` oznacza różnicę `currentGoal.revision` i `acceptedPlan.goalRevision` przy identycznym target snapshot.
5. Gdy występuje kilka zmian, reason jest deterministyczny: `target_changed > package_changed > cadence_changed`. Zatem zmieniony target wygrywa z pakietem, a pakiet wygrywa z samą zmianą cadence. `cadence_changed` nie maskuje zmienionego targetu.
6. `plan_paused`: kontekst jest świeży, cel jest aktywny, a `acceptedPlan.status === "paused"`. Plan nie może wtedy uruchomić sesji. `Resume plan` otwiera kanoniczny edytor ODK-E2E-029 i wykonuje jawną komendę wznowienia.
7. `completed`: świeży plan i `c3Result === "completed"`. C3 jest źródłem prawdy dla ukończenia; sam zapis `LearningPlan.status` nie podnosi stanu do completed.
8. `overdue`: świeży, nieukończony plan z targetem i przekroczoną lokalną granicą. Dla `deadline`/`checkpoint` jest to `today > targetDate`; dla `event` jest to `today >= targetDate`. Porównanie jest lokalne dla `acceptedPlan.timezone`, po ścisłej walidacji dat, nigdy przez przypadkową strefę urządzenia. `completed` zawsze wygrywa z overdue.
9. `unreachable`: tylko liczbowy wariant `available` z `remainingPlannedCapacity < remainingRequiredAttempts` i reason `insufficient_sessions`. Nie wolno wyprowadzać tego stanu z samego trendu.
10. `at_risk` i `on_track`: wyłącznie `available` z odpowiednim, otagowanym `status` ODK-E2E-030; UI nie klasyfikuje prognozy.
11. `open_ended`: aktywny, świeży plan z `acceptedTarget.targetDate === null` albo `acceptedTarget.meaning === "none"`. Zawsze zwraca reason `no_target`, niezależnie od pomocniczego wariantu forecastu.
12. `unavailable`: pozostałe jawne powody prognozy. `no_future_slots` z nieprzekroczonym targetem i targetem obecnym zawsze mapuje się do `unreachable`, lecz bez liczb. Nie istnieje wynik `state: unavailable, reason: no_future_slots`. To jedyny wyjątek od reguły liczbowego `unreachable` z punktu 9. `insufficient_elapsed_evidence` pozostaje neutralnym `unavailable`; nie staje się at_risk ani unreachable. `unavailable(no_target)` jest wyłącznie guardem niespójności, gdy snapshot zawiera datę, a forecast twierdzi, że targetu nie ma.

`update_required` jest przed `completed`, ponieważ nieświeży goal albo package nie może przedstawiać C3 jako statusu zaakceptowanego planu. Po ponownym wygenerowaniu/zaakceptowaniu świeżego planu `completed` może wrócić. W każdym stanie `update_required` projekcja ignoruje `paceForecast` i stare completed facts dla statusu oraz liczb.

`overdue` nie wymaga dostępnej prognozy: target może być przekroczony również przy `unknown_completion_rule`, `insufficient_elapsed_evidence` albo `calculation_error`, ale wtedy trzy pola liczbowe są unavailable. Bez `available` nie wolno zwrócić `on_track`, `at_risk` ani liczbowego `unreachable`, a także nie wolno pokazać liczb z poprzedniej prognozy.

### Fakty Progress

Progress zawsze ma dokładnie cztery semantyczne pola, w tej kolejności: `requiredPace`, `actualPace`, `forecast`, `target`. Nie są to trzy pola z targetem dopisanym do opisu. `GuidanceFact` jest tagged unionem; `unavailable(reason)` jest pełnym stanem prezentacji, nie pustym `—`, `-` ani `null` do wyświetlenia.

Legendę dla macierzy stanów stanowi: `Q(x)` = `numeric(x, "questions_per_week")`, `D(x)` = `date(x)`, `T(x)` = `text(x)`, `U(r)` = `unavailable(r)`. Kolejność wartości zawsze odpowiada czterem polom Progress.

- `no_goal`: `U(no_goal) / U(no_goal) / U(no_goal) / U(no_goal)`; użytkownik dostaje tylko Set goal.
- `goal_paused`: `U(goal_paused) / U(goal_paused) / U(goal_paused) / U(goal_paused)`; użytkownik dostaje tylko Adjust goal.
- `no_plan`: `U(no_plan) / U(no_plan) / U(no_plan) / U(no_plan)`; brak planu nie udaje prognozy.
- `update_required`: `U(update_required) / U(update_required) / U(update_required) / U(update_required)`; stare liczby, target i C3 nie są renderowane.
- `plan_paused`: `U(plan_paused) / U(plan_paused) / U(plan_paused) / D(targetDate)` albo `T(no_target_date)`; plan nie udaje aktywnego tempa.
- `completed`: `U(completed) / U(completed) / T(completed) / D(targetDate)` dla istniejącego targetu albo `T(goal_complete)` bez targetu. Progress pokazuje ukończenie bez starej prognozy.
- `overdue`: przy `available` `Q(required) / Q(actual) / D(projectedCompletionDate) / D(targetDate)`; przy niedostępnej prognozie `U(reason) / U(reason) / U(reason) / D(targetDate)`. Target pozostaje jawny, ale brak liczb nie jest zastępowany kreską.
- `unreachable(insufficient_sessions)`: `Q(required) / Q(actual) / D(projectedCompletionDate) / D(targetDate)`; `unreachable(no_future_slots)`: `U(no_future_slots) / U(no_future_slots) / U(no_future_slots) / D(targetDate)`.
- `at_risk` i `on_track`: `Q(required) / Q(actual) / D(projectedCompletionDate) / D(targetDate)` wyłącznie z `available`.
- `open_ended`: `T(flexible) / T(flexible) / T(flexible) / T(no_target_date)`; brak celu daty jest zrozumiałym faktem, nie niedostępnością.
- `unavailable(unknown_completion_rule|insufficient_elapsed_evidence|calculation_error)`: `U(reason) / U(reason) / U(reason) / D(targetDate)` gdy target istnieje albo `T(no_target_date)` gdy go nie ma. `unavailable(no_target)` jest tylko fail-closed dla niespójnego wejścia. `no_future_slots` ma wyłącznie wariant `unreachable` opisany wyżej.

Każdy reason `U(r)` ma osobny user-facing klucz w i18next. W szczególności nie ma pustego placeholdera ani ogólnego „Unavailable”, który ukrywałby przyczynę.

### Macierz stanów, copy, CTA i E2E

Copy jest krótkie i spokojne. Podane akcje są semantyką zwracaną przez projekcję; komponent tylko tłumaczy klucz, formatuje wartości i nawiguje do wskazanego destination.

| Priorytet / state | Reason i warunek | Copy EN / PL | Tone | Home: dokładnie jeden primary → destination | Progress: primary; jedyny dozwolony secondary → destination | Fakty `requiredPace / actualPace / forecast / target` | Selector | Deterministyczny E2E |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 `no_goal` | `currentGoal === null` | `Set a goal to create your learning plan.` / `Ustaw cel, aby utworzyć plan nauki.` | `neutral` | `Set goal` / `Ustaw cel` → `GoalCadence` | `Set goal` / `Ustaw cel`; brak secondary | `U(no_goal) / U(no_goal) / U(no_goal) / U(no_goal)` | `patternly:target-date-guidance:state:no-goal` | Brak celu właściwego tracka; istniejący plan nie jest renderowany. |
| 2 `goal_paused` | `currentGoal.record.status === "paused"` | `Your goal is paused.` / `Twój cel jest wstrzymany.` | `muted` | `Adjust goal` / `Zmień cel` → `GoalCadence` | `Adjust goal` / `Zmień cel`; brak secondary | `U(goal_paused) / U(goal_paused) / U(goal_paused) / U(goal_paused)` | `patternly:target-date-guidance:state:goal-paused` | Wstrzymany cel z planem i bez planu; zawsze wygrywa z `no_plan`. |
| 3 `no_plan` | Aktywny cel, `acceptedPlan === null` | `Create a plan to start this rhythm.` / `Utwórz plan, aby rozpocząć ten rytm.` | `neutral` | `Create plan` / `Utwórz plan` → `LearningPlanProposal` | `Create plan` / `Utwórz plan`; brak secondary | `U(no_plan) / U(no_plan) / U(no_plan) / U(no_plan)` | `patternly:target-date-guidance:state:no-plan` | Cel aktywny bez zaakceptowanego planu; brak forecastu i liczb. |
| 4 `update_required` | `target_changed`: target meaning albo kanoniczna data różni się od planu | `Your target changed. Review the updated plan.` / `Zmienił się target. Sprawdź zaktualizowany plan.` | `warning` | `Review updated plan` / `Sprawdź zaktualizowany plan` → `LearningPlanProposal` | `Review updated plan` / `Sprawdź zaktualizowany plan`; brak secondary | `U(update_required) / U(update_required) / U(update_required) / U(update_required)` | `patternly:target-date-guidance:state:update-required` + `reason:target-changed` | Zmiana samej daty, zmiana meaning przy tej samej dacie, `null` po braku daty; bez sesji również. |
| 4 `update_required` | `package_changed`: pełny current pin różni się od pina planu | `This learning package changed. Review the updated plan.` / `Zmieniono pakiet nauki. Sprawdź zaktualizowany plan.` | `warning` | `Review updated plan` / `Sprawdź zaktualizowany plan` → `LearningPlanProposal` | `Review updated plan` / `Sprawdź zaktualizowany plan`; brak secondary | `U(update_required) / U(update_required) / U(update_required) / U(update_required)` | `patternly:target-date-guidance:state:update-required` + `reason:package-changed` | Zmiana każdego z `packageIdentity`, `packageVersion`, `contentReleaseId`; nigdy porównanie wersji alone. |
| 4 `update_required` | `cadence_changed`: `goalRevision !== plan.goalRevision` przy identycznym target snapshot | `Your learning rhythm changed. Review the updated plan.` / `Zmieniono rytm nauki. Sprawdź zaktualizowany plan.` | `warning` | `Review updated plan` / `Sprawdź zaktualizowany plan` → `LearningPlanProposal` | `Review updated plan` / `Sprawdź zaktualizowany plan`; brak secondary | `U(update_required) / U(update_required) / U(update_required) / U(update_required)` | `patternly:target-date-guidance:state:update-required` + `reason:cadence-changed` | Revision mismatch bez zmiany targetu; kombinacje sprawdzają `target_changed > package_changed > cadence_changed`. |
| 5 `plan_paused` | Świeży plan ma `status === "paused"`, a cel jest aktywny | `Your learning plan is paused.` / `Twój plan nauki jest wstrzymany.` | `muted` | `Resume plan` / `Wznów plan` → `LearningPlanEditor` | `Resume plan` / `Wznów plan`; brak secondary | `U(plan_paused) / U(plan_paused) / U(plan_paused) / D(targetDate)` albo `T(no_target_date)` | `patternly:target-date-guidance:state:plan-paused` | Plan paused z datą i bez; brak startu sesji; stale plan nadal daje update_required. |
| 6 `completed` | Świeży plan, `c3Result === "completed"` | `You have completed this goal.` / `Ten cel został ukończony.` | `positive` | `View progress` / `Zobacz postęp` → `Progress` | `View progress` / `Zobacz postęp`; brak secondary | `U(completed) / U(completed) / T(completed) / D(targetDate)` albo `T(goal_complete)` | `patternly:target-date-guidance:state:completed` | C3 completed po świeżym planie; osobno stale plan + C3 completed musi dać update. |
| 7 `overdue` | Event: `today >= targetDate`; deadline/checkpoint: `today > targetDate`; C3 nie completed | `This target date has passed. Adjust your goal if needed.` / `Termin minął. W razie potrzeby zmień cel.` | `danger` | `Adjust goal` / `Zmień cel` → `GoalCadence` | `Adjust goal` / `Zmień cel`; brak secondary | `Q/Q/D/D` przy available, inaczej `U/U/U/D` | `patternly:target-date-guidance:state:overdue` | Lokalny event equal/after boundary; deadline i checkpoint equal są jeszcze nie-overdue; completed wygrywa. |
| 8 `unreachable` | Available i `remainingPlannedCapacity < remainingRequiredAttempts`, reason `insufficient_sessions` | `The current schedule cannot reach this target.` / `Obecny harmonogram nie pozwoli osiągnąć tego celu.` | `danger` | `Adjust schedule` / `Zmień harmonogram` → `LearningPlanEditor` | `Adjust schedule` / `Zmień harmonogram`; `Adjust goal` / `Zmień cel` → `GoalCadence` | `Q(required) / Q(actual) / D(projected) / D(target)` | `patternly:target-date-guidance:state:unreachable` + `reason:insufficient-sessions` | Capacity `<` attempts; granica `capacity === attempts` nie jest unreachable. |
| 8 `unreachable` | `PaceForecast.unavailable("no_future_slots")`, target obecny i jeszcze nie-overdue | `There are no future sessions before this target.` / `Przed tym terminem nie ma już przyszłych sesji.` | `danger` | `Adjust schedule` / `Zmień harmonogram` → `LearningPlanEditor` | `Adjust schedule` / `Zmień harmonogram`; `Adjust goal` / `Zmień cel` → `GoalCadence` | `U(no_future_slots) / U(no_future_slots) / U(no_future_slots) / D(targetDate)` | `patternly:target-date-guidance:state:unreachable` + `reason:no-future-slots` | Target obecny i przyszłe sloty puste; brak liczb; no_future na przekroczonym evencie daje overdue. |
| 9 `at_risk` | Available, capacity wystarcza, `status === "at_risk"` z ODK030 | `Your current pace may miss this target.` / `Przy obecnym tempie możesz nie zdążyć na ten termin.` | `warning` | `Start next session` / `Rozpocznij następną sesję` → `Practice` | `Start next session` / `Rozpocznij następną sesję`; `Adjust schedule` / `Zmień harmonogram` → `LearningPlanEditor` | `Q(required) / Q(actual) / D(projected) / D(target)` | `patternly:target-date-guidance:state:at-risk` | Typed at-risk, bez odtwarzania progu w UI; trend improving/stable/slowing pozostaje typed. |
| 10 `on_track` | Available, capacity wystarcza, `status === "on_track"` z ODK030 | `Your current pace is on track for this target.` / `Twoje obecne tempo pozwala zdążyć na ten termin.` | `positive` | `Start next session` / `Rozpocznij następną sesję` → `Practice` | `Start next session` / `Rozpocznij następną sesję`; brak secondary | `Q(required) / Q(actual) / D(projected) / D(target)` | `patternly:target-date-guidance:state:on-track` | Typed on-track; capacity equal attempts, exact status boundary i brak liczenia przez komponent. |
| 11 `open_ended` | Świeży aktywny plan, `targetDate === null` albo `meaning === "none"` | `Keep learning at your own pace.` / `Ucz się dalej we własnym tempie.` | `neutral` | `Continue plan` / `Kontynuuj plan` → `Practice` | `Continue plan` / `Kontynuuj plan`; brak secondary | `T(flexible) / T(flexible) / T(flexible) / T(no_target_date)` | `patternly:target-date-guidance:state:open-ended` | Event/deadline/checkpoint bez daty i none/null; zawsze reason `no_target`. |
| 12 `unavailable` | `unknown_completion_rule`, target może istnieć | `This package has no completion rule yet.` / `Ten pakiet nie ma jeszcze reguły ukończenia.` | `neutral` | `Adjust goal` / `Zmień cel` → `GoalCadence` | `Adjust goal` / `Zmień cel`; brak secondary | `U(unknown_completion_rule) / U(unknown_completion_rule) / U(unknown_completion_rule) / D(targetDate)` albo `T(no_target_date)` | `patternly:target-date-guidance:state:unavailable` + `reason:unknown-completion-rule` | Znany brak C3; brak Retry, brak liczb, brak starego forecastu. |
| 12 `unavailable` | `insufficient_elapsed_evidence` | `Keep practising to build a useful forecast.` / `Ćwicz dalej, aby zbudować wiarygodną prognozę.` | `neutral` | `Continue plan` / `Kontynuuj plan` → `Practice` | `Continue plan` / `Kontynuuj plan`; brak secondary | `U(insufficient_elapsed_evidence) / U(insufficient_elapsed_evidence) / U(insufficient_elapsed_evidence) / D(targetDate)` albo `T(no_target_date)` | `patternly:target-date-guidance:state:unavailable` + `reason:insufficient-elapsed-evidence` | Neutralny brak danych; Continue plan/Practice, nie at-risk i nie unreachable. |
| 12 `unavailable` | `calculation_error` | `We could not update your guidance. Try again.` / `Nie udało się odświeżyć wskazówki. Spróbuj ponownie.` | `warning` | `Try again` / `Spróbuj ponownie` → `TargetDateGuidanceRecompute` | `Try again` / `Spróbuj ponownie`; brak secondary | `U(calculation_error) / U(calculation_error) / U(calculation_error) / D(targetDate)` albo `T(no_target_date)` | `patternly:target-date-guidance:state:unavailable` + `reason:calculation-error` | Jedyny retryable reason; retry uruchamia prawdziwe przeliczenie, nie zmienia CTA na pozorny sukces. |
| 12 `unavailable` | Forecast ma `no_target`, lecz fresh accepted snapshot zawiera datę | `The target could not be read. Adjust your goal.` / `Nie udało się odczytać terminu. Zmień cel.` | `neutral` | `Adjust goal` / `Zmień cel` → `GoalCadence` | `Adjust goal` / `Zmień cel`; brak secondary | `U(no_target) / U(no_target) / U(no_target) / D(targetDate)` | `patternly:target-date-guidance:state:unavailable` + `reason:no-target` | Guard niespójności; prawidłowy fresh plan bez targetu zawsze trafia do open-ended. |

Home nie renderuje secondary CTA. Progress może otrzymać secondary wyłącznie w dwóch wierszach: `unreachable` → Adjust goal i `at_risk` → Adjust schedule. Wszystkie inne stany zwracają `secondary: null`; UI nie może dodać własnej akcji.

### Układ Home i Progress

Home używa istniejącego wzorca jednej karty decyzji. Karta zawiera etykietę stanu, jeden nagłówek, jedno krótkie zdanie i dokładnie jedną primary CTA. Nie dodaje tabeli, wykresu ani secondary CTA. Aktywna sesja pozostaje nadrzędną akcją sesyjną; guidance nie może zastąpić bezpiecznego resume inną sesją.

Progress pokazuje ten sam `state`, `reason`, `tone` i `messageKey`. Pod kartą renderuje cztery fakty w kolejności z kontraktu. Na wąskim ekranie każdy fakt przechodzi do osobnego wiersza. Przy font scale 2 etykieta i wartość mogą zająć wiele linii. Primary i dopuszczalne secondary układają się pionowo. Żaden tekst nie jest skracany wielokropkiem.

Tone jest mapowany na istniejące tokeny prezentacji. `positive` używa istniejącego wyglądu success. `danger` nie oznacza alarmowego języka; wyróżnia tylko przypadek wymagający zmiany planu. Kolor nigdy nie jest jedynym nośnikiem znaczenia.

### Lokalizacja i formatowanie

Implementacja rejestruje namespace `learningPlan` w `src/i18n.ts`. Ponieważ bieżące i18next ma globalne `keySeparator: false`, zasoby `learningPlan` są płaskimi słownikami, a kropki w `GuidanceMessageKey` są częścią literalnego klucza. Nie wolno tworzyć zagnieżdżonych obiektów i liczyć na lookup po ścieżce. EN i PL mają pełną parity kluczy dla:

- nazw stanów i każdego reason;
- komunikatów kart Home i Progress;
- nazw czterech faktów i każdego `GuidanceFactUnavailableReason`;
- wartości tekstowych `goal_complete`, `flexible`, `no_target_date`, `completed`;
- etykiet wszystkich akcji.

Liczby z jednostką używają natywnej pluralizacji i18next: EN `_one`/`_other`, PL `_one`/`_few`/`_many`/`_other`, zawsze z parametrem `count`. Nie dodaje się ICU, parsera MessageFormat ani nowej zależności. Daty formatuje `Intl.DateTimeFormat` dla locale użytkownika i `acceptedPlan.timezone`. Wartości domenowe `YYYY-MM-DD` nie są najpierw zamieniane na północ UTC.

`GuidanceMessageKey` jest zamkniętą unią. Jedna wyczerpująca mapa `(state, reason) → GuidanceMessageKey` jest własnością presentation mappera; tabela powyżej jest jej kontraktem copy. Test parity odrzuca brak literalnego klucza albo suffixu. Test prezentacji obejmuje każdy wpis mapy, EN one/other, PL one/few/many/other oraz datę po obu stronach granicy zmiany dnia w timezone planu.

### Typowane selektory

ODK-E2E-032–033 dodają jedną factory do `runtimeSelectors`. Komponenty nie interpolują surowych stringów:

```ts
targetDateGuidance: {
  root(surface: "home" | "progress"): RuntimeSelectorId;
  state(surface: "home" | "progress", state: TargetDateGuidanceState): RuntimeSelectorId;
  reason(surface: "home" | "progress", reason: TargetDateGuidanceReason): RuntimeSelectorId;
  fact(kind: "required-pace" | "actual-pace" | "forecast" | "target"): RuntimeSelectorId;
  primary(surface: "home" | "progress"): RuntimeSelectorId;
  secondary(): RuntimeSelectorId;
}
```

Factory wydaje wartości pod prefiksem `patternly:target-date-guidance:*`. Segmenty enumów są normalizowane wyłącznie w factory z `snake_case` do `kebab-case`; komponent nie wykonuje tej zamiany. Test kontraktu selectorów sprawdza każdą wartość state/reason, dokładny wynik normalizacji i brak ręcznych duplikatów w komponentach.

### Deterministyczne fixtures i dowody

Późniejszy test domenowy i E2E używa stałego `now`, jawnej IANA timezone oraz pełnych, zweryfikowanych pinów. Macierz obejmuje:

- każdy state i każdy reason z tabeli, w tym osobny `plan_paused`;
- event, deadline, checkpoint i none;
- non-own-pace bez daty;
- event dokładnie w dniu targetu oraz deadline/checkpoint dokładnie w dniu targetu;
- zmianę samej daty, samego meaning, cadence i każdego pola pina;
- C3 `unknown`, `in_progress` i `completed`, w tym completed przy nieświeżym planie;
- forecast available oraz każdy unavailable reason;
- capacity `<`, `=` i `>` remaining attempts;
- Home/Progress parity, aktywne resume, brak uruchomienia sesji ze stale planu;
- EN/PL, długą nazwę tracka i font scale 2.

Dowód wizualny obejmuje oba ekrany dla `on_track`, `at_risk`, `unreachable`, `update_required`, `overdue`, `open_ended` i `completed`. VoiceOver jest jawnie pominięty.

### Podział odpowiedzialności kolejnych zadań

- ODK-E2E-028 tworzy propozycję oraz wejście `Create plan`/`Review updated plan`.
- ODK-E2E-029 zapisuje `acceptedTarget`, edytuje harmonogram i realizuje `Resume plan` oraz `Adjust schedule` przez `LearningPlanEditor`.
- ODK-E2E-030 definiuje i testuje formuły `PaceForecast`, progi `on_track`/`at_risk` oraz czystą projekcję `TargetDateGuidance`.
- ODK-E2E-031 dopracowuje copy bez zmiany stanów, reason, precedence ani akcji.
- ODK-E2E-032 i 033 renderują tę samą projekcję odpowiednio na Home i Progress.
- ODK-E2E-054 uruchamia przeliczenie po zmianie lub przekroczeniu targetu.

ODK-E2E-053 nie wdraża generatora, repozytorium planu, wzorów forecastu, nawigacji ani widoków. Nie rozszerza zakresu synchronizacji ODK-E2E-056.

## Wejścia generatora

- `GoalSnapshot`;
- zaakceptowany track i pełny, zweryfikowany pin pakietu treści;
- dostępny zakres pytań;
- terminalne fakty sesji i prób;
- aktualna kolejka review;
- strefa czasowa i początek tygodnia;
- dostępne dni i godziny;
- target date, jeśli istnieje.

## Wyjścia

- nietrwała `LearningPlanProposal`;
- ocena osiągalności terminu;
- liczba pytań na sesję;
- tygodniowe sloty;
- `TargetDateGuidance` dla bieżącego dnia i całego celu.

`TargetDateGuidance` zawiera stan terminu, cztery jawne fakty oraz kanoniczne akcje Home i Progress. Następna sesja i jej liczba pytań pozostają faktami zaakceptowanego planu używanymi przez Practice.

## Reguły aktualizacji

- Zmiana celu zwiększa jego revision i wymaga nowej propozycji planu.
- Edycja albo akceptacja planu zwiększa `planRevision`.
- Zmiana pakietu treści wymaga ponownego przeliczenia.
- Ukończenie, pominięcie lub przerwanie sesji zmienia fakty. Projekcja przelicza się bez przepisywania historii.
- Review ma pierwszeństwo zgodne z regułami tracka. Plan nie duplikuje kolejki review.
- Brak sieci nie może usuwać zaakceptowanego planu.
- Nieudane przeliczenie zachowuje ostatni zaakceptowany plan i pokazuje jawny błąd.

## Synchronizacja

Docelowo synchronizowane są `GoalRecord` i zaakceptowany `LearningPlan` per `trackId`. Oba używają wersji rekordu, fingerprintu i konfliktów zgodnych z account sync. Propozycja nigdy nie jest synchronizowana.

Nie synchronizuje się:

- `TargetDateGuidance`;
- systemowego `notificationId`;
- stanu zgody systemowej;
- lokalnych identyfikatorów zaplanowanych powiadomień.

Konflikt lokalnego i chmurowego celu lub planu wymaga decyzji ODK-E2E-056. Do tego czasu nie wolno wdrażać cichego wyboru strony.

## Konsumenci

- Goal zapisuje preferencje i otwiera propozycję planu.
- Practice rozpoczyna sesję wskazaną przez bieżący, świeży `TargetDateGuidance` i zaakceptowany plan.
- Home pokazuje dzisiejszą akcję.
- Progress pokazuje tempo, prognozę i status celu.
- Reminders materializuje lokalny harmonogram z zaakceptowanych slotów.

## Zależności ODK-E2E-018–035

| Zadanie | Rola w kontrakcie |
| --- | --- |
| 018 | Ustala, że liczba sesji wynika z wybranych dni. |
| 019 | Ustala nazwę wejścia Goal. |
| 020–021 | Projekt i prezentacja kontekstu Goal. Nie zmieniają modelu. |
| 022–023 | Ustalają nazwę i powrót Reminders. |
| 024 | Łączy reminder z dniami zaakceptowanego planu. |
| 025 | Projektuje wspólną albo osobne godziny slotów. |
| 026 | Definiuje reguły generatora, zakres materiału i przypadki brzegowe. |
| 027 | Projektuje propozycję przed akceptacją. |
| 028 | Wdraża generator `LearningPlan`. |
| 029 | Wdraża edycję i akceptację slotów. |
| 030 | Wdraża `TargetDateGuidance`, tempo i prognozę. |
| 031 | Projektuje krótkie statusy i rekomendacje. |
| 032 | Podłącza Home do `TargetDateGuidance`. |
| 033 | Podłącza Progress do `TargetDateGuidance`. |
| 034 | Materializuje reminders z zaakceptowanych slotów. |
| 035 | Sprawdza pełny przepływ jednego planu. |

ODK-E2E-053 projektuje stany target date przed wdrożeniem 030 i 054.

## Walidacja briefu

Niezależny `gpt-5.6-luna / max`, bez narzędzi:

- zgodność celu i architektury: 0,96;
- prostota: 0,91;
- ryzyko: 0,88;
- utrzymywalność: 0,94;
- minimum: 0,88;
- werdykt: APPROVE.
