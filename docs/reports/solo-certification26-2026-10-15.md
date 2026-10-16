# Prompt26 / ARCH-03 — odbiór kontraktu Certification

15.10.2026. **Odbiór kodu i celowanych testów lokalnych: PASS.** Bez residualu26. Następny dopuszczalny prompt27, nieuruchomiony. Odbiór native iOS, usług i wydania pozostaje osobny. Bez commit/push, zmiany pytań, pinów, rejestru produktów, symulatora/danych, publikacji lub usług.

## Cel i decyzja

Domknąć producer→artifact→app kontrakt Certification: usunąć wspólny GCP default/exact50 i current attribution zależne od starego published bank, zachowując rzeczywisty GCP oraz immutable history. Zależności24/25 były odebrane; pominięto ponowną implementację. Końcowy handoff QLE właściciela odczytano z `codex://threads/01a13520-0e88-7451-9552-aafcbb1dc6fe` (APP9c9798a5 / CONTENT71b0096); brak aktywnej kolizji. Początkowy WIP aplikacji zachowano; content był czysty.

Design review: niezależny `gpt-6-luna high`, PASS po rozdzieleniu historycznych count i current coverage. Dopasowanie/prostota/ryzyko/utrzymywalność: **0,94/0,86/0,84/0,86**, minimum0,84. Jeden writer aplikacji (główny agent), jeden writer contentu (`gpt-6-luna high`), osobne QA (`gpt-6-luna high`).

Kolejność implementacji: uzgodnienie kontraktu, równoległe niezależne producer/app, integracja realnego outputu, QA, dokumentacja. Oba repo tworzą jeden odebrany pakiet; merge dopiero własnego spójnego pakietu bez obcego WIP. Deployment/publikacja nie są częścią26. Nie wymaga migracji persistence ani kompatybilności dwóch schema: envelope i emitted GCP bytes pozostają te same. Powrót wymagałby cofnięcia tylko własnych zmian obu repo, bez cofania pinów lub cudzych zmian.

## Zmiana i jeden właściciel kontraktu

- App resolver rozwiązuje dokładnie jeden Certification family/mode profile z artefaktu tracku i sprawdza track w jego provenance. Nie ma GCP switch/default w tej gałęzi. Count, duration i weighted quotas pochodzą z `familyConfig`; istniejąca polityka interakcji v1 pozostaje sprawdzana.
- Start, Practice i resume facade mają jawny trackId, przekazywany z trasy. Result query identyfikuje completed session po sessionId, rozwiązuje jej exact track/contentVersion/artifactSha256 i unikalny profileId/profileVersion; dodatkowy route trackId nie wnosi drugiej authority. Snapshot, fingerprint, content refs, kolejność, quotas oraz result/attempt coverage pozostają walidowane. Result read korzysta też z istniejącego profile fence. Manual review zachowuje track źródłowego rekordu Certification.
- Producer bierze questionId→nodeId z current canonical source i nodeId→domain z istniejącego `profile.nodeDomainMap`. Producer-only `currentAttribution` wiąże exact contentVersion, count, inventory SHA i uporządkowany pełny crosswalk SHA; nie trafia do artefaktu. Brakujące node, niezgodny inventory/version/domain lub digest dają jawny błąd.
- Pełna mapa2981/20 została porównana z historycznym bankiem. Current build usunął odczyt banku; oddzielny `scripts/content/verify-gcp-attribution-history.mjs` chroni frozen artifact i crosswalk stałymi hashami niezależnie od current config/source. `verifyGcpCurrentAttributionParity` jest jawnym dowodem migracji i sprawdza także deklarowane historyczne provenance SHA.
- Historyczne `nodeDomainMapEvidence` pozostaje niezmienione w emitted profilu. Jego counts opisują historię; current coverage wynika z current questions/map. Test z2980 current questions i odświeżonym metadata przechodzi loader przy niezmienionym historycznym2981/20. Nie zmieniano rzeczywistych pytań.

Usunięte ścieżki: wspólny GCP resolver/default w facade, literal50 w family selector/result oraz current published-bank read/porównanie w builderze. Nie usuwano plików historii ani GCP-specific źródłowej walidacji zatwierdzonego produktu. Nie dodawano oficjalnego profilu AWS/Azure lub nowego admission. Pełny inventory własnych plików, hashe oraz rozdzielenie WIP: [manifest](solo-certification26-2026-10-15.json).

## AC i dowód

