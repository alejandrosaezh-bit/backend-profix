import re

with open('src/components/profile/ProfessionalProfileView.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("onGamification,\n    onClose", "onGamification,\n    onClose,\n    children")
content = content.replace("{renderContent()}\n            </ScrollView>", "{renderContent()}\n                {children}\n            </ScrollView>")

with open('src/components/profile/ProfessionalProfileView.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched ProfessionalProfileView.js to support children")
