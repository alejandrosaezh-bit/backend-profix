const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');
const startStr = 'const IconHogar =';
const endStr = 'const mapCategoryToDisplay =';

const icons = content.substring(content.indexOf(startStr), content.indexOf(endStr)).trim();

const newContent = `import React from 'react';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

` + icons.replace(/const /g, 'export const ');

fs.writeFileSync('./src/constants/icons.js', newContent, 'utf8');

// Also remove from app.js and replace with imports
const startIdx = content.indexOf('// Alias para los iconos');
const mainApp = content.substring(0, startIdx) +
    "import { CAT_ICONS, ICON_MAP, IconHogar, IconAuto, IconSalud, IconTech, IconBeauty, IconEvents, IconPets, IconLegal } from './src/constants/icons';\n\n" +
    content.substring(content.indexOf(endStr));

fs.writeFileSync('app.js', mainApp, 'utf8');
console.log('Icons extracted');
