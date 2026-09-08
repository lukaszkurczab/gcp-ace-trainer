# ODK-E2E-052 — kanoniczny kontrakt planu nauki

Status: ACCEPTED

## Decyzja

Plan ma jednego właściciela domenowego: moduł `learning-plan` w warstwie domain/application.

Źródła prawdy są rozdzielone:

1. `GoalRecord` zapisuje zamiar i preferencje użytkownika dla tracka.
2. `LearningPlan` zapisuje wyłącznie zaakceptowany harmonogram dla tego celu.
3. Sesje, próby i kolejka powtórek zapisują fakty wykonanej nauki.
4. `PlanStatus` jest zawsze wyliczaną projekcją. Nie jest osobnym zapisem.
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
type LearningPlan = {
  schemaVersion: 1;
  planId: string;
  trackId: TrackId;
  goalRevision: number;
  status: "accepted" | "paused" | "completed";
  timezone: string;
  contentPackageVersion: string;
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

Plan nie kopiuje wyników sesji ani kolejki review. `goalRevision` pochodzi z `GoalSnapshot`. `sessionLength` opisuje planowaną liczbę pytań. Konkretne pytania są wybierane przy starcie sesji z aktualnego zakresu i review.

Propozycja jest nietrwałym `LearningPlanProposal`. Nie jest synchronizowana. Dopiero jawna akceptacja tworzy `LearningPlan` z `planRevision: 1`.

## Wejścia generatora

- `GoalSnapshot`;
- zaakceptowany track i wersja pakietu treści;
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
- `PlanStatus` dla bieżącego dnia i całego celu.

`PlanStatus` zawiera co najmniej: wymagane tempo, faktyczne tempo, prognozowaną datę, stan terminu, następną sesję, liczbę pytań i rekomendację.

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

- `PlanStatus`;
- systemowego `notificationId`;
- stanu zgody systemowej;
- lokalnych identyfikatorów zaplanowanych powiadomień.

Konflikt lokalnego i chmurowego celu lub planu wymaga decyzji ODK-E2E-056. Do tego czasu nie wolno wdrażać cichego wyboru strony.

## Konsumenci

- Goal zapisuje preferencje i otwiera propozycję planu.
- Practice rozpoczyna sesję wskazaną przez bieżący `PlanStatus`.
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
| 030 | Wdraża `PlanStatus`, tempo i prognozę. |
| 031 | Projektuje krótkie statusy i rekomendacje. |
| 032 | Podłącza Home do `PlanStatus`. |
| 033 | Podłącza Progress do `PlanStatus`. |
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
