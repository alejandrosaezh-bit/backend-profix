import React, { useState, useEffect } from 'react';
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
import { Image as ExpoImage } from 'expo-image';

const AccordionSection = ({ title, expanded, onPress, children }) => (
    <View style={{ marginBottom: 12, backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: expanded ? '#CBD5E1' : '#F1F5F9', overflow: 'hidden' }}>
        <TouchableOpacity 
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: expanded ? '#F8FAFC' : 'white' }} 
            onPress={onPress}
        >
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: expanded ? '#0F172A' : '#475569' }}>{title}</Text>
            <Feather name={expanded ? "chevron-up" : "chevron-down"} size={20} color={expanded ? "#2563EB" : "#94A3B8"} />
        </TouchableOpacity>
        {expanded && (
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                {children}
            </View>
        )}
    </View>
);

export function ProCategorySelectionModal({
    visible,
    onClose,
    categories,
    profileData,
    ICON_MAP,
    setSelectedCategory,
    setIsEditing,
    onActivateCategory
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
                                        if (onActivateCategory) onActivateCategory(catKey);
                                        onClose();
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
                                    <ExpoImage source={{ uri: personalData.avatar }} style={{ width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#EFF6FF' }} />
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
    handleSaveProfessional,
    combinedHistory = [],
    onOpenThemeSelector,
    onOpenPreview
}) {
    const activeColor = currentCatProfile?.profileColor || '#2563EB';
    const [expandedSection, setExpandedSection] = useState(1);
    const [customColor, setCustomColor] = useState('');

    const togglePortfolioImage = (imgUrl) => {
        const currentHidden = currentCatProfile?.hiddenPortfolioImages || [];
        let newHidden;
        if (currentHidden.includes(imgUrl)) {
            newHidden = currentHidden.filter(url => url !== imgUrl);
        } else {
            newHidden = [...currentHidden, imgUrl];
        }
        updateCurrentProfile({ hiddenPortfolioImages: newHidden });
    };

    const portfolioImages = [];
    combinedHistory.forEach(item => {
        if (item.images) {
            item.images.forEach(img => {
                if (!portfolioImages.includes(img)) portfolioImages.push(img);
            });
        }
    });
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
                        <AccordionSection title="1. Especialidades" expanded={expandedSection === 1} onPress={() => setExpandedSection(expandedSection === 1 ? null : 1)}>
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

                            {(() => {
                                const selectedSubs = currentCatProfile.subcategories || [];
                                const urgentSubs = (allSubcategories[categoryKey] || []).filter(sub => {
                                    const subName = typeof sub === 'object' ? sub.name : sub;
                                    const isUrgent = typeof sub === 'object' ? sub.isUrgent : false;
                                    return selectedSubs.includes(subName) && isUrgent;
                                });

                                if (urgentSubs.length === 0) return null;

                                const urgentNames = urgentSubs.map(s => typeof s === 'object' ? s.name : s).join(', ');

                                return (
                                    <View style={{ marginTop: 25, marginBottom: 10, padding: 16, backgroundColor: currentCatProfile.acceptsUrgentJobs ? '#FEF2F2' : '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: currentCatProfile.acceptsUrgentJobs ? '#FECACA' : '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <View style={{ flex: 1, paddingRight: 15 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                <Feather name="alert-triangle" size={18} color={currentCatProfile.acceptsUrgentJobs ? '#EF4444' : '#64748B'} style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: currentCatProfile.acceptsUrgentJobs ? '#991B1B' : '#334155' }}>
                                                    Trabajos Urgentes 24/7
                                                </Text>
                                            </View>
                                            <Text style={{ fontSize: 12, color: currentCatProfile.acceptsUrgentJobs ? '#B91C1C' : '#64748B' }}>
                                                ¿Deseas recibir solicitudes de {urgentNames} urgentes 24/7? Recibirás notificaciones prioritarias.
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => updateCurrentProfile({ acceptsUrgentJobs: !currentCatProfile.acceptsUrgentJobs })}
                                            style={{ width: 50, height: 28, borderRadius: 14, backgroundColor: currentCatProfile.acceptsUrgentJobs ? '#EF4444' : '#CBD5E1', justifyContent: 'center', alignItems: currentCatProfile.acceptsUrgentJobs ? 'flex-end' : 'flex-start', paddingHorizontal: 4 }}
                                        >
                                            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'white' }} />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })()}
                        </AccordionSection>

                        {/* 2. Zonas de Cobertura */}
                        <AccordionSection title="2. Zonas de Cobertura" expanded={expandedSection === 2} onPress={() => setExpandedSection(expandedSection === 2 ? null : 2)}>
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
                        </AccordionSection>

                        {/* 3. Presentación */}
                        <AccordionSection title="3. Presentación" expanded={expandedSection === 3} onPress={() => setExpandedSection(expandedSection === 3 ? null : 3)}>
                            <TextInput
                                style={[styles.modalInput, { height: 120, textAlignVertical: 'top' }]}
                                multiline
                                placeholder="Describe tu experiencia y por qué deberían contratarte..."
                                value={currentCatProfile.bio}
                                onChangeText={(t) => updateCurrentProfile({ bio: t })}
                            />
                        </AccordionSection>

                        {/* 4. Personalizar Diseño */}
                        <AccordionSection title="4. Personalizar Diseño" expanded={expandedSection === 4} onPress={() => setExpandedSection(expandedSection === 4 ? null : 4)}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 10 }}>Tipo de Presentación</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                                {['social', 'corporate', 'modular'].map(theme => (
                                    <TouchableOpacity 
                                        key={theme} 
                                        style={{ flex: 1, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: currentCatProfile.profileTheme === theme ? activeColor : '#E5E7EB', alignItems: 'center', backgroundColor: currentCatProfile.profileTheme === theme ? `${activeColor}15` : 'white' }}
                                        onPress={() => updateCurrentProfile({ profileTheme: theme })}
                                    >
                                        <Feather name={theme === 'social' ? 'instagram' : theme === 'corporate' ? 'briefcase' : 'grid'} size={20} color={currentCatProfile.profileTheme === theme ? activeColor : '#9CA3AF'} style={{ marginBottom: 6 }} />
                                        <Text style={{ fontWeight: 'bold', fontSize: 11, color: currentCatProfile.profileTheme === theme ? activeColor : '#4B5563', textTransform: 'capitalize' }}>{theme}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 10 }}>Color Primario</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                                {['#2563EB', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#1F2937', '#14B8A6'].map(color => (
                                    <TouchableOpacity 
                                        key={color} 
                                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: color, justifyContent: 'center', alignItems: 'center', borderWidth: currentCatProfile.profileColor === color ? 3 : 0, borderColor: '#111827' }}
                                        onPress={() => updateCurrentProfile({ profileColor: color })}
                                    >
                                        {currentCatProfile.profileColor === color && <Feather name="check" size={18} color="white" />}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#6B7280', marginBottom: 8 }}>O usa un color personalizado (Hex):</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 15, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ color: '#9CA3AF', marginRight: 5 }}>#</Text>
                                    <TextInput 
                                        style={{ flex: 1, fontSize: 15, color: '#111827' }} 
                                        placeholder="2563EB" 
                                        maxLength={6} 
                                        value={customColor.replace('#', '')} 
                                        onChangeText={text => {
                                            setCustomColor(text);
                                            if(text.length === 6) updateCurrentProfile({ profileColor: '#' + text });
                                        }} 
                                    />
                                </View>
                                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: activeColor, borderWidth: 1, borderColor: '#E5E7EB' }} />
                            </View>
                        </AccordionSection>

                        {/* 5. Fotos de Presentación */}
                        <AccordionSection title="5. Fotos de Presentación" expanded={expandedSection === 5} onPress={() => setExpandedSection(expandedSection === 5 ? null : 5)}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <Text style={{ fontSize: 13, color: '#64748B' }}>Añade fotos a tu carrusel público.</Text>
                                <TouchableOpacity onPress={pickImage} style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}>
                                    <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 12 }}>+ Añadir</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView horizontal style={{ marginBottom: 5 }}>
                                {(currentCatProfile.gallery || []).map((img, i) => (
                                    <View key={i} style={{ position: 'relative', marginRight: 12 }}>
                                        <ExpoImage source={{ uri: img }} style={[styles.galleryImage, { borderRadius: 12 }]} />
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
                        </AccordionSection>

                        {/* 6. Mostrar en Portafolio */}
                        {portfolioImages.length > 0 && (
                            <AccordionSection title="6. Mostrar en Portafolio" expanded={expandedSection === 6} onPress={() => setExpandedSection(expandedSection === 6 ? null : 6)}>
                                <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 15 }}>Toca las imágenes de tus trabajos finalizados para ocultarlas o mostrarlas en tu perfil público.</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                    {portfolioImages.map((img, idx) => {
                                        const isHidden = (currentCatProfile?.hiddenPortfolioImages || []).includes(img);
                                        return (
                                            <TouchableOpacity 
                                                key={idx} 
                                                style={{ width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', position: 'relative', opacity: isHidden ? 0.5 : 1, borderWidth: isHidden ? 2 : 0, borderColor: '#EF4444' }}
                                                onPress={() => togglePortfolioImage(img)}
                                            >
                                                <ExpoImage source={{ uri: img }} style={{ width: '100%', height: '100%', backgroundColor: '#F1F5F9' }} />
                                                <View style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: isHidden ? '#EF4444' : '#10B981', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' }}>
                                                    <Feather name={isHidden ? "eye-off" : "check"} size={14} color="white" />
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </AccordionSection>
                        )}
                        <View style={{ height: 30 }} />
                    </ScrollView>

                    {/* Sticky Footer */}
                    <View style={{ flexDirection: 'row', backgroundColor: 'white', borderTopWidth: 1, borderColor: '#E5E7EB', paddingBottom: Platform.OS === 'ios' ? 25 : 10, paddingTop: 12, minHeight: 70, marginHorizontal: -20, marginBottom: -20, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
                        <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }} onPress={onClose}>
                            <Feather name="x" size={22} color="#64748B" />
                            <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '600' }}>Descartar</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }} onPress={handleSaveProfessional}>
                            <Feather name="check" size={22} color={activeColor} />
                            <Text style={{ fontSize: 11, color: activeColor, marginTop: 4, fontWeight: '600' }}>Guardar Perfil</Text>
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
        paddingBottom: Platform.OS === 'android' ? 40 : 40,
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start'
    },
    chipSelected: {
        backgroundColor: '#DBEAFE',
        borderColor: '#2563EB'
    },
    chipText: {
        fontSize: 12,
        color: '#2563EB',
        fontWeight: '600',
        textAlign: 'center',
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


