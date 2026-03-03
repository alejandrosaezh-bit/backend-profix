const fs = require('fs');
const path = require('path');
const files = ['src/screens/ClientProfileView.js', 'src/screens/ProfessionalProfilePublicModal.js'];
files.forEach(file => {
    const filePath = path.join(__dirname, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/â€¢/g, '•');
    content = content.replace(/reseÃ±as/g, 'reseñas');
    content = content.replace(/SOBRE MÃ /g, 'SOBRE MÍ');
    content = content.replace(/aÃºn/g, 'aún');
    content = content.replace(/BOTÃ“N/g, 'BOTÓN');
    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
});
