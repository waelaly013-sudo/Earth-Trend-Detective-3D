// These imports bring in React's screen-drawing tool, our main App, the CSS styles,
// and the three shared wrappers for user accounts, units, and languages.
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { UnitPreferencesProvider } from './context/UnitPreferencesContext';
import { UnitAndLanguageProvider } from './context/UnitAndLanguageContext';

// What this does: Catches unexpected React startup errors and shows a helpful recovery box instead of a blank screen.
// On the website: Protects users from ever seeing a silent white screen if a browser feature fails to load.
// Used as: Safety wrapper around the main application tree.
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected startup error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-6 text-center space-y-4">
            <h1 className="text-lg font-bold text-cyan-300">Unable to Start 3D View</h1>
            <p className="text-sm text-slate-300">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-sm cursor-pointer hover:bg-cyan-400 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// What this does: Finds the main "root" box in index.html and draws our entire app inside it.
// On the website: This is what actually makes the whole NASA Earth Trend Detective website appear on screen.
// Used as: The starting plug that turns on login memory, unit converters (°C/°F), and English/Arabic switching for every page.
createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <AuthProvider>
      <UnitPreferencesProvider>
        <UnitAndLanguageProvider>
          <App />
        </UnitAndLanguageProvider>
      </UnitPreferencesProvider>
    </AuthProvider>
  </AppErrorBoundary>
);
