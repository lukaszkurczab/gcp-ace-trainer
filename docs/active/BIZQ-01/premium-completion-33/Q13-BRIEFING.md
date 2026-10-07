# BIZQ-01 — rzeczywista aktualizacja z aktywną sesją

## Cel
Zmierzyć rzeczywisty mismatch/resume contract przy zmianie zaakceptowanego pakietu OOD23→24, bez zastępowania odpowiedzi lub utraty oryginalnej nauki Guest. Sam reload JavaScript nie spełnia Q13.

## Ustalenia
Readonly feasibility Luna High: accepted app ea4f3d61b39bab6b9f12ace73b34721d0d6e717a (OOD23 hash932b…80d7) i fa95d027076e970d71dacf0d1fd7976fa0ba8f60 (OOD24 hash9df4…1ea3) mają wspólny bundle ID com.lkurczab.patternly i zgodną reprezentację storage/account/lifecycle. Źródła scoped storage/account/domain/lifecycle nie zmieniły się do HEAD23ee9203. To uzasadnia test, nie dowodzi preservation. Exact artifact resolver nie zastępuje v23 przez najnowsze v24; oczekiwany jest fail-closed mismatch. Unavailable-session UI i bezpośredni błąd bootstrap to odrębne wyniki. Szczegółowe immutable refs: ../native-partial-29/Q13-ACTUAL-UPDATE-PREFLIGHT.md.

## Podejście
Najpierw ordinary authenticated Premium admission w osobnym testowym profilu. Fresh Guest categorybaseline i ownaccount/no transition/no pending recovery. Odizolowane detached checkouts dokładnych admitted SHAs, bez checkout/reset bieżącej pracy; istniejące dependencies i prywatny env symlink, żadnych logowanych wartości. Zbudować i zainstalować v23 na tym samym jedynym iPhone17 bez uninstall/clearState. Przed UI udowodnić wykonanie właściwego JS i exactcontent przez build/install/bundle binding: devclient serwowany przez obecne Metro nie wystarcza. Release build z packagedJS jest kandydatem; aktualna możliwość tego trybu wymaga źródłowego sprawdzenia i małego probe przed rozbudową tooling.

W v23 normalna minimalna OOD sesja własnego konta: pozostawić aktywną bez odpowiedzi, zachować item/occurrence/order i exactversion/hash. Następnie faktycznie zainstalować accepted v24 tym samym appID, uruchomić i obserwować właściwy resume/mismatch, bez fallback content/nowych odpowiedzi. Zapisać dokładny stan, nie nazywać bootstraperror ekranem unavailable. Cleanup tylko disposable ownsession przez normalne UI; gdy bootstrap blocked, same-app rollback v23, normalne abandon ownsession, potem bieżący HEAD. Przy braku bezpiecznej recovery zatrzymać, bez resetu. Na końcu Guest identity/learning/goals/acceptedplans/settings exact oraz SDKundetermined0, bieżąca aplikacja przywrócona.

## Review i warunki wykonania
Independent Luna High PASS WITH GAPS: fit .93, simplicity .87, risk .83, maintainability .90, minimum .83. Root accepts proposal with mandatory execution-revision binding and preservation conditions; nie runtime PASS. Build/install jeszcze nie wykonano. Nie rozszerzać na Codingv03→v04 (znana niezgodność persistedshape), OTA, nowy contentcandidate, wszystkie tracki lub dodatkowy device.
