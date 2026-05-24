const sharp = require('sharp');
const path = require('path');

const inputImagePath = path.join(__dirname, '../assets/logo_oficial.png');
const outputIconPath = path.join(__dirname, '../assets/images/android-icon-foreground.png');

async function fixIcon() {
  try {
    console.log('Padding android-icon-foreground.png and forcing sRGB...');
    
    await sharp(inputImagePath)
      .resize(600, 600, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .extend({
        top: 212, bottom: 212, left: 212, right: 212,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .withMetadata(false) // Strip all metadata, ICC profiles, EXIF
      .toColorspace('srgb')
      .png({ force: true, palette: true }) // Use 8-bit palette to guarantee standard PNG
      .toFile(outputIconPath);

    console.log('Successfully generated clean padded PNG!');
  } catch (error) {
    console.error('Error fixing icon:', error);
  }
}

fixIcon();
