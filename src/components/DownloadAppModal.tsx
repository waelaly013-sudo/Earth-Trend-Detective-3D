/**
 * NASA Earth Trend Detective - Download & Install on Laptop Modal
 * Enables desktop PWA installation on Windows, macOS, Linux, and Chromebooks.
 */

import React, { useState } from 'react';
import {
  Laptop,
  Download,
  X,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe2,
  Monitor,
  Apple,
  Sparkles,
  Layers,
  ArrowRight,
  HardDriveDownload,
  HelpCircle,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundFx } from '../utils/audioSynth';

// What this does: Defines the open state and close button callback for the laptop download dialog.
// On the website: Controls when the install-on-laptop popup appears and disappears.
// Used as: The component props interface for DownloadAppModal.
interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// What this does: Shows options to install the web app as a standalone desktop app or download an offline HTML launcher.
// On the website: Displays a 1-click install button, browser-specific guides (Chrome, Edge, Safari), and a shortcut file downloader.
// Used as: The desktop installation modal opened from the app header or menu.
export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isDesktop, install } = usePWAInstall();
  const [installStatus, setInstallStatus] = useState<'idle' | 'success' | 'dismissed' | 'manual'>('idle');
  const [activeOsTab, setActiveOsTab] = useState<'chrome' | 'edge' | 'mac' | 'other'>('chrome');

  if (!isOpen) return null;

  // What this does: Triggers the browser's built-in desktop app install prompt and tracks whether the user accepted it.
  // On the website: Shows a success confirmation banner or falls back to manual browser instructions when clicked.
  // Used as: Click handler for the main 1-click install button.
  const handleInstallClick = async () => {
    soundFx.playTick();
    const result = await install();
    if (result === 'accepted') {
      soundFx.playTourChime();
      setInstallStatus('success');
    } else if (result === 'dismissed') {
      setInstallStatus('dismissed');
    } else {
      setInstallStatus('manual');
    }
  };

  // What this does: Builds a small self-contained HTML webpage file in memory and downloads it to the user's computer.
  // On the website: Saves a desktop shortcut file that can reopen the app in one double-click.
  // Used as: Fallback download button handler for offline desktop launching.
  const handleDownloadStandaloneHtml = () => {
    soundFx.playTick();
    const htmlBlob = new Blob([
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NASA Earth Trend Detective 3D — Desktop Launcher</title>
  <style>
    body { margin: 0; background: #020617; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; }
    .card { background: #0f172a; border: 1px solid #06b6d4; padding: 2rem; border-radius: 1rem; max-width: 480px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    h1 { color: #38bdf8; margin-top: 0; font-size: 1.5rem; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
    .btn { display: inline-block; background: #0284c7; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: bold; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🛰️ NASA Earth Trend Detective 3D</h1>
    <p>Launch the full 3D interactive Earth satellite inspection suite directly on your laptop.</p>
    <a href="${window.location.origin}" class="btn">Open Application in Fullscreen</a>
  </div>
</body>
</html>`
    ], { type: 'text/html' });

    const url = URL.createObjectURL(htmlBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NASA-Earth-Trend-Detective-Launcher.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col text-slate-100 overflow-hidden font-mono">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                  Desktop &amp; Laptop Installation
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  PWA Standalone
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-white">
                Download App on Your Laptop
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs font-sans">
          {/* Main 1-Click Install Action Card */}
          <div className="p-4 bg-gradient-to-br from-cyan-950/40 via-slate-950 to-blue-950/40 rounded-2xl border border-cyan-500/40 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span>1-Click Laptop Desktop Installation</span>
                </h3>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  Install NASA Earth Trend Detective 3D as a native desktop application on your Windows, Mac, or Linux laptop.
                </p>
              </div>
              <img
                src="/icon.svg"
                alt="App Icon"
                className="w-12 h-12 rounded-xl shadow-md border border-cyan-500/40 shrink-0 hidden sm:block"
              />
            </div>

            {/* Install Button / State Feedback */}
            {isInstalled || installStatus === 'success' ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl flex items-center gap-2.5 text-emerald-300 font-mono text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong>Successfully Installed!</strong>
                  <span className="block text-[11px] text-emerald-200">
                    The app is now in your Laptop Applications / Start Menu / Desktop Dock.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3 px-4 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Download className="w-4 h-4 text-cyan-200 group-hover:translate-y-0.5 transition-transform" />
                  <span>{isInstallable ? 'Install App on Laptop Now (1-Click)' : 'Prompt Laptop App Install'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                  <span>Zero installer files required</span>
                  <span className="text-cyan-400">Offline-ready • Auto-updates</span>
                </div>
              </div>
            )}
          </div>

          {/* Key Desktop Laptop Advantages */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <div className="font-bold text-slate-200 text-[11px]">Instant Launch</div>
              <p className="text-[10px] text-slate-400 leading-normal font-sans">
                Launches directly from your laptop dock or taskbar without opening a browser tab.
              </p>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <div className="font-bold text-slate-200 text-[11px]">Frameless Window</div>
              <p className="text-[10px] text-slate-400 leading-normal font-sans">
                Clean standalone window without address bars, maximizing 3D Earth screen area.
              </p>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div className="font-bold text-slate-200 text-[11px]">Offline Capability</div>
              <p className="text-[10px] text-slate-400 leading-normal font-sans">
                Satellite textures and Mann-Kendall statistics are cached locally for offline field use.
              </p>
            </div>
          </div>

          {/* Browser-Specific Instructions (If 1-click is blocked by browser policies) */}
          <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>How to Install on Your Laptop Browser</span>
              </span>
            </div>

            {/* Browser Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setActiveOsTab('chrome')}
                className={`py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer ${
                  activeOsTab === 'chrome'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Chrome
              </button>
              <button
                onClick={() => setActiveOsTab('edge')}
                className={`py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer ${
                  activeOsTab === 'edge'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Edge
              </button>
              <button
                onClick={() => setActiveOsTab('mac')}
                className={`py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer ${
                  activeOsTab === 'mac'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Safari Mac
              </button>
              <button
                onClick={() => setActiveOsTab('other')}
                className={`py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer ${
                  activeOsTab === 'other'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Other
              </button>
            </div>

            {/* Tab Details */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300 font-sans space-y-1.5 leading-relaxed">
              {activeOsTab === 'chrome' && (
                <div>
                  <strong className="text-cyan-300 block mb-1 font-mono">Google Chrome (Windows, Mac, Linux):</strong>
                  1. Look at the right side of the address bar at the top of your screen.<br />
                  2. Click the <strong>Install icon (monitor with down arrow)</strong>, or click the <strong>three dots menu (⋮)</strong> &rarr; <strong>Save and share</strong> &rarr; <strong>Install NASA Earth Trend Detective...</strong><br />
                  3. Click <strong>Install</strong> when prompted. The app opens immediately in its own native window!
                </div>
              )}
              {activeOsTab === 'edge' && (
                <div>
                  <strong className="text-cyan-300 block mb-1 font-mono">Microsoft Edge (Windows &amp; Mac):</strong>
                  1. Look in the address bar at the top right for the <strong>App Available icon (three squares and a plus)</strong>.<br />
                  2. Or click the <strong>three dots menu (...)</strong> &rarr; <strong>Apps</strong> &rarr; <strong>Install this site as an app</strong>.<br />
                  3. Select &quot;Pin to taskbar&quot; or &quot;Pin to Start&quot; to launch anytime from your laptop desktop.
                </div>
              )}
              {activeOsTab === 'mac' && (
                <div>
                  <strong className="text-cyan-300 block mb-1 font-mono">Safari on macOS (Sonoma and newer):</strong>
                  1. In the top Safari menu bar, click <strong>File</strong> &rarr; <strong>Add to Dock...</strong><br />
                  2. Or click the <strong>Share button</strong> in the top toolbar &rarr; choose <strong>Add to Dock</strong>.<br />
                  3. The NASA Earth Detective icon will be added to your Mac Dock as a native Mac app!
                </div>
              )}
              {activeOsTab === 'other' && (
                <div>
                  <strong className="text-cyan-300 block mb-1 font-mono">Brave, Opera, or Desktop Shortcut:</strong>
                  1. In Brave or Opera: click the Install icon in the address bar.<br />
                  2. Or in any browser: drag the lock icon from the URL bar directly onto your laptop desktop to create an instant launch shortcut.
                </div>
              )}
            </div>
          </div>

          {/* Standalone Desktop HTML Launcher Download */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5 font-mono">
                <HardDriveDownload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Save Offline Launcher File (.html)</span>
              </span>
              <p className="text-[10px] text-slate-400">
                Download a tiny standalone launcher file to save on your laptop desktop or USB drive.
              </p>
            </div>
            <button
              onClick={handleDownloadStandaloneHtml}
              className="py-1.5 px-3 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download Launcher</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <span>Grounded in W3C Web App Manifest Standards</span>
          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
