const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const resetAdminPassword = async () => {
    try {
        await mongoose.connect('mongodb+srv://dbconexta:Clave2025profix@conecta.jmuojga.mongodb.net/profix?appName=Conecta');
        console.log('MongoDB Connected');

        const email = 'admin@profix.com';
        const newPassword = 'admin'; // Keeping it simple as requested

        const user = await User.findOne({ email });

        if (!user) {
            console.log('Admin user not found. Creating one...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await User.create({
                name: 'Admin ProFix',
                email: email,
                password: hashedPassword,
                role: 'admin',
                cedula: '999999999',
                phone: '555-5555'
            });
            console.log(`Admin user created with password: ${newPassword}`);
        } else {
            console.log('Admin user found. Updating password...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            user.password = hashedPassword;
            user.role = 'admin'; // Ensure role is admin
            await user.save();
            console.log(`Admin user '${email}' password reset to: ${newPassword}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

resetAdminPassword();
