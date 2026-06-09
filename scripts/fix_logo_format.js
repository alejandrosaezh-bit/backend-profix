const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputImagePath = path.join(__dirname, '../assets/images/logo.png');
const outputImagePath = path.join(__dirname, '../assets/images/logo_real.png');

async function fixLogo() {
  try {
    console.log('Converting fake PNG (JPG) to real PNG...');
    await sharp(inputImagePath).toFile(outputImagePath);
    // Replace the fake one
    fs.renameSync(outputImagePath, inputImagePath);
    console.log('Successfully fixed logo.png format!');
  } catch (error) {
    console.error('Error fixing logo:', error);
  }
}

fixLogo();
