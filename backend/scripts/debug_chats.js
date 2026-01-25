const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');
const Chat = require('../models/Chat');

require('dotenv').config();

const run = async () => {
    try {
        const uri = 'mongodb+srv://dbconexta:Clave2025profix@conecta.jmuojga.mongodb.net/profix?appName=Conecta';
        await mongoose.connect(uri);
        console.log('Connected to DB');

        // 1. Fetch all Users to find the Client "Alejandro Saez H" (based on screenshots) or just list all
        const users = await User.find({});
        console.log(`Total Users: ${users.length}`);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        // 2. Fetch all Jobs
        const jobs = await Job.find({});
        console.log(`Total Jobs: ${jobs.length}`);
        jobs.forEach(j => {
            console.log(`Job ID: ${j._id} | Title: ${j.title} | Client: ${j.client} | Convs: ${j.conversations?.length}`);
        });

        // 3. Fetch all Chats
        const chats = await Chat.find({});
        console.log(`Total Chats: ${chats.length}`);
        chats.forEach(c => {
            console.log(`Chat ID: ${c._id} | Job: ${c.job} | Participants: ${c.participants} | Msgs: ${c.messages.length}`);
        });

        // 4. FIX ORPHAN CHATS
        console.log("\n--- FIXING ORPHAN CHATS ---");
        for (const c of chats) {
            if (!c.job) {
                console.log(`Chat ${c._id} has NO JOB.`);
                // Find a job where the client is a participant
                // Participants: [Pro, Client]
                // Client ID is 6941cfdcfd8ac2c570c363fa (from Job log above)
                // Job Client: 6941cfdcfd8ac2c570c363fa

                // Let's find ANY job where one of the participants is the client
                const participants = c.participants.map(p => p.toString());
                const jobMatch = jobs.find(j => participants.includes(j.client.toString()));

                if (jobMatch) {
                    console.log(`Found matching Job ${jobMatch._id} for Chat ${c._id}. Updating...`);
                    c.job = jobMatch._id;
                    await c.save();

                    // Also update Job conversations array
                    if (!jobMatch.conversations.includes(c._id)) {
                        jobMatch.conversations.push(c._id);
                        await jobMatch.save();
                    }
                    console.log("FIXED.");
                } else {
                    console.log("Could not find matching job.");
                }
            } else {
                console.log(`Chat ${c._id} is OK (Job: ${c.job})`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
};

run();
