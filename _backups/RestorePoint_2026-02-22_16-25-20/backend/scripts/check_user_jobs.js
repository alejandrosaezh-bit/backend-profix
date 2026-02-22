
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Job = require('../models/Job');

dotenv.config();

const checkJobs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const user = await User.findOne({ name: { $regex: 'Alejandro', $options: 'i' } });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log(`User Found: ${user.name} (${user._id})`);

        const jobs = await Job.find({ client: user._id });
        console.log(`Total Jobs: ${jobs.length}`);

        jobs.forEach(j => {
            console.log(`- Job ID: ${j._id} | Title: ${j.title} | Status: ${j.status} | ClientFinished: ${j.clientFinished} | ProFinished: ${j.proFinished}`);
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkJobs();
