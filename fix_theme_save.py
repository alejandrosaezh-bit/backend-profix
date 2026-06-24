import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """                onSave={(theme, color) => {
                    const newProfiles = { ...profileData.profiles };
                    if (newProfiles[categoryKey]) {
                        newProfiles[categoryKey].profileTheme = theme;
                        newProfiles[categoryKey].profileColor = color;
                    }
                    const newData = { ...profileData, profiles: newProfiles };
                    setProfileData(newData);
                    if (onUpdate) onUpdate(newData);
                    setIsThemeSelectorVisible(false);
                }}"""

replacement = """                onSave={(theme, color) => {
                    let profilesObject = {};
                    if (profileData.profiles instanceof Map) {
                        profileData.profiles.forEach((value, key) => {
                            profilesObject[key] = value;
                        });
                    } else {
                        profilesObject = { ...profileData.profiles };
                    }
                    
                    if (profilesObject[categoryKey]) {
                        profilesObject[categoryKey] = {
                            ...profilesObject[categoryKey],
                            profileTheme: theme,
                            profileColor: color
                        };
                    }
                    
                    const newData = { ...profileData, profiles: profilesObject };
                    setProfileData(newData);
                    if (onUpdate) onUpdate(newData);
                    setIsThemeSelectorVisible(false);
                }}"""

if target in content:
    new_content = content.replace(target, replacement)
    
    # Also fix activeTheme definition to read from currentCatProfile
    new_content = new_content.replace(
        "const activeTheme = profileData.profileTheme || 'social';",
        "const activeTheme = (profileData.profiles instanceof Map ? profileData.profiles.get(categoryKey)?.profileTheme : profileData.profiles?.[categoryKey]?.profileTheme) || profileData.profileTheme || 'social';"
    )
    
    with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully fixed theme save logic")
else:
    print("Target string not found!")

