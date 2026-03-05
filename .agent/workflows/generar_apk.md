---
description: Cómo generar un nuevo APK de forma segura (Backup, Repo y Expo)
---

# Pasos para generar un nuevo APK

Por favor, genera un nuevo APK de la aplicación móvil para Android. Para garantizar que todos los cambios locales recientes se reflejen correctamente tanto en la aplicación como en el servidor de producción, sigue ESTRICTAMENTE estos 4 pasos en el orden indicado:

1. **RESPALDO DEL REPOSITORIO (Backup)**:
   Crea un archivo .zip del directorio del proyecto en su estado actual (por ejemplo: `ProFix_Backup_Fecha.zip`) y guárdalo fuera de la carpeta de trabajo principal (ej. un nivel arriba) para tener un punto de restauración seguro antes de compilar. 

2. **VERIFICACIÓN Y CORRECCIÓN DE ERRORES**:
   Ejecuta el comando para verificar la salud de las dependencias (`npx expo doctor` o equivalente). Si hay alguna advertencia sobre iconos, tamaños de imágenes o versiones de bibliotecas discordantes, arréglalos de inmediato mediante scripts/herramientas automatizadas antes de continuar.

3. **SINCRONIZACIÓN DE PRODUCCIÓN Y GITHUB (CRÍTICO)**:
   Aumenta la versión (`version`) y el código de versión (`versionCode`) en el archivo `app.json`. Luego, asegura todos los cambios ejecutando `git add .` seguido de un `git commit` descriptivo. FINALMENTE y sin falta, ejecuta `git push origin main` (o tu rama principal) para asegurar que plataformas como Render detecten el cambio y desplieguen automáticamente el backend actualizado. NO inicies la compilación del APK sin antes hacer push.

4. **COMPILACIÓN CON EXPO EAS**:
   Una vez que el código esté exitosamente en GitHub, ejecuta el comando de compilación remota (`npx eas build -p android --profile preview --non-interactive`). Avísame tan pronto se haya encolado en los servidores e infórmame cuánto tiempo estimado tardará en estar listo el enlace.
