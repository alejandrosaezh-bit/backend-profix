import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../utils/api';

export default function CategoryDetailScreen({ category, subcategories, onBack, onSelectSubcategory }) {
    const [ads, setAds] = useState([]);

    useEffect(() => {
        loadAds();
    }, []);

    const loadAds = async () => {
        try {
            const allAds = await api.getBusinesses();
            const filtered = allAds.filter(ad => ad.category === category.name);
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
                <Text style={styles.headerTitle}>{category.name}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* ADS DESIGN V2 */}
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

                {/* SUBCATEGORÍAS */}
                <Text style={styles.sectionTitle}>¿Qué necesitas?</Text>
                <View style={styles.subcatGrid}>
                    {subcategories.map((sub, index) => (
                        <TouchableOpacity key={index} style={styles.subcatCard} onPress={() => onSelectSubcategory(sub)}>
                            <View style={[styles.iconCircle, { backgroundColor: category.color || '#FFF7ED' }]}>
                                <Feather name="chevron-right" size={20} color={category.iconColor || '#EA580C'} />
                            </View>
                            <Text style={styles.subcatText}>{sub}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        ...Platform.select({
            web: { boxShadow: '0px 4px 6px rgba(0,0,0,0.1)' },
            default: { elevation: 4 }
        })
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    content: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12, marginTop: 8 },

    subcatGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    subcatCard: {
        width: '48%', backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' },
            default: { elevation: 1 }
        })
    },
    iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    subcatText: { fontSize: 13, fontWeight: '600', color: '#374151', flex: 1 },

    proCard: {
        backgroundColor: 'white', padding: 12, borderRadius: 16, marginRight: 12, width: 140, alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' },
            default: { elevation: 2 }
        })
    },
    proImage: { width: 60, height: 60, borderRadius: 30, marginBottom: 8 },
    proName: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
    proSub: { fontSize: 11, color: '#6B7280', marginBottom: 4, textAlign: 'center' },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { fontSize: 11, color: '#4B5563', marginLeft: 4 },

    bizCard: {
        backgroundColor: 'white', padding: 12, borderRadius: 16, marginRight: 12, width: 160, alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' },
            default: { elevation: 2 }
        })
    },
    bizImage: { width: 80, height: 40, marginBottom: 8 },
    bizName: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
    bizPromo: { fontSize: 11, color: '#EA580C', fontWeight: '600', marginTop: 2 },

    emptyText: { color: '#9CA3AF', fontStyle: 'italic' },

    // AD STYLES V2
    adCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        minHeight: 120, // Ensure minimum height to look good
        ...Platform.select({
            web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' },
            default: { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }
        })
    },
    adImage: {
        width: 120,
        height: '100%',
    },
    adContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'center'
    },
    adTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4, flex: 1 },
    adBadgeContainer: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 5 },
    adBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#6B7280' },

    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    adInfo: { fontSize: 12, color: '#4B5563', marginLeft: 6 },

    whatsappButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#25D366',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 8,
        alignSelf: 'flex-start'
    },
    whatsappText: { color: 'white', fontWeight: 'bold', fontSize: 12, marginLeft: 6 }
});
