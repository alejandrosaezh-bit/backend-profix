const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const dumpAllJobs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("--- DB CONNECTION SUCCESSFUL ---\n");

        const jobs = await mongoose.connection.db.collection('jobs').find({}).toArray();
        const users = await mongoose.connection.db.collection('users').find({}).toArray();

        const userMap = users.reduce((acc, u) => ({ ...acc, [String(u._id)]: u.email || u.name }), {});

        console.log(`TOTAL JOBS FOUND: ${jobs.length}\n`);

        jobs.forEach((j, index) => {
            const clientName = userMap[String(j.client)] || j.client || 'Unknown';
            const proName = j.professional ? (userMap[String(j.professional)] || j.professional) : 'Unassigned';

            console.log(`[${index + 1}] JOB ID: ${j._id}`);
            console.log(`    Title: ${j.title}`);
            console.log(`    Status: ${j.status}`);
            console.log(`    Client (ID/Email): ${j.client} / ${clientName}`);
            console.log(`    Professional: ${proName}`);
            console.log(`    Offers Count: ${j.offers ? j.offers.length : 0}`);
            if (j.offers && j.offers.length > 0) {
                j.offers.forEach((o, i) => {
                    console.log(`       - Offer ${i + 1}: ProID ${o.proId} | Status: ${o.status}`);
                });
            }
            console.log(`    Created At: ${j.createdAt}`);
            console.log('-------------------------------------------');
        });

        process.exit(0);
    } catch (err) {
        console.error("--- DB CONNECTION ERROR ---");
        console.error(err);
        process.exit(1);
    }
};

dumpAllJobs();
