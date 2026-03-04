require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const iconMap = {
    // Hogar
    'Aire Acondicionado': 'air-conditioner',
    'Plomería': 'water-pump',
    'Electricidad': 'lightning-bolt',
    'Pintura': 'format-paint',
    'Albañilería': 'wall',
    'Limpieza': 'broom',
    'Cerrajería': 'key',
    'Carpintería': 'saw-blade',

    // Autos
    'Mecánica Ligera': 'car-wrench',
    'Cauchos': 'tire',
    'Baterías': 'car-battery',
    'Aire Acondicionado Auto': 'car-coolant-level',
    'Latonería y Pintura': 'spray',
    'Autolavado': 'car-wash',
    'Grúa': 'tow-truck',

    // Salud
    'Enfermería': 'user-nurse',
    'Fisioterapia': 'human-wheelchair',
    'Nutrición': 'food-apple',
    'Cuidado de Adultos Mayores': 'human-cane',
    'Psicología': 'brain',
    'Entrenador Personal': 'dumbbell',
    'Dentista': 'tooth',

    // Tech
    'Reparación PC/Laptop': 'laptop-medical',
    'Redes y WiFi': 'wifi',
    'Cámaras de Seguridad': 'cctv',
    'Instalación de Software': 'download',
    'Reparación de Celulares': 'cellphone-cog',

    // Belleza
    'Peluquería': 'content-cut',
    'Manicure/Pedicure': 'hand-sparkles',
    'Maquillaje': 'brush',
    'Barbería': 'face-man-shimmer',
    'Masajes': 'spa',

    // Eventos
    'Fotografía': 'camera',
    'Decoración': 'balloon',
    'Catering/Comida': 'silverware-fork-knife',
    'Música/DJ': 'music',
    'Animación': 'party-popper',

    // Mascotas
    'Paseo de Perros': 'dog-service',
    'Veterinaria a Domicilio': 'medical-bag',
    'Peluquería Canina': 'content-cut',
    'Adiestramiento': 'dog',

    // Legal
    'Abogado': 'scale-balance',
    'Gestoría': 'file-document-multiple',
    'Contabilidad': 'calculator',
    'Redacción de Documentos': 'typewriter',

    // Bienes Raíces
    'Agente inmobiliario': 'home-account',
    'Tasador': 'home-search',
    'Fotógrafo': 'camera-burst',

    // Cursos
    'Inteligencia Artificial': 'robot',
    'Matemática': 'calculator-variant',
    'Física y Química': 'flask',

    // Servicios
    'Mensajería': 'moped'
};

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Iniciando actualización de íconos en subcategorías...');

    try {
        const categories = await Category.find();
        let updatedCount = 0;

        for (const cat of categories) {
            let changed = false;
            cat.subcategories.forEach(sub => {
                const subName = sub.name.trim();
                if (iconMap[subName]) {
                    sub.icon = iconMap[subName];
                    changed = true;
                } else if (!sub.icon || sub.icon === 'circle' || sub.icon === 'mop') {
                    // Placeholder param
                    console.warn(`! No se encontró ícono para: ${subName}`);
                }
            });

            if (changed) {
                // Must trigger Mongoose array update
                cat.markModified('subcategories');
                await cat.save();
                updatedCount++;
            }
        }

        console.log(`Se actualizaron subcategorías en ${updatedCount} categorías con éxito.`);

    } catch (error) {
        console.error('Error al actualizar:', error);
    } finally {
        process.exit(0);
    }
});
