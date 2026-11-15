/**
 * 3D Earth Globe Component
 * Built with Three.js according to AI Studio 3D Directives
 * 
 * Features:
 * 1. Realistic 3D Hologram Earth (scanlines, telemetry matrix, Fresnel edge emission).
 * 2. Zero-Lag Timeline Scrubbing (GLSL GPU shader uniforms, 0ms latency).
 * 3. 3-Second High-Speed Revolving Animation on Year Change.
 * 4. Adjusted specular shine (balanced realistic finish).
 * 5. Localized Heat Thermal Wave Ripples & Shimmer on the user's chosen location.
 * 6. Inverse Spherical coordinates raycasting (click anywhere on Earth).
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { ClimateRegion, GlobeLayers, ActiveInspectorItem, DataBranch } from '../types/climate';
import { getGlobalMeanAnomaly, getGlobalMonthlyAnomaly } from '../data/countriesData';
import {
  generateCloudTexture,
  generateNightLightsTexture,
} from '../utils/proceduralEarthTextures';
import { soundFx } from '../utils/audioSynth';

interface EarthGlobeProps {
  regions: ClimateRegion[];
  selectedLocation: ActiveInspectorItem | null;
  onSelectRegion: (region: ClimateRegion) => void;
  onSelectCoordinates?: (lat: number, lng: number) => void;
  year: number;
  month?: number;
  isAiPrediction: boolean;
  layers: GlobeLayers;
  visibleHotspotIds?: Record<string, boolean>;
  autoRotate: boolean;
  rotationSpeed: number;
  onWarpStateChange?: (isWarping: boolean) => void;
  isPlayingTimeline?: boolean;
  dataBranch?: DataBranch;
}

// What this does: Turns a real-world latitude and longitude into an (X, Y, Z) point on the 3D Earth sphere.
// On the website: Places country pins, heat ripples, beacons, and rocket targets at the exact right spot on the spinning globe.
// Used as: The core geographic-to-3D coordinate converter.
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// What this does: Converts a 3D point where the user clicked on the globe back into real-world latitude and longitude.
// On the website: Lets the user click anywhere on Earth (even oceans or unlisted towns) and see that exact spot's climate data.
// Used as: The reverse coordinate converter for globe clicks.
export function vector3ToLatLng(point: THREE.Vector3): { lat: number; lng: number } {
  const norm = point.clone().normalize();
  const lat = Math.asin(norm.y) * (180 / Math.PI);
  let lng = Math.atan2(norm.z, -norm.x) * (180 / Math.PI) - 180;
  while (lng < -180) lng += 360;
  while (lng > 180) lng -= 360;
  return { lat, lng };
}

// What this does: Turns the active climate topic (temperature, humidity, or wind) into a number code for the GPU shader.
// On the website: Tells the 3D planet's heat-map layer which color palette to paint (orange for heat, cyan for moisture, teal for wind).
// Used as: A helper bridging React state and WebGL shaders.
export function getBranchTypeCode(branch?: DataBranch): number {
  switch (branch) {
    case 'temperature': return 0.0;
    case 'humidity': return 1.0;
    case 'wind': return 2.0;
    default: return 0.0;
  }
}

// What this does: Picks the matching glowing color hex code for temperature, humidity, or wind.
// On the website: Changes the soft atmospheric halo and hologram grid glow around the Earth when you switch climate branches.
// Used as: A branch theme color lookup for 3D materials.
export function getBranchGlowHex(branch?: DataBranch): number {
  switch (branch) {
    case 'temperature': return 0xf59e0b;
    case 'humidity': return 0x06b6d4;
    case 'wind': return 0x14b8a6;
    default: return 0xf59e0b;
  }
}

// What this does: Custom GPU shader that draws subtle moving scanlines, a latitude/longitude grid, and an outer rim glow over the Earth.
// On the website: Gives the 3D planet its futuristic NASA hologram scan effect.
// Used as: The shader code for the outer hologram shell mesh.
const HologramShellShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float u_time;
    uniform float u_scanlineIntensity;
    uniform vec3 u_holoColor;

    void main() {
      // Gentle Holographic Scanlines
      float scanlines = sin(vUv.y * 420.0 - u_time * 2.5) * 0.5 + 0.5;
      scanlines = pow(scanlines, 2.5);

      // Fine Telemetry Matrix Grid lines (every 10 degrees lat/lng)
      float gridX = step(0.985, fract(vUv.x * 36.0));
      float gridY = step(0.985, fract(vUv.y * 18.0));
      float grid = max(gridX, gridY);

      // Delicate Fresnel Rim Glow
      vec3 viewDir = normalize(-vPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.6);

      vec3 color = u_holoColor + vec3(0.1, 0.35, 0.55) * scanlines;
      float alpha = (fresnel * 0.42 + scanlines * 0.04 + grid * 0.12) * u_scanlineIntensity;

      gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.65));
    }
  `,
};

// What this does: Custom GPU shader that paints real-time colored climate heatmaps directly on the graphics card with zero lag when scrubbing years.
// On the website: Shows global warming hotspots, humidity patterns, or wind speeds glowing smoothly across the 3D Earth.
// Used as: The zero-lag heatmap shader material for the Earth overlay sphere.
const GlobalTemperatureHeatmapShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float u_time;
    uniform float u_globalAnomaly;
    uniform float u_month;
    uniform float u_intensity;
    uniform float u_isHumidity;
    uniform float u_branchType;

    // Atmospheric Moisture / Humidity (MERRA-2)
    vec3 getHumidityAnomalyColor(float anom) {
      vec3 colExtremeDry = vec3(0.85, 0.42, 0.12);
      vec3 colModerateDry = vec3(0.24, 0.48, 0.64);
      vec3 colNeutralMoist = vec3(0.06, 0.52, 0.78);
      vec3 colMoistCyan = vec3(0.06, 0.78, 0.95);
      vec3 colSuperMoist = vec3(0.08, 0.95, 0.65);

      if (anom <= 1.0) {
        float t = clamp(anom / 1.0, 0.0, 1.0);
        return mix(colExtremeDry, colModerateDry, t);
      } else if (anom <= 2.2) {
        float t = (anom - 1.0) / 1.2;
        return mix(colModerateDry, colMoistCyan, t);
      } else {
        float t = clamp((anom - 2.2) / 2.5, 0.0, 1.0);
        return mix(colMoistCyan, colSuperMoist, t);
      }
    }

    // Wind Speed Kinetic Color Ramp (MERRA-2)
    vec3 getWindSpeedColor(float anom) {
      vec3 colCalm = vec3(0.08, 0.45, 0.52);
      vec3 colBreeze = vec3(0.06, 0.72, 0.65);
      vec3 colFresh = vec3(0.05, 0.85, 0.50);
      vec3 colGale = vec3(0.20, 0.75, 0.95);
      vec3 colStorm = vec3(0.55, 0.35, 0.95);
      vec3 colHurricane = vec3(0.85, 0.20, 0.90);

      float t = clamp((anom + 0.5) / 3.5, 0.0, 1.0);
      if (t < 0.25) return mix(colCalm, colBreeze, t / 0.25);
      if (t < 0.50) return mix(colBreeze, colFresh, (t - 0.25) / 0.25);
      if (t < 0.75) return mix(colFresh, colGale, (t - 0.50) / 0.25);
      if (t < 0.90) return mix(colGale, colStorm, (t - 0.75) / 0.15);
      return mix(colStorm, colHurricane, (t - 0.90) / 0.10);
    }

    // Precipitation Hydrologic Color Ramp (GPM IMERG)
    vec3 getPrecipitationColor(float anom) {
      vec3 colDry = vec3(0.92, 0.78, 0.45);
      vec3 colLight = vec3(0.15, 0.65, 0.88);
      vec3 colMod = vec3(0.05, 0.48, 0.92);
      vec3 colHeavy = vec3(0.08, 0.22, 0.75);
      vec3 colExtreme = vec3(0.35, 0.12, 0.68);
      float t = clamp((anom + 1.0) / 4.0, 0.0, 1.0);
      if (t < 0.3) return mix(colDry, colLight, t / 0.3);
      if (t < 0.6) return mix(colLight, colMod, (t - 0.3) / 0.3);
      if (t < 0.85) return mix(colMod, colHeavy, (t - 0.6) / 0.25);
      return mix(colHeavy, colExtreme, (t - 0.85) / 0.15);
    }

    // Vegetation Greenness NDVI (MODIS)
    vec3 getVegetationColor(float anom) {
      vec3 colBarren = vec3(0.88, 0.76, 0.52);
      vec3 colSparse = vec3(0.68, 0.82, 0.42);
      vec3 colModerate = vec3(0.28, 0.78, 0.38);
      vec3 colDense = vec3(0.06, 0.62, 0.24);
      vec3 colLush = vec3(0.02, 0.45, 0.18);
      float t = clamp((anom + 0.5) / 3.0, 0.0, 1.0);
      if (t < 0.25) return mix(colBarren, colSparse, t / 0.25);
      if (t < 0.55) return mix(colSparse, colModerate, (t - 0.25) / 0.3);
      if (t < 0.8) return mix(colModerate, colDense, (t - 0.55) / 0.25);
      return mix(colDense, colLush, (t - 0.8) / 0.2);
    }

    // Aerosol Optical Depth AOD (MODIS, MERRA-2)
    vec3 getAerosolColor(float anom) {
      vec3 colPristine = vec3(0.18, 0.58, 0.88);
      vec3 colModerate = vec3(0.92, 0.72, 0.22);
      vec3 colDust = vec3(0.92, 0.45, 0.12);
      vec3 colSmog = vec3(0.72, 0.18, 0.08);
      float t = clamp((anom + 0.5) / 3.2, 0.0, 1.0);
      if (t < 0.35) return mix(colPristine, colModerate, t / 0.35);
      if (t < 0.7) return mix(colModerate, colDust, (t - 0.35) / 0.35);
      return mix(colDust, colSmog, (t - 0.7) / 0.3);
    }

    // Nitrogen Dioxide NO2 Air Pollution (OMI)
    vec3 getNO2Color(float anom) {
      vec3 colClean = vec3(0.12, 0.65, 0.85);
      vec3 colModerate = vec3(0.95, 0.65, 0.15);
      vec3 colPolluted = vec3(0.92, 0.18, 0.25);
      vec3 colExtreme = vec3(0.78, 0.05, 0.62);
      float t = clamp((anom + 0.5) / 3.5, 0.0, 1.0);
      if (t < 0.3) return mix(colClean, colModerate, t / 0.3);
      if (t < 0.7) return mix(colModerate, colPolluted, (t - 0.3) / 0.4);
      return mix(colPolluted, colExtreme, (t - 0.7) / 0.3);
    }

    // Stratospheric Ozone Column (OMI)
    vec3 getOzoneColor(float anom) {
      vec3 colHole = vec3(0.22, 0.08, 0.58);
      vec3 colLow = vec3(0.12, 0.32, 0.85);
      vec3 colNormal = vec3(0.25, 0.65, 0.95);
      vec3 colRich = vec3(0.48, 0.32, 0.88);
      float t = clamp((anom + 1.0) / 3.5, 0.0, 1.0);
      if (t < 0.3) return mix(colHole, colLow, t / 0.3);
      if (t < 0.7) return mix(colLow, colNormal, (t - 0.3) / 0.4);
      return mix(colNormal, colRich, (t - 0.7) / 0.3);
    }

    // Soil Moisture & Runoff (GLDAS)
    vec3 getSoilMoistureColor(float anom) {
      vec3 colArid = vec3(0.85, 0.52, 0.18);
      vec3 colDry = vec3(0.75, 0.72, 0.35);
      vec3 colMoist = vec3(0.25, 0.75, 0.45);
      vec3 colSaturated = vec3(0.08, 0.58, 0.72);
      float t = clamp((anom + 1.0) / 3.5, 0.0, 1.0);
      if (t < 0.3) return mix(colArid, colDry, t / 0.3);
      if (t < 0.7) return mix(colDry, colMoist, (t - 0.3) / 0.4);
      return mix(colMoist, colSaturated, (t - 0.7) / 0.3);
    }

    // Standard Temperature / Skin Temp Anomaly (-1.5°C to +6.5°C)
    vec3 getAnomalyColor(float anom) {
      vec3 colColdDeep = vec3(0.06, 0.32, 0.92);
      vec3 colColdGlacial = vec3(0.18, 0.74, 0.98);
      vec3 colNeutral = vec3(0.40, 0.88, 0.75);
      vec3 colMildYellow = vec3(0.96, 0.88, 0.22);
      vec3 colWarmAmber = vec3(0.98, 0.52, 0.08);
      vec3 colSevereRed = vec3(0.94, 0.14, 0.08);
      vec3 colExtremeMagenta = vec3(0.82, 0.04, 0.60);

      if (anom <= -0.5) {
        float t = clamp((anom + 1.5) / 1.0, 0.0, 1.0);
        return mix(colColdDeep, colColdGlacial, t);
      } else if (anom <= 0.0) {
        float t = clamp((anom + 0.5) / 0.5, 0.0, 1.0);
        return mix(colColdGlacial, colNeutral, t);
      } else if (anom <= 1.0) {
        float t = anom / 1.0;
        return mix(colNeutral, colMildYellow, t);
      } else if (anom <= 2.2) {
        float t = (anom - 1.0) / 1.2;
        return mix(colMildYellow, colWarmAmber, t);
      } else if (anom <= 3.8) {
        float t = (anom - 2.2) / 1.6;
        return mix(colWarmAmber, colSevereRed, t);
      } else {
        float t = clamp((anom - 3.8) / 2.7, 0.0, 1.0);
        return mix(colSevereRed, colExtremeMagenta, t);
      }
    }

    void main() {
      float latNorm = vUv.y;
      float isNorth = step(0.5, latNorm);

      float arcticFactor = smoothstep(0.66, 0.98, latNorm) * 2.85;
      float antarcticBuffer = smoothstep(0.32, 0.02, latNorm);

      // Continental Landmass Centers
      float dSahara = length((vUv - vec2(0.54, 0.61)) * vec2(1.2, 2.2));
      float saharaHot = exp(-dSahara * dSahara / 0.038) * 1.5;

      float dMideast = length((vUv - vec2(0.65, 0.65)) * vec2(1.4, 2.0));
      float mideastHot = exp(-dMideast * dMideast / 0.035) * 1.4;

      float dNAm = length((vUv - vec2(0.25, 0.70)) * vec2(1.3, 2.0));
      float nAmHot = exp(-dNAm * dNAm / 0.04) * 1.35;

      float dAmazon = length((vUv - vec2(0.33, 0.44)) * vec2(1.5, 2.0));
      float amazonHot = exp(-dAmazon * dAmazon / 0.03) * 1.2;

      float dAus = length((vUv - vec2(0.86, 0.35)) * vec2(1.4, 2.2));
      float ausHot = exp(-dAus * dAus / 0.032) * 1.4;

      float dEurasia = length((vUv - vec2(0.72, 0.74)) * vec2(1.2, 2.0));
      float eurasiaHot = exp(-dEurasia * dEurasia / 0.04) * 1.3;

      float continentalHeat = saharaHot + mideastHot + nAmHot + amazonHot + ausHot + eurasiaHot;

      float borealPhase = sin(((u_month - 4.0) / 12.0) * 6.283185);
      float seasonalBias = isNorth * borealPhase * 0.42 + (1.0 - isNorth) * (-borealPhase) * 0.32;

      float ripple = sin(vUv.x * 24.0 + vUv.y * 36.0 + u_time * 1.2) * 0.07
                   + cos(vUv.x * 14.0 - vUv.y * 20.0 - u_time * 0.8) * 0.05;

      float localAnomaly = u_globalAnomaly * (1.0 + continentalHeat * 0.62 + arcticFactor - antarcticBuffer * 0.42 + seasonalBias + ripple);

      if (latNorm > 0.84) {
        localAnomaly = max(localAnomaly, u_globalAnomaly * 2.4);
      }

      // Map anomaly into full-spectrum gradient depending on active branch
      vec3 finalColor = getAnomalyColor(localAnomaly);
      if (u_branchType > 10.5) {
        finalColor = getOzoneColor(localAnomaly);
      } else if (u_branchType > 9.5) {
        finalColor = getNO2Color(localAnomaly);
      } else if (u_branchType > 8.5) {
        finalColor = getAerosolColor(localAnomaly);
      } else if (u_branchType > 7.5) {
        finalColor = getVegetationColor(localAnomaly);
      } else if (u_branchType > 5.5) {
        finalColor = getSoilMoistureColor(localAnomaly);
      } else if (u_branchType > 3.5) {
        finalColor = getPrecipitationColor(localAnomaly);
      } else if (u_branchType > 1.5) {
        finalColor = getWindSpeedColor(localAnomaly);
      } else if (u_branchType > 0.5 || u_isHumidity > 0.5) {
        finalColor = getHumidityAnomalyColor(localAnomaly);
      }

      // Departure thresholding: keeps baseline Earth clear so real Earth marble fits 100%
      float departure = abs(localAnomaly);
      float baseAlpha = smoothstep(0.8, 2.8, departure) * 0.45;
      float finalAlpha = baseAlpha * u_intensity;

      vec3 viewDir = normalize(-vPosition);
      float edgeFalloff = pow(clamp(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 0.3);
      finalAlpha *= edgeFalloff;

      gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 0.65));
    }
  `,
};

// Backward compatibility alias
const GlobalThermalShader = GlobalTemperatureHeatmapShader;

// What this does: Custom GPU shader that simulates Earth's thin glowing atmosphere, sunset orange twilight ring, and gentle breathing pulse.
// On the website: Creates the realistic blue/amber glowing halo around the edge of the Earth.
// Used as: The outer atmosphere shader material.
const AtmosphereShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    uniform vec3 u_sunDirection;
    uniform float u_time;
    uniform float u_globalAnomaly;
    uniform vec3 glowColor;
    uniform float coefficient;
    uniform float power;

    void main() {
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 normal = normalize(vNormal);

      // Physical limb grazing Fresnel
      float fresnel = 1.0 - max(0.0, dot(viewDir, normal));
      float rim = pow(fresnel, power);

      // Solar alignment
      float sunDot = dot(normal, u_sunDirection);

      // Atmospheric colors:
      // Day limb: Sapphire cyan
      vec3 dayGlow = glowColor;
      // Twilight / Terminator rim (Rayleigh forward scattering sunset): Amber gold / Rose
      vec3 sunsetGlow = vec3(1.0, 0.58, 0.22);
      // Night limb: Deep celestial navy indigo
      vec3 nightGlow = vec3(0.04, 0.09, 0.28);

      // Terminator zone
      float terminator = smoothstep(-0.25, 0.35, sunDot);
      float sunsetRim = exp(-sunDot * sunDot / 0.055) * 1.6;

      vec3 atmosphereColor = mix(nightGlow, dayGlow, terminator);
      atmosphereColor = mix(atmosphereColor, sunsetGlow, clamp(sunsetRim * 0.75, 0.0, 0.85));

      // "Earth's Breath" (Organic Biosphere Pulsation: ~12s period harmonic breathing)
      float breath = sin(u_time * 0.52) * 0.08 + cos(u_time * 0.26) * 0.04;
      float intensity = (rim + sunsetRim * 0.28) * (coefficient + breath);

      // Planetary vulnerability response (warming anomaly stress above 1.5°C)
      if (u_globalAnomaly > 1.5) {
        float stress = clamp((u_globalAnomaly - 1.5) / 1.5, 0.0, 0.35);
        atmosphereColor = mix(atmosphereColor, vec3(0.96, 0.42, 0.22), stress * 0.35);
      }

      gl_FragColor = vec4(atmosphereColor, clamp(intensity, 0.0, 0.88));
    }
  `,
};

// 3b. NASA World Night Lights Shader with True Day/Night Terminator Masking
const NASAWorldLightsShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    uniform sampler2D u_nightLightsTex;
    uniform vec3 u_sunDirection;
    uniform float u_time;

    void main() {
      vec3 normal = normalize(vNormal);
      float sunDot = dot(normal, u_sunDirection);

      // Night mask: 1.0 on dark hemisphere, 0.0 on illuminated day hemisphere
      float nightMask = smoothstep(0.06, -0.14, sunDot);

      if (nightMask <= 0.005) {
        discard;
      }

      vec4 texColor = texture2D(u_nightLightsTex, vUv);

      // Subtle atmospheric city twinkle (scintillation through turbulent atmosphere)
      float twinkle = sin(vUv.x * 320.0 + u_time * 2.5) * cos(vUv.y * 280.0 - u_time * 1.8);
      float twinkleMod = 1.0 + twinkle * 0.08;

      vec3 cityGlow = texColor.rgb * twinkleMod * 1.35;
      gl_FragColor = vec4(cityGlow, texColor.a * nightMask);
    }
  `,
};

// What this does: Builds 3D latitude/longitude reference rings (Equator, Tropics, Polar Circles) and a golden Sun zenith marker.
// On the website: Draws optional scientific map lines around the globe.
// Used as: The 3D graticule line group in the scene.
function createScientificGraticule(): THREE.Group {
  const graticuleGroup = new THREE.Group();
  const radius = 2.008;

  const createLatCircle = (latDeg: number, color: number, opacity: number, dashSize?: number) => {
    const latRad = THREE.MathUtils.degToRad(latDeg);
    const y = radius * Math.sin(latRad);
    const r = radius * Math.cos(latRad);
    const points: THREE.Vector3[] = [];
    const segments = 96;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    let mat: THREE.Material;
    if (dashSize) {
      mat = new THREE.LineDashedMaterial({
        color,
        transparent: true,
        opacity,
        dashSize,
        gapSize: dashSize * 0.7,
      });
    } else {
      mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
      });
    }
    const line = new THREE.Line(geom, mat);
    if (dashSize) line.computeLineDistances();
    return line;
  };

  // 1. Equator (0° Lat) - Luminous cyan line
  graticuleGroup.add(createLatCircle(0, 0x38bdf8, 0.45));

  // 2. Tropic of Cancer (+23.44° N) - Solar amber dashed line
  graticuleGroup.add(createLatCircle(23.44, 0xf59e0b, 0.42, 0.08));

  // 3. Tropic of Capricorn (-23.44° S) - Solar amber dashed line
  graticuleGroup.add(createLatCircle(-23.44, 0xf59e0b, 0.42, 0.08));

  // 4. Arctic Circle (+66.56° N) - Glacial ice cyan
  graticuleGroup.add(createLatCircle(66.56, 0xbae6fd, 0.45, 0.05));

  // 5. Antarctic Circle (-66.56° S) - Glacial ice cyan
  graticuleGroup.add(createLatCircle(-66.56, 0xbae6fd, 0.45, 0.05));

  // 6. Meridian Arcs every 30° Longitude
  for (let lng = -180; lng < 180; lng += 30) {
    const lngRad = THREE.MathUtils.degToRad(lng);
    const points: THREE.Vector3[] = [];
    const segments = 48;
    for (let i = 0; i <= segments; i++) {
      const lat = -90 + (i / segments) * 180;
      const latRad = THREE.MathUtils.degToRad(lat);
      const y = radius * Math.sin(latRad);
      const r = radius * Math.cos(latRad);
      points.push(new THREE.Vector3(r * Math.sin(lngRad), y, r * Math.cos(lngRad)));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const isPrime = lng === 0;
    const mat = new THREE.LineBasicMaterial({
      color: isPrime ? 0x38bdf8 : 0x0284c7,
      transparent: true,
      opacity: isPrime ? 0.45 : 0.16,
    });
    graticuleGroup.add(new THREE.Line(geom, mat));
  }

  // 7. Subsolar Zenith Point Marker (Zenith of direct overhead solar illumination)
  const subsolarGroup = new THREE.Group();
  subsolarGroup.name = 'subsolarReticle';
  const subsolarRing = new THREE.Mesh(
    new THREE.RingGeometry(0.025, 0.045, 32),
    new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  );
  subsolarRing.rotateX(-Math.PI / 2);
  subsolarGroup.add(subsolarRing);
  const subsolarDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.014, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xfffbeb })
  );
  subsolarGroup.add(subsolarDot);
  graticuleGroup.add(subsolarGroup);

  return graticuleGroup;
}

// What this does: Creates glowing green-and-violet northern and southern lights rings on the dark night side of Earth's poles.
// On the website: Adds shimmering auroras over the Arctic and Antarctic circles.
// Used as: The 3D polar aurora shader group.
function createAuroralOvals(): { group: THREE.Group; mat: THREE.ShaderMaterial } {
  const group = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec2 vUv;
      uniform float u_time;
      uniform vec3 u_sunDirection;
      void main() {
        float sunDot = dot(vNormal, u_sunDirection);
        float nightMask = smoothstep(0.12, -0.20, sunDot);
        if (nightMask <= 0.005) discard;

        float wave = sin(vUv.x * 24.0 + u_time * 2.2) * 0.5 + 0.5;
        float wave2 = cos(vUv.x * 42.0 - u_time * 3.1) * 0.5 + 0.5;
        float curtain = pow(wave * 0.6 + wave2 * 0.4, 2.0);

        vec3 colGreen = vec3(0.08, 0.95, 0.45);
        vec3 colViolet = vec3(0.65, 0.22, 0.95);
        vec3 auroraColor = mix(colGreen, colViolet, vUv.y * 0.8);

        float alpha = curtain * sin(vUv.y * 3.14159) * 0.62 * nightMask;
        gl_FragColor = vec4(auroraColor, clamp(alpha, 0.0, 0.7));
      }
    `,
    uniforms: {
      u_time: { value: 0 },
      u_sunDirection: { value: new THREE.Vector3(1, 0, 0) },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // Northern Aurora Oval ring
  const northGeo = new THREE.CylinderGeometry(0.55, 0.62, 0.14, 48, 1, true);
  const northAurora = new THREE.Mesh(northGeo, mat);
  northAurora.position.set(0, 1.93, 0);
  group.add(northAurora);

  // Southern Aurora Oval ring
  const southGeo = new THREE.CylinderGeometry(0.62, 0.55, 0.14, 48, 1, true);
  const southAurora = new THREE.Mesh(southGeo, mat);
  southAurora.position.set(0, -1.93, 0);
  group.add(southAurora);

  return { group, mat };
}

// 4. Procedural 3D Meteoroid Fireball Builder
// 4. Procedural 3D Cartoon Rocket Space Craft Builder (5-Second Space Flight)
interface RocketInstance {
  group: THREE.Group;
  rocketMesh: THREE.Group;
  plasmaSheath: THREE.Mesh;
  outerFireTail: THREE.Mesh;
  innerFireTail: THREE.Mesh;
  smokeParticles: THREE.Points;
  impactWaveRing: THREE.Mesh;
  craterBeacon: THREE.Mesh;
  flightState: {
    isActive: boolean;
    startPos: THREE.Vector3;
    targetPos: THREE.Vector3;
    targetNormal: THREE.Vector3;
    flightStartTime: number;
    flightDuration: number; // 5000ms (5 full seconds)
    hasImpacted: boolean;
    impactTime: number;
  };
}

// What this does: Builds a miniature 3D NASA-style red-and-white rocket with glowing fire exhaust, smoke sparks, and a landing shockwave ring.
// On the website: Launches from deep space and lands on whatever country or spot the user selects on the globe.
// Used as: The animated 3D rocket explorer object.
function createRocketAnimation(): RocketInstance {
  const group = new THREE.Group();
  const rocketMesh = new THREE.Group();

  // 1. Sleek Cartoon Rocket Fuselage (White NASA body)
  const bodyGeo = new THREE.CylinderGeometry(0.048, 0.052, 0.22, 20);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
    metalness: 0.2,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.08;
  rocketMesh.add(body);

  // Red accent mid-stripe
  const stripeGeo = new THREE.CylinderGeometry(0.049, 0.051, 0.04, 20);
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.3,
  });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.y = 0.08;
  rocketMesh.add(stripe);

  // 2. Conical Crimson Rocket Nosecone
  const noseGeo = new THREE.ConeGeometry(0.05, 0.12, 20);
  const noseMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.2,
    metalness: 0.1,
  });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.y = 0.25;
  rocketMesh.add(nose);

  // 3. Porthole Cockpit Glass (Glowing Cyan)
  const windowGeo = new THREE.SphereGeometry(0.022, 16, 16);
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.8,
    roughness: 0.1,
  });
  const windowMesh = new THREE.Mesh(windowGeo, windowMat);
  windowMesh.scale.set(1.0, 1.0, 0.4);
  windowMesh.position.set(0, 0.12, 0.046);
  rocketMesh.add(windowMesh);

  // 4. Four Red Aerodynamic Delta Tail Fins
  const finGeo = new THREE.BoxGeometry(0.012, 0.09, 0.07);
  const finMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    roughness: 0.35,
  });

  const finAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  finAngles.forEach((angle) => {
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.y = 0.015;
    fin.rotation.y = angle;
    fin.position.x = Math.sin(angle) * 0.055;
    fin.position.z = Math.cos(angle) * 0.055;
    rocketMesh.add(fin);
  });

  // 5. Rocket Thruster Nozzle Bell
  const nozzleGeo = new THREE.CylinderGeometry(0.038, 0.045, 0.04, 16);
  const nozzleMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.3,
  });
  const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
  nozzle.position.y = -0.04;
  rocketMesh.add(nozzle);

  group.add(rocketMesh);

  // 6. Fiery Atmospheric Plasma Sheath (Glows during atmospheric re-entry)
  const plasmaGeo = new THREE.SphereGeometry(0.18, 20, 20);
  const plasmaMat = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const plasmaSheath = new THREE.Mesh(plasmaGeo, plasmaMat);
  group.add(plasmaSheath);

  // 7. Cartoon Thruster Fire Flame (Outer Orange plume)
  const outerTailGeo = new THREE.ConeGeometry(0.08, 0.55, 16);
  const outerTailMat = new THREE.MeshBasicMaterial({
    color: 0xff4500,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const outerFireTail = new THREE.Mesh(outerTailGeo, outerTailMat);
  outerFireTail.rotation.x = Math.PI; // flames shoot backwards out of nozzle
  outerFireTail.position.y = -0.32;
  group.add(outerFireTail);

  // 8. White-Hot Inner Core Flame
  const innerTailGeo = new THREE.ConeGeometry(0.042, 0.38, 16);
  const innerTailMat = new THREE.MeshBasicMaterial({
    color: 0xffff44,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const innerFireTail = new THREE.Mesh(innerTailGeo, innerTailMat);
  innerFireTail.rotation.x = Math.PI;
  innerFireTail.position.y = -0.23;
  group.add(innerFireTail);

  // 9. Particle Exhaust Sparks & Smoke Plume
  const particleCount = 45;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.08 * (1.0 + (i / particleCount) * 1.6);
    particlePositions[i * 3] = Math.cos(angle) * r;
    particlePositions[i * 3 + 1] = -0.2 - Math.random() * 0.75;
    particlePositions[i * 3 + 2] = Math.sin(angle) * r;
  }
  const smokeGeo = new THREE.BufferGeometry();
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const smokeMat = new THREE.PointsMaterial({
    color: 0xffd166,
    size: 0.042,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const smokeParticles = new THREE.Points(smokeGeo, smokeMat);
  group.add(smokeParticles);

  // 10. Touchdown Landing Beacon & Shockwave Ring
  const impactRingGeo = new THREE.RingGeometry(0.04, 0.16, 32);
  const impactRingMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const impactWaveRing = new THREE.Mesh(impactRingGeo, impactRingMat);
  impactWaveRing.rotateX(-Math.PI / 2);
  impactWaveRing.position.y = 0.02;
  group.add(impactWaveRing);

  // 11. Landing Touchdown Beacon Pillar
  const craterGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.04, 16);
  const craterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0,
  });
  const craterBeacon = new THREE.Mesh(craterGeo, craterMat);
  craterBeacon.position.y = 0.02;
  group.add(craterBeacon);

  group.scale.set(1.4, 1.4, 1.4);

  return {
    group,
    rocketMesh,
    plasmaSheath,
    outerFireTail,
    innerFireTail,
    smokeParticles,
    impactWaveRing,
    craterBeacon,
    flightState: {
      isActive: false,
      startPos: new THREE.Vector3(),
      targetPos: new THREE.Vector3(),
      targetNormal: new THREE.Vector3(0, 1, 0),
      flightStartTime: 0,
      flightDuration: 5000, // Exactly 5 seconds duration
      hasImpacted: false,
      impactTime: 0,
    },
  };
}

// Reusable math objects at module scope for Zero GC render loop
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3(0, 0, 0);
const _meteorFlightQuat = new THREE.Quaternion();
const _meteorCurrentPos = new THREE.Vector3();
const _meteorNextPos = new THREE.Vector3();
const _meteorFlightDir = new THREE.Vector3();

// What this does: Renders the full-screen interactive 3D Earth globe using Three.js, complete with orbit/pinch controls, hotspot pins, heatwaves, and rocket landings.
// On the website: Serves as the centerpiece interactive planet on the main screen that users spin, zoom, and click to inspect any place.
// Used as: The core 3D Earth visualization component.
export const EarthGlobe: React.FC<EarthGlobeProps> = ({
  regions,
  selectedLocation,
  onSelectRegion,
  onSelectCoordinates,
  year,
  month = 7,
  isAiPrediction,
  layers,
  visibleHotspotIds,
  autoRotate,
  rotationSpeed,
  onWarpStateChange,
  isPlayingTimeline = false,
  dataBranch = 'temperature',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<{ name: string; color: string; x: number; y: number } | null>(null);

  // References to keep state synced without full scene rebuild
  const stateRef = useRef({
    year,
    month,
    isAiPrediction,
    layers,
    visibleHotspotIds,
    autoRotate,
    rotationSpeed,
    selectedLocation,
    isPlayingTimeline,
    dataBranch,
    isCameraFlying: false,
    hoveredRegionId: null as string | null,
  });

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current.year = year;
    stateRef.current.month = month;
    stateRef.current.isAiPrediction = isAiPrediction;
    stateRef.current.layers = layers;
    stateRef.current.visibleHotspotIds = visibleHotspotIds;
    stateRef.current.autoRotate = autoRotate;
    stateRef.current.rotationSpeed = rotationSpeed;
    stateRef.current.selectedLocation = selectedLocation;
    stateRef.current.isPlayingTimeline = isPlayingTimeline;
    stateRef.current.dataBranch = dataBranch;
  }, [year, month, isAiPrediction, layers, visibleHotspotIds, autoRotate, rotationSpeed, selectedLocation, isPlayingTimeline, dataBranch]);

  // Mesh & Shader Material references
  const earthSpinGroupRef = useRef<THREE.Group | null>(null);
  const earthMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const atmosphereMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const thermalShaderMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const thermalMeshRef = useRef<THREE.Mesh | null>(null);
  const atmosphereMeshRef = useRef<THREE.Mesh | null>(null);
  const graticuleGroupRef = useRef<THREE.Group | null>(null);
  const auroraMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const nightLightsShaderMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const hologramShellMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const hologramShellMeshRef = useRef<THREE.Mesh | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const heatmapsGroupRef = useRef<THREE.Group | null>(null);
  const vectorsGroupRef = useRef<THREE.Group | null>(null);
  const nightLightsMeshRef = useRef<THREE.Mesh | null>(null);
  const targetBeaconGroupRef = useRef<THREE.Group | null>(null);
  const localHeatGroupRef = useRef<THREE.Group | null>(null);
  const meteoroidRef = useRef<RocketInstance | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // What this does: Zooms the camera closer to or farther away from the Earth when the user taps the + or - buttons on mobile.
  // On the website: Lets mobile users shrink the planet as small as they want or zoom right in with one tap.
  // Used as: The mobile zoom button click handler.
  const handleMobileZoom = (scaleFactor: number) => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    soundFx.playTick();
    stateRef.current.isCameraFlying = false;
    const currentDist = cam.position.length();
    const minDist = ctrl.minDistance || 2.3;
    const maxDist = ctrl.maxDistance || 45.0;
    const targetDist = THREE.MathUtils.clamp(currentDist * scaleFactor, minDist, maxDist);
    cam.position.setLength(targetDist);
    ctrl.update();
  };

  // 3-Second High-Speed Revolving Animation refs
  const prevYearRef = useRef<number>(year);
  const warpEndTimeRef = useRef<number>(0);
  const isWarpingActiveRef = useRef<boolean>(false);

  // What this does: Spins the Earth rapidly for 3 seconds whenever the user jumps manually to a new year.
  // On the website: Gives a dramatic "time-travel warp" spin effect when picking a different year on the timeline.
  // Used as: The year-change warp animation trigger.
  useEffect(() => {
    if (year !== prevYearRef.current) {
      prevYearRef.current = year;
      // Only engage 3-second rapid rotation when NOT in continuous timeline playback!
      if (!isPlayingTimeline) {
        warpEndTimeRef.current = performance.now() + 3000.0;
        isWarpingActiveRef.current = true;
        soundFx.playWarpSpeed();
        if (onWarpStateChange) onWarpStateChange(true);
      }
    }
  }, [year, isPlayingTimeline, onWarpStateChange]);

  // What this does: Flies the 3D camera toward the selected country/hotspot, lights up a beacon and heat ripples there, and launches the 3D rocket from space.
  // On the website: Animates the smooth zoom-in and rocket landing whenever the user clicks a country, searches, or taps a pin.
  // Used as: The location-selection 3D animation effect.
  useEffect(() => {
    if (selectedLocation && controlsRef.current) {
      const pos = latLngToVector3(selectedLocation.lat, selectedLocation.lng, 4.4);
      _targetCamPos.copy(pos);
      stateRef.current.isCameraFlying = true;

      const targetPos = latLngToVector3(selectedLocation.lat, selectedLocation.lng, 2.0);
      const normal = targetPos.clone().normalize();

      // Update target beacon position
      if (targetBeaconGroupRef.current) {
        targetBeaconGroupRef.current.position.copy(targetPos);
        targetBeaconGroupRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        targetBeaconGroupRef.current.visible = true;
      }

      // Update Localized Heat Wave Effect at chosen place
      if (localHeatGroupRef.current) {
        localHeatGroupRef.current.position.copy(targetPos);
        localHeatGroupRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        localHeatGroupRef.current.visible = true;
      }

      // Launch Glowing 3D Cartoon Rocket directly from deep space to the place the user chooses (5.0s Flight Duration)
      if (meteoroidRef.current) {
        const { group, flightState, rocketMesh, plasmaSheath, outerFireTail, innerFireTail, smokeParticles, impactWaveRing, craterBeacon } = meteoroidRef.current;
        group.visible = !stateRef.current.isPlayingTimeline;

        const rocketTarget = latLngToVector3(selectedLocation.lat, selectedLocation.lng, 2.05);
        const rocketNormal = rocketTarget.clone().normalize();

        // Calculate a perpendicular celestial angle so it zooms in along a dramatic space trajectory
        const tangent = new THREE.Vector3().crossVectors(rocketNormal, new THREE.Vector3(0, 1, 0));
        if (tangent.lengthSq() < 0.001) {
          tangent.crossVectors(rocketNormal, new THREE.Vector3(1, 0, 0));
        }
        tangent.normalize();

        // Launch from deep outer space (radius 10.5, with tangent offset 3.5 in the cosmos)
        const spaceOrigin = rocketNormal.clone().multiplyScalar(10.5).add(tangent.clone().multiplyScalar(3.5));
        flightState.startPos.copy(spaceOrigin);
        flightState.targetPos.copy(rocketTarget);
        flightState.targetNormal.copy(rocketNormal);
        flightState.flightStartTime = performance.now();
        flightState.flightDuration = 5000; // Exactly 5.0 seconds as requested!
        flightState.isActive = true;
        flightState.hasImpacted = false;
        flightState.impactTime = 0;

        // Reset elements for incoming rocket
        rocketMesh.visible = true;
        rocketMesh.scale.set(1.0, 1.0, 1.0);
        plasmaSheath.visible = true;
        outerFireTail.visible = true;
        innerFireTail.visible = true;
        smokeParticles.visible = true;
        (impactWaveRing.material as THREE.MeshBasicMaterial).opacity = 0;
        (craterBeacon.material as THREE.MeshStandardMaterial).opacity = 0;

        // Position rocket at space origin immediately
        group.position.copy(spaceOrigin);

        soundFx.playRocketWhoosh();
      }
    } else {
      if (targetBeaconGroupRef.current) targetBeaconGroupRef.current.visible = false;
      if (localHeatGroupRef.current) localHeatGroupRef.current.visible = false;
      if (meteoroidRef.current) {
        meteoroidRef.current.group.visible = false;
        meteoroidRef.current.flightState.isActive = false;
        meteoroidRef.current.flightState.hasImpacted = false;
      }
    }
  }, [selectedLocation]);

  // What this does: Sends the new year, month, and climate branch straight to the GPU shader uniforms without rebuilding the 3D scene.
  // On the website: Makes the Earth's heat map and glow color update instantaneously while dragging the timeline slider.
  // Used as: The zero-lag GPU shader sync effect.
  useEffect(() => {
    const globalAnomaly = getGlobalMonthlyAnomaly(year, month);
    const branchCode = getBranchTypeCode(dataBranch);
    const glowHex = getBranchGlowHex(dataBranch);

    if (thermalShaderMatRef.current) {
      thermalShaderMatRef.current.uniforms.u_globalAnomaly.value = globalAnomaly;
      thermalShaderMatRef.current.uniforms.u_month.value = month;
      thermalShaderMatRef.current.uniforms.u_isHumidity.value = dataBranch === 'humidity' ? 1.0 : 0.0;
      if (thermalShaderMatRef.current.uniforms.u_branchType) {
        thermalShaderMatRef.current.uniforms.u_branchType.value = branchCode;
      }
    }

    if (atmosphereMatRef.current) {
      atmosphereMatRef.current.uniforms.u_globalAnomaly.value = globalAnomaly;
      atmosphereMatRef.current.uniforms.glowColor.value.setHex(glowHex);
      atmosphereMatRef.current.uniforms.power.value = 2.8;
    }

    if (hologramShellMatRef.current) {
      hologramShellMatRef.current.uniforms.u_holoColor.value.setHex(glowHex);
    }
  }, [year, month, isAiPrediction, dataBranch]);

  // What this does: Turns 3D globe layers (pins, clouds, night lights, heat domes, atmosphere, rocket) on or off based on user toggles and playback state.
  // On the website: Shows or hides visual layers cleanly and hides clutter during timeline Play mode.
  // Used as: The layer visibility sync effect.
  useEffect(() => {
    const showPins = layers.pins && !isPlayingTimeline;
    const showHeatmaps = layers.heatmaps && !isPlayingTimeline;
    const showVectors = layers.aiVectors && isAiPrediction && !isPlayingTimeline;

    if (pinsGroupRef.current) {
      pinsGroupRef.current.visible = showPins;
      pinsGroupRef.current.children.forEach((child) => {
        const regId = child.userData?.regionId;
        const isVisible = regId ? visibleHotspotIds?.[regId] ?? true : true;
        child.visible = isVisible && showPins;
      });
    }
    if (heatmapsGroupRef.current) {
      heatmapsGroupRef.current.visible = showHeatmaps;
      heatmapsGroupRef.current.children.forEach((child) => {
        const regId = child.userData?.regionId;
        const isVisible = regId ? visibleHotspotIds?.[regId] ?? true : true;
        child.visible = isVisible && showHeatmaps;
      });
    }
    if (thermalMeshRef.current) {
      const showHeatmap = layers.globalTempHeatmap !== undefined ? layers.globalTempHeatmap : layers.thermalHeatmap;
      thermalMeshRef.current.visible = showHeatmap;
    }
    if (cloudsMeshRef.current) cloudsMeshRef.current.visible = layers.clouds && !isPlayingTimeline;
    if (nightLightsMeshRef.current) nightLightsMeshRef.current.visible = layers.nightLights && !isPlayingTimeline;
    if (vectorsGroupRef.current) vectorsGroupRef.current.visible = showVectors;
    if (hologramShellMeshRef.current) hologramShellMeshRef.current.visible = layers.atmosphereGlow;
    if (atmosphereMeshRef.current) atmosphereMeshRef.current.visible = layers.atmosphereGlow;
    if (targetBeaconGroupRef.current) targetBeaconGroupRef.current.visible = Boolean(selectedLocation) && !isPlayingTimeline;
    if (localHeatGroupRef.current) localHeatGroupRef.current.visible = Boolean(selectedLocation) && !isPlayingTimeline;
    if (meteoroidRef.current) meteoroidRef.current.group.visible = Boolean(selectedLocation) && !isPlayingTimeline;
  }, [layers, visibleHotspotIds, isAiPrediction, isPlayingTimeline, selectedLocation]);

  // What this does: Builds the entire 3D WebGL space scene (stars, tilted Earth, clouds, night lights, shaders, pins, rocket, click detector, and animation loop) once on mount.
  // On the website: Creates and runs the interactive 3D Earth canvas that fills the background of the app.
  // Used as: The main Three.js setup and render loop effect.
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL guard
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isMobileViewport = width < 768;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020611);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    // Start further back on mobile viewports so the planet sits smaller & cleaner on portrait screens
    camera.position.set(0, 1.35, isMobileViewport ? 8.2 : 5.2);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.userSelect = 'none';
    container.appendChild(renderer.domElement);

    // 3. OrbitControls with explicit touch screen dragging ergonomics
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.85;
    controls.zoomSpeed = 0.85;
    controls.minDistance = 2.3;
    // Allow mobile users to pinch/zoom out to shrink the planet as small as they want
    controls.maxDistance = isMobileViewport ? 45.0 : 9.0;
    controls.enablePan = false;
    controls.enableRotate = true;
    controls.minPolarAngle = 0.05; // Full vertical drag up to North Pole
    controls.maxPolarAngle = Math.PI - 0.05; // Full vertical drag down to South Pole
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE, // 1 finger drags up/down and left/right smoothly
      TWO: THREE.TOUCH.DOLLY_PAN, // 2 fingers pinch zoom
    };
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      stateRef.current.isCameraFlying = false;
    });

    // 4. Lighting Rig (Vibrant NASA Space Photography lighting)
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.15); // Clean, natural celestial daylight ambient
    scene.add(ambientLight);

    // Natural warm solar directional light
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.75);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // Atmospheric cool cyan-blue rim light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    fillLight.position.set(-5, -2, -4);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xa5f3fc, 0x0f172a, 0.55);
    scene.add(hemiLight);

    // 5. Cosmic Starfield
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 2400;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const rad = 60 + Math.random() * 80;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      starPositions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = rad * Math.cos(phi);

      const isBlue = Math.random() > 0.7;
      starColors[i * 3] = isBlue ? 0.75 : 0.95;
      starColors[i * 3 + 1] = isBlue ? 0.85 : 0.95;
      starColors[i * 3 + 2] = 1.0;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starsGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starsMat = new THREE.PointsMaterial({
      size: 0.85,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // 5b. Earth Obliquity Tilt Group (True 23.44° Earth Axial Tilt)
    const earthTiltGroup = new THREE.Group();
    earthTiltGroup.rotation.z = THREE.MathUtils.degToRad(23.44);
    scene.add(earthTiltGroup);

    // Earth Spin Group (Rotates along Earth's tilted geographic axis)
    const earthSpinGroup = new THREE.Group();
    earthTiltGroup.add(earthSpinGroup);
    earthSpinGroupRef.current = earthSpinGroup;

    // 6. Real Earth Core Sphere (Radius = 2.0) with Authentic NASA Satellite Colors
    const earthGeo = new THREE.SphereGeometry(2.0, 64, 64);
    const texLoader = new THREE.TextureLoader();

    // Balanced realistic PBR surface without artificial roughness masks or bump map distortions
    const earthMat = new THREE.MeshStandardMaterial({
      roughness: 0.65,
      metalness: 0.04,
    });
    earthMatRef.current = earthMat;

    // Load authentic NASA Blue Marble real Earth texture covering 100% of the sphere seamlessly
    const realEarthTex = texLoader.load('/earth-blue-marble.jpg', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.needsUpdate = true;
      earthMat.map = texture;
      earthMat.needsUpdate = true;
    });
    realEarthTex.colorSpace = THREE.SRGBColorSpace;
    realEarthTex.wrapS = THREE.RepeatWrapping;
    realEarthTex.wrapT = THREE.ClampToEdgeWrapping;
    earthMat.map = realEarthTex;

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthSpinGroup.add(earthMesh);

    // 6b. 3D Cartoon Rocket (Attached as child of earthMesh so it rotates seamlessly with the planet)
    const meteoroidInstance = createRocketAnimation();
    meteoroidInstance.group.visible = false;
    earthMesh.add(meteoroidInstance.group);
    meteoroidRef.current = meteoroidInstance;

    // 7. ZERO-LAG GPU Global Temperature Heatmap Anomaly Shader Layer (Radius = 2.006)
    const initialAnomaly = getGlobalMeanAnomaly(stateRef.current.year);
    const thermalGeo = new THREE.SphereGeometry(2.006, 64, 64);
    const thermalShaderMat = new THREE.ShaderMaterial({
      vertexShader: GlobalTemperatureHeatmapShader.vertexShader,
      fragmentShader: GlobalTemperatureHeatmapShader.fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_globalAnomaly: { value: initialAnomaly },
        u_month: { value: stateRef.current.month },
        u_intensity: { value: 0.95 },
        u_isHumidity: { value: stateRef.current.dataBranch === 'humidity' ? 1.0 : 0.0 },
        u_branchType: {
          value: getBranchTypeCode(stateRef.current.dataBranch),
        },
      },
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    thermalShaderMatRef.current = thermalShaderMat;
    const thermalMesh = new THREE.Mesh(thermalGeo, thermalShaderMat);
    const initialHeatmapVisible =
      stateRef.current.layers.globalTempHeatmap !== undefined
        ? stateRef.current.layers.globalTempHeatmap
        : stateRef.current.layers.thermalHeatmap;
    thermalMesh.visible = initialHeatmapVisible;
    thermalMeshRef.current = thermalMesh;
    earthSpinGroup.add(thermalMesh);

    // 7b. Scientific Cartographic Graticule (Equator, Tropics, Polar Circles, Meridians, Subsolar Reticle)
    const graticuleGroup = createScientificGraticule();
    graticuleGroup.visible = false;
    earthSpinGroup.add(graticuleGroup);
    graticuleGroupRef.current = graticuleGroup;

    // 7c. Polar Auroral Ovals (Aurora Borealis & Aurora Australis)
    const auroraInstance = createAuroralOvals();
    auroraInstance.group.visible = false;
    earthSpinGroup.add(auroraInstance.group);
    auroraMatRef.current = auroraInstance.mat;

    // 8. 3D Hologram Outer Shell (Scanlines, Telemetry Matrix Grid & Rim Glow - Radius = 2.010)
    const holoGeo = new THREE.SphereGeometry(2.010, 64, 64);
    const holoMat = new THREE.ShaderMaterial({
      vertexShader: HologramShellShader.vertexShader,
      fragmentShader: HologramShellShader.fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_scanlineIntensity: { value: 0.8 },
        u_holoColor: { value: new THREE.Color(0x38bdf8) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    hologramShellMatRef.current = holoMat;
    const holoMesh = new THREE.Mesh(holoGeo, holoMat);
    holoMesh.visible = stateRef.current.layers.atmosphereGlow;
    hologramShellMeshRef.current = holoMesh;
    earthSpinGroup.add(holoMesh);

    // 9. Real NASA Night Lights Layer with True Terminator Masking (Radius = 2.012)
    const initialNightTex = generateNightLightsTexture();
    const nightShaderMat = new THREE.ShaderMaterial({
      vertexShader: NASAWorldLightsShader.vertexShader,
      fragmentShader: NASAWorldLightsShader.fragmentShader,
      uniforms: {
        u_nightLightsTex: { value: initialNightTex },
        u_sunDirection: { value: new THREE.Vector3(1, 0, 0) },
        u_time: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    nightLightsShaderMatRef.current = nightShaderMat;
    const nightMesh = new THREE.Mesh(new THREE.SphereGeometry(2.012, 48, 48), nightShaderMat);
    nightMesh.visible = stateRef.current.layers.nightLights;
    nightLightsMeshRef.current = nightMesh;
    earthSpinGroup.add(nightMesh);

    texLoader.load('/earth-night.jpg', (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      nightShaderMat.uniforms.u_nightLightsTex.value = texture;
      nightShaderMat.needsUpdate = true;
    });

    // 10. Real NASA Atmospheric Clouds Layer (Radius = 2.018)
    const cloudGeo = new THREE.SphereGeometry(2.018, 48, 48);
    const initialCloudTex = generateCloudTexture();
    const cloudMat = new THREE.MeshStandardMaterial({
      map: initialCloudTex,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      roughness: 0.95,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.visible = stateRef.current.layers.clouds;
    cloudsMeshRef.current = cloudMesh;
    earthSpinGroup.add(cloudMesh);

    texLoader.load('/earth-clouds.jpg', (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      cloudMat.map = texture;
      cloudMat.needsUpdate = true;
    });

    // 11. Atmospheric Outer Glow with Rayleigh Scattering & "Earth's Breath" (Radius = 2.24)
    const atmosphereGeo = new THREE.SphereGeometry(2.24, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: AtmosphereShader.vertexShader,
      fragmentShader: AtmosphereShader.fragmentShader,
      uniforms: {
        u_sunDirection: { value: new THREE.Vector3(1, 0, 0) },
        u_time: { value: 0 },
        u_globalAnomaly: { value: initialAnomaly },
        glowColor: { value: new THREE.Color(0x38bdf8) },
        coefficient: { value: 0.35 },
        power: { value: 4.8 },
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    atmosphereMatRef.current = atmosphereMat;
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    atmosphereMesh.visible = stateRef.current.layers.atmosphereGlow;
    atmosphereMeshRef.current = atmosphereMesh;
    earthTiltGroup.add(atmosphereMesh);

    // 12. Localized Heat Thermal Ripple & Plasma Flare Effect Group (Attached to Chosen Place)
    const localHeatGroup = new THREE.Group();
    // Thermal wave ripple 1
    const thermalRing1 = new THREE.Mesh(
      new THREE.RingGeometry(0.04, 0.08, 32),
      new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })
    );
    thermalRing1.rotateX(-Math.PI / 2);
    thermalRing1.userData = { isThermalWave: true, waveSpeed: 3.5, maxRadius: 0.35 };
    localHeatGroup.add(thermalRing1);

    // Thermal wave ripple 2 (offset phase)
    const thermalRing2 = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.12, 32),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending })
    );
    thermalRing2.rotateX(-Math.PI / 2);
    thermalRing2.userData = { isThermalWave: true, waveSpeed: 2.8, maxRadius: 0.45 };
    localHeatGroup.add(thermalRing2);

    // Heat convection dome / shimmer pillar
    const heatShimmerPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.07, 0.28, 16),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending })
    );
    heatShimmerPillar.geometry.translate(0, 0.14, 0);
    localHeatGroup.add(heatShimmerPillar);

    localHeatGroup.visible = false;
    earthSpinGroup.add(localHeatGroup);
    localHeatGroupRef.current = localHeatGroup;

    // 13. Target Reticle Beacon for selected country or place
    const targetBeaconGroup = new THREE.Group();
    const targetRing1 = new THREE.Mesh(
      new THREE.RingGeometry(0.035, 0.055, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    targetRing1.rotateX(-Math.PI / 2);
    targetBeaconGroup.add(targetRing1);

    const targetRing2 = new THREE.Mesh(
      new THREE.RingGeometry(0.07, 0.085, 32),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
    );
    targetRing2.rotateX(-Math.PI / 2);
    targetBeaconGroup.add(targetRing2);

    const targetBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.02, 0.35, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
    );
    targetBeam.geometry.translate(0, 0.175, 0);
    targetBeaconGroup.add(targetBeam);

    targetBeaconGroup.visible = false;
    earthSpinGroup.add(targetBeaconGroup);
    targetBeaconGroupRef.current = targetBeaconGroup;

    // 14. Climate Hotspot Pins & Heatmap Anomalies
    const pinsGroup = new THREE.Group();
    const heatmapsGroup = new THREE.Group();
    const vectorsGroup = new THREE.Group();
    const clickableMeshes: THREE.Mesh[] = [];

    regions.forEach((region) => {
      const pos = latLngToVector3(region.lat, region.lng, 2.0);
      const normal = pos.clone().normalize();

      const pinSubGroup = new THREE.Group();
      pinSubGroup.userData = { regionId: region.id, region };
      pinSubGroup.position.copy(pos);
      pinSubGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      const stemGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.22, 12);
      stemGeo.translate(0, 0.11, 0);
      const stemMat = new THREE.MeshBasicMaterial({ color: region.color });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      pinSubGroup.add(stemMesh);

      const headGeo = new THREE.SphereGeometry(0.045, 16, 16);
      headGeo.translate(0, 0.23, 0);
      const headMat = new THREE.MeshBasicMaterial({ color: region.color });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.userData = { regionId: region.id, region };
      clickableMeshes.push(headMesh);
      pinSubGroup.add(headMesh);

      // Smooth invisible hit area sphere to make hover detection responsive & effortless
      const hitGeo = new THREE.SphereGeometry(0.11, 8, 8);
      hitGeo.translate(0, 0.22, 0);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.userData = { regionId: region.id, region };
      clickableMeshes.push(hitMesh);
      pinSubGroup.add(hitMesh);

      const ringGeo = new THREE.RingGeometry(0.03, 0.07, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: region.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.userData = { isPulseRing: true, baseScale: 1.0 };
      pinSubGroup.add(ringMesh);

      const isInitialVisible = stateRef.current.visibleHotspotIds?.[region.id] ?? true;
      pinSubGroup.visible = isInitialVisible && stateRef.current.layers.pins;
      pinsGroup.add(pinSubGroup);

      const heatGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const heatMat = new THREE.MeshBasicMaterial({
        color: region.color,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const heatMesh = new THREE.Mesh(heatGeo, heatMat);
      heatMesh.position.copy(pos.clone().multiplyScalar(1.002));
      heatMesh.userData = { regionId: region.id, baseScale: 1.0 };
      heatMesh.visible = isInitialVisible && stateRef.current.layers.heatmaps;
      heatmapsGroup.add(heatMesh);
    });

    // 15. AI Coupling Arcs
    const arcConnections = [
      ['arctic-sea-ice', 'greenland-ice-sheet'],
      ['greenland-ice-sheet', 'north-atlantic-sst'],
      ['north-atlantic-sst', 'sahara-sahel'],
      ['amazon-basin', 'california-sierra'],
      ['antarctic-pine-island', 'great-barrier-reef'],
      ['tibetan-plateau', 'arctic-sea-ice'],
    ];

    arcConnections.forEach(([fromId, toId]) => {
      const fromReg = regions.find((r) => r.id === fromId);
      const toReg = regions.find((r) => r.id === toId);
      if (fromReg && toReg) {
        const v1 = latLngToVector3(fromReg.lat, fromReg.lng, 2.0);
        const v2 = latLngToVector3(toReg.lat, toReg.lng, 2.0);
        const mid = v1.clone().add(v2).multiplyScalar(0.5);
        const dist = v1.distanceTo(v2);
        mid.normalize().multiplyScalar(2.0 + dist * 0.35);

        const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
        const arcPoints = curve.getPoints(36);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
        const arcMat = new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
        });
        const arcLine = new THREE.Line(arcGeo, arcMat);
        vectorsGroup.add(arcLine);
      }
    });

    earthSpinGroup.add(pinsGroup);
    earthSpinGroup.add(heatmapsGroup);
    earthSpinGroup.add(vectorsGroup);

    pinsGroupRef.current = pinsGroup;
    heatmapsGroupRef.current = heatmapsGroup;
    vectorsGroupRef.current = vectorsGroup;

    // 16. Raycasting Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getActiveClickableMeshes = () => {
      if (!stateRef.current.layers.pins) return [];
      return clickableMeshes.filter((m) => {
        const regId = m.userData?.regionId;
        return regId ? stateRef.current.visibleHotspotIds?.[regId] ?? true : true;
      });
    };

    let pointerDownTime = 0;
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (event: MouseEvent) => {
      pointerDownTime = performance.now();
      pointerDownPos = { x: event.clientX, y: event.clientY };
    };

    const onPointerUp = (event: MouseEvent) => {
      const duration = performance.now() - pointerDownTime;
      const distMoved = Math.hypot(event.clientX - pointerDownPos.x, event.clientY - pointerDownPos.y);
      if (duration > 400 || distMoved > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const activePinMeshes = getActiveClickableMeshes();
      const pinIntersects = raycaster.intersectObjects(activePinMeshes, false);

      if (pinIntersects.length > 0) {
        const hit = pinIntersects[0].object;
        const region = hit.userData.region as ClimateRegion;
        if (region) {
          soundFx.playBlip(980);
          onSelectRegion(region);
          return;
        }
      }

      // Raycast on Earth surface
      const earthIntersects = raycaster.intersectObject(earthMesh, false);
      if (earthIntersects.length > 0 && onSelectCoordinates) {
        const hitPoint = earthIntersects[0].point;
        const localPoint = earthMesh.worldToLocal(hitPoint.clone());
        const { lat, lng } = vector3ToLatLng(localPoint);
        soundFx.playBlip(840);
        onSelectCoordinates(Number(lat.toFixed(2)), Number(lng.toFixed(2)));
      }
    };

    const onPointerMove = (event: MouseEvent) => {
      // If user is holding mouse button (orbiting/dragging globe), skip raycast to maintain silky 60+ FPS!
      if (event.buttons !== 0) {
        if (stateRef.current.hoveredRegionId) {
          stateRef.current.hoveredRegionId = null;
          setHoveredHotspot(null);
        }
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const activeMeshes = getActiveClickableMeshes();
      const intersects = raycaster.intersectObjects(activeMeshes, false);

      if (intersects.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
        const hitRegion = intersects[0].object.userData.region as ClimateRegion | undefined;
        const hitId = intersects[0].object.userData.regionId;
        if (stateRef.current.hoveredRegionId !== hitId) {
          stateRef.current.hoveredRegionId = hitId;
          soundFx.playBlip(720);
        }
        if (hitRegion) {
          setHoveredHotspot({
            name: hitRegion.name,
            color: hitRegion.color,
            x: event.clientX,
            y: event.clientY,
          });
        }
      } else {
        renderer.domElement.style.cursor = 'grab';
        stateRef.current.hoveredRegionId = null;
        setHoveredHotspot(null);
      }
    };

    const onPointerLeave = () => {
      renderer.domElement.style.cursor = 'grab';
      stateRef.current.hoveredRegionId = null;
      setHoveredHotspot(null);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    // 17. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      controls.maxDistance = w < 768 ? 45.0 : 9.0;
    };
    window.addEventListener('resize', handleResize);

    // What this does: Runs every animation frame (~60 times a second) to move sunlight, spin the Earth, animate pin pulses, fly the camera, fly the rocket, and draw the 3D frame.
    // On the website: Keeps the 3D planet, clouds, heat ripples, and rocket smoothly alive in real time.
    // Used as: The continuous requestAnimationFrame render loop.
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const now = performance.now();

      // Seasonal solar declination (June solstice +23.44°, Dec solstice -23.44°)
      const solarDeclination = -23.44 * Math.cos(((stateRef.current.month - 0.5) / 12) * Math.PI * 2);
      const decRad = THREE.MathUtils.degToRad(solarDeclination);
      const sunDist = 14.0;
      sunLight.position.set(
        sunDist * Math.cos(decRad) * Math.cos(Math.PI * 0.25),
        sunDist * Math.sin(decRad),
        sunDist * Math.cos(decRad) * Math.sin(Math.PI * 0.25)
      );
      const sunDir = sunLight.position.clone().normalize();

      // Update Shader time & solar uniforms
      if (thermalShaderMat) thermalShaderMat.uniforms.u_time.value = elapsed;
      if (holoMat) holoMat.uniforms.u_time.value = elapsed;
      if (atmosphereMat) {
        atmosphereMat.uniforms.u_time.value = elapsed;
        atmosphereMat.uniforms.u_sunDirection.value.copy(sunDir);
      }
      if (nightShaderMat) {
        nightShaderMat.uniforms.u_time.value = elapsed;
        nightShaderMat.uniforms.u_sunDirection.value.copy(sunDir);
      }
      if (auroraMatRef.current) {
        auroraMatRef.current.uniforms.u_time.value = elapsed;
        auroraMatRef.current.uniforms.u_sunDirection.value.copy(sunDir);
      }

      // Update Subsolar Zenith Point Marker position
      if (graticuleGroupRef.current) {
        const subsolarReticle = graticuleGroupRef.current.getObjectByName('subsolarReticle');
        if (subsolarReticle) {
          const subsolarLatRad = THREE.MathUtils.degToRad(solarDeclination);
          const subY = 2.008 * Math.sin(subsolarLatRad);
          const subR = 2.008 * Math.cos(subsolarLatRad);
          subsolarReticle.position.set(0, subY, subR);
        }
      }

      // Atmospheric cloud gentle drift
      if (cloudMesh && cloudMesh.visible) {
        cloudMesh.rotation.y += delta * 0.022;
      }

      // 3-SECOND HIGH-SPEED REVOLVING ANIMATION or CONTINUOUS TIMELINE PLAYBACK REVOLVING
      let rotationDelta = 0;
      if (stateRef.current.isPlayingTimeline) {
        // Continuous steady revolving during timeline playback so user sees thermal heat changes evolve
        rotationDelta = delta * 0.45;
      } else if (now < warpEndTimeRef.current) {
        // Active 3-second rapid rotation on manual year jump
        const t = 1.0 - (warpEndTimeRef.current - now) / 3000.0; // 0 to 1
        // Smooth sine acceleration peaking at middle (over 115x planetary speed)
        const warpMultiplier = 1.0 + Math.sin(t * Math.PI) * 115.0;
        rotationDelta = delta * 0.14 * warpMultiplier;

        // Enhance hologram scanline speed during warp
        if (holoMat) holoMat.uniforms.u_scanlineIntensity.value = 1.0 + Math.sin(t * Math.PI) * 1.2;
      } else {
        if (isWarpingActiveRef.current) {
          isWarpingActiveRef.current = false;
          if (onWarpStateChange) onWarpStateChange(false);
          if (holoMat) holoMat.uniforms.u_scanlineIntensity.value = 0.8;
        }

        if (stateRef.current.autoRotate && !stateRef.current.isCameraFlying) {
          rotationDelta = delta * 0.08 * stateRef.current.rotationSpeed;
        }
      }

      if (rotationDelta !== 0) {
        earthSpinGroup.rotation.y += rotationDelta;
      }

      // Smooth Camera Fly-To with exponential damping
      if (stateRef.current.isCameraFlying) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 3.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 3.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 3.5, delta);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetLookAt.x, 4.0, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetLookAt.y, 4.0, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetLookAt.z, 4.0, delta);

        if (camera.position.distanceTo(_targetCamPos) < 0.08) {
          stateRef.current.isCameraFlying = false;
        }
      }

      // Subtle scaling animation for the hotspot icons on EarthGlobe when user hovers over them
      pinsGroup.children.forEach((pinGroup) => {
        const regId = pinGroup.userData?.regionId;
        const isHovered = Boolean(regId && stateRef.current.hoveredRegionId === regId);
        const isSelected = Boolean(regId && stateRef.current.selectedLocation?.id === regId);

        // Target scale: 1.35x when hovered (smooth 35% interactive feedback bounce), 1.15x when selected, 1.0x default
        const targetScale = isHovered ? 1.35 : (isSelected ? 1.15 : 1.0);
        const currentScale = pinGroup.scale.x;
        const newScale = THREE.MathUtils.damp(currentScale, targetScale, 14.0, delta);
        pinGroup.scale.set(newScale, newScale, newScale);
      });

      // Pulse pin rings & heatmaps
      const pulse = 1.0 + Math.sin(elapsed * 3.5) * 0.28;
      pinsGroup.traverse((child) => {
        if (child.userData && child.userData.isPulseRing) {
          child.scale.set(pulse, pulse, pulse);
        }
      });

      // Animate Localized Heat Ripple Effects on the Chosen Place
      if (localHeatGroup.visible) {
        // Ripple 1
        const r1Phase = (elapsed * 2.2) % 1.0;
        const r1Scale = 0.5 + r1Phase * 2.2;
        thermalRing1.scale.set(r1Scale, r1Scale, r1Scale);
        (thermalRing1.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1.0 - r1Phase));

        // Ripple 2
        const r2Phase = (elapsed * 2.2 + 0.5) % 1.0;
        const r2Scale = 0.5 + r2Phase * 2.6;
        thermalRing2.scale.set(r2Scale, r2Scale, r2Scale);
        (thermalRing2.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 * (1.0 - r2Phase));

        // Heat Shimmer Pillar height breathing
        const pillarBreathing = 1.0 + Math.sin(elapsed * 4.5) * 0.25;
        heatShimmerPillar.scale.set(1.0, pillarBreathing, 1.0);
      }

      // Target reticle pulse
      if (targetBeaconGroup.visible) {
        const reticleScale = 1.0 + Math.sin(elapsed * 4.0) * 0.15;
        targetRing2.scale.set(reticleScale, reticleScale, reticleScale);
      }

      // Regional heat anomaly domes pulse with subtle hover expansion
      const aiBoost = stateRef.current.isAiPrediction ? 1.5 : 1.0;
      heatmapsGroup.children.forEach((mesh, idx) => {
        const regId = mesh.userData?.regionId;
        const isHovered = Boolean(regId && stateRef.current.hoveredRegionId === regId);
        const hoverScaleBoost = isHovered ? 1.25 : 1.0;
        const offsetPulse = (1.0 + Math.sin(elapsed * 2.8 + idx) * 0.3 * aiBoost) * hoverScaleBoost;
        const curScale = mesh.scale.x;
        const smoothed = THREE.MathUtils.damp(curScale, offsetPulse, 12.0, delta);
        mesh.scale.set(smoothed, smoothed, smoothed);
      });

      // AI Vectors pulse opacity
      if (vectorsGroup.visible) {
        vectorsGroup.children.forEach((line) => {
          const mat = (line as THREE.Line).material as THREE.LineBasicMaterial;
          mat.opacity = 0.35 + Math.sin(elapsed * 4.0) * 0.25;
        });
      }

      // 19. Animate 3D Cartoon Rocket Space Descent (5 Seconds duration) & Touchdown
      if (meteoroidRef.current && meteoroidRef.current.group.visible) {
        const { group, rocketMesh, plasmaSheath, outerFireTail, innerFireTail, smokeParticles, impactWaveRing, craterBeacon, flightState } = meteoroidRef.current;
        const flightElapsed = now - flightState.flightStartTime;
        const t = Math.min(1.0, flightElapsed / flightState.flightDuration);

        // Smooth cubic ease-in-out gravitation plunge from deep space into Earth (5.0s)
        const easeT = t * t * (3.0 - 2.0 * t);

        if (t < 1.0) {
          // 1. In-flight: hurtling from deep space towards the chosen place over 5 full seconds
          _meteorCurrentPos.copy(flightState.startPos).lerp(flightState.targetPos, easeT);
          // Parabolic entry curve for celestial swoop
          const arc = Math.sin(t * Math.PI) * 0.85;
          _meteorCurrentPos.addScaledVector(flightState.targetNormal, arc);
          group.position.copy(_meteorCurrentPos);

          // Calculate forward direction vector
          const nextT = Math.min(1.0, t + 0.015);
          const nextEaseT = nextT * nextT * (3.0 - 2.0 * nextT);
          _meteorNextPos.copy(flightState.startPos).lerp(flightState.targetPos, nextEaseT);
          _meteorNextPos.addScaledVector(flightState.targetNormal, Math.sin(nextT * Math.PI) * 0.85);
          _meteorFlightDir.copy(_meteorNextPos).sub(_meteorCurrentPos).normalize();

          // Align the rocket along its flight trajectory
          if (_meteorFlightDir.lengthSq() > 0.001) {
            _meteorFlightQuat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _meteorFlightDir);
            group.quaternion.copy(_meteorFlightQuat);
          }

          // Gentle rocket body roll
          rocketMesh.rotation.y += delta * 3.5;

          // Blazing thruster exhaust flames flicker vigorously
          const flameFlicker = 1.0 + Math.sin(elapsed * 32.0) * 0.3;
          outerFireTail.scale.set(1.0, flameFlicker, 1.0);
          innerFireTail.scale.set(1.0, flameFlicker * 1.15, 1.0);

          // Atmospheric entry plasma sheath glows especially at t >= 0.5 (re-entry)
          const reEntryGlow = Math.max(0, Math.sin(t * Math.PI));
          (plasmaSheath.material as THREE.MeshBasicMaterial).opacity = reEntryGlow * 0.55;

          // Smoke particle cloud trail
          smokeParticles.rotation.y += delta * 5.0;
        } else {
          // 2. Touchdown at the chosen place on Earth at 5.0 seconds!
          if (!flightState.hasImpacted) {
            flightState.hasImpacted = true;
            flightState.impactTime = now;
            soundFx.playMeteorImpact();
          }

          const impactElapsed = now - flightState.impactTime;
          group.position.copy(flightState.targetPos);
          group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), flightState.targetNormal);

          // Turn off thruster fire upon touchdown
          outerFireTail.visible = false;
          innerFireTail.visible = false;
          plasmaSheath.visible = false;

          // Expanding touchdown shockwave ring
          if (impactElapsed < 1200) {
            const shockT = impactElapsed / 1200;
            const shockScale = 0.5 + shockT * 4.0;
            impactWaveRing.scale.set(shockScale, shockScale, shockScale);
            (impactWaveRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1.0 - shockT);
            impactWaveRing.visible = true;
          } else {
            impactWaveRing.visible = false;
          }

          // Beacon resting upright at touchdown site
          craterBeacon.visible = true;
          (craterBeacon.material as THREE.MeshStandardMaterial).opacity = 0.85;

          // Rocket perched upright on the ground
          rocketMesh.rotation.y += delta * 0.8;
          rocketMesh.scale.set(0.9, 0.9, 0.9);
        }
      }

      controls.update();
      renderer.render(scene, camera);

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      controls.dispose();

      starsGeo.dispose();
      starsMat.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      if (earthMat.map) earthMat.map.dispose();
      thermalGeo.dispose();
      thermalShaderMat.dispose();
      holoGeo.dispose();
      holoMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      if (cloudMat.map) cloudMat.map.dispose();
      nightShaderMat.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();

      if (meteoroidRef.current) {
        meteoroidRef.current.group.traverse((obj: THREE.Object3D) => {
          if ((obj as THREE.Mesh).isMesh || (obj as THREE.Points).isPoints) {
            const m = obj as THREE.Mesh;
            if (m.geometry) m.geometry.dispose();
            if (m.material) {
              if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
              else m.material.dispose();
            }
          }
        });
      }

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [regions, onSelectRegion, onSelectCoordinates, onWarpStateChange]);

  return (
    <div
      ref={mountRef}
      data-tutorial="earth-globe"
      style={{ touchAction: 'none' }}
      className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing touch-none select-none"
    >
      {/* Mobile-Only Quick Planet Size (+/-) Controls so user can shrink/enlarge freely */}
      <div className="flex md:hidden fixed right-1.5 top-1/2 -translate-y-1/2 z-10 flex-col gap-0.5 p-0.5 rounded-lg bg-slate-950/75 backdrop-blur-md border border-slate-800/80 shadow-lg">
        <button
          type="button"
          onClick={() => handleMobileZoom(0.8)}
          className="w-6 h-6 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 flex items-center justify-center cursor-pointer active:scale-95"
          title="Zoom in planet"
          aria-label="Zoom in planet"
        >
          <ZoomIn className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => handleMobileZoom(1.25)}
          className="w-6 h-6 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 flex items-center justify-center cursor-pointer active:scale-95"
          title="Make planet smaller"
          aria-label="Make planet smaller"
        >
          <ZoomOut className="w-3 h-3" />
        </button>
      </div>

      {hoveredHotspot && (
        <div
          style={{
            left: hoveredHotspot.x + 14,
            top: hoveredHotspot.y - 14,
          }}
          className="pointer-events-none fixed z-30 px-2.5 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 text-[11px] font-mono font-bold text-white shadow-2xl flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100 select-none"
        >
          <span
            className="w-2 h-2 rounded-full shrink-0 animate-ping"
            style={{ backgroundColor: hoveredHotspot.color }}
          />
          <span>{hoveredHotspot.name}</span>
        </div>
      )}
    </div>
  );
};
