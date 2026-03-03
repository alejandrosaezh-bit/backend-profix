require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.collection('users');
    console.log('Updating user...');

    // Clear heavy arrays on profiles too, since they might be huge Base64 items
    const doc = await db.findOne({ email: 'alejandrosaezh@gmail.com' });
    console.log("Original sizes:", doc ? Object.keys(doc) : null);

    const res = await db.updateOne(
        { email: 'alejandrosaezh@gmail.com' },
        { $set: { avatar: null } }
    );

    // Iterate over profiles and clear galleries or bio if they are massive
    if (doc && doc.profiles) {
        for (let cat of Object.keys(doc.profiles)) {
            if (doc.profiles[cat].gallery) doc.profiles[cat].gallery = [];
        }
        await db.updateOne({ email: 'alejandrosaezh@gmail.com' }, { $set: { profiles: doc.profiles } });
    }

    console.log(res);
    process.exit(0);
});
