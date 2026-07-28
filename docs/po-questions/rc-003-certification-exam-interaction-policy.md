# RC-003 — polityka interakcji Certification Exam Simulation

## Decyzja PO — 2026-07-28

Zatwierdzono wariant 2: `Certification Exam Simulation` jest własną,
treningową symulacją Patternly, a nie deklarowanym odwzorowaniem interfejsu
Google ani Pearson.

Wersja polityki `patternly-certification-simulation-v1` ustanawia:

- swobodną nawigację po całej sesji;
- zmianę odpowiedzi aż do finalizacji;
- trwałe flagowanie pytania oraz navigator odpowiedzi i flag;
- pięć widocznych obszarów blueprintu jako strukturę treningową;
- jeden bezwzględny limit 120 minut, którego upływ finalizuje zweryfikowany
  trwały draft;
- ujawnienie wyniku i feedbacku wyłącznie po finalizacji.

Oficjalne źródła pozostają źródłem dla czasu, zakresu liczby pytań i
blueprintu. Nie są źródłem dla powyższych zasad interakcji. Jeżeli Google
opublikuje nowe szczegóły, polityka może zostać normalnie zrewidowana jako
nowa decyzja produktowa — bez trybu zgodności i bez ukrytego fallbacku.

## Uzasadnienie decyzji

Oficjalna strona Associate Cloud Engineer (sprawdzona 2026-07-28) potwierdza
standardowy egzamin: 2 godziny, 50–60 pytań multiple choice/multiple select
i pięć obszarów tematycznych. Nie dokumentuje jednak polityki aplikacyjnej dla
nawigacji między pytaniami, zmiany odpowiedzi, flagowania, navigatora, sekcji
ani auto-final-submit. Dodatkowo Google zmieniło dostawcę egzaminu na Pearson
w 2026 r., więc naśladowanie nieudokumentowanego UI jako "oficjalnego" byłoby
wprowadzającym w błąd kontraktem.

Źródła:

- https://cloud.google.com/learn/certification/cloud-engineer
- https://cloud.google.com/learn/certification/guides/cloud-engineer
- https://support.google.com/cloud-certification/answer/16803278

## Rozważone rozwiązania

1. Pozostawić `certification-exam-simulation` jako jawnie niedostępny, dopóki
   Google nie opublikuje tych reguł. Nie deklarujemy symulacji jako odwzorowania
   egzaminu.
2. Zatwierdzić własną, produktową politykę treningowej symulacji: free
   navigation, zmiana odpowiedzi do finalizacji, flagowanie i navigator,
   sekcje z blueprintu, auto-final-submit po 120 minutach. Profil rozdziela
   wtedy fakty oficjalne od jawnie oznaczonej polityki Patternly; UI nie
   twierdzi, że odwzorowuje interfejs Pearson/Google.
3. Zmienić zakres na zwykły timed practice bez navigatora, flagowania i
   sekcji, z metrykami treningowymi zamiast symulacji egzaminu.

## Rekomendacja, która została przyjęta

Wybrać opcję 2. Zachowuje ona wartość treningową i uczciwie rozdziela dane
oficjalne od decyzji Patternly; nie wymaga zgadywania zachowania dostawcy
egzaminu. Po decyzji trzeba wersjonować tę politykę w canonical product
contract i profilu, a nie ukrywać jej w runtime.
