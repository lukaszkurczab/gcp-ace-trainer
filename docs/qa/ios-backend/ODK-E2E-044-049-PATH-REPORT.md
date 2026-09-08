# ODK-E2E-044–049 — raport ścieżki

Status: COMPLETE_WITH_BLOCKERS

## Wynik zadań

| Zadanie | Wynik |
| --- | --- |
| ODK-E2E-044 | VERIFIED_CLOSED — pełny inwentarz górnych nagłówków. |
| ODK-E2E-042 | BLOCKED — brak wyboru projektu po 5/5 próbach PO. |
| ODK-E2E-043 | BLOCKED — zależne od 042. |
| ODK-E2E-045 | VERIFIED_CLOSED — spójne headingi i usunięty opis Settings. |
| ODK-E2E-046 | VERIFIED_CLOSED — audyt redundantnych opisów. |
| ODK-E2E-047 | VERIFIED_CLOSED — Your data i powrót do Settings. |
| ODK-E2E-048 | VERIFIED_CLOSED — truth inventory Your data. |
| ODK-E2E-049 | VERIFIED_CLOSED — truth inventory Legal information. |

Z audytów powstały konkretne aktywne zadania ODK-E2E-104–112. ODK087 nadal obejmuje produkcyjne dane prawne i governance.

## Zmiany produktu

- Progress używa wspólnego `typography.title` w każdym stanie.
- Settings nie pokazuje redundantnego opisu.
- Your data ma tytuł `Your data` / `Twoje dane` i kontekst `Settings` / `Ustawienia`.
- Kafelek Settings i grupa Data & privacy pozostały bez zmian.

## Brama regresji

Końcowe `npm run qa:static`:

- recovery inventory: PASS, 357 source, 162 tests, 881 baseline cases;
- TypeScript: PASS;
- testy: 886/886 PASS;
- content boundary: PASS;
- runtime privacy boundary: PASS;
- `git diff --check`: PASS.

## Retesty iOS

- ODK044: 20/20 standard i 24/24 największy tekst; 6 obejrzanych zrzutów.
- ODK045: 39/39 standard i 39/39 największy tekst, EN/PL; 16 obejrzanych zrzutów.
- ODK046: 12/12 Your data i 10/10 Legal information; 4 obejrzane zrzuty.
- ODK047: 28/28, EN/PL i rzeczywisty powrót; 2 obejrzane zrzuty.
- ODK048 używa dowodów authenticated/guest z 046 i EN/PL z 047.
- ODK049 używa odczytowego dowodu Legal information 10/10 oraz porównania kodu z dokumentami i backendem.

Nie wykonano VoiceOver. Provider i fizyczne urządzenie pozostają w kolejce 082–088.

## Znane problemy

- ODK042/043 czekają na wybór projektu.
- ODK104 śledzi surowe zagnieżdżone klucze tłumaczeń.
- ODK105–112 śledzą prawdziwość i strukturę Your data oraz Legal information.
- Główne konto testowe wymaga ponownego logowania. Dane urządzenia nie zostały wyczyszczone. Dalsze retesty wykonano na osobnym symulatorze gościa.
- Automatyczna kontrola odrzuciła zmianę hasła w lokalnym emulatorze. Nie wykonano obejścia.
