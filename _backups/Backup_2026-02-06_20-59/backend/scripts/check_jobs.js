const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Configuración de entorno
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const Job = require('../models/Job');

const run = async () => {
    try {
        console.log('Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado.');

        // Buscar los últimos 5 trabajos
        const jobs = await Job.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('client', 'name email');

        console.log(`\n--- ÚLTIMOS ${jobs.length} TRABAJOS ---`);
        
        if (jobs.length === 0) {
            console.log("No se encontraron trabajos. La base de datos de Jobs está vacía.");
        } else {
            jobs.forEach((j, i) => {
                console.log(`\n[${i+1}] ID: ${j._id}`);
                console.log(`    Título: ${j.title}`);
                console.log(`    Estado: ${j.status}`);
                console.log(`    Cliente: ${j.client ? j.client.email : 'N/A'} (ID: ${j.client ? j.client._id : 'N/A'})`);
                console.log(`    Creado: ${j.createdAt}`);
            });
        }
        
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

run();
