const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');
const Category = require('../models/Category');
const path = require('path');
const dotenv = require('dotenv');

// Configuración de entorno
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Add logic to check location matching similar to app.js
const LOCATIONS_DATA = {
    "Gran Caracas": ["Libertador", "Chacao", "Baruta", "Sucre", "El Hatillo", "Caracas"],
    "Altos Mirandinos": ["Los Teques", "San Antonio", "Carrizal"],
    "Guarenas-Guatire": ["Guarenas", "Guatire"],
    "La Guaira": ["La Guaira", "Maiquetía", "Catia La Mar"],
    "Valles del Tuy": ["Charallave", "Cúa", "Ocumare"]
};

const checkVisibility = async () => {
    // await connectDB(); // Removing this as we connect manually below using process.env.MONGO_URI
    
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // 1. Get the Professional User
        // Assuming we are looking for the user you are logged in as. 
        // Since I don't know the ID, I'll list all professionals and you can identify.
        // Or better, I will check 4-5 professionals.
        
        const pros = await User.find({ role: 'professional' }).limit(5);

        console.log(`\n=== CHECKING VISIBILITY FOR ${pros.length} PROFESSIONALS ===`);

        const jobs = await Job.find({ status: { $in: ['active', 'open'] } }).populate('category');
        console.log(`Found ${jobs.length} ACTIVE/OPEN jobs in DB.`);

        for (const pro of pros) {
            console.log(`\n--- PRO: ${pro.name} (${pro.email}) ---`);
            console.log(`ID: ${pro._id}`);
            
            // Correctly access profiles (Map)
            let proCategories = [];
            if (pro.profiles) {
                if (pro.profiles instanceof Map) {
                     pro.profiles.forEach((val, key) => {
                         if (val.isActive !== false) proCategories.push({ name: key, ...val.toObject() });
                     });
                } else {
                     // If it's an object
                     Object.keys(pro.profiles).forEach(key => {
                         const val = pro.profiles[key];
                         if (val.isActive !== false) proCategories.push({ name: key, ...val });
                     });
                }
            }

            if (proCategories.length === 0) {
                console.log("❌ NO ACTIVE CATEGORIES in profile. Will see 0 jobs.");
                continue;
            }

            console.log("Pro Categories:", proCategories.map(c => `${c.name} (Zones: [${c.zones?.join(', ')}])`));

            let visibleCount = 0;
            for (const job of jobs) {
                // Check OWNER
                const isOwner = (job.client && job.client.toString() === pro._id.toString());
                if (isOwner) {
                     console.log(`  ❌ Hidden Job (OWNER): ${job.title}`);
                     continue;
                }

                // Logic match
                const jobCatName = job.category ? job.category.name : "Uncategorized";
                const jobLocation = job.location || "";
                
                const catProfile = proCategories.find(c => c.name === jobCatName);
                
                let visibilityReason = "";
                let isVisible = false;

                if (!catProfile) {
                    visibilityReason = `Mismatch Category: Job(${jobCatName}) vs Pro(${proCategories.map(c=>c.name).join(',')})`;
                } else {
                    // Zone Check
                    if (!catProfile.zones || catProfile.zones.length === 0) {
                         isVisible = true; 
                         visibilityReason = "Category Matches (No zones restricted)";
                    } else {
                        // Check zones
                         const matchesZone = catProfile.zones.some(z => {
                            const normLoc = jobLocation.toLowerCase();
                            const normZone = z.toLowerCase();

                            if (normLoc.includes(normZone) || normZone.includes(normLoc)) return true;
                            if (LOCATIONS_DATA[z]) {
                                return LOCATIONS_DATA[z].some(muni => normLoc.includes(muni.toLowerCase()));
                            }
                            return false;
                        });

                        if (matchesZone) {
                            isVisible = true;
                            visibilityReason = `Matches Zone: Job(${jobLocation}) vs Pro(${catProfile.zones.join(',')})`;
                        } else {
                            visibilityReason = `Mismatch Zone: Job(${jobLocation}) vs Pro(${catProfile.zones.join(',')})`;
                        }
                    }
                }

                if (isVisible) {
                    visibleCount++;
                     console.log(`  ✅ Matches Job: ${job.title} (${jobCatName}) - ${jobLocation}`);
                } else {
                     console.log(`  ❌ Hidden Job: ${job.title} (${jobCatName}) - Reason: ${visibilityReason}`);
                }
            }
            console.log(`> Result: Should see ${visibleCount} / ${jobs.length} jobs.`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
};

checkVisibility();