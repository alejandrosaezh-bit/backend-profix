import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add scrollRef
if "const scrollRef = useRef(null);" not in content:
    content = content.replace(
        "const sortedCategories =",
        """const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current && activeCategories.length > 0) {
            const index = activeCategories.findIndex(c => (c.fullName || c.name) === (selectedCategory?.fullName || selectedCategory?.name || selectedCategory));
            if (index !== -1) {
                scrollRef.current.scrollTo({ x: index * Dimensions.get('window').width, animated: true });
            }
        }
    }, [selectedCategory, activeCategories.length]);

    const sortedCategories ="""
    )

# Fix handleChat and handleOffer
content = content.replace("onChat={handleChat}", "onContact={onContact}")
content = content.replace("onOffer={handleOffer}", "")

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed scroll view undefined vars")
