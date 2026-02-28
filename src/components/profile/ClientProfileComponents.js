import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function ClientStatistics({ allMyRequests, completedRequests, hiredRequests }) {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6', marginBottom: 25 }}>
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
        <View style={{ width: '100%', marginBottom: 10 }}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, fontSize: 18, marginBottom: 10 }]}>Referencias Recibidas</Text>
            {isLoading ? (
                <ActivityIndicator size="small" color="#EA580C" style={{ marginVertical: 20 }} />
            ) : reviews.length === 0 ? (
                <Text style={{ color: '#999', fontStyle: 'italic' }}>Aún no hay opiniones de profesionales.</Text>
            ) : (
                <View style={{ marginTop: 5 }}>
                    {reviews.map((review, idx) => (
                        <View key={review._id || idx} style={[styles.reviewCard, { elevation: 0, borderWidth: 1, borderColor: '#F1F5F9', boxShadow: 'none' }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Image
                                        source={{ uri: review.reviewer?.avatar || 'https://placehold.co/100' }}
                                        style={{ width: 30, height: 30, borderRadius: 15, marginRight: 8 }}
                                    />
                                    <View>
                                        <Text style={{ fontWeight: 'bold', fontSize: 13 }}>{review.reviewer?.name || 'Profesional'}</Text>
                                        <View style={{ flexDirection: 'row' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <FontAwesome5 key={i} name="star" solid={i < review.rating} size={10} color="#FBBF24" />
                                            ))}
                                        </View>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <Text style={{ marginTop: 8, color: '#4B5563', fontSize: 13, fontStyle: 'italic', paddingLeft: 38 }}>
                                "{review.comment || 'Sin comentarios'}"
                            </Text>
                            {review.job && (
                                <Text style={{ marginTop: 4, fontSize: 10, color: '#6B7280', paddingLeft: 38 }}>
                                    Trabajo: {review.job.title || 'Servicio'}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

export function ClientSettingsList({ onEditProfile, onSwitchMode }) {
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

            <TouchableOpacity style={styles.settingRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                        <Feather name="star" size={20} color="#16A34A" />
                    </View>
                    <Text style={styles.settingText}>Mis Suscripciones</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow}>
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
