import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Animated to imports
content = content.replace("    ActivityIndicator,\n    PanResponder\n} from 'react-native';", "    ActivityIndicator,\n    PanResponder,\n    Animated\n} from 'react-native';")

# 2. Add categoryFadeAnim and useEffect
target_state = "const [activeCategories, setActiveCategories] = useState([]);"
animation_logic = """const [activeCategories, setActiveCategories] = useState([]);

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
content = content.replace(target_state, animation_logic)

# 3. Add the Animated.View after </ScrollView>
target_scroll_end = "</ScrollView>"
animated_view = """</ScrollView>

            {/* FADING CATEGORY INDICATOR */}
            <Animated.View style={{
                position: 'absolute',
                top: Platform.OS === 'ios' ? 60 : 30,
                alignSelf: 'center',
                backgroundColor: 'rgba(0,0,0,0.75)',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 25,
                opacity: categoryFadeAnim,
                zIndex: 100,
                elevation: 10,
                pointerEvents: 'none',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            }}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
                    {selectedCategory?.fullName || selectedCategory?.name || 'Categoría'}
                </Text>
            </Animated.View>
"""
content = content.replace(target_scroll_end, animated_view)

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied for fading indicator")
