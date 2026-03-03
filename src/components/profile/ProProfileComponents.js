import { Feather } from '@expo/vector-icons';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const ProProfileHeader = ({ onLogout, onBack, isOwner = true }) => (
    <View style={styles.header}>
        <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {!isOwner && onBack && (
                    <TouchableOpacity onPress={onBack} style={{ marginRight: 15 }}>
                        <Feather name="arrow-left" size={24} color="white" />
                    </TouchableOpacity>
                )}
                <Text style={styles.headerTitle}>Perfil Profesional</Text>
                {isOwner && (
                    <View style={styles.versionBadge}>
                        <Text style={styles.versionText}>V36.0</Text>
                    </View>
                )}
            </View>
            {isOwner && onLogout ? (
                <TouchableOpacity onPress={onLogout} style={styles.logoutIconButtonHeader}>
                    <Feather name="log-out" size={20} color="white" />
                </TouchableOpacity>
            ) : (
                <View style={{ width: 44 }} />
            )}
        </View>
    </View>
);

export const ProPersonalInfoCard = ({
    isEditingPersonal,
    personalData,
    profileData,
    user,
    pickMainImage,
    isOwner
}) => {
    const avatarUri = isEditingPersonal ? personalData.avatar : (profileData.avatar || profileData.image);

    return (
        <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
                <TouchableOpacity disabled={!isEditingPersonal} onPress={pickMainImage}>
                    {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
                            <Feather name="user" size={40} color="#9CA3AF" />
                        </View>
                    )}
                </TouchableOpacity>
                {isEditingPersonal && (
                    <TouchableOpacity style={styles.editBadge} onPress={pickMainImage}>
                        <Feather name="camera" size={14} color="white" />
                    </TouchableOpacity>
                )}
            </View>
            <>
                <Text style={styles.userName}>{profileData.name || 'Profesional'}</Text>
                <View style={styles.ratingContainer}>
                    <Feather name="star" size={14} color="#D97706" style={{ marginRight: 4 }} />
                    <Text style={styles.ratingText}>
                        {(user?.reviewCount || 0) > 0 ? (user.rating ? user.rating.toFixed(1) : '5.0') : '0.0'} • {user.reviewCount || 0} reseñas
                    </Text>
                </View>
            </>
        </View>
    );
};

