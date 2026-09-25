/** Borrador de traducción íntegra al español, no aprobado. Solo para pruebas. */
export const legalTranslationDraftsEsTestOnly = Object.freeze({
  locale: "es" as const,
  testOnly: true as const,
  approvalStatus: "UNAPPROVED" as const,
  privacyPolicy: String.raw`Política de privacidad de Patternly

Vigente desde {{privacy.effectiveDate}}. Versión {{documentVersion}}. Esta Política explica cómo {{privacy.controllerLegalName}}, {{privacy.controllerBusinessForm}}, con domicilio en {{privacy.controllerAddress}} (el «Responsable del tratamiento»), trata datos personales en Patternly.

1. Responsable del tratamiento y contacto

Responsable del tratamiento: {{privacy.controllerLegalName}}, {{privacy.controllerBusinessForm}}, {{privacy.controllerAddress}}. Contacto de privacidad: {{privacy.privacyEmail}}; teléfono: {{privacy.controllerPhone}}. Delegado de protección de datos o contacto designado: {{privacy.dpoContact}}.

2. Ámbito y política de edad

Esta Política se aplica a la aplicación móvil, la cuenta y los servicios de sincronización, las páginas legales públicas y los canales de asistencia o denuncia de contenido. El aprendizaje como invitado sin cuenta puede estar disponible para usuarios menores. La creación autónoma de cuentas y la sincronización en la nube están limitadas a personas mayores de 18 años; Patternly no ofrece un proceso de consentimiento de padres o tutores.

3. Datos guardados en su dispositivo

El uso como invitado o con una cuenta puede guardar en el dispositivo un identificador de instalación, un identificador del conjunto de datos local, la ruta seleccionada, objetivos, ajustes, sesiones de aprendizaje, respuestas, resultados, cola de repaso, estado de recuperación, programación de notificaciones y cola de denuncias de contenido. Los recordatorios locales se programan en el dispositivo; Patternly actualmente no registra un token de notificaciones push en el servidor.

Los datos locales de aprendizaje están protegidos por los controles de almacenamiento del dispositivo que utiliza Patternly. Un código de recuperación copiado a petición suya se borra cuando el sistema operativo lo permite y solo si el portapapeles todavía contiene ese mismo código. Los datos que permanecen exclusivamente en el dispositivo no se envían al Responsable del tratamiento, salvo que cree una cuenta y sincronice un registro permitido, envíe una denuncia o utilice otra función de red.

4. Datos de cuenta y autenticación

Para una cuenta, Patternly trata identificadores de usuario de Firebase y Patternly, dirección de correo electrónico, estado de verificación, proveedor de autenticación y marcas de tiempo de seguridad con el fin de crear y proteger la cuenta, autenticar solicitudes, sincronizar datos admitidos, recuperar el acceso y evitar abusos. Las bases jurídicas son la ejecución del contrato de servicio y el interés legítimo del Responsable del tratamiento en la seguridad del servicio; las obligaciones legales se aplican cuando se exige conservar registros.

Apple, Google y Firebase pueden tratar datos de autenticación y de atestación del dispositivo conforme a sus propias condiciones. A efectos del artículo 14 del RGPD, también son fuentes de las que Patternly puede recibir identificadores de identidad y proveedor, una dirección de correo y un nombre cuando se devuelvan, así como señales de atestación del dispositivo o de seguridad. Patternly solicita los permisos de correo y nombre al iniciar sesión con Apple y limita su uso a los campos devueltos para la autenticación y el funcionamiento de la cuenta.

5. Datos de aprendizaje y sincronización

Cuando se activa la sincronización, Patternly envía al backend de Patternly la ruta seleccionada y registros de aprendizaje completados, como resúmenes de sesiones, resultados, respuestas, estado de repaso, versiones, marcas de tiempo e identificadores del dispositivo o del conjunto de datos. Los borradores activos, temporizadores, preferencias y ajustes de notificación no forman parte de la lista de sincronización actual. La finalidad y la base jurídica son prestar el servicio de sincronización de la cuenta y mantener su integridad.

El progreso de aprendizaje se conserva mientras exista la cuenta y se elimina mediante el proceso de eliminación de la cuenta, con sujeción a las pruebas limitadas de eliminación descritas más adelante. Los metadatos de operaciones de sincronización completadas se conservan durante {{privacy.completedSyncOperationRetentionDays}} días después de su finalización.

6. Denuncias de contenido y comunicaciones

Una denuncia de contenido puede incluir una categoría, una descripción libre opcional, un identificador aleatorio de envío, identificadores de contenido y paquete, ruta, idioma, versión de la aplicación, plataforma, hora y un token de App Check o de atestación del dispositivo. El formulario móvil actual no adjunta deliberadamente una cuenta ni un correo electrónico de contacto, aunque el esquema del backend admite esos campos para canales aprobados. El servidor recibe la dirección IP de conexión y la convierte en un identificador unidireccional de limitación de frecuencia, utilizado únicamente para limitar denuncias repetidas. No incluya contraseñas ni información sensible innecesaria.

Las denuncias se tratan para corregir contenido, responder cuando se haya solicitado contacto, proteger el servicio y fundamentar reclamaciones. La base jurídica de estas finalidades es el interés legítimo del Responsable del tratamiento conforme al artículo 6, apartado 1, letra f), del RGPD en mantener la exactitud del contenido, responder a un contacto solicitado, proteger el canal de denuncias y defender reclamaciones legales; usted puede oponerse conforme al artículo 21 del RGPD. Las denuncias no vinculadas a una cuenta ni a un contacto se conservan durante {{privacy.anonymousReportRetentionDays}} días; las vinculadas a una cuenta o contacto, durante {{privacy.linkedReportRetentionDays}} días. El identificador unidireccional de limitación de IP se conserva solo durante la ventana activa de limitación de {{privacy.reportRateLimitIdentifierRetentionSeconds}} segundos. Una denuncia aceptada localmente se elimina cuando el servidor confirma su recepción. Una denuncia no confirmada en la cola local se elimina automáticamente al cabo de {{privacy.localReportOutboxRetentionDays}} días.

7. Seguridad y datos técnicos

Patternly utiliza tokens de autenticación, App Check o señales de atestación del dispositivo, metadatos de solicitudes, identificadores de limitación derivados del hash de datos de red o de correo electrónico, registros operativos y eventos de seguridad para proteger cuentas, investigar fallos y prevenir abusos. Patternly no utiliza SDK de publicidad ni de seguimiento entre aplicaciones, SDK externo general de analítica de producto ni SDK externo de informes de fallos. RevenueCat trata el historial de compras para ofrecer funciones de suscripción y analítica de compras, según se describe más adelante.

Los registros operativos se conservan durante {{privacy.operationalLogRetentionDays}} días y los registros de seguridad durante {{privacy.securityLogRetentionDays}} días. Patternly redacta credenciales y cargas útiles de los registros de producción. Los códigos de recuperación copiados a petición suya pueden permanecer en el portapapeles del sistema; Patternly intenta borrarlos después de {{privacy.clipboardRecoveryCodeRetentionMinutes}} minutos cuando el sistema operativo lo permite y no elimina lo que usted haya copiado posteriormente.

8. Encargados, destinatarios y transferencias

Encargados activos de servicios en la nube verificados y sus finalidades: {{privacy.activeCloudProcessors}}. Responsables independientes activos y destinatarios: {{privacy.activeIndependentRecipients}}. Proveedor de envío de correo electrónico: {{privacy.emailDeliveryProvider}}. Regiones de los proveedores: {{privacy.hostingRegions}}. Garantías para transferencias fuera del EEE: {{privacy.internationalTransferSafeguards}}.

Estado de RevenueCat: {{privacy.revenueCatStatus}}. Apple puede conservar de forma independiente registros de transacciones y suscripciones del App Store. Eliminar una cuenta de Patternly no cancela una suscripción del App Store ni elimina registros cuyo responsable independiente sea Apple. Patternly revisa sus encargados, destinatarios y acuerdos de transferencia cuando cambian los proveedores o sus ubicaciones de tratamiento.

9. Conservación y eliminación de la cuenta

Los datos de la cuenta y del aprendizaje sincronizado se conservan mientras la cuenta esté activa, salvo que se aplique un plazo menor o una solicitud válida anterior. La eliminación de la cuenta suprime su subárbol, las asociaciones de identidad y la cuenta de autenticación, y desvincula las denuncias de contenido relacionadas. No cancela por sí misma una suscripción de una tienda.

Tras la eliminación, Patternly conserva un seudónimo HMAC con clave únicamente para evitar la recreación accidental de la cuenta durante {{privacy.deletionTombstoneRetentionDays}} días. Sigue siendo un dato personal y no es anónimo, aunque no se conserva ningún UID sin procesar del proveedor. La base jurídica es el interés legítimo del Responsable del tratamiento conforme al artículo 6, apartado 1, letra f), del RGPD; puede oponerse a este tratamiento conforme al artículo 21 contactando con {{privacy.privacyEmail}}. Una prueba mínima y no vinculable de que la eliminación se completó puede conservarse hasta {{privacy.deletionEvidenceRetentionYears}} años conforme al artículo 6, apartado 1, letra c), del RGPD y al marco de rendición de cuentas y obligaciones relativas a los derechos de los artículos 5, apartado 2, 12, apartado 2, 17 y 24 del RGPD. Patternly no mantiene un registro general antifraude después de la eliminación: cualquier conservación antifraude relativa a un evento concreto requiere su propio modelo de amenazas documentado, una evaluación de necesidad y una evaluación del interés legítimo. Eliminación de copias de seguridad y de recuperación a un punto en el tiempo: {{privacy.backupPurgeDisclosure}}.

10. Sus derechos

Con sujeción a la legislación aplicable, puede solicitar el acceso y la información exigida por el artículo 15 del RGPD, la rectificación, supresión, limitación, portabilidad u oponerse al tratamiento basado en intereses legítimos. Puede retirar su consentimiento para el futuro sin afectar a la licitud del tratamiento anterior. Contacto: {{privacy.privacyEmail}}. Las solicitudes normalmente son gratuitas. Patternly puede verificar su identidad y debe responder en el plazo de un mes; cuando la ley lo permita, podrá ampliar ese plazo hasta dos meses más, tras notificarlo dentro del primer mes y explicar los motivos. Toda denegación debe estar motivada e indicar las opciones de reclamación y recurso judicial.

Patternly tramita las solicitudes de privacidad mediante su recepción, la verificación de identidad cuando sea necesaria, su evaluación, su cumplimiento o una denegación motivada y su cierre. Esto también se aplica cuando Patternly no puede identificar a un invitado sin información adicional. Puede presentar una reclamación ante {{privacy.supervisoryAuthority}} u otra autoridad competente y solicitar tutela judicial. Patternly no adopta decisiones basadas únicamente en tratamiento automatizado que produzcan efectos jurídicos o efectos similares significativos.

11. Cambios y constancia de versión

Cada Política publicada tiene una fecha de entrada en vigor y una versión inmutable. Los cambios sustanciales se comunicarán cuando la ley lo exija. Cuando el consentimiento sea la base jurídica, se solicitará un nuevo consentimiento si resulta necesario. Patternly conserva un registro auditable del idioma, la versión, la hora y el alcance aceptados o reconocidos por el usuario de una cuenta.

12. Datos del Responsable del tratamiento

Número de registro: {{privacy.registrationNumber}}. Identificador fiscal: {{privacy.taxIdentifier}}. Territorios: {{privacy.distributionTerritories}}.

13. Finalidades del tratamiento y bases jurídicas

{{privacy.processingRegisterDisclosure}}

14. Plazos de conservación detallados

{{privacy.retentionRegisterDisclosure}}`,
  termsOfService: String.raw`Condiciones del servicio de Patternly

Vigentes desde {{terms.effectiveDate}}. Versión {{documentVersion}}. Estas Condiciones constituyen un acuerdo entre usted y {{terms.operatorLegalName}}, {{terms.operatorBusinessForm}}, con domicilio en {{terms.operatorRegisteredAddress}} (el «Operador»), para el uso de Patternly.

1. Aceptación de estas Condiciones

Al crear una cuenta o utilizar de otro modo servicios de Patternly asociados a una cuenta, acepta estas Condiciones y reconoce la Política de privacidad independiente. Si no está de acuerdo, no cree una cuenta. El uso como invitado que no requiera aceptación sigue sujeto a la legislación aplicable y a las normas necesarias para que la aplicación funcione de forma segura.

2. Requisitos

Patternly exige que tenga al menos {{terms.minimumUserAge}} años para crear una cuenta por su cuenta. Esta es una regla del producto, no una afirmación de que la ley prohíba aprender a todas las personas de menor edad. El aprendizaje como invitado sin cuenta puede seguir disponible para usuarios menores. Patternly no ofrece un proceso de consentimiento de padres o tutores, por lo que quienes no alcancen esa edad no pueden crear una cuenta. Ámbito de la regla: {{terms.minimumUserAgeScope}}. Debe proporcionar información de cuenta exacta y mantener seguras sus credenciales de acceso.

3. El servicio

Patternly es una herramienta de aprendizaje independiente para practicar entrevistas técnicas y temas relacionados con certificaciones. No es un proveedor oficial de certificaciones, autoridad examinadora, agencia de contratación ni escuela, y no garantiza empleo, resultados de exámenes ni competencia profesional.

Las funciones y el contenido pueden cambiar a medida que mejora el servicio. Los cambios sustanciales que afecten a un servicio de pago activo o a sus derechos legales se comunicarán conforme a la legislación aplicable.

4. Uso como invitado y cuentas

Algunas funciones pueden utilizarse como invitado y guardar datos en el dispositivo. Una cuenta puede permitir la recuperación y sincronización de datos admitidos. Usted es responsable de las actividades realizadas mediante su cuenta, salvo que comunique rápidamente un acceso no autorizado.

El contrato del servicio de cuenta se celebra por tiempo indefinido y continúa hasta que usted o el Operador lo rescindan de acuerdo con estas Condiciones. Eliminar su cuenta de Patternly pone fin al servicio de cuenta, pero no cancela por sí mismo una suscripción independiente del App Store.

Puede eliminar su cuenta mediante el proceso disponible en la aplicación. La Política de privacidad explica los datos afectados, los plazos de conservación y los límites de la eliminación.

5. Licencia de la aplicación y del contenido

El Operador le concede un derecho limitado, personal, no exclusivo, intransferible y revocable para utilizar el servicio y su contenido con fines de aprendizaje propio, sujeto a estas Condiciones y a la legislación aplicable. Patternly y sus contenidos originales están protegidos por la legislación sobre propiedad intelectual.

Para una aplicación obtenida a través de Apple, el Apple Standard Licensed Application End User License Agreement se aplica por separado a la licencia de la aplicación, salvo que se proporcione una EULA personalizada en App Store Connect. Estas Condiciones rigen el servicio de Patternly y no sustituyen las condiciones obligatorias de Apple.

6. Uso aceptable

No haga un uso indebido del servicio, no interfiera en su seguridad ni funcionamiento, no acceda a la cuenta de otra persona, no automatice el acceso fuera de las funciones admitidas, no eluda controles de acceso, no extraiga ni redistribuya partes sustanciales del contenido y no utilice Patternly infringiendo la ley o derechos de terceros.

Puede citar fragmentos limitados cuando la ley lo permita, pero sin autorización escrita no puede volver a publicar el banco de preguntas ni vender el acceso al contenido de Patternly.


7. Premium y suscripciones

Patternly Premium es un servicio digital mensual con renovación automática que se vende mediante Apple App Store en Polonia y en los demás países de la Unión Europea donde esté disponible la oferta. La oferta es {{terms.premiumProductName}} (identificador de producto {{terms.premiumProductIdentifier}}). Incluye: {{terms.premiumServiceScope}}. El periodo de facturación es {{terms.premiumBillingPeriod}}. No hay periodo de prueba. El precio total inicial, incluidos los impuestos aplicables, es {{terms.premiumPriceIncludingTaxes}}; el precio de renovación, incluidos los impuestos aplicables, es {{terms.premiumRenewalPriceIncludingTaxes}} por cada periodo de {{terms.premiumBillingPeriod}}. Antes de realizar el pedido, la pantalla de compra muestra estos precios vigentes, el periodo de renovación, el alcance de Premium, el método y momento del pago, cuándo empieza el servicio y la obligación de pago.

El acuerdo de comerciante registrado es: {{terms.merchantOfRecord}}. Apple proporciona el canal de pago y gestión de suscripciones, pero esto no elimina la responsabilidad del Operador por la conformidad de Patternly ni sus derechos legales frente al comerciante responsable.

Una suscripción se renueva automáticamente solo en las condiciones claramente mostradas antes de la compra. Puede detener futuras renovaciones en los ajustes de su cuenta de Apple. Eliminar la aplicación o su cuenta de Patternly no cancela una suscripción del App Store. Un aumento sustancial del precio nunca se acepta por el mero hecho de seguir utilizando Patternly; requiere el mecanismo legal aplicable de consentimiento afirmativo, nueva compra o renovación.

Apple puede tramitar reembolsos de transacciones en su plataforma. Aun así, puede dirigir al Operador las reclamaciones sobre el servicio de Patternly, su conformidad o los recursos legales de consumidores.

El acceso a Premium comienza inmediatamente después de la compra solo si usted solicita por separado y de forma expresa que el servicio empiece antes de que finalice el plazo de desistimiento de 14 días. No puede haber ninguna casilla premarcada. Si desiste después de que el servicio haya empezado, puede deberse un importe proporcional por el servicio prestado hasta el desistimiento cuando la legislación imperativa lo permita. Premium no se ofrece como un suministro único y separado de contenido digital, por lo que Patternly no le pide que reconozca la pérdida del derecho de desistimiento por ese motivo. En los demás casos, se mantienen los derechos legales de desistimiento. El plazo para presentar una reclamación no se limita a 14 días.


8. Disponibilidad y cambios

El Operador procura mantener Patternly disponible, pero no promete un acceso ininterrumpido o sin errores. El mantenimiento, los incidentes de seguridad, las interrupciones de proveedores, las limitaciones del dispositivo o los requisitos legales pueden interrumpir funciones. Es posible que los datos sin conexión y sincronizados no estén siempre disponibles de forma idéntica.

Si se retira sustancialmente una función de pago, el Operador ofrecerá cualquier solución exigida por la legislación de consumo aplicable y las normas de la plataforma de compra.

9. Denuncias y comunicaciones

Si envía una denuncia de contenido o un mensaje de asistencia, confirma que es lícito y que no incluye deliberadamente material que no tenga derecho a compartir. Conserva sus derechos sobre el mensaje y permite al Operador utilizarlo únicamente cuando sea necesario para revisar la denuncia, ayudarle, proteger el servicio y cumplir obligaciones legales. La Política de privacidad explica el tratamiento de datos relacionado.

10. Suspensión y terminación

Puede dejar de utilizar Patternly y eliminar su cuenta en cualquier momento, sujeto a la cancelación por separado de cualquier suscripción de plataforma. El Operador solo puede restringir proporcionalmente el acceso por un incumplimiento sustancial, una amenaza de seguridad verificada, un uso ilícito, falta de pago o una obligación legal vinculante.

Salvo que sea necesaria una actuación inmediata para evitar daños o cumplir la ley, el Operador explicará el motivo, avisará con antelación razonable y le dará la oportunidad de subsanar el incumplimiento. Puede recurrir a través de {{terms.complaintEmail}}. El acceso se restablecerá cuando desaparezca el motivo. La suspensión no elimina los derechos legales de conformidad, reembolso, devolución de datos, reclamación o cancelación y no detiene por sí misma futuras renovaciones de Apple.

11. Responsabilidad y derechos legales

Patternly ofrece apoyo al aprendizaje, no asesoramiento profesional, laboral, de exámenes, jurídico, financiero ni de otra actividad regulada. Usted sigue siendo responsable de las decisiones tomadas mediante el servicio y de comprobar los requisitos con la autoridad oficial pertinente.

En general, el Operador no excluye ni limita la responsabilidad impuesta por normas imperativas. Nada de estas Condiciones restringe los derechos relativos a la conformidad de servicios digitales, actualizaciones necesarias, reducción del precio, desistimiento, terminación, reembolso, gestión de reclamaciones, lesiones personales, dolo, negligencia grave ni cualquier otra responsabilidad que no pueda limitarse legalmente.

12. Servicios de terceros

Patternly puede depender de Apple y de proveedores de autenticación, alojamiento, notificaciones y facturación. Sus propias condiciones pueden regir su relación con ellos. Las referencias a proveedores de certificación y propietarios de tecnologías identifican temas de aprendizaje y no implican patrocinio ni respaldo.

13. Legislación aplicable y litigios

Estas Condiciones se rigen por {{terms.governingLaw}}. Son competentes los tribunales indicados como {{terms.competentCourts}}, sin privarle de las protecciones imperativas de los consumidores ni del derecho a presentar una reclamación ante un tribunal disponible conforme a la legislación aplicable en su lugar de residencia.

Antes de presentar una reclamación formal, puede ponerse en contacto con el Operador para que examine el asunto. Esto no limita los derechos legales de reclamación, de acudir a una autoridad, de resolución alternativa de litigios ni de acudir a los tribunales.

14. Cambios del servicio, del precio y de las Condiciones

El Operador solo puede cambiar el servicio digital sin coste adicional por un motivo válido indicado aquí: cumplimiento legal, seguridad, interoperabilidad, corrección de defectos o mejora de funciones sin reducir el alcance contratado del servicio de pago. Todo cambio desfavorable se explicará en un soporte duradero con al menos 30 días de antelación, salvo que la ley o una amenaza de seguridad urgente exijan estrictamente un cambio inmediato.

Cuando sea aplicable la legislación imperativa, puede rescindir en los 30 días siguientes a la recepción del aviso o al cambio, lo que ocurra más tarde, salvo que el Operador mantenga sin coste adicional la versión sin cambios y conforme. Los cambios sustanciales de precio requieren el mecanismo aplicable de consentimiento afirmativo, nueva compra o renovación; continuar utilizando el servicio no constituye consentimiento tácito.

Una nueva versión de las Condiciones registra su fecha de entrada en vigor y los cambios. Se recabará un nuevo consentimiento cuando lo exija la ley. Una copia inmutable de la versión aceptada por usted seguirá disponible en un soporte duradero.

15. Celebración del contrato y constancia duradera

Antes de crear una cuenta o realizar una compra, Patternly debe poner gratuitamente a disposición estas Condiciones y toda la información precontractual exigida en un formato que pueda guardar. El contrato solo se celebra después de una acción inequívoca que acepte la versión identificada. El botón de pedido de pago debe indicar que la solicitud genera una obligación de pago.

El Operador debe proporcionar una confirmación en un soporte duradero y conservar un registro auditable de la versión de las Condiciones, oferta, precio, condiciones de renovación, fecha y hora, idioma y consentimientos asociados a la transacción.

16. Requisitos técnicos

Requisitos técnicos y compatibilidad: {{terms.technicalRequirements}}. Se requiere acceso a Internet para autenticar la cuenta, sincronizar, comprar, restaurar compras y comunicarse con el Operador. Las funciones sin conexión admitidas pueden limitarse a los datos que ya estén disponibles en el dispositivo.

Compromiso de asistencia y actualización: {{terms.supportCommitment}}. Las actualizaciones necesarias de seguridad y conformidad se proporcionarán durante el periodo exigido por el contrato y la legislación imperativa.

17. Desistimiento del consumidor

Si es un consumidor con derecho, normalmente dispone de 14 días para desistir de un contrato a distancia sin indicar un motivo. Envíe una declaración inequívoca a {{terms.withdrawalEmail}} o a la dirección postal del Operador antes de que venza el plazo. Puede indicar: «Por la presente desisto del contrato relativo a [servicio], pedido el [fecha], nombre, dirección, fecha y firma si se envía en papel». Este modelo es opcional.

18. Conformidad del servicio digital

Patternly debe ajustarse a su descripción, al alcance acordado del servicio de pago, su funcionalidad, compatibilidad, accesibilidad, continuidad, seguridad y las actualizaciones que razonablemente pueda esperar conforme al contrato y a la legislación imperativa. Comunique cualquier falta de conformidad a {{terms.complaintEmail}}. Puede exigir que se restablezca la conformidad en un plazo razonable y sin inconvenientes importantes.

Cuando se cumplan los requisitos legales, puede solicitar una reducción proporcional del precio o resolver el contrato y obtener el reembolso correspondiente. Estos recursos se ejercen frente al comerciante responsable y no quedan sustituidos por las herramientas de transacciones de Apple.

19. Reclamaciones

Envíe una reclamación a {{terms.complaintEmail}} o a la dirección postal del Operador. Cuando sea posible, identifique la cuenta o transacción, describa el problema y la solución solicitada, y no envíe contraseñas. El Operador confirmará la recepción en un soporte duradero y responderá en un plazo de 14 días desde su recepción, salvo que se aplique un plazo imperativo menor. Los 14 días para responder no son un plazo para presentar la reclamación.

20. Datos tras la terminación

Cuando la legislación aplicable le conceda el derecho a recuperar contenido no personal que haya proporcionado o creado, solicítelo a través de {{terms.complaintEmail}}. El Operador proporciona el contenido correspondiente de forma gratuita, sin impedimentos, en un plazo razonable y en un formato legible por máquina de uso común, sujeto a las excepciones legales.

21. Resolución extrajudicial de litigios

La posición del Operador sobre su participación en mecanismos de resolución alternativa de litigios de consumo es: {{terms.adrPosition}}. Entidad o punto de información pertinente: {{terms.adrEntity}}. Esta sección no remite a la plataforma europea ODR, ya clausurada, ni limita su derecho a ponerse en contacto con una autoridad de consumo o un tribunal.

22. Operador y contacto

Operador: {{terms.operatorLegalName}}, {{terms.operatorBusinessForm}}. Dirección: {{terms.operatorRegisteredAddress}}. Correo electrónico: {{terms.operatorEmail}}. Teléfono: {{terms.operatorPhone}}.

Patternly se ofrece en: {{terms.distributionTerritories}}. Número de registro: {{terms.operatorRegistrationNumber}}. Identificador fiscal: {{terms.operatorTaxIdentifier}}.`,
});
