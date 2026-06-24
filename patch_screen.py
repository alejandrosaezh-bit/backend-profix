import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace profileData={profileData} with profileData={{ ...profileData, ...catCurrentProfile }}
# Be careful to only replace it inside the ProfessionalProfileView component in the map function.
# Let's use regex to find the ProfessionalProfileView call inside activeCategories.map
target_block = """                        <ProfessionalProfileView
                            user={user}
                            profileData={profileData}
                            categoryKey={catKey}"""

replacement = """                        <ProfessionalProfileView
                            user={user}
                            profileData={{ ...profileData, ...catCurrentProfile }}
                            categoryKey={catKey}"""

content = content.replace(target_block, replacement)

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched!")
