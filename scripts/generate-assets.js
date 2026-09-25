const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ultra-clean pure Node PNG encoder using built-in zlib
function encodePNG(width, height, rgbaBuffer) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression method: 0
  ihdrData[11] = 0; // Filter method: 0
  ihdrData[12] = 0; // Interlace method: 0
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk (scanlines with filter byte 0)
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rawOffset = y * scanlineLength;
    rawData[rawOffset] = 0; // Filter type: None
    const rgbaOffset = y * width * 4;
    rgbaBuffer.copy(rawData, rawOffset + 1, rgbaOffset, rgbaOffset + width * 4);
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.slice(4, len + 8));
  chunk.writeUInt32BE(crc, len + 8);
  return chunk;
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Simple 2D RGBA drawing buffer
class Canvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buf = Buffer.alloc(width * height * 4); // all zeros (transparent)
  }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    if (a >= 255) {
      this.buf[idx] = r;
      this.buf[idx + 1] = g;
      this.buf[idx + 2] = b;
      this.buf[idx + 3] = a;
    } else {
      // Alpha blending
      const prevA = this.buf[idx + 3] / 255;
      const curA = a / 255;
      const outA = curA + prevA * (1 - curA);
      if (outA > 0) {
        this.buf[idx] = Math.round((r * curA + this.buf[idx] * prevA * (1 - curA)) / outA);
        this.buf[idx + 1] = Math.round((g * curA + this.buf[idx + 1] * prevA * (1 - curA)) / outA);
        this.buf[idx + 2] = Math.round((b * curA + this.buf[idx + 2] * prevA * (1 - curA)) / outA);
        this.buf[idx + 3] = Math.round(outA * 255);
      }
    }
  }

  fill(r, g, b, a = 255) {
    for (let i = 0; i < this.buf.length; i += 4) {
      this.buf[i] = r;
      this.buf[i + 1] = g;
      this.buf[i + 2] = b;
      this.buf[i + 3] = a;
    }
  }

  fillRect(x, y, w, h, r, g, b, a = 255) {
    for (let py = Math.max(0, Math.floor(y)); py < Math.min(this.height, Math.ceil(y + h)); py++) {
      for (let px = Math.max(0, Math.floor(x)); px < Math.min(this.width, Math.ceil(x + w)); px++) {
        this.setPixel(px, py, r, g, b, a);
      }
    }
  }

  fillCircle(cx, cy, radius, r, g, b, a = 255) {
    const r2 = radius * radius;
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = dx * dx + dy * dy;
        if (dist <= r2) {
          // Antialiased edge
          const edge = radius - Math.sqrt(dist);
          const alphaMult = edge >= 1 ? 1 : Math.max(0, edge);
          this.setPixel(x, y, r, g, b, Math.round(a * alphaMult));
        }
      }
    }
  }

  toBuffer() {
    return encodePNG(this.width, this.height, this.buf);
  }
}

// Generate the RankLocal Icon on a canvas of any size
function renderRankLocalIcon(size) {
  const cv = new Canvas(size, size);
  const cx = size / 2;
  const scale = size / 40;

  // Background rounded squircle / circle for app icons
  const bgPadding = size * 0.05;
  const bgRadius = (size / 2) - bgPadding;
  
  // Outer circle with Indigo #4F46E5 to #6366F1 gradient
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cx;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= bgRadius) {
        const t = (y / size);
        const r = Math.round(79 + (99 - 79) * t);
        const g = Math.round(70 + (102 - 70) * t);
        const b = Math.round(229 + (241 - 229) * t);
        const alphaEdge = (bgRadius - dist) >= 1 ? 1 : Math.max(0, bgRadius - dist);
        cv.setPixel(x, y, r, g, b, Math.round(255 * alphaEdge));
      }
    }
  }

  // Inner Pin cutout circle: slate-950 #0B0F19
  const pinRadius = 7.5 * scale;
  const pinCenterY = cx - (1 * scale);
  cv.fillCircle(cx, pinCenterY, pinRadius, 11, 15, 25, 240);

  // Bar 1 (left small): White #FFFFFF
  cv.fillRect(cx - (4.5 * scale), pinCenterY + (1.5 * scale), 2.2 * scale, 3.5 * scale, 255, 255, 255, 200);

  // Bar 2 (center medium): White #FFFFFF
  cv.fillRect(cx - (1.2 * scale), pinCenterY - (1.5 * scale), 2.2 * scale, 6.5 * scale, 255, 255, 255, 230);

  // Bar 3 / Arrow Trend (Emerald #10B981 to Cyan #06B6D4)
  // Arrow head pointing to top right
  const arrowX = cx + (3.5 * scale);
  const arrowY = pinCenterY - (3.5 * scale);
  cv.fillCircle(arrowX, arrowY, 2.2 * scale, 16, 185, 129, 255);
  cv.fillCircle(arrowX + (1 * scale), arrowY - (1 * scale), 1.2 * scale, 6, 182, 212, 255);

  // Connecting stem
  const steps = 15;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const sx = (cx - 1.2 * scale) * (1 - t) + arrowX * t;
    const sy = (pinCenterY + 2.5 * scale) * (1 - t) + arrowY * t;
    cv.fillCircle(sx, sy, 1.2 * scale, 16, 185, 129, 230);
  }

  return cv.toBuffer();
}

