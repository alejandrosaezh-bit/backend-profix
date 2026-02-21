import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../context/AuthContext';
import { api } from '../utils/api';

export default function ProfessionalJobView({ navigation }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { userInfo } = useContext(AuthContext);

    // Filtros y estados (para replicar la imagen de la UI)
    const [filterCategory, setFilterCategory] = useState("Todas");
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);

    const categories = ["Todas", ...(userInfo?.activeCategories || [])];

    const loadJobs = async () => {
        try {
            const res = await api.getJobs();
            setJobs(res);
        } catch (e) {
            console.error("Error loading jobs:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadJobs();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadJobs();
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RequestDetail', { item })}
        >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={styles.avatarContainer}>
                    {item.client?.avatar ? (
                        <Image source={{ uri: item.client.avatar }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                    ) : (
                        <Feather name="user" size={28} color="#94A3B8" />
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.topRow}>
                        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: '#E0E7FF' }]}>
                            <Text style={[styles.statusText, { color: '#2563EB' }]}>{item.proStatus || 'CONTACTADA'}</Text>
                        </View>
                    </View>

                    <View style={styles.cardMetaRow}>
                        <Feather name="user" size={14} color="#6B7280" />
                        <Text style={styles.cardMetaText}>{item.client?.name || 'Cliente'}</Text>
                    </View>

                    <View style={styles.cardMetaRow}>
                        <Feather name="map-pin" size={14} color="#6B7280" />
                        <Text style={styles.cardMetaText}>{item.location}</Text>
                    </View>

                    <View style={styles.cardMetaRow}>
                        <Feather name="tag" size={14} color="#6B7280" />
                        <Text style={styles.cardMetaText}>
                            {item.category?.name || 'Hogar'} {item.subcategory ? `> ${item.subcategory}` : ''}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.date}>Publicado el {new Date(item.createdAt).toLocaleDateString()}</Text>

                <View style={styles.offersBadge}>
                    <Feather name="file-text" size={14} color="#4B5563" />
                    <Text style={styles.offersBadgeText}>{item.offers?.length || 0}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;

    const filteredJobs = filterCategory === "Todas"
        ? jobs
        : jobs.filter(j => j.category?.name === filterCategory);

    return (
        <View style={styles.container}>
            {/* Blue Header */}
            <View style={styles.headerContainer}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Trabajos Disponibles</Text>

                    <TouchableOpacity
                        onPress={onRefresh}
                        style={styles.archiveButton}
                    >
                        <MaterialCommunityIcons name="archive-outline" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Category Dropdown inside header */}
                <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 6 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 6, fontWeight: 'bold' }}>Categoría</Text>
                        <TouchableOpacity
                            onPress={() => setCategoryModalVisible(true)}
                            style={styles.dropdownButton}
                        >
                            <Text style={styles.dropdownButtonText} numberOfLines={1}>{filterCategory}</Text>
                            <Feather name="chevron-down" size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Modal de Categorías */}
            <Modal
                visible={categoryModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setCategoryModalVisible(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCategoryModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Filtrar por Categoría</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {categories.map((cat, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.modalOption, filterCategory === cat && styles.modalOptionSelected]}
                                    onPress={() => {
                                        setFilterCategory(cat);
                                        setCategoryModalVisible(false);
                                    }}
                                >
                                    <Text style={[styles.modalOptionText, filterCategory === cat && styles.modalOptionTextSelected]}>{cat}</Text>
                                    {filterCategory === cat && <Feather name="check" size={16} color="#2563EB" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            <FlatList
                data={filteredJobs}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {(!userInfo?.activeCategories || userInfo.activeCategories.length === 0) ? (
                            <View style={styles.promoContainer}>
                                <View style={styles.iconCircle}>
                                    <Feather name="briefcase" size={40} color="#2563EB" />
                                </View>
                                <Text style={styles.promoTitle}>¡Comienza a ganar dinero ahora!</Text>
                                <Text style={styles.promoText}>
                                    Tu perfil profesional es tu carta de presentación. Activa las categorías en las que eres experto para comenzar a recibir ofertas de clientes cercanos.
                                </Text>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => navigation.navigate('ProfessionalProfile')}
                                >
                                    <Text style={styles.actionButtonText}>Configurar mi Perfil</Text>
                                    <Feather name="arrow-right" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={{ alignItems: 'center', marginTop: 50 }}>
                                <Feather name="inbox" size={48} color="#D1D5DB" />
                                <Text style={styles.emptyText}>No hay trabajos disponibles en tus zonas/categorías por ahora.</Text>
                                <Text style={styles.subEmptyText}>Te notificaremos cuando alguien necesite de tus servicios.</Text>
                            </View>
                        )}
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header Styles
    headerContainer: {
        paddingVertical: 18,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        backgroundColor: '#2563EB',
        elevation: 0,
        marginBottom: 8
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    archiveButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    dropdownButtonText: { color: 'white', fontSize: 15, fontWeight: '600', flex: 1, marginRight: 10 },

    list: { paddingTop: 4, paddingBottom: 100 },

    // Card Styles
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginHorizontal: 4,
        marginTop: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#EFF6FF',
        elevation: 5,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#111827', flex: 1, marginRight: 8 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: 'bold' },

    cardMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    cardMetaText: { fontSize: 14, color: '#4B5563', marginLeft: 8, flex: 1 },

    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        marginTop: 16,
        paddingTop: 16
    },
    date: { color: '#9CA3AF', fontSize: 13 },
    offersBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
    offersBadgeText: { fontSize: 13, fontWeight: 'bold', color: '#374151' },

    emptyContainer: { padding: 20, alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 15, color: '#374151', fontSize: 16, fontWeight: '600' },
    subEmptyText: { textAlign: 'center', marginTop: 8, color: '#6B7280', fontSize: 14, paddingHorizontal: 20 },

    // Promo Styles
    promoContainer: { alignItems: 'center', backgroundColor: 'white', padding: 24, borderRadius: 24, marginTop: 20, shadowColor: '#2563EB', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    promoTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 12 },
    promoText: { fontSize: 15, color: '#4B5563', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    actionButton: { flexDirection: 'row', backgroundColor: '#2563EB', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16, alignItems: 'center', gap: 8, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
    actionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 16 },
    modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalOptionSelected: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 10, borderBottomWidth: 0 },
    modalOptionText: { fontSize: 16, color: '#475569' },
    modalOptionTextSelected: { color: '#2563EB', fontWeight: 'bold' }
});