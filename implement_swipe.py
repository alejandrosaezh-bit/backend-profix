import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

if 'PanResponder' not in content:
    content = content.replace("import { useState, useEffect", "import { useState, useEffect, useRef")
    content = content.replace("from 'react-native';", "  PanResponder,\n} from 'react-native';")

# Add the activeCategories and panResponder logic
injection_point = "const handleMoveImage = (index, direction) => {"
logic = """
    // --- SWIPE PARA CAMBIAR CATEGORÍA ---
    const activeCategories = sortedCategories.filter(cat => {
        const key = cat.fullName || cat.name;
        const profile = profileData.profiles?.[key];
        return !!profile && profile.isActive !== false;
    });

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Solo capturar si es claramente un swipe horizontal
                return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 30;
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (!activeCategories || activeCategories.length <= 1) return;
                
                const currentIndex = activeCategories.findIndex(c => (c.fullName || c.name) === categoryKey);
                if (currentIndex === -1) return;

                if (gestureState.dx > 50) {
                    // Swiped right -> go to previous category
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : activeCategories.length - 1;
                    setSelectedCategory(activeCategories[prevIndex]);
                } else if (gestureState.dx < -50) {
                    // Swiped left -> go to next category
                    const nextIndex = currentIndex < activeCategories.length - 1 ? currentIndex + 1 : 0;
                    setSelectedCategory(activeCategories[nextIndex]);
                }
            }
        })
    ).current;

"""
if "const activeCategories =" not in content:
    content = content.replace(injection_point, logic + injection_point)

# Wrap the render
if "<View style={{ flex: 1 }} {...panResponder.panHandlers}>" not in content:
    content = content.replace(
        "<ProfessionalProfileView",
        "<View style={{ flex: 1 }} {...panResponder.panHandlers}>\n            <ProfessionalProfileView"
    )
    content = content.replace(
        "</ProfessionalProfileView>",
        "</ProfessionalProfileView>\n            </View>"
    )

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Swipe logic added successfully!")
