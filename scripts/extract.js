const fs = require('fs');

const path = 'e:/PROFIX APP/ProFix/app.js';
let content = fs.readFileSync(path, 'utf8');

// The file likely has \r\n
const isCRLF = content.includes('\r\n');
const nl = isCRLF ? '\r\n' : '\n';

const importStr = "import SubcategoryDetailScreen from './src/screens/SubcategoryDetailScreen';" + nl + "import ProHomeScreen from './src/screens/ProHomeScreen';";
content = content.replace("import SubcategoryDetailScreen from './src/screens/SubcategoryDetailScreen';", importStr);

const startStr = "{/* PRO HOME */}" + nl + "                {userMode === 'pro' && view === 'home' && (";
const endStr = "                        </ScrollView>" + nl + "                    </View>" + nl + "                )}";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = "{/* PRO HOME */}" + nl +
        "                {userMode === 'pro' && view === 'home' && (" + nl +
        "                    <ProHomeScreen" + nl +
        "                        activeCategories={activeCategories}" + nl +
        "                        showFilterBar={showFilterBar}" + nl +
        "                        setShowFilterBar={setShowFilterBar}" + nl +
        "                        showArchivedOffers={showArchivedOffers}" + nl +
        "                        setShowArchivedOffers={setShowArchivedOffers}" + nl +
        "                        filterCategory={filterCategory}" + nl +
        "                        setFilterCategory={setFilterCategory}" + nl +
        "                        categoryModalVisible={categoryModalVisible}" + nl +
        "                        setCategoryModalVisible={setCategoryModalVisible}" + nl +
        "                        jobsWithStatus={jobsWithStatus}" + nl +
        "                        refreshing={refreshing}" + nl +
        "                        onRefresh={onRefresh}" + nl +
        "                        availableJobsForPro={availableJobsForPro}" + nl +
        "                        spin={spin}" + nl +
        "                        setView={setView}" + nl +
        "                        getProStatusColor={getProStatusColor}" + nl +
        "                        handleOpenJobDetail={handleOpenJobDetail}" + nl +
        "                    />" + nl +
        "                )}";

    const before = content.substring(0, startIdx);
    const after = content.substring(endIdx + endStr.length);
    content = before + replacement + after;

    fs.writeFileSync(path, content, 'utf8');
    console.log("Replaced successfully!");
} else {
    console.log("Could not find boundaries.");
}
