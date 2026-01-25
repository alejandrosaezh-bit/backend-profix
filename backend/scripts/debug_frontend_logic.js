const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');
const Category = require('../models/Category'); // Import Category model
const path = require('path');
const dotenv = require('dotenv');

// Configuración de entorno
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const targetEmail = "alejandrosaezh@gmail.com"; 
        const currentUser = await User.findOne({ email: targetEmail });

        if (!currentUser) {
            console.log("User not found");
            return;
        }

        console.log(`\n=== DEBUGGING USER: ${currentUser.name} (${currentUser._id}) ===`);
        console.log(`Role: ${currentUser.role}`);
        
        // Mimic Frontend Profile Deserialization (if it was a map)
        let profilesObj = {};
        if (currentUser.profiles instanceof Map) {
             currentUser.profiles.forEach((v, k) => profilesObj[k] = v); // toObject() if needed
        } else {
            profilesObj = currentUser.profiles;
        }
        console.log("Profiles Keys:", Object.keys(profilesObj || {}));


        const activeCategories = profilesObj
            ? Object.keys(profilesObj).filter(k => profilesObj[k].isActive !== false)
            : [];
        console.log("Active Categories:", activeCategories);

        const allJobs = await Job.find({}).populate('client').populate('category'); // Mimic loadRequests fetching everything (Pro mode)
        
        console.log(`\nFetched ${allJobs.length} total jobs from DB.`);

        // --- 1. TEST CLIENT FILTER ---
        console.log("\n--- TEST: CLIENT LIST FILTER ---");
        const myClientRequests = allJobs.filter(r => {
            const clientId = r.client?._id || r.client;
            const currentUserId = currentUser._id;
            
            // Equality Check
            const matchId = String(clientId) === String(currentUserId);
            
            if (matchId) {
                console.log(`[MATCH] Job ${r.title} matches Client ID`);
            }
            return matchId;
        });
        console.log(`> Result: Client List would show ${myClientRequests.length} jobs.`);


        // --- 2. TEST PRO FILTER ---
        console.log("\n--- TEST: PRO LIST FILTER ---");
        
        const matchingJobs = allJobs.filter(r => {
             // Own job check
             const clientId = r.client?._id || r.client;
             if (String(clientId) === String(currentUser._id)) {
                 console.log(`[SKIP] Job ${r.title} is OWN job`);
                 return false;
             }

             if (r.status === 'canceled' || r.status === 'Cerrada') return false;

             if (activeCategories.length === 0) {
                 console.log(`[SKIP] Job ${r.title} - No active categories`);
                 return false;
             }
             
             // Category Match
             const jobCatName = r.category?.name || r.category; // DB populates name? Wait, category is Ref.
             // If populated, r.category is Obj. name is inside.
             // If local app.js maps it: `job.category?.name || 'General'`
             // Let's assume r.category.name is what we compare against `activeCategories` (which are names)
             
             if (!activeCategories.includes(jobCatName)) {
                 console.log(`[SKIP] Job ${r.title} - Category Mismatch (${jobCatName} vs ${activeCategories.join(',')})`);
                 return false;
             }
             
             // Zone Check (Simplified)
             // ... skipping complex zone regex for now, assuming empty zones = match
             return true;
        });

        console.log(`> Result: Pro List would show ${matchingJobs.length} jobs.`);
        if (matchingJobs.length > 0) {
            matchingJobs.forEach(j => {
                const isMyHistory = String(j.client?._id) === String(currentUser._id) || (j.offers && j.offers.some(o => String(o.proId) === String(currentUser._id)));
                console.log(`  - ${j.title} [${j.status}] (Cat: ${j.category?.name}) - IsMyHistory: ${isMyHistory}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
};

run();