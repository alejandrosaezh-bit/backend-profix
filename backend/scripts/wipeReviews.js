const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Review = require('../models/Review');

const wipeReviews = async () => {
    try {
        await connectDB();
        console.log("Connected to DB...");
        const res = await Review.deleteMany({});
        console.log(`Deleted ${res.deletedCount} reviews.`);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

wipeReviews();
