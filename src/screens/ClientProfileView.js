import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { ClientReviewsList } from '../components/profile/ClientProfileComponents';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ClientProfileView = ({ client, visible, onClose }) => {
    // Fallback data if client object is minimal
    const name = client?.name || client?.clientName || 'Cliente';
    const email = client?.email || client?.clientEmail || 'No disponible';
    const image = client?.image || client?.avatar || client?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    const [reviews, setReviews] = useState([]);
    const [clientJobs, setClientJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedGallery, setSelectedGallery] = useState(null);

    useEffect(() => {
        if (!visible) return; // Only fetch if visible

        const fetchData = async () => {
            const clientId = client?._id || client?.clientId || client?.id;
            if (!clientId) return;

            setLoading(true);
            try {
                const [reviewsData, jobsData] = await Promise.all([
                    api.getClientReviews(clientId),
                    api.getJobs({ client: clientId, include_media: 'true' })
                ]);
                setReviews(reviewsData || []);
                if (Array.isArray(jobsData)) setClientJobs(jobsData);
            } catch (e) {
                console.error("Error fetching client data:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [client, visible]);

    // Calcular rating real
    const reviewCount = reviews.length;
    const ratingDisplay = client?.rating
        ? client.rating.toFixed(1)
        : (reviews.length > 0
            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
            : '0.0');

    // COMBINAR TRABAJOS CON SUS REVIEWS (Para "Historial y Valoraciones")
    const combinedHistory = [];
    
    // 1. Trabajos completados
    const completedJobs = clientJobs.filter(job => ['completed', 'rated', 'Culminada'].includes(job.status));
    
    if (completedJobs && completedJobs.length > 0) {
        completedJobs.forEach(job => {
            let jobImages = [];
            if (job.images && Array.isArray(job.images)) job.images.forEach(img => { if (img && !jobImages.includes(img)) jobImages.push(img); });
            if (job.workPhotos && Array.isArray(job.workPhotos)) job.workPhotos.forEach(img => { if (img && !jobImages.includes(img)) jobImages.push(img); });
            if (job.projectHistory && Array.isArray(job.projectHistory)) {
                job.projectHistory.forEach(hi => { if (hi && !hi.isPrivate && hi.mediaUrl && !jobImages.includes(hi.mediaUrl)) jobImages.push(hi.mediaUrl); });
            }

            if (job.portfolioOrder && Array.isArray(job.portfolioOrder) && job.portfolioOrder.length > 0) {
                const ordered = [];
                job.portfolioOrder.forEach(img => {
                    if (jobImages.includes(img)) ordered.push(img);
                });
                jobImages.forEach(img => {
                    if (!ordered.includes(img)) ordered.push(img);
                });
                jobImages = ordered;
            }

            const myPortfolio = clientUser?.timelinePortfolio || [];
            jobImages = jobImages.filter(img => myPortfolio.includes(img));

            // CORRECCIÓN: r.job puede ser objeto o string.
            const review = reviews.find(r => r.job?._id === job._id || r.job === job._id || r.jobId === job._id);

            combinedHistory.push({
                jobId: job._id || job.id,
                title: job.title || 'Solicitud de servicio',
                date: job.createdAt,
                images: jobImages,
                review: review
            });
        });
    }

    // 2. Reseñas sin trabajo en la lista
    reviews.forEach(rev => {
        const jobId = rev.job?._id || rev.job || rev.jobId;
        if (!combinedHistory.some(ch => ch.jobId === jobId)) {
            combinedHistory.push({
                jobId: jobId,
                title: rev.job?.title || 'Servicio valorado',
                date: rev.createdAt || new Date().toISOString(),
                images: [],
                review: rev
            });
        }
    });

    combinedHistory.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // Calcular estadísticas de trabajo
    const requestedJobsCount = clientJobs.length;
    const contractedJobsCount = clientJobs.filter(j => j.professional || ['in_progress', 'completed', 'rated', 'Culminada'].includes(j.status)).length;
    let successPercentage = 0;
    if (requestedJobsCount > 0) {
        successPercentage = Math.round((contractedJobsCount / requestedJobsCount) * 100);
    }

    return (
        <>
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
                                            <Text style={styles.headerRatingText}>{ratingDisplay} {'\u2022'} {reviewCount} reseñas</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* CONTENIDO PRINCIPAL EN TARJETAS */}
                            <View style={styles.cardContainer}>
                                {loading ? (
                                    <View style={{ padding: 40, alignItems: 'center', backgroundColor: 'white', borderRadius: 24, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, marginBottom: 20 }}>
                                        <ActivityIndicator size="large" color="#EA580C" />
                                        <Text style={{ marginTop: 15, color: '#64748B' }}>Cargando perfil del cliente...</Text>
                                    </View>
                                ) : (
                                    <>
                                {/* INFO BIO (If exists) */}
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
                                        </View>


                                {/* ESTADÍSTICAS DEL CLIENTE */}
                                <View style={styles.infoCard}>
                                    <Text style={styles.sectionTitle}>ESTADÍSTICAS DEL CLIENTE</Text>
                                    <View style={styles.statsGrid}>
                                        <View style={styles.statBox}>
                                            <Text style={styles.statNumber}>{requestedJobsCount}</Text>
                                            <Text style={styles.statDesc}>Solicitados</Text>
                                        </View>
                                        <View style={{ width: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                                        <View style={styles.statBox}>
                                            <Text style={styles.statNumber}>{contractedJobsCount}</Text>
                                            <Text style={styles.statDesc}>Contratados</Text>
                                        </View>
                                        <View style={{ width: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                                        <View style={styles.statBox}>
                                            <Text style={styles.statNumber}>{successPercentage}%</Text>
                                            <Text style={styles.statDesc}>Éxito</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* UNIFIED HISTORY SECTION */}
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
                                </View>

                                    </>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* GALLERY MODAL */}
            <Modal visible={!!selectedGallery} transparent={true} animationType="fade" onRequestClose={() => setSelectedGallery(null)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}
                        onPress={() => setSelectedGallery(null)}
                    >
                        <Feather name="x" size={30} color="white" />
                    </TouchableOpacity>
                    <ScrollView horizontal pagingEnabled style={{ flex: 1 }}>
                        {selectedGallery?.map((img, i) => (
                            <View key={i} style={{ width: SCREEN_WIDTH, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                <Image source={{ uri: img }} style={{ width: '100%', height: '80%', resizeMode: 'contain' }} />
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </>
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
        backgroundColor: '#EA580C',
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
    statNumber: { fontSize: 20, fontWeight: 'bold', color: '#EA580C' },
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

    airbnbCard: {
        width: 140,
        marginRight: 16,
    },
    airbnbImage: {
        width: 140,
        height: 140,
        borderRadius: 16,
        marginBottom: 8,
        backgroundColor: '#F3F4F6'
    },
    airbnbInfo: {
        paddingHorizontal: 2,
    },
    airbnbTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111827',
    },
    airbnbSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    airbnbCount: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
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


