import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "    if (!isOwner || isPreviewMode) {"
end_marker = "                </View>\n\n                {isOwner && ("

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print("Could not find start or end marker")
    exit(1)

replacement = """    return (
        <ProfessionalProfileView
            user={user}
            profileData={profileData}
            categoryKey={selectedCategory?.name || selectedCategory}
            isOwner={isOwner}
            isPreviewMode={isPreviewMode}
            activeTheme={activeTheme}
            activeColor={activeColor}
            catReviews={catReviews}
            categoryStats={categoryStats}
            combinedHistory={combinedHistory}
            isLoadingProfile={isLoadingProfile}
            isCategoryActive={isCategoryActive}
            onViewImage={onViewImage}
            onViewGallery={setSelectedGallery}
            onContact={() => { /* Implementado desde el padre en RequestDetailClient */ }}
            onEditProfile={() => setIsEditing(true)}
            onChangeCategory={() => setIsCategorySelectionVisible(true)}
            onGamification={() => setIsGamificationVisible(true)}
            onClose={onBack}
        >
                {isOwner && ("""

# Replace from start_idx to end_idx + len("                {isOwner && (")
new_content = content[:start_idx] + replacement + content[end_idx + len(end_marker) - len("                {isOwner && ("):]

# Replace </ScrollView> before CrossProfileNotificationModal with </ProfessionalProfileView>
scroll_marker = "            </ScrollView>\n\n            <CrossProfileNotificationModal"
new_scroll_marker = "        </ProfessionalProfileView>\n\n            <CrossProfileNotificationModal"

new_content = new_content.replace(scroll_marker, new_scroll_marker)

# We also need to add `import ProfessionalProfileView` at the top
import_marker = "import { ProSubscriptionModal } from '../components/profile/ProSubscriptionModal';"
import_replacement = "import ProfessionalProfileView from '../components/profile/ProfessionalProfileView';\nimport { ProSubscriptionModal } from '../components/profile/ProSubscriptionModal';"
new_content = new_content.replace(import_marker, import_replacement)

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully cleaned up ProfessionalProfileScreen.js")
