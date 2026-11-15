/**
 * NASA Earth Trend Detective - User Interface & Account Modal
 * Allows the user to enter their email and password to save their data,
 * pick their preferred data complexity mode (Simple, Normal, Complicated),
 * view and manage saved reports, custom research notes, and personal observations.
 */

import React, { useState } from 'react';
import {
  X,
  User,
  KeyRound,
  Mail,
  ShieldCheck,
  Bookmark,
  FileText,
  Layers,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  PieChart,
  Scale,
  GraduationCap,
  Save,
  Compass,
  Workflow,
  Globe2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataComplexityMode } from '../types/user';
import { REAL_HUMAN_FIELD_REPORTS } from '../data/humanFieldReports';
import { soundFx } from '../utils/audioSynth';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReportDetails?: (reportId: string) => void;
  onOpenComplexityModal?: () => void;
  onOpenOnboardingWalkthrough?: () => void;
  onOpenArchitectureModal?: () => void;
  onRegistrationSuccess?: () => void;
  onReplayIntro?: () => void;
}

// What this does: Opens the in-app User Profile & Account modal where users can sign in, register, switch reading complexity, or manage saved field reports.
// On the website: Accessible anytime from the Mission menu so users can view their saved bookmarks, notes, or switch accounts.
// Used as: The account management and saved-data modal.
export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  onOpenReportDetails,
  onOpenComplexityModal,
  onOpenOnboardingWalkthrough,
  onOpenArchitectureModal,
  onRegistrationSuccess,
  onReplayIntro,
}) => {
  const {
    currentUser,
    dataMode,
    setDataMode,
    signIn,
    signUp,
    signOut,
    isReportSaved,
    toggleSaveReport,
    userSubmittedReports,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'profile'>(() => {
    return currentUser ? 'profile' : 'signin';
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedMode, setSelectedMode] = useState<DataComplexityMode>(dataMode);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // What this does: Automatically switches the modal to the Profile tab if the user is logged in, or Sign In tab if logged out, and clears old alert messages.
  // On the website: Ensures the modal always opens on the right screen whenever the user logs in, signs out, or reopens it.
  // Used as: A tab-sync effect for the user account modal.
  React.useEffect(() => {
    if (currentUser) {
      setActiveTab('profile');
      setSelectedMode(currentUser.preferredMode);
    } else {
      setActiveTab('signin');
      setSelectedMode(dataMode);
    }
    setErrorMessage('');
    setSuccessMessage('');
  }, [currentUser, dataMode, isOpen]);

  if (!isOpen) return null;

  // What this does: Fills the sign-in form with preset researcher or student demo credentials in one click.
  // On the website: Lets visitors test saved account features quickly without typing an email or password.
  // Used as: A 1-click demo credential helper inside the Sign In form.
  const handleQuickDemo = (type: 'researcher' | 'student') => {
    soundFx.playTick();
    if (type === 'researcher') {
      setEmail('elena.rostova@polar-research.org');
      setPassword('arctic2026');
      setName('Dr. Elena Rostova');
      setSelectedMode('complicated');
    } else {
      setEmail('samuel.green@planet.edu');
      setPassword('earth2026');
      setName('Samuel Green');
      setSelectedMode('simple');
    }
  };

  // What this does: Signs the user in with their email and password, saves their data mode, and optionally triggers the post-login callback.
  // On the website: Runs when clicking "Sign In & Save My Data" inside the account modal.
  // Used as: The modal sign-in form handler.
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = signIn(email, password, selectedMode);
    if (!res.success) {
      setErrorMessage(res.message || 'Failed to sign in.');
    } else {
      soundFx.playChime();
      setSuccessMessage('Successfully signed in! Your reports and data are now synced.');
      setActiveTab('profile');
      if (onRegistrationSuccess) {
        setTimeout(() => {
          onClose();
          onRegistrationSuccess();
        }, 350);
      }
    }
  };

  // What this does: Registers a brand new user profile with email, password, and display name, then shows their active profile.
  // On the website: Runs when clicking "Create Account & Save Data" on the Create Account tab.
  // Used as: The modal sign-up form handler.
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = signUp(email, password, name, selectedMode);
    if (!res.success) {
      setErrorMessage(res.message || 'Failed to register account.');
    } else {
      soundFx.playChime();
      setSuccessMessage('Account created! Your data is saved to this profile.');
      setActiveTab('profile');
      if (onRegistrationSuccess) {
        setTimeout(() => {
          onClose();
          onRegistrationSuccess();
        }, 350);
      }
    }
  };

  // Saved reports lookup
  const savedReportsList = currentUser
    ? REAL_HUMAN_FIELD_REPORTS.filter((r) => currentUser.savedReportIds.includes(r.id))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-mono flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 border border-cyan-400/30 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  NASA Data Identity
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {currentUser ? 'Active Session' : 'Save Your Data'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                {currentUser ? 'User Profile & Saved Data' : 'Sign In to Save Your Data'}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-5 pt-2">
          {!currentUser ? (
            <>
              <button
                onClick={() => {
                  soundFx.playTick();
                  setActiveTab('signin');
                  setErrorMessage('');
                }}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'signin'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  soundFx.playTick();
                  setActiveTab('signup');
                  setErrorMessage('');
                }}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'signup'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full pb-2">
              <span className="text-xs text-slate-300">
                Logged in as <strong className="text-cyan-300">{currentUser.email}</strong>
              </span>
              <button
                onClick={() => {
                  soundFx.playTick();
                  signOut();
                  setActiveTab('signin');
                }}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg bg-rose-950/40 border border-rose-800/40 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Error & Success Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SIGN IN VIEW */}
          {activeTab === 'signin' && !currentUser && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 space-y-1">
                <p className="font-semibold text-white">Save your reports, notes, and preferences</p>
                <p className="text-[11px] text-slate-400 font-sans">
                  Enter your email and password to securely preserve your bookmarks, inspected timeline locations, and chosen data mode.
                </p>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. scientist@nasa.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Choose Data Mode */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Choose Your Preferred Data Type</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMode('simple')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedMode === 'simple'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <PieChart className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Simple</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 font-sans leading-tight">
                      Visuals + B1 plain English
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMode('normal')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedMode === 'normal'
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Scale className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Normal</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 font-sans leading-tight">
                      Balanced standard mission
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMode('complicated')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedMode === 'complicated'
                        ? 'border-purple-500 bg-purple-950/40 text-purple-200'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                      <span>Complicated</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 font-sans leading-tight">
                      Research paper depth &amp; p-values
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <Save className="w-4 h-4" />
                <span>Sign In &amp; Save My Data</span>
              </button>

              {/* Demo 1-Click Credentials */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  Quick Demo Accounts (1-Click Fill):
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('researcher')}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-purple-300 transition-colors cursor-pointer text-left"
                  >
                    🧪 Polar Researcher (Complicated Mode)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('student')}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-emerald-300 transition-colors cursor-pointer text-left"
                  >
                    🎨 Student / Visual (Simple Mode)
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* SIGN UP VIEW */}
          {activeTab === 'signup' && !currentUser && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 space-y-1">
                <p className="font-semibold text-white">Create a New Account</p>
                <p className="text-[11px] text-slate-400 font-sans">
                  Register with your email and password to preserve your bookmarks, field notes, and preferred view settings.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Full Name or Callsign</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. analyst@climate.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Data Mode Choice */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Choose Your Preferred Data Type</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMode('simple')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedMode === 'simple'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-emerald-400">Simple</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Visuals + B1 English</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMode('normal')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedMode === 'normal'
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-cyan-400">Normal</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Standard Mission</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMode('complicated')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedMode === 'complicated'
                        ? 'border-purple-500 bg-purple-950/40 text-purple-200'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-purple-400">Complicated</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Research Paper</div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <Save className="w-4 h-4" />
                <span>Create Account &amp; Save Data</span>
              </button>
            </form>
          )}

          {/* SIGNED-IN PROFILE VIEW */}
          {currentUser && (
            <div className="space-y-5">
              {/* Profile Card */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{currentUser.name || currentUser.email}</h3>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Verified Observer
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span>{currentUser.email}</span>
                    <span>•</span>
                    <span className="text-slate-500">Member since {new Date(currentUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Current Active Mode Badge */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                      Data Mode:
                    </span>
                    <span
                      className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded border ${
                        dataMode === 'simple'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : dataMode === 'complicated'
                          ? 'bg-purple-950 text-purple-300 border-purple-700'
                          : 'bg-cyan-950 text-cyan-300 border-cyan-700'
                      }`}
                    >
                      {dataMode}
                    </span>
                  </div>
                  {onOpenComplexityModal && (
                    <button
                      onClick={() => {
                        soundFx.playTick();
                        onOpenComplexityModal();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>

              {/* Mode Quick Switcher */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Instant Data Complexity Switch
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans">
                    Buttons remain identical in all modes
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      soundFx.playTick();
                      setDataMode('simple');
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      dataMode === 'simple'
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <PieChart className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Simple (B1)</span>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playTick();
                      setDataMode('normal');
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      dataMode === 'normal'
                        ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 shadow'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Normal</span>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playTick();
                      setDataMode('complicated');
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      dataMode === 'complicated'
                        ? 'border-purple-500 bg-purple-950/60 text-purple-300 shadow'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                    <span>Complicated</span>
                  </button>
                </div>
              </div>

              {/* Onboarding & Architecture Quick Launchers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {onOpenOnboardingWalkthrough && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playChime();
                      onClose();
                      onOpenOnboardingWalkthrough();
                    }}
                    className="p-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-left flex items-center gap-2.5 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-cyan-200 group-hover:text-white flex items-center justify-between">
                        <span>Walkthrough</span>
                        <span className="text-[9px] px-1 rounded bg-cyan-950 text-cyan-300">Replay</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">Operate 3D globe</span>
                    </div>
                  </button>
                )}

                {onOpenArchitectureModal && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playChime();
                      onClose();
                      onOpenArchitectureModal();
                    }}
                    className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-slate-700/80 text-left flex items-center gap-2.5 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Workflow className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center justify-between">
                        <span>Architecture</span>
                        <span className="text-[9px] px-1 rounded bg-slate-950 text-slate-400">Blueprint</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">User stories &amp; flow</span>
                    </div>
                  </button>
                )}

                {onReplayIntro && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playTourChime();
                      onClose();
                      onReplayIntro();
                    }}
                    className="p-2.5 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/40 text-left flex items-center gap-2.5 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-950 border border-amber-500/50 flex items-center justify-center text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-amber-200 group-hover:text-white flex items-center justify-between">
                        <span>Phoenix Intro</span>
                        <span className="text-[9px] px-1 rounded bg-amber-950 text-amber-300">Video</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">Replay ascent animation</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Saved Human Field Reports Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-cyan-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                      Saved Human Field Reports ({savedReportsList.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">Persisted in account</span>
                </div>

                {savedReportsList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center space-y-1">
                    <Bookmark className="w-6 h-6 text-slate-600 mx-auto" />
                    <p className="text-slate-400 text-xs font-sans">No saved field reports yet.</p>
                    <p className="text-slate-500 text-[11px] font-sans">
                      Click the "Human Field Reports" button in the header and click "Bookmark" on any observation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {savedReportsList.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex items-start justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{rep.flagEmoji}</span>
                            <span className="font-bold text-white text-xs">{rep.locationName}</span>
                            <span className="text-[10px] text-cyan-400 font-mono">
                              {rep.dateString}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 font-sans line-clamp-1">
                            {rep.observerName} ({rep.observerRole}): {rep.normal.headline}
                          </p>
                          {currentUser.customNotes[rep.id] && (
                            <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-amber-300/90 font-sans">
                              <strong>Note:</strong> {currentUser.customNotes[rep.id]}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {onOpenReportDetails && (
                            <button
                              onClick={() => {
                                soundFx.playTick();
                                onOpenReportDetails(rep.id);
                                onClose();
                              }}
                              className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 cursor-pointer"
                              title="Open Report Details"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              soundFx.playTick();
                              toggleSaveReport(rep.id);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-700 cursor-pointer"
                            title="Remove bookmark"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Submitted Observations */}
              {userSubmittedReports.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                      Your Submitted Observations ({userSubmittedReports.length})
                    </span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {userSubmittedReports.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-2.5 rounded-xl bg-slate-900/60 border border-emerald-500/30 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-400">{sub.locationName}, {sub.country}</span>
                          <span className="text-slate-400">{sub.year} (Month {sub.month})</span>
                        </div>
                        <p className="text-slate-300 text-[11px] font-sans">{sub.observationText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-slate-900/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>NASA Local Cryptographic Store &bull; Session Active</span>
          </div>

          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