export const ProCategorySelector = ({
    sortedCategories,
    profileData,
    selectedCategory,
    setSelectedCategory,
    ICON_MAP,
    isOwner
}) => {
    const hasActiveProfiles = Object.keys(profileData.profiles || {}).some(k => profileData.profiles[k]?.isActive !== false);

    return (
        <View style={{ marginBottom: 20 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
                {sortedCategories.map((cat) => {
                    const catKey = cat.fullName || cat.name;
                    const isActive = !!profileData.profiles?.[catKey] && profileData.profiles[catKey].isActive !== false;
                    const isSelected = selectedCategory.id === cat.id;

                    if (!isActive) return null;

                    return (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryCard,
                                isSelected && styles.categoryCardSelected,
                                { borderColor: '#EFF6FF', backgroundColor: isSelected ? '#EFF6FF' : 'white' }
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <View style={styles.categoryIcon}>
                                {typeof cat.icon === 'function' ? (
                                    <cat.icon size={20} color={isSelected ? '#2563EB' : '#16A34A'} />
                                ) : (
                                    <Feather
                                        name={typeof cat.icon === 'string' ? cat.icon : (ICON_MAP[cat.name] || 'grid')}
                                        size={20}
                                        color={isSelected ? '#2563EB' : '#16A34A'}
                                    />
                                )}
                            </View>
                            <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>{cat.name}</Text>
                        </TouchableOpacity>
                    );
                })}

                {!hasActiveProfiles && isOwner && (
                    <View style={{ padding: 10 }}>
                        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>No tienes perfiles activos. Pulsa Gestionar para empezar.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export const ProCategoryConfig = ({
    isCategoryActive,
    categoryStats,
    currentCatProfile,
    catReviews,
    selectedCategory,
    setIsEditing,
    onViewImage,
    isOwner
}) => {
    if (!isCategoryActive) {
        if (!isOwner) {
            return (
                <View style={styles.emptyState}>
                    <Feather name="briefcase" size={40} color="#CBD5E1" />
                    <Text style={styles.emptyStateText}>Perfil no disponible</Text>
                    <Text style={styles.emptyStateSubtext}>Este profesional no ofrece servicios en {selectedCategory.name} actualmente.</Text>
                </View>
            );
        }

        return (
            <View style={styles.emptyState}>
                <Feather name="briefcase" size={40} color="#CBD5E1" />
                <Text style={styles.emptyStateText}>Perfil inactivo en {selectedCategory.name}</Text>
                <Text style={styles.emptyStateSubtext}>Actívalo para empezar a recibir trabajos en esta categoría.</Text>
                <TouchableOpacity
                    style={[styles.btnSave, { marginTop: 15, width: '100%' }]}
                    onPress={() => setIsEditing(true)}
                >
                    <Text style={styles.btnTextSave}>Activar Perfil</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View>
            {/* Info Sections */}
            <View style={[styles.infoSection, { backgroundColor: '#F8FAFC', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#EFF6FF', marginBottom: 20 }]}>
                {currentCatProfile.bio ? (
                    <Text style={[styles.infoText, { marginBottom: 16, fontStyle: 'italic', color: '#334155' }]}>"{currentCatProfile.bio}"</Text>
                ) : null}

                <Text style={styles.infoText}>
                    <Text style={{ fontWeight: 'bold', color: '#1E293B' }}>Especialista en: </Text>
                    {currentCatProfile.subcategories?.length ? currentCatProfile.subcategories.join(', ') : 'Servicios generales.'}
                </Text>

                <Text style={[styles.infoText, { marginTop: 10 }]}>
                    <Text style={{ fontWeight: 'bold', color: '#1E293B' }}>Zonas de servicio: </Text>
                    {currentCatProfile.zones?.length ? currentCatProfile.zones.join(', ') : 'No especificadas.'}
                </Text>
            </View>


            {/* Reviews */}
            <Text style={styles.infoLabel}>Reseñas Recientes</Text>
            {catReviews.length > 0 ? catReviews.slice(0, 3).map((r, i) => (
                <View key={i} style={styles.reviewCard}>
                    <Text style={{ fontWeight: 'bold', fontSize: 13 }}>{r.reviewer?.name || 'Cliente'}</Text>
                    <Text style={{ fontSize: 12, color: '#4B5563' }}>{r.comment}</Text>
                </View>
            )) : <Text style={{ color: '#9CA3AF', fontSize: 12 }}>No hay reseñas aún.</Text>}
        </View>
    );
};

export const ProAccountSettings = ({
    startEditingPersonal,
    handleResetApplicationData,
    onSwitchMode
}) => {
    return (
        <View style={[
            styles.sectionContainer,
            {
                marginTop: 40,
                paddingTop: 24,
                borderTopWidth: 1,
                borderTopColor: '#EFF6FF',
                shadowColor: '#2563EB',
                shadowOffset: { width: 0, height: -10 },
                shadowOpacity: 0.1,
                shadowRadius: 15,
                backgroundColor: 'transparent'
            }
        ]}>
            <Text style={[styles.sectionTitle, { marginBottom: 24 }]}>Ajustes de Cuenta</Text>

            <TouchableOpacity style={styles.settingRow} onPress={startEditingPersonal}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                        <Feather name="user" size={18} color="#2563EB" />
                    </View>
                    <Text style={styles.settingText}>Editar Mis Datos Personales</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                        <Feather name="bell" size={18} color="#16A34A" />
                    </View>
                    <Text style={styles.settingText}>Notificaciones</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>



            <TouchableOpacity
                style={styles.switchModeButton}
                onPress={() => onSwitchMode && onSwitchMode('client')}
            >
                <Feather name="repeat" size={16} color="white" style={{ marginRight: 10 }} />
                <Text style={styles.switchModeButtonText}>Cambiar al Perfil de Cliente</Text>
            </TouchableOpacity>
        </View >
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#2563EB',
        paddingTop: Platform.OS === 'ios' ? 44 : 15,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 0,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: '800', color: 'white', letterSpacing: 0.5 },
    versionBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 10, marginTop: 4 },
    versionText: { fontSize: 10, color: 'white', fontWeight: 'bold' },
    logoutIconButtonHeader: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    profileCard: { backgroundColor: 'white', marginHorizontal: 4, marginTop: 10, padding: 20, borderRadius: 24, alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 20 },
    avatarContainer: { marginBottom: 10 },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'white', backgroundColor: '#F3F4F6' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2563EB', padding: 6, borderRadius: 15, borderWidth: 2, borderColor: 'white' },
    userName: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 2, textAlign: 'center' },
    userEmail: { fontSize: 14, color: '#6B7280', marginBottom: 8, textAlign: 'center' },
    ratingContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
    ratingText: { color: '#D97706', fontWeight: '600', fontSize: 13 },
    sectionContainer: { paddingHorizontal: 16, marginBottom: 20 },
    sectionTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16, paddingHorizontal: 16 },
    categoryList: { paddingBottom: 10 },
    categoryCard: { width: 90, height: 75, backgroundColor: 'white', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4, marginTop: 8, marginBottom: 8, borderWidth: 1, borderColor: '#EFF6FF', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    categoryCardSelected: { backgroundColor: '#EFF6FF', borderColor: '#2563EB', borderWidth: 2 },
    categoryIcon: { marginBottom: 6 },
    categoryName: { fontSize: 11, fontWeight: '600', color: '#4B5563', textAlign: 'center', paddingHorizontal: 2 },
    categoryNameSelected: { color: '#2563EB', fontWeight: 'bold' },
    emptyState: { alignItems: 'center', padding: 30, backgroundColor: '#F9FAFB', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB' },
    emptyStateText: { marginTop: 15, fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
    emptyStateSubtext: { marginTop: 5, fontSize: 13, color: '#6B7280', textAlign: 'center' },
    btnSave: { padding: 12, borderRadius: 10, backgroundColor: '#2563EB', alignItems: 'center' },
    btnTextSave: { color: 'white', fontWeight: 'bold' },
    statsGrid: { flexDirection: 'row', marginBottom: 20 },
    statBox: { flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 24, alignItems: 'center', marginHorizontal: 4, marginTop: 8, marginBottom: 8, borderWidth: 1, borderColor: '#EFF6FF', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    statNumber: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
    statLabelSmall: { fontSize: 11, color: '#64748B', marginTop: 2 },
    infoSection: { marginBottom: 20 },
    infoLabel: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
    infoText: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: '100%', gap: 10 },
    zoneTag: { width: '46%', backgroundColor: '#EFF6FF', paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
    zoneTagText: { fontSize: 11, color: '#2563EB', fontWeight: '600', textAlign: 'center', paddingHorizontal: 4 },
    chip: { width: '30%', paddingVertical: 8, borderRadius: 20, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
    chipText: { fontSize: 11, color: '#2563EB', fontWeight: '600', textAlign: 'center', paddingHorizontal: 4 },
    galleryImage: { width: 100, height: 100, borderRadius: 8, marginRight: 8 },
    reviewCard: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, marginBottom: 10 },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: 16, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#EFF6FF', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    settingText: { fontSize: 16, color: '#374151' },
    switchModeButton: { backgroundColor: '#EA580C', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 12, marginBottom: 0, shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    switchModeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
