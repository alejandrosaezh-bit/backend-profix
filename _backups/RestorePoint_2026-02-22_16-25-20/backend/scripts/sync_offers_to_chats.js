const mongoose = require('mongoose');
const Job = require('../models/Job');
const Chat = require('../models/Chat');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// DB Config
// const db = require('../config/db'); // No necesitamos esto si conectamos directo

// Connect to DB
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
    console.error('MONGO_URI not found in env');
    process.exit(1);
}

mongoose.connect(mongoURI)
.then(() => console.log('MongoDB Connected'))
.catch(err => {
    console.error('DB Connection Error:', err);
    process.exit(1);
});

const syncOffers = async () => {
    try {
        console.log('--- STARTING SYNC: OFFERS -> CHATS ---');
        
        // 1. Get all jobs with offers
        const jobs = await Job.find({ "offers.0": { $exists: true } });
        console.log(`Found ${jobs.length} jobs with offers.`);

        let createdCount = 0;
        let updatedCount = 0;

        for (const job of jobs) {
            if (!job.client) {
                console.log(`Job ${job._id} has no client, skipping.`);
                continue;
            }

            for (const offer of job.offers) {
                const proId = offer.proId;
                
                // Find chat
                let chat = await Chat.findOne({
                    job: job._id,
                    participants: { $all: [proId, job.client] }
                });

                if (!chat) {
                    // Create Chat
                    chat = new Chat({
                        job: job._id,
                        participants: [proId, job.client],
                        messages: []
                    });
                    console.log(`Creating NEW chat for Job ${job.title} (Pro: ${proId})`);
                    createdCount++;
                } else {
                    // Check if offer message exists
                    const hasOfferMsg = chat.messages.some(m => m.content && m.content.includes('He enviado una oferta'));
                    if (hasOfferMsg) {
                        continue; // Already has offer message
                    }
                    updatedCount++;
                }

                // Add message if needed (new or existing without msg)
                const offerDisplay = offer.currency ? `${offer.currency} ${offer.amount}` : `$${offer.amount}`;
                
                // Avoid duplicates if we just created it empty
                const alreadyHasIt = chat.messages.some(m => m.content && m.content.includes(`He enviado una oferta`));
                if (!alreadyHasIt) {
                    chat.messages.push({
                        sender: proId,
                        content: `He enviado una oferta de ${offerDisplay}`,
                        read: true, // Mark as read so it doesn't annoy
                        timestamp: offer.createdAt || new Date()
                    });
                    
                    // Update timestamp only if it's the newest thing (unlikely for old offers, but safe)
                    // Actually, let's keep original date order? 
                    // Better set lastMessageDate to now so it bumps to top? No, let's respect offer date.
                    const offerDate = new Date(offer.createdAt || Date.now());
                    if (!chat.lastMessageDate || offerDate > chat.lastMessageDate) {
                        chat.lastMessageDate = offerDate;
                    }
                    
                    await chat.save();
                }
            }
        }

        console.log(`Sync Complete.`);
        console.log(`Chats Created: ${createdCount}`);
        console.log(`Chats Updated: ${updatedCount}`);

        process.exit();
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
};

syncOffers();
