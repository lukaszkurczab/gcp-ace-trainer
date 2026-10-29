/** Unapproved full German translation draft. Test fixtures only; never publish. */
export const legalTranslationDraftsDeTestOnly = Object.freeze({
  locale: "de" as const,
  testOnly: true as const,
  approvalStatus: "UNAPPROVED" as const,
  privacyPolicy: String.raw`Datenschutzerklärung von Patternly

Gültig ab {{privacy.effectiveDate}}. Version {{documentVersion}}. Diese Erklärung erläutert, wie {{privacy.controllerLegalName}}, {{privacy.controllerBusinessForm}}, ansässig unter {{privacy.controllerAddress}} (der „Verantwortliche“), personenbezogene Daten in Patternly verarbeitet.

1. Verantwortlicher und Kontakt

Verantwortlicher: {{privacy.controllerLegalName}}, {{privacy.controllerBusinessForm}}, {{privacy.controllerAddress}}. Datenschutzkontakt: {{privacy.privacyEmail}}; Telefon: {{privacy.controllerPhone}}. Datenschutzbeauftragter oder benannter Datenschutzkontakt: {{privacy.dpoContact}}.

2. Geltungsbereich und Altersregelung

Diese Erklärung gilt für die mobile App, das Konto und Synchronisierungsdienste, öffentliche Rechtsinformationsseiten sowie Support- und Inhaltsmeldekanäle. Lernen ohne Konto als Gast kann jüngeren Nutzern zugänglich sein. Die selbstständige Kontoeröffnung und Cloud-Synchronisierung sind Personen ab 18 Jahren vorbehalten; Patternly bietet kein Verfahren für die Zustimmung eines Erziehungsberechtigten an.

3. Auf Ihrem Gerät gespeicherte Daten

Bei der Nutzung als Gast oder mit Konto können eine Installationskennung, eine Kennung des lokalen Datensatzes, der ausgewählte Lernpfad, Ziele, Einstellungen, Lernsitzungen, Antworten, Ergebnisse, die Wiederholungswarteschlange, der Wiederherstellungsstatus, ein Benachrichtigungsplan und eine Warteschlange für Inhaltsmeldungen auf dem Gerät gespeichert werden. Lokale Erinnerungen werden auf dem Gerät geplant; Patternly registriert derzeit kein Server-Push-Token.

Lokale Lerndaten werden durch die von Patternly verwendeten Speichermechanismen des Geräts geschützt. Daten, die ausschließlich auf dem Gerät verbleiben, werden nicht an den Verantwortlichen gesendet, es sei denn, Sie erstellen ein Konto und synchronisieren einen zulässigen Datensatz, senden eine Meldung oder nutzen eine andere Netzwerkfunktion.

4. Konto- und Authentifizierungsdaten

Für ein Konto verarbeitet Patternly Firebase- und Patternly-Nutzerkennungen, die E-Mail-Adresse, den Verifizierungsstatus, den Authentifizierungsanbieter und Sicherheitszeitstempel, um das Konto einzurichten und zu schützen, Anfragen zu authentifizieren, unterstützte Daten zu synchronisieren, den Zugang wiederherzustellen und Missbrauch zu verhindern. Rechtsgrundlagen sind die Erfüllung des Dienstvertrags und das berechtigte Interesse des Verantwortlichen an der Dienstsicherheit; Aufbewahrungspflichten gelten, soweit Aufzeichnungen gesetzlich vorgeschrieben sind.

Google und Firebase verarbeiten Authentifizierungs- und Geräteattestierungsdaten nach ihren eigenen Bedingungen. Wenn „Mit Apple anmelden“ in einer späteren iOS-Version verfügbar wird und Sie diese Methode wählen, kann auch Apple Authentifizierungsdaten nach eigenen Bedingungen verarbeiten. Im Sinne von Artikel 14 DSGVO können diese Anbieter Quellen sein, von denen Patternly Identitäts- und Anbieterkennungen, eine zurückgemeldete E-Mail-Adresse und einen Namen sowie Geräteattestierungs- oder Sicherheitssignale erhält. Wenn Sie „Mit Apple anmelden“ wählen, fordert Patternly die Berechtigungen für E-Mail und Namen an und verwendet nur die für Authentifizierung und Kontobetrieb zurückgegebenen Felder.

5. Lern- und Synchronisierungsdaten

Wenn die Synchronisierung aktiviert ist, sendet Patternly den ausgewählten Lernpfad und abgeschlossene Lerndatensätze wie Sitzungszusammenfassungen, Ergebnisse, Antworten, Wiederholungsstatus, Versionen, Zeitstempel sowie Geräte- oder Datensatzkennungen an das Patternly-Backend. Aktive Entwürfe, Timer, Präferenzen und Benachrichtigungseinstellungen gehören nicht zur aktuellen Synchronisierungsfreigabeliste. Zweck und Rechtsgrundlage sind die Bereitstellung des Kontosynchronisierungsdienstes und die Wahrung seiner Integrität.

Der Lernfortschritt wird gespeichert, solange das Konto besteht, und im Kontolöschverfahren entfernt; begrenzte Löschungsnachweise bleiben wie nachstehend beschrieben ausgenommen. Metadaten abgeschlossener Synchronisierungsvorgänge werden nach Abschluss {{privacy.completedSyncOperationRetentionDays}} Tage aufbewahrt.

6. Inhaltsmeldungen und Kommunikation

Eine Inhaltsmeldung kann eine Kategorie, eine optionale freie Beschreibung, eine zufällige Einreichungskennung, Inhalts- und Paketkennungen, Route, Spracheinstellung, App-Version, Plattform, Zeitpunkt und ein App-Check- oder Geräteattestierungstoken enthalten. Das Formular für Inhaltsmeldungen fügt weder ein Konto noch eine Kontakt-E-Mail hinzu. Eine freie Beschreibung kann dennoch personenbezogene Angaben enthalten. Der Server empfängt die Verbindungs-IP-Adresse und wandelt sie in eine Einweg-Kennung für Ratenbegrenzungen um, die ausschließlich dazu dient, wiederholte Meldungen zu begrenzen. Geben Sie keine Passwörter oder unnötigen sensiblen Informationen an.

Meldungen werden verarbeitet, um Inhalte zu verbessern und den Meldekanal zu schützen. Rechtsgrundlage ist das berechtigte Interesse des Verantwortlichen nach Artikel 6 Absatz 1 Buchstabe f DSGVO an der Richtigkeit der Inhalte und dem Schutz des Meldekanals; Sie können nach Artikel 21 DSGVO widersprechen. Alle Inhaltsmeldungen werden ab Eingang {{privacy.contentReportRetentionDays}} Tage aufbewahrt. Die Einweg-IP-Kennung dient zur Durchsetzung eines Ratenbegrenzungsfensters von {{privacy.reportRateLimitIdentifierRetentionSeconds}} Sekunden. Jede neu angenommene Meldung, die kein Duplikat ist, setzt den Ablaufzeitpunkt der Kennung auf {{privacy.reportRateLimitIdentifierRetentionSeconds}} Sekunden nach ihrem Eingang. Firestore TTL entfernt abgelaufene Datensätze asynchron, sodass die physische Löschung später erfolgen kann. Eine lokal angenommene Meldung wird entfernt, sobald der Server ihren Eingang bestätigt. Eine unbestätigte Meldung in der lokalen Warteschlange wird nach {{privacy.localReportOutboxRetentionDays}} Tagen automatisch entfernt.

7. Sicherheit und technische Daten

Patternly verwendet Authentifizierungstoken, App Check oder Geräteattestierungssignale, Anfragemetadaten, durch Hashing von Netzwerk- oder E-Mail-Daten erzeugte Ratenbegrenzungskennungen, Betriebsprotokolle und Sicherheitsereignisse, um Konten zu schützen, Fehler zu untersuchen und Missbrauch zu verhindern. Patternly verwendet weder Werbe- oder appübergreifende Tracking-SDKs noch ein allgemeines externes Produktanalyse-SDK oder ein externes SDK zur Absturzberichterstattung. RevenueCat verarbeitet die Kaufhistorie für Abonnementfunktionen und die nachstehend beschriebene Kaufanalyse.

Betriebsprotokolle werden {{privacy.operationalLogRetentionDays}} Tage und Sicherheitsprotokolle {{privacy.securityLogRetentionDays}} Tage aufbewahrt. Patternly schwärzt Zugangsdaten und Nutzdaten in Produktionsprotokollen. Diese Version erstellt oder kopiert keine Kontowiederherstellungscodes mehr. Ein von einer früheren Version kopierter Code kann in der Systemzwischenablage verbleiben. Ist seine Bereinigungsmarkierung noch vorhanden, versucht Patternly nach dem gespeicherten Ablaufzeitpunkt, {{privacy.clipboardRecoveryCodeRetentionMinutes}} Minuten nach dem Kopieren, den übereinstimmenden Code zu löschen, soweit das Betriebssystem dies zulässt. Später kopierte Inhalte werden nicht entfernt; die Löschung jeder historischen Kopie ist damit nicht garantiert.

8. Auftragsverarbeiter, Empfänger und Übermittlungen

Verifizierte aktive Cloud-Auftragsverarbeiter und ihre Zwecke: {{privacy.activeCloudProcessors}}. Aktive unabhängige Verantwortliche und Empfänger: {{privacy.activeIndependentRecipients}}. E-Mail-Zustellungsanbieter: {{privacy.emailDeliveryProvider}}. Regionen der Anbieter: {{privacy.hostingRegions}}. Schutzmaßnahmen für Übermittlungen außerhalb des EWR: {{privacy.internationalTransferSafeguards}}.

RevenueCat-Status: {{privacy.revenueCatStatus}}. Wenn Sie später ein Abonnement über Google Play beziehen, kann Google Transaktions- und Abonnementaufzeichnungen unabhängig aufbewahren. Die Löschung eines Patternly-Kontos kündigt dieses Google-Play-Abonnement nicht und entfernt keine Daten, für die Google eigenständig verantwortlich ist. Patternly überprüft Auftragsverarbeiter, Empfänger und Übermittlungsvereinbarungen, wenn sich Anbieter oder deren Verarbeitungsorte ändern.

9. Aufbewahrung und Kontolöschung

Konto- und synchronisierte Lerndaten werden gespeichert, solange das Konto aktiv ist, sofern keine kürzere Frist oder ein früheres gültiges Ersuchen gilt. Bei der Kontolöschung werden der Kontounterbaum, Identitätszuordnungen und das Authentifizierungskonto entfernt. Mit einem Konto verknüpfte, ältere Inhaltsmeldungen werden davon getrennt. Wenn Sie später ein Abonnement über einen App-Store beziehen, kündigt die Kontolöschung dieses Abonnement nicht selbst.

Nach der Löschung verwendet Patternly ein schlüsselbasiertes HMAC-Pseudonym ausschließlich zur Verhinderung einer versehentlichen Wiederherstellung des Kontos für {{privacy.deletionTombstoneRetentionDays}} Tage ab dem ursprünglichen Löschzeitpunkt, ohne Verlängerung dieses Zeitraums. Es bleibt ein personenbezogenes Datum und ist nicht anonym; eine rohe Anbieter-UID bleibt jedoch nicht erhalten. Rechtsgrundlage ist das berechtigte Interesse des Verantwortlichen nach Artikel 6 Absatz 1 Buchstabe f DSGVO. Sie können dieser Verarbeitung nach Artikel 21 DSGVO widersprechen, indem Sie {{privacy.privacyEmail}} kontaktieren. Ein minimaler Nachweis des abgeschlossenen Löschvorgangs, der eine undurchsichtige Vorgangskennung und Bestätigungsnummer, Datum und Ergebnis enthält, kann zur Überprüfung anhand der vom Nutzer vorgelegten Bestätigungsnummer für {{privacy.deletionEvidenceRetentionMonths}} Kalendermonate nach Abschluss aufbewahrt werden. Er enthält keine Lerndaten. Diese begrenzte Dokumentation wird nach Artikel 6 Absatz 1 Buchstabe c DSGVO zusammen mit dem Rechenschafts- und Rechtepflichtenrahmen der Artikel 5 Absatz 2, 12 Absatz 2, 17 und 24 DSGVO aufbewahrt; daraus folgt keine feste gesetzliche Aufbewahrungsdauer. Patternly führt nach der Löschung keine pauschale Betrugsabwehrdatei; eine ereignisbezogene Betrugsaufbewahrung erfordert ein eigenes dokumentiertes Bedrohungsmodell, eine Erforderlichkeitsprüfung und eine Interessenabwägung. Löschung aus Sicherungen und Point-in-Time-Recovery: {{privacy.backupPurgeDisclosure}}.

10. Ihre Rechte

Vorbehaltlich des anwendbaren Rechts können Sie Auskunft und die nach Artikel 15 DSGVO erforderlichen Informationen, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit oder Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen verlangen. Sie können eine Einwilligung mit Wirkung für die Zukunft widerrufen, ohne die Rechtmäßigkeit der vorherigen Verarbeitung zu berühren. Kontaktieren Sie {{privacy.privacyEmail}}. Anfragen sind normalerweise kostenlos. Patternly darf Ihre Identität überprüfen und muss innerhalb eines Monats antworten; soweit gesetzlich zulässig, kann diese Frist nach einer Mitteilung innerhalb des ersten Monats mit Begründung um bis zu zwei weitere Monate verlängert werden. Jede Ablehnung muss begründet sein und auf Beschwerde- und Klagemöglichkeiten hinweisen.

Patternly bearbeitet Datenschutzanfragen durch Entgegennahme, gegebenenfalls Identitätsprüfung, Bewertung, Erfüllung oder begründete Ablehnung und Abschluss. Dies gilt auch, wenn Patternly einen Gast ohne zusätzliche Angaben nicht identifizieren kann. Sie können sich bei {{privacy.supervisoryAuthority}} oder einer anderen zuständigen Behörde beschweren und gerichtlichen Rechtsschutz suchen. Patternly trifft keine ausschließlich automatisierten Entscheidungen mit rechtlicher oder ähnlich erheblicher Wirkung.

11. Änderungen und Versionsnachweis

Jede veröffentlichte Erklärung hat ein Wirksamkeitsdatum und eine unveränderliche Version. Wesentliche Änderungen werden mitgeteilt, soweit das Gesetz dies verlangt. Ist eine Einwilligung Rechtsgrundlage, wird erforderlichenfalls eine neue Einwilligung eingeholt. Patternly bewahrt einen prüfbaren Nachweis der von einem Kontonutzer akzeptierten oder bestätigten Sprache, Version, Zeit und des Umfangs auf.

12. Angaben zum Verantwortlichen

Registernummer: {{privacy.registrationNumber}}. Steuerkennung: {{privacy.taxIdentifier}}. Gebiete: {{privacy.distributionTerritories}}.

13. Verarbeitungszwecke und Rechtsgrundlagen

{{privacy.processingRegisterDisclosure}}

14. Detaillierte Aufbewahrungsfristen

{{privacy.retentionRegisterDisclosure}}`,
  termsOfService: String.raw`Nutzungsbedingungen von Patternly

Gültig ab {{terms.effectiveDate}}. Version {{documentVersion}}. Diese Bedingungen begründen einen Vertrag zwischen Ihnen und {{terms.operatorLegalName}}, {{terms.operatorBusinessForm}}, ansässig unter {{terms.operatorRegisteredAddress}} (dem „Betreiber“), über Ihre Nutzung von Patternly.

1. Annahme dieser Bedingungen

Wenn Sie ein Konto erstellen oder kontobasierte Patternly-Dienste anderweitig nutzen, stimmen Sie diesen Bedingungen zu und nehmen die gesonderte Datenschutzerklärung zur Kenntnis. Wenn Sie nicht zustimmen, erstellen Sie kein Konto. Eine Gastnutzung, für die keine Zustimmung erforderlich ist, unterliegt weiterhin dem anwendbaren Recht und den Regeln, die für einen sicheren Betrieb der App erforderlich sind.

2. Teilnahmevoraussetzungen

Patternly verlangt, dass Sie mindestens {{terms.minimumUserAge}} Jahre alt sind, um selbst ein Konto zu erstellen. Dies ist eine Produktregel und keine Aussage, dass allen Personen unter diesem Alter das Lernen gesetzlich untersagt ist. Lernen ohne Konto als Gast kann jüngeren Nutzern weiterhin offenstehen. Patternly bietet kein Zustimmungsverfahren für Eltern oder Erziehungsberechtigte an; daher können Personen unter diesem Alter kein Konto erstellen. Geltungsbereich der Regel: {{terms.minimumUserAgeScope}}. Sie müssen richtige Kontoinformationen angeben und Zugangsdaten schützen.

3. Der Dienst

Patternly ist ein unabhängiges Lernwerkzeug zur Übung für technische Vorstellungsgespräche und zertifizierungsbezogene Themen. Patternly ist weder ein offizieller Zertifizierungsanbieter noch eine Prüfungsbehörde, Personalvermittlung oder Schule und garantiert weder eine Beschäftigung noch Prüfungsergebnisse oder berufliche Kompetenz.

Funktionen und Inhalte können sich mit der Weiterentwicklung des Dienstes ändern. Wesentliche Änderungen, die einen aktiven kostenpflichtigen Dienst oder Ihre Rechte betreffen, werden nach Maßgabe des anwendbaren Rechts mitgeteilt.

4. Gastnutzung und Konten

Einige Funktionen können als Gast genutzt werden und speichern Daten auf dem Gerät. Ein Konto kann die Wiederherstellung und Synchronisierung unterstützter Daten ermöglichen. Sie sind für Aktivitäten verantwortlich, die über Ihr Konto ausgeführt werden, es sei denn, Sie melden einen unbefugten Zugriff unverzüglich.

Der Vertrag über den Kontodienst wird auf unbestimmte Zeit geschlossen und läuft, bis Sie oder der Betreiber ihn gemäß diesen Bedingungen beenden. Die Löschung Ihres Patternly-Kontos beendet den Kontodienst. Wenn Sie später ein Abonnement über Google Play erwerben, kündigt die Kontolöschung dieses Abonnement nicht selbst.

Sie können Ihr Konto über den verfügbaren Löschvorgang in der App löschen. Die Datenschutzerklärung erläutert die betroffenen Daten, Aufbewahrungsregeln und Grenzen der Löschung.

5. Lizenz für App und Inhalte

Der Betreiber räumt Ihnen vorbehaltlich dieser Bedingungen und des anwendbaren Rechts ein beschränktes, persönliches, nicht ausschließliches, nicht übertragbares und widerrufliches Recht ein, den Dienst und seine Inhalte zu Ihren eigenen Lernzwecken zu nutzen. Patternly und seine Originalinhalte bleiben durch Rechte des geistigen Eigentums geschützt.

Für eine über Apple bezogene App gilt für die App-Lizenz zusätzlich die Apple Standard Licensed Application End User License Agreement, sofern in App Store Connect keine eigene EULA bereitgestellt wird. Diese Bedingungen regeln den Patternly-Dienst und ersetzen keine zwingenden Apple-Bedingungen.

6. Zulässige Nutzung

Missbrauchen Sie den Dienst nicht, beeinträchtigen Sie weder seine Sicherheit noch seinen Betrieb, greifen Sie nicht auf das Konto einer anderen Person zu, automatisieren Sie den Zugang nicht außerhalb unterstützter Funktionen, umgehen Sie keine Zugangskontrollen, entnehmen oder verbreiten Sie keine wesentlichen Teile der Inhalte und nutzen Sie Patternly nicht unter Verstoß gegen Gesetze oder Rechte Dritter.

Sie dürfen im gesetzlich zulässigen Umfang begrenzte Auszüge zitieren; ohne schriftliche Genehmigung dürfen Sie jedoch weder die Fragensammlung erneut veröffentlichen noch den Zugang zu Patternly-Inhalten verkaufen.


7. Premium und Abonnements

Neue Premium-Käufe sind derzeit deaktiviert; es gibt daher kein aktuelles kostenpflichtiges Angebot. Falls Käufe später aktiviert werden, ist das beabsichtigte Angebot {{terms.premiumProductName}} (Produktkennung {{terms.premiumProductIdentifier}}), ein monatlicher, automatisch verlängernder digitaler Dienst ohne Probezeitraum. Der geplante Preis einschließlich anwendbarer Steuern in Polen beträgt {{terms.premiumPriceIncludingTaxes}}; der geplante Verlängerungspreis beträgt je {{terms.premiumBillingPeriod}} {{terms.premiumRenewalPriceIncludingTaxes}}. Dies sind beabsichtigte Preise für Polen, kein aktuelles Angebot; Preise für andere Länder sind nicht bestätigt. Vor Aktivierung eines Kaufs müssen der zuständige Verkäufer, der aktuelle Preis, Verlängerungszeitraum, Premium-Umfang, Zahlungsmethode und -zeitpunkt, Leistungsbeginn und Zahlungspflicht für das jeweilige Angebot angegeben werden. {{terms.premiumServiceScope}}

Die aktuelle Merchant-of-Record-Regelung lautet: {{terms.merchantOfRecord}}. Für ein künftiges store-spezifisches Angebot sind weder Verkäufer noch Zahlungsregelung bestätigt. Falls ein Abonnement später verfügbar gemacht und über Google Play erworben wird, stellt Google den Zahlungs- und Abonnementverwaltungskanal dieses Stores bereit; dadurch entfallen weder die Verantwortung des Betreibers für die Vertragsmäßigkeit von Patternly noch Ihre gesetzlichen Ansprüche gegen den verantwortlichen Händler.

Ein Abonnement verlängert sich nur zu den vor dem Kauf klar angezeigten Bedingungen. Falls Sie später eines über Google Play erwerben, können Sie künftige Verlängerungen in den Einstellungen Ihrer Google-Play-Abonnements stoppen; die Löschung der App oder Ihres Patternly-Kontos kündigt dieses Google-Play-Abonnement nicht. Einer erheblichen Preiserhöhung stimmen Sie niemals allein dadurch zu, dass Sie Patternly weiter nutzen; sie erfordert den gesetzlich vorgesehenen Mechanismus der ausdrücklichen Zustimmung, des erneuten Kaufs oder der Verlängerung.

Falls Sie später ein Abonnement über Google Play erwerben, kann Google Transaktionserstattungen über seine Plattform bearbeiten. Beschwerden über den Patternly-Dienst, seine Vertragsmäßigkeit oder gesetzliche Verbraucherrechte können Sie weiterhin an den Betreiber richten.

Der Premium-Zugang beginnt unmittelbar nach dem Kauf nur dann, wenn Sie vor Ablauf der 14-tägigen Widerrufsfrist gesondert und ausdrücklich verlangen, dass der Dienst beginnt. Kein Kästchen darf vorausgewählt sein. Ein Widerruf nach Leistungsbeginn kann, soweit zwingendes Recht dies erlaubt, eine anteilige Zahlung für die bis zum Widerruf erbrachte Leistung erfordern. Premium wird nicht als gesonderte einmalige Lieferung digitaler Inhalte angeboten; deshalb verlangt Patternly auf dieser Grundlage keine Bestätigung, dass Sie Ihr Widerrufsrecht verlieren. Im Übrigen bleiben die gesetzlichen Widerrufsrechte bestehen. Für das Einreichen einer Beschwerde gilt keine Frist von 14 Tagen.


8. Verfügbarkeit und Änderungen

Der Betreiber bemüht sich, Patternly verfügbar zu halten, garantiert jedoch keinen ununterbrochenen oder fehlerfreien Zugang. Wartungsarbeiten, Sicherheitsvorfälle, Ausfälle von Anbietern, Gerätebeschränkungen oder gesetzliche Anforderungen können Funktionen unterbrechen. Offline verfügbare und synchronisierte Daten sind möglicherweise nicht immer im gleichen Umfang verfügbar.

Wird eine kostenpflichtige Funktion wesentlich eingestellt, gewährt der Betreiber alle nach dem anwendbaren Verbraucherrecht und den Regeln der Kaufplattform erforderlichen Abhilfen.

9. Meldungen und Kommunikation

Wenn Sie eine Inhaltsmeldung oder Supportnachricht einreichen, bestätigen Sie, dass sie rechtmäßig ist und wissentlich kein Material enthält, zu dessen Weitergabe Sie nicht berechtigt sind. Sie behalten Ihre Rechte an der Nachricht und gestatten dem Betreiber ihre Nutzung nur, soweit dies zur Prüfung der Meldung, zu Ihrer Unterstützung, zum Schutz des Dienstes und zur Erfüllung gesetzlicher Pflichten erforderlich ist. Die Datenschutzerklärung erläutert die damit verbundene Datenverarbeitung.

10. Sperrung und Beendigung

Sie können die Nutzung von Patternly jederzeit beenden und Ihr Konto löschen. Falls später ein Plattformabonnement verfügbar wird, müssen Sie es möglicherweise gesondert über diese Plattform kündigen. Der Betreiber darf den Zugang nur wegen eines wesentlichen Verstoßes, einer bestätigten Sicherheitsbedrohung, einer rechtswidrigen Nutzung, einer Nichtzahlung oder einer verbindlichen gesetzlichen Anforderung verhältnismäßig beschränken.

Außer wenn sofortiges Handeln zur Schadensverhütung oder zur Einhaltung des Gesetzes erforderlich ist, erläutert der Betreiber den Grund, kündigt die Maßnahme mit angemessener Frist an und gibt Ihnen Gelegenheit, den Verstoß zu beheben. Sie können über {{terms.complaintEmail}} Einspruch einlegen. Der Zugang wird wiederhergestellt, sobald der Grund entfällt. Eine Sperrung beseitigt weder gesetzliche Rechte auf Vertragsmäßigkeit, Erstattung, Datenrückgabe, Beschwerde oder Kündigung. Falls Sie später ein Abonnement über Google Play erwerben, beendet eine Sperrung dessen künftige Verlängerungen nicht selbst.

11. Verantwortung und gesetzliche Rechte

Patternly bietet Lernunterstützung, aber keine berufliche, beschäftigungsbezogene, prüfungsbezogene, rechtliche, finanzielle oder sonstige regulierte Beratung. Sie bleiben für Entscheidungen auf Grundlage des Dienstes und für die Prüfung von Anforderungen bei der jeweils zuständigen offiziellen Stelle verantwortlich.

Der Betreiber schließt eine nach zwingendem Recht bestehende Haftung grundsätzlich nicht aus und begrenzt sie nicht. Nichts in diesen Bedingungen beschränkt Rechte hinsichtlich der Vertragsmäßigkeit digitaler Dienste, erforderlicher Aktualisierungen, Preisminderung, Widerruf, Beendigung, Erstattung, Beschwerdebearbeitung, Personenschäden, Vorsatz, grober Fahrlässigkeit oder sonstiger Haftung, die gesetzlich nicht beschränkt werden darf.

12. Dienste Dritter

Patternly kann auf Google sowie Anbieter für Authentifizierung, Hosting, Benachrichtigungen und Abrechnung zurückgreifen. Für Ihre Beziehung zu diesen Anbietern können deren eigene Bedingungen gelten. Hinweise auf Zertifizierungsanbieter und Technologieinhaber bezeichnen Lernthemen und bedeuten keine Förderung oder Empfehlung.

13. Anwendbares Recht und Streitigkeiten

Für diese Bedingungen gilt {{terms.governingLaw}}. Die Zuständigkeit bestimmt sich nach {{terms.competentCourts}}, ohne Ihnen zwingenden Verbraucherschutz oder das Recht zu nehmen, eine Klage bei einem nach dem anwendbaren Recht an Ihrem Wohnort verfügbaren Gericht einzureichen.

Vor Erhebung einer förmlichen Klage können Sie den Betreiber kontaktieren, damit die Angelegenheit geprüft werden kann. Dadurch werden gesetzliche Beschwerde-, Aufsichts-, alternative Streitbeilegungs- oder Gerichtsrechte nicht eingeschränkt.

14. Änderungen des Dienstes, des Preises und der Bedingungen

Der Betreiber darf den digitalen Dienst ohne Mehrkosten nur aus einem hier genannten berechtigten Grund ändern: Einhaltung des Rechts, Sicherheit, Interoperabilität, Fehlerbehebung oder Verbesserung von Funktionen ohne Verringerung des vertraglich vereinbarten Umfangs des kostenpflichtigen Dienstes. Eine nachteilige Änderung wird mindestens 30 Tage im Voraus auf einem dauerhaften Datenträger erläutert, es sei denn, das Gesetz oder eine dringende Sicherheitsbedrohung verlangt zwingend eine sofortige Änderung.

Soweit zwingendes Recht gilt, können Sie binnen 30 Tagen nach Erhalt der Mitteilung oder nach der Änderung kündigen, je nachdem, welcher Zeitpunkt später liegt, es sei denn, der Betreiber stellt die unveränderte vertragsgemäße Version ohne Mehrkosten weiter bereit. Wesentliche Preisänderungen erfordern den anwendbaren Mechanismus der ausdrücklichen Zustimmung, des erneuten Kaufs oder der Verlängerung; die weitere Nutzung stellt keine stillschweigende Zustimmung dar.

Eine neue Version dieser Bedingungen hält ihr Wirksamkeitsdatum und die Änderungen fest. Eine erneute Zustimmung wird eingeholt, wenn dies gesetzlich erforderlich ist. Eine unveränderliche Kopie der von Ihnen angenommenen Version bleibt auf einem dauerhaften Datenträger verfügbar.

15. Vertragsschluss und dauerhafter Nachweis

Vor der Kontoeröffnung oder dem Kauf muss Patternly diese Bedingungen und alle erforderlichen vorvertraglichen Informationen kostenlos in einer speicherbaren Form bereitstellen. Der Vertrag kommt erst durch eine eindeutige Handlung zustande, mit der die bezeichnete Version angenommen wird. Eine Schaltfläche für eine kostenpflichtige Bestellung muss darauf hinweisen, dass die Bestellung eine Zahlungspflicht begründet.

Der Betreiber muss eine Bestätigung auf einem dauerhaften Datenträger bereitstellen und einen prüfbaren Nachweis der für die Transaktion geltenden Version der Bedingungen, des Angebots, des Preises, der Verlängerungsbedingungen, des Zeitstempels, der Sprache und der Einwilligungen aufbewahren.

16. Technische Anforderungen

Technische Anforderungen und Kompatibilität: {{terms.technicalRequirements}}. Internetzugang ist für Kontoauthentifizierung, Synchronisierung und Kommunikation mit dem Betreiber erforderlich. Wenn Store-Käufe aktiviert werden, ist Internetzugang auch für deren Kauf oder Wiederherstellung erforderlich. Unterstützte Offline-Funktionen können auf bereits auf dem Gerät verfügbare Daten beschränkt sein.

Zusagen zu Support und Aktualisierungen: {{terms.supportCommitment}}. Erforderliche Sicherheits- und Konformitätsaktualisierungen werden für den vertraglich und nach zwingendem Recht vorgeschriebenen Zeitraum bereitgestellt.

17. Widerruf durch Verbraucher

Wenn Sie ein berechtigter Verbraucher sind, können Sie einen Fernabsatzvertrag grundsätzlich binnen 14 Tagen ohne Angabe von Gründen widerrufen. Senden Sie vor Ablauf der Frist eine eindeutige Erklärung an {{terms.withdrawalEmail}} oder die Postanschrift des Betreibers. Sie können erklären: „Hiermit widerrufe ich den Vertrag über [Dienst], bestellt am [Datum], Name, Anschrift, Datum und Unterschrift bei Übermittlung auf Papier.“ Dieses Muster ist freiwillig.

18. Vertragsmäßigkeit des digitalen Dienstes

Patternly muss seiner Beschreibung, dem vereinbarten Umfang des kostenpflichtigen Dienstes, der Funktionalität, Kompatibilität, Barrierefreiheit, Kontinuität, Sicherheit und den Aktualisierungen entsprechen, die Sie nach Vertrag und zwingendem Recht vernünftigerweise erwarten dürfen. Melden Sie eine Abweichung an {{terms.complaintEmail}}. Sie können verlangen, dass die Vertragsmäßigkeit innerhalb angemessener Frist und ohne erhebliche Unannehmlichkeiten hergestellt wird.

Wenn die gesetzlichen Voraussetzungen erfüllt sind, können Sie vom verantwortlichen Händler eine verhältnismäßige Preisminderung verlangen oder den Vertrag beenden und die entsprechende Erstattung erhalten. Falls Sie über Google Play gekauft haben, ersetzen dessen Transaktionswerkzeuge diese Rechtsbehelfe nicht.

19. Beschwerden

Richten Sie eine Beschwerde an {{terms.complaintEmail}} oder die Postanschrift des Betreibers. Geben Sie möglichst das Konto oder die Transaktion an, beschreiben Sie das Problem und die gewünschte Abhilfe und senden Sie keine Passwörter. Der Betreiber bestätigt den Eingang auf einem dauerhaften Datenträger und antwortet binnen 14 Tagen nach Eingang, sofern keine kürzere zwingende Frist gilt. Die Antwortfrist von 14 Tagen ist keine Frist zur Einreichung einer Beschwerde.

20. Daten nach Vertragsende

Soweit Ihnen das anwendbare Recht einen Anspruch auf Abruf nicht personenbezogener Inhalte gibt, die Sie bereitgestellt oder erstellt haben, können Sie diese über {{terms.complaintEmail}} anfordern. Der Betreiber stellt die entsprechenden Inhalte vorbehaltlich gesetzlicher Ausnahmen kostenlos, ohne Behinderung, innerhalb angemessener Zeit und in einem allgemein verwendeten maschinenlesbaren Format bereit.

21. Außergerichtliche Streitbeilegung

Die Position des Betreibers zur Teilnahme an einer Verbraucher-ADR lautet: {{terms.adrPosition}}. Zuständige Stelle oder Informationspunkt: {{terms.adrEntity}}. Dieser Abschnitt verweist weder auf die eingestellte EU-ODR-Plattform noch schränkt er Ihr Recht ein, eine Verbraucherbehörde oder ein Gericht zu kontaktieren.

22. Betreiber und Kontakt

Betreiber: {{terms.operatorLegalName}}, {{terms.operatorBusinessForm}}. Anschrift: {{terms.operatorRegisteredAddress}}. E-Mail: {{terms.operatorEmail}}. Telefon: {{terms.operatorPhone}}.

Patternly wird angeboten in: {{terms.distributionTerritories}}. Registernummer: {{terms.operatorRegistrationNumber}}. Steuerkennung: {{terms.operatorTaxIdentifier}}.`,
});
