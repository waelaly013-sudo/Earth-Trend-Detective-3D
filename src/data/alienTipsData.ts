/**
 * Catchy Alien Space Tips & Jokes
 * Shorter, simpler messages in B1 English language.
 * Categories:
 * 1. Stay Safe (health, heat, storms, hydration)
 * 2. Planet Health (saving water/energy, trees, recycling, clean Earth)
 * 3. About the App (3D globe navigation, timeline, layers, hotspots)
 * 4. Small Joke (clean, funny, simple space & nature jokes)
 */

// What this does: Names the four groups of short messages the little alien mascot can say.
// On the website: Labels the category badge on the alien speech bubble (Stay Safe, Planet Health, App Tip, or Joke).
// Used as: Filter and styling keys for alien tip items.
export type AlienTipCategory = 'stay_safe' | 'planet_health' | 'about_app' | 'small_joke';

// What this does: Defines the fields for a single alien tip card (category, emoji, badge color, and message text).
// On the website: Controls what text and emoji appear when the user clicks the floating space alien buddy.
// Used as: The item blueprint for the ALIEN_TIPS array.
export interface AlienTip {
  id: string;
  category: AlienTipCategory;
  categoryLabel: string;
  emoji: string;
  color: string; // for theme badge
  text: string;
}

// What this does: Stores the list of friendly safety tips, eco tips, app hints, and clean space jokes.
// On the website: Provides the rotating messages spoken by the floating alien companion.
// Used as: The static message library for the SpaceAlienBuddy and CosmicAlienCompanion widgets.
export const ALIEN_TIPS: AlienTip[] = [
  // --- STAY SAFE (Simple B1 English) ---
  {
    id: 'safe-1',
    category: 'stay_safe',
    categoryLabel: 'Stay Safe',
    emoji: '💧',
    color: '#06b6d4',
    text: 'Drink clean water often on hot sunny days. It keeps your body cool and healthy!',
  },
  {
    id: 'safe-2',
    category: 'stay_safe',
    categoryLabel: 'Stay Safe',
    emoji: '🧢',
    color: '#06b6d4',
    text: 'Wear a hat and sunscreen when the sun is strong to protect your skin.',
  },
  {
    id: 'safe-3',
    category: 'stay_safe',
    categoryLabel: 'Stay Safe',
    emoji: '⛈️',
    color: '#06b6d4',
    text: 'If you hear thunder or see lightning, stay safely indoors away from tall trees.',
  },
  {
    id: 'safe-4',
    category: 'stay_safe',
    categoryLabel: 'Stay Safe',
    emoji: '💨',
    color: '#06b6d4',
    text: 'Check the air quality before running outside if there is smoke or strong dust.',
  },
  {
    id: 'safe-5',
    category: 'stay_safe',
    categoryLabel: 'Stay Safe',
    emoji: '🔦',
    color: '#06b6d4',
    text: 'Keep a small flashlight and water bottles at home in case storm power cuts off.',
  },
  {
    id: 'safe-6',
    category: 'stay_safe',
    categoryLabel: 'Stay Safe',
    emoji: '🚲',
    color: '#06b6d4',
    text: 'Always wear a helmet and reflective lights when riding a bike at dusk.',
  },
  {
    id: 'safe-7',
    category: 'stay_safe',
    categoryLabel: 'Stay Safe',
    emoji: '🌳',
    color: '#06b6d4',
    text: 'Take a 10-minute shade break every hour when working or playing in hot weather.',
  },
  {
    id: 'safe-8',
    category: 'stay_safe',
    categoryLabel: 'Stay Safe',
    emoji: '📞',
    color: '#06b6d4',
    text: 'During heatwaves, call or text older neighbors and relatives to check they stay cool.',
  },
  {
    id: 'safe-9',
    category: 'stay_safe',
    categoryLabel: 'Stay Safe',
    emoji: '🧊',
    color: '#06b6d4',
    text: 'Put a cool damp cloth on your wrists or neck to lower your body heat quickly.',
  },

  // --- PLANET HEALTH (Simple B1 English) ---
  {
    id: 'planet-1',
    category: 'planet_health',
    categoryLabel: 'Help Our Planet',
    emoji: '💡',
    color: '#10b981',
    text: 'Turn off the lights when leaving a room. It saves a lot of electricity!',
  },
  {
    id: 'planet-2',
    category: 'planet_health',
    categoryLabel: 'Help Our Planet',
    emoji: '🚿',
    color: '#10b981',
    text: 'Turn off running water while brushing your teeth. Every small drop counts!',
  },
  {
    id: 'planet-3',
    category: 'planet_health',
    categoryLabel: 'Help Our Planet',
    emoji: '🌱',
    color: '#10b981',
    text: 'Plant small flowers or trees near home. They give clean air and food for bees.',
  },
  {
    id: 'planet-4',
    category: 'planet_health',
    categoryLabel: 'Help Our Planet',
    emoji: '🛍️',
    color: '#10b981',
    text: 'Use a reusable cloth bag when shopping to reduce plastic waste in the sea.',
  },
  {
    id: 'planet-5',
    category: 'planet_health',
    categoryLabel: 'Help Our Planet',
    emoji: '🚴',
    color: '#10b981',
    text: 'Walk or ride a bicycle for short trips. It is great for health and cuts smoke!',
  },
  {
    id: 'planet-6',
    category: 'planet_health',
    categoryLabel: 'Help Our Planet',
    emoji: '♻️',
    color: '#10b981',
    text: 'Recycle paper, glass, and metal cans so factories can turn them into new goods.',
  },
  {
    id: 'planet-7',
    category: 'planet_health',
    categoryLabel: 'Help Our Planet',
    emoji: '🥗',
    color: '#10b981',
    text: 'Eat more fresh vegetables and local food to lower fuel used by cargo trucks.',
  },
  {
    id: 'planet-8',
    category: 'planet_health',
    categoryLabel: 'Help Our Planet',
    emoji: '🧺',
    color: '#10b981',
    text: 'Wash clothes in cold water! Almost 90% of washer electricity goes to heating water.',
  },
  {
    id: 'planet-9',
    category: 'planet_health',
    categoryLabel: 'Help Our Planet',
    emoji: '❄️',
    color: '#10b981',
    text: 'Set your AC to 25°C and run a fan—it feels cool while cutting electric waste.',
  },
  {
    id: 'planet-10',
    category: 'planet_health',
    categoryLabel: 'Help Our Planet',
    emoji: '🛠️',
    color: '#10b981',
    text: 'Fix broken gear before buying new things to keep waste out of landfills.',
  },

  // --- ABOUT THE APP (Simple B1 English) ---
  {
    id: 'app-1',
    category: 'about_app',
    categoryLabel: 'App Tip',
    emoji: '🌍',
    color: '#3b82f6',
    text: 'Drag the 3D globe with your mouse or finger to spin and visit any country on Earth!',
  },
  {
    id: 'app-2',
    category: 'about_app',
    categoryLabel: 'App Tip',
    emoji: '⏳',
    color: '#3b82f6',
    text: 'Slide the timeline bar at the bottom to travel between past years and future 2040!',
  },
  {
    id: 'app-3',
    category: 'about_app',
    categoryLabel: 'App Tip',
    emoji: '📍',
    color: '#3b82f6',
    text: 'Click on any glowing pin to see real satellite records of temperature and polar ice.',
  },
  {
    id: 'app-4',
    category: 'about_app',
    categoryLabel: 'App Tip',
    emoji: '📊',
    color: '#3b82f6',
    text: 'Switch between Temperature, Wind, and Humidity from the top bar to see new data!',
  },
  {
    id: 'app-5',
    category: 'about_app',
    categoryLabel: 'App Tip',
    emoji: '🚀',
    color: '#3b82f6',
    text: 'Click the "Explore" button at the top to take an automatic guided tour around Earth.',
  },
  {
    id: 'app-6',
    category: 'about_app',
    categoryLabel: 'App Tip',
    emoji: '🔍',
    color: '#3b82f6',
    text: 'Use the Country Search tool to look up climate statistics for any nation.',
  },
  {
    id: 'app-7',
    category: 'about_app',
    categoryLabel: 'App Tip',
    emoji: '🟣',
    color: '#8b5cf6',
    text: 'The glowing purple (#8b5cf6) line on the timeline marks future AI predictions after Nov 2026!',
  },
  {
    id: 'app-8',
    category: 'about_app',
    categoryLabel: 'App Tip',
    emoji: '📱',
    color: '#3b82f6',
    text: 'On mobile, Explore, Science, Reports, and Mission sit neatly inside the "More" button!',
  },
  {
    id: 'app-9',
    category: 'about_app',
    categoryLabel: 'App Tip',
    emoji: '🌾',
    color: '#3b82f6',
    text: 'Tap the compact Visual Places button to try the Farm crop or Polar ice simulator anytime!',
  },
  {
    id: 'app-10',
    category: 'about_app',
    categoryLabel: 'App Tip',
    emoji: '🤏',
    color: '#3b82f6',
    text: 'Pinch or scroll to shrink the 3D Earth as small as you want, or tap Show Timeline on mobile!',
  },
  {
    id: 'app-11',
    category: 'about_app',
    categoryLabel: 'App Tip',
    emoji: '❓',
    color: '#3b82f6',
    text: 'Mission Advisory stays tucked away when you enter—tap "?" anytime for help or the App Guide!',
  },

  // --- SMALL JOKES (Simple B1 English) ---
  {
    id: 'joke-1',
    category: 'small_joke',
    categoryLabel: 'Alien Joke',
    emoji: '😄',
    color: '#8b5cf6',
    text: 'Why did the cloud stay in the sky? Because it didn\'t want to precipitate!',
  },
  {
    id: 'joke-2',
    category: 'small_joke',
    categoryLabel: 'Alien Joke',
    emoji: '🛸',
    color: '#8b5cf6',
    text: 'What did Earth say to Mars? "You have no atmosphere!"',
  },
  {
    id: 'joke-3',
    category: 'small_joke',
    categoryLabel: 'Alien Joke',
    emoji: '🌳',
    color: '#8b5cf6',
    text: 'Why do trees have so many friends? Because they always branch out!',
  },
  {
    id: 'joke-4',
    category: 'small_joke',
    categoryLabel: 'Alien Joke',
    emoji: '⌨️',
    color: '#8b5cf6',
    text: 'What is an astronaut\'s favorite key on the keyboard? The Space bar!',
  },
  {
    id: 'joke-5',
    category: 'small_joke',
    categoryLabel: 'Alien Joke',
    emoji: '☀️',
    color: '#8b5cf6',
    text: 'Why did the sun go to school? To get a little brighter!',
  },
  {
    id: 'joke-6',
    category: 'small_joke',
    categoryLabel: 'Alien Joke',
    emoji: '🌊',
    color: '#8b5cf6',
    text: 'What did one ocean say to the other? Nothing, they just waved!',
  },
  {
    id: 'joke-7',
    category: 'small_joke',
    categoryLabel: 'Alien Joke',
    emoji: '🍫',
    color: '#8b5cf6',
    text: 'What chocolate bar do aliens love most? A Mars bar!',
  },
  {
    id: 'joke-8',
    category: 'small_joke',
    categoryLabel: 'Alien Joke',
    emoji: '⭐',
    color: '#8b5cf6',
    text: 'How do astronauts organize a party? They planet!',
  },
  {
    id: 'joke-9',
    category: 'small_joke',
    categoryLabel: 'Alien Joke',
    emoji: '🌡️',
    color: '#8b5cf6',
    text: 'Why was the thermometer so smart at school? Because it had so many degrees!',
  },
  {
    id: 'joke-10',
    category: 'small_joke',
    categoryLabel: 'Alien Joke',
    emoji: '💨',
    color: '#8b5cf6',
    text: 'What did the wind turbine say to clean Earth? "I am a really big fan of yours!"',
  },
];

// What this does: Picks a random tip or joke from the list while making sure it doesn't repeat the one just shown.
// On the website: Gives the user a fresh message every time they click the alien buddy or hit Next Tip.
// Used as: Helper function called by the alien companion component.
export function getRandomAlienTip(previousId?: string): AlienTip {
  const pool = previousId ? ALIEN_TIPS.filter((t) => t.id !== previousId) : ALIEN_TIPS;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
