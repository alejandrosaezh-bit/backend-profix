const fs = require('fs');

const path = 'e:/PROFIX APP/ProFix/app.js';
let content = fs.readFileSync(path, 'utf8');

// We will write a Node script to extract these components into src/components/HomeComponents.js
const extractFile = 'e:/PROFIX APP/ProFix/src/components/HomeComponents.js';

// The text is roughly from line 122 `const QuickActionsRow =` to line 356 `};`
const reactNativeImports = `import React from 'react';\nimport { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';\nimport { Feather } from '@expo/vector-icons';\nimport { SectionDivider } from './Dividers';\n\nconst { width } = Dimensions.get('window');\n\n// We need to handle CAT_ICONS and ICON_MAP if they are not passed as props, \n// let's pass ICON_MAP and CAT_ICONS via props or import from a constants file if we can. \n// In app.js they are probably defined somewhere else. Let's look at lines 50-100 of app.js\n`;
fs.writeFileSync('e:/PROFIX APP/ProFix/scripts/extract_home_components.js', `console.log("Ready");`);
