import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace(
    "import { ProGamificationModal } from '../components/profile/ProGamificationModal';",
    "import { ProGamificationModal } from '../components/profile/ProGamificationModal';\nimport ProfessionalProfileView from '../components/profile/ProfessionalProfileView';"
)

# We need to replace the ENTIRE return statement.
# Finding where the return starts:
# `    if (!isOwner || isPreviewMode) {`
# to the very end of the component.
# Actually, it's safer to just replace the two big blocks.

# Let's just create a script that replaces everything after `const activeTheme = currentCatProfile?.profileTheme || profileData.profileTheme || 'social';`
