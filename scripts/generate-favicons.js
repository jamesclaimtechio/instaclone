/**
 * Favicon Generator Script
 * Generates multiple favicon sizes from the Instagram gradient icon
 * Run with: node scripts/generate-favicons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = path.join(__dirname, '..', 'Instagram_icon_Gradient.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'public');

// Favicon sizes needed for various platforms
const FAVICON_SIZES = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 }, // Apple iOS
  { name: 'android-chrome-192x192.png', size: 192 }, // Android
  { name: 'android-chrome-512x512.png', size: 512 }, // Android large
];

async function generateFavicons() {
  console.log('🎨 Starting favicon generation...\n');

  // Check if source image exists
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error('❌ Source image not found:', SOURCE_IMAGE);
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate each size
  for (const { name, size } of FAVICON_SIZES) {
    try {
      const outputPath = path.join(OUTPUT_DIR, name);
      
      await sharp(SOURCE_IMAGE)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated: ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  }

  // Generate ICO file (combining 16x16 and 32x32)
  try {
    const icoPath = path.join(OUTPUT_DIR, 'favicon.ico');
    
    // For ICO, we'll just use the 32x32 PNG as a fallback
    // Note: Sharp doesn't natively support ICO, so we create a 32x32 PNG named .ico
    await sharp(SOURCE_IMAGE)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(icoPath);

    console.log(`✅ Generated: favicon.ico (32x32)`);
  } catch (error) {
    console.error('❌ Failed to generate favicon.ico:', error.message);
  }

  console.log('\n🎉 Favicon generation complete!');
  console.log('\nGenerated files:');
  console.log('  - favicon.ico (for browsers)');
  console.log('  - favicon-16x16.png');
  console.log('  - favicon-32x32.png');
  console.log('  - apple-touch-icon.png (for iOS)');
  console.log('  - android-chrome-192x192.png');
  console.log('  - android-chrome-512x512.png');
  console.log('\n💡 Next step: Update app/layout.tsx with favicon metadata');
}

// Run the generator
generateFavicons().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

