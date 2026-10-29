const cron = require('node-cron');
const User = require('../models/User');
const IacondoIntegrationService = require('../services/IacondoIntegrationService');

function initCronJobs() {
    console.log('[CRON] Iniciando schedulers de Gamificación e Integración IACONDO...');

    // Correrá a las 00:00 del 1 de Enero, 1 de Abril, 1 de Julio, 1 de Octubre.
    cron.schedule('0 0 1 1,4,7,10 *', async () => {
        console.log('[CRON] Ejecutando corte de Temporada de Gamificación...');
        try {
            const pros = await User.find({ role: 'professional', isActive: true });
            let count = 0;
            
            for (const pro of pros) {
               const gamification = pro.gamification || {};
               const keptLevel = gamification.projectedLevel || 1;

               await User.updateOne({ _id: pro._id }, {
                   $set: {
                       'gamification.currentLevel': keptLevel,
                       'gamification.currentSeasonPoints': 0, // Se vacía
                       'gamification.projectedLevel': 1, // Vuelven a ganar el nivel para el prox Trimestre
                       'gamification.lastSeasonReset': new Date()
                   }
               });
               count++;
            }
            console.log(`[CRON] Corte Trimestral Finalizado. ${count} profesionales reiniciados.`);
        } catch (error) {
            console.error('[CRON] Error al ejecutar el corte trimestral:', error);
        }
    }, {
        timezone: "America/Caracas"
    });

    // Sincronización automática periódica de Condominios Activos de IACONDO (cada 6 horas)
    cron.schedule('0 */6 * * *', async () => {
        try {
            const config = await IacondoIntegrationService.getConfig();
            if (config.isActive) {
                console.log('[CRON IACONDO] Sincronizando condominios activos como clientes...');
                const res = await IacondoIntegrationService.pullActiveCondosFromIacondo(config);
                console.log(`[CRON IACONDO] ${res.message}`);
            }
        } catch (error) {
            console.warn('[CRON IACONDO] Aviso en sincronización automática:', error.message);
        }
    });

    // Asegurar alta inicial del condominio configurado unos segundos después de arrancar el servidor
    setTimeout(async () => {
        try {
            const config = await IacondoIntegrationService.getConfig();
            if (config.isActive && config.condoSubdomain) {
                await IacondoIntegrationService.syncCondosBatch([{
                    subdomain: config.condoSubdomain,
                    isActive: true
                }]);
            }
        } catch (err) {
            // Silencioso en caso de que la BD aún esté conectando
        }
    }, 8000);
}

module.exports = initCronJobs;
