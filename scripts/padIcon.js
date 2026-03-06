const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../assets/images/android-icon-foreground.png');
const outputPath = path.join(__dirname, '../assets/images/android-icon-foreground-sq.png');

async function pad() {
    try {
        await sharp(inputPath)
            .resize({
                width: 448,
                height: 448,
                fit: sharp.fit.contain,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .toFile(outputPath);

        console.log("Image padded successfully.");
        fs.copyFileSync(outputPath, inputPath);
        console.log("Replaced original image.");
    } catch (e) {
        console.error("Error padding image:", e.message);
    }
}

pad();
