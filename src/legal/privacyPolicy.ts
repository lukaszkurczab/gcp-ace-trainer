import { legalVariables } from "./legalVariables";

export const privacyPolicy = Object.freeze({
  en: String.raw`Patternly Privacy Policy

Effective ${legalVariables.privacy.effectiveDate.en}. Version ${legalVariables.documentVersion.en}. This Policy explains how ${legalVariables.privacy.controllerLegalName.en}, ${legalVariables.privacy.controllerBusinessForm.en}, at ${legalVariables.privacy.controllerAddress.en} (the “Controller”) processes personal data in Patternly.

1. Controller and contact

Controller: ${legalVariables.privacy.controllerLegalName.en}, ${legalVariables.privacy.controllerBusinessForm.en}, ${legalVariables.privacy.controllerAddress.en}. Privacy contact: ${legalVariables.privacy.privacyEmail.en}; phone: ${legalVariables.privacy.controllerPhone.en}. Data protection officer or designated privacy contact: ${legalVariables.privacy.dpoContact.en}.

2. Scope and age policy

This Policy covers the mobile app, account and synchronization services, public legal pages, and support or content-report channels. Account-free guest learning can be available to younger users. Self-service account creation and cloud synchronization are restricted to users aged 18 or over; Patternly does not provide a guardian-consent flow.

3. Data kept on your device

Guest and account use may store an installation identifier, local dataset identifier, selected track, goals, settings, learning sessions, answers, results, review queue, recovery state, notification schedule and content-report outbox on the device. Local reminders are scheduled on the device; Patternly does not currently register a server push token.

Local learning data is protected by the device storage controls used by Patternly. A recovery code copied at your request is cleared when the operating system permits and only if the clipboard still contains that code. Data remaining only on the device is not sent to the Controller unless you create an account and synchronize an allowed record, submit a report, or invoke another network feature.

4. Account and authentication data

For an account, Patternly processes Firebase and Patternly user identifiers, email address, verification state, authentication provider and security timestamps to create and secure the account, authenticate requests, synchronize supported data, recover access and prevent abuse. The legal bases are performance of the service contract and the Controller’s legitimate interest in service security; legal obligations apply where records must be retained.

Apple, Google and Firebase may process authentication and device-attestation data under their own terms. Under Article 14 GDPR, they are also sources from which Patternly may receive identity and provider identifiers, an email address and name when returned, and device-attestation or security signals. Patternly requests Apple email and name scopes during sign-in and limits use to fields returned for authentication and account operation.

5. Learning and synchronization data

When synchronization is enabled, Patternly sends the selected track and completed learning records such as session summaries, results, answers, review state, versions, timestamps and device or dataset identifiers to the Patternly backend. Active drafts, timers, preferences and notification settings are not in the current synchronization allowlist. The purpose and legal basis are providing the account synchronization service and maintaining its integrity.

Learning progress is retained while the account exists and is removed through the account-deletion process, subject to limited deletion evidence described below. Completed synchronization-operation metadata is retained for ${legalVariables.privacy.completedSyncOperationRetentionDays.en} days after completion.

6. Content reports and communications

A content report can include a category, optional free-form description, a random submission identifier, content and package identifiers, route, locale, app build, platform, time and an App Check or device-attestation token. The current mobile form does not intentionally attach an account or contact email, although the backend schema supports those fields for approved channels. The server receives the connection IP address and turns it into a one-way rate-limit identifier used only to limit repeated reports. Do not include passwords or unnecessary sensitive information.

Reports are processed to correct content, respond where contact was requested, protect the service and establish claims. The legal basis for these purposes is the Controller’s legitimate interest under Article 6(1)(f) GDPR in maintaining accurate content, answering a requested contact, protecting the reporting channel and defending legal claims; you may object under Article 21 GDPR. Reports not linked to an account or contact are retained for ${legalVariables.privacy.anonymousReportRetentionDays.en} days; account-linked or contact reports for ${legalVariables.privacy.linkedReportRetentionDays.en} days. The one-way IP rate-limit identifier is kept only for the active limit window of ${legalVariables.privacy.reportRateLimitIdentifierRetentionSeconds.en} seconds. A locally accepted report is removed after the server confirms receipt. An unconfirmed report in the local outbox is automatically removed after ${legalVariables.privacy.localReportOutboxRetentionDays.en} days.

7. Security and technical data

Patternly uses authentication tokens, App Check or device-attestation signals, request metadata, rate-limit identifiers derived by hashing network or email data, operational logs and security-event records to protect accounts, investigate faults and prevent abuse. Patternly does not use advertising or cross-app tracking SDKs, a general-purpose external product-analytics SDK, or an external crash-reporting SDK. RevenueCat processes purchase history for subscription functionality and purchase analytics as described below.

Operational logs are retained for ${legalVariables.privacy.operationalLogRetentionDays.en} days and security logs for ${legalVariables.privacy.securityLogRetentionDays.en} days. Patternly redacts credentials and payloads from production logs. Recovery codes copied at your request may remain in the system clipboard; Patternly attempts to clear them after ${legalVariables.privacy.clipboardRecoveryCodeRetentionMinutes.en} minutes where the operating system permits and does not remove content you copied later.

8. Processors, recipients and transfers

Verified active cloud processors and their purposes: ${legalVariables.privacy.activeCloudProcessors.en}. Active independent controllers and recipients: ${legalVariables.privacy.activeIndependentRecipients.en}. Email delivery provider: ${legalVariables.privacy.emailDeliveryProvider.en}. Provider regions: ${legalVariables.privacy.hostingRegions.en}. Safeguards for transfers outside the EEA: ${legalVariables.privacy.internationalTransferSafeguards.en}.

RevenueCat status: ${legalVariables.privacy.revenueCatStatus.en}. Apple may independently retain App Store transaction and subscription records. Deleting a Patternly account does not cancel an App Store subscription or remove records controlled independently by Apple. Patternly reviews its processors, recipients and transfer arrangements whenever providers or their processing locations change.

9. Retention and account deletion

Account and synchronized learning data are kept while the account is active, unless a shorter period or an earlier valid request applies. Account deletion removes the account subtree, identity mappings and authentication account, and de-identifies linked content reports. It does not by itself cancel a store subscription.

After deletion, Patternly retains a keyed HMAC pseudonym solely to prevent accidental account resurrection for ${legalVariables.privacy.deletionTombstoneRetentionDays.en} days. It remains personal data; it is not anonymous, but no raw provider UID remains. Its legal basis is the Controller’s legitimate interest under Article 6(1)(f) GDPR; you may object to this processing under Article 21 GDPR by contacting ${legalVariables.privacy.privacyEmail.en}. A minimal, unlinkable proof that deletion completed may be retained for up to ${legalVariables.privacy.deletionEvidenceRetentionYears.en} years under Article 6(1)(c) GDPR together with the accountability and rights-obligation framework in Articles 5(2), 12(2), 17 and 24 GDPR. Patternly does not keep a blanket anti-fraud record after deletion: any event-specific anti-fraud retention needs its own documented threat model, necessity assessment and legitimate-interest assessment. Backup and point-in-time-recovery deletion: ${legalVariables.privacy.backupPurgeDisclosure.en}.

10. Your rights

Subject to applicable law, you may request access and the information required by Article 15 GDPR, rectification, erasure, restriction, portability, or object to processing based on legitimate interests. You may withdraw consent without affecting earlier lawful processing. Contact ${legalVariables.privacy.privacyEmail.en}. Requests are normally free of charge. Patternly may verify identity and must respond within one month; where legally permitted, it may extend by up to two further months after notifying you within the first month and explaining why. Any refusal must be reasoned and explain complaint and court options.

Patternly handles privacy requests through intake, identity verification where necessary, assessment, fulfilment or a reasoned refusal, and closure. This also applies where Patternly cannot identify a guest without additional information. You may complain to ${legalVariables.privacy.supervisoryAuthority.en} or another competent authority, and may seek a judicial remedy. Patternly does not make solely automated decisions that produce legal or similarly significant effects.

11. Changes and version evidence

Each published Policy has an effective date and immutable version. Material changes are communicated as required by law. Where consent is the legal basis, a new consent is requested when required. Patternly retains an auditable record of the language, version, time and scope accepted or acknowledged by an account user.

12. Controller details

Registration number: ${legalVariables.privacy.registrationNumber.en}. Tax identifier: ${legalVariables.privacy.taxIdentifier.en}. Territories: ${legalVariables.privacy.distributionTerritories.en}.


13. Processing purposes and legal bases

${legalVariables.privacy.processingRegisterDisclosure.en}

14. Detailed retention periods

${legalVariables.privacy.retentionRegisterDisclosure.en}`,
  pl: String.raw`Polityka prywatności Patternly

Obowiązuje od ${legalVariables.privacy.effectiveDate.pl}. Wersja ${legalVariables.documentVersion.pl}. Niniejsza Polityka wyjaśnia, jak ${legalVariables.privacy.controllerLegalName.pl}, ${legalVariables.privacy.controllerBusinessForm.pl}, pod adresem ${legalVariables.privacy.controllerAddress.pl} („Administrator”) przetwarza dane osobowe w Patternly.

1. Administrator i kontakt

Administrator: ${legalVariables.privacy.controllerLegalName.pl}, ${legalVariables.privacy.controllerBusinessForm.pl}, ${legalVariables.privacy.controllerAddress.pl}. Kontakt w sprawach prywatności: ${legalVariables.privacy.privacyEmail.pl}; telefon: ${legalVariables.privacy.controllerPhone.pl}. Inspektor ochrony danych lub wyznaczony kontakt: ${legalVariables.privacy.dpoContact.pl}.

2. Zakres i zasada wieku

Polityka obejmuje aplikację mobilną, konto i synchronizację, publiczne strony prawne oraz kanały wsparcia i raportowania treści. Nauka jako gość bez konta może być dostępna dla młodszych użytkowników. Samodzielne utworzenie konta i synchronizacja chmurowa są przeznaczone dla osób, które ukończyły 18 lat; Patternly nie udostępnia procesu zgody opiekuna.

3. Dane na urządzeniu

Tryb gościa i konto mogą zapisywać na urządzeniu identyfikator instalacji i lokalnego zbioru, wybraną ścieżkę, cele, ustawienia, sesje nauki, odpowiedzi, wyniki, kolejkę powtórek, stan odzyskiwania, harmonogram powiadomień i kolejkę raportów. Przypomnienia są lokalne; Patternly nie rejestruje obecnie tokena zdalnych powiadomień.

Lokalne dane nauki są chronione przez mechanizmy pamięci urządzenia używane przez Patternly. Kod odzyskiwania skopiowany na Twoje żądanie jest usuwany, gdy pozwala na to system operacyjny i tylko wtedy, gdy schowek nadal zawiera ten kod. Dane pozostające wyłącznie na urządzeniu nie są wysyłane Administratorowi, chyba że utworzysz konto i zsynchronizujesz dozwolony rekord, wyślesz raport lub użyjesz innej funkcji sieciowej.

4. Konto i uwierzytelnianie

Dla konta Patternly przetwarza identyfikatory Firebase i Patternly, adres email, stan weryfikacji, dostawcę logowania i znaczniki bezpieczeństwa w celu utworzenia i zabezpieczenia konta, uwierzytelniania żądań, synchronizacji, odzyskania dostępu i zapobiegania nadużyciom. Podstawą jest wykonanie umowy o usługę i prawnie uzasadniony interes Administratora związany z bezpieczeństwem; obowiązek prawny stosuje się do wymaganych zapisów.

Apple, Google i Firebase mogą przetwarzać dane logowania i atestacji urządzenia na własnych zasadach. Na potrzeby art. 14 RODO są również źródłami, od których Patternly może otrzymywać identyfikatory tożsamości i dostawcy, adres email i imię, jeśli zostaną zwrócone, oraz sygnały atestacji urządzenia lub bezpieczeństwa. Patternly żąda zakresów email i imienia podczas logowania Apple i ogranicza użycie do pól zwróconych dla uwierzytelniania i obsługi konta.

5. Nauka i synchronizacja

Po włączeniu synchronizacji Patternly wysyła do backendu wybraną ścieżkę i ukończone rekordy nauki, takie jak podsumowania sesji, wyniki, odpowiedzi, stan powtórek, wersje, czasy oraz identyfikatory urządzenia lub zbioru. Aktywne drafty, timery, preferencje i ustawienia powiadomień nie należą do obecnej allowlisty synchronizacji. Celem i podstawą jest realizacja usługi synchronizacji konta i zachowanie jej integralności.

Postęp jest przechowywany do usunięcia konta. Metadane zakończonych operacji synchronizacji są przechowywane przez ${legalVariables.privacy.completedSyncOperationRetentionDays.pl} dni po ukończeniu.

6. Raporty treści i komunikacja

Raport może zawierać kategorię, opcjonalny opis, losowy identyfikator zgłoszenia, identyfikatory treści i pakietu, ekran, język, wersję aplikacji, platformę, czas oraz token App Check lub atestacji urządzenia. Obecny formularz mobilny nie dołącza celowo konta ani emaila, choć backend obsługuje te pola w zatwierdzonych kanałach. Serwer otrzymuje adres IP połączenia i przekształca go w jednokierunkowy identyfikator limitu używany wyłącznie do ograniczania powtarzających się zgłoszeń. Nie wpisuj haseł ani zbędnych danych wrażliwych.

Raporty służą poprawie treści, odpowiedzi na kontakt, ochronie usługi i ustalaniu roszczeń. Podstawą tych celów jest prawnie uzasadniony interes Administratora z art. 6 ust. 1 lit. f RODO w utrzymaniu poprawności treści, odpowiedzi na żądany kontakt, ochronie kanału zgłoszeń i obronie roszczeń; możesz wnieść sprzeciw na podstawie art. 21 RODO. Raport niepowiązany z kontem ani kontaktem jest przechowywany ${legalVariables.privacy.anonymousReportRetentionDays.pl} dni, a powiązany z kontem lub kontaktem — ${legalVariables.privacy.linkedReportRetentionDays.pl} dni. Jednokierunkowy identyfikator limitu IP jest przechowywany tylko przez aktywne okno limitu wynoszące ${legalVariables.privacy.reportRateLimitIdentifierRetentionSeconds.pl} sekund. Lokalnie zaakceptowany raport jest usuwany po potwierdzeniu odbioru przez serwer. Niepotwierdzony raport w lokalnej kolejce jest automatycznie usuwany po ${legalVariables.privacy.localReportOutboxRetentionDays.pl} dniach.

7. Bezpieczeństwo i dane techniczne

Patternly wykorzystuje tokeny, App Check lub sygnały atestacji, metadane żądań, identyfikatory limitów utworzone przez hashowanie danych sieciowych lub emaila, logi operacyjne i zdarzenia bezpieczeństwa w celu ochrony kont, diagnostyki i przeciwdziałania nadużyciom. Patternly nie korzysta z SDK reklam ani śledzenia między aplikacjami, ogólnego zewnętrznego SDK analityki produktu ani zewnętrznego SDK raportowania awarii. RevenueCat przetwarza historię zakupów na potrzeby działania subskrypcji i analityki zakupowej opisanej poniżej.

Logi operacyjne są przechowywane ${legalVariables.privacy.operationalLogRetentionDays.pl} dni, a bezpieczeństwa ${legalVariables.privacy.securityLogRetentionDays.pl} dni. Patternly usuwa dane dostępowe i payloady z logów produkcyjnych. Kod odzyskiwania skopiowany na Twoje żądanie może pozostać w schowku systemowym; Patternly próbuje usunąć go po ${legalVariables.privacy.clipboardRecoveryCodeRetentionMinutes.pl} minutach, jeśli system na to pozwala, i nie usuwa treści skopiowanej później przez użytkownika.

8. Podmioty przetwarzające, odbiorcy i transfery

Zweryfikowani aktywni dostawcy chmurowi i cele: ${legalVariables.privacy.activeCloudProcessors.pl}. Aktywni niezależni administratorzy i odbiorcy: ${legalVariables.privacy.activeIndependentRecipients.pl}. Dostawca email: ${legalVariables.privacy.emailDeliveryProvider.pl}. Regiony dostawców: ${legalVariables.privacy.hostingRegions.pl}. Zabezpieczenia transferów poza EOG: ${legalVariables.privacy.internationalTransferSafeguards.pl}.

Status RevenueCat: ${legalVariables.privacy.revenueCatStatus.pl}. Apple może niezależnie zachować historię transakcji i subskrypcji. Usunięcie konta Patternly nie anuluje subskrypcji App Store ani danych kontrolowanych niezależnie przez Apple. Patternly przegląda procesorów, odbiorców i transfery po każdej zmianie dostawcy lub miejsca przetwarzania.

9. Retencja i usunięcie konta

Dane konta i zsynchronizowanej nauki są przechowywane podczas aktywności konta, chyba że obowiązuje krótszy termin lub ważne wcześniejsze żądanie. Usunięcie konta usuwa jego poddrzewo, mapowania tożsamości i konto uwierzytelniania oraz odłącza raporty. Nie anuluje subskrypcji sklepu.

Po usunięciu Patternly przechowuje pseudonim w postaci kluczowanego HMAC wyłącznie w celu zapobieżenia przypadkowemu odtworzeniu konta przez ${legalVariables.privacy.deletionTombstoneRetentionDays.pl} dni. Nadal jest to dana osobowa, a nie anonimowa, lecz surowy UID dostawcy nie pozostaje. Podstawą jest prawnie uzasadniony interes Administratora z art. 6 ust. 1 lit. f RODO; wobec tego przetwarzania możesz wnieść sprzeciw na podstawie art. 21 RODO, kontaktując się z ${legalVariables.privacy.privacyEmail.pl}. Minimalny, niepowiązywalny dowód ukończenia usunięcia może być przechowywany maksymalnie przez ${legalVariables.privacy.deletionEvidenceRetentionYears.pl} lata na podstawie art. 6 ust. 1 lit. c RODO wraz z obowiązkami rozliczalności i realizacji praw z art. 5 ust. 2, art. 12 ust. 2, art. 17 i art. 24 RODO. Patternly nie przechowuje po usunięciu ogólnego zapisu antyfraudowego: każde zdarzeniowe przetwarzanie antyfraudowe wymaga własnego modelu zagrożeń, testu konieczności i oceny prawnie uzasadnionego interesu. Usuwanie kopii zapasowych i point-in-time recovery: ${legalVariables.privacy.backupPurgeDisclosure.pl}.

10. Twoje prawa

W zakresie właściwego prawa możesz żądać dostępu wraz z informacjami z art. 15 RODO, sprostowania, usunięcia, ograniczenia, przenoszenia danych lub sprzeciwić się przetwarzaniu opartemu na prawnie uzasadnionym interesie. Możesz wycofać zgodę bez wpływu na wcześniejsze zgodne z prawem przetwarzanie. Napisz na ${legalVariables.privacy.privacyEmail.pl}. Żądania są co do zasady bezpłatne. Patternly może zweryfikować tożsamość i musi odpowiedzieć w ciągu miesiąca; gdy prawo pozwala, może przedłużyć termin maksymalnie o dwa miesiące, informując o tym i powodach w pierwszym miesiącu. Odmowa musi mieć uzasadnienie i wskazywać środki skargi oraz ochrony sądowej.

Patternly obsługuje żądania dotyczące prywatności przez przyjęcie, weryfikację tożsamości, gdy jest potrzebna, ocenę, realizację lub uzasadnioną odmowę oraz zamknięcie sprawy. Dotyczy to również sytuacji, gdy Patternly nie może zidentyfikować gościa bez dodatkowych informacji. Możesz złożyć skargę do ${legalVariables.privacy.supervisoryAuthority.pl} lub innego właściwego organu oraz skorzystać z drogi sądowej. Patternly nie podejmuje wyłącznie zautomatyzowanych decyzji wywołujących skutki prawne lub podobnie istotne.

11. Zmiany i dowód wersji

Każda opublikowana Polityka ma datę i niezmienną wersję. Istotne zmiany są komunikowane zgodnie z prawem. Gdy podstawą jest zgoda, ponowna zgoda jest zbierana, jeśli wymaga tego prawo. Patternly zachowuje audytowalny zapis języka, wersji, czasu i zakresu zaakceptowanego lub przyjętego do wiadomości przez użytkownika konta.

12. Dane Administratora

Numer rejestracyjny: ${legalVariables.privacy.registrationNumber.pl}. Identyfikator podatkowy: ${legalVariables.privacy.taxIdentifier.pl}. Terytoria: ${legalVariables.privacy.distributionTerritories.pl}.


13. Rejestr celów i podstaw

${legalVariables.privacy.processingRegisterDisclosure.pl}

14. Szczegółowe okresy retencji

${legalVariables.privacy.retentionRegisterDisclosure.pl}`,
});
