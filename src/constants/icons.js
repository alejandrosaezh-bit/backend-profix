import React from 'react';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

export const { width } = Dimensions.get('window');

// Extensive Icon Library grouped by Category (used by Admin and UI)
export const ICON_CATEGORIES = {
    'Hogar': [
        { name: 'home', lib: Feather },
        { name: 'hammer', lib: MaterialCommunityIcons },
        { name: 'wrench', lib: MaterialCommunityIcons },
        { name: 'pipe-wrench', lib: MaterialCommunityIcons },
        { name: 'format-paint', lib: MaterialCommunityIcons },
        { name: 'paint-brush', lib: FontAwesome5 },
        { name: 'broom', lib: MaterialCommunityIcons },
        { name: 'flower', lib: MaterialCommunityIcons },
        { name: 'truck-delivery', lib: MaterialCommunityIcons },
        { name: 'lightbulb-on', lib: MaterialCommunityIcons },
        { name: 'water', lib: MaterialCommunityIcons },
        { name: 'door', lib: MaterialCommunityIcons },
        { name: 'sofa', lib: MaterialCommunityIcons },
        { name: 'bed', lib: MaterialCommunityIcons },
        { name: 'air-conditioner', lib: MaterialCommunityIcons },
        { name: 'radiator', lib: MaterialCommunityIcons },
        { name: 'fire', lib: MaterialCommunityIcons },
        { name: 'snowflake', lib: MaterialCommunityIcons },
        { name: 'fan', lib: MaterialCommunityIcons },
        { name: 'thermometer', lib: MaterialCommunityIcons },
        { name: 'vacuum', lib: MaterialCommunityIcons },
        { name: 'mop', lib: MaterialCommunityIcons },
        { name: 'lamp', lib: MaterialCommunityIcons },
        { name: 'fence', lib: MaterialCommunityIcons },
        { name: 'key-variant', lib: MaterialCommunityIcons },
        { name: 'microwave', lib: MaterialCommunityIcons },
        { name: 'fridge', lib: MaterialCommunityIcons },
        { name: 'washing-machine', lib: MaterialCommunityIcons },
        { name: 'water-pump', lib: MaterialCommunityIcons },
        { name: 'lightning-bolt', lib: MaterialCommunityIcons },
        { name: 'wall', lib: MaterialCommunityIcons },
        { name: 'key', lib: MaterialCommunityIcons },
        { name: 'saw-blade', lib: MaterialCommunityIcons }
    ],
    'Salud y Bienestar': [
        { name: 'heart', lib: Feather },
        { name: 'user-nurse', lib: FontAwesome5 },
        { name: 'doctor', lib: MaterialCommunityIcons },
        { name: 'hospital-box', lib: MaterialCommunityIcons },
        { name: 'yoga', lib: MaterialCommunityIcons },
        { name: 'dumbbell', lib: MaterialCommunityIcons },
        { name: 'human-handsup', lib: MaterialCommunityIcons },
        { name: 'human-wheelchair', lib: MaterialCommunityIcons },
        { name: 'human-cane', lib: MaterialCommunityIcons },
        { name: 'tooth', lib: MaterialCommunityIcons },
        { name: 'pill', lib: MaterialCommunityIcons },
        { name: 'eye', lib: MaterialCommunityIcons },
        { name: 'spa', lib: MaterialCommunityIcons },
        { name: 'meditation', lib: MaterialCommunityIcons },
        { name: 'bandage', lib: MaterialCommunityIcons },
        { name: 'stethoscope', lib: MaterialCommunityIcons },
        { name: 'bottle-tonic-plus', lib: MaterialCommunityIcons },
        { name: 'weight-lifter', lib: MaterialCommunityIcons },
        { name: 'emoticon-happy-outline', lib: MaterialCommunityIcons },
        { name: 'food-apple', lib: MaterialCommunityIcons },
        { name: 'brain', lib: MaterialCommunityIcons },
        { name: 'medical-bag', lib: MaterialCommunityIcons },
        { name: 'laptop-medical', lib: FontAwesome5 }
    ],
    'Profesionales': [
        { name: 'briefcase', lib: Feather },
        { name: 'calculator', lib: MaterialCommunityIcons },
        { name: 'calculator-variant', lib: MaterialCommunityIcons },
        { name: 'laptop', lib: MaterialCommunityIcons },
        { name: 'palette', lib: MaterialCommunityIcons },
        { name: 'code-braces', lib: MaterialCommunityIcons },
        { name: 'compass-outline', lib: MaterialCommunityIcons },
        { name: 'fountain-pen-tip', lib: MaterialCommunityIcons },
        { name: 'translate', lib: MaterialCommunityIcons },
        { name: 'account-check', lib: MaterialCommunityIcons },
        { name: 'file-document-edit', lib: MaterialCommunityIcons },
        { name: 'file-document-multiple', lib: MaterialCommunityIcons },
        { name: 'microphone', lib: MaterialCommunityIcons },
        { name: 'headset', lib: MaterialCommunityIcons },
        { name: 'typewriter', lib: MaterialCommunityIcons },
        { name: 'video-account', lib: MaterialCommunityIcons }
    ],
    'Mascotas': [
        { name: 'paw', lib: FontAwesome5 },
        { name: 'dog', lib: MaterialCommunityIcons },
        { name: 'dog-service', lib: MaterialCommunityIcons },
        { name: 'cat', lib: MaterialCommunityIcons },
        { name: 'bone', lib: MaterialCommunityIcons },
        { name: 'fish', lib: MaterialCommunityIcons },
        { name: 'bird', lib: MaterialCommunityIcons },
        { name: 'rabbit', lib: MaterialCommunityIcons },
        { name: 'shredder', lib: MaterialCommunityIcons }
    ],
    'Educación': [
        { name: 'school', lib: MaterialCommunityIcons },
        { name: 'book', lib: Feather },
        { name: 'book-open-variant', lib: MaterialCommunityIcons },
        { name: 'certificate', lib: MaterialCommunityIcons },
        { name: 'brain', lib: MaterialCommunityIcons },
        { name: 'lightbulb', lib: MaterialCommunityIcons },
        { name: 'pencil', lib: MaterialCommunityIcons },
        { name: 'microscope', lib: MaterialCommunityIcons },
        { name: 'earth', lib: MaterialCommunityIcons },
        { name: 'flask', lib: MaterialCommunityIcons },
        { name: 'abacus', lib: MaterialCommunityIcons },
        { name: 'atom', lib: MaterialCommunityIcons }
    ],
    'Eventos': [
        { name: 'calendar', lib: Feather },
        { name: 'party-popper', lib: MaterialCommunityIcons },
        { name: 'balloon', lib: MaterialCommunityIcons },
        { name: 'music', lib: Feather },
        { name: 'camera', lib: Feather },
        { name: 'camera-burst', lib: MaterialCommunityIcons },
        { name: 'silverware-fork-knife', lib: MaterialCommunityIcons },
        { name: 'cake-variant', lib: MaterialCommunityIcons },
        { name: 'glass-wine', lib: MaterialCommunityIcons },
        { name: 'theater', lib: MaterialCommunityIcons },
        { name: 'fireworks', lib: MaterialCommunityIcons },
        { name: 'microphone-variant', lib: MaterialCommunityIcons },
        { name: 'ticket', lib: MaterialCommunityIcons },
        { name: 'map-marker-star', lib: MaterialCommunityIcons }
    ],
    'Tecnología': [
        { name: 'monitor', lib: Feather },
        { name: 'smartphone', lib: Feather },
        { name: 'cellphone', lib: MaterialCommunityIcons },
        { name: 'cellphone-cog', lib: MaterialCommunityIcons },
        { name: 'wifi', lib: Feather },
        { name: 'cctv', lib: MaterialCommunityIcons },
        { name: 'shield-lock', lib: MaterialCommunityIcons },
        { name: 'network', lib: MaterialCommunityIcons },
        { name: 'router-wireless', lib: MaterialCommunityIcons },
        { name: 'database', lib: MaterialCommunityIcons },
        { name: 'printer', lib: MaterialCommunityIcons },
        { name: 'robot', lib: MaterialCommunityIcons },
        { name: 'chip', lib: MaterialCommunityIcons },
        { name: 'keyboard', lib: MaterialCommunityIcons },
        { name: 'mouse', lib: MaterialCommunityIcons },
        { name: 'gamepad-variant', lib: MaterialCommunityIcons },
        { name: 'code-tags', lib: MaterialCommunityIcons },
        { name: 'download', lib: Feather }
    ],
    'Belleza y Estética': [
        { name: 'scissors', lib: Feather },
        { name: 'content-cut', lib: MaterialCommunityIcons },
        { name: 'hand-sparkles', lib: FontAwesome5 },
        { name: 'brush', lib: MaterialCommunityIcons },
        { name: 'face-man-shimmer', lib: MaterialCommunityIcons },
        { name: 'spray', lib: MaterialCommunityIcons },
        { name: 'spa', lib: MaterialCommunityIcons }
    ],
    'Compras': [
        { name: 'shopping-bag', lib: Feather },
        { name: 'tshirt-crew', lib: MaterialCommunityIcons },
        { name: 'tshirt', lib: FontAwesome5 },
        { name: 'hanger', lib: MaterialCommunityIcons },
        { name: 'shoe-heel', lib: MaterialCommunityIcons },
        { name: 'tag', lib: Feather },
        { name: 'gift', lib: Feather },
        { name: 'diamond-stone', lib: MaterialCommunityIcons },
        { name: 'watch', lib: MaterialCommunityIcons },
        { name: 'cart', lib: MaterialCommunityIcons },
        { name: 'store', lib: MaterialCommunityIcons },
        { name: 'credit-card-outline', lib: MaterialCommunityIcons }
    ],
    'Inmobiliaria': [
        { name: 'home-city', lib: MaterialCommunityIcons },
        { name: 'home-account', lib: MaterialCommunityIcons },
        { name: 'home-search', lib: MaterialCommunityIcons },
        { name: 'home-modern', lib: MaterialCommunityIcons },
        { name: 'building', lib: FontAwesome5 },
        { name: 'office-building', lib: MaterialCommunityIcons },
        { name: 'warehouse', lib: MaterialCommunityIcons },
        { name: 'key', lib: MaterialCommunityIcons },
        { name: 'file-document-outline', lib: MaterialCommunityIcons },
        { name: 'percent', lib: MaterialCommunityIcons },
        { name: 'sign-real-estate', lib: MaterialCommunityIcons }
    ],
    'Automoción': [
        { name: 'car', lib: FontAwesome5 },
        { name: 'car-wrench', lib: MaterialCommunityIcons },
        { name: 'gas-station', lib: MaterialCommunityIcons },
        { name: 'shield-car', lib: MaterialCommunityIcons },
        { name: 'steering', lib: MaterialCommunityIcons },
        { name: 'bike', lib: MaterialCommunityIcons },
        { name: 'moped', lib: MaterialCommunityIcons },
        { name: 'truck', lib: Feather },
        { name: 'bus', lib: FontAwesome5 },
        { name: 'tools', lib: MaterialCommunityIcons },
        { name: 'oil', lib: MaterialCommunityIcons },
        { name: 'tire', lib: MaterialCommunityIcons },
        { name: 'car-battery', lib: MaterialCommunityIcons },
        { name: 'car-coolant-level', lib: MaterialCommunityIcons },
        { name: 'car-wash', lib: MaterialCommunityIcons },
        { name: 'tow-truck', lib: MaterialCommunityIcons },
        { name: 'spray', lib: MaterialCommunityIcons }
    ],
    'Finanzas': [
        { name: 'bank', lib: MaterialCommunityIcons },
        { name: 'cash', lib: MaterialCommunityIcons },
        { name: 'finance', lib: MaterialCommunityIcons },
        { name: 'chart-line', lib: MaterialCommunityIcons },
        { name: 'credit-card', lib: Feather },
        { name: 'wallet', lib: MaterialCommunityIcons },
        { name: 'hand-coin', lib: MaterialCommunityIcons },
        { name: 'piggy-bank', lib: MaterialCommunityIcons },
        { name: 'safe', lib: MaterialCommunityIcons }
    ],
    'Viajes': [
        { name: 'airplane', lib: MaterialCommunityIcons },
        { name: 'map-pin', lib: Feather },
        { name: 'beach', lib: MaterialCommunityIcons },
        { name: 'hotel', lib: MaterialCommunityIcons },
        { name: 'compass', lib: Feather },
        { name: 'train', lib: MaterialCommunityIcons },
        { name: 'passport', lib: MaterialCommunityIcons },
        { name: 'suitcase', lib: MaterialCommunityIcons },
        { name: 'camera-retake', lib: MaterialCommunityIcons }
    ],
    'Legal': [
        { name: 'gavel', lib: MaterialCommunityIcons },
        { name: 'scale-balance', lib: MaterialCommunityIcons },
        { name: 'file-sign', lib: MaterialCommunityIcons },
        { name: 'police-badge', lib: MaterialCommunityIcons },
        { name: 'copyright', lib: MaterialCommunityIcons },
        { name: 'book-lock', lib: MaterialCommunityIcons },
        { name: 'file-certificate', lib: MaterialCommunityIcons },
        { name: 'account-tie', lib: MaterialCommunityIcons }
    ],
    'Marketing': [
        { name: 'bullhorn', lib: MaterialCommunityIcons },
        { name: 'facebook', lib: MaterialCommunityIcons },
        { name: 'instagram', lib: MaterialCommunityIcons },
        { name: 'google-ads', lib: MaterialCommunityIcons },
        { name: 'target', lib: Feather },
        { name: 'rocket', lib: MaterialCommunityIcons },
        { name: 'chart-bubble', lib: MaterialCommunityIcons },
        { name: 'email-newsletter', lib: MaterialCommunityIcons },
        { name: 'graph-up', lib: MaterialCommunityIcons }
    ],
    'Construcción': [
        { name: 'hard-hat', lib: MaterialCommunityIcons },
        { name: 'excavator', lib: MaterialCommunityIcons },
        { name: 'floor-plan', lib: MaterialCommunityIcons },
        { name: 'wall', lib: MaterialCommunityIcons },
        { name: 'tape-measure', lib: MaterialCommunityIcons },
        { name: 'ladder', lib: MaterialCommunityIcons },
        { name: 'blueprint', lib: MaterialCommunityIcons },
        { name: 'shovel', lib: MaterialCommunityIcons },
        { name: 'crane', lib: MaterialCommunityIcons }
    ]
};

