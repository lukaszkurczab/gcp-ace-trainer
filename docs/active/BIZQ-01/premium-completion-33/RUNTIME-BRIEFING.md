# BIZQ-01 — odzyskanie częściowego runtime przed naprawą Guest

## Cel
Przywrócić Auth/API/Metro do świeżego baseline przed autoryzowaną zmianą Guest i odbiorem Premium; bez zmiany istniejącego Firestore i nauki.

## Ustalenia
Świeży ps/lsof: tylko Firestore PID11092/PPID1,18081/9150, project patternly-app-sandbox, cached1.22.0. Auth19099/API8080/Metro8081/hub/log ports nieaktywne. Jedyny iPhone17 booted. Plan30 zakładał wszystkie porty wolne; suite restart kolidowałby z zachowanym Firestore. Firebase config loopback; cachedCLI15.30.1/Node22; dev:smoke domyślnie expired, SMTP/remoteRC disabled. Existing private runtime inputs zużywane przez istniejące skrypty, bez wypisywania wartości.

## Podejście
Read-only version/ports probe, potem cachedCLI --only auth --project patternly-app-sandbox --config firebase.json z backend. Żadnego nowego Firestore, kill, importu lub pobierania. Authconfig readiness → existing dev:smoke expired → APIhealth/ready → existing start:smoke/localhost. Logi prywatne0600. Zwykły launch istniejącej instalacji, no clearState/reinstall. Initializedexports snapshot helper i exact7fields81/84 vs prywatny after32 przed zmianą Guest. Mismatch/unexpectedauth/recovery zatrzymuje zależneUI. Naprawa Guest ma osobny sourceplan/review przed mutacją.

Fit .95, simplicity .90, risk .86, maintainability .91; minimum .86. Decisive risk: restart Auth identity state may be fresh, so no auth transition before independently reviewed Guest plan and preservation. Review dotyczy odzyskania, nie native/Premium PASS.
