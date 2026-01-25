const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');
const Category = require('../models/Category'); // Add this!
const path = require('path');
const dotenv = require('dotenv');

// Configuración de entorno
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // Find the LATEST job created
        const latestJob = await Job.findOne({}).sort({ createdAt: -1 }).populate('client');
        
        if (!latestJob) {
            console.log("No jobs found.");
            return;
        }

        console.log("\n=== LATEST JOB ANALYSIS ===");
        console.log(`Title: ${latestJob.title}`);
        console.log(`ID: ${latestJob._id}`);
        console.log(`Status: ${latestJob.status}`);
        console.log(`Category: ${latestJob.category}`); // If populated, might show object
        console.log(`Location: ${latestJob.location}`);
        console.log(`Client: ${latestJob.client?.name} (${latestJob.client?._id})`);
        
        // Check Admin User (The one viewing)
        const email = "alejandrosaezh@gmail.com"; 
        const viewer = await User.findOne({ email });
        
        console.log(`\n=== VIEWER ANALYSIS (${viewer.name}) ===`);
        console.log(`Viewer ID: ${viewer._id}`);
        
        // 1. Check Ownership
        if (String(latestJob.client?._id) === String(viewer._id)) {
            console.log("⚠️ WARNING: Viewer IS the Client owner. Frontend logic hides own jobs.");
        } else {
            console.log("✅ Viewer is NOT the owner.");
        }

        // 2. Check Category Match
        // Is category ID or String? Schema says ObjectId ref. 
        // We need the category NAME to compare with profile keys usually.
        // Let's assume we need to populate category to get name if it's an ID
        
        // Re-fetch populated
        const jobPop = await Job.findById(latestJob._id).populate('category');
        const catName = jobPop.category?.name;
        
        console.log(`Job Category Name: ${catName}`);
        
        let viewerProfiles = {};
        if (viewer.profiles instanceof Map) {
             viewer.profiles.forEach((v, k) => viewerProfiles[k] = v); 
        } else {
            viewerProfiles = viewer.profiles;
        }
        
        const hasProfile = viewerProfiles && viewerProfiles[catName] && viewerProfiles[catName].isActive !== false;
        
        if (hasProfile) {
            console.log(`✅ Viewer HAS profile for '${catName}'`);
        } else {
            console.log(`❌ Viewer DOES NOT HAVE active profile for '${catName}'`);
            console.log(`Available profiles: ${Object.keys(viewerProfiles || {})}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
};

run();