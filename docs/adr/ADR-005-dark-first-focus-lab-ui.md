# ADR-005 — Dark-first Focus Lab UI

Status: **Accepted**
Data: 2026-06-29

## Kontekst

Patternly nie jest już pojedynczym trenerem GCP ACE ani light-first exam simulator. Kanoniczny produkt to wielotrackowe, techniczne narzędzie treningowe dla:

- cloud/certification-style practice,
- LeetCode-like / algorithmic problem-solving practice,
- przyszłych tracków technicznych, jeżeli zostaną dodane.

Dokumenty `00-overview.md`, `01-product-definition.md`, `05-design-system.md`, `06-branding-and-style-direction.md`, `14-learning-effectiveness-model.md`, `15-certification-track-learning-system.md` i `16-leetcode-like-learning-system.md` przesuwają kierunek produktu w stronę Focus Lab: spokojnego, premium, technicznego i neutralnego domenowo środowiska praktyki.

## Decyzja

UI Patternly jest projektowane jako **dark-first Focus Lab**.

Kierunek oznacza:

- dark-first, ale czytelny,
- spokojny i techniczny, nie terminalowy,
- premium, ale niedekoracyjny,
- domain-neutral, bez wizualnego kopiowania Google, LeetCode albo platform certyfikacyjnych,
- oparty na mocnej hierarchii, ograniczonej liczbie metryk i progressive disclosure,
- wolny od gamified UI, mascots, noisy edtech patterns i agresywnych gradientów.

Light mode może istnieć później jako wariant dostępnościowy lub preferencja użytkownika, ale nie jest kanonicznym kierunkiem wizualnym MVP.

## Uzasadnienie

Dark-first Focus Lab lepiej wspiera aktualne pozycjonowanie Patternly jako osobistego laboratorium technicznego treningu. Produkt ma pomagać użytkownikowi skupić się na aktywnej próbie, feedbacku diagnostycznym, review błędów i rozpoznawaniu wzorców, a nie przypominać oficjalnego symulatora egzaminu, katalogu kursów albo platformy coding-practice.

## Konsekwencje

- `ADR-004-light-first-dark-ready-ui.md` zostaje superseded.
- Design system i przyszła implementacja UI powinny używać dark-first tokenów jako domyślnych.
- Dokumentacja nie powinna opisywać `light-first` jako aktywnego kierunku produktu.
- Istniejąca light-first implementacja pozostaje aktualną rzeczywistością repozytorium, ale nie jest kanonicznym docelowym kierunkiem.
- Każda przyszła praca UI musi zachować neutralność tracków i nie może sprowadzać produktu do jednego GCP/exam albo LeetCode-like visual modelu.

## Non-goals

- Ten ADR nie implementuje dark mode.
- Ten ADR nie wymaga natychmiastowej przebudowy komponentów.
- Ten ADR nie dodaje osobnych theme'ów per track.
- Ten ADR nie wprowadza gamifikacji, rankingów, badge'y ani fake precision metrics.

## Powiązane dokumenty

- `docs/00-overview.md`
- `docs/05-design-system.md`
- `docs/06-branding-and-style-direction.md`
- `docs/14-learning-effectiveness-model.md`
- `planning/patternly-product-audit-and-execution-plan.md`
