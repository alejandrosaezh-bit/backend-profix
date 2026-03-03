const fs = require('fs');

const path = 'e:/PROFIX APP/ProFix/app.js';
let content = fs.readFileSync(path, 'utf8');

const isCRLF = content.includes('\r\n');
const nl = isCRLF ? '\r\n' : '\n';

const importStr = "import BottomNav from './src/components/BottomNav';";
// Find suitable place for import, right before ProHomeScreen
content = content.replace("import ProHomeScreen", importStr + nl + "import ProHomeScreen");


const startStr = "            {/* NAV INFERIOR (CON FIX DE PADDING PARA ANDROID, OCULTO EN ADMIN) */}";
const endStr = "                    </View>" + nl + "                )" + nl + "            }";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = "            {/* NAV INFERIOR */}" + nl +
        "            <BottomNav " + nl +
        "                view={view}" + nl +
        "                userMode={userMode}" + nl +
        "                isLoggedIn={isLoggedIn}" + nl +
        "                counts={counts}" + nl +
        "                setView={setView}" + nl +
        "                loadRequests={loadRequests}" + nl +
        "                setShowAuth={setShowAuth}" + nl +
        "                markAllProInteractionsAsRead={markAllProInteractionsAsRead}" + nl +
        "            />";

    const before = content.substring(0, startIdx);
    const after = content.substring(endIdx + endStr.length);
    content = before + replacement + after;

    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully replaced BottomNav!");
} else {
    console.log("Could not find boundaries.");
}
