import { Briefcase, Car, Cat, Hammer, Music, Scissors, Stethoscope, Wifi } from 'lucide-react-native';

export const CATEGORIES_DISPLAY = [
  { id: 'hogar', name: 'Hogar', fullName: "Hogar", icon: Hammer, color: '#FFF7ED', iconColor: '#EA580C' },
  { id: 'auto', name: 'Autos', fullName: "Automotriz", icon: Car, color: '#EFF6FF', iconColor: '#2563EB' },
  { id: 'salud', name: 'Salud', fullName: "Salud y Bienestar", icon: Stethoscope, color: '#F0FDF4', iconColor: '#16A34A' },
  { id: 'legal', name: 'Legal', fullName: "Legal y Trámites", icon: Briefcase, color: '#F8FAFC', iconColor: '#475569' },
  { id: 'tech', name: 'Tech', fullName: "Tecnología", icon: Wifi, color: '#FAF5FF', iconColor: '#9333EA' },
  { id: 'pets', name: 'Mascotas', fullName: "Mascotas", icon: Cat, color: '#FEFCE8', iconColor: '#CA8A04' },
  { id: 'beauty', name: 'Belleza', fullName: "Belleza", icon: Scissors, color: '#FDF2F8', iconColor: '#DB2777' },
  { id: 'events', name: 'Eventos', fullName: "Eventos", icon: Music, color: '#FEF2F2', iconColor: '#DC2626' },
];

export const DETAILED_CATEGORIES = {
  "Hogar": ["Aire Acondicionado", "Plomería", "Electricidad", "Pintura", "Albañilería"],
  "Automotriz": ["Mecánica Ligera", "Cauchos", "Baterías", "Aire Acondicionado Auto"],
  "Tecnología": ["Reparación PC", "Redes", "Cámaras de Seguridad"]
};

export const BLOG_POSTS = [
  { id: '1', title: '¿Cómo limpiar tu aire acondicionado fácil y barato?', category: 'Hogar', image: 'https://via.placeholder.com/150' },
  { id: '2', title: '5 tips para ahorrar electricidad en casa', category: 'Tips', image: 'https://via.placeholder.com/150' },
];

export const TESTIMONIALS = [
    { id: 1, user: "Camilo Acosta", text: "Me ha salvado en varias ocasiones.", stars: 5 },
    { id: 2, user: "Lucia Esperanza", text: "Encontré un cerrajero en 5 minutos.", stars: 5 },
];