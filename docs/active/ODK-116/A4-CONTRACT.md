# ODK-116/A4 — publiczne dane i dokumenty na webie

**Data:** 24.09.2026  
**Status:** A4a producent i A4b konsument ukończone; A4c wyrównanie ścieżek readiness otwarte.

## Potwierdzona granica

Aplikacja `patternly` (`911c5674`) jest właścicielem `config/public-legal.release.json`, schemy, szablonów Privacy/Terms i fingerprintu w readiness. Web (`2cfc614`) ma obecnie zakodowany tekst `Seller: Łukasz Kurczab`, stopkę bez linków prawnych i build MPA tylko z `index.html`. Backend (`0ea62f7`) dostarcza SMTP i obsługę wniosków, nie jest źródłem publicznych faktów operatora. Obecny rekord prawny nie zawiera URL Privacy/Terms/Support, choć aplikacyjny `publicEnvironment` ma je osobno. Te dwa źródła muszą być uzgodnione przed eksportem.

## Slice i kryteria

| Slice | Zmiana | Odbiór |
| --- | --- | --- |
| A4a — app | Dodać URL i kontakt do kanonicznego publicznego rekordu, wymagać zgodności z linkami w release `publicEnvironment`, zachować fail-closed przy placeholderach. Eksporter czyta ten sam rekord, waliduje go i wyprowadza wersjonowany artefakt zawierający fingerprint, dane stopki i wyrenderowane teksty Privacy/Terms PL/EN. | Brak fallbacku do lokalnego fixture; jawne `test` oznaczenie tylko w izolowanym fixture; produkcyjny eksport odmawia braku pól, placeholderów lub niezgodnych URL; fingerprint zgodny z readiness. |
| A4b — web | Build przyjmuje dokładny artefakt przez jawną ścieżkę, sprawdza wersję, fingerprint i wymagane pola, a potem buduje stopkę oraz osobne strony Privacy/Terms jako wejścia MPA. Lokalny podgląd może używać oznaczonego fixture; publikacyjny build go odrzuca. | Brak zakodowanej nazwy sprzedawcy, prawdziwe linki tylko z rekordu, `/admin*` i `/privacy-request*` nadal nieobecne. Build bez artefaktu albo z niezgodnym/oznaczonym testowo artefaktem failuje. Integracja: artefakt producenta przechodzi walidację i render webu; żadnego deployu w A4. |

**Kolejność implementacji/merge:** app A4a, potem web A4b. **Kolejność wydania:** po PO-116 prawdziwy rekord przechodzi app readiness → eksport → web build i review → osobno autoryzowany deploy/rollback → test zdalny. Obecne placeholdery blokują wydanie; lokalny fixture pozwala testować kontrakt, nie stanowi zatwierdzenia treści. Powrót do wcześniejszej wersji wymaga zachowania jej fingerprintu i tekstu dokumentów, gdy została zaakceptowana przez użytkowników.

**Ocena przed implementacją:** zgodność 0,90; prostota 0,82; kontrola ryzyka 0,82; utrzymywalność 0,84; minimum **0,82**. Największe ryzyko to przypadkowa publikacja syntetycznych danych; odmowa publikacyjnego buildu dla fixture jest obowiązkowa.
