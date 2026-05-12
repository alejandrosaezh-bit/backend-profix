const fs = require('fs');

try {
  let content = fs.readFileSync('src/screens/ClientProfileView.js', 'utf8');

  // 1. Add combinedHistory logic after statistics
  const targetLogic = `    // Calcular estadísticas de trabajo`;
  const insertLogic = `    // COMBINAR TRABAJOS CON SUS REVIEWS (Para "Historial y Valoraciones")
    const combinedHistory = clientJobs
        .filter(job => ['completed', 'rated', 'Culminada'].includes(job.status))
        .map(job => {
            const jobReview = reviews.find(r => r.jobId === job._id || r.job === job._id);
            return {
                ...job,
                review: jobReview
            };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Calcular estadísticas de trabajo`;

  content = content.replace(targetLogic, insertLogic);

  // 2. Replace the separate PORTAFOLIO and OPINIONES sections with the combined section
  // Replace from {/* PORTAFOLIO DE TRABAJOS */} up to but not including </> (the end of the normal state)
  const renderRegex = /\{\/\* PORTAFOLIO DE TRABAJOS \*\/\}(.|\r|\n)*?<ClientReviewsList reviews=\{reviews\} isLoading=\{loading\} \/>/m;

  const combinedSection = `{/* UNIFIED HISTORY SECTION */}
                                <View style={{ marginBottom: 25, marginTop: 25, marginHorizontal: -20 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 20 }}>
                                        <Text style={[styles.sectionTitle, { paddingHorizontal: 0, fontSize: 18, marginBottom: 0, color: '#111827', textTransform: 'none' }]}>Historial y Valoraciones</Text>
                                    </View>
                                    {combinedHistory && combinedHistory.length > 0 ? (
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 15 }}
                                        >
                                            {combinedHistory.map((item, index) => (
                                                <View key={index} style={{ backgroundColor: 'white', width: 160, borderRadius: 20, marginRight: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' }}>
                                                    {/* PORTADA DEL TRABAJO */}
                                                    {item.images && item.images.length > 0 ? (
                                                        <Image source={{ uri: item.images[0] }} style={{ width: '100%', aspectRatio: 1, backgroundColor: '#E2E8F0', resizeMode: 'cover' }} />
                                                    ) : (
                                                        <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
                                                            <Feather name="image" size={32} color="#CBD5E1" />
                                                        </View>
                                                    )}

                                                    <View style={{ padding: 12, alignItems: 'center' }}>
                                                        {/* TITULO */}
                                                        <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#1E293B', marginBottom: 8, textAlign: 'center' }} numberOfLines={2}>{item.title}</Text>
                                                        
                                                        {item.review ? (
                                                            <View style={{ width: '100%', alignItems: 'center' }}>
                                                                {/* PROFESIONAL INFO */}
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                                                                    {item.review.reviewer?.avatar ? (
                                                                        <Image source={{ uri: item.review.reviewer.avatar }} style={{ width: 20, height: 20, borderRadius: 10, marginRight: 6, resizeMode: 'cover' }} />
                                                                    ) : (
                                                                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 6 }}>
                                                                            <Feather name="user" size={10} color="#2563EB" />
                                                                        </View>
                                                                    )}
                                                                    <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }} numberOfLines={1}>{item.review.reviewer?.name || 'Profesional'}</Text>
                                                                </View>
                                                                
                                                                {/* ESTRELLAS */}
                                                                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 6 }}>
                                                                    {[...Array(5)].map((_, idx) => (
                                                                        <FontAwesome5 key={idx} name="star" solid={idx < (item.review.rating || 5)} size={10} color="#FBBF24" style={{ marginRight: 2 }} />
                                                                    ))}
                                                                </View>
                                                                
                                                                {/* COMENTARIO */}
                                                                <Text style={{ fontSize: 12, color: '#4B5563', fontStyle: 'italic', textAlign: 'center' }} numberOfLines={3}>"{item.review.comment || 'Buen cliente.'}"</Text>
                                                            </View>
                                                        ) : (
                                                            <View style={{ width: '100%', alignItems: 'center' }}>
                                                                <Text style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center' }}>Completado sin reseña.</Text>
                                                            </View>
                                                        )}

                                                        {/* BOTON VER MAS FOTOS */}
                                                        {item.images && item.images.length > 0 && (
                                                            <TouchableOpacity 
                                                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', paddingVertical: 8, borderRadius: 10, marginTop: 12, width: '100%' }}
                                                                onPress={() => setSelectedGallery(item.images)}
                                                            >
                                                                <Feather name="image" size={14} color="#2563EB" style={{ marginRight: 6 }} />
                                                                <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 11 }}>Ver fotos ({item.images.length})</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                </View>
                                            ))}
                                        </ScrollView>
                                    ) : (
                                        <View style={{ alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 }}>
                                            <Feather name="folder" size={40} color="#E2E8F0" />
                                            <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 15 }}>Aún no hay historial de trabajos ni valoraciones para mostrar.</Text>
                                        </View>
                                    )}
                                </View>`;

  content = content.replace(renderRegex, combinedSection);

  // Import ExpoImage if needed, but I used Image above to keep it consistent.

  fs.writeFileSync('src/screens/ClientProfileView.js', content, 'utf8');
  console.log('done patching history');
} catch(e) {
  console.error(e);
}
