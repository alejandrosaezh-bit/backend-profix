import { Feather, FontAwesome5 } from '@expo/vector-icons';
import {
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export function ProCategorySelectionModal({
    visible,
    onClose,
    categories,
    profileData,
    ICON_MAP,
    setSelectedCategory,
    setIsEditing
}) {
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { height: 'auto', maxHeight: '90%', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 20 }]}>
                    <TouchableOpacity
                        onPress={onClose}
                        style={{ alignSelf: 'flex-end', backgroundColor: '#F3F4F6', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 5 }}
                    >
                        <Feather name="x" size={24} color="#6B7280" />
                    </TouchableOpacity>

                    <View style={{ marginBottom: 25, paddingHorizontal: 5 }}>
                        <Text style={[styles.modalTitle, { fontSize: 26, fontWeight: '900', color: '#111827', marginBottom: 8 }]}>¿Qué área manejas?</Text>
                        <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>
                            Selecciona la categoría de tu especialidad
                        </Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', paddingBottom: 40 }}>
                        {categories.map((cat) => {
                            const catKey = cat.fullName || cat.name;
                            const isActive = !!profileData.profiles?.[catKey] && profileData.profiles[catKey].isActive !== false;

                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={{
                                        width: '31%',
                                        aspectRatio: 0.85,
                                        marginBottom: 12,
                                        marginHorizontal: '1.1%',
                                        backgroundColor: 'white',
                                        borderRadius: 20,
                                        padding: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 1.5,
                                        borderColor: isActive ? '#2563EB' : '#F1F5F9',
                                        elevation: isActive ? 4 : 1,
                                        shadowColor: isActive ? '#2563EB' : '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: isActive ? 0.2 : 0.05,
                                        shadowRadius: 4,
                                    }}
                                    onPress={() => {
                                        setSelectedCategory(cat);
                                        onClose();
                                        setIsEditing(true);
                                    }}
                                >
                                    <View style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 25,
                                        backgroundColor: isActive ? '#DBEAFE' : '#FFF7ED', // Soft blue if active, soft orange/neutral otherwise
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginBottom: 8
                                    }}>
                                        {typeof cat.icon === 'function' ? (
                                            <cat.icon size={22} color={isActive ? '#2563EB' : '#EA580C'} />
                                        ) : (
                                            <Feather
                                                name={typeof cat.icon === 'string' ? cat.icon : (ICON_MAP[cat.name] || 'grid')}
                                                size={22}
                                                color={isActive ? '#2563EB' : '#EA580C'}
                                            />
                                        )}
                                    </View>
                                    <Text style={{
                                        fontSize: 11,
                                        fontWeight: '800',
                                        color: isActive ? '#2563EB' : '#4B5563',
                                        textAlign: 'center'
                                    }} numberOfLines={1}>
                                        {cat.name}
                                    </Text>

                                    {isActive && (
                                        <View style={{ position: 'absolute', top: 6, right: 6 }}>
                                            <FontAwesome5 name="check-circle" size={12} color="#2563EB" solid />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

export function ProPersonalEditModal({
    visible,
    onClose,
    personalData,
    setPersonalData,
    pickMainImage,
    handleSavePersonal
}) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={[styles.modalContent, { height: '85%' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text style={styles.modalTitle}>Datos Personales</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={{ alignItems: 'center', marginBottom: 24 }}>
                            <TouchableOpacity onPress={pickMainImage} style={{ position: 'relative' }}>
                                {personalData.avatar ? (
                                    <Image source={{ uri: personalData.avatar }} style={{ width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#EFF6FF' }} />
                                ) : (
                                    <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#EFF6FF' }}>
                                        <Feather name="user" size={45} color="#9CA3AF" />
                                    </View>
                                )}
                                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2563EB', padding: 8, borderRadius: 20, borderWidth: 3, borderColor: 'white' }}>
                                    <Feather name="camera" size={16} color="white" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalLabel}>Nombre Completo</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={personalData.name}
                            onChangeText={(t) => setPersonalData(p => ({ ...p, name: t }))}
                            placeholder="Ej: Juan Pérez"
                        />

                        <Text style={styles.modalLabel}>Teléfono de Contacto</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={personalData.phone}
                            onChangeText={(t) => setPersonalData(p => ({ ...p, phone: t }))}
                            keyboardType="phone-pad"
                            placeholder="+58 412 1234567"
                        />

                        <Text style={styles.modalLabel}>Correo (Solo lectura)</Text>
                        <View style={[styles.modalInput, { backgroundColor: '#F8FAFC', opacity: 0.8, flexDirection: 'row', alignItems: 'center' }]}>
                            <Text style={{ color: '#64748B', flex: 1 }}>{personalData.email}</Text>
                            <Feather name="lock" size={14} color="#94A3B8" />
                        </View>

                        <View style={{ height: 20 }} />
                    </ScrollView>

                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                        <TouchableOpacity style={[styles.btnCancel, { backgroundColor: '#F1F5F9' }]} onPress={onClose}>
                            <Text style={{ color: '#64748B', fontWeight: 'bold' }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnSave} onPress={handleSavePersonal}>
                            <Text style={styles.btnTextSave}>Guardar Cambios</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

export function ProProfileEditModal({
    visible,
    onClose,
    selectedCategory,
    isCategoryActive,
    toggleCategoryActivation,
    allSubcategories,
    categoryKey,
    currentCatProfile,
    toggleSubcategory,
    allZones,
    showAllStates,
    expandedStates,
    getSelectedMunicipalitiesInState,
    toggleStateExpansion,
    toggleMunicipality,
    setShowAllStates,
    updateCurrentProfile,
    pickImage,
    removeImage,
    handleSaveProfessional
}) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={[styles.modalContent, { height: '94%' }]}>
                    {/* Sticky Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                        <View>
                            <Text style={styles.modalTitle}>{selectedCategory.name}</Text>
                            <Text style={{ fontSize: 12, color: '#6B7280' }}>Configuración de Perfil</Text>
                        </View>
                        <TouchableOpacity
                            onPress={toggleCategoryActivation}
                            style={{ backgroundColor: isCategoryActive ? '#FEF2F2' : '#F0FDF4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: isCategoryActive ? '#FECACA' : '#BBF7D0' }}
                        >
                            <Text style={{ color: isCategoryActive ? '#EF4444' : '#16A34A', fontSize: 12, fontWeight: 'bold' }}>
                                {isCategoryActive ? 'Pausar Perfil' : 'Activar Perfil'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                        {/* 1. Especialidades */}
                        <Text style={styles.stepTitle}>1. Especialidades</Text>
                        <View style={styles.gridContainer}>
                            {(allSubcategories[categoryKey] || []).map((sub, i) => {
                                const subName = typeof sub === 'object' ? sub.name : sub;
                                const isSelected = currentCatProfile.subcategories?.includes(subName);
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.chip, isSelected && styles.chipSelected, { width: '31%' }]}
                                        onPress={() => toggleSubcategory(subName)}
                                    >
                                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected, { fontSize: 10 }]} numberOfLines={1}>{subName}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* 2. Zonas */}
                        <Text style={styles.stepTitle}>2. Zonas de Cobertura</Text>
                        <View style={{ borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 16, overflow: 'hidden', backgroundColor: 'white' }}>
                            {(() => {
                                const states = Object.keys(allZones).sort((a, b) => {
                                    if (a === 'Gran Caracas') return -1;
                                    if (b === 'Gran Caracas') return 1;
                                    return a.localeCompare(b);
                                });
                                const visibleStates = showAllStates ? states : states.slice(0, 3);
                                return (
                                    <>
                                        {visibleStates.map((state) => {
                                            const municipalities = allZones[state];
                                            const isExpanded = expandedStates[state];
                                            const selectedInState = getSelectedMunicipalitiesInState(state);
                                            const hasSelection = selectedInState.length > 0;
                                            return (
                                                <View key={state}>
                                                    <TouchableOpacity
                                                        style={[styles.stateItem, { paddingHorizontal: 15, backgroundColor: hasSelection ? '#F8FAFC' : 'white' }]}
                                                        onPress={() => toggleStateExpansion(state)}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            <Feather name={isExpanded ? "chevron-down" : "chevron-right"} size={18} color={hasSelection ? "#2563EB" : "#6B7280"} />
                                                            <Text style={[styles.stateName, hasSelection && { color: '#2563EB', fontWeight: 'bold' }]}>
                                                                {state}
                                                                {hasSelection && <Text style={{ color: '#64748B', fontWeight: 'normal' }}> ({selectedInState.length})</Text>}
                                                            </Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                    {isExpanded && (
                                                        <View style={[styles.municipalityList, { paddingBottom: 15, paddingHorizontal: 10 }]}>
                                                            <View style={styles.gridContainer}>
                                                                {municipalities.map(muni => {
                                                                    const fullZone = `${muni}, ${state}`;
                                                                    const isSelected = currentCatProfile.zones?.includes(fullZone);
                                                                    return (
                                                                        <TouchableOpacity
                                                                            key={muni}
                                                                            style={[styles.chip, isSelected && styles.chipSelected, { width: '47%', marginVertical: 4 }]}
                                                                            onPress={() => toggleMunicipality(muni, state)}
                                                                        >
                                                                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected, { fontSize: 10 }]} numberOfLines={1}>{muni}</Text>
                                                                        </TouchableOpacity>
                                                                    );
                                                                })}
                                                            </View>
                                                        </View>
                                                    )}
                                                </View>
                                            );
                                        })}
                                        {!showAllStates && (
                                            <TouchableOpacity style={{ padding: 15, alignItems: 'center', backgroundColor: '#F8FAFC' }} onPress={() => setShowAllStates(true)}>
                                                <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>Mostrar más zonas...</Text>
                                            </TouchableOpacity>
                                        )}
                                    </>
                                );
                            })()}
                        </View>

                        {/* 3. Bio */}
                        <Text style={styles.stepTitle}>3. Presentación</Text>
                        <TextInput
                            style={[styles.modalInput, { height: 120, textAlignVertical: 'top' }]}
                            multiline
                            placeholder="Describe tu experiencia y por qué deberían contratarte..."
                            value={currentCatProfile.bio}
                            onChangeText={(t) => updateCurrentProfile({ bio: t })}
                        />

                        {/* 4. Fotos */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
                            <Text style={styles.stepTitle}>4. Fotos de Presentación</Text>
                            <TouchableOpacity onPress={pickImage} style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}>
                                <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 12 }}>+ Añadir</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal style={{ marginBottom: 20 }}>
                            {(currentCatProfile.gallery || []).map((img, i) => (
                                <View key={i} style={{ position: 'relative', marginRight: 12 }}>
                                    <Image source={{ uri: img }} style={[styles.galleryImage, { borderRadius: 12 }]} />
                                    <TouchableOpacity
                                        style={[styles.deleteImageButton, { backgroundColor: '#EF4444', borderBottomLeftRadius: 10, borderTopRightRadius: 10 }]}
                                        onPress={() => removeImage(i)}
                                    >
                                        <Feather name="x" size={12} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {(!currentCatProfile.gallery?.length) && (
                                <View style={{ width: 100, height: 100, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                                    <Feather name="image" size={24} color="#94A3B8" />
                                </View>
                            )}
                        </ScrollView>
                        <View style={{ height: 30 }} />
                    </ScrollView>

                    {/* Sticky Footer */}
                    <View style={{ flexDirection: 'row', gap: 12, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                        <TouchableOpacity
                            style={[styles.btnCancel, { backgroundColor: '#F1F5F9' }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.btnTextCancel, { color: '#64748B' }]}>Descartar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnSave} onPress={handleSaveProfessional}>
                            <Text style={styles.btnTextSave}>Guardar Perfil</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        width: '100%',
        height: '90%',
        maxHeight: '100%'
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827'
    },
    modalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16
    },
    modalInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        padding: 16,
        fontSize: 16,
        color: '#1F2937',
    },
    btnCancel: {
        flex: 1,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    btnSave: {
        flex: 1,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: '#2563EB'
    },
    btnTextCancel: { color: '#4B5563', fontWeight: 'bold' },
    btnTextSave: { color: 'white', fontWeight: 'bold' },
    stepTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 10,
        marginTop: 15
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        gap: 10
    },
    chip: {
        width: '30%',
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    chipSelected: {
        backgroundColor: '#DBEAFE',
        borderColor: '#2563EB'
    },
    chipText: {
        fontSize: 11,
        color: '#2563EB',
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 4
    },
    chipTextSelected: {
        color: '#2563EB',
        fontWeight: 'bold'
    },
    stateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    stateName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#374151'
    },
    municipalityList: {
        paddingLeft: 10,
        paddingTop: 5,
        paddingBottom: 10
    },
    galleryImage: { width: 100, height: 100, borderRadius: 8, marginRight: 8 },
    deleteImageButton: {
        position: 'absolute',
        top: 0,
        right: 8,
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center'
    }
});
