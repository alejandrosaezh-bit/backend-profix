const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Review = require('../models/Review');
const Job = require('../models/Job');

const cleanupReviews = async () => {
    try {
        console.log("Connecting to DB:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log('MongoDB Connected');

        // Find all reviews
        const reviews = await Review.find({});
        console.log(`Found ${reviews.length} total reviews.`);

        let deletedCount = 0;

        for (const review of reviews) {
            // Check if job exists
            const job = await Job.findById(review.job);
            if (!job) {
                console.log(`Deleting orphan review ${review._id} (Job ${review.job} not found)`);
                await Review.deleteOne({ _id: review._id });
                deletedCount++;
            }
        }

        console.log('-----------------------------------');
        console.log(`Cleanup Complete. Deleted ${deletedCount} orphan reviews.`);
        process.exit();
    } catch (error) {
        console.error('Cleanup Error:', error);
        process.exit(1);
    }
};

cleanupReviews();
