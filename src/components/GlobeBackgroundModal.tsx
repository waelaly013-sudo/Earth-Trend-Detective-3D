/**
 * NASA Earth Trend Detective - Globe Background Settings Sub-Modal
 * Allows users to toggle between different Earth visual styles:
 * 'Blue Marble', 'Night Lights', 'Topographic Map', and 'Thermal IR Radar'
 * while strictly maintaining the circular 3D globe aesthetic and spherical raycasting.
 */

import React from 'react';
import {
  X,
  Globe,
  Moon,
  Mountain,
  Radio,
  Sliders,
  Sparkles,
  Sun,
  Cloud,
  Eye,
  Check,
  RotateCcw,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { GlobeStyle, GlobeSettings } from '../types/climate';
import { soundFx } from '../utils/audioSynth';

// What this does: Lists the open state, current globe visual settings, update callback, and reset callback.
// On the website: Connects the globe customization controls directly to the live 3D Earth appearance.
// Used as: The props interface for GlobeBackgroundModal.
interface GlobeBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlobeSettings;
  onUpdateSettings: (newSettings: GlobeSettings) => void;
  onResetSettings: () => void;
}

// What this does: Sets the starting visual settings for the 3D Earth globe when the app first loads or resets.
// On the website: Displays the classic Blue Marble globe with balanced clouds, sunlight, blue rim glow, and coordinate lines.
// Used as: The default fallback configuration for Earth visual settings.
export const DEFAULT_GLOBE_SETTINGS: GlobeSettings = {
  style: 'blue-marble',
  cloudOpacity: 0.85,
  atmosphereGlowColor: '#38bdf8',
  atmosphereGlowIntensity: 1.0,
  starDensity: 'medium',
  sunIntensity: 1.75,
  showGraticule: true,
};

// What this does: Describes the layout and metadata for each selectable Earth surface theme card.
// On the website: Holds the title, badge, colors, icon, and description shown on every visual style button.
// Used as: The data structure for items in STYLE_OPTIONS.
interface StyleOption {
  id: GlobeStyle;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  palette: string[];
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

// What this does: Stores the four selectable 3D globe visual themes (Blue Marble, Night Lights, Topographic, Thermal Radar).
// On the website: Populates the 4 Earth style cards inside the Globe Background Settings dialog.
// Used as: The preset catalog of Earth visual appearances.
const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'blue-marble',
    name: 'Blue Marble',
    badge: 'NASA Daytime',
    tagline: 'Photorealistic True-Color Planet',
    description: 'Realistic daytime planetary imagery with deep blue bathymetric oceans, lush continental biomes, and dynamic cloud systems.',
    palette: ['#072752', '#1d5a2d', '#a5793f', '#e2e8f0'],
    icon: Globe,
    features: ['Real NASA MODIS Surface Textures', 'Dynamic Polar Ice Sheet Shrinkage', 'Rayleigh Atmospheric Blue Rim Glow'],
  },
  {
    id: 'night-lights',
    name: 'Night Lights',
    badge: 'Black Marble',
    tagline: 'Nocturnal Urban Energy Grid',
    description: 'NASA Earth at Night observational telemetry showcasing illuminated metropolitan centers, human settlement corridors, and dark oceanic abysses.',
    palette: ['#020617', '#1e293b', '#f59e0b', '#fbbf24'],
    icon: Moon,
    features: ['Urban Night Lights Radiance', 'Deep Cosmic Contrast', 'Low Light Light-Pollution Mapping'],
  },
  {
    id: 'topographic',
    name: 'Topographic Map',
    badge: 'USGS / GEBCO',
    tagline: 'Hypsometric Elevation & Bathymetry',
    description: 'Scientific elevation relief tinting from deep oceanic trenches to emerald coastal lowlands, highland ochre plateaus, and glaciated alpine summits.',
    palette: ['#051b3a', '#255e34', '#be9548', '#ffffff'],
    icon: Mountain,
    features: ['Hypsometric Elevation Tints', 'Geodetic Graticule Parallels (15°/30°)', 'Shaded Mountain Ridge Contours'],
  },
  {
    id: 'thermal-radar',
    name: 'Thermal IR Radar',
    badge: 'Multi-Spectral',
    tagline: 'Synthetic Aperture Radar & IR',
    description: 'False-color radiometric surface telemetry and radar backscatter highlighting land-surface dielectric properties and convective heat dynamics.',
    palette: ['#060417', '#06b6d4', '#d946ef', '#f43f5e'],
    icon: Radio,
    features: ['Thermal Radiometric Signatures', 'Radar Backscatter Emissivity', 'Multi-Spectral False Color Banding'],
  },
];

