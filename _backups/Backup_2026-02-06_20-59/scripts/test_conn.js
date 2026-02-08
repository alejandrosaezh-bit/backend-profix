const mongoose = require('mongoose');
// Password original: n%4iQmDhLV!R%pW
// Encoded: n%254iQmDhLV%21R%25pW
const uri = "mongodb+srv://dbconexta:n%254iQmDhLV%21R%25pW@conecta.jmuojga.mongodb.net/?appName=Conecta";

console.log("Probando conexión...");
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        console.log("¡CONEXIÓN EXITOSA!");
        process.exit(0);
    })
    .catch(err => {
        console.error("FALLÓ LA CONEXIÓN:", err.message);
        process.exit(1);
    });