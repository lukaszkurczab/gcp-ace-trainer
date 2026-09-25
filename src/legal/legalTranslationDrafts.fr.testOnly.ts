/** Projet de traduction française intégrale, non approuvé. Réservé aux tests. */
export const legalTranslationDraftsFrTestOnly = Object.freeze({
  locale: "fr" as const,
  testOnly: true as const,
  approvalStatus: "UNAPPROVED" as const,
  privacyPolicy: String.raw`Politique de confidentialité de Patternly

En vigueur le {{privacy.effectiveDate}}. Version {{documentVersion}}. La présente Politique explique comment {{privacy.controllerLegalName}}, {{privacy.controllerBusinessForm}}, établi à {{privacy.controllerAddress}} (le « Responsable du traitement »), traite les données personnelles dans Patternly.

1. Responsable du traitement et contact

Responsable du traitement : {{privacy.controllerLegalName}}, {{privacy.controllerBusinessForm}}, {{privacy.controllerAddress}}. Contact relatif à la confidentialité : {{privacy.privacyEmail}} ; téléphone : {{privacy.controllerPhone}}. Délégué à la protection des données ou contact désigné : {{privacy.dpoContact}}.

2. Champ d’application et âge

La présente Politique couvre l’application mobile, le compte et les services de synchronisation, les pages juridiques publiques ainsi que les canaux d’assistance et de signalement de contenu. L’apprentissage sans compte en mode invité peut être proposé aux utilisateurs plus jeunes. La création autonome d’un compte et la synchronisation dans le cloud sont réservées aux personnes âgées d’au moins 18 ans ; Patternly ne propose aucun mécanisme de consentement parental ou d’un tuteur.

3. Données conservées sur votre appareil

L’utilisation en mode invité ou avec un compte peut enregistrer sur l’appareil un identifiant d’installation, un identifiant de jeu de données local, le parcours choisi, les objectifs, les paramètres, les sessions d’apprentissage, les réponses, les résultats, la file de révision, l’état de récupération, le calendrier des notifications et la file d’attente des signalements de contenu. Les rappels locaux sont programmés sur l’appareil ; Patternly n’enregistre actuellement aucun jeton de notification push sur un serveur.

Les données d’apprentissage locales sont protégées par les contrôles de stockage de l’appareil utilisés par Patternly. Un code de récupération copié à votre demande est effacé lorsque le système d’exploitation le permet et uniquement si le presse-papiers contient toujours ce code. Les données qui restent uniquement sur l’appareil ne sont pas envoyées au Responsable du traitement, sauf si vous créez un compte et synchronisez un enregistrement autorisé, soumettez un signalement ou utilisez une autre fonctionnalité réseau.

4. Données de compte et d’authentification

Pour un compte, Patternly traite les identifiants d’utilisateur Firebase et Patternly, l’adresse e-mail, l’état de vérification, le fournisseur d’authentification et les horodatages de sécurité afin de créer et sécuriser le compte, authentifier les requêtes, synchroniser les données prises en charge, rétablir l’accès et prévenir les abus. Les bases juridiques sont l’exécution du contrat de service et l’intérêt légitime du Responsable du traitement à assurer la sécurité du service ; les obligations légales s’appliquent aux dossiers dont la conservation est requise.

Apple, Google et Firebase peuvent traiter les données d’authentification et d’attestation de l’appareil selon leurs propres conditions. Au sens de l’article 14 du RGPD, ils sont également des sources auprès desquelles Patternly peut recevoir des identifiants d’identité et de fournisseur, une adresse e-mail et un nom lorsqu’ils sont renvoyés, ainsi que des signaux d’attestation de l’appareil ou de sécurité. Patternly demande les autorisations relatives à l’e-mail et au nom lors de la connexion Apple et limite leur utilisation aux champs renvoyés pour l’authentification et le fonctionnement du compte.

5. Données d’apprentissage et de synchronisation

Lorsque la synchronisation est activée, Patternly envoie au serveur Patternly le parcours sélectionné et les enregistrements d’apprentissage achevés, tels que les résumés de session, résultats, réponses, état des révisions, versions, horodatages et identifiants de l’appareil ou du jeu de données. Les brouillons actifs, minuteurs, préférences et paramètres de notification ne figurent pas dans la liste actuelle des données synchronisées. La finalité et la base juridique sont la fourniture du service de synchronisation du compte et le maintien de son intégrité.

La progression d’apprentissage est conservée tant que le compte existe et est supprimée selon la procédure de suppression du compte, sous réserve des preuves limitées de suppression décrites ci-dessous. Les métadonnées des opérations de synchronisation achevées sont conservées pendant {{privacy.completedSyncOperationRetentionDays}} jours après leur achèvement.

6. Signalements de contenu et communications

Un signalement de contenu peut comprendre une catégorie, une description libre facultative, un identifiant de soumission aléatoire, des identifiants de contenu et de paquet, la route, la langue, la version de l’application, la plateforme, la date et un jeton App Check ou d’attestation de l’appareil. Le formulaire mobile actuel n’ajoute volontairement ni compte ni adresse e-mail de contact, bien que le schéma du serveur prenne en charge ces champs pour les canaux approuvés. Le serveur reçoit l’adresse IP de connexion et la transforme en identifiant irréversible de limitation du débit, utilisé uniquement pour limiter les signalements répétés. Ne communiquez pas de mots de passe ni d’informations sensibles inutiles.

Les signalements sont traités afin de corriger le contenu, de répondre lorsqu’un contact a été demandé, de protéger le service et d’établir des réclamations. La base juridique de ces finalités est l’intérêt légitime du Responsable du traitement au sens de l’article 6, paragraphe 1, point f), du RGPD, qui consiste à maintenir l’exactitude du contenu, répondre à un contact demandé, protéger le canal de signalement et défendre des droits en justice ; vous pouvez vous y opposer conformément à l’article 21 du RGPD. Les signalements non liés à un compte ou à un contact sont conservés pendant {{privacy.anonymousReportRetentionDays}} jours ; ceux liés à un compte ou à un contact pendant {{privacy.linkedReportRetentionDays}} jours. L’identifiant IP irréversible de limitation du débit est conservé uniquement pendant la fenêtre de limitation active de {{privacy.reportRateLimitIdentifierRetentionSeconds}} secondes. Un signalement accepté localement est supprimé lorsque le serveur en confirme la réception. Un signalement non confirmé dans la file locale est automatiquement supprimé au bout de {{privacy.localReportOutboxRetentionDays}} jours.

7. Sécurité et données techniques

Patternly utilise des jetons d’authentification, App Check ou des signaux d’attestation de l’appareil, des métadonnées de requête, des identifiants de limitation du débit dérivés par hachage des données réseau ou d’adresse e-mail, des journaux opérationnels et des événements de sécurité pour protéger les comptes, enquêter sur les incidents et prévenir les abus. Patternly n’utilise ni SDK publicitaire ou de suivi interapplications, ni SDK externe général d’analyse produit, ni SDK externe de rapport de plantage. RevenueCat traite l’historique des achats pour les fonctions d’abonnement et l’analyse des achats décrites ci-dessous.

Les journaux opérationnels sont conservés pendant {{privacy.operationalLogRetentionDays}} jours et les journaux de sécurité pendant {{privacy.securityLogRetentionDays}} jours. Patternly masque les identifiants d’accès et les charges utiles dans les journaux de production. Les codes de récupération copiés à votre demande peuvent rester dans le presse-papiers du système ; Patternly tente de les effacer après {{privacy.clipboardRecoveryCodeRetentionMinutes}} minutes lorsque le système d’exploitation le permet et ne supprime pas les éléments que vous avez copiés ensuite.

8. Sous-traitants, destinataires et transferts

Sous-traitants cloud actifs vérifiés et leurs finalités : {{privacy.activeCloudProcessors}}. Responsables indépendants actifs et destinataires : {{privacy.activeIndependentRecipients}}. Prestataire d’envoi d’e-mails : {{privacy.emailDeliveryProvider}}. Régions des prestataires : {{privacy.hostingRegions}}. Garanties applicables aux transferts hors EEE : {{privacy.internationalTransferSafeguards}}.

Statut de RevenueCat : {{privacy.revenueCatStatus}}. Apple peut conserver de manière indépendante les dossiers de transaction et d’abonnement de l’App Store. La suppression d’un compte Patternly ne résilie pas un abonnement App Store et ne supprime pas les dossiers relevant de la responsabilité indépendante d’Apple. Patternly réexamine ses sous-traitants, destinataires et dispositifs de transfert lorsque les prestataires ou leurs lieux de traitement changent.

9. Conservation et suppression du compte

Les données du compte et d’apprentissage synchronisées sont conservées tant que le compte est actif, sauf si une durée plus courte ou une demande valide antérieure s’applique. La suppression du compte efface son sous-arbre, les associations d’identité et le compte d’authentification, et dissocie les signalements de contenu liés. Elle ne résilie pas à elle seule un abonnement souscrit auprès d’un magasin d’applications.

Après la suppression, Patternly conserve un pseudonyme HMAC à clé uniquement pour empêcher la recréation accidentelle du compte pendant {{privacy.deletionTombstoneRetentionDays}} jours. Il demeure une donnée personnelle et n’est pas anonyme, mais aucun UID brut de fournisseur n’est conservé. La base juridique est l’intérêt légitime du Responsable du traitement au sens de l’article 6, paragraphe 1, point f), du RGPD ; vous pouvez vous opposer à ce traitement au titre de l’article 21 en contactant {{privacy.privacyEmail}}. Une preuve minimale et non corrélable de l’achèvement de la suppression peut être conservée pendant {{privacy.deletionEvidenceRetentionYears}} ans au maximum sur le fondement de l’article 6, paragraphe 1, point c), du RGPD, ainsi que du cadre de responsabilité et d’obligations relatives aux droits prévu aux articles 5, paragraphe 2, 12, paragraphe 2, 17 et 24 du RGPD. Patternly ne conserve pas de dossier général de lutte contre la fraude après la suppression : toute conservation liée à un événement de fraude exige son propre modèle de menace documenté, une évaluation de nécessité et une mise en balance des intérêts légitimes. Suppression des sauvegardes et de la récupération à un instant donné : {{privacy.backupPurgeDisclosure}}.

10. Vos droits

Sous réserve du droit applicable, vous pouvez demander l’accès et les informations requises par l’article 15 du RGPD, la rectification, l’effacement, la limitation, la portabilité ou vous opposer à un traitement fondé sur l’intérêt légitime. Vous pouvez retirer votre consentement pour l’avenir sans affecter la licéité du traitement antérieur. Contact : {{privacy.privacyEmail}}. Les demandes sont normalement gratuites. Patternly peut vérifier votre identité et doit répondre dans un délai d’un mois ; lorsque la loi le permet, ce délai peut être prolongé de deux mois au maximum après notification dans le premier mois et explication des motifs. Tout refus doit être motivé et expliquer les possibilités de réclamation et de recours judiciaire.

Patternly traite les demandes relatives à la confidentialité par leur réception, la vérification de l’identité si nécessaire, leur évaluation, leur exécution ou un refus motivé, puis leur clôture. Cela s’applique également lorsque Patternly ne peut pas identifier un invité sans informations supplémentaires. Vous pouvez déposer une réclamation auprès de {{privacy.supervisoryAuthority}} ou d’une autre autorité compétente et exercer un recours judiciaire. Patternly ne prend aucune décision fondée exclusivement sur un traitement automatisé produisant des effets juridiques ou des effets similaires importants.

11. Modifications et preuve de version

Chaque Politique publiée comporte une date d’entrée en vigueur et une version immuable. Les modifications importantes sont communiquées lorsque la loi l’exige. Lorsque le consentement constitue la base juridique, un nouveau consentement est demandé si nécessaire. Patternly conserve une trace vérifiable de la langue, de la version, de la date et de la portée acceptées ou reconnues par l’utilisateur d’un compte.

12. Coordonnées du Responsable du traitement

Numéro d’enregistrement : {{privacy.registrationNumber}}. Identifiant fiscal : {{privacy.taxIdentifier}}. Territoires : {{privacy.distributionTerritories}}.

13. Finalités du traitement et bases juridiques

{{privacy.processingRegisterDisclosure}}

14. Durées de conservation détaillées

{{privacy.retentionRegisterDisclosure}}`,
  termsOfService: String.raw`Conditions d’utilisation de Patternly

En vigueur le {{terms.effectiveDate}}. Version {{documentVersion}}. Les présentes Conditions constituent un accord entre vous et {{terms.operatorLegalName}}, {{terms.operatorBusinessForm}}, établi à {{terms.operatorRegisteredAddress}} (l’« Exploitant »), concernant votre utilisation de Patternly.

1. Acceptation des Conditions

En créant un compte ou en utilisant autrement les services Patternly associés à un compte, vous acceptez les présentes Conditions et reconnaissez avoir pris connaissance de la Politique de confidentialité distincte. Si vous n’acceptez pas ces Conditions, ne créez pas de compte. L’utilisation en mode invité ne nécessitant pas d’acceptation reste soumise au droit applicable et aux règles nécessaires au fonctionnement sûr de l’application.

2. Admissibilité

Patternly exige que vous ayez au moins {{terms.minimumUserAge}} ans pour créer vous-même un compte. Il s’agit d’une règle du produit et non d’une déclaration selon laquelle la loi interdirait à toute personne plus jeune d’apprendre. L’apprentissage en mode invité sans compte peut rester accessible aux personnes plus jeunes. Patternly ne propose pas de procédure de consentement d’un parent ou d’un tuteur ; les personnes n’ayant pas atteint cet âge ne peuvent donc pas créer de compte. Champ de la règle : {{terms.minimumUserAgeScope}}. Vous devez fournir des informations de compte exactes et protéger vos identifiants d’accès.

3. Le service

Patternly est un outil d’apprentissage indépendant pour s’exercer aux entretiens techniques et aux sujets liés aux certifications. Ce n’est ni un organisme officiel de certification, ni une autorité d’examen, ni un recruteur, ni une école, et il ne garantit ni emploi, ni résultat d’examen, ni compétence professionnelle.

Les fonctionnalités et le contenu peuvent évoluer à mesure que le service s’améliore. Les modifications importantes qui affectent un service payant actif ou vos droits légaux seront communiquées conformément au droit applicable.

4. Utilisation en mode invité et comptes

Certaines fonctionnalités peuvent être utilisées en mode invité et enregistrent alors des données sur l’appareil. Un compte peut permettre la récupération et la synchronisation des données prises en charge. Vous êtes responsable de l’activité effectuée au moyen de votre compte, sauf si vous signalez rapidement un accès non autorisé.

Le contrat relatif au service de compte est conclu pour une durée indéterminée et se poursuit jusqu’à sa résiliation par vous ou par l’Exploitant conformément aux présentes Conditions. La suppression de votre compte Patternly met fin au service de compte, mais ne résilie pas à elle seule un abonnement distinct souscrit auprès de l’App Store.

Vous pouvez supprimer votre compte au moyen de la procédure de suppression disponible dans l’application. La Politique de confidentialité décrit les données concernées, les règles de conservation et les limites de la suppression.

5. Licence de l’application et du contenu

L’Exploitant vous accorde un droit limité, personnel, non exclusif, non transférable et révocable d’utiliser le service et son contenu pour votre propre apprentissage, sous réserve des présentes Conditions et du droit applicable. Patternly et ses contenus originaux restent protégés par le droit de la propriété intellectuelle.

Pour une application obtenue auprès d’Apple, le contrat Apple Standard Licensed Application End User License Agreement s’applique séparément à la licence de l’application, sauf si une EULA personnalisée est fournie dans App Store Connect. Les présentes Conditions régissent le service Patternly et ne remplacent pas les conditions impératives d’Apple.

6. Utilisation acceptable

N’utilisez pas le service de manière abusive, ne compromettez pas sa sécurité ou son fonctionnement, n’accédez pas au compte d’une autre personne, n’automatisez pas l’accès en dehors des fonctionnalités prises en charge, ne contournez pas les contrôles d’accès, n’extrayez ni ne redistribuez des parties substantielles du contenu et n’utilisez pas Patternly en violation de la loi ou des droits de tiers.

Vous pouvez citer de courts extraits dans la mesure permise par la loi, mais vous ne pouvez ni republier la banque de questions ni vendre l’accès au contenu Patternly sans autorisation écrite.


7. Premium et abonnements

Patternly Premium est un service numérique mensuel à renouvellement automatique, vendu par l’intermédiaire de l’Apple App Store en Pologne et dans les autres pays de l’Union européenne où l’offre est disponible. L’offre est {{terms.premiumProductName}} (identifiant du produit {{terms.premiumProductIdentifier}}). Elle comprend : {{terms.premiumServiceScope}}. Sa période de facturation est de {{terms.premiumBillingPeriod}}. Il n’y a aucune période d’essai. Le prix total initial, taxes applicables comprises, est de {{terms.premiumPriceIncludingTaxes}} ; le prix de renouvellement, taxes applicables comprises, est de {{terms.premiumRenewalPriceIncludingTaxes}} pour chaque période de {{terms.premiumBillingPeriod}}. Avant votre commande, l’écran d’achat présente ces prix en vigueur, la période de renouvellement, le périmètre Premium, le moyen et le moment du paiement, le début du service et l’obligation de paiement.

Le dispositif de marchand officiel est le suivant : {{terms.merchantOfRecord}}. Apple fournit le canal de paiement et de gestion des abonnements, mais cela ne supprime pas la responsabilité de l’Exploitant concernant la conformité de Patternly ni vos recours légaux contre le professionnel responsable.

Un abonnement se renouvelle automatiquement uniquement selon les conditions clairement présentées avant l’achat. Vous pouvez arrêter les renouvellements futurs dans les réglages de votre compte Apple. La suppression de l’application ou de votre compte Patternly ne résilie pas un abonnement App Store. Une hausse substantielle du prix n’est jamais acceptée par la simple poursuite de l’utilisation de Patternly ; elle exige le mécanisme légal applicable de consentement exprès, de nouvel achat ou de renouvellement.

Apple peut traiter les remboursements de transactions sur sa plateforme. Vous pouvez toujours adresser à l’Exploitant les réclamations relatives au service Patternly, à sa conformité ou à vos recours légaux de consommateur.

L’accès Premium commence immédiatement après l’achat uniquement si vous demandez séparément et expressément le début du service avant la fin du délai de rétractation de 14 jours. Aucune case ne peut être précochée. Si vous vous rétractez après le début du service, un paiement proportionnel au service fourni jusqu’à la rétractation peut être dû lorsque le droit impératif le permet. Premium n’est pas proposé comme une fourniture ponctuelle distincte de contenu numérique ; Patternly ne vous demande donc pas de reconnaître la perte du droit de rétractation sur ce fondement. Les autres droits légaux de rétractation restent applicables. Le dépôt d’une réclamation n’est pas limité à 14 jours.


8. Disponibilité et modifications

L’Exploitant s’efforce de maintenir Patternly disponible, mais ne garantit pas un accès ininterrompu ou exempt d’erreurs. La maintenance, les incidents de sécurité, les pannes de prestataires, les limites des appareils ou les exigences légales peuvent interrompre des fonctionnalités. Les données hors ligne et synchronisées peuvent ne pas toujours être disponibles de façon identique.

Si une fonctionnalité payante est substantiellement supprimée, l’Exploitant fournira tout recours exigé par le droit applicable de la consommation et les règles de la plateforme d’achat.

9. Signalements et communications

Si vous soumettez un signalement de contenu ou un message d’assistance, vous confirmez qu’il est licite et qu’il ne contient sciemment aucun élément que vous n’avez pas le droit de partager. Vous conservez vos droits sur votre message et autorisez l’Exploitant à l’utiliser uniquement dans la mesure nécessaire à l’examen du signalement, à votre assistance, à la protection du service et à l’exécution des obligations légales. La Politique de confidentialité décrit les traitements de données associés.

10. Suspension et résiliation

Vous pouvez cesser d’utiliser Patternly et supprimer votre compte à tout moment, sous réserve de résilier séparément tout abonnement sur une plateforme. L’Exploitant ne peut restreindre l’accès de manière proportionnée qu’en cas de manquement substantiel, de menace de sécurité vérifiée, d’utilisation illicite, de non-paiement ou d’exigence juridique contraignante.

Sauf si une action immédiate est nécessaire pour prévenir un préjudice ou respecter la loi, l’Exploitant expliquera le motif, donnera un préavis raisonnable et la possibilité de remédier au manquement. Vous pouvez faire appel à {{terms.complaintEmail}}. L’accès sera rétabli dès que le motif aura cessé. La suspension ne supprime pas les droits légaux relatifs à la conformité, au remboursement, à la restitution des données, aux réclamations ou à la résiliation et n’arrête pas à elle seule les futurs renouvellements Apple.

11. Responsabilité et droits légaux

Patternly apporte un soutien à l’apprentissage et ne fournit aucun conseil professionnel, relatif à l’emploi ou aux examens, juridique, financier ou autre conseil réglementé. Vous restez responsable des décisions prises à l’aide du service et de la vérification des exigences auprès de l’autorité officielle compétente.

En règle générale, l’Exploitant n’exclut ni ne plafonne une responsabilité imposée par le droit impératif. Aucune disposition des présentes Conditions ne restreint les droits relatifs à la conformité des services numériques, aux mises à jour requises, à la réduction du prix, à la rétractation, à la résiliation, au remboursement, au traitement des réclamations, aux dommages corporels, au dol, à la faute lourde ni à toute autre responsabilité qui ne peut légalement être limitée.

12. Services de tiers

Patternly peut s’appuyer sur Apple et sur des prestataires d’authentification, d’hébergement, de notification et de facturation. Leurs propres conditions peuvent régir votre relation avec eux. Les références à des organismes de certification et à des propriétaires de technologies identifient des sujets d’apprentissage et n’impliquent aucune approbation ni recommandation.

13. Droit applicable et litiges

Les présentes Conditions sont régies par {{terms.governingLaw}}. Les tribunaux désignés comme {{terms.competentCourts}} sont compétents, sans vous priver des protections impératives des consommateurs ni du droit de saisir un tribunal accessible selon le droit applicable au lieu de votre résidence.

Avant d’introduire une action formelle, vous pouvez contacter l’Exploitant pour qu’il examine le problème. Cela ne limite aucun droit légal de réclamation, de saisine d’une autorité, de règlement extrajudiciaire ou d’action en justice.

14. Modifications du service, du prix et des Conditions

L’Exploitant ne peut modifier le service numérique sans coût supplémentaire que pour un motif valable indiqué ici : respect de la loi, sécurité, interopérabilité, correction de défauts ou amélioration des fonctions sans réduction du périmètre du service payant convenu. Toute modification défavorable sera expliquée sur un support durable au moins 30 jours à l’avance, sauf si une modification immédiate est strictement exigée par la loi ou par une menace de sécurité urgente.

Lorsque le droit impératif s’applique, vous pouvez résilier dans les 30 jours suivant la réception de l’avis ou la modification, selon la date la plus tardive, sauf si l’Exploitant maintient sans frais supplémentaires la version inchangée et conforme. Toute modification substantielle du prix exige le mécanisme applicable de consentement exprès, de nouvel achat ou de renouvellement ; la poursuite de l’utilisation ne vaut pas consentement tacite.

Une nouvelle version des Conditions indique sa date d’entrée en vigueur et les modifications apportées. Un consentement renouvelé sera recueilli lorsque la loi l’exige. Une copie immuable de la version que vous avez acceptée restera disponible sur un support durable.

15. Formation du contrat et preuve durable

Avant la création d’un compte ou un achat, Patternly doit mettre gratuitement à disposition les présentes Conditions et toutes les informations précontractuelles requises dans un format que vous pouvez enregistrer. Le contrat n’est conclu qu’après une action non équivoque acceptant la version identifiée. Le bouton de commande payante doit indiquer que la commande crée une obligation de paiement.

L’Exploitant doit fournir une confirmation sur un support durable et conserver une trace vérifiable de la version des Conditions, de l’offre, du prix, des conditions de renouvellement, de l’horodatage, de la langue et des consentements liés à la transaction.

16. Exigences techniques

Exigences techniques et compatibilité : {{terms.technicalRequirements}}. Une connexion Internet est nécessaire pour l’authentification du compte, la synchronisation, les achats, la restauration des achats et les communications avec l’Exploitant. Les fonctions hors ligne prises en charge peuvent se limiter aux données déjà disponibles sur l’appareil.

Engagement d’assistance et de mise à jour : {{terms.supportCommitment}}. Les mises à jour nécessaires de sécurité et de conformité seront fournies pendant la période imposée par le contrat et le droit impératif.

17. Rétractation du consommateur

Si vous êtes un consommateur éligible, vous disposez généralement de 14 jours pour vous rétracter d’un contrat à distance sans motif. Envoyez une déclaration non équivoque à {{terms.withdrawalEmail}} ou à l’adresse postale de l’Exploitant avant l’expiration du délai. Vous pouvez indiquer : « Je me rétracte par la présente du contrat portant sur [service], commandé le [date], nom, adresse, date et signature en cas d’envoi sur papier. » Ce modèle est facultatif.

18. Conformité du service numérique

Patternly doit être conforme à sa description, au périmètre du service payant convenu, à ses fonctionnalités, à sa compatibilité, à son accessibilité, à sa continuité, à sa sécurité et aux mises à jour auxquelles vous pouvez raisonnablement vous attendre au titre du contrat et du droit impératif. Signalez toute non-conformité à {{terms.complaintEmail}}. Vous pouvez demander une mise en conformité dans un délai raisonnable et sans inconvénient majeur.

Lorsque les conditions légales sont réunies, vous pouvez demander une réduction proportionnelle du prix ou résilier et obtenir le remboursement applicable. Ces recours s’exercent contre le professionnel responsable et ne sont pas remplacés par les outils transactionnels d’Apple.

19. Réclamations

Envoyez une réclamation à {{terms.complaintEmail}} ou à l’adresse postale de l’Exploitant. Dans la mesure du possible, identifiez le compte ou la transaction, décrivez le problème et le recours demandé, et n’envoyez pas de mots de passe. L’Exploitant confirmera la réception sur un support durable et répondra dans les 14 jours suivant la réception, sauf délai impératif plus court. Le délai de réponse de 14 jours n’est pas un délai pour déposer une réclamation.

20. Données après la résiliation

Lorsque le droit applicable vous confère le droit de récupérer du contenu non personnel que vous avez fourni ou créé, demandez-le à {{terms.complaintEmail}}. Sous réserve des exceptions légales, l’Exploitant fournit le contenu concerné gratuitement, sans entrave, dans un délai raisonnable et dans un format couramment utilisé et lisible par machine.

21. Règlement extrajudiciaire des litiges

La position de l’Exploitant concernant sa participation à la médiation de consommation est la suivante : {{terms.adrPosition}}. Organisme ou point d’information pertinent : {{terms.adrEntity}}. Cette section ne renvoie pas à la plateforme européenne de règlement en ligne des litiges, qui a cessé ses activités, et ne limite pas votre droit de contacter une autorité de protection des consommateurs ou un tribunal.

22. Exploitant et coordonnées

Exploitant : {{terms.operatorLegalName}}, {{terms.operatorBusinessForm}}. Adresse : {{terms.operatorRegisteredAddress}}. E-mail : {{terms.operatorEmail}}. Téléphone : {{terms.operatorPhone}}.

Patternly est proposé dans les territoires suivants : {{terms.distributionTerritories}}. Numéro d’enregistrement : {{terms.operatorRegistrationNumber}}. Identifiant fiscal : {{terms.operatorTaxIdentifier}}.`,
});
