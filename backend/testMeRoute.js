require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const fs = require('fs');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://dbconexta:Clave2025profix@conecta.jmuojga.mongodb.net/profix?appName=Conecta";
const JWT_SECRET = process.env.JWT_SECRET || "Clave2025profix"; // From backend/.env

async function testApi() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");

    const clientUser = await User.findOne({ name: 'Alejandro Cliente' });
    if (!clientUser) {
        console.log("Client not found");
        process.exit();
    }

    // Generate Token manually
    const token = jwt.sign({ id: clientUser._id }, JWT_SECRET, { expiresIn: '30d' });

    console.log("Fetching /api/jobs/me?role=client...");
    try {
        const response = await fetch('http://localhost:5000/api/jobs/me?role=client', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();

        fs.writeFileSync('backend_dump.json', JSON.stringify(data, null, 2));
        console.log(`Saved ${data.length} jobs to backend_dump.json`);

        if (data.length > 0) {
            const firstJob = data[0];
            console.log(`Job 1 ID:`, firstJob._id);
            console.log(`Conversations:`, firstJob.conversations ? firstJob.conversations.length : "undefined");
            console.log(`Client Status:`, firstJob.calculatedClientStatus);
        }

    } catch (e) {
        console.error("API Error:", e);
    }

    process.exit();
}

testApi();
