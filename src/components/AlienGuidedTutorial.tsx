/**
 * NASA Earth Trend Detective - Alien Guided Interactive Tutorial
 * 
 * An animated, friendly sci-fi alien that physically flies across the screen
 * on the user's first visit to point out key controls step by step:
 * 1. Primary Variables Switcher (Temperature, Humidity, Wind in Header)
 * 2. 3D Earth Globe (Centered Planetary WebGL Sphere)
 * 3. 4D Climate Timeline Dock (Bottom Play button & 2000-2040 slider)
 * 4. Interactive Visual Places (🌾 Farm & ❄️ Polar Simulators in Header)
 * 5. Explore & Country Search (🧭 Explore Category in Header)
 * 6. Data Complexity & Mission Settings (⚙️ Mission & 🔬 Science in Header)
 * 7. Mission Certified & Free-Floating Alien Buddy
 * 
 * Accurately measures real DOM bounding rects so the spotlight circle
 * ALWAYS lands with pixel precision around the exact intended button.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  X,
  Volume2,
  ChevronRight,
  ChevronLeft,
  RotateCw,
  Search,
  Globe2,
  Clock,
  Sprout,
  HelpCircle,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { soundFx } from '../utils/audioSynth';
import { speakUtterance, stopSpeaking } from '../utils/speechAnnouncer';

export const ALIEN_TUTORIAL_STORAGE_KEY = 'nasa_alien_guided_tutorial_v1';

export interface TutorialStepDef {
  id: string;
  stepNumber: number;
  totalSteps: number;
  title: string;
  badge: string;
  badgeColor: string;
  message: string;
  actionHint: string;
  targetSelector: string; // CSS query selector to measure exact DOM rect
  targetLabel: string;
  preferredPlacement: 'below' | 'above' | 'left' | 'center';
  pointingDirection: 'up' | 'down' | 'right' | 'left' | 'wave';
}

// What this does: Stores the ordered list of 7 tour steps, each holding the alien's message, hint, and the CSS selector of the button to spotlight.
// On the website: Defines every stop the alien visits while teaching new users how the app works.
// Used as: The step-by-step script for the interactive alien tutorial.
export const TUTORIAL_STEPS: TutorialStepDef[] = [
  {
    id: 'variables',
    stepNumber: 1,
    totalSteps: 7,
    title: '1. Primary Variables Switcher',
    badge: 'Primary NASA Suites (MERRA-2)',
    badgeColor: 'border-amber-400/60 text-amber-300 bg-amber-950/70',
    message: 'Look right above me! These three buttons switch our primary Earth observation branches: Air Temperature, Humidity, and Wind Speed (calibrated via NASA MERRA-2). In Complicated mode, each branch also drives 3 coupled satellite effects (Skin Temp, Precipitation, Soil Moisture, Ozone, etc.)!',
    actionHint: '👉 Click on "Temperature", "Humidity", or "Wind" to switch planetary variables!',
    targetSelector: '[data-tutorial="branch-switcher"]',
    targetLabel: 'NASA Primary Variables (MERRA-2)',
    preferredPlacement: 'below',
    pointingDirection: 'up',
  },
  {
    id: 'globe',
    stepNumber: 2,
    totalSteps: 7,
    title: '2. Interactive 3D Earth Globe',
    badge: '3D WebGL Planetary Sphere',
    badgeColor: 'border-cyan-400/60 text-cyan-300 bg-cyan-950/70',
    message: 'Look at the planet right beside me! 🌍 Click and drag anywhere in space to rotate Earth in full 3D, and scroll your mouse wheel or pinch your touchscreen to zoom into any continent. Click on any colored pin on Earth to inspect localized satellite observations!',
    actionHint: '👉 Click & drag Earth to rotate, or scroll to zoom in close!',
    targetSelector: 'earth-globe', // Handled via viewport center calculation
    targetLabel: 'Interactive 3D Earth Globe',
    preferredPlacement: 'left',
    pointingDirection: 'right',
  },
  {
    id: 'timeline',
    stepNumber: 3,
    totalSteps: 7,
    title: '3. 4D Climate Timeline (2000–2040)',
    badge: 'Temporal Playback Engine',
    badgeColor: 'border-purple-400/60 text-purple-300 bg-purple-950/70',
    message: 'Look down below me! ⏳ This is our 4D Climate Timeline. Click the Play ▶ button to watch 40 years of climate evolution roll forward, or drag the needle between 2000 and 2040! Dates after Nov 2026 are NASA forward AI projections.',
    actionHint: '👉 Press the Play ▶ button or pick any month to observe seasonal cycles!',
    targetSelector: '[data-tutorial="timeline-dock"]',
    targetLabel: '4D Climate Timeline & Play Engine',
    preferredPlacement: 'above',
    pointingDirection: 'down',
  },
  {
    id: 'visual-places',
    stepNumber: 4,
    totalSteps: 7,
    title: '4. Visual Places (Farm & Polar Simulators)',
    badge: 'Farm & Polar 3D Labs',
    badgeColor: 'border-emerald-400/60 text-emerald-300 bg-emerald-950/70',
    message: 'Look right up here! 🌾❄️ Click "Visual Places" to step inside our interactive agricultural Farm or the Arctic Polar Cryosphere simulator! Test real-world heatwaves, crop droughts, and polar ice melting in 3D!',
    actionHint: '👉 Click "Farm Place" or "Polar Place" to enter interactive 3D biomes!',
    targetSelector: '[data-tutorial="visual-places"]',
    targetLabel: 'Visual Places Microclimate Simulators',
    preferredPlacement: 'below',
    pointingDirection: 'up',
  },
  {
    id: 'explore',
    stepNumber: 5,
    totalSteps: 7,
    title: '5. Explore & Search 195+ Countries',
    badge: 'Planetary Navigation & Tours',
    badgeColor: 'border-blue-400/60 text-blue-300 bg-blue-950/70',
    message: 'Look right above! 🌐 Click "Explore" to search over 195 countries worldwide and zoom straight to them. You can also start an automated Guided Tour across Earth tipping points or filter Earth domains!',
    actionHint: '👉 Click "Explore" to search any country or launch a guided tour!',
    targetSelector: '[data-tutorial="explore-category"]',
    targetLabel: 'Explore & Country Search',
    preferredPlacement: 'below',
    pointingDirection: 'up',
  },
  {
    id: 'mission-complexity',
    stepNumber: 6,
    totalSteps: 7,
    title: '6. Mission Guide & Complexity Modes',
    badge: 'Adaptive Intelligence Settings',
    badgeColor: 'border-indigo-400/60 text-indigo-300 bg-indigo-950/70',
    message: 'Look right here! 🎓 Click "Mission" to read the full App Guide, or switch between "Simple" (friendly B1 English & visual meters), "Normal" (NASA baseline), and "Complicated" (peer-reviewed equations, 95% confidence intervals, and 9 coupled satellite variables)!',
    actionHint: '👉 Choose the data complexity mode that best fits your needs!',
    targetSelector: '[data-tutorial="mission-category"]',
    targetLabel: 'Mission Settings & Data Complexity',
    preferredPlacement: 'below',
    pointingDirection: 'up',
  },
  {
    id: 'complete',
    stepNumber: 7,
    totalSteps: 7,
    title: "7. You're Certified to Explore!",
    badge: 'Mission Certified',
    badgeColor: 'border-teal-400/60 text-teal-300 bg-teal-950/70',
    message: 'Congratulations Detective! 🎉 You now know where all the key buttons and tools are located in the app! I will be floating in space around Earth. Whenever you want quick tips, secrets, or climate jokes, just click on me! Enjoy exploring Earth!',
    actionHint: '👉 Click "Start Exploring Earth!" to begin your planetary mission!',
    targetSelector: 'none',
    targetLabel: 'Cosmic Science Alien Buddy',
    preferredPlacement: 'center',
    pointingDirection: 'wave',
  },
];

interface MeasuredTargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: string;
}

interface AlienPosition {
  x: number; // pixel coordinate
  y: number; // pixel coordinate
}

interface AlienGuidedTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCountrySearch?: () => void;
  onStartTour?: () => void;
}

// What this does: Renders the flying cosmic alien that spotlights real buttons on the screen one by one and walks users through the app.
// On the website: Shows up right after login and the Phoenix intro, pointing to the branches, 3D Earth, timeline, Visual Places, Explore, and Mission menus.
// Used as: The interactive first-time walkthrough overlay.
export const AlienGuidedTutorial: React.FC<AlienGuidedTutorialProps> = ({
  isOpen,
  onClose,
  onOpenCountrySearch,
  onStartTour,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isWarping, setIsWarping] = useState<boolean>(false);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);

  // Dynamically measured real spotlight rect & alien position
  const [spotlightRect, setSpotlightRect] = useState<MeasuredTargetRect | null>(null);
  const [alienPos, setAlienPos] = useState<AlienPosition>({ x: 200, y: 200 });

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  // What this does: Makes the alien's eyes blink every 3.5 seconds while the tutorial is open so the character feels alive.
  // On the website: Animates the friendly green alien character on screen.
  // Used as: A simple blink animation timer.
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3500);
    return () => clearInterval(interval);
  }, [isOpen]);

  // What this does: Measures the exact on-screen box of the target button for the current step and calculates where to place the glowing spotlight and the alien.
  // On the website: Keeps the neon highlight ring and alien speech bubble lined up cleanly on both phones and desktops.
  // Used as: The live layout position calculator for each tutorial step.
  const updatePositions = useCallback(() => {
    if (!isOpen) return;

    const step = TUTORIAL_STEPS[currentStepIndex];
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // Special Case 1: Earth Globe in Center
    if (step.targetSelector === 'earth-globe') {
      const globeDiameter = Math.min(winW * 0.52, winH * 0.58, 480);
      const top = (winH - globeDiameter) / 2;
      const left = (winW - globeDiameter) / 2;

      setSpotlightRect({
        top,
        left,
        width: globeDiameter,
        height: globeDiameter,
        borderRadius: '50%',
      });

      // Alien sits comfortably to the left of Earth (clamped cleanly on narrow mobile viewports)
      const marginX = Math.min(190, winW * 0.44);
      const alienX = Math.min(winW - marginX, Math.max(marginX, left - 70));
      const alienY = Math.max(160, Math.min(winH - 180, winH * 0.48));
      setAlienPos({ x: alienX, y: alienY });
      return;
    }

    // Special Case 2: Final Step (Center screen celebration)
    if (step.targetSelector === 'none') {
      setSpotlightRect(null);
      setAlienPos({ x: winW / 2, y: winH * 0.38 });
      return;
    }

    // What this does: Finds the first matching HTML button on the page that is actually visible (not hidden on mobile or desktop).
    // On the website: Makes sure the tutorial highlights the right button whether the user is on a phone or a computer.
    // Used as: A responsive element finder helper.
    const findVisibleElement = (selector: string): HTMLElement | null => {
      const candidates = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
      return (
        candidates.find((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }) || null
      );
    };

    let element = findVisibleElement(step.targetSelector);
    if (
      !element &&
      (step.targetSelector === '[data-tutorial="explore-category"]' ||
        step.targetSelector === '[data-tutorial="science-category"]' ||
        step.targetSelector === '[data-tutorial="mission-category"]')
    ) {
      // On mobile (< 768px), Explore, Science, Reports, and Mission live inside the More button
      element = findVisibleElement('[data-tutorial="more-category"]');
    }

    if (element) {
      const rect = element.getBoundingClientRect();
      const pad = 6;
      const measured: MeasuredTargetRect = {
        top: Math.max(0, rect.top - pad),
        left: Math.max(0, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        borderRadius: window.getComputedStyle(element).borderRadius || '14px',
      };

      setSpotlightRect(measured);

      const marginX = Math.min(190, winW * 0.45);
      // Calculate Alien coordinate based on preferred placement
      if (step.preferredPlacement === 'below') {
        // Position below header control
        const alienX = Math.min(winW - marginX, Math.max(marginX, measured.left + measured.width / 2));
        const alienY = Math.min(winH - 180, measured.top + measured.height + 65);
        setAlienPos({ x: alienX, y: alienY });
      } else if (step.preferredPlacement === 'above') {
        // Position above bottom timeline control
        const alienX = Math.min(winW - marginX, Math.max(marginX, measured.left + measured.width * 0.35));
        const alienY = Math.max(110, measured.top - 68);
        setAlienPos({ x: alienX, y: alienY });
      } else {
        // Left placement
        const alienX = Math.min(winW - marginX, Math.max(marginX, measured.left - 60));
        const alienY = measured.top + measured.height / 2;
        setAlienPos({ x: alienX, y: alienY });
      }
    } else {
      // Fallback if DOM element temporarily unavailable
      setSpotlightRect(null);
      setAlienPos({ x: winW * 0.5, y: winH * 0.35 });
    }
  }, [isOpen, currentStepIndex]);

  // Recalculate on step change or window resize
  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions);

    // Minor delay to catch layout reflows (e.g. font loading, header height adjustments)
    const timeout = setTimeout(updatePositions, 100);

    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions);
      clearTimeout(timeout);
    };
  }, [updatePositions]);

  // What this does: Triggers the alien's teleport warp bounce and sci-fi sound effect whenever moving between tutorial steps.
  // On the website: Makes the alien visibly pop and chime as it flies to the next button.
  // Used as: A step-transition visual and sound effect helper.
  const playStepTransition = useCallback(() => {
    soundFx.playAlienRespawn();
    setIsWarping(true);
    setTimeout(() => setIsWarping(false), 450);
  }, []);

  // What this does: Advances to the next tutorial step, or finishes the tutorial if the user is on the last step.
  // On the website: Runs when clicking "Next Step" or "Start Exploring!".
  // Used as: The forward navigation handler inside the alien speech bubble.
  const handleNext = () => {
    stopSpeaking();
    setIsSpeaking(false);
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      playStepTransition();
    } else {
      handleComplete();
    }
  };

  // What this does: Moves back one step in the tutorial and stops any voice reading that was playing.
  // On the website: Runs when clicking the "Back" button inside the alien speech bubble.
  // Used as: The backward navigation handler inside the tutorial.
  const handlePrev = () => {
    stopSpeaking();
    setIsSpeaking(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      playStepTransition();
    }
  };

  // What this does: Marks the tutorial as finished in browser storage and closes the overlay so the user can explore freely.
  // On the website: Closes the spotlight tutorial at the end so it doesn't pop up again automatically next time.
  // Used as: The completion handler for the final tutorial step.
  const handleComplete = () => {
    stopSpeaking();
    setIsSpeaking(false);
    soundFx.playAlienPop();
    if (typeof window !== 'undefined') {
      localStorage.setItem(ALIEN_TUTORIAL_STORAGE_KEY, 'completed');
    }
    onClose();
  };

  // What this does: Skips the rest of the tutorial right away, saves that it was seen, and closes the overlay.
  // On the website: Runs when the user clicks "Skip Tutorial", the X icon, or presses Escape.
  // Used as: The early-exit handler for the tutorial.
  const handleSkip = () => {
    stopSpeaking();
    setIsSpeaking(false);
    soundFx.playTick();
    if (typeof window !== 'undefined') {
      localStorage.setItem(ALIEN_TUTORIAL_STORAGE_KEY, 'completed');
    }
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  // What this does: Reads the current tutorial step's title, message, and hint out loud, or stops reading if already speaking.
  // On the website: Powers the speaker icon button in the alien box and clicking directly on the alien.
  // Used as: The voice-over toggle for the tutorial steps.
  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${currentStep.title}. ${currentStep.message} ${currentStep.actionHint}`;
    setIsSpeaking(true);
    speakUtterance(textToSpeak, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  if (!isOpen) return null;

  const isBubbleAbove = currentStep.preferredPlacement === 'above';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none">
      {/* 1. SOFT VIGNETTE BACKDROP (Leaves app underneath fully readable) */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] pointer-events-auto transition-opacity duration-300" />

      {/* 2. DYNAMIC SPOTLIGHT HIGHLIGHTER (Measured with pixel precision from real DOM elements) */}
      {spotlightRect && (
        <div
          className="absolute pointer-events-none transition-all duration-500 ease-out z-40"
          style={{
            top: `${spotlightRect.top}px`,
            left: `${spotlightRect.left}px`,
            width: `${spotlightRect.width}px`,
            height: `${spotlightRect.height}px`,
            borderRadius: spotlightRect.borderRadius,
          }}
        >
          {/* Animated Glowing Neon Border */}
          <div
            className="absolute -inset-1 rounded-[inherit] border-2 border-cyan-400 shadow-[0_0_24px_rgba(6,182,212,0.7),inset_0_0_12px_rgba(6,182,212,0.35)] animate-pulse"
          />

          {/* Floating Target Label Pill */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-cyan-950/98 border border-cyan-400 text-cyan-200 text-[10px] font-mono font-bold tracking-wide uppercase whitespace-nowrap shadow-xl flex items-center gap-1.5 animate-bounce ${
              spotlightRect.top < 60 ? '-bottom-6' : '-top-6'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{currentStep.targetLabel}</span>
          </div>
        </div>
      )}

      {/* 3. FLOATING TOP-RIGHT SKIP BUTTON */}
      <div className="absolute top-2 right-2 md:top-3.5 md:right-3.5 z-50 pointer-events-auto flex items-center gap-1.5 md:gap-2">
        <button
          onClick={handleSkip}
          className="px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-slate-700 hover:border-rose-400/70 text-slate-300 hover:text-white font-mono text-[10px] md:text-xs font-bold shadow-2xl flex items-center gap-1 md:gap-1.5 transition-all cursor-pointer group hover:scale-105"
          title="Skip tutorial and explore freely (Esc)"
        >
          <span>Skip Tutorial</span>
          <span className="hidden md:inline text-[10px] px-1 py-0.2 rounded bg-slate-800 group-hover:bg-rose-950 text-slate-400 group-hover:text-rose-300 border border-slate-700 font-mono">
            Esc
          </span>
          <X className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400 group-hover:text-rose-400" />
        </button>
      </div>

      {/* 4. THE PHYSICAL FLYING ALIEN & DIALOGUE SPEECH CLOUD */}
      <div
        className="absolute z-50 pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          left: `${alienPos.x}px`,
          top: `${alienPos.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className={`relative flex items-center ${isBubbleAbove ? 'flex-col-reverse' : 'flex-col'}`}>
          {/* A. Animated Alien Body */}
          <div
            className={`relative w-12 h-12 sm:w-16 sm:h-16 md:w-22 md:h-22 cursor-pointer transition-transform duration-300 ${
              isWarping ? 'scale-125 rotate-6' : 'hover:scale-110'
            }`}
            onClick={() => {
              soundFx.playAlienPop();
              handleToggleSpeak();
            }}
            title="Click me to hear instruction aloud!"
          >
            {/* Rocket Thruster Particles */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-4 flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-cyan-400 opacity-75 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-teal-300 opacity-90" />
            </div>

            {/* Glowing Alien Halo */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400/20 to-cyan-500/30 blur-md pointer-events-none" />

            {/* Sci-Fi Alien Vector SVG */}
            <svg
              viewBox="0 0 64 64"
              className="w-full h-full drop-shadow-[0_6px_14px_rgba(45,212,191,0.7)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Antenna with Pulsing Glowing Orb */}
              <line x1="32" y1="16" x2="32" y2="7" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="32" cy="6" r="4" fill="#a7f3d0" className="animate-pulse" />
              <circle cx="32" cy="6" r="2" fill="#ffffff" />

              {/* Spaceship / Hover Jetpack Pod */}
              <ellipse cx="32" cy="46" rx="20" ry="6" fill="#0f2638" stroke="#38bdf8" strokeWidth="1.5" />
              <ellipse cx="32" cy="48" rx="14" ry="3.5" fill="#1e3a5f" />
              <ellipse cx="32" cy="53" rx="6" ry="2" fill="#38bdf8" opacity="0.8" className="animate-ping" />
              <polygon points="28,52 36,52 32,58" fill="#2dd4bf" opacity="0.7" />

              {/* Alien Head (Bright Mint Green) */}
              <ellipse cx="32" cy="27" rx="16" ry="14" fill="#10b981" />
              <ellipse cx="32" cy="25" rx="14" ry="12" fill="#34d399" />

              {/* Astronaut Glass Dome Visor */}
              <ellipse cx="32" cy="28" rx="18" ry="16" fill="rgba(56, 189, 248, 0.18)" stroke="#38bdf8" strokeWidth="1.5" />
              <path
                d="M 20 20 Q 28 14 38 18"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Big Expressive Alien Eyes */}
              {isBlinking ? (
                <>
                  <line x1="22" y1="28" x2="28" y2="28" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
                  <line x1="36" y1="28" x2="42" y2="28" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <ellipse cx="25" cy="27" rx="4.5" ry="5.5" fill="#064e3b" />
                  <circle cx="26.5" cy="25.5" r="1.8" fill="#ffffff" />
                  <circle cx="24" cy="28.5" r="0.8" fill="#a7f3d0" />

                  <ellipse cx="39" cy="27" rx="4.5" ry="5.5" fill="#064e3b" />
                  <circle cx="40.5" cy="25.5" r="1.8" fill="#ffffff" />
                  <circle cx="38" cy="28.5" r="0.8" fill="#a7f3d0" />
                </>
              )}

              {/* Cute Smiling Mouth */}
              <path d="M 29 34 Q 32 37 35 34" stroke="#064e3b" strokeWidth="1.8" strokeLinecap="round" fill="none" />

              {/* Rosy Cheeks */}
              <circle cx="20" cy="32" r="2" fill="#6ee7b7" opacity="0.6" />
              <circle cx="44" cy="32" r="2" fill="#6ee7b7" opacity="0.6" />

              {/* Directional Pointing Mitten */}
              {currentStep.pointingDirection === 'up' ? (
                <>
                  <circle cx="12" cy="38" r="3.5" fill="#34d399" stroke="#10b981" strokeWidth="1" />
                  {/* Right hand pointing UP */}
                  <g transform="translate(48, 18) rotate(-45)">
                    <rect x="0" y="0" width="6" height="15" rx="3" fill="#34d399" stroke="#10b981" strokeWidth="1" />
                    <circle cx="3" cy="2" r="2.5" fill="#a7f3d0" />
                  </g>
                </>
              ) : currentStep.pointingDirection === 'right' ? (
                <>
                  <circle cx="12" cy="38" r="3.5" fill="#34d399" stroke="#10b981" strokeWidth="1" />
                  {/* Right hand pointing RIGHT */}
                  <g transform="translate(50, 28) rotate(70)">
                    <rect x="0" y="0" width="6" height="15" rx="3" fill="#34d399" stroke="#10b981" strokeWidth="1" />
                    <circle cx="3" cy="2" r="2.5" fill="#a7f3d0" />
                  </g>
                </>
              ) : currentStep.pointingDirection === 'down' ? (
                <>
                  <circle cx="12" cy="38" r="3.5" fill="#34d399" stroke="#10b981" strokeWidth="1" />
                  {/* Hand pointing DOWN */}
                  <g transform="translate(48, 38) rotate(145)">
                    <rect x="0" y="0" width="6" height="15" rx="3" fill="#34d399" stroke="#10b981" strokeWidth="1" />
                    <circle cx="3" cy="2" r="2.5" fill="#a7f3d0" />
                  </g>
                </>
              ) : (
                /* Both hands waving excitedly */
                <>
                  <circle cx="10" cy="30" r="4" fill="#34d399" stroke="#10b981" strokeWidth="1" />
                  <circle cx="54" cy="30" r="4" fill="#34d399" stroke="#10b981" strokeWidth="1" />
                </>
              )}
            </svg>
          </div>

          {/* B. The Alien Speech Cloud / Dialogue Box */}
          <div className="relative my-1.5 md:my-2 w-[min(255px,85vw)] sm:w-[320px] md:w-[360px] animate-in fade-in zoom-in-95 duration-200">
            {/* Ambient Cyan Glow */}
            <div className="absolute inset-0 -m-1.5 md:-m-2 rounded-2xl md:rounded-3xl bg-cyan-500/20 blur-xl pointer-events-none" />

            {/* Cloud Bubble Card */}
            <div className="relative bg-[#0a1424]/98 backdrop-blur-xl border-2 border-[#2dd4bf]/60 rounded-2xl md:rounded-3xl p-2.5 sm:p-4 md:p-5 shadow-[0_16px_45px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.15)] text-slate-100 flex flex-col gap-1.5 md:gap-2.5">
              
              {/* Header: Step Badge + Audio Button + Close/Skip */}
              <div className="flex items-center justify-between pb-1.5 md:pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] md:text-[10px] font-mono font-bold ${currentStep.badgeColor}`}
                  >
                    <span>🛸</span>
                    <span>{currentStep.badge}</span>
                  </span>
                  <span className="text-[9px] md:text-[10px] font-mono text-slate-400">
                    {currentStep.stepNumber}/{currentStep.totalSteps}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleToggleSpeak}
                    className={`p-1 md:p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isSpeaking
                        ? 'bg-purple-900 text-purple-200 border border-purple-500 animate-pulse'
                        : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                    }`}
                    title={isSpeaking ? 'Stop voice reading' : 'Listen aloud'}
                    aria-label="Listen aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>

                  <button
                    onClick={handleSkip}
                    className="p-1 md:p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Skip tutorial"
                    aria-label="Skip"
                  >
                    <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xs sm:text-sm md:text-base font-bold font-heading text-white tracking-wide">
                {currentStep.title}
              </h3>

              {/* Alien Speech Message */}
              <p className="text-[11px] md:text-xs text-slate-200 font-sans leading-snug md:leading-relaxed">
                {currentStep.message}
              </p>

              {/* Action Hint Box */}
              <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-[10px] md:text-[11px] font-mono font-bold text-cyan-200">
                {currentStep.actionHint}
              </div>

              {/* Footer: Progress Indicators & Navigation Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-1">
                {/* Step Dots */}
                <div className="flex items-center gap-1.5">
                  {TUTORIAL_STEPS.map((step, idx) => (
                    <button
                      key={step.id}
                      onClick={() => {
                        stopSpeaking();
                        setIsSpeaking(false);
                        setCurrentStepIndex(idx);
                        playStepTransition();
                      }}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === currentStepIndex
                          ? 'w-6 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                          : idx < currentStepIndex
                          ? 'w-2 bg-teal-600'
                          : 'w-2 bg-slate-700'
                      }`}
                      title={`Jump to step ${idx + 1}: ${step.title}`}
                      aria-label={`Step ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Back & Next Actions */}
                <div className="flex items-center gap-1.5">
                  {currentStepIndex > 0 && (
                    <button
                      onClick={handlePrev}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  )}

                  <button
                    onClick={handleNext}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/60 transition-all cursor-pointer hover:scale-105"
                  >
                    <span>
                      {currentStepIndex === TUTORIAL_STEPS.length - 1
                        ? 'Start Exploring! 🚀'
                        : 'Next Step'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
