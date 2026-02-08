const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function listByRoles() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const roles = ['client', 'professional', 'admin'];
        for (const role of roles) {
            const users = await User.find({ role });
            console.log(`--- ${role.toUpperCase()}S ---`);
            users.forEach(u => console.log(`ID: ${u._id} | Name: ${u.name} | Email: ${u.email}`));
        }
        await mongoose.connection.close();
    } catch (error) {
        console.error(error);
    }
}

listByRoles();
