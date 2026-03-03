import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../utils/api';

const ClientProfileView = ({ client, visible, onClose }) => {
    // Fallback data if client object is minimal
    const name = client?.name || client?.clientName || 'Cliente';
    const email = client?.email || client?.clientEmail || 'No disponible';
    const image = client?.image || client?.avatar || client?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!visible) return; // Only fetch if visible

        const fetchReviews = async () => {
            const clientId = client?._id || client?.clientId || client?.id;
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
    }, [client, visible]);

    // Calcular rating real
    const reviewCount = reviews.length;
    const ratingDisplay = client?.rating
        ? client.rating.toFixed(1)
        : (reviews.length > 0
            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
            : '5.0');

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Barra de arrastre (Visual) */}
                    <View style={styles.dragHandle} />

                    <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                        {/* CABECERA AZUL DENTRO DEL MODAL */}
                        <View style={styles.blueHeader}>
                            <View style={styles.headerTop}>
                                <Text style={styles.headerTitle}>Perfil del Cliente</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Feather name="x" size={24} color="white" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.headerMain}>
                                <View style={styles.avatarContainer}>
                                    <Image source={{ uri: image }} style={styles.avatar} />
                                    <View style={styles.verifiedBadge}>
                                        <Feather name="shield" size={12} color="white" />
                                    </View>
                                </View>
                                <View style={{ marginLeft: 20, flex: 1 }}>
                                    <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
                                    <View style={styles.headerRating}>
                                        <FontAwesome5 name="star" solid size={14} color="#FBBF24" />
                                        <Text style={styles.headerRatingText}>{ratingDisplay} â€¢ {reviewCount} reseÃ±as</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* CONTENIDO PRINCIPAL EN TARJETAS */}
                        <View style={styles.cardContainer}>
                            {/* INFO BIO (If exists) */}
                            {(client?.bio || client?.description) ? (
                                <View style={[styles.infoCard, { padding: 18, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#EFF6FF' }]}>
                                    <Text style={[styles.sectionTitle, { marginBottom: 12, color: '#2563EB' }]}>SOBRE MÃ</Text>
                                    <Text style={{ fontSize: 14, color: '#334155', fontStyle: 'italic', lineHeight: 22 }}>
                                        "{client?.bio || client?.description}"
                                    </Text>
                                </View>
                            ) : null}


                            {/* OPINIONES */}
                            <View style={styles.infoCard}>
                                <Text style={styles.sectionTitle}>OPINIONES DE PROFESIONALES</Text>
                                {loading ? (
                                    <ActivityIndicator color="#2563EB" style={{ marginVertical: 20 }} />
                                ) : reviews.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Feather name="message-circle" size={40} color="#E2E8F0" />
                                        <Text style={styles.emptyText}>Este cliente aÃºn no ha sido valorado por otros profesionales.</Text>
                                    </View>
                                ) : (
                                    reviews.map((review, idx) => (
                                        <View key={review._id || idx} style={styles.reviewItem}>
                                            <View style={styles.reviewHeader}>
                                                <View style={styles.reviewerInfo}>
                                                    <Text style={styles.reviewerName}>{review.reviewer?.name || 'Profesional'}</Text>
                                                    <View style={styles.reviewStars}>
                                                        {[...Array(5)].map((_, i) => (
                                                            <FontAwesome5 key={i} name="star" solid={i < review.rating} size={10} color={i < review.rating ? "#F59E0B" : "#E2E8F0"} style={{ marginRight: 2 }} />
                                                        ))}
                                                    </View>
                                                </View>
                                                <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                                            </View>
                                            <View style={styles.commentBox}>
                                                <Text style={styles.reviewComment}>"{review.comment ? review.comment : 'Sin comentario adicional.'}"</Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>

                            {/* PORTAFOLIO DE TRABAJOS */}
                            <View style={styles.infoCard}>
                                <Text style={styles.sectionTitle}>PORTAFOLIO DE TRABAJOS</Text>
                                {(() => {
                                    const portfolioFolders = [];
                                    if (client?.profiles) {
                                        const profilesObj = client.profiles instanceof Map ? Object.fromEntries(client.profiles) : client.profiles;
                                        Object.keys(profilesObj).forEach(cat => {
                                            if (profilesObj[cat]?.gallery && profilesObj[cat].gallery.length > 0) {
                                                portfolioFolders.push({
                                                    category: cat,
                                                    images: profilesObj[cat].gallery
                                                });
                                            }
                                        });
                                    }

                                    if (portfolioFolders.length === 0) {
                                        return (
                                            <View style={styles.emptyContainer}>
                                                <Feather name="folder" size={40} color="#E2E8F0" />
                                                <Text style={styles.emptyText}>No hay trabajos en el portafolio.</Text>
                                            </View>
                                        );
                                    }

                                    return (
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                            {portfolioFolders.map((folder, index) => (
                                                <TouchableOpacity key={index} style={styles.folderCard}>
                                                    <View style={styles.folderTab} />
                                                    <View style={styles.folderContent}>
                                                        <Image source={{ uri: folder.images[0] }} style={styles.folderImage} />
                                                        <View style={styles.folderInfo}>
                                                            <Text style={styles.folderTitle} numberOfLines={2}>{folder.category}</Text>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                                <Feather name="image" size={10} color="#94A3B8" />
                                                                <Text style={styles.folderCount}>{folder.images.length} fotos</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    );
                                })()}
                            </View>

                            {/* BOTÃ“N CERRAR FOOTER */}
                            <TouchableOpacity onPress={onClose} style={styles.footerCloseButton}>
                                <Text style={styles.footerCloseText}>Cerrar Perfil</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        height: '90%',
        width: '100%',
        overflow: 'hidden',
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 10,
        position: 'absolute',
        zIndex: 10,
    },
    blueHeader: {
        backgroundColor: '#2563EB',
        paddingTop: 20,
        paddingBottom: 35,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        elevation: 8,
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'white',
        padding: 3,
        elevation: 5,
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        position: 'relative',
    },
    avatar: { width: '100%', height: '100%', borderRadius: 37 },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#10B981',
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerName: { fontSize: 22, fontWeight: 'bold', color: 'white' },
    headerRating: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    headerRatingText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginLeft: 8 },

    cardContainer: { paddingHorizontal: 20, marginTop: -20 },
    infoCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        elevation: 3,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 20, letterSpacing: 0.5 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    infoLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
    infoValue: { fontSize: 14, color: '#1E293B', fontWeight: 'bold', marginTop: 2 },

    statsGrid: { flexDirection: 'row', marginTop: 5 },
    statBox: { flex: 1, alignItems: 'center', paddingVertical: 10 },
    statNumber: { fontSize: 20, fontWeight: 'bold', color: '#2563EB' },
    statDesc: { fontSize: 11, color: '#64748B', marginTop: 4 },

    reviewItem: { marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 15 },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    reviewerName: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
    reviewStars: { flexDirection: 'row', marginTop: 2 },
    reviewDate: { fontSize: 11, color: '#94A3B8' },
    commentBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
    reviewComment: { color: '#475569', fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
    emptyContainer: { alignItems: 'center', paddingVertical: 30 },
    emptyText: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 15, paddingHorizontal: 20 },

    folderCard: {
        width: '48%',
        marginBottom: 16,
        position: 'relative',
        marginTop: 10,
    },
    folderTab: {
        width: '45%',
        height: 12,
        backgroundColor: '#2563EB',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        position: 'absolute',
        top: -10,
        left: 0,
        zIndex: 1
    },
    folderContent: {
        backgroundColor: 'white',
        borderTopRightRadius: 12,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        borderTopLeftRadius: 0, // for the tab effect
        borderColor: '#E2E8F0',
        borderWidth: 1.5,
        overflow: 'hidden',
        zIndex: 2,
    },
    folderImage: {
        width: '100%',
        height: 80,
        borderTopRightRadius: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    folderInfo: {
        padding: 8,
    },
    folderTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    folderCount: {
        fontSize: 10,
        color: '#94A3B8',
        marginLeft: 4,
        fontWeight: '600',
    },

    footerCloseButton: {
        backgroundColor: '#F1F5F9',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    footerCloseText: {
        color: '#64748B',
        fontWeight: 'bold',
        fontSize: 15,
    },
});

export default ClientProfileView;


