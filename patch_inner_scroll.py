import re

with open('src/components/profile/ProfessionalProfileView.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add prop to ProfessionalProfileView
target_props = "isCategoryActive = true,\n    onViewImage,"
new_props = "isCategoryActive = true,\n    setOuterScrollEnabled,\n    onViewImage,"
content = content.replace(target_props, new_props)

# 2. Add touch events to horizontal ScrollViews
scroll_target = "<ScrollView horizontal showsHorizontalScrollIndicator={false}"
scroll_replacement = """<ScrollView horizontal showsHorizontalScrollIndicator={false}
                            onTouchStart={() => setOuterScrollEnabled && setOuterScrollEnabled(false)}
                            onTouchEnd={() => setOuterScrollEnabled && setOuterScrollEnabled(true)}
                            onTouchCancel={() => setOuterScrollEnabled && setOuterScrollEnabled(true)}
                            onScrollEndDrag={() => setOuterScrollEnabled && setOuterScrollEnabled(true)}"""
                            
content = content.replace(scroll_target, scroll_replacement)

with open('src/components/profile/ProfessionalProfileView.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch 5 applied")
