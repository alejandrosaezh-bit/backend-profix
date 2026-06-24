import re

with open('src/components/profile/ProfessionalProfileView.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the {isOwner && !isPreviewMode ? ( ... ) : ( ... )} block at the end of ProfessionalProfileView.js
start_marker = "            {/* BOTONES FLOTANTES SEGÚN ROL */}"
end_marker = "        </View>\n    );\n}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print("Could not find start or end marker")
    exit(1)

replacement = """            {/* BOTONES INFERIORES SEGÚN ROL */}
            {isOwner && !isPreviewMode ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#E5E7EB', paddingBottom: 25, minHeight: 70 }}>
                    <TouchableOpacity style={{ alignItems: 'center', padding: 8, flex: 1 }} onPress={onClose}>
                        <Feather name="arrow-left" size={24} color="#64748B" />
                        <Text style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>Atrás</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={{ alignItems: 'center', padding: 8, flex: 1 }} onPress={onChangeCategory}>
                        <Feather name="layers" size={24} color={activeColor} />
                        <Text style={{ fontSize: 10, color: activeColor, marginTop: 4 }}>Categoría</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ alignItems: 'center', padding: 8, flex: 1 }} onPress={onEditProfile}>
                        <Feather name="edit-3" size={24} color={activeColor} />
                        <Text style={{ fontSize: 10, color: activeColor, marginTop: 4 }}>Editar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ paddingHorizontal: 24, paddingVertical: 15, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#E5E7EB', paddingBottom: 30 }}>
                    <TouchableOpacity style={[styles.contactButton, { backgroundColor: activeColor, shadowColor: activeColor }]} onPress={onContact}>
                        <Text style={styles.contactButtonText}>Contactar o Cotizar</Text>
                    </TouchableOpacity>
                </View>
            )}
"""

new_content = content[:start_idx] + replacement + content[end_idx:]

with open('src/components/profile/ProfessionalProfileView.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated ProfessionalProfileView.js to use bottom nav style")
