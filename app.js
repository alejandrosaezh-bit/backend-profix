
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications'; // Import Notifications
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    KeyboardAvoidingView,
    LogBox,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// --- IMPORTS DE UTILIDADES ---
// V13 Update
import BottomNav from './src/components/BottomNav';
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import { SocketProvider, useSocket } from './src/context/SocketContext'; // Updated Socket Import
import AdminScreens from './src/screens/AdminScreens';
import BlogPostScreen from './src/screens/BlogPostScreen';
import CategoryDetailScreen from './src/screens/CategoryDetailScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import ClientProfileScreen from './src/screens/ClientProfileScreen';
import ClientProfileView from './src/screens/ClientProfileView';
import CreateQuoteScreen from './src/screens/CreateQuoteScreen';
import LoginScreen from './src/screens/LoginScreen';
import MyRequestsScreen from './src/screens/MyRequestsScreen';
import ProfessionalProfileScreen from './src/screens/ProfessionalProfileScreen';
import ProHomeScreen from './src/screens/ProHomeScreen';
import SubcategoryDetailScreen from './src/screens/SubcategoryDetailScreen';
import { api } from './src/utils/api';
import * as AuthLocal from './src/utils/auth_local';
import { saveSession } from './src/utils/session';

import BudgetPopup from './src/components/BudgetPopup';
import { SectionDivider } from './src/components/Dividers';
import Header from './src/components/Header';
import { HOME_COPY_OPTIONS, LOCATIONS_DATA } from './src/constants/data';
import styles from './src/styles/globalStyles';
import { areIdsEqual, getClientStatus, getProStatus, getProStatusColor, showAlert } from './src/utils/helpers';

// Ignorar advertencias específicas de deprecación de react-native-web en el navegador
LogBox.ignoreLogs([
    'expo-notifications:',
    'props.pointerEvents is deprecated',
    'props.pointerEvents is deprecated. Use style.pointerEvents',
    'Animated: `useNativeDriver` is not supported',
    '"shadow*" style props are deprecated',
    'Image: style.resizeMode is deprecated'
]);

// Fallback para Web: interceptar console.warn para mensajes persistentes de librerías
if (Platform.OS === 'web') {
    const originalWarn = console.warn;
    console.warn = (...args) => {
        if (typeof args[0] === 'string' && (
            args[0].includes('props.pointerEvents') ||
            args[0].includes('expo-notifications') ||
            args[0].includes('useNativeDriver') ||
            args[0].includes('shadow') ||
            args[0].includes('resizeMode')
        )) {
            return;
        }
        originalWarn(...args);
    };
}

// --- CONFIGURACIÓN DE NOTIFICACIONES (FOREGROUND) ---
if (Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
}

const { checkCredentials, getUser, registerUser } = AuthLocal;

import { ICON_MAP, IconAuto, IconBeauty, IconEvents, IconHogar, IconLegal, IconPets, IconSalud, IconTech } from './src/constants/icons';

const mapCategoryToDisplay = (cat) => ({
    id: cat._id,
    name: cat.name,
    fullName: cat.name,
    icon: ICON_MAP[cat.icon] || ICON_MAP['default'],
    color: cat.color || '#FFF7ED',
    iconColor: '#EA580C',
    subcategories: cat.subcategories || []
});

// Status helpers are imported from src/utils/helpers

// --- 1. DATOS (MOCK DATA) ---
const CATEGORIES_DISPLAY = [
    { id: 'hogar', name: 'Hogar', fullName: "Hogar", icon: IconHogar, color: '#FFF7ED', iconColor: '#EA580C' },
    { id: 'auto', name: 'Autos', fullName: "Automotriz", icon: IconAuto, color: '#EFF6FF', iconColor: '#2563EB' },
    { id: 'salud', name: 'Salud', fullName: "Salud y Bienestar", icon: IconSalud, color: '#FFF7ED', iconColor: '#EA580C' },
    { id: 'tech', name: 'Tech', fullName: "Tecnología", icon: IconTech, color: '#EFF6FF', iconColor: '#2563EB' },
    { id: 'beauty', name: 'Belleza', fullName: "Belleza y Estética", icon: IconBeauty, color: '#FFF7ED', iconColor: '#EA580C' },
    { id: 'events', name: 'Eventos', fullName: "Eventos", icon: IconEvents, color: '#EFF6FF', iconColor: '#2563EB' },
    { id: 'pets', name: 'Mascotas', fullName: "Mascotas", icon: IconPets, color: '#FFF7ED', iconColor: '#EA580C' },
    { id: 'legal', name: 'Legal', fullName: "Legal y Trámites", icon: IconLegal, color: '#EFF6FF', iconColor: '#2563EB' },
];

// Data constants are now imported from src/constants/data.js

// --- 2. COMPONENTES AUXILIARES ---

// showAlert and showConfirmation are imported from src/utils/helpers

// SectionDivider and HandDrawnDivider imported from src/components/Dividers// HOME_COPY_OPTIONS and ROTATION_KEY are now imported from src/constants/data.js
import { HomeSections, UrgencyBanner } from './src/components/HomeComponents';
import { useAppData } from './src/hooks/useAppData';


import CloseRequestModal from './src/screens/CloseRequestModal';
import JobDetailPro from './src/screens/JobDetailPro';
import RequestDetailClient from './src/screens/RequestDetailClient';
import ServiceForm from './src/screens/ServiceForm';

// --- 6. APP PRINCIPAL (CONTENEDOR) ---

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Se produjo un error</Text>
                    <Text style={{ marginBottom: 10 }}>{String(this.state.error)}</Text>
                    <TouchableOpacity
                        onPress={() => {
                            if (typeof DevSettings !== 'undefined' && DevSettings.reload) {
                                DevSettings.reload();
                            } else if (typeof window !== 'undefined' && window.location) {
                                window.location.reload();
                            }
                        }}
                        style={{ backgroundColor: '#2563EB', padding: 10, borderRadius: 8 }}
                    >
                        <Text style={{ color: 'white' }}>Recargar</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            );
        }
        return this.props.children;
    }
}

// Helper component to refresh user data on mount
const ProfessionalProfileRefresher = ({ user, refreshUser, children }) => {
    useEffect(() => {
        refreshUser();
    }, []);
    return React.cloneElement(React.Children.only(children), { user });
};

const ImageLightbox = ({ visible, imageUrl, onClose }) => {
    if (!imageUrl) return null;
    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
                <TouchableOpacity
                    style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}
                    onPress={onClose}
                >
                    <Feather name="x" size={30} color="white" />
                </TouchableOpacity>
                <Image
                    source={{ uri: imageUrl }}
                    style={{ width: '100%', height: '85%', resizeMode: 'contain' }}
                />
            </View>
        </Modal>
    );
};

