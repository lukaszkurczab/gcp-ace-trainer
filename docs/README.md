# Patternly — dokumentacja

Status: **draft v0.1**  
Zakres: **cała aplikacja**  
Kontekst: **Patternly** jest wielotrackowym narzędziem treningowym do technicznej nauki, focused practice, rozpoznawania wzorców i review błędów. Starszy kontekst GCP ACE pozostaje historią pierwszego tracka certyfikacyjnego, ale nie jest już zakresem całego produktu.

## Cel dokumentacji

Ten folder jest głównym miejscem decyzji produktowych, architektonicznych i projektowych dla aplikacji **Patternly**.

Dokumentacja ma służyć jako:

- punkt odniesienia przy implementacji,
- baza dla decyzji architektonicznych,
- opis stylu wizualnego i komunikacji,
- kontrakt między produktem, UI i kodem,
- zabezpieczenie przed rozrostem zakresu MVP.

## Struktura

```txt
docs/
  00-overview.md
  01-product-definition.md
  02-architecture.md
  03-navigation-and-flows.md
  04-data-model.md
  05-design-system.md
  06-branding-and-style-direction.md
  07-content-guidelines.md
  08-storage-and-offline.md
  09-security-and-privacy.md
  10-roadmap.md
  11-implementation-guidelines.md
  12-testing-strategy.md
  13-risk-register.md
  14-learning-effectiveness-model.md
  15-certification-track-learning-system.md
  16-leetcode-like-learning-system.md

  adr/
    ADR-001-local-first-mvp.md
    ADR-002-question-data-json.md
    ADR-003-no-auth-in-mvp.md
    ADR-004-light-first-dark-ready-ui.md
    ADR-005-dark-first-focus-lab-ui.md
```

## Główne decyzje

1. Kanoniczna nazwa i kierunek produktu to **Patternly**.
2. Patternly jest **wielotrackową aplikacją treningową** dla technicznej nauki, a nie pojedynczym trenerem GCP ACE.
3. Pierwsze tracki produktowe to `cloud-certification` oraz `algorithms`.
4. Certification-style practice i LeetCode-like / algorithmic practice mają osobne mechaniki uczenia. Mogą współdzielić shell, nawigację, język wizualny, storage primitives, historię sesji, progress infrastructure i review infrastructure, ale nie mogą zostać spłaszczone do jednego generycznego quiz/question loopu.
5. Aplikacja w MVP jest **local-first/offline-first**.
6. Nie ma backendu, kont użytkownika ani synchronizacji w MVP.
7. Stack aplikacji: **Expo / React Native / TypeScript**.
8. Content jest dostarczany jako lokalne, wersjonowane paczki per track. Pytania egzaminacyjne są tylko jednym wariantem `TrainingItem`.
9. UI ma być dark-first **Focus Lab**: spokojny, premium, techniczny i neutralny domenowo.
10. Nie traktować syntetycznych procentów typu `readiness` lub `retention` jako kanonicznych metryk produktu, jeżeli nie są jawnie wyliczone z zachowań użytkownika i opisane jako ostrożne sygnały diagnostyczne.
11. Aplikacja nie może sugerować oficjalnej afiliacji z Google, LeetCode ani właścicielami certyfikacji lub platform coding-practice.
12. Wspólne style i komponenty powinny żyć w design systemie, nie w jednorazowych stylach ekranów.

## Kanoniczne modele uczenia

- `14-learning-effectiveness-model.md` jest nadrzędnym, ogólnym modelem uczenia dla Patternly.
- `15-certification-track-learning-system.md` jest kanonicznym modelem dla tracków certyfikacyjnych.
- `16-leetcode-like-learning-system.md` jest kanonicznym modelem dla tracków LeetCode-like / algorithmic problem-solving.

Jeżeli starszy dokument, ADR albo implementacja używa pojęć takich jak `Question`, `ExamDomain`, `ExamScreen` albo `gcpAceTrainer.*`, należy traktować je jako historyczny lub aktualny stan implementacji, a nie jako kanoniczną wspólną architekturę.

## Najważniejsza zasada produktu

Aplikacja ma pomagać użytkownikowi trenować techniczne myślenie przez aktywną próbę, feedback diagnostyczny, review błędów i rozpoznawanie wzorców. Nie jest pełną platformą e-learningową, oficjalnym symulatorem egzaminu ani klonem LeetCode.

Każda funkcja powinna przejść przez pytanie:

> Czy ta funkcja realnie poprawia aktywną praktykę, diagnozę błędów, rozpoznawanie wzorców albo decyzję użytkownika, co ćwiczyć dalej?

Jeżeli nie, nie trafia do MVP.
