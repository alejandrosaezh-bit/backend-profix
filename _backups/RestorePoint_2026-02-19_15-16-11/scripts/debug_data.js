const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' }); // Adjust path if needed
const Category = require('../backend/models/Category');
const User = require('../backend/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/profix_db';

async function checkDb() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        console.log('\n--- CATEGORIES ---');
        const categories = await Category.find({});
        console.log(`Total Categories: ${categories.length}`);
        categories.forEach(c => {
            console.log(`- ${c.name} (Active: ${c.isActive}, ID: ${c._id})`);
        });

        console.log('\n--- USERS ---');
        const users = await User.find({});
        console.log(`Total Users: ${users.length}`);
        users.forEach(u => {
            console.log(`- ${u.name} (${u.email}) - Role: ${u.role}, Verified: ${u.isVerified}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkDb();
