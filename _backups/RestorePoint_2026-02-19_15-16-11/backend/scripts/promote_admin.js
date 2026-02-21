const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://dbconexta:Clave2025profix@conecta.jmuojga.mongodb.net/profix?appName=Conecta');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const promoteAdmins = async () => {
    await connectDB();
    try {
        const emailsToPromote = ['admin@admin.com', 'alejandrosaezh@gmail.com', 'admin'];

        const res = await User.updateMany(
            { email: { $in: emailsToPromote } },
            { $set: { role: 'admin' } }
        );

        console.log(`Updated ${res.modifiedCount} users to admin role.`);

        // Check results
        const updatedUsers = await User.find({ email: { $in: emailsToPromote } });
        updatedUsers.forEach(u => console.log(`User ${u.email} is now: ${u.role}`));

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

promoteAdmins();
