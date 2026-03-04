const mongoose = require('mongoose');
require('dotenv').config();

async function clearHeavyAvatars() {
    await mongoose.connect(process.env.MONGO_URI);

    const User = require('./models/User');

    console.log('Finding and clearing heavy avatars...');
    const users = await User.find({ avatar: { $exists: true, $ne: null } }).lean();

    let clearedCount = 0;
    for (const u of users) {
        if (u.avatar && u.avatar.length > 50000) { // roughly > 50KB in base64 string length
            const kbSize = (Buffer.from(u.avatar).length / 1024).toFixed(2);
            console.log('Clearing avatar for ' + u.name + ' (Size: ' + kbSize + ' KB)');

            await User.updateOne({ _id: u._id }, { $unset: { avatar: '' } });
            clearedCount++;
        }
    }

    console.log('Cleared ' + clearedCount + ' heavy avatars.');
    mongoose.disconnect();
}

clearHeavyAvatars().catch(console.error);
