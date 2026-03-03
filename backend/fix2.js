require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.collection('users');
    console.log('Unsetting heavy fields directly...');
    const res = await db.updateOne(
        { email: 'alejandrosaezh@gmail.com' },
        { $unset: { avatar: 1 }, $set: { "profiles.Hogar.gallery": [] } }
    );
    console.log(res);
    process.exit(0);
});
