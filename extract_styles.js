const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');
const searchString = 'const styles = StyleSheet.create({';
const idx = content.indexOf(searchString);

if (idx !== -1) {
    const mainApp = content.substring(0, idx);
    const stylesPart = content.substring(idx);

    // Write globalStyles.js
    const newStylesContent = `import { StyleSheet, Dimensions } from 'react-native';\n\nconst { width } = Dimensions.get('window');\n\nexport default ` + stylesPart.replace('const styles = StyleSheet.create', 'StyleSheet.create');

    // Create directory if not exists
    if (!fs.existsSync('./src/styles')) {
        fs.mkdirSync('./src/styles', { recursive: true });
    }
    fs.writeFileSync('./src/styles/globalStyles.js', newStylesContent, 'utf8');

    // Update app.js
    const newAppContent = mainApp.replace(
        "import { areIdsEqual",
        "import styles from './src/styles/globalStyles';\nimport { areIdsEqual"
    );
    fs.writeFileSync('app.js', newAppContent, 'utf8');
    console.log('Successfully extracted styles.');
} else {
    console.log('Styles not found');
}
