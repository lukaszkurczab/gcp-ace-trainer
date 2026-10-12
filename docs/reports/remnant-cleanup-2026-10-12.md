# CLEANUP — stare branche, worktree i dependency links, 12.10.2026

## Cel i zakres

Na polecenie PO usunięto wyłącznie potwierdzone pozostałości po zakończonych lub zastąpionych pracach, bez wznowienia implementacji i bez operacji zdalnych. Root był jedynym writerem; persist_design (Luna High, bez potomków) niezależnie zaakceptował projekt z warunkami archiwizacji i kontroli ownership. Oceny: zgodność 0,96, prostota 0,92, ryzyko 0,90, utrzymanie 0,94; minimum 0,90.

## Wykonane

- Usunięto 34 lokalne branche: APP 21, CONTENT 11, BACKEND 1, WEB 1. Zachowano main/master. Historyczny raport branch-pr-closure obejmował 31; dodatkowe trzy to dostarczone finish/arch02-04-20261012, finish/arch02-content-20261012 i fix/reveal-accessibility-20261012. Wszystkie trzy były przodkami aktualnych gałęzi głównych.
- Usunięto dokładnie 11 zakończonych worktree (pełna allowlista i OID w prywatnym receipt), w tym odebrane FESD i zastąpiony login-fix-source. Nie usuwano katalogów nadrzędnych.
- Odłączono trzy potwierdzone symlinki node_modules; ich primary target pozostał nietknięty. W starym login-fix-source usunięto jego własne wygenerowane dependencies wraz z worktree.
- Usunięto tylko dwa wpisy nieistniejących worktree: patternly-android-startup-fix i patternly-q13-qa-history-hfy79c61, po zgodnym dry-run.

## Odzyskiwalność i weryfikacja

Prywatne archiwum `.qa-private/remnant-cleanup-20261012` (katalog 0700, bundles 0600) zawiera pełną historię wszystkich 34 branchy oraz dwóch dodatkowych detached commitów. Cztery self-contained bundles odtworzono w pustych bare repozytoriach bez alternates; porównano dokładne OID i drzewa wszystkich 36 refs, wykonano connectivity fsck i bundle verify. Manifest ma pełne nazwy/OID i SHA256 archiwów. Lokalne dane .expo login-fix-source skopiowano i sprawdzono SHA256/uprawnienia. Obecne .env.* były wyłącznie śledzonymi szablonami zawartymi w archiwum; żadnych prywatnych .env w usuwanych worktree.

Bezpośrednio przed mutacją pełny lsof wykazał zero otwartych plików/CWD w każdym kandydacie. Nie zatrzymano procesów. Przed usunięciem sprawdzono niezmienione HEAD, status i ignored entries; branche usuwano z kontrolą oczekiwanego OID. Zdalne refs pozostały identyczne.

Końcowy receipt potwierdza czyste cztery główne checkouty, tylko main/master, stashe 0 oraz identyczne hash/uprawnienia 29 chronionych plików i 38 plików kontenera profili. Credentials, 12 profili i Gość zachowane. Wszystkie wcześniejsze archiwa i worktree .qa-private oraz wymagany /private/tmp/patternly-content-historical zachowane. Pozostało łącznie 9 zarejestrowanych worktree (4 primary + 5 archiwalnych/historycznych).

Źródła, zależności primary i konfiguracja runtime nie zmieniły się; nie uruchamiano aplikacji ani ponownie testów funkcjonalnych/CI. Dowodem tego sprzątania są odtworzenie archiwów, kontrola repozytoriów i zachowania danych. Bez pushu samych metadanych; dokumentacja pozostaje lokalnym commitem. Niezależny QA końcowy persist_design (Luna High): PASS. Reviewer sprawdził rzeczywiste HEAD/refs/status czterech repozytoriów, bundle hashes/verify/list-heads, dokładnie 11 usuniętych i 9 zachowanych worktree, niezmienione remote refs, stashe0 oraz 29+38 chronionych hash/mode i archiwum .expo. Nie powtarzał odtworzenia wszystkich36refs, korzystając z zachowanego dowodu wykonanego wcześniej przez root.

Szczegóły prywatne: inventory.json, worktrees.json, verified.json, login-expo-manifest.json i removal-receipt.json w powyższym archiwum. Historyczny dowód zamknięcia/supersession: [branch-pr-closure](branch-pr-closure-2026-10-12.md). Nie jest to nowa kolejka prac.
