# RELEASE-CONTRACT/C — polityka OTA i runtime receipt

**Status:** `done`
**QA:** `PASS WITH ISSUES`
**Zakres:** lokalny kontrakt release; bez builda, publikacji OTA, FREEZE, GO i wdrożenia

## Wynik

Patternly ma jedną politykę dla release candidate: `embedded-only`.
`app.config.js` ustawia dla trybu release `expo-updates.enabled=false` oraz
`checkAutomatically=NEVER`. Sandbox i smoke zachowują dotychczasową konfigurację.
Zamrożony kandydat nie może więc przyjąć zdalnego JS nieobjętego walidacją.

Manifest v2 zapisuje `otaPolicy=embedded-only`, a fingerprint konfiguracji
obejmuje politykę, stan updates, sposób sprawdzania, runtime version, kanał i
updates URL. Kontrakt signing wymaga, aby runtime version równało się app version
używanej przez obecną politykę Expo `appVersion`.

Evidence `physical-device-matrix` zawiera teraz `runtimeReceipt` z dokładnym:

- manifest ID;
- iOS build ID;
- runtime version;
- kanałem `production`;
- polityką `embedded-only`;
- uruchomionym artefaktem `embedded`.

Release gate akceptuje receipt tylko wtedy, gdy odpowiada zweryfikowanemu
manifestowi. Każda zmiana app SHA, builda lub konfiguracji zmienia manifest i
unieważnia stary receipt. Nowa rewizja wymaga nowego dowodu i proporcjonalnego
retestu wpływu.

## Weryfikacja

- Briefing: zgodność 0,96; architektura 0,91; prostota 0,88; ryzyko 0,84;
  utrzymywalność 0,89; minimum 0,84 — APPROVE.
- Ukierunkowane EAS/release gate/manifest/workflow: 41/41 PASS.
- Negatywna macierz receipt odrzuca zmianę manifestu, builda, runtime, kanału,
  polityki i rodzaju uruchomionego artefaktu.
- Pełne `qa:static` z przypiętymi content roots: 1256/1256 PASS; content i
  runtime privacy boundary PASS.
- Schema JSON i `git diff --check`: PASS.
- Niezależny QA: `PASS WITH ISSUES`; targeted 41/41 i dodatkowe mutacje
  polityki/receipt PASS.

## Granice

Nie wykonano rzeczywistego builda ani testu fizycznego. Receipt testowy jest
syntetyczny; rzeczywisty `physical-device-matrix` pozostaje obowiązkowy przed GO.
Samohashowany JSON nie jest sam w sobie dowodem, że fizyczne urządzenie
uruchomiło wskazany artefakt; pochodzenie rzeczywistego receipt musi zostać
potwierdzone dowodem urządzeniowym.
Nie opublikowano i nie skonfigurowano żadnego OTA. Ponowne włączenie OTA jest
zmianą kontraktu release i wymaga nowej rewizji, manifestu oraz analizy wpływu.
