import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "setIsProfileEditVisible": "setIsEditing",
    "isProfileEditVisible": "isEditing",
    "setCategoryModalVisible": "setIsCategorySelectionVisible",
    "categoryModalVisible": "isCategorySelectionVisible",
    "setIsPersonalEditVisible": "setIsEditingPersonal",
    "isPersonalEditVisible": "isEditingPersonal",
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed state variables")
