const mongoose = require('mongoose');
require('dotenv').config();

const Job = require('../models/Job');
const Chat = require('../models/Chat');
const JobInteraction = require('../models/JobInteraction');
const Review = require('../models/Review');

const run = async () => {
    try {
        const uri = 'mongodb+srv://dbconexta:Clave2025profix@conecta.jmuojga.mongodb.net/profix?appName=Conecta';
        await mongoose.connect(uri);
        console.log('Connected to DB for CLEANUP');

        // DELETE JOBS
        const jobsResult = await Job.deleteMany({});
        console.log(`Deleted ${jobsResult.deletedCount} Jobs.`);

        // DELETE CHATS
        const chatsResult = await Chat.deleteMany({});
        console.log(`Deleted ${chatsResult.deletedCount} Chats.`);

        // DELETE INTERACTIONS
        try {
            const interactionsResult = await JobInteraction.deleteMany({});
            console.log(`Deleted ${interactionsResult.deletedCount} JobInteractions.`);
        } catch (e) {
            console.log("JobInteraction model might not exist or empty.");
        }

        // DELETE REVIEWS
        const reviewsResult = await Review.deleteMany({});
        console.log(`Deleted ${reviewsResult.deletedCount} Reviews.`);

        console.log("Cleanup Complete. Users were NOT deleted.");

    } catch (e) {
        console.error("Cleanup Error:", e);
    } finally {
        mongoose.connection.close();
    }
};

run();
