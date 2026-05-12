const fs = require('fs');

try {
  let content = fs.readFileSync('src/screens/ClientProfileView.js', 'utf8');

  // 1. Loading Wrapper (Top)
  const topTarget = `                            {/* CONTENIDO PRINCIPAL EN TARJETAS */}
                            <View style={styles.cardContainer}>`;
  const topReplace = `                            {/* CONTENIDO PRINCIPAL EN TARJETAS */}
                            <View style={styles.cardContainer}>
                                {loading ? (
                                    <View style={{ padding: 40, alignItems: 'center', backgroundColor: 'white', borderRadius: 24, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, marginBottom: 20 }}>
                                        <ActivityIndicator size="large" color="#2563EB" />
                                        <Text style={{ marginTop: 15, color: '#64748B' }}>Cargando perfil del cliente...</Text>
                                    </View>
                                ) : (
                                    <>`;
  content = content.replace(topTarget, topReplace);

  // 2. Loading Wrapper (Bottom)
  const bottomTarget = `                            </View>
                        </ScrollView>`;
  const bottomReplace = `                                    </>
                                )}
                            </View>
                        </ScrollView>`;
  content = content.replace(bottomTarget, bottomReplace);

  // 3. Bio Empty State
  // Use regex to catch the whole bio block regardless of the MÃ character
  content = content.replace(
      /\{\/\* INFO BIO \(If exists\) \*\/\}(.|\r|\n)*?\)\s*:\s*null\}/m,
      `{/* INFO BIO (If exists) */}
                                        <View style={[styles.infoCard, { padding: 18, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#EFF6FF' }]}>
                                            <Text style={[styles.sectionTitle, { marginBottom: 12, color: '#2563EB' }]}>SOBRE MÍ</Text>
                                            {(client?.bio || client?.description) ? (
                                                <Text style={{ fontSize: 14, color: '#334155', fontStyle: 'italic', lineHeight: 22 }}>
                                                    "{client?.bio || client?.description}"
                                                </Text>
                                            ) : (
                                                <Text style={{ fontSize: 14, color: '#94A3B8', fontStyle: 'italic' }}>
                                                    Este cliente aún no ha agregado una descripción.
                                                </Text>
                                            )}
                                        </View>`
  );

  // 4. History Empty State
  // Replace the opening conditional
  content = content.replace(
      /\{combinedHistory && combinedHistory\.length > 0 && \(/m,
      `{combinedHistory && combinedHistory.length > 0 ? (`
  );
  
  // Replace the closing conditional
  content = content.replace(
      /                                            \)\}\r?\n                                        \/>\r?\n                                    <\/View>\r?\n                                \)\}/m,
      `                                            )}
                                        />
                                    ) : (
                                        <View style={{ alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 }}>
                                            <Feather name="folder" size={40} color="#E2E8F0" />
                                            <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 15 }}>Aún no hay historial de trabajos ni valoraciones para mostrar.</Text>
                                        </View>
                                    )}
                                </View>`
  );

  fs.writeFileSync('src/screens/ClientProfileView.js', content, 'utf8');
  console.log('Successfully updated ClientProfileView.js');
} catch(e) {
  console.error(e);
}
