import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { api } from '../utils/api';
import { clearRequests } from '../utils/requests';

const { width } = Dimensions.get('window');

// --- MOCK DATA REMOVED ---

const ICON_MAP = {
    'Hogar': 'home',
    'Autos': 'tool',
    'Mascotas': 'smile', // or github/gitlab exist in feather? no. 'smile', 'github'? 'gitlab'? 'heart'? 'anchor'? 'feather'?
    // Feather icons: home, tool, user, settings, camera, star, etc.
    // Let's use generic mapping.
    'Evento': 'calendar',
    'Salud': 'heart',
    'Belleza': 'sun',
    'Tech': 'monitor',
    'Clases': 'book',
    'Legal': 'briefcase',
    'General': 'grid'
};



export default function ProfessionalProfileScreen({
    user,
    isOwner = false,
    categories = [],
    allSubcategories = {},
    allZones = {}, // Ahora es un objeto { Ciudad: [Municipios] }
    onBack,
    onUpdate,
    onLogout,
    onSwitchMode,
    onViewImage
}) {
    // Si no hay usuario (ej: durante logout), no renderizar nada para evitar errores
    if (!user) return null;

    const [isEditing, setIsEditing] = useState(false); // Professional Profile Editing
    const [isEditingPersonal, setIsEditingPersonal] = useState(false); // Personal Data Editing
    const [personalData, setPersonalData] = useState({}); // Temp state for personal data editing
    const [reviews, setReviews] = useState([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);

    // Location Selector State
    const [expandedStates, setExpandedStates] = useState({});

    const toggleStateExpansion = (stateName) => {
        setExpandedStates(prev => ({
            ...prev,
            [stateName]: !prev[stateName]
        }));
    };

    // Fetch reviews when category or user changes
    const [stats, setStats] = useState({
        active: 0,
        completed: 0,
        successRate: 100
    });
    const [jobsList, setJobsList] = useState([]); // Store fetched jobs for portfolio display

    // Fetch reviews & stats
    useEffect(() => {
        const fetchData = async () => {
            if (!user?._id) return;
            setIsLoadingReviews(true);
            try {
                // If owner, ensure we have the latest profile data too
                if (isOwner) {
                    // We might want to rely on the parent updating `user`, but let's be safe
                    // Actually, parent handles user updates via `getMe`.
                    // The issue might be `profileData` not syncing if `user` prop hasn't changed reference but content did (though React should handle reference changes).
                    // However, fetching fresh stats is always good.
                }

                // 1. Reviews
                const reviewsData = await api.getProfessionalReviews(user._id);
                setReviews(reviewsData || []);

                // 2. Real Jobs Stats
                // Fetch all jobs where this user is the assigned professional
                const allJobs = await api.getJobs({ professional: user._id });
                if (Array.isArray(allJobs)) {
                    setJobsList(allJobs); // Save for portfolio usage
                    const activeCount = allJobs.filter(j => ['En Ejecución', 'Asignada', 'Aceptada', 'in_progress', 'active'].includes(j.status)).length;
                    const completedCount = allJobs.filter(j => ['Finalizada', 'Cerrado', 'Cerrada', 'TERMINADO', 'completed', 'rated', 'Culminada'].includes(j.status) || j.proFinished).length;
                    const totalFinished = completedCount + allJobs.filter(j => j.status === 'Cancelada').length; // Suponiendo canceladas cuentan para ratio

                    // Success Rate: Finalizadas vs Total Finalizadas (o Total Asignadas históricas?)
                    // Usaremos: de los trabajos terminados, cuántos fueron exitosos (Finalizada) vs Cancelados/Problema.
                    // O simplemente el % de trabajos aceptados que se completaron.
                    // Para simplificar: % de trabajos (Finalizada) sobre (Finalizada + Cancelada). Si es 0, 100%.
                    let successRate = 100;
                    if (totalFinished > 0) {
                        successRate = Math.round((completedCount / totalFinished) * 100);
                    }

                    setStats({
                        active: activeCount,
                        completed: completedCount,
                        successRate: successRate
                    });
                }

            } catch (error) {
                console.error("Error fetching pro data:", error);
            } finally {
                setIsLoadingReviews(false);
            }
        };
        fetchData();
    }, [user?._id]);

    // Estado principal del perfil
    // Estructura esperada: 
    // user.profiles = { "Hogar": { bio: "...", subcategories: [], gallery: [] }, "Automotriz": ... }
    // Helper to ensure profiles is an object
    const getProfilesObj = (p) => {
        if (!p) return {};
        if (p instanceof Map) return Object.fromEntries(p); // Should not happen with current serializers but just in case
        return p;
    };

    const [profileData, setProfileData] = useState({
        ...user,
        profiles: getProfilesObj(user?.profiles)
    });

    // Categoría seleccionada actualmente en la vista (objeto completo de categoría)
    // Inicializar con la primera categoría activa si existe, sino la primera de la lista
    // Seleccionar la primera categoría que tenga un perfil activo, respetando el orden de la lista original
    const [selectedCategory, setSelectedCategory] = useState(() => {
        // Buscamos en el orden de 'categories' cuál tiene perfil activo
        const firstActive = categories.find(c => {
            const key = c.fullName || c.name;
            return user?.profiles?.[key] && user.profiles[key].isActive !== false;
        });
        if (firstActive) return firstActive;

        // Fallback: Primera de la lista o genérica
        return categories[0] || { name: 'General', fullName: 'General' };
    });

    // Helper: Obtener key de la categoría (usamos fullName para coincidir con DETAILED_CATEGORIES)
    const categoryKey = selectedCategory.fullName || selectedCategory.name;

    // Efecto para sincronizar profileData cuando el usuario se actualiza externamente (ej: al cargar app)
    useEffect(() => {
        if (isEditing) {
            console.log("ProfessionalProfileScreen: User prop updated but ignored because isEditing is true.");
            return;
        }
        // Asegurar que usamos la versión más fresca de user
        const freshProfiles = user?.profiles || {};
        setProfileData({ ...user, profiles: freshProfiles });
        console.log("ProfessionalProfileScreen: User prop updated, syncing state. Active categories:", Object.keys(freshProfiles));
    }, [user, isEditing]);

    // Auto-select first active category if current is not active/available (e.g. after fetch)
    useEffect(() => {
        const currentKey = selectedCategory.fullName || selectedCategory.name;
        const hasProfile = profileData.profiles?.[currentKey];
        const isActive = hasProfile && hasProfile.isActive !== false;

        if (!isActive || !hasProfile) {
            const firstActiveKey = Object.keys(profileData.profiles || {}).find(k => {
                const p = profileData.profiles[k];
                return p && p.isActive !== false;
            });
            if (firstActiveKey) {
                const found = categories.find(c => (c.fullName || c.name) === firstActiveKey);
                if (found) setSelectedCategory(found);
            }
        }
    }, [profileData.profiles]);

    // Helper: Obtener perfil de la categoría actual
    const currentCatProfile = profileData.profiles?.[categoryKey];
    const isCategoryActive = !!currentCatProfile && currentCatProfile.isActive !== false;

    // --- ORDENAMIENTO DE CATEGORÍAS (Activas primero) ---
    const sortedCategories = [...categories].sort((a, b) => {
        const keyA = a.fullName || a.name;
        const keyB = b.fullName || b.name;
        const activeA = !!profileData.profiles?.[keyA];
        const activeB = !!profileData.profiles?.[keyB];
        if (activeA && !activeB) return -1;
        if (!activeA && activeB) return 1;
        return 0;
    });

    // --- ACCIONES ---

    // --- SAVE HANDLERS ---

    const handleSavePersonal = () => {
        const dataToUpdate = {
            ...user,
            ...personalData
        };
        // Clean password/nulls
        if (!dataToUpdate.password) delete dataToUpdate.password;

        console.log("Saving Personal Data:", dataToUpdate.name);
        if (onUpdate) onUpdate(dataToUpdate);
        setIsEditingPersonal(false);
    };

    const handleSaveProfessional = () => {
        // Convert Map to Object
        const profilesObject = {};
        if (profileData.profiles instanceof Map) {
            profileData.profiles.forEach((value, key) => {
                profilesObject[key] = value;
            });
        } else if (typeof profileData.profiles === 'object' && profileData.profiles !== null) {
            Object.assign(profilesObject, profileData.profiles);
        }

        const dataToUpdate = {
            ...profileData,
            profiles: profilesObject
        };

        if (dataToUpdate.cedula === '') dataToUpdate.cedula = undefined;
        if (!dataToUpdate.password) delete dataToUpdate.password;

        console.log("Saving Professional Data");
        if (onUpdate) onUpdate(dataToUpdate);
        setIsEditing(false);
    };

    // Initialize personal data on edit start
    const startEditingPersonal = () => {
        setPersonalData({
            name: profileData.name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            cedula: profileData.cedula || '',
            avatar: profileData.avatar || profileData.image
        });
        setIsEditingPersonal(true);
    };

    const handleClearChats = async () => {
        Alert.alert(
            "Borrar Chats",
            "¿Estás seguro de que quieres borrar todos los chats y solicitudes locales?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Borrar",
                    style: "destructive",
                    onPress: async () => {
                        await clearRequests();
                        Alert.alert("Éxito", "Chats borrados. Por favor recarga la app.");
                    }
                }
            ]
        );
    };

    const toggleCategoryActivation = () => {
        const newProfiles = { ...profileData.profiles };

        if (isCategoryActive) {
            // Desactivar (Pausar perfil de esta categoría)
            const confirmPause = () => {
                // Soft delete: Mark as inactive
                newProfiles[categoryKey] = { ...newProfiles[categoryKey], isActive: false };
                setProfileData({ ...profileData, profiles: newProfiles });
                setIsEditing(true);
            };

            if (Platform.OS === 'web') {
                if (window.confirm("¿Pausar categoría? Dejarás de recibir solicitudes de esta categoría temporalmente, pero tus datos se conservarán.")) {
                    confirmPause();
                }
            } else {
                Alert.alert(
                    "¿Pausar categoría?",
                    "Dejarás de recibir solicitudes de esta categoría temporalmente, pero tus datos se conservarán.",
                    [
                        { text: "Cancelar", style: "cancel" },
                        {
                            text: "Pausar", style: "destructive", onPress: confirmPause
                        }
                    ]
                );
            }
        } else {
            // Activar
            if (newProfiles[categoryKey]) {
                // Reactivar existente
                newProfiles[categoryKey] = { ...newProfiles[categoryKey], isActive: true };
            } else {
                // Crear perfil nuevo
                newProfiles[categoryKey] = {
                    bio: '',
                    subcategories: [],
                    gallery: [],
                    isActive: true
                };
            }
            setProfileData({ ...profileData, profiles: newProfiles });
            setIsEditing(true);
        }
    };

    const toggleSubcategory = (sub) => {
        if (!isCategoryActive) return;
        const currentSubs = currentCatProfile.subcategories || [];
        let newSubs;
        if (currentSubs.includes(sub)) {
            newSubs = currentSubs.filter(s => s !== sub);
        } else {
            newSubs = [...currentSubs, sub];
        }

        updateCurrentProfile({ subcategories: newSubs });
    };

    const toggleMunicipality = (municipality, state) => {
        if (!isCategoryActive) return;
        const fullZoneName = `${municipality}, ${state}`;
        const currentZones = currentCatProfile.zones || [];
        let newZones;
        if (currentZones.includes(fullZoneName)) {
            newZones = currentZones.filter(z => z !== fullZoneName);
        } else {
            newZones = [...currentZones, fullZoneName];
        }
        updateCurrentProfile({ zones: newZones });
    };

    // Helper to check if a state has any selected municipalities
    const getSelectedMunicipalitiesInState = (state) => {
        const currentZones = currentCatProfile.zones || [];
        return currentZones.filter(z => z.endsWith(`, ${state}`)).map(z => z.split(', ')[0]);
    };

    const updateCurrentProfile = (updates) => {
        setProfileData(prev => ({
            ...prev,
            profiles: {
                ...prev.profiles,
                [categoryKey]: {
                    ...prev.profiles[categoryKey],
                    ...updates
                }
            }
        }));
    };

    const pickMainImage = async () => {
        // Solicitar permisos primero
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para cambiar la foto.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            if (isEditingPersonal) {
                setPersonalData(prev => ({ ...prev, avatar: base64Img }));
            } else {
                setProfileData(prev => ({ ...prev, avatar: base64Img }));
            }
        }
    };

    const pickImage = async () => {
        // Solicitar permisos primero
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para subir fotos.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.5, // Reducir calidad para evitar payloads gigantes
            base64: true, // IMPORTANTE: Usar base64 para MongoDB
        });

        if (!result.canceled) {
            // Convertir a array de base64 strings
            const newImages = result.assets.map(asset => `data:image/jpeg;base64,${asset.base64}`);
            const currentGallery = currentCatProfile.gallery || [];
            updateCurrentProfile({ gallery: [...currentGallery, ...newImages] });
        }
    };

    const removeImage = (index) => {
        const currentGallery = currentCatProfile.gallery || [];
        const newGallery = currentGallery.filter((_, i) => i !== index);
        updateCurrentProfile({ gallery: newGallery });
    };

    // --- RENDER HELPERS ---

    const renderStars = (rating) => (
        <View style={{ flexDirection: 'row' }}>
            {[...Array(5)].map((_, i) => (
                <FontAwesome5 key={i} name="star" solid={i < rating} size={12} color="#FBBF24" />
            ))}
        </View>
    );

    // --- CÁLCULO DE ESTADÍSTICAS ESPECÍFICAS DE LA CATEGORÍA ---
    const filteredJobs = jobsList.filter(j => {
        const jCat = (typeof j.category === 'object') ? j.category.name : j.category;
        return jCat === categoryKey;
    });

    const catActiveCount = filteredJobs.filter(j => ['En Ejecución', 'Asignada', 'Aceptada', 'VALIDANDO', 'in_progress'].includes(j.status)).length;
    const catCompletedCount = filteredJobs.filter(j => ['Finalizada', 'Cerrado', 'Cerrada', 'TERMINADO', 'completed', 'rated', 'Culminada'].includes(j.status) || j.proFinished).length;
    const catTotalFinished = catCompletedCount + filteredJobs.filter(j => j.status === 'canceled' || j.status === 'Cancelada').length;

    let catSuccessRate = 0;
    if (catTotalFinished > 0) {
        catSuccessRate = Math.round((catCompletedCount / catTotalFinished) * 100);
    }

    // Rating específico si hay reviews, sino el global
    const catReviews = reviews.filter(rev => {
        const revCat = (typeof rev.jobCategory === 'object') ? rev.jobCategory.name : rev.jobCategory;
        return !revCat || revCat === categoryKey;
    });

    let catRating = 0;
    if (catReviews.length > 0) {
        const sum = catReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        catRating = (sum / catReviews.length).toFixed(1);
    } else if (catCompletedCount > 0) {
        // Si tiene trabajos completados pero no reviews, usamos la global
        catRating = (user.rating || 5.0);
    } else {
        // 0 trabajos y 0 reviews = 0 valoración en esta categoría
        catRating = "0.0";
    }

    const categoryStats = {
        jobs: catCompletedCount, // "Ganados" suele referirse a terminados exitosamente
        rating: catRating,
        success: `${catSuccessRate}%`
    };

    const globalRating = user.rating || 5.0; // Global Rating from User Object

    return (
        <View style={styles.container}>
            {/* Header Redesign */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={{ padding: 5 }}>
                    <Feather name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Perfil Profesional</Text>
                <TouchableOpacity onPress={onLogout} style={{ padding: 5, flexDirection: 'row', alignItems: 'center' }}>
                    <Feather name="log-out" size={22} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* PERSONAL INFO CARD (FLOATING) */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <TouchableOpacity disabled={!isEditingPersonal} onPress={pickMainImage}>
                            {(isEditingPersonal ? personalData.avatar : (profileData.avatar || profileData.image)) ? (
                                <Image
                                    source={{ uri: isEditingPersonal ? personalData.avatar : (profileData.avatar || profileData.image) }}
                                    style={styles.avatar}
                                />
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

                    {isEditingPersonal ? (
                        <View style={styles.formContainer}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Nombre Completo</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={personalData.name}
                                    onChangeText={(t) => setPersonalData(p => ({ ...p, name: t }))}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Teléfono</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={personalData.phone}
                                    onChangeText={(t) => setPersonalData(p => ({ ...p, phone: t }))}
                                    placeholder="+56 9 1234 5678"
                                    keyboardType="phone-pad"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Cédula (Solo lectura)</Text>
                                <TextInput
                                    style={[styles.textInput, { backgroundColor: '#F3F4F6', color: '#6B7280' }]}
                                    value={personalData.cedula}
                                    editable={false}
                                />
                            </View>
                            <View style={styles.rowButtons}>
                                <TouchableOpacity style={styles.btnCancel} onPress={() => setIsEditingPersonal(false)}>
                                    <Text style={styles.btnTextCancel}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnSave} onPress={handleSavePersonal}>
                                    <Text style={styles.btnTextSave}>Guardar Datos</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.userName}>{profileData.name || 'Profesional'}</Text>
                            <Text style={styles.userEmail}>{profileData.email}</Text>
                            <View style={styles.ratingContainer}>
                                <Feather name="star" size={14} color="#D97706" style={{ marginRight: 4 }} />
                                <Text style={styles.ratingText}>{globalRating} (General)</Text>
                            </View>

                            {!isEditing && (
                                <TouchableOpacity style={styles.editPersonalButton} onPress={startEditingPersonal}>
                                    <Text style={styles.editPersonalButtonText}>Editar Datos Personales</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>

                {/* PROFESSIONAL SECTION (HIDDEN WHILE EDITING PERSONAL) */}
                {!isEditingPersonal && (
                    <View style={styles.sectionContainer}>

                        {/* HEADER DE SECCIÓN */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Tu Perfil Profesional</Text>
                            {!isEditing && (
                                <TouchableOpacity onPress={() => setIsEditing(true)}>
                                    <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>Gestionar / Editar</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* CATEGORY SELECTOR */}
                        <View style={{ marginBottom: 20 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
                                {sortedCategories.map((cat) => {
                                    const catKey = cat.fullName || cat.name;
                                    const isActive = !!profileData.profiles?.[catKey] && profileData.profiles[catKey].isActive !== false;
                                    const isSelected = selectedCategory.id === cat.id;

                                    // View Mode: Show only active (unless none active)
                                    if (!isEditing && !isActive && sortedCategories.some(c => !!profileData.profiles?.[(c.fullName || c.name)]?.isActive)) return null;

                                    return (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.categoryCard,
                                                isSelected && styles.categoryCardSelected,
                                                isActive && !isSelected && { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }
                                            ]}
                                            onPress={() => setSelectedCategory(cat)}
                                        >
                                            <View style={styles.categoryIcon}>
                                                {typeof cat.icon === 'function' ? (
                                                    <cat.icon size={24} color={isSelected ? '#2563EB' : (isActive ? '#16A34A' : '#6B7280')} />
                                                ) : (
                                                    <Feather
                                                        name={cat.icon || ICON_MAP[cat.name] || 'grid'}
                                                        size={24}
                                                        color={isSelected ? '#2563EB' : (isActive ? '#16A34A' : '#6B7280')}
                                                    />
                                                )}
                                            </View>
                                            <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>{cat.name}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* CONTENT FOR SELECTED CATEGORY */}
                        {isEditing ? (
                            // --- EDITING MODE ---
                            <View style={styles.activationContainer}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={[styles.sectionTitle, { fontSize: 18 }]}>{selectedCategory.name}</Text>
                                    <TouchableOpacity
                                        onPress={toggleCategoryActivation}
                                        style={{ backgroundColor: isCategoryActive ? '#FEF2F2' : '#F0FDF4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}
                                    >
                                        <Text style={{ color: isCategoryActive ? '#EF4444' : '#16A34A', fontSize: 12, fontWeight: 'bold' }}>
                                            {isCategoryActive ? 'Pausar Categoría' : 'Activar Categoría'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Step 1: Subcategories */}
                                <Text style={styles.stepTitle}>1. Especialidades</Text>
                                <View style={styles.chipsContainer}>
                                    {(allSubcategories[categoryKey] || []).map((sub, i) => {
                                        const subName = typeof sub === 'object' ? sub.name : sub;
                                        const isSelected = currentCatProfile.subcategories?.includes(subName);
                                        return (
                                            <TouchableOpacity
                                                key={i}
                                                style={[styles.chip, isSelected && styles.chipSelected]}
                                                onPress={() => toggleSubcategory(subName)}
                                            >
                                                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{subName}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Step 2: Location (Improved) */}
                                <Text style={styles.stepTitle}>2. Zonas de Cobertura</Text>
                                <View style={{ borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 10, overflow: 'hidden' }}>
                                    {Object.keys(allZones).map((state) => {
                                        const municipalities = allZones[state];
                                        const isExpanded = expandedStates[state];
                                        const selectedInState = getSelectedMunicipalitiesInState(state);
                                        const hasSelection = selectedInState.length > 0;

                                        return (
                                            <View key={state}>
                                                <TouchableOpacity
                                                    style={[styles.stateItem, { paddingHorizontal: 12, backgroundColor: hasSelection ? '#F8FAFC' : 'white' }]}
                                                    onPress={() => toggleStateExpansion(state)}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <Feather name={isExpanded ? "chevron-down" : "chevron-right"} size={18} color="#6B7280" />
                                                        <Text style={[styles.stateName, hasSelection && { color: '#2563EB', fontWeight: 'bold' }]}>
                                                            {state}
                                                            {hasSelection && <Text style={{ fontWeight: 'normal', color: '#6B7280' }}> ({selectedInState.length})</Text>}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>

                                                {isExpanded && (
                                                    <View style={styles.municipalityList}>
                                                        <View style={styles.chipsContainer}>
                                                            {municipalities.map(muni => {
                                                                const fullZone = `${muni}, ${state}`;
                                                                const isSelected = currentCatProfile.zones?.includes(fullZone);
                                                                return (
                                                                    <TouchableOpacity
                                                                        key={muni}
                                                                        style={[styles.chip, isSelected && styles.chipSelected, { transform: [{ scale: 0.95 }] }]}
                                                                        onPress={() => toggleMunicipality(muni, state)}
                                                                    >
                                                                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected, { fontSize: 12 }]}>{muni}</Text>
                                                                    </TouchableOpacity>
                                                                );
                                                            })}
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>

                                {/* Step 3: Bio */}
                                <Text style={styles.stepTitle}>3. Presentación</Text>
                                <TextInput
                                    style={styles.bioInput}
                                    multiline
                                    placeholder="Cuéntale a los clientes sobre tu experiencia..."
                                    value={currentCatProfile.bio}
                                    onChangeText={(t) => updateCurrentProfile({ bio: t })}
                                />

                                {/* Step 4: Gallery */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
                                    <Text style={styles.stepTitle}>4. Fotos de Presentación</Text>
                                    <TouchableOpacity onPress={pickImage}>
                                        <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 13 }}>+ Agregar Foto</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView horizontal style={{ marginBottom: 10 }}>
                                    {(currentCatProfile.gallery || []).map((img, i) => (
                                        <View key={i} style={{ position: 'relative', marginRight: 10 }}>
                                            <Image source={{ uri: img }} style={styles.galleryImage} />
                                            <TouchableOpacity style={styles.deleteImageButton} onPress={() => removeImage(i)}>
                                                <Feather name="x" size={12} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>

                                {/* Action Buttons */}
                                <View style={styles.rowButtons}>
                                    <TouchableOpacity style={styles.btnCancel} onPress={() => setIsEditing(false)}>
                                        <Text style={styles.btnTextCancel}>Descartar Cambios</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.btnSave} onPress={handleSaveProfessional}>
                                        <Text style={styles.btnTextSave}>Guardar Perfil</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            // --- VIEW MODE ---
                            <View>
                                {isCategoryActive ? (
                                    <>
                                        {/* Stats */}
                                        <View style={styles.statsGrid}>
                                            <View style={styles.statBox}>
                                                <Text style={styles.statNumber}>{categoryStats.jobs}</Text>
                                                <Text style={styles.statLabelSmall}>Trabajos</Text>
                                            </View>
                                            <View style={styles.statBox}>
                                                <Text style={styles.statNumber}>{categoryStats.rating}</Text>
                                                <Text style={styles.statLabelSmall}>Valoración</Text>
                                            </View>
                                            <View style={styles.statBox}>
                                                <Text style={styles.statNumber}>{categoryStats.success}</Text>
                                                <Text style={styles.statLabelSmall}>Éxito</Text>
                                            </View>
                                        </View>

                                        {/* Info Sections */}
                                        <View style={styles.infoSection}>
                                            <Text style={styles.infoLabel}>Bio</Text>
                                            <Text style={styles.infoText}>{currentCatProfile.bio || 'Sin información.'}</Text>
                                        </View>

                                        <View style={styles.infoSection}>
                                            <Text style={styles.infoLabel}>Cobertura</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                                {(currentCatProfile.zones || []).map((zone, i) => (
                                                    <View key={i} style={styles.zoneTag}>
                                                        <Text style={styles.zoneTagText}>{zone}</Text>
                                                    </View>
                                                ))}
                                                {(!currentCatProfile.zones?.length) && <Text style={{ color: '#9CA3AF' }}>Sin zonas definidas</Text>}
                                            </View>
                                        </View>

                                        <View style={styles.infoSection}>
                                            <Text style={styles.infoLabel}>Especialidades</Text>
                                            <View style={styles.chipsContainer}>
                                                {(currentCatProfile.subcategories || []).map((sub, i) => (
                                                    <View key={i} style={styles.chip}>
                                                        <Text style={styles.chipText}>{sub}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>

                                        {/* Portfolio (View Only) */}
                                        <Text style={styles.infoLabel}>Portafolio</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                                            {(currentCatProfile.gallery || []).map((img, i) => (
                                                <TouchableOpacity key={i} onPress={() => onViewImage && onViewImage(img)}>
                                                    <Image source={{ uri: img }} style={styles.galleryImage} />
                                                </TouchableOpacity>
                                            ))}
                                            {(!currentCatProfile.gallery?.length) && <Text style={{ color: '#9CA3AF' }}>Sin fotos.</Text>}
                                        </ScrollView>

                                        {/* Reviews */}
                                        <Text style={styles.infoLabel}>Reseñas Recientes</Text>
                                        {catReviews.length > 0 ? catReviews.slice(0, 3).map((r, i) => (
                                            <View key={i} style={styles.reviewCard}>
                                                <Text style={{ fontWeight: 'bold' }}>{r.reviewer?.name || 'Cliente'}</Text>
                                                <Text>{r.comment}</Text>
                                            </View>
                                        )) : <Text style={{ color: '#9CA3AF' }}>No hay reseñas aún.</Text>}

                                    </>
                                ) : (
                                    <View style={styles.emptyState}>
                                        <Feather name="briefcase" size={40} color="#CBD5E1" />
                                        <Text style={styles.emptyStateText}>Perfil inactivo en {selectedCategory.name}</Text>
                                        <Text style={styles.emptyStateSubtext}>Actívalo para empezar a recibir trabajos en esta categoría.</Text>
                                        <TouchableOpacity
                                            style={[styles.btnSave, { marginTop: 15, width: '100%' }]}
                                            onPress={() => setIsEditing(true)}
                                        >
                                            <Text style={styles.btnTextSave}>Comenzar Activación</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollContent: { paddingBottom: 100 },

    // Header
    header: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },

    // Personal Info Card
    profileCard: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: -30,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 20
    },
    avatarContainer: {
        marginBottom: 10,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: 'white',
        backgroundColor: '#F3F4F6'
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2563EB',
        padding: 6,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: 'white',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 2,
        textAlign: 'center'
    },
    userEmail: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
        textAlign: 'center'
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
    },
    ratingText: {
        color: '#D97706',
        fontWeight: '600',
        fontSize: 13,
    },
    editPersonalButton: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    editPersonalButtonText: {
        color: '#4B5563',
        fontWeight: '600',
        fontSize: 13
    },

    // Forms
    formContainer: {
        width: '100%',
        marginTop: 10
    },
    inputGroup: {
        marginBottom: 15
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6
    },
    textInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: '#111827'
    },
    rowButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 10
    },
    btnCancel: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center'
    },
    btnSave: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#2563EB',
        alignItems: 'center'
    },
    btnTextCancel: { color: '#4B5563', fontWeight: 'bold' },
    btnTextSave: { color: 'white', fontWeight: 'bold' },

    // Sections
    sectionContainer: {
        paddingHorizontal: 16,
        marginBottom: 20
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827'
    },

    // Category Selector (Professional Mode)
    categoryList: {
        paddingBottom: 10
    },
    categoryCard: {
        width: 100,
        height: 100,
        backgroundColor: 'white',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    categoryCardSelected: {
        backgroundColor: '#EFF6FF',
        borderColor: '#2563EB',
        borderWidth: 2
    },
    categoryIcon: {
        marginBottom: 8
    },
    categoryName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
        textAlign: 'center'
    },
    categoryNameSelected: {
        color: '#2563EB',
        fontWeight: 'bold'
    },

    // Activation Flow
    activationContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 10
    },
    stepTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 10,
        marginTop: 15
    },

    // Subcategories & Chips
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    chipSelected: {
        backgroundColor: '#DBEAFE',
        borderColor: '#BFDBFE'
    },
    chipText: {
        fontSize: 13,
        color: '#4B5563'
    },
    chipTextSelected: {
        color: '#2563EB',
        fontWeight: '600'
    },

    // Location Selector
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

    // Empty State
    emptyState: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#D1D5DB'
    },

    // Info Display (View Mode)
    infoSection: {
        marginBottom: 20
    },
    infoLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8
    },
    infoText: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22
    },
    zoneTag: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 6,
        marginBottom: 6
    },
    zoneTagText: {
        fontSize: 12,
        color: '#4F46E5'
    },

    // Stats
    statsGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20
    },
    statBox: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A'
    },
    statLabelSmall: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2
    },

    galleryImage: { width: 100, height: 100, borderRadius: 8, marginRight: 8 },
    reviewCard: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, marginBottom: 10 },
});
