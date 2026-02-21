const mongoose = require('../backend/node_modules/mongoose');
const dotenv = require('dotenv');
const Category = require('../backend/models/Category');

dotenv.config({ path: './backend/.env' });

const CATEGORIES_SEED = [
  { name: 'Hogar', icon: 'home', color: '#FFF7ED', subcategories: ["Aire Acondicionado", "Plomería", "Electricidad", "Pintura", "Albañilería", "Limpieza", "Cerrajería", "Carpintería"] },
  { name: 'Autos', icon: 'car', color: '#EFF6FF', subcategories: ["Mecánica Ligera", "Cauchos", "Baterías", "Aire Acondicionado Auto", "Latonería y Pintura", "Autolavado", "Grúa"] },
  { name: 'Salud', icon: 'heart', color: '#FFF7ED', subcategories: ["Enfermería", "Fisioterapia", "Nutrición", "Cuidado de Adultos Mayores", "Psicología", "Entrenador Personal"] },
  { name: 'Tech', icon: 'monitor', color: '#EFF6FF', subcategories: ["Reparación PC/Laptop", "Redes y WiFi", "Cámaras de Seguridad", "Instalación de Software", "Reparación de Celulares"] },
  { name: 'Belleza', icon: 'scissors', color: '#FFF7ED', subcategories: ["Peluquería", "Manicure/Pedicure", "Maquillaje", "Barbería", "Masajes"] },
  { name: 'Eventos', icon: 'calendar', color: '#EFF6FF', subcategories: ["Fotografía", "Decoración", "Catering/Comida", "Música/DJ", "Animación"] },
  { name: 'Mascotas', icon: 'cat', color: '#FFF7ED', subcategories: ["Paseo de Perros", "Veterinaria a Domicilio", "Peluquería Canina", "Adiestramiento"] },
  { name: 'Legal', icon: 'briefcase', color: '#EFF6FF', subcategories: ["Abogado", "Gestoría", "Contabilidad", "Redacción de Documentos"] }
];

const seedDB = async () => {
    try {
        // Asegurar que usamos la URI correcta y opciones de conexión
        console.log("Conectando a:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB Conectado');

        for (const cat of CATEGORIES_SEED) {
            // Usar upsert para crear si no existe
            await Category.findOneAndUpdate(
                { name: cat.name },
                cat,
                { upsert: true, new: true }
            );
            console.log(`Categoría procesada: ${cat.name}`);
        }

        console.log('Proceso de Seed completado');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedDB();