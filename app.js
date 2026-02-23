
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications'; // Import Notifications
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    LogBox,
    Modal,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// --- IMPORTS DE UTILIDADES ---
// V13 Update
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
import SubcategoryDetailScreen from './src/screens/SubcategoryDetailScreen';
import { api } from './src/utils/api';
import * as AuthLocal from './src/utils/auth_local';
import { registerForPushNotificationsAsync } from './src/utils/push'; // Add Push Utility
import { setRequests } from './src/utils/requests';
import { saveSession } from './src/utils/session';

import { SectionDivider } from './src/components/Dividers';
import Header from './src/components/Header';
import { BLOG_POSTS, HOME_COPY_OPTIONS, LOCATIONS_DATA } from './src/constants/data';
import styles from './src/styles/globalStyles';
import { areIdsEqual, getClientStatus, getProStatus, getProStatusColor, showAlert } from './src/utils/helpers';

// Ignorar advertencias específicas de deprecación de react-native-web en el navegador
LogBox.ignoreLogs([
    'expo-notifications:',
    'props.pointerEvents is deprecated',
    'props.pointerEvents is deprecated. Use style.pointerEvents',
    'Animated: `useNativeDriver` is not supported'
]);

// Fallback para Web: interceptar console.warn para mensajes persistentes de librerías
if (Platform.OS === 'web') {
    const originalWarn = console.warn;
    console.warn = (...args) => {
        if (typeof args[0] === 'string' && (
            args[0].includes('props.pointerEvents') ||
            args[0].includes('expo-notifications') ||
            args[0].includes('useNativeDriver')
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

import { CAT_ICONS, ICON_MAP, IconAuto, IconBeauty, IconEvents, IconHogar, IconLegal, IconPets, IconSalud, IconTech } from './src/constants/icons';

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

const QuickActionsRow = ({ onActionPress, categories }) => {
    // 1. Flatten all subcategories and filter isUrgent
    const urgentSubs = [];
    (categories || []).forEach(cat => {
        (cat.subcategories || []).forEach(sub => {
            if (typeof sub === 'object' && sub.isUrgent) {
                urgentSubs.push({
                    name: sub.name,
                    icon: sub.icon,
                    category: cat.name,
                    color: cat.color || '#F3F4F6'
                });
            }
        });
    });

    // 2. Limit to 6
    const actions = urgentSubs.slice(0, 6);

    if (actions.length === 0) return null;

    // Calcular el tamaño proporcional para que se vean más discretos pero claros
    const ITEM_SIZE = width / 8.8;

    return (
        <View style={{
            marginTop: 15,
            marginBottom: 25,
            flexDirection: 'row',
            justifyContent: 'space-around', // Mejor distribución para tamaños pequeños
            alignItems: 'center',
            paddingHorizontal: 10
        }}>
            {actions.map((action, index) => {
                const iconData = CAT_ICONS[action.icon] || { lib: Feather, name: 'layers' };
                const Lib = iconData.lib;
                return (
                    <TouchableOpacity
                        key={index}
                        onPress={() => onActionPress(action.category, action.name)}
                        style={{ alignItems: 'center' }}
                        activeOpacity={0.6}
                    >
                        <View style={{
                            width: ITEM_SIZE,
                            height: ITEM_SIZE,
                            borderRadius: ITEM_SIZE / 2,
                            backgroundColor: '#F1F5F9', // Gris neutro claro
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1.5,
                            borderColor: '#E2E8F0', // Borde sutil
                            // Sombras muy minimalistas
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1
                        }}>
                            <Lib name={iconData.name} size={ITEM_SIZE * 0.5} color="#475569" />
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

// Header and CustomDropdown are imported from src/components


// --- 3. SECCIONES DE CONTENIDO (BLOG, ETC) ---
const HomeSections = ({ onSelectCategory, onSelectPost, categories, articles }) => {
    const displayCategories = (categories && categories.length > 0) ? categories : [];
    const displayArticles = (articles && articles.length > 0) ? articles : BLOG_POSTS;

    return (
        <View style={{ backgroundColor: 'transparent' }}>
            {/* Categorías */}
            <View style={{ backgroundColor: 'white', marginHorizontal: 4, borderRadius: 24, borderWidth: 1, borderColor: '#FFF7ED', shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, paddingHorizontal: 20, paddingVertical: 24 }}>
                <Text style={styles.sectionTitle}>Categorías Populares</Text>
                <View style={styles.categoriesGrid}>
                    {displayCategories.slice(0, 9).map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.catCard}
                            onPress={() => onSelectCategory(cat)}
                        >
                            <View style={[styles.catIconCircle, { backgroundColor: cat.color || '#F3F4F6', marginBottom: 6 }]}>
                                <cat.icon size={24} color={cat.iconColor || "#EA580C"} />
                            </View>
                            <Text style={[styles.catTextCard, { textAlign: 'center' }]} numberOfLines={2}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <SectionDivider />

            {/* Cómo funciona */}
            <View style={[styles.howToCard, { marginBottom: 0, marginHorizontal: 4, borderRadius: 24, borderWidth: 1, borderColor: '#FFF7ED', elevation: 5, shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }]}>
                <View style={styles.howToHeader}>
                    <Text style={styles.howToTitle}>¿Cómo funciona?</Text>
                    <Text style={styles.howToSubtitle}>Resuelve tu problema en 3 pasos</Text>
                </View>
                <View style={styles.stepsRow}>
                    <View style={styles.step}>
                        <View style={[styles.stepBadge, { backgroundColor: '#FFEDD5' }]}><Text style={[styles.stepNumber, { color: '#EA580C' }]}>1</Text></View>
                        <Text style={styles.stepLabel}>Pide</Text>
                    </View>
                    <View style={styles.step}>
                        <View style={[styles.stepBadge, { backgroundColor: '#DBEAFE' }]}><Text style={[styles.stepNumber, { color: '#2563EB' }]}>2</Text></View>
                        <Text style={styles.stepLabel}>Recibe</Text>
                    </View>
                    <View style={styles.step}>
                        <View style={[styles.stepBadge, { backgroundColor: '#DCFCE7' }]}><Text style={[styles.stepNumber, { color: '#16A34A' }]}>3</Text></View>
                        <Text style={styles.stepLabel}>Elige</Text>
                    </View>
                </View>
                <View style={{ alignItems: 'center', paddingBottom: 25 }}>
                    <View style={{ width: '90%', height: 180, borderRadius: 20, overflow: 'hidden', position: 'relative', marginTop: 10, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1581578731522-5b17b88bb7d5?auto=format&fit=crop&w=800&q=80' }}
                            style={{ width: '100%', height: '100%' }}
                        />
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)' }}>
                            <View style={{ backgroundColor: '#FF0000', width: 68, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}>
                                <Feather name="play" size={28} color="white" />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

// --- COMPONENT: URGENCY BANNER ---
// --- COMPONENT: URGENCY BANNER ---
const UrgencyBanner = ({ onPress, onActionPress, categories }) => {
    // Logic from QuickActionsRow to get urgent subcategories
    const urgentSubs = [];
    (categories || []).forEach(cat => {
        (cat.subcategories || []).forEach(sub => {
            if (typeof sub === 'object' && sub.isUrgent) {
                urgentSubs.push({
                    name: sub.name,
                    icon: sub.icon,
                    category: cat.name,
                    color: cat.color || '#F3F4F6',
                    emergencyIcon: sub.emergencyIcon // Added support for custom emergency icon
                });
            }
        });
    });

    const actions = urgentSubs.slice(0, 5); // Limit to 5 for better layout in banner

    return (
        <View style={{ marginHorizontal: 4, marginTop: 0, marginBottom: 0 }}>
            <View
                style={{
                    backgroundColor: 'white',
                    borderRadius: 24,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: '#FFF7ED',
                    shadowColor: '#EA580C',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    elevation: 5
                }}
            >
                {/* Icons inside the banner (moved to top) */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 25, backgroundColor: 'rgba(249,250,251,0.5)', borderRadius: 24, paddingVertical: 15 }}>
                    {actions.map((action, index) => {
                        const IconComponent = ICON_MAP[action.icon] || ICON_MAP['default'];
                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={() => onActionPress(action.category, action.name)}
                                style={{ alignItems: 'center', flex: 1 }}
                                activeOpacity={0.7}
                            >
                                <View style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 28,
                                    backgroundColor: 'white',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 1.5,
                                    borderColor: '#FED7AA',
                                    elevation: 2,
                                    overflow: 'hidden'
                                }}>
                                    {action.emergencyIcon ? (
                                        <Image source={{ uri: action.emergencyIcon }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                    ) : (
                                        <IconComponent size={26} color="#EA580C" />
                                    )}
                                </View>
                                <Text style={{ fontSize: 9, color: '#4B5563', fontWeight: 'bold', marginTop: 8, textAlign: 'center' }} numberOfLines={1}>{action.name}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Title and Subtitle centered (moved to bottom) */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={onPress}
                    style={{ alignItems: 'center', justifyContent: 'center' }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{
                            width: 32, height: 32,
                            borderRadius: 16,
                            backgroundColor: '#FFEDD5',
                            justifyContent: 'center', alignItems: 'center',
                            marginRight: 10,
                            borderWidth: 1,
                            borderColor: '#FED7AA'
                        }}>
                            <Feather name="zap" size={18} color="#EA580C" />
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111811' }}>Urgencias 24/7</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>Expertos listos para salir ahora mismo.</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

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
        if (user.email && job.client?.email) {
            if (user.email.trim().toLowerCase() === job.client.email.trim().toLowerCase()) return false;
        }

        // 2. Profile Categories & Zones
        const myProfiles = user.profiles || {};
        const activeProfileKeys = Object.keys(myProfiles).filter(key => {
            const p = myProfiles[key];
            return p && p.isActive !== false;
        });

        if (activeProfileKeys.length === 0) return false;

        const jobCategoryName = job.category?.name || job.category;
        const jobSubcategoryName = job.subcategory?.name || job.subcategory;
        const jobLocation = job.location;

        return activeProfileKeys.some(profileCatName => {
            if (profileCatName !== jobCategoryName) return false;

            const profile = myProfiles[profileCatName];

            // Zone Check
            const profileZones = profile.zones || [];
            if (profileZones.length > 0) {
                const jobLocNormalized = (jobLocation || '').trim();
                const hasZone = profileZones.some(z => z.trim() === jobLocNormalized);
                if (!hasZone) return false;
            } else {
                // If no zones defined, maybe strict or loose? Assuming strict based on previous code
                return false;
            }

            // Subcategory Check
            const profileSubs = profile.subcategories || [];
            if (profileSubs.length > 0) {
                if (jobSubcategoryName && !profileSubs.includes(jobSubcategoryName)) return false;
            }

            return true;
        });
    }, []);

    // --- ESTADO GLOBAL (Data) ---
    const [allRequests, setAllRequests] = useState([]);
    const [allChats, setAllChats] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
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
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [selectedBlogPost, setSelectedBlogPost] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedChatRequest, setSelectedChatRequest] = useState(null);
    // --- ESTADO DATOS DINÁMICOS ---
    const [categories, setCategories] = useState(CATEGORIES_DISPLAY);
    const [articles, setArticles] = useState([]);

    // --- ESTADO PRO/INTERACCIONES ---
    const [proInteractions, setProInteractions] = useState({});
    const [filterCategory, setFilterCategory] = useState('Todas');
    const [filterStatus, setFilterStatus] = useState('Todas');
    const [counts, setCounts] = useState({ client: { chats: 0, updates: 0 }, pro: { chats: 0, updates: 0 } });

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
    const [showClientProfileModal, setShowClientProfileModal] = useState(false);

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

    // --- NOTIFICATION & SOCKET SETUP ---
    useEffect(() => {
        const setupNotifications = async () => {
            if (isLoggedIn && userInfo?._id) {
                // 1. Register Push Token and Save to Backend
                const token = await registerForPushNotificationsAsync();
                if (token) {
                    console.log("Push Token obtained:", token);

                    // Delay the API call slightly to ensure AsyncStorage has finished writing the new session token
                    // after a fresh login. Otherwise, api.js might read a null token and get a 401.
                    setTimeout(async () => {
                        try {
                            // Only update if it's different or just to be safe
                            console.log("Attempting to sync push token to backend...");
                            await api.updateProfile({ pushToken: token });
                            console.log("Push Token synced with backend.");
                        } catch (e) {
                            console.log("Error syncing push token (Safe ignore if just logged in):", e.message);
                        }
                    }, 1000);
                }

                // 2. Join Socket Room
                if (socket) {
                    socket.emit('join_user_dates', userInfo._id);

                    // 3. Listen for Socket Notifications (Real-time)
                    socket.off('notification'); // Prevent duplicates
                    socket.on('notification', (data) => {
                        console.log("Socket Notification:", data);
                        // Show local notification immediately
                        if (Platform.OS !== 'web') {
                            Notifications.scheduleNotificationAsync({
                                content: {
                                    title: data.title,
                                    body: data.body,
                                    data: { jobId: data.jobId },
                                    sound: 'default'
                                },
                                trigger: null,
                            });
                        }

                        // Optional: Refresh data if needed
                        setCounts(prev => {
                            const isClient = userMode === 'client';
                            const type = isClient ? 'client' : 'pro';
                            return { ...prev, [type]: { ...prev[type], updates: prev[type].updates + 1 } };
                        });
                    });
                }
            }
        };

        setupNotifications();

        // Listeners for Foreground/Response
        let bgSubscription;
        if (Platform.OS !== 'web') {
            bgSubscription = Notifications.addNotificationResponseReceivedListener(response => {
                const data = response.notification.request.content.data;
                if (data?.jobId) {
                    // Navigate to job detail
                    console.log("Notification tapped, navigating to job:", data.jobId);
                    // Logic to navigate can be added here if 'navigation' ref was available, 
                    // or by setting state that triggers view change.
                    // For now, we rely on user opening app and seeing update.
                }
            });
        }

        return () => {
            if (socket) socket.off('notification');
            if (bgSubscription) bgSubscription.remove();
        };
    }, [isLoggedIn, userInfo, socket, userMode]);

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
        if (!allRequests) return;

        let clientChatCount = 0;
        let clientUpdateCount = 0;
        let proChatCount = 0;
        let proUpdateCount = 0;

        allRequests.forEach(req => {
            const isClientJob = !req.isVirtual; // Assuming virtual/market jobs vs user jobs

            if (userMode === 'client') { // Count for client view
                if (req.offers?.some(o => o.status === 'pending')) clientUpdateCount++;
                if (req.conversations) req.conversations.forEach(c => clientChatCount += (c.unreadCount || 0));
            } else { // Count for pro view
                // FILTER: Only count if it matches my profile!
                const isMatch = isJobMatchingProfile(req, currentUser);
                if (isMatch && req.proInteractionStatus === 'new') proUpdateCount++;

                // For chats, we usually only have chats on jobs we interacted with, so this is likely fine.
                // But conceptually, if I have a chat, I should count it regardless of profile match (e.g. if I changed profile later).
                if (req.conversations) req.conversations.forEach(c => proChatCount += (c.unreadCount || 0));
            }
        });

        // Simplified counts for stability
        setCounts({
            client: { chats: clientChatCount, updates: clientUpdateCount },
            pro: { chats: proChatCount, updates: proUpdateCount }
        });
    }, [allRequests, userMode]);






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
                    const freshData = res.data || res;
                    setSelectedRequest(freshData);
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

            // Refresh full list and especially the selected request
            const updatedRequests = await loadRequests();

            // Sync local selection state selecting the updated job from the mapped list
            const updatedJob = (updatedRequests || []).find(r => r._id === jobId || r.id === jobId);
            if (updatedJob) {
                setSelectedRequest(updatedJob);
            }
        } catch (e) {
            showAlert("Error", e.message);
        }
    };





    // --- FUNCTION: LOAD CHATS (Standalone) ---
    const loadChats = async (explicitMode = null) => {
        if (!isLoggedIn) return;
        try {
            const targetMode = explicitMode || userMode;
            // Fetch chats filtered by the current role strictly as requested
            const chats = await api.getChats({ role: targetMode });
            if (Array.isArray(chats)) {
                setAllChats(chats);
            }
        } catch (e) {
            console.warn("[App] Error loading chats:", e);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([loadRequests(), loadChats()]);
        setRefreshing(false);
    }, [isLoggedIn]);

    // Legacy handleLogin and session restore removed (handled by AuthContext)

    // Cargar solicitudes desde el BACKEND al iniciar la app
    const loadRequests = async (explicitMode = null) => {
        try {
            // Updated logic to support explicit mode switching
            const targetMode = explicitMode || userMode;
            const currentUserId = currentUser?._id || currentUser?.id;

            let jobs = [];
            if (targetMode === 'pro') {
                // Fetch BOTH Market and My History to show everything
                const [marketJobs, myJobs] = await Promise.all([
                    api.getJobs(),
                    isLoggedIn ? api.getMyJobs({ role: 'pro' }) : Promise.resolve([])
                ]);

                console.log(`[DEBUG loadRequests] Market: ${marketJobs.length}, MyJobs: ${myJobs.length}`);
                if (myJobs.length > 0) {
                    const jobWithOffers = myJobs.find(j => j.offers && j.offers.length > 0);
                    if (jobWithOffers) {
                        console.log(`[DEBUG loadRequests] Found job with offers in MyJobs: ${jobWithOffers._id}`,
                            JSON.stringify(jobWithOffers.offers.map(o => ({
                                id: o._id, proId: o.proId, status: o.status
                            }))));
                    } else {
                        console.log(`[DEBUG loadRequests] No offers found in any of the ${myJobs.length} MyJobs`);
                    }
                }

                // Tag My Jobs correctly based on ownership
                // GET /me returns both Created(Client) and Interacted(Pro) jobs.
                // We must distinguish them.
                // const currentUserId = user?._id || user?.id; // MOVED UP

                const myJobsTagged = myJobs.map(j => {
                    const cVal = j.client;
                    const cId = (cVal && typeof cVal === 'object') ? cVal._id : cVal;
                    // Check strict equality dealing with ObjectId/String
                    const isCreator = currentUserId && cId && String(cId) === String(currentUserId);
                    return { ...j, _isMyClientJob: isCreator };
                });

                // Merge unique by ID
                const jobMap = new Map();
                marketJobs.forEach(j => jobMap.set(j._id, j)); // Market jobs
                myJobsTagged.forEach(j => jobMap.set(j._id, j)); // My jobs overwrite market (preserving tag)

                jobs = Array.from(jobMap.values());

                // --- NOTE: We DO NOT filter 'My Client Jobs' here anymore.
                // We need them in 'allRequests' so ChatListScreen can identify ownership.
                // We will filter them out in the VIEW (Home Screen) instead.
                /*
                if (currentUser) {
                    const myId = currentUser._id || currentUser.id;
                    jobs = jobs.filter(j => {
                        const cId = j.client?._id || j.client;
                        return !areIdsEqual(cId, myId);
                    });
                }
                */
            } else {
                const allData = isLoggedIn ? await api.getMyJobs() : await api.getJobs();
                // FIX: Only filter if we have a valid logged in user AND the API returned all jobs instead of my jobs
                // api.getMyJobs already filters by user in backend, so client-side filtering is risky if currentUser is stale.
                // We will trust the backend response if isLoggedIn is true.

                if (isLoggedIn && currentUser && allData.length > 0) {
                    // Verify if the backend actually returned "all jobs" (market) instead of "my jobs"
                    // This could happen if getMyJobs fails back to getJobs or similar logic.
                    // A simple heuristic: if ALL jobs belong to me, it's fine.
                    // If I see jobs not mine, I should filter.
                    const hasForeignJobs = allData.some(j => {
                        const cId = j.client?._id || j.client;
                        return !areIdsEqual(cId, currentUser._id);
                    });

                    /*
                    if (hasForeignJobs) {
                        console.log("Filtering foreign jobs from My Requests view");
                        jobs = allData.filter(j => {
                           const cId = j.client?._id || j.client;
                           return areIdsEqual(cId, currentUser._id);
                       });
                    } else {
                        jobs = allData;
                    }
                    */
                    // BYPASS: No filtrar nada en lado cliente para "My Requests" por ahora
                    jobs = allData;
                } else {
                    jobs = allData;
                }
            }
            const mappedJobs = jobs.map(job => {
                // Ensure category is an object for Consistent UI rendering
                let catObj = { name: 'General' };
                if (job.category && typeof job.category === 'object') {
                    catObj = {
                        _id: job.category._id,
                        name: job.category.name,
                        color: job.category.color,
                        icon: job.category.icon
                    };
                } else if (typeof job.category === 'string') {
                    catObj = { name: job.category };
                }

                return {
                    id: job._id,
                    _id: job._id,
                    title: job.title,
                    description: job.description,
                    category: catObj,
                    subcategory: typeof job.subcategory === 'object' ? job.subcategory.name : job.subcategory,
                    location: job.location,
                    status: (job.status === 'active' || job.status === 'open') ? 'Abierto' :
                        (job.status === 'rated' || job.status === 'VALORACIÓN') ? 'TERMINADO' :
                            (job.status === 'completed' ? 'Culminada' :
                                (job.status === 'canceled' ? 'Cerrada' :
                                    (job.status === 'in_progress' ? 'En Ejecución' : job.status))),
                    budget: job.budget,
                    images: job.images,
                    createdAt: job.createdAt,
                    clientName: job.client?.name || 'Usuario',
                    clientEmail: job.client?.email,
                    clientAvatar: job.client?.avatar,
                    clientId: job.client?._id,
                    professional: job.professional,
                    trackingStatus: job.trackingStatus || 'none',
                    workStartedOnTime: job.workStartedOnTime,
                    workPhotos: job.workPhotos || [],
                    clientFinished: job.clientFinished,
                    proFinished: job.proFinished,
                    clientRated: job.clientRated || false,
                    proRated: job.proRated || false,
                    proInteractionStatus: job.proInteractionStatus || 'new',
                    proInteractionHasUnread: job.proInteractionHasUnread || false,
                    isVirtual: job.isVirtual,
                    _isMyClientJob: job._isMyClientJob || false,
                    projectHistory: job.projectHistory || [],
                    clientManagement: job.clientManagement || {},
                    conversations: job.conversations || [],
                    _myOfferStatus: currentUserId ? job.offers?.find(o => {
                        const pId = o.proId?._id || o.proId;
                        return String(pId) === String(currentUserId);
                    })?.status : undefined,
                    offers: job.offers?.map(o => ({
                        ...o,
                        proId: o.proId?._id || o.proId,
                        proName: o.proId?.name || 'Profesional',
                        proImage: o.proId?.avatar,
                        proRating: o.proId?.rating || 5.0,
                        proReviewsCount: o.proId?.reviewsCount || 0
                    })) || []
                };
            });

            // SORT: Active first, Closed last. Newest first within groups.
            mappedJobs.sort((a, b) => {
                const isClosedA = a.status === 'Culminada' || a.status === 'Cerrada' || a.status === 'TERMINADO';
                const isClosedB = b.status === 'Culminada' || b.status === 'Cerrada' || b.status === 'TERMINADO';

                if (isClosedA !== isClosedB) {
                    return isClosedA ? 1 : -1;
                }
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            // Aggressive stripping of heavy data (Base64) before local storage
            const stripHeavyData = (obj) => {
                if (!obj || typeof obj !== 'object') return obj;
                if (Array.isArray(obj)) return obj.map(stripHeavyData);

                const newObj = { ...obj };
                ['avatar', 'image', 'images', 'workPhotos', 'gallery', 'projectHistory', 'clientManagement'].forEach(key => {
                    if (key in newObj) {
                        if (key === 'images' || key === 'workPhotos' || key === 'gallery' || key === 'projectHistory') {
                            newObj[key] = [];
                        } else {
                            newObj[key] = null;
                        }
                    }
                });

                // Recursive stripping for nested objects like offers/client/proId
                ['client', 'professional', 'proId', 'offers'].forEach(key => {
                    if (newObj[key]) newObj[key] = stripHeavyData(newObj[key]);
                });

                return newObj;
            };

            const lightweightJobs = stripHeavyData(mappedJobs);

            try {
                await setRequests(lightweightJobs);
            } catch (err) {
                console.warn("[App] Failed to save lightweight jobs, storage might be completely full.");
            }

            setAllRequests(mappedJobs);
            return mappedJobs;
        } catch (e) {
            console.warn('Error cargando solicitudes desde API:', e);
            return [];
        }
    };

    useEffect(() => {
        const initLoad = async () => {
            setRefreshing(true);
            await Promise.all([loadRequests(), loadChats()]);
            setRefreshing(false);
        };
        initLoad();

        // AUTO-REFRESH (Polling): Actualiza la app automáticamente cada 15 segundos
        // Esto permite que aparezcan nuevas solicitudes y mensajes sin refrescar manualmente.
        let interval;
        if (isLoggedIn) {
            console.log("[AutoRefresh] Iniciando polling cada 15s...");
            interval = setInterval(() => {
                // Solo recargamos si no estamos ya refrescando o editando algo crítico
                // y si la vista NO es un formulario de creación de trabajo para evitar perder datos si estuviera escribiendo
                // Skip polling if we are in views where a sudden refresh might be disruptive or slow down interaction
                if (!refreshing && view !== 'create-request' && view !== 'service-form' && view !== 'chat-detail' && view !== 'chat-list') {
                    loadRequests();
                    loadChats();
                }
            }, 15000);
        }

        return () => {
            if (interval) {
                console.log("[AutoRefresh] Limpiando polling.");
                clearInterval(interval);
            }
        };
    }, [isLoggedIn, userMode, view]); // Eliminado 'refreshing' para evitar bucle infinito

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

    const handleOpenJobDetail = async (jobId, targetView) => {
        try {
            const fullJob = await api.getJob(jobId);

            const mappedJob = {
                id: fullJob._id,
                _id: fullJob._id,
                title: fullJob.title,
                description: fullJob.description,
                category: fullJob.category?.name || 'General',
                subcategory: fullJob.subcategory,
                location: fullJob.location,
                status: fullJob.status === 'active' ? 'Abierto' : (fullJob.status === 'in_progress' ? 'En Progreso' : (fullJob.status === 'completed' ? 'Finalizado' : (fullJob.status === 'canceled' ? 'Cerrado' : fullJob.status))),
                budget: fullJob.budget,
                images: fullJob.images,
                createdAt: fullJob.createdAt,
                clientName: fullJob.client?.name || 'Usuario',
                clientEmail: fullJob.client?.email,
                clientAvatar: fullJob.client?.avatar,
                clientId: fullJob.client?._id,
                professional: fullJob.professional,
                trackingStatus: fullJob.trackingStatus || 'none',
                workStartedOnTime: fullJob.workStartedOnTime,
                workPhotos: fullJob.workPhotos || [],
                clientFinished: fullJob.clientFinished,
                proFinished: fullJob.proFinished,
                conversations: fullJob.conversations || [],
                offers: fullJob.offers?.map(o => ({
                    ...o,
                    proId: o.proId?._id,
                    proName: o.proId?.name || 'Profesional',
                    proAvatar: o.proId?.avatar
                })) || [],
                proInteractionStatus: fullJob.proInteraction?.status || 'new'
            };

            // DYNAMIC STATUS CALCULATION (Sync with List View)
            mappedJob.proStatus = userMode === 'pro' ? getProStatus(fullJob, currentUser?._id) : 'NUEVA';
            mappedJob.clientStatus = getClientStatus(fullJob);

            setSelectedRequest(mappedJob);
            setView(targetView);

            // AUTO-UPDATE STATUS TO Viewed (ABIERTA)
            if (userMode === 'pro' && targetView === 'job-detail-pro') {
                const currentStatus = fullJob.proInteractionStatus || 'new';
                if (currentStatus === 'new') {
                    updateProStatus(jobId, 'ABIERTA');
                }
                api.markInteractionAsRead(jobId).catch(console.warn);
            } else if (userMode === 'client' && targetView === 'request-detail-client') {
                // Client viewed their own job. If we wanted to persistent seen status for offers, we'd do it here.
                // For now, let's at least ensure local count is reduced if we tracking new offers specially
            }
        } catch (e) {
            console.warn("Error opening job details:", e);
            showAlert("Error", "No se pudieron cargar los detalles de la solicitud.");
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

            // 5. Enviar mensaje al backend y obtener respuesta
            const response = await api.sendMessage(realChatId, messageContent);
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
        } catch (e) {
            console.warn('Error enviando mensaje:', e);
            showAlert('Error', 'No se pudo enviar el mensaje.');

            // EMERGENCY: If we still hit quota, maybe clear the whole storage once
            if (e.message && e.message.includes('quota') && Platform.OS === 'web') {
                console.warn("EMERGENCY: Clearing localStorage due to persistent quota error.");
                localStorage.clear();
            }
        }
    };

    const handleStartJob = async () => {
        if (!selectedRequest) return;
        try {
            const jobId = selectedRequest.id || selectedRequest._id;
            const res = await api.confirmStart(jobId, true);

            // Update local state
            setAllRequests(prev => prev.map(r => (r._id || r.id) === jobId ? res : r));
            setSelectedRequest(res);

            showAlert('Trabajo Iniciado', 'La bitácora de trabajo ha sido activada.');
        } catch (error) {
            console.error("Error starting job:", error);
            showAlert('Error', 'No se pudo iniciar el trabajo.');
        }
    };

    const handleFinishJob = async (jobIdVal) => {
        const jId = jobIdVal || selectedRequest?.id || selectedRequest?._id;
        if (!jId) return;

        try {
            // Call PUT /:id/finish
            const res = await api.finishJobByStatus(jId);

            // Update local state
            const updatedJob = res.data || res;
            setAllRequests(prev => prev.map(r => (r._id || r.id) === jId ? updatedJob : r));
            if (selectedRequest && (selectedRequest.id === jId || selectedRequest._id === jId)) {
                setSelectedRequest(updatedJob);
            }

            showAlert('Trabajo Finalizado', 'Notifica al cliente para que revise y cierre la solicitud.');
        } catch (error) {
            console.error("Error finishing job:", error);
            showAlert('Error', 'No se pudo finalizar el trabajo.');
        }
    };

    const handleAddWorkPhoto = async (jobId, imageBase64) => {
        try {
            await api.uploadWorkPhoto(jobId, imageBase64);

            // Refresh
            const res = await api.getJob(jobId);
            const updatedJob = res.data || res;
            setAllRequests(prev => prev.map(r => (r._id || r.id) === jobId ? updatedJob : r));
            setSelectedRequest(updatedJob);
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

                const newEvent = {
                    eventType: 'photo_uploaded',
                    title: 'Foto de Evidencia',
                    description: 'Foto cargada durante el trabajo.',
                    mediaUrl: `data:image/jpeg;base64,${result.assets[0].base64}`,
                    isPrivate: eventData.isPrivate || false
                };

                const res = await api.addTimelineEvent(jobId, newEvent);
                setSelectedRequest(res);
                return;
            }

            const res = await api.addTimelineEvent(jobId, eventData);
            setSelectedRequest(res);
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
            if (isUpdating) {
                await api.updateOffer(jobId, quoteData);
                // Sync interaction status on update as well
                updateProStatus(jobId, 'PRESUPUESTADA');
                showAlert("Actualizado", "Tu oferta ha sido actualizada.");
            } else {
                await api.createOffer(jobId, quoteData);
                // First interaction, set status to Offered/Presupuestada
                updateProStatus(jobId, 'PRESUPUESTADA');
                showAlert("Enviado", "Tu oferta ha sido enviada.");
            }
            // Recargar datos COMPLETOS
            await loadRequests();
            // Recargar perfil del usuario para actualizar contadores (Chats, Ofertas, etc)
            try {
                const freshUser = await api.getMe();
                await updateUser(freshUser);
            } catch (err) {
                console.warn("Could not reload user profile:", err);
            }

            // RESET FILTERS so the new status 'PRESUPUESTADO' is visible
            setFilterStatus('Todas');
            setFilterCategory('Todas');

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
                loadRequests();
            }
        } catch (e) {
            showAlert("Error", e.message);
        }
    };





    const myClientRequests = allRequests.filter(r => {
        // STRICT filter for "My Requests" screen
        if (r.clientId && currentUser?._id) return areIdsEqual(r.clientId, currentUser._id);
        const emailMatch = r.clientEmail && currentUser?.email ? r.clientEmail === currentUser.email : false;
        return emailMatch || r.clientName === currentUser?.name;
    });

    // --- LOGICA DE FILTRADO AVANZADO PARA PRO ---
    // Only calculate active categories if we are in PRO mode or checking pro capabilities
    const activeCategories = (userMode === 'pro' && currentUser?.profiles)
        ? Object.keys(currentUser.profiles).filter(k => currentUser.profiles[k].isActive !== false)
        : [];

    // 1. Filtrar base - SIN FILTROS (RAW)
    const matchingJobs = allRequests.filter(r => {
        // TEMPORAL: Retornar todo para verificar flujo de datos
        // Ya no filtramos por "My Own Job", "Profile Categories", "Zones" ni "Closed Status"
        return true;
    });



    // 2. Enriquecer con estado local/backend del pro (DYNAMIC CALCULATION)
    const jobsWithStatus = matchingJobs.map(job => {
        const myId = currentUser?._id;
        const uiStatus = getProStatus(job, myId);

        // LOGIC FIX: Check local state first, then fallback to backend state
        const localInteraction = proInteractions[job.id];
        const computedHasUnread = localInteraction ? localInteraction.hasUnread : (job.proInteractionHasUnread || false);

        return {
            ...job,
            proStatus: uiStatus,
            hasUnread: computedHasUnread
        };
    });

    // 3. Aplicar filtros de UI y Lógica de "Ofertas Anteriores"
    const availableJobsForPro = jobsWithStatus.filter(job => {
        // --- 1. FILTROS DE UI (Categoría y Archivados) ---
        const catMatch = filterCategory === 'Todas' || (job.category?.name || job.category) === filterCategory;
        const isArchived = job.proStatus === 'Archivada' ||
            job.proStatus === 'TERMINADO' ||
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
        return isJobMatchingProfile(job, currentUser);
    });



    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
                <ActivityIndicator size="large" color="#EA580C" />
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
                    <ScrollView style={{ flex: 1, backgroundColor: '#F8F9FA' }} contentContainerStyle={{ paddingBottom: 0 }}>
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
                            setView('professional-profile-public');

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
                        onRejectOffer={handleRejectOffer}
                        onConfirmStart={handleConfirmStart}
                        onAddWorkPhoto={handleAddWorkPhoto}
                        onFinish={handleFinishJob}
                        onRate={handleRateMutual}
                        onTogglePortfolio={handleTogglePortfolio}
                        onUpdateRequest={async (updated) => {
                            const newReqs = allRequests.map(r => r.id === updated.id ? updated : r);
                            setAllRequests(newReqs);
                            // Force refresh detail view
                            const updatedRequests = await loadRequests();
                            const updatedSelected = (updatedRequests || []).find(r => (r._id === updated.id || r.id === updated.id));
                            if (updatedSelected) setSelectedRequest(updatedSelected);
                        }}
                        onCloseRequest={() => setShowCloseModal(true)}
                        currentUser={currentUser}
                        onAddTimelineEvent={handleAddTimelineEvent}
                    />
                )}

                {/* PRO HOME */}
                {userMode === 'pro' && view === 'home' && (
                    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                        {/* HEADER AZUL */}
                        <View style={{ backgroundColor: '#2563EB', paddingVertical: 18, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 0, marginBottom: 0, paddingHorizontal: 24 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: showFilterBar && activeCategories.length > 1 ? 8 : 0 }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Ofertas</Text>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    {activeCategories.length > 1 && (
                                        <TouchableOpacity
                                            onPress={() => setShowFilterBar(!showFilterBar)}
                                            style={{
                                                width: 48, height: 48, borderRadius: 24,
                                                backgroundColor: showFilterBar ? 'white' : 'rgba(255,255,255,0.2)',
                                                justifyContent: 'center', alignItems: 'center'
                                            }}
                                        >
                                            <Feather name="filter" size={24} color={showFilterBar ? '#2563EB' : 'white'} />
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        onPress={() => setShowArchivedOffers(!showArchivedOffers)}
                                        style={{
                                            width: 48, height: 48, borderRadius: 24,
                                            backgroundColor: showArchivedOffers ? 'white' : 'rgba(255,255,255,0.2)',
                                            justifyContent: 'center', alignItems: 'center'
                                        }}
                                    >
                                        <Feather name="archive" size={24} color={showArchivedOffers ? '#2563EB' : 'white'} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* FILTERS - CATEGORY ONLY */}
                            {showFilterBar && activeCategories.length > 1 && (
                                <View style={{ flexDirection: 'row', paddingHorizontal: 0, gap: 10, marginTop: 8 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4, fontWeight: 'bold' }}>Categoría</Text>
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

                            {/* MODALS */}
                            <Modal
                                visible={categoryModalVisible}
                                transparent={true}
                                animationType="fade"
                                onRequestClose={() => setCategoryModalVisible(false)}
                            >
                                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCategoryModalVisible(false)}>
                                    <View style={styles.modalContent}>
                                        <Text style={styles.modalTitle}>Filtrar por Categoría</Text>
                                        <ScrollView style={{ maxHeight: 300 }}>
                                            <TouchableOpacity
                                                style={[styles.modalOption, filterCategory === 'Todas' && styles.modalOptionSelected]}
                                                onPress={() => {
                                                    setFilterCategory('Todas');
                                                    setCategoryModalVisible(false);
                                                }}
                                            >
                                                <Text style={[styles.modalOptionText, filterCategory === 'Todas' && styles.modalOptionTextSelected]}>Todas</Text>
                                                {filterCategory === 'Todas' && <Feather name="check" size={16} color="#2563EB" />}
                                            </TouchableOpacity>
                                            {[...new Set(jobsWithStatus.map(j => j.category))].sort().map((cat, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={[styles.modalOption, filterCategory === cat && styles.modalOptionSelected]}
                                                    onPress={() => {
                                                        setFilterCategory(cat);
                                                        setCategoryModalVisible(false);
                                                    }}
                                                >
                                                    <Text style={[styles.modalOptionText, filterCategory === cat && styles.modalOptionTextSelected]}>{cat}</Text>
                                                    {filterCategory === cat && <Feather name="check" size={16} color="#2563EB" />}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </TouchableOpacity>
                            </Modal>
                        </View>

                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingHorizontal: 4, paddingTop: 8, paddingBottom: 100 }}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
                            }
                        >
                            {availableJobsForPro.length === 0 ? (
                                activeCategories.length === 0 ? (
                                    <View style={{ marginHorizontal: 4, marginTop: 20, padding: 25, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#BFDBFE', alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
                                        <Image
                                            source={require('./assets/images/plomero.png')}
                                            style={{ width: 140, height: 140, marginBottom: 15 }}
                                            resizeMode="contain"
                                        />

                                        <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E3A8A', textAlign: 'center', marginBottom: 10 }}>
                                            ¡Empieza a Ganar Dinero!
                                        </Text>

                                        <Text style={{ fontSize: 15, color: '#4B5563', textAlign: 'center', marginBottom: 25, lineHeight: 22, paddingHorizontal: 10 }}>
                                            No tienes categorías activas en tu perfil. Activa las categorías en las que eres experto para ver las
                                            <Text style={{ fontWeight: 'bold', color: '#2563EB' }}> Ofertas Disponibles</Text> y comenzar a trabajar.
                                        </Text>

                                        <View style={{ width: '100%', marginBottom: 25 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                                    <Feather name="check" size={18} color="#166534" />
                                                </View>
                                                <Text style={{ fontSize: 14, color: '#374151', flex: 1 }}>Accede a trabajos en tiempo real</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                                    <Feather name="check" size={18} color="#166534" />
                                                </View>
                                                <Text style={{ fontSize: 14, color: '#374151', flex: 1 }}>Envía presupuestos y chatea directo</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                                    <Feather name="check" size={18} color="#166534" />
                                                </View>
                                                <Text style={{ fontSize: 14, color: '#374151', flex: 1 }}>Construye tu reputación y cartera</Text>
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: '#2563EB',
                                                width: '100%',
                                                paddingVertical: 16,
                                                borderRadius: 16,
                                                shadowColor: '#2563EB',
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.3,
                                                shadowRadius: 8,
                                                elevation: 4,
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}
                                            onPress={() => setView('profile')}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginRight: 8 }}>Activar Mi Perfil</Text>
                                            <Feather name="arrow-right" size={20} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={{ marginHorizontal: 4, alignItems: 'center', marginTop: 40, padding: 25, backgroundColor: '#F8FAFC', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1' }}>
                                        <View style={{ width: 64, height: 64, backgroundColor: '#F1F5F9', borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
                                            <Feather name="search" size={32} color="#94A3B8" />
                                        </View>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#475569', marginBottom: 8 }}>Sin ofertas por ahora</Text>
                                        <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
                                            No encontramos trabajos nuevos en tus categorías. {"\n"}Intenta ampliar tus zonas de cobertura.
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setView('profile')}
                                            style={{ flexDirection: 'row', alignItems: 'center' }}
                                        >
                                            <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 14, marginRight: 4 }}>Revisar Perfil</Text>
                                            <Feather name="arrow-right" size={14} color="#2563EB" />
                                        </TouchableOpacity>
                                    </View>
                                )
                            ) : null}

                            {/* Helper to get colors for Pro Statuses moved to top level as getProStatusColor */}
                            {(() => {
                                return availableJobsForPro.map(job => {
                                    const totalUnread = (job.conversations || []).reduce((acc, c) => acc + (c.unreadCount || 0), 0);
                                    const isNewJob = job.proInteractionStatus === 'new';

                                    return (
                                        <TouchableOpacity
                                            key={job.id}
                                            style={{
                                                backgroundColor: 'white',
                                                borderRadius: 24,
                                                padding: 20,
                                                marginHorizontal: 4,
                                                marginTop: 0,
                                                marginBottom: 12,
                                                elevation: 8,
                                                ...Platform.select({
                                                    web: { boxShadow: '0px 4px 12px rgba(37, 99, 235, 0.1)' },
                                                    default: {
                                                        shadowColor: '#2563EB',
                                                        shadowOffset: { width: 0, height: 4 },
                                                        shadowOpacity: 0.1,
                                                        shadowRadius: 10,
                                                    }
                                                }),
                                                borderWidth: 1,
                                                borderColor: isNewJob ? '#DBEAFE' : '#F1F5F9',
                                                position: 'relative'
                                            }}
                                            onPress={() => handleOpenJobDetail(job.id, 'job-detail-pro')}
                                        >
                                            {/* BADGE: NEW JOB INDICATOR */}
                                            {isNewJob && (
                                                <View style={{
                                                    position: 'absolute', top: -6, right: 20,
                                                    backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4,
                                                    borderRadius: 10, zIndex: 10, elevation: 5,
                                                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3
                                                }}>
                                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>NUEVO</Text>
                                                </View>
                                            )}

                                            {/* MAIN TITLE */}
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                                                <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E3A8A', flex: 1, marginRight: 10 }} numberOfLines={1}>
                                                    {job.title}
                                                </Text>
                                            </View>

                                            {/* CONTENT ROW: AVATAR & METADATA */}
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                                                <View style={{
                                                    width: 54, height: 54, borderRadius: 27,
                                                    backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: '#EFF6FF',
                                                    overflow: 'hidden', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {job.clientAvatar ? (
                                                        <Image source={{ uri: job.clientAvatar }} style={{ width: '100%', height: '100%' }} />
                                                    ) : (
                                                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2563EB' }}>
                                                            {job.clientName ? job.clientName.substring(0, 1).toUpperCase() : 'C'}
                                                        </Text>
                                                    )}
                                                </View>

                                                <View style={{ flex: 1, marginLeft: 15 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                                                        <Feather name="user" size={12} color="#6B7280" />
                                                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginLeft: 6 }}>{job.clientName || 'Cliente'}</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                                                        <Feather name="map-pin" size={12} color="#6B7280" />
                                                        <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 6 }}>{job.location || 'Sin ubicación'}</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <Feather name="tag" size={12} color="#9CA3AF" />
                                                        <Text style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 6 }} numberOfLines={1}>
                                                            {job.category?.name || job.category} {job.subcategory ? `> ${job.subcategory}` : ''}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* FOOTER: DATE & STATUS BADGE */}
                                            <View style={{
                                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                                borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15, marginTop: 5
                                            }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Feather name="calendar" size={12} color="#9CA3AF" style={{ marginRight: 6 }} />
                                                    <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(job.createdAt).toLocaleDateString()}</Text>
                                                </View>

                                                <View style={{
                                                    backgroundColor: getProStatusColor(job.proStatus).bg,
                                                    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20
                                                }}>
                                                    <Text style={{
                                                        fontSize: 10, fontWeight: 'bold',
                                                        color: getProStatusColor(job.proStatus).text
                                                    }}>
                                                        {job.proStatus?.toUpperCase() || 'NUEVA'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                });
                            })()}
                        </ScrollView>
                    </View>
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



                {/* PERFIL PRO PÚBLICO */}
                {view === 'professional-profile-public' && selectedUser && (
                    <ProfessionalProfileScreen
                        user={selectedUser}
                        onViewImage={setFullscreenImage}
                        isOwner={false}
                        categories={categories}
                        allSubcategories={
                            categories.reduce((acc, cat) => ({ ...acc, [cat.name]: cat.subcategories }), {})
                        }
                        onBack={() => {
                            // Si venimos de home (buscador) o request
                            if (selectedRequest && userMode === 'client') {
                                setView('request-detail-client');
                            } else {
                                setView('home');
                            }
                        }}
                    />
                )}

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
                            setSelectedRequest(req);
                            if (userMode === 'client') setView('request-detail');
                            else setView('job-detail-pro');
                        }}
                    />
                )}

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

            {/* NAV INFERIOR (CON FIX DE PADDING PARA ANDROID, OCULTO EN ADMIN) */}
            {
                view !== 'admin' && (
                    <View style={styles.bottomNav}>
                        <TouchableOpacity style={styles.navItem} onPress={() => {
                            if (view === 'home' && isLoggedIn) loadRequests();
                            setView('home');
                        }}>
                            {userMode === 'client' ? (
                                <Feather name="search" size={24} color={view === 'home' ? '#EA580C' : '#ccc'} />
                            ) : (
                                <View>
                                    <Feather name="home" size={24} color={view === 'home' ? '#2563EB' : '#ccc'} />
                                    {counts.pro.updates > 0 && (
                                        <View style={styles.badgeContainer}>
                                            <Text style={styles.badgeText}>{counts.pro.updates}</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                            <Text style={{ fontSize: 10, color: '#666' }}>
                                {userMode === 'client' ? 'Buscar' : 'Ofertas'}
                            </Text>
                        </TouchableOpacity>
                        {userMode === 'client' && (
                            <TouchableOpacity style={styles.navItem} onPress={() => {
                                if (!isLoggedIn) setShowAuth(true);
                                else {
                                    if (view === 'my-requests' || view === 'request-detail-client') loadRequests();
                                    setView('my-requests');
                                }
                            }}>
                                <View>
                                    <FontAwesome5 name="clipboard-list" size={24} color={view === 'my-requests' || view === 'request-detail-client' ? '#EA580C' : '#ccc'} />
                                    {counts.client.updates > 0 && (
                                        <View style={styles.badgeContainer}>
                                            <Text style={styles.badgeText}>{counts.client.updates}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={{ fontSize: 10, color: '#666' }}>Solicitudes</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.navItem} onPress={() => {
                            if (!isLoggedIn) setShowAuth(true);
                            else {
                                if (view === 'chat-list' || view === 'chat-detail') loadRequests();
                                setView('chat-list');
                            }
                        }}>
                            <View>
                                <Feather name="message-square" size={24} color={view === 'chat-list' || view === 'chat-detail' ? (userMode === 'client' ? '#EA580C' : '#2563EB') : '#ccc'} />
                                {(userMode === 'client' ? counts.client.chats : counts.pro.chats) > 0 && (
                                    <View style={styles.badgeContainer}>
                                        <Text style={styles.badgeText}>{userMode === 'client' ? counts.client.chats : counts.pro.chats}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={{ fontSize: 10, color: '#666' }}>Chat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navItem} onPress={() => { if (!isLoggedIn) setShowAuth(true); else setView('profile'); }}>
                            <Feather name="user" size={24} color={view === 'profile' ? (userMode === 'client' ? '#EA580C' : '#2563EB') : '#ccc'} />
                            <Text style={{ fontSize: 10, color: '#666' }}>Perfil</Text>
                        </TouchableOpacity>
                    </View>
                )
            }

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


