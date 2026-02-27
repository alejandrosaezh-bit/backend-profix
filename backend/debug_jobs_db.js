const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Job = require('./models/Job');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkStats = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const totalJobs = await Job.countDocuments();
        console.log("Total Jobs in DB:", totalJobs);

        const users = await User.find().limit(10).select('name email role');
        console.log("Sample Users:", users.map(u => `${u.name} (${u.email}) - ${u.role} [${u._id}]`));

        // If you know a specific user email, put it here to debug their jobs
        const targetEmail = 'alejandrosaezh@gmail.com'; // Change if needed
        const user = await User.findOne({ email: new RegExp(targetEmail, 'i') });

        if (user) {
            console.log(`\nChecking jobs for user: ${user.name} [${user._id}]`);
            const created = await Job.find({ client: user._id });
            console.log(`Jobs created as Client: ${created.length}`);
            created.forEach(j => console.log(` - ID: ${j._id}, Title: ${j.title}, Status: ${j.status}`));

            const assigned = await Job.find({ professional: user._id });
            console.log(`Jobs assigned as Pro: ${assigned.length}`);

            const withOffers = await Job.find({ "offers.proId": user._id });
            console.log(`Jobs with my Offers: ${withOffers.length}`);
        } else {
            console.log("\nTarget user not found.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkStats();
