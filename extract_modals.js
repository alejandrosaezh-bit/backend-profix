const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');

const startCatIdx = content.indexOf('const CategoryGridModal =');
const endCatIdx = content.indexOf('const SubcategoryGridModal =');
const endSubIdx = content.indexOf('// --- 3. SECCIONES DE CONTENIDO', endCatIdx);

if (startCatIdx !== -1 && endSubIdx !== -1) {
    const modalsStr = content.substring(startCatIdx, endSubIdx);
    const newContent = `import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { X, Layers } from '../constants/icons';
import { CAT_ICONS } from '../constants/icons';
import styles from '../styles/globalStyles';

export ` + modalsStr.replace(/const SubcategoryGridModal/g, 'export const SubcategoryGridModal');

    // Create the file
    fs.writeFileSync('./src/components/CategoryModals.js', newContent, 'utf8');

    // Remove from app.js and add import
    const newAppContent = content.substring(0, startCatIdx) +
        "\nimport { CategoryGridModal, SubcategoryGridModal } from './src/components/CategoryModals';\n" +
        content.substring(endSubIdx);

    fs.writeFileSync('app.js', newAppContent, 'utf8');
    console.log('Successfully extracted modals.');
} else {
    console.log('Modals not found.');
}
