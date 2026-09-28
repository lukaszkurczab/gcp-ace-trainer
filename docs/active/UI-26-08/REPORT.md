# UI-26-08 — raport odbioru

## Wynik

Pierwszy krok `Delete account` pokazuje jedno tekstowe ostrzeżenie, pole właściwe dla metody logowania i właściwą akcję reautoryzacji. Udana reautoryzacja nadal prowadzi do osobnego destrukcyjnego hold-to-delete; zmiana nie dotyka danych usuwanych, Firebase reauthentication, deletion grant ani backendu.

## Ocena przed zmianą

| Kryterium | Ocena | Uzasadnienie |
| --- | ---: | --- |
| Spójność z celem i architekturą | 0,95 | Zmiana pozostaje w istniejącym ekranie i jego kontrakcie błędów. |
| Prostota | 0,89 | Delete-only presentation bez nowej warstwy stanu lub równoległego flow. |
| Ryzyko | 0,84 | Największym ryzykiem było ukrycie błędu albo ominięcie drugiego kroku; oba są chronione testami i runtime. |
| Utrzymywalność | 0,91 | Wspólne provider labels i sign-out copy pozostają kanoniczne; nowe klucze są wyłącznie delete-context. |

Minimum: **0,84**. Niezależny briefing validator GPT-6 Luna High zaakceptował poprawione podejście po jawnym potwierdzeniu autoryzacji pushu, kontraktu rotacji raportów, delete-only komunikatu dla `pendingSyncRequiresNetwork` i zachowania nazw Apple/Google.

## Zmiana

- Górny ogólny `InfoBlock` nie jest renderowany w trybie delete.
- Warning `InfoBlock` zastąpiono zwykłym tekstowym blokiem `This cannot be undone` + skrócone konsekwencje.
- Usunięto zdanie `These records only confirm the deletion and cannot restore your account.` oraz odpowiedniki ze wszystkich siedmiu locale.
- Password reauthentication ma delete-only etykietę `Confirm`; Apple/Google zachowują informację o providerze.
- Błędy hasła pozostają przy polu. Inne aktywne błędy delete są zwięzłym alertem przy akcji; `pendingSyncRequiresNetwork` używa poprawnego kontekstu usuwania, bez zmiany wspólnego komunikatu sign-out.
- Drugi krok `HoldToConfirmButton` i wywołanie `account.deleteAccount()` pozostają bez zmian.

## Weryfikacja

| Dowód | Wynik |
| --- | --- |
| Targeted deletion/field/command-guard suite | PASS — 31/31 |
| `npm run typecheck` | PASS |
| `git diff --check` | PASS |
| `npm test` z wymaganymi rootami i SHA cross-repo | PASS — 1442/1442 |
| Maestro, lokalne konto password: base → błędne hasło → poprawne `Confirm` → hold | PASS |
| Maestro, light + `accessibility-extra-extra-extra-large`, scroll do pola i `Confirm` | PASS |

Test runtime użył izolowanego konta w lokalnych emulatorach. Końcowy hold nie został wykonany; dowód potwierdza dwustopniową ochronę, a nie usunięcie konta. Screenshot jest dowodem prezentacji, natomiast przejście po prawidłowym haśle i selektory stanów są dowodem zachowania aplikacji.

## Evidence robocze

- base: `/tmp/ui-26-08-current-runtime-3/2026-09-28_195506/UI-26-08 current password flow/takeScreenshot/ui-26-08-current-base.png`
- field error: `/tmp/ui-26-08-current-runtime-3/2026-09-28_195506/UI-26-08 current password flow/takeScreenshot/ui-26-08-current-password-error.png`
- hold po reautoryzacji: `/tmp/ui-26-08-current-confirm-runtime/2026-09-28_195647/UI-26-08 current confirm to hold/takeScreenshot/ui-26-08-current-hold.png`
- light/duży tekst: `/tmp/ui-26-08-current-large-runtime/2026-09-28_195736/ui-26-08-large-text/takeScreenshot/ui-26-08-light-large-text.png`

Artefakty `/tmp` są lokalne i krótkotrwałe. Manifest poleceń Maestro zawiera jawne wartości `inputText`, w tym lokalne dane fixture, dlatego cały katalog evidence pozostaje poza repozytorium i nie może być publikowany.

## Ograniczenia

- Apple i Google nie były autoryzowane w runtime; ich niezmienione, kontekstowe etykiety i wiring są zabezpieczone testem strukturalnym. Rzeczywisty provider flow wymaga interaktywnego zewnętrznego providera.
- Nie wstrzykiwano runtime `pendingSyncRequiresNetwork`, provider unavailable ani remote failure. Ich położenie, dostępna semantyka i delete-only copy są sprawdzone strukturalnie oraz testem locale.
- VoiceOver jest poza aktualnym kontraktem odbioru. Kod i testy zachowują nazwy, role, live region i kolejność, ale raport nie przedstawia tego jako rzeczywistego testu czytnika ekranu.
- Pierwsze bieżące próby Maestro rozpoczęły się przed pełnym załadowaniem bundla i użyły historycznego hasła fixture. Poprawione scenariusze na aktualnym lokalnym profilu przeszły; wcześniejsze próby nie są oznaczone jako PASS.

## Niezależny QA

Werdykt bieżącego niezależnego `qa-gate` GPT-6 Luna High: **PASS WITH ISSUES**.

QA niezależnie uruchomiło targeted 31/31, typecheck i diff-check oraz sprawdziło kod i cztery aktualne artefakty runtime. Potwierdziło, że `Confirm` kończy się na `prepareDeletion`, a dopiero osobny `HoldToConfirmButton` wywołuje `deleteAccount`; destrukcyjnego hold nie wykonano. Nieblokujące ograniczenia to brak bieżącego runtime Apple/Google i syntetycznych failure states oraz poufność roboczego manifestu Maestro. Niezmienione provider paths, położenie błędów i siedem locale są zabezpieczone kodem i testami. Historyczny `BLOCKED` dotyczył wyłącznie usuniętego kryterium VoiceOver i nie jest bieżącą bramką.
