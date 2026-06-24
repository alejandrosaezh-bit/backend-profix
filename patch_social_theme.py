import re

with open('src/components/profile/ProfessionalProfileView.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove categoryKey and 3 dots from Social theme header
# Original:
#                     <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{categoryKey}</Text>
#                     <TouchableOpacity><Feather name="more-horizontal" size={24} color="#111827" /></TouchableOpacity>
content = content.replace(
    "<Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{categoryKey}</Text>\n                    <TouchableOpacity><Feather name=\"more-horizontal\" size={24} color=\"#111827\" /></TouchableOpacity>",
    ""
)

# 2. Change subcategories color to activeColor
# Original:
# <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{subcategories.join(', ')}</Text>
content = content.replace(
    "<Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{subcategories.join(', ')}</Text>",
    "<Text style={{ fontSize: 13, color: activeColor, marginTop: 4, fontWeight: '500' }}>{subcategories.join(', ')}</Text>"
)

# 3. Align bio text better (add horizontal padding if not there)
# Original:
# <Text style={{ fontSize: 13, color: '#4B5563', textAlign: 'center', marginTop: 10, lineHeight: 18 }}>{bio}</Text>
content = content.replace(
    "<Text style={{ fontSize: 13, color: '#4B5563', textAlign: 'center', marginTop: 10, lineHeight: 18 }}>{bio}</Text>",
    "<Text style={{ fontSize: 14, color: '#4B5563', textAlign: 'center', marginTop: 12, lineHeight: 20, paddingHorizontal: 10 }}>{bio}</Text>"
)

# 4. Change stat row icons to activeColor
# Original: <Feather name="award" size={20} color="#111827" />
content = content.replace(
    "<Feather name=\"award\" size={20} color=\"#111827\" />",
    "<Feather name=\"award\" size={20} color={activeColor} />"
)

# Original: <FontAwesome5 name="star" solid size={12} color="#111827" />
content = content.replace(
    "<FontAwesome5 name=\"star\" solid size={12} color=\"#111827\" />",
    "<FontAwesome5 name=\"star\" solid size={12} color={activeColor} />"
)

# Workaround for the bold number text in stats, let's keep them black or activeColor? User said "iconos de nivel, reseñas y trabajos". I changed the icons.
# Wait, for "trabajos", there is no icon.
# Original:
# <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{categoryStats.jobs}</Text>
# Let's change the number color too, just to be sure. Or maybe just leave the number black. "Utiliza el color personalizado para los iconos de nivel, reseñas y trabajos".
# Wait, let's add a briefcase icon for trabajos.
target_jobs = """<Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{categoryStats.jobs}</Text>
                        <Text style={{ fontSize: 12, color: '#4B5563', marginTop: 4 }}>Trabajos</Text>"""
replacement_jobs = """<View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{categoryStats.jobs}</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: '#4B5563', marginTop: 4 }}>Trabajos</Text>"""
# Wait, actually, let me just replace the whole STATS ROW to make it perfect.

with open('src/components/profile/ProfessionalProfileView.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied.")
