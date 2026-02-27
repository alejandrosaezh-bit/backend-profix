const mongoose = require('mongoose');
require('dotenv').config();
const Job = require('./models/Job');
const User = require('./models/User');

async function checkUserJobs() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({ email: 'alejandrosaezh@gmail.com' });

        if (!user) {
            console.log("Usuario no encontrado con ese email.");
            process.exit(0);
        }

        console.log(`Usuario encontrado: ${user.name} [ID: ${user._id}]`);

        // Contar solicitudes donde él es el CLIENTE
        const clientJobs = await Job.find({ client: user._id });
        console.log(`Solicitudes como CLIENTE: ${clientJobs.length}`);

        clientJobs.forEach(j => {
            console.log(` - [${j.status}] ${j.title} (ID: ${j._id})`);
        });

        // Contar solicitudes donde él es el PROFESIONAL asignado
        const proJobs = await Job.find({ professional: user._id });
        console.log(`Solicitudes como PROFESIONAL asignado: ${proJobs.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkUserJobs();