// Generate Open Graph 1200x630 banner
function renderOGImage() {
  const w = 1200;
  const h = 630;
  const cv = new Canvas(w, h);

  // Gradient background: Dark Slate #0B0F19 to #0F172A to #1E1B4B (deep indigo night)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tx = x / w;
      const ty = y / h;
      // Radial glow centered around (400, 280)
      const dx = x - 450;
      const dy = y - 280;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const glow = Math.max(0, 1 - dist / 550);

      const r = Math.min(255, Math.round(11 + 40 * glow + 10 * ty));
      const g = Math.min(255, Math.round(15 + 40 * glow + 10 * tx));
      const b = Math.min(255, Math.round(25 + 90 * glow + 35 * ty));
      cv.setPixel(x, y, r, g, b, 255);
    }
  }

  // Draw large RankLocal Icon badge at (180, 220)
  const iconSize = 160;
  const iconBuf = renderRankLocalIcon(iconSize);
  // Composite raw decoded or direct draw:
  // Let's directly draw a crisp large badge
  const iconX = 160;
  const iconY = 160;
  cv.fillCircle(iconX + 70, iconY + 70, 70, 79, 70, 229, 255);
  cv.fillCircle(iconX + 70, iconY + 70, 48, 11, 15, 25, 255);

  // White bars & Emerald arrow in badge
  cv.fillRect(iconX + 45, iconY + 75, 12, 22, 255, 255, 255, 210);
  cv.fillRect(iconX + 64, iconY + 58, 12, 39, 255, 255, 255, 240);
  cv.fillCircle(iconX + 96, iconY + 46, 14, 16, 185, 129, 255);
  cv.fillCircle(iconX + 101, iconY + 41, 7, 6, 182, 212, 255);

  // Horizontal accent card border on bottom
  cv.fillRect(0, h - 10, w, 10, 79, 70, 229, 255);

  // Emerald badge pill on top left
  cv.fillRect(160, 95, 340, 36, 16, 185, 129, 40);
  cv.fillRect(160, 95, 340, 36, 16, 185, 129, 10);

  return cv.toBuffer();
}

// Convert 16x16 and 32x32 PNGs into a standard .ico file
function makeIco(png16, png32) {
  // ICO header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = ICO
  header.writeUInt16LE(2, 4); // 2 images

  const offset1 = 6 + 16 * 2;
  const offset2 = offset1 + png16.length;

  const entry1 = Buffer.alloc(16);
  entry1.writeUInt8(16, 0); // width
  entry1.writeUInt8(16, 1); // height
  entry1.writeUInt8(0, 2);  // color palette: 0
  entry1.writeUInt8(0, 3);  // reserved
  entry1.writeUInt16LE(1, 4); // color planes
  entry1.writeUInt16LE(32, 6); // bpp
  entry1.writeUInt32LE(png16.length, 8);
  entry1.writeUInt32LE(offset1, 12);

  const entry2 = Buffer.alloc(16);
  entry2.writeUInt8(32, 0); // width
  entry2.writeUInt8(32, 1); // height
  entry2.writeUInt8(0, 2);
  entry2.writeUInt8(0, 3);
  entry2.writeUInt16LE(1, 4);
  entry2.writeUInt16LE(32, 6);
  entry2.writeUInt32LE(png32.length, 8);
  entry2.writeUInt32LE(offset2, 12);

  return Buffer.concat([header, entry1, entry2, png16, png32]);
}

// Main execution
const publicDir = path.join(__dirname, '..', 'public');
const brandDir = path.join(publicDir, 'brand');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });

console.log('Generating PNG favicon set and icons...');

const png16 = renderRankLocalIcon(16);
const png32 = renderRankLocalIcon(32);
const png180 = renderRankLocalIcon(180);
const png192 = renderRankLocalIcon(192);
const png512 = renderRankLocalIcon(512);

fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), png16);
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);

// Make favicon.ico
const icoBuf = makeIco(png16, png32);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);

console.log('Generating Open Graph 1200x630 banner...');
const ogBuf = renderOGImage();
fs.writeFileSync(path.join(brandDir, 'og-image.png'), ogBuf);
fs.writeFileSync(path.join(publicDir, 'og-image.png'), ogBuf);

console.log('Asset generation complete!');
