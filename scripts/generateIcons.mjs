import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const iconsDir = path.join(rootDir, "public", "icons");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// CRC32 implementation for PNG chunks
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function createPngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, "binary");
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generatePng(size, isMaskable = false) {
  const width = size;
  const height = size;

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // Bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  // Raw RGBA scanlines
  // DishDash terracotta background: #D95328 (RGB: 217, 83, 40)
  // White pot / dish motif in center
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const center = size / 2;
  const radius = size * 0.44;
  const innerRadius = size * 0.38;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: #D95328 (Terracotta)
      let r = 217;
      let g = 83;
      let b = 40;
      let a = 255;

      // Draw stylized DishDash dish cloche / pot in white
      // Pot dome: upper half circle
      const isDome = dist < innerRadius * 0.75 && dy < 0;
      // Pot base: lower rectangle
      const isBase = Math.abs(dx) < innerRadius * 0.8 && dy >= 0 && dy < innerRadius * 0.35;
      // Handle on top
      const isHandle = Math.abs(dx) < innerRadius * 0.15 && Math.abs(dy + innerRadius * 0.8) < innerRadius * 0.15;
      // Plate rim
      const isPlate = Math.abs(dx) < innerRadius * 0.95 && Math.abs(dy - innerRadius * 0.4) < innerRadius * 0.08;

      if (isDome || isBase || isHandle || isPlate) {
        // Pure crisp white motif
        r = 255;
        g = 255;
        b = 255;
      }

      // If not maskable, soften circle corners if desired, or keep rounded app tile
      if (!isMaskable && dist > radius) {
        // Soft corner alpha for standard app tile
        const edge = dist - radius;
        if (edge > 2) {
          a = 0;
        } else {
          a = Math.max(0, Math.min(255, Math.floor(255 * (1 - edge / 2))));
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);

  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = createPngChunk("IHDR", ihdr);
  const idatChunk = createPngChunk("IDAT", idatData);
  const iendChunk = createPngChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
}

// Generate SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#D95328" />
  <!-- DishDash Pot / Cloche Icon -->
  <circle cx="256" cy="140" r="24" fill="#FFFFFF" />
  <path d="M 120 280 C 120 180, 392 180, 392 280 Z" fill="#FFFFFF" />
  <rect x="100" y="290" width="312" height="24" rx="12" fill="#FFFFFF" />
  <!-- Steam lines -->
  <path d="M 220 100 Q 230 75 220 50" stroke="#FDEEE9" stroke-width="8" stroke-linecap="round" fill="none" />
  <path d="M 256 95 Q 266 70 256 45" stroke="#FDEEE9" stroke-width="8" stroke-linecap="round" fill="none" />
  <path d="M 292 100 Q 302 75 292 50" stroke="#FDEEE9" stroke-width="8" stroke-linecap="round" fill="none" />
</svg>`;

fs.writeFileSync(path.join(iconsDir, "icon-192.png"), generatePng(192, false));
fs.writeFileSync(path.join(iconsDir, "icon-512.png"), generatePng(512, false));
fs.writeFileSync(path.join(iconsDir, "icon-maskable.png"), generatePng(512, true));
fs.writeFileSync(path.join(iconsDir, "icon.svg"), svgContent, "utf-8");

console.log("✅ PWA Icons successfully generated in public/icons/:");
console.log("   - icon-192.png (192x192)");
console.log("   - icon-512.png (512x512)");
console.log("   - icon-maskable.png (512x512)");
console.log("   - icon.svg");
