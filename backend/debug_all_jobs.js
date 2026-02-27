const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Job = require('./models/Job');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkStats = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const allJobs = await Job.find().populate('client', 'name email').lean();
        console.log(`Total Jobs: ${allJobs.length}`);

        allJobs.forEach(j => {
            console.log(`Job: ${j.title} [${j._id}] | Client: ${j.client?.name} (${j.client?.email}) [${j.client?._id}] | Status: ${j.status}`);
            if (j.offers && j.offers.length > 0) {
                console.log(`  Offers: ${j.offers.length}`);
                j.offers.forEach(o => console.log(`    - Pro: ${o.proId} | Status: ${o.status}`));
            }
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkStats();
