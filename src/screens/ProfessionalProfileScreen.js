import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    PanResponder,
    Animated,
    useWindowDimensions
} from 'react-native';
import {
    ProAccountSettings,
    ProCategorySelector
} from '../components/profile/ProProfileComponents';
import ProfessionalProfileView from '../components/profile/ProfessionalProfileView';
import { ProSubscriptionModal } from '../components/profile/ProSubscriptionModal';
import { ProGamificationModal } from '../components/profile/ProGamificationModal';
import { ProCategorySelectionModal, ProPersonalEditModal, ProProfileEditModal, ProThemeSelectorModal } from '../components/profile/ProProfileModals';
import { ProVerificationModal } from '../components/profile/ProVerificationModal';
import NotificationPreferencesModal from '../components/NotificationPreferencesModal';
import CrossProfileNotificationModal from '../components/CrossProfileNotificationModal';
import { api, API_URL } from '../utils/api';
import { getProStatus } from '../utils/helpers';
import { compressAvatar, compressImage } from '../utils/imageCompressor';
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
    onViewImage,
    requestedCategoryName,
    otherModeCount
}) {
    const insets = useSafeAreaInsets();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const [isPagerScrollEnabled, setIsPagerScrollEnabled] = useState(true);
    const [isEditing, setIsEditing] = useState(false); // Professional Profile Editing
    const [isCategorySelectionVisible, setIsCategorySelectionVisible] = useState(false); // Category Selection Modal
    const [isEditingPersonal, setIsEditingPersonal] = useState(false); // Personal Data Editing
    const [isSubscriptionsVisible, setIsSubscriptionsVisible] = useState(false); // Subscriptions Modal
    const [isGamificationVisible, setIsGamificationVisible] = useState(false); // Gamification Modal
    const [isVerificationVisible, setIsVerificationVisible] = useState(false); // Verification Modal
    const [isPreviewMode, setIsPreviewMode] = useState(false); // Preview Public View
    const [showNotifications, setShowNotifications] = useState(false); // Notification Preferences
    const [personalData, setPersonalData] = useState({}); // Temp state for personal data editing
    const [reviews, setReviews] = useState([]);
    const [selectedGallery, setSelectedGallery] = useState(null);

    const getProfile = (key) => {
        if (!profileData || !profileData.profiles) return null;
        if (profileData.profiles instanceof Map) return profileData.profiles.get(key);
        return profileData.profiles[key];
    };

    const getProfileKeys = () => {
        if (!profileData || !profileData.profiles) return [];
        if (profileData.profiles instanceof Map) return Array.from(profileData.profiles.keys());
        return Object.keys(profileData.profiles);
    };

    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [isOrderingGallery, setIsOrderingGallery] = useState(false);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [showCrossPopup, setShowCrossPopup] = useState(true);
    const [pagerWidth, setPagerWidth] = useState(SCREEN_WIDTH);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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
            setIsLoadingProfile(true);
            try {
                // Execute network requests independently so one failure doesn't break both
                let reviewsData = [];
                try {
                    reviewsData = await api.getProfessionalReviews(user._id);
                } catch (e) {
                    console.error("Error fetching pro reviews:", e);
                }
                setReviews(reviewsData || []);

                let allJobs = [];
                try {
                    if (isOwner) {
                        allJobs = await api.getMyJobs({ role: 'pro', include_media: 'true' });
                    } else {
                        allJobs = await api.getJobs({ professional: user._id, include_media: 'true' });
                    }
                } catch (e) {
                    console.error("Error fetching pro jobs:", e);
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
            } finally {
                setIsLoadingProfile(false);
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
        if (isOwner) return; // Owners can view inactive categories to activate them

        const currentKey = selectedCategory.fullName || selectedCategory.name;
        const hasProfile = getProfile(currentKey);
        const isActive = hasProfile && hasProfile.isActive !== false;

        if (!isActive || !hasProfile) {
            const firstActiveKey = getProfileKeys().find(k => {
                const p = getProfile(k);
                return p && p.isActive !== false;
            });
            if (firstActiveKey) {
                const found = categories.find(c => (c.fullName || c.name) === firstActiveKey);
                if (found) setSelectedCategory(found);
            }
        }
    }, [profileData.profiles, isOwner]);

    // Helper: Obtener perfil de la categoría actual
    const realProfile = getProfile(categoryKey);
    const currentCatProfile = realProfile || { bio: '', subcategories: [], gallery: [], zones: [] };
    const activeColor = currentCatProfile?.profileColor || '#2563EB';
    const isCategoryActive = !!realProfile && realProfile.isActive !== false;

    // --- ORDENAMIENTO DE CATEGORÍAS (Activas primero) ---
    const scrollRef = useRef(null);

    // --- CATEGORY INDICATOR ANIMATION ---
    const categoryFadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!selectedCategory) return;
        
        categoryFadeAnim.stopAnimation();
        categoryFadeAnim.setValue(1);
        
        const timer = setTimeout(() => {
            Animated.timing(categoryFadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true
            }).start();
        }, 1500);
        
        return () => clearTimeout(timer);
    }, [selectedCategory]);
    // -----------------------------------


    const sortedCategories = [...categories].sort((a, b) => {
        const keyA = a.fullName || a.name;
        const keyB = b.fullName || b.name;
        const activeA = !!getProfile(keyA);
        const activeB = !!getProfile(keyB);
        if (activeA && !activeB) return -1;
        if (!activeA && activeB) return 1;
        return 0;
    });

    // --- ACCIONES ---
    
    
    // --- SWIPE PARA CAMBIAR CATEGORÍA ---
    const activeCategories = isOwner ? sortedCategories : sortedCategories.filter(cat => {
        const key = cat.fullName || cat.name;
        const selectedKey = selectedCategory?.fullName || selectedCategory?.name || selectedCategory;
        return key === selectedKey;
    });

    useEffect(() => {
        if (scrollRef.current && activeCategories.length > 0) {
            const index = activeCategories.findIndex(c => (c.fullName || c.name) === (selectedCategory?.fullName || selectedCategory?.name || selectedCategory));
            if (index !== -1) {
                setTimeout(() => {
                    scrollRef.current?.scrollTo({ x: index * pagerWidth, animated: false });
                }, 50);
            }
        }
    }, [selectedCategory, activeCategories.length, pagerWidth]);


    

const handleMoveImage = (index, direction) => {
        if (!selectedGallery || !selectedGallery.images) return;
        const newImages = [...selectedGallery.images];
        if (direction === 'left' && index > 0) {
            [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
        } else if (direction === 'right' && index < newImages.length - 1) {
            [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
        }
        setSelectedGallery({ ...selectedGallery, images: newImages });
    };

    const saveGalleryOrder = async () => {
        if (!selectedGallery || !selectedGallery.jobId) return;
        setIsSavingOrder(true);
        try {
            await api.updatePortfolioOrder(selectedGallery.jobId, selectedGallery.images);
            Alert.alert("Éxito", "El orden de la portada ha sido actualizado.");
            setIsOrderingGallery(false);
            if (onUpdate) onUpdate(user); // Triggers re-fetch of data
        } catch (error) {
            console.error("Error saving gallery order:", error);
            Alert.alert("Error", "No se pudo guardar el orden.");
        } finally {
            setIsSavingOrder(false);
        }
    };

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

    const getAvatarUri = () => {
        const img = profileData.avatar || profileData.image;
        if (img && typeof img === 'string' && img !== 'null') {
            if (img.startsWith('http') || img.startsWith('file://') || img.startsWith('data:')) return img;
            const baseUrl = API_URL.replace('/api', '');
            const cleanPath = img.startsWith('/') ? img.substring(1) : img;
            return `${baseUrl}/${cleanPath}`;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'Pro')}&background=random`;
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
        const jCat = (typeof j.category === 'object') ? (j.category?.name || j.category?.fullName) : j.category;
        if (!jCat) return false; // Strict matching: If no category, it shouldn't match.
        
        const sCatFull = (selectedCategory?.fullName || '').toLowerCase();
        const sCatName = (selectedCategory?.name || '').toLowerCase();
        const jCatLower = String(jCat).toLowerCase();
        
        return jCatLower === sCatFull || jCatLower === sCatName;
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
        let revCat = null;
        if (rev.jobCategory) {
            revCat = typeof rev.jobCategory === 'object' ? (rev.jobCategory.name || rev.jobCategory.fullName) : rev.jobCategory;
        } else if (rev.job && rev.job.category) {
            revCat = typeof rev.job.category === 'object' ? (rev.job.category.name || rev.job.category.fullName) : rev.job.category;
        }
        
        if (!revCat) return false; // Strict matching
        
        const sCatFull = (selectedCategory?.fullName || '').toLowerCase();
        const sCatName = (selectedCategory?.name || '').toLowerCase();
        const rCatLower = String(revCat).toLowerCase();
        
        return rCatLower === sCatFull || rCatLower === sCatName;
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

    // COMBINED HISTORY CALCULATION (Jobs + Reviews)
    const combinedHistory = [];
    if (filteredJobs && filteredJobs.length > 0) {
        const completedJobs = filteredJobs.filter(job => {
            const status = getProStatus(job, user._id);
            const isWon = ['GANADA', 'EN EJECUCIÓN', 'ACEPTADO', 'VALIDANDO', 'TERMINADO', 'VALORACIÓN', 'FINALIZADA'].includes(status);
            const completedStatuses = ['Finalizada', 'Cerrado', 'Cerrada', 'TERMINADO', 'rated', 'completed', 'Culminada', 'VALORACIÓN'];
            return isWon && (completedStatuses.includes(job.status) || job.proFinished || job.clientFinished || job.rating > 0 || job.proRated || job.clientRated);
        });

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

            const myPortfolio = user.profiles?.[categoryKey]?.timelinePortfolio || [];
            jobImages = jobImages.filter(img => myPortfolio.includes(img));

            const review = catReviews.find(r => r.job?._id === job._id || r.job === job._id);

            combinedHistory.push({
                jobId: job._id || job.id,
                title: job.title || 'Trabajo completado',
                date: job.createdAt,
                images: jobImages,
                review: review
            });
        });
    }

    catReviews.forEach(rev => {
        const jobId = rev.job?._id || rev.job;
        if (!combinedHistory.some(ch => ch.jobId === jobId)) {
            let revImages = [];
            if (rev.job?.images && Array.isArray(rev.job.images)) rev.job.images.forEach(img => { if (img && !revImages.includes(img)) revImages.push(img); });
            if (rev.job?.workPhotos && Array.isArray(rev.job.workPhotos)) rev.job.workPhotos.forEach(img => { if (img && !revImages.includes(img)) revImages.push(img); });
            if (rev.job?.projectHistory && Array.isArray(rev.job?.projectHistory)) {
                rev.job.projectHistory.forEach(hi => { if (hi && !hi.isPrivate && hi.mediaUrl && !revImages.includes(hi.mediaUrl)) revImages.push(hi.mediaUrl); });
            }

            if (rev.job?.portfolioOrder && Array.isArray(rev.job?.portfolioOrder) && rev.job?.portfolioOrder.length > 0) {
                const ordered = [];
                rev.job.portfolioOrder.forEach(img => {
                    if (revImages.includes(img)) ordered.push(img);
                });
                revImages.forEach(img => {
                    if (!ordered.includes(img)) ordered.push(img);
                });
                revImages = ordered;
            }

            const myPortfolio = user.profiles?.[categoryKey]?.timelinePortfolio || [];
            revImages = revImages.filter(img => myPortfolio.includes(img));

            combinedHistory.push({
                jobId: jobId,
                title: rev.job?.title || 'Trabajo valorado',
                date: rev.createdAt || new Date().toISOString(),
                images: revImages,
                review: rev
            });
        }
    });

    combinedHistory.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const categoryStats = {
        jobs: catOfferedCount,
        rating: catWonCount, // Usamos la misma variable para mantener compatibilidad en renderizado
        success: `${catSuccessRate}%`
    };

    if (!user) return null;

    const levelNames = { 1: 'ASPIRANTE', 2: 'VERIFICADO', 3: 'DESTACADO', 4: 'MAESTRO' };

    return (
        <>
            
        <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            scrollEnabled={isPagerScrollEnabled}
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1, backgroundColor: '#F8FAFC' }}
            onLayout={(e) => {
                if (e.nativeEvent.layout.width > 0) {
                    setPagerWidth(e.nativeEvent.layout.width);
                }
            }}
            onMomentumScrollEnd={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / pagerWidth);
                if (activeCategories[index]) {
                    setSelectedCategory(activeCategories[index]);
                }
            }}
        >
            {activeCategories.length > 0 ? activeCategories.map((cat, index) => {
                const catKey = cat.fullName || cat.name;
                const catRealProfile = getProfile(catKey);
                const catCurrentProfile = catRealProfile || { bio: '', subcategories: [], gallery: [], zones: [] };
                const catActiveColor = catCurrentProfile?.profileColor || '#2563EB';
                const catActiveTheme = catCurrentProfile?.profileTheme || profileData.profileTheme || 'social';
                const currentCatReviews = (reviews || []).filter(rev => {
                    let revCat = null;
                    if (rev.jobCategory) {
                        revCat = typeof rev.jobCategory === 'object' ? (rev.jobCategory.name || rev.jobCategory.fullName) : rev.jobCategory;
                    } else if (rev.job && rev.job.category) {
                        revCat = typeof rev.job.category === 'object' ? (rev.job.category.name || rev.job.category.fullName) : rev.job.category;
                    }
                    if (!revCat) return catKey === 'General';
                    return String(revCat).toLowerCase() === String(catKey).toLowerCase();
                });
                
                const hasContent = catRealProfile && (!!catRealProfile.bio || (catRealProfile.subcategories && catRealProfile.subcategories.length > 0) || (catRealProfile.gallery && catRealProfile.gallery.length > 0));
                const categoryIsActive = !!catRealProfile && (catCurrentProfile?.isActive === true || (catCurrentProfile?.isActive !== false && hasContent));

                console.log("RENDER CATEGORY", catKey, { isCategoryActive: categoryIsActive, hasContent, catRealProfile });

                return (
                    <View style={{ width: pagerWidth, flex: 1 }} key={catKey}>
                        <ProfessionalProfileView
                            user={user}
                            profileData={{ ...profileData, ...catCurrentProfile }}
                            categoryKey={catKey}
                            isOwner={isOwner}
                            isPreviewMode={isPreviewMode}
                            activeTheme={catActiveTheme}
                            activeColor={catActiveColor}
                            catReviews={currentCatReviews}
                            categoryStats={categoryStats}
                            combinedHistory={combinedHistory}
                            isLoadingProfile={isLoadingProfile}
                            isCategoryActive={categoryIsActive}
                            isCategoryUncreated={!hasContent}
                            onActivateCategory={toggleCategoryActivation}
                            setOuterScrollEnabled={setIsPagerScrollEnabled}
                            topInset={insets.top}
                            onViewImage={onViewImage}
                            onViewGallery={setSelectedGallery}
                            onContact={() => {}}
                            
                            onClose={onBack}
                            onChangeCategory={() => setIsCategorySelectionVisible(true)}
                            onEditProfile={() => {
                                setIsEditing(true);
                                setIsPreviewMode(false);
                            }}
                            onGamification={() => setIsGamificationVisible(true)}
                        >
                            {isOwner && !isPreviewMode && (
                                <ProAccountSettings
                                    startEditingPersonal={startEditingPersonal}
                                    handleResetApplicationData={handleResetApplicationData}
                                    onSwitchMode={onSwitchMode}
                                    onOpenSubscriptions={() => setIsSubscriptionsVisible(true)}
                                    onOpenVerification={() => setIsVerificationVisible(true)}
                                    onOpenNotifications={() => setShowNotifications(true)}
                                    onOpenPreview={() => setIsPreviewMode(true)}
                                    otherModeCount={otherModeCount}
                                    user={user}
                                />
                            )}
                        </ProfessionalProfileView>
                    </View>
                );
            }) : (
                <View style={{ width: SCREEN_WIDTH, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Feather name="alert-circle" size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
                    <Text style={{ color: '#64748B' }}>No tienes categorías activas.</Text>
                </View>
            )}
        </ScrollView>

            {/* FADING CATEGORY INDICATOR (FULL SCREEN DIMMER) */}
            {(() => {
                const sCatName = selectedCategory?.fullName || selectedCategory?.name || 'Categoría';
                const sProfile = getProfile(sCatName);
                const sColor = sProfile?.profileColor || '#2563EB';
                const sIcon = ICON_MAP[sCatName] || 'box';
                if (!isOwner) return null;
                return (
                    <Animated.View style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        opacity: categoryFadeAnim,
                        zIndex: 100,
                        elevation: 10,
                        pointerEvents: 'none',
                    }}>
                        <View style={{
                            backgroundColor: sColor,
                            paddingHorizontal: 40,
                            paddingVertical: 25,
                            borderRadius: 24,
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.5,
                            shadowRadius: 10,
                        }}>
                            <Feather name={sIcon} size={54} color="white" style={{ marginBottom: 12 }} />
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 28, textAlign: 'center' }}>
                                {sCatName}
                            </Text>
                        </View>
                    </Animated.View>
                );
            })()}


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

                {/* MODAL: VERIFICACIÓN DE PERFIL */}
                <ProVerificationModal
                    visible={isVerificationVisible}
                    onClose={() => setIsVerificationVisible(false)}
                    user={user}
                    onUpdate={onUpdate}
                />

                {/* MODAL 1: SELECTOR DE CATEGORÍAS REDISEÑADO */}
                <ProCategorySelectionModal
                    visible={isCategorySelectionVisible}
                    onClose={() => setIsCategorySelectionVisible(false)}
                    categories={categories}
                    profileData={profileData}
                    ICON_MAP={ICON_MAP}
                    setSelectedCategory={setSelectedCategory}
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
                    combinedHistory={combinedHistory}
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

                <NotificationPreferencesModal 
                    visible={showNotifications} 
                    onClose={() => setShowNotifications(false)} 
                    user={user}
                    onUpdate={onUpdate}
                    mode="pro"
                />

            <CrossProfileNotificationModal
                visible={showCrossPopup}
                onClose={() => setShowCrossPopup(false)}
                onSwitchMode={onSwitchMode}
                otherModeCount={otherModeCount}
                targetMode="client"
            />

            {/* TEXT & GALLERY MODAL OWNER */}
            <Modal visible={!!selectedGallery && selectedImageIndex === null} transparent={true} animationType="fade" onRequestClose={() => setSelectedGallery(null)}>
                <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: 50 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B' }} numberOfLines={1}>{selectedGallery?.title || 'Fotos del Trabajo'}</Text>
                            {selectedGallery?.rating && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#64748B', marginRight: 4 }}>Valoración: {selectedGallery.rating.toFixed(1)}</Text>
                                    <FontAwesome5 name="star" solid size={12} color="#FBBF24" />
                                </View>
                            )}
                        </View>
                        {isOwner && selectedGallery?.jobId && (
                            <TouchableOpacity
                                style={{ backgroundColor: isOrderingGallery ? '#10B981' : '#EFF6FF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, opacity: isSavingOrder ? 0.5 : 1 }}
                                disabled={isSavingOrder}
                                onPress={() => {
                                    if (isOrderingGallery) {
                                        saveGalleryOrder();
                                    } else {
                                        setIsOrderingGallery(true);
                                    }
                                }}
                            >
                                <Text style={{ color: isOrderingGallery ? 'white' : '#2563EB', fontWeight: 'bold', fontSize: 13 }}>
                                    {isSavingOrder ? 'Guardando...' : (isOrderingGallery ? 'Guardar' : 'Ordenar')}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20 }}
                            onPress={() => { setIsOrderingGallery(false); setSelectedGallery(null); }}
                        >
                            <Feather name="x" size={24} color="#1E293B" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={selectedGallery?.images || []}
                        keyExtractor={(item, index) => index.toString()}
                        numColumns={2}
                        contentContainerStyle={{ padding: 15 }}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        renderItem={({ item: img, index: i }) => (
                            <TouchableOpacity 
                                style={{ width: '48%', marginBottom: 15, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: i === 0 && isOrderingGallery ? '#10B981' : '#E2E8F0', opacity: isOrderingGallery ? 1 : 1 }}
                                onPress={() => { if (!isOrderingGallery) setSelectedImageIndex(i); }}
                                activeOpacity={isOrderingGallery ? 1 : 0.7}
                            >
                                <ExpoImage source={{ uri: img }} style={{ width: '100%', height: 150, resizeMode: 'cover' }} />
                                {isOrderingGallery && (
                                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 }}>
                                        {i > 0 ? (
                                            <TouchableOpacity onPress={() => handleMoveImage(i, 'left')} style={{ backgroundColor: 'white', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' }}>
                                                <Feather name="chevron-left" size={20} color="#1E293B" />
                                            </TouchableOpacity>
                                        ) : <View style={{ width: 30 }} />}
                                        {i < (selectedGallery?.images?.length || 0) - 1 ? (
                                            <TouchableOpacity onPress={() => handleMoveImage(i, 'right')} style={{ backgroundColor: 'white', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' }}>
                                                <Feather name="chevron-right" size={20} color="#1E293B" />
                                            </TouchableOpacity>
                                        ) : <View style={{ width: 30 }} />}
                                    </View>
                                )}
                                {i === 0 && (
                                    <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>PORTADA</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>

            {/* FULLSCREEN IMAGE MODAL (PRIVATE VIEW) */}
            <Modal visible={selectedImageIndex !== null} transparent={true} animationType="fade" onRequestClose={() => setSelectedImageIndex(null)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 }}
                        onPress={() => setSelectedImageIndex(null)}
                    >
                        <Feather name="x" size={30} color="white" />
                    </TouchableOpacity>
                    {selectedImageIndex !== null && (
                        <FlatList
                            data={selectedGallery?.images || []}
                            keyExtractor={(item, index) => index.toString()}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            initialScrollIndex={selectedImageIndex}
                            getItemLayout={(data, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
                            renderItem={({ item }) => (
                                <View style={{ width: SCREEN_WIDTH, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                    <ExpoImage source={{ uri: item }} style={{ width: '100%', height: '80%', resizeMode: 'contain' }} />
                                </View>
                            )}
                        />
                    )}
                </View>
            </Modal>
        </>
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
        backgroundColor: '#F1F5F9',
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
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    chipSelected: {
        backgroundColor: '#F1F5F9',
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
        backgroundColor: '#F1F5F9',
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
        backgroundColor: '#F1F5F9',
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
//     modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContentPublic: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 36, borderTopRightRadius: 36, height: '92%', width: '100%', overflow: 'hidden' },
    dragHandle: { width: 40, height: 5, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, alignSelf: 'center', marginTop: 10, position: 'absolute', zIndex: 10 },
    blueHeader: { backgroundColor: '#2563EB', paddingTop: Platform.OS === 'ios' ? 44 : 5, paddingBottom: 25, paddingHorizontal: 24, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
//     headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 0 },
//     headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
//     logoutIconButtonHeader: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
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
