const mongoose = require('mongoose');
require('dotenv').config();

async function count() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = mongoose.connection.db.collection('users');
        const Job = mongoose.connection.db.collection('jobs');

        const userCount = await User.countDocuments();
        const jobCount = await Job.countDocuments();
        const categoryCount = await mongoose.connection.db.collection('categories').countDocuments();

        console.log(`Users: ${userCount}`);
        console.log(`Jobs: ${jobCount}`);
        console.log(`Categories: ${categoryCount}`);

        if (jobCount > 0) {
            const sampleJob = await Job.findOne();
            console.log("Sample Job:", JSON.stringify(sampleJob, null, 2).substring(0, 500));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
count();
