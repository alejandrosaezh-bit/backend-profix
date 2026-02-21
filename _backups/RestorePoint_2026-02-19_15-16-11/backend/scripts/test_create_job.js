
const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');
const Category = require('../models/Category');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Get a client user
        const client = await User.findOne({ email: 'alejandrosaezhes@gmail.com' });
        if (!client) {
            console.log('No client found to create job');
            return;
        }

        // 2. Get a category
        const category = await Category.findOne();
        if (!category) {
            console.log('No category found');
            return;
        }

        // 3. Create Job Data (Simulating frontend payload)
        const jobData = {
            client: client._id,
            title: "Test Job Title Explicit",
            description: "Test Description Explicit",
            category: category._id,
            subcategory: "General",
            location: "Calle Falsa 123",
            budget: 50000,
            images: []
        };

        // 4. Save
        const job = new Job(jobData);
        await job.save();

        console.log('Job created successfully:', job._id);
        console.log('Data saved:', job);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.connection.close();
    }
}

run();
