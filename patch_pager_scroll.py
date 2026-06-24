import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state variable
target_state = "const [isEditing, setIsEditing] = useState(false);"
new_state = "const [isPagerScrollEnabled, setIsPagerScrollEnabled] = useState(true);\n    const [isEditing, setIsEditing] = useState(false);"
content = content.replace(target_state, new_state)

# 2. Add scrollEnabled to ScrollView
target_scroll = """<ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1, backgroundColor: '#F8FAFC' }}"""
new_scroll = """<ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            scrollEnabled={isPagerScrollEnabled}
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1, backgroundColor: '#F8FAFC' }}"""
content = content.replace(target_scroll, new_scroll)

# 3. Pass setIsPagerScrollEnabled to ProfessionalProfileView
target_prop = "onViewImage={onViewImage}"
new_prop = "setOuterScrollEnabled={setIsPagerScrollEnabled}\n                            onViewImage={onViewImage}"
content = content.replace(target_prop, new_prop)

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch 4 applied")
