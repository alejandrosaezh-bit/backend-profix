require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

        const user = await User.findOne({ name: 'Alejandro Cliente' }).lean();
        console.log(JSON.stringify(user.profiles, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
