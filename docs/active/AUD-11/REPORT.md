# AUD-11 — ekran odzyskiwania niedostępnych danych

**Status:** `done` / niezależne QA `PASS`

**Data odbioru:** 25 września 2026

**Repozytorium:** `patternly`

**Zakres:** lokalny smoke na istniejącym iPhonie 17; bez wdrożenia, reinstalacji i czyszczenia danych

## Wynik

- Układ zaczyna się od góry, marka ma 36 pt, a długi przepływ nie jest już centrowany jako jeden blok.
- EN/PL wyjaśniają brak klucza, ryzyko dla niewysłanych sesji i postępu Gościa oraz zachowanie danych konta w chmurze. Odbiór urządzeniowy ujawnił brak polskiego tłumaczenia ostatniego zdania; dodano brakujący klucz równolegle do EN/PL i ponowiono dowód.
- Akcja usunięcia ma neutralny wariant secondary. Instrukcja minimum trzech sekund pozostaje `accessibilityHint`, bez redundantnego tekstu na ekranie.
- Piąta nieudana ręczna próba ukrywa retry i pokazuje jawny limit. Automatyczny bootstrap nie zużywa limitu; udany bootstrap zeruje epizod.
- Krótkie dotknięcie przycisku hold pozostawia stan bazowy i nie uruchamia sukcesu/usuwania.

## Fixture i granica bezpieczeństwa

Dodano dokładną komendę `com.lkurczab.patternly://audit/show-encrypted-storage-recovery` z prezentacjami `base` i `retry-limit`. Parser oraz listener działają wyłącznie w `__DEV__` i runtime `smoke`; odrzucają inne środowiska, ścieżki, warianty i dodatkowe parametry. Komenda ustawia tylko stan prezentacyjny. Nie wywołuje `prepareProfileStorage`, odczytu Keychain/MMKV ani `removeUnavailableEncryptedStorage`.

Fixture potwierdza odbiór UI, nie reprodukuje rzeczywistej utraty klucza. Rzeczywistego storage nie usuwano. VoiceOver nie był uruchamiany i nie jest zaliczony; kod i hierarchy potwierdzają role, etykiety, live regions, stan i hint. Ewentualny fizyczny test VoiceOver pozostaje dokładnym przypadkiem ODK-088, a nie bramką lokalnego AUD-11.

## Dowody urządzeniowe

Wszystkie prywatne zrzuty wykonano i obejrzano na tym samym iPhonie 17 `7F315654-3175-4F3C-BB24-B0263F59360C`, 402×874, przy rozmiarze tekstu `large`. Nie zapisano ich w repozytorium.

- PL przed: `/tmp/patternly-aud11-pl-before.png`; PL po: `/tmp/patternly-aud11-pl-base.png`.
- EN przed: `/tmp/patternly-aud11-en-before.png`; EN po: `/tmp/patternly-aud11-en-base-large.png`.
- EN limit: `/tmp/patternly-aud11-en-retry-limit-large.png`; retry nie jest obecne, komunikat limitu i neutralny hold są czytelne.
- Historyczny wariant „przed” odtworzono chwilowo z rodzica commita `488bdc17` na tym samym runtime: logo 28 pt, centrowanie, czerwony hold i widoczny hint. Po zrzutach finalny kod oraz ustawienia `pl-PL / pl_PL / large` natychmiast przywrócono.
- Maestro `/tmp/patternly-aud11-hold-cancel.yaml`: krótki tap → `removal:base` nadal widoczny, `success` niewidoczny — PASS.
- Hierarchy potwierdziła nagłówki, opis, komunikat limitu, `removal:base` i `encrypted-storage:hold`; w stanie limitu brak selektora retry.

## Weryfikacja

- Ukierunkowane testy końcowe: 31/31 według niezależnego QA; kontrolny zestaw controller 12/12 — PASS.
- `npm run typecheck` — PASS.
- `git diff --check` — PASS.
- Pełny `npm test`: 1262/1266. Cztery błędy dotyczą cross-repo/release gate uruchomionej na celowo brudnym worktree i brakujących jawnych wejściach historycznego content root/current SHA; testy AUD-11 przechodzą. Nie raportujemy pełnego suite jako PASS.

## Niezależne QA i ocena

Pierwszy końcowy QA wydał `FAIL`, ponieważ brakowało porównywalnych zrzutów „przed”. Po odtworzeniu historycznego wariantu PL/EN i obejrzeniu czterech zrzutów re-QA wydał `PASS`. Kryteria PL/EN, duży tekst, hierarchia, limit, anulowanie hold i semantyka zostały pokryte proporcjonalnym dowodem.

Briefing fixture’a: zgodność `0,91`, prostota `0,86`, ryzyko `0,83`, utrzymywalność `0,85`; minimum `0,83`, warunkowo zatwierdzone. Końcowa ocena podejścia pozostaje powyżej progu; fixture nie tworzy nowego źródła danych ani produkcyjnej nawigacji.
