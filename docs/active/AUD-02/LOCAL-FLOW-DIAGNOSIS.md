# AUD-02 — diagnoza pozostałego lokalnego flow

**Data:** 24.09.2026  
**Status:** diagnoza zakończona; odbiór urządzeniowy nadal otwarty.

## Potwierdzone

`PracticeSetupScreen` bierze dozwolone długości z trybu pakietu i przekazuje `configuredSessionLength` oraz `feedbackMode` do konfiguracji sesji. Coding Custom Practice udostępnia 10/20/40 pytań i oba momenty informacji zwrotnej. Istniejące flow Maestro `m3-custom-at-session-end.yaml` i `m4-custom-after-each-answer.yaml` wybierają długość 10, uruchamiają sesję i sprawdzają identyfikator konfiguracji runtime. Ich kontrakt ma test `maestroM3M5.test.ts`. RC bootstrap kończy się na wybraniu tracku; nie sprawdza formularza ani sesji.

Obecne dowody M3/M4 są historyczne i nie wiążą bieżącego JS/native build z source SHA. Na jedynym zachowanym iPhonie 17 istnieje już postęp Gościa. Uruchomienie nowej testowej sesji zmieniłoby jego dane, więc do odbioru potrzeba izolowanego fixture z jawnie testowym zakresem. Nie resetowano ani nie instalowano aplikacji.

## Dalszy slice

Na izolowanym fixture sprawdzić wartości 10/20/40 i oba momenty feedbacku w UI, wynikowe identyfikatory sesji, resume i aktualny build/source SHA. Potem wykonać RC bootstrap i właściwe M3/M4 na tym samym urządzeniu. Exact candidate/admission należy do AWS-02. Samo istnienie kodu i dawnych flow nie oznacza PASS AUD-02.

**Ocena podejścia diagnostycznego przed zmianą:** zgodność 0,94; prostota 0,95; ryzyko 0,91; utrzymywalność 0,92; minimum **0,91**. Zakres był odczytowy; nie wprowadzono zmian w produkcie.
