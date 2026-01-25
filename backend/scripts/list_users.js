const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://dbconexta:Clave2025profix@conecta.jmuojga.mongodb.net/profix?appName=Conecta');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const listUsers = async () => {
    await connectDB();
    try {
        const users = await User.find({}, 'name email role _id');
        console.log('--- USERS LIST ---');
        users.forEach(u => {
            console.log(`ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
        });
        console.log('------------------');
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

listUsers();
