import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../utils/api';

export default function ProfessionalJobView({ navigation }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { userInfo } = useContext(AuthContext);

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
            <View style={styles.headerRow}>
                <Text style={styles.categoryBadge}>{item.category?.name || 'General'}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

            <View style={styles.footerRow}>
                <View style={styles.locationContainer}>
                    <Feather name="map-pin" size={14} color="#666" />
                    <Text style={styles.location}>{item.location}</Text>
                </View>
                <Text style={[styles.status, item.proStatus === 'PRESUPUESTADA' ? { color: '#F59E0B' } : {}]}>
                    {item.proStatus || 'DISPONIBLE'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.topHeader}>
                <Text style={styles.headerTitle}>Trabajos Disponibles</Text>
                <TouchableOpacity onPress={onRefresh}>
                    <Feather name="refresh-cw" size={20} color="#007AFF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={jobs}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {(!userInfo?.activeCategories || userInfo.activeCategories.length === 0) ? (
                            <View style={styles.promoContainer}>
                                <View style={styles.iconCircle}>
                                    <Feather name="briefcase" size={40} color="#EA580C" />
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
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
    list: { paddingBottom: 20 },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    categoryBadge: { backgroundColor: '#E0F2FE', color: '#0284C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 12, fontWeight: '600', overflow: 'hidden' },
    date: { color: '#9CA3AF', fontSize: 12 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
    description: { color: '#4B5563', fontSize: 14, marginBottom: 12 },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    location: { color: '#6B7280', fontSize: 13 },
    status: { color: '#059669', fontSize: 12, fontWeight: 'bold' },
    status: { color: '#059669', fontSize: 12, fontWeight: 'bold' },
    emptyContainer: { padding: 20, alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 15, color: '#374151', fontSize: 16, fontWeight: '600' },
    subEmptyText: { textAlign: 'center', marginTop: 8, color: '#6B7280', fontSize: 14, paddingHorizontal: 20 },

    // Promo Styles
    promoContainer: { alignItems: 'center', backgroundColor: 'white', padding: 24, borderRadius: 24, marginTop: 20, shadowColor: '#EA580C', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFEDD5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    promoTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 12 },
    promoText: { fontSize: 15, color: '#4B5563', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    actionButton: { flexDirection: 'row', backgroundColor: '#EA580C', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16, alignItems: 'center', gap: 8, shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
    actionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});