const mongoose = require('mongoose');
const Job = require('../models/Job');
const Chat = require('../models/Chat');
const JobInteraction = require('../models/JobInteraction');
const User = require('../models/User'); // Just to count
const path = require('path');
const dotenv = require('dotenv');

// Configuración de entorno
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const jobs = await Job.countDocuments({});
        const chats = await Chat.countDocuments({});
        const interactions = await JobInteraction.countDocuments({});
        const users = await User.countDocuments({});

        console.log("\n=== DATABASE STATUS ===");
        console.log(`Jobs: ${jobs}`);
        console.log(`Chats: ${chats}`);
        console.log(`Interactions: ${interactions}`);
        console.log(`Users: ${users} (Should preserve these)`);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
};

run();