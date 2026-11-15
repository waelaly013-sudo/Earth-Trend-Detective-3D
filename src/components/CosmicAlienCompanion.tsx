/**
 * Cosmic Alien Companion Component
 * 
 * Features:
 * 1. Small alien body drifting smoothly in space around 3D Earth.
 * 2. On click: Explodes with colorful stardust shockwave, particles, and pop sound!
 * 3. Shows a small, simple floating cloud message (NOT a big modal).
 * 4. All tips are short, simple, and in B1 English language:
 *    - Stay Safe
 *    - Help Our Planet
 *    - About the App
 *    - Small Jokes
 * 5. Re-spawns back into space with a cheerful cosmic warp!
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ALIEN_TIPS, AlienTip, getRandomAlienTip } from '../data/alienTipsData';
import { soundFx } from '../utils/audioSynth';
import { X, Sparkles, RefreshCw, Rocket, Volume2, VolumeX } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  symbol: string;
}

interface CosmicAlienCompanionProps {
  soundEnabled?: boolean;
}

// What this does: Animates a smaller drifting alien companion that bounces softly around the screen and bursts into sparkles with a cloud tip when clicked.
// On the website: Floats across space and opens a clean white cloud bubble with short B1 tips and cosmic jokes when tapped.
// Used as: An alternate lightweight floating alien companion component.
export const CosmicAlienCompanion: React.FC<CosmicAlienCompanionProps> = ({
  soundEnabled = true,
}) => {
  // State: 'floating' | 'exploding' | 'cloud' | 'respawning'
  const [alienState, setAlienState] = useState<'floating' | 'exploding' | 'cloud' | 'respawning'>('floating');
  
  // Alien position in viewport coordinates (px)
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? Math.max(80, window.innerWidth - 180) : 300,
    y: typeof window !== 'undefined' ? 140 : 150,
  });

  // Velocity and wander angle
  const velocityRef = useRef<{ vx: number; vy: number; angle: number }>({
    vx: 0.7,
    vy: 0.5,
    angle: 0.6,
  });

  // Current active tip
  const [activeTip, setActiveTip] = useState<AlienTip>(() => getRandomAlienTip());

  // Cloud position (anchored near explosion, clamped within viewport)
  const [cloudPos, setCloudPos] = useState<{ x: number; y: number }>({ x: 300, y: 150 });

  // Explosion particles
  const [particles, setParticles] = useState<Particle[]>([]);

  // Hover state (alien reacts playfully when cursor hovers near it)
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Blinking eyes animation state
  const [isBlinking, setIsBlinking] = useState<boolean>(false);

  // Bobbing offset
  const [bobOffset, setBobOffset] = useState<number>(0);

  // Auto-respawn timer ref
  const autoRespawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Random eye blink loop
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Smooth floating motion loop in space
  useEffect(() => {
    if (alienState !== 'floating') return;

    let animId: number;
    let time = 0;

    const updateFlight = () => {
      time += 0.05;
      setBobOffset(Math.sin(time * 2) * 4);

      setPosition((prev) => {
        const padding = { top: 75, bottom: 130, left: 30, right: 30 };
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        let { vx, vy, angle } = velocityRef.current;

        // Add subtle sine-wave wander
        angle += (Math.random() - 0.5) * 0.12;
        const speed = isHovered ? 0.25 : 0.75; // slow down when hovered for easy catching

        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;

        let nextX = prev.x + vx;
        let nextY = prev.y + vy;

        // Bounce gently away from boundaries
        if (nextX < padding.left) {
          nextX = padding.left;
          angle = Math.PI - angle;
        } else if (nextX > winW - padding.right - 60) {
          nextX = winW - padding.right - 60;
          angle = Math.PI - angle;
        }

        if (nextY < padding.top) {
          nextY = padding.top;
          angle = -angle;
        } else if (nextY > winH - padding.bottom - 60) {
          nextY = winH - padding.bottom - 60;
          angle = -angle;
        }

        velocityRef.current = { vx, vy, angle };
        return { x: nextX, y: nextY };
      });

      animId = requestAnimationFrame(updateFlight);
    };

    animId = requestAnimationFrame(updateFlight);
    return () => cancelAnimationFrame(animId);
  }, [alienState, isHovered]);

  // What this does: Triggers when the user taps the drifting alien — plays a pop sound, picks a new tip, spawns 24 star particles, and opens the cloud bubble.
  // On the website: Makes the alien explode into glowing sparks and pop open a short tip card near where it was clicked.
  // Used as: The click-to-pop interaction handler for the companion.
  const handleAlienClick = useCallback(() => {
    if (alienState !== 'floating') return;

    // Play explosion sound
    if (soundEnabled) {
      soundFx.playAlienPop();
    }

    // Pick a fresh tip
    const nextTip = getRandomAlienTip(activeTip.id);
    setActiveTip(nextTip);

    // Calculate explosion position and clamped cloud position
    const explX = position.x + 28;
    const explY = position.y + 28;

    // Create 24 colorful explosion sparks & stardust
    const particleColors = ['#4ade80', '#38bdf8', '#fbbf24', '#c084fc', '#f43f5e', '#ffffff'];
    const particleSymbols = ['⭐', '✨', '✦', '•', '🌟', '💥'];
    const newParticles: Particle[] = Array.from({ length: 24 }).map((_, i) => {
      const angle = (i / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 2.5 + Math.random() * 4.5;
      return {
        id: i,
        x: explX,
        y: explY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: particleColors[i % particleColors.length],
        size: 10 + Math.random() * 12,
        symbol: particleSymbols[i % particleSymbols.length],
      };
    });

    setParticles(newParticles);
    setAlienState('exploding');

    // Clamp small cloud position so it never overflows viewport
    const cloudWidth = 290;
    const cloudHeight = 150;
    const clampedX = Math.max(20, Math.min(window.innerWidth - cloudWidth - 20, explX - cloudWidth / 2));
    const clampedY = Math.max(80, Math.min(window.innerHeight - cloudHeight - 120, explY - 60));
    setCloudPos({ x: clampedX, y: clampedY });

    // Transition from explosion to the small cloud message
    setTimeout(() => {
      setAlienState('cloud');
    }, 450);

    // Auto-respawn after 16 seconds if user doesn't close it
    if (autoRespawnTimerRef.current) clearTimeout(autoRespawnTimerRef.current);
    autoRespawnTimerRef.current = setTimeout(() => {
      respawnAlien();
    }, 16000);
  }, [alienState, soundEnabled, activeTip.id, position]);

  // What this does: Hides the tip cloud and warps the alien back into space at a random new screen position.
  // On the website: Runs when clicking Close, Fly Again, or automatically after 16 seconds.
  // Used as: The respawn handler for the floating companion.
  const respawnAlien = useCallback(() => {
    if (autoRespawnTimerRef.current) clearTimeout(autoRespawnTimerRef.current);
    setAlienState('respawning');

    if (soundEnabled) {
      soundFx.playAlienRespawn();
    }

    // Spawn at a new pleasant cosmic location
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const randomX = Math.floor(60 + Math.random() * (winW - 160));
    const randomY = Math.floor(100 + Math.random() * (winH - 260));

    setPosition({ x: randomX, y: randomY });
    velocityRef.current.angle = Math.random() * Math.PI * 2;

    setTimeout(() => {
      setAlienState('floating');
    }, 400);
  }, [soundEnabled]);

  // What this does: Picks another random tip from the list without closing the cloud bubble.
  // On the website: Powers the Next tip button inside the white cloud card.
  // Used as: The tip shuffle handler inside the companion cloud.
  const handleNextTip = useCallback(() => {
    if (soundEnabled) soundFx.playTick();
    setActiveTip((prev) => getRandomAlienTip(prev.id));
  }, [soundEnabled]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoRespawnTimerRef.current) clearTimeout(autoRespawnTimerRef.current);
    };
  }, []);

  return (
    <>
      {/* 1. FLOATING ALIEN BODY IN SPACE */}
      {alienState === 'floating' && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Catchy Alien Explorer: Click to explode and get a short tip"
          onClick={handleAlienClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleAlienClick();
            }
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            transform: `translate3d(${position.x}px, ${position.y + bobOffset}px, 0)`,
            transition: 'transform 0.04s linear',
          }}
          className="fixed z-40 cursor-pointer select-none group focus:outline-none"
        >
          {/* Catchy Pulsing Tag */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-all duration-200">
            <div className="px-2 py-0.5 rounded-full bg-emerald-950/85 border border-emerald-400/60 text-emerald-300 text-[10px] font-mono font-bold tracking-wide shadow-[0_0_12px_rgba(52,211,153,0.4)] flex items-center gap-1 group-hover:scale-110 group-hover:border-emerald-300 group-hover:bg-emerald-900 animate-bounce">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Tap me! 👽</span>
            </div>
          </div>

          {/* Alien Body Container */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            {/* Cosmic Stardust Glow Aura */}
            <div
              className={`absolute inset-0 rounded-full bg-emerald-400/25 blur-md transition-all duration-300 ${
                isHovered ? 'scale-125 bg-emerald-400/40' : 'animate-pulse'
              }`}
            />

            {/* Anti-gravity propulsion thruster ring */}
            <div className="absolute -bottom-1 w-6 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-xs opacity-75 animate-pulse" />

            {/* SVG Alien Body */}
            <svg
              viewBox="0 0 64 64"
              className={`w-full h-full filter drop-shadow-[0_4px_10px_rgba(16,185,129,0.5)] transition-transform duration-200 ${
                isHovered ? 'scale-110' : ''
              }`}
            >
              {/* Antenna with glowing energy orb */}
              <path
                d="M 32 14 Q 35 7 38 4"
                stroke="#4ade80"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="39" cy="4" r="3.5" fill="#a7f3d0" className="animate-pulse">
                <animate attributeName="r" values="3;4.5;3" dur="1.5s" repeatCount="indefinite" />
              </circle>

              {/* Helmet Glass Bubble (translucent astronaut glass) */}
              <ellipse
                cx="32"
                cy="26"
                rx="21"
                ry="18"
                fill="rgba(6, 182, 212, 0.2)"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="2 0"
              />
              {/* Glass sheen highlight */}
              <path
                d="M 20 18 Q 28 12 38 15"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />

              {/* Alien Head (smooth lime green) */}
              <ellipse cx="32" cy="27" rx="15" ry="13" fill="#22c55e" />
              {/* Cute alien cheek blush */}
              <ellipse cx="22" cy="31" rx="2" ry="1.2" fill="#86efac" opacity="0.6" />
              <ellipse cx="42" cy="31" rx="2" ry="1.2" fill="#86efac" opacity="0.6" />

              {/* Eyes */}
              {isBlinking ? (
                // Blinking closed eyes
                <>
                  <path d="M 22 26 Q 26 28 30 26" stroke="#052e16" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <path d="M 34 26 Q 38 28 42 26" stroke="#052e16" strokeWidth="2" strokeLinecap="round" fill="none" />
                </>
              ) : (
                // Big shiny alien eyes
                <>
                  {/* Left Eye */}
                  <ellipse cx="26" cy="25" rx="4.5" ry="5.5" fill="#022c22" />
                  <circle cx="27.5" cy="23.5" r="1.8" fill="#ffffff" />
                  <circle cx="25" cy="27" r="0.8" fill="#ffffff" />

                  {/* Right Eye */}
                  <ellipse cx="38" cy="25" rx="4.5" ry="5.5" fill="#022c22" />
                  <circle cx="39.5" cy="23.5" r="1.8" fill="#ffffff" />
                  <circle cx="37" cy="27" r="0.8" fill="#ffffff" />
                </>
              )}

              {/* Friendly smile */}
              <path
                d="M 29 33 Q 32 36 35 33"
                stroke="#052e16"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />

              {/* Tiny Cute Body / Space Suit */}
              <path
                d="M 24 39 Q 32 37 40 39 L 42 49 Q 32 52 22 49 Z"
                fill="#15803d"
                stroke="#4ade80"
                strokeWidth="1"
              />

              {/* Space suit badge */}
              <circle cx="32" cy="44" r="2.2" fill="#38bdf8" />

              {/* Waving left arm */}
              <path
                d="M 22 41 Q 16 39 15 34"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="15" cy="33" r="2" fill="#4ade80" />

              {/* Right arm */}
              <path
                d="M 42 41 Q 48 43 49 47"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="49" cy="48" r="2" fill="#4ade80" />

              {/* Mini cosmic thruster sparks underneath */}
              <path d="M 29 51 L 32 58 L 35 51 Z" fill="#38bdf8" className="animate-pulse" />
              <path d="M 30.5 51 L 32 56 L 33.5 51 Z" fill="#ffffff" />
            </svg>
          </div>
        </div>
      )}

      {/* 2. EXPLOSION ANIMATION WITH STARDUST PARTICLES */}
      {alienState === 'exploding' && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {/* Shockwave expanding ring */}
          <div
            style={{
              left: `${position.x + 28}px`,
              top: `${position.y + 28}px`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-emerald-400 bg-emerald-400/30 animate-ping opacity-90"
          />

          {/* Comic "POP!" badge */}
          <div
            style={{
              left: `${position.x + 28}px`,
              top: `${position.y + 10}px`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-heading font-black text-xs tracking-wider shadow-lg transform scale-125 animate-bounce"
          >
            💥 POP! ✨
          </div>

          {/* Flying Stardust and Sparks */}
          {particles.map((p) => (
            <span
              key={p.id}
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                color: p.color,
                fontSize: `${p.size}px`,
                transform: `translate(${p.vx * 14}px, ${p.vy * 14}px)`,
                transition: 'all 0.45s cubic-bezier(0.1, 0.8, 0.2, 1)',
                opacity: 0.9,
              }}
              className="absolute pointer-events-none filter drop-shadow-[0_0_8px_currentColor]"
            >
              {p.symbol}
            </span>
          ))}
        </div>
      )}

      {/* 3. SMALL CLOUD TIP MESSAGE (Simple, B1 English, Small Cloud shape) */}
      {alienState === 'cloud' && (
        <div
          style={{
            transform: `translate3d(${cloudPos.x}px, ${cloudPos.y}px, 0)`,
          }}
          className="fixed z-50 select-none animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Cute Cloud Speech Bubble */}
          <div className="relative w-[285px] sm:w-[310px] bg-white text-slate-800 rounded-3xl p-4 shadow-[0_12px_35px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.9),0_0_20px_rgba(56,189,248,0.3)] backdrop-blur-md">
            {/* Top Cloud Puffs (Visual cloud contours) */}
            <div className="absolute -top-3 left-6 w-9 h-9 bg-white rounded-full shadow-xs pointer-events-none" />
            <div className="absolute -top-4 left-14 w-12 h-12 bg-white rounded-full shadow-xs pointer-events-none" />
            <div className="absolute -top-3 left-25 w-10 h-10 bg-white rounded-full shadow-xs pointer-events-none" />
            <div className="absolute -top-3.5 right-12 w-11 h-11 bg-white rounded-full shadow-xs pointer-events-none" />

            {/* Cloud Content Header */}
            <div className="relative z-10 flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-base" role="img" aria-label="Tip Icon">
                  {activeTip.emoji}
                </span>
                <span
                  style={{ color: activeTip.color }}
                  className="text-xs font-heading font-bold uppercase tracking-wider"
                >
                  {activeTip.categoryLabel}
                </span>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={respawnAlien}
                title="Send Alien back to space"
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Short & Simple B1 English Message */}
            <div className="relative z-10 py-1">
              <p className="text-[13px] sm:text-sm font-medium text-slate-700 leading-snug">
                "{activeTip.text}"
              </p>
            </div>

            {/* Bottom Actions: Next Tip or Send Alien Back */}
            <div className="relative z-10 flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={handleNextTip}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-all cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-sky-500" />
                <span>Next tip</span>
              </button>

              <button
                type="button"
                onClick={respawnAlien}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all cursor-pointer shadow-xs hover:shadow-md"
              >
                <Rocket className="w-3 h-3" />
                <span>Fly again!</span>
              </button>
            </div>

            {/* Little Cloud Puffs at the bottom pointing to space */}
            <div className="absolute -bottom-2.5 left-10 w-4 h-4 bg-white rounded-full shadow-xs pointer-events-none" />
            <div className="absolute -bottom-4 left-7 w-2.5 h-2.5 bg-white rounded-full shadow-xs pointer-events-none" />
          </div>
        </div>
      )}

      {/* 4. RESPAWN WARP SPARKLE */}
      {alienState === 'respawning' && (
        <div
          style={{
            left: `${position.x + 28}px`,
            top: `${position.y + 28}px`,
          }}
          className="fixed z-40 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        >
          <div className="w-8 h-8 rounded-full bg-cyan-400/40 border border-cyan-300 animate-ping" />
          <span className="absolute -top-6 -left-8 whitespace-nowrap text-[11px] font-mono text-cyan-300 font-semibold animate-pulse">
            🛸 Warp back!
          </span>
        </div>
      )}
    </>
  );
};
