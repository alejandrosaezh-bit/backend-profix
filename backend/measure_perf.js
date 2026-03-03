const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://dbconexta:Clave2025profix@conecta.jmuojga.mongodb.net/profix?appName=Conecta';

async function measure() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const User = mongoose.model('User', new mongoose.Schema({ email: String, name: String }));
        const Job = mongoose.model('Job', new mongoose.Schema({ client: mongoose.Schema.Types.ObjectId, professional: mongoose.Schema.Types.ObjectId, title: String, status: String, offers: Array, conversations: Array, interactionsSummary: Object }));
        const Chat = mongoose.model('Chat', new mongoose.Schema({ participants: Array, job: mongoose.Schema.Types.ObjectId, messages: Array }));
        const JobInteraction = mongoose.model('JobInteraction', new mongoose.Schema({ job: mongoose.Schema.Types.ObjectId, user: mongoose.Schema.Types.ObjectId, status: String }));

        const userId = new mongoose.Types.ObjectId('69417ba1a3824e1ba2607445');

        console.time('Full GET /me Simulation');

        // 1. Fetch Client Jobs
        console.time('Fetch Client Jobs');
        const clientJobs = await Job.find({ client: userId }).lean();
        console.timeEnd('Fetch Client Jobs');

        // 2. Fetch Chats (Aggregate simulation)
        console.time('Aggregate Chats');
        const chats = await Chat.aggregate([
            { $match: { participants: userId } },
            {
                $project: {
                    _id: 1,
                    job: 1,
                    unreadCount: { $size: { $ifNull: ["$messages", []] } } // Simplified for test
                }
            }
        ]);
        console.timeEnd('Aggregate Chats');

        // 3. Interactions
        console.time('Fetch Interactions');
        const interactions = await JobInteraction.find({ user: userId }).lean();
        console.timeEnd('Fetch Interactions');

        console.timeEnd('Full GET /me Simulation');

        console.log(`Results: ${clientJobs.length} jobs, ${chats.length} chats, ${interactions.length} interactions.`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.connection.close();
    }
}

measure();
