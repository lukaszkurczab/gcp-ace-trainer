# ODK-127 — dokładny link Source

**Status:** `VERIFIED_CLOSED`  
**Data:** 2026-09-21  
**Zakres:** aplikacja iOS; zaakceptowane artefakty contentu pozostały bez zmian.

## Wynik

Details pokazuje źródła jako jawne linki z etykietą hosta. Projekcja bierze wyłącznie authored `sourceRefs` będące dokładnymi URL HTTPS, a następnie jawny `feedback.details.url`; zachowuje kolejność, pełny target z query/hash i deduplikuje tylko identyczne ciągi. Identyfikatory rejestru nie są interpretowane w aplikacji. Brak albo niepoprawny URL daje `Source unavailable` bez handlera.

Próba normalizacji w publisherze została zatrzymana i w całości wycofana: realny build zmienił SHA ośmiu zaakceptowanych artefaktów bez zmiany `contentVersion`, co naruszałoby niezmienność kandydata. Finalna implementacja nie zmienia contentVersion, artefaktów ani SHA.

## Implementacja

- `canonicalSourceLinks.ts` — jedna niedurable projection `Question -> SourceLink[]` oraz jawny wynik `opened`/`failed` dla systemowego opener-a.
- Fasady Certification, Algorithms i Design Interview przenoszą źródła dla bieżącego feedbacku; completed review używa tego samego kontraktu.
- Wszystkie trzy ekrany sesji przekazują `sources` do wspólnego `PracticeFeedbackBlock`; to naprawia wykrytą runtime lukę na granicy fasada → UI.
- `PracticeFeedbackBlock` renderuje pojedynczy link dostępnościowy, usuwa duplikat surowego URL z tekstu details, pokazuje jawny błąd opener-a i nie tworzy fallbacku.
- EN/PL zawierają `Source`, `Open source`, `Source unavailable` i komunikat błędu.

## Weryfikacja

- Walidacja podejścia: APPROVE; architektura `0.92`, prostota `0.88`, ryzyko `0.85`, utrzymywalność `0.90`; minimum `0.85`.
- `npm run typecheck` — PASS.
- Focused source/projection/session/review/presentation tests — PASS (`76/76`); kontrakty report/i18n także PASS.
- `npm run validate:content-boundary` — PASS.
- `npm run validate:runtime-privacy-boundary` — PASS.
- `git diff --check` — PASS.
- Realny zaakceptowany rekord `CCARP-D01-O01-boundary` projektuje dokładnie `https://www.anthropic.com/engineering/building-effective-agents` bez zmiany artefaktu.
- Disposable iOS `Patternly_ODK124`: czysta sesja, odpowiedź, Details i dokładny link — PASS. Surowy URL nie jest duplikowany; accessibility label to `Open source www.anthropic.com`.

## Dowody

- [Runtime screenshot](evidence/ODK-127/source-link-runtime.png)
- [Accessibility hierarchy](evidence/ODK-127/accessibility-hierarchy.json)
- [Powtarzalny flow](evidence/ODK-127/runtime-flow.yaml)
- [Bootstrap czystej sesji](evidence/ODK-127/bootstrap-runtime.yaml)
- [Nawigacja i odpowiedź](evidence/ODK-127/navigate-runtime.yaml)

## Ograniczenia

- Nie otwierano Safari podczas screenshot run, aby nie opuszczać kontrolowanego ekranu; dokładny target oraz sukces/błąd opener-a są pokryte deterministycznym testem.
- Pytania Algorithms bez authored URL poprawnie pozostają w stanie `Source unavailable`; wzbogacenie ich contentu jest osobnym zadaniem authoringowym, nie fallbackiem ODK-127.

## Niezależne QA

**PASS**, brak P0/P1. P2 jest wyłącznie luką dowodową: brak osobnego screenshotu/hierarchy `Source unavailable` i brak faktycznego przejścia do Safari; deterministyczne testy pokrywają invalid/missing oraz dokładny target opener-a. Oceny: architektura `0.94`, prostota `0.90`, ryzyko `0.88`, utrzymywalność `0.92`; minimum `0.88`.
