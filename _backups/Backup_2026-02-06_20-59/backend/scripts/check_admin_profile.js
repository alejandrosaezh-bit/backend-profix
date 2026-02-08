const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
const dotenv = require('dotenv');

// Configuración de entorno
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const email = "alejandrosaezh@gmail.com"; // The admin user from the screenshot
        const user = await User.findOne({ email });

        if (!user) {
            console.log("User not found!");
            return;
        }

        console.log(`User: ${user.name}`);
        console.log(`Role: ${user.role}`);
        console.log(`Profiles Type: ${typeof user.profiles}`);
        
        let profileCount = 0;
        if (user.profiles) {
            if (user.profiles instanceof Map) {
                profileCount = user.profiles.size;
                console.log("Profiles (Map keys):", Array.from(user.profiles.keys()));
            } else {
                profileCount = Object.keys(user.profiles).length;
                console.log("Profiles (Object keys):", Object.keys(user.profiles));
            }
        }
        console.log(`Profile Count: ${profileCount}`);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
};

run();