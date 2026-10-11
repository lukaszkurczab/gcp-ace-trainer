# AWS SAA — celowane naprawy 11.10.2026

Właściciel w aktywnej rozmowie 11.10.2026 autoryzował wykonanie i publikację dokładnych pakietów SAA-20261010-01…12 oraz istniejącego FCA-EDIT-658fa75523 przed pierwszym iOS. To wyjątek dla tych 28 ocenionych pytań; pełny audyt i pozostałe naprawy nadal mają kolejność z planu. Q13, cudze zmiany, Premium i konfiguracja usług są poza zakresem.

## Kontrakt i kolejność

Producer `patternly-content`: canonical JSON → istniejący builder → wersjonowany kandydat v1 treści treningowej → delegated Codex review/readiness → konsument. Consumer `patternly`: istniejący sync jawnie dopuszcza tylko AWS na podstawie dokładnego candidate/release/readiness → aktualny ledger training + artefakt v2 z niezmienioną polityką planowania → istniejący candidate release lock → runtime admission. Nie dodano schematu ani kolejki; historyczne approval i `release.lock.historical-0024.json` pozostają niezmienne. Dawne admission nie jest dowodem dla nowej treści.

Implementacja, integracja i publikacja: producer źródło i narzędzia; producer kandydat/review; consumer bundle/lock/testy; consumer commit dla runtime admission; producer świeże admission; publikacja commitów z kontrolą CI. Publikacja oznacza repozytoria źródeł i przypięty pakiet aplikacji; nie jest publikacją binarnego iOS w App Store. Wycofanie pakietu wymaga powrotu do dokładnych poprzednich źródeł/artefaktu/locka, nie cofania cudzych zmian.

Niezależny review projektu: Luna High, dopasowanie 0,88 / prostota 0,84 / ryzyko 0,81 / utrzymywalność 0,83 (minimum 0,81). Jawny dokładny kandydat chroni przed cichą zmianą treści; osiem innych banków zachowuje tożsamości. Q13 nie wymaga zmian runtime. Testy obejmują prawdziwy candidate/readiness, odrzucenie nieaktualnych dowodów oraz scoring i autorski feedback po przetasowaniu dla wszystkich 28 pytań.

## Tożsamości i zakres

Dokładne pliki, before/after, zmienione pola, option IDs i aktualne źródła AWS są w producer `evidence/business-quality/saa-20261010-aws-targeted-corrections.md`; pełne obiekty przed/po oraz mapowanie są w sąsiednim `.json`. Naprawiono 28 pytań w 12 plikach, bez rozszerzania audytu całego banku. Żadne z tych 28 wystąpień nie było już naprawione na lokalnym baseline.

27 `questionId` zachowano. `aws-saa-c03-AWSSAA-N07-B05-005` wycofano na rzecz `aws-saa-c03-AWSSAA-N07-B05-005-saa20261011`, ponieważ nowy scenariusz sprawdza cutover, draining i niejednoznaczny ACK. Zmienione znaczeniowo dystraktory MQ mają nowe option IDs; poprawna odpowiedź pozostaje stable `A`, a jej pozycja w aplikacji jest przetasowywana.

- Source commit: `c270a47cb06fb921d0014b7de039df1e30dfd7b1`.
- Candidate: `b4ceb705fd7b96653783d4982adb305a6db8796418787c420dfccb486cb30c8b`.
- Release: `patternly-candidate-c270a47cb06f`.
- Questions: 2604; question-set SHA-256 `f745d5ea27b753a3fae1143c079086fb2bab99dacfbb89a08744925030eeed42`.
- Training v1 SHA-256 `4a04418d8c58e00b73a28041e5aedfed0b7a8ed3e62cf014a071245de2d19f4c`.
- Raw v2 SHA-256 `350dc44eed14c7087bfdd79196d84d5ca16c606b449536f8c35078b4116a6fc6`.
- Wersja treningowa `aws-certified-solutions-architect-associate-authoring-v2026.10.11-saa-fixes-v1`; raw v2 dodaje istniejący suffix `-bizq03-planning-v2`.

Niezależny semantic QA (Luna High, 11.10.2026): PASS wszystkich 28 poprawianych pytań, z aktualną dokumentacją AWS i pozytywnymi/negatywnymi przypadkami. Nie jest to semantyczny PASS pozostałych pytań banku.

## Stan

Implementacja i niezależne QA w toku. Wyniki końcowe, hashe i rzeczywiste polecenia zostaną uzupełnione po odbiorze; nie przyznano jeszcze PASS ani admission.
