# AUD-02C — Design Interview Premium

**Status:** PASS  
**Data:** 28 września 2026  
**Implementacja:** `patternly` `b57d8c38`, finalny binding `3e3769f5`  
**Content:** `patternly-content` `010930a3f47648dcc88eeee2ff28f3ec62cf58f6`  
**Kandydat:** `73cc89fb98b14c60fd9053f02d4c25e4c8c68453a0a35f38026af4e4f98de69f`  
**Urządzenie:** istniejący iPhone 17 Simulator, iOS 26.4, `7F315654-3175-4F3C-BB24-B0263F59360C`

## Wynik

Cała rodzina Design Interview wymaga potwierdzonego Premium. Free prowadzi do paywalla bez utworzenia sesji. Premium udostępnia dla Backend, OOD i Frontend rzeczywisty 45-minutowy otwarty case: wymagania → architektura → trade-offy → finalna odpowiedź. Wynik potwierdza kompletność, a review pokazuje odpowiedzi i jawną rubrykę kompetencji bez automatycznego punktowania jakości architektury.

## Zmiana

- Trzy wersjonowane profile symulacji zachowują istniejące banki pytań i dodają osobne case'y z trwałym absolutnym deadline'em.
- Jeden kontrakt Premium obejmuje discovery, start i resume wszystkich trybów Design Interview; darmowy node nie stanowi drogi obejścia.
- Dedykowany runtime zachowuje dokładną tożsamość profilu, cztery etapowe odpowiedzi, autosave z drainem, cold resume, ręczne zakończenie i idempotentny timeout.
- Zapis absolutnego deadline'u nie tworzy konkurencyjnego timera foreground; przed deadline'em zapisuje draft, a po deadline'ie finalizuje kanonicznie bez późnego commitu.
- Result i review mają poprawny top safe area; tytuł trybu jest dostępny we wszystkich siedmiu locale.

## Evidence runtime

- Pełny trzytrackowy runner: `/tmp/patternly-aud02c-design-evidence/2026-09-28-full-runner-v8`.
- Dla każdego z trzech tracków: Free/paywall i brak sesji po restarcie; Premium zapis czterech etapów, terminate/relaunch/resume, ręczne zakończenie, wynik i review; osobny timeout z wynikiem i review.
- Finalna kontrola safe area result/review: `/tmp/aud02c-safe-area-evidence/2026-09-28_035128`.
- Użyto jednej instalacji `com.lkurczab.patternly` na jedynym bootowanym wymaganym iPhonie 17.

## Weryfikacja

- Pełne app `npm test` z historycznym contentem `cc3efca88be7e01137f10ac69a0643f06b61a350` i bieżącym `010930a3f47648dcc88eeee2ff28f3ec62cf58f6` — 1407/1407 PASS.
- Kontrakty finalnie wykryte przez pełną bramkę: lifecycle owner i locale — 6/6 PASS po korekcie.
- `npm run typecheck` — PASS; `git diff --check` — PASS.
- Content `npm test` — 80/80 PASS; migracja — 9 tracków i 16 077 pytań; release gate v2 — `RELEASE_READY`; runtime admission i lock generator — PASS.
- Pełny Maestro RC v8 oraz kontrola safe area — PASS.

## Niezależne QA

- Brief funkcji i osobne briefy trudnych poprawek: `gpt-6-luna high`; zwykła implementacja: `gpt-6-luna medium`.
- Pierwszy końcowy `qa-gate` wykrył nieaktualny kontrakt tras oraz niezamknięte bindingi/evidence. Kontrakt, bindingi i pełne bramki zostały uzupełnione.
- Finalne dwa błędy pełnego suite zostały niezależnie sklasyfikowane przez `gpt-6-luna high` jako pominięcia AUD-02C; minimalna korekta uzyskała minimum 0,93 i została wykonana przez `gpt-6-luna medium`.
- Końcowy niezależny `qa-gate`: `gpt-6-luna high` — **PASS** bez blokujących ustaleń.

## Granice

- Backend używał lokalnego fixture entitlement `expired|active`; nie jest to dowód realnego RevenueCat, sklepu ani produkcji.
- Screenshoty potwierdzają prezentację; trwałość i brak sesji Free potwierdzają flow oraz asercje runnera, nie sam obraz.
- Rubryka jest referencyjną samooceną. Bez jawnego semanticznego ewaluatora aplikacja nie ocenia poprawności architektury.
- Nie wykonano deploymentu, publikacji ani zmiany produkcyjnej.
