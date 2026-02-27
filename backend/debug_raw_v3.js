const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const dumpAllJobs = async () => {
    try {
        console.log("Attempting to connect to DB...");
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log("--- DB CONNECTION SUCCESSFUL ---\n");

        const db = mongoose.connection.db;

        // Use direct collection name
        const jobs = await db.collection('jobs').find({}).limit(5).toArray();
        console.log(`TOTAL JOBS FOUND: ${jobs.length}\n`);

        if (jobs.length > 0) {
            console.log("--- SAMPLED JOBS ---");
            jobs.forEach((j, index) => {
                console.log(`[${index + 1}] ID: ${j._id} | Title: ${j.title} | Status: ${j.status}`);
            });
        } else {
            console.log("Database contains 0 jobs.");
        }

        process.exit(0);
    } catch (err) {
        console.error("--- ERROR ---");
        console.error(err.message);
        process.exit(1);
    }
};

dumpAllJobs();