function MainApp() {
    /* AUTH CONTEXT INTEGRATION */
    const { userToken, userInfo, logout, updateUser, isLoading } = useContext(AuthContext);
    const { socket } = useSocket(); // Access socket
    const isLoggedIn = !!userToken;
    const currentUser = userInfo;

    // --- HELPER: MATCHING LOGIC ---
    const isJobMatchingProfile = useCallback((job, user) => {
        if (!user || !job) return false;

        // 1. Own Job / Client check
        const myId = String(user._id || user.id || '').trim();
        let jobClientId = '';
        if (job.client) {
            jobClientId = String(job.client._id || job.client.id || job.client || '').trim();
        }
        if (myId && jobClientId && myId === jobClientId) return false;
        if (job.clientId) {
            const legacyClientId = String(job.clientId).trim();
            if (myId && legacyClientId && myId === legacyClientId) return false;
        }

        // 2. Profile Categories & Zones
        const myProfiles = user.profiles || {};
        const activeProfileKeys = Object.keys(myProfiles).filter(key => {
            const p = myProfiles[key];
            return p && (p.isActive !== false);
        });

        if (activeProfileKeys.length === 0) {
            // If they have NO profiles, but they ARE the assigned professional, return true
            if (job.professional && areIdsEqual(job.professional?._id || job.professional, myId)) return true;
            return false;
        }

        const jobCategoryName = job.category?.name || job.category;
        const jobSubcategoryName = job.subcategory?.name || job.subcategory;
        const jobLocation = job.location;

        return activeProfileKeys.some(profileCatName => {
            // Loose matching for category name
            if (profileCatName.toLowerCase() !== String(jobCategoryName || '').toLowerCase()) return false;

            const profile = myProfiles[profileCatName];

            // Zone Check: If no zones defined, show everything in that category!
            const profileZones = profile.zones || [];
            if (profileZones.length > 0) {
                const jobLocNormalized = (jobLocation || '').trim().toLowerCase();
                const hasZone = profileZones.some(z => z.trim().toLowerCase() === jobLocNormalized);
                if (!hasZone) return false;
            }

            // Subcategory Check: If no subcategories defined, show everything in that category!
            const profileSubs = profile.subcategories || [];
            if (profileSubs.length > 0) {
                if (jobSubcategoryName && !profileSubs.some(s => s.trim().toLowerCase() === String(jobSubcategoryName).trim().toLowerCase())) return false;
            }

            return true;
        });
    }, []);

    // --- ESTADO GLOBAL (Data) ---
    const [homeMessages, setHomeMessages] = useState([]);
    const [dynamicCopy, setDynamicCopy] = useState(() => {
        // SYNCHRONOUS INITIALIZATION: Pick a random copy on mount to avoid UI flicker
        const randomIdx = Math.floor(Math.random() * HOME_COPY_OPTIONS.length);
        return HOME_COPY_OPTIONS[randomIdx];
    });

    useEffect(() => {
        const initMessaging = async () => {
            try {
                const fetched = await api.getAppMessages();
                if (fetched && fetched.length > 0) {
                    setHomeMessages(fetched);
                    // intentionally NOT calling setDynamicCopy(fetched[...]) here 
                    // to prevent a visual flicker ("double read") for the user.
                    // The backend layout can be used next time or stored if offline caching is implemented.
                }
            } catch (e) {
                console.warn("Error fetching messages", e);
            }
        };
        initMessaging();
    }, []);

    // --- ESTADO UI/NAV ---
    const [userMode, setUserMode] = useState('client');
    const [showAuth, setShowAuth] = useState(false);
    const [view, setView] = useState('home');
    const { allRequests, setAllRequests, allChats, setAllChats, refreshing, setRefreshing, counts, setCounts, loadRequests, loadChats, onRefresh } = useAppData({ isLoggedIn, currentUser, userMode, view });
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [selectedBlogPost, setSelectedBlogPost] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isOpeningRequest, setIsOpeningRequest] = useState(false);

    // --- ANIMATION FOR LOADER ---
    const spinValue = useRef(new Animated.Value(0)).current;
    const isAnimating = useRef(false);

    useEffect(() => {
        const startAnimation = () => {
            if (!isOpeningRequest && !isLoading) {
                isAnimating.current = false;
                spinValue.stopAnimation();
                spinValue.setValue(0);
                return;
            }

            isAnimating.current = true;
            spinValue.setValue(0);
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1200,
                easing: Easing.linear,
                useNativeDriver: false, // Más estable en web
            }).start(({ finished }) => {
                if (finished && isAnimating.current) {
                    startAnimation();
                }
            });
        };

        if ((isOpeningRequest || isLoading || refreshing) && !isAnimating.current) {
            startAnimation();
        } else if (!isOpeningRequest && !isLoading && !refreshing) {
            isAnimating.current = false;
            spinValue.stopAnimation();
            spinValue.setValue(0);
        }
    }, [isOpeningRequest, isLoading, refreshing]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
    const [selectedChatRequest, setSelectedChatRequest] = useState(null);
    // --- ESTADO DATOS DINÁMICOS ---
    const [categories, setCategories] = useState(CATEGORIES_DISPLAY);
    const [articles, setArticles] = useState([]);

    // --- ESTADO PRO/INTERACCIONES ---
    const [proInteractions, setProInteractions] = useState({});
    const [filterCategory, setFilterCategory] = useState('Todas');
    const [filterStatus, setFilterStatus] = useState('Todas');

    // --- ESTADO CLIENTE FILTROS ---
    const [clientFilterCategory, setClientFilterCategory] = useState('Todas');
    const [clientFilterStatus, setClientFilterStatus] = useState('Todas');
    const [showArchivedOffers, setShowArchivedOffers] = useState(false);
    const [showFilterBar, setShowFilterBar] = useState(false);

    // --- MODALES ---
    const [isRegister, setIsRegister] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [startWithRejectForm, setStartWithRejectForm] = useState(false);
    const [showClientProfileModal, setShowClientProfileModal] = useState(false);
    const [showProProfileModal, setShowProProfileModal] = useState(false);

    // --- NUEVO ESTADO FALTANTE ---
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [previousView, setPreviousView] = useState(null);
    const [pendingRequestData, setPendingRequestData] = useState(null);
    const [fullscreenImage, setFullscreenImage] = useState(null);

    // --- EFECTOS INICIALES ---
    // FIX: Auto-close auth modal when logged in
    useEffect(() => {
        if (isLoggedIn) {
            setShowAuth(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        const loadData = async () => {
            // ...
        }
        // ... Logic continues ...
    }, []); // Placeholder to avoid breaking existing useEffect, but we will add the new one below



    useEffect(() => {
        const loadData = async () => {
            try {
                const cats = await api.getCategories();
                if (Array.isArray(cats) && cats.length > 0) {
                    setCategories(cats.map(mapCategoryToDisplay));
                }
                const arts = await api.getArticles();
                if (Array.isArray(arts) && arts.length > 0) {
                    setArticles(arts.map(a => ({ ...a, id: a._id })));
                }
            } catch (err) {
                console.log("Error loading data:", err);
            }
        };
        loadData();
    }, []);

    // --- COUNTERS EFFECT (MOVED UP) ---
    useEffect(() => {
        if (!allRequests || !currentUser) return;

        const myId = currentUser?._id || currentUser?.id;
        let clientChatCount = 0;
        let clientUpdateCount = 0;
        let proChatCount = 0;
        let proUpdateCount = 0;

        allRequests.forEach(req => {
            const isClientJob = areIdsEqual(req.clientId, myId);

            // Lógica de Cliente: Solo contar si yo soy el dueño de la solicitud
            if (isClientJob) {
                // Notificaciones de nuevas ofertas pendientes de revisar
                if (req.offers?.some(o => o.status === 'pending' && !o.seenByClient)) {
                    clientUpdateCount++;
                }

                // Mensajes sin leer en mis solicitudes
                if (req.conversations) {
                    req.conversations.forEach(c => {
                        clientChatCount += (c.unreadCount || 0);
                    });
                }
            }

            // Lógica de Profesional
            // 1. Trabajos nuevos que coinciden con mi perfil (Buscador) O que tienen actualizaciones sin leer (ej: oferta aceptada)
            const isMarketNew = isJobMatchingProfile(req, currentUser) && req.proInteractionStatus === 'new';
            const hasUpdate = req.proInteractionHasUnread === true;

            if (isMarketNew || hasUpdate) {
                proUpdateCount++;
            }

            // 2. Mensajes sin leer en chats donde soy el profesional interactuando
            if (req.conversations) {
                req.conversations.forEach(c => {
                    // Solo sumar si este chat específico me pertenece a mí como profesional
                    if (areIdsEqual(c.proId, myId)) {
                        proChatCount += (c.unreadCount || 0);
                    }
                });
            }
        });

        setCounts({
            client: { chats: clientChatCount, updates: clientUpdateCount },
            pro: { chats: proChatCount, updates: proUpdateCount }
        });
    }, [allRequests, currentUser]);






    const handleLogout = async () => {
        await logout();
        setAllRequests([]);
        setView('home');
        setUserMode('client');
    };

    // Helper functions are now imported from src/utils/helpers and used directly.



    const STATUS_MAP_DB_TO_UI = {
        'new': 'NUEVA',
        'viewed': 'ABIERTA',
        'contacted': 'CONTACTADA',
        'offered': 'PRESUPUESTADA',
        'won': 'GANADA',
        'lost': 'PERDIDA',
        'rejected': 'RECHAZADA',
        'archived': 'Archivada'
    };

    const STATUS_MAP_UI_TO_DB = {
        'NUEVA': 'new',
        'ABIERTA': 'viewed',
        'CONTACTADA': 'contacted',
        'CONTACTADO': 'contacted',
        'PRESUPUESTADA': 'offered',
        'GANADA': 'won',
        'PERDIDA': 'lost',
        'RECHAZADA': 'rejected',
        'Archivada': 'archived'
    };

    const updateProStatus = async (jobId, newStatusUI) => {
        try {
            const statusDB = STATUS_MAP_UI_TO_DB[newStatusUI?.toUpperCase()] || STATUS_MAP_UI_TO_DB[newStatusUI] || newStatusUI;
            console.log(`[updateProStatus] Job: ${jobId}, UI: ${newStatusUI}, DB: ${statusDB}`);
            await api.updateJobInteraction(jobId, statusDB);

            // Actualizar estado local en allRequests
            setAllRequests(prev => prev.map(r => {
                const rId = r.id || r._id;
                return areIdsEqual(rId, jobId) ? { ...r, proInteractionStatus: statusDB } : r;
            }));

            // Actualizar proInteractions (legacy compat)
            setProInteractions(prev => ({
                ...prev,
                [jobId]: { ...prev[jobId], status: newStatusUI }
            }));
        } catch (e) {
            console.warn("Error updating pro status:", e);
        }
    };

    const markAllProInteractionsAsRead = async () => {
        if (!isLoggedIn || userMode !== 'pro') return;

        // Filter jobs that are either 'new' or have unread updates
        const marketJobIds = [];
        const hasUnreadItems = allRequests.some(req => {
            const isMatching = isJobMatchingProfile(req, currentUser) && req.proInteractionStatus === 'new';
            const hasUpdate = req.proInteractionHasUnread === true;
            if (isMatching) marketJobIds.push(req.id || req._id);
            return isMatching || hasUpdate;
        });

        if (!hasUnreadItems) return;

        try {
            // Local update for instant response
            setAllRequests(prev => prev.map(r => {
                const isMatching = isJobMatchingProfile(r, currentUser) && r.proInteractionStatus === 'new';
                const hasUpdate = r.proInteractionHasUnread === true;

                if (isMatching || hasUpdate) {
                    return {
                        ...r,
                        proInteractionStatus: isMatching ? 'viewed' : r.proInteractionStatus,
                        proInteractionHasUnread: false
                    };
                }
                return r;
            }));

            // Backend call
            await api.markAllProInteractionsAsRead(marketJobIds);
        } catch (e) {
            console.warn("Error marking all pro interactions as read:", e);
        }
    };

    const archiveJob = (jobId) => {
        updateProStatus(jobId, 'Archivada');
        setView('home');
    };

    const handleRejectOffer = async (jobId, proId, reason) => {
        try {
            await api.rejectOffer(jobId, proId, reason);
            showAlert("Éxito", "La oferta ha sido rechazada y el profesional ha sido notificado.");

            // Refresh detail if open
            if (selectedRequest && (selectedRequest.id === jobId || selectedRequest._id === jobId)) {
                try {
                    const res = await api.getJob(jobId);
                    const freshData = mapJobData(res.data || res);
                    setSelectedRequest(freshData);
                    setAllRequests(prev => prev.map(r => (r._id || r.id) === jobId ? freshData : r));
                } catch (refreshErr) {
                    console.warn("Could not refresh after rejection:", refreshErr);
                }
            }

            loadRequests(); // Refresh list background
        } catch (e) {
            showAlert("Error", e.message);
        }
    };







    const handleCloseJobRequest = async (closureData) => {
        try {
            const jobId = selectedRequest._id || selectedRequest.id;

            // Map closure data to backend fields
            const updateData = {
                status: 'canceled',
                cancelReason: closureData.reason || closureData.cancelReason,
                feedback: closureData.feedback,
                hireStatus: closureData.hireStatus
            };

            // Use updateJob to set status to canceled
            await api.updateJob(jobId, updateData);

            // Update Local State immediately
            const updatedReqs = allRequests.map(r =>
                (r.id === jobId || r._id === jobId) ? { ...r, status: 'canceled', clientStatus: 'ELIMINADA', proStatus: 'ELIMINADAS' } : r
            );
            setAllRequests(updatedReqs);

            setShowCloseModal(false);
            showAlert("Solicitud Eliminada", "La solicitud ha sido eliminada correctamente.");
            setView('my-requests');
        } catch (e) {
            console.warn("Error deleting job:", e);
            showAlert("Error", "No se pudo eliminar la solicitud.");
        }
    };

    const handleTogglePortfolio = async (mediaUrl, category) => {
        if (!isLoggedIn || !currentUser) {
            showAlert("Aviso", "Debes iniciar sesión para guardar en el portafolio.");
            return;
        }

        try {
            // 1. Get current profiles (handling both Map-like and Object-like structures)
            const currentProfiles = { ...(currentUser.profiles || {}) };
            const catProfile = { ...(currentProfiles[category] || { category, gallery: [], description: `Trabajos en ${category}` }) };

            let newGallery = [...(catProfile.gallery || [])];
            let message = "";

            if (newGallery.includes(mediaUrl)) {
                // Remove
                newGallery = newGallery.filter(url => url !== mediaUrl);
                message = "Foto eliminada del portafolio";
            } else {
                // Add
                newGallery.push(mediaUrl);
                message = "Foto agregada al portafolio";
            }

            const updatedProfiles = {
                ...currentProfiles,
                [category]: {
                    ...catProfile,
                    gallery: newGallery
                }
            };

            // 2. Update via API
            await api.updateProfile({ profiles: updatedProfiles });

            // 3. Refresh user state (this will update currentUser and trigger re-render of Timeline)
            const freshUser = await api.getMe();
            await updateUser(freshUser);
            await saveSession(freshUser);

            showAlert("¡Listo!", message);
        } catch (error) {
            console.error("Error toggling portfolio photo:", error);
            showAlert("Error", "No se pudo actualizar el portafolio: " + (error.message || "Error desconocido"));
        }
    };

    const handleRateMutual = async (jobId, reviewData) => {
        try {
            // Find revieweeId
            const job = allRequests.find(r => r._id === jobId || r.id === jobId);

            // Safe extraction of IDs
            const professionalId = job.professional?._id || job.professional;
            const clientId = job.clientId; // Already mapped to _id in loadRequests

            const revieweeId = userMode === 'client' ? professionalId : clientId;

            const res = await api.rateMutual(jobId, { ...reviewData, revieweeId });
            showAlert("¡Gracias!", "Tu valoración ha sido enviada.");

            // FETCH PORTFOLIO-GRADE JOB DATA TO PREVENT DISAPPEARING AVATARS
            const deepJob = await api.getJob(jobId);
            const mappedJob = mapJobData(deepJob);

            if (selectedRequest && areIdsEqual(selectedRequest.id || selectedRequest._id, jobId)) {
                setSelectedRequest(mappedJob);
            }

            // Refresh list in background
            loadRequests();
        } catch (e) {
            showAlert("Error", e.message);
        }
    };







    // Legacy handleLogin and session restore removed (handled by AuthContext)





    // AUTO-REDIRECT TO ADMIN PANEL
    useEffect(() => {
        if (currentUser) {
            const name = currentUser.name?.trim().toLowerCase();
            const email = currentUser.email?.trim().toLowerCase();
            if ((name === 'admin' || email === 'admin@profesionalcercano.com') && view !== 'admin') {
                console.log("Auto-redirecting Admin to Panel...");
                setView('admin');
            }
        }
    }, [currentUser, view]);

    const mapJobData = (fullJob) => {
        if (!fullJob) return null;
        const currentUserId = currentUser?._id || currentUser?.id;

        // Ensure we have a valid object
        const data = fullJob.data || fullJob;

        if (data.title === 'Revisión de cortocircuito') {
            console.log(`[App.js mapJobData] incoming calculatedClientStatus: ${data.calculatedClientStatus}`);
        }

        const mappedJob = {
            id: data._id || data.id,
            _id: data._id || data.id,
            title: data.title,
            description: data.description,
            category: data.category?.name || data.category || 'General',
            subcategory: data.subcategory?.name || data.subcategory,
            location: data.location,
            status: data.status === 'active' || data.status === 'open' ? 'Abierto' :
                (data.status === 'in_progress' || data.status === 'started') ? 'En Progreso' :
                    (data.status === 'completed' || data.status === 'finished' || data.status === 'rated') ? 'Finalizado' :
                        (data.status === 'canceled' ? 'Cerrado' : data.status),
            budget: data.budget,
            images: data.images || [],
            createdAt: data.createdAt,
            clientName: data.client?.name || data.clientName || 'Usuario',
            clientEmail: data.client?.email || data.clientEmail,
            clientAvatar: data.client?.avatar || data.clientAvatar,
            clientId: data.client?._id || data.client || data.clientId,
            professional: data.professional,
            trackingStatus: data.trackingStatus || 'none',
            workStartedOnTime: data.workStartedOnTime,
            workPhotos: data.workPhotos || [],
            clientFinished: data.clientFinished,
            proFinished: data.proFinished,
            clientRated: data.clientRated,
            proRated: data.proRated,
            projectHistory: data.projectHistory || [],
            clientManagement: data.clientManagement || {},
            conversations: data.conversations || [],
            offers: data.offers?.map(o => ({
                ...o,
                proId: o.proId?._id || o.proId,
                proName: o.proId?.name || o.proName || 'Profesional',
                proAvatar: o.proId?.avatar || o.proAvatar
            })) || [],
            proInteractionStatus: data.proInteraction?.status || data.proInteractionStatus || 'new',
            calculatedClientStatus: data.calculatedClientStatus,
            calculatedProStatus: data.calculatedProStatus
        };

        mappedJob.proStatus = userMode === 'pro' ? getProStatus(data, currentUserId) : 'NUEVA';
        mappedJob.clientStatus = getClientStatus(mappedJob); // pass mappedJob so it sees calculatedClientStatus

        return mappedJob;
    };

    const handleOpenJobDetail = async (jobId, targetView, autoOpenBudgetForProId = null) => {
        if (!jobId) {
            console.warn("[handleOpenJobDetail] jobId is undefined");
            return;
        }

        // --- OPTIMISTIC UI: Transition immediately if we have local data ---
        const localJob = allRequests.find(r => areIdsEqual(r.id || r._id, jobId));
        if (localJob) {
            setSelectedRequest(localJob);
            setView(targetView);

            // Handle auto-opening budget popup immediately if applicable
            if (autoOpenBudgetForProId && localJob.offers) {
                const offer = localJob.offers.find(o => areIdsEqual(o.proId, autoOpenBudgetForProId));
                if (offer) {
                    setSelectedBudget(offer);
                    setShowBudgetModal(true);
                }
            }
        } else {
            setIsOpeningRequest(true); // Only show blocking spinner if strictly needed
        }

        try {
            console.log(`[handleOpenJobDetail] Loading job ${jobId} for view ${targetView} in background`);
            const fullJob = await api.getJob(jobId);
            const mappedJob = mapJobData(fullJob);

            setSelectedRequest(mappedJob);

            // Only transition view here if we didn't have local data
            if (!localJob) {
                setView(targetView);

                if (autoOpenBudgetForProId && mappedJob.offers) {
                    const offer = mappedJob.offers.find(o => areIdsEqual(o.proId, autoOpenBudgetForProId));
                    if (offer) {
                        setSelectedBudget(offer);
                        setShowBudgetModal(true);
                    }
                }
            }

            // AUTO-UPDATE STATUS TO Viewed (ABIERTA)
            if (userMode === 'pro' && targetView === 'job-detail-pro') {
                const currentStatus = mappedJob.proInteractionStatus || 'new';
                if (currentStatus === 'new') {
                    updateProStatus(jobId, 'ABIERTA');
                }
                api.markInteractionAsRead(jobId).catch(console.warn);
            }

            // CLIENT SIDE: MARK OFFERS AS SEEN
            if (userMode === 'client' && targetView === 'request-detail-client') {
                api.markOffersAsSeen(jobId).catch(e => console.warn("Error marking offers as seen:", e));
            }
        } catch (e) {
            console.warn("Error opening job details:", e);
            showAlert("Error", "No se pudieron cargar los detalles de la solicitud.");
        } finally {
            setIsOpeningRequest(false);
        }
    };

    const handleOpenChat = (request, targetUser, initialMessage = null) => {
        let finalTarget = targetUser;
        if (!finalTarget) {
            if (currentUser.role === 'professional' || userMode === 'pro') {
                const cId = request.clientId || request.client?._id || request.client?.id || (typeof request.client === 'string' ? request.client : null);
                const cName = request.clientName || request.client?.name || (typeof request.client === 'object' ? request.client.name : 'Cliente');
                const cEmail = request.clientEmail || request.client?.email || (typeof request.client === 'object' ? request.client.email : null);
                const cAvatar = request.clientAvatar || request.client?.avatar || (typeof request.client === 'object' ? request.client.avatar : null);
                finalTarget = { name: cName, role: 'client', email: cEmail, id: cId, avatar: cAvatar };
            }
        }

        // FIND CHAT ID TO MARK AS READ
        let chatIdToMark;
        const proId = (userMode === 'client' && finalTarget) ? finalTarget.id : (currentUser?._id || currentUser?.id);
        const conversations = request.conversations || [];
        const conv = conversations.find(c => areIdsEqual(c.proId?._id || c.proId, proId));
        if (conv) chatIdToMark = conv.id || conv._id;

        if (chatIdToMark) {
            api.markChatAsRead(chatIdToMark).catch(e => console.warn("Error marking chat as read:", e));
        }

        // MARK AS READ (Local)
        const updatedRequests = allRequests.map(r => {
            const currentJobId = r.id || r._id;
            const targetJobId = request.id || request._id;
            if (areIdsEqual(currentJobId, targetJobId)) {
                const newConvs = (r.conversations || []).map(c => {
                    let isTarget = false;
                    if (userMode === 'client') {
                        if (c.proEmail === finalTarget?.email || c.proName === finalTarget?.name || (finalTarget && areIdsEqual(c.proId, finalTarget.id))) isTarget = true;
                    } else {
                        if (c.proEmail === currentUser?.email || areIdsEqual(c.proId, currentUser?._id)) isTarget = true;
                    }

                    if (isTarget) {
                        return { ...c, unreadCount: 0 };
                    }
                    return c;
                });
                return { ...r, conversations: newConvs };
            }
            return r;
        });
        setAllRequests(updatedRequests);

        if (userMode === 'pro') {
            const rId = request.id || request._id;
            if (rId) {
                const currentStatus = proInteractions[rId]?.status || 'Nueva';
                if (currentStatus === 'Nueva' || currentStatus === 'Abierta') {
                    updateProStatus(rId, 'Contactada');
                }
                // Also mark job as read (no red dot)
                setProInteractions(prev => ({
                    ...prev,
                    [rId]: { ...prev[rId], hasUnread: false }
                }));
            }
        }

        setSelectedChatRequest({ ...request, targetUser: finalTarget, initialMessage });
        setPreviousView(view);
        setView('chat-detail');
    };

    const handleSendMessage = async (request, messageContent, type = 'text') => {
        try {
            console.log("[handleSendMessage] Start. Type:", type);

            // 1. Identificar si actúo como Pro o Cliente
            const isActingAsPro = userMode === 'pro' || userMode === 'professional';

            // 2. Determinar el usuario objetivo (ID)
            let targetUserId;
            let proId, proName, proEmail;

            if (isActingAsPro) {
                // Soy Pro, target es el Cliente
                targetUserId = request.clientId || request.client?._id || request.client?.id || request.targetUser?.id;
                proId = currentUser._id;
                proName = currentUser.name;
                proEmail = currentUser.email;

                if (!targetUserId) {
                    console.error("No target user ID found for professional sending message. Request object:", JSON.stringify(request).substring(0, 100));
                    showAlert("Error", "No se pudo identificar al cliente del trabajo.");
                    return;
                }

                // AUTO-UPDATE STATUS TO Contacted (CONTACTADA) - Don't await, it's non-critical
                const dbStatus = request.proInteractionStatus || 'new';
                if (dbStatus === 'new' || dbStatus === 'viewed') {
                    updateProStatus(request.id || request._id, 'Contactada');
                }
            } else {
                // Soy Cliente, target es el Pro. 
                // La info del pro DEBE venir en request.targetUser (seteado en handleOpenChat)
                if (!request.targetUser || !request.targetUser.id) {
                    console.error("No target user ID found for client sending message");
                    showAlert("Error", "No se pudo identificar al destinatario.");
                    return;
                }
                targetUserId = request.targetUser.id;
                proId = request.targetUser.id;
                proName = request.targetUser.name;
                proEmail = request.targetUser.email;
            }

            console.log(`[handleSendMessage] From: ${currentUser._id}, To: ${targetUserId}, Job: ${request.id || request._id || 'NONE'}`);

            // 3. Buscar si YA existe el chat con ID real en las conversaciones cargadas
            // request.conversations viene del backend (jobs.routes.js), cada elem tiene { id: chat._id, proId ... }
            const conversations = request.conversations || [];

            // Buscar conversación por participantes (Job + Pro específico)
            // Si soy pro, busco donde proId sea YO. Si soy cliente, busco donde proId sea el TARGET.
            let existingConv = conversations.find(c => areIdsEqual(c.proId?._id || c.proId, proId));

            // FALLBACK FOR PRO MODE: If not found by ID (because backend might return weird proId),
            // but we have conversations and we are the Pro, assume the first one is ours.
            // This matches the logic in ChatScreen.js
            if (!existingConv && isActingAsPro && conversations.length > 0) {
                console.log("[handleSendMessage] Pro Mode fallback: Using first conversation found.");
                existingConv = conversations[0];
            }

            let realChatId = existingConv ? (existingConv.id || existingConv._id) : null;

            // 4. Si no tiene ID de chat (es nuevo o local), SINCRONIZAR con backend
            if (!realChatId) {
                const jobId = request.id || request._id;
                console.log(`[handleSendMessage] Syncing chat session for Job: ${jobId}`);
                const newChat = await api.createChat(targetUserId, jobId);
                realChatId = newChat._id || newChat.id;
            }

            // 5. Enviar mensaje al backend en BACKGROUND (Optimistic UI)
            const textArg = type === 'media' ? null : messageContent;
            const mediaArg = type === 'media' ? messageContent : null;

            api.sendMessage(realChatId, textArg, mediaArg).then(response => {
                const newMessage = response.message;

                if (newMessage) {
                    // Formatear el nuevo mensaje para el frontend
                    const formattedNewMsg = {
                        text: newMessage.content || "",
                        sender: isActingAsPro ? 'pro' : 'client',
                        timestamp: newMessage.createdAt,
                        type: newMessage.media ? 'media' : 'text',
                        media: newMessage.media,
                        mediaType: newMessage.mediaType
                    };

                    // Actualizar selectedChatRequest ("active chat")
                    setSelectedChatRequest(prev => {
                        if (!prev) return prev;
                        const newConvs = (prev.conversations || []).map(c => {
                            if (c.id === realChatId || areIdsEqual(c.proId?._id || c.proId, proId)) {
                                // Solo agregamos si no existe ya (evitar duplicados por socket)
                                const exists = (c.messages || []).some(m => m.timestamp === formattedNewMsg.timestamp && m.text === formattedNewMsg.text);
                                if (exists) return c;
                                return { ...c, messages: [...(c.messages || []), formattedNewMsg], id: realChatId };
                            }
                            return c;
                        });

                        // Si no existía la conversación, crearla
                        if (!newConvs.some(c => c.id === realChatId || areIdsEqual(c.proId?._id || c.proId, proId))) {
                            newConvs.push({
                                id: realChatId,
                                proId: proId,
                                proName: proName,
                                proEmail: proEmail,
                                messages: [formattedNewMsg]
                            });
                        }
                        return { ...prev, conversations: newConvs };
                    });

                    // Actualizar allRequests (Global State) - Optimized
                    setAllRequests(prevRequests => {
                        const currentRequestId = request.id || request._id;
                        const idx = prevRequests.findIndex(r => areIdsEqual(r.id || r._id, currentRequestId));
                        if (idx === -1) return prevRequests;

                        const req = prevRequests[idx];
                        const newConvs = (req.conversations || []).map(c => {
                            if (c.id === realChatId || areIdsEqual(c.proId?._id || c.proId, proId)) {
                                const exists = (c.messages || []).some(m => m.timestamp === formattedNewMsg.timestamp && m.text === formattedNewMsg.text);
                                if (exists) return c;
                                return { ...c, messages: [...(c.messages || []), formattedNewMsg], id: realChatId };
                            }
                            return c;
                        });
                        if (!newConvs.some(c => c.id === realChatId)) {
                            newConvs.push({
                                id: realChatId,
                                proId: proId,
                                proName: proName,
                                proEmail: proEmail,
                                messages: [formattedNewMsg]
                            });
                        }
                        const updatedReq = { ...req, conversations: newConvs };

                        // Update selectedRequest if it matches
                        if (selectedRequest && areIdsEqual(selectedRequest.id || selectedRequest._id, currentRequestId)) {
                            setSelectedRequest(updatedReq);
                        }

                        const newList = [...prevRequests];
                        newList[idx] = updatedReq;
                        return newList;
                    });
                }
            }).catch(e => {
                console.warn('Error enviando mensaje:', e);
                showAlert('Error', 'No se pudo enviar el mensaje. Verifica tu conexión.');

                // EMERGENCY: If we still hit quota, maybe clear the whole storage once
                if (e.message && e.message.includes('quota') && Platform.OS === 'web') {
                    console.warn("EMERGENCY: Clearing localStorage due to persistent quota error.");
                    localStorage.clear();
                }
            });
        } catch (e) {
            console.warn('Error en proceso local de enviar mensaje:', e);
            showAlert('Error', 'No se pudo enviar el mensaje localmente.');
        }
    };

    const handleStartJob = async () => {
        if (!selectedRequest) return;
        const jobId = selectedRequest.id || selectedRequest._id;
        try {
            // 1. Optimistic UI update
            const optimisticJob = { ...selectedRequest, proStatus: 'EN EJECUCIÓN', trackingStatus: 'started' };
            setAllRequests(prev => prev.map(r => (r._id || r.id) === jobId ? optimisticJob : r));
            setSelectedRequest(optimisticJob);
            showAlert('Trabajo Iniciado', 'La bitácora de trabajo ha sido activada.');

            // 2. Background Sync
            api.confirmStart(jobId, true).then(() => {
                return api.getJob(jobId);
            }).then(deepJob => {
                const mapped = mapJobData(deepJob);
                setAllRequests(prev => prev.map(r => (r._id || r.id) === jobId ? mapped : r));
                // Only update if still looking at the same job
                setSelectedRequest(current => current && areIdsEqual(current.id || current._id, jobId) ? mapped : current);
            }).catch(error => {
                console.error("Error syncing start job:", error);
            });
        } catch (error) {
            console.error("Error UI start job:", error);
        }
    };

    const handleFinishJob = async (jobIdVal) => {
        const jId = jobIdVal || selectedRequest?.id || selectedRequest?._id;
        if (!jId) return;

        try {
            // 1. Optimistic UI update
            const reqToUpdate = selectedRequest && areIdsEqual(selectedRequest.id || selectedRequest._id, jId) ? selectedRequest : allRequests.find(r => areIdsEqual(r.id || r._id, jId));
            const optimisticJob = { ...reqToUpdate, proStatus: 'VALIDANDO', status: 'completed' };
            setAllRequests(prev => prev.map(r => (r._id || r.id) === jId ? optimisticJob : r));
            if (selectedRequest && areIdsEqual(selectedRequest.id || selectedRequest._id, jId)) {
                setSelectedRequest(optimisticJob);
            }
            showAlert('Trabajo Finalizado', 'Notifica al cliente para que revise y cierre la solicitud.');

            // 2. Background Sync
            api.finishJobByStatus(jId).then(() => {
                return api.getJob(jId);
            }).then(deepJob => {
                const mapped = mapJobData(deepJob);
                setAllRequests(prev => prev.map(r => (r._id || r.id) === jId ? mapped : r));
                setSelectedRequest(current => current && areIdsEqual(current.id || current._id, jId) ? mapped : current);
            }).catch(error => {
                console.error("Error syncing finish job:", error);
            });
        } catch (error) {
            console.error("Error UI finish job:", error);
        }
    };

    const handleAddWorkPhoto = async (jobId, imageBase64) => {
        try {
            await api.uploadWorkPhoto(jobId, imageBase64);

            // Refresh
            const res = await api.getJob(jobId);
            const mapped = mapJobData(res);

            setAllRequests(prev => prev.map(r => (r._id || r.id) === jobId ? mapped : r));
            setSelectedRequest(mapped);
            showAlert("Foto subida", "La evidencia ha sido guardada.");
        } catch (e) {
            console.error(e);
            showAlert("Error", "No se pudo subir la foto.");
        }
    };

    const handleAddTimelineEvent = async (eventData) => {
        if (!selectedRequest) return;
        const jobId = selectedRequest.id || selectedRequest._id;

        try {
            if (eventData.pickImage) {
                let result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.5,
                    base64: true,
                });

                if (result.canceled) return;
                showAlert("Subiendo Foto", "La evidencia se está guardando...");

                const newEvent = {
                    eventType: 'photo_uploaded',
                    title: 'Foto de Evidencia',
                    description: 'Foto cargada durante el trabajo.',
                    mediaUrl: `data:image/jpeg;base64,${result.assets[0].base64}`,
                    isPrivate: eventData.isPrivate || false,
                    date: new Date().toISOString()
                };

                // 1. Optimistic UI update
                const optimisticJob = { ...selectedRequest, projectHistory: [...(selectedRequest.projectHistory || []), newEvent] };
                setSelectedRequest(optimisticJob);
                setAllRequests(prev => prev.map(r => (r._id || r.id) === jobId ? optimisticJob : r));

                // 2. Background Sync
                api.addTimelineEvent(jobId, newEvent).then(() => {
                    return api.getJob(jobId);
                }).then(deepJob => {
                    const mapped = mapJobData(deepJob);
                    setAllRequests(prev => prev.map(r => (r._id || r.id) === jobId ? mapped : r));
                    setSelectedRequest(current => current && areIdsEqual(current.id || current._id, jobId) ? mapped : current);
                }).catch(error => console.error("Error syncing timeline photo:", error));

                return;
            }

            // Text Event Optimistic Update
            const textEvent = { ...eventData, date: new Date().toISOString() };
            const optimisticJob = { ...selectedRequest, projectHistory: [...(selectedRequest.projectHistory || []), textEvent] };
            setSelectedRequest(optimisticJob);
            setAllRequests(prev => prev.map(r => (r._id || r.id) === jobId ? optimisticJob : r));

            // Background Sync
            api.addTimelineEvent(jobId, eventData).then(() => {
                return api.getJob(jobId);
            }).then(deepJob => {
                const mapped = mapJobData(deepJob);
                setAllRequests(prev => prev.map(r => (r._id || r.id) === jobId ? mapped : r));
                setSelectedRequest(current => current && areIdsEqual(current.id || current._id, jobId) ? mapped : current);
            }).catch(error => console.error("Error syncing timeline text:", error));

        } catch (error) {
            console.error("Error adding timeline event:", error);
            showAlert("Error", "No se pudo agregar el evento.");
        }
    };

    const createRequest = async (data, userName, userEmail) => {
        try {
            // Buscar ID de categoría
            let categoryId = null;

            // Si data.category es un objeto (viene de CreateRequestScreen nuevo)
            if (typeof data.category === 'object' && data.category._id) {
                categoryId = data.category._id;
            } else {
                // Fallback: buscar por nombre en la lista cargada
                const catObj = categories.find(c => c.name === data.category);
                categoryId = catObj ? catObj.id : null;
            }

            if (!categoryId) {
                console.warn("Categoría no encontrada:", data.category);
                // Si no hay categorías cargadas (error de red), intentar recargar o alertar
                if (categories.length === 0) {
                    showAlert("Error de conexión", "No se pudieron cargar las categorías. Verifica tu conexión.");
                    return;
                }
                showAlert("Error", "Categoría inválida seleccionada.");
                return;
            }

            const jobData = {
                title: data.title,
                description: data.description,
                category: categoryId,
                subcategory: data.subcategory || 'General',
                location: data.location,
                budget: 0,
                images: data.images
            };

            const newJob = await api.createJob(jobData);

            const mappedJob = {
                id: newJob._id,
                _id: newJob._id,
                title: newJob.title,
                description: newJob.description,
                category: data.category,
                subcategory: newJob.subcategory || data.subcategory || 'General',
                location: newJob.location,
                status: 'Abierto',
                budget: newJob.budget,
                images: newJob.images,
                createdAt: newJob.createdAt,
                clientName: currentUser?.name || 'Usuario',
                clientAvatar: currentUser?.avatar,
                clientId: currentUser?._id
            };

            setAllRequests([mappedJob, ...allRequests]);
            showAlert("¡Éxito!", "Solicitud creada. Los profesionales la verán pronto.");
            setView('my-requests');
        } catch (e) {
            console.warn('Error creando solicitud:', e);
            showAlert('Error', `No se pudo crear la solicitud: ${e.message}`);
        }
    };

    const handleProSendQuote = async (jobId, quoteData, isUpdating = false) => {
        try {
            // 1. Mostrar estado de carga (opcional si ya hay un loader global)
            console.log("[handleProSendQuote] Iniciando envío de oferta...");

            // 2. Ejecutar la acción principal (Crear o Actualizar)
            if (isUpdating) {
                await api.updateOffer(jobId, quoteData);
            } else {
                await api.createOffer(jobId, quoteData);
            }

            // 3. Actualizar estado de interacción localmente de inmediato (Optimista)
            // Esto evita esperar al loadRequests para ver el cambio
            updateProStatus(jobId, 'PRESUPUESTADA');

            // 4. Refrescar datos en PARALELO para ahorrar tiempo
            // No esperamos uno por uno, sino que lanzamos todos y esperamos al conjunto
            console.log("[handleProSendQuote] Refrescando datos en paralelo...");

            Promise.all([
                loadRequests(), // Recargar solicitudes
                loadChats(),    // Recargar chats (por si la oferta activó uno)
                api.getMe().then(usr => updateUser(usr)).catch(err => console.warn("Error refreshing user:", err))
            ]).catch(err => console.warn("Error in parallel refresh:", err));

            // 5. Mostrar éxito y navegar rápido
            showAlert(
                isUpdating ? "Actualizado" : "Enviado",
                isUpdating ? "Tu oferta ha sido actualizada." : "Tu oferta ha sido enviada."
            );

            // RESET FILTERS
            setFilterStatus('Todas');
            setFilterCategory('Todas');

            // Volvemos al home de inmediato sin esperar a los refrescos pesados si es posible
            setView('home');

        } catch (e) {
            console.warn('Error enviando oferta:', e);
            showAlert('Error', e.message || 'No se pudo enviar la oferta.');
        }
    };

    const handleAcceptOffer = async (jobId, proId) => {
        try {
            // Priority: Find the job and the professionalId from the offer
            const job = allRequests.find(r => r.id === jobId || r._id === jobId);
            if (!job) {
                throw new Error("No se pudo encontrar la solicitud");
            }

            // Validar que exista la oferta del proId
            const offer = job.offers.find(o => o.proId === proId);
            if (!offer) {
                throw new Error("No se pudo encontrar la oferta seleccionada");
            }

            await api.assignJob(jobId, proId);

            showAlert("¡Excelente!", "Has aceptado la oferta. El trabajo ahora está en progreso.");

            // Refresh all data
            await loadRequests();
            // Redirect or update view
            setView('home'); // Go back home to see the updated status
        } catch (e) {
            console.warn('Error aceptando oferta:', e);
            showAlert('Error', 'No se pudo aceptar la oferta: ' + (e.message || 'Error desconocido'));
        }
    };

    const handleUpdateProfile = async (updatedUser) => {
        console.log("handleUpdateProfile called. Avatar length:", updatedUser.avatar ? updatedUser.avatar.length : 0);
        console.log("Updating for user ID:", currentUser?._id, "Cedula:", currentUser?.cedula);

        try {
            // 1. Send update to server
            // Note: api.updateProfile already handles JSON stringify
            const result = await api.updateProfile(updatedUser);
            console.log("Profile updated on server success. Result ID:", result._id);

            // 2. Force verify by fetching fresh data immediately
            console.log("Fetching fresh user data...");
            const freshUser = await api.getMe();
            console.log("Fresh user fetched. Name:", freshUser.name);
            console.log("Fresh user profiles keys:", freshUser.profiles ? Object.keys(freshUser.profiles) : 'None');

            // 3. Update local state with the FRESH data
            // USE CONTEXT UPDATER INSTEAD OF LOCAL SETTER
            await updateUser(freshUser);

            // Sync with AsyncStorage manually (updateUser already does this for userInfo, but saveSession does both... check implementation)
            // saveSession(freshUser) might effectively duplicate work but harmless. Let's rely on Context.
            await saveSession(freshUser);

            // Sync with AuthProvider state if possible (optional, but good practice if AuthContext is used)
            // But App.js seems to be the source of truth for currentUser in this architecture

            // 4. Reload requests to apply new profile filters
            await loadRequests();

            showAlert('Éxito', 'Perfil actualizado correctamente');
        } catch (e) {
            console.warn('Error actualizando perfil:', e);
            showAlert('Error', 'No se pudo actualizar el perfil: ' + e.message);
        }
    };

    const handleConfirmStart = async (jobId, confirmed) => {
        try {
            if (confirmed) {
                await api.confirmStart(jobId);
                showAlert("Confirmado", "Has confirmado el inicio del trabajo. El tiempo comienza a correr.");

                const deepJob = await api.getJob(jobId);
                const mapped = mapJobData(deepJob);

                setAllRequests(prev => prev.map(r => (r._id || r.id) === jobId ? mapped : r));
                if (selectedRequest && areIdsEqual(selectedRequest.id || selectedRequest._id, jobId)) {
                    setSelectedRequest(mapped);
                }

                loadRequests(); // run in background
            }
        } catch (e) {
            showAlert("Error", e.message);
        }
    };





    const myClientRequests = useMemo(() => {
        const filtered = allRequests.filter(r => {
            // STRICT filter for "My Requests" screen
            if (r.clientId && currentUser?._id) return areIdsEqual(r.clientId, currentUser._id);
            const emailMatch = r.clientEmail && currentUser?.email ? r.clientEmail === currentUser.email : false;
            return emailMatch || r.clientName === currentUser?.name;
        });
        console.log(`[DEBUG] allRequests: ${allRequests.length}, myClientRequests: ${filtered.length}. Job 0 status: ${filtered[0]?.calculatedClientStatus}`);
        return filtered;
    }, [allRequests, currentUser]);

    // --- LOGICA DE FILTRADO AVANZADO PARA PRO ---
    // Only calculate active categories if we are in PRO mode or checking pro capabilities
    const activeCategories = useMemo(() => {
        return (userMode === 'pro' && currentUser?.profiles)
            ? Object.keys(currentUser.profiles).filter(k => currentUser.profiles[k].isActive !== false)
            : [];
    }, [userMode, currentUser]);

    // 1. Filtrar base - SIN FILTROS (RAW)
    const matchingJobs = useMemo(() => {
        return allRequests.filter(r => {
            // TEMPORAL: Retornar todo para verificar flujo de datos
            // Ya no filtramos por "My Own Job", "Profile Categories", "Zones" ni "Closed Status"
            return true;
        });
    }, [allRequests]);



    // 2. Enriquecer con estado local/backend del pro (DYNAMIC CALCULATION)
    const jobsWithStatus = useMemo(() => {
        return matchingJobs.map(job => {
            const myId = currentUser?._id;
            const uiStatus = getProStatus(job, myId);

            // LOGIC FIX: Check local state first, then fallback to backend state
            const localInteraction = proInteractions?.[job.id];
            const computedHasUnread = localInteraction ? localInteraction.hasUnread : (job.proInteractionHasUnread || false);

            return {
                ...job,
                proStatus: uiStatus,
                hasUnread: computedHasUnread
            };
        });
    }, [matchingJobs, currentUser, proInteractions]);

    // 3. Aplicar filtros de UI y Lógica de "Ofertas Anteriores"
    const availableJobsForPro = useMemo(() => {
        return jobsWithStatus.filter(job => {
            // --- 1. FILTROS DE UI (Categoría y Archivados) ---
            const catMatch = filterCategory === 'Todas' || (job.category?.name || job.category) === filterCategory;
            const isArchived = job.proStatus === 'Archivada' ||
                job.proStatus === 'TERMINADO' ||
                job.proStatus === 'PERDIDA' ||
                job.status === 'canceled' ||
                job.status === 'closed' ||
                job.status === 'TERMINADO' ||
                job.status === 'Culminada' ||
                job.status === 'rated';

            if (showArchivedOffers) {
                if (!isArchived) return false;
            } else {
                if (isArchived) return false;
            }
            if (!catMatch) return false;

            // --- 2. FILTROS DE NEGOCIO (Matching de Perfil) ---
            // SIEMPRE mostrar si ya estoy involucrado o soy el profesional asignado
            if (job.isVirtual || job.professional || (job.offers && job.offers.some(o => areIdsEqual(o.proId, currentUser?._id)))) return true;

            return isJobMatchingProfile(job, currentUser);
        });
    }, [jobsWithStatus, filterCategory, showArchivedOffers, currentUser, isJobMatchingProfile]);



    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
                {/* Mascot Image Active */}
                <Image source={require('./assets/mascot.png')} style={{ width: 250, height: 250, marginBottom: 20 }} resizeMode="contain" />

                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <View style={{ width: 80, height: 80, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{
                            width: 70, height: 70, borderRadius: 35,
                            borderWidth: 6, borderColor: '#2563EB',
                            borderTopColor: '#EA580C', borderRightColor: '#EA580C',
                            transform: [{ rotate: '-45deg' }]
                        }} />
                    </View>
                </Animated.View>

                <Text style={{ marginTop: 30, color: '#1E293B', fontWeight: 'bold', fontSize: 20, letterSpacing: 0.5 }}>
                    Iniciando Profesional Cercano...
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="white" />

            {/* HEADER (No mostrar en detalles) */}
            {view === 'home' || view === 'my-requests' || view === 'profile' || view === 'chat-list' || view === 'request-detail-client' || view === 'job-detail-pro' || view === 'chat-detail' ? (
                <Header
                    userMode={userMode}
                    toggleMode={() => {
                        // ACCESO SECRETO AL ADMIN PANEL
                        // Verifica nombre "Admin" (insensible a mayúsculas) o email específico
                        const name = currentUser?.name?.trim().toLowerCase();
                        const email = currentUser?.email?.trim().toLowerCase();

                        if (name === 'admin' || email === 'admin@profesionalcercano.com' || email === 'admin@profix.com' || currentUser?.role === 'admin') {
                            setView('admin');
                            return;
                        }

                        const newMode = userMode === 'client' ? 'pro' : 'client';
                        setUserMode(newMode);

                        // Recargar todo con el modo explícito nuevo
                        loadRequests(newMode);
                        loadChats(newMode);

                        // Lógica de navegación inteligente al cambiar de modo
                        if (view === 'profile') {
                            // Si estoy en perfil, mantengo perfil
                            setView('profile');
                        } else if (view === 'chat-list' || view === 'chat-detail') {
                            // Si estoy en chat, mantengo chat (lista)
                            setView('chat-list');
                        } else if (userMode === 'client' && view === 'my-requests') {
                            // Si estoy en Solicitudes (Cliente) -> voy a Presupuestos (Pro Home)
                            setView('home');
                        } else if (userMode === 'pro' && view === 'home') {
                            // Si estoy en Presupuestos (Pro Home) -> voy a Solicitudes (Cliente)
                            setView('my-requests');
                        } else {
                            // Comportamiento por defecto para otras pantallas (ej. Home Cliente -> Home Pro)
                            if (newMode === 'client') {
                                setView('home');
                            } else {
                                setView('home');
                            }
                        }
                    }}
                    isLoggedIn={isLoggedIn}
                    onLoginPress={() => { setShowAuth(true); setIsRegister(false); }}
                    currentUser={currentUser}
                    onOpenProfile={() => setView('profile')}
                    clientCounts={counts.client}
                    proCounts={counts.pro}
                />
            ) : null}

            <View style={{ flex: 1 }}>
                {/* CLIENTE HOME */}
                {userMode === 'client' && view === 'home' && (
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                    >
                        <ScrollView style={{ flex: 1, backgroundColor: '#F8F9FA' }} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
                            <SectionDivider />
                            <ServiceForm
                                onSubmit={createRequest} // Acceso directo para pruebas, idealmente pasar por handleCreateNewRequest
                                isLoggedIn={isLoggedIn}
                                onTriggerLogin={(data) => { setPendingRequestData(data.pendingData); setShowAuth(true); }}
                                initialCategory={selectedCategory?.name}
                                initialSubcategory={selectedSubcategory}
                                categories={categories}
                                allSubcategories={
                                    categories.reduce((acc, cat) => ({ ...acc, [cat.name]: cat.subcategories }), {})
                                }
                                currentUser={currentUser}
                                dynamicCopy={dynamicCopy}
                            />
                            <SectionDivider />
                            <UrgencyBanner
                                categories={categories}
                                onActionPress={(cat, sub) => {
                                    setSelectedCategory(categories.find(c => c.name === cat));
                                    setSelectedSubcategory(sub);
                                }}
                                onPress={() => {
                                    showAlert("Urgencia", "Selecciona una categoría para respuesta inmediata.");
                                }}
                            />
                            <SectionDivider />
                            <HomeSections
                                onSelectCategory={(cat) => { setSelectedCategory(cat); setView('category-detail'); }}
                                onSelectPost={(post) => { setSelectedBlogPost(post); setView('blog-post'); }}
                                categories={categories}
                                articles={articles}
                            />
                            <SectionDivider />
                        </ScrollView>
                    </KeyboardAvoidingView>
                )}

                {/* GLOBAL OVERLAY LOADER FOR OPENING DETAILS */}
                {isOpeningRequest && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10000, justifyContent: 'center', alignItems: 'center' }}>
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <View style={{ width: 60, height: 60, justifyContent: 'center', alignItems: 'center' }}>
                                {/* Círculo Bicolor Base */}
                                <View style={{
                                    width: 50, height: 50, borderRadius: 25,
                                    borderWidth: 5, borderColor: '#2563EB',
                                    borderTopColor: '#EA580C', borderRightColor: '#EA580C',
                                    transform: [{ rotate: '-45deg' }]
                                }} />
                                {/* Cabezas de Flecha */}
                                <FontAwesome5 name="caret-right" size={16} color="#EA580C" style={{ position: 'absolute', top: 1, right: 10 }} />
                                <FontAwesome5 name="caret-left" size={16} color="#2563EB" style={{ position: 'absolute', bottom: 1, left: 10 }} />
                            </View>
                        </Animated.View>
                        <Text style={{ marginTop: 20, color: '#1E293B', fontWeight: 'bold', fontSize: 18, letterSpacing: 0.5 }}>Cargando detalles...</Text>
                    </View>
                )}

                {/* CLIENTE CATEGORY DETAIL */}
                {userMode === 'client' && view === 'category-detail' && selectedCategory && (
                    <CategoryDetailScreen
                        category={selectedCategory}
                        subcategories={selectedCategory.subcategories || []}
                        onBack={() => { setSelectedCategory(null); setView('home'); }}
                        onSelectSubcategory={(subcat) => {
                            setSelectedSubcategory(subcat);
                            setView('subcategory-detail');
                        }}
                    />
                )}

                {/* CLIENTE SUBCATEGORY DETAIL */}
                {userMode === 'client' && view === 'subcategory-detail' && selectedCategory && selectedSubcategory && (
                    <SubcategoryDetailScreen
                        category={selectedCategory}
                        subcategory={selectedSubcategory}
                        onBack={() => { setSelectedSubcategory(null); setView('category-detail'); }}
                        onRequestQuote={() => {
                            // TODO: Pre-fill form with category/subcategory
                            setView('home');
                        }}
                    />
                )}

                {/* CLIENTE BLOG POST */}
                {userMode === 'client' && view === 'blog-post' && selectedBlogPost && (
                    <BlogPostScreen
                        post={selectedBlogPost}
                        onBack={() => { setSelectedBlogPost(null); setView('home'); }}
                    />
                )}

                {/* ADMIN PANEL */}
                {view === 'admin' && (
                    <AdminScreens onBack={() => setView('home')} onLogout={handleLogout} />
                )}

                {/* CLIENTE MIS PEDIDOS */}
                {userMode === 'client' && view === 'my-requests' && (
                    <MyRequestsScreen
                        allRequests={myClientRequests}
                        onRefresh={loadRequests}
                        categories={categories}
                        navigation={{
                            navigate: (screen, params) => {
                                if (screen === 'RequestDetail') {
                                    handleOpenJobDetail(params.item._id || params.item.id, 'request-detail-client');
                                } else if (screen === 'Home') {
                                    setView('home');
                                }
                            },
                            addListener: () => { return () => { } }
                        }}
                    />
                )}

                {/* DETALLE CLIENTE */}
                {view === 'request-detail-client' && selectedRequest && (
                    <RequestDetailClient
                        request={selectedRequest}
                        onViewImage={setFullscreenImage}
                        onViewUserProfile={(user) => {
                            // 1. Set basic info immediately for quick navigation
                            const basicUser = { ...user, _id: user.id || user._id };
                            setSelectedUser(basicUser);
                            setShowProProfileModal(true);

                            // 2. Fetch full profile (profiles, stats, etc) in background
                            api.getPublicProfile(basicUser._id)
                                .then(fullProfile => {
                                    console.log("Full profile fetched:", fullProfile.name);
                                    setSelectedUser(prev => ({ ...prev, ...fullProfile }));
                                })
                                .catch(e => console.error("Error fetching full profile:", e));
                        }}
                        categories={categories}
                        onBack={() => setView('my-requests')}
                        onAcceptOffer={handleAcceptOffer}
                        onOpenChat={handleOpenChat}
                        selectedBudget={selectedBudget}
                        setSelectedBudget={setSelectedBudget}
                        showBudgetModal={showBudgetModal}
                        setShowBudgetModal={setShowBudgetModal}
                        startWithRejectForm={startWithRejectForm}
                        setStartWithRejectForm={setStartWithRejectForm}
                        onRejectOffer={handleRejectOffer}
                        onConfirmStart={handleConfirmStart}
                        onAddWorkPhoto={handleAddWorkPhoto}
                        onFinish={handleFinishJob}
                        onRate={handleRateMutual}
                        onTogglePortfolio={handleTogglePortfolio}
                        onUpdateRequest={async (updated) => {
                            const newReqs = allRequests.map(r => r.id === updated.id ? updated : r);
                            setAllRequests(newReqs);
                            // Force refresh detail view with populated data
                            loadRequests(); // non-blocking cache update
                            try {
                                const deepJob = await api.getJob(updated.id);
                                const mappedJob = mapJobData(deepJob);
                                setSelectedRequest(mappedJob);
                            } catch (e) {
                                console.warn("Error refreshing job data after update:", e);
                            }
                        }}
                        onCloseRequest={() => setShowCloseModal(true)}
                        currentUser={currentUser}
                        onAddTimelineEvent={handleAddTimelineEvent}
                    />
                )}

                {/* PRO HOME */}
                {userMode === 'pro' && view === 'home' && (
                    <ProHomeScreen
                        activeCategories={activeCategories}
                        showFilterBar={showFilterBar}
                        setShowFilterBar={setShowFilterBar}
                        showArchivedOffers={showArchivedOffers}
                        setShowArchivedOffers={setShowArchivedOffers}
                        filterCategory={filterCategory}
                        setFilterCategory={setFilterCategory}
                        categoryModalVisible={categoryModalVisible}
                        setCategoryModalVisible={setCategoryModalVisible}
                        jobsWithStatus={jobsWithStatus}
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        availableJobsForPro={availableJobsForPro}
                        spin={spin}
                        setView={setView}
                        getProStatusColor={getProStatusColor}
                        handleOpenJobDetail={handleOpenJobDetail}
                    />
                )}

                {/* DETALLE PRO */}
                {view === 'job-detail-pro' && selectedRequest && (
                    <JobDetailPro
                        job={selectedRequest}
                        onViewImage={setFullscreenImage}
                        onBack={() => setView('home')}
                        onSendQuote={handleProSendQuote}
                        onOpenChat={handleOpenChat}
                        proStatus={getProStatus(selectedRequest, currentUser?._id)}
                        onUpdateStatus={(s) => updateProStatus(selectedRequest.id || selectedRequest._id, s)}
                        onArchive={() => updateProStatus(selectedRequest.id || selectedRequest._id, 'Archivada')}
                        onGoToQuote={() => setView('create-quote')}
                        onViewProfile={() => setShowClientProfileModal(true)}
                        onAddWorkPhoto={handleAddWorkPhoto}
                        onFinish={handleFinishJob}
                        onRate={handleRateMutual}
                        currentUser={currentUser}
                        onAddTimelineEvent={handleAddTimelineEvent}
                        onStartJob={handleStartJob}
                        categories={categories}
                        userMode={userMode}
                        onTogglePortfolio={handleTogglePortfolio}
                    />
                )}


                {/* CREAR OFERTA */}
                {view === 'create-quote' && selectedRequest && (
                    <CreateQuoteScreen
                        job={selectedRequest}
                        onBack={() => setView('job-detail-pro')}
                        onSendQuote={handleProSendQuote}
                        currentUser={currentUser}
                    />
                )}



                {/* PERFIL PRO PÚBLICO (MODAL) */}
                <Modal visible={showProProfileModal} transparent animationType="slide" onRequestClose={() => setShowProProfileModal(false)}>
                    {selectedUser && (
                        <ProfessionalProfileScreen
                            user={selectedUser}
                            onViewImage={setFullscreenImage}
                            isOwner={false}
                            categories={categories}
                            requestedCategoryName={selectedRequest?.category?.name || selectedRequest?.category}
                            allSubcategories={
                                categories.reduce((acc, cat) => ({ ...acc, [cat.name]: cat.subcategories }), {})
                            }
                            onBack={() => setShowProProfileModal(false)}
                        />
                    )}
                </Modal>

                {/* CHAT LIST */}
                {view === 'chat-list' && (
                    <ChatListScreen
                        currentUser={currentUser}
                        userMode={userMode}
                        requests={allRequests}
                        chats={allChats} // NEW: Pass standalone chats
                        onSelectChat={handleOpenChat}
                        onBack={() => setView('home')}
                        onRefresh={onRefresh} // NEW: Allow pull-to-refresh
                        refreshing={refreshing}
                        onGoToProfile={() => setView('professional-profile')}
                    />
                )}

                {/* CHAT DETAIL */}
                {view === 'chat-detail' && selectedChatRequest && (
                    <ChatScreen
                        request={selectedChatRequest}
                        currentUser={currentUser}
                        userMode={userMode}
                        onBack={() => setView(previousView || 'chat-list')}
                        onSend={handleSendMessage}
                        onViewJob={(req) => {
                            const jobId = req.id || req._id;
                            const isClient = userMode === 'client';

                            if (isClient) {
                                // If we are in a conversation, try to find the Pro's ID
                                let proIdToOpen = null;
                                if (req.conversations && req.conversations.length > 0) {
                                    // Normally the first conv in this context is the active one
                                    proIdToOpen = req.conversations[0].proId;
                                }
                                handleOpenJobDetail(jobId, 'request-detail-client', proIdToOpen);
                            } else {
                                handleOpenJobDetail(jobId, 'job-detail-pro');
                            }
                        }}
                    />
                )}

                {/* GLOBAL BUDGET POPUP */}
                <BudgetPopup
                    visible={showBudgetModal}
                    budget={selectedBudget}
                    request={selectedRequest}
                    onClose={() => { setShowBudgetModal(false); setStartWithRejectForm(false); }}
                    onAccept={handleAcceptOffer}
                    onReject={handleRejectOffer}
                    startWithRejectForm={startWithRejectForm}
                />

                {/* PERFIL (CLIENTE O PRO) */}
                {view === 'profile' && (
                    userMode === 'client' ? (
                        <ClientProfileScreen
                            user={currentUser}
                            isOwner={true}
                            requests={allRequests}
                            onBack={() => setView('home')}
                            onLogout={handleLogout}
                            onUpdate={handleUpdateProfile}
                            onSwitchMode={setUserMode}
                        />
                    ) : (
                        <View style={{ flex: 1 }}>
                            {/* Auto-refresh user data on mount */}
                            <ProfessionalProfileRefresher
                                user={currentUser}
                                refreshUser={() => {
                                    api.getMe().then(usr => {
                                        updateUser(usr);
                                    });
                                }}
                            >
                                <ProfessionalProfileScreen
                                    user={currentUser}
                                    onViewImage={setFullscreenImage}
                                    isOwner={true}
                                    categories={categories}
                                    allSubcategories={
                                        categories.reduce((acc, cat) => ({ ...acc, [cat.name]: cat.subcategories }), {})
                                    }
                                    allZones={LOCATIONS_DATA}
                                    onBack={() => setView('home')}
                                    onLogout={handleLogout}
                                    onUpdate={handleUpdateProfile}
                                    onSwitchMode={setUserMode}
                                />
                            </ProfessionalProfileRefresher>
                        </View>
                    )
                )}
            </View>

            {/* MODAL LOGIN */}
            <Modal visible={showAuth} animationType="slide" onRequestClose={() => setShowAuth(false)}>
                <View style={{ flex: 1 }}>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 }}
                        onPress={() => setShowAuth(false)}
                    >
                        <Feather name="x" size={24} color="white" />
                    </TouchableOpacity>
                    <LoginScreen />
                </View>
            </Modal>

            {/* NAV INFERIOR */}
            <BottomNav
                view={view}
                userMode={userMode}
                isLoggedIn={isLoggedIn}
                counts={counts}
                setView={setView}
                loadRequests={loadRequests}
                setShowAuth={setShowAuth}
                markAllProInteractionsAsRead={markAllProInteractionsAsRead}
            />

            <CloseRequestModal
                visible={showCloseModal}
                onClose={() => setShowCloseModal(false)}
                onSubmit={handleCloseJobRequest}
                offers={selectedRequest?.offers || []}
            />

            <ClientProfileView
                visible={showClientProfileModal}
                onClose={() => setShowClientProfileModal(false)}
                client={selectedRequest ? {
                    _id: selectedRequest.clientId,
                    name: selectedRequest.clientName,
                    email: selectedRequest.clientEmail,
                    avatar: selectedRequest.clientAvatar,
                    location: selectedRequest.location
                } : null}
            />

            <ImageLightbox
                visible={!!fullscreenImage}
                imageUrl={fullscreenImage}
                onClose={() => setFullscreenImage(null)}
            />

            {/* El portafolio ahora se gestiona directamente desde la línea de tiempo */}
        </SafeAreaView >
    );
}


export default function App() {
    return (
        <AuthProvider>
            <ErrorBoundary>
                <SocketProvider>
                    <MainApp />
                </SocketProvider>
            </ErrorBoundary>
        </AuthProvider>
    );
}

// --- ESTILOS GENERALES ---


