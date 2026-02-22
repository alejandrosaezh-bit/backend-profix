const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Intentar cargar .env desde backend/
const envPath = path.resolve(__dirname, '../.env');
console.log(`Cargando .env desde: ${envPath}`);
dotenv.config({ path: envPath });

const Job = require('../models/Job');
const Chat = require('../models/Chat');
const JobInteraction = require('../models/JobInteraction');
const Review = require('../models/Review');
// const User = require('../models/User'); // No borramos usuarios

const run = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error("ERROR: MONGO_URI no está definida en .env");
            process.exit(1);
        }

        console.log('Conectando a MongoDB...');
        await mongoose.connect(uri);
        console.log('Conectado.');

        console.log('--- INICIANDO LIMPIEZA DE OPERACIONES ---');

        // 1. JOBS
        const jobsResult = await Job.deleteMany({});
        console.log(`✅ Jobs eliminados: ${jobsResult.deletedCount}`);

        // 2. CHATS
        const chatsResult = await Chat.deleteMany({});
        console.log(`✅ Chats eliminados: ${chatsResult.deletedCount}`);

        // 3. INTERACTIONS (Ofertas/Postulaciones)
        try {
            const interactionsResult = await JobInteraction.deleteMany({});
            console.log(`✅ JobInteractions eliminados: ${interactionsResult.deletedCount}`);
        } catch (e) {
            console.warn("⚠️ JobInteraction collection podría no existir o error:", e.message);
        }

        // 4. REVIEWS
        const reviewsResult = await Review.deleteMany({});
        console.log(`✅ Reviews eliminados: ${reviewsResult.deletedCount}`);

        console.log('--- LIMPIEZA COMPLETA (Usuarios mantenidos) ---');

    } catch (e) {
        console.error("Error durante limpieza:", e);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

run();
