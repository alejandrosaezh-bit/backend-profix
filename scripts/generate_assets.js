const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputImagePath = path.join(__dirname, '../assets/logo_oficial.png');
const outputDir = path.join(__dirname, '../assets/images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateAssets() {
  try {
    console.log('Generating icon.png (1024x1024, white background)...');
    await sharp(inputImagePath)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .toFile(path.join(outputDir, 'icon.png'));

    console.log('Generating android-icon-foreground.png (1024x1024, transparent background)...');
    await sharp(inputImagePath)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(outputDir, 'android-icon-foreground.png'));

    console.log('Generating splash.png (1242x2436, centered logo)...');
    await sharp({
      create: {
        width: 1242,
        height: 2436,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([{
        input: await sharp(inputImagePath).resize(800, 800, { fit: 'inside' }).toBuffer(),
        gravity: 'center'
      }])
      .toFile(path.join(outputDir, 'splash.png'));

    console.log('Generating favicon.png (48x48)...');
    await sharp(inputImagePath)
      .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(path.join(outputDir, 'favicon.png'));

    console.log('All assets generated successfully!');
  } catch (error) {
    console.error('Error generating assets:', error);
  }
}

generateAssets();
