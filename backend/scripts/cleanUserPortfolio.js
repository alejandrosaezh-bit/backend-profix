require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const user = await User.findOne({ email: 'alejandrosaezh@gmail.com' });

        if (user) {
            console.log('Usuario encontrado:', user.name);
            let updated = false;

            // Clear documents if any exist
            if (user.documents && user.documents.length > 0) {
                user.documents = [];
                updated = true;
            }

            // Clear portfolios (galleries) in each profile category
            if (user.profiles) {
                for (let [categoryName, profileData] of user.profiles.entries()) {
                    if (profileData.gallery && profileData.gallery.length > 0) {
                        console.log(`Borrando ${profileData.gallery.length} fotos de la categoría ${categoryName}...`);
                        profileData.gallery = [];
                        updated = true;
                    }
                }
            }

            if (updated) {
                await user.save();
                console.log('Portafolio y/o documentos eliminados correctamente.');
            } else {
                console.log('El usuario no tenía imágenes en el portafolio.');
            }
        } else {
            console.log('Usuario no encontrado.');
        }

    } catch (error) {
        console.error('Error al limpiar portafolio:', error);
    } finally {
        process.exit(0);
    }
});
