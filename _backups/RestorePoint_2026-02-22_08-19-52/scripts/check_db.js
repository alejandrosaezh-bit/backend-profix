const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../backend/models/Category');

dotenv.config({ path: './backend/.env' });

const checkDB = async () => {
    try {
        console.log("Intentando conectar a MongoDB...");
        console.log("URI:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("¡Conexión Exitosa!");

        const count = await Category.countDocuments();
        console.log(`Total de Categorías en DB: ${count}`);

        const categories = await Category.find({});
        console.log("Categorías encontradas:", categories);

    } catch (error) {
        console.error("Error de conexión o consulta:", error);
    } finally {
        mongoose.connection.close();
    }
};

checkDB();