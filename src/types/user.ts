/**
 * NASA Earth Trend Detective - User Authentication & Data Complexity Types
 */

// What this does: Names the three detail levels for how scientific data is explained (simple, normal, or complicated).
// On the website: Controls whether cards show plain everyday summaries, standard stats, or full scientific formulas.
// Used as: The user's selected complexity setting across the app.
export type DataComplexityMode = 'simple' | 'normal' | 'complicated';

// What this does: Represents a climate report that a user has bookmarked with an optional note.
// On the website: Tracks reports saved to the user's personal profile.
// Used as: The saved-report record type in user account data.
export interface UserSavedReport {
  id: string;
  reportId: string;
  savedAt: string;
  notes?: string;
}

// What this does: Describes a custom field observation submitted by a user from the Human Reports section.
// On the website: Displays user-contributed local weather or environmental observations in the community reports list.
// Used as: The data structure stored when someone posts a new field report.
export interface UserSubmittedReport {
  id: string;
  observerName: string;
  observerEmail: string;
  role: string;
  year: number;
  month: number;
  locationName: string;
  country: string;
  lat: number;
  lng: number;
  category: 'Cryosphere' | 'Agriculture' | 'Ocean' | 'Drought' | 'Urban' | 'General' | 'Wind';
  observationText: string;
  observedAnomaly: string;
  timestamp: string;
}

// What this does: Holds all profile data for a signed-in explorer (account info, notes, bookmarks, submitted reports, and onboarding state).
// On the website: Remembers who is logged in, their preferred detail mode, saved places, and personal field notes.
// Used as: The main user state type inside AuthContext and LocalStorage persistence.
export interface UserProfile {
  email: string;
  name: string;
  preferredMode: DataComplexityMode;
  savedReportIds: string[];
  customNotes: Record<string, string>; // reportId or locationId -> note
  favoriteLocations: string[];
  submittedReports: UserSubmittedReport[];
  hasCompletedOnboarding?: boolean;
  createdAt: string;
  lastLoginAt: string;
}
