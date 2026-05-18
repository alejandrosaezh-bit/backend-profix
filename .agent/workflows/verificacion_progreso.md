# Resumen de Cambios - Verificación de Profesionales

## Backend
1. **Modelado**: El modelo `User` ya tiene integrado el esquema de `verificationDetails`.
2. **Rutas (API)**: 
    - `/api/auth/verify-profile`: Ruta creada y lista para recibir `idFront`, `idBack` y `selfie`.
    - `/api/admin/users/pending`: Ruta ajustada para obtener todos los usuarios con verificación pendiente (compatible con versión anterior).
    - `/api/admin/users/verify/:id`: Ruta refactorizada para aceptar `status` (`verified` o `rejected`) y `rejectionReason`.

## Frontend
1. **UI**: Se creó el componente `ProVerificationModal` en `src/components/profile/ProVerificationModal.js`. 
2. Este modal permite:
    - Capturar imágenes de cámara o galería.
    - Mostrar el estado de revisión actual.
    - Enviar los documentos usando un endpoint unificado de subida.
3. **Integración**: Se integró el modal en `ProfessionalProfileScreen.js` y se añadió un botón al sub-menú de `ProAccountSettings` (`src/components/profile/ProProfileComponents.js`).

## Despliegues y Fixes
1. Se publicó un **EAS Update** al entorno de `production` (`Fix nav bug chat-detail black screen`) resolviendo completamente el pantallazo negro al navegar atrás desde un chat abierto en una oferta de solicitud.
