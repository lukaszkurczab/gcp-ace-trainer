# ODK-E2E-064 — discovery manifestu prywatności i disclosure

Data: 2026-09-07
Status: `IMPLEMENTED_PENDING_FINAL_ARTIFACT_RETEST`

## Dowody z bieżącego repozytorium

- `app.config.js` używa `expo-notifications`, a aplikacja planuje wyłącznie
  przypomnienia lokalne; `expo-apple-authentication` pozostaje zależnością dla
  Sign in with Apple.
- `src/infrastructure/firebase/firebaseAuthClient.ts` i
  `src/application/account/AccountSessionProvider.tsx` obsługują identyfikator
  użytkownika i adres email; synchronizacja i backend mają także identyfikator
  urządzenia oraz dane postępu.
- `src/features/reports/ContentReportSheet.tsx` wysyła kategorię, opcjonalną
  treść użytkownika, identyfikatory treści, trasę, język, build, platformę i
  czas; token App Check i metadane techniczne uzasadniają kategorię diagnostyczną.
- Kod konta, raportów i kanałów wsparcia uzasadnia deklaracje `Name`, `Email
  Address`, `User ID`, `Device ID`, `Other User Content`, `Customer Support`,
  `Product Interaction` i `Other Diagnostic Data`. Nie ma zewnętrznego SDK
  reklamowego, trackingowego, analitycznego ani crash-reportingowego.
- `plugins/withPrivacyBoundary.js` jest kanonicznym źródłem manifestu:
  zachowuje required-reason APIs, ustawia `NSPrivacyTracking = false`, a każdą
  bieżącą kategorię oznacza `Linked = true`, `Tracking = false` i celem
  `App Functionality`. Końcowa transformacja usuwa `aps-environment` i
  `remote-notification`, ale zachowuje Sign in with Apple.
- W aktualnym artefakcie iOS nie ma StoreKit ani klienta RevenueCat; obecność
  przyszłej granicy billingowej nie jest dowodem zbierania `Purchase History`.

## Uzgodniony wariant

Manifest i ręczna macierz ASC deklarują osiem bieżących kategorii danych,
bez zakupu, trackingu i tracking domains. Pełna macierz odpowiedzi znajduje
się w [ODK-E2E-064-APP-STORE-DISCLOSURE.md](./ODK-E2E-064-APP-STORE-DISCLOSURE.md).

## Ocena briefu

- Niezależna walidacja preimplementation: `gpt-5.6-luna`, reasoning `max`;
- dopasowanie do celu i architektury: `0.95`;
- prostota: `0.92`;
- kontrola ryzyka: `0.87`;
- utrzymywalność: `0.93`;
- minimum: `0.87`.

## Gate

Statusu nie zamykać na podstawie samego testu pluginu. Po ODK063 i ODK059
trzeba powtórzyć przegląd kodu i SDK, wykonać czysty prebuild, finalny archive,
raport privacy oraz ręczny wpis ASC; w szczególności ponownie ustalić wiersz
`Purchase History`.
