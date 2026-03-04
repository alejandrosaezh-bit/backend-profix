require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const fs = require('fs');

const pro1_avatar_path = 'C:/Users/Workin Office/.gemini/antigravity/brain/33f9e5fd-8ed7-42ae-a9c1-32330c97ea25/pro_avatar_1_1772630363797.png';
const pro2_avatar_path = 'C:/Users/Workin Office/.gemini/antigravity/brain/33f9e5fd-8ed7-42ae-a9c1-32330c97ea25/pro_avatar_2_1772630378465.png';

const getBase64Image = (path) => {
    try {
        const img = fs.readFileSync(path);
        return 'data:image/png;base64,' + img.toString('base64');
    } catch (e) {
        console.warn(`Could not read image ${path}`);
        return null;
    }
}

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Creando cuentas de profesionales de prueba...');

    try {
        // Borramos si existen antes
        await User.deleteMany({ email: { $in: ['pro1@profix.com', 'pro2@profix.com'] } });

        // Profesional 1 (Hogar, Automotriz, Eventos)
        const pro1 = new User({
            name: 'Juan Pérez (Pro 1)',
            email: 'pro1@profix.com',
            role: 'professional',
            password: 'password123',
            phone: '1234567890',
            isActive: true,
            isVerified: true,
            rating: 4.8,
            reviewsCount: 15,
            avatar: getBase64Image(pro1_avatar_path),
            specialties: ['Hogar', 'Automotriz', 'Eventos'],
            profiles: {
                'Hogar': {
                    bio: 'Especialista en plomería y electricidad con más de 10 años de experiencia.',
                    subcategories: ['Plomería', 'Electricidad'],
                    zones: ['Norte', 'Centro', 'Sur'],
                    experience: '10 años',
                    priceRange: '$$',
                    isActive: true,
                    gallery: []
                },
                'Automotriz': {
                    bio: 'Mecánico de confianza.',
                    subcategories: ['Mecánica General'],
                    zones: ['Norte', 'Sur'],
                    experience: '8 años',
                    priceRange: '$$',
                    isActive: true,
                    gallery: []
                },
                'Eventos': {
                    bio: 'Fotógrafo para eventos sociales.',
                    subcategories: ['Fotografía'],
                    zones: ['Centro'],
                    experience: '5 años',
                    priceRange: '$$$',
                    isActive: true,
                    gallery: []
                }
            }
        });

        // Profesional 2 (Tecnología, Clases Particulares, Mascotas, Belleza)
        const pro2 = new User({
            name: 'Ana Gómez (Pro 2)',
            email: 'pro2@profix.com',
            role: 'professional',
            password: 'password123',
            phone: '0987654321',
            isActive: true,
            isVerified: true,
            rating: 5.0,
            reviewsCount: 22,
            avatar: getBase64Image(pro2_avatar_path),
            specialties: ['Tecnología', 'Clases Particulares', 'Mascotas', 'Belleza'],
            profiles: {
                'Tecnología': {
                    bio: 'Técnica en reparación de hardware y redes.',
                    subcategories: ['Reparación de Computadoras'],
                    zones: ['Norte', 'Sur'],
                    experience: '5 años',
                    priceRange: '$$',
                    isActive: true,
                    gallery: []
                },
                'Clases Particulares': {
                    bio: 'Tutora de matemáticas con paciencia y técnicas modernas.',
                    subcategories: ['Matemáticas'],
                    zones: ['Virtual'],
                    experience: '3 años',
                    priceRange: '$',
                    isActive: true,
                    gallery: []
                },
                'Mascotas': {
                    bio: 'Amante de los animales, experiencia en adiestramiento y paseos.',
                    subcategories: ['Paseo de Perros'],
                    zones: ['Centro', 'Sur'],
                    experience: '2 años',
                    priceRange: '$',
                    isActive: true,
                    gallery: []
                },
                'Belleza': {
                    bio: 'Maquilladora profesional, estilo de noche y bodas.',
                    subcategories: ['Maquillaje y Peinado'],
                    zones: ['A domicilio', 'Centro'],
                    experience: '4 años',
                    priceRange: '$$$',
                    isActive: true,
                    gallery: []
                }
            }
        });

        await pro1.save();
        await pro2.save();

        console.log('Las dos cuentas han sido creadas con éxito:');
        console.log('- Email: pro1@profix.com (Contraseña: no configurada, usar login local saltando auth si es posible o usar UI / DB auth real)');
        console.log('- Email: pro2@profix.com');

    } catch (error) {
        console.error('Error al crear profesionales:', error);
    } finally {
        process.exit(0);
    }
});
