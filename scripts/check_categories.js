console.log("Iniciando script...");
const mongoose = require('../backend/node_modules/mongoose');
const dotenv = require('dotenv');
const Category = require('../backend/models/Category');

dotenv.config({ path: './backend/.env' });

const checkDB = async () => {
    try {
        console.log("Conectando...");
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("Conectado.");

        const count = await Category.countDocuments();
        console.log(`Total Categorías: ${count}`);

        const allCats = await Category.find({});
        console.log("Categorías encontradas:", JSON.stringify(allCats, null, 2));

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkDB();