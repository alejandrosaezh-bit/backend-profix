import { Feather, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {
    ProAccountSettings,
    ProCategorySelector
} from '../components/profile/ProProfileComponents';
import { ProSubscriptionModal } from '../components/profile/ProSubscriptionModal';
import { ProGamificationModal } from '../components/profile/ProGamificationModal';
import { ProCategorySelectionModal, ProPersonalEditModal, ProProfileEditModal } from '../components/profile/ProProfileModals';
import { api } from '../utils/api';
import { getProStatus } from '../utils/helpers';
import { compressAvatar, compressImage } from '../utils/imageCompressor';
import { clearRequests } from '../utils/requests';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    onViewImage,
    requestedCategoryName
}) {
    const [isEditing, setIsEditing] = useState(false); // Professional Profile Editing
    const [isCategorySelectionVisible, setIsCategorySelectionVisible] = useState(false); // Category Selection Modal
    const [isEditingPersonal, setIsEditingPersonal] = useState(false); // Personal Data Editing
    const [isSubscriptionsVisible, setIsSubscriptionsVisible] = useState(false); // Subscriptions Modal
    const [isGamificationVisible, setIsGamificationVisible] = useState(false); // Gamification Modal
    const [personalData, setPersonalData] = useState({}); // Temp state for personal data editing
    const [reviews, setReviews] = useState([]);
    const [selectedGallery, setSelectedGallery] = useState(null);

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

                    let offeredCount = 0;
                    let wonCount = 0;

                    allJobs.forEach(j => {
                        const status = getProStatus(j, user._id);
                        // Ofertados = todos los que tengan interacción/presupuestada + los ganados/terminados + perdidos/rechazados
                        // Básicamente, todo el timeline donde el pro ha mandado una oferta.
                        // Para simplificar: comprobaremos si existe una oferta de este pro
                        const hasOffered = j.offers?.some(o => o.proId?._id === user._id || o.proId === user._id);
                        if (hasOffered) {
                            offeredCount++;
                        }

                        // Ganados = los que se aceptó la oferta y pasó a in_progress/completed/etc
                        const isWon = ['GANADA', 'EN EJECUCIÓN', 'ACEPTADO', 'VALIDANDO', 'TERMINADO', 'VALORACIÓN', 'FINALIZADA'].includes(status);
                        if (isWon) {
                            wonCount++;
                        }
                    });

                    let successRate = 100;
                    if (offeredCount > 0) {
                        successRate = Math.round((wonCount / offeredCount) * 100);
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
        // 1. Si venimos de una solicitud específica, mostrar esa categoría primero si la tiene activa
        if (requestedCategoryName) {
            const requestedCat = categories.find(c => (c.fullName || c.name) === requestedCategoryName);
            const reqKey = requestedCat?.fullName || requestedCat?.name || requestedCategoryName;
            if (requestedCat && user?.profiles?.[reqKey] && user.profiles[reqKey].isActive !== false) {
                return requestedCat;
            }
        }

        // 2. Buscamos en el orden de 'categories' cuál tiene perfil activo
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
            allowsEditing: false,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const compressedBase64Img = await compressAvatar(result.assets[0].uri);
            if (isEditingPersonal) {
                setPersonalData(prev => ({ ...prev, avatar: compressedBase64Img }));
            } else {
                setProfileData(prev => ({ ...prev, avatar: compressedBase64Img }));
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
            // Comprimir todas y convertir a array de base64 strings optimizados
            const compressedImagesPromises = result.assets.map(asset => compressImage(asset.uri));
            const newImages = await Promise.all(compressedImagesPromises);
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

    let catOfferedCount = 0;
    let catWonCount = 0;

    filteredJobs.forEach(j => {
        const status = getProStatus(j, user._id);
        const hasOffered = j.offers?.some(o => o.proId?._id === user._id || o.proId === user._id);
        if (hasOffered) {
            catOfferedCount++;
        }

        const isWon = ['GANADA', 'EN EJECUCIÓN', 'ACEPTADO', 'VALIDANDO', 'TERMINADO', 'VALORACIÓN', 'FINALIZADA'].includes(status);
        if (isWon) {
            catWonCount++;
        }
    });

    let catSuccessRate = 0;
    if (catOfferedCount > 0) {
        catSuccessRate = Math.round((catWonCount / catOfferedCount) * 100);
    }

    // Filter reviews specific to this category
    const catReviews = (reviews || []).filter(rev => {
        // Intentar obtener la categoría desde la propiedad jobCategory o desde el objeto anidado job.category
        let revCat = null;
        if (rev.jobCategory) {
            revCat = typeof rev.jobCategory === 'object' ? (rev.jobCategory.name || rev.jobCategory.fullName) : rev.jobCategory;
        } else if (rev.job && rev.job.category) {
            revCat = typeof rev.job.category === 'object' ? (rev.job.category.name || rev.job.category.fullName) : rev.job.category;
        } else if (rev.job && rev.job.title) {
            // Un fallback muy agresivo por si 'category' no viene poblado pero sí 'title' (aunque title != category generalmente, esto es por si acaso mapeamos así)
            // Lo ideal es que categoryKey coincida.
        }
        
        // Exigir estricta coincidencia, a menos que realmente no haya forma de saber la categoría (en tal caso mejor no mostrarla para evitar el molesto 'clonado' en todas las pestañas)
        return revCat === categoryKey || (!revCat && categoryKey === 'General');
    });

    let catRating = 0;
    if (catReviews.length > 0) {
        const sum = catReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        catRating = (sum / catReviews.length).toFixed(1);
    } else if (catWonCount > 0) {
        // Si tiene trabajos ganados/completados pero no reviews, usamos la global
        catRating = user.rating ? user.rating.toFixed(1) : "0.0";
    } else {
        // 0 trabajos y 0 reviews = 0 valoración en esta categoría
        catRating = "0.0";
    }

    const categoryStats = {
        jobs: catOfferedCount,
        rating: catWonCount, // Usamos la misma variable para mantener compatibilidad en renderizado
        success: `${catSuccessRate}%`
    };

    if (!user) return null;

    const levelNames = { 1: 'ASPIRANTE', 2: 'VERIFICADO', 3: 'DESTACADO', 4: 'MAESTRO' };

    if (!isOwner) {
        return (
            <>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentPublic}>
                        <View style={styles.dragHandle} />

                        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                            <View style={styles.blueHeader}>
                                <View style={styles.headerTop}>
                                    <Text style={styles.headerTitle}>Perfil Profesional</Text>
                                    <TouchableOpacity onPress={onBack} style={styles.closeButton}>
                                        <Feather name="x" size={24} color="white" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.headerMain}>
                                    <View style={styles.avatarContainerPublic}>
                                        <Image source={{ uri: personalData.mainImage }} style={styles.avatarPublic} />
                                        <View style={styles.verifiedBadgePublic}>
                                            <Feather name="shield" size={12} color="white" />
                                        </View>
                                    </View>
                                    <View style={{ marginLeft: 20, flex: 1 }}>
                                        <Text style={styles.headerNamePublic} numberOfLines={1}>{profileData.name || 'Profesional'}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 4 }}>
                                            <TouchableOpacity 
                                                style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                                                onPress={() => setIsGamificationVisible(true)}
                                            >
                                                <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold', marginRight: 4 }}>NIVEL {levelNames[user?.gamification?.currentLevel || 1]}</Text>
                                                <Feather name="info" size={10} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.headerRatingPublic}>
                                            <FontAwesome5 name="star" solid size={14} color="#FBBF24" />
                                            <Text style={styles.headerRatingTextPublic}>{catReviews.length > 0 ? (catReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / catReviews.length).toFixed(1) : '0.0'} • {catReviews.length} reseñas</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.cardContainerPublic}>
                                {isCategoryActive ? (
                                    <>
                                        {/* ACTIVIDAD */}
                                        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 20 }}>{`CATEGORÍA (${selectedCategory?.name?.toUpperCase()})`}</Text>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                                                <View style={{ alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2563EB' }}>{categoryStats.jobs}</Text>
                                                    <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Cotizados</Text>
                                                </View>
                                                <View style={{ width: 1, height: 40, backgroundColor: '#F1F5F9' }} />
                                                <View style={{ alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2563EB' }}>{categoryStats.rating}</Text>
                                                    <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Ganados</Text>
                                                </View>
                                                <View style={{ width: 1, height: 40, backgroundColor: '#F1F5F9' }} />
                                                <View style={{ alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2563EB' }}>{categoryStats.success}</Text>
                                                    <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Éxito</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* BIO Y DETALLES */}
                                        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, marginHorizontal: -10 }}>
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 15 }}>INFORMACIÓN PROFESIONAL</Text>
                                            {currentCatProfile?.bio ? (
                                                <Text style={{ fontSize: 15, color: '#334155', fontStyle: 'italic', marginBottom: 16, lineHeight: 22 }}>"{currentCatProfile.bio}"</Text>
                                            ) : null}

                                            <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 22, marginTop: 4 }}>
                                                <Text style={{ fontWeight: 'bold', color: '#1E293B' }}>Especialista en: </Text>
                                                {currentCatProfile?.subcategories?.length ? currentCatProfile.subcategories.join(', ') : 'Servicios generales.'}
                                            </Text>

                                            <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 22, marginTop: 12 }}>
                                                <Text style={{ fontWeight: 'bold', color: '#1E293B' }}>Zonas de servicio: </Text>
                                                {currentCatProfile?.zones?.length ? currentCatProfile.zones.join(', ') : 'No especificadas.'}
                                            </Text>
                                        </View>

                                        {/* RESEÑAS PUBLICAS */}
                                        <View style={{ marginBottom: 25, marginHorizontal: -24 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 24 }}>
                                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Valoraciones Recibidas</Text>
                                            </View>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}>
                                                {catReviews && catReviews.length > 0 ? (
                                                    catReviews.map((r, i) => (
                                                        <View key={i} style={{ backgroundColor: 'white', padding: 16, borderRadius: 20, marginRight: 16, width: 160, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                                                {r.reviewer?.avatar ? (
                                                                    <Image source={{ uri: r.reviewer.avatar }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
                                                                ) : (
                                                                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                                                        <Feather name="user" size={16} color="#2563EB" />
                                                                    </View>
                                                                )}
                                                                <View style={{ flex: 1 }}>
                                                                    <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#1E293B' }} numberOfLines={1}>{r.reviewer?.name || 'Cliente'}</Text>
                                                                    <Text style={{ fontSize: 11, color: '#94A3B8' }} numberOfLines={1}>Hace poco</Text>
                                                                </View>
                                                            </View>
                                                            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                                                                {[...Array(5)].map((_, idx) => (
                                                                    <FontAwesome5 key={idx} name="star" solid={idx < (r.rating || 5)} size={10} color="#FBBF24" style={{ marginRight: 2 }} />
                                                                ))}
                                                            </View>
                                                            <Text style={{ fontSize: 13, color: '#4B5563', lineHeight: 18 }} numberOfLines={3}>"{r.comment || 'Buen trabajo.'}"</Text>
                                                        </View>
                                                    ))
                                                ) : (
                                                    <View style={{ alignItems: 'center', paddingVertical: 20, width: 200, paddingHorizontal: 10 }}>
                                                        <Feather name="message-square" size={32} color="#E2E8F0" />
                                                        <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 12 }}>No hay opiniones aún.</Text>
                                                    </View>
                                                )}
                                            </ScrollView>
                                        </View>

                                        <View style={{ marginBottom: 25, marginTop: 10, marginHorizontal: -24 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 24 }}>
                                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Portafolio de Trabajos</Text>
                                                <TouchableOpacity style={styles.arrowButton}>
                                                    <Feather name="arrow-right" size={14} color="#111827" />
                                                </TouchableOpacity>
                                            </View>
                                            {(() => {
                                                const portfolioFolders = [];
                                                const categoryFullName = selectedCategory?.fullName || selectedCategory?.name || '';
                                                const currentProfileGallery = currentCatProfile?.gallery || [];

                                                if (Array.isArray(jobsList)) {
                                                    jobsList.forEach(job => {
                                                        let isMatch = false;
                                                        const jobCat = typeof job.category === 'string' ? job.category : (job.category?.fullName || job.category?.name || job.category?._id || job.category?.id || '');
                                                        
                                                        const sCatFull = (selectedCategory?.fullName || '').toLowerCase();
                                                        const sCatName = (selectedCategory?.name || '').toLowerCase();
                                                        const sCatId = String(selectedCategory?.id || '').toLowerCase();
                                                        const sCat_Id = String(selectedCategory?._id || '').toLowerCase();
                                                        
                                                        const jcLower = String(jobCat).toLowerCase();
                                                        
                                                        if (jcLower && (jcLower === sCatFull || jcLower === sCatName || jcLower === sCatId || jcLower === sCat_Id || (sCatName && jcLower.includes(sCatName)))) {
                                                            isMatch = true;
                                                        }

                                                        if (isMatch) {
                                                            const jobImagesInPortfolio = [];
                                                            const jobMedia = [];
                                                            if (job.images) jobMedia.push(...job.images);
                                                            if (job.workPhotos) jobMedia.push(...job.workPhotos);
                                                            if (job.projectHistory) {
                                                                job.projectHistory.forEach(ev => { if (ev.mediaUrl) jobMedia.push(ev.mediaUrl); });
                                                            }
                                                            if (job.clientManagement?.beforePhotos) {
                                                                job.clientManagement.beforePhotos.forEach(p => { if (p.url) jobMedia.push(p.url); });
                                                            }
                                                            if (job.clientManagement?.payments) {
                                                                job.clientManagement.payments.forEach(p => { if (p.evidenceUrl) jobMedia.push(p.evidenceUrl); });
                                                            }
                                                            const uniqueJobMedia = [...new Set(jobMedia)];
                                                            // Mostrar imágenes de trabajos que el profesional se le hayan asignado
                                                            const status = getProStatus(job, user._id);
                                                            const isWon = ['GANADA', 'EN EJECUCIÓN', 'ACEPTADO', 'VALIDANDO', 'TERMINADO', 'VALORACIÓN', 'FINALIZADA'].includes(status);
                                                            
                                                            const currentProfileGallery = currentCatProfile?.gallery || [];
                                                            if (isWon) {
                                                                uniqueJobMedia.forEach(url => {
                                                                    if (currentProfileGallery.includes(url)) {
                                                                        jobImagesInPortfolio.push(url);
                                                                    }
                                                                });
                                                            }

                                                            if (jobImagesInPortfolio.length > 0) {
                                                                portfolioFolders.push({
                                                                    jobId: job._id || job.id,
                                                                    title: job.title || 'Trabajo completado',
                                                                    subcategories: [job.subCategory].filter(Boolean),
                                                                    images: jobImagesInPortfolio
                                                                });
                                                            }
                                                        }
                                                    });
                                                }

                                                if (portfolioFolders.length === 0) {
                                                    return (
                                                        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                                            <Feather name="folder" size={40} color="#E2E8F0" />
                                                            <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 15 }}>No hay trabajos en el portafolio.</Text>
                                                        </View>
                                                    );
                                                }

                                                return (
                                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24, paddingLeft: 24 }}>
                                                        {portfolioFolders.map((folder, index) => (
                                                            <TouchableOpacity key={index} style={styles.airbnbCard} onPress={() => setSelectedGallery(folder)}>
                                                                <Image source={{ uri: folder.images[0] }} style={styles.airbnbImage} resizeMode="cover" />
                                                                <View style={styles.airbnbInfo}>
                                                                    <Text style={styles.airbnbTitle} numberOfLines={1}>{folder.title}</Text>
                                                                    <Text style={styles.airbnbSubtitle} numberOfLines={1}>
                                                                        {folder.subcategories.length > 0 ? folder.subcategories.join(', ') : 'Servicios generales'}
                                                                    </Text>
                                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                                        <Feather name="image" size={12} color="#6B7280" />
                                                                        <Text style={styles.airbnbCount}>{folder.images.length} fotos</Text>
                                                                    </View>
                                                                </View>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                );
                                            })()}
                                        </View>
                                    </>
                                ) : (
                                    <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 40, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, alignItems: 'center', marginTop: 10 }}>
                                        <Feather name="clock" size={48} color="#94A3B8" />
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginTop: 15, textAlign: 'center' }}>Servicio Pausado</Text>
                                        <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8 }}>El profesional no está aceptando solicitudes para esta categoría actualmente.</Text>
                                    </View>
                                )}
                            </View>

                            {/* BOTÓN CERRAR FOOTER */}
                            <View style={{ paddingHorizontal: 20 }}>
                                <TouchableOpacity onPress={onBack} style={{ backgroundColor: '#F1F5F9', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 }}>
                                    <Text style={{ color: '#64748B', fontWeight: 'bold', fontSize: 15 }}>Cerrar Perfil</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View >
                </View >

                {/* GALLERY MODAL */}
                <Modal visible={!!selectedGallery} transparent={true} animationType="fade" onRequestClose={() => setSelectedGallery(null)}>
                    <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: 50 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B' }} numberOfLines={1}>{selectedGallery?.title || 'Fotos del Trabajo'}</Text>
                            <TouchableOpacity
                                style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20 }}
                                onPress={() => setSelectedGallery(null)}
                            >
                                <Feather name="x" size={24} color="#1E293B" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 15 }}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                {selectedGallery?.images?.map((img, i) => (
                                    <View key={i} style={{ width: '48%', marginBottom: 15, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' }}>
                                        <Image source={{ uri: img }} style={{ width: '100%', height: 150, resizeMode: 'cover' }} />
                                    </View>
                                ))}
                            </View>
                        </ScrollView>

                        <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: 'white' }}>
                            <TouchableOpacity
                                style={{ backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                                onPress={() => {
                                    const jobId = selectedGallery?.jobId;
                                    setSelectedGallery(null);
                                    if (jobId) {
                                        alert('Navegando a la Oferta: ' + jobId);
                                    } else {
                                        alert('No se pudo encontrar la oferta asociada.');
                                    }
                                }}
                            >
                                <Feather name="external-link" size={16} color="white" style={{ marginRight: 8 }} />
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Ir a la Oferta</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                <View style={[styles.blueHeader, { borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingBottom: 35 }]}>
                    <View style={[styles.headerTop, { paddingTop: Platform.OS === 'ios' ? 44 : 10, marginBottom: 5 }]}>
                        <Text style={styles.headerTitle}>Perfil Profesional</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity onPress={onLogout} style={[styles.logoutIconButtonHeader, { marginLeft: 10 }]}>
                                <Feather name="log-out" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.headerMain}>
                        <View style={styles.avatarContainerPublic}>
                            <TouchableOpacity onPress={pickMainImage}>
                                <Image source={{ uri: profileData.avatar || profileData.image }} style={styles.avatarPublic} />
                            </TouchableOpacity>
                            <View style={styles.verifiedBadgePublic}>
                                <Feather name="shield" size={12} color="white" />
                            </View>
                            <TouchableOpacity style={[styles.editBadge, { right: -5, bottom: -5, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', padding: 0 }]} onPress={pickMainImage}>
                                <Feather name="camera" size={12} color="white" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ marginLeft: 20, flex: 1, justifyContent: 'center' }}>
                            <Text style={styles.headerNamePublic} numberOfLines={1}>{profileData.name || 'Profesional'}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 4 }}>
                                <TouchableOpacity 
                                    style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                                    onPress={() => setIsGamificationVisible(true)}
                                >
                                    <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold', marginRight: 4 }}>NIVEL {levelNames[user?.gamification?.currentLevel || 1]}</Text>
                                    <Feather name="info" size={10} color="white" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.headerRatingPublic}>
                                <FontAwesome5 name="star" solid size={14} color="#FBBF24" />
                                <Text style={styles.headerRatingTextPublic}>{catReviews.length > 0 ? (catReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / catReviews.length).toFixed(1) : '0.0'} • {catReviews.length} reseñas</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* CONTENIDO PRINCIPAL (TARJETAS) */}
                <View style={styles.cardContainerPublic}>

                    {/* ACTIVIDAD (STATS) */}
                    {isCategoryActive && (
                        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 20 }}>{`CATEGORÍA (${selectedCategory?.name?.toUpperCase()})`}</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2563EB' }}>{categoryStats.jobs}</Text>
                                    <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Cotizados</Text>
                                </View>
                                <View style={{ width: 1, height: 40, backgroundColor: '#F1F5F9' }} />
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2563EB' }}>{categoryStats.rating}</Text>
                                    <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Ganados</Text>
                                </View>
                                <View style={{ width: 1, height: 40, backgroundColor: '#F1F5F9' }} />
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2563EB' }}>{categoryStats.success}</Text>
                                    <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Éxito</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* BOTONES DE CATEGORIAS */}
                    <View style={{ marginBottom: 4 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#64748B' }}>MIS SERVICIOS</Text>
                            <TouchableOpacity
                                onPress={() => setIsCategorySelectionVisible(true)}
                                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#DBEAFE' }}
                            >
                                <Feather name="settings" size={12} color="#2563EB" style={{ marginRight: 6 }} />
                                <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 12 }}>Configurar</Text>
                            </TouchableOpacity>
                        </View>

                        <ProCategorySelector
                            sortedCategories={sortedCategories}
                            profileData={profileData}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            ICON_MAP={ICON_MAP}
                            isOwner={isOwner}
                        />
                    </View>

                    {/* SECIONES CONDICIONADAS A CATEGORIA ACTIVA */}
                    {isCategoryActive && (
                        <>
                            {/* BIO Y DETALLES */}
                            <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, marginHorizontal: -10 }}>
                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 15 }}>INFORMACIÓN PROFESIONAL</Text>
                                {currentCatProfile?.bio ? (
                                    <Text style={{ fontSize: 15, color: '#334155', fontStyle: 'italic', marginBottom: 16, lineHeight: 22 }}>"{currentCatProfile.bio}"</Text>
                                ) : null}

                                <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 22, marginTop: 4 }}>
                                    <Text style={{ fontWeight: 'bold', color: '#1E293B' }}>Especialista en: </Text>
                                    {currentCatProfile?.subcategories?.length ? currentCatProfile.subcategories.join(', ') : 'Servicios generales.'}
                                </Text>

                                <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 22, marginTop: 12 }}>
                                    <Text style={{ fontWeight: 'bold', color: '#1E293B' }}>Zonas de servicio: </Text>
                                    {currentCatProfile?.zones?.length ? currentCatProfile.zones.join(', ') : 'No especificadas.'}
                                </Text>
                            </View>

                            {/* PORTAFOLIO DE TRABAJOS GLOBAL */}
                            <View style={{ marginBottom: 25, marginTop: 10, marginHorizontal: -24 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 24 }}>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Portafolio de Trabajos</Text>
                                    <TouchableOpacity style={styles.arrowButton}>
                                        <Feather name="arrow-right" size={14} color="#111827" />
                                    </TouchableOpacity>
                                </View>
                                {(() => {
                                    const portfolioFolders = [];
                                    const categoryFullName = selectedCategory?.fullName || selectedCategory?.name || '';
                                    const currentProfileGallery = currentCatProfile?.gallery || [];

                                    if (Array.isArray(jobsList)) {
                                        jobsList.forEach(job => {
                                            let isMatch = false;
                                            const jobCat = typeof job.category === 'string' ? job.category : (job.category?.fullName || job.category?.name || job.category?._id || job.category?.id || '');
                                            
                                            const sCatFull = (selectedCategory?.fullName || '').toLowerCase();
                                            const sCatName = (selectedCategory?.name || '').toLowerCase();
                                            const sCatId = String(selectedCategory?.id || '').toLowerCase();
                                            const sCat_Id = String(selectedCategory?._id || '').toLowerCase();
                                            
                                            const jcLower = String(jobCat).toLowerCase();
                                            
                                            if (jcLower && (jcLower === sCatFull || jcLower === sCatName || jcLower === sCatId || jcLower === sCat_Id || (sCatName && jcLower.includes(sCatName)))) {
                                                isMatch = true;
                                            }

                                            if (isMatch) {
                                                const jobImagesInPortfolio = [];
                                                const jobMedia = [];
                                                if (job.images) jobMedia.push(...job.images);
                                                if (job.workPhotos) jobMedia.push(...job.workPhotos);
                                                if (job.projectHistory) {
                                                    job.projectHistory.forEach(ev => { if (ev.mediaUrl) jobMedia.push(ev.mediaUrl); });
                                                }
                                                if (job.clientManagement?.beforePhotos) {
                                                    job.clientManagement.beforePhotos.forEach(p => { if (p.url) jobMedia.push(p.url); });
                                                }
                                                if (job.clientManagement?.payments) {
                                                    job.clientManagement.payments.forEach(p => { if (p.evidenceUrl) jobMedia.push(p.evidenceUrl); });
                                                }
                                                const uniqueJobMedia = [...new Set(jobMedia)];
                                                // Mostrar imágenes de trabajos que el profesional se le hayan asignado
                                                const status = getProStatus(job, user._id);
                                                const isWon = ['GANADA', 'EN EJECUCIÓN', 'ACEPTADO', 'VALIDANDO', 'TERMINADO', 'VALORACIÓN', 'FINALIZADA'].includes(status);
                                                
                                                const currentProfileGallery = currentCatProfile?.gallery || [];
                                                if (isWon) {
                                                    uniqueJobMedia.forEach(url => {
                                                        if (currentProfileGallery.includes(url)) {
                                                            jobImagesInPortfolio.push(url);
                                                        }
                                                    });
                                                }

                                                if (jobImagesInPortfolio.length > 0) {
                                                    portfolioFolders.push({
                                                        jobId: job._id || job.id,
                                                        title: job.title || 'Trabajo completado',
                                                        subcategories: [job.subCategory].filter(Boolean),
                                                        images: jobImagesInPortfolio
                                                    });
                                                }
                                            }
                                        });
                                    }

                                    if (portfolioFolders.length === 0) {
                                        return (
                                            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                                <Feather name="folder" size={40} color="#E2E8F0" />
                                                <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 15 }}>No hay trabajos en el portafolio.</Text>
                                            </View>
                                        );
                                    }

                                    return (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24, paddingLeft: 24 }}>
                                            {portfolioFolders.map((folder, index) => (
                                                <TouchableOpacity key={index} style={styles.airbnbCard} onPress={() => setSelectedGallery(folder)}>
                                                    <Image source={{ uri: folder.images[0] }} style={styles.airbnbImage} resizeMode="cover" />
                                                    <View style={styles.airbnbInfo}>
                                                        <Text style={styles.airbnbTitle} numberOfLines={1}>{folder.title}</Text>
                                                        <Text style={styles.airbnbSubtitle} numberOfLines={1}>
                                                            {folder.subcategories.length > 0 ? folder.subcategories.join(', ') : 'Servicios generales'}
                                                        </Text>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                            <Feather name="image" size={12} color="#6B7280" />
                                                            <Text style={styles.airbnbCount}>{folder.images.length} fotos</Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    );
                                })()}
                            </View>

                            {/* RESEÑAS PRIVADAS */}
                            <View style={{ marginBottom: 25, marginHorizontal: -24 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 24 }}>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Valoraciones Recibidas</Text>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}>
                                    {catReviews && catReviews.length > 0 ? (
                                        catReviews.map((r, i) => (
                                            <View key={i} style={{ backgroundColor: 'white', padding: 16, borderRadius: 20, marginRight: 16, width: 160, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                                    {r.reviewer?.avatar ? (
                                                        <Image source={{ uri: r.reviewer.avatar }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
                                                    ) : (
                                                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                                            <Feather name="user" size={16} color="#2563EB" />
                                                        </View>
                                                    )}
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#1E293B' }} numberOfLines={1}>{r.reviewer?.name || 'Cliente'}</Text>
                                                        <Text style={{ fontSize: 11, color: '#94A3B8' }} numberOfLines={1}>Hace poco</Text>
                                                    </View>
                                                </View>
                                                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                                                    {[...Array(5)].map((_, idx) => (
                                                        <FontAwesome5 key={idx} name="star" solid={idx < (r.rating || 5)} size={10} color="#FBBF24" style={{ marginRight: 2 }} />
                                                    ))}
                                                </View>
                                                <Text style={{ fontSize: 13, color: '#4B5563', lineHeight: 18 }} numberOfLines={3}>"{r.comment || 'Buen trabajo.'}"</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <View style={{ alignItems: 'center', paddingVertical: 20, width: 200, paddingHorizontal: 10 }}>
                                            <Feather name="message-square" size={32} color="#E2E8F0" />
                                            <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 12 }}>No hay opiniones aún.</Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </View>
                        </>
                    )}
                </View>

                {isOwner && (
                    <ProAccountSettings
                        startEditingPersonal={startEditingPersonal}
                        handleResetApplicationData={handleResetApplicationData}
                        onSwitchMode={onSwitchMode}
                        onOpenSubscriptions={() => setIsSubscriptionsVisible(true)}
                    />
                )}

                {/* MODAL: SUBSCRIPCIONES */}
                <ProSubscriptionModal
                    visible={isSubscriptionsVisible}
                    onClose={() => setIsSubscriptionsVisible(false)}
                    user={user}
                />

                {/* MODAL: GAMIFICACIÓN Y NIVELES */}
                <ProGamificationModal
                    visible={isGamificationVisible}
                    onClose={() => setIsGamificationVisible(false)}
                    user={user}
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

            {/* TEXT & GALLERY MODAL OWNER */}
            <Modal visible={!!selectedGallery} transparent={true} animationType="fade" onRequestClose={() => setSelectedGallery(null)}>
                <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: 50 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B' }} numberOfLines={1}>{selectedGallery?.title || 'Fotos del Trabajo'}</Text>
                        <TouchableOpacity
                            style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20 }}
                            onPress={() => setSelectedGallery(null)}
                        >
                            <Feather name="x" size={24} color="#1E293B" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 15 }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            {selectedGallery?.images?.map((img, i) => (
                                <View key={i} style={{ width: '48%', marginBottom: 15, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' }}>
                                    <Image source={{ uri: img }} style={{ width: '100%', height: 150, resizeMode: 'cover' }} />
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: 'white' }}>
                        <TouchableOpacity
                            style={{ backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                            onPress={() => {
                                const jobId = selectedGallery?.jobId;
                                setSelectedGallery(null);
                                if (jobId) {
                                    alert('Navegando a la Oferta: ' + jobId);
                                } else {
                                    alert('No se pudo encontrar la oferta asociada.');
                                }
                            }}
                        >
                            <Feather name="external-link" size={16} color="white" style={{ marginRight: 8 }} />
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Ir a la Oferta</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    },
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
    arrowButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' },
            default: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }
        })
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContentPublic: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 36, borderTopRightRadius: 36, height: '92%', width: '100%', overflow: 'hidden' },
    dragHandle: { width: 40, height: 5, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, alignSelf: 'center', marginTop: 10, position: 'absolute', zIndex: 10 },
    blueHeader: { backgroundColor: '#2563EB', paddingTop: Platform.OS === 'ios' ? 44 : 5, paddingBottom: 25, paddingHorizontal: 24, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 0 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    logoutIconButtonHeader: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerMain: { flexDirection: 'row', alignItems: 'center' },
    avatarContainerPublic: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', padding: 3, elevation: 5, position: 'relative' },
    avatarPublic: { width: '100%', height: '100%', borderRadius: 37 },
    verifiedBadgePublic: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#10B981', width: 24, height: 24, borderRadius: 12, borderWidth: 3, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
    headerNamePublic: { fontSize: 22, fontWeight: 'bold', color: 'white' },
    headerRatingPublic: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    headerRatingTextPublic: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginLeft: 8 },
    cardContainerPublic: { paddingHorizontal: 20, marginTop: -20 }
});
