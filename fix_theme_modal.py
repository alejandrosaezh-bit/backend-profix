import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import if missing
if 'ProThemeSelectorModal' not in content:
    content = content.replace("ProProfileEditModal", "ProProfileEditModal, ProThemeSelectorModal")

# Add the modal at the end before </>
if '<ProThemeSelectorModal' not in content:
    modal_code = """
            <ProThemeSelectorModal
                visible={isThemeSelectorVisible}
                onClose={() => setIsThemeSelectorVisible(false)}
                currentTheme={activeTheme}
                currentColor={activeColor}
                onSave={(theme, color) => {
                    const newProfiles = { ...profileData.profiles };
                    if (newProfiles[categoryKey]) {
                        newProfiles[categoryKey].profileTheme = theme;
                        newProfiles[categoryKey].profileColor = color;
                    }
                    const newData = { ...profileData, profiles: newProfiles };
                    setProfileData(newData);
                    if (onUpdate) onUpdate(newData);
                    setIsThemeSelectorVisible(false);
                }}
            />
        </>
    );
}"""
    content = content.replace("        </>\n    );\n}", modal_code)

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Restored ProThemeSelectorModal in ProfessionalProfileScreen.js")
