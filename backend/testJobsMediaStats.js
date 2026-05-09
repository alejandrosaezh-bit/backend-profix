require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/Job');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

        const jobs = await Job.find({ status: { $in: ['Finalizada', 'Cerrado', 'Cerrada', 'TERMINADO', 'rated', 'completed', 'Culminada'] } })
            .select('professional client')
            .lean();

        console.log(jobs);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