// Flattened icon map for direct O(1) lookup
export const ALL_ICONS_FLAT = Object.values(ICON_CATEGORIES).flat();

export const CAT_ICONS = ALL_ICONS_FLAT.reduce((acc, item) => {
    acc[item.name] = { lib: item.lib, name: item.name };
    return acc;
}, {
    // Aliases / Extra definitions
    'tool': { lib: Feather, name: 'tool' },
    'wrench': { lib: MaterialCommunityIcons, name: 'wrench' },
    'pipe-wrench': { lib: MaterialCommunityIcons, name: 'pipe-wrench' },
    'droplet': { lib: Feather, name: 'droplet' },
    'zap': { lib: Feather, name: 'zap' },
    'lock': { lib: Feather, name: 'lock' },
    'trash-2': { lib: Feather, name: 'trash-2' },
    'wind': { lib: Feather, name: 'wind' },
    'smile': { lib: Feather, name: 'smile' },
    'coffee': { lib: Feather, name: 'coffee' },
    'baby-carriage': { lib: FontAwesome5, name: 'baby-carriage' },
    'utensils': { lib: FontAwesome5, name: 'utensils' },
    'phone': { lib: MaterialCommunityIcons, name: 'phone' }
});

/**
 * Retorna la información de icono (lib y name).
 * Si no está definido o es inválido, devuelve por defecto una LLAVE (wrench).
 */
