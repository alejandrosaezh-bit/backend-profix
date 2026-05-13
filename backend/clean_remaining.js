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

const Job = require('./models/Job');

const cleanRemainingImages = async () => {
    try {
        console.log("Starting to clean remaining heavy Base64 images from Jobs...");

        const jobs = await Job.find({});
        let jobsUpdated = 0;

        for (let job of jobs) {
            let modified = false;

            // Check projectHistory.mediaUrl
            if (job.projectHistory && job.projectHistory.length > 0) {
                for (let event of job.projectHistory) {
                    if (event.mediaUrl && event.mediaUrl.length > 500 && !event.mediaUrl.startsWith('http')) {
                        console.log(`Found heavy mediaUrl in Job ${job._id} event ${event.eventType}`);
                        event.mediaUrl = null;
                        modified = true;
                    }
                }
            }

            // Check clientManagement.payments.evidenceUrl
            if (job.clientManagement && job.clientManagement.payments) {
                for (let payment of job.clientManagement.payments) {
                    if (payment.evidenceUrl && payment.evidenceUrl.length > 500 && !payment.evidenceUrl.startsWith('http')) {
                        console.log(`Found heavy payment evidenceUrl in Job ${job._id}`);
                        payment.evidenceUrl = null;
                        modified = true;
                    }
                }
            }

            // Check clientManagement.beforePhotos
            if (job.clientManagement && job.clientManagement.beforePhotos) {
                let initialLen = job.clientManagement.beforePhotos.length;
                job.clientManagement.beforePhotos = job.clientManagement.beforePhotos.filter(photo => {
                    return !(photo.url && photo.url.length > 500 && !photo.url.startsWith('http'));
                });
                if (job.clientManagement.beforePhotos.length !== initialLen) {
                    console.log(`Found heavy beforePhotos in Job ${job._id}`);
                    modified = true;
                }
            }

            // Check clientManagement.appeal.evidence
            if (job.clientManagement && job.clientManagement.appeal && job.clientManagement.appeal.evidence) {
                let initialLen = job.clientManagement.appeal.evidence.length;
                job.clientManagement.appeal.evidence = job.clientManagement.appeal.evidence.filter(img => {
                    return !(img && img.length > 500 && !img.startsWith('http'));
                });
                if (job.clientManagement.appeal.evidence.length !== initialLen) {
                    console.log(`Found heavy appeal evidence in Job ${job._id}`);
                    modified = true;
                }
            }

            if (modified) {
                await job.save();
                jobsUpdated++;
            }
        }
        console.log(`Cleaned remaining heavy images from ${jobsUpdated} jobs.`);

        console.log("Database cleanup 2.0 complete!");
        process.exit(0);

    } catch (err) {
        console.error("Error cleaning images:", err);
        process.exit(1);
    }
};

cleanRemainingImages();
