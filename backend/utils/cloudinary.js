const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = async (base64Image, folder = 'profix') => {
    try {
        if (!base64Image) return null;
        
        // If it's already a URL, return it
        if (base64Image.startsWith('http')) return base64Image;

        // Ensure it has the data URI prefix if it's base64
        let imageToUpload = base64Image;
        if (!base64Image.startsWith('data:image')) {
            imageToUpload = `data:image/jpeg;base64,${base64Image}`;
        }

        const result = await cloudinary.uploader.upload(imageToUpload, {
            folder: folder,
            transformation: [
                { quality: "auto", fetch_format: "auto" }
            ]
        });

        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return null;
    }
};

const deleteImage = async (imageUrl) => {
    try {
        if (!imageUrl || !imageUrl.includes('cloudinary.com')) return;

        // Extract public_id from URL
        const parts = imageUrl.split('/');
        const lastPart = parts[parts.length - 1];
        const publicIdWithFolder = parts.slice(parts.indexOf('upload') + 2).join('/').split('.')[0];

        await cloudinary.uploader.destroy(publicIdWithFolder);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
    }
};

module.exports = {
    cloudinary,
    uploadImage,
    deleteImage
};
