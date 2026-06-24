import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """            {/* FADING CATEGORY INDICATOR */}
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
            </Animated.View>"""

replacement = """            {/* FADING CATEGORY INDICATOR (FULL SCREEN DIMMER) */}
            <Animated.View style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.4)',
                opacity: categoryFadeAnim,
                zIndex: 100,
                elevation: 10,
                pointerEvents: 'none',
            }}>
                <View style={{
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    paddingHorizontal: 40,
                    paddingVertical: 20,
                    borderRadius: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 10,
                }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 28, textAlign: 'center' }}>
                        {selectedCategory?.fullName || selectedCategory?.name || 'Categoría'}
                    </Text>
                </View>
            </Animated.View>"""

content = content.replace(target, replacement)

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch 3 applied")
