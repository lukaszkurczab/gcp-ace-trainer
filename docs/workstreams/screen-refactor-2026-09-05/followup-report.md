# Progress / Settings — raport korekty

Stan: zakończone. Implementacja, niezależny recheck i końcowe bramki PASS. Checkout zawiera wcześniejszy P0–P5 i tę korektę; bez commita/deployu.

## Efekt
- Recent activity reprezentuje terminalne sesje, najnowsze najpierw, maksymalnie 12 dla aktywnej ścieżki. Jeden wpis prowadzi do dokładnego wyniku sesji. Statystyki odpowiedzi zachowują znaczenie. Home używa swojego istniejącego odczytu attempts, a Activity i Progress wspólnej typowanej nawigacji wyników.
- Settings rozróżnia gościa (jawne logowanie/rejestracja) i konto; zalogowany ma widoczne wylogowanie przez istniejący provider, a management właściwy opis i email. Pending/failure/verification/guest-binding mają uczciwe stany.
- Nieoczekiwany błąd przygotowania wylogowania przywraca authenticated, zachowując generation/UID i binding guard. Nie zostawia signingOut na stałe ani nie przechodzi do Firebase sign-out po błędzie.
- Dodano istniejący wybór języka system/en/pl z zapisem, blokadą konkurujących zapisów i błędem. Domyślny en niezmieniony.
- Nagłówek Recent activity i panel wyjaśnienia rekomendacji poprawiono na podstawie zrzutów dużego tekstu.

## Zakres plików i usunięte ścieżki
Dokładne listy: [P6](P6.md), [P7](P7.md), [korekty P7](P7-QA-corrections.md). Dodatkowo root: `src/preferences/appPreferences.test.ts` (zapis wszystkich języków i failed-write/retry) oraz opisane korekty P6/testy w [QA P6](P6-independent-QA.md). Usunięto attempts-only recent projection i przeniesiono istniejący command lock AccountEntry do jednego `useAccountCommand` współdzielonego z Settings. Nie ma nowego frameworka ekranów ani zależności.

## Weryfikacja
- Niezależny recheck P6 min .86, P7 po korektach min .88 — PASS; szczegóły w raportach QA.
- `git diff --check` PASS.
- `npm run qa:static`: **757/757 PASS**, recovery check, typecheck, content boundary, runtime privacy boundary; pełny log [followup-release-qa.log](followup-release-qa.log).
- Narrow P6 31+17, root27 i4; P7 51; root language5; korekty account62 — PASS. To nakładające się zestawy, nie suma niezależnych testów.
- Native iPhone17/iOS26.4: session preview → exact result, guest Settings → sign-in → guest return, system/pl/en i powrót na ekran, dark/max-text oraz poprawiony header/diagnostics. Dokładne runs i wyjaśnienia wcześniejszych nieudanych asercji w [dokumencie roboczym](followup-progress-account.md).
- Stan końcowy symulatora: app en, appearance system; system large/light; bez nowej sesji, resetowania danych ani rzeczywistego konta.

## Granice dowodu
Native to iOS i gość. Nie wykonano authenticated signout/delete, Android, ręcznego VoiceOver ani renderer tests dla wszystkich przejść busy/error. Zachowanie storage/lifecycle/state transition jest testowane wykonawczo, a UI command wiring/busy/error dodatkowo przez asercje źródła. Native tylko coding-practice result; pozostałe dwie trasy sprawdzono przez wykonanie adaptera nawigacji. Wcześniejsze P0–P5 ograniczenia nadal opisuje final-report.md.

Końcowy native guest przebieg po korekcie provider: 2026-09-05_122804 PASS w large/light/en, Settings PNG obejrzany. Pozostałe ryzyko utrzymaniowe: przy rozszerzaniu pól stanu konta należy jednocześnie aktualizować lokalne predykaty zdrowego konta w Settings i AccountEntry; niezależny QA uznał je za nieblokujące.
