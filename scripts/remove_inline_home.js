const fs = require('fs');

const path = 'e:/PROFIX APP/ProFix/app.js';
let content = fs.readFileSync(path, 'utf8');

const isCRLF = content.includes('\r\n');
const nl = isCRLF ? '\r\n' : '\n';

// Import string to add
const importStr = "import { QuickActionsRow, HomeSections, UrgencyBanner } from './src/components/HomeComponents';" + nl;

// Find the start of QuickActionsRow
const startStr = "const QuickActionsRow = ({ onActionPress, categories }) => {";
// Find the end of UrgencyBanner
const endStr = "    );" + nl + "};";
// Let's do a more robust search for UrgencyBanner end. It ends right before:
// import CloseRequestModal from './src/screens/CloseRequestModal';
const afterEndStr = "import CloseRequestModal from './src/screens/CloseRequestModal';";

const startIdx = content.indexOf(startStr);
const afterEndIdx = content.indexOf(afterEndStr);

if (startIdx !== -1 && afterEndIdx !== -1) {
    // Delete from startIdx to afterEndIdx
    const before = content.substring(0, startIdx);
    const after = content.substring(afterEndIdx);

    // Check if import is already there
    let newContent = "";
    if (!before.includes("from './src/components/HomeComponents'")) {
        // Add import somewhere near the top imports
        const lastImportIdx = before.lastIndexOf("import");
        const eolIdx = before.indexOf(nl, lastImportIdx);

        newContent = before.substring(0, eolIdx) + nl + importStr + before.substring(eolIdx) + after;
    } else {
        newContent = before + after;
    }

    fs.writeFileSync(path, newContent, 'utf8');
    console.log("Successfully removed inline components and added import!");
} else {
    console.log("Could not find boundaries.");
}
