# ODK-117 — raport wykonania

**Stan:** `partial` — rozpoczęto preflight i podzielono krok A na małe, weryfikowalne zadania; implementacja locale nie została zmieniona.

## Cel i kryteria

Obsłużyć UI w `pl/en/de/fr/es/it/et`, prześledzić pochodzenie każdego zwykłego tekstu UI, wyeliminować ukryty fallback dla nieprzetłumaczonych elementów i odbierać główne ekrany oraz krytyczne błędy przy dużym tekście. Treści edukacyjne mogą pozostać po angielsku. Krok B (legal/support/store) czeka na ODK-116.

## Potwierdzony stan

- `src/i18n.ts`: `fallbackLng: "en"`, `supportedLngs: ["en", "pl"]`, osiem namespace i zasoby EN/PL.
- Każda z dwóch lokalizacji ma 1 334 wpisy najwyższego poziomu w ośmiu plikach oraz 1 521 wartości liści według flatteningu `i18nLocaleParity.test.ts` (tablice są tam liczone jako jedna serializowana wartość). Test parytetu istnieje dla EN/PL.
- Ekran ustawień udostępnia System, English i Polish. System locale mapuje polski na `pl`, każdy inny język na `en`.
- Preferencje storage, prezentacja planu, raporty treści, recovery oraz część formatowania/domenowych tekstów mają osobne kontrakty EN/PL. W aplikacji są ponadto bezpośrednie literały UI; samo dodanie pięciu katalogów nie spełni AC.
- Nie znaleziono skryptu/pakietu tłumaczeń ani niezależnego procesu przeglądu jakości w repo. Nie wygenerowano ani nie włączono automatycznych, niezweryfikowanych przekładów.
- Wymagany przedimplementacyjny briefing zwalidowany przez niezależnego `gpt-6-luna` high: minima consistency 0,94, simplicity 0,84, risk 0,82, maintainability 0,90; wynik 0,82, APPROVE. Główne ryzyko: jakość tłumaczeń musi mieć rzeczywistego recenzenta.

## Pakiet zadań kroku A

Kolejność i kryteria utrzymuje bieżący `docs/PATTERNLY-WORKING-PLAN.md`; historyczny plik `docs/PATTERNLY-AUDIT-TASKS-2026-09-22.md` nie jest obecny w workspace i nie stanowi dostępnego źródła dowodu:

1. **ODK-117-A0 — done / niezależne QA PASS** — [mapa źródeł](active/ODK-117/A0-SOURCE-MAP.md) obejmuje kanały aplikacyjne i natywne, odtwarzalny inventory kandydatów, właścicieli i jawne wyjątki. Pierwsze QA wykryło brak pełności oraz pominięte copy sesji/powiadomień; drugie granicę natywną. Po korektach końcowy QA: PASS.
2. **ODK-117-A1** — jeden kontrakt runtime locale, wybór i mapowanie języka urządzenia.
3. **ODK-117-A2 — WAIT: competent linguistic review** — pięć kompletnych pakietów namespace z niezależnym przeglądem językowym. Inventory to 7 605 nowych wartości; brak app draftów, procesu i kompetentnych recenzentów. Modelowy self-review nie jest dowodem. [Pakiet odblokowania](active/ODK-117/A2-REVIEW-BLOCKER.md).
4. **ODK-117-A3** — migracja wszystkich zwykłych literałów UI do locale oraz automatyczna kontrola regresji.
5. **ODK-117-A4** — prezentacje, formatowanie i granice locale pól backendowych.
6. **ODK-117-A5** — testy oraz Maestro na istniejącym iPhonie 17 dla 7 języków i dużego tekstu.
7. **Krok B** — dokładne teksty operatora/store po dostarczeniu ODK-116.

## Oceny przed zmianami

Briefing implementacyjny ocenił zgodność 0,94, prostotę 0,84, ryzyko 0,82 i utrzymywalność 0,90 (minimum 0,82). Ze względu na rozległość pełnego AC nie zmieniono runtime ani nie udostępniono niekompletnych języków; zadanie rozbito na powyższe atomowe kroki.

## Weryfikacja i dalsze ryzyko

Wykonano odczyt kodu, testów, ustawień, zależnych typów i dokumentacji oraz pomiar rozmiaru zasobów. Nie uruchamiano aplikacji ani Maestro, bo nie wdrożono UI. Nadal trzeba wskazać kompetentnych recenzentów tłumaczeń przed akceptacją A2; brak takiego odbioru blokuje release danego locale, nie audyt inwentaryzacyjny A0.
