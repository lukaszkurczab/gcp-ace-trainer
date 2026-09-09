# ODK-E2E-035 — raport pełnego przepływu planu

Status: VERIFIED_CLOSED

## Wynik

- Zweryfikowano jeden pełny przepływ dla tracka Coding Interview.
- Cel ma target `2027-09-09`. Data była przyszła względem `2026-09-09 CEST`.
- Jawna propozycja miała trzy sesje tygodniowo.
- Plan zaakceptowano, a potem edytowano przez kanoniczny edytor.
- Dodano czwartek. Liczba sesji wzrosła z trzech do czterech.
- Godzina środy zmieniła się z `18:00` na `20:00`.
- Reminders mają zgodę `granted`, cztery sloty i brak stanu pending.
- Pierwsza sesja została ukończona: 10 z 10 pytań.
- Druga sesja została jawnie zakończona bez odpowiedzi: 0 z 10 pytań.
- Po restarcie Home i Progress nadal pokazują ukończony bieżący dzień.
- Activity pokazuje ukończoną sesję i zgodnie z kontraktem nie liczy porzuconej sesji jako postępu.
- Nie znaleziono regresji produktu. Kod produktu nie wymagał zmiany.
- VoiceOver pominięto zgodnie z decyzją właściciela.

## Stan początkowy

- `main` i `origin/main` wskazywały `8337514`.
- Jedyną wcześniejszą zmianą worktree był niestage’owany rejestr użytkownika.
- Zmiana użytkownika pozostała poza zakresem i poza commitami zadania.
- ODK-E2E-035 był pierwszym zadaniem `OPEN`.

## Walidacja briefu

Pierwszy wariant został odrzucony przez `gpt-5.6-luna / max`.

| Kryterium | Wynik |
| --- | ---: |
| Zgodność celu i architektury | 0,84 |
| Prostota | 0,72 |
| Ryzyko | 0,67 |
| Utrzymywalność | 0,74 |
| Minimum | 0,67 |

Przeprojektowano fixture, dowód precedencji terminalnych sesji, granicę dowodu UI i sposób selektywnego sprzątania.

Poprawiony brief uzyskał `APPROVE` od `gpt-5.6-luna / max`.

| Kryterium | Wynik |
| --- | ---: |
| Zgodność celu i architektury | 0,95 |
| Prostota | 0,84 |
| Ryzyko | 0,81 |
| Utrzymywalność | 0,86 |
| Minimum | 0,81 |

Ocena głównego agenta przed retestem: zgodność 0,96, prostota 0,94, ryzyko 0,86, utrzymywalność 0,93. Minimum wyniosło 0,86.

## Dowód maszynowy

Testy ukierunkowane przeszły: 77/77.

Objęły:

- jawną propozycję i akceptację;
- CAS i rewizje edycji planu;
- pełny `contentPackagePin`, `contentVersion`, track i timezone;
- trwałą konfigurację sesji;
- ukończenie i porzucenie sesji;
- identity reminderów i slotów;
- projekcję `abandoned` jako `skipped`;
- precedencję `completed` nad późniejszym `skipped` tego samego dnia.

Pełne `npm run qa:static` przeszło:

- recovery inventory: PASS;
- TypeScript: PASS;
- testy: 1030/1030 PASS;
- content boundary: PASS;
- runtime privacy boundary: PASS.

## Retest iOS

Środowisko:

- iOS 26.4;
- symulator `Maestro_IOS_iPhone-17_26`;
- locale `en_US`;
- timezone `CEST`;
- motyw jasny;
- commit bazowy `8337514`.

Maestro potwierdziło:

1. świeżą instalację i wybór Coding Interview;
2. utworzenie celu z przyszłą datą;
3. widok jawnej propozycji `ready`;
4. akceptację i trwały plan;
5. zmianę 3 → 4 sesje oraz środy 18:00 → 20:00;
6. systemową zgodę na powiadomienia i cztery sloty;
7. ukończenie pierwszej sesji 10/10;
8. jawne zakończenie drugiej sesji 0/10;
9. Home i Progress po obu wynikach;
10. trwałość po restarcie;
11. Activity z ukończoną sesją i bez porzuconej sesji.

Kontrola wizualna nie wykazała ucięć, mieszania tracków ani fałszywego sukcesu. Progress prawidłowo pokazuje brak reguły ukończenia pakietu jako `completion:unknown`. Nie wylicza fikcyjnej prognozy.

## Próby automatyzacji

Poniższe zatrzymania nie były regresjami produktu:

- zmienna URL została początkowo przekazana jako literalny tekst;
- pierwszy tap `Start track` nie zmienił ekranu;
- standardowe `hideKeyboard` nie zamknęło klawiatury, zgodnie ze znanym ODK-E2E-093;
- Maestro odrzuciło screenshot poza katalogiem uruchomienia;
- asercja oczekiwała nieistniejącego success selectora `state:synced`, choć UI pokazało `granted`, cztery sloty, brak pending i akcję wyłączenia;
- asercja oczekiwała `completion:in-progress`, lecz pakiet jawnie ma `completion:unknown`;
- jeden tap zakładki po restarcie nie zmienił ekranu; ponowienie z `retryTapIfNoChange` przeszło.

Każdy stan produktu sprawdzono ponownie przez selektor, hierarchię albo następny segment. Nie użyto awarii automatyzacji jako dowodu sukcesu.

## Niezależne QA

- Model: `gpt-5.6-luna`.
- Reasoning effort: `max`.
- Werdykt: PASS.
- Brak findingów P0–P2.
- Niezależny zestaw ukierunkowany: 100/100 PASS.
- Niezależny typecheck: PASS.
- Potwierdzono pełną identity, atomowe CAS/journal, precedencję terminalnych sesji, trwałość po restarcie i prawidłową granicę Activity.

## Zakres zmian

- Brak zmian kodu produktu i testów.
- Raport oraz manifest są trwałym śladem w historii Git.
- Tymczasowe flow i binarne dowody nie należą do produktu.
