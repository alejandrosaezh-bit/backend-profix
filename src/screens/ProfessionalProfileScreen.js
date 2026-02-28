import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {
    ProAccountSettings,
    ProCategoryConfig,
    ProCategorySelector,
    ProPersonalInfoCard,
    ProProfileHeader
} from '../components/profile/ProProfileComponents';
import { ProCategorySelectionModal, ProPersonalEditModal, ProProfileEditModal } from '../components/profile/ProProfileModals';
import { api } from '../utils/api';
import { getProStatus } from '../utils/helpers';
import { clearRequests } from '../utils/requests';

// --- MOCK DATA REMOVED ---

const ICON_MAP = {
    'Hogar': 'home',
    'Autos': 'truck',
    'Automotriz': 'truck',
    'Mascotas': 'heart',
    'Evento': 'calendar',
    'Eventos': 'calendar',
    'Salud': 'activity',
    'Salud y Bienestar': 'activity',
    'Belleza': 'scissors',
    'Belleza y Estética': 'scissors',
    'Tech': 'cpu',
    'Tecnología': 'cpu',
    'Clases': 'book-open',
    'Cursos': 'edit-3',
    'Legal': 'file-text',
    'Legal y Trámites': 'file-text',
    'Bienes Raíces': 'map',
    'Inmuebles': 'map',
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
    const [isEditing, setIsEditing] = useState(false); // Professional Profile Editing
    const [isCategorySelectionVisible, setIsCategorySelectionVisible] = useState(false); // Category Selection Modal
    const [isEditingPersonal, setIsEditingPersonal] = useState(false); // Personal Data Editing
    const [personalData, setPersonalData] = useState({}); // Temp state for personal data editing
    const [reviews, setReviews] = useState([]);

    // Location Selector State
    const [expandedStates, setExpandedStates] = useState({});
    const [showAllStates, setShowAllStates] = useState(false);

    const toggleStateExpansion = (stateName) => {
        setExpandedStates(prev => ({
            ...prev,
            [stateName]: !prev[stateName]
        }));
    };

    // Fetch reviews when category or user changes
    const [jobsList, setJobsList] = useState([]); // Store fetched jobs for portfolio display

    // Fetch reviews & stats
    useEffect(() => {
        const fetchData = async () => {
            if (!user?._id) return;
            try {
                // 1. Reviews
                const reviewsData = await api.getProfessionalReviews(user._id);
                setReviews(reviewsData || []);

                // 2. Real Jobs Stats
                let allJobs = [];
                if (isOwner) {
                    // If owner, get all jobs I'm involved in (Offered, Contacted, Assigned)
                    allJobs = await api.getMyJobs({ role: 'pro' });
                } else {
                    // If public view, only show assigned/completed jobs publically?
                    // For now keeping it consistent with public availability
                    allJobs = await api.getJobs({ professional: user._id });
                }

                if (Array.isArray(allJobs)) {
                    setJobsList(allJobs);

                    let activeCount = 0;
                    let completedCount = 0;
                    let cancelledCount = 0;

                    allJobs.forEach(j => {
                        const status = getProStatus(j, user._id);
                        if (['GANADA', 'EN EJECUCIÓN', 'ACEPTADO', 'VALIDANDO', 'PRESUPUESTADA', 'CONTACTADA'].includes(status)) {
                            activeCount++;
                        } else if (['TERMINADO', 'VALORACIÓN', 'FINALIZADA'].includes(status)) {
                            completedCount++;
                        } else if (['PERDIDA', 'RECHAZADA', 'Cerrada'].includes(status)) {
                            cancelledCount++;
                        }
                    });

                    const totalFinished = completedCount + cancelledCount;
                    let successRate = 100;
                    if (totalFinished > 0) {
                        successRate = Math.round((completedCount / totalFinished) * 100);
                    }

                }
            } catch (error) {
                console.error("Error fetching pro data:", error);
            }
        };
        fetchData();
    }, [user?._id, isOwner]);

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
    const realProfile = profileData.profiles?.[categoryKey];
    const currentCatProfile = realProfile || { bio: '', subcategories: [], gallery: [], zones: [] };
    const isCategoryActive = !!realProfile && realProfile.isActive !== false;

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

    const handleResetApplicationData = async () => {
        Alert.alert(
            "Limpiar Historial",
            "¿Estás seguro de que deseas limpiar el historial local? Esto no borrará los datos del servidor.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Limpiar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await clearRequests();
                            await AsyncStorage.removeItem(`@chats_${profileData.email}`);
                            Alert.alert("Éxito", "El historial local ha sido limpiado.");
                        } catch (e) {
                            console.error(e);
                            Alert.alert("Error", "No se pudo limpiar el historial.");
                        }
                    }
                }
            ]
        );
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
        setProfileData(prev => {
            const currentProfiles = prev.profiles || {};
            const profileToUpdate = currentProfiles[categoryKey] || { bio: '', subcategories: [], gallery: [], zones: [] };

            return {
                ...prev,
                profiles: {
                    ...currentProfiles,
                    [categoryKey]: {
                        ...profileToUpdate,
                        ...updates
                    }
                }
            };
        });
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

    // --- CÁLCULO DE ESTADÍSTICAS ESPECÍFICAS DE LA CATEGORÍA ---
    const filteredJobs = jobsList.filter(j => {
        const jCat = (typeof j.category === 'object') ? j.category.name : j.category;
        return jCat === categoryKey;
    });

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

    if (!user) return null;

    return (
        <View style={styles.container}>
            <ProProfileHeader onLogout={onLogout} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <ProPersonalInfoCard
                    isEditingPersonal={isEditingPersonal}
                    personalData={personalData}
                    profileData={profileData}
                    user={user}
                    pickMainImage={pickMainImage}
                />

                <View style={[styles.sectionContainer, { marginTop: 10, shadowColor: '#2563EB', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 15, paddingRight: 10 }}>
                        <TouchableOpacity
                            onPress={() => setIsCategorySelectionVisible(true)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#EFF6FF',
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                borderRadius: 14,
                                borderWidth: 1,
                                borderColor: '#DBEAFE'
                            }}
                        >
                            <Feather name="plus-circle" size={16} color="#2563EB" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 13 }}>Configurar mis Servicios</Text>
                        </TouchableOpacity>
                    </View>

                    <ProCategorySelector
                        sortedCategories={sortedCategories}
                        profileData={profileData}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        ICON_MAP={ICON_MAP}
                    />

                    <ProCategoryConfig
                        isCategoryActive={isCategoryActive}
                        categoryStats={categoryStats}
                        currentCatProfile={currentCatProfile}
                        catReviews={catReviews}
                        selectedCategory={selectedCategory}
                        setIsEditing={setIsEditing}
                        onViewImage={onViewImage}
                    />
                </View>

                <ProAccountSettings
                    startEditingPersonal={startEditingPersonal}
                    handleResetApplicationData={handleResetApplicationData}
                    onSwitchMode={onSwitchMode}
                />

                {/* MODAL 1: SELECTOR DE CATEGORÍAS REDISEÑADO */}
                <ProCategorySelectionModal
                    visible={isCategorySelectionVisible}
                    onClose={() => setIsCategorySelectionVisible(false)}
                    categories={categories}
                    profileData={profileData}
                    ICON_MAP={ICON_MAP}
                    setSelectedCategory={setSelectedCategory}
                    setIsEditing={setIsEditing}
                />

                {/* MODAL 2: EDICIÓN PROFESIONAL */}
                <ProProfileEditModal
                    visible={isEditing}
                    onClose={() => setIsEditing(false)}
                    selectedCategory={selectedCategory}
                    isCategoryActive={isCategoryActive}
                    toggleCategoryActivation={toggleCategoryActivation}
                    allSubcategories={allSubcategories}
                    categoryKey={categoryKey}
                    currentCatProfile={currentCatProfile}
                    toggleSubcategory={toggleSubcategory}
                    allZones={allZones}
                    showAllStates={showAllStates}
                    expandedStates={expandedStates}
                    getSelectedMunicipalitiesInState={getSelectedMunicipalitiesInState}
                    toggleStateExpansion={toggleStateExpansion}
                    toggleMunicipality={toggleMunicipality}
                    setShowAllStates={setShowAllStates}
                    updateCurrentProfile={updateCurrentProfile}
                    pickImage={pickImage}
                    removeImage={removeImage}
                    handleSaveProfessional={handleSaveProfessional}
                />

                {/* MODAL 3: DATOS PERSONALES */}
                <ProPersonalEditModal
                    visible={isEditingPersonal}
                    onClose={() => setIsEditingPersonal(false)}
                    personalData={personalData}
                    setPersonalData={setPersonalData}
                    pickMainImage={pickMainImage}
                    handleSavePersonal={handleSavePersonal}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollContent: { paddingBottom: 20 },

    // Header
    header: {
        backgroundColor: '#2563EB',
        paddingTop: Platform.OS === 'ios' ? 44 : 15,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 0,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.5,
    },
    versionBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 10,
        marginTop: 4
    },
    versionText: {
        fontSize: 10,
        color: 'white',
        fontWeight: 'bold'
    },
    logoutIconButtonHeader: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },

    // Personal Info Card
    profileCard: {
        backgroundColor: 'white',
        marginHorizontal: 4,
        marginTop: 10,
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
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
        backgroundColor: 'transparent',
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2563EB',
        marginTop: 8
    },
    editPersonalButtonText: {
        color: '#2563EB',
        fontWeight: 'bold',
        fontSize: 14
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
        paddingHorizontal: 16,
    },

    // Category Selector (Professional Mode)
    categoryList: {
        paddingBottom: 10
    },
    categoryCard: {
        width: 100,
        height: 100,
        backgroundColor: 'white',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
        marginTop: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#EFF6FF',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5
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
        width: '46%',
        backgroundColor: '#EFF6FF',
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    zoneTagText: {
        fontSize: 11,
        color: '#2563EB',
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 4
    },

    // Stats
    statsGrid: {
        flexDirection: 'row',
        marginBottom: 20
    },
    statBox: {
        flex: 1,
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 24,
        alignItems: 'center',
        marginHorizontal: 4,
        marginTop: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#EFF6FF',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5
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

    // Settings & Switch Mode
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 24,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EFF6FF',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
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
    switchModeButton: {
        backgroundColor: '#EA580C',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 0,
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
    switchModeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    },

    // Modal Styles
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
        marginTop: 18,
    },
    modalInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        padding: 16,
        fontSize: 16,
        color: '#111827',
        minHeight: 56,
    },
    modalActionButton: {
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalActionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },

    // Show More
    showMoreContainer: {
        position: 'relative',
        height: 60,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'white'
    },
    fadeOverlay: {
        position: 'absolute',
        top: -40,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    showMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#EFF6FF',
        borderRadius: 20,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#DBEAFE'
    },
    showMoreText: {
        color: '#2563EB',
        fontWeight: '600',
        fontSize: 14,
        marginRight: 6
    }
});
