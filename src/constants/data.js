export const DETAILED_CATEGORIES = {
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

export const CATEGORY_EXAMPLES = {
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

export const BLOG_POSTS = [
    { id: '1', title: '¿Cómo limpiar tu aire acondicionado fácil y barato?', category: 'Hogar', image: 'https://ui-avatars.com/api/?name=User&background=random' },
    { id: '2', title: '5 tips para ahorrar electricidad en casa', category: 'Tips', image: 'https://ui-avatars.com/api/?name=User&background=random' },
];

export const TESTIMONIALS = [
    { id: 1, user: "Camilo Acosta", text: "Me ha salvado en varias ocasiones.", stars: 5, image: "https://ui-avatars.com/api/?name=Camilo+Acosta&background=random" },
    { id: 2, user: "Lucia Esperanza", text: "Encontré un cerrajero en 5 minutos.", stars: 5, image: "https://ui-avatars.com/api/?name=Lucia+Esperanza&background=random" },
    { id: 3, user: "Marcos R.", text: "Excelente servicio y rapidez.", stars: 4, image: "https://ui-avatars.com/api/?name=Marcos+R&background=random" },
];

// --- DATOS DE ZONAS (MOCK) ---
// Estructura: Ciudad/Región -> [Municipios]
export const LOCATIONS_DATA = {
    "Gran Caracas": ["Libertador", "Chacao", "Baruta", "Sucre", "El Hatillo"],
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
export const FLAT_ZONES_SUGGESTIONS = [];
Object.keys(LOCATIONS_DATA).forEach(city => {
    LOCATIONS_DATA[city].forEach(muni => {
        FLAT_ZONES_SUGGESTIONS.push(`${muni}, ${city}`);
    });
});

// --- DATA PARA MENSAJERÍA DINÁMICA ---
export const HOME_COPY_OPTIONS = [
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

export const ROTATION_KEY = 'home_messaging_rotation_index';
