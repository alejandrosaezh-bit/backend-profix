import re

with open('src/components/profile/ProProfileModals.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """                    <View style={{ flexDirection: 'row', gap: 12, paddingTop: 15, paddingBottom: Platform.OS === 'android' ? 20 : 0, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                        <TouchableOpacity
                            style={[styles.btnCancel, { backgroundColor: '#F1F5F9' }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.btnTextCancel, { color: '#64748B' }]}>Descartar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btnSave, { backgroundColor: activeColor }]} onPress={handleSaveProfessional}>
                            <Text style={styles.btnTextSave}>Guardar Perfil</Text>
                        </TouchableOpacity>
                    </View>"""

replacement = """                    <View style={{ flexDirection: 'row', backgroundColor: 'white', borderTopWidth: 1, borderColor: '#E5E7EB', paddingBottom: Platform.OS === 'ios' ? 25 : 10, paddingTop: 12, minHeight: 70, marginHorizontal: -20, marginBottom: -20, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
                        <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }} onPress={onClose}>
                            <Feather name="x" size={22} color="#64748B" />
                            <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '600' }}>Descartar</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }} onPress={handleSaveProfessional}>
                            <Feather name="check" size={22} color={activeColor} />
                            <Text style={{ fontSize: 11, color: activeColor, marginTop: 4, fontWeight: '600' }}>Guardar Perfil</Text>
                        </TouchableOpacity>
                    </View>"""

if target in content:
    new_content = content.replace(target, replacement)
    with open('src/components/profile/ProProfileModals.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully replaced modal footer")
else:
    print("Target string not found!")
