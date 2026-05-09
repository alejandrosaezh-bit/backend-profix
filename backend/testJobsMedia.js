require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/Job');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to DB.");

        let excludedFieldsClient = '-conversations -clientManagement';
        // Simulate include_media !== 'true'
        let include_media = 'true';
        if (include_media !== 'true') {
            excludedFieldsClient += ' -images -workPhotos -projectHistory';
        }

        const clientJobs = await Job.find({ status: { $in: ['Finalizada', 'Cerrado', 'Cerrada', 'TERMINADO', 'rated', 'completed', 'Culminada'] } })
            .select(excludedFieldsClient)
            .limit(1)
            .lean();

        console.log(JSON.stringify(clientJobs, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
