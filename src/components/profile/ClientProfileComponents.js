import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function ClientStatistics({ allMyRequests, completedRequests, hiredRequests }) {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 5 }}>
            <View style={styles.statBox}>
                <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
                    <Feather name="clipboard" size={20} color="#2563EB" />
                </View>
                <Text style={styles.statNumber}>{allMyRequests.length}</Text>
                <Text style={styles.statLabel}>Solicitudes</Text>
            </View>
            <View style={styles.statDividerVertical} />
            <View style={styles.statBox}>
                <View style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}>
                    <Feather name="check-circle" size={20} color="#16A34A" />
                </View>
                <Text style={styles.statNumber}>{completedRequests.length}</Text>
                <Text style={styles.statLabel}>Completadas</Text>
            </View>
            <View style={styles.statDividerVertical} />
            <View style={styles.statBox}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                    <Feather name="pie-chart" size={20} color="#D97706" />
                </View>
                <Text style={styles.statNumber}>
                    {allMyRequests.length > 0 ? Math.round((hiredRequests.length / allMyRequests.length) * 100) : 0}%
                </Text>
                <Text style={styles.statLabel}>Éxito</Text>
            </View>
        </View>
    );
}

export function RequestHorizontalList({ title, requests, emptyMessage, getStatusStyle }) {
    return (
        <View style={{ width: '100%', marginBottom: 25 }}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, fontSize: 18, marginBottom: 10 }]}>{title} ({requests.length})</Text>
            {requests.length === 0 ? (
                <Text style={{ color: '#999', fontStyle: 'italic' }}>{emptyMessage}</Text>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 5 }}>
                    {requests.map((item) => {
                        const statusStyles = getStatusStyle ? getStatusStyle(item.status) : { badge: {}, text: {} };
                        return (
                            <View key={item.id} style={[styles.activityCard, { elevation: 2, boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)', borderColor: '#F1F5F9' }]}>
                                <Image source={{ uri: (item.images && item.images[0]) || 'https://placehold.co/150' }} style={styles.activityImage} />
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.activityDate}>{item.date}</Text>
                                    <View style={[styles.statusBadge, statusStyles.badge]}>
                                        <Text style={[styles.statusText, statusStyles.text]}>{item.status}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}

export function ClientReviewsList({ reviews, isLoading }) {
    return (
        <View style={{ width: '100%', marginBottom: 10, alignSelf: 'stretch', marginHorizontal: -20, paddingVertical: 10 }}>
            <View style={{ paddingHorizontal: 20 }}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, fontSize: 18, marginBottom: 15 }]}>Valoraciones Recibidas</Text>
            </View>
            
            {isLoading ? (
                <ActivityIndicator size="small" color="#EA580C" style={{ marginVertical: 20 }} />
            ) : reviews.length === 0 ? (
                <View style={{ paddingHorizontal: 20 }}>
                    <Text style={{ color: '#999', fontStyle: 'italic' }}>Aún no hay opiniones de profesionales.</Text>
                </View>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 15, paddingTop: 5 }}>
                    {reviews.map((review, idx) => (
                        <View key={review._id || idx} style={[styles.reviewCard, { width: 160, marginRight: 16, marginBottom: 0, padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 20 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                {review.reviewer?.avatar ? (
                                    <Image
                                        source={{ uri: review.reviewer.avatar }}
                                        style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }}
                                    />
                                ) : (
                                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                        <Feather name="user" size={16} color="#2563EB" />
                                    </View>
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#1E293B' }} numberOfLines={1}>{review.reviewer?.name || 'Profesional'}</Text>
                                    <Text style={{ fontSize: 11, color: '#94A3B8' }} numberOfLines={1}>Hace poco</Text>
                                </View>
                            </View>
                            
                            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                                {[...Array(5)].map((_, i) => (
                                    <FontAwesome5 key={i} name="star" solid={i < review.rating} size={10} color="#FBBF24" style={{ marginRight: 2 }} />
                                ))}
                            </View>
                            
                            <Text style={{ color: '#4B5563', fontSize: 13, lineHeight: 18 }} numberOfLines={3}>
                                "{review.comment || 'Buen cliente.'}"
                            </Text>
                            
                            {review.job && (
                                <Text style={{ marginTop: 10, fontSize: 9, color: '#94A3B8', fontWeight: 'bold' }} numberOfLines={1}>
                                    TRABAJO: {(review.job.title || 'Servicio').toUpperCase()}
                                </Text>
                            )}
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

export function ClientSettingsList({ onEditProfile, onSwitchMode, onOpenNotifications }) {
    return (
        <View style={[styles.section, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Ajustes de Cuenta</Text>

            <TouchableOpacity style={styles.settingRow} onPress={onEditProfile}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
                        <Feather name="user" size={20} color="#4B5563" />
                    </View>
                    <Text style={styles.settingText}>Editar Mis Datos Personales</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>



            <TouchableOpacity style={styles.settingRow} onPress={onOpenNotifications}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                        <Feather name="bell" size={20} color="#4F46E5" />
                    </View>
                    <Text style={styles.settingText}>Notificaciones</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={{
                backgroundColor: '#2563EB',
                paddingVertical: 14,
                paddingHorizontal: 30,
                borderRadius: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center',
                marginTop: 20,
                marginBottom: 20,
                elevation: 4,
                boxShadow: '0 4px 8px rgba(37, 99, 235, 0.2)'
            }}
                onPress={() => onSwitchMode && onSwitchMode('pro')}
            >
                <Feather name="briefcase" size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Cambiar a Profesional</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    statBox: {
        flex: 1,
        alignItems: 'center'
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827'
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
    },
    statDividerVertical: {
        width: 1,
        height: '60%',
        backgroundColor: '#E5E7EB',
        alignSelf: 'center'
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    activityCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        marginRight: 16,
        width: 200,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#FFF7ED',
    },
    activityImage: {
        width: '100%',
        height: 100,
    },
    activityInfo: {
        padding: 12,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    activityDate: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 8,
    },
    statusBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#16A34A',
    },
    reviewCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#FFF7ED',
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 24,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#FFF7ED',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingText: {
        fontSize: 16,
        color: '#374151',
    },
});
