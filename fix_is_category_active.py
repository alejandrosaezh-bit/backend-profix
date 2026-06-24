import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "isLoadingProfile={isLoadingProfile}",
    "isLoadingProfile={isLoadingProfile}\n                            isCategoryActive={catCurrentProfile?.isActive !== false}"
)

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

