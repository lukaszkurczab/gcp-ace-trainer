# Patternly — dokumentacja

Status: **narrative documentation index**
Zakres: **cała aplikacja**  
Kontekst: **Patternly** jest wielotrackowym narzędziem treningowym do technicznej nauki, focused practice, rozpoznawania wzorców i review błędów. Starszy kontekst GCP ACE pozostaje historią pierwszego tracka certyfikacyjnego, ale nie jest już zakresem całego produktu.

## Cel dokumentacji

Ten folder zawiera kontekst decyzji produktowych, architektonicznych i projektowych dla aplikacji **Patternly**. Normatywne zachowanie produktu definiuje wyłącznie `canonical-product-contract.yaml`.

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
  15-certification-track-learning-system.md
  16-leetcode-like-learning-system.md
  17-training-runtime-and-interaction-spec.md
  launch-completion-plan.md
  launch-surface-inventory.md
  competitive-product-gap-audit.md
  launch-readiness-audit.md

  adr/
    ADR-001-local-first-mvp.md
    ADR-002-question-data-json.md
    ADR-003-no-auth-in-mvp.md
    ADR-004-light-first-dark-ready-ui.md
    ADR-005-dark-first-focus-lab-ui.md
```

## Authority

`canonical-product-contract.yaml` jest jedynym normatywnym kontraktem zachowania produktu. Dokumenty `00`–`13` oraz `15`–`17` są narracyjne i nie mogą go nadpisywać. `docs/release-candidate-closure.md` jest źródłem bieżącego statusu, a `docs/launch-completion-plan.md` definiuje aktywną kolejność od domknięcia produktu do publicznego launchu. `docs/launch-surface-inventory.md` zamyka jednorazową inwentaryzację tras i brakujących powierzchni, a `docs/competitive-product-gap-audit.md` zamyka benchmark kategorii. `docs/launch-readiness-audit.md` pozostaje materiałem dowodowym dla ryzyk release'u.

ADR-y zachowują historyczne decyzje techniczne, ale nie tworzą drugiego planu wykonawczego i nie zastępują kanonicznych kontraktów. Artefakty audytowe oraz materiały projektowe są dowodami lub referencjami wizualnymi, nie źródłami kontraktu ani kolejności wykonania.

## Najważniejsza zasada produktu

Aplikacja ma pomagać użytkownikowi trenować techniczne myślenie przez aktywną próbę, feedback diagnostyczny, review błędów i rozpoznawanie wzorców. Nie jest pełną platformą e-learningową, oficjalnym symulatorem egzaminu ani klonem LeetCode.

Każda funkcja powinna przejść przez pytanie:

> Czy ta funkcja realnie poprawia aktywną praktykę, diagnozę błędów, rozpoznawanie wzorców albo decyzję użytkownika, co ćwiczyć dalej?

Jeżeli nie, nie trafia do MVP.
