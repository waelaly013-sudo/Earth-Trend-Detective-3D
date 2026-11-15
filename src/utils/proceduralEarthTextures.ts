/**
 * Procedural Earth Textures Generator
 * Generates 100% self-contained high-detail 2D Canvas textures for Three.js
 * No external image assets or 404 risks.
 */

import * as THREE from 'three';

// Continental anchor points (approximate equirectangular percentages [x, y, radius])
interface LandMass {
  name: string;
  cx: number; // 0..1 (0 = -180 deg, 0.5 = 0 deg, 1 = 180 deg)
  cy: number; // 0..1 (0 = North Pole, 1 = South Pole)
  rx: number;
  ry: number;
  biome: 'temperate' | 'desert' | 'tropical' | 'tundra' | 'ice';
  points?: [number, number][];
}

// What this does: Lists simplified map shapes and climate types (desert, tropical, temperate, tundra) for Earth's major continents.
// On the website: Gives the 3D Earth globe its recognizable land shapes without needing external image downloads.
// Used as: A coordinate map shared by all procedural globe texture painters below.
const CONTINENTS: LandMass[] = [
  // North America
  {
    name: 'North America',
    cx: 0.23,
    cy: 0.32,
    rx: 0.12,
    ry: 0.16,
    biome: 'temperate',
    points: [
      [0.12, 0.22], [0.18, 0.18], [0.25, 0.20], [0.32, 0.25],
      [0.34, 0.36], [0.28, 0.42], [0.24, 0.48], [0.20, 0.44],
      [0.15, 0.38], [0.11, 0.30]
    ]
  },
  // South America
  {
    name: 'South America',
    cx: 0.32,
    cy: 0.65,
    rx: 0.08,
    ry: 0.18,
    biome: 'tropical',
    points: [
      [0.28, 0.52], [0.34, 0.51], [0.39, 0.57], [0.37, 0.68],
      [0.33, 0.82], [0.29, 0.84], [0.27, 0.73], [0.26, 0.58]
    ]
  },
  // Eurasia
  {
    name: 'Eurasia',
    cx: 0.68,
    cy: 0.30,
    rx: 0.22,
    ry: 0.16,
    biome: 'temperate',
    points: [
      [0.48, 0.28], [0.55, 0.22], [0.65, 0.18], [0.82, 0.19],
      [0.91, 0.26], [0.86, 0.39], [0.75, 0.42], [0.68, 0.48],
      [0.58, 0.44], [0.49, 0.40], [0.46, 0.32]
    ]
  },
  // Africa
  {
    name: 'Africa',
    cx: 0.54,
    cy: 0.55,
    rx: 0.09,
    ry: 0.18,
    biome: 'desert',
    points: [
      [0.46, 0.41], [0.57, 0.39], [0.63, 0.47], [0.62, 0.58],
      [0.58, 0.74], [0.52, 0.74], [0.49, 0.62], [0.45, 0.51]
    ]
  },
  // Australia
  {
    name: 'Australia',
    cx: 0.85,
    cy: 0.68,
    rx: 0.07,
    ry: 0.08,
    biome: 'desert',
    points: [
      [0.80, 0.63], [0.87, 0.61], [0.90, 0.67], [0.88, 0.74],
      [0.81, 0.73], [0.78, 0.68]
    ]
  },
  // Greenland
  {
    name: 'Greenland',
    cx: 0.38,
    cy: 0.16,
    rx: 0.05,
    ry: 0.08,
    biome: 'tundra',
    points: [
      [0.35, 0.11], [0.41, 0.12], [0.42, 0.21], [0.37, 0.22], [0.34, 0.17]
    ]
  },
];

