import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'icon.svg'));

async function generateIcons() {
  await sharp(svgBuffer)
    .resize(192, 192)
    .toFile(path.join(process.cwd(), 'public', 'pwa-192x192.png'));

  await sharp(svgBuffer)
    .resize(512, 512)
    .toFile(path.join(process.cwd(), 'public', 'pwa-512x512.png'));
    
  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);
