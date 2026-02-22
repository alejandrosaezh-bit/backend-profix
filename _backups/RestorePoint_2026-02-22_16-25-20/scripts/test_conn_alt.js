const mongoose = require('mongoose');
const uri = "mongodb+srv://profix_admin:Profix2024@profix-cluster.pfvnq.mongodb.net/profix_db?retryWrites=true&w=majority";

console.log("Probando conexión alternativa...");
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        console.log("¡CONEXIÓN EXITOSA!");
        process.exit(0);
    })
    .catch(err => {
        console.error("FALLÓ LA CONEXIÓN:", err.message);
        process.exit(1);
    });
