import re

with open('src/components/profile/ProfessionalProfileView.js', 'r', encoding='utf-8') as f:
    content = f.read()

testimonials_code = """
                {/* TESTIMONIALS (SOCIAL) */}
                {combinedHistory.some(h => h.review) && (
                    <View style={{ marginTop: 25, paddingHorizontal: 20 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 15 }}>Testimonios</Text>
                        {combinedHistory.filter(h => h.review).map((item, idx) => (
                            <View key={idx} style={{ flexDirection: 'row', marginBottom: 15, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12 }}>
                                <ExpoImage source={{ uri: item.review?.reviewer?.avatar || 'https://ui-avatars.com/api/?name=C' }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>{item.review?.reviewer?.name || 'Cliente'}</Text>
                                        <View style={{ flexDirection: 'row' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <FontAwesome5 key={i} name="star" solid={i < (item.review.rating || 5)} size={10} color="#FBBF24" style={{ marginLeft: 2 }} />
                                            ))}
                                        </View>
                                    </View>
                                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' }}>Proyecto: {item.title}</Text>
                                    <Text style={{ fontSize: 14, color: '#4B5563', marginTop: 8, fontStyle: 'italic', lineHeight: 20 }}>&quot;{item.review?.comment}&quot;</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
                
                <View style={{ height: 100 }} />"""

# We need to replace the <View style={{ height: 100 }} /> at the end of renderSocial
content = content.replace("<View style={{ height: 100 }} />", testimonials_code)

with open('src/components/profile/ProfessionalProfileView.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied.")
