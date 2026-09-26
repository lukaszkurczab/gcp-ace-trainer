# PROFILE-06 — kontrakt odbioru integracyjnego profili na iOS

Status: `active`; briefing GPT-6 Luna High **APPROVE**, minimum 0,84.

## Cel i granice

Jedna sekwencyjna macierz na istniejącym iPhonie 17 (`7F315654-3175-4F3C-BB24-B0263F59360C`) ma dowieść, że świeży start, Gość, konta A/B, adopcja, wylogowanie, restart, odzyskanie i usunięcie konta zachowują właściwą własność danych. Używamy wyłącznie lokalnych Auth/Firestore/API i izolowanych kont fixture. Nie dowodzimy produkcyjnych providerów, sklepów ani wdrożenia.

Równoległe zmiany ODK-117/UI w worktree nie należą do PROFILE-06. Testy są wykonywane kolejno na jednym urządzeniu; nie tworzymy ani nie instalujemy duplikatu. Cleanup danych Patternly jest dozwolony tylko wtedy, gdy konkretny przypadek wymaga świeżego startu.

## Macierz i kolejność

### PROFILE-06/A — harness i bezpieczne fixture

- Cel: odtwarzalne tworzenie kont A/B, zapis fixture i cleanup po dokładnym UID bez sekretów w repo.
- Akceptacja: loopback-only Auth/Firestore; unikalny identyfikator runu; brak globalnego czyszczenia emulatora; zapisane komendy oraz manifest środowiska; cleanup dopiero po evidence.
- Dowód: testy negatywne nielokalnych hostów i niezgodnego UID, dry-run/inspect exact roots.

### PROFILE-06/B — świeży start i ciągłość Gościa

- Cel: od wejścia przez wybór tracku do Home utworzyć jeden Guest, zapisać obserwowalny cel/plan albo postęp i potwierdzić go po natywnym restarcie.
- Akceptacja: `clearState` najwyżej raz na początku całej macierzy; później wyłącznie `stopApp`/`launchApp clearState:false`; ten sam track i zapisane dane po restarcie; brak ekranu konta jako warunku pierwszej wartości.
- Dowód: Maestro selectors, hierarchy i pełnoekranowe screenshoty przed/po.

### PROFILE-06/C — oba wybory adopcji

- Cel: dla izolowanych kont potwierdzić transfer oraz discard/reset wraz z restartem przed i po zatwierdzeniu.
- Akceptacja transferu: wybór przetrwa restart, guest goal/plan przechodzi raz, brak duplikacji w Firestore, account scope jest trwały. Akceptacja discard: wybór `false` przetrwa restart, jawne potwierdzenie usuwa dane guest, zdalne konto nie otrzymuje porzuconych rekordów.
- Dowód: produkcyjne UI + exact-UID Auth/Firestore inspection; wykorzystanie istniejących flow PROFILE-04 tam, gdzie pozostają zgodne.

### PROFILE-06/D — logout offline, konto A/B i izolacja

- Cel: wylogowanie A bez API natychmiast zamyka scope, restart pozostaje na loginie, B nie widzi danych A, a ponowne logowanie A po wznowieniu API rozlicza revoke i odzyskuje własne dane.
- Akceptacja: API jest jedyną zatrzymaną usługą; Auth/Firestore/Metro pozostają żywe. B nie usuwa pending A, nie widzi tracku/celu/postępu A i nie wysyła outboxu A. A po retry odzyskuje dokładny stan i restart go zachowuje.
- Dowód: Maestro, healthchecks przed/po, exact account IDs i kontrola właściwych korzeni Firestore.

### PROFILE-06/E — częściowe odzyskanie

- Cel: dla potwierdzonej tożsamości odzyskać poprawny podzbiór danych i jawnie obsłużyć brakujący albo uszkodzony podzbiór bez zmiany właściciela i bez wylogowania.
- Decyzja PO 26.09, opcja 1: jeżeli potwierdzone konto odzyskało poprawny stan Home, ale nie odzyskało planu, aplikacja otwiera Home z zachowanym stanem i pokazuje nieblokujący komunikat, że planu nie odzyskano i trzeba utworzyć go ponownie. Brak planu nie jest przedstawiany jako pusty plan i nie powoduje wysłania tombstone'a ani nadpisania danych zdalnych.
- Komunikat można zamknąć; zamknięcie jest trwałe dla tożsamości tego incydentu i nie wraca po restarcie. Utworzenie nowego planu kończy incydent. Istotnie nowy incydent może mieć nową tożsamość i osobny komunikat.
- Granica bezpieczeństwa: brak pewnego właściciela, uszkodzenie profilu lub brak możliwości odseparowania podzbioru pozostaje stanem blokującym/login, a nie częściowym sukcesem. Nie dodawać pustego fallbacku, ręcznego resetu brakującego podzbioru ani drugiego systemu synchronizacji.
- Dowód: fixture nieodzyskanego planu; Home z zachowanym trackiem/celem/postępem; brak uploadu pustego planu; komunikat z dokładną informacją i przejściem do utworzenia planu; trwałe zamknięcie przez restart oraz fail-closed dla naruszonej własności/nieodseparowalnego uszkodzenia.

### PROFILE-06/F — usunięcie konta

- Cel: pełna produkcyjna ścieżka reautoryzacji i hold-to-delete dla izolowanego konta.
- Akceptacja: terminalny stan UI bez pozornego sukcesu; exact UID nie istnieje w Auth emulatorze; wszystkie korzenie danych użytkownika w Firestore są usunięte albo pozostaje wyłącznie jawnie dozwolony tombstone/audit record; ponowny login nie może wskrzesić konta.
- Dowód: UI + niezależne Auth API/Admin inspection + Firestore inspection przed cleanupem fixture.

## Dowody i bezpieczeństwo

Artefakty trafiają do `docs/active/PROFILE-06/evidence/` tylko wtedy, gdy nie zawierają e-maila, hasła, tokenu ani innych danych logowania. Prywatne screenshoty formularzy pozostają poza repo. Każdy screenshot ma manifest: commit, urządzenie, runtime, locale, theme, scenariusz, fixture ID bez sekretów i źródłowy flow. Screenshot nie zastępuje dowodu zachowania ani backendu.

## Warunek zakończenia

PROFILE-06 jest `done` dopiero po wykonaniu A–D i F, rozstrzygnięciu oraz wykonaniu E, ukierunkowanych testach, pełnej macierzy iOS, niezależnym `qa-gate`, aktualizacji planu/working state oraz commicie i pushu na `main`. Jeżeli E czeka na PO, PROFILE-06 pozostaje `partial`, a wykonanie przechodzi do następnego niezależnego zadania planu.