// What this does: Lists the five preset rim-glow colors users can pick for Earth's outer atmosphere ring.
// On the website: Renders the row of colored circular buttons under "Atmospheric Rim Glow".
// Used as: The preset color choices for the globe atmosphere glow.
const GLOW_COLORS = [
  { label: 'Cyan Blue', value: '#38bdf8', ring: 'border-cyan-400' },
  { label: 'Deep Ocean', value: '#0284c7', ring: 'border-blue-500' },
  { label: 'Aurora Emerald', value: '#10b981', ring: 'border-emerald-400' },
  { label: 'Solar Amber', value: '#f59e0b', ring: 'border-amber-400' },
  { label: 'Cosmic Violet', value: '#a855f7', ring: 'border-purple-400' },
];

// What this does: Renders a modal window to customize the 3D Earth's surface style, clouds, sun brightness, stars, and grid lines.
// On the website: Shows interactive style cards, sliders, color swatches, and a grid toggle that update the 3D globe live.
// Used as: The visual customization panel for the 3D globe background and atmosphere.
export const GlobeBackgroundModal: React.FC<GlobeBackgroundModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  if (!isOpen) return null;

  // What this does: Updates the selected surface visual theme on the 3D Earth.
  // On the website: Switches the planet's surface texture style when a theme card is clicked.
  // Used as: Click handler for the four Earth style cards.
  const handleSelectStyle = (style: GlobeStyle) => {
    soundFx.playTick();
    onUpdateSettings({
      ...settings,
      style,
    });
  };

  // What this does: Adjusts how visible or transparent the cloud layer appears around the 3D globe.
  // On the website: Makes Earth's clouds look thicker or clearer as the user drags the Cloud Layer slider.
  // Used as: Change handler for the cloud opacity slider.
  const handleCloudOpacityChange = (val: number) => {
    onUpdateSettings({
      ...settings,
      cloudOpacity: val,
    });
  };

  // What this does: Adjusts the brightness of sunlight shining on the 3D globe.
  // On the website: Makes the daytime side of Earth look softer or brighter as the user moves the Sun Intensity slider.
  // Used as: Change handler for the daylight sun intensity slider.
  const handleSunIntensityChange = (val: number) => {
    onUpdateSettings({
      ...settings,
      sunIntensity: val,
    });
  };

  // What this does: Changes the color of the glowing atmospheric halo around Earth.
  // On the website: Updates the colored rim aura around the 3D planet when a color dot is clicked.
  // Used as: Click handler for the atmospheric rim glow color buttons.
  const handleGlowColorChange = (hex: string) => {
    soundFx.playTick();
    onUpdateSettings({
      ...settings,
      atmosphereGlowColor: hex,
    });
  };

  // What this does: Switches how many background stars appear in deep space around Earth.
  // On the website: Changes the space backdrop between Low, Medium, and High star counts.
  // Used as: Click handler for the starfield density selector buttons.
  const handleStarDensityChange = (density: 'low' | 'medium' | 'high') => {
    soundFx.playTick();
    onUpdateSettings({
      ...settings,
      starDensity: density,
    });
  };

  // What this does: Turns the latitude and longitude coordinate grid lines on or off on the globe.
  // On the website: Shows or hides the map grid lines wrapped around Earth when the Grid button is clicked.
  // Used as: Toggle handler for the Geodetic Graticule Grid switch.
  const handleToggleGraticule = () => {
    soundFx.playTick();
    onUpdateSettings({
      ...settings,
      showGraticule: !settings.showGraticule,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900/95 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Sliders className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-heading tracking-wide">
                  Globe Background Settings
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono font-semibold">
                  3D Spherical Visual Styles
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Switch Earth surface shaders, lighting rigs, and atmospheric layers while maintaining the circular globe aesthetic.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Circular Globe Guarantee Notice */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900/40 border border-cyan-500/30 text-xs">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-cyan-300 flex items-center gap-2">
                <span>Circular Globe Aesthetic Preserved</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-200 font-mono">100% Sphere Mapping</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                All visual styles are rendered onto the Three.js 3D geodetic sphere. Lat/Lng pins, heatmaps, touch-orbit controls, and country raycasting remain pixel-perfect and mathematically synchronized.
              </p>
            </div>
          </div>

          {/* Section 1: Earth Visual Style Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. Select Earth Visual Style</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                Active: <span className="text-cyan-300 font-bold capitalize">{settings.style.replace('-', ' ')}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STYLE_OPTIONS.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = settings.style === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectStyle(opt.id)}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-950/80 via-slate-900 to-slate-950 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                        : 'bg-slate-950/70 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    {/* Top Row: Icon + Name + Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-xl transition-colors ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            <span>{opt.name}</span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-cyan-400" />
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {opt.tagline}
                          </div>
                        </div>
                      </div>

                      <span className="text-[9px] px-2 py-0.5 rounded-md font-mono font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/60 shrink-0">
                        {opt.badge}
                      </span>
                    </div>

                    {/* Middle: Description */}
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {opt.description}
                    </p>

                    {/* Palette Bar & Key Feature */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {opt.palette.map((hex, i) => (
                          <span
                            key={i}
                            className="w-3 h-3 rounded-full border border-slate-900 shadow-sm"
                            style={{ backgroundColor: hex }}
                            title={hex}
                          />
                        ))}
                      </div>

                      <span className="text-[10px] font-mono text-cyan-300/80 truncate">
                        {opt.features[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Atmosphere & Lighting Fine-Tuning */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Atmosphere & Lighting Fine-Tuning</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* Cloud Layer Opacity */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cloud Layer Blend</span>
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {Math.round(settings.cloudOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.cloudOpacity}
                  onChange={(e) => handleCloudOpacityChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>Clear (0%)</span>
                  <span>Photorealistic (85%)</span>
                  <span>Dense (100%)</span>
                </div>
              </div>

              {/* Solar Sunlight Illumination */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Daylight Sun Intensity</span>
                  </span>
                  <span className="font-mono text-amber-300 font-bold">
                    {settings.sunIntensity.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={settings.sunIntensity}
                  onChange={(e) => handleSunIntensityChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>Soft (0.5x)</span>
                  <span>Natural (1.75x)</span>
                  <span>Radiant (2.5x)</span>
                </div>
              </div>

              {/* Atmosphere Glow Color */}
              <div className="space-y-2">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Atmospheric Rim Glow</span>
                </span>
                <div className="flex items-center gap-2">
                  {GLOW_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleGlowColorChange(c.value)}
                      className={`relative w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        settings.atmosphereGlowColor.toLowerCase() === c.value.toLowerCase()
                          ? `${c.ring} scale-110 shadow-[0_0_12px_${c.value}]`
                          : 'border-slate-700 hover:border-slate-500 opacity-80'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    >
                      {settings.atmosphereGlowColor.toLowerCase() === c.value.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Starfield Density */}
              <div className="space-y-2">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Cosmic Starfield Density</span>
                </span>
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  {(['low', 'medium', 'high'] as const).map((density) => (
                    <button
                      key={density}
                      onClick={() => handleStarDensityChange(density)}
                      className={`flex-1 py-1 px-2 rounded-lg border uppercase transition-colors cursor-pointer font-bold ${
                        settings.starDensity === density
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Geodetic Graticule Toggle */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Geodetic Graticule Grid</div>
                  <div className="text-[10px] text-slate-400">Display latitude (15°) and longitude (30°) parallels across the sphere</div>
                </div>
              </div>
              <button
                onClick={handleToggleGraticule}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  settings.showGraticule
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                {settings.showGraticule ? 'GRID ON' : 'GRID OFF'}
              </button>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800/80 bg-slate-950/80 shrink-0">
          <button
            onClick={() => {
              soundFx.playTick();
              onResetSettings();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playChime();
                onClose();
              }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Done</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
