require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Chat = require('../models/Chat');
const Review = require('../models/Review');
const AppMessage = require('../models/AppMessage');
const JobInteraction = require('../models/JobInteraction');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || "Coloca la URI si dotenv falla en este directorio";

mongoose.connect(MONGO_URI).then(async () => {
    console.log('Conectado a la base de datos de pruebas.');
    try {
        // 1. Delete all transactional data
        console.log('Borrando Solicitudes (Jobs)...');
        const deletedJobs = await Job.deleteMany({});
        console.log(`Eliminados ${deletedJobs.deletedCount} Jobs.`);

        console.log('Borrando Chats y Mensajes...');
        const deletedChats = await Chat.deleteMany({});
        console.log(`Eliminados ${deletedChats.deletedCount} Chats.`);

        console.log('Borrando Valoraciones (Reviews)...');
        const deletedReviews = await Review.deleteMany({});
        console.log(`Eliminadas ${deletedReviews.deletedCount} Reviews.`);

        console.log('Borrando Interacciones de Trabajo (JobInteractions)...');
        if (JobInteraction) {
            const deletedInteractions = await JobInteraction.deleteMany({});
            console.log(`Eliminadas ${deletedInteractions.deletedCount} Interacciones.`);
        }

        console.log('Borrando AppMessages (Notificaciones Internas)...');
        const deletedAppMessages = await AppMessage.deleteMany({});
        console.log(`Eliminados ${deletedAppMessages.deletedCount} AppMessages.`);

        // 2. Reset Users (but keep the documents)
        console.log('Restableciendo atributos de usuarios...');
        const updatedUsers = await User.updateMany({}, {
            $set: { rating: 0, reviewsCount: 0 }
        });
        console.log(`Actualizados ${updatedUsers.modifiedCount} Usuarios (ratings y reviews en 0).`);

        console.log('\n--- LIMPIEZA FINALIZADA CON ÉXITO ---');
        console.log('Solo las cuentas de usuarios (y sus perfiles base) han quedado intactas.');
    } catch (error) {
        console.error('Error durante la limpieza:', error);
    } finally {
        process.exit(0);
    }
}).catch((error) => {
    console.error('Error al conectar con Mongoose:', error);
    process.exit(1);
});
