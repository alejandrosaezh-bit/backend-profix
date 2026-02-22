const fs = require('fs');

const commonImports = `import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, Alert, Modal, Animated, Easing, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import styles from '../styles/globalStyles';
import { DETAILED_CATEGORIES, CATEGORY_EXAMPLES, BLOG_POSTS, TESTIMONIALS, LOCATIONS_DATA, FLAT_ZONES_SUGGESTIONS, HOME_COPY_OPTIONS, ROTATION_KEY } from '../constants/data';
import { areIdsEqual, getClientStatus, getClientStatusColor, getProStatusColor, getProStatus, showAlert, showConfirmation, formatCurrency, formatDate } from '../utils/helpers';
import { CAT_ICONS, ICON_MAP, IconHogar, IconAuto, IconSalud, IconTech, IconBeauty, IconEvents, IconPets, IconLegal } from '../constants/icons';

`;

const files = [
    { name: 'ServiceForm', path: './src/screens/ServiceForm.js' },
    { name: 'RequestDetailClient', path: './src/screens/RequestDetailClient.js' },
    { name: 'JobDetailPro', path: './src/screens/JobDetailPro.js' },
    { name: 'RatingForm', path: './src/screens/RatingForm.js' },
    { name: 'CloseRequestModal', path: './src/screens/CloseRequestModal.js' },
    { name: 'ProjectTimeline', path: './src/screens/ProjectTimeline.js' }
];

files.forEach(f => {
    if (fs.existsSync(f.path)) {
        let content = fs.readFileSync(f.path, 'utf8');
        // Prepend imports
        content = commonImports + content;
        // Append export
        content += `\n\nexport default ${f.name};\n`;
        fs.writeFileSync(f.path, content, 'utf8');
    }
});

// Now remove the components from app.js and add imports
let appJs = fs.readFileSync('app.js', 'utf8');
// Replace everything between const ServiceForm = ... and // --- 6. APP PRINCIPAL (CONTENEDOR) ---
const startIdx = appJs.indexOf('// --- 4. FORMULARIO PRINCIPAL (CON LOGICA DE GPS Y CAMARA) ---');
const endIdx = appJs.indexOf('// --- 6. APP PRINCIPAL (CONTENEDOR) ---');

const appImports = `import ServiceForm from './src/screens/ServiceForm';
import RequestDetailClient from './src/screens/RequestDetailClient';
import JobDetailPro from './src/screens/JobDetailPro';
import RatingForm from './src/screens/RatingForm';
import CloseRequestModal from './src/screens/CloseRequestModal';
import ProjectTimeline from './src/screens/ProjectTimeline';

`;

if (startIdx !== -1 && endIdx !== -1) {
    appJs = appJs.substring(0, startIdx) + appImports + appJs.substring(endIdx);
    fs.writeFileSync('app.js', appJs, 'utf8');
    console.log('App.js updated with screen imports!');
}