// What this does: Paints a flat world map onto an offscreen canvas with deep oceans, seasonal green/snowy continents, and mountain shading for the chosen year and month.
// On the website: Creates the realistic surface skin wrapped around the 3D Earth globe so seasons and land look alive.
// Used as: The main color texture generator for the 3D planet in EarthGlobe.
export function generateEarthTexture(year: number = 2026, month: number = 7): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Deep Ocean Base with authentic bathymetry gradients (abyssal trenches & pelagic basins)
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#020b18');    // Arctic abyss
  oceanGrad.addColorStop(0.18, '#041736'); // North Atlantic / Pacific
  oceanGrad.addColorStop(0.5, '#062048');  // Tropical warm deep ocean
  oceanGrad.addColorStop(0.82, '#041736'); // Southern Ocean
  oceanGrad.addColorStop(1, '#020b18');    // Antarctic abyss
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Draw Continents with organic borders, biomes, and seasonal vegetation flush
  // Summer flush in Northern Hemisphere (June-Aug): greener taiga/tundra
  // Winter snow cover in Northern Hemisphere (Dec-Feb): snow blanket over high latitudes
  const isBorealSummer = month >= 5 && month <= 9;
  const isBorealWinter = month === 12 || month <= 2;

  CONTINENTS.forEach(c => {
    ctx.save();
    if (c.points && c.points.length > 2) {
      ctx.beginPath();
      const first = c.points[0];
      ctx.moveTo(first[0] * width, first[1] * height);

      // Curve through points for natural organic coastlines
      for (let i = 1; i < c.points.length; i++) {
        const pt = c.points[i];
        const prev = c.points[i - 1];
        const midX = ((prev[0] + pt[0]) / 2) * width;
        const midY = ((prev[1] + pt[1]) / 2) * height;
        ctx.quadraticCurveTo(prev[0] * width, prev[1] * height, midX, midY);
      }
      ctx.closePath();

      // Biome Colors with Seasonal Phenology
      let landGrad = ctx.createRadialGradient(
        c.cx * width, c.cy * height, 20,
        c.cx * width, c.cy * height, Math.max(c.rx * width, c.ry * height)
      );

      if (c.biome === 'tropical') {
        landGrad.addColorStop(0, '#164e24'); // Dense equatorial rainforest (Amazon, Congo)
        landGrad.addColorStop(0.55, '#226330');
        landGrad.addColorStop(1, '#1b5028');
      } else if (c.biome === 'desert') {
        landGrad.addColorStop(0, '#b88944'); // Sahara & Arabian desert ochre sand
        landGrad.addColorStop(0.55, '#c59a53');
        landGrad.addColorStop(0.85, '#6a783d'); // Sahel transitional savanna
        landGrad.addColorStop(1, '#475a30');
      } else if (c.biome === 'tundra') {
        if (isBorealSummer) {
          landGrad.addColorStop(0, '#6d866a'); // Summer sub-arctic moss & lichen
          landGrad.addColorStop(1, '#4f6655');
        } else {
          landGrad.addColorStop(0, '#dbe7ee'); // Winter snow blanket
          landGrad.addColorStop(1, '#8ea2aa');
        }
      } else {
        // Temperate
        if (isBorealSummer) {
          landGrad.addColorStop(0, '#2e632d'); // Summer lush green taiga/forests
          landGrad.addColorStop(0.5, '#457936');
          landGrad.addColorStop(0.78, '#5e563a'); // Mountain ranges
          landGrad.addColorStop(1, '#274f26');
        } else if (isBorealWinter) {
          landGrad.addColorStop(0, '#5a7868'); // Winter dormant forests with frost
          landGrad.addColorStop(0.5, '#788f82');
          landGrad.addColorStop(0.8, '#a2b4b8'); // Snow-capped highlands
          landGrad.addColorStop(1, '#445f4e');
        } else {
          landGrad.addColorStop(0, '#365b35');
          landGrad.addColorStop(0.5, '#4e6d3a');
          landGrad.addColorStop(0.8, '#5b5437');
          landGrad.addColorStop(1, '#2c4b2a');
        }
      }

      ctx.fillStyle = landGrad;
      ctx.fill();

      // Coastline natural edge trim
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = 'rgba(78, 142, 112, 0.65)';
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(c.cx * width, c.cy * height, c.rx * width, c.ry * height, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#2d5a37';
      ctx.fill();
    }
    ctx.restore();
  });

  // Additional major islands & archipelagos
  const islands = [
    { x: 0.88, y: 0.37, r: 12 }, // Japan
    { x: 0.48, y: 0.28, r: 10 }, // UK & Ireland
    { x: 0.62, y: 0.68, r: 9 },  // Madagascar
    { x: 0.80, y: 0.54, r: 14 }, // Indonesia (Sumatra/Java)
    { x: 0.77, y: 0.51, r: 12 }, // Malaysia/Borneo
    { x: 0.84, y: 0.53, r: 11 }, // New Guinea
    { x: 0.92, y: 0.78, r: 8 },  // New Zealand
    { x: 0.44, y: 0.18, r: 7 },  // Iceland
    { x: 0.84, y: 0.42, r: 7 },  // Philippines
  ];
  ctx.fillStyle = '#3a623e';
  islands.forEach(isl => {
    ctx.beginPath();
    ctx.arc(isl.x * width, isl.y * height, isl.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. SCIENTIFIC CRYOSPHERE BREATHING & DECADAL MELT (2000 - 2040)
  // Physical parameters:
  // Decadal progress: 0.0 in 2000, 0.65 in 2026, 1.0 in 2040
  const progress = Math.max(0, Math.min(1, (year - 2000) / 40));
  const acceleration = year > 2026 ? 1.0 + (year - 2026) * 0.055 : 1.0;
  const decadalIceLoss = Math.min(0.68, progress * 0.46 * acceleration);

  // 4. Subtle mountain relief shading (Himalayas, Andes, Rockies, Alps)
  ctx.fillStyle = 'rgba(170, 150, 125, 0.55)';
  // Himalayas & Tibetan Plateau
  ctx.beginPath();
  ctx.ellipse(0.73 * width, 0.38 * height, 44, 16, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Andes Cordillera
  ctx.beginPath();
  ctx.ellipse(0.28 * width, 0.68 * height, 12, 95, 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Rocky Mountains
  ctx.beginPath();
  ctx.ellipse(0.18 * width, 0.32 * height, 15, 72, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // European Alps
  ctx.beginPath();
  ctx.ellipse(0.53 * width, 0.32 * height, 18, 9, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Create Three.js Texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// What this does: Draws a black-and-white shininess map where oceans are dark (shiny water), land is bright (matte soil), and ice caps are medium grey.
// On the website: Makes sunlight bounce realistically off the oceans while keeping forests and deserts flat and non-shiny.
// Used as: The roughness/specular texture mask for the 3D Earth material.
export function generateOceanSpecularMask(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Oceans: Smooth dark grey = low roughness, high specular reflectivity
  ctx.fillStyle = '#282828'; // roughness ~ 0.16
  ctx.fillRect(0, 0, width, height);

  // Continental shelves: slightly higher roughness
  ctx.fillStyle = '#484848';
  CONTINENTS.forEach(c => {
    ctx.beginPath();
    ctx.ellipse(c.cx * width, c.cy * height, (c.rx + 0.02) * width, (c.ry + 0.02) * height, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // 2. Continents: Bright = high roughness, diffuse matte reflection
  CONTINENTS.forEach(c => {
    ctx.save();
    if (c.points && c.points.length > 2) {
      ctx.beginPath();
      const first = c.points[0];
      ctx.moveTo(first[0] * width, first[1] * height);
      for (let i = 1; i < c.points.length; i++) {
        const pt = c.points[i];
        const prev = c.points[i - 1];
        const midX = ((prev[0] + pt[0]) / 2) * width;
        const midY = ((prev[1] + pt[1]) / 2) * height;
        ctx.quadraticCurveTo(prev[0] * width, prev[1] * height, midX, midY);
      }
      ctx.closePath();
      ctx.fillStyle = '#e8e8e8'; // roughness ~ 0.91
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(c.cx * width, c.cy * height, c.rx * width, c.ry * height, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#e8e8e8';
      ctx.fill();
    }
    ctx.restore();
  });

  // 3. Polar Ice Caps: Medium roughness (snow and ice glint)
  ctx.fillStyle = '#7a7a7a'; // roughness ~ 0.48
  ctx.fillRect(0, 0, width, 0.09 * height); // Arctic
  ctx.fillRect(0, height - 0.14 * height, width, 0.14 * height); // Antarctic

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// What this does: Paints soft white swirling cloud bands and storm spirals onto a clear transparent canvas.
// On the website: Adds the drifting white cloud layer floating slightly above the 3D Earth.
// Used as: The cloud sphere texture in EarthGlobe.
export function generateCloudTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, width, height);

  // Draw tropical convergence zone (equatorial cloud band) and temperate storms
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';

  // Swirling bands across mid latitudes
  for (let i = 0; i < 90; i++) {
    const cx = Math.random() * width;
    const cy = height * (0.2 + Math.random() * 0.6);
    const rx = 40 + Math.random() * 90;
    const ry = 8 + Math.random() * 25;
    const rot = (Math.random() - 0.5) * 0.4;
    const alpha = 0.15 + Math.random() * 0.35;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
    ctx.restore();
  }

  // Tropical cyclonic vortices
  const cyclones = [
    { x: 0.25 * width, y: 0.38 * height, r: 42 },
    { x: 0.78 * width, y: 0.32 * height, r: 50 },
    { x: 0.84 * width, y: 0.66 * height, r: 38 },
  ];
  cyclones.forEach(cyc => {
    ctx.save();
    const grad = ctx.createRadialGradient(cyc.x, cyc.y, 4, cyc.x, cyc.y, cyc.r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.5, 'rgba(240, 245, 255, 0.4)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cyc.x, cyc.y, cyc.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// What this does: Places clusters of warm golden glowing dots over major populated regions like Europe, North America, India, and East Asia.
// On the website: Lights up city clusters on the dark night side of the 3D globe.
// Used as: The city-lights night texture in EarthGlobe.
export function generateNightLightsTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, width, height);

  // City cluster centers [xRatio, yRatio, intensity, radius]
  const clusters = [
    // US East Coast & Midwest
    [0.26, 0.35, 0.9, 25],
    [0.21, 0.36, 0.8, 18],
    [0.16, 0.34, 0.85, 20], // US West Coast
    // Europe
    [0.52, 0.28, 0.95, 30],
    [0.48, 0.29, 0.9, 22],
    // East Asia (China coast, Japan, Korea)
    [0.82, 0.36, 0.95, 32],
    [0.88, 0.36, 0.9, 18],
    // India
    [0.72, 0.44, 0.9, 28],
    // Nile & Middle East
    [0.56, 0.40, 0.75, 16],
    [0.61, 0.42, 0.8, 20],
    // South America (Sao Paulo/Rio)
    [0.35, 0.72, 0.8, 18],
    [0.32, 0.76, 0.7, 15],
    // Australia Coast
    [0.88, 0.72, 0.7, 16],
  ];

  clusters.forEach(([cx, cy, intensity, rad]) => {
    const x = cx * width;
    const y = cy * height;
    const count = Math.floor(rad * 4);
    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * rad * 2;
      const offsetY = (Math.random() - 0.5) * rad * 1.5;
      const dotRad = 0.5 + Math.random() * 1.8;
      const glow = ctx.createRadialGradient(x + offsetX, y + offsetY, 0, x + offsetX, y + offsetY, dotRad * 2);
      glow.addColorStop(0, `rgba(255, 235, 170, ${intensity})`);
      glow.addColorStop(0.5, `rgba(240, 180, 80, ${intensity * 0.6})`);
      glow.addColorStop(1, 'rgba(255, 160, 40, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x + offsetX, y + offsetY, dotRad * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// What this does: Draws a greyscale height map raising continents slightly and lifting major mountain chains like the Himalayas, Andes, and Rockies.
// On the website: Gives the 3D globe subtle 3D terrain bumps and shadows when light hits mountains.
// Used as: The surface bump map texture on the Earth mesh.
export function generateBumpMap(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Continental landmass base relief
  ctx.fillStyle = '#222222';
  CONTINENTS.forEach(c => {
    ctx.beginPath();
    ctx.ellipse(c.cx * width, c.cy * height, c.rx * width, c.ry * height, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Major Mountain Ridges
  ctx.fillStyle = '#999999';
  // Himalayas
  ctx.beginPath();
  ctx.ellipse(0.73 * width, 0.38 * height, 42, 16, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Andes
  ctx.beginPath();
  ctx.ellipse(0.28 * width, 0.68 * height, 12, 95, 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Rockies
  ctx.beginPath();
  ctx.ellipse(0.18 * width, 0.32 * height, 15, 70, -0.2, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// What this does: Paints glowing yellow, orange, and crimson heat hotspots across the Arctic and continents that grow stronger as the year goes up from 2000 to 2040.
// On the website: Shows the warm heat-map overlay on the globe when the user moves the timeline or turns on the thermal view.
// Used as: The dynamic year-reactive heat overlay texture in EarthGlobe.
export function generateTemperatureHeatmapTexture(year: number): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, width, height);

  // Global mean anomaly progression: 2000: 0.65°C, 2026: 1.38°C, 2040: 2.18°C
  const progress = Math.max(0, Math.min(1, (year - 2000) / 40));
  const globalAnomaly = 0.65 + progress * (year > 2026 ? 1.58 : 1.15);
  // Intensity multiplier: 0.25 in 2000, 0.65 in 2026, 1.0 in 2040
  const alphaScale = 0.25 + progress * 0.75;

  // 1. High Latitude Arctic Amplification Band (Top of Globe)
  const arcticAnomaly = globalAnomaly * 2.6; // Reaches +4.5°C to +5.5°C by 2040
  const arcticGrad = ctx.createLinearGradient(0, 0, 0, height * 0.24);
  if (arcticAnomaly > 3.5) {
    // Extreme crimson/magenta glow in 2035-2040
    arcticGrad.addColorStop(0, `rgba(225, 29, 72, ${0.75 * alphaScale})`);
    arcticGrad.addColorStop(0.5, `rgba(249, 115, 22, ${0.6 * alphaScale})`);
    arcticGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
  } else {
    // Orange/amber glow
    arcticGrad.addColorStop(0, `rgba(239, 68, 68, ${0.6 * alphaScale})`);
    arcticGrad.addColorStop(0.6, `rgba(245, 158, 11, ${0.45 * alphaScale})`);
    arcticGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
  }
  ctx.fillStyle = arcticGrad;
  ctx.fillRect(0, 0, width, height * 0.24);

  // 2. Continental Warming Hotspots
  // [cx, cy, rx, ry, relativeMultiplier]
  const heatNodes = [
    // Europe & Mediterranean (+1.6°C to +2.8°C)
    { cx: 0.52, cy: 0.32, rx: 90, ry: 55, mult: 1.6 },
    // North America (+1.4°C to +2.5°C)
    { cx: 0.23, cy: 0.35, rx: 110, ry: 70, mult: 1.5 },
    // Siberia & Northern Asia (+2.2°C to +4.0°C)
    { cx: 0.72, cy: 0.26, rx: 140, ry: 65, mult: 2.1 },
    // Sahara & Middle East (+1.7°C to +3.1°C)
    { cx: 0.56, cy: 0.44, rx: 110, ry: 60, mult: 1.65 },
    // Amazon Basin (+1.3°C to +2.4°C)
    { cx: 0.33, cy: 0.62, rx: 80, ry: 65, mult: 1.4 },
    // South Asia & India (+1.3°C to +2.3°C)
    { cx: 0.72, cy: 0.45, rx: 70, ry: 50, mult: 1.35 },
    // Australia Interior (+1.5°C to +2.7°C)
    { cx: 0.84, cy: 0.70, rx: 75, ry: 45, mult: 1.5 },
    // Antarctic Peninsula & Amundsen Sea (+2.0°C to +3.6°C)
    { cx: 0.30, cy: 0.88, rx: 65, ry: 40, mult: 1.9 },
  ];

  heatNodes.forEach(({ cx, cy, rx, ry, mult }) => {
    const x = cx * width;
    const y = cy * height;
    const localAnomaly = globalAnomaly * mult;
    const grad = ctx.createRadialGradient(x, y, 5, x, y, Math.max(rx, ry));

    if (localAnomaly > 3.0) {
      grad.addColorStop(0, `rgba(225, 29, 72, ${0.7 * alphaScale})`); // Deep crimson (+3°C+)
      grad.addColorStop(0.4, `rgba(249, 115, 22, ${0.5 * alphaScale})`); // Orange
      grad.addColorStop(0.8, `rgba(234, 179, 8, ${0.3 * alphaScale})`); // Yellow
      grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
    } else if (localAnomaly > 1.8) {
      grad.addColorStop(0, `rgba(249, 115, 22, ${0.6 * alphaScale})`); // Orange (+1.8°C+)
      grad.addColorStop(0.5, `rgba(234, 179, 8, ${0.4 * alphaScale})`); // Yellow
      grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
    } else {
      grad.addColorStop(0, `rgba(234, 179, 8, ${0.45 * alphaScale})`); // Amber/Yellow
      grad.addColorStop(0.6, `rgba(250, 204, 21, ${0.25 * alphaScale})`);
      grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// What this does: Draws an elevation and ocean-depth map showing coastal shelves, green lowlands, brown highlands, white mountain peaks, polar ice, and optional latitude/longitude lines.
// On the website: Displays the Topographic Relief globe style when the user switches Earth layers.
// Used as: The terrain/elevation skin generator for the Topographic globe mode.
export function generateTopographicTexture(year: number = 2026, showGraticule: boolean = true): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Bathymetric Ocean Depth Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#051b3a');   // Arctic deep trench
  oceanGrad.addColorStop(0.25, '#092750');
  oceanGrad.addColorStop(0.5, '#0d3263');  // Equatorial ocean basin
  oceanGrad.addColorStop(0.75, '#092750');
  oceanGrad.addColorStop(1, '#051b3a');   // Antarctic deep
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Continental Shelf Bathymetric Contours (0 to -200m depth)
  ctx.fillStyle = 'rgba(19, 91, 126, 0.55)';
  CONTINENTS.forEach((c) => {
    ctx.beginPath();
    ctx.ellipse(c.cx * width, c.cy * height, (c.rx + 0.04) * width, (c.ry + 0.04) * height, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Intermediate Shelf (-1000m contour)
  ctx.fillStyle = 'rgba(29, 122, 160, 0.4)';
  CONTINENTS.forEach((c) => {
    ctx.beginPath();
    ctx.ellipse(c.cx * width, c.cy * height, (c.rx + 0.02) * width, (c.ry + 0.02) * height, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. Draw Continents with Hypsometric Elevation Layers
  CONTINENTS.forEach((c) => {
    ctx.save();
    if (c.points && c.points.length > 2) {
      // Base elevation: Lowlands (0 - 200m) -> Emerald/Sage Green
      ctx.beginPath();
      const first = c.points[0];
      ctx.moveTo(first[0] * width, first[1] * height);
      for (let i = 1; i < c.points.length; i++) {
        const pt = c.points[i];
        const prev = c.points[i - 1];
        const midX = ((prev[0] + pt[0]) / 2) * width;
        const midY = ((prev[1] + pt[1]) / 2) * height;
        ctx.quadraticCurveTo(prev[0] * width, prev[1] * height, midX, midY);
      }
      ctx.closePath();

      // Hypsometric gradient from coast green to highland ochre
      const topoGrad = ctx.createRadialGradient(
        c.cx * width,
        c.cy * height,
        15,
        c.cx * width,
        c.cy * height,
        Math.max(c.rx * width, c.ry * height)
      );

      topoGrad.addColorStop(0, '#be9548'); // 1000m+ plateau amber
      topoGrad.addColorStop(0.35, '#879e4d'); // 500m upland olive
      topoGrad.addColorStop(0.75, '#407b46'); // 200m lowland emerald
      topoGrad.addColorStop(1, '#255e34'); // Sea level coastal green

      ctx.fillStyle = topoGrad;
      ctx.fill();

      // Sharp topographic coastline contour
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = '#103920';
      ctx.stroke();

      // Interior plateau elevation contour (inner concentric ring)
      ctx.beginPath();
      ctx.ellipse(c.cx * width, c.cy * height, c.rx * 0.65 * width, c.ry * 0.65 * height, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(195, 154, 76, 0.45)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(145, 110, 45, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // High mountain spine relief (brown & terracotta)
      ctx.beginPath();
      ctx.ellipse(c.cx * width, c.cy * height, c.rx * 0.35 * width, c.ry * 0.35 * height, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(128, 76, 45, 0.65)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(94, 50, 25, 0.8)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }
    ctx.restore();
  });

  // 4. Prominent Mountain Ranges Relief & Shading (Alps, Himalayas, Andes, Rockies)
  const mountainChains = [
    // Himalayas (8848m Everest ridge - snow white over terracotta)
    { x: 0.73 * width, y: 0.38 * height, rx: 55, ry: 18, rot: -0.2, peakColor: '#ffffff' },
    // Andes (6961m Aconcagua)
    { x: 0.28 * width, y: 0.68 * height, rx: 14, ry: 110, rot: 0.15, peakColor: '#ffffff' },
    // Rockies & Coast Ranges
    { x: 0.18 * width, y: 0.32 * height, rx: 18, ry: 85, rot: -0.2, peakColor: '#ffffff' },
    // European Alps
    { x: 0.51 * width, y: 0.30 * height, rx: 22, ry: 12, rot: 0.1, peakColor: '#ffffff' },
    // East African Rift
    { x: 0.58 * width, y: 0.58 * height, rx: 14, ry: 45, rot: 0.25, peakColor: '#e0c8a0' },
  ];

  mountainChains.forEach((m) => {
    ctx.save();
    // Shaded mountain slope
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.rx, m.ry, m.rot, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(110, 60, 32, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(70, 35, 15, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Snow-capped alpine ridges
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.rx * 0.5, m.ry * 0.45, m.rot, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fill();
    ctx.restore();
  });

  // 5. Dynamic Polar Ice Sheets (responsive to timeline year)
  const progress = (year - 2000) / 40;
  const acceleration = year > 2026 ? 1.0 + (year - 2026) * 0.05 : 1.0;
  const iceShrink = Math.min(0.65, progress * 0.45 * acceleration);

  // Arctic Cap
  const arcticIceHeight = Math.max(28, (0.12 - iceShrink * 0.08) * height);
  const northIceGrad = ctx.createLinearGradient(0, 0, 0, arcticIceHeight);
  northIceGrad.addColorStop(0, 'rgba(240, 248, 255, 0.98)');
  northIceGrad.addColorStop(0.7, 'rgba(210, 235, 250, 0.85)');
  northIceGrad.addColorStop(1, 'rgba(160, 210, 245, 0.0)');
  ctx.fillStyle = northIceGrad;
  ctx.fillRect(0, 0, width, arcticIceHeight);

  // Antarctic Sheet
  const antarcticIceHeight = Math.max(55, (0.18 - iceShrink * 0.06) * height);
  const southIceGrad = ctx.createLinearGradient(0, height, 0, height - antarcticIceHeight);
  southIceGrad.addColorStop(0, 'rgba(245, 250, 255, 0.99)');
  southIceGrad.addColorStop(0.7, 'rgba(220, 240, 255, 0.9)');
  southIceGrad.addColorStop(1, 'rgba(180, 220, 245, 0.0)');
  ctx.fillStyle = southIceGrad;
  ctx.fillRect(0, height - antarcticIceHeight, width, antarcticIceHeight);

  // 6. Geodetic Graticule Lines (Parallels every 15°, Meridians every 30°)
  if (showGraticule) {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)'; // Subtle cyan scientific graticule
    ctx.lineWidth = 1.0;

    // Parallels (Latitude)
    for (let latDeg = -75; latDeg <= 75; latDeg += 15) {
      const y = ((90 - latDeg) / 180) * height;
      ctx.beginPath();
      // Equator is slightly more defined
      if (latDeg === 0) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.5;
      } else if (Math.abs(latDeg) === 23.5) {
        // Tropics of Cancer & Capricorn
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.lineWidth = 1.0;
      } else {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.lineWidth = 0.8;
      }
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Meridians (Longitude)
    for (let lngDeg = -180; lngDeg <= 180; lngDeg += 30) {
      const x = ((lngDeg + 180) / 360) * width;
      ctx.beginPath();
      if (lngDeg === 0) {
        // Prime Meridian
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.lineWidth = 0.8;
      }
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// What this does: Paints a high-tech false-color radar map with dark violet oceans, neon pink/cyan continents, and horizontal scan lines.
// On the website: Shows the Thermal / Radar Satellite view when the user chooses that globe layer.
// Used as: The false-color radar texture generator for the Thermal Radar globe mode.
export function generateThermalRadarTexture(year: number = 2026): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Dark deep violet oceanic background (reflects low radar backscatter over open calm water)
  ctx.fillStyle = '#060417';
  ctx.fillRect(0, 0, width, height);

  // Oceanic thermal currents
  for (let i = 0; i < 40; i++) {
    const y = (0.2 + Math.random() * 0.6) * height;
    ctx.beginPath();
    ctx.ellipse(Math.random() * width, y, 90 + Math.random() * 120, 15 + Math.random() * 25, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(79, 70, 229, 0.15)';
    ctx.fill();
  }

  // High-intensity radar reflectance over continents (cyan, magenta, electric amber)
  CONTINENTS.forEach((c) => {
    ctx.save();
    if (c.points && c.points.length > 2) {
      ctx.beginPath();
      const first = c.points[0];
      ctx.moveTo(first[0] * width, first[1] * height);
      for (let i = 1; i < c.points.length; i++) {
        const pt = c.points[i];
        const prev = c.points[i - 1];
        const midX = ((prev[0] + pt[0]) / 2) * width;
        const midY = ((prev[1] + pt[1]) / 2) * height;
        ctx.quadraticCurveTo(prev[0] * width, prev[1] * height, midX, midY);
      }
      ctx.closePath();

      const radarGrad = ctx.createRadialGradient(
        c.cx * width,
        c.cy * height,
        10,
        c.cx * width,
        c.cy * height,
        Math.max(c.rx * width, c.ry * height)
      );

      radarGrad.addColorStop(0, '#f43f5e'); // High thermal emission (rose red)
      radarGrad.addColorStop(0.4, '#d946ef'); // Synthetic radar scattering (magenta)
      radarGrad.addColorStop(0.75, '#06b6d4'); // Medium dielectric moisture (cyan)
      radarGrad.addColorStop(1, '#0284c7'); // Lowland shoreline (blue)

      ctx.fillStyle = radarGrad;
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();
    }
    ctx.restore();
  });

  // Digital telemetry scan grid
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
  ctx.lineWidth = 0.8;
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}


