import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = "const scrollRef = useRef(null);"
animation_logic = """const scrollRef = useRef(null);

    // --- CATEGORY INDICATOR ANIMATION ---
    const categoryFadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!selectedCategory) return;
        
        categoryFadeAnim.stopAnimation();
        categoryFadeAnim.setValue(1);
        
        const timer = setTimeout(() => {
            Animated.timing(categoryFadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true
            }).start();
        }, 1500);
        
        return () => clearTimeout(timer);
    }, [selectedCategory]);
    // -----------------------------------
"""

content = content.replace(target, animation_logic)

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch 2 applied")
