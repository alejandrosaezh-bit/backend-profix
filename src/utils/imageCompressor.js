import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

/**
 * Comprime una imagen (URI o Base64) a dimensiones manejables para que no colapse el servidor
 * @param {string} uri - La URI o la cadena en base64 de la imagen seleccionada
 * @param {number} maxWidth - Ancho maximo en pixeles
 * @returns {Promise<string>} - Nueva URI compresa en formato JPEG
 */
export const compressImage = async (uri, maxWidth = 800) => {
    try {
        if (!uri) return uri;

        if (Platform.OS === 'web') {
            return new Promise((resolve, reject) => {
                const img = new Image();
                // Avoid crossOrigin on local blob/data URLs as it can block loading
                if (uri.startsWith('http')) {
                    img.crossOrigin = 'Anonymous';
                }
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Quality 60%
                    resolve(dataUrl);
                };
                img.onerror = (err) => {
                    console.warn("Error loading image for Web Canvas compression:", err);
                    resolve(uri); // fallback returning original URI if error in loading
                };
                img.src = uri;
            });
        }

        // Para iOS y Android nativos
        const manipResult = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: maxWidth } }],
            { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        return `data:image/jpeg;base64,${manipResult.base64}`;
    } catch (error) {
        console.warn('Error al comprimir la imagen:', error);
        return uri; // Si algo falla, retorna la original para no romper el flujo
    }
};

/**
 * Comprime un avatar a dimensiones super pequeñas para listas y chats
 */
export const compressAvatar = async (uri) => {
    return compressImage(uri, 200); // 200px es mas que suficiente para miniaturas redondas
};
