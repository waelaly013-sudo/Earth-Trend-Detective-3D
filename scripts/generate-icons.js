import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c;
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function createPng(width, height, drawFn) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(rawData);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// Generate circular Earth icon with orbital satellite ring
function drawEarthIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const r = (w / 2) * (isMaskable ? 0.72 : 0.88);
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background for maskable icon
  if (isMaskable && dist > r) {
    return [2, 6, 23, 255]; // deep space dark navy #020617
  }

  // Outer space
  if (dist > r + 3) {
    // Check if on diagonal orbital ellipse ring
    const rotX = dx * 0.866 - dy * 0.5;
    const rotY = dx * 0.5 + dy * 0.866;
    const ellDist = Math.abs(Math.sqrt((rotX * rotX) / (r * 1.35 * (r * 1.35)) + (rotY * rotY) / (r * 0.45 * (r * 0.45))) - 1);
    if (ellDist < 0.05 && dist < r * 1.45) {
      return [6, 182, 212, 220]; // Cyan orbit #06b6d4
    }
    return [0, 0, 0, isMaskable ? 255 : 0];
  }

  // Atmospheric glow rim
  if (dist > r - 4) {
    return [56, 189, 248, 255]; // Bright cyan atmospheric glow
  }

  // Earth interior: 3D sphere gradient
  const nx = dx / r;
  const ny = dy / r;
  const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

  // Light source from top-left (-0.5, -0.5, 0.7)
  const lx = -0.45, ly = -0.45, lz = 0.77;
  const dot = Math.max(0, nx * lx + ny * ly + nz * lz);
  const ambient = 0.22;
  const intensity = Math.min(1.0, ambient + dot * 0.85);

  // Continent / ocean patterns using sinusoidal mock geography
  const lat = Math.asin(ny) * 5;
  const lon = Math.atan2(nx, nz) * 5;
  const continentNoise = Math.sin(lat * 2.2 + lon * 1.8) + Math.cos(lat * 3.1 - lon * 2.4);

  let baseR, baseG, baseB;
  if (continentNoise > 0.15) {
    // Landmass (emerald / golden green)
    baseR = 16;
    baseG = 145;
    baseB = 90;
  } else {
    // Ocean (deep satellite azure blue)
    baseR = 14;
    baseG = 65;
    baseB = 140;
  }

  // Add polar ice caps
  if (Math.abs(ny) > 0.72) {
    baseR = 220;
    baseG = 245;
    baseB = 255;
  }

  return [
    Math.min(255, Math.round(baseR * intensity)),
    Math.min(255, Math.round(baseG * intensity)),
    Math.min(255, Math.round(baseB * intensity)),
    255
  ];
}

const pubDir = path.resolve('public');
fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), createPng(192, 192, (x, y, w, h) => drawEarthIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), createPng(512, 512, (x, y, w, h) => drawEarthIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), createPng(512, 512, (x, y, w, h) => drawEarthIcon(x, y, w, h, true)));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => drawEarthIcon(x, y, w, h, false)));

// Also create high-res SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="spaceBg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
    <radialGradient id="earthGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="45%" stop-color="#0284c7" />
      <stop offset="85%" stop-color="#0369a1" />
      <stop offset="100%" stop-color="#082f49" />
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#spaceBg)" />
  <!-- Atmosphere Outer Glow -->
  <circle cx="256" cy="256" r="172" fill="#06b6d4" opacity="0.25" filter="url(#glow)" />
  <!-- Main Earth Globe -->
  <circle cx="256" cy="256" r="160" fill="url(#earthGrad)" />
  <!-- Continents and Green Biosphere -->
  <path d="M 190 160 Q 220 140, 260 165 T 320 200 T 310 260 T 260 280 T 210 240 Z" fill="#10b981" opacity="0.88" />
  <path d="M 150 250 Q 180 230, 220 270 T 240 340 T 190 380 T 150 320 Z" fill="#059669" opacity="0.85" />
  <path d="M 270 300 Q 330 280, 370 320 T 360 380 T 300 370 Z" fill="#34d399" opacity="0.8" />
  <!-- Polar Ice Cap -->
  <ellipse cx="256" cy="118" rx="80" ry="24" fill="#f8fafc" opacity="0.95" />
  <ellipse cx="256" cy="396" rx="90" ry="22" fill="#f8fafc" opacity="0.95" />
  <!-- Orbital Telemetry Path -->
  <ellipse cx="256" cy="256" rx="220" ry="70" fill="none" stroke="#22d3ee" stroke-width="4" stroke-dasharray="8 6" transform="rotate(-28 256 256)" opacity="0.8" />
  <!-- Satellite Sensor Node -->
  <g transform="translate(410, 160) rotate(-28)">
    <rect x="-14" y="-8" width="28" height="16" rx="3" fill="#e2e8f0" />
    <rect x="-30" y="-5" width="14" height="10" rx="2" fill="#38bdf8" />
    <rect x="16" y="-5" width="14" height="10" rx="2" fill="#38bdf8" />
    <circle cx="0" cy="0" r="3" fill="#ef4444" />
  </g>
</svg>`;

fs.writeFileSync(path.join(pubDir, 'icon.svg'), svgContent);
console.log('Successfully generated all PWA icons (192, 512, maskable, apple-touch, SVG)');
