const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const path = require('path');
const dotenv = require('dotenv');

// Configuración de entorno
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // 1. Get All Categories
        const categories = await Category.find({});
        console.log(`Found ${categories.length} categories available in system.`);
        
        const categoryNames = categories.map(c => c.name);
        console.log("Categories:", categoryNames);

        // 2. Find Professionals with empty profiles
        const pros = await User.find({ role: 'professional' });
        console.log(`Checking ${pros.length} professionals...`);

        for (const pro of pros) {
            let needsUpdate = false;
            
            // Check if profiles is empty or missing
            // User.js defines profiles as a Map. Mongoose might return it as a Map or Object depending on access
            // But usually accessing it directly behaves like a Map if strict, or object if lean.
            // Let's assume Map first, then check size.
            
            let profileCount = pro.profiles ? pro.profiles.size : 0;
            if (pro.profiles && typeof pro.profiles === 'object' && !(pro.profiles instanceof Map)) {
                 profileCount = Object.keys(pro.profiles).length;
            }

            console.log(`Pro: ${pro.name} (${pro.email}) - Profiles: ${profileCount}`);

            if (profileCount === 0) {
                console.log(`  -> Needs fixing! Adding all categories...`);
                
                // Construct profiles Map
                // Mongoose Map expects we set keys
                // If it's a Map instance:
                if (!pro.profiles) pro.profiles = new Map();
                
                categoryNames.forEach(catName => {
                    if (pro.profiles instanceof Map) {
                         pro.profiles.set(catName, {
                            isActive: true,
                            zones: [], // Empty zones = Global visibility
                            subcategories: [], 
                            bio: "Auto-generated profile for dev",
                            experience: "3 years"
                        });
                    } else {
                        // Fallback if schema changed or access is different
                        // But since we loaded via Mongoose model, it should be a Map (or compatible)
                        // If it's treating it as POJO:
                         pro.profiles[catName] = { isActive: true, zones: [] };
                    }
                });
                
                needsUpdate = true;
            }

            if (needsUpdate) {
                await pro.save();
                console.log(`  ✅ Updated profile for ${pro.name}`);
            }
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
};

run();