import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../utils/api';

export default function SubcategoryDetailScreen({ category, subcategory, onBack, onRequestQuote }) {
    const [ads, setAds] = useState([]);

    useEffect(() => {
        loadAds();
    }, []);

    const loadAds = async () => {
        try {
            const allAds = await api.getBusinesses();
            // Filter logic:
            // 1. Must match Category
            // 2. Must match Subcategory OR have no subcategory (target whole category)
            const filtered = allAds.filter(ad =>
                ad.category === category.name &&
                (!ad.subcategory || ad.subcategory === '' || ad.subcategory === subcategory)
            );
            setAds(filtered);
        } catch (e) {
            console.log("Error loading ads", e);
        }
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: category.iconColor || '#EA580C' }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>{subcategory}</Text>
                    <Text style={styles.headerSubtitle}>{category.name}</Text>
                </View>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* CTA PRINCIPAL (MOVED TO TOP) */}
                <View style={styles.ctaCard}>
                    <Text style={styles.ctaTitle}>¿Necesitas un {subcategory}?</Text>
                    <Text style={styles.ctaText}>Describe tu problema y recibe ofertas de los mejores profesionales.</Text>
                    <TouchableOpacity style={styles.ctaButton} onPress={onRequestQuote}>
                        <Text style={styles.ctaButtonText}>Pedir Presupuesto Gratis</Text>
                    </TouchableOpacity>
                </View>

                {/* ADS DESIGN V2 (MOVED BELOW CTA) */}
                {ads.map((biz) => (
                    <View key={biz._id} style={styles.adCard}>
                        {/* Image Side - Covers height */}
                        {biz.image ? (
                            <Image source={{ uri: biz.image }} style={styles.adImage} resizeMode="cover" />
                        ) : (
                            <View style={[styles.adImage, { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }]}>
                                <Feather name="image" size={24} color="#9CA3AF" />
                            </View>
                        )}

                        {/* Content Side */}
                        <View style={styles.adContent}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Text style={styles.adTitle}>{biz.name}</Text>
                                {biz.isPromoted && (
                                    <View style={styles.adBadgeContainer}>
                                        <Text style={styles.adBadgeText}>Anuncio</Text>
                                    </View>
                                )}
                            </View>

                            {/* Valoración (Condicional) */}
                            {biz.rating > 0 && (
                                <View style={styles.row}>
                                    <FontAwesome5 name="star" solid size={12} color="#FBBF24" />
                                    <Text style={styles.adInfo}>{biz.rating} Valoración</Text>
                                </View>
                            )}

                            {/* Dirección */}
                            {biz.address && (
                                <View style={styles.row}>
                                    <Feather name="map-pin" size={12} color="#6B7280" />
                                    <Text style={styles.adInfo} numberOfLines={1}>{biz.address}</Text>
                                </View>
                            )}

                            {/* Teléfono */}
                            {biz.phone && (
                                <View style={styles.row}>
                                    <Feather name="phone" size={12} color="#6B7280" />
                                    <Text style={styles.adInfo}>{biz.phone}</Text>
                                </View>
                            )}

                            {/* WhatsApp Button */}
                            {biz.whatsapp && (
                                <TouchableOpacity
                                    style={styles.whatsappButton}
                                    onPress={() => Linking.openURL(`https://wa.me/${biz.whatsapp.replace(/\D/g, '')}`)}
                                >
                                    <FontAwesome5 name="whatsapp" size={16} color="white" />
                                    <Text style={styles.whatsappText}>Contactar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}

                <View style={{ height: 80 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 0,
        borderWidth: 0
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
    backButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20 },

    ctaCard: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 24,
        marginBottom: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    ctaTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 12, textAlign: 'center' },
    ctaText: { fontSize: 16, color: '#4B5563', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
    ctaButton: {
        backgroundColor: '#EA580C',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        minHeight: 48,
        justifyContent: 'center'
    },
    ctaButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },

    // AD STYLES V2
    adCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        minHeight: 140,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    adImage: {
        width: 130,
        height: '100%',
    },
    adContent: {
        flex: 1,
        padding: 16,
        justifyContent: 'center'
    },
    adTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 6, flex: 1 },
    adBadgeContainer: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 },
    adBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#6B7280' },

    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    adInfo: { fontSize: 14, color: '#4B5563', marginLeft: 8 },

    whatsappButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#25D366',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginTop: 10,
        alignSelf: 'flex-start',
        minHeight: 48
    },
    whatsappText: { color: 'white', fontWeight: 'bold', fontSize: 14, marginLeft: 8 }
});
