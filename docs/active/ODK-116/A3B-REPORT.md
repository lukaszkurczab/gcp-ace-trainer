# ODK-116/A3b — publiczne dane prawne w bramce gotowości

**Data:** 24.09.2026  
**Status:** done dla kontroli readiness; ODK-116-A nadal obejmuje web i pełny kontrakt wydania.

`releaseGate.mjs` odczytuje teraz ten sam `config/public-legal.release.json`, który wybiera aplikacja w release i sprawdza `app.config.js`. Używa istniejącej schemy: brak, błędny JSON, niepoprawna struktura i nierozwiązane placeholdery dodają osobne typowane blokady. Raport ma przenośną ścieżkę, status, poprawnie sformatowaną wersję, fingerprint SHA-256 i nazwy pól z błędami. Nie wypisuje wartości. Jeśli błędna struktura współwystępuje z placeholderami, status `invalid` ma pierwszeństwo przed `incomplete`.

Obecny rekord pozostaje `incomplete`, zatem wynik readiness i enforced release jest jawnie zablokowany do czasu dostarczenia prawdziwych wartości. Bramka nie ukrywa pozostałych problemów contentu, manifestu ani dowodów zewnętrznych. Testy na izolowanym application root sprawdzają brak, uszkodzony JSON, kompletny syntetyczny rekord, błędną wersję z poufnym znacznikiem oraz mieszankę placeholderów i błędnej struktury.

**Weryfikacja:** `node --test scripts/releaseGate.test.mjs` 14/14 PASS; `npm run typecheck` i `git diff --check` PASS. Niezależne QA `gpt-6-luna/high`: **PASS**; dodatkowo sprawdziło testy manifestu 10/10 i potwierdziło brak wycieku wartości w raporcie.

**Granica:** poprawność prawna i rzeczywiste dane należą do ODK-116-B. Obecny fingerprint identyfikuje publiczny rekord; powiązanie z web i manifestem wydania należy do A4 oraz dalszych bramek.

**Ocena przed zmianą:** zgodność 0,90; prostota 0,80; kontrola ryzyka 0,80; utrzymywalność 0,85; minimum **0,80**. Niezależny `gpt-6-luna/high` zaakceptował briefing przy użyciu jednej schemy; wykonawca `gpt-6-luna/high`.
