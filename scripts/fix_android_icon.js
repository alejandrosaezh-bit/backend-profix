const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputImagePath = path.join(__dirname, '../assets/images/logo.png');
const outputIconPath = path.join(__dirname, '../assets/images/android-icon-foreground.png');

async function fixIcon() {
  try {
    console.log('Padding android-icon-foreground.png...');
    // Android safe zone is 66% of the canvas. We use 60% (614px out of 1024) to be safe.
    const resizedLogo = await sharp(inputImagePath)
      .resize(614, 614, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{
        input: resizedLogo,
        gravity: 'center'
      }])
      .toFile(outputIconPath);

    console.log('Successfully padded android-icon-foreground.png!');
  } catch (error) {
    console.error('Error fixing icon:', error);
  }
}

fixIcon();
