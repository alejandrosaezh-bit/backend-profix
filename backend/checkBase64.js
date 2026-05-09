require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/Job');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

        const job = await Job.findOne({ status: { $in: ['Finalizada', 'Cerrado', 'Cerrada', 'TERMINADO', 'rated', 'completed', 'Culminada'] } }).lean();
        
        if (job.images && job.images.length > 0) {
            console.log("Image length:", job.images[0].length);
            console.log("Starts with:", job.images[0].substring(0, 50));
        }

        if (job.projectHistory && job.projectHistory.length > 0) {
            const ev = job.projectHistory.find(e => e.mediaUrl);
            if (ev) {
                console.log("Project history media length:", ev.mediaUrl.length);
                console.log("Starts with:", ev.mediaUrl.substring(0, 50));
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
