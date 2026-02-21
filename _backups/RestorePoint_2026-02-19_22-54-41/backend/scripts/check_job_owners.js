const mongoose = require('mongoose');
const Job = require('../models/Job');
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

        const jobs = await Job.find({}).populate('client', 'name email').limit(10);
        console.log(`Found ${jobs.length} jobs.`);
        
        jobs.forEach(j => {
            console.log(`Job: ${j.title} (${j.status}) - Client: ${j.client?.name} (${j.client?.email}) [ID: ${j.client?._id}]`);
        });

        // Check specific user
        const email = "alejandrosaezh@gmail.com";
        const me = await User.findOne({ email });
        if(me) {
            console.log(`\nChecking for user: ${me.name} (${me._id})`);
            const myJobs = await Job.find({ client: me._id });
            console.log(`> My Created Jobs (Client): ${myJobs.length}`);
            
            const myOffers = await Job.find({ "offers.proId": me._id });
            console.log(`> My Offers (Pro): ${myOffers.length}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
};

run();