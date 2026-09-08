# ODK-E2E-056 — konflikt celu lokalnego i chmurowego

Status: BLOCKED

## Potwierdzony stan

- Cel gościa jest lokalny per track.
- Cel nie jest dziś synchronizowany.
- Account adoption ma preview i wybór `keep_guest` / `keep_account` dla pięciu innych typów rekordów.
- Cel i plan nie są częścią tego preview.
- Systemowy harmonogram powiadomień musi pozostać lokalny dla urządzenia.
- Cichy wybór strony mógłby utracić dane.

## Warianty

### A. Cel konta z jawnym wyborem — rekomendowany

Cel i zaakceptowany plan synchronizują się per track. Przy różnicy aplikacja pokazuje oba warianty i pyta: zachować lokalny czy zapisany na koncie.

Wpływ: brak cichej utraty. Więcej pracy w preview, UI, backendzie i testach.

### B. Zawsze konto

Po logowaniu cel i plan konta zastępują lokalne dane.

Wpływ: prostszy przepływ. Lokalny cel gościa może zniknąć.

### C. Zawsze urządzenie

Lokalny cel i plan zastępują dane konta.

Wpływ: prostszy przepływ. Cel z innego urządzenia może zniknąć.

### D. Cele tylko na urządzeniu

Cel i plan nie są synchronizowane.

Wpływ: brak konfliktu chmurowego. Użytkownik nie dostaje ciągłości między urządzeniami.

## Rekomendacja

Wybrać A. Cel i zaakceptowany plan należą do konta. Konflikt jest rozstrzygany per track. Fakty nauki nadal używają swoich reguł. `notificationId`, zgoda systemowa i faktyczne zaplanowanie pozostają lokalne.

Rozwiązanie rozszerza istniejące adoption preview. Zachowuje jego fingerprint, wersje, trwałe `pendingConfirmation` i wznowienie. Nie tworzy osobnego mechanizmu konfliktów.

## Przypadki do wdrożenia po decyzji

- brak lokalnego celu: pobierz konto;
- brak celu konta: zapisz lokalny;
- identyczne dane: połącz bez pytania;
- różny cel lub plan: pokaż jawny wybór;
- błąd sieci: zachowaj oba, pozwól ponowić;
- ponowne logowanie: wznowienie tego samego preview bez zmiany wyboru.

## Licznik decyzji PO

- Próba 1/5: pytanie przekazane 2026-09-08. Oczekiwana odpowiedź A, B, C lub D.
- Próba 2/5: po teście istniejącej synchronizacji pytanie uproszczono do akceptacji wariantu A albo wskazania innej reguły. Test 8/8 potwierdził, że obecny kontrakt bezpiecznie obsługuje wersje i retry innych rekordów, ale nadal nie obejmuje celu ani planu.
- Próba 3/5: po niezależnej walidacji 0,88 przedstawiono gotową regułę bez nowego mechanizmu: rozszerzyć istniejące adoption preview o `goal` i `learning_plan` per track.
- Próba 4/5: po inspekcji UI doprecyzowano, że obecny jeden wybór dla wszystkich konfliktów nie wystarczy. Decyzja dotyczy niezależnego wyboru per track. Przygotowano też plan zgodności starych klientów przez protokół sync v2.
- Próba 5/5: po końcowym QA uzupełniono negocjację v1/v2, migrację lokalnego stanu i atomową grupę `goal` + `learning_plan` per track. PO otrzymał gotową decyzję tak/nie.

Po piątej prośbie nie otrzymano decyzji. Zadanie pozostaje aktywne i wróci na najbliższej bezpiecznej granicy po odpowiedzi PO.

## Walidacja briefu

Niezależny `gpt-5.6-luna / max`, bez narzędzi:

- zgodność celu i architektury: 0,94;
- prostota: 0,91;
- ryzyko: 0,88;
- utrzymywalność: 0,92;
- minimum: 0,88;
- werdykt: APPROVE.
