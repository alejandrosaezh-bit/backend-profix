
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Category = require('../models/Category'); // Need to register model
require('dotenv').config({ path: 'backend/.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const jobs = await Job.find().populate('category');
        console.log(`Found ${jobs.length} jobs.`);

        jobs.forEach(j => {
            console.log('Job ID:', j._id);
            console.log('Title:', j.title);
            console.log('Category Field Type:', typeof j.category);
            console.log('Category Value:', j.category);
            if (j.category && j.category.name) {
                console.log('Category Name:', j.category.name);
            } else {
                console.log('Category Name MISSING or Populate FAILED');
            }
            console.log('---');
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}
run();
