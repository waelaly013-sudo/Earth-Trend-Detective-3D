/**
 * NASA Earth Trend Detective - Authentication & Saved User Data Context
 * Provides email & password sign in/up, persistent storage,
 * saved field reports, bookmarks, notes, and complexity mode selection.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DataComplexityMode, UserProfile, UserSubmittedReport } from '../types/user';
import { DataBranch } from '../types/climate';

interface AuthContextType {
  currentUser: UserProfile | null;
  dataMode: DataComplexityMode;
  setDataMode: (mode: DataComplexityMode) => void;
  dataBranch: DataBranch;
  setDataBranch: (branch: DataBranch) => void;
  signIn: (email: string, password: string, mode?: DataComplexityMode) => { success: boolean; message?: string };
  signUp: (email: string, password: string, name?: string, mode?: DataComplexityMode) => { success: boolean; message?: string };
  guestLogin: (mode?: DataComplexityMode) => void;
  signOut: () => void;
  toggleSaveReport: (reportId: string) => boolean;
  isReportSaved: (reportId: string) => boolean;
  saveReportNote: (reportId: string, note: string) => void;
  getReportNote: (reportId: string) => string;
  submitUserReport: (report: Omit<UserSubmittedReport, 'id' | 'timestamp'>) => void;
  userSubmittedReports: UserSubmittedReport[];
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const STORAGE_KEY_USER = 'nasa_earth_user_v1';
const STORAGE_KEY_MODE = 'nasa_earth_data_mode_v1';
const STORAGE_KEY_BRANCH = 'nasa_earth_data_branch_v1';
const STORAGE_KEY_ALL_SUBMISSIONS = 'nasa_earth_submissions_v1';
const STORAGE_KEY_ONBOARDING = 'nasa_earth_onboarding_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// What this does: Wraps the whole app to keep track of who is signed in, their saved bookmarks, notes, reading mode, and active climate topic.
// On the website: Powers the login screen, user profile window, bookmarked reports, and Simple/Normal/Complicated reading levels.
// Used as: The account and user-memory manager for the whole website (saves everything into browser localStorage).
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // What this does: Remembers which main weather topic the user picked (Temperature, Humidity, or Wind).
  // On the website: Controls the main color theme and data shown across the 3D globe and side panels.
  // Used as: The saved weather branch setting.
  const [dataBranch, setDataBranchState] = useState<DataBranch>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BRANCH) as DataBranch;
    const validBranches: DataBranch[] = ['temperature', 'humidity', 'wind'];
    if (saved && validBranches.includes(saved)) {
      return saved;
    }
    return 'temperature';
  });

  // What this does: Remembers how detailed the text should be ('simple' easy words, 'normal', or 'complicated' science papers).
  // On the website: Changes the tone and difficulty of explanations in the chatbot and data panels.
  // Used as: The reading-level preference switcher.
  const [dataMode, setDataModeState] = useState<DataComplexityMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MODE);
    if (saved === 'simple' || saved === 'normal' || saved === 'complicated') {
      return saved;
    }
    return 'normal';
  });

  // What this does: Checks if a user was already signed in before and loads their profile; otherwise starts as null (logged out).
  // On the website: Shows the Login/Register screen first when null, or opens the main 3D Earth app once signed in.
  // Used as: The active user session state.
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  });

  // What this does: Loads any climate field reports that users typed and submitted on this browser.
  // On the website: Displays user-written field observations inside the Human Reports window.
  // Used as: Local storage for community-submitted weather reports.
  const [userSubmittedReports, setUserSubmittedReports] = useState<UserSubmittedReport[]>(() => {
    try {
      const savedSubmissions = localStorage.getItem(STORAGE_KEY_ALL_SUBMISSIONS);
      if (savedSubmissions) {
        return JSON.parse(savedSubmissions);
      }
    } catch {
      // Ignore
    }
    return [];
  });

  // What this does: Changes the reading complexity mode and saves it into the user's profile and browser memory.
  // On the website: Updates all explanations to Simple, Normal, or Complicated when the user clicks a mode card.
  // Used as: The setter function for reading difficulty.
  const setDataMode = (newMode: DataComplexityMode) => {
    setDataModeState(newMode);
    localStorage.setItem(STORAGE_KEY_MODE, newMode);
    if (currentUser) {
      const updatedUser: UserProfile = { ...currentUser, preferredMode: newMode };
      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    }
  };

  // What this does: Changes the active climate branch (Temperature, Humidity, or Wind) and saves it to browser storage.
  // On the website: Switches the entire app's charts, globe heat colors, and indicators to the new weather topic.
  // Used as: The global climate branch setter.
  const setDataBranch = (newBranch: DataBranch) => {
    setDataBranchState(newBranch);
    localStorage.setItem(STORAGE_KEY_BRANCH, newBranch);
  };

  // What this does: Checks the email and password, loads an existing profile (or creates a starter one), and logs the user in.
  // On the website: Unlocks the website from the Sign-In gate and shows the user's name and saved items in their profile.
  // Used as: The main login function for the Sign-In form.
  const signIn = (
    email: string,
    password: string,
    chosenMode?: DataComplexityMode
  ): { success: boolean; message?: string } => {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please provide a valid email address.' };
    }
    if (!password || password.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const displayName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    // Retrieve or create profile
    let profile: UserProfile;
    try {
      const existing = localStorage.getItem(`nasa_profile_${cleanEmail}`);
      if (existing) {
        profile = JSON.parse(existing);
        profile.lastLoginAt = new Date().toISOString();
        if (chosenMode) {
          profile.preferredMode = chosenMode;
        }
      } else {
        profile = {
          email: cleanEmail,
          name: formattedName,
          preferredMode: chosenMode || dataMode,
          savedReportIds: ['rep-2023-07-svalbard'], // Pre-bookmark one sample for exploration
          customNotes: {
            'rep-2023-07-svalbard': 'Critical data point for high-latitude cryosphere review.',
          },
          favoriteLocations: ['arctic-sea-ice', 'amazon-basin'],
          submittedReports: [],
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
      }
    } catch {
      profile = {
        email: cleanEmail,
        name: formattedName,
        preferredMode: chosenMode || dataMode,
        savedReportIds: [],
        customNotes: {},
        favoriteLocations: [],
        submittedReports: [],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    }

    setCurrentUser(profile);
    setDataModeState(profile.preferredMode);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    localStorage.setItem(`nasa_profile_${cleanEmail}`, JSON.stringify(profile));
    localStorage.setItem(STORAGE_KEY_MODE, profile.preferredMode);

    return { success: true };
  };

  // What this does: Validates email, password, and optional name, then creates a fresh user account and saves it locally.
  // On the website: Runs when a new user fills out the Sign-Up form to start using the app.
  // Used as: The account registration function.
  const signUp = (
    email: string,
    password: string,
    name?: string,
    chosenMode?: DataComplexityMode
  ): { success: boolean; message?: string } => {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please provide a valid email address.' };
    }
    if (!password || password.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const finalName = name?.trim() || cleanEmail.split('@')[0];

    const newProfile: UserProfile = {
      email: cleanEmail,
      name: finalName,
      preferredMode: chosenMode || dataMode,
      savedReportIds: [],
      customNotes: {},
      favoriteLocations: [],
      submittedReports: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    setCurrentUser(newProfile);
    if (chosenMode) {
      setDataModeState(chosenMode);
      localStorage.setItem(STORAGE_KEY_MODE, chosenMode);
    }
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newProfile));
    localStorage.setItem(`nasa_profile_${cleanEmail}`, JSON.stringify(newProfile));

    return { success: true };
  };

  // What this does: Checks if the user has already finished the welcome walkthrough before.
  // On the website: Prevents the welcome tour from popping up every single time an existing user logs in.
  // Used as: The onboarding completion flag.
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (typeof u.hasCompletedOnboarding === 'boolean') return u.hasCompletedOnboarding;
      }
      return localStorage.getItem(STORAGE_KEY_ONBOARDING) === 'true';
    } catch {
      return false;
    }
  });

  // What this does: Marks the welcome walkthrough as finished and saves that in the user's profile.
  // On the website: Closes the welcome walkthrough and remembers not to auto-show it again.
  // Used as: The finish handler for onboarding.
  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    localStorage.setItem(STORAGE_KEY_ONBOARDING, 'true');
    if (currentUser) {
      const updated: UserProfile = { ...currentUser, hasCompletedOnboarding: true };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
      localStorage.setItem(`nasa_profile_${currentUser.email}`, JSON.stringify(updated));
    }
  };

  // What this does: Clears the onboarding-done flag so the walkthrough can be treated as new again.
  // On the website: Lets the user replay the first-time welcome walkthrough.
  // Used as: The reset helper for onboarding.
  const resetOnboarding = () => {
    setHasCompletedOnboarding(false);
    localStorage.removeItem(STORAGE_KEY_ONBOARDING);
    if (currentUser) {
      const updated: UserProfile = { ...currentUser, hasCompletedOnboarding: false };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
      localStorage.setItem(`nasa_profile_${currentUser.email}`, JSON.stringify(updated));
    }
  };

  // What this does: Clears the active user from state and localStorage so they return to the login screen.
  // On the website: Triggered when clicking "Sign Out" inside the User Account modal.
  // Used as: The logout function.
  const signOut = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  // What this does: Signs the user in quickly as a temporary "Guest Investigator" without typing an email or password.
  // On the website: Lets someone explore the whole app right away using the "Continue as Guest" button.
  // Used as: The instant guest access function.
  const guestLogin = (chosenMode?: DataComplexityMode) => {
    const guestUser: UserProfile = {
      email: 'guest.detective@nasa-apps.org',
      name: 'Guest Investigator',
      preferredMode: chosenMode || dataMode,
      savedReportIds: ['rep-2023-07-svalbard'],
      customNotes: {
        'rep-2023-07-svalbard': 'Observed high Arctic sea-ice retreat and Svalbard permafrost thaw.',
      },
      favoriteLocations: ['arctic-sea-ice', 'amazon-basin'],
      submittedReports: [],
      hasCompletedOnboarding: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    setCurrentUser(guestUser);
    setHasCompletedOnboarding(false);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(guestUser));
    if (chosenMode) {
      setDataModeState(chosenMode);
      localStorage.setItem(STORAGE_KEY_MODE, chosenMode);
    }
  };

  // What this does: Adds or removes a human report ID from the user's bookmarked list.
  // On the website: Lights up or turns off the Bookmark icon on field reports and shows them in the User Account panel.
  // Used as: The bookmark save/unsave toggle for reports.
  const toggleSaveReport = (reportId: string): boolean => {
    if (!currentUser) return false;

    const exists = currentUser.savedReportIds.includes(reportId);
    const updatedIds = exists
      ? currentUser.savedReportIds.filter((id) => id !== reportId)
      : [...currentUser.savedReportIds, reportId];

    const updatedUser: UserProfile = {
      ...currentUser,
      savedReportIds: updatedIds,
    };

    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    localStorage.setItem(`nasa_profile_${currentUser.email}`, JSON.stringify(updatedUser));
    return !exists;
  };

  // What this does: Tells us true or false whether a specific report is already bookmarked by the current user.
  // On the website: Used to color the Bookmark button gold/cyan when a report is saved.
  // Used as: A quick bookmark status checker.
  const isReportSaved = (reportId: string): boolean => {
    if (!currentUser) return false;
    return currentUser.savedReportIds.includes(reportId);
  };

  // What this does: Saves a user's personal written note attached to a specific report.
  // On the website: Keeps personal research notes inside the user's account even after closing the browser.
  // Used as: The note-saving function on reports.
  const saveReportNote = (reportId: string, note: string) => {
    if (!currentUser) return;
    const updatedNotes = { ...currentUser.customNotes, [reportId]: note };
    const updatedUser: UserProfile = { ...currentUser, customNotes: updatedNotes };
    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    localStorage.setItem(`nasa_profile_${currentUser.email}`, JSON.stringify(updatedUser));
  };

  // What this does: Reads back any personal note the user wrote earlier for a report.
  // On the website: Fills the note text box when opening that report again.
  // Used as: The note loader helper.
  const getReportNote = (reportId: string): string => {
    if (!currentUser) return '';
    return currentUser.customNotes[reportId] || '';
  };

  // What this does: Creates a new community field report with a timestamp and saves it both globally and on the user's profile.
  // On the website: Shows the user's newly submitted observation at the top of the Human Reports list.
  // Used as: The form submit handler when a user logs a real-world weather observation.
  const submitUserReport = (report: Omit<UserSubmittedReport, 'id' | 'timestamp'>) => {
    const newReport: UserSubmittedReport = {
      ...report,
      id: `user-rep-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    const updatedSubmissions = [newReport, ...userSubmittedReports];
    setUserSubmittedReports(updatedSubmissions);
    localStorage.setItem(STORAGE_KEY_ALL_SUBMISSIONS, JSON.stringify(updatedSubmissions));

    if (currentUser) {
      const updatedUser: UserProfile = {
        ...currentUser,
        submittedReports: [newReport, ...currentUser.submittedReports],
      };
      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
      localStorage.setItem(`nasa_profile_${currentUser.email}`, JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        dataMode,
        setDataMode,
        dataBranch,
        setDataBranch,
        signIn,
        signUp,
        guestLogin,
        signOut,
        toggleSaveReport,
        isReportSaved,
        saveReportNote,
        getReportNote,
        submitUserReport,
        userSubmittedReports,
        hasCompletedOnboarding,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// What this does: A simple shortcut hook so any component in the app can grab user info, login/logout functions, and preferences.
// On the website: Used by headers, modals, and forms to know who is logged in and what mode is active.
// Used as: The easy doorway to read AuthContext anywhere in the code.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
