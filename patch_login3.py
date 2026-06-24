import re

with open('src/screens/LoginScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

target_render = "      {/* Modal de Recuperación */}"
replacement_render = """      {/* ERROR OVERLAY */}
      {showErrorPopup && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center', alignItems: 'center',
          zIndex: 9999, elevation: 9999
        }}>
          <View style={{
            backgroundColor: 'white', padding: 25, borderRadius: 20,
            width: '85%', maxWidth: 400, alignItems: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 15
          }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
              <Feather name="alert-triangle" size={30} color="#DC2626" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 10, textAlign: 'center' }}>
              {isRegistering ? 'Error de Registro' : 'Atención'}
            </Text>
            <Text style={{ fontSize: 16, color: '#4B5563', textAlign: 'center', marginBottom: 25, lineHeight: 22 }}>
              {errorMessage}
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#DC2626', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 12, width: '100%', alignItems: 'center' }}
              onPress={() => setShowErrorPopup(false)}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal de Recuperación */}"""

if target_render in content:
    content = content.replace(target_render, replacement_render)
    with open('src/screens/LoginScreen.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Overlay inserted successfully")
else:
    print("Failed to find target")
