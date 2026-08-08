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
  16-coding-interview-learning-system.md
  17-training-runtime-and-interaction-spec.md
  canonical-product-contract.yaml
  canonical-product-contract.schema.json
  product-owner-decision-register.md
  launch-completion-plan.md
  launch-surface-inventory.md
  competitive-product-gap-audit.md
  launch-readiness-audit.md

  directives/
    patternly_codex_01_repository_hygiene_and_evidence_cleanup.md
    patternly_codex_task3_product_contract_reconciliation.md
    patternly_codex_brand_design_and_loop_reconciliation-1.md
    patternly_codex_02_canonical_documentation_reconciliation.md
    patternly_codex_03_release_implementation_plan_regeneration.md

  adr/
    ADR-001-local-first-mvp.md
    ADR-002-question-data-json.md
    ADR-003-no-auth-in-mvp.md
    ADR-004-light-first-dark-ready-ui.md
    ADR-005-dark-first-focus-lab-ui.md
```

## Authority

Hierarchia autorytetu jest jednoznaczna:

1. `canonical-product-contract.yaml` — normatywne zachowanie produktu i polityki przekrojowe;
2. `product-owner-decision-register.md` — decyzje właściciela, uzasadnienie i historia supersession;
3. dokumenty `00`–`13` oraz `15`–`17` — narracyjni/domain owners, którzy nie mogą nadpisać kontraktu;
4. ADR-y — historia lub aktywne decyzje techniczne, nigdy product authority ani sequencing;
5. `launch-completion-plan.md` — jedyne aktywne źródło implementation order i repository status;
6. raporty, audyty, Figma references, screenshoty i QA artifacts — dowody.

`docs/directives/` zawiera zweryfikowaną pięcioplikową paczkę wejściową Product Ownera i historyczny zakres trzech zakończonych faz kontrolnych. Decyzje właścicielskie zostały przeniesione do canonical contract, rejestru PO i narrative owners; dyrektywy wejściowe nie są drugim normatywnym kontraktem ani execution planem.

`launch-surface-inventory.md`, `competitive-product-gap-audit.md` oraz `launch-readiness-audit.md` są oznaczonymi, historycznymi wejściami dowodowymi. Nie są bieżącym źródłem produktu, statusu, gate'ów ani kolejności wykonania.

Figma jest przejściowym visual authority wyłącznie podczas aktywnej fazy
designu i tylko Product Owner może zatwierdzić realną pracę wizualną. Po
zweryfikowanym handoffie do `CODE_CANONICAL` operational authority przechodzi
do repozytorium: tokenów, assets, production components, Storybooka, testów i
checked-in baselines. Ani Figma, ani Storybook nie są product-behavior lub
execution authority; Storybook nie może wejść do release bundle.

## Najważniejsza zasada produktu

Aplikacja ma pomagać użytkownikowi trenować techniczne myślenie przez aktywną próbę, feedback diagnostyczny, review błędów i rozpoznawanie wzorców. Nie jest pełną platformą e-learningową, oficjalnym symulatorem egzaminu ani klonem LeetCode.

Każda funkcja powinna przejść przez pytanie:

> Czy ta funkcja realnie poprawia aktywną praktykę, diagnozę błędów, rozpoznawanie wzorców albo decyzję użytkownika, co ćwiczyć dalej?

Jeżeli nie, nie trafia do produktu.
