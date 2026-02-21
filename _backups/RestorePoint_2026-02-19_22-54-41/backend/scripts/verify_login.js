const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const verifyLogin = async (email, password) => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://dbconexta:Clave2025profix@conecta.jmuojga.mongodb.net/profix?appName=Conecta');
        console.log('MongoDB Connected');

        console.log(`Attempting login for: ${email}`);

        // 1. Find user
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User NOT found by email.');
            return;
        }
        console.log(`User found: ${user.name} (${user._id})`);
        console.log(`Stored Hash: ${user.password}`);
        console.log(`Is Active: ${user.isActive}`);

        // 2. Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`Password Match Result: ${isMatch}`);

        if (isMatch) {
            console.log('LOGIN SUCCESS would happen.');
        } else {
            console.log('LOGIN FAILURE: Password incorrect.');

            // Debug: Try hashing the input password and compare visually
            // Note: bcrypt salts are random so direct string comparison won't work, 
            // but we can see if the stored hash looks like a valid bcrypt hash.
            const testHash = await bcrypt.hash(password, 10);
            console.log(`Test hash of '${password}': ${testHash}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

// Access command line args
const args = process.argv.slice(2);
const emailArg = args[0] || 'admin@profix.com';
const passArg = args[1] || 'admin';

verifyLogin(emailArg, passArg);
