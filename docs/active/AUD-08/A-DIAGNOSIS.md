# AUD-08/A — granica protokołu odzyskiwania

**Data:** 24.09.2026

**Status:** diagnoza done; kontrakt A wymaga sprawdzenia granicy generacji autoryzacji w AUD-08/A0. Decyzja techniczna należy do Codex.

## Potwierdzony stan

Backend w transakcji oznacza kod jako użyty, potem wywołuje `revokeRefreshTokens` i tworzy custom token. Nie ma `operationId`, trwałego ACK ani statusu odzyskiwania. Failure injection opisane w [raporcie backendu](https://github.com/lukaszkurczab/patternly-backend/blob/0ea62f7/docs/active/AUD-08/REPORT.md) pokazuje, że po błędzie revoke lub mint ponowienie tego samego kodu zwraca `recovery_code_used`. Mobile wysyła samo `{code}` i dopiero po odpowiedzi próbuje `signInWithCustomToken`; nie zapisuje próby do wznowienia po restarcie. Reissue wydaje kody tylko w odpowiedzi HTTP, bez identyfikatora operacji; utracona odpowiedź może doprowadzić do nieświadomego ponownego wydania i unieważnienia poprzedniej generacji. Osobny delete-account ma trwalszy `operationId`/status, lecz nie zabezpiecza recovery.

Firebase dokumentuje, że [custom token wygasa po maksymalnie godzinie](https://firebase.google.com/docs/auth/admin/create-custom-tokens), a po udanym `signInWithCustomToken` sesja trwa niezależnie od życia samego custom tokenu. Nie ma atomowej transakcji pomiędzy Firestore, wywołaniem Firebase i dostarczeniem odpowiedzi HTTP. Sam lease/fencing dokumentu nie cofa spóźnionego wywołania providera. [Firestore transactions](https://cloud.google.com/firestore/docs/transaction-data-contention) serializują zapis dokumentów, nie efekty zewnętrznego API.

## Przypadek ryzyka i warunek techniczny

Przypadek: użytkownik wpisuje ostatni kod na nowym telefonie; serwer zaczął wymianę z Firebase, lecz telefon traci sieć przed odpowiedzią. W tym czasie stary telefon żąda nowych kodów. Sam wybór zachowania UI nie rozstrzyga bezpieczeństwa spóźnionego wywołania Firebase.

1. **Trwała kwarantanna niepewnej operacji** bez automatycznego przejęcia slotu nie pozwala ponowić wywołania providera ani bezpiecznie odblokować konkurencyjnego reissue/delete. Wymaga operacyjnej pomocy i może trwale zablokować konto po typowej awarii sieci. Ocena wariantu: cel 0,78; prostota 0,80; ryzyko 0,91; utrzymywalność 0,76; minimum **0,76** — odrzucony jako docelowy kontrakt.
2. **Wznawialny protokół** wymaga monotonicznej generacji autoryzacji przypiętej do tokenu oraz sprawdzanej na każdej granicy dostępu do konta, w backendzie i bezpośrednich regułach Firebase. Dopiero po dowodzie pełnego pokrycia można bezpiecznie rozważyć przejęcie przerwanej rezerwacji; w przeciwnym razie stary worker może późno dostarczyć skuteczny token. Ten warunek należy zinwentaryzować jako AUD-08/A0 przed briefingiem implementacyjnym.

Wstępne pytanie do PO o preferencję UX zostało wysłane, lecz odpowiedź **nie jest bramką** ani delegacją projektu protokołu. Codex odpowiada za techniczny kontrakt. Po AUD-08/A0 trzeba spisać stany `operationId`, ACK, ochronę i retencję tokenu/kodu, reakcję na provider failure, współbieżność reissue/delete oraz testy restartu i utraty odpowiedzi. Wydanie kodów wymaga osobnego stabilnego ID i ACK; ponieważ backend przechowuje tylko hashe kodów, utraconej odpowiedzi nie można dziś odtworzyć. Wcześniejsze briefingi w raporcie backendu oraz wariant kwarantanny otrzymały minimum poniżej 0,8. Żaden runtime endpoint nie został zmieniony.

**Ocena samej diagnozy:** cel i architektura 0,95; prostota 0,93; ryzyko 0,93; utrzymywalność 0,91; minimum **0,91**. To ocena dokumentacji stanu, nie niezatwierdzonego rozwiązania.
