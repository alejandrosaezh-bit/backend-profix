
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Path relative to backend/scripts
const Job = require('../models/Job');
const Category = require('../models/Category');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'alejandrosaezhes@gmail.com' });
        
        // Populate exactly as controller does
        let jobs = await Job.find({ client: user._id })
            .populate('client', 'name avatar') 
            .populate('category', 'name color icon') // This is the key line
            .sort({ createdAt: -1 })
            .lean();

        if (jobs.length > 0) {
            console.log("--- BACKEND DB QUERY RESULT ---");
            console.log(JSON.stringify(jobs[0].category, null, 2));
        } else {
            console.log("No jobs found");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}
run();
