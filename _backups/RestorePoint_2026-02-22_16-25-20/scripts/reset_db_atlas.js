
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../backend/models/User');
const Job = require('../backend/models/Job');
const Chat = require('../backend/models/Chat');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

// URL de conexión directa si no carga del .env (para asegurar)
// IMPORTANTE: Asegúrate de que esta URI sea la correcta de tu MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;

const resetDatabase = async () => {
    try {
        if (!MONGO_URI) {
            throw new Error("MONGO_URI no está definida. Revisa tu archivo .env");
        }

        console.log('Conectando a MongoDB Atlas...');
        await mongoose.connect(MONGO_URI);
        console.log('Conectado exitosamente.');

        console.log('--- INICIANDO LIMPIEZA ---');

        // 1. Borrar Usuarios
        const deletedUsers = await User.deleteMany({});
        console.log(`Usuarios eliminados: ${deletedUsers.deletedCount}`);

        // 2. Borrar Trabajos (Opcional, pero recomendado para consistencia)
        const deletedJobs = await Job.deleteMany({});
        console.log(`Trabajos eliminados: ${deletedJobs.deletedCount}`);

        // 3. Borrar Chats (Opcional)
        const deletedChats = await Chat.deleteMany({});
        console.log(`Chats eliminados: ${deletedChats.deletedCount}`);

        console.log('--- LIMPIEZA COMPLETADA ---');
        console.log('La base de datos está limpia. Ahora puedes registrar usuarios desde cero.');

        process.exit(0);
    } catch (error) {
        console.error('Error fatal:', error);
        process.exit(1);
    }
};

resetDatabase();
