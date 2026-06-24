import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update import
content = content.replace(
    "import { ProCategorySelectionModal, ProPersonalEditModal, ProProfileEditModal } from '../components/profile/ProProfileModals';",
    "import { ProCategorySelectionModal, ProPersonalEditModal, ProProfileEditModal, ProThemeSelectorModal } from '../components/profile/ProProfileModals';"
)

# 2. Insert modal
modal_code = """                {/* MODAL: SELECCIÓN DE TEMA */}
                <ProThemeSelectorModal
                    visible={isThemeSelectorVisible}
                    onClose={() => setIsThemeSelectorVisible(false)}
                    currentTheme={profileData?.profileTheme || currentCatProfile?.profileTheme || 'social'}
                    currentColor={currentCatProfile?.profileColor || '#2563EB'}
                    onSave={(theme, color) => {
                        updateCurrentProfile({ profileTheme: theme, profileColor: color });
                        
                        setTimeout(() => {
                            const updatedProfiles = { ...profileData.profiles };
                            updatedProfiles[categoryKey] = { 
                                ...currentCatProfile, 
                                profileTheme: theme, 
                                profileColor: color 
                            };
                            if (onUpdate) {
                                onUpdate({ ...profileData, profileTheme: theme, profiles: updatedProfiles });
                            }
                        }, 100);
                    }}
                />

                {/* MODAL 3: DATOS PERSONALES */}"""

content = content.replace("{/* MODAL 3: DATOS PERSONALES */}", modal_code)

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched successfully")
