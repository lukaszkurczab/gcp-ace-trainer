# Patternly — bieżący stan

14.10.2026 — **pozostały 07 / SEC-03: PARTIAL**. [Jedyny plan workspace](../../docs/PATTERNLY-WORKING-PLAN.md) zachowuje wyłącznie niepuste auth/vault/pakiety/RevenueCat proof. **Następny dopuszczalny prompt: pozostały 07**, nie 09. Sesja kończy się po przekazaniu, bez celu, automatyzacji ani nowego czatu.

## Decyzja, wynik i dowody

[Decyzja PO i bieżący HTTP dowód](../docs/specs/engineering/security-privacy.md#pozostały-07--decyzja-po-i-http-storage), [wcześniejszy kompletny native A→B→A](../docs/specs/engineering/security-privacy.md#wznowienie-native-07--14102026). Start APP `7e2e3071`, czysty Git. Main jedynym writerem; niezależny design/QA **gpt-6-luna high**. Ocena dopasowanie/prostota/ryzyko/utrzymywalność 0,91/0,96/0,86/0,95, min 0,86.

**Wiążąca odpowiedź PO:** izolować dane konta/nauki i cache środowiska, wspólne anonimowe metadane platformy/SDK rozliczać osobno; HTTP dopiero po klasyfikacji. To zastępuje dawną szeroką interpretację „zero dostępu do jakichkolwiek metadanych”. Nie dopuszcza cookies, sesji ani identyfikujących/transakcyjnych cache. Pinned Firebase heartbeat agent/version/date jest sklasyfikowany i dopuszczony; nie dodano native bridge/Pods ani nie zmieniono guardu. Brak dowodu wysyłki nie oznacza dowodu braku wysyłki.

**Nowy rzeczywisty dowód HTTP:** ten sam iPhone17/iOS26.4, zachowane signed A/B, krótkie cold compatible overinstall A→B→A. Bez uninstall/reset/newGuest, nowych urządzeń, zmian IDs/signing, backendu/Auth Emulator/RC usług. B exact fingerprint/configMatches/mismatch, root i pięciu ownerów false. A po powrocie exact fingerprint/configMatches/ready/root true. Stabilne prywatne kopie DB/WAL/SHM; SQLite wyłącznie na kopii. Jedyny schemat `alt_services`, jeden rekord pustej partycji i publicznego `clients3.google.com:443`, daty ważności; bez konta/tokenów/cookies. A→B cały rekord identyczny, main DB i stare bajty WAL niezmienione; dopisany jeden frame strony1 zmienia wyłącznie SQLite counters (offsety27/95). To udowodniona kategoria anonimowych metadanych połączenia, nie ogólny wyjątek dla przyszłego HTTP storage.

Regularny start powrotnego A odświeżył tylko dwie daty tego samego rekordu; węższy counter-only comparator prawidłowo odmówił klasyfikacji. Odczyt kopii wskazał dokładnie creation_time/expires_time, bez kolejnego loop. Końcowe 3 pliki MMKV/preferences mają niezmienne hashe względem poprzedniego zabezpieczonego baseline; executable/debug dylib/native config zgadzają się z zachowanym A. Face ID purpose string nieobecny.

Wcześniejszy odebrany dowód **13 profili/438 kluczy** (394 learningProgress,5 settings,32 profileLifecycle,7 premiumCache), registry/control/secureControl i semantyczny Gość pozostają aktualne; nie powtarzano całej macierzy ani suit 07/08. Wcześniejsze auth/vault absent, packages empty i brak RC cache/key nie są niepustym dowodem.

## Weryfikacja i granice

Nowy odtwarzalny helper `scripts/qa/inspectIosHttpStorageCopy.py`: exact iPhone17/root/UUID, full SQL/table/index allowlist, atomowe kopie600 w temp700, stable source/copy hashes i safe error categories. Actual snapshot/quick_check/schema PASS, A→B comparator PASS, false path rejection PASS, syntax compile i diff check PASS. Niezależne QA: **PASS helper i obserwowany HTTP slice; PARTIAL pełny07**. Początkowe uwagi QA do kotwiczenia ścieżki, schematu i permissions poprawiono. Comparator revalidates DB/WAL; SHM hash jest receipt z capture, ponieważ SQLite może zmieniać blokady prywatnej kopii. Nie dowodzi historycznych/free-page payloadów, braku sieci ani fizycznego transferu. Historyczne sidecary B nie zostały zachowane; nowa kontrolowana próba wyjaśnia kategorię, nie rekonstruuje dawnych bajtów.

Nie zmieniono kodu produkcyjnego/TS ani dependencies; nie powtarzano niezmienionych gates. Poprzedni `recovery:check` / `qa:static` pozostaje nieodebrany przez bazowy import `journalTestSupport` w `terminalWireFixture.ts:2`; nie naprawiano poza zakresem. Brak pełnej suite/hosted CI/service/release acceptance. [08](../docs/specs/engineering/security-privacy.md#przyjęty-kontrakt-i-dowód-08) nadal CODE/local PASS (`0c9e282d`); opcje auth nie dowodzą urządzeniowego transferu R05.

## Konkretny brak i bezpieczny stan

Pełne AC07 nadal wymaga rzeczywistych niepustych auth, vault aktywnej operacji, pobranego pakietu i RevenueCat cache/identity. Obecny smoke ich nie ma ani nie ma czynnego backendu/Auth Emulator/RC key. Wymagane właściwe dane/config i dozwolony lifecycle usług; nie tworzyć fake sentineli, nie kasować danych i nie przenosić samodzielnie AC do R04. RC key jest składnikiem fingerprintu: jego dodanie do przypisanego A zmieni tożsamość i zablokuje start. Potrzebne zgodnie przygotowane środowisko z niepustymi danymi; nie podmieniać markeru ani nie zakładać zgody na reset/newGuest. **Nie ma kolejnej decyzji produktowej PO; brakuje warunków i ewentualnej konkretnej zgody na przygotowanie takiej próby.** R04 provider, R05 backup/restore/device transfer i Android54 osobno. Nie przechodzić do następnego promptu.

A pozostaje przywrócone, przypisane smoke i zamknięte; własne Metro B/A zatrzymane. Simulator ten sam. **DerivedData nadal B**; używać zachowanego A.app do powrotu lub zweryfikować nowy build. Generated ios z poprzedniej sesji zgodny z config/local Pod, piny niezmienione. Prywatne receipts/kopie: `/private/tmp/patternly-sec03-native-u9VmWv` (700), pliki `http-*`; pełna lista i ograniczenia w spec. Bez payloadów w Git.

Własny pakiet: helper Python, aktualizacja istniejącej specyfikacji, tego stanu oraz kanonicznego planu poza repo APP. Zwykły commit/push wyłącznie odebranego helpera i uczciwej dokumentacji PARTIAL na istniejącej zgodzie; SHA/status w Git. Bez nowych usług, publikacji, maili, wydatków i automatycznej kontynuacji.
