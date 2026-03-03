require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.collection('users');
    console.log('Unsetting heavy fields directly for alejandrosaezhes@gmail.com...');
    const res = await db.updateOne(
        { email: 'alejandrosaezhes@gmail.com' },
        { $unset: { avatar: 1 } }
    );
    console.log(res);
    process.exit(0);
});
