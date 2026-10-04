# CH-01 — Cel / Ustalenia / Podejście

## Cel

P1 z kanonicznego planu §8.3: potwierdzony wynik ludzkiego review jest utrwalony w poprawnym JSON; awaria zapisu nie publikuje outcome w pamięci; równoległe API/HTTP i drugi owner nie tracą aktualizacji. Lokalny odbiór, bez deployu.

## Ustalenia

Bieżący kod `recordOutcome` zmienia `reviews` przed `writeReviewStore`, który zapisuje bezpośrednio do pliku. Każda instancja ładuje własny snapshot. Plan nadal odpowiada źródłu. Świeże Q14/riskFlags BIZQ w tym samym module i jego testach muszą zostać zachowane. Canonical docs11/12: human-only outcomes, fingerprint i source authority, advisory heuristics. Brak downstream reader outcomes w admission/build. [Cztery repo/hashe](PREFLIGHT.json).

BIZQ aktualnie N05 proposals/whole semantic/identity review przed dokładną migracją. Pytania/catalog/version/candidate/readiness/admission/banki/applock/demo oraz runtime/progress/planer/review/trwałość ARCH/PERSIST/BIZQ02–05 poza zakresem. Nie wystarcza rozłączność plików: wspólny console/test/store ownership rozstrzygnięty: BIZQ jawnie potwierdziło brak edycji console/testów i realoutcome writes w N05 przed zmianą modułu. Actual process inventory nie pokazuje console; foreign emulatory i Metro pozostają nietknięte. Nie zapisujemy real outcomes w repo ani nie zmieniamy source. SEC06 Host/Origin ma ten sam moduł, ale nie jest aktywnym zadaniem i pozostaje osobnym zakresem.

## Podejście

Preflight i independent design LunaHigh zakończone; implementacja realizuje przyjęty coordinator po realnej ścieżce store. Hipoteza: kolejka mutacji jednej instancji oraz cross-process exclusive sidecar lock obejmujący cały read-modify-write na kanonicznym realpath; każda mutacja czyta ostatni plik pod blokadą, zapisuje exclusive temp w tym samym katalogu i publikuje pamięć dopiero po rename. Busy/stale lock jawnie odrzucany bez automatycznej reclaim; żadnego PID/age unlink. Nie wprowadzać nowego lifetime ownera/close API bez wykazanego powodu. Worker/controller hypothesis fit0.94/simplicity0.82/risk0.82/maintainability0.90, minimum0.82. Independent design LunaHigh PASS WITH CONDITIONS, minimum0.82, [warunki](DESIGN-REVIEW.md) przyjęte przed kodem. Queue po canonicalpath w procesie, crossprocess sidecar busy reject; batch pozostaje kolejny per-item i może mieć committed prefix. Każda mutacja re-read pod blokadą; post-rename cleanup failure nie może zgłaszać nieudanego commitu. Nie deklarujemy fsync/power-loss durability. Root realFS probe: exclusive wx i same-dir rename PASS; pierwszy lexical alias check false przez macOS /var→/private/var, poprawny realpath(file)==realpath(alias) PASS. To capability probe, nie dowód całego console. Jedyny worker posiada console persistence/lifecycle i istniejące testy; root tylko CH01 dokumentację/status. Bez drugiego write agenta.

## Kryteria odbioru i sprawdzenia

Według planu: poprawny JSON i wszystkie potwierdzone outcomes po ponownym otwarciu; ostatni zatwierdzony stan w pamięci i pliku po write/rename failure; równoległe różne/te same itemy oraz batch vs single bez lost update; drugi owner tej samej faktycznej ścieżki odrzucony lub bezpiecznie skoordynowany między procesami; path alias nie omija wykluczenia; stale lock nie może usuwać żywego ownera. Całe read-modify-write pod wykluczeniem; publish po commit, zachować schema/fingerprints/human-only oraz dotychczasowe CLI/API i batch semantics. Nie obiecywać crash durability silniejszej od zweryfikowanej granicy.

Wymagane real filesystem probes przed własnymi seamami, deterministic write/rename fault ordering, real Node HTTP POST/read/restart, dwie instancje/procesy i aliasy, existing console/source-slice/Q14 regression oraz obowiązujące canonical gates bez generowania shared artefaktów. Niezależny QA LunaHigh po zamrożeniu. Test fixtures/outcomes tylko tmp; żadnych rzeczywistych ludzkich ocen w repo. No simulator/device.
