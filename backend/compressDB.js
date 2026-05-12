require('dotenv').config();
const mongoose = require('mongoose');
const Jimp = require('jimp');
const User = require('./models/User');
const Job = require('./models/Job');
const Chat = require('./models/Chat');

const COMPRESS_THRESHOLD = 100000; // 100KB (base64 string length)

const compressBase64Image = async (base64String, maxWidth = 800, quality = 30) => {
    if (!base64String || typeof base64String !== 'string' || !base64String.startsWith('data:image')) {
        return base64String;
    }
    
    try {
        const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return base64String;

        const imageBuffer = Buffer.from(matches[2], 'base64');
        const image = await Jimp.read(imageBuffer);
        
        if (image.bitmap.width > maxWidth) {
            image.resize(maxWidth, Jimp.AUTO);
        }
        
        image.quality(quality);
        const mime = Jimp.MIME_JPEG;
        const newBase64 = await image.getBase64Async(mime);
        return newBase64;
    } catch (e) {
        console.error("Error compressing image:", e.message);
        return base64String;
    }
};

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to DB.");

        let totalCompressed = 0;
        let totalSavedBytes = 0;

        // 1. PROCESS USERS
        const users = await User.find({});
        console.log(`Checking ${users.length} users...`);
        for (const user of users) {
            let modified = false;

            // Avatar
            if (user.avatar && user.avatar.length > COMPRESS_THRESHOLD) {
                console.log(`User ${user._id} avatar is ${user.avatar.length} bytes. Compressing...`);
                const oldLen = user.avatar.length;
                user.avatar = await compressBase64Image(user.avatar, 200, 30);
                totalSavedBytes += (oldLen - user.avatar.length);
                modified = true;
                totalCompressed++;
            }

            // Profiles map
            if (user.profiles && user.profiles instanceof Map) {
                for (let [category, profile] of user.profiles) {
                    if (profile.gallery && Array.isArray(profile.gallery)) {
                        for (let i = 0; i < profile.gallery.length; i++) {
                            const img = profile.gallery[i];
                            if (img && img.length > COMPRESS_THRESHOLD) {
                                console.log(`User ${user._id} profile ${category} gallery item ${i} is ${img.length} bytes. Compressing...`);
                                const oldLen = img.length;
                                profile.gallery[i] = await compressBase64Image(img, 800, 30);
                                totalSavedBytes += (oldLen - profile.gallery[i].length);
                                modified = true;
                                totalCompressed++;
                            }
                        }
                    }
                }
            }

            if (modified) {
                user.markModified('profiles');
                await user.save();
            }
        }

        // 2. PROCESS JOBS
        const jobs = await Job.find({});
        console.log(`Checking ${jobs.length} jobs...`);
        for (const job of jobs) {
            let modified = false;

            // Images
            if (job.images && Array.isArray(job.images)) {
                for (let i = 0; i < job.images.length; i++) {
                    const img = job.images[i];
                    if (img && img.length > COMPRESS_THRESHOLD) {
                        console.log(`Job ${job._id} image ${i} is ${img.length} bytes. Compressing...`);
                        const oldLen = img.length;
                        job.images[i] = await compressBase64Image(img, 800, 30);
                        totalSavedBytes += (oldLen - job.images[i].length);
                        modified = true;
                        totalCompressed++;
                    }
                }
            }

            // WorkPhotos
            if (job.workPhotos && Array.isArray(job.workPhotos)) {
                for (let i = 0; i < job.workPhotos.length; i++) {
                    const img = job.workPhotos[i];
                    if (img && img.length > COMPRESS_THRESHOLD) {
                        console.log(`Job ${job._id} workPhoto ${i} is ${img.length} bytes. Compressing...`);
                        const oldLen = img.length;
                        job.workPhotos[i] = await compressBase64Image(img, 800, 30);
                        totalSavedBytes += (oldLen - job.workPhotos[i].length);
                        modified = true;
                        totalCompressed++;
                    }
                }
            }

            // ProjectHistory
            if (job.projectHistory && Array.isArray(job.projectHistory)) {
                for (let i = 0; i < job.projectHistory.length; i++) {
                    const ev = job.projectHistory[i];
                    if (ev.mediaUrl && ev.mediaUrl.length > COMPRESS_THRESHOLD) {
                        console.log(`Job ${job._id} projectHistory item ${i} is ${ev.mediaUrl.length} bytes. Compressing...`);
                        const oldLen = ev.mediaUrl.length;
                        ev.mediaUrl = await compressBase64Image(ev.mediaUrl, 800, 30);
                        totalSavedBytes += (oldLen - ev.mediaUrl.length);
                        modified = true;
                        totalCompressed++;
                    }
                }
            }

            if (modified) {
                await job.save();
            }
        }

        console.log(`\n\nCOMPRESSION COMPLETE!`);
        console.log(`Total images compressed: ${totalCompressed}`);
        console.log(`Total storage saved: ${(totalSavedBytes / 1024 / 1024).toFixed(2)} MB`);

        process.exit(0);
    } catch (e) {
        console.error("Script error:", e);
        process.exit(1);
    }
};

run();
