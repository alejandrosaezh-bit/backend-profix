require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Job = require('./models/Job');
const User = require('./models/User');
const Chat = require('./models/Chat');
const JobInteraction = require('./models/JobInteraction');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://dbconexta:Clave2025profix@conecta.jmuojga.mongodb.net/profix?appName=Conecta";


async function debugFeed() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");

    // Find "Alejandro Cliente"
    const clientUser = await User.findOne({ name: 'Alejandro Cliente' });
    if (!clientUser) {
        console.log("Client not found");
        process.exit();
    }
    console.log("Client:", clientUser.name, clientUser._id);

    // Get Jobs
    const jobs = await Job.find({ client: clientUser._id }).lean();
    console.log("Jobs found:", jobs.length);

    // Get Chats
    const allUserChats = await Chat.find({ participants: clientUser._id })
        .select('_id job participants lastMessage lastMessageDate messages.read messages.sender messages.content')
        .populate('participants', 'name email role avatar')
        .populate('job', '_id client')
        .sort({ lastMessageDate: -1 })
        .lean();

    console.log("Chats found:", allUserChats.length);
    allUserChats.forEach(c => {
        console.log("- Chat for job:", c.job?._id || c.job);
        console.log("  Participants:", c.participants.map(p => p.name).join(", "));
    });

    const validJobIds = new Set(jobs.map(j => j._id.toString()));
    const chatsByJobId = {};
    allUserChats.forEach(chat => {
        if (chat.job) {
            const jId = chat.job._id ? chat.job._id.toString() : chat.job.toString();
            if (validJobIds.has(jId)) {
                if (!chatsByJobId[jId]) chatsByJobId[jId] = [];
                chatsByJobId[jId].push(chat);
            }
        }
    });

    console.log("Mapped chats:", Object.keys(chatsByJobId).length);

    process.exit();
}

debugFeed();
