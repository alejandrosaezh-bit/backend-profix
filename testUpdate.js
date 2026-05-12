const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function test() {
    await mongoose.connect('mongodb://localhost:27017/profix');
    const user = await User.findOne();
    console.log("Found user:", user._id);

    try {
        const updated = await User.findByIdAndUpdate(user._id, {
            $set: {
                notificationPreferences: {
                    client_new_messages: { push: true, email: false }
                }
            }
        }, { new: true, lean: true });
        console.log("Updated:", updated !== null);
    } catch (e) {
        console.error("Update error:", e);
    }
    process.exit(0);
}
test();
