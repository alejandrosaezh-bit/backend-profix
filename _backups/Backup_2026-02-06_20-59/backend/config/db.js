const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log("Intentando conectar a DB...");
        
        // Verificamos si la variable existe (para depurar)
        if (!process.env.MONGO_URI) {
            console.error("¡ERROR CRÍTICO! La variable MONGO_URI no está definida.");
            process.exit(1);
        }

        // Conexión directa SIN fallback a localhost
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error de conexión: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;