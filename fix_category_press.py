import re

with open('src/components/profile/ProProfileModals.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """                                    onPress={() => {
                                        setSelectedCategory(cat);
                                        if (onActivateCategory) onActivateCategory(catKey);
                                        onClose();
                                        setIsEditing(true);
                                    }}"""

replacement = """                                    onPress={() => {
                                        setSelectedCategory(cat);
                                        if (onActivateCategory) onActivateCategory(catKey);
                                        onClose();
                                    }}"""

if target in content:
    new_content = content.replace(target, replacement)
    with open('src/components/profile/ProProfileModals.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully removed setIsEditing(true)")
else:
    print("Target string not found!")

