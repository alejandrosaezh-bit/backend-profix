const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://profix_admin:Profix2024@profix-cluster.pfvnq.mongodb.net/profix_db?retryWrites=true&w=majority');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const Job = require('./models/Job');
const User = require('./models/User');

const checkDB = async () => {
    await connectDB();
    try {
        const jobCount = await Job.countDocuments({});
        console.log(`Job Count: ${jobCount}`);

        const userCount = await User.countDocuments({});
        console.log(`User Count: ${userCount}`);

        const jobs = await Job.find({}).select('title status client professional');
        console.log("Sample Jobs:", JSON.stringify(jobs.slice(0, 3), null, 2));

    } catch (error) {
        console.error("DB Check Failed:", error);
    } finally {
        mongoose.connection.close();
    }
};

checkDB();
