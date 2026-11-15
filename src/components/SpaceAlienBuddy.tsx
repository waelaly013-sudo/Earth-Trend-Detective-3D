/**
 * NASA Earth Trend Detective - Space Alien Buddy & Catchy Cloud Tips
 * 
 * A friendly sci-fi alien that floats in space around the 3D Earth globe.
 * When clicked:
 * 1. Explodes in a sparkling cosmic stardust burst with pop sound effect.
 * 2. Reveals a small, simple speech cloud with a short, easy-to-read tip or joke in B1 English.
 * 3. Heavily focused on App Tips (how to use the timeline, globe, layers, keyboard shortcuts, etc.),
 *    plus Stay Safe, Earth Care, and Cosmic Jokes.
 * 4. Features category filter tabs inside the cloud so users can explore all app tricks.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sparkles, X, RefreshCw, Volume2, Compass, Layers, Clock, ShieldAlert, Heart, Laugh } from 'lucide-react';
import { soundFx } from '../utils/audioSynth';

export type TipCategory = 'app' | 'safe' | 'planet' | 'joke';

export interface CatchyAlienTip {
  id: string;
  category: TipCategory;
  categoryLabel: string;
  badgeEmoji: string;
  badgeColor: string;
  title: string;
  message: string;
}

// What this does: Holds 50+ short tips about how to use the app, health & safety tips, Earth care habits, and space jokes.
// On the website: Provides the messages inside the speech cloud whenever the user clicks the floating space alien.
// Used as: The tip library for the floating Space Alien Buddy.
export const ALIEN_TIPS: CatchyAlienTip[] = [
  // =========================================================================
  // 1. HOW TO USE THE APP & NEW UPDATES
  // =========================================================================
  {
    id: 'app-purple-prediction',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🟣',
    badgeColor: 'border-violet-400/50 text-violet-300 bg-violet-950/60',
    title: 'Purple AI Prediction Line',
    message: 'See the glowing purple (#8b5cf6) section on the timeline? That shows future AI predictions after Nov 2026!',
  },
  {
    id: 'app-mobile-more-menu',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '📱',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: 'Mobile "More" Menu',
    message: 'On mobile phones, Explore, Science, Reports, and Mission are neatly tucked inside the "More" button to keep your screen open!',
  },
  {
    id: 'app-mobile-compact-header',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🎛️',
    badgeColor: 'border-teal-400/50 text-teal-300 bg-teal-950/60',
    title: 'Compact Mobile Quick Bar',
    message: 'On mobile, Temperature, Humidity, and Wind sit right beside NASA Earth Apps—plus tiny logo icons switch °C units and language!',
  },
  {
    id: 'app-visual-places-shortcut',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🌾',
    badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-950/60',
    title: 'Visual Places (Farm & Polar)',
    message: 'Tap the compact Visual Places button to jump straight into the Farm crop or Polar ice simulator and see warming in action!',
  },
  {
    id: 'app-show-timeline-mobile',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '📊',
    badgeColor: 'border-purple-400/50 text-purple-300 bg-purple-950/60',
    title: 'Show & Hide Timeline on Mobile',
    message: 'Tap "Show Timeline" or "Hide Timeline" at the bottom on mobile to see the full colored line cleanly without crowding the globe!',
  },
  {
    id: 'app-resize-globe-mobile',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🤏',
    badgeColor: 'border-sky-400/50 text-sky-300 bg-sky-950/60',
    title: 'Shrink Earth As You Like',
    message: 'Pinch with two fingers or scroll to make the 3D planet as small or big as you want—perfect for one-hand mobile exploring!',
  },
  {
    id: 'app-mobile-country-preview',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '📋',
    badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60',
    title: 'Roomy Mobile Country Data',
    message: 'Tap any country on mobile to open a neat, compact data card sized to show more charts and facts at a single glance!',
  },
  {
    id: 'app-question-mark-help',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '❓',
    badgeColor: 'border-sky-400/50 text-sky-300 bg-sky-950/60',
    title: 'Quiet Start & "?" Guide',
    message: 'Mission Advisory stays closed when you launch so you jump right in! Tap the "?" button anytime for help or the App Guide.',
  },
  {
    id: 'app-phoenix-alien-tour',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🔥',
    badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60',
    title: 'Phoenix Intro & Guided Tour',
    message: 'New explorers get the Phoenix welcome video and a step-by-step Alien Tour right after signing up—replay the tour anytime in Mission!',
  },
  {
    id: 'app-slider-range',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '⏳',
    badgeColor: 'border-purple-400/50 text-purple-300 bg-purple-950/60',
    title: 'Timeline Range (2000–2040)',
    message: 'The timeline spans Jan 2000 to Dec 2040. Dates before Nov 2026 are real NASA records; dates after are AI predictions!',
  },
  {
    id: 'app-today-button',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '📍',
    badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60',
    title: 'Return to Today',
    message: 'Click the "Today (Nov 2026)" button on the timeline to return instantly to the current month anytime!',
  },
  {
    id: 'app-month-selector',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🗓️',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: 'Pick Any Month',
    message: 'Use the Month dropdown to see seasonal changes. Watch Arctic ice melt in July and freeze back in winter!',
  },
  {
    id: 'app-spacebar',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '⌨️',
    badgeColor: 'border-teal-400/50 text-teal-300 bg-teal-950/60',
    title: 'Spacebar Play & Pause',
    message: 'Press Space on your keyboard to play or pause the 4D timeline animation across the globe!',
  },
  {
    id: 'app-arrow-keys',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '⬅️',
    badgeColor: 'border-teal-400/50 text-teal-300 bg-teal-950/60',
    title: 'Arrow Keys Step 1 Month',
    message: 'Press the Left or Right arrow keys on your keyboard to jump forward or backward one month at a time.',
  },
  {
    id: 'app-shift-arrows',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '⏩',
    badgeColor: 'border-indigo-400/50 text-indigo-300 bg-indigo-950/60',
    title: 'Shift + Arrows Jump 1 Year',
    message: 'Hold the Shift key and press Left or Right arrow keys to jump a whole year (12 months) in one click!',
  },
  {
    id: 'app-home-end-keys',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🎯',
    badgeColor: 'border-blue-400/50 text-blue-300 bg-blue-950/60',
    title: 'Home & End Keys',
    message: 'Press Home on your keyboard to jump to Jan 2000, or press End to fly straight to the year 2040 horizon!',
  },
  {
    id: 'app-speed-buttons',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '⚡',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: 'Playback Speed (1x, 2x, 4x)',
    message: 'Click 1x, 2x, or 4x on the dock to speed up the timeline playback as years roll forward.',
  },
  {
    id: 'app-loop-playback',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🔁',
    badgeColor: 'border-purple-400/50 text-purple-300 bg-purple-950/60',
    title: 'Looping Animation',
    message: 'Click the circular repeat button in the dock to loop the simulation forever or stop at year 2040.',
  },
  {
    id: 'app-quick-jumps',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🚀',
    badgeColor: 'border-rose-400/50 text-rose-300 bg-rose-950/60',
    title: 'Quick Jump Buttons',
    message: 'Use the -10y, -1y, +1y, and +5y buttons to jump through time quickly. Buttons disable automatically at range limits!',
  },
  {
    id: 'app-hide-timeline',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🔽',
    badgeColor: 'border-slate-400/50 text-slate-300 bg-slate-900/60',
    title: 'Hide Timeline Tab',
    message: 'Click "Hide Timeline" at the top of the dock to collapse the panel and enjoy an open view of Earth.',
  },
  {
    id: 'app-spin-globe',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🌍',
    badgeColor: 'border-sky-400/50 text-sky-300 bg-sky-950/60',
    title: 'Rotate the 3D Globe',
    message: 'Click and drag anywhere on the space background or Earth with your mouse or finger to spin our planet!',
  },
  {
    id: 'app-zoom-globe',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🔍',
    badgeColor: 'border-sky-400/50 text-sky-300 bg-sky-950/60',
    title: 'Zoom In & Out',
    message: 'Scroll your mouse wheel or pinch your touchscreen to zoom in close on any country or ocean.',
  },
  {
    id: 'app-auto-spin',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🔄',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: 'Auto-Spin Toggle',
    message: 'Click the circular arrow icon in the dock to pause or resume Earth\'s automatic space rotation.',
  },
  {
    id: 'app-camera-reset',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🧭',
    badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-950/60',
    title: 'Reset Camera View',
    message: 'Click the Compass icon in the dock anytime to reset Earth back to its original prime center view.',
  },
  {
    id: 'app-branches-switcher',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🔀',
    badgeColor: 'border-teal-400/50 text-teal-300 bg-teal-950/60',
    title: '3 Data Branches',
    message: 'Click Temperature, Humidity, or Wind at the top to explore 3 different Earth observation systems!',
  },
  {
    id: 'app-wind-branch',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '💨',
    badgeColor: 'border-teal-400/50 text-teal-300 bg-teal-950/60',
    title: 'Wind & Kinetic Power',
    message: 'In the Wind branch, inspect Beaufort wind speeds, hurricane gusts, and wind turbine power density from NASA CYGNSS.',
  },
  {
    id: 'app-humidity-branch',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '💧',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: 'Moisture & Droughts',
    message: 'In the Humidity branch, track atmospheric drying, vapor deficit, and wet-bulb temperatures from NASA AIRS.',
  },
  {
    id: 'app-temp-branch',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🌡️',
    badgeColor: 'border-rose-400/50 text-rose-300 bg-rose-950/60',
    title: 'Surface Temperature',
    message: 'In the Temperature branch, see real Celsius heat readings and long-term thermal anomalies across 40 years.',
  },
  {
    id: 'app-quick-layers',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🎛️',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: 'Climate Layers Drawer',
    message: 'Click the Sliders icon in the dock to open the Layers drawer. Turn clouds, night lights, and heatmaps on or off!',
  },
  {
    id: 'app-night-lights',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '✨',
    badgeColor: 'border-indigo-400/50 text-indigo-300 bg-indigo-950/60',
    title: 'City Night Lights',
    message: 'Turn on "Night Lights" in the Layers drawer to see glittering city lights on the dark night side of Earth!',
  },
  {
    id: 'app-clouds-layer',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '☁️',
    badgeColor: 'border-sky-400/50 text-sky-300 bg-sky-950/60',
    title: 'Planetary Cloud Shaders',
    message: 'Turn on the Clouds layer in the dock to view realistic cloud swirls revolving smoothly above the continents.',
  },
  {
    id: 'app-thermal-map',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🗺️',
    badgeColor: 'border-rose-400/50 text-rose-300 bg-rose-950/60',
    title: 'Global Heatmap Gradient',
    message: 'Toggle the Global Temp Map in Layers to see warm red and cool blue temperature anomaly gradients on the globe.',
  },
  {
    id: 'app-read-aloud',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🔊',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: 'Voice Telemetry',
    message: 'Click the "Read Aloud" button in the timeline dock to hear the date and climate report spoken by computer voice!',
  },
  {
    id: 'app-inspect-country',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🚩',
    badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60',
    title: 'Inspect Any Country',
    message: 'Click any country flag or land on the globe to open its forensic climate and weather sidebar.',
  },
  {
    id: 'app-search-country',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🔎',
    badgeColor: 'border-sky-400/50 text-sky-300 bg-sky-950/60',
    title: 'Search Any Country',
    message: 'Click the magnifying glass in the top bar to search for any country, city, or island. The camera flies there!',
  },
  {
    id: 'app-complexity-mode',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '📚',
    badgeColor: 'border-purple-400/50 text-purple-300 bg-purple-950/60',
    title: '3 Complexity Levels',
    message: 'Click "Complexity" in the top bar to choose Simple Mode (easy words), Normal Mode, or Researcher Mode.',
  },
  {
    id: 'app-simple-mode',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '💡',
    badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-950/60',
    title: 'Try Simple Mode',
    message: 'Simple Mode uses easy B1 English and colorful temperature bars so anyone can understand climate data quickly!',
  },
  {
    id: 'app-complicated-mode',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🔬',
    badgeColor: 'border-purple-400/50 text-purple-300 bg-purple-950/60',
    title: 'Researcher Mode',
    message: 'Complicated Mode reveals statistical Mann-Kendall p-values, satellite sensor names, and exact uncertainty intervals.',
  },
  {
    id: 'app-why-changing',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '✨',
    badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60',
    title: 'Why Is It Changing?',
    message: 'Open any place\'s sidebar and click "Why Changing?" to discover the physical causes of warming in that region.',
  },
  {
    id: 'app-ai-copilot',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🤖',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: 'NASA AI Copilot',
    message: 'Click "Ask AI Copilot" to chat with an AI scientist grounded in Google Search and NASA satellite maps.',
  },
  {
    id: 'app-field-notebook',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '📓',
    badgeColor: 'border-blue-400/50 text-blue-300 bg-blue-950/60',
    title: 'Scientific Field Notebook',
    message: 'Click the Notebook icon in the top bar to write and save your personal scientific notes for any coordinate.',
  },
  {
    id: 'app-human-reports',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '👥',
    badgeColor: 'border-yellow-400/50 text-yellow-300 bg-yellow-950/60',
    title: 'Human Field Reports',
    message: 'Open Human Reports to read real ground-truth stories from farmers, glaciologists, and observers (2022–2026).',
  },
  {
    id: 'app-daily-advice',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🌱',
    badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-950/60',
    title: 'Daily Eco Advice',
    message: 'Click the Eco Advice button to read customized climate lifestyle tips created specifically for your chosen country.',
  },
  {
    id: 'app-farm-simulator',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🚜',
    badgeColor: 'border-green-400/50 text-green-300 bg-green-950/60',
    title: 'Visual Climate Farm',
    message: 'Try the Visual Farm simulator from the top menu to see how crops and polar ice react to rising temperatures.',
  },
  {
    id: 'app-mission-guide',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '📖',
    badgeColor: 'border-sky-400/50 text-sky-300 bg-sky-950/60',
    title: 'NASA Mission Guide',
    message: 'Click the Mission Guide icon in the top bar anytime you want a complete dictionary of every button and feature.',
  },
  {
    id: 'app-export-report',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '📄',
    badgeColor: 'border-indigo-400/50 text-indigo-300 bg-indigo-950/60',
    title: 'Export NASA Report',
    message: 'Click "Export Report" in the menu to generate a complete scientific summary of planetary observations.',
  },
  {
    id: 'app-confidence-interval',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '📊',
    badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60',
    title: '95% Confidence Band',
    message: 'For future dates after Nov 2026, the app always displays a 95% confidence interval because future models have uncertainty.',
  },
  {
    id: 'app-baseline-comparison',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '📉',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: '2000-2010 Baseline',
    message: 'Look at the sidebar to see how many degrees warmer a month is compared to the 2000–2010 decadal average.',
  },
  {
    id: 'app-time-travel-2035',
    category: 'app',
    categoryLabel: 'App Tip',
    badgeEmoji: '🔮',
    badgeColor: 'border-purple-400/50 text-purple-300 bg-purple-950/60',
    title: 'Practice Mission: 2035',
    message: 'Drag the timeline to year 2035 to witness the simulated late-summer Arctic sea ice minimum and widening uncertainty cone!',
  },

  // =========================================================================
  // 2. HEALTH KEEP & SAFETY TIPS (B1 English, clear, practical & life-saving)
  // =========================================================================
  {
    id: 'health-water-hydration',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '💧',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: 'Hydration First Rule',
    message: 'Drink water before you feel thirsty on hot days! Thirst means your body is already starting to dehydrate.',
  },
  {
    id: 'health-heat-stroke-warning',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '🩺',
    badgeColor: 'border-rose-400/50 text-rose-300 bg-rose-950/60',
    title: 'Heat Exhaustion Signs',
    message: 'If you feel dizzy, sick, or get a sudden headache in heat, stop immediately, sit in shade, and sip cool water.',
  },
  {
    id: 'health-sun-protection',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '🧢',
    badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60',
    title: 'Solar Noon Shield',
    message: 'The sun is strongest between 11 AM and 3 PM. Wear wide hats and UV sunglasses to protect your eyes and skin.',
  },
  {
    id: 'health-electrolytes',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '🍋',
    badgeColor: 'border-yellow-400/50 text-yellow-300 bg-yellow-950/60',
    title: 'Sweat & Salt Balance',
    message: 'When you sweat heavily in summer, you lose salt. Eating juicy fruits like watermelon or bananas restores electrolytes!',
  },
  {
    id: 'health-wet-bulb-caution',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '🌡️',
    badgeColor: 'border-rose-400/50 text-rose-300 bg-rose-950/60',
    title: 'Humidity Makes Heat Harder',
    message: 'High air moisture prevents sweat from evaporating. On humid days, slow down your pace and take double rest breaks.',
  },
  {
    id: 'health-air-quality-smoke',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '😷',
    badgeColor: 'border-teal-400/50 text-teal-300 bg-teal-950/60',
    title: 'Breathe Clean Air',
    message: 'On smoky or dusty days, exercise indoors and close street-facing windows to keep your lungs safe and clear.',
  },
  {
    id: 'health-cool-sleep',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '🌙',
    badgeColor: 'border-indigo-400/50 text-indigo-300 bg-indigo-950/60',
    title: 'Cool Sleep in Heatwaves',
    message: 'Soak your feet in cool water for 5 minutes before sleeping. It quickly cools your core body temperature for deep rest.',
  },
  {
    id: 'health-clothing-choice',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '👕',
    badgeColor: 'border-sky-400/50 text-sky-300 bg-sky-950/60',
    title: 'Wear Light Colors',
    message: 'Wear loose, light-colored cotton clothing. Dark clothes absorb heat from sunlight like a solar panel!',
  },
  {
    id: 'health-elders-and-pets',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '🐾',
    badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60',
    title: 'Check on Elders & Pets',
    message: 'Pavement gets hot enough to burn animal paws! Never leave pets or children inside parked cars, even for 5 minutes.',
  },
  {
    id: 'health-indoor-ventilation',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '🏠',
    badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-950/60',
    title: 'Smart Window Habit',
    message: 'Keep windows and blinds shut while the outside temperature is rising. Open them after sunset when night air turns cool.',
  },
  {
    id: 'safe-storm',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '⚡',
    badgeColor: 'border-yellow-400/50 text-yellow-300 bg-yellow-950/60',
    title: 'Storm Alert',
    message: 'When thunder roars, go indoors! Never stand under tall isolated trees during lightning.',
  },
  {
    id: 'safe-flood',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '🌊',
    badgeColor: 'border-blue-400/50 text-blue-300 bg-blue-950/60',
    title: 'Flood Safety',
    message: 'Never walk or ride through moving flood water. Turn around, do not drown!',
  },
  {
    id: 'health-shade-breaks',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '🌳',
    badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-950/60',
    title: 'Hourly Shade Breaks',
    message: 'Outdoors on a hot day? Rest in the shade for 10 minutes every hour so your body stays cool and steady.',
  },
  {
    id: 'health-uv-check',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '🕶️',
    badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60',
    title: 'UV Rays Hide Behind Clouds',
    message: 'You can still sunburn on cool or cloudy days! Wear sunscreen and UV sunglasses before heading outside.',
  },
  {
    id: 'health-buddy-check',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '📞',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: 'Heatwave Buddy Check',
    message: 'During extreme heat, call or message older family members and neighbors once a day to check they are staying cool.',
  },
  {
    id: 'health-cool-neck-wrists',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '🧊',
    badgeColor: 'border-sky-400/50 text-sky-300 bg-sky-950/60',
    title: 'Quick Body Cool-Down',
    message: 'Feeling overheated? Press a cool damp cloth on your wrists, neck, and ankles—your body cools down in minutes!',
  },
  {
    id: 'health-storm-kit',
    category: 'safe',
    categoryLabel: 'Health & Safety',
    badgeEmoji: '🎒',
    badgeColor: 'border-teal-400/50 text-teal-300 bg-teal-950/60',
    title: 'Ready Storm Grab-Bag',
    message: 'Keep a charged power bank, flashlight, drinking water, and basic medicine in one spot before wild weather arrives.',
  },

  // =========================================================================
  // 3. HEALTHIER PLANET (B1 English, everyday green actions)
  // =========================================================================
  {
    id: 'planet-lights',
    category: 'planet',
    categoryLabel: 'Earth Care',
    badgeEmoji: '💡',
    badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-950/60',
    title: 'Save Energy',
    message: 'Turn off room lights when you walk out. Small habits together save huge amounts of power!',
  },
  {
    id: 'planet-bottle',
    category: 'planet',
    categoryLabel: 'Earth Care',
    badgeEmoji: '🥤',
    badgeColor: 'border-blue-400/50 text-blue-300 bg-blue-950/60',
    title: 'Plastic-Free Hero',
    message: 'Carry your own water bottle. One reusable bottle saves hundreds of plastic bottles every year.',
  },
  {
    id: 'planet-bike',
    category: 'planet',
    categoryLabel: 'Earth Care',
    badgeEmoji: '🚲',
    badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-950/60',
    title: 'Green Travel',
    message: 'Walk or ride a bike for short trips to school or the store. It is healthy for your heart and air!',
  },
  {
    id: 'planet-plants',
    category: 'planet',
    categoryLabel: 'Earth Care',
    badgeEmoji: '🌱',
    badgeColor: 'border-green-400/50 text-green-300 bg-green-950/60',
    title: 'Plant Power',
    message: 'Planting flowers on balconies helps bees, and trees cool down city streets like natural AC!',
  },
  {
    id: 'planet-tap',
    category: 'planet',
    categoryLabel: 'Earth Care',
    badgeEmoji: '🚰',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: 'Every Drop Counts',
    message: 'Turn off the tap while brushing your teeth. You save about 8 liters of clean water every time!',
  },
  {
    id: 'planet-food-waste',
    category: 'planet',
    categoryLabel: 'Earth Care',
    badgeEmoji: '🍎',
    badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60',
    title: 'Eat What You Take',
    message: 'Only put on your plate what you will finish. Reducing food waste saves water, soil, and tractor fuel!',
  },
  {
    id: 'planet-unplug',
    category: 'planet',
    categoryLabel: 'Earth Care',
    badgeEmoji: '🔌',
    badgeColor: 'border-purple-400/50 text-purple-300 bg-purple-950/60',
    title: 'Unplug Chargers',
    message: 'Unplug phone and laptop chargers when fully charged. Many cables draw power even when not in use!',
  },
  {
    id: 'planet-reusable-bag',
    category: 'planet',
    categoryLabel: 'Earth Care',
    badgeEmoji: '🛍️',
    badgeColor: 'border-teal-400/50 text-teal-300 bg-teal-950/60',
    title: 'Cloth Bags',
    message: 'Keep a small foldable cloth bag in your backpack. It keeps hundreds of plastic grocery bags out of nature!',
  },
  {
    id: 'planet-cold-wash',
    category: 'planet',
    categoryLabel: 'Earth Care',
    badgeEmoji: '🧺',
    badgeColor: 'border-sky-400/50 text-sky-300 bg-sky-950/60',
    title: 'Cold Water Laundry',
    message: 'Almost 90% of washing machine energy goes to heating water! Wash clothes in cold water to save power and keep colors bright.',
  },
  {
    id: 'planet-ac-25',
    category: 'planet',
    categoryLabel: 'Earth Care',
    badgeEmoji: '❄️',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: 'Smart 25°C + Fan Combo',
    message: 'Set your AC to 25°C and turn on a room fan—it feels just as refreshing while using much less electricity!',
  },
  {
    id: 'planet-native-trees',
    category: 'planet',
    categoryLabel: 'Earth Care',
    badgeEmoji: '🌿',
    badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-950/60',
    title: 'Local Shade Heroes',
    message: 'Native plants and trees need less water, shelter birds, and cool hot city sidewalks like silent green umbrellas!',
  },
  {
    id: 'planet-repair-reuse',
    category: 'planet',
    categoryLabel: 'Earth Care',
    badgeEmoji: '🛠️',
    badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60',
    title: 'Fix Before You Toss',
    message: 'Repairing a loose shoe, bike chain, or torn bag keeps useful gear out of landfills and saves factory energy.',
  },
  {
    id: 'planet-local-seasonal',
    category: 'planet',
    categoryLabel: 'Earth Care',
    badgeEmoji: '🥕',
    badgeColor: 'border-green-400/50 text-green-300 bg-green-950/60',
    title: 'Fresh Local Food',
    message: 'Buying fruits and vegetables grown nearby in season tastes fresher and cuts long-haul truck and plane fuel!',
  },

  // =========================================================================
  // 4. FUN SCI-FI JOKES (Simple B1 English, charming)
  // =========================================================================
  {
    id: 'joke-sun',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '☀️',
    badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60',
    title: 'Bright Star',
    message: 'Why did the sun go to school? To get a little brighter! 😄',
  },
  {
    id: 'joke-earth',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '🍕',
    badgeColor: 'border-teal-400/50 text-teal-300 bg-teal-950/60',
    title: 'Alien Review',
    message: 'Earth is 10/10 stars! You have trees, music, and the greatest invention in the galaxy: pizza!',
  },
  {
    id: 'joke-atmosphere',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '🪐',
    badgeColor: 'border-violet-400/50 text-violet-300 bg-violet-950/60',
    title: 'Party Planet',
    message: 'Why is Earth so popular in space? Because the other planets have no atmosphere! 🚀',
  },
  {
    id: 'joke-cloud',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '☁️',
    badgeColor: 'border-blue-400/50 text-blue-300 bg-blue-950/60',
    title: 'Cloud Day',
    message: 'Why did the cloud stay in bed? It was feeling a little under the weather! 🌧️',
  },
  {
    id: 'joke-astronaut',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '👨‍🚀',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: 'Space Lunch',
    message: 'How do alien astronauts order lunch in space? They always planet ahead! 🛸',
  },
  {
    id: 'joke-black-hole',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '⭐',
    badgeColor: 'border-purple-400/50 text-purple-300 bg-purple-950/60',
    title: 'Star Dinner',
    message: 'Why did the black hole skip dinner? It was already completely full of stars! 🌌',
  },
  {
    id: 'joke-saturn',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '💍',
    badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60',
    title: 'Planet Jewelry',
    message: 'Did you know Saturn loves jewelry? That is why it has so many beautiful rings!',
  },
  {
    id: 'joke-gravity',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '🌍',
    badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-950/60',
    title: 'Down to Earth',
    message: 'I have so much respect for gravity. It really keeps all of us grounded! ✨',
  },
  {
    id: 'joke-moon-cafe',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '☕',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: 'The Moon Cafe',
    message: 'Have you visited the new cafe on the Moon? Great food, but no atmosphere at all! 🌙',
  },
  {
    id: 'joke-alien-wifi',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '📶',
    badgeColor: 'border-purple-400/50 text-purple-300 bg-purple-950/60',
    title: 'Interstellar Wi-Fi',
    message: 'Why do aliens love visiting Earth? Because your planets have free public Wi-Fi in space parks! 🛸',
  },
  {
    id: 'joke-space-rock',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '🎸',
    badgeColor: 'border-rose-400/50 text-rose-300 bg-rose-950/60',
    title: 'Music in Orbit',
    message: 'What kind of music do comets listen to? Heavy rock and meteoric beats! ☄️',
  },
  {
    id: 'joke-solar-panel',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '☀️',
    badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60',
    title: 'Sun Lover',
    message: 'What did the solar panel say to the sun? I get a big charge out of you every single morning! ⚡',
  },
  {
    id: 'joke-space-bar',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '⌨️',
    badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
    title: 'Favorite Keyboard Key',
    message: 'What is an astronaut\'s favorite key on the keyboard? The Space bar—especially for playing our timeline! 🚀',
  },
  {
    id: 'joke-ocean-wave',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '🌊',
    badgeColor: 'border-blue-400/50 text-blue-300 bg-blue-950/60',
    title: 'Friendly Seas',
    message: 'What did the Atlantic Ocean say to the Pacific Ocean? Nothing—they just waved! 🌊',
  },
  {
    id: 'joke-tree-friends',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '🌳',
    badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-950/60',
    title: 'Popular Forest',
    message: 'Why do trees have so many friends on Earth? Because they always love to branch out! 🌱',
  },
  {
    id: 'joke-mars-chocolate',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '🍫',
    badgeColor: 'border-purple-400/50 text-purple-300 bg-purple-950/60',
    title: 'Alien Snack Time',
    message: 'What chocolate bar do aliens pack before flying to Earth? A Mars bar, of course! 🛸',
  },
  {
    id: 'joke-thermometer',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '🌡️',
    badgeColor: 'border-rose-400/50 text-rose-300 bg-rose-950/60',
    title: 'Top Student',
    message: 'Why did the thermometer graduate at the top of its science class? Because it already had so many degrees! 🎓',
  },
  {
    id: 'joke-wind-turbine',
    category: 'joke',
    categoryLabel: 'Cosmic Joke',
    badgeEmoji: '💨',
    badgeColor: 'border-teal-400/50 text-teal-300 bg-teal-950/60',
    title: 'Biggest Supporter',
    message: 'What did the wind turbine tell the clean planet? "I am a really big fan of yours!" 💚',
  },
];

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
}

interface SpaceAlienBuddyProps {
  onSpeakTip?: (text: string) => void;
  isEnabled?: boolean;
  onToggleEnabled?: (enabled: boolean) => void;
  onReplayTutorial?: () => void;
}

// What this does: Controls the floating green space alien that drifts across space and pops open a tip cloud when clicked.
// On the website: Displays the clickable space alien buddy hovering around the globe with quick tips, voice reading, and a Stop/Show toggle.
// Used as: The interactive floating helper companion on the main globe screen.
export const SpaceAlienBuddy: React.FC<SpaceAlienBuddyProps> = ({
  onSpeakTip,
  isEnabled: controlledIsEnabled,
  onToggleEnabled,
  onReplayTutorial,
}) => {
  // Local state if uncontrolled
  const [internalIsEnabled, setInternalIsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nasa_alien_active');
      return saved !== 'false';
    }
    return true;
  });

  const isEnabled = controlledIsEnabled !== undefined ? controlledIsEnabled : internalIsEnabled;

  // What this does: Hides the floating alien buddy from the screen and saves that choice in local storage.
  // On the website: Runs when the user clicks "Stop" above the floating alien so it gets out of their way.
  // Used as: The turn-off button handler for the alien buddy.
  const handleStopAlien = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundFx.playTick();
    if (onToggleEnabled) {
      onToggleEnabled(false);
    } else {
      setInternalIsEnabled(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nasa_alien_active', 'false');
      }
    }
  };

  // What this does: Brings the floating alien buddy back onto the screen with a warp sparkle effect.
  // On the website: Re-enables the space alien so it drifts around the 3D Earth again.
  // Used as: The turn-on handler for the alien buddy.
  const handleResumeAlien = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundFx.playAlienRespawn();
    if (onToggleEnabled) {
      onToggleEnabled(true);
    } else {
      setInternalIsEnabled(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nasa_alien_active', 'true');
      }
    }
    setAlienState('teleporting');
    setTimeout(() => {
      setAlienState('floating');
    }, 600);
  };

  // Alien floating position (percentage of viewport)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 18, y: 22 });
  const [isWobbling, setIsWobbling] = useState<boolean>(false);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  
  // State: 'floating' | 'exploding' | 'showing_cloud' | 'teleporting'
  const [alienState, setAlienState] = useState<'floating' | 'exploding' | 'showing_cloud' | 'teleporting'>('floating');
  
  // Selected category filter tab: 'all' | 'app' | 'safe' | 'planet' | 'joke'
  const [selectedCategory, setSelectedCategory] = useState<'all' | TipCategory>('app');

  // Active tip
  const [activeTip, setActiveTip] = useState<CatchyAlienTip>(() => ALIEN_TIPS[0]);
  
  // Particles for the pop explosion
  const [particles, setParticles] = useState<Particle[]>([]);
  
  // Cloud coordinates (in pixels, centered around explosion point)
  const [cloudCoords, setCloudCoords] = useState<{ x: number; y: number }>({ x: 200, y: 200 });

  // Floating velocity vectors
  const targetPosRef = useRef<{ x: number; y: number }>({ x: 18, y: 22 });
  const currentPosRef = useRef<{ x: number; y: number }>({ x: 18, y: 22 });
  const floatAngleRef = useRef<number>(0);

  // Filtered pool of tips based on chosen category tab
  const activeTipsPool = useMemo(() => {
    if (selectedCategory === 'all') return ALIEN_TIPS;
    return ALIEN_TIPS.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  // What this does: Picks a new safe corner in space around the edges of the screen for the alien to float toward next.
  // On the website: Keeps the alien gently moving around the outer space edges without covering center buttons or the timeline.
  // Used as: The flight destination picker for the drifting alien.
  const pickNewSpaceRegion = useCallback(() => {
    // Keep in safe peripheral corners of the viewport
    const regions = [
      { x: 12 + Math.random() * 16, y: 16 + Math.random() * 18 }, // Top Left
      { x: 74 + Math.random() * 14, y: 14 + Math.random() * 16 }, // Top Right
      { x: 8 + Math.random() * 15, y: 55 + Math.random() * 15 },  // Mid-low Left
      { x: 76 + Math.random() * 14, y: 52 + Math.random() * 14 }, // Mid-low Right
      { x: 38 + Math.random() * 24, y: 12 + Math.random() * 8 },  // Upper center space
    ];
    const chosen = regions[Math.floor(Math.random() * regions.length)];
    targetPosRef.current = chosen;
  }, []);

  // Set new target every 8 seconds
  useEffect(() => {
    pickNewSpaceRegion();
    const interval = setInterval(pickNewSpaceRegion, 8000);
    return () => clearInterval(interval);
  }, [pickNewSpaceRegion]);

  // Occasional eye blink
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 220);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Smooth floating loop via requestAnimationFrame
  useEffect(() => {
    let animId: number;

    const animateFloat = () => {
      if (alienState === 'floating') {
        floatAngleRef.current += 0.035;

        // Smooth ease toward targetPosRef
        const dx = targetPosRef.current.x - currentPosRef.current.x;
        const dy = targetPosRef.current.y - currentPosRef.current.y;
        currentPosRef.current.x += dx * 0.012;
        currentPosRef.current.y += dy * 0.012;

        // Add soft organic sinusoidal bobbing
        const bobY = Math.sin(floatAngleRef.current) * 1.2;
        const bobX = Math.cos(floatAngleRef.current * 0.7) * 0.8;

        setPosition({
          x: currentPosRef.current.x + bobX,
          y: currentPosRef.current.y + bobY,
        });
      }
      animId = requestAnimationFrame(animateFloat);
    };

    animId = requestAnimationFrame(animateFloat);
    return () => cancelAnimationFrame(animId);
  }, [alienState]);

  // What this does: Runs when the user clicks the floating alien: plays a pop sound, spawns 24 glowing sparks, picks a random tip, and opens the speech cloud.
  // On the website: Turns the clicked alien into a burst of colorful stars and reveals a helpful tip card.
  // Used as: The click-and-pop interaction handler for the Space Alien Buddy.
  const handleExplodeAlien = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (alienState !== 'floating') return;

    soundFx.playAlienPop();

    // Calculate pixel coordinates for cloud placement
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const pxX = (position.x / 100) * screenW;
    const pxY = (position.y / 100) * screenH;

    // Clamp cloud so it never clips off-screen edges
    const clampedX = Math.max(170, Math.min(screenW - 180, pxX));
    const clampedY = Math.max(130, Math.min(screenH - 240, pxY));
    setCloudCoords({ x: clampedX, y: clampedY });

    // Randomly pick a category across jokes, app use tips, health keep tips, and planet care
    const categoryOptions: TipCategory[] = ['joke', 'app', 'safe', 'planet'];
    const chosenCat = categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
    const catPool = ALIEN_TIPS.filter((t) => t.category === chosenCat);
    const chosen = catPool[Math.floor(Math.random() * catPool.length)] || ALIEN_TIPS[Math.floor(Math.random() * ALIEN_TIPS.length)];
    setActiveTip(chosen);
    setSelectedCategory('all');

    // Create 24 sparkling explosion particles
    const particleColors = ['#2dd4bf', '#38bdf8', '#f5c542', '#a855f7', '#fb7185', '#ffffff'];
    const newParticles: Particle[] = Array.from({ length: 24 }, (_, i) => {
      const angle = (i / 24) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
      const speed = 2.5 + Math.random() * 4.5;
      return {
        id: i,
        x: pxX,
        y: pxY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        alpha: 1,
        rotation: Math.random() * 360,
      };
    });

    setParticles(newParticles);
    setAlienState('exploding');

    // Transition to speech cloud
    setTimeout(() => {
      setAlienState('showing_cloud');
    }, 280);
  };

  // Particle explosion animation loop
  useEffect(() => {
    if (alienState !== 'exploding' && particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vx: p.vx * 0.94,
            vy: p.vy * 0.94,
            alpha: p.alpha - 0.05,
            rotation: p.rotation + 12,
          }))
          .filter((p) => p.alpha > 0.05)
      );
    }, 20);

    return () => clearInterval(interval);
  }, [alienState, particles.length]);

  // What this does: Closes the tip speech cloud and teleports the alien back to a fresh spot in space.
  // On the website: Runs when clicking Close or Fly Again on the tip bubble.
  // Used as: The respawn handler after reading a tip.
  const handleCloseCloud = () => {
    soundFx.playTick();
    setAlienState('teleporting');

    // Teleport to new position
    setTimeout(() => {
      pickNewSpaceRegion();
      currentPosRef.current = { ...targetPosRef.current };
      setPosition({ ...targetPosRef.current });
      setAlienState('floating');
    }, 900);
  };

  // What this does: Switches to the next tip inside the alien's cloud bubble without closing it.
  // On the website: Powers the Next Tip button inside the alien message bubble.
  // Used as: The next-tip button handler.
  const handleNextTip = () => {
    soundFx.playTick();
    if (selectedCategory === 'all') {
      const otherTips = ALIEN_TIPS.filter((t) => t.id !== activeTip.id);
      const randomNext = otherTips[Math.floor(Math.random() * otherTips.length)] || ALIEN_TIPS[0];
      setActiveTip(randomNext);
    } else {
      const curIdx = activeTipsPool.findIndex((t) => t.id === activeTip.id);
      const nextIdx = (curIdx + 1) % activeTipsPool.length;
      setActiveTip(activeTipsPool[nextIdx]);
    }
  };

  // What this does: Filters the alien's tips to a chosen topic (All, App Tip, Health & Safety, Earth Care, or Jokes) and picks one to show.
  // On the website: Lets the user click topic tabs inside the alien cloud to read specific kinds of tips.
  // Used as: The category filter handler inside the tip cloud.
  const handleSelectCategory = (cat: 'all' | TipCategory) => {
    soundFx.playTick();
    setSelectedCategory(cat);
    const pool = cat === 'all' ? ALIEN_TIPS : ALIEN_TIPS.filter((t) => t.category === cat);
    if (pool.length > 0) {
      // Pick a random one in that category rather than always index 0
      const randomInPool = pool[Math.floor(Math.random() * pool.length)];
      setActiveTip(randomInPool);
    }
  };

  // What this does: Reads the alien's current tip out loud using browser voice synthesis.
  // On the website: Powers the speaker icon inside the alien's speech bubble.
  // Used as: The read-aloud helper for alien tips.
  const handleSpeakTip = () => {
    soundFx.playTick();
    if (onSpeakTip) {
      onSpeakTip(`${activeTip.title}: ${activeTip.message}`);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(activeTip.message);
      utt.rate = 1.0;
      utt.pitch = 1.2;
      window.speechSynthesis.speak(utt);
    }
  };

  return (
    <>
      {/* 1. PARTICLES (DURING EXPLOSION) */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="fixed pointer-events-none z-50 rounded-full shadow-[0_0_8px_currentColor]"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            color: p.color,
            opacity: p.alpha,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
          }}
        />
      ))}

      {/* 2. THE FLOATING ALIEN BODY */}
      {isEnabled && alienState === 'floating' && (
        <div
          onClick={handleExplodeAlien}
          onMouseEnter={() => setIsWobbling(true)}
          onMouseLeave={() => setIsWobbling(false)}
          className="fixed z-40 cursor-pointer select-none group"
          style={{
            left: `${position.x}vw`,
            top: `${position.y}vh`,
            transform: 'translate(-50%, -50%)',
          }}
          title="Click the space alien for a catchy app tip or cosmic joke!"
          role="button"
          tabIndex={0}
          aria-label="Cosmic Space Alien Buddy - Click to pop for app tips and advice"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleExplodeAlien(e as unknown as React.MouseEvent);
            }
          }}
        >
          {/* Subtle Stardust Glow Aura */}
          <div className="absolute inset-0 -m-3 rounded-full bg-cyan-400/20 blur-md group-hover:bg-cyan-300/35 transition-all duration-300 animate-pulse pointer-events-none" />

          {/* Floating Hover Bubble Tag: "Click for tip!" & "Stop Alien" button */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
            <div className="px-2 py-0.5 rounded-full bg-slate-950/85 border border-cyan-400/50 text-[10px] font-mono text-cyan-300 whitespace-nowrap shadow-[0_0_8px_rgba(45,212,191,0.5)] flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-cyan-300 animate-spin" />
              <span>Click for tip!</span>
            </div>
            <button
              onClick={handleStopAlien}
              className="px-2 py-0.5 rounded-full bg-rose-950/90 hover:bg-rose-900 border border-rose-500/50 text-[10px] font-mono text-rose-300 hover:text-white cursor-pointer transition-colors shadow-md flex items-center gap-1"
              title="Stop Alien from floating"
              aria-label="Stop Alien"
            >
              <X className="w-2.5 h-2.5" />
              <span>Stop</span>
            </button>
          </div>

          {/* Alien Body SVG Container */}
          <div
            className={`relative w-10 h-10 md:w-14 md:h-14 transition-transform duration-200 ${
              isWobbling ? 'scale-110 -rotate-6' : 'hover:scale-105'
            }`}
          >
            <svg
              viewBox="0 0 64 64"
              className="w-full h-full drop-shadow-[0_4px_10px_rgba(45,212,191,0.6)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Antenna with Glowing Orb */}
              <line x1="32" y1="16" x2="32" y2="7" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="32" cy="6" r="4" fill="#a7f3d0" className="animate-pulse" />
              <circle cx="32" cy="6" r="2" fill="#ffffff" />

              {/* Little Spaceship / Hover Jetpack Pod */}
              <ellipse cx="32" cy="46" rx="20" ry="6" fill="#0f2638" stroke="#38bdf8" strokeWidth="1.5" />
              <ellipse cx="32" cy="48" rx="14" ry="3.5" fill="#1e3a5f" />
              {/* Thruster exhaust glow */}
              <ellipse cx="32" cy="53" rx="6" ry="2" fill="#38bdf8" opacity="0.8" className="animate-ping" />
              <polygon points="28,52 36,52 32,58" fill="#2dd4bf" opacity="0.7" />

              {/* Alien Head (Soft Bright Sci-Fi Mint Green) */}
              <ellipse cx="32" cy="27" rx="16" ry="14" fill="#10b981" />
              <ellipse cx="32" cy="25" rx="14" ry="12" fill="#34d399" />

              {/* Astronaut Glass Dome Visor (Reflective Cyan Glass) */}
              <ellipse cx="32" cy="28" rx="18" ry="16" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="1.5" />
              <path
                d="M 20 20 Q 28 14 38 18"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Big Expressive Alien Eyes */}
              {isBlinking ? (
                // Blinking closed lines
                <>
                  <line x1="22" y1="28" x2="28" y2="28" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
                  <line x1="36" y1="28" x2="42" y2="28" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
                </>
              ) : (
                // Open Curious Eyes with Bright Highlights
                <>
                  {/* Left Eye */}
                  <ellipse cx="25" cy="27" rx="4.5" ry="5.5" fill="#064e3b" />
                  <circle cx="26.5" cy="25.5" r="1.8" fill="#ffffff" />
                  <circle cx="24" cy="28.5" r="0.8" fill="#a7f3d0" />

                  {/* Right Eye */}
                  <ellipse cx="39" cy="27" rx="4.5" ry="5.5" fill="#064e3b" />
                  <circle cx="40.5" cy="25.5" r="1.8" fill="#ffffff" />
                  <circle cx="38" cy="28.5" r="0.8" fill="#a7f3d0" />
                </>
              )}

              {/* Cute Smiling Mouth */}
              <path d="M 29 34 Q 32 37 35 34" stroke="#064e3b" strokeWidth="1.8" strokeLinecap="round" fill="none" />

              {/* Rosy Alien Cheeks */}
              <circle cx="20" cy="32" r="2" fill="#6ee7b7" opacity="0.6" />
              <circle cx="44" cy="32" r="2" fill="#6ee7b7" opacity="0.6" />

              {/* Cute little floating space mittens */}
              <circle cx="12" cy="38" r="3.5" fill="#34d399" stroke="#10b981" strokeWidth="1" />
              <circle cx="52" cy="38" r="3.5" fill="#34d399" stroke="#10b981" strokeWidth="1" />
            </svg>
          </div>
        </div>
      )}

      {/* 3. TELEPORTING RESPAWN TWINKLE */}
      {alienState === 'teleporting' && (
        <div
          className="fixed z-40 pointer-events-none"
          style={{
            left: `${position.x}vw`,
            top: `${position.y}vh`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-cyan-400 bg-cyan-400/20 animate-ping" />
          <div className="absolute inset-0 flex items-center justify-center text-cyan-200 text-xs font-mono">
            ✨
          </div>
        </div>
      )}

      {/* 4. THE SMALL CATCHY CLOUD MESSAGE */}
      {alienState === 'showing_cloud' && (
        <div
          className="fixed z-50 select-none animate-in fade-in zoom-in-95 duration-200"
          style={{
            left: `${cloudCoords.x}px`,
            top: `${cloudCoords.y}px`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-12px',
          }}
        >
          {/* Comic Cloud Shape Wrapper */}
          <div className="relative w-[min(235px,82vw)] md:w-[330px]">
            {/* Soft Ambient Cyan Glow behind Cloud */}
            <div className="absolute inset-0 -m-2 rounded-2xl md:rounded-3xl bg-cyan-500/15 blur-lg pointer-events-none" />

            {/* Cloud Container with Comic Puff Border Styling */}
            <div className="relative bg-[#0a1424]/95 backdrop-blur-md border-2 border-[#2dd4bf]/40 rounded-2xl md:rounded-3xl p-2.5 md:p-4 shadow-[0_12px_32px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] text-slate-100 flex flex-col gap-1.5 md:gap-2">
              
              {/* Cloud Header: Category Badge + Audio + Close Button */}
              <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.08]">
                {/* Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold ${activeTip.badgeColor}`}
                >
                  <span>{activeTip.badgeEmoji}</span>
                  <span>{activeTip.categoryLabel}</span>
                </div>

                {/* Right Action Icons: Read Aloud & Close */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSpeakTip}
                    className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Listen to this tip aloud"
                    aria-label="Listen to tip"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleCloseCloud}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Close tip and let alien fly again"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Category Quick Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-[10px] font-mono scrollbar-none">
                {[
                  { id: 'all' as const, label: '🎲 Random (All)', count: ALIEN_TIPS.length },
                  { id: 'joke' as const, label: '😄 Jokes', count: ALIEN_TIPS.filter(t => t.category === 'joke').length },
                  { id: 'app' as const, label: '🚀 App Tips', count: ALIEN_TIPS.filter(t => t.category === 'app').length },
                  { id: 'safe' as const, label: '🩺 Health & Safety', count: ALIEN_TIPS.filter(t => t.category === 'safe').length },
                  { id: 'planet' as const, label: '🌱 Earth Care', count: ALIEN_TIPS.filter(t => t.category === 'planet').length },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`px-2 py-0.5 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-cyan-400 text-slate-950 font-bold'
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat.label} ({cat.count})
                  </button>
                ))}
              </div>

              {/* Tip Title & Message in Simple B1 English */}
              <div className="space-y-1 my-0.5">
                <h4 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{activeTip.title}</span>
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {activeTip.message}
                </p>
              </div>

              {/* Cloud Footer: Got It button & Another Tip button & Stop button */}
              <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-white/[0.06] text-[11px] font-mono flex-wrap gap-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleNextTip}
                    className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-white transition-colors cursor-pointer font-bold"
                    title="Show another tip (random or in this category)"
                  >
                    <RefreshCw className="w-3 h-3 text-cyan-400" />
                    <span>
                      {selectedCategory === 'all'
                        ? 'Next Random Tip 🎲'
                        : `Next (${activeTipsPool.findIndex(t => t.id === activeTip.id) + 1}/${activeTipsPool.length})`}
                    </span>
                  </button>

                  <button
                    onClick={handleStopAlien}
                    className="text-[10px] text-slate-400 hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1 ml-1"
                    title="Stop Alien from floating"
                  >
                    <X className="w-2.5 h-2.5 text-rose-400" />
                    <span>Stop Alien</span>
                  </button>
                </div>

                <button
                  onClick={handleCloseCloud}
                  className="px-3 py-1 rounded-lg bg-[#2dd4bf]/20 hover:bg-[#2dd4bf]/30 border border-[#2dd4bf]/50 text-[#2dd4bf] hover:text-white font-bold transition-all cursor-pointer active:scale-95"
                >
                  Got it! ✨
                </button>
              </div>

              {/* Take Guided Tour with Alien Shortcut */}
              {onReplayTutorial && (
                <button
                  onClick={() => {
                    handleCloseCloud();
                    onReplayTutorial();
                  }}
                  className="w-full mt-0.5 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-teal-950/80 via-slate-900 to-cyan-950/80 hover:from-teal-900 hover:to-cyan-900 border border-teal-500/50 hover:border-cyan-400 text-[11px] font-mono font-bold text-teal-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  title="Launch step-by-step interactive guided tutorial led by the alien"
                >
                  <span>🛸</span>
                  <span>Take Guided Tour with Alien</span>
                </button>
              )}

              {/* Cloud Speech Bubble Tail (Pointing down toward explosion origin) */}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0a1424] border-r-2 border-b-2 border-[#2dd4bf]/40 rotate-45" />
            </div>
          </div>
        </div>
      )}

      {/* 5. FLOATING SUMMON ALIEN BUTTON (WHEN ALIEN IS STOPPED) */}
      {!isEnabled && (
        <button
          onClick={handleResumeAlien}
          className="fixed bottom-16 md:bottom-24 left-2 md:left-4 z-30 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-[10px] md:text-xs font-mono text-cyan-300 hover:text-white transition-all shadow-[0_4px_16px_rgba(0,0,0,0.6)] cursor-pointer flex items-center gap-1.5 md:gap-2 group animate-in fade-in"
          title="Click to summon the space alien buddy back to life!"
          aria-label="Summon Space Alien Buddy"
        >
          <span className="text-xs md:text-base group-hover:scale-125 transition-transform">🛸</span>
          <span className="font-semibold">Summon Alien</span>
        </button>
      )}
    </>
  );
};
