import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

helper = """
    const getProfile = (key) => {
        if (!profileData || !profileData.profiles) return null;
        if (profileData.profiles instanceof Map) return profileData.profiles.get(key);
        return profileData.profiles[key];
    };

    const getProfileKeys = () => {
        if (!profileData || !profileData.profiles) return [];
        if (profileData.profiles instanceof Map) return Array.from(profileData.profiles.keys());
        return Object.keys(profileData.profiles);
    };
"""

# Insert helper after const [selectedGallery, setSelectedGallery] = useState(null);
if "const getProfile =" not in content:
    content = content.replace(
        "const [selectedGallery, setSelectedGallery] = useState(null);",
        "const [selectedGallery, setSelectedGallery] = useState(null);\n" + helper
    )

# Replace occurrences
content = content.replace("profileData.profiles?.[currentKey]", "getProfile(currentKey)")
content = content.replace("profileData.profiles?.[keyA]", "getProfile(keyA)")
content = content.replace("profileData.profiles?.[keyB]", "getProfile(keyB)")
content = content.replace("profileData.profiles?.[categoryKey]", "getProfile(categoryKey)")
content = content.replace("profileData.profiles?.[key]", "getProfile(key)")

# Fix Object.keys
content = content.replace("Object.keys(profileData.profiles || {})", "getProfileKeys()")
content = content.replace("profileData.profiles[k]", "getProfile(k)")

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed profile extraction logic!")
