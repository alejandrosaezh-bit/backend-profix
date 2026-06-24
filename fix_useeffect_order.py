import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

use_effect_code = """
    useEffect(() => {
        if (scrollRef.current && activeCategories.length > 0) {
            const index = activeCategories.findIndex(c => (c.fullName || c.name) === (selectedCategory?.fullName || selectedCategory?.name || selectedCategory));
            if (index !== -1) {
                scrollRef.current.scrollTo({ x: index * Dimensions.get('window').width, animated: true });
            }
        }
    }, [selectedCategory, activeCategories.length]);
"""

# Remove the existing useEffect
content = content.replace(use_effect_code, "")

# Find activeCategories definition
target_insertion = "    const activeCategories = sortedCategories.filter(cat => {\n        const key = cat.fullName || cat.name;\n        const profile = getProfile(key);\n        return !!profile && profile.isActive !== false;\n    });"

if target_insertion in content:
    content = content.replace(
        target_insertion,
        target_insertion + "\n" + use_effect_code
    )

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Moved useEffect down!")
