import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

export const IconHogar = (props) => <Feather name="home" {...props} />;
export const IconAuto = (props) => <FontAwesome5 name="car" {...props} />;
export const IconSalud = (props) => <Feather name="heart" {...props} />;
export const IconTech = (props) => <Feather name="monitor" {...props} />;
export const IconBeauty = (props) => <Feather name="scissors" {...props} />;
export const IconEvents = (props) => <Feather name="calendar" {...props} />;
export const IconPets = (props) => <FontAwesome5 name="cat" {...props} />;
export const IconLegal = (props) => <Feather name="briefcase" {...props} />;

// Alias a librerías completas (para uso con name="...")
export const Car = FontAwesome5;
export const Stethoscope = FontAwesome5;
export const Briefcase = Feather; // Se mantiene para usos genéricos
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

export const { width } = Dimensions.get('window');

// --- HELPERS PARA ICONOS ---
export const CAT_ICONS = {
    'home': { lib: Feather, name: 'home' },
    'car': { lib: FontAwesome5, name: 'car' },
    'heart': { lib: Feather, name: 'heart' },
    'monitor': { lib: Feather, name: 'monitor' },
    'scissors': { lib: Feather, name: 'scissors' },
    'calendar': { lib: Feather, name: 'calendar' },
    'cat': { lib: FontAwesome5, name: 'cat' },
    'briefcase': { lib: Feather, name: 'briefcase' },
    'tool': { lib: Feather, name: 'tool' },
    'truck': { lib: Feather, name: 'truck' },
    'shopping-bag': { lib: Feather, name: 'shopping-bag' },
    'book': { lib: Feather, name: 'book' },
    'music': { lib: Feather, name: 'music' },
    'camera': { lib: Feather, name: 'camera' },
    'smile': { lib: Feather, name: 'smile' },
    'map-pin': { lib: Feather, name: 'map-pin' },
    'wifi': { lib: Feather, name: 'wifi' },
    'gift': { lib: Feather, name: 'gift' },
    'coffee': { lib: Feather, name: 'coffee' },
    'smartphone': { lib: Feather, name: 'smartphone' },
    'droplet': { lib: Feather, name: 'droplet' },
    'zap': { lib: Feather, name: 'zap' },
    'lock': { lib: Feather, name: 'lock' },
    'trash-2': { lib: Feather, name: 'trash-2' },
    'wind': { lib: Feather, name: 'wind' },
    'hammer': { lib: MaterialCommunityIcons, name: 'hammer' },
    'wrench': { lib: MaterialCommunityIcons, name: 'wrench' },
    'pipe-wrench': { lib: MaterialCommunityIcons, name: 'pipe-wrench' },
    'paint-brush': { lib: FontAwesome5, name: 'paint-brush' },
    'broom': { lib: MaterialCommunityIcons, name: 'broom' },
    'flower': { lib: MaterialCommunityIcons, name: 'flower' },
    'paw': { lib: FontAwesome5, name: 'paw' },
    'baby-carriage': { lib: FontAwesome5, name: 'baby-carriage' },
    'tshirt': { lib: FontAwesome5, name: 'tshirt' },
    'utensils': { lib: FontAwesome5, name: 'utensils' },
    'air-conditioner': { lib: MaterialCommunityIcons, name: 'air-conditioner' },
    'snowflake': { lib: MaterialCommunityIcons, name: 'snowflake' },
    'fan': { lib: MaterialCommunityIcons, name: 'fan' },
    'water': { lib: MaterialCommunityIcons, name: 'water' },
    'lightbulb-on': { lib: MaterialCommunityIcons, name: 'lightbulb-on' },
    'shredder': { lib: MaterialCommunityIcons, name: 'shredder' },
    'phone': { lib: MaterialCommunityIcons, name: 'phone' }
};

export const ICON_MAP = {
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