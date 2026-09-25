/** Full Italian translation draft. Test-only: this text is not approved for release. */
export const italianLegalTranslationDraftTestOnly = {
  privacyPolicy: String.raw`Informativa sulla privacy di Patternly

In vigore dal {{privacy.effectiveDate}}. Versione {{documentVersion}}. La presente Informativa spiega come {{privacy.controllerLegalName}}, {{privacy.controllerBusinessForm}}, con sede in {{privacy.controllerAddress}} (il «Titolare»), tratta i dati personali in Patternly.

1. Titolare e contatti

Titolare: {{privacy.controllerLegalName}}, {{privacy.controllerBusinessForm}}, {{privacy.controllerAddress}}. Contatto privacy: {{privacy.privacyEmail}}; telefono: {{privacy.controllerPhone}}. Responsabile della protezione dei dati o referente designato per la privacy: {{privacy.dpoContact}}.

2. Ambito e requisito di età

La presente Informativa riguarda l’app mobile, l’account e i servizi di sincronizzazione, le pagine legali pubbliche e i canali di assistenza o segnalazione dei contenuti. L’apprendimento come ospite senza account può essere disponibile anche per gli utenti più giovani. La creazione autonoma di un account e la sincronizzazione cloud sono riservate a chi ha almeno 18 anni; Patternly non offre una procedura per ottenere il consenso di un genitore o tutore.

3. Dati conservati sul dispositivo

L’uso come ospite o con un account può comportare la conservazione sul dispositivo di un identificativo dell’installazione e del set di dati locale, del percorso scelto, degli obiettivi, delle impostazioni, delle sessioni di apprendimento, delle risposte, dei risultati, della coda di ripasso, dello stato di recupero, del calendario delle notifiche e della coda di invio delle segnalazioni di contenuto. I promemoria locali sono programmati sul dispositivo; al momento Patternly non registra un token per le notifiche push del server.

I dati locali di apprendimento sono protetti dai controlli di archiviazione del dispositivo utilizzati da Patternly. Un codice di recupero copiato su tua richiesta viene cancellato quando il sistema operativo lo consente e solo se gli appunti contengono ancora quel codice. I dati che restano soltanto sul dispositivo non vengono inviati al Titolare, a meno che tu non crei un account e sincronizzi un record ammesso, invii una segnalazione o utilizzi un’altra funzione di rete.

4. Dati dell’account e di autenticazione

Per gli account Patternly tratta gli identificativi utente di Firebase e Patternly, l’indirizzo e-mail, lo stato di verifica, il provider di autenticazione e le date e ore degli eventi di sicurezza per creare e proteggere l’account, autenticare le richieste, sincronizzare i dati supportati, recuperare l’accesso e prevenire gli abusi. Le basi giuridiche sono l’esecuzione del contratto di servizio e il legittimo interesse del Titolare alla sicurezza del servizio; gli obblighi di legge si applicano quando i dati devono essere conservati.

Apple, Google e Firebase possono trattare dati di autenticazione e attestazione del dispositivo secondo i propri termini. Ai sensi dell’articolo 14 GDPR, sono anche fonti dalle quali Patternly può ricevere identificativi dell’identità e del provider, un indirizzo e-mail e il nome quando restituiti, nonché segnali di attestazione del dispositivo o di sicurezza. Durante l’accesso con Apple, Patternly richiede gli ambiti relativi a e-mail e nome e limita l’uso ai campi restituiti per l’autenticazione e la gestione dell’account.

5. Dati di apprendimento e sincronizzazione

Quando la sincronizzazione è attiva, Patternly invia al backend il percorso selezionato e i record di apprendimento completati, quali riepiloghi delle sessioni, risultati, risposte, stato dei ripassi, versioni, date e ore e identificativi del dispositivo o del set di dati. Le bozze attive, i timer, le preferenze e le impostazioni delle notifiche non fanno parte dell’attuale elenco dei dati sincronizzati. Finalità e base giuridica consistono nel fornire il servizio di sincronizzazione dell’account e mantenerne l’integrità.

I progressi di apprendimento sono conservati finché l’account esiste e vengono rimossi tramite la procedura di eliminazione dell’account, fatti salvi i limitati elementi probatori di eliminazione descritti di seguito. I metadati delle operazioni di sincronizzazione completate sono conservati per {{privacy.completedSyncOperationRetentionDays}} giorni dal completamento.

6. Segnalazioni di contenuto e comunicazioni

Una segnalazione di contenuto può includere una categoria, una descrizione libera facoltativa, un identificativo casuale della segnalazione, identificativi del contenuto e del pacchetto, percorso, lingua, versione dell’app, piattaforma, data e ora e un token App Check o di attestazione del dispositivo. Il modulo mobile attuale non allega intenzionalmente un account o un’e-mail di contatto, sebbene lo schema backend supporti tali campi per i canali approvati. Il server riceve l’indirizzo IP della connessione e lo trasforma in un identificativo unidirezionale per i limiti di frequenza, utilizzato solo per limitare le segnalazioni ripetute. Non inserire password o dati sensibili non necessari.

Le segnalazioni sono trattate per correggere i contenuti, rispondere quando è stato richiesto un contatto, proteggere il servizio e far valere diritti. La base giuridica per queste finalità è il legittimo interesse del Titolare ai sensi dell’articolo 6, paragrafo 1, lettera f), GDPR a mantenere accurati i contenuti, rispondere a un contatto richiesto, proteggere il canale di segnalazione e difendere diritti; puoi opporti ai sensi dell’articolo 21 GDPR. Le segnalazioni non collegate a un account o a un contatto sono conservate per {{privacy.anonymousReportRetentionDays}} giorni; quelle collegate a un account o a un contatto per {{privacy.linkedReportRetentionDays}} giorni. L’identificativo unidirezionale dell’IP per i limiti di frequenza è conservato solo per la finestra attiva di {{privacy.reportRateLimitIdentifierRetentionSeconds}} secondi. Una segnalazione accettata localmente viene rimossa dopo la conferma di ricezione del server. Una segnalazione non confermata nella coda locale viene eliminata automaticamente dopo {{privacy.localReportOutboxRetentionDays}} giorni.

7. Sicurezza e dati tecnici

Patternly utilizza token di autenticazione, segnali App Check o di attestazione del dispositivo, metadati delle richieste, identificativi per i limiti di frequenza derivati tramite hashing di dati di rete o e-mail, log operativi e registrazioni di eventi di sicurezza per proteggere gli account, indagare sui malfunzionamenti e prevenire gli abusi. Patternly non utilizza SDK pubblicitari o di tracciamento tra app, un SDK esterno generico di analisi del prodotto né un SDK esterno di segnalazione degli arresti anomali. RevenueCat tratta la cronologia degli acquisti per le funzioni di abbonamento e per le analisi degli acquisti descritte di seguito.

I log operativi sono conservati per {{privacy.operationalLogRetentionDays}} giorni e i log di sicurezza per {{privacy.securityLogRetentionDays}} giorni. Patternly oscura credenziali e payload nei log di produzione. I codici di recupero copiati su tua richiesta possono rimanere negli appunti di sistema; Patternly tenta di cancellarli dopo {{privacy.clipboardRecoveryCodeRetentionMinutes}} minuti, se il sistema operativo lo consente, e non rimuove contenuti copiati successivamente da te.

8. Responsabili del trattamento, destinatari e trasferimenti

Responsabili del trattamento cloud attivi e verificati e relative finalità: {{privacy.activeCloudProcessors}}. Titolari autonomi attivi e destinatari: {{privacy.activeIndependentRecipients}}. Provider per l’invio delle e-mail: {{privacy.emailDeliveryProvider}}. Regioni dei provider: {{privacy.hostingRegions}}. Garanzie per i trasferimenti al di fuori del SEE: {{privacy.internationalTransferSafeguards}}.

Stato di RevenueCat: {{privacy.revenueCatStatus}}. Apple può conservare autonomamente i dati delle transazioni e degli abbonamenti App Store. L’eliminazione di un account Patternly non annulla un abbonamento App Store né rimuove i dati controllati autonomamente da Apple. Patternly riesamina i propri responsabili, destinatari e accordi sui trasferimenti ogni volta che cambiano i provider o i luoghi in cui avviene il trattamento.

9. Conservazione ed eliminazione dell’account

I dati dell’account e dell’apprendimento sincronizzato sono conservati mentre l’account è attivo, salvo un termine più breve o una richiesta valida precedente. L’eliminazione dell’account rimuove il relativo sottoalbero di dati, le associazioni di identità e l’account di autenticazione e rende non identificabili le segnalazioni di contenuto collegate. Non annulla di per sé un abbonamento acquistato tramite uno store.

Dopo l’eliminazione, Patternly conserva un pseudonimo HMAC con chiave al solo scopo di prevenire la ricreazione accidentale dell’account per {{privacy.deletionTombstoneRetentionDays}} giorni. Si tratta ancora di un dato personale, non anonimo, ma non rimane alcun UID grezzo del provider. La base giuridica è il legittimo interesse del Titolare ai sensi dell’articolo 6, paragrafo 1, lettera f), GDPR; puoi opporti a questo trattamento ai sensi dell’articolo 21 GDPR contattando {{privacy.privacyEmail}}. Una prova minima e non ricollegabile del completamento dell’eliminazione può essere conservata fino a {{privacy.deletionEvidenceRetentionYears}} anni ai sensi dell’articolo 6, paragrafo 1, lettera c), GDPR, insieme al quadro degli obblighi di responsabilizzazione e dei diritti previsto dagli articoli 5, paragrafo 2, 12, paragrafo 2, 17 e 24 GDPR. Dopo l’eliminazione Patternly non conserva un registro antifrode generale: la conservazione antifrode relativa a un evento specifico richiede una propria valutazione documentata della minaccia, della necessità e del legittimo interesse. Informazioni sulla cancellazione di backup e copie di ripristino temporale: {{privacy.backupPurgeDisclosure}}.

10. I tuoi diritti

Nei limiti della legge applicabile, puoi chiedere l’accesso e le informazioni richieste dall’articolo 15 GDPR, la rettifica, la cancellazione, la limitazione o la portabilità dei dati, oppure opporti al trattamento basato sul legittimo interesse. Puoi revocare il consenso senza pregiudicare la liceità del trattamento precedente. Contatta {{privacy.privacyEmail}}. Le richieste sono normalmente gratuite. Patternly può verificare la tua identità e deve rispondere entro un mese; ove consentito dalla legge, il termine può essere prorogato di ulteriori due mesi, dopo averti informato entro il primo mese e spiegato il motivo. Ogni rifiuto deve essere motivato e illustrare le possibilità di reclamo e di ricorso giudiziario.

Patternly gestisce le richieste in materia di privacy attraverso ricezione, verifica dell’identità ove necessaria, valutazione, adempimento o rifiuto motivato e chiusura. Ciò vale anche quando Patternly non può identificare un ospite senza ulteriori informazioni. Puoi presentare reclamo a {{privacy.supervisoryAuthority}} o a un’altra autorità competente e chiedere tutela giudiziaria. Patternly non adotta decisioni basate unicamente sul trattamento automatizzato che producano effetti giuridici o analogamente significativi.

11. Modifiche e prova della versione

Ogni Informativa pubblicata ha una data di entrata in vigore e una versione immutabile. Le modifiche sostanziali sono comunicate come richiesto dalla legge. Quando il consenso è la base giuridica, viene richiesto un nuovo consenso ove necessario. Patternly conserva una registrazione verificabile della lingua, della versione, dell’ora e dell’ambito accettati o riconosciuti dall’utente dell’account.

12. Dati del Titolare

Numero di registrazione: {{privacy.registrationNumber}}. Identificativo fiscale: {{privacy.taxIdentifier}}. Territori: {{privacy.distributionTerritories}}.

13. Finalità del trattamento e basi giuridiche

{{privacy.processingRegisterDisclosure}}

14. Termini dettagliati di conservazione

{{privacy.retentionRegisterDisclosure}}`,
  termsOfService: String.raw`Condizioni di servizio di Patternly

In vigore dal {{terms.effectiveDate}}. Versione {{documentVersion}}. Le presenti Condizioni costituiscono un accordo tra te e {{terms.operatorLegalName}}, {{terms.operatorBusinessForm}}, con sede in {{terms.operatorRegisteredAddress}} (il «Gestore») per l’utilizzo di Patternly.

1. Accettazione delle Condizioni

Creando un account o utilizzando in altro modo i servizi Patternly basati su account, accetti le presenti Condizioni e dichiari di aver preso visione della distinta Informativa sulla privacy. Se non le accetti, non creare un account. L’uso come ospite che non richiede accettazione resta soggetto alla legge applicabile e alle regole necessarie per il funzionamento sicuro dell’app.

2. Requisiti di idoneità

Per creare autonomamente un account, Patternly richiede un’età minima di {{terms.minimumUserAge}} anni. È una regola del prodotto e non afferma che ogni persona al di sotto di tale età abbia legalmente divieto di imparare. L’apprendimento come ospite senza account può restare disponibile per gli utenti più giovani. Patternly non offre una procedura per il consenso di un genitore o tutore; pertanto gli utenti al di sotto di tale età non possono creare un account. Ambito della regola: {{terms.minimumUserAgeScope}}. Devi fornire informazioni accurate per l’account e proteggere le credenziali di accesso.

3. Il servizio

Patternly è uno strumento indipendente per esercitarsi su colloqui tecnici e argomenti relativi alle certificazioni. Non è un ente ufficiale di certificazione, un’autorità d’esame, un recruiter o una scuola e non garantisce occupazione, risultati d’esame o competenze professionali.

Le funzioni e i contenuti possono cambiare con il miglioramento del servizio. Le modifiche sostanziali che incidono su un servizio a pagamento attivo o sui tuoi diritti legali saranno comunicate secondo quanto richiesto dalla legge applicabile.

4. Uso come ospite e account

Alcune funzioni possono essere utilizzate come ospite e conservare dati sul dispositivo. Un account può consentire il recupero e la sincronizzazione dei dati supportati. Sei responsabile delle attività svolte tramite il tuo account, salvo che segnali tempestivamente un accesso non autorizzato.

Il contratto per il servizio dell’account è concluso a tempo indeterminato e continua finché tu o il Gestore non lo terminate secondo le presenti Condizioni. L’eliminazione dell’account Patternly termina il servizio dell’account, ma non annulla di per sé un abbonamento App Store distinto.

Puoi eliminare l’account tramite la procedura disponibile nell’app. L’Informativa sulla privacy spiega quali dati sono interessati, le regole di conservazione e i limiti dell’eliminazione.

5. Licenza dell’app e dei contenuti

Il Gestore ti concede un diritto limitato, personale, non esclusivo, non trasferibile e revocabile di utilizzare il servizio e i relativi contenuti per il tuo apprendimento, nel rispetto delle presenti Condizioni e della legge applicabile. Patternly e i suoi contenuti originali restano protetti dalla normativa sulla proprietà intellettuale.

Per un’app ottenuta tramite Apple si applica separatamente alla licenza dell’app il Contratto di licenza con l’utente finale Apple Standard Licensed Application, salvo che in App Store Connect sia fornito un EULA personalizzato. Le presenti Condizioni disciplinano il servizio Patternly e non sostituiscono i termini obbligatori di Apple.

6. Uso consentito

Non abusare del servizio, interferire con la sua sicurezza o il suo funzionamento, accedere all’account di un’altra persona, automatizzare l’accesso al di fuori delle funzioni supportate, eludere i controlli di accesso, estrarre o ridistribuire parti sostanziali dei contenuti, né utilizzare Patternly in violazione della legge o dei diritti di terzi.

Puoi citare parti limitate nei casi consentiti dalla legge, ma non puoi ripubblicare la banca delle domande né vendere l’accesso ai contenuti di Patternly senza autorizzazione scritta.

7. Premium e abbonamenti

Patternly Premium è un servizio digitale mensile con rinnovo automatico, venduto tramite l’App Store di Apple in Polonia e negli altri Paesi dell’Unione europea in cui l’offerta è disponibile. L’offerta è {{terms.premiumProductName}} (identificativo prodotto {{terms.premiumProductIdentifier}}). Include: {{terms.premiumServiceScope}}. Il periodo di fatturazione è {{terms.premiumBillingPeriod}}. Non è previsto un periodo di prova. Il prezzo iniziale totale, incluse le imposte applicabili, è {{terms.premiumPriceIncludingTaxes}}; il prezzo di rinnovo, incluse le imposte applicabili, è {{terms.premiumRenewalPriceIncludingTaxes}} per ciascun {{terms.premiumBillingPeriod}}. Prima dell’ordine, la schermata di acquisto mostra i prezzi correnti, il periodo di rinnovo, l’ambito Premium, il metodo e i tempi di pagamento, l’avvio del servizio e l’obbligo di pagamento.

Il soggetto che opera come venditore contrattuale è: {{terms.merchantOfRecord}}. Apple fornisce il canale di pagamento e gestione dell’abbonamento, ma ciò non elimina la responsabilità del Gestore per la conformità di Patternly o i tuoi diritti di legge nei confronti del professionista responsabile.

L’abbonamento si rinnova automaticamente solo alle condizioni chiaramente mostrate prima dell’acquisto. Puoi interrompere i rinnovi futuri dalle impostazioni del tuo account Apple. Eliminare l’app o l’account Patternly non annulla un abbonamento App Store. Un aumento sostanziale del prezzo non è mai accettato per il solo fatto di continuare a utilizzare Patternly; richiede la procedura applicabile di consenso esplicito, nuovo acquisto o rinnovo.

Apple può gestire i rimborsi delle transazioni tramite la propria piattaforma. Puoi comunque inviare al Gestore reclami sul servizio Patternly, sulla sua conformità o sui rimedi legali per i consumatori.

L’accesso Premium inizia immediatamente dopo l’acquisto solo a seguito di una tua richiesta separata ed esplicita di avviare il servizio prima della scadenza del periodo di recesso di 14 giorni. Nessuna casella può essere preselezionata. Se recedi dopo l’avvio del servizio, ove la legge inderogabile lo consenta potrebbe essere dovuto un importo proporzionale al servizio fornito fino al recesso. Premium non è offerto come fornitura una tantum di contenuti digitali e quindi Patternly non ti chiede di riconoscere la perdita del diritto di recesso su tale base. Restano altrimenti salvi i diritti di recesso previsti dalla legge. La presentazione di un reclamo non è soggetta al termine di 14 giorni.

8. Disponibilità e modifiche

Il Gestore mira a mantenere Patternly disponibile, ma non garantisce un accesso ininterrotto o privo di errori. Manutenzione, incidenti di sicurezza, interruzioni dei provider, limiti dei dispositivi o obblighi di legge possono interrompere alcune funzioni. I dati disponibili offline e quelli sincronizzati potrebbero non essere sempre ugualmente accessibili.

Se una funzione a pagamento viene interrotta in modo sostanziale, il Gestore fornirà i rimedi richiesti dalla legge applicabile a tutela dei consumatori e dalle regole della piattaforma di acquisto.

9. Segnalazioni e comunicazioni

Se invii una segnalazione di contenuto o un messaggio di assistenza, confermi che è lecito e che non vi includi consapevolmente materiale che non hai diritto di condividere. Conservi i diritti sul tuo messaggio e autorizzi il Gestore a utilizzarlo solo nella misura necessaria per esaminare la segnalazione, assisterti, proteggere il servizio e adempiere agli obblighi di legge. L’Informativa sulla privacy descrive il trattamento dei dati associato.

10. Sospensione e cessazione

Puoi smettere di usare Patternly ed eliminare l’account in qualsiasi momento, fermo restando l’obbligo di annullare separatamente ogni abbonamento della piattaforma. Il Gestore può limitare proporzionalmente l’accesso solo in caso di violazione sostanziale, minaccia di sicurezza verificata, uso illecito, mancato pagamento o obbligo giuridico vincolante.

Salvo che sia necessario intervenire immediatamente per prevenire un danno o rispettare la legge, il Gestore spiegherà il motivo, darà un ragionevole preavviso e la possibilità di rimediare alla violazione. Puoi presentare ricorso a {{terms.complaintEmail}}. L’accesso sarà ripristinato quando viene meno la causa. La sospensione non elimina i diritti legali alla conformità, al rimborso, alla restituzione dei dati, al reclamo o alla cancellazione e non annulla di per sé i futuri rinnovi Apple.

11. Responsabilità e diritti inderogabili

Patternly fornisce supporto all’apprendimento, non consulenza professionale, lavorativa, d’esame, legale, finanziaria o di altro ambito regolamentato. Resti responsabile delle decisioni prese usando il servizio e della verifica dei requisiti presso la competente autorità ufficiale.

Il Gestore non esclude né limita in via generale la responsabilità prevista dalle norme inderogabili. Nulla nelle presenti Condizioni limita i diritti relativi alla conformità dei servizi digitali, agli aggiornamenti dovuti, alla riduzione del prezzo, al recesso, alla risoluzione, al rimborso, alla gestione dei reclami, ai danni alla persona, al dolo, alla colpa grave o a qualsiasi altra responsabilità che non possa essere limitata per legge.

12. Servizi di terzi

Patternly può utilizzare Apple e provider di autenticazione, hosting, notifiche e fatturazione. I loro termini possono disciplinare il tuo rapporto con loro. I riferimenti a enti di certificazione e titolari di tecnologia identificano argomenti di apprendimento e non implicano sponsorizzazione o approvazione.

13. Legge applicabile e controversie

Le presenti Condizioni sono regolate da {{terms.governingLaw}}. Sono competenti i tribunali indicati come {{terms.competentCourts}}, senza privarti delle tutele inderogabili per i consumatori o del diritto di adire un tribunale accessibile secondo la legge applicabile nel tuo luogo di residenza.

Prima di avviare un’azione formale puoi contattare il Gestore affinché esamini la questione. Ciò non limita i diritti previsti dalla legge in materia di reclamo, autorità di regolamentazione, risoluzione alternativa delle controversie o ricorso giudiziario.

14. Modifiche al servizio, ai prezzi e alle Condizioni

Il Gestore può modificare il servizio digitale senza costi aggiuntivi solo per un motivo valido qui indicato: conformità alla legge, sicurezza, interoperabilità, correzione di difetti o miglioramento delle funzioni senza ridurre l’ambito del servizio a pagamento concordato. Una modifica sfavorevole sarà spiegata su un supporto durevole con almeno 30 giorni di anticipo, salvo che la legge richieda un intervento immediato o sussista una minaccia urgente alla sicurezza.

Quando si applica la legge inderogabile, puoi recedere entro 30 giorni dalla ricezione dell’avviso o dall’entrata in vigore della modifica, se successiva, a meno che il Gestore mantenga disponibile senza costi aggiuntivi la versione invariata e conforme. Le modifiche sostanziali del prezzo richiedono la procedura applicabile di consenso esplicito, nuovo acquisto o rinnovo; il semplice proseguimento dell’uso non costituisce consenso tacito.

La nuova versione delle Condizioni riporta la data di entrata in vigore e le modifiche. Il consenso verrà nuovamente raccolto quando richiesto dalla legge. Una copia immutabile della versione da te accettata resterà disponibile su un supporto durevole.

15. Conclusione del contratto e prova durevole

Prima della creazione dell’account o dell’acquisto, Patternly deve rendere gratuitamente disponibili le presenti Condizioni e tutte le informazioni precontrattuali richieste in una forma che tu possa salvare. Il contratto si conclude solo dopo un’azione inequivocabile con cui accetti la versione identificata. Un pulsante per un ordine a pagamento deve indicare che l’invio dell’ordine comporta un obbligo di pagamento.

Il Gestore deve fornire una conferma su supporto durevole e conservare una registrazione verificabile della versione delle Condizioni, dell’offerta, del prezzo, delle condizioni di rinnovo, della data e ora, della lingua e dei consensi associati alla transazione.

16. Requisiti tecnici

Requisiti tecnici e di compatibilità: {{terms.technicalRequirements}}. L’accesso a Internet è necessario per autenticare l’account, sincronizzare, acquistare, ripristinare gli acquisti e comunicare con il Gestore. Le funzioni offline supportate possono limitarsi ai dati già disponibili sul dispositivo.

Impegno in materia di assistenza e aggiornamenti: {{terms.supportCommitment}}. Gli aggiornamenti necessari per la sicurezza e la conformità saranno forniti per il periodo richiesto dal contratto e dalle norme inderogabili.

17. Recesso del consumatore

Se sei un consumatore avente diritto, in generale puoi recedere senza motivo da un contratto a distanza entro 14 giorni. Prima della scadenza invia una dichiarazione inequivocabile a {{terms.withdrawalEmail}} o all’indirizzo postale del Gestore. Puoi scrivere: «Con la presente recedo dal contratto per [servizio], ordinato il [data], nome, indirizzo, data e firma se inviato su carta». Il modello è facoltativo.

18. Conformità del servizio digitale

Patternly deve essere conforme alla descrizione, all’ambito del servizio a pagamento concordato, alle funzionalità, alla compatibilità, all’accessibilità, alla continuità, alla sicurezza e agli aggiornamenti che puoi ragionevolmente attenderti in base al contratto e alla legge inderogabile. Se non lo è, avvisa {{terms.complaintEmail}}. Puoi richiedere il ripristino della conformità entro un termine ragionevole e senza notevoli inconvenienti.

Quando ricorrono le condizioni di legge, puoi chiedere una riduzione proporzionata del prezzo oppure risolvere il contratto e ottenere il rimborso applicabile. Questi rimedi sono esercitabili nei confronti del professionista responsabile e non sono sostituiti dagli strumenti di transazione di Apple.

19. Reclami

Invia un reclamo a {{terms.complaintEmail}} o all’indirizzo postale del Gestore. Se possibile, identifica l’account o la transazione, descrivi il problema e il rimedio richiesto ed evita di inviare password. Il Gestore confermerà la ricezione su supporto durevole e risponderà entro 14 giorni dalla ricezione, salvo un termine inderogabile più breve. Il termine di risposta di 14 giorni non è un termine per presentare il reclamo.

20. Dati dopo la cessazione

Se la legge applicabile ti riconosce il diritto di recuperare contenuti non personali da te forniti o creati, puoi richiederli tramite {{terms.complaintEmail}}. Il Gestore fornisce i contenuti pertinenti gratuitamente, senza ostacoli, entro un termine ragionevole e in un formato leggibile da una macchina di uso comune, fatte salve le eccezioni di legge.

21. Risoluzione extragiudiziale delle controversie

La posizione del Gestore sulla partecipazione alla risoluzione alternativa delle controversie dei consumatori è: {{terms.adrPosition}}. Ente o punto informativo pertinente: {{terms.adrEntity}}. Questa sezione non rinvia alla cessata piattaforma ODR dell’UE e non limita il diritto di contattare un’autorità per i consumatori o un tribunale.

22. Gestore e contatti

Gestore: {{terms.operatorLegalName}}, {{terms.operatorBusinessForm}}. Indirizzo: {{terms.operatorRegisteredAddress}}. E-mail: {{terms.operatorEmail}}. Telefono: {{terms.operatorPhone}}.

Patternly è offerto nei seguenti territori: {{terms.distributionTerritories}}. Numero di registrazione: {{terms.operatorRegistrationNumber}}. Identificativo fiscale: {{terms.operatorTaxIdentifier}}.`,
} as const;
