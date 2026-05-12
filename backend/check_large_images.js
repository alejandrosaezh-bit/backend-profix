require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Job = require('./models/Job');

const MAX_SIZE_CHARS = 666666; // Approx 500KB in base64 (500,000 * 4/3)

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to DB");

        let largeImagesFound = 0;

        // Check Users
        const users = await User.find({}).lean();
        console.log(`Checking ${users.length} users...`);
        for (const user of users) {
            if (user.avatar && user.avatar.length > MAX_SIZE_CHARS) {
                console.log(`User ${user._id} (${user.name}) has large avatar: ${(user.avatar.length / 1024 / 1024).toFixed(2)} MB`);
                largeImagesFound++;
            }
            if (user.image && user.image.length > MAX_SIZE_CHARS) {
                console.log(`User ${user._id} (${user.name}) has large image: ${(user.image.length / 1024 / 1024).toFixed(2)} MB`);
                largeImagesFound++;
            }
            if (user.profiles) {
                for (const catKey in user.profiles) {
                    const profile = user.profiles[catKey];
                    if (profile.gallery && Array.isArray(profile.gallery)) {
                        profile.gallery.forEach((img, i) => {
                            if (img && img.length > MAX_SIZE_CHARS) {
                                console.log(`User ${user._id} (${user.name}) has large gallery image at ${catKey}[${i}]: ${(img.length / 1024 / 1024).toFixed(2)} MB`);
                                largeImagesFound++;
                            }
                        });
                    }
                }
            }
        }

        // Check Jobs
        const jobs = await Job.find({}).lean();
        console.log(`Checking ${jobs.length} jobs...`);
        for (const job of jobs) {
            if (job.images && Array.isArray(job.images)) {
                job.images.forEach((img, i) => {
                    if (img && img.length > MAX_SIZE_CHARS) {
                        console.log(`Job ${job._id} (${job.title}) has large images[${i}]: ${(img.length / 1024 / 1024).toFixed(2)} MB`);
                        largeImagesFound++;
                    }
                });
            }
            if (job.workPhotos && Array.isArray(job.workPhotos)) {
                job.workPhotos.forEach((img, i) => {
                    if (img && img.length > MAX_SIZE_CHARS) {
                        console.log(`Job ${job._id} (${job.title}) has large workPhotos[${i}]: ${(img.length / 1024 / 1024).toFixed(2)} MB`);
                        largeImagesFound++;
                    }
                });
            }
            if (job.projectHistory && Array.isArray(job.projectHistory)) {
                job.projectHistory.forEach((ev, i) => {
                    if (ev.mediaUrl && ev.mediaUrl.length > MAX_SIZE_CHARS) {
                        console.log(`Job ${job._id} (${job.title}) has large projectHistory[${i}]: ${(ev.mediaUrl.length / 1024 / 1024).toFixed(2)} MB`);
                        largeImagesFound++;
                    }
                });
            }
        }

        console.log(`Finished checking. Found ${largeImagesFound} large images (>500KB).`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