| Kryterium | Wynik i granica |
| --- | --- |
| Real GCP producer→artifact→app | PASS: real `buildTrack` w temp directory → app schema/hash validator → production runtime → exact resume/finalization/result. Artefakt deep-equal bundled, canonical bytes/lock SHA zgodne; pełny przygotowany session deep-equal bundled runtime. 50 pytań,120 minut, quotas10/15/15/10. |
| Drugi profil przez config | PASS: wyłącznie testowy artifact `familyConfig`, count7/range7–9, duration17, profileVersion7, weights10/20/30/40 → quotas1/1/2/3. Przechodzi app schema/hash i production runtime/resume/result bez zmiany kernel/storage/registry. Nie dowodzi nowego oficjalnego producer tracka ani produktu. |
| Jawne braki i mismatch | PASS: missing/duplicate/foreign track/family profile, bad range/duration/weights, pool shortage; zmieniony profileVersion/snapshot/contentVersion/artifact SHA oraz result track odrzucane. |
| Free i entry points | PASS: denied/unavailable start/resume zatrzymują się przed package resolution/prepare/durable start. Wspólne lifecycle/admission sprawdzają brak zapisów sesji, attempts i journal; production-source contract potwierdza jeden start entry i brak prepare-only bypass. Bez rzeczywistego zakupu/SDK usług. |
| Current source bez starego banku | PASS: pełny build z temp config/content bez historycznego pliku; identyczny GCP SHA. Next fixture contentVersion z odświeżonym current metadata działa bez generowania banku. Obecność/tamper starego banku nie steruje current outputem. |
| Frozen history | PASS: niezależny verifier sprawdza payload/crosswalk SHA i tożsamość, odrzuca tamper także po przeliczeniu wrapper checksum. Initial complete current parity i błędny valid-hex provenance sprawdzone osobno. |

GCP artifact SHA: `e399212abf92bac30edcfb1aa04b170306469a8b2a1eab57b8f80f1ee7b37d82`.
Historical payload SHA: `732f915e43542ca1318bf32aafd1f2cfab77012eb3c8d236a362a92a993740e4`.
Full crosswalk SHA: `a60cd7cf6b65f127d9e7550a8979b03a52efd4cdebd2abe2fa42659aeef4bf51`.

## Weryfikacja i niezależny odbiór

Reprodukowane komendy i wynik są w manifeście. Główny agent: **190/190 focused**, **16/16 Premium lifecycle/admission/policy/entry gates**, typecheck i content/runtime privacy boundaries PASS. Content writer: **36/36 content-builder**, history CLI PASS; po końcowym podłączeniu provenance SHA w migration-only helperze celowany history/parity test **1/1 PASS** oraz full no-history/tamper/next-version build **1/1 PASS**. Pozostałe34 testy mają niezmieniony kod buildera/warunki; nie powtarzano całej suity dla samego końcowego diffu. `git diff --check` obu repo PASS; generated content/locks/contracts i history/artifacts bez zmian.

Niezależne QA wykonało app31/31, content36/36, admission4/4 i typecheck PASS. Początkowy **PASS WITH ISSUES** wskazał wyłącznie dokumentacyjny opis ARCH-03 sprzed implementacji. Opis uzgodniono z kodem, zakres03 usunięto z jedynego planu; końcowy readback QA: **PASS**, z niezależnym ponownym wykonaniem2/2 finalnych content checks. QA nie znalazło materialnego defektu runtime.

Początkowe nieudane asercje: stara walidacja traktowała każdą wersję poza1/limit poza60 jako błąd rodziny; zastąpiono ją testem nieprawidłowej wersji/range i dodano osobne exact version pin negatives. Stary test trasy oczekiwał Exam bez trackId; teraz sprawdza jawny track. Nowy test unmark zakładał completed record, podczas gdy istniejący manual-only kontrakt usuwa rekord; poprawiono asercję, bez zmiany semantyki. Test invalid-config odczytuje szczegółowe `errors` walidatora zamiast ogólnego message. Końcowe celowane zestawy zielone, bez osłabienia AC.

## Granice i ryzyko

To odbiór kodu i lokalnych testów produkcyjnych modułów w Node; bez native mount, UI/device layout, symulatora, pełnego npm test/qa:static/CI, build iOS, usług ani release. Nie reinterpretujemy25 jako nowego native dowodu. Niezwiązane mutationArchitecture/recovery checker findings opisane w25 nie zmieniły się i nie były naprawiane w26. Source producer-specific GCP50–60/120 i domain policy zachowane; przyszły produkt wymaga dopuszczonego source/config, nie można uznać fixture za approval. Ryzyko pozostaje w nieodebranych osobno etapach native/provider/release; bez residualu kontraktu26.

Jedyny plan: [workspace plan](../../../docs/PATTERNLY-WORKING-PLAN.md). Bieżący handoff: [WORKING_STATE](../../../.agent/WORKING_STATE.md). **STOP po przekazaniu;27 nie uruchomiono.**
