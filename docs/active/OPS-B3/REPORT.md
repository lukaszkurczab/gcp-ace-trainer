# OPS-B3 — lokalne CLI operatora

**ACCEPTED lokalnie, 2026-10-01.** Backend main/push: `e3a771b9c2a255be5aa1fdaa9cafca6b015e1704`. Dokładne pliki i SHA: `evidence/SOURCE-PINS.json`.

CLI obsługuje list/show/action czterech rodzin, stabilne tworzenie incydentu i odczyt konkretnej wersji authority export. Korzysta z kanonicznych schematów OpenAPI oraz istniejącego API; nie omija state machines przez Firestore. Wymaga dokładnego allowlistowanego origin HTTPS, weryfikuje TLS i odrzuca przekierowania oraz wyłączenie weryfikacji certyfikatu. Token wpisywany przez ukryty terminal pozostaje w pamięci; lokalny limit lifetime/remaining 1h jest jawną polityką CLI, serwer nadal weryfikuje podpis i scope.

JSON trafia przez stdin albo jawny descriptor. Dostępność terminala promptów i tryb stdin są osobnymi obowiązkowymi właściwościami IO. Przed zmianą CLI odczytuje stan, sprawdza CAS i pokazuje ograniczony opis skutku oraz wymagane potwierdzenie tekstowe. Tworzenie wyświetla stabilne si_UUID i wyjaśnia replay bez resetowania istniejącego stanu. Nie wypisuje prywatnej treści mutacji. Nierozstrzygalny wynik powoduje jeden odczyt i AMBIGUOUS/RECONCILIATION REQUIRED; brak automatycznego ponawiania zapisu i pozornego sukcesu. CLI zamyka wyłącznie własny uchwyt /dev/tty.

## Środowisko i ocena

Node22.22.3, Python3.13.1, OpenSSL3.6.3, Firebase CLI15.19.0; lokalne TLS z zaufanym testCA i rzeczywisty PTY. Test stdin wymagał zatwierdzonego dostępu /dev/tty poza sandboxem; odmowa EPERM w sandboxie nie jest dowodem błędu produktu. Regresja używała wyłącznie izolowanych Auth19119/Firestore18119/hub4419/log4519, jawnego parent/child env i własnej konfiguracji. Shared19099/18081, Metro i iPhone nie były potrzebne ani resetowane.

Skille execution-loop, qa-gate, cross-repo-change i working-memory. Implementacja GPT-6 Luna medium; niezależne briefingi i QA GPT-6 Luna high. Początkowy briefing: .91/.84/.84/.88, minimum .84. Korekta testowego CI Node: .96/.93/.88/.90, minimum .88. Korekta rozdzielenia stdin/prompt: .95/.93/.88/.91, minimum .88. Weryfikacja rzeczywistego stdin wykryła i doprowadziła do naprawy odrzucania piped body i pozostawiania otwartego terminala. Produkcyjny engines>=22 zachowany; testowe TLS APIs wymagają22.19+, CI przypina sprawdzone22.22.3.

## Dowody

- Niezależny QA: PASS, własne focused54/54, zero SKIP; szczegóły `QA.md` (TAP zwrócony przez narzędzie, bez zapisanego logu).
- Pełna końcowa regresja: 288 PASS/0 FAIL/4 SKIP, exit0 (`REGRESSION.log`). Cztery wydzielone testy operatora:4/4 PASS, zeroSKIP, exit0 (`OPERATOR-EMULATOR.log`); API/stores niezmienione przez CLI.
- Rzeczywisty terminal:5/5 PASS, zeroSKIP (`NATIVE.log`): token przez ukryty TTY/TLS, cancel bez zapisu z FD3 i pipedstdin, utrata odpowiedzi z jednym zapisem i jednym reconciliation GET, Ctrl+C/przywrócenie terminala.
- Lint/typecheck/TTL31/OpenAPI72/build/diff PASS (`STATIC.log`); actual app/web consumer50 PASS (`CONSUMERS.log`).
- Po integracji z lokalnym AUD-08-B2: CLI23/23, zeroSKIP, typecheck/diff PASS (`INTEGRATION.log`). Nie oznacza odbioru całego B2.

## Zachowanie niedokończonej pracy i ograniczenia

AUD-08-B2 pozostał nieodebrany i nie został wypchnięty. Backup27 plików `/private/tmp/aud08-b2-pre-ops-b3-integration`, zachowany jawny stash `a83361eba8048b5384cecdb412f466b6c6ed87de`. Po ff i apply25 plików identycznych; CI/package zawierają dokładnie zatwierdzone dodatki OPS-B3. Index pusty przed pushem, tylko9 plików zadania w commitcie. Starsze stashe zachowane.

Testy OIDC/JWKS i HTTPS używają syntetycznych fixtures. App Check i e-mail nie były badane w B3. Ten odbiór nie potwierdza rzeczywistego providera, wdrożenia ani GO. Rzeczywiste API/Firestore przez HTTP dla wszystkich czterech rodzin należy do OPS-B4; jego briefing High zatwierdzony minimum .84. Remote CI dla dokładnego e3a771b: SUCCESS, run36805917551, https://github.com/lukaszkurczab/patternly-backend/actions/runs/36805917551. Plan i dowody wypchnięte app main `1fd0c4d91da90687816c29760a96d9e05f976ba8`.
