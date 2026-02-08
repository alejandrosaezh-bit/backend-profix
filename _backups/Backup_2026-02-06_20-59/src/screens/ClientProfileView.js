import { ArrowLeft, Mail, Phone, Star } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../utils/api';

const ClientProfileView = ({ client, onBack }) => {
    // Fallback data if client object is minimal
    const name = client?.name || client?.clientName || 'Cliente';
    const email = client?.email || client?.clientEmail || 'No disponible';
    const image = client?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    // const rating = client?.rating || '4.8'; // Mock rating if not real

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
             const clientId = client?._id || client?.clientId;
             if (!clientId) return;
             
             setLoading(true);
             try {
                 const data = await api.getClientReviews(clientId);
                 setReviews(data || []);
             } catch (e) {
                 console.error("Error fetching client reviews:", e);
             } finally {
                 setLoading(false);
             }
        };

        fetchReviews();
    }, [client]);

    // Calcular rating real si no viene en el objeto client
    const reviewCount = client?.reviewsCount || reviews.length;
    const ratingDisplay = client?.rating 
        ? client.rating.toFixed(1)
        : (reviews.length > 0 
            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
            : 'Nuevo');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <ArrowLeft color="#333" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Perfil del Cliente</Text>
                <View style={{width:24}} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileCard}>
                    <Image source={{uri: image}} style={styles.avatar} />
                    <Text style={styles.name}>{name}</Text>
                    <View style={styles.ratingContainer}>
                        <Star fill="#FBBF24" color="#FBBF24" size={16} />
                        <Text style={styles.ratingText}>{ratingDisplay} ({reviewCount} reseñas)</Text>
                    </View>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Información de Contacto</Text>
                    <View style={styles.infoRow}>
                        <Mail size={20} color="#6B7280" />
                        <Text style={styles.infoText}>{email}</Text>
                    </View>
                    {/* Phone might be hidden for privacy until accepted */}
                    <View style={styles.infoRow}>
                        <Phone size={20} color="#6B7280" />
                        <Text style={styles.infoText}>+58 412 *** ** **</Text>
                    </View>
                </View>

                {/* REVIEWS SECTION */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Opiniones Recientes</Text>
                    {loading ? (
                        <ActivityIndicator color="#2563EB" />
                    ) : reviews.length === 0 ? (
                        <Text style={{ color: '#6B7280', fontStyle: 'italic' }}>Este cliente aún no tiene reseñas.</Text>
                    ) : (
                        reviews.map((review, idx) => (
                            <View key={review._id || idx} style={styles.reviewItem}>
                                <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 4}}>
                                    <Text style={{fontWeight:'bold', color: '#374151'}}>{review.reviewer?.name || 'Profesional'}</Text>
                                    <Text style={{fontSize: 12, color: '#9CA3AF'}}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <View style={{flexDirection:'row', marginBottom: 6}}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} fill={i < review.rating ? "#FBBF24" : "transparent"} color="#FBBF24"/>
                                    ))}
                                </View>
                                <Text style={{color: '#4B5563', fontSize: 13}}>"{review.comment || 'Sin comentarios'}"</Text>
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Estadísticas</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>15</Text>
                            <Text style={styles.statLabel}>Solicitudes</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>12</Text>
                            <Text style={styles.statLabel}>Contratados</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>100%</Text>
                            <Text style={styles.statLabel}>Respuesta</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', paddingTop: 40 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    profileCard: { alignItems: 'center', backgroundColor: 'white', padding: 24, borderRadius: 16, marginBottom: 16 },
    avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
    name: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
    ratingContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    ratingText: { marginLeft: 6, color: '#D97706', fontWeight: '600' },
    infoSection: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    infoText: { marginLeft: 12, color: '#4B5563', fontSize: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 20, fontWeight: 'bold', color: '#2563EB' },
    statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
    reviewItem: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, marginBottom: 10, borderBottomWidth: 1, borderColor: '#eee' },
});

export default ClientProfileView;
