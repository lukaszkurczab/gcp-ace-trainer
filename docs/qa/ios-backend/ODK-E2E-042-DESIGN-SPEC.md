# ODK-E2E-042 — typografia górnej nawigacji

Status: ACCEPTED_PENDING_IMPLEMENTATION. PO wybrał wariant 1 po audycie zbiorczym. Implementacja 043 nie rozpoczęła się.

## Decyzja PO po audycie zbiorczym

PO zatwierdził `042=1`: context używa 16/22/600. Licznik wcześniejszych prób pozostaje 5/5.

## Źródła

Projekt opiera się na inwentarzu ODK-E2E-044 i rzeczywistym zrzucie Activity z iOS `2026-09-08_051857`. Zachowuje obecny styl Patternly. Obrazy są kierunkiem wizualnym. Nie są dowodem wdrożenia ani pomiarem pikselowym.

Kolejność pokazanych obrazów jest wiążąca:

1. kontekst 16/22/600;
2. kontekst 17/24/600;
3. kontekst 18/24/600.

Oryginały: `exec-9b9ddcd2-3ade-449c-9421-7646a7298216.png`, `exec-4fafff67-7735-4f5b-880e-0fd786f2a669.png`, `exec-10706cc0-c121-47c5-87bc-4879beee5d3d.png`. Kopie robocze są w `/private/tmp/patternly-path07/design042/option-1.png` do `option-3.png`. Wyniki mają odpowiednio 851×1849, 850×1850 i 850×1850 px. Prompt celował w proporcję 1206×2622.

## Kontrakt wspólny

- Wybrany rozmiar dotyczy `ScreenHeader` context, `AppShellHeader` context/meta, etykiety `placement="back"` oraz lokalnego Goal context.
- Główny tytuł ekranu, marka Patternly i treść ekranu zachowują bieżące rozmiary. Headingi głównych tabów należą do 045.
- Kolor context to `textPrimary`. Waga to 600.
- Context ma `flexShrink: 1`, kontener tekstu ma `minWidth: 0`.
- Długi kontekst zawija się do dwóch linii. Nie używa ellipsis. Po dwóch liniach pełna nazwa pozostaje dostępna dla technologii wspomagających.
- Wiersz ma co najmniej 44 pt wysokości. Po zawinięciu rośnie naturalnie. Odstęp od przycisku back wynosi `spacing.sm`. Odstęp do tytułu wynosi `spacing.lg`, a w wariancie Activity `spacing.sm`.
- Przycisk back zachowuje co najmniej 44×44 pt. `placement="back"` przejmuje ten sam rozmiar tekstu i wysokość minimum 44.
- `maxFontSizeMultiplier` pozostaje 2. Układ ma działać przy skali 2 bez nachodzenia na back, timer i akcje.
- EN i PL używają tego samego kontraktu. Light i dark używają semantycznych tokenów, bez osobnych wartości typografii.

## Wyjątki

- `SessionShell`: kontekst 14/20/600. Akcje pozostają 13/16. Sloty mają `minWidth: 0` i mogą zawinąć tekst. Timer i pozycja nie mogą zostać zasłonięte.
- `ReviewShell` i review loading: wybrany rozmiar stosuje się do tekstu top bar. Kontekst pod top barem pozostaje 13/18/500, chyba że retest wykaże ten sam problem.
- Account status 38/44 oraz tytuły modali i bottom sheets nie przejmują globalnie rozmiaru context. Ich obecna hierarchia pozostaje.
- Goal loading używa tego samego kontraktu co gotowy Goal. Loading i error nie mogą zmieniać wysokości nagłówka względem gotowego stanu bez potrzeby.

## Retest wymagany przed zamknięciem 043

EN i PL, light i dark, zwykły oraz maksymalny tekst. Co najmniej: `ScreenHeader`, `AppShellHeader`, Goal, globalny stack header, `placement="back"`, Review, loading, error i aktywna sesja. Należy użyć długiego kontekstu, sprawdzić maksymalnie dwie linie, pełną etykietę dostępności, hitbox back i brak kolizji z akcjami.

## Walidacja briefu

Luna/max, bez narzędzi: zgodność 0,94; prostota 0,88; ryzyko 0,84; utrzymywalność 0,90. Minimum 0,84, `APPROVE warunkowo`. Ten dokument uzupełnia wymagane mapowanie komponentów, padding, wysokość, limit linii i kontrakt retestu.
