const fs = require('fs');
const file = 'src/screens/ProfessionalProfilePublicModal.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/SOBRE MÃ[\s\S]/g, 'SOBRE MÍ');
fs.writeFileSync(file, content, 'utf8');
console.log("Done");
