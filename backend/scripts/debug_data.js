const mongoose = require('mongoose');
const Job = require('../models/Job');
const Chat = require('../models/Chat');
const User = require('../models/User');
require('dotenv').config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect("mongodb+srv://admin:admin123@ac-kcb1djz-shard-00-00.jmuojga.mongodb.net/profix?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const runDebug = async () => {
    await connectDB();

    console.log("--- DEBUGGING DATA ---");

    // 1. Find Fuga Job
    const jobs = await Job.find({ title: { $regex: 'Fuga', $options: 'i' } }).lean();
    console.log(`Found ${jobs.length} jobs with 'Fuga' in title.`);

    for (const job of jobs) {
        console.log(`\nJOB: ${job.title} (ID: ${job._id})`);
        console.log(`Client: ${job.client}`);
        console.log(`Offers: ${job.offers ? job.offers.length : 0}`);

        // 2. Find Chats linked to this Job
        const linkedChats = await Chat.find({ job: job._id }).populate('participants', 'name email role').lean();
        console.log(`> Chats with job=${job._id}: ${linkedChats.length}`);
        linkedChats.forEach(c => {
            console.log(`  - ChatID: ${c._id}, Parts: ${c.participants.map(p => p.name).join(', ')}`);
        });

        // 3. Find Chats for this Client (Potential Orphans)
        // We look for chats where one participant is the client, and check if they are NOT linked to this job
        const clientChats = await Chat.find({ participants: job.client }).populate('participants', 'name email role').lean();
        console.log(`> Total chats for Client ${job.client}: ${clientChats.length}`);

        const orphans = clientChats.filter(c => !c.job || c.job.toString() !== job._id.toString());
        console.log(`> Potential orphans (chats for client but not linked to this job): ${orphans.length}`);
        orphans.forEach(c => {
            console.log(`  - ChatID: ${c._id}, Job: ${c.job || 'NULL'}, Parts: ${c.participants.map(p => p.name).join(', ')}`);
            const lastMsg = c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1].content : 'No msgs';
            console.log(`    LastMsg: ${lastMsg}`);
        });
    }

    console.log("\n--- DONE ---");
    process.exit();
};

runDebug();
