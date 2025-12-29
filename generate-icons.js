#!/usr/bin/env node

/**
 * Generate PWA icons for ThaiTide
 * This script creates placeholder icons - replace with your actual design
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Installing sharp for icon generation...');
  require('child_process').execSync('npm install --save-dev sharp', { stdio: 'inherit' });
  sharp = require('sharp');
}

const publicDir = path.join(__dirname, 'frontend', 'public');
const width = 512;
const height = 512;
const brandColor = '#ff6b9d';

// Create a simple SVG icon
const svgIcon = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6b9d;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ff1493;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#grad)"/>
  
  <!-- Heart shape -->
  <path d="M${width / 2},${height / 2 + 80} C${width / 4},${height / 2 - 20} ${width / 4},${height / 2 - 80} ${width / 4 + 60},${height / 2 - 80} C${width / 2},${height / 2 - 140} ${width / 2},${height / 2 - 140} ${width - width / 4 - 60},${height / 2 - 80} C${width - width / 4},${height / 2 - 80} ${width - width / 4},${height / 2 - 20} ${width / 2},${height / 2 + 80} Z" 
        fill="white" opacity="0.9"/>
  
  <!-- Text -->
  <text x="${width / 2}" y="${height - 60}" font-size="48" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial">
    ThaiTide
  </text>
</svg>
`;

async function generateIcons() {
  try {
    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const buffer = Buffer.from(svgIcon);

    // Generate 192x192 icon
    console.log('Generating 192x192 icon...');
    await sharp(buffer, { density: 192 })
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));

    // Generate 512x512 icon
    console.log('Generating 512x512 icon...');
    await sharp(buffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));

    // Generate maskable 192x192 icon (for modern PWAs)
    console.log('Generating maskable 192x192 icon...');
    await sharp(buffer, { density: 192 })
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-maskable-192.png'));

    // Generate maskable 512x512 icon
    console.log('Generating maskable 512x512 icon...');
    await sharp(buffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-maskable-512.png'));

    console.log('✅ All icons generated successfully!');
    console.log('📍 Icons saved to: frontend/public/');
    console.log('\nNote: These are placeholder icons. Replace them with your actual app icons:');
    console.log('  - icon-192.png (192x192)');
    console.log('  - icon-512.png (512x512)');
    console.log('  - icon-maskable-192.png (192x192, for modern PWAs)');
    console.log('  - icon-maskable-512.png (512x512, for modern PWAs)');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
