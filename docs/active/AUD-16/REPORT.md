# AUD-16 — zgoda rejestracyjna

**Status:** `done` / niezależne QA **PASS**  
**Zakres:** lokalny iOS; bez wdrożenia  
**Baseline aplikacji:** `4f18da89` plus zmiana AUD-16  
**Urządzenie:** istniejący iPhone 17, UDID `7F315654-3175-4F3C-BB24-B0263F59360C`

## Wynik

- Standardowy układ pokazuje pełną zgodę w dwóch liniach dla EN i PL. Polski tekst skrócono do: „Akceptuję Warunki korzystania i znam Politykę prywatności.”
- Znaczenie pozostało rozdzielone poprawnie: użytkownik akceptuje Warunki i potwierdza znajomość Polityki; checkbox nadal przekazuje jeden jawny kontrakt `acceptedTerms`.
- Oba linki pozostają osobnymi kontrolkami. Checkbox ma rolę, stan zaznaczenia i etykietę dostępności obejmującą pełną zgodę.
- Przy dużym tekście zgoda rośnie do czterech linii bez obcięcia i bez nakładania kontrolek.
- Walidacja nadal blokuje rejestrację bez zgody, pokazuje błąd po odznaczeniu i usuwa go po ponownym zaznaczeniu.

## Dowody urządzeniowe

Na tym samym iPhonie 17, bez `clearState`, reinstalacji i tworzenia konta, przeprowadzono oraz obejrzano:

1. angielski układ standardowy — dwie linie;
2. polski układ z dokładnymi produkcyjnymi fragmentami tekstu — dwie linie;
3. duży tekst — cztery pełne linie bez clippingu;
4. checkbox, oba linki, powrót z dokumentów, błąd po odznaczeniu i blokadę przycisku;
5. repozytoryjny flow rejestracji — 1/1 PASS z aktualnym selektorem i `clearState: false`.

Zrzuty i wyjścia Maestro pozostały poza repozytorium. Nie zawierają dowodu utworzenia konta ani nie zmieniają zachowanego profilu Gościa.

## Weryfikacja

- `accountIdentityComposition.test.ts`: 33/33 PASS;
- typecheck: PASS;
- repozytoryjny Maestro registration flow: 1/1 PASS;
- `git diff --check`: PASS;
- wizualny odbiór wszystkich wskazanych zrzutów: PASS.

Pierwszy przegląd QA wskazał, że etykieta checkboxa obejmowała tylko Warunki. Poprawiono ją na pełny tekst Warunków i Polityki oraz dodano regresyjną asercję. Drugi reviewer początkowo pomylił właściwy polski zrzut z nieudanym wcześniejszym przebiegiem; po otwarciu dokładnego artefaktu wycofał ten wniosek i wydał końcowy werdykt **PASS**.

## Briefing i granice

Briefing przed implementacją: zgodność/architektura `0,96`, prostota `0,88`, ryzyko `0,84`, utrzymywalność `0,91`; minimum `0,84` — APPROVE.

AUD-16 nie zmienia logiki rejestracji, dokumentów prawnych, pozostałych locale ani stanu konta. Pełny odbiór siedmiu locale pozostaje zakresem ODK-117. Nie wykonano wdrożenia.
