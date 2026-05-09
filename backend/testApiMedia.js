const fetch = require('node-fetch'); // Since Node 18 fetch is built-in, but just in case
require('dotenv').config();

const run = async () => {
    // Generate a valid token for a user that has jobs
    const mongoose = require('mongoose');
    const jwt = require('jsonwebtoken');
    const User = require('./models/User');

    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // Find a client with jobs
    const Job = require('./models/Job');
    const job = await Job.findOne({ status: { $in: ['Finalizada', 'Cerrado', 'Cerrada', 'TERMINADO', 'rated', 'completed', 'Culminada'] } }).lean();
    
    if (!job) {
        console.log("No completed jobs found");
        process.exit(0);
    }

    console.log("Found job", job._id, "Client:", job.client);
    
    const token = jwt.sign({ id: job.client }, process.env.JWT_SECRET || 'Clave2025profix', { expiresIn: '30d' });

    // Now test the API
    const filters = { role: 'client', include_media: 'true' };
    const t = new Date().getTime();
    const queryString = new URLSearchParams({ ...filters, t }).toString();
    const url = `http://localhost:5000/api/jobs/me?${queryString}`;
    
    console.log("Fetching", url);
    const res = await global.fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await res.json();
    
    // Check if the first job has media
    if (data && data.length > 0) {
        const testJob = data.find(j => j._id.toString() === job._id.toString()) || data[0];
        console.log(`Job ID: ${testJob._id}`);
        console.log(`Has images array?`, !!testJob.images, `Length:`, testJob.images ? testJob.images.length : 0);
        console.log(`Has projectHistory array?`, !!testJob.projectHistory, `Length:`, testJob.projectHistory ? testJob.projectHistory.length : 0);
    } else {
        console.log("No data returned");
    }

    process.exit(0);
}
run().catch(console.error);