export const getIconData = (iconName) => {
    if (iconName && CAT_ICONS[iconName]) {
        return CAT_ICONS[iconName];
    }
    // Fallback por defecto: Llave (wrench)
    return { lib: MaterialCommunityIcons, name: 'wrench' };
};

/**
 * Componente Dinámico Universal de Ícono
 */
export const DynamicAppIcon = ({ name, size = 24, color = '#EA580C', style }) => {
    const iconData = getIconData(name);
    const Lib = iconData.lib;
    return <Lib name={iconData.name} size={size} color={color} style={style} />;
};

// Legacy exports for compatibility
export const IconHogar = (props) => <DynamicAppIcon name="home" {...props} />;
export const IconAuto = (props) => <DynamicAppIcon name="car" {...props} />;
export const IconSalud = (props) => <DynamicAppIcon name="heart" {...props} />;
export const IconTech = (props) => <DynamicAppIcon name="monitor" {...props} />;
export const IconBeauty = (props) => <DynamicAppIcon name="scissors" {...props} />;
export const IconEvents = (props) => <DynamicAppIcon name="calendar" {...props} />;
export const IconPets = (props) => <DynamicAppIcon name="paw" {...props} />;
export const IconLegal = (props) => <DynamicAppIcon name="briefcase" {...props} />;

