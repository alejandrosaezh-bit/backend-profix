const sharp = require('sharp');
const path = require('path');

const inputImagePath = path.join(__dirname, '../assets/images/logo.png');
const outputIconPath = path.join(__dirname, '../assets/images/android-icon-foreground.png');

async function fixIconSafely() {
  try {
    console.log('Safe padding android-icon-foreground.png...');
    // We resize logo to 614x614, then extend by 205 on all sides to make 1024x1024
    await sharp(inputImagePath)
      .resize(614, 614, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 205,
        bottom: 205,
        left: 205,
        right: 205,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
      .toFile(outputIconPath);

    console.log('Successfully padded android-icon-foreground.png with safe extend!');
  } catch (error) {
    console.error('Error fixing icon:', error);
  }
}

fixIconSafely();
