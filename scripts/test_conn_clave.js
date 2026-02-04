const mongoose = require('mongoose');
const uri = "mongodb+srv://dbconexta:Clave2025profix@conecta.jmuojga.mongodb.net/profix?appName=Conecta";

console.log("Probando conexión con Clave2025profix...");
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        console.log("¡CONEXIÓN EXITOSA!");
        process.exit(0);
    })
    .catch(err => {
        console.error("FALLÓ LA CONEXIÓN:", err.message);
        process.exit(1);
    });
