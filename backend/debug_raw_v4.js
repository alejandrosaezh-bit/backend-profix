const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const dumpAllJobs = async () => {
    try {
        console.log("Attempting to connect to DB...");
        // Use a much longer timeout or different connection strategies for slow networks
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            heartbeatFrequencyMS: 2000
        });
        console.log("--- DB CONNECTION SUCCESSFUL ---\n");

        const db = mongoose.connection.db;

        // Fetch categories to show the link between jobs and categories
        const categories = await db.collection('categories').find({}).toArray();
        const catMap = categories.reduce((acc, c) => ({ ...acc, [String(c._id)]: c.name }), {});

        // Fetch just IDs and basic info to be fast
        const jobs = await db.collection('jobs').find({}).project({
            title: 1,
            status: 1,
            client: 1,
            category: 1,
            createdAt: 1
        }).limit(20).toArray();

        console.log(`TOTAL JOBS FOUND: ${jobs.length}\n`);

        if (jobs.length > 0) {
            console.log("--- JOB SUMMARY ---");
            jobs.forEach((j, index) => {
                const catName = catMap[String(j.category)] || j.category || 'N/A';
                console.log(`[${index + 1}] ID: ${j._id} | Cat: ${catName} | Title: ${j.title} | Status: ${j.status} | Client: ${j.client}`);
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
