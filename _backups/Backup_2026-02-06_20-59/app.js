
import { Feather, FontAwesome5, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    Image,
    Linking,
    LogBox,
    Modal,
    Platform,
    StatusBar as RNStatusBar,
    RefreshControl,
    SafeAreaView,
    ScrollView, // Renamed to avoid conflict with expo-status-bar's StatusBar
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Ignorar advertencias específicas de notificaciones en Expo Go
LogBox.ignoreLogs(['expo-notifications:']);

// --- IMPORTS DE UTILIDADES ---
// V13 Update
import { AuthContext, AuthProvider } from './src/context/AuthContext';
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
import { setRequests } from './src/utils/requests';
import { saveSession } from './src/utils/session';
import { OTA_VERSION } from './src/utils/version';

const { checkCredentials, getUser, registerUser } = AuthLocal;

// Alias para los iconos usados en el código
// Definimos componentes funcionales para iconos específicos que se usan sin prop 'name'
const Hammer = (props) => <MaterialCommunityIcons name="hammer" {...props} />;
const BriefcaseIcon = (props) => <Feather name="briefcase" {...props} />; // Renombrado para evitar conflicto con alias genérico si fuera necesario
const MessageSquare = (props) => <Feather name="message-square" {...props} />;

// Iconos para categorías (Wrappers con nombre predefinido)
const IconHogar = (props) => <Feather name="home" {...props} />;
const IconAuto = (props) => <FontAwesome5 name="car" {...props} />;
const IconSalud = (props) => <Feather name="heart" {...props} />;
const IconTech = (props) => <Feather name="monitor" {...props} />;
const IconBeauty = (props) => <Feather name="scissors" {...props} />;
const IconEvents = (props) => <Feather name="calendar" {...props} />;
const IconPets = (props) => <FontAwesome5 name="cat" {...props} />;
const IconLegal = (props) => <Feather name="briefcase" {...props} />;

// Alias a librerías completas (para uso con name="...")
const Car = FontAwesome5;
const Stethoscope = FontAwesome5;
const Briefcase = Feather; // Se mantiene para usos genéricos
const Wifi = Feather;
const Cat = FontAwesome5;
const Scissors = FontAwesome5;
const Music = Feather;
const User = Feather;
const ChevronDown = Feather;
const X = Feather;
const MapPin = Feather;
const Crosshair = Feather;
const ImagePlus = Feather;
const Camera = Feather;
const PlayCircle = Feather;
const Star = Feather;
const ArrowLeft = Feather;
const ClipboardList = FontAwesome5;
const Home = Feather;
const ChevronRight = Feather;
const Layers = Feather;
const Grid = Feather;
const Video = Feather;
const RefreshCw = Feather;

const { width } = Dimensions.get('window');

// --- HELPERS PARA ICONOS ---
const ICON_MAP = {
    'home': IconHogar,
    'car': IconAuto,
    'heart': IconSalud,
    'monitor': IconTech,
    'scissors': IconBeauty,
    'calendar': IconEvents,
    'cat': IconPets,
    'briefcase': IconLegal,
    'building': (props) => <Feather name="home" {...props} />, // Bienes Raíces fallback
    'grid': (props) => <Feather name="grid" {...props} />, // Cursos
    'default': IconHogar
};

const mapCategoryToDisplay = (cat) => ({
    id: cat._id,
    name: cat.name,
    fullName: cat.name,
    icon: ICON_MAP[cat.icon] || ICON_MAP['default'],
    color: cat.color || '#FFF7ED',
    iconColor: '#EA580C',
    subcategories: cat.subcategories || []
});

// Helper para comparar IDs de forma segura
const areIdsEqual = (id1, id2) => {
    if (!id1 || !id2) return false;
    const s1 = (typeof id1 === 'object' && id1 !== null) ? (id1._id || id1.id || id1.toString()) : String(id1);
    const s2 = (typeof id2 === 'object' && id2 !== null) ? (id2._id || id2.id || id2.toString()) : String(id2);
    return s1 === s2;
};

const getClientStatus = (request) => {
    // PRIORITY ORDER: TERMINADO > VALORACIÓN > VALIDANDO > EN EJECUCIÓN > PRESUPUESTADA > CONTACTADA > ABIERTA > NUEVA
    if (request.status === 'canceled' || request.status === 'Cerrada') return 'ELIMINADA';

    // 1. TERMINADO (Any rating exists or status is rated/completed)
    const isRated = !!(request.status === 'rated' || request.status === 'TERMINADO' || request.status === 'completed' || request.status === 'Culminada' || request.clientRated || request.proRated || request.rating > 0 || request.proRating > 0 || (request.proFinished && request.clientFinished));
    if (isRated) return 'TERMINADO';

    // 3. VALIDANDO (Pro finished, Client hasn't confirmed)
    if (request.proFinished && !request.clientFinished) return 'VALIDANDO';

    // 4. EN EJECUCIÓN (Started)
    if (request.status === 'in_progress' || request.status === 'started' || request.status === 'En Ejecución') return 'EN EJECUCIÓN';

    const activeOffers = request.offers?.filter(o => o.status !== 'rejected');
    if (activeOffers && activeOffers.length > 0) return 'PRESUPUESTADA';

    // If there are offers but all are rejected
    if (request.offers && request.offers.length > 0) return 'RECHAZADA';

    if ((request.conversations && request.conversations.length > 0) || request.interactionsSummary?.contacted > 0) {
        return 'CONTACTADA';
    }

    return 'NUEVA';
};

const getClientStatusColor = (status) => {
    switch (status) {
        case 'NUEVA': return { bg: '#6B7280', text: 'white' };
        case 'ABIERTA': return { bg: '#10B981', text: 'white' };
        case 'CONTACTADA': return { bg: '#2563EB', text: 'white' };
        case 'PRESUPUESTADA': return { bg: '#F59E0B', text: 'white' };
        case 'RECHAZADA': return { bg: '#EF4444', text: 'white' };
        case 'EN EJECUCIÓN': return { bg: '#059669', text: 'white' };
        case 'VALIDANDO': return { bg: '#F97316', text: 'white' };
        case 'VALORACIÓN': return { bg: '#8B5CF6', text: 'white' };
        case 'TERMINADO': return { bg: '#1F2937', text: 'white' };
        case 'ELIMINADA': return { bg: '#EF4444', text: 'white' };
        default: return { bg: '#6B7280', text: 'white' };
    }
};

const getProStatusColor = (status) => {
    switch (status) {
        case 'GANADA': return { bg: '#DCFCE7', text: '#15803D' };
        case 'EN EJECUCIÓN': return { bg: '#D1FAE5', text: '#065F46' };
        case 'ACEPTADO': return { bg: '#DCFCE7', text: '#15803D' };
        case 'VALIDANDO': return { bg: '#FFEDD5', text: '#C2410C' };
        case 'VALORACIÓN': return { bg: '#E0E7FF', text: '#4338CA' };
        case 'TERMINADO': return { bg: '#1F2937', text: '#F9FAFB' };
        case 'PRESUPUESTADA': return { bg: '#FEF3C7', text: '#D97706' };
        case 'CONTACTADA': return { bg: '#DBEAFE', text: '#1E40AF' };
        case 'PERDIDA': return { bg: '#FEE2E2', text: '#B91C1C' };
        case 'RECHAZADA': return { bg: '#FEE2E2', text: '#B91C1C' };
        case 'ABIERTA': return { bg: '#F3F4F6', text: '#4B5563' };
        case 'NUEVA': return { bg: '#ECFDF5', text: '#10B981' };
        case 'FINALIZADA': return { bg: '#1F2937', text: '#F9FAFB' };
        case 'Cerrada': return { bg: '#FEE2E2', text: '#B91C1C' };
        default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
};

const getProStatus = (job, myId) => {
    if (job.calculatedProStatus) return job.calculatedProStatus;
    if (!job) return 'NUEVA';
    if (job.status === 'canceled' || job.status === 'Cerrada') return 'Cerrada';

    // Check if I am/was the professional for this job
    const isWinner = (job.professional && areIdsEqual(job.professional._id || job.professional, myId)) ||
        (job.offers && job.offers.some(o => areIdsEqual(o.proId?._id || o.proId, myId) && o.status === 'accepted'));

    if (job.status === 'rated' || job.status === 'completed' || job.status === 'Culminada' || job.status === 'TERMINADO') {
        if (!isWinner) return 'PERDIDA';
        if (job.status === 'rated' || job.status === 'TERMINADO' || job.proRated || job.clientRated || job.proRating > 0 || job.rating > 0) return 'TERMINADO';
        if (job.proFinished && job.clientFinished) return 'VALORACIÓN';
        return 'VALIDANDO';
    }

    if (job.status === 'in_progress' || job.status === 'started' || job.status === 'En Ejecución') {
        if (isWinner) {
            if (job.proFinished) return 'VALIDANDO';
            if (job.trackingStatus === 'started') return 'EN EJECUCIÓN';
            return 'ACEPTADO';
        }
        return 'PERDIDA';
    }

    // CHECK SHORTCUT (Calculated during loadRequests)
    if (job._myOfferStatus) {
        if (job._myOfferStatus === 'accepted') return 'GANADA';
        if (job._myOfferStatus === 'rejected') return 'RECHAZADA';
        if (job._myOfferStatus === 'pending' || job._myOfferStatus === 'sent') return 'PRESUPUESTADA';
    }

    // CHECK OFFERS (For jobs not yet in progress/completed)
    // Es posible que offers venga como strings (IDs) o como objetos populados.
    // Manejar ambos casos.
    const myOffer = job.offers?.find(o => areIdsEqual(o.proId?._id || o.proId || o, myId));

    if (myOffer) {
        console.log(`[getProStatus] Found offer for ${job._id} (Status: ${myOffer.status})`);
        if (myOffer.status === 'accepted') return 'GANADA';
        if (myOffer.status === 'rejected') return 'RECHAZADA';
        if (myOffer.status === 'pending' || myOffer.status === 'sent') return 'PRESUPUESTADA';
    } else {
        if (job.offers && job.offers.length > 0) {
            console.log(`[getProStatus] No matching offer for ${myId} in job ${job._id}. Offers proIds:`, job.offers.map(o => o.proId));
        }
    }

    // CHECK CONVERSATIONS
    const myConv = job.conversations?.find(c => areIdsEqual(c.proId?._id || c.proId, myId));
    if (myConv) return 'CONTACTADA';

    // INTERACTION STATUS (Fallback)
    const dbStatus = job.proInteraction?.status || job.proInteractionStatus || 'new';
    switch (dbStatus) {
        case 'viewed': return 'ABIERTA';
        case 'contacted': return 'CONTACTADA';
        case 'offered': return 'PRESUPUESTADA';
        case 'won': return 'GANADA';
        case 'lost': return 'PERDIDA';
        case 'rejected': return 'RECHAZADA';
        case 'archived': return 'Archivada';
        default: return 'NUEVA';
    }
};

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

const DETAILED_CATEGORIES = {
    "Hogar": ["Aire Acondicionado", "Plomería", "Electricidad", "Pintura", "Albañilería", "Limpieza", "Cerrajería", "Carpintería"],
    "Automotriz": ["Mecánica Ligera", "Cauchos", "Baterías", "Aire Acondicionado Auto", "Latonería y Pintura", "Autolavado", "Grúa"],
    "Salud y Bienestar": ["Enfermería", "Fisioterapia", "Nutrición", "Cuidado de Adultos Mayores", "Psicología", "Entrenador Personal"],
    "Tecnología": ["Reparación PC/Laptop", "Redes y WiFi", "Cámaras de Seguridad", "Instalación de Software", "Reparación de Celulares"],
    "Belleza y Estética": ["Peluquería", "Manicure/Pedicure", "Maquillaje", "Barbería", "Masajes"],
    "Eventos": ["Fotografía", "Decoración", "Catering/Comida", "Música/DJ", "Animación"],
    "Mascotas": ["Paseo de Perros", "Veterinaria a Domicilio", "Peluquería Canina", "Adiestramiento"],
    "Clases y Tutorías": ["Matemáticas", "Idiomas", "Música", "Apoyo Escolar"],
    "Legal y Trámites": ["Abogado", "Gestoría", "Contabilidad", "Redacción de Documentos"],
    "Transporte y Mudanzas": ["Fletes", "Mudanzas", "Transporte de Pasajeros"],
    "Bienes Raíces": ["Venta", "Alquiler", "Avalúos", "Administración"]
};

const CATEGORY_EXAMPLES = {
    "default": { title: "Ej: Fisioterapia a domicilio para dolor lumbar", description: "Danos más contexto para una mejor cotización: ¿Horarios preferidos? ¿Síntomas? ¿Marca del equipo?" },
    "Hogar": { title: "Ej. Reparación en casa", description: "Ej. Necesito arreglar un desperfecto en..." },
    "Bienes Raíces": { title: "Ej. Venta de apartamento", description: "Ej. Necesito avalúo para venta de inmueble en..." },
    "Hogar:Plomería": { title: "Ej. Fuga de agua en cocina", description: "Ej. Gotea la tubería debajo del fregadero y moja el mueble." },
    "Hogar:Electricidad": { title: "Ej. Enchufe sin corriente", description: "Ej. El tomacorriente de la sala hizo chispa y no funciona." },
    "Hogar:Aire Acondicionado": { title: "Ej. Mantenimiento preventivo", description: "Ej. Limpieza de split de 12000 BTU, no enfría bien." },

    "Automotriz": { title: "Ej. Revisión de vehículo", description: "Ej. Mi carro presenta una falla en..." },
    "Automotriz:Mecánica Ligera": { title: "Ej. Cambio de pastillas de freno", description: "Ej. Suenan los frenos al detener el carro (Toyota Corolla 2015)." },
    "Automotriz:Baterías": { title: "Ej. Auxilio vial por batería", description: "Ej. El carro no prende, necesito carga o cambio de batería." },

    "Salud y Bienestar": { title: "Ej. Servicio de salud a domicilio", description: "Ej. Requiero atención profesional para..." },
    "Salud y Bienestar:Fisioterapia": { title: "Ej. Terapia para dolor de espalda", description: "Ej. Dolor lumbar fuerte, necesito sesión de descarga." },
    "Salud y Bienestar:Enfermería": { title: "Ej. Inyección a domicilio", description: "Ej. Aplicación de tratamiento endovenoso recetado." },

    "Tecnología": { title: "Ej. Soporte técnico", description: "Ej. Mi equipo presenta problemas con..." },
    "Clases y Tutorías": ["Matemáticas", "Idiomas", "Música", "Apoyo Escolar"],
    "Legal y Trámites": ["Abogado", "Gestoría", "Contabilidad", "Redacción de Documentos"],
    "Transporte y Mudanzas": ["Fletes", "Mudanzas", "Transporte de Pasajeros"],

    "Eventos": { title: "Ej. Servicio para fiesta", description: "Ej. Organizando un cumpleaños para..." },
    "Eventos:Fotografía": { title: "Ej. Fotos para bautizo", description: "Ej. Cobertura de 4 horas para evento familiar." },

    "Mascotas": { title: "Ej. Cuidado de mascota", description: "Ej. Busco servicio para mi perro/gato..." },
    "Mascotas:Veterinaria a Domicilio": { title: "Ej. Vacunación anual", description: "Ej. Necesito poner la sextuple a mi perro." },
};

const BLOG_POSTS = [
    { id: '1', title: '¿Cómo limpiar tu aire acondicionado fácil y barato?', category: 'Hogar', image: 'https://ui-avatars.com/api/?name=User&background=random' },
    { id: '2', title: '5 tips para ahorrar electricidad en casa', category: 'Tips', image: 'https://ui-avatars.com/api/?name=User&background=random' },
];

const TESTIMONIALS = [
    { id: 1, user: "Camilo Acosta", text: "Me ha salvado en varias ocasiones.", stars: 5, image: "https://ui-avatars.com/api/?name=Camilo+Acosta&background=random" },
    { id: 2, user: "Lucia Esperanza", text: "Encontré un cerrajero en 5 minutos.", stars: 5, image: "https://ui-avatars.com/api/?name=Lucia+Esperanza&background=random" },
    { id: 3, user: "Marcos R.", text: "Excelente servicio y rapidez.", stars: 4, image: "https://ui-avatars.com/api/?name=Marcos+R&background=random" },
];

// --- DATOS DE ZONAS (MOCK) ---
// Estructura: Ciudad/Región -> [Municipios]
const LOCATIONS_DATA = {
    "Gran Caracas": ["Libertador", "Chacao", "Baruta", "Sucre", "El Hatillo", "Caracas"],
    "La Guaira": ["Vargas"],
    "Altos Mirandinos": ["Los Salias", "Carrizal", "Guaicaipuro"],
    "Guarenas-Guatire": ["Plaza", "Zamora"],
    "Valencia": ["Valencia", "Naguanagua", "San Diego", "Los Guayos", "Libertador (Carabobo)"],
    "Maracay": ["Girardot", "Mario Briceño Iragorry", "Santiago Mariño"],
    "Barquisimeto": ["Iribarren", "Palavecino"],
    "Maracaibo": ["Maracaibo", "San Francisco"],
    "Puerto La Cruz": ["Sotillo", "Simón Bolívar", "Urbaneja", "Guanta"],
    "San Cristóbal": ["San Cristóbal", "Cárdenas"],
    "Margarita": ["Mariño", "Maneiro", "Arismendi", "García"],
    "Puerto Ordaz": ["Caroní"]
};

// Aplanar para sugerencias en formularios (Formato: "Municipio, Ciudad")
const FLAT_ZONES_SUGGESTIONS = [];
Object.keys(LOCATIONS_DATA).forEach(city => {
    LOCATIONS_DATA[city].forEach(muni => {
        FLAT_ZONES_SUGGESTIONS.push(`${muni}, ${city} `);
    });
});

// --- 2. COMPONENTES AUXILIARES ---

const showAlert = (title, message, onPress = null) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n${message}`);
        if (onPress) onPress();
    } else {
        Alert.alert(title, message, onPress ? [{ text: 'OK', onPress }] : undefined);
    }
};

const showConfirmation = (title, message, onConfirm, onCancel, confirmText = "Aceptar", cancelText = "Cancelar", destructive = false) => {
    if (Platform.OS === 'web') {
        if (window.confirm(`${title}\n${message}`)) {
            if (onConfirm) onConfirm();
        } else {
            if (onCancel) onCancel();
        }
    } else {
        Alert.alert(
            title,
            message,
            [
                { text: cancelText, style: "cancel", onPress: onCancel },
                {
                    text: confirmText,
                    style: destructive ? "destructive" : "default",
                    onPress: onConfirm
                }
            ]
        );
    }
};

const SectionDivider = () => (
    <View style={{
        height: 12,
        backgroundColor: '#A19C9B',
        width: '100%',
    }} />
);

const HandDrawnDivider = () => <SectionDivider />;

// --- DATA PARA MENSAJERÍA DINÁMICA ---
const HOME_COPY_OPTIONS = [
    {
        title: "Encuentra el experto que necesitas ahora",
        subtitle: "Conecta al instante con profesionales en tu zona: mecánicos, fontaneros, médicos y más.",
        buttonText: "Ver expertos disponibles"
    },
    {
        title: "Soluciona tu problema o urgencia",
        subtitle: "Publica tu necesidad y recibe propuestas rápidas de especialistas calificados cerca de ti.",
        buttonText: "Solicitar servicio"
    },
    {
        title: "Cualquier servicio, en un solo lugar",
        subtitle: "Desde reparaciones urgentes hasta cuidados personales. Elige al profesional que mejor se adapte a ti.",
        buttonText: "Buscar profesional"
    },
    {
        title: "¿Qué servicio buscas hoy?",
        subtitle: "Olvídate de buscar por horas. Dinos qué necesitas y los expertos vendrán a ti.",
        buttonText: "Encontrar ayuda"
    },
    {
        title: "Tu red de profesionales cercanos",
        subtitle: "Acceso directo a expertos locales listos para trabajar en tu proyecto o urgencia.",
        buttonText: "Ver quién está cerca"
    }
];
const ROTATION_KEY = 'home_messaging_rotation_index';

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

const Header = ({ userMode, toggleMode, isLoggedIn, onLoginPress, currentUser, onOpenProfile, clientCounts, proCounts }) => {
    const rotateAnim = useRef(new Animated.Value(userMode === 'client' ? 0 : 1)).current;

    useEffect(() => {
        Animated.timing(rotateAnim, {
            toValue: userMode === 'client' ? 0 : 1,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 0.2, 1)
        }).start();
    }, [userMode]);

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg']
    });

    const hasOtherModeNotifications = userMode === 'client'
        ? (proCounts?.chats > 0 || proCounts?.updates > 0)
        : (clientCounts?.chats > 0 || clientCounts?.updates > 0);

    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <View style={[styles.logoIcon, { backgroundColor: userMode === 'client' ? '#F97316' : '#2563EB' }]}>
                    {userMode === 'client' ? <Hammer color="white" size={16} /> : <Briefcase name="briefcase" color="white" size={16} />}
                </View>
                <Text style={styles.logoText}>
                    <Text style={{ color: '#2563EB' }}>Profesional</Text>{' '}
                    <Text style={{ color: '#EA580C' }}>Cercano</Text>
                </Text>
                <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, marginLeft: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#9CA3AF' }}>{OTA_VERSION}</Text>
                </View>
            </View>

            <View style={styles.headerRight}>
                {isLoggedIn ? (
                    <TouchableOpacity
                        onPress={toggleMode}
                        activeOpacity={0.8}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: userMode === 'client' ? '#DBEAFE' : '#FFEDD5',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: userMode === 'client' ? '#2563EB' : '#F97316',
                            elevation: 2,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2
                        }}
                    >
                        <Animated.View style={{ transform: [{ rotate: rotation }], alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialCommunityIcons name="arrow-up" size={14} color="#2563EB" style={{ marginRight: -4 }} />
                                <MaterialCommunityIcons name="arrow-down" size={14} color="#EA580C" style={{ marginLeft: -4 }} />
                            </View>
                        </Animated.View>

                        {hasOtherModeNotifications && (
                            <View style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: '#EF4444',
                                borderWidth: 1.5,
                                borderColor: 'white'
                            }} />
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.loginButtonHeader} onPress={onLoginPress}>
                        <Text style={styles.loginButtonHeaderText}>Entrar</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const CustomDropdown = ({ label, value, options, onSelect, placeholder }) => {
    const [modalVisible, setModalVisible] = useState(false);
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.pickerContainer} onPress={() => setModalVisible(true)}>
                <Text style={[styles.input, { color: value ? '#1F2937' : '#9CA3AF' }]}>{value || placeholder}</Text>
                <ChevronDown name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, maxHeight: '80%', elevation: 5 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{label || 'Selecciona'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 5 }}>
                                <X name="x" size={24} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ marginBottom: 10 }}>
                            {options.map((item, index) => (
                                <TouchableOpacity key={index} style={{ paddingVertical: 15, borderBottomWidth: 1, borderColor: '#F3F4F6' }} onPress={() => { onSelect(item); setModalVisible(false); }}>
                                    <Text style={{ fontSize: 16, color: '#374151' }}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const CategoryGridModal = ({ visible, onClose, onSelect, categories }) => {
    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={styles.categoryGridModalOverlay}>
                <View style={styles.categoryGridModalContent}>
                    <View style={styles.categoryGridHeader}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.categoryGridTitle}>¿Qué área necesitas?</Text>
                            <Text style={styles.categoryGridSubtitle}>Selecciona la categoría de tu solicitud</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.categoryGridCloseButton}>
                            <X name="x" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.categoryGridScroll}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={styles.categoryGridItem}
                                onPress={() => {
                                    onSelect(cat.name);
                                    onClose();
                                }}
                            >
                                <View style={[styles.categoryGridIconWrapper, { backgroundColor: cat.color || '#F3F4F6' }]}>
                                    <cat.icon size={28} color={cat.iconColor || '#EA580C'} />
                                </View>
                                <Text style={styles.categoryGridLabel} numberOfLines={1}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const CAT_ICONS = {
    // Hogar
    'home': { lib: Feather, name: 'home' },
    'hammer': { lib: MaterialCommunityIcons, name: 'hammer' },
    'wrench': { lib: MaterialCommunityIcons, name: 'wrench' },
    'format-paint': { lib: MaterialCommunityIcons, name: 'format-paint' },
    'broom': { lib: MaterialCommunityIcons, name: 'broom' },
    'flower': { lib: MaterialCommunityIcons, name: 'flower' },
    'truck-delivery': { lib: MaterialCommunityIcons, name: 'truck-delivery' },
    'lightbulb-on': { lib: MaterialCommunityIcons, name: 'lightbulb-on' },
    'water': { lib: MaterialCommunityIcons, name: 'water' },
    'door': { lib: MaterialCommunityIcons, name: 'door' },
    'sofa': { lib: MaterialCommunityIcons, name: 'sofa' },
    'bed': { lib: MaterialCommunityIcons, name: 'bed' },
    'air-conditioner': { lib: MaterialCommunityIcons, name: 'air-conditioner' },
    'radiator': { lib: MaterialCommunityIcons, name: 'radiator' },
    'fire': { lib: MaterialCommunityIcons, name: 'fire' },
    'snowflake': { lib: MaterialCommunityIcons, name: 'snowflake' },
    'fan': { lib: MaterialCommunityIcons, name: 'fan' },
    'thermometer': { lib: MaterialCommunityIcons, name: 'thermometer' },
    'vacuum': { lib: MaterialCommunityIcons, name: 'vacuum' },
    'mop': { lib: MaterialCommunityIcons, name: 'mop' },
    'lamp': { lib: MaterialCommunityIcons, name: 'lamp' },
    'fence': { lib: MaterialCommunityIcons, name: 'fence' },
    'key-variant': { lib: MaterialCommunityIcons, name: 'key-variant' },
    'microwave': { lib: MaterialCommunityIcons, name: 'microwave' },
    'fridge': { lib: MaterialCommunityIcons, name: 'fridge' },
    'washing-machine': { lib: MaterialCommunityIcons, name: 'washing-machine' },

    // Salud
    'heart': { lib: Feather, name: 'heart' },
    'doctor': { lib: MaterialCommunityIcons, name: 'doctor' },
    'hospital-box': { lib: MaterialCommunityIcons, name: 'hospital-box' },
    'yoga': { lib: MaterialCommunityIcons, name: 'yoga' },
    'dumbbell': { lib: MaterialCommunityIcons, name: 'dumbbell' },
    'human-handsup': { lib: MaterialCommunityIcons, name: 'human-handsup' },
    'tooth': { lib: MaterialCommunityIcons, name: 'tooth' },
    'pill': { lib: MaterialCommunityIcons, name: 'pill' },
    'eye': { lib: MaterialCommunityIcons, name: 'eye' },
    'spa': { lib: MaterialCommunityIcons, name: 'spa' },
    'meditation': { lib: MaterialCommunityIcons, name: 'meditation' },
    'bandage': { lib: MaterialCommunityIcons, name: 'bandage' },
    'stethoscope': { lib: MaterialCommunityIcons, name: 'stethoscope' },
    'bottle-tonic-plus': { lib: MaterialCommunityIcons, name: 'bottle-tonic-plus' },

    // Profesionales
    'briefcase': { lib: Feather, name: 'briefcase' },
    'calculator': { lib: MaterialCommunityIcons, name: 'calculator' },
    'laptop': { lib: MaterialCommunityIcons, name: 'laptop' },
    'palette': { lib: MaterialCommunityIcons, name: 'palette' },
    'code-braces': { lib: MaterialCommunityIcons, name: 'code-braces' },
    'compass-outline': { lib: MaterialCommunityIcons, name: 'compass-outline' },
    'fountain-pen-tip': { lib: MaterialCommunityIcons, name: 'fountain-pen-tip' },
    'translate': { lib: MaterialCommunityIcons, name: 'translate' },
    'account-check': { lib: MaterialCommunityIcons, name: 'account-check' },
    'file-document-edit': { lib: MaterialCommunityIcons, name: 'file-document-edit' },
    'microphone': { lib: MaterialCommunityIcons, name: 'microphone' },
    'headset': { lib: MaterialCommunityIcons, name: 'headset' },

    // Mascotas
    'paw': { lib: FontAwesome5, name: 'paw' },
    'dog': { lib: MaterialCommunityIcons, name: 'dog' },
    'cat': { lib: MaterialCommunityIcons, name: 'cat' },
    'bone': { lib: MaterialCommunityIcons, name: 'bone' },
    'fish': { lib: MaterialCommunityIcons, name: 'fish' },
    'bird': { lib: MaterialCommunityIcons, name: 'bird' },
    'rabbit': { lib: MaterialCommunityIcons, name: 'rabbit' },

    // Educación
    'school': { lib: MaterialCommunityIcons, name: 'school' },
    'book-open-variant': { lib: MaterialCommunityIcons, name: 'book-open-variant' },
    'certificate': { lib: MaterialCommunityIcons, name: 'certificate' },
    'brain': { lib: MaterialCommunityIcons, name: 'brain' },
    'lightbulb': { lib: MaterialCommunityIcons, name: 'lightbulb' },
    'pencil': { lib: MaterialCommunityIcons, name: 'pencil' },
    'microscope': { lib: MaterialCommunityIcons, name: 'microscope' },
    'earth': { lib: MaterialCommunityIcons, name: 'earth' },

    // Eventos
    'calendar': { lib: Feather, name: 'calendar' },
    'party-popper': { lib: MaterialCommunityIcons, name: 'party-popper' },
    'music': { lib: Feather, name: 'music' },
    'camera': { lib: Feather, name: 'camera' },
    'silverware-fork-knife': { lib: MaterialCommunityIcons, name: 'silverware-fork-knife' },
    'cake-variant': { lib: MaterialCommunityIcons, name: 'cake-variant' },
    'glass-wine': { lib: MaterialCommunityIcons, name: 'glass-wine' },
    'theater': { lib: MaterialCommunityIcons, name: 'theater' },
    'balloon': { lib: MaterialCommunityIcons, name: 'balloon' },
    'fireworks': { lib: MaterialCommunityIcons, name: 'fireworks' },

    // Tecnología
    'monitor': { lib: Feather, name: 'monitor' },
    'cellphone': { lib: MaterialCommunityIcons, name: 'cellphone' },
    'shield-lock': { lib: MaterialCommunityIcons, name: 'shield-lock' },
    'network': { lib: MaterialCommunityIcons, name: 'network' },
    'router-wireless': { lib: MaterialCommunityIcons, name: 'router-wireless' },
    'database': { lib: MaterialCommunityIcons, name: 'database' },
    'printer': { lib: MaterialCommunityIcons, name: 'printer' },
    'robot': { lib: MaterialCommunityIcons, name: 'robot' },
    'chip': { lib: MaterialCommunityIcons, name: 'chip' },
    'keyboard': { lib: MaterialCommunityIcons, name: 'keyboard' },

    // Compras
    'shopping-bag': { lib: Feather, name: 'shopping-bag' },
    'tshirt-crew': { lib: MaterialCommunityIcons, name: 'tshirt-crew' },
    'hanger': { lib: MaterialCommunityIcons, name: 'hanger' },
    'shoe-heel': { lib: MaterialCommunityIcons, name: 'shoe-heel' },
    'tag': { lib: Feather, name: 'tag' },
    'gift': { lib: Feather, name: 'gift' },
    'diamond-stone': { lib: MaterialCommunityIcons, name: 'diamond-stone' },
    'watch': { lib: MaterialCommunityIcons, name: 'watch' },
    'cart': { lib: MaterialCommunityIcons, name: 'cart' },
    'store': { lib: MaterialCommunityIcons, name: 'store' },

    // Inmobiliaria
    'home-city': { lib: MaterialCommunityIcons, name: 'home-city' },
    'key': { lib: MaterialCommunityIcons, name: 'key' },
    'file-document-outline': { lib: MaterialCommunityIcons, name: 'file-document-outline' },
    'percent': { lib: MaterialCommunityIcons, name: 'percent' },
    'sign-real-estate': { lib: MaterialCommunityIcons, name: 'sign-real-estate' },
    'building': { lib: FontAwesome5, name: 'building' },
    'office-building': { lib: MaterialCommunityIcons, name: 'office-building' },

    // Automoción
    'car': { lib: FontAwesome5, name: 'car' },
    'car-wrench': { lib: MaterialCommunityIcons, name: 'car-wrench' },
    'gas-station': { lib: MaterialCommunityIcons, name: 'gas-station' },
    'shield-car': { lib: MaterialCommunityIcons, name: 'shield-car' },
    'steering': { lib: MaterialCommunityIcons, name: 'steering' },
    'bike': { lib: MaterialCommunityIcons, name: 'bike' },
    'truck': { lib: Feather, name: 'truck' },
    'bus': { lib: FontAwesome5, name: 'bus' },
    'tools': { lib: MaterialCommunityIcons, name: 'tools' },

    // Finanzas
    'bank': { lib: MaterialCommunityIcons, name: 'bank' },
    'cash': { lib: MaterialCommunityIcons, name: 'cash' },
    'finance': { lib: MaterialCommunityIcons, name: 'finance' },
    'chart-line': { lib: MaterialCommunityIcons, name: 'chart-line' },
    'credit-card': { lib: Feather, name: 'credit-card' },
    'wallet': { lib: MaterialCommunityIcons, name: 'wallet' },
    'hand-coin': { lib: MaterialCommunityIcons, name: 'hand-coin' },

    // Viajes
    'airplane': { lib: MaterialCommunityIcons, name: 'airplane' },
    'map-pin': { lib: Feather, name: 'map-pin' },
    'beach': { lib: MaterialCommunityIcons, name: 'beach' },
    'hotel': { lib: MaterialCommunityIcons, name: 'hotel' },
    'compass': { lib: Feather, name: 'compass' },
    'train': { lib: MaterialCommunityIcons, name: 'train' },
    'passport': { lib: MaterialCommunityIcons, name: 'passport' },

    // Legal
    'gavel': { lib: MaterialCommunityIcons, name: 'gavel' },
    'scale-balance': { lib: MaterialCommunityIcons, name: 'scale-balance' },
    'file-sign': { lib: MaterialCommunityIcons, name: 'file-sign' },
    'police-badge': { lib: MaterialCommunityIcons, name: 'police-badge' },
    'copyright': { lib: MaterialCommunityIcons, name: 'copyright' },
    'book-lock': { lib: MaterialCommunityIcons, name: 'book-lock' },

    // Marketing
    'bullhorn': { lib: MaterialCommunityIcons, name: 'bullhorn' },
    'facebook': { lib: MaterialCommunityIcons, name: 'facebook' },
    'instagram': { lib: MaterialCommunityIcons, name: 'instagram' },
    'google-ads': { lib: MaterialCommunityIcons, name: 'google-ads' },
    'target': { lib: Feather, name: 'target' },
    'rocket': { lib: MaterialCommunityIcons, name: 'rocket' },

    // Construcción
    'hard-hat': { lib: MaterialCommunityIcons, name: 'hard-hat' },
    'excavator': { lib: MaterialCommunityIcons, name: 'excavator' },
    'floor-plan': { lib: MaterialCommunityIcons, name: 'floor-plan' },
    'wall': { lib: MaterialCommunityIcons, name: 'wall' },
    'tape-measure': { lib: MaterialCommunityIcons, name: 'tape-measure' },
    'ladder': { lib: MaterialCommunityIcons, name: 'ladder' },
    'blueprint': { lib: MaterialCommunityIcons, name: 'blueprint' },

    // Legacy / Others
    'scissors': { lib: Feather, name: 'scissors' },
    'book': { lib: Feather, name: 'book' },
    'smile': { lib: Feather, name: 'smile' },
    'wifi': { lib: Feather, name: 'wifi' },
    'coffee': { lib: Feather, name: 'coffee' },
    'smartphone': { lib: Feather, name: 'smartphone' },
    'droplet': { lib: Feather, name: 'droplet' },
    'zap': { lib: Feather, name: 'zap' },
    'lock': { lib: Feather, name: 'lock' },
    'trash-2': { lib: Feather, name: 'trash-2' },
    'wind': { lib: Feather, name: 'wind' },
    'pipe-wrench': { lib: MaterialCommunityIcons, name: 'pipe-wrench' },
    'paint-brush': { lib: FontAwesome5, name: 'paint-brush' },
    'baby-carriage': { lib: FontAwesome5, name: 'baby-carriage' },
    'tshirt': { lib: FontAwesome5, name: 'tshirt' },
    'utensils': { lib: FontAwesome5, name: 'utensils' },
    'circle': { lib: Feather, name: 'circle' }
};

const SubcategoryGridModal = ({ visible, onClose, onSelect, subcategories, categoryName, color, iconColor }) => {
    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={styles.categoryGridModalOverlay}>
                <View style={styles.categoryGridModalContent}>
                    <View style={styles.categoryGridHeader}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.categoryGridTitle} numberOfLines={1}>{categoryName}: Especialidades</Text>
                            <Text style={styles.categoryGridSubtitle}>Selecciona el servicio específico</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.categoryGridCloseButton}>
                            <X name="x" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.categoryGridScroll}>
                        {subcategories.map((sub, index) => {
                            const subName = typeof sub === 'object' ? sub.name : sub;

                            // Dynamic Icon Logic
                            let IconComponent = Layers;
                            let activeIconColor = iconColor || "#2563EB";
                            let iconName = "layers";

                            if (typeof sub === 'object' && sub.icon && CAT_ICONS[sub.icon]) {
                                const iconData = CAT_ICONS[sub.icon];
                                IconComponent = iconData.lib;
                                iconName = iconData.name;
                            }

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.categoryGridItem}
                                    onPress={() => {
                                        onSelect(subName);
                                        onClose();
                                    }}
                                >
                                    <View style={[styles.categoryGridIconWrapper, { backgroundColor: color || '#EFF6FF' }]}>
                                        <IconComponent name={iconName} size={28} color={activeIconColor} />
                                    </View>
                                    <Text style={styles.categoryGridLabel} numberOfLines={2}>{subName}</Text>
                                </TouchableOpacity>
                            );
                        })}
                        {subcategories.length === 0 && (
                            <Text style={{ textAlign: 'center', width: '100%', color: '#9CA3AF', marginTop: 20 }}>No hay especialidades disponibles.</Text>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// --- 3. SECCIONES DE CONTENIDO (BLOG, ETC) ---
const HomeSections = ({ onSelectCategory, onSelectPost, categories, articles }) => {
    const displayCategories = (categories && categories.length > 0) ? categories : [];
    const displayArticles = (articles && articles.length > 0) ? articles : BLOG_POSTS;

    return (
        <View style={{ backgroundColor: '#A19C9B' }}>
            {/* Categorías */}
            <View style={{ backgroundColor: 'white', borderRadius: 32, paddingHorizontal: 24, paddingVertical: 24 }}>
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
            <View style={[styles.howToCard, { marginBottom: 0, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderRadius: 32, borderWidth: 0, marginHorizontal: 0 }]}>
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
const UrgencyBanner = ({ onPress }) => (
    <View style={{ marginHorizontal: 20, marginTop: 2, marginBottom: 25 }}>
        <TouchableOpacity
            activeOpacity={0.9}
            style={{
                backgroundColor: '#FFF1F2', // Red-50
                borderRadius: 24,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#FECACA', // Red-200
                shadowColor: '#BE123C',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 3
            }}
            onPress={onPress}
        >
            <View style={{
                width: 48, height: 48,
                borderRadius: 24,
                backgroundColor: '#FFE4E6', // Red-100
                justifyContent: 'center', alignItems: 'center',
                marginRight: 16,
                borderWidth: 1,
                borderColor: '#FECACA'
            }}>
                <Feather name="zap" size={24} color="#E11D48" />
            </View>
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#881337', marginRight: 8 }}>Urgencias 24/7</Text>
                    <View style={{ backgroundColor: '#E11D48', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'white' }}>LIVE</Text>
                    </View>
                </View>
                <Text style={{ fontSize: 13, color: '#9F1239', marginTop: 2 }}>Plomeros, electricistas y cerrajeros en camino.</Text>
            </View>
            <View style={{ backgroundColor: 'white', padding: 8, borderRadius: 20 }}>
                <Feather name="arrow-right" size={20} color="#E11D48" />
            </View>
        </TouchableOpacity>
    </View>
);

// --- 4. FORMULARIO PRINCIPAL (CON LOGICA DE GPS Y CAMARA) ---
const ServiceForm = ({ onSubmit, isLoggedIn, onTriggerLogin, initialCategory, initialSubcategory, categories = [], allSubcategories = {}, currentUser, dynamicCopy }) => {
    const copy = dynamicCopy || HOME_COPY_OPTIONS[0];
    const [formData, setFormData] = useState({
        category: initialCategory || '', subcategory: initialSubcategory || '', title: '', description: '', location: ''
    });
    const [images, setImages] = useState([]);
    const [videos, setVideos] = useState([]); // Added video state
    const [isLocating, setIsLocating] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showCategoryGrid, setShowCategoryGrid] = useState(false);
    const [showSubcategoryGrid, setShowSubcategoryGrid] = useState(false);
    const [locationDetected, setLocationDetected] = useState(false);
    const titleInputRef = useRef(null);
    const locationInputRef = useRef(null);

    useEffect(() => {
        if (initialCategory) setFormData(prev => ({ ...prev, category: initialCategory }));
        if (initialSubcategory) setFormData(prev => ({ ...prev, subcategory: initialSubcategory }));
    }, [initialCategory, initialSubcategory]);

    // ... (rest of logic same until render) ...

    const handleLocationChange = (text) => {
        setFormData(prev => ({ ...prev, location: text }));
        setLocationDetected(false);
        if (text.length > 2) {
            const filtered = FLAT_ZONES_SUGGESTIONS.filter(z => z.toLowerCase().includes(text.toLowerCase()));
            setSuggestions(filtered.slice(0, 3)); // Max 3 sugerencias
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (zone) => {
        setFormData(prev => ({ ...prev, location: zone }));
        setShowSuggestions(false);
        setLocationDetected(true);
    };

    const handleLocateMe = async () => {
        setIsLocating(true);
        setLocationDetected(false);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Permiso denegado', 'Necesitamos permiso para acceder a tu ubicación.');
                setIsLocating(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            let address = await Location.reverseGeocodeAsync(location.coords);

            if (address && address.length > 0) {
                const item = address[0];
                // Construir una ubicación aproximada (Municipio, Ciudad)
                const zone = item.subregion || item.city || item.region;
                let city = item.city || item.region || 'Venezuela';

                // Normalización para Caracas
                if (city.toLowerCase() === 'caracas' || city.toLowerCase() === 'distrito capital') {
                    city = 'Gran Caracas';
                }

                const formatted = `${zone}, ${city} `;
                setFormData(prev => ({ ...prev, location: formatted }));
                setLocationDetected(true);
            } else {
                showAlert('Error', 'No pudimos determinar tu zona.');
            }
        } catch (error) {
            console.warn(error);
            showAlert('Error', 'Ocurrió un error al obtener la ubicación.');
        } finally {
            setIsLocating(false);
        }
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            showAlert("Permiso requerido", "Necesitas dar permiso para acceder a la galería.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setImages([...images, base64Img]);
        }
    };

    const pickVideo = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            showAlert("Permiso requerido", "Necesitas dar permiso para acceder a la galería.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setVideos([...videos, result.assets[0].uri]);
        }
    };

    const recordVideo = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        const audioResult = await ImagePicker.requestMicrophonePermissionsAsync();
        if (permissionResult.granted === false || audioResult.granted === false) {
            showAlert("Permiso requerido", "Necesitas acceso a cámara y micrófono.");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        });

        if (!result.canceled) {
            setVideos([...videos, result.assets[0].uri]);
        }
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            showAlert("Permiso requerido", "Necesitas dar permiso para usar la cámara.");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            quality: 0.5,
            base64: true,
            allowsEditing: true,
        });

        if (!result.canceled) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setImages([...images, base64Img]);
        }
    };

    const handlePreSubmit = () => {
        if (!formData.title || !formData.category) {
            showAlert('Faltan datos', 'Por favor completa al menos el título y la categoría.');
            return;
        }
        if (!isLoggedIn) {
            onTriggerLogin({ pendingData: { ...formData, images } });
        } else {
            onSubmit({ ...formData, images });
        }
    };

    const userName = currentUser?.name?.split(' ')[0] || '';

    // Personalización dinámica del título según el nombre del usuario
    const getDynamicTitle = () => {
        const title = copy.title;
        if (!userName) return title;

        // Insertar nombre de forma natural
        if (title.toLowerCase().startsWith('encuentra')) return `Alejandro, ${title.charAt(0).toLowerCase() + title.slice(1)}`;
        if (title.toLowerCase().startsWith('soluciona')) return `Alejandro, ${title.charAt(0).toLowerCase() + title.slice(1)}`;
        if (title.toLowerCase().startsWith('cualquier')) return `Alejandro, ${title.charAt(0).toLowerCase() + title.slice(1)}`;
        if (title.toLowerCase().startsWith('¿qué')) return `Alejandro, ${title}`;
        if (title.toLowerCase().startsWith('tu red')) return `Tu red, Alejandro`;

        return `${userName}, ${title.charAt(0).toLowerCase() + title.slice(1)}`;
    };

    const personalizedGreeting = getDynamicTitle();

    // Lógica para placeholders dinámicos
    const getPlaceholders = () => {
        if (formData.category && formData.subcategory) {
            const key = `${formData.category}:${formData.subcategory} `;
            if (CATEGORY_EXAMPLES[key]) return CATEGORY_EXAMPLES[key];
        }
        if (formData.category && CATEGORY_EXAMPLES[formData.category]) {
            return CATEGORY_EXAMPLES[formData.category];
        }
        return CATEGORY_EXAMPLES['default'];
    };

    const placeholders = getPlaceholders();

    const handleQuickAction = (cat, sub) => {
        setFormData(prev => ({ ...prev, category: cat, subcategory: sub }));
        // Esperamos a que el re-render muestre los campos y luego enfocamos
        setTimeout(() => {
            if (titleInputRef.current) {
                titleInputRef.current.focus();
            }
        }, 400);
    };

    return (
        <View style={styles.serviceFormCard}>
            <View style={[styles.serviceFormHeader, { flexDirection: 'row', alignItems: 'center' }]}>
                <View style={{ flex: 1, paddingRight: 15 }}>
                    <Text style={styles.serviceFormTitle}>{personalizedGreeting}</Text>
                </View>
                <View style={{ width: 85, height: 85, backgroundColor: '#FFF5ED', borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    <MaterialCommunityIcons name="toolbox" size={50} color="#EA580C" style={{ opacity: 0.9 }} />
                    <View style={{ position: 'absolute', right: 5, bottom: 5 }}>
                        <MaterialCommunityIcons name="map-marker" size={30} color="#2563EB" />
                    </View>
                </View>
            </View>
            <View style={styles.serviceFormContent}>
                <QuickActionsRow onActionPress={handleQuickAction} categories={categories} />
                <View style={{ marginBottom: 16 }}>
                    <Text style={styles.label}>Tipo de servicio</Text>
                    <TouchableOpacity
                        style={styles.pickerContainer}
                        onPress={() => setShowCategoryGrid(true)}
                    >
                        <Text style={[styles.input, { color: formData.category ? '#1F2937' : '#9CA3AF', fontWeight: 'bold', fontSize: 17 }]}>
                            {formData.category || "Seleccione..."}
                        </Text>
                        <ChevronDown name="chevron-down" size={20} color="#EA580C" />
                    </TouchableOpacity>
                </View>

                <CategoryGridModal
                    visible={showCategoryGrid}
                    onClose={() => setShowCategoryGrid(false)}
                    categories={categories}
                    onSelect={(c) => {
                        setFormData({ ...formData, category: c, subcategory: '' });
                        // Auto-open Subcategories after short delay to allow state update
                        setTimeout(() => setShowSubcategoryGrid(true), 300);
                    }}
                />

                {formData.category ? (
                    <View style={{ marginBottom: 16 }}>
                        <Text style={styles.label}>Especifica el servicio</Text>
                        <TouchableOpacity
                            style={styles.pickerContainer}
                            onPress={() => setShowSubcategoryGrid(true)}
                        >
                            <Text style={[styles.input, { color: formData.subcategory ? '#1F2937' : '#9CA3AF', fontWeight: 'bold', fontSize: 17 }]}>
                                {formData.subcategory || "Seleccione..."}
                            </Text>
                            <ChevronDown name="chevron-down" size={20} color="#EA580C" />
                        </TouchableOpacity>
                    </View>
                ) : null}

                <SubcategoryGridModal
                    visible={showSubcategoryGrid}
                    onClose={() => setShowSubcategoryGrid(false)}
                    categoryName={formData.category}
                    subcategories={allSubcategories[formData.category] || []}
                    color={categories.find(c => c.name === formData.category)?.color}
                    iconColor={categories.find(c => c.name === formData.category)?.iconColor}
                    onSelect={(s) => {
                        setFormData({ ...formData, subcategory: s });
                        // Auto-focus Title after selection - wait for render
                        setTimeout(() => {
                            if (titleInputRef.current) {
                                titleInputRef.current.focus();
                            }
                        }, 400);
                    }}
                />
                {formData.category && formData.subcategory ? (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Ponle un título a tu necesidad</Text>
                            <TextInput
                                ref={titleInputRef}
                                style={styles.inputBox}
                                placeholder="Ej: El aire acondicionado hace un ruido extraño"
                                placeholderTextColor="#9CA3AF"
                                value={formData.title}
                                onChangeText={t => setFormData({ ...formData, title: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Explícanos qué sucede</Text>
                            <TextInput
                                style={[styles.inputBox, { height: 120, textAlignVertical: 'top' }]}
                                multiline
                                placeholder="Cuanto más detalles nos des, mejor será el presupuesto. Ej: ¿Desde cuándo pasa? ¿Marca del aparato? ¿Hay escaleras? ¿Necesitas repuestos?"
                                placeholderTextColor="#9CA3AF"
                                value={formData.description}
                                onChangeText={t => setFormData({ ...formData, description: t })}
                            />
                        </View>
                    </>
                ) : null}
                <View style={[styles.inputGroup, { zIndex: 10 }]}>
                    <Text style={styles.label}>¿Dónde necesitas el servicio?</Text>

                    <Text style={[styles.privacyNote, { textAlign: 'left', marginBottom: 8, marginTop: 4 }]}>
                        Solo detectaremos tu municipio. Tu dirección exacta se mantiene privada.
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <View style={[styles.inputWrapper, { flex: 1, marginTop: 0 }]}>
                            <TextInput
                                ref={locationInputRef}
                                style={{ flex: 1, paddingVertical: 12, fontSize: 17, color: '#111827', fontWeight: 'bold' }}
                                placeholder="Ej: Chacao, Hatillo..."
                                placeholderTextColor="#9CA3AF"
                                value={formData.location}
                                onChangeText={handleLocationChange}
                            />
                            {locationDetected && (
                                <Feather name="check-circle" size={20} color="#10B981" style={{ marginLeft: 5 }} />
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.locationIconButton, { marginLeft: 12 }]}
                            onPress={handleLocateMe}
                            disabled={isLocating}
                        >
                            {isLocating ? (
                                <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                                <MaterialCommunityIcons name="map-marker" size={28} color="#EF4444" />
                            )}
                        </TouchableOpacity>
                    </View>
                    {showSuggestions && suggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            {suggestions.map((s, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.suggestionItem}
                                    onPress={() => handleSelectSuggestion(s)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MapPin name="map-pin" size={14} color="#6B7280" style={{ marginRight: 8 }} />
                                        <Text style={styles.suggestionText}>{s}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
                {formData.location ? (
                    <View style={[styles.inputGroup, { marginTop: 15 }]}>
                        <Text style={styles.label}>Complementa con una foto o video <Text style={{ fontSize: 12, fontWeight: 'normal', color: '#9CA3AF' }}>(opcional)</Text></Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                            {/* Botón: Subir Foto */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    height: 50,
                                    backgroundColor: '#F3F4F6',
                                    borderRadius: 12,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 8,
                                    flexDirection: 'row',
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB'
                                }}
                                onPress={pickImage}
                            >
                                <Feather name="image" size={20} color="#4B5563" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#4B5563', fontWeight: 'bold', fontSize: 13 }}>Galería</Text>
                            </TouchableOpacity>

                            {/* Botón: Tomar Foto */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    height: 50,
                                    backgroundColor: '#EFF6FF',
                                    borderRadius: 12,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 8,
                                    flexDirection: 'row',
                                    borderWidth: 1,
                                    borderColor: '#BFDBFE'
                                }}
                                onPress={takePhoto}
                            >
                                <Camera name="camera" size={20} color="#2563EB" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 13 }}>Cámara</Text>
                            </TouchableOpacity>

                            {/* Botón: Video */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    height: 50,
                                    backgroundColor: '#FEF2F2',
                                    borderRadius: 12,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    borderWidth: 1,
                                    borderColor: '#FECACA'
                                }}
                                onPress={() => {
                                    Alert.alert(
                                        "Añadir Video",
                                        "¿Grabar o Galería?",
                                        [
                                            { text: "Grabar", onPress: recordVideo },
                                            { text: "Galería", onPress: pickVideo },
                                            { text: "Cancelar", style: "cancel" }
                                        ]
                                    );
                                }}
                            >
                                <PlayCircle name="play-circle" size={20} color="#DC2626" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: 13 }}>Video</Text>
                            </TouchableOpacity>
                        </View>

                        {(images.length > 0 || videos.length > 0) && (
                            <ScrollView horizontal style={{ marginTop: 12 }} showsHorizontalScrollIndicator={false}>
                                {images.map((img, i) => (
                                    <View key={`img-${i}`} style={{ marginRight: 10, position: 'relative' }}>
                                        <Image source={{ uri: img }} style={{ width: 70, height: 70, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' }} />
                                        <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 2 }}>
                                            <Feather name="check" size={10} color="white" />
                                        </View>
                                    </View>
                                ))}
                                {videos.map((vid, i) => (
                                    <View key={`vid-${i}`} style={{ width: 70, height: 70, borderRadius: 10, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB' }}>
                                        <PlayCircle color="white" size={24} />
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <Text style={[styles.helperText, { textAlign: 'left', marginTop: 5, fontSize: 11 }]}>
                            *Añadir multimedia ayuda a recibir mejores presupuestos.
                        </Text>
                    </View>
                ) : null}

                <TouchableOpacity style={styles.searchButton} onPress={handlePreSubmit}>
                    <Text style={styles.searchButtonText}>{copy.buttonText}</Text>
                    <ChevronRight color="white" size={20} />
                </TouchableOpacity>
            </View>
        </View>
    );
}


// --- 5. PANTALLAS DE DETALLE ---

const RequestDetailClient = ({ request, onBack, onAcceptOffer, onOpenChat, onUpdateRequest, selectedBudget, setSelectedBudget, showBudgetModal, setShowBudgetModal, categories = [], onRejectOffer, onConfirmStart, onAddWorkPhoto, onFinish, onRate, onCloseRequest, currentUser, onAddTimelineEvent, onTogglePortfolio, onViewUserProfile, onViewImage }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [data, setData] = useState(request);
    const [showArchivedChats, setShowArchivedChats] = useState(false);

    // --- PRIVATE JOB MANAGEMENT REMOVED ---


    useEffect(() => { setData(request); }, [request]);

    // Force refresh detailed data on mount to ensure timeline/legacy data is present
    useEffect(() => {
        const loadFullDetails = async () => {
            try {
                const id = request._id || request.id;
                console.log("Fetching full details for:", id);
                const fresh = await api.getJob(id);
                const freshData = fresh.data || fresh;
                setData(freshData);
            } catch (e) {
                console.warn("Could not refresh job details:", e);
            }
        };
        loadFullDetails();
    }, []);

    const handleRejectOfferInternal = (proId) => {
        showConfirmation(
            "Confirmar Rechazo",
            "¿Estás seguro de rechazar este presupuesto?",
            () => onRejectOffer(request._id || request.id, proId, "Rechazado desde vista previa"),
            null,
            "Rechazar",
            "Cancelar",
            true
        );
    };

    const handleConfirmStartInternal = (startedOnTime) => {
        onConfirmStart(request.id, startedOnTime);
    };

    const takeWorkPhoto = async () => {
        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            base64: true,
        });
        if (!result.canceled) {
            onAddWorkPhoto(request._id || request.id, `data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleFinishInternal = () => {
        onFinish(request._id || request.id);
    };

    const handleRateInternal = (reviewData) => {
        onRate(request._id || request.id, reviewData);
    };

    const handleSave = async () => {
        try {
            // Resolver ID de categoría si es un nombre
            let categoryId = data.category;
            if (typeof data.category === 'object' && data.category._id) {
                categoryId = data.category._id;
            } else {
                // Si es string (nombre), buscar el ID en categories
                const catObj = categories.find(c => c.name === data.category);
                if (catObj) categoryId = catObj.id || catObj._id;
            }

            console.log("Saving job:", { ...data, category: categoryId });

            await api.updateJob(data._id || data.id, {
                title: data.title,
                description: data.description,
                category: categoryId,
                subcategory: data.subcategory,
                location: data.location,
                images: data.images
            });
            setIsEditing(false);
            if (onUpdateRequest) onUpdateRequest(data);
            showAlert("Actualizado", "Los cambios han sido guardados.");
        } catch (e) {
            showAlert("Error", "No se pudo actualizar: " + e.message);
        }
    };

    const handleAddImage = () => {
        // En web window.confirm no soporta 3 botones. Usamos logica simplificada o custom modal si fuera necesario.
        // Como fallback para web, mostramos alerta y asumimos galeria (o window.prompt)
        // Pero para simplificar en este fix rapido:
        if (Platform.OS === 'web') {
            // En web ImagePicker.launchImageLibraryAsync abre el selector de archivo nativo (funciona como galeria/camara en movil web)
            pickImage();
            return;
        }

        Alert.alert(
            "Agregar Foto",
            "Selecciona una opción",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Cámara", onPress: takePhoto },
                { text: "Galería", onPress: pickImage }
            ]
        );
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            showAlert("Permiso requerido", "Se requiere acceso a la cámara.");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            base64: true,
            allowsEditing: true, // Optional
        });

        if (!result.canceled) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            const newImages = [...(data.images || []), base64Img];
            setData({ ...data, images: newImages });
        }
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            showAlert("Permiso requerido", "Se requiere acceso a la galería.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            const newImages = [...(data.images || []), base64Img];
            setData({ ...data, images: newImages });
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* ORANGE HEADER TALL */}
            <View style={{
                backgroundColor: '#EA580C',
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 30,
                borderBottomLeftRadius: 30,
                borderBottomRightRadius: 30,
                elevation: 6,
                ...Platform.select({
                    web: { boxShadow: '0px 4px 8px rgba(234, 88, 12, 0.2)' },
                    default: {
                        shadowColor: '#EA580C',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8
                    }
                })
            }}>
                {isEditing ? (
                    <View>
                        <TouchableOpacity onPress={onBack} style={{ marginBottom: 15 }}>
                            <Feather name="arrow-left" size={24} color="white" />
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', letterSpacing: 1 }}>EDITANDO SOLICITUD</Text>
                            <TouchableOpacity
                                onPress={handleSave}
                                style={{ backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 }}
                            >
                                <Text style={{ color: '#EA580C', fontWeight: 'bold', fontSize: 13 }}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            value={data.title}
                            onChangeText={t => setData({ ...data, title: t })}
                            style={{ fontSize: 24, fontWeight: 'bold', color: 'white', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.5)', paddingVertical: 6, marginBottom: 15 }}
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Feather name="map-pin" size={14} color="white" />
                            <TextInput
                                value={data.location}
                                onChangeText={t => setData({ ...data, location: t })}
                                style={{ flex: 1, marginLeft: 8, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.5)', paddingVertical: 4, fontSize: 14, color: 'white' }}
                                placeholder="Ciudad, Estado"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                            />
                        </View>
                    </View>
                ) : (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <TouchableOpacity onPress={onBack} style={{ marginRight: 12, marginTop: 4 }}>
                            <Feather name="arrow-left" size={24} color="white" />
                        </TouchableOpacity>
                        <View style={{ flex: 1, marginRight: 15 }}>
                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>
                                {(typeof data.category === 'object' ? data.category.name : data.category)} • {(typeof data.subcategory === 'object' ? data.subcategory.name : (data.subcategory || 'General'))}
                            </Text>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', lineHeight: 28 }}>{data.title}</Text>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                                <View style={{
                                    backgroundColor: getClientStatusColor(getClientStatus(data)).bg,
                                    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 12
                                }}>
                                    <Text style={{ color: getClientStatusColor(getClientStatus(data)).text, fontSize: 10, fontWeight: 'bold' }}>
                                        {getClientStatus(data).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                                    <Feather name="map-pin" size={12} color="white" />
                                    <Text style={{ color: 'white', fontSize: 11, marginLeft: 4 }}>{data.location || 'Sin ubicación'}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Feather name="calendar" size={12} color="white" />
                                    <Text style={{ color: 'white', fontSize: 11, marginLeft: 4 }}>{(data.createdAt && !isNaN(new Date(data.createdAt))) ? new Date(data.createdAt).toLocaleDateString() : 'Reciente'}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => setIsEditing(true)}
                                style={{ backgroundColor: 'rgba(255,255,255,0.25)', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
                            >
                                <Feather name="edit-2" size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* CONTENIDO BLANCO */}
                <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 2, marginHorizontal: 20 }}>
                    {isEditing ? (
                        <View>
                            <CustomDropdown
                                label="Categoría"
                                value={typeof data.category === 'object' ? data.category.name : data.category}
                                options={categories.map(c => c.name)}
                                onSelect={(val) => setData({ ...data, category: val, subcategory: null })}
                                placeholder="Selecciona categoría"
                            />
                            <CustomDropdown
                                label="Subcategoría"
                                value={data.subcategory}
                                options={(() => {
                                    const catName = typeof data.category === 'object' ? data.category.name : data.category;
                                    const catObj = categories.find(c => c.name === catName);
                                    return catObj ? (catObj.subcategories || []) : [];
                                })()}
                                onSelect={(val) => setData({ ...data, subcategory: val })}
                                placeholder="Selecciona subcategoría"
                            />
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6B7280', marginBottom: 4, marginTop: 10 }}>Descripción</Text>
                        </View>
                    ) : null}

                    {isEditing ? (
                        <TextInput
                            value={data.description}
                            onChangeText={t => setData({ ...data, description: t })}
                            multiline
                            style={{ color: '#374151', fontSize: 15, lineHeight: 24, minHeight: 80, textAlignVertical: 'top' }}
                            placeholder="Descripción del problema..."
                        />
                    ) : (
                        <Text style={{ color: '#374151', fontSize: 15, lineHeight: 24 }}>{data.description}</Text>
                    )}

                    {/* FOTOS */}
                    <View style={{ marginTop: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6B7280' }}>FOTOS ADJUNTAS</Text>
                            {isEditing && (
                                <TouchableOpacity onPress={handleAddImage} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Feather name="plus-circle" size={16} color="#EA580C" />
                                    <Text style={{ fontSize: 12, color: '#EA580C', marginLeft: 4, fontWeight: 'bold' }}>Agregar</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {(data.images && data.images.length > 0) || isEditing ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {data.images && data.images.map((img, i) => (
                                    <View key={i} style={{ position: 'relative', marginRight: 10 }}>
                                        <TouchableOpacity onPress={() => onViewImage(img)}>
                                            <Image source={{ uri: img }} style={{ width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' }} />
                                        </TouchableOpacity>
                                        {isEditing && (
                                            <TouchableOpacity
                                                style={{ position: 'absolute', top: -8, right: -8, backgroundColor: 'white', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', elevation: 2 }}
                                                onPress={() => {
                                                    const newImages = [...data.images];
                                                    newImages.splice(i, 1);
                                                    setData({ ...data, images: newImages });
                                                }}
                                            >
                                                <Feather name="x" size={14} color="#EF4444" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        ) : null}
                    </View>
                </View>

                {/* SECCIÓN UNIFICADA DE INTERACCIONES (CHATS + OFERTAS) */}
                <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text style={styles.sectionTitle}>Interacciones y Ofertas</Text>
                        <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                            <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 12 }}>
                                {Array.from(new Set([
                                    ...(request.conversations || []).map(c => c.proId),
                                    ...(request.offers || []).map(o => o.proId)
                                ])).length}
                            </Text>
                        </View>
                    </View>

                    {(!request.conversations || request.conversations.length === 0) && (!request.offers || request.offers.length === 0) && (
                        <View style={{ alignItems: 'center', padding: 30, backgroundColor: 'white', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E5E7EB' }}>
                            <Feather name="message-square" size={32} color="#D1D5DB" />
                            <Text style={{ color: '#999', marginTop: 10 }}>Aún no hay mensajes ni ofertas.</Text>
                        </View>
                    )}

                    {(() => {
                        const proMap = {};
                        (request.conversations || []).forEach(conv => {
                            if (!proMap[conv.proId]) proMap[conv.proId] = { id: conv.proId, name: conv.proName, avatar: conv.proAvatar, email: conv.proEmail, rating: conv.proRating };
                            proMap[conv.proId].chat = conv;
                        });
                        (request.offers || []).forEach((offer, idx) => {
                            if (!proMap[offer.proId]) proMap[offer.proId] = { id: offer.proId, name: offer.proName, avatar: offer.proAvatar, rating: offer.proRating };
                            proMap[offer.proId].offer = {
                                ...offer,
                                index: idx,
                                proName: proMap[offer.proId].name,
                                proAvatar: proMap[offer.proId].avatar
                            };
                        });

                        const allPros = Object.values(proMap).sort((a, b) => {
                            // PRIORITY 1: Accepted Offer ALWAYS First
                            if (a.offer?.status === 'accepted') return -1;
                            if (b.offer?.status === 'accepted') return 1;

                            // PRIORITY 2: Recent Activity
                            const getLastTime = (p) => {
                                const msgTime = p.chat?.messages?.length > 0 ? new Date(p.chat.messages[p.chat.messages.length - 1].timestamp).getTime() : 0;
                                const offerTime = p.offer?.updatedAt ? new Date(p.offer.updatedAt).getTime() : (p.offer?.createdAt ? new Date(p.offer.createdAt).getTime() : 0);
                                return Math.max(msgTime, offerTime);
                            };
                            return getLastTime(b) - getLastTime(a);
                        });

                        // Logic for Hiding/Archiving
                        const winner = allPros.find(p => p.offer?.status === 'accepted');
                        let visiblePros = allPros;
                        let archivedPros = [];

                        if (winner) {
                            visiblePros = [winner];
                            archivedPros = allPros.filter(p => p !== winner);
                        }

                        // Determine what to render based on toggle
                        const prosToRender = showArchivedChats ? allPros : visiblePros;
                        const hasHidden = archivedPros.length > 0 && !showArchivedChats;

                        return (
                            <View>
                                {prosToRender.map((pro, index) => {
                                    const messages = pro.chat?.messages || [];
                                    const lastThree = messages.slice(-3);
                                    const lastMsg = lastThree.length > 0 ? lastThree[lastThree.length - 1] : null;
                                    const isLastFromPro = lastMsg?.sender === 'pro';

                                    // Check if this specific card is the winner to modify layout
                                    const isWinner = pro.offer?.status === 'accepted';

                                    return (
                                        <View key={index} style={{ backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                            {/* Cabecera Pro */}
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                                                <TouchableOpacity
                                                    style={{ flexDirection: 'row', alignItems: 'center' }}
                                                    onPress={() => onViewUserProfile && onViewUserProfile(pro)}
                                                >
                                                    <Image
                                                        source={{ uri: pro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.name)}&background=random` }}
                                                        style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' }}
                                                    />
                                                    <View>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#1E293B' }}>{pro.name}</Text>
                                                            <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 }}>
                                                                <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: 'bold' }}>PRO</Text>
                                                            </View>
                                                        </View>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                            <FontAwesome5 name="star" solid size={11} color="#F59E0B" />
                                                            <Text style={{ fontSize: 13, color: '#64748B', marginLeft: 5, fontWeight: '600' }}>{pro.rating || '5.0'}</Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                {pro.offer && (
                                                    <View style={{ alignItems: 'flex-end' }}>
                                                        <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 22 }}>
                                                            {pro.offer.currency || '$'} {pro.offer.amount || pro.offer.price || '0'}
                                                        </Text>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            {pro.offer.status === 'rejected' && (
                                                                <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 5 }}>
                                                                    <Text style={{ fontSize: 9, color: '#EF4444', fontWeight: 'bold' }}>RECHAZADO</Text>
                                                                </View>
                                                            )}
                                                            <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: 'bold' }}>OFERTA</Text>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Últimos Mensajes del Chat Estilo Burbuja */}
                                            {lastThree.length > 0 && (
                                                <View style={{ marginBottom: 15 }}>
                                                    {lastThree.map((msg, mIdx) => (
                                                        <View key={mIdx} style={{
                                                            backgroundColor: msg.sender === 'pro' ? '#F1F5F9' : '#FFF7ED',
                                                            padding: 10,
                                                            borderRadius: 12,
                                                            borderBottomLeftRadius: msg.sender === 'pro' ? 2 : 12,
                                                            borderBottomRightRadius: msg.sender === 'pro' ? 12 : 2,
                                                            marginBottom: 6,
                                                            alignSelf: msg.sender === 'pro' ? 'flex-start' : 'flex-end',
                                                            maxWidth: '85%'
                                                        }}>
                                                            <Text style={{ fontSize: 13, color: '#334155' }}>
                                                                {msg.text || (msg.media ? '📷 Foto/Video' : '...')}
                                                            </Text>
                                                            <Text style={{ fontSize: 8, color: '#94A3B8', marginTop: 2, textAlign: 'right' }}>
                                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </Text>
                                                        </View>
                                                    ))}

                                                    <TouchableOpacity
                                                        style={{
                                                            backgroundColor: isLastFromPro ? '#EA580C' : 'white',
                                                            paddingVertical: 12,
                                                            borderRadius: 12,
                                                            alignItems: 'center',
                                                            borderWidth: 1,
                                                            borderColor: '#EA580C',
                                                            elevation: isLastFromPro ? 2 : 0,
                                                            marginTop: 5
                                                        }}
                                                        onPress={() => onOpenChat && onOpenChat(request, {
                                                            name: pro.name,
                                                            role: 'pro',
                                                            email: pro.email,
                                                            id: pro.id,
                                                            avatar: pro.avatar
                                                        })}
                                                    >
                                                        <Text style={{ color: isLastFromPro ? 'white' : '#EA580C', fontWeight: 'bold', fontSize: 14 }}>
                                                            {isLastFromPro ? 'Responder' : 'Preguntar'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}

                                            {/* Información del Presupuesto */}
                                            {/* BANNER ACEPTADO */}
                                            {pro.offer && pro.offer.status === 'accepted' && (
                                                <View style={{ marginBottom: 15, padding: 12, backgroundColor: '#ECFDF5', borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0' }}>
                                                    <Text style={{ color: '#059669', fontWeight: 'bold', textAlign: 'center' }}>✅ PROPUESTA ACEPTADA</Text>
                                                    <Text style={{ color: '#047857', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                                                        Aceptada el: {new Date(pro.offer.updatedAt || Date.now()).toLocaleDateString()} a las {new Date(pro.offer.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Text>

                                                </View>
                                            )}
                                            {pro.offer && (
                                                <View style={{ backgroundColor: '#F0F9FF', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#BAE6FD' }}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                        <Text style={{ fontWeight: 'bold', color: '#0369A1', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Presupuesto Recibido</Text>

                                                        {/* REMOVED "VER DETALLE" BUTTON FOR WINNER - SHOW INLINE */}
                                                        {!isWinner && (
                                                            <TouchableOpacity
                                                                style={{ backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#0284C7' }}
                                                                onPress={() => {
                                                                    setSelectedBudget(pro.offer);
                                                                    setShowBudgetModal(true);
                                                                }}
                                                            >
                                                                <Text style={{ color: '#0284C7', fontWeight: 'bold', fontSize: 11 }}>VER DETALLE</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>

                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                        <View>
                                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginBottom: 2 }}>MONTO</Text>
                                                            <Text style={{ fontWeight: 'bold', color: '#0F172A', fontSize: 18 }}>
                                                                {pro.offer.currency || '$'} {pro.offer.amount || pro.offer.price || '0'}
                                                            </Text>
                                                        </View>
                                                        <View style={{ alignItems: 'center' }}>
                                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginBottom: 2 }}>INICIO</Text>
                                                            <Text style={{ fontWeight: '600', color: '#334155', fontSize: 13 }}>{pro.offer.startDate || 'Inmediato'}</Text>
                                                        </View>
                                                        <View style={{ alignItems: 'flex-end' }}>
                                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginBottom: 2 }}>DURACIÓN</Text>
                                                            <Text style={{ fontWeight: '600', color: '#334155', fontSize: 13 }}>{pro.offer.duration || 'N/A'}</Text>
                                                        </View>
                                                    </View>

                                                    {/* NEW: Inline Description for Winner or if expanded */}
                                                    {isWinner && (
                                                        <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#BAE6FD', gap: 12 }}>

                                                            {/* ITEMS LIST */}
                                                            {pro.offer.items && pro.offer.items.length > 0 && (
                                                                <View>
                                                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0369A1', marginBottom: 6, textTransform: 'uppercase' }}>Ítems Confirmados</Text>
                                                                    {pro.offer.items.map((item, idx) => (
                                                                        <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 4 }}>
                                                                            <Text style={{ flex: 1, fontSize: 13, color: '#334155', lineHeight: 20 }}>• {item.description}</Text>
                                                                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A', marginLeft: 10 }}>
                                                                                {pro.offer.currency || 'USD'} {Number(item.price).toFixed(2)}
                                                                            </Text>
                                                                        </View>
                                                                    ))}
                                                                </View>
                                                            )}

                                                            {/* DESCRIPTION LINE (If Separate) */}
                                                            {(pro.offer.descriptionLine || pro.offer.description) && (
                                                                <View>
                                                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0369A1', marginBottom: 2, textTransform: 'uppercase' }}>Descripción General</Text>
                                                                    <Text style={{ fontSize: 13, color: '#334155', lineHeight: 20 }}>{pro.offer.descriptionLine || pro.offer.description}</Text>
                                                                </View>
                                                            )}

                                                            {/* CONDITIONS GRID */}
                                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 }}>
                                                                {pro.offer.paymentTerms && (
                                                                    <View style={{ width: '48%', backgroundColor: '#EFF6FF', padding: 8, borderRadius: 8 }}>
                                                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1D4ED8', marginBottom: 2 }}>FORMA DE PAGO</Text>
                                                                        <Text style={{ fontSize: 12, color: '#1E3A8A' }}>{pro.offer.paymentTerms}</Text>
                                                                    </View>
                                                                )}
                                                                {pro.offer.warranty && (
                                                                    <View style={{ width: '48%', backgroundColor: '#EFF6FF', padding: 8, borderRadius: 8 }}>
                                                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1D4ED8', marginBottom: 2 }}>GARANTÍA</Text>
                                                                        <Text style={{ fontSize: 12, color: '#1E3A8A' }}>{pro.offer.warranty}</Text>
                                                                    </View>
                                                                )}
                                                            </View>

                                                            {/* FULL TEXT SECTIONS */}
                                                            {pro.offer.conditions && (
                                                                <View>
                                                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 2 }}>CONDICIONES</Text>
                                                                    <Text style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8 }}>
                                                                        {pro.offer.conditions}
                                                                    </Text>
                                                                </View>
                                                            )}

                                                            {pro.offer.observations && (
                                                                <View>
                                                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 2 }}>OBSERVACIONES</Text>
                                                                    <Text style={{ fontSize: 12, color: '#475569', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8 }}>
                                                                        {pro.offer.observations}
                                                                    </Text>
                                                                </View>
                                                            )}

                                                            {/* TAX SUMMARY */}
                                                            {pro.offer.addTax && (
                                                                <View style={{ alignItems: 'flex-end', marginTop: 5 }}>
                                                                    <Text style={{ fontSize: 11, color: '#64748B' }}>Incluye Impuestos ({pro.offer.taxRate || 16}%)</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    )}

                                                    {pro.offer.status === 'rejected' && pro.offer.rejectionReason && (
                                                        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#BAE6FD' }}>
                                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold' }}>MOTIVO DEL CIERRE:</Text>
                                                            <Text style={{ fontSize: 12, color: '#EF4444', fontStyle: 'italic' }}>
                                                                {pro.offer.rejectionReason.includes('asignado a otro') ? "Se concretó con otro profesional en la aplicación." : `"${pro.offer.rejectionReason}"`}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            )}

                                            {/* Botones de Finalización (Aceptar / Rechazar) o Estado */}
                                            {pro.offer && (
                                                pro.offer.status === 'rejected' ? (
                                                    <View style={{ marginTop: 10, alignItems: 'center', padding: 10, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                                                        <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>RECHAZADO</Text>
                                                        <TouchableOpacity onPress={() => { setSelectedBudget(pro.offer); setShowBudgetModal(true); }}>
                                                            <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4, textDecorationLine: 'underline' }}>Ver detalle / Cambiar</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : pro.offer.status === 'accepted' ? null : (
                                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                                        <TouchableOpacity
                                                            style={{
                                                                flex: 1,
                                                                height: 50,
                                                                borderRadius: 12,
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                borderWidth: 1,
                                                                borderColor: '#FCA5A5',
                                                                backgroundColor: '#FEF2F2'
                                                            }}
                                                            onPress={() => handleRejectOfferInternal(pro.id)}
                                                        >
                                                            <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Rechazar</Text>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            style={{ flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10B981', elevation: 2 }}
                                                            onPress={() => onAcceptOffer && onAcceptOffer(request.id, pro.id)}
                                                        >
                                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Aceptar</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                )
                                            )}
                                        </View>
                                    );
                                })}

                                {/* Toggle Button for Archived Chats */}
                                {hasHidden && (
                                    <TouchableOpacity
                                        style={{ padding: 15, alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, marginTop: 10, marginBottom: 20 }}
                                        onPress={() => setShowArchivedChats(true)}
                                    >
                                        <Text style={{ color: '#64748B', fontWeight: 'bold' }}>VER CHATS ANTERIORES ({archivedPros.length})</Text>
                                    </TouchableOpacity>
                                )}
                                {showArchivedChats && archivedPros.length > 0 && winner && (
                                    <TouchableOpacity
                                        style={{ padding: 15, alignItems: 'center', marginTop: 10 }}
                                        onPress={() => setShowArchivedChats(false)}
                                    >
                                        <Text style={{ color: '#64748B' }}>OCULTAR CHATS ANTERIORES</Text>
                                    </TouchableOpacity>
                                )}



                            </View>
                        );
                    })()}
                </View>

                {/* SHOW TIMELINE IF OFFER ACCEPTED OR TRACKING STARTED */}
                {(data.offers?.some(o => o.status === 'accepted') || ['contracted', 'started', 'in_progress', 'completed', 'finished'].includes(data.trackingStatus) || ['TERMINADO', 'Culminada', 'rated', 'completed'].includes(data.status)) && (
                    <ProjectTimeline
                        job={data}
                        userMode="client"
                        currentUser={currentUser}
                        onConfirmStart={handleConfirmStartInternal}
                        onAddTimelineEvent={onAddTimelineEvent}
                        onFinish={handleFinishInternal}
                        onRate={handleRateInternal}
                        onTogglePortfolio={onTogglePortfolio}
                        onViewImage={onViewImage}
                    />
                )}

                {/* BOTÓN ELIMINAR SOLICITUD (Solo si está activa/abierta) */}
                {(data.status === 'active' || data.status === 'open' || data.status === 'Abierto' || data.status === 'NUEVA') && (
                    <View style={{ marginTop: 20, marginBottom: 40, paddingHorizontal: 20 }}>
                        <TouchableOpacity
                            onPress={onCloseRequest}
                            style={{
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                                padding: 15, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA'
                            }}
                        >
                            <Feather name="trash-2" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Eliminar Solicitud</Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView >

            {/* Modal de Detalle de Presupuesto */}
            <Modal
                visible={showBudgetModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowBudgetModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1F2937' }}>Detalle del Presupuesto</Text>
                            <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                                <Feather name="x" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {selectedBudget && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* ENCABEZADO PROFESIONAL CLIENTE VIEW */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#2563EB', marginBottom: 20 }}>
                                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E2E8F0', overflow: 'hidden', borderWidth: 2, borderColor: 'white', elevation: 2 }}>
                                        {selectedBudget.proAvatar ? (
                                            <Image source={{ uri: selectedBudget.proAvatar }} style={{ width: '100%', height: '100%' }} />
                                        ) : (
                                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                <Feather name="user" size={30} color="#94A3B8" />
                                            </View>
                                        )}
                                    </View>
                                    <View style={{ marginLeft: 16, flex: 1 }}>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B' }}>{selectedBudget.proName}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <Feather name="calendar" size={12} color="#64748B" />
                                            <Text style={{ fontSize: 12, color: '#64748B', marginLeft: 4 }}>Fecha: {new Date(selectedBudget.date || selectedBudget.createdAt || Date.now()).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1E40AF' }}>OFERTA</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* DESGLOSE DE TRABAJO */}
                                <View style={{ marginBottom: 24 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ width: 3, height: 16, backgroundColor: '#2563EB', marginRight: 8, borderRadius: 2 }} />
                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1E293B' }}>DESGLOSE DE TRABAJO</Text>
                                    </View>

                                    {selectedBudget.items && selectedBudget.items.length > 0 && (
                                        <View style={{ backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' }}>
                                            {selectedBudget.items.map((item, i) => (
                                                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: i === selectedBudget.items.length - 1 ? 0 : 1, borderBottomColor: '#F8FAFC' }}>
                                                    <View style={{ flex: 1, marginRight: 16 }}>
                                                        <Text style={{ fontSize: 14, color: '#475569', fontWeight: '500' }}>{item.description}</Text>
                                                    </View>
                                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>
                                                        {selectedBudget.currency || '$'} {Number(item.price).toFixed(2)}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {selectedBudget.descriptionLine && (
                                        <View style={{ marginTop: 12, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' }}>
                                            <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 18 }}>{selectedBudget.descriptionLine}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* TOTAL Y MONTO */}
                                <View style={{ backgroundColor: '#1E293B', padding: 20, borderRadius: 20, marginBottom: 24, elevation: 4 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View>
                                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', letterSpacing: 1 }}>TOTAL ESTIMADO</Text>
                                            {selectedBudget.addTax && (
                                                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Incluye IVA ({selectedBudget.taxRate || 16}%)</Text>
                                            )}
                                        </View>
                                        <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
                                            {selectedBudget.currency || '$'} {Number(selectedBudget.amount || selectedBudget.price).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>

                                {/* DETALLES Y COMPROMISOS */}
                                <View style={{ marginBottom: 24 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ width: 3, height: 16, backgroundColor: '#2563EB', marginRight: 8, borderRadius: 2 }} />
                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1E293B' }}>DETALLES DE EJECUCIÓN</Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' }}>
                                            <Feather name="calendar" size={16} color="#2563EB" />
                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginTop: 6, textTransform: 'uppercase' }}>Inicio</Text>
                                            <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 }}>{selectedBudget.startDate || 'A convenir'}</Text>
                                        </View>
                                        <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' }}>
                                            <Feather name="clock" size={16} color="#2563EB" />
                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginTop: 6, textTransform: 'uppercase' }}>Duración</Text>
                                            <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 }}>{selectedBudget.duration || selectedBudget.executionTime || 'N/A'}</Text>
                                        </View>
                                        <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' }}>
                                            <Feather name="credit-card" size={16} color="#2563EB" />
                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginTop: 6, textTransform: 'uppercase' }}>Pago</Text>
                                            <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 }}>{selectedBudget.paymentTerms || 'N/A'}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* CONDICIONES Y GARANTIAS */}
                                <View style={{ gap: 15, marginBottom: 20 }}>
                                    {selectedBudget.conditions && (
                                        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Feather name="file-text" size={16} color="#2563EB" style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>Condiciones</Text>
                                            </View>
                                            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>{selectedBudget.conditions}</Text>
                                        </View>
                                    )}

                                    {selectedBudget.warranty && (
                                        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Feather name="shield" size={16} color="#059669" style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>Garantía</Text>
                                            </View>
                                            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>{selectedBudget.warranty}</Text>
                                        </View>
                                    )}

                                    {selectedBudget.observations && (
                                        <View style={{ backgroundColor: '#F0F9FF', padding: 16, borderRadius: 16 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Feather name="info" size={16} color="#2563EB" style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>Observaciones Adicionales</Text>
                                            </View>
                                            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20, fontStyle: 'italic' }}>{selectedBudget.observations}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Botones de Compartir */}
                                <View style={{ marginBottom: 24 }}>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 12, textAlign: 'center' }}>COMPARTIR O EXPORTAR</Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#25D366', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 2 }}
                                            onPress={() => Linking.openURL(`whatsapp://send?text=Hola, te comparto el presupuesto de ${selectedBudget.proName} por un monto de $${selectedBudget.price}.`)}
                                        >
                                            <FontAwesome5 name="whatsapp" size={24} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#EA4335', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 2 }}
                                            onPress={() => Linking.openURL(`mailto:?subject=Presupuesto de ${selectedBudget.proName}&body=Adjunto los detalles del presupuesto por un monto de $${selectedBudget.price}.`)}
                                        >
                                            <MaterialIcons name="mail" size={24} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#1F2937', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 2 }}
                                            onPress={() => showAlert("Exportar PDF", "Generando documento PDF... (Funcionalidad de impresión habilitada)")}
                                        >
                                            <Feather name="printer" size={24} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TextInput
                                    placeholder="Motivo del rechazo (opcional)..."
                                    style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' }}
                                    value={rejectionReason}
                                    onChangeText={setRejectionReason}
                                />

                                <View style={{ gap: 10 }}>
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                                        onPress={() => {
                                            setShowBudgetModal(false);
                                            onAcceptOffer(request.id, selectedBudget.proId);
                                        }}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Aceptar Presupuesto</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{ backgroundColor: 'white', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' }}
                                        onPress={() => {
                                            setShowBudgetModal(false);
                                            onRejectOffer(request.id, selectedBudget.proId, rejectionReason || "No especificado");
                                            setRejectionReason("");
                                        }}
                                    >
                                        <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 16 }}>Rechazar Presupuesto</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>


        </View >
    );
};

const JobDetailPro = ({ job: initialJob, onBack, onSendQuote, onOpenChat, proStatus, onUpdateStatus, onArchive, onGoToQuote, onViewProfile, currentUser, onConfirmStart, onAddWorkPhoto, onFinish, onRate, onAddTimelineEvent, onStartJob, categories, userMode, onTogglePortfolio, onViewImage }) => {
    const [job, setJob] = useState(initialJob);
    const [showMyProposal, setShowMyProposal] = useState(false);

    // Sync with prop updates
    useEffect(() => { setJob(initialJob); }, [initialJob]);

    // Force refresh detailed data on mount
    useEffect(() => {
        const loadFullDetails = async () => {
            try {
                const id = initialJob._id || initialJob.id;
                console.log("JobDetailPro: Fetching full details for:", id);
                const fresh = await api.getJob(id);
                const freshData = fresh.data || fresh;
                setJob(freshData);
            } catch (e) {
                console.warn("JobDetailPro: Could not refresh job details:", e);
            }
        };
        loadFullDetails();
    }, []);

    // Al abrir, si es NUEVA, pasar a ABIERTA
    useEffect(() => {
        if (proStatus === 'NUEVA') {
            onUpdateStatus('ABIERTA');
        }
    }, []);

    // Pro status color helper moved to top level as getProStatusColor

    // Encontrar mi oferta
    const myOffer = job.offers?.find(o =>
        areIdsEqual(o.proId?._id || o.proId, currentUser?._id) ||
        o.proEmail === currentUser?.email
    );

    // Check if I am the winner
    const isWinner = myOffer && myOffer.status === 'accepted';

    // Encontrar conversación para este pro
    // Si soy pro, en teoría solo debo tener una o ninguna en el objeto job (filtrado por backend)
    // Pero usamos una búsqueda segura
    const myConversation = job.conversations?.find(c =>
        areIdsEqual(c.proId?._id || c.proId, currentUser?._id) ||
        c.proEmail === currentUser?.email ||
        (proStatus !== 'NUEVA' && job.conversations && job.conversations.length === 1 && (userMode === 'pro' || currentUser?.role === 'professional'))
    );
    const messages = myConversation?.messages || [];
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const isClientLast = lastMsg?.sender === 'client';

    const takeWorkPhoto = async () => {
        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            base64: true,
        });
        if (!result.canceled) {
            onAddWorkPhoto(job._id || job.id, `data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleFinishInternal = () => {
        onFinish(job._id || job.id);
    };

    const handleRateInternal = (reviewData) => {
        onRate(job._id || job.id, reviewData);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Modal para ver imagen ampliada eliminado - se usa el global */}

            {/* Modal para ver MI propuesta */}
            <Modal visible={showMyProposal} transparent animationType="slide" onRequestClose={() => setShowMyProposal(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937' }}>Mi Propuesta Enviada</Text>
                            <TouchableOpacity onPress={() => setShowMyProposal(false)}>
                                <Feather name="x" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        {myOffer ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* ENCABEZADO PROFESIONAL */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#2563EB', marginBottom: 20 }}>
                                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E2E8F0', overflow: 'hidden', borderWidth: 2, borderColor: 'white', elevation: 2 }}>
                                        {currentUser.avatar ? (
                                            <Image source={{ uri: currentUser.avatar }} style={{ width: '100%', height: '100%' }} />
                                        ) : (
                                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                <Feather name="user" size={30} color="#94A3B8" />
                                            </View>
                                        )}
                                    </View>
                                    <View style={{ marginLeft: 16, flex: 1 }}>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B' }}>{currentUser.name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <Feather name="calendar" size={12} color="#64748B" />
                                            <Text style={{ fontSize: 12, color: '#64748B', marginLeft: 4 }}>Emitido: {new Date(myOffer.createdAt || Date.now()).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1E40AF' }}>PRESUPUESTO</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* DESGLOSE DE TRABAJO */}
                                <View style={{ marginBottom: 24 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ width: 3, height: 16, backgroundColor: '#2563EB', marginRight: 8, borderRadius: 2 }} />
                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1E293B' }}>DESGLOSE DE TRABAJO</Text>
                                    </View>

                                    {myOffer.items && myOffer.items.length > 0 && (
                                        <View style={{ backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' }}>
                                            {myOffer.items.map((item, i) => (
                                                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: i === myOffer.items.length - 1 ? 0 : 1, borderBottomColor: '#F8FAFC' }}>
                                                    <View style={{ flex: 1, marginRight: 16 }}>
                                                        <Text style={{ fontSize: 14, color: '#475569', fontWeight: '500' }}>{item.description}</Text>
                                                    </View>
                                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>
                                                        {myOffer.currency || '$'} {Number(item.price).toFixed(2)}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {myOffer.descriptionLine && (
                                        <View style={{ marginTop: 12, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' }}>
                                            <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 18 }}>{myOffer.descriptionLine}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* TOTAL Y MONTO */}
                                <View style={{ backgroundColor: '#1E293B', padding: 20, borderRadius: 20, marginBottom: 24, elevation: 4 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View>
                                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', letterSpacing: 1 }}>TOTAL A PAGAR</Text>
                                            {myOffer.addTax && (
                                                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Incluye IVA ({myOffer.taxRate}%)</Text>
                                            )}
                                        </View>
                                        <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
                                            {myOffer.currency || '$'} {Number(myOffer.amount || myOffer.price).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>

                                {/* DETALLES Y COMPROMISOS */}
                                <View style={{ marginBottom: 24 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ width: 3, height: 16, backgroundColor: '#2563EB', marginRight: 8, borderRadius: 2 }} />
                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1E293B' }}>DETALLES DE EJECUCIÓN</Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' }}>
                                            <Feather name="calendar" size={16} color="#2563EB" />
                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginTop: 6, textTransform: 'uppercase' }}>Inicio</Text>
                                            <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 }}>{myOffer.startDate || 'A convenir'}</Text>
                                        </View>
                                        <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' }}>
                                            <Feather name="clock" size={16} color="#2563EB" />
                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginTop: 6, textTransform: 'uppercase' }}>Duración</Text>
                                            <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 }}>{myOffer.duration || myOffer.executionTime || 'N/A'}</Text>
                                        </View>
                                        <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' }}>
                                            <Feather name="credit-card" size={16} color="#2563EB" />
                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginTop: 6, textTransform: 'uppercase' }}>Pago</Text>
                                            <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 }}>{myOffer.paymentTerms || 'N/A'}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* CONDICIONES Y GARANTIAS */}
                                <View style={{ gap: 15, marginBottom: 20 }}>
                                    {myOffer.conditions && (
                                        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Feather name="file-text" size={16} color="#2563EB" style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>Condiciones</Text>
                                            </View>
                                            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>{myOffer.conditions}</Text>
                                        </View>
                                    )}

                                    {myOffer.warranty && (
                                        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Feather name="shield" size={16} color="#059669" style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>Garantía</Text>
                                            </View>
                                            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>{myOffer.warranty}</Text>
                                        </View>
                                    )}

                                    {myOffer.observations && (
                                        <View style={{ backgroundColor: '#F0F9FF', padding: 16, borderRadius: 16 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Feather name="info" size={16} color="#2563EB" style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>Observaciones Adicionales</Text>
                                            </View>
                                            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20, fontStyle: 'italic' }}>{myOffer.observations}</Text>
                                        </View>
                                    )}
                                </View>
                            </ScrollView>
                        ) : (
                            <Text>No se encontró la información de la oferta.</Text>
                        )}
                    </View>
                </View>
            </Modal>

            <View style={{ backgroundColor: '#2563EB', paddingTop: 20, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 }}>
                <TouchableOpacity onPress={onBack} style={{ marginBottom: 15 }}>
                    <Feather name="arrow-left" size={24} color="white" />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {(() => {
                                const c = job.category;
                                if (typeof c === 'object' && c.name) return c.name;
                                const found = categories && categories.find(cat => cat.id === c || cat._id === c);
                                return found ? found.name : c;
                            })()} • {(typeof job.subcategory === 'object' ? job.subcategory.name : (job.subcategory || 'General'))}
                        </Text>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginTop: 4 }}>{job.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                            <View style={{
                                backgroundColor: getProStatusColor(getProStatus(job, currentUser?._id)).bg,
                                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 10
                            }}>
                                <Text style={{ color: getProStatusColor(getProStatus(job, currentUser?._id)).text, fontSize: 10, fontWeight: 'bold' }}>
                                    {getProStatus(job, currentUser?._id).toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Feather name="map-pin" size={12} color="white" />
                                <Text style={{ color: 'white', fontSize: 11, marginLeft: 4 }}>{job.location}</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onViewProfile} style={{ alignItems: 'center' }}>
                        <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 2, borderColor: 'white', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                            {(job.clientAvatar || job.client?.avatar) ? (
                                <Image source={{ uri: job.clientAvatar || job.client?.avatar }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <Feather name="user" size={24} color="white" />
                            )}
                        </View>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', marginTop: 4 }}>{job.clientName || job.client?.name || 'Cliente'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
                {/* Descripción y Fotos */}
                <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 }}>
                    {myOffer && (myOffer.status === 'rejected' || proStatus === 'PERDIDA') && (
                        <View style={{ backgroundColor: '#FEE2E2', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#FCA5A5' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Feather name={proStatus === 'PERDIDA' ? "slash" : "alert-triangle"} size={24} color="#EF4444" />
                                <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }}>
                                    {proStatus === 'PERDIDA' ? 'TRABAJO PERDIDO' : 'PRESUPUESTO RECHAZADO'}
                                </Text>
                            </View>
                            <Text style={{ color: '#7F1D1D', fontSize: 14, marginBottom: 12 }}>
                                {proStatus === 'PERDIDA'
                                    ? 'Esta solicitud ha sido asignada a otro profesional o ya no está disponible.'
                                    : 'El cliente ha rechazado tu presupuesto.'}
                                {myOffer.rejectionReason && (
                                    <Text style={{ fontWeight: 'bold' }}>{"\n"}Motivo: "{myOffer.rejectionReason}"</Text>
                                )}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity
                                    style={{ flex: 1, backgroundColor: 'white', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' }}
                                    onPress={() => {
                                        showConfirmation(
                                            "Confirmar Archivo",
                                            "¿Estás seguro de archivar esta oferta? No podrás verla nuevamente en la lista principal.",
                                            () => {
                                                onArchive();
                                                showAlert("Archivado", "La solicitud ha sido archivada.");
                                                onBack();
                                            },
                                            null,
                                            "Archivar",
                                            "Cancelar"
                                        );
                                    }}
                                >
                                    <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Archivar</Text>
                                </TouchableOpacity>

                                {proStatus !== 'PERDIDA' && (
                                    <TouchableOpacity
                                        style={{ flex: 1, backgroundColor: '#EF4444', padding: 10, borderRadius: 8, alignItems: 'center' }}
                                        onPress={onGoToQuote}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Modificar y Reenviar</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}

                    <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 20 }}>{job.description}</Text>

                    {job.images && job.images.length > 0 && (
                        <View>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 12 }}>FOTOS ADJUNTAS</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {job.images.map((img, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => onViewImage(img)}
                                    >
                                        <Image source={{ uri: img }} style={{ width: 120, height: 120, borderRadius: 12, marginRight: 12, borderWidth: 1, borderColor: '#F1F5F9' }} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* HEADER: Conversaciones con el Cliente */}
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 15, marginTop: 10 }}>
                    Conversaciones con el Cliente
                </Text>

                {/* Chat Styled Like Reference Image */}
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 20,
                    padding: 20,
                    marginBottom: 35,
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8
                }}>
                    {/* Header: Avatar + Name + Rating */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                        <Image
                            source={
                                (job.client && job.client.profileImage) ? { uri: job.client.profileImage } :
                                    (job.client && job.client.avatar) ? { uri: job.client.avatar } :
                                        (job.clientAvatar) ? { uri: job.clientAvatar } :
                                            (job.clientProfileImage) ? { uri: job.clientProfileImage } :
                                                { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }
                            }
                            style={{ width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: '#E2E8F0' }}
                            resizeMode="cover"
                        />
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginRight: 8 }}>
                                    {job.clientName || (job.client && job.client.name) || 'Cliente'}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                <Feather name="star" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                                <Text style={{ color: '#64748B', fontSize: 13, fontWeight: 'bold' }}>{job.clientRating || '5.0'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Messages Area */}
                    <View style={{ marginBottom: 20 }}>
                        {messages.length === 0 ? (
                            <View style={{ padding: 15, backgroundColor: '#F3F4F6', borderRadius: 12 }}>
                                <Text style={{ color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                                    Inicia la conversación con {job.clientName}...
                                </Text>
                            </View>
                        ) : (
                            messages.slice(-3).map((msg, i) => (
                                <View key={i} style={{
                                    maxWidth: '85%',
                                    padding: 15,
                                    borderRadius: 16,
                                    marginBottom: 10,
                                    alignSelf: msg.sender === 'pro' ? 'flex-end' : 'flex-start',
                                    backgroundColor: msg.sender === 'pro' ? '#FFF7ED' : '#F3F4F6', // Orange tint for Pro, Gray for Client
                                    borderBottomRightRadius: msg.sender === 'pro' ? 4 : 16,
                                    borderBottomLeftRadius: msg.sender === 'pro' ? 16 : 4,
                                }}>
                                    <Text style={{ color: '#374151', fontSize: 14, lineHeight: 20 }}>{msg.text}</Text>
                                    <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 5, textAlign: 'right' }}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>

                    {/* Button "Preguntar" / "Responder" Style */}
                    <TouchableOpacity
                        onPress={() => {
                            onUpdateStatus('CONTACTADO');
                            const cName = job.clientName || job.client?.name || 'Cliente';
                            const pName = currentUser?.name || 'Profesional';
                            const defaultMsg = `Hola ${cName}, mi nombre es ${pName}. Me interesa tu solicitud de ${job.title}.`;
                            onOpenChat && onOpenChat(job, null, messages.length > 0 ? null : defaultMsg);
                        }}
                        style={{
                            backgroundColor: (messages.length > 0 && isClientLast) ? '#EA580C' : 'white',
                            borderWidth: 1.5,
                            borderColor: '#EA580C', // Orange border
                            paddingVertical: 12,
                            borderRadius: 12, // Rounded like the button in image
                            alignItems: 'center',
                            elevation: (messages.length > 0 && isClientLast) ? 2 : 0
                        }}
                    >
                        <Text style={{ color: (messages.length > 0 && isClientLast) ? 'white' : '#EA580C', fontWeight: 'bold', fontSize: 16 }}>
                            {messages.length === 0 ? 'Saludar' : (isClientLast ? 'Responder' : 'Preguntar')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* SECCIÓN PRECIOS Y PRESUPUESTOS (NUEVA LÓGICA) */}
                <View style={{ marginBottom: 25 }}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 10, letterSpacing: 1 }}>PRESUPUESTOS</Text>

                    {!myOffer ? (
                        <TouchableOpacity
                            onPress={onGoToQuote}
                            style={{
                                backgroundColor: '#2563EB',
                                paddingVertical: 16,
                                borderRadius: 16,
                                alignItems: 'center',
                                elevation: 3,
                                shadowColor: '#2563EB',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 5
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Feather name="plus-circle" size={20} color="white" style={{ marginRight: 8 }} />
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>ENVIAR PRESUPUESTO</Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={{
                            backgroundColor: myOffer.status === 'rejected' ? '#FEF2F2' : (myOffer.status === 'accepted' ? '#ECFDF5' : 'white'),
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: myOffer.status === 'rejected' ? '#FCA5A5' : (myOffer.status === 'accepted' ? '#6EE7B7' : '#E2E8F0'),
                            elevation: 2
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{
                                        width: 8, height: 8, borderRadius: 4,
                                        backgroundColor: myOffer.status === 'rejected' ? '#EF4444' : (myOffer.status === 'accepted' ? '#10B981' : '#F59E0B'),
                                        marginRight: 8
                                    }} />
                                    <Text style={{
                                        fontWeight: 'bold',
                                        color: myOffer.status === 'rejected' ? '#991B1B' : (myOffer.status === 'accepted' ? '#065F46' : '#92400E'),
                                        fontSize: 14
                                    }}>
                                        {myOffer.status === 'rejected' ? 'PROPUESTA RECHAZADA' : (myOffer.status === 'accepted' ? '¡PROPUESTA ACEPTADA!' : 'PRESUPUESTO ENVIADO')}
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 11, color: '#64748B' }}>
                                    {new Date(myOffer.createdAt).toLocaleDateString()}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 }}>
                                <View>
                                    <Text style={{ fontSize: 11, color: '#64748B', fontWeight: 'bold' }}>MONTO TOTAL</Text>
                                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1F2937' }}>
                                        {myOffer.currency || '$'} {myOffer.amount || myOffer.price}
                                    </Text>
                                </View>
                                {myOffer.status === 'pending' && (
                                    <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                                        <Text style={{ fontSize: 10, color: '#D97706', fontWeight: 'bold' }}>PENDIENTE</Text>
                                    </View>
                                )}
                            </View>

                            {myOffer.status === 'rejected' && (
                                <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 8, marginBottom: 15 }}>
                                    <Text style={{ color: '#7F1D1D', fontSize: 13, fontStyle: 'italic' }}>
                                        "{myOffer.rejectionReason || 'No especificado'}"
                                    </Text>
                                </View>
                            )}

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity
                                    onPress={() => setShowMyProposal(true)}
                                    style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' }}
                                >
                                    <Text style={{ color: '#475569', fontWeight: 'bold', fontSize: 13 }}>Ver Detalle</Text>
                                </TouchableOpacity>

                                {myOffer.status !== 'accepted' && (
                                    <TouchableOpacity
                                        onPress={onGoToQuote}
                                        style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#3B82F6', borderRadius: 8 }}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>
                                            {myOffer.status === 'rejected' ? 'Modificar y Reenviar' : 'Editar'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                </View>

                {/* ACCIONES DE ESTADO (Iniciar/Finalizar) - Solo si Ganada o Terminada */}
                {(isWinner || ['TERMINADO', 'Culminada', 'rated', 'completed'].includes(job.status)) && (
                    <View style={{ marginBottom: 15 }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 5, letterSpacing: 1 }}>HISTORIAL LEGAL & AVANCE</Text>
                        {/* El botón de inicio se maneja dentro de ProjectTimeline para evitar duplicados */}
                    </View>
                )}

                {
                    (isWinner || ['TERMINADO', 'Culminada', 'rated', 'completed'].includes(job.status)) &&
                    (job.trackingStatus !== 'none' || ['TERMINADO', 'Culminada', 'rated', 'completed'].includes(job.status)) && (
                        <ProjectTimeline
                            job={job}
                            userMode={userMode}
                            currentUser={currentUser}
                            onConfirmStart={(val) => onStartJob(val || job.id)}
                            onAddTimelineEvent={onAddTimelineEvent}
                            onFinish={handleFinishInternal}
                            onRate={handleRateInternal}
                            onTogglePortfolio={onTogglePortfolio}
                            onViewImage={onViewImage}
                        />
                    )
                }

            </ScrollView >
        </View >
    );
};

const RatingForm = ({ onSubmit, revieweeName, isForPro, onCancel }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answers, setAnswers] = useState({
        paidOnTime: true,
        clearInstructions: true,
        deliveredOnTime: true,
        qualityAsExpected: true,
        professionalism: true
    });

    const handleFormSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSubmit({ rating, comment, answers });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={{ backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#1F2937', marginBottom: 5 }}>Valorar a {revieweeName}</Text>
            <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 15 }}>Tu opinión ayuda a mantener la calidad en Profesional Cercano</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
                {[1, 2, 3, 4, 5].map(s => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                        <FontAwesome5 name="star" solid={s <= rating} size={28} color={s <= rating ? '#F59E0B' : '#E2E8F0'} style={{ marginHorizontal: 4 }} />
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#4B5563', marginBottom: 12 }}>Preguntas rápidas:</Text>

            {isForPro ? (
                <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, color: '#374151' }}>¿Cumplió con los tiempos?</Text>
                        <Switch value={answers.deliveredOnTime} onValueChange={v => setAnswers({ ...answers, deliveredOnTime: v })} trackColor={{ true: '#10B981' }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, color: '#374151' }}>¿Calidad esperada?</Text>
                        <Switch value={answers.qualityAsExpected} onValueChange={v => setAnswers({ ...answers, qualityAsExpected: v })} trackColor={{ true: '#10B981' }} />
                    </View>
                </>
            ) : (
                <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, color: '#374151' }}>¿Pagó a tiempo?</Text>
                        <Switch value={answers.paidOnTime} onValueChange={v => setAnswers({ ...answers, paidOnTime: v })} trackColor={{ true: '#10B981' }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, color: '#374151' }}>¿Instrucciones claras?</Text>
                        <Switch value={answers.clearInstructions} onValueChange={v => setAnswers({ ...answers, clearInstructions: v })} trackColor={{ true: '#10B981' }} />
                    </View>
                </>
            )}

            <TextInput
                placeholder="Cuéntanos más sobre tu experiencia..."
                value={comment}
                onChangeText={setComment}
                multiline
                style={{ backgroundColor: 'white', borderRadius: 12, padding: 12, height: 70, fontSize: 13, marginTop: 5, borderWidth: 1, borderColor: '#E2E8F0' }}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                {onCancel && (
                    <TouchableOpacity onPress={onCancel} style={{ flex: 1, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#64748B' }}>Ahora no</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={handleFormSubmit}
                    disabled={isSubmitting}
                    style={{ flex: 2, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F59E0B', opacity: isSubmitting ? 0.7 : 1 }}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: 'white' }}>ENVIAR VALORACIÓN</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const CloseRequestModal = ({ visible, onClose, onSubmit, offers }) => {
    const [reason, setReason] = useState('Lo hice con alguien de Profesional Cercano');
    const [selectedPro, setSelectedPro] = useState(null);

    const reasons = [
        'Lo hice con alguien de Profesional Cercano',
        'Lo hice por fuera de la app',
        'Ya no deseo realizar el trabajo',
        'Otros'
    ];

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' }}>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 }}>Cerrar Solicitud</Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>Ayúdanos a mejorar. ¿Porqué cierras esta solicitud?</Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {reasons.map((r, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => {
                                    setReason(r);
                                    if (r !== 'Lo hice con alguien de Profesional Cercano') setSelectedPro(null);
                                }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 15,
                                    borderRadius: 12,
                                    backgroundColor: reason === r ? '#EFF6FF' : '#F9FAFB',
                                    marginBottom: 10,
                                    borderWidth: 1,
                                    borderColor: reason === r ? '#2563EB' : 'transparent'
                                }}
                            >
                                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: reason === r ? '#2563EB' : '#D1D5DB', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                    {reason === r && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563EB' }} />}
                                </View>
                                <Text style={{ color: reason === r ? '#1E40AF' : '#4B5563', fontWeight: reason === r ? 'bold' : 'normal' }}>{r}</Text>
                            </TouchableOpacity>
                        ))}

                        {reason === 'Lo hice con alguien de Profesional Cercano' && (
                            <View style={{ marginTop: 15 }}>
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 10 }}>¿Con quién realizaste el trabajo?</Text>
                                {offers && offers.length > 0 ? (
                                    offers.map((off, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            onPress={() => setSelectedPro(off.proId)}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                padding: 12,
                                                borderRadius: 12,
                                                backgroundColor: selectedPro === off.proId ? '#ECFDF5' : 'white',
                                                borderWidth: 1,
                                                borderColor: selectedPro === off.proId ? '#10B981' : '#F1F5F9',
                                                marginBottom: 8
                                            }}
                                        >
                                            <Image source={{ uri: off.proImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(off.proName || 'Pro')}&background=random` }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                                            <Text style={{ flex: 1, fontWeight: 'bold', color: '#1F2937' }}>{off.proName}</Text>
                                            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selectedPro === off.proId ? '#10B981' : '#D1D5DB', justifyContent: 'center', alignItems: 'center' }}>
                                                {selectedPro === off.proId && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' }} />}
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text style={{ color: '#9CA3AF', fontStyle: 'italic', padding: 10 }}>No hay ofertas disponibles para seleccionar.</Text>
                                )}
                            </View>
                        )}
                    </ScrollView>

                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{ flex: 1, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}
                        >
                            <Text style={{ fontWeight: 'bold', color: '#6B7280' }}>Volver</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => onSubmit({ closureReason: reason, hiredProId: selectedPro })}
                            style={{ flex: 1, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EF4444' }}
                        >
                            <Text style={{ fontWeight: 'bold', color: 'white' }}>Cerrar Solicitud</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const ProjectTimeline = ({ job, userMode, currentUser, onConfirmStart, onAddTimelineEvent, onFinish, onRate, onTogglePortfolio, onViewImage }) => {
    const [note, setNote] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [date, setDate] = useState(new Date());

    // Get user's current portfolio for this specific category
    const categoryTitle = typeof job.category === 'string' ? job.category : (job.category?.name || 'General');
    const portfolioGallery = currentUser?.profiles?.[categoryTitle]?.gallery || [];

    const events = [...(job.projectHistory || [])];

    const revieweeName = userMode === 'client'
        ? (job.professionalName || job.professional?.name || 'Profesional')
        : (job.clientName || job.client?.name || 'Cliente');

    const handleRatingSubmit = async (reviewData) => {
        await onRate(reviewData);
    };

    // Inject Creation Event locally for display
    if (job.createdAt) {
        events.push({
            eventType: 'job_created',
            title: 'Solicitud Creada',
            description: `Inicio del seguimiento de: ${job.title}`,
            timestamp: job.createdAt,
            actor: job.client || { _id: 'system', name: 'Sistema' },
            isPrivate: false
        });
    }

    // --- INJECT LEGACY DATA (From Removed "Gestionar Trabajo") ---
    if (job.clientManagement) {
        // Photos (Make PUBLIC so Pro can see "Antes" evidence)
        if (job.clientManagement.beforePhotos) {
            job.clientManagement.beforePhotos.forEach(p => {
                events.push({
                    eventType: 'photo_uploaded',
                    title: 'Foto "Antes" (Importada)',
                    description: 'Foto registrada en gestión anterior.',
                    mediaUrl: p.url,
                    timestamp: p.uploadedAt,
                    actor: job.client || { _id: 'system', name: 'Cliente' },
                    isPrivate: false // Migrating to Public for visibility
                });
            });
        }
        // Notes (Keep Private)
        if (job.clientManagement.privateNotes) {
            job.clientManagement.privateNotes.forEach(n => {
                events.push({
                    eventType: 'note_added',
                    title: 'Nota Privada (Importada)',
                    description: n.text,
                    timestamp: n.date,
                    actor: job.client || { _id: 'system', name: 'Cliente' },
                    isPrivate: true
                });
            });
        }
    }

    // Sort: Newest First
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const visibleEvents = events.filter(e => {
        if (!e.isPrivate) return true;
        // Show all if completed, finished, rated, or canceled
        const isFinished = ['completed', 'finished', 'rated', 'canceled', 'TERMINADO', 'Culminada'].includes(job.status);
        if (isFinished) return true;
        if (job.trackingStatus === 'finished') return true;

        // Check actor ID (handling populated object or string ID)
        const actorId = e.actor?._id || e.actor;
        return actorId?.toString() === currentUser?._id?.toString();
    });

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);

        if (event.type === 'set' && Platform.OS !== 'ios') {
            confirmDate(currentDate);
        }
    };

    const confirmDate = (selectedDate) => {
        onAddTimelineEvent({
            eventType: 'start_date_proposed',
            title: userMode === 'pro' ? 'Fecha Propuesta por Profesional' : 'Fecha de Inicio Definida',
            description: userMode === 'pro'
                ? `El profesional propone iniciar el trabajo el: ${selectedDate.toLocaleDateString()} a las ${selectedDate.toLocaleTimeString()}`
                : `El cliente indica que el trabajo comenzará el: ${selectedDate.toLocaleDateString()} a las ${selectedDate.toLocaleTimeString()}`,
            timestamp: new Date(),
            isPrivate: false
        });
        showAlert("Fecha Guardada", "Se ha registrado la fecha de inicio esperada en el historial.");
        setShowDatePicker(false);
    };

    const handleAddNote = () => {
        if (!note.trim()) return;
        onAddTimelineEvent({
            eventType: 'note_added',
            title: 'Nota Agregada',
            description: note,
            isPrivate: isPrivate
        });
        setNote('');
    };

    return (
        <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, marginTop: 20, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>Historial Legal & Avance</Text>
                <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, color: '#1E40AF', fontWeight: 'bold' }}>AUDITABLE</Text>
                </View>
            </View>

            {/* --- ACTION PANEL REFACTORED --- */}
            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, marginBottom: 25, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
                <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>
                        {job.trackingStatus === 'contracted' ? '1. Inicio' :
                            (job.trackingStatus === 'started' && !job.proFinished ? '2. Avance' : '3. Cierre')}
                    </Text>
                    {/* Privacy Toggle for both */}
                    <TouchableOpacity onPress={() => setIsPrivate(!isPrivate)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Feather name={isPrivate ? "lock" : "globe"} size={14} color={isPrivate ? "#EF4444" : "#3B82F6"} style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: isPrivate ? "#EF4444" : "#3B82F6" }}>{isPrivate ? 'PRIVADO' : 'PÚBLICO'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ padding: 15 }}>
                    {/* FECHAS REPORTADAS (SIEMPRE VISIBLES PARA EL CLIENTE SI EXISTEN) */}
                    {(job.validatedStartDate || job.validatedEndDate || job.proFinished) && (
                        <View style={{ backgroundColor: 'white', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9' }}>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>Fechas del Proyecto</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>INICIO</Text>
                                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1F2937' }}>
                                        {job.validatedStartDate ? new Date(job.validatedStartDate).toLocaleDateString() : (job.startDate || 'No definida')}
                                    </Text>
                                </View>
                                {job.proFinished && (
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 10, color: '#94A3B8' }}>FIN (REPORTADO)</Text>
                                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#10B981' }}>
                                            {job.validatedEndDate ? new Date(job.validatedEndDate).toLocaleDateString() : new Date().toLocaleDateString()}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* BOTÓN DE FOTOS CONTEXTUAL SEGÚN ETAPA Y USUARIO */}
                    <View style={{ marginBottom: 15 }}>
                        {(() => {
                            let showButton = false;
                            let buttonText = "";
                            let buttonColor = "";
                            let photoType = "";

                            const isBefore = !job.trackingStatus || job.trackingStatus === 'contracted' || job.trackingStatus === 'none';
                            const isDuring = job.trackingStatus === 'started' && !job.proFinished;
                            const isAfter = job.proFinished || job.trackingStatus === 'finished' || job.status === 'completed';

                            if (isBefore) {
                                // ANTES: Ambos pueden o según regla (Pro puede siempre que no haya iniciado)
                                showButton = true;
                                buttonText = "TOMAR FOTOS DEL ANTES";
                                buttonColor = "#EA580C";
                                photoType = 'Foto "Antes"';
                            } else if (isDuring) {
                                // DURANTE: Usuario pidió que solo el cliente tome estas fotos
                                if (userMode === 'client') {
                                    showButton = true;
                                    buttonText = "TOMAR FOTOS DEL DURANTE";
                                    buttonColor = "#3B82F6";
                                    photoType = 'Foto "Durante"';
                                }
                            } else if (isAfter) {
                                // DESPUÉS: Cuando el pro marca finalizado
                                showButton = true;
                                buttonText = "TOMAR FOTOS DEL DESPUÉS";
                                buttonColor = "#10B981";
                                photoType = 'Foto "Después"';
                            }

                            if (!showButton) return null;

                            return (
                                <View>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>EVIDENCIA VISUAL ({isPrivate ? 'PRIVADA' : 'PÚBLICA'})</Text>
                                    <TouchableOpacity
                                        onPress={() => onAddTimelineEvent({ pickImage: true, title: photoType, isPrivate })}
                                        style={{
                                            backgroundColor: 'white', padding: 15, borderRadius: 12, alignItems: 'center',
                                            borderWidth: 2, borderColor: buttonColor, borderStyle: 'dashed',
                                            flexDirection: 'row', justifyContent: 'center'
                                        }}
                                    >
                                        <Feather name="camera" size={22} color={buttonColor} style={{ marginRight: 10 }} />
                                        <Text style={{ color: buttonColor, fontWeight: 'bold', fontSize: 15 }}>{buttonText}</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })()}
                    </View>

                    {/* NOTAS (PARA AMBOS) */}
                    <View style={{ marginBottom: 15 }}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TextInput
                                placeholder="Escribe algo en la bitácora..."
                                value={note}
                                onChangeText={setNote}
                                style={{ flex: 1, backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 13 }}
                            />
                            <TouchableOpacity onPress={handleAddNote} style={{ width: 40, height: 40, backgroundColor: '#334155', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                                <Feather name="send" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />

                    {/* ACCIONES DE ESTADO (FLUJO PRINCIPAL) */}
                    <View>
                        {/* INICIO (Solo Pro si no iniciado) */}
                        {job.trackingStatus === 'contracted' && userMode === 'pro' && !job.validatedStartDate && (
                            <TouchableOpacity
                                onPress={() => onConfirmStart(true)}
                                style={{ backgroundColor: '#4F46E5', paddingVertical: 15, borderRadius: 12, alignItems: 'center', elevation: 2 }}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>INICIAR TRABAJO</Text>
                            </TouchableOpacity>
                        )}

                        {/* FINALIZAR (Pro) */}
                        {job.trackingStatus === 'started' && userMode === 'pro' && !job.proFinished && (
                            <TouchableOpacity
                                onPress={onFinish}
                                style={{ backgroundColor: '#10B981', paddingVertical: 15, borderRadius: 12, alignItems: 'center', elevation: 2 }}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>CERRAR / TRABAJO LISTO</Text>
                            </TouchableOpacity>
                        )}

                        {/* VALIDAR (Cliente) */}
                        {job.proFinished && !job.clientFinished && userMode === 'client' && (
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ color: '#92400E', fontSize: 12, textAlign: 'center', marginBottom: 12, fontStyle: 'italic' }}>
                                    El profesional indica que ha concluido. ¿Validar y cerrar?
                                </Text>
                                <TouchableOpacity
                                    onPress={onFinish}
                                    style={{ width: '100%', backgroundColor: '#10B981', paddingVertical: 15, borderRadius: 12, alignItems: 'center', elevation: 2 }}
                                >
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>CONFIRMAR Y FINALIZAR</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* CALIFICAR / INFO VALORACIÓN (UNIFICADO) */}
                        {(() => {
                            // Professional can rate as soon as they mark as finished.
                            // Client can rate after they acknowledge/validate the finish.
                            const isFinished = (
                                job.status === 'completed' ||
                                job.status === 'TERMINADO' ||
                                job.status === 'rated' ||
                                job.status === 'Culminada' ||
                                job.proRated ||
                                job.clientRated ||
                                (job.proFinished && (userMode === 'pro' || job.clientFinished))
                            );

                            if (!isFinished) return null;

                            // Robust check for rating existence
                            const hasMyRating = (userMode === 'pro' && job.proRated) || (userMode === 'client' && job.clientRated);
                            const ratingEvents = events.filter(e =>
                                (e.eventType === 'note_added' || e.eventType === 'job_finished') &&
                                (e.title?.toLowerCase().includes('valoró') || e.description?.toLowerCase().includes('calificación'))
                            );

                            const myRatingEvent = ratingEvents.find(e => {
                                const actorId = (e.actor?._id || e.actor)?.toString();
                                const myId = currentUser?._id?.toString() || currentUser?.id?.toString();
                                return actorId === myId;
                            });
                            const otherRatingEvent = ratingEvents.find(e => {
                                const actorId = (e.actor?._id || e.actor)?.toString();
                                const myId = currentUser?._id?.toString() || currentUser?.id?.toString();
                                return actorId && actorId !== myId;
                            });

                            const showMyRatingBox = hasMyRating || !!myRatingEvent;

                            return (
                                <View style={{ width: '100%', gap: 10 }}>
                                    {/* Muestra valoración del OTRO (si existe) */}
                                    {otherRatingEvent && (
                                        <View style={{ padding: 15, backgroundColor: '#F0FDF4', borderRadius: 12, borderWidth: 1, borderColor: '#DCFCE7', marginBottom: 10 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                <Feather name="star" size={14} color="#16A34A" style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#166534' }}>
                                                    {userMode === 'pro' ? 'El cliente dijo:' : 'El profesional dijo:'}
                                                </Text>
                                            </View>
                                            <Text style={{ fontSize: 12, color: '#14532D', fontStyle: 'italic' }}>"{otherRatingEvent.description}"</Text>
                                        </View>
                                    )}

                                    {/* Muestra MI valoración o el botón para darla */}
                                    {showMyRatingBox ? (
                                        <View style={{ padding: 15, backgroundColor: '#F0F9FF', borderRadius: 12, borderWidth: 1, borderColor: '#BAE6FD' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#0EA5E9', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                                                    <Feather name="check" size={12} color="white" />
                                                </View>
                                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0369A1' }}>Tu valoración enviada correctamente</Text>
                                            </View>
                                            {myRatingEvent && (
                                                <Text style={{ fontSize: 12, color: '#0C4A6E', fontStyle: 'italic', marginBottom: 8 }}>
                                                    "{myRatingEvent.description}"
                                                </Text>
                                            )}

                                            {/* Photo Instructions (Only show if I've rated) */}
                                            {events.some(e => e.mediaUrl) && (
                                                <View style={{ marginTop: 5, borderTopWidth: 1, borderTopColor: '#E0F2FE', paddingTop: 8 }}>
                                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1F2937' }}>📸 Crea tu Portafolio:</Text>
                                                    <Text style={{ fontSize: 11, color: '#4B5563' }}>Presiona la estrella <Feather name="star" size={10} /> en las fotos de abajo para tu perfil.</Text>
                                                </View>
                                            )}
                                        </View>
                                    ) : (
                                        <RatingForm
                                            revieweeName={revieweeName}
                                            isForPro={userMode === 'client'}
                                            onSubmit={handleRatingSubmit}
                                        />
                                    )}
                                </View>
                            );
                        })()}
                    </View>
                </View>
            </View>
            {/* --- TIMELINE FEED --- */}
            < View >
                {
                    visibleEvents.length === 0 ? (
                        <Text style={{ textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', fontSize: 13 }}>No hay eventos registrados aún.</Text>
                    ) : (
                        visibleEvents.map((e, i) => {
                            const isMe = (e.actor?._id || e.actor)?.toString() === currentUser?._id?.toString();
                            return (
                                <View key={i} style={{ flexDirection: 'row', marginBottom: 20 }}>
                                    <View style={{ alignItems: 'center', marginRight: 12, width: 30 }}>
                                        {/* Line connecting to next item (below) */}
                                        <View style={{ position: 'absolute', top: 15, bottom: -20, width: 2, backgroundColor: '#E2E8F0', zIndex: -1 }} />

                                        <View style={{
                                            width: 30, height: 30, borderRadius: 15,
                                            backgroundColor: isMe ? '#DBEAFE' : '#F1F5F9',
                                            justifyContent: 'center', alignItems: 'center',
                                            borderWidth: 2, borderColor: isMe ? '#3B82F6' : '#94A3B8'
                                        }}>
                                            <Feather
                                                name={e.eventType === 'photo_uploaded' ? 'camera' : (e.eventType === 'job_finished' ? 'check' : (e.eventType === 'job_created' ? 'file-text' : 'message-square'))}
                                                size={14}
                                                color={isMe ? '#3B82F6' : '#64748B'}
                                            />
                                        </View>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1F2937' }}>{e.title}</Text>
                                            <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(e.timestamp).toLocaleString()}</Text>
                                        </View>
                                        <Text style={{ fontSize: 13, color: '#4B5563', lineHeight: 18 }}>{e.description}</Text>

                                        {e.mediaUrl && (
                                            <View style={{ marginTop: 8, position: 'relative', width: 150 }}>
                                                <TouchableOpacity onPress={() => onViewImage(e.mediaUrl)}>
                                                    <Image source={{ uri: e.mediaUrl }} style={{ width: 150, height: 100, borderRadius: 8 }} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => onTogglePortfolio(e.mediaUrl, categoryTitle)}
                                                    style={{
                                                        position: 'absolute', top: 5, right: 5,
                                                        backgroundColor: portfolioGallery.includes(e.mediaUrl) ? '#F59E0B' : 'rgba(0,0,0,0.5)',
                                                        padding: 6, borderRadius: 20, elevation: 3
                                                    }}
                                                >
                                                    <Feather name={portfolioGallery.includes(e.mediaUrl) ? "star" : "plus"} size={16} color="white" />
                                                </TouchableOpacity>
                                                {portfolioGallery.includes(e.mediaUrl) && (
                                                    <View style={{ position: 'absolute', bottom: 5, left: 5, backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                        <Text style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>EN PORTAFOLIO</Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        {/* Privacy Indicator */}
                                        {e.isPrivate && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: '#FEF2F2', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                <Feather name="lock" size={10} color="#EF4444" style={{ marginRight: 4 }} />
                                                <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: 'bold' }}>Privado</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )
                }
            </View >
        </View >
    );
};

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
    const isLoggedIn = !!userToken;
    const currentUser = userInfo;

    // --- ESTADO GLOBAL (Data) ---
    const [allRequests, setAllRequests] = useState([]);
    const [allChats, setAllChats] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [dynamicCopy, setDynamicCopy] = useState(HOME_COPY_OPTIONS[0]);

    useEffect(() => {
        const rotateMessaging = async () => {
            try {
                const lastIdxStr = await AsyncStorage.getItem(ROTATION_KEY);
                const lastIdx = lastIdxStr ? parseInt(lastIdxStr, 10) : -1;
                const nextIdx = (lastIdx + 1) % HOME_COPY_OPTIONS.length;
                setDynamicCopy(HOME_COPY_OPTIONS[nextIdx]);
                await AsyncStorage.setItem(ROTATION_KEY, nextIdx.toString());
            } catch (e) {
                console.warn("Error rotating home messaging:", e);
            }
        };
        rotateMessaging();
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
    const [categories, setCategories] = useState([]);
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

    // --- MODALES ---
    const [isRegister, setIsRegister] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);

    // --- NUEVO ESTADO FALTANTE ---
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [previousView, setPreviousView] = useState(null);
    const [pendingRequestData, setPendingRequestData] = useState(null);
    const [fullscreenImage, setFullscreenImage] = useState(null);

    // --- EFECTOS INICIALES ---
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
                if (req.proInteractionStatus === 'new') proUpdateCount++;
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

    // Helper para comparar IDs de forma segura
    const areIdsEqual = (id1, id2) => {
        if (!id1 || !id2) return false;
        const s1 = typeof id1 === 'object' ? (id1._id || id1.id || id1) : id1;
        const s2 = typeof id2 === 'object' ? (id2._id || id2.id || id2) : id2;
        return String(s1) === String(s2);
    };

    const getClientStatus = (request) => {
        if (!request) return 'NUEVA';
        if (request.status === 'canceled' || request.status === 'Cerrada') return 'ELIMINADA';
        const isRated = !!(request.status === 'rated' || request.status === 'TERMINADO' || request.status === 'completed' || request.status === 'Culminada' || request.clientRated || request.proRated || (request.rating > 0) || (request.proRating > 0) || (request.proFinished && request.clientFinished));
        if (isRated) return 'TERMINADO';
        if (request.proFinished && !request.clientFinished) return 'VALIDANDO';
        if (request.status === 'in_progress' || request.status === 'started' || request.status === 'En Ejecución') return 'EN EJECUCIÓN';
        const activeOffers = request.offers?.filter(o => o.status !== 'rejected');
        if (activeOffers && activeOffers.length > 0) return 'PRESUPUESTADA';
        if (request.conversations && request.conversations.length > 0) return 'CONTACTADA';
        if (request.status === 'open' || request.status === 'active' || request.status === 'Abierto') return 'ABIERTA';
        return 'NUEVA';
    };

    const getClientStatusColor = (status) => {
        switch (status) {
            case 'NUEVA': return { bg: '#6B7280', text: 'white' };
            case 'ABIERTA': return { bg: '#10B981', text: 'white' };
            case 'CONTACTADA': return { bg: '#2563EB', text: 'white' };
            case 'PRESUPUESTADA': return { bg: '#F59E0B', text: 'white' };
            case 'RECHAZADA': return { bg: '#EF4444', text: 'white' };
            case 'EN EJECUCIÓN': return { bg: '#023e2b', text: 'white' };
            case 'VALIDANDO': return { bg: '#F97316', text: 'white' };
            case 'VALORACIÓN': return { bg: '#8B5CF6', text: 'white' };
            case 'TERMINADO': return { bg: '#1F2937', text: 'white' };
            case 'ELIMINADA': return { bg: '#EF4444', text: 'white' };
            default: return { bg: '#6B7280', text: 'white' };
        }
    };

    const showAlert = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const showConfirmation = (title, message, onConfirm, onCancel, confirmText = 'Aceptar', cancelText = 'Cancelar') => {
        if (Platform.OS === 'web') {
            if (window.confirm(`${title}: ${message}`)) {
                onConfirm && onConfirm();
            } else {
                onCancel && onCancel();
            }
        } else {
            Alert.alert(
                title,
                message,
                [
                    { text: cancelText, onPress: onCancel, style: 'cancel' },
                    { text: confirmText, onPress: onConfirm }
                ]
            );
        }
    };




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
        'PRESUPUESTADA': 'offered',
        'GANADA': 'won',
        'PERDIDA': 'lost',
        'RECHAZADA': 'rejected',
        'Archivada': 'archived'
    };

    const updateProStatus = async (jobId, newStatusUI) => {
        try {
            const statusDB = STATUS_MAP_UI_TO_DB[newStatusUI] || newStatusUI;
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
            // Updated: Fetch ALL chats regardless of role to show full history
            const chats = await api.getChats({});
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

            setRequests(mappedJobs);
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
                if (!refreshing && view !== 'create-request' && view !== 'service-form') {
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

                // AUTO-UPDATE STATUS TO Contacted (CONTACTADO)
                const dbStatus = request.proInteractionStatus || 'new';
                if (dbStatus === 'new' || dbStatus === 'viewed') {
                    updateProStatus(request.id || request._id, 'CONTACTADO');
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
            const existingConv = conversations.find(c => areIdsEqual(c.proId?._id || c.proId, proId));

            let realChatId = existingConv ? (existingConv.id || existingConv._id) : null;

            // 4. Si no tiene ID de chat (es nuevo o local), CREARLO en backend
            if (!realChatId) {
                const jobId = request.id || request._id;
                console.log(`[handleSendMessage] Creating new chat for Job: ${jobId}`);
                const newChat = await api.createChat(targetUserId, jobId);
                realChatId = newChat._id || newChat.id;
            }

            // 5. Enviar mensaje al backend y obtener chat actualizado
            let updatedChatData;
            if (type === 'text') {
                updatedChatData = await api.sendMessage(realChatId, messageContent);
            } else if (type === 'media') {
                updatedChatData = await api.sendMessage(realChatId, messageContent);
            }

            // 6. Actualizar estado LOCALMENTE (Optimistic UI fallback / Source of Truth update)
            if (updatedChatData && updatedChatData.messages) {
                // Formatear mensajes como los espera el frontend
                const formattedMessages = updatedChatData.messages.map(m => {
                    const senderId = m.sender?._id || m.sender;
                    const myId = currentUser._id || currentUser.id;
                    const isMe = areIdsEqual(senderId, myId);

                    return {
                        text: m.content || "",
                        sender: isMe ? (isActingAsPro ? 'pro' : 'client') : (isActingAsPro ? 'client' : 'pro'),
                        timestamp: m.createdAt,
                        type: m.media ? 'media' : 'text',
                        media: m.media,
                        mediaType: m.mediaType
                    };
                });

                // Actualizar selectedChatRequest ("active chat")
                setSelectedChatRequest(prev => {
                    if (!prev) return prev;
                    const newConvs = (prev.conversations || []).map(c => {
                        if (c.id === realChatId || areIdsEqual(c.proId?._id || c.proId, proId)) {
                            return { ...c, messages: formattedMessages, id: realChatId };
                        }
                        return c;
                    });
                    // Si no existía, agregarlo
                    if (!newConvs.some(c => c.id === realChatId || areIdsEqual(c.proId?._id || c.proId, proId))) {
                        newConvs.push({
                            id: realChatId,
                            proId: proId,
                            proName: proName,
                            proEmail: proEmail,
                            messages: formattedMessages
                        });
                    }
                    return { ...prev, conversations: newConvs };
                });

                // Actualizar allRequests (Global State)
                setAllRequests(prevRequests => prevRequests.map(req => {
                    const reqId = req.id || req._id;
                    const requestId = request.id || request._id;

                    if (areIdsEqual(reqId, requestId)) {
                        const newConvs = (req.conversations || []).map(c => {
                            if (c.id === realChatId || areIdsEqual(c.proId?._id || c.proId, proId)) {
                                return { ...c, messages: formattedMessages, id: realChatId };
                            }
                            return c;
                        });
                        if (!newConvs.some(c => c.id === realChatId)) {
                            newConvs.push({
                                id: realChatId,
                                proId: proId,
                                proName: proName,
                                proEmail: proEmail,
                                messages: formattedMessages
                            });
                        }
                        const updatedReq = { ...req, conversations: newConvs };

                        // CRITICAL FIX: Update selectedRequest if it matches this request
                        // This ensures JobDetailPro and other detail views reflect the new message immediately
                        if (selectedRequest && areIdsEqual(selectedRequest.id || selectedRequest._id, requestId)) {
                            console.log("[handleSendMessage] Updating selectedRequest with new conversation");
                            setSelectedRequest(updatedReq);
                        }

                        return updatedReq;
                    }
                    return req;
                }));
            }

            // NO recargar `loadRequests()` aquí porque api.getJobs() no trae chats y borraría la data local.
            // await loadRequests(); 
        } catch (e) {
            console.warn('Error enviando mensaje:', e);
            showAlert('Error', 'No se pudo enviar el mensaje.');
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
        const myId = String(currentUser?._id || currentUser?.id || '').trim();
        let jobClientId = '';
        if (job.client) {
            if (typeof job.client === 'object') {
                jobClientId = String(job.client._id || job.client.id || '').trim();
            } else {
                jobClientId = String(job.client).trim();
            }
        }

        if (myId && jobClientId && myId === jobClientId) return false;

        if (job.clientId) {
            const legacyClientId = String(job.clientId).trim();
            if (myId && legacyClientId && myId === legacyClientId) return false;
        }

        if (currentUser?.email && job.client?.email) {
            if (currentUser.email.trim().toLowerCase() === job.client.email.trim().toLowerCase()) {
                return false;
            }
        }

        const myProfiles = currentUser?.profiles || {};
        const activeProfileKeys = Object.keys(myProfiles).filter(key => {
            const p = myProfiles[key];
            return p && p.isActive !== false;
        });

        if (activeProfileKeys.length === 0) return false;

        const jobCategoryName = job.category?.name || job.category;
        const jobSubcategoryName = job.subcategory?.name || job.subcategory;
        const jobLocation = job.location;

        const isMatch = activeProfileKeys.some(profileCatName => {
            if (profileCatName !== jobCategoryName) return false;
            const profile = myProfiles[profileCatName];
            const profileZones = profile.zones || [];
            if (profileZones.length > 0) {
                const jobLocNormalized = (jobLocation || '').trim();
                const hasZone = profileZones.some(z => z.trim() === jobLocNormalized);
                if (!hasZone) return false;
            } else {
                return false;
            }
            const profileSubs = profile.subcategories || [];
            if (profileSubs.length > 0) {
                if (jobSubcategoryName && !profileSubs.includes(jobSubcategoryName)) return false;
            }
            return true;
        });

        return isMatch;
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
                    <ScrollView style={{ flex: 1, backgroundColor: '#A19C9B' }} contentContainerStyle={{ paddingBottom: 0 }}>
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
                        <UrgencyBanner onPress={() => {
                            // TODO: Definir flujo de urgencia. Por ahora, scroll arriba o abrir modal.
                            showAlert("Urgencia", "Función de respuesta inmediata en construcción.");
                        }} />
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
                        <View style={{ backgroundColor: '#2563EB', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Trabajos Disponibles</Text>
                                <TouchableOpacity
                                    onPress={() => setShowArchivedOffers(!showArchivedOffers)}
                                    style={{
                                        width: 40, height: 40, borderRadius: 20,
                                        backgroundColor: showArchivedOffers ? 'white' : 'rgba(255,255,255,0.2)',
                                        justifyContent: 'center', alignItems: 'center'
                                    }}
                                >
                                    <Feather name="archive" size={20} color={showArchivedOffers ? '#2563EB' : 'white'} />
                                </TouchableOpacity>
                            </View>

                            {/* FILTERS - CATEGORY ONLY */}
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
                            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 }}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
                            }
                        >
                            {availableJobsForPro.length === 0 ? (
                                <View style={{ alignItems: 'center', marginTop: 40 }}>
                                    <Text style={{ color: '#9CA3AF', fontSize: 16 }}>No hay trabajos con estos filtros.</Text>
                                </View>
                            ) : null}

                            {/* Helper to get colors for Pro Statuses moved to top level as getProStatusColor */}
                            {(() => {
                                return availableJobsForPro.map(job => (
                                    <TouchableOpacity
                                        key={job.id}
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: 16,
                                            padding: 16,
                                            marginBottom: 12, // Reduced from 16 to match Orange List
                                            elevation: 2,
                                            ...Platform.select({
                                                web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' },
                                                default: {
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.05,
                                                    shadowRadius: 4,
                                                }
                                            }),
                                            borderWidth: 1,
                                            borderColor: '#F3F4F6'
                                        }}
                                        onPress={() => handleOpenJobDetail(job.id, 'job-detail-pro')}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                <View style={{
                                                    width: 40, height: 40, borderRadius: 20, marginRight: 12,
                                                    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
                                                    overflow: 'hidden'
                                                }}>
                                                    {job.clientAvatar ? (
                                                        <Image source={{ uri: job.clientAvatar }} style={{ width: '100%', height: '100%' }} />
                                                    ) : (
                                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2563EB' }}>
                                                            {job.clientName ? job.clientName.substring(0, 2).toUpperCase() : 'CL'}
                                                        </Text>
                                                    )}
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    {/* TITLE FIRST (Start) - BOLD & BIG */}
                                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }} numberOfLines={2}>{job.title}</Text>

                                                    {/* CLIENT NAME BELOW - SMALLER WITH ICON */}
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
                                                        <Feather name="user" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                                                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#4B5563' }}>{job.clientName || 'Cliente'}</Text>
                                                    </View>

                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <Feather name="map-pin" size={12} color="#9CA3AF" />
                                                        <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }} numberOfLines={1}>{job.location || 'Sin ubicación'}</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                                        <Feather name="tag" size={12} color="#9CA3AF" />
                                                        <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }} numberOfLines={1}>
                                                            {job.category?.name || job.category} {job.subcategory ? `> ${job.subcategory}` : ''}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <View style={{
                                                    backgroundColor: getProStatusColor(job.proStatus).bg,
                                                    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 4
                                                }}>
                                                    <Text style={{
                                                        fontSize: 10, fontWeight: 'bold',
                                                        color: getProStatusColor(job.proStatus).text
                                                    }}>
                                                        {job.proStatus?.toUpperCase() || 'NUEVA'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* DIVIDER LINE (Darker for visibility) */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, marginTop: 4 }}>
                                            {/* DATE INSTEAD OF TITLE */}
                                            <Text style={{ fontSize: 13, color: '#9CA3AF' }}>Publicado el {new Date(job.createdAt).toLocaleDateString()}</Text>

                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                {job.hasUnread && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 }}>
                                                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 6 }} />
                                                        <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: 'bold' }}>Novedades</Text>
                                                    </View>
                                                )}
                                                <View style={{
                                                    backgroundColor: job.hasUnread ? '#FEF2F2' : '#F3F4F6', // LIGHT RED if unread/new
                                                    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
                                                    flexDirection: 'row', alignItems: 'center',
                                                    borderWidth: 1, borderColor: job.hasUnread ? '#EF4444' : 'transparent' // Optional border check
                                                }}>
                                                    {/* CHANGED ICON TO FILE-TEXT TO MATCH ORANGE LIST */}
                                                    <Feather name="file-text" size={14} color={job.hasUnread ? '#EF4444' : '#6B7280'} />
                                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: job.hasUnread ? '#EF4444' : '#6B7280', marginLeft: 6 }}>
                                                        {job.offers ? job.offers.length : 0}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ));
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
                        onViewProfile={() => setView('client-profile')}
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

                {/* PERFIL CLIENTE */}
                {view === 'client-profile' && selectedRequest && (
                    <ClientProfileView
                        client={{
                            name: selectedRequest.clientName,
                            email: selectedRequest.clientEmail,
                        }}
                        onBack={() => setView('job-detail-pro')}
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
                <MainApp />
            </ErrorBoundary>
        </AuthProvider>
    );
}

// --- ESTILOS GENERALES ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // Solid White
        // BAJAR CONTENIDO DE BARRA DE ESTADO
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 30) + 5 : 5
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24, // Wider margins
        paddingVertical: 8, // Further reduced to match screenshot
        backgroundColor: 'white',
        borderBottomWidth: 0, // Removed to match requested boxed look
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    logoIcon: { padding: 8, borderRadius: 12, marginRight: 10 },
    logoText: { fontSize: 18, fontWeight: 'bold', color: '#111827' }, // Reduced to 18px
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    modeButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modeButtonText: { fontSize: 13, fontWeight: 'bold', color: '#4B5563' }, // Grey-600
    loginButtonHeader: {
        backgroundColor: '#EA580C',
        paddingHorizontal: 20,
        borderRadius: 24,
        minHeight: 48,
        justifyContent: 'center'
    },
    loginButtonHeaderText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
    content: { flex: 1, paddingHorizontal: 24, paddingVertical: 16 }, // Wider margins

    heroCard: {
        backgroundColor: 'white',
        borderRadius: 0, // Fallback to full-bleed
        marginBottom: 20,
    },
    heroHeader: { backgroundColor: '#EA580C', padding: 24 },
    heroTitle: { fontSize: 26, fontWeight: 'bold', color: 'white' },
    heroSubtitle: { fontSize: 17, color: 'rgba(255,255,255,0.9)' },
    formContainer: { paddingVertical: 20 },
    label: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }, // Consistent 15px
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: '#9CA3AF',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        minHeight: 56,
        alignItems: 'center'
    },
    input: {
        fontSize: 16,
        color: '#111827'
    },
    inputBox: {
        borderWidth: 1.5,
        borderColor: '#9CA3AF',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        fontSize: 17,
        fontWeight: 'bold',
        color: '#111827',
        minHeight: 56
    },
    inputGroup: { marginBottom: 16 },
    helperText: { fontSize: 12, color: '#6B7280', marginBottom: 12, marginTop: -4, textAlign: 'center' },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#9CA3AF',
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
        minHeight: 56
    },
    locationIconButton: {
        width: 56,
        height: 56,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#9CA3AF',
    },
    locationButtonText: {
        color: '#EA580C',
        fontWeight: 'bold',
        fontSize: 16
    },
    privacyNote: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
        lineHeight: 18
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 155,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        elevation: 8,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10
    },
    suggestionItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    suggestionText: {
        fontSize: 16,
        color: '#374151'
    },
    mediaButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        minHeight: 48
    },
    searchButton: {
        backgroundColor: '#EA580C',
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        minHeight: 64,
        marginTop: 20,
        marginBottom: 30
    },
    searchButtonText: { color: 'white', fontWeight: 'bold', fontSize: 17, marginRight: 8 },

    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#111827', marginTop: 0 },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 24,
        marginTop: 8
    },
    catCard: {
        width: '31%',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 20,
        marginBottom: 12,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        aspectRatio: 0.95
    },
    catIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    catTextCard: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151',
        flex: 0
    },

    reqCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    proHeaderCard: { backgroundColor: '#2563EB', padding: 24, borderRadius: 16, marginBottom: 20 },
    jobCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    offerCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    mainAuthButton: { padding: 16, borderRadius: 12, alignItems: 'center', minHeight: 48 },

    // NAV INFERIOR
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
        paddingBottom: Platform.OS === 'android' ? 32 : 24,
        minHeight: 80
    },
    navItem: { alignItems: 'center', padding: 8, flex: 1, minHeight: 48 },

    // ESTILOS EXTRA SECCIONES
    howToCard: {
        backgroundColor: 'white',
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 0,
        marginBottom: 24,
        paddingBottom: 10
    },
    howToHeader: { backgroundColor: '#F8F9FA', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    howToTitle: { color: '#111827', fontSize: 20, fontWeight: 'bold' },
    howToSubtitle: { color: '#4B5563', fontSize: 14, marginTop: 4 },
    stepsRow: { flexDirection: 'row', padding: 24, justifyContent: 'space-between' },
    step: { alignItems: 'center', flex: 1 },
    stepBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    stepNumber: { fontWeight: 'bold', fontSize: 18 },
    stepLabel: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
    videoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: 'white',
        minHeight: 48
    },
    videoButtonText: { color: '#2563EB', fontSize: 14, fontWeight: 'bold' },

    testimonialCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 20,
        marginRight: 16,
        width: 280,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    testimonialText: { fontSize: 15, color: '#4B5563', fontStyle: 'italic', marginBottom: 12, lineHeight: 22 },
    testimonialUser: { fontSize: 14, fontWeight: 'bold', color: '#111827' },

    blogCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 100
    },

    // ESTILOS FORMULARIO SEPARADO
    serviceFormCard: {
        backgroundColor: 'white',
        borderRadius: 32, // Apply to all corners
        marginBottom: 0,
        borderWidth: 0,
        paddingHorizontal: 24,
        paddingBottom: 25, // Added padding at the bottom
    },
    serviceFormHeader: { backgroundColor: 'white', paddingVertical: 15, paddingBottom: 10 },
    serviceFormTitle: { fontSize: 22, fontWeight: 'bold', color: '#111811', lineHeight: 28 },
    serviceFormSubtitle: { color: '#4B5563', fontSize: 14, marginTop: 8, lineHeight: 20 },
    serviceFormContent: { paddingVertical: 10 },
    blogContent: { flex: 1, padding: 16, justifyContent: 'center' },
    blogCategory: { fontSize: 12, color: '#2563EB', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 },
    blogTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    blogLink: { fontSize: 14, color: '#4B5563' },

    // BADGES
    badgeContainer: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: 'white'
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold'
    },

    // Dropdown Styles
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        minHeight: 48
    },
    dropdownButtonText: { color: 'white', fontWeight: '600', fontSize: 14, flex: 1 },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        padding: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        maxHeight: '80%'
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#111827', textAlign: 'center' },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        minHeight: 56
    },
    modalOptionSelected: { backgroundColor: '#FFF7ED', paddingHorizontal: 16, borderRadius: 12, borderBottomWidth: 0 },
    modalOptionText: { fontSize: 16, color: '#475569' },
    modalOptionTextSelected: { color: '#EA580C', fontWeight: 'bold' },

    // Category Grid Modal Styles
    categoryGridModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    categoryGridModalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        height: '100%', // Full Screen
        maxHeight: '100%'
    },
    categoryGridHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    categoryGridTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
    categoryGridSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    categoryGridCloseButton: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 20, minWidth: 48, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
    categoryGridScroll: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 30 },
    categoryGridItem: {
        width: '31%',
        aspectRatio: 1,
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        minHeight: 48,
        minWidth: 48
    },
    categoryGridIconWrapper: { padding: 12, borderRadius: 50, marginBottom: 8 },
    categoryGridLabel: { fontSize: 12, fontWeight: 'bold', color: '#111827', textAlign: 'center' }
});