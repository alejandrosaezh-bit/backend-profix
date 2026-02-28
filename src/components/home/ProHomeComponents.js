import { Feather } from '@expo/vector-icons';
import { Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const ProHomeHeader = ({
    showFilterBar, setShowFilterBar,
    showArchivedOffers, setShowArchivedOffers,
    activeCategoriesLength,
    setCategoryModalVisible,
    filterCategory
}) => {
    return (
        <View style={styles.headerContainer}>
            <View style={[styles.headerTop, { marginBottom: showFilterBar && activeCategoriesLength > 1 ? 8 : 0 }]}>
                <Text style={styles.headerTitle}>Ofertas</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {activeCategoriesLength > 1 && (
                        <TouchableOpacity
                            onPress={() => setShowFilterBar(!showFilterBar)}
                            style={[styles.headerButton, { backgroundColor: showFilterBar ? 'white' : 'rgba(255,255,255,0.2)' }]}
                        >
                            <Feather name="filter" size={20} color={showFilterBar ? '#2563EB' : 'white'} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={() => setShowArchivedOffers(!showArchivedOffers)}
                        style={[styles.headerButton, { backgroundColor: showArchivedOffers ? 'white' : 'rgba(255,255,255,0.2)' }]}
                    >
                        <Feather name="archive" size={20} color={showArchivedOffers ? '#2563EB' : 'white'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* FILTERS - CATEGORY ONLY */}
            {showFilterBar && activeCategoriesLength > 1 && (
                <View style={{ flexDirection: 'row', paddingHorizontal: 0, gap: 10, marginTop: 8 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.filterLabel}>Categoría</Text>
                        <TouchableOpacity
                            onPress={() => setCategoryModalVisible(true)}
                            style={styles.dropdownButton}
                        >
                            <Text style={styles.dropdownButtonText} numberOfLines={1}>{filterCategory}</Text>
                            <Feather name="chevron-down" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

export const ProCategoryFilterModal = ({ visible, onClose, filterCategory, setFilterCategory, jobsWithStatus }) => {
    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Filtrar por Categoría</Text>
                    <ScrollView style={{ maxHeight: 300 }}>
                        <TouchableOpacity
                            style={[styles.modalOption, filterCategory === 'Todas' && styles.modalOptionSelected]}
                            onPress={() => { setFilterCategory('Todas'); onClose(); }}
                        >
                            <Text style={[styles.modalOptionText, filterCategory === 'Todas' && styles.modalOptionTextSelected]}>Todas</Text>
                            {filterCategory === 'Todas' && <Feather name="check" size={16} color="#2563EB" />}
                        </TouchableOpacity>
                        {[...new Set(jobsWithStatus.map(j => j.category))].sort().map((cat, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.modalOption, filterCategory === cat && styles.modalOptionSelected]}
                                onPress={() => { setFilterCategory(cat); onClose(); }}
                            >
                                <Text style={[styles.modalOptionText, filterCategory === cat && styles.modalOptionTextSelected]}>{cat}</Text>
                                {filterCategory === cat && <Feather name="check" size={16} color="#2563EB" />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export const ProLoader = ({ spin }) => (
    <View style={{ marginTop: 100, alignItems: 'center' }}>
        {/* Colorful circle removed as requested */}
    </View>
);

export const ProEmptyStateNoCategories = ({ setView }) => (
    <View style={styles.emptyCard}>
        <Image source={require('../../../assets/images/plomero.png')} style={{ width: 140, height: 140, marginBottom: 15 }} resizeMode="contain" />
        <Text style={styles.emptyTitle}>¡Empieza a Ganar Dinero!</Text>
        <Text style={styles.emptySubtitle}>
            No tienes categorías activas en tu perfil. Activa las categorías en las que eres experto para ver las
            <Text style={{ fontWeight: 'bold', color: '#2563EB' }}> Ofertas Disponibles</Text> y comenzar a trabajar.
        </Text>
        <View style={{ width: '100%', marginBottom: 25 }}>
            <FeatureListItem text="Accede a trabajos en tiempo real" />
            <FeatureListItem text="Envía presupuestos y chatea directo" />
            <FeatureListItem text="Construye tu reputación y cartera" />
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setView('profile')}>
            <Text style={styles.primaryButtonText}>Activar Mi Perfil</Text>
            <Feather name="arrow-right" size={20} color="white" />
        </TouchableOpacity>
    </View>
);

export const ProEmptyStateNoOffers = ({ showArchivedOffers, setView }) => (
    <View style={styles.noOffersCard}>
        <View style={styles.noOffersIconWrapper}>
            <Feather name={showArchivedOffers ? "archive" : "search"} size={32} color="#94A3B8" />
        </View>
        <Text style={styles.noOffersTitle}>
            {showArchivedOffers ? "Sin ofertas archivadas" : "Sin ofertas por ahora"}
        </Text>
        <Text style={styles.noOffersSubtitle}>
            {showArchivedOffers
                ? "Aquí aparecerán los trabajos que hayas finalizado o que hayan sido cerrados por el cliente."
                : "No encontramos trabajos nuevos en tus categorías. \nIntenta ampliar tus zonas de cobertura."}
        </Text>
        {!showArchivedOffers && (
            <TouchableOpacity onPress={() => setView('profile')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 14, marginRight: 4 }}>Revisar Perfil</Text>
                <Feather name="arrow-right" size={14} color="#2563EB" />
            </TouchableOpacity>
        )}
    </View>
);

export const ProJobCard = ({ job, isNewJob, getProStatusColor, handleOpenJobDetail }) => {
    return (
        <TouchableOpacity
            style={[styles.jobCard, { borderColor: isNewJob ? '#DBEAFE' : '#F1F5F9' }]}
            onPress={() => handleOpenJobDetail(job.id, 'job-detail-pro')}
        >
            {isNewJob && (
                <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NUEVO</Text>
                </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <View style={styles.avatarWrapper}>
                    {job.clientAvatar ? (
                        <Image source={{ uri: job.clientAvatar }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2563EB' }}>
                            {job.clientName ? job.clientName.substring(0, 1).toUpperCase() : 'C'}
                        </Text>
                    )}
                </View>

                <View style={{ flex: 1, marginLeft: 15 }}>
                    <View style={styles.metaRow}>
                        <Feather name="user" size={12} color="#6B7280" />
                        <Text style={[styles.metaText, { fontWeight: '700', color: '#374151' }]}>{job.clientName || 'Cliente'}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Feather name="map-pin" size={12} color="#6B7280" />
                        <Text style={styles.metaText}>{job.location || 'Sin ubicación'}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Feather name="tag" size={12} color="#9CA3AF" />
                        <Text style={[styles.metaText, { color: '#9CA3AF' }]} numberOfLines={1}>
                            {job.category?.name || job.category} {job.subcategory ? `> ${job.subcategory}` : ''}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.footerRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Feather name="calendar" size={12} color="#9CA3AF" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(job.createdAt).toLocaleDateString()}</Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: getProStatusColor(job.proStatus).bg }]}>
                    <Text style={[styles.statusBadgeText, { color: getProStatusColor(job.proStatus).text }]}>
                        {job.proStatus?.toUpperCase() || 'NUEVA'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const FeatureListItem = ({ text }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={styles.featureIcon}>
            <Feather name="check" size={18} color="#166534" />
        </View>
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: '#2563EB',
        paddingTop: Platform.OS === 'ios' ? 44 : 15,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: '800', color: 'white', letterSpacing: 0.5 },
    headerButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    filterLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4, fontWeight: 'bold' },
    dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    dropdownButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 24, maxHeight: '80%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#1E293B' },
    modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalOptionSelected: { backgroundColor: '#EFF6FF', borderRadius: 12, borderBottomWidth: 0 },
    modalOptionText: { fontSize: 16, color: '#475569' },
    modalOptionTextSelected: { color: '#2563EB', fontWeight: 'bold' },
    loaderCircle: {
        width: 50, height: 50, borderRadius: 25,
        borderWidth: 5, borderColor: '#2563EB',
        borderTopColor: '#EA580C', borderRightColor: '#EA580C',
        transform: [{ rotate: '-45deg' }]
    },
    emptyCard: { marginHorizontal: 4, marginTop: 20, padding: 25, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#BFDBFE', alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1E3A8A', textAlign: 'center', marginBottom: 10 },
    emptySubtitle: { fontSize: 15, color: '#4B5563', textAlign: 'center', marginBottom: 25, lineHeight: 22, paddingHorizontal: 10 },
    featureIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    featureText: { fontSize: 14, color: '#374151', flex: 1 },
    primaryButton: { backgroundColor: '#2563EB', width: '100%', paddingVertical: 16, borderRadius: 16, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    primaryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginRight: 8 },
    noOffersCard: { marginHorizontal: 4, alignItems: 'center', marginTop: 40, padding: 25, backgroundColor: '#F8FAFC', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1' },
    noOffersIconWrapper: { width: 64, height: 64, backgroundColor: '#F1F5F9', borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    noOffersTitle: { fontSize: 18, fontWeight: 'bold', color: '#475569', marginBottom: 8 },
    noOffersSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
    jobCard: {
        backgroundColor: 'white', borderRadius: 24, padding: 20, marginHorizontal: 4, marginBottom: 12, elevation: 8,
        borderWidth: 1, position: 'relative',
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(37, 99, 235, 0.1)' },
            default: { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }
        }),
    },
    newBadge: { position: 'absolute', top: -6, right: 20, backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, zIndex: 10, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
    newBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    jobTitle: { fontSize: 18, fontWeight: '800', color: '#1E3A8A', flex: 1, marginRight: 10 },
    avatarWrapper: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: '#EFF6FF', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    metaText: { fontSize: 13, color: '#6B7280', marginLeft: 6 },
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15, marginTop: 5 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    statusBadgeText: { fontSize: 10, fontWeight: 'bold' },
});
