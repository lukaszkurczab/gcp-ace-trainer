# ODK-E2E-027 — raport wdrożenia i weryfikacji

Status: VERIFIED_CLOSED

Decyzje `026T=T4`, `026C=C3` i `026S=S12` odblokowały projekt. Specyfikacja ekranu propozycji została poprawiona po niezależnym FAIL review: [ODK-E2E-027-DESIGN-SPEC.md](./ODK-E2E-027-DESIGN-SPEC.md).

## Wynik

Projekt opisuje przyszły `LearningPlanProposalCoordinator` jako jedynego in-memory właściciela proposal, route z `proposalId` i `trackId`, ponowną walidację identity, guard one-shot oraz CAS akceptacji w ODK-E2E-029. Propozycja nie jest zapisywana, synchronizowana ani odtwarzana po process death.

Spec ma pełną kolejność stanów: `loading` > `no_goal` > `goal_paused` > `package_error` > `package_unavailable` > `stale` > `generator_error` > `shortfall` > `shortened` > `ready`. Definiuje dla nich copy EN/PL, dane, CTA, przejścia, akceptację, typowane factory selectorów i E2E.

T4 traktuje `targetDate` jako opcjonalną dla wszystkich non-own-pace. Event z datą używa slotów ściśle przed nią w timezone propozycji; event bez daty pokazuje `No event/exam date` i tworzy open-ended cadence. C3 rozróżnia `unknown`, `in_progress` oraz `completed`; informacja jest ukryta bez bieżącego verified context. `package_error` jest retryable. `package_unavailable` jest terminalny i prowadzi wyłącznie do canonical track picker albo Back. Stale, także po process death, wymaga jawnego `Update plan`.

## Weryfikacja

Sprawdzono `GoalCadenceScreen`, `ODK-E2E-052-LEARNING-PLAN-CONTRACT.md` oraz aktywne kontrakty T4, C3 i S12 z ODK-E2E-026. Spec zachowuje istniejący nagłówek z kontekstem tracka, karty podsumowania i sticky footer jako wzorzec prezentacji. Poprawka po FAIL review usuwa niedozwolone role React Native, nie zakłada istniejących kluczy lokalizacji, wymaga `Intl` IANA validation bez fallbacku oraz rozszerza LearningPlan v1 o pełny `contentPackagePin` bez migracji istniejącego runtime planu.

Lokalizacja używa natywnej pluralizacji i18next: osobne pełne zdania dla requested, eligible, missing oraz actual/requested, wywoływane z `count`. Wymagane są rejestracja namespace i zasobów `learningPlan` w `src/i18n.ts`, parity EN/PL i unit render wariantów pluralnych. Nie dodajemy `i18next-icu`, parsera MessageFormat ani nowej zależności. Spec utrwala też focused test S12 dla minimum większego niż 1.

Niezależna walidacja briefu `gpt-5.6-luna / max`, bez narzędzi:

- zgodność celu i architektury: 0,95;
- prostota: 0,84;
- ryzyko: 0,82;
- utrzymywalność: 0,91;
- minimum: 0,82;
- werdykt: APPROVE.

Finalny niezależny QA: `PASS`, bez materialnych blockerów. Focused test S12 dla minimum większego niż 1: 3/3 `PASS`. Typecheck: `PASS`. E2E nie dotyczy, ponieważ zadanie dostarcza wyłącznie projekt dla ODK-E2E-028 i ODK-E2E-029 i nie zmienia widocznego runtime.

## Kolejność

Następne jest ODK-E2E-053. Dopiero po nim ODK-E2E-028 wdraża generator i coordinator zgodne z projektem. ODK-E2E-029 wdraża edycję oraz trwałą akceptację CAS.
