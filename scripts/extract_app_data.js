const fs = require('fs');

const path = 'e:/PROFIX APP/ProFix/app.js';
let content = fs.readFileSync(path, 'utf8');

const isCRLF = content.includes('\r\n');
const nl = isCRLF ? '\r\n' : '\n';

// 1. IMPORT HOOK
if (!content.includes("import { useAppData }")) {
    content = content.replace("import { QuickActionsRow", "import { useAppData } from './src/hooks/useAppData';" + nl + "import { QuickActionsRow");
}

// 2. INSERT HOOK USAGE
const searchStr = "    const [userMode, setUserMode] = useState('client');";
const hookCall = "    const { allRequests, setAllRequests, allChats, setAllChats, refreshing, setRefreshing, counts, setCounts, loadRequests, loadChats, onRefresh } = useAppData({ isLoggedIn, currentUser, userMode, view });" + nl;

if (content.includes(searchStr) && (!content.includes("useAppData({"))) {
    content = content.replace(searchStr, hookCall + searchStr);
}

// 3. REMOVE STATES
content = content.replace(/    const \[allRequests, setAllRequests\] = useState\(\[\]\);\r?\n/, "");
content = content.replace(/    const \[allChats, setAllChats\] = useState\(\[\]\);\r?\n/, "");
content = content.replace(/    const \[refreshing, setRefreshing\] = useState\(false\);\r?\n/, "");
content = content.replace(/    const \[counts, setCounts\] = useState\([^;]+;\r?\n/, "");

// 4. FUNCTION TO CUT BLOCKS
function removeBlock(contentStr, startMarker, endMarker) {
    const startIdx = contentStr.indexOf(startMarker);
    if (startIdx === -1) return contentStr;
    const endIdx = contentStr.indexOf(endMarker, startIdx);
    if (endIdx === -1) return contentStr;
    const before = contentStr.substring(0, startIdx);
    const after = contentStr.substring(endIdx + endMarker.length);
    return before + after;
}

// Remove setupNotifications useEffect
content = removeBlock(
    content,
    "    // --- NOTIFICATION & SOCKET SETUP ---",
    "        };" + nl + "    }, []);"
);

// Fallback if previous didn't work exactly
let start1 = content.indexOf("    // --- NOTIFICATION & SOCKET SETUP ---");
let end1 = content.indexOf("if (socket) socket.off('notification');");
if (start1 !== -1 && end1 !== -1) {
    end1 = content.indexOf("    }, [", end1);
    if (end1 !== -1) {
        end1 = content.indexOf(");", end1) + 3; // + \n
        content = content.substring(0, start1) + content.substring(end1);
    }
} else {
    // try old
    start1 = content.indexOf("    // --- NOTIFICATION & SOCKET SETUP ---");
    end1 = content.indexOf("if (socket) socket.off('notification');");
    if (start1 !== -1 && end1 !== -1) {
        let try2End = content.indexOf("    }, []);", end1);
        if (try2End !== -1) {
            content = content.substring(0, start1) + content.substring(try2End + 12);
        }
    }
}

// Remove loadChats to mappedJobs... this is huge. Let's do it by markers
const chatsStart = "    // --- FUNCTION: LOAD CHATS (Standalone) ---";
const chatsEnd = "        setRefreshing(false);" + nl + "    }, [isLoggedIn]);";
content = removeBlock(content, chatsStart, chatsEnd);

// Remove loadRequests
const reqStart = "    // Cargar solicitudes desde el BACKEND al iniciar la app";
const reqEnd = "        } catch (e) {" + nl + "            console.warn('Error cargando solicitudes desde API:', e);" + nl + "            return [];" + nl + "        }" + nl + "    };";
content = removeBlock(content, reqStart, reqEnd);

// Remove initial load / polling
const pollStart = "    const lastLoadedViewRef = useRef(null);";
const pollEnd = "    }, [isLoggedIn, userMode, view]);";
content = removeBlock(content, pollStart, pollEnd);


fs.writeFileSync(path, content, 'utf8');
console.log("Extraction replacements done!");
