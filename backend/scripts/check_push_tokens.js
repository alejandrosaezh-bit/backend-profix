const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');

async function checkTokens() {
    await connectDB();
    const users = await User.find({ pushToken: { $exists: true, $ne: null } });

    console.log(`\n=== FOUND ${users.length} USERS WITH PUSH TOKENS ===`);
    users.forEach(u => {
        console.log(`- ${u.name} (${u.email}): ${u.pushToken}`);
        if (u.pushToken && u.pushToken.includes('ExponentPushToken')) {
            console.log(`  └─> Format: ExponentPushToken`);
        } else if (u.pushToken && u.pushToken.includes('DevicePushToken')) {
            console.log(`  └─> Format: Device Push Token (Native APNs/FCM)`);
        } else {
            console.log(`  └─> Format: Unknown`);
        }
    });

    process.exit();
}

checkTokens();
