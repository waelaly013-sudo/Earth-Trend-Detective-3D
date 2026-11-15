// These imports bring in React's screen-drawing tool, our main App, the CSS styles,
// and the three shared wrappers for user accounts, units, and languages.
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { UnitPreferencesProvider } from './context/UnitPreferencesContext';
import { UnitAndLanguageProvider } from './context/UnitAndLanguageContext';

// What this does: Finds the main "root" box in index.html and draws our entire app inside it.
// On the website: This is what actually makes the whole NASA Earth Trend Detective website appear on screen.
// Used as: The starting plug that turns on login memory, unit converters (°C/°F), and English/Arabic switching for every page.
createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <UnitPreferencesProvider>
      <UnitAndLanguageProvider>
        <App />
      </UnitAndLanguageProvider>
    </UnitPreferencesProvider>
  </AuthProvider>
);
