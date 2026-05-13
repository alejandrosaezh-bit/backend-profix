const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const User = require('./models/User');
const Job = require('./models/Job');

const cleanImages = async () => {
    try {
        console.log("Starting to clean heavy Base64 images from Database...");

        // 1. CLEAN USERS
        const users = await User.find({});
        let usersUpdated = 0;
        
        for (let user of users) {
            let modified = false;

            // Check avatar
            if (user.avatar && user.avatar.length > 500) {
                user.avatar = null;
                modified = true;
            }

            // Check profiles gallery
            if (user.profiles) {
                for (let [category, profile] of user.profiles.entries()) {
                    if (profile.gallery && profile.gallery.length > 0) {
                        let hasHeavy = false;
                        profile.gallery = profile.gallery.filter(img => {
                            if (img && img.length > 500 && !img.startsWith('http')) {
                                hasHeavy = true;
                                return false; // Remove
                            }
                            return true; // Keep
                        });
                        if (hasHeavy) modified = true;
                    }
                }
            }

            if (modified) {
                await user.save();
                usersUpdated++;
            }
        }
        console.log(`Cleaned heavy images from ${usersUpdated} users.`);

        // 2. CLEAN JOBS
        const jobs = await Job.find({});
        let jobsUpdated = 0;

        for (let job of jobs) {
            let modified = false;

            // Check job images
            if (job.images && job.images.length > 0) {
                let initialLen = job.images.length;
                job.images = job.images.filter(img => !(img && img.length > 500 && !img.startsWith('http')));
                if (job.images.length !== initialLen) modified = true;
            }

            // Check workPhotos
            if (job.workPhotos && job.workPhotos.length > 0) {
                let initialLen = job.workPhotos.length;
                job.workPhotos = job.workPhotos.filter(img => !(img && img.length > 500 && !img.startsWith('http')));
                if (job.workPhotos.length !== initialLen) modified = true;
            }

            // Check projectHistory
            if (job.projectHistory && job.projectHistory.length > 0) {
                for (let event of job.projectHistory) {
                    if (event.images && event.images.length > 0) {
                        let initialLen = event.images.length;
                        event.images = event.images.filter(img => !(img && img.length > 500 && !img.startsWith('http')));
                        if (event.images.length !== initialLen) modified = true;
                    }
                }
            }

            if (modified) {
                await job.save();
                jobsUpdated++;
            }
        }
        console.log(`Cleaned heavy images from ${jobsUpdated} jobs.`);

        console.log("Database cleanup complete!");
        process.exit(0);

    } catch (err) {
        console.error("Error cleaning images:", err);
        process.exit(1);
    }
};

cleanImages();
