const mongoose = require('mongoose');
require('dotenv').config();

async function checkSizes() {
    await mongoose.connect(process.env.MONGO_URI);

    const User = require('./models/User');
    const Job = require('./models/Job');

    console.log('--- USER AVATARS ---');
    const users = await User.find({ avatar: { $exists: true, $ne: null } }).sort({ createdAt: -1 }).limit(10).lean();
    if (users.length === 0) {
        console.log('No users with avatars found.');
    } else {
        users.forEach(u => {
            if (u.avatar && u.avatar.length > 50) {
                const kbSize = (Buffer.from(u.avatar).length / 1024).toFixed(2);
                console.log('User: ' + u.name + ' | Role: ' + u.role + ' | Avatar Size: ' + kbSize + ' KB');
            }
        });
    }

    console.log('\n--- JOB IMAGES ---');
    const jobs = await Job.find({ images: { $exists: true, $not: { $size: 0 } } }).sort({ createdAt: -1 }).limit(10).lean();
    if (jobs.length === 0) {
        console.log('No jobs with images found.');
    } else {
        jobs.forEach(j => {
            let totalKb = 0;
            if (j.images && j.images.length > 0) {
                j.images.forEach((img, idx) => {
                    if (img && img.length > 50) {
                        const kbSize = (Buffer.from(img).length / 1024).toFixed(2);
                        console.log('Job: ' + j.title + ' | Image[' + idx + '] Size: ' + kbSize + ' KB');
                        totalKb += parseFloat(kbSize);
                    }
                });
                console.log('  -> Total Images Size for Job: ' + totalKb.toFixed(2) + ' KB');
            }
        });
    }

    mongoose.disconnect();
}

checkSizes().catch(console.error);
