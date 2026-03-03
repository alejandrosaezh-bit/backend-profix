require('dotenv').config();
const mongoose = require('mongoose');

async function cleanupBigData() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 50000
        });
        console.log("Connected to MongoDB for Deep Cleanup...");

        // 1. Limpiar imagenes en trabajos
        console.log("Cleaning job images...");
        const jobsResult = await mongoose.connection.db.collection('jobs').updateMany(
            { "images.0": { $exists: true } },
            { $set: { images: [] } }
        );
        console.log(`Jobs cleaned: ${jobsResult.modifiedCount}`);

        // 2. Limpiar Avatares y fotos de galeria en Usuarios
        console.log("Cleaning User Avatars and Galleries...");
        const usersCol = mongoose.connection.db.collection('users');

        // This clears all 'avatar' and specific big fields
        const usersResult = await usersCol.updateMany(
            {},
            {
                $unset: { avatar: 1 },
            }
        );
        console.log(`Users avatars unset: ${usersResult.modifiedCount}`);

        // Iterar de a poco o hacer un barrido para limpiar todas las galerias anidadas en perfíles
        const activeUsersCount = await usersCol.countDocuments({ "profiles": { $exists: true } });
        console.log(`Found ${activeUsersCount} users with complex profiles.`);

        let batchUpdates = [];
        const cursor = usersCol.find({ "profiles": { $exists: true } });
        for await (const user of cursor) {
            let needsUpdate = false;
            let updateOps = { $set: {} };

            // Iterate through every category object
            if (user.profiles) {
                for (const catName of Object.keys(user.profiles)) {
                    if (user.profiles[catName].gallery && user.profiles[catName].gallery.length > 0) {
                        updateOps.$set[`profiles.${catName}.gallery`] = [];
                        needsUpdate = true;
                    }
                }
            }

            if (needsUpdate) {
                batchUpdates.push({
                    updateOne: {
                        filter: { _id: user._id },
                        update: updateOps
                    }
                });
            }
        }

        if (batchUpdates.length > 0) {
            console.log(`Executing ${batchUpdates.length} bulk updates to clear galleries...`);
            await usersCol.bulkWrite(batchUpdates);
        } else {
            console.log("No galleries needed cleanup.");
        }

        console.log("Cleanup V2 Completed successfully.");
        process.exit(0);
    } catch (e) {
        console.error("Error during cleanup:", e);
        process.exit(1);
    }
}

cleanupBigData();
