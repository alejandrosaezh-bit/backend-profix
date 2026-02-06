const mongoose = require('mongoose');
require('dotenv').config();

async function checkDbStats() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Conectado a MongoDB...');

        const admin = mongoose.connection.db.admin();
        const stats = await mongoose.connection.db.stats();

        console.log('--- Estadísticas de la Base de Datos ---');
        console.log(`Nombre DB: ${stats.db}`);
        console.log(`Colecciones: ${stats.collections}`);
        console.log(`Objetos: ${stats.objects}`);
        console.log(`Tamaño de datos (en MB): ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Tamaño de almacenamiento (en MB): ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Tamaño de índices (en MB): ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Tamaño total (en MB): ${((stats.storageSize + stats.indexSize) / 1024 / 1024).toFixed(2)} MB`);

        // Para Atlas Free Tier (M0), el límite suele ser 512 MB.
        const limitMB = 512;
        const totalUsed = (stats.storageSize + stats.indexSize) / 1024 / 1024;
        const percent = (totalUsed / limitMB) * 100;

        console.log(`\nEstimación para Atlas M0 (512MB): ${percent.toFixed(2)}% ocupado`);

        process.exit(0);
    } catch (err) {
        console.error('Error al conectar o consultar stats:', err);
        process.exit(1);
    }
}

checkDbStats();
