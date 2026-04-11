const cron = require('node-cron');
const User = require('../models/User');

function initCronJobs() {
    console.log('[CRON] Iniciando schedulers de Gamificación...');

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
        timezone: "America/Bogota" // Ajusta según la zona horaria del servidor
    });
}

module.exports = initCronJobs;
