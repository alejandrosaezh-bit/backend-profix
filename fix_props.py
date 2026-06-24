import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

wrong_props = """            <ProCategorySelectionModal
                visible={categoryModalVisible}
                onClose={() => setCategoryModalVisible(false)}
                user={user}
                profileData={profileData}
                onCategoryAdded={handleCategoryAdded}
            />"""

correct_props = """            <ProCategorySelectionModal
                visible={categoryModalVisible}
                onClose={() => setCategoryModalVisible(false)}
                categories={user?.categories || []}
                profileData={profileData}
                ICON_MAP={ICON_MAP}
                setSelectedCategory={setSelectedCategory}
                setIsEditing={() => {}}
                onActivateCategory={handleActivateCategory}
            />"""

content = content.replace(wrong_props, correct_props)

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed props")
