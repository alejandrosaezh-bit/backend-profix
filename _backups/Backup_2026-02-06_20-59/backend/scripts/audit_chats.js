const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');
const Chat = require('../models/Chat');
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

const runAudit = async () => {
    await connectDB();
    console.log("--- AUDITORÍA DE SOLICITUDES Y CHATS ---\n");

    // 1. Buscar a "Alejandro Saez ES"
    const user = await User.findOne({ name: { $regex: 'Alejandro Saez ES', $options: 'i' } });
    if (!user) {
        console.log("Usuario 'Alejandro Saez ES' no encontrado.");
        process.exit();
    }
    console.log(`USUARIO: ${user.name} (${user.email})\nID: ${user._id}\n`);

    // 2. Buscar trabajos donde él es el CLIENTE (Creador)
    const myJobs = await Job.find({ client: user._id }).populate('client', 'name').lean();
    console.log(`TRABAJOS CREADOS POR ÉL (Rol: Cliente): ${myJobs.length}`);
    myJobs.forEach(job => {
        console.log(` [JOB] ${job.title} (ID: ${job._id}) - Status: ${job.status}`);
    });

    // 3. Buscar chats asociados a esos trabajos
    console.log("\n--- CHATS (Deberían ser visibles SOLO en modo CLIENTE) ---");
    for (const job of myJobs) {
        const chats = await Chat.find({ job: job._id }).populate('participants', 'name').lean();
        if (chats.length > 0) {
            console.log(` Para Job '${job.title}':`);
            chats.forEach(c => {
                console.log(`  -> Chat con ${partner ? partner.name : 'Unknown'} (ID: ${c._id})`);
                if (c.participants) {
                    console.log(`     Participants: ${c.participants.map(p => p.name).join(', ')}`);
                } else {
                    console.log(`     Participants: DATA MISSING`);
                }
                console.log(`     Job Client (DB): ${job.client._id} vs Me: ${user._id}`);
            });
        }
    }

    // 4. Buscar trabajos donde él NO es el cliente, pero participa (Rol: Profesional)
    console.log("\n--- CHATS COMO PROFESIONAL (Deberían ser visibles SOLO en modo PRO) ---");
    // Buscamos chats donde participe ÉL, pero el JOB asociado NO sea suyo
    const allMyChats = await Chat.find({ participants: user._id }).populate('job').lean();
    const proChats = allMyChats.filter(c => c.job && c.job.client.toString() !== user._id.toString());
    
    if (proChats.length === 0) {
        console.log("No se encontraron chats donde actúe como Profesional.");
    } else {
        proChats.forEach(c => {
            console.log(` [CHAT PRO] Job: ${c.job.title} (Creado por: ${c.job.client})`);
            console.log(`  -> ID Chat: ${c._id}`);
        });
    }

    console.log("\n--- DONE ---");
    process.exit();
};

runAudit();