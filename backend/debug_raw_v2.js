const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const dumpAllJobs = async () => {
    let client;
    try {
        console.log("Attempting to connect to DB...");
        client = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log("--- DB CONNECTION SUCCESSFUL ---\n");

        const db = mongoose.connection.db;

        console.log("Fetching collections list...");
        const collections = await db.listCollections().toArray();
        console.log("Collections in DB:", collections.map(c => c.name));

        if (!collections.some(c => c.name === 'jobs')) {
            console.log("ERROR: 'jobs' collection NOT FOUND in database!");
            process.exit(0);
        }

        console.log("Fetching jobs...");
        const jobs = await db.collection('jobs').find({}).toArray();
        console.log(`TOTAL JOBS FOUND: ${jobs.length}\n`);

        if (jobs.length > 0) {
            console.log("--- JOB DUMP ---");
            jobs.forEach((j, index) => {
                console.log(`[${index + 1}] ID: ${j._id} | Title: ${j.title} | Status: ${j.status} | ClientID: ${j.client}`);
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
