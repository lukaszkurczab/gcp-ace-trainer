# AUD-02B — Coding Mock Premium

**Status:** PASS  
**Data:** 28 września 2026  
**Implementacja:** `patternly` `c9ff4267`  
**Content:** `patternly-content` `8570ed200a52f128c1e654c5640e53667e586e55`  
**Urządzenie:** istniejący iPhone 17 Simulator, iOS 26.4, `7F315654-3175-4F3C-BB24-B0263F59360C`

## Wynik

`Coding Mock Interview` jest ponownie dostępną funkcją Premium opartą na kanonicznym profilu 40 pytań. Free kończy się na paywallu bez utworzenia sesji. Premium przechodzi pełny cykl: start, trwała odpowiedź i flaga, navigator, cold resume, ręczne zakończenie lub timeout, wynik i review 40/40.

## Zmiana

- Practice Hub oferuje Coding Mock wyłącznie dla zweryfikowanego profilu, bez zmiany zwykłych trybów Coding Practice.
- Bootstrap czeka na zakończenie przygotowania profilu przed kompozycją i wznowieniem sesji; Home wznawia dokładny profil `coding-interview-simulation`.
- Odpowiedź lokalna jest kluczowana wystąpieniem pytania, dzięki czemu navigator i powrót po restarcie zachowują właściwy draft.
- Wybór aktywnego tracka jest trwały. Reconciliation przypomnienia kończy się przed callbackiem lub nawigacją; wynik wymagający uwagi pozostaje jawnym błędem na ekranie.
- Adopcja danych Gościa korzysta ze wspólnego partitionera recovery: błędny pojedynczy plan trafia do kwarantanny, poprawny cel i jednoznaczny active track są materializowane.
- Usunięto zastąpiony helper równoległej nawigacji i martwe ścieżki w dotkniętym obszarze.

## Evidence runtime

- Pełny finalny runner: `/tmp/patternly-aud02b-coding-evidence/2026-09-28-full-runner-v16`.
- Free/paywall, cold relaunch i brak ekranu symulacji: `2026-09-28_011336`.
- Premium: answer change, save, flaga/navigator, cold resume na pytaniu 2, ręczne zakończenie, wynik 1/40 i review pytań 1–40: `2026-09-28_011511`.
- Timeout/expiry: aktywna sesja `2026-09-28_011748`; wynik 0/40 i review pytań 1–40 `2026-09-28_011804`.
- Użyto jednej instalacji `com.lkurczab.patternly` na jedynym bootowanym wymaganym iPhonie 17.

## Weryfikacja

- Pełne `npm test` z `PATTERNLY_CONTENT_HISTORICAL_ROOT` wskazującym `cc3efca88be7e01137f10ac69a0643f06b61a350`, bieżącym contentem `8570ed200a52f128c1e654c5640e53667e586e55` i jawnym `PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA` — 1385/1385 PASS.
- `npm run typecheck` — PASS.
- `git diff --check` — PASS.
- SelectTrack po korekcie — 7/7 PASS; niezależny reviewer uruchomił account/repository/SelectTrack — 60/60 PASS.
- Pełny Maestro RC v16 — PASS, runner exit 0.

## Niezależne QA

- Brief rozwiązania cold resume: `gpt-6-luna high`, minimum 0,84 — APPROVED; implementacja: `gpt-6-luna medium`.
- Pierwszy końcowy `qa-gate` `gpt-6-luna high` wykrył pominięcie kwarantanny adopcji danych; poprawka i test regresji zostały wykonane przez `gpt-6-luna medium`.
- Drugi `qa-gate` wykrył niewidoczny błąd reminder reconciliation po przedwczesnej nawigacji. Brief poprawki: `gpt-6-luna high`, minimum 0,85 — APPROVED; implementacja: `gpt-6-luna medium`.
- Końcowy niezależny `qa-gate`: `gpt-6-luna high` — **PASS**.

## Granice

- Backend używał lokalnego fixture entitlement `expired|active`; nie jest to dowód realnego RevenueCat, sklepu ani produkcji.
- Lokalny paywall korzysta z testowej konfiguracji legalnej; screenshot potwierdza blokadę Free, nie gotowość produkcyjnej oferty.
- Failure path reminder reconciliation ma testy i niezależną inspekcję kodu, ale nie był osobno wymuszany w runtime na urządzeniu.
- Nie wykonano deploymentu, publikacji ani zmiany produkcyjnej.
