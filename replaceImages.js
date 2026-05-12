const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let modifiedFiles = 0;
walkDir('./src', function(filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        if (content.includes('<Image ') || content.includes('</Image>')) {
            content = content.replace(/<Image /g, '<ExpoImage ').replace(/<\/Image>/g, '</ExpoImage>');
        }
        
        if (content.includes('<ExpoImage ') && !content.includes("from 'expo-image'") && !content.includes('from "expo-image"')) {
             let lastImportIndex = content.lastIndexOf('import ');
             if (lastImportIndex !== -1) {
                    let endOfImport = content.indexOf(';', lastImportIndex);
                    if (endOfImport === -1) endOfImport = content.indexOf('\n', lastImportIndex);
                    
                    content = content.slice(0, endOfImport + 1) + '\nimport { Image as ExpoImage } from \'expo-image\';' + content.slice(endOfImport + 1);
             } else {
                    content = 'import { Image as ExpoImage } from \'expo-image\';\n' + content;
             }
        }

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            console.log('Updated: ' + filePath);
            modifiedFiles++;
        }
    }
});
console.log('Total files modified: ' + modifiedFiles);