export const Car = FontAwesome5;
export const Stethoscope = FontAwesome5;
export const Briefcase = Feather;
export const Wifi = Feather;
export const Cat = FontAwesome5;
export const Scissors = FontAwesome5;
export const Music = Feather;
export const User = Feather;
export const ChevronDown = Feather;
export const X = Feather;
export const MapPin = Feather;
export const Crosshair = Feather;
export const ImagePlus = Feather;
export const Camera = Feather;
export const PlayCircle = Feather;
export const Star = Feather;
export const ArrowLeft = Feather;
export const ClipboardList = FontAwesome5;
export const Home = Feather;
export const ChevronRight = Feather;
export const Layers = Feather;
export const Grid = Feather;
export const Video = Feather;
export const RefreshCw = Feather;

// Dynamic ICON_MAP that resolves any icon name with wrench fallback
export const ICON_MAP = new Proxy({
    'home': IconHogar,
    'car': IconAuto,
    'heart': IconSalud,
    'monitor': IconTech,
    'scissors': IconBeauty,
    'calendar': IconEvents,
    'cat': IconPets,
    'briefcase': IconLegal,
    'default': (props) => <DynamicAppIcon name="wrench" {...props} />
}, {
    get: (target, prop) => {
        if (prop in target) return target[prop];
        if (typeof prop === 'string') {
            return (props) => <DynamicAppIcon name={prop} {...props} />;
        }
        return target['default'];
    }
});