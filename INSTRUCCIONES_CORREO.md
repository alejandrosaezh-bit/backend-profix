# Guía de Configuración de Correo Corporativo (IONOS) para ProFix

Dado que utilizas un correo corporativo alojado en IONOS (`soporte@profesionalcercano.com`), el proceso es distinto al de Gmail. El código de la aplicación ya ha sido adaptado permanentemente para conectarse de forma segura a través de los servidores SMTP de IONOS.

A continuación, los pasos exactos que debes realizar cuando regreses a trabajar:

## Paso 1: Preparar la contraseña del correo en IONOS
A diferencia de Google, IONOS generalmente permite usar la contraseña real de tu buzón para conectarse vía SMTP, a menos que tengas activada seguridad extra en tu panel.
1. Inicia sesión en tu panel de control de IONOS y asegúrate de recordar cuál es la contraseña exacta con la que entras a la bandeja de entrada de `soporte@profesionalcercano.com`.
2. *(Opcional pero recomendado)*: Si en tu paquete de IONOS existe alguna opción anti-spam o firewall restrictivo, asegúrate de permitir conexiones SMTP (puerto 465 o 587). Por defecto, suele venir activo en cuentas profesionales.

## Paso 2: Agregar las Variables de Entorno en el Backend (Render)
Para que el servidor en la nube sepa qué correo, contraseña y puerto usar, debes pasarle estas credenciales a tu plataforma de Render.

1. Inicia sesión en tu cuenta de [Render.com](https://dashboard.render.com).
2. Entra al dashboard de tu servicio Backend (Backend-Profix, o el nombre de tu web service).
3. Navega al apartado secundario **"Environment"** de la barra lateral izquierda.
4. Encontrarás tu panel de "Environment Variables". Haz clic en **Add Environment Variable** para crear las siguientes llaves (respeta las minúsculas y mayúsculas exactamente en las siguientes *Keys*):

   * **Key:** `EMAIL_HOST`  
     **Value:** `smtp.ionos.es` *(O prueba con smtp.ionos.com según aplique tu zona)*

   * **Key:** `EMAIL_PORT`  
     **Value:** `587`

   * **Key:** `EMAIL_USER`  
     **Value:** `soporte@profesionalcercano.com`

   * **Key:** `EMAIL_PASS`  
     **Value:** *Coloca aquí la contraseña real/oficial de tu correo en IONOS*

5. Presiona **Save Changes**. Al guardar, Render reiniciará automáticamente tu servidor backend usando estos nuevos parámetros.

## Paso 3: Probar la Recuperación
Una vez que en Render diga "Deploy Live" o esté "Active" tu app y esté conectada, vuelve a abrir la app ProFix desde tu teléfono.
1. Ve a "Olvidé mi contraseña".
2. Escribe tu correo para hacer la prueba.
3. El botón mostrará estado de carga. Si finaliza y manda una alerta de **Éxito (Te hemos enviado un código a tu correo)**, ¡significa que IONOS autenticó tu cuenta con éxito y el correo de Profix ya funciona! Si fallara te aparecerá una X alertando del error interno.

---

### ¿Qué debo hacer cuando vuelva a esta sesión?
Solo infórmame que *"ya lo configuraste"* en Render. Si quieres que sigamos programando directamente desde tu computadora en modo "Local", simplemente me dices la clave para agregarla secretamente en el archivo local `.env` antes de levantar el servidor.
