/**
 * NASA Earth Trend Detective - Registration Intro Cinematic Animation
 * 
 * Plays after the user completes the profile registration protocols (email and password).
 * Displays the Phoenix ascending towards the golden sun above Earth's orbital curve,
 * surrounded by an ambient cosmic starfield and holographic telemetry HUD.
 * 
 * Smoothly fades out upon completion before navigating into the main application,
 * seamlessly handing off to the Alien Guided Tutorial.
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  Satellite,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Volume2,
  VolumeX,
  Compass,
  CheckCircle2,
  Layers,
  Radio,
  Eye
} from 'lucide-react';
import { soundFx } from '../utils/audioSynth';

interface RegistrationIntroAnimationProps {
  onComplete: () => void;
  userEmail?: string;
  userName?: string;
}

// What this does: Plays the Phoenix intro video with a glowing space backdrop right after login/registration, then smoothly fades out into the main 3D globe app.
// On the website: Shows a welcome intro screen with the Phoenix video, progress bar, mute button, and skip button before opening the Earth view.
// Used as: The cinematic transition screen between logging in and starting the app tutorial.
export const RegistrationIntroAnimation: React.FC<RegistrationIntroAnimationProps> = ({
  onComplete,
  userEmail,
  userName,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [hasEnded, setHasEnded] = useState<boolean>(false);

  // What this does: Plays a welcome space chime as soon as the intro screen appears.
  // On the website: Gives friendly audio feedback right when the user finishes logging in.
  // Used as: The opening sound effect hook for the intro video.
  useEffect(() => {
    soundFx.playTourChime();
  }, []);

  // What this does: Reads how far the video has played and updates the percentage progress bar on screen.
  // On the website: Moves the glowing progress bar from 0% to 100% while the Phoenix video plays.
  // Used as: The video progress tracker.
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration || 2.0;
      const pct = Math.min(100, Math.max(0, (current / duration) * 100));
      setProgress(pct);
    }
  };

  // What this does: Starts a smooth 1-second fade-out effect and then tells the main app to take over once the video ends or is skipped.
  // On the website: Makes the intro gently fade away instead of snapping harshly to the 3D globe.
  // Used as: The completion and fade-out handler for the intro animation.
  const handleFinish = () => {
    if (hasEnded || isFadingOut) return;
    setHasEnded(true);
    setIsFadingOut(true);
    soundFx.playChime();

    // 1000ms smooth fade transition into the app
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  // What this does: Lets the user jump straight past the intro video into the app at any moment.
  // On the website: Powers the "Skip" button in the top-right corner of the intro screen.
  // Used as: The skip button click handler.
  const handleSkip = () => {
    soundFx.playTick();
    handleFinish();
  };

  // What this does: Turns the intro video's sound on or off when the speaker icon is clicked.
  // On the website: Mutes or unmutes the Phoenix video audio.
  // Used as: The mute/unmute toggle handler.
  const toggleMute = () => {
    soundFx.playTick();
    const next = !isMuted;
    setIsMuted(next);
    if (videoRef.current) {
      videoRef.current.muted = next;
    }
  };

  // What this does: Acts as a safety backup timer so if a browser blocks video autoplay, the screen still fades smoothly into the app after 3.8 seconds.
  // On the website: Prevents users from ever getting stuck on the intro screen.
  // Used as: An automatic fallback timeout for browsers with strict autoplay rules.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasEnded && !isFadingOut) {
        handleFinish();
      }
    }, 3800);
    return () => clearTimeout(timer);
  }, [hasEnded, isFadingOut]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[#020614] select-none transition-opacity duration-1000 ease-in-out font-mono ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 1. Mirrored Background Video Glow (seamlessly extends sun flare and blue earth curve to full screen) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <video
          ref={bgVideoRef}
          src="/assets/aistudio/phoenix_intro_5a7f7bc6.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-150 blur-3xl opacity-30 brightness-110"
        />
        {/* Deep space radial gradients matching video colors */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.25)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(6,182,212,0.3)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
      </div>

      {/* 2. Top HUD Telemetry Banner */}
      <header className="relative z-10 w-full max-w-5xl px-3 sm:px-6 pt-2.5 md:pt-5 pb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] shrink-0">
            <Satellite className="w-4 h-4 md:w-5 md:h-5 animate-spin [animation-duration:18s]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[8.5px] md:text-[10px] uppercase font-bold tracking-widest text-cyan-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                NASA Verified
              </span>
              <span className="hidden sm:inline text-[9px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                Level 5 Clearance
              </span>
            </div>
            <h1 className="text-xs sm:text-sm md:text-base font-bold text-white font-heading tracking-wide truncate">
              Welcome, {userName || userEmail?.split('@')[0] || 'Detective'}
            </h1>
          </div>
        </div>

        {/* Audio Toggle & Skip Button */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400 animate-pulse" />}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="flex items-center gap-1 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl bg-slate-900/90 hover:bg-cyan-950/80 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-bold text-[10px] md:text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)]"
          >
            <span>Skip</span>
            <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </button>
        </div>
      </header>

      {/* 3. Center Screen: Seamless Phoenix Video & Holographic Ring */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-1.5 md:p-2 w-full max-w-4xl min-h-0">
        <div className="relative group max-h-[56vh] md:max-h-[68vh] aspect-[832/1260] rounded-xl md:rounded-2xl overflow-hidden border border-cyan-400/40 shadow-[0_0_60px_rgba(251,191,36,0.3),0_0_100px_rgba(6,182,212,0.25)] bg-slate-950/80">
          {/* Subtle Outer Holographic Vignette */}
          <div className="absolute inset-0 pointer-events-none rounded-xl md:rounded-2xl ring-1 ring-inset ring-white/10 z-10 shadow-[inset_0_0_40px_rgba(2,6,23,0.8)]" />

          {/* Primary Crisp Video */}
          <video
            ref={videoRef}
            src="/assets/aistudio/phoenix_intro_5a7f7bc6.mp4"
            autoPlay
            playsInline
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleFinish}
            onCanPlay={() => setIsReady(true)}
            className="w-full h-full object-cover"
          />

          {/* Golden Solar flare reflection banner on top */}
          <div className="absolute top-0 inset-x-0 h-12 md:h-16 bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none z-10" />

          {/* Earth blue atmosphere glow at bottom */}
          <div className="absolute bottom-0 inset-x-0 h-16 md:h-20 bg-gradient-to-t from-cyan-950/80 via-cyan-900/20 to-transparent pointer-events-none z-10" />

          {/* Subtitle Telemetry Overlay on Video */}
          <div className="absolute bottom-2 inset-x-2 md:bottom-3 md:inset-x-3 z-20 flex items-center justify-between text-[8.5px] md:text-[10px] text-cyan-200/90 font-mono bg-slate-950/60 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-cyan-500/30">
            <span className="flex items-center gap-1 font-bold truncate">
              <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-300 animate-spin [animation-duration:8s] shrink-0" />
              PHOENIX PROTOCOL
            </span>
            <span className="text-amber-300 font-bold shrink-0">
              {progress.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Dynamic Telemetry Status Bar below Video */}
        <div className="w-full max-w-xs md:max-w-md mt-2 md:mt-3 space-y-1">
          <div className="w-full bg-slate-900/80 rounded-full h-1 md:h-1.5 overflow-hidden border border-cyan-500/30">
            <div
              className="bg-gradient-to-r from-cyan-400 via-amber-400 to-cyan-300 h-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] md:text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-cyan-300">
              <Radio className="w-2.5 h-2.5 md:w-3 md:h-3 text-cyan-400 animate-pulse" />
              Syncing...
            </span>
            <span className="text-slate-300 font-bold">
              Opening Earth 3D
            </span>
          </div>
        </div>
      </main>

      {/* 4. Bottom Scientific Telemetry Cards */}
      <footer className="relative z-10 w-full max-w-5xl px-3 sm:px-6 pb-3 md:pb-5 pt-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 md:gap-2 text-[9px] md:text-[10px]">
          <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md">
            <div className="flex items-center gap-1 text-cyan-300 font-bold mb-0.5">
              <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Identity Verified</span>
            </div>
            <span className="text-slate-400 text-[8px] md:text-[9px] block truncate">
              {userEmail || 'Active Detective Credential'}
            </span>
          </div>

          <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-slate-950/80 border border-amber-500/30 backdrop-blur-md">
            <div className="flex items-center gap-1 text-amber-300 font-bold mb-0.5">
              <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Planetary Sensors</span>
            </div>
            <span className="text-slate-400 text-[8px] md:text-[9px] block truncate">
              MERRA-2 • MODIS • GPM • OMI
            </span>
          </div>

          <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-slate-950/80 border border-emerald-500/30 backdrop-blur-md">
            <div className="flex items-center gap-1 text-emerald-300 font-bold mb-0.5">
              <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Data Protection</span>
            </div>
            <span className="text-slate-400 text-[8px] md:text-[9px] block truncate">
              Encrypted Local Session
            </span>
          </div>

          <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-slate-950/80 border border-purple-500/30 backdrop-blur-md">
            <div className="flex items-center gap-1 text-purple-300 font-bold mb-0.5">
              <Compass className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">Alien Guide</span>
            </div>
            <span className="text-slate-400 text-[8px] md:text-[9px] block truncate">
              Ready for Tutorial
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
