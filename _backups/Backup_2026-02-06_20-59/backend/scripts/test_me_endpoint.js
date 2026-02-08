
const axios = require('axios');
require('dotenv').config({ path: 'backend/.env' });
const User = require('../models/User'); // To get a token
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'alejandrosaezhes@gmail.com' });
        const token = require('jsonwebtoken').sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        console.log('User found:', user.email);

        const url = 'http://localhost:5000/api/jobs/me';
        console.log('Fetching:', url);
        
        const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Status:', res.status);
        if (res.data.length > 0) {
            const j = res.data[0];
            console.log('First Job Category:', j.category);
        } else {
            console.log('No jobs found via API');
        }

    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) console.log('Response:', e.response.data);
    } finally {
        await mongoose.connection.close();
    }
}
run();
