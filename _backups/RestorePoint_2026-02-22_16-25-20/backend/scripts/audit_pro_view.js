const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Configuración de entorno
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const Job = require('../models/Job');
const User = require('../models/User');
const Category = require('../models/Category');

const run = async () => {
    try {
        console.log('Conectando a MongoDB...', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado.');

        // 1. Fetch All Jobs
        console.log('\n=== LISTADO DE TRABAJOS (JOBS) ===');
        const jobs = await Job.find({})
            .populate('category', 'name')
            .populate('client', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        jobs.forEach((job, i) => {
            const catName = job.category?.name || job.category;
            console.log(`Job [${i}] ID: ${job._id}`);
            console.log(`   Title: "${job.title}"`);
            console.log(`   Client: ${job.client?.name} (${job.client?.email}) [ID: ${job.client?._id}]`);
            console.log(`   Category: "${catName}"`);
            console.log(`   Subcategory: "${job.subcategory}"`);
            console.log(`   Location: "${job.location}"`);
            console.log(`   Status: ${job.status}`);
            console.log('-------------------------');
        });

        // 2. Fetch All Professional Users
        console.log('\n=== LISTADO DE PROFESIONALES (USERS with profiles) ===');
        const pros = await User.find({ 
            // Find users who have profiles property (not strict check but good enough for audit)
            $or: [{ role: 'professional' }, { 'profiles': { $exists: true } }] 
        }).lean();

        pros.forEach((pro, i) => {
            console.log(`User [${i}] ${pro.name} (${pro.email}) [ID: ${pro._id}]`);
            if (pro.profiles) {
                // Determine if Map or Object (lean returns POJO if schema was Map? No, Mongoose lean handles Maps differently sometimes, let's treat as object)
                const profiles = pro.profiles;
                const keys = Object.keys(profiles);
                if (keys.length === 0) {
                    console.log('   Profiles: (Empty)');
                } else {
                    keys.forEach(k => {
                        const p = profiles[k];
                        console.log(`   Profile Key: "${k}"`);
                        console.log(`       Active: ${p.isActive}`);
                        console.log(`       Zones: ${JSON.stringify(p.zones)}`);
                        console.log(`       Subcategories: ${JSON.stringify(p.subcategories)}`);
                    });
                }
            } else {
                console.log('   Profiles: Undefined/Null');
            }
            console.log('-------------------------');
        });

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

run();
