const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://dbconexta:Clave2025profix@conecta.jmuojga.mongodb.net/profix?appName=Conecta';

async function test() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        // Define models briefly
        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ name: String, avatar: String, email: String }));
        const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({ name: String, color: String, icon: String }));
        const Job = mongoose.models.Job || mongoose.model('Job', new mongoose.Schema({
            client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
            professional: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            offers: [{ proId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, status: String }],
            projectHistory: [{ actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
            createdAt: { type: Date, default: Date.now }
        }));

        const userId = new mongoose.Types.ObjectId('6941cfdcfd8ac2c570c363fa');

        console.log("Running Final PROD-LIKE Optimized Query");
        console.time('Final Optimization');
        let jobsF = await Job.find({ client: userId })
            .select('-images -workPhotos -clientManagement -projectHistory -conversations')
            .populate('client', 'name avatar email')
            .populate('category', 'name color icon')
            .populate('professional', 'name email avatar rating reviewsCount')
            .populate('offers.proId', 'name email avatar rating reviewsCount')
            .sort({ createdAt: -1 })
            .lean();
        console.timeEnd('Final Optimization');
        console.log(`  Size: ${(JSON.stringify(jobsF).length / 1024).toFixed(2)} KB`);
        console.log("Jobs found:", jobsF.length);

        if (jobs5.length > 0) {
            jobs5.forEach((j, i) => {
                console.log(`Job ${i} [${j._id}] has ${j.offers ? j.offers.length : 0} offers.`);
                if (j.offers) {
                    j.offers.forEach((o, k) => {
                        if (o.proId) {
                            const uSize = JSON.stringify(o.proId).length;
                            console.log(`  - Offer ${k} proId [${o.proId._id}] size: ${(uSize / 1024).toFixed(2)} KB`);
                        }
                    });
                }
            });
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.connection.close();
    }
}

test();
