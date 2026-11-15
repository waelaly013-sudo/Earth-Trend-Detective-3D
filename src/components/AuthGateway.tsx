/**
 * NASA Earth Trend Detective - Authentication Gateway
 * 
 * Enforces mandatory login before entering the platform as requested:
 * "i want the user to log in before start using the account."
 * 
 * Features:
 * 1. High-tech NASA telemetry branding with live planetary backdrop.
 * 2. 1-Click Instant Demo Profiles (Research Scientist, Academic Student, Field Agro-Ecologist).
 * 3. Custom Email/Password Sign-In and Account Registration.
 * 4. Adaptive Data Complexity mode selection (Simple, Normal, Complicated).
 * 5. Instant trigger for the Onboarding Walkthrough upon login.
 */

import React, { useState } from 'react';
import {
  Satellite,
  User,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Globe2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Scale,
  PieChart,
  ChevronRight,
  Flame,
  Layers,
  Clock,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataComplexityMode } from '../types/user';
import { soundFx } from '../utils/audioSynth';

interface AuthGatewayProps {
  onLoginSuccess: () => void;
}

// What this does: Builds the login and sign-up screen that asks users to enter their email, password, or pick a demo account before entering the app.
// On the website: Appears as the welcome sign-in card over the starry 3D Earth background when the user first arrives.
// Used as: The front-door login gate of the website.
export const AuthGateway: React.FC<AuthGatewayProps> = ({ onLoginSuccess }) => {
  const { signIn, signUp, guestLogin, dataMode } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [selectedComplexity, setSelectedComplexity] = useState<DataComplexityMode>(dataMode);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // What this does: Automatically fills in the email, password, name, and complexity setting for one of the three ready-made sample profiles.
  // On the website: Lets someone click "Dr. Elena", "Samuel", or "Maria" to try the app quickly without typing everything from scratch.
  // Used as: A one-click demo login filler inside the auth screen.
  const handleQuickFill = (type: 'researcher' | 'student' | 'farmer') => {
    soundFx.playTick();
    if (type === 'researcher') {
      setEmail('dr.elena.rostova@nasa-polar.org');
      setPassword('arctic2026');
      setName('Dr. Elena Rostova');
      setSelectedComplexity('complicated');
    } else if (type === 'student') {
      setEmail('samuel.green@planet.edu');
      setPassword('climate2026');
      setName('Samuel Green');
      setSelectedComplexity('simple');
    } else {
      setEmail('maria.santos@agro-ecology.org');
      setPassword('field2026');
      setName('Maria Santos');
      setSelectedComplexity('normal');
    }
  };

  // What this does: Checks the typed email and password, logs the user into their saved account, and triggers the transition into the app.
  // On the website: Runs when the user clicks "Sign In & Launch Onboarding" and either shows an error or starts the intro animation.
  // Used as: The sign-in form submit handler.
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = signIn(email, password, selectedComplexity);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'Authentication failed. Please verify credentials.');
      } else {
        soundFx.playChime();
        onLoginSuccess();
      }
    }, 250);
  };

  // What this does: Creates a brand new user profile with their name, email, password, and chosen reading level, then starts the post-login flow.
  // On the website: Runs when the user clicks "Create Profile & Launch Onboarding" on the Create Account tab.
  // Used as: The account registration submit handler.
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = signUp(email, password, name, selectedComplexity);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'Registration failed. Please check your details.');
      } else {
        soundFx.playChime();
        onLoginSuccess();
      }
    }, 250);
  };

  // What this does: Lets visitors enter the platform right away as a temporary guest without creating a password.
  // On the website: Runs when someone clicks "Explore as Guest Investigator" at the bottom of the login card.
  // Used as: The guest-access bypass handler.
  const handleGuestEntry = () => {
    soundFx.playChime();
    guestLogin(selectedComplexity);
    onLoginSuccess();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-2 md:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto font-mono">
      {/* Centered Glassmorphic Auth Card */}
      <div className="relative w-full max-w-sm md:max-w-xl bg-slate-950/95 border border-cyan-500/50 rounded-xl md:rounded-2xl shadow-[0_0_80px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200 my-auto">
        {/* Banner with NASA Insignia styling */}
        <div className="p-3.5 md:p-6 bg-gradient-to-r from-slate-950 via-cyan-950/80 to-slate-950 border-b border-cyan-500/30 text-center relative">
          <div className="inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-0.5 md:py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-[9px] md:text-[10px] uppercase font-bold tracking-widest mb-2 md:mb-3">
            <Satellite className="w-3 h-3 md:w-3.5 md:h-3.5 text-cyan-400 animate-spin [animation-duration:15s]" />
            <span>NASA Earth Trend Detective • Portal</span>
          </div>

          <h1 className="text-base sm:text-xl md:text-2xl font-bold text-white tracking-tight font-heading">
            Sign In to Start Investigating Earth
          </h1>
          <p className="text-[10.5px] md:text-xs text-slate-300 mt-1 max-w-md mx-auto leading-snug">
            Please log in before accessing your detective account. Your personal field notes, bookmarked regions, and custom simulation state will be preserved.
          </p>
        </div>

        {/* 1-Click Fast Track Demo Personas */}
        <div className="px-3.5 md:px-6 pt-2.5 md:pt-4 pb-2 bg-slate-900/60 border-b border-slate-800">
          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 md:mb-2">
            Instant 1-Click Demo Profiles:
          </span>
          <div className="grid grid-cols-3 md:grid-cols-3 gap-1.5 md:gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('researcher')}
              className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-slate-950/90 border border-cyan-500/30 hover:border-cyan-400 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1 md:gap-1.5 text-cyan-300 text-[9.5px] md:text-[11px] font-bold">
                <GraduationCap className="w-3 h-3 md:w-3.5 md:h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">Dr. Elena</span>
              </div>
              <span className="text-[8px] md:text-[9px] text-slate-400 block mt-0.5 truncate">Complicated</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('student')}
              className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-slate-950/90 border border-emerald-500/30 hover:border-emerald-400 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1 md:gap-1.5 text-emerald-300 text-[9.5px] md:text-[11px] font-bold">
                <PieChart className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Samuel</span>
              </div>
              <span className="text-[8px] md:text-[9px] text-slate-400 block mt-0.5 truncate">Simple</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('farmer')}
              className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-slate-950/90 border border-purple-500/30 hover:border-purple-400 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1 md:gap-1.5 text-purple-300 text-[9.5px] md:text-[11px] font-bold">
                <Scale className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">Maria</span>
              </div>
              <span className="text-[8px] md:text-[9px] text-slate-400 block mt-0.5 truncate">Normal</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex border-b border-slate-800 bg-slate-950">
          <button
            type="button"
            onClick={() => {
              soundFx.playTick();
              setMode('signin');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 md:py-3 text-[10.5px] md:text-xs font-bold text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'signin'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              soundFx.playTick();
              setMode('signup');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 md:py-3 text-[10.5px] md:text-xs font-bold text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="p-3.5 md:p-6 space-y-2.5 md:space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Your Full Name / Title
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g., Dr. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white text-xs outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="investigator@nasa.gov or email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
              Account Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white text-xs outline-none"
              />
            </div>
          </div>

          {/* Starting Complexity Preference */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Preferred Data Complexity</span>
              <span className="text-[9px] text-cyan-400">Can change anytime in settings</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'simple' as DataComplexityMode, label: 'Simple', desc: 'B1 plain words + visual analogies' },
                { id: 'normal' as DataComplexityMode, label: 'Normal', desc: 'Standard anomalies & trendlines' },
                { id: 'complicated' as DataComplexityMode, label: 'Complicated', desc: 'W/m² radiative forcing & p-values' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    soundFx.playTick();
                    setSelectedComplexity(c.id);
                  }}
                  className={`p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                    selectedComplexity === c.id
                      ? 'bg-cyan-950/60 border-cyan-400 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold block">{c.label}</span>
                  <span className="text-[9px] leading-tight block mt-0.5 opacity-80">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating Profile...</span>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In & Launch Onboarding' : 'Create Profile & Launch Onboarding'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Guest Alternative Entry */}
        <div className="px-6 py-3.5 bg-slate-900/40 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Just testing the app?</span>
          <button
            type="button"
            onClick={handleGuestEntry}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-[11px] font-bold transition-colors cursor-pointer"
          >
            Explore as Guest Investigator
          </button>
        </div>
      </div>
    </div>
  );
};
