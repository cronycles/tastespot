import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

const svgBuffer = readFileSync(path.join(publicDir, "app-icon.svg"));

// Apple touch icon for iOS (180x180)
await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, "apple-touch-icon.png"));
console.log("✓ apple-touch-icon.png (180x180)");

// PWA icon 192x192 (Android Chrome)
await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, "icon-192.png"));
console.log("✓ icon-192.png (192x192)");

// PWA icon 512x512 (splash screen, store listing)
await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, "icon-512.png"));
console.log("✓ icon-512.png (512x512)");

console.log("Done! All icons generated.");
