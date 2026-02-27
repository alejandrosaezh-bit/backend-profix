const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkStats = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const jobs = await mongoose.connection.db.collection('jobs').find({}).toArray();
        console.log(`Total Jobs Raw: ${jobs.length}`);

        jobs.forEach(j => {
            console.log(`Job: ${j.title} | Client: ${j.client} | Status: ${j.status}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkStats();
