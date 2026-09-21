# ODK-096 — AWS Free w aplikacji, synchronizacja i retest iOS

Status: `partial` — lokalny bundle i ścieżka Practice Setup/runtime przeszły focused checks, retest na izolowanym iPhonie 17 oraz końcowy niezależny QA; pozostało utrwalenie zmian aplikacji. To nie jest globalna admisja runtime ani wydanie produkcyjne.

## Tożsamość i zakres

- PO zatwierdził dokładny pakiet: 40 pytań `aws_secure_architecture_foundations` (SHA-256 canonical sorted question array `8dd16df1d7c6741b373026547c35255aea97869542bbb8897a4f36c73730bc33`) i cały track AWS 2604 pytań (`46697d0c4e395455084d5dc28206b83e9207109b6f803eb94a47d4b4b981ac45`). [Addendum producenta](../../../patternly-content/evidence/canonical-content-approvals/odk-096-aws-free-node-v1.json) ogranicza zgodę do lokalnej synchronizacji bundle'a; historyczne ACC-02/migration evidence pozostają niezmienione.
- Producent: commit `79060003a30146fc2eb79df09426499a451783b1`, czyste repozytorium przy synchronizacji. `npm run sync:content-release` i `npm run check:content-release` zwróciły `passed`, inventory `9/117/943/16077`. AWS artifact ma wersję `aws-certified-solutions-architect-associate-authoring-v2026.09.21-odk096`, count 2604 i SHA `c86dd81635ebc51771e493729d487432519465f50c55ddcfc5ff71dd546560f9`; pozostałe osiem tracków nie zmieniło identity w locku.
- Aplikacja deklaruje AWS Focus `[10,20,40]` (default 10), Weak Area `[10,20]`, Quick `[10]`. Wybór Focus 10/20/40 korzysta z 40 unikatowych ID Free node; review oparte o due evidence skraca plan jawnie albo odmawia uruchomienia przy jego braku.
- Historyczny `integration/contracts/content-release/release.lock.json` jest nadal przypięty osobnym testem do pełnego SHA i niezmiennych `artifacts/releases/<releaseId>/release.json` (9 active + 2 retained, provenance i SHA surowych `artifactBytes`). Nie porównuje go z bieżącym AWS builderem.

## Weryfikacja

- `npm run test:content-release-cross-repo`: PASS 3/3 (historyczny lock, bieżący builder/bundle, dokładny inventory/hash AWS).
- `npm run check:content-release`: PASS; `npm run typecheck`: PASS.
- Focused app tests: PASS 28/28, w tym sesje AWS 10/20/40 i due-review.
- `npm test`: 1191/1201 PASS. Dziesięć niepowodzeń to hooki `scripts/releaseManifest.test.mjs`, które wymagają czystego repozytorium backendu; backend ma równoległy niezatwierdzony diff. Nie jest to zielona pełna bramka release i nie dowodzi regresji ODK-096.
- Symulator: osobny iPhone 17, iOS 26.4, UDID `E827939E-C429-4163-AB96-8814A925DCE7`, zainstalowany dev-client i aktualny Metro bundle. W trybie gościa wybrano AWS, otwarto Focus Practice → Practice Setup, zobaczono 10/20/40 i rozpoczęto 40-pytaniową sesję z licznikiem „Question 1 of 40”. [Opcje długości](./evidence/odk096/aws-focus-lengths-10-20-40.png), [sesja 1/40](./evidence/odk096/aws-session-1-of-40.png). Test wykonano etapami na tym samym izolowanym urządzeniu; pierwszy debugowy baner Expo zasłaniał przycisk „Start track”, więc zamknięto go przed potwierdzeniem wyboru. Po zapisaniu zrzutów tymczasowy symulator i tylko jego dane testowe usunięto nieodwracalnie, aby zwolnić miejsce; pierwotny iPhone 17 pozostał nietknięty. Nie testowano VoiceOver.

## Ograniczenia i następna bramka

- Niezależny QA aplikacji przed synchronizacją odrzucił osłabiony test historycznego locka (minimum 0,62). Po naprawie ponowny QA tego testu dał PASS, minimum 0,90. Końcowy niezależny QA całego slice'a po synchronizacji dał PASS: consistency 0,98, simplicity 0,92, risk 0,90, maintainability 0,90; minimum 0,90. Potwierdził czysty commit producenta, zatwierdzone hashe, niezmienność 8 pozostałych tracków i 2568 wcześniejszych pytań AWS, historyczny guard locka, focused checks oraz zrzuty iOS. Dziesięć niepowodzeń pełnego zestawu dotyczy wyłącznie bramki czystości równolegle zmienianego backendu.
- Zamrożony `npm run verify:migration` w repo treści nadal zwraca `EVIDENCE_VALUE`, ponieważ historyczne evidence dotyczą AWS 2568 i starej wersji; nie przepisywać tego evidence dla ODK-096. Globalne runtime/publishing/release admission pozostają `not_granted`.
- W Practice Setup wiele zablokowanych tematów poprzedza sekcję długości. Nie przeszkodziło to w retestowaniu 10/20/40 po przewinięciu, ale jest oddzielną obserwacją UX, nie ukrytą poprawką tego zadania.
- Zakres zmian aplikacji: `scripts/syncBundledContentRelease.mjs`, `src/content/canonical/productModeConfig.ts`, testy powiązane, `src/content/contentReleaseCrossRepo.test.ts`, dwa generated canonical files, ten raport i evidence. Repozytorium aplikacji ma także liczne równoległe zmiany ODK-124–129 i backendowe; nie wolno ich bez rozdzielenia uznać za część ODK-096 ani za czysty release gate.

Ocena zakresu przed zmianą: objective/architecture 0,94, simplicity 0,88, risk 0,90, maintainability 0,91; minimum 0,88. Model wykonawczy delegowanych wycinków i niezależnego QA: `gpt-5.6-luna`, reasoning effort `max`.
