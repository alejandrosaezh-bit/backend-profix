const fs = require('fs');

try {
  let content = fs.readFileSync('src/screens/ClientProfileView.js', 'utf8');

  // Replace top wrapper
  content = content.replace(
      /\{\/\* CONTENIDO PRINCIPAL EN TARJETAS \*\/\}\r?\n\s*<View style=\{styles\.cardContainer\}>/m,
      `{/* CONTENIDO PRINCIPAL EN TARJETAS */}
                            <View style={styles.cardContainer}>
                                {loading ? (
                                    <View style={{ padding: 40, alignItems: 'center', backgroundColor: 'white', borderRadius: 24, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, marginBottom: 20 }}>
                                        <ActivityIndicator size="large" color="#EA580C" />
                                        <Text style={{ marginTop: 15, color: '#64748B' }}>Cargando perfil del cliente...</Text>
                                    </View>
                                ) : (
                                    <>`
  );

  // Replace bottom wrapper
  content = content.replace(
      /                            <\/View>\r?\n                        <\/ScrollView>/m,
      `                                    </>
                                )}
                            </View>
                        </ScrollView>`
  );

  fs.writeFileSync('src/screens/ClientProfileView.js', content, 'utf8');
  console.log('done loading wrapper');
} catch(e) {
  console.error(e);
}
