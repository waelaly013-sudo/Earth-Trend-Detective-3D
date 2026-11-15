/**
 * NASA Earth Trend Detective - Scientific Field Notebook Modal
 * Enables researchers and students to write down notes, capture active 3D globe telemetry,
 * organize observations with tags, search, preview markdown, and export research notes.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Save,
  Download,
  Copy,
  Check,
  Search,
  Tag,
  Calendar,
  Globe,
  Droplets,
  Thermometer,
  Sparkles,
  Camera,
  FileText,
  Clock,
  Pin,
  Share2,
} from 'lucide-react';
import { ActiveInspectorItem, DataBranch } from '../types/climate';
import { soundFx } from '../utils/audioSynth';

// What this does: Describes all fields stored inside a single scientific field note.
// On the website: Holds each note's title, markdown text, tags, climate branch, and optional globe snapshot.
// Used as: The TypeScript interface for field notebook entries.
export interface FieldNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  branch: DataBranch;
  telemetrySnapshot?: {
    locationName: string;
    lat: number;
    lng: number;
    year: number;
    month?: number;
    primaryValue: string;
    anomaly: string;
    branch: DataBranch;
  };
}

// What this does: Lists the props passed into the Scientific Field Notebook modal.
// On the website: Gives the notebook access to the selected place, year, month, and branch when capturing a snapshot.
// Used as: The TypeScript props contract for FieldNotebookModal.
interface FieldNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLocation: ActiveInspectorItem | null;
  currentYear: number;
  currentMonth: number;
  dataBranch: DataBranch;
}

// What this does: Sets the browser storage key where the user's field notes are saved.
// On the website: Keeps the user's notes saved in their browser even after refreshing the page.
// Used as: The localStorage key string for loading and saving notes.
const STORAGE_KEY_NOTEBOOK = 'nasa_field_notebook_v1';

// What this does: Provides two ready-made sample science notes for first-time visitors.
// On the website: Gives new users helpful example notes so the notebook isn't blank on first open.
// Used as: The default initial state when no saved notes exist in localStorage.
const DEFAULT_SAMPLE_NOTES: FieldNote[] = [
  {
    id: 'note-sample-1',
    title: 'Continental Drying & Byrne-O’Gorman Scaling Observations',
    content: `## Field Synthesis: Continental Land Relative Humidity Drop
Observed consistent negative $\\Delta RH$ anomalies over continental interiors (North America and Eurasian landmasses).
- **Physical Law:** According to Byrne & O'Gorman (2018 PNAS), land warms faster than ocean, creating a divergence between continental saturation vapor pressure and oceanic moisture inflow.
- **Impact:** Elevated Vapor Pressure Deficit (VPD > 1.8 kPa) drives rapid forest desiccations and elevated wildfire hazard.
- **Next steps:** Correlate with NASA SMAP topsoil moisture radar passes next month.`,
    tags: ['humidity', 'byrne-ogorman', 'vpd', 'nasa-airs'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    isPinned: true,
    branch: 'humidity',
    telemetrySnapshot: {
      locationName: 'Sahara-Sahel Transition Belt',
      lat: 14.5,
      lng: 8.2,
      year: 2026,
      month: 7,
      primaryValue: '28% RH',
      anomaly: '-4.6% RH',
      branch: 'humidity',
    },
  },
  {
    id: 'note-sample-2',
    title: 'Arctic Amplification & Cryosphere Fast-Ice Retreat',
    content: `## Cryospheric Station Monitoring Log
- Continuous warming rates exceed **+0.72°C/decade** in high Arctic latitudes.
- Observed loss of multi-year ice volume leads to positive ice-albedo feedback.
- Marine shipping corridors opened 3 weeks earlier than the 2000 climatological baseline.`,
    tags: ['temperature', 'arctic', 'albedo', 'cryosphere'],
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    isPinned: false,
    branch: 'temperature',
    telemetrySnapshot: {
      locationName: 'Arctic Sea Ice (Beaufort Sea)',
      lat: 75.0,
      lng: -140.0,
      year: 2026,
      month: 9,
      primaryValue: '-3.2°C',
      anomaly: '+3.4°C Anomaly',
      branch: 'temperature',
    },
  },
];

// What this does: Renders the Scientific Field Notebook modal for writing, tagging, and exporting research notes.
// On the website: Opens a two-pane notebook where users can search notes, stamp 3D globe readings, and preview Markdown.
// Used as: The field research notebook tool accessible from the Science menu.
export const FieldNotebookModal: React.FC<FieldNotebookModalProps> = ({
  isOpen,
  onClose,
  activeLocation,
  currentYear,
  currentMonth,
  dataBranch,
}) => {
  const [notes, setNotes] = useState<FieldNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTEBOOK);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return DEFAULT_SAMPLE_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    return notes[0]?.id || '';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<'all' | 'temperature' | 'humidity'>('all');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // What this does: Finds the note currently selected in the left sidebar.
  // On the website: Displays that note's title, tags, snapshot pill, and text inside the right editor pane.
  // Used as: A memoized active-note lookup.
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || notes[0] || null;
  }, [notes, activeNoteId]);

  // What this does: Automatically saves the notes list to browser localStorage whenever any note changes.
  // On the website: Makes sure the user's edits are never lost when closing the notebook or refreshing.
  // Used as: A persistence React effect watching the notes array.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTEBOOK, JSON.stringify(notes));
    } catch (e) {
      console.warn('Failed to save notebook to localStorage', e);
    }
  }, [notes]);

  // What this does: Collects a unique list of every #tag used across all saved notes.
  // On the website: Builds the quick #tag filter chips under the notebook search bar.
  // Used as: A memoized tag index for filtering notes.
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t.toLowerCase())));
    return Array.from(set);
  }, [notes]);

  // What this does: Filters and sorts notes by branch, selected tag, search text, pin status, and last edited date.
  // On the website: Keeps pinned notes at the top and updates the sidebar list as the user searches or filters.
  // Used as: A memoized sorted list driving the left sidebar directory.
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        if (branchFilter !== 'all' && n.branch !== branchFilter) return false;
        if (selectedTag !== 'all' && !n.tags.map((t) => t.toLowerCase()).includes(selectedTag)) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchContent = n.content.toLowerCase().includes(q);
          const matchTag = n.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchTag) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, branchFilter, selectedTag, searchQuery]);

  // What this does: Creates a brand-new blank note tagged with the active climate branch and opens it in Edit mode.
  // On the website: Runs when the user clicks the "+" button next to the search box.
  // Used as: The new-note creation handler.
  const handleCreateNewNote = () => {
    soundFx.playChime();
    const newNote: FieldNote = {
      id: `note-${Date.now()}`,
      title: 'Untitled Scientific Field Observation',
      content: '',
      tags: [dataBranch],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      branch: dataBranch,
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setIsPreviewMode(false);
  };

  // What this does: Captures the currently selected 3D globe location, year, and month and stamps them into the active note.
  // On the website: Powers the "Capture Globe State" button so users can record live map coordinates with one click.
  // Used as: A telemetry snapshot helper that updates the current note or starts a new one.
  const handleCaptureGlobeTelemetry = () => {
    soundFx.playPredictionAlert();
    const locationName = activeLocation?.name || 'Active Earth Coordinate';
    const lat = activeLocation ? activeLocation.lat : 0;
    const lng = activeLocation ? activeLocation.lng : 0;

    let primaryValue = 'Ambient Telemetry';
    let anomaly = '+1.4°C Anomaly';
    if (dataBranch === 'humidity') {
      primaryValue = '54% RH (NASA AIRS)';
      anomaly = '-2.8% RH Anomaly';
    }

    const stamp = `\n\n> 🛰️ **Captured Globe Telemetry Snapshot:**\n> **Target:** ${locationName} (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)\n> **Epoch:** Year ${currentYear}, Month ${currentMonth} • **Branch:** ${dataBranch.toUpperCase()}\n> **Reading:** ${primaryValue} • **Anomaly:** ${anomaly}\n`;

    if (activeNote) {
      const updated = {
        ...activeNote,
        content: activeNote.content + stamp,
        updatedAt: new Date().toISOString(),
        telemetrySnapshot: {
          locationName,
          lat,
          lng,
          year: currentYear,
          month: currentMonth,
          primaryValue,
          anomaly,
          branch: dataBranch,
        },
      };
      setNotes(notes.map((n) => (n.id === activeNote.id ? updated : n)));
    } else {
      const newNote: FieldNote = {
        id: `note-${Date.now()}`,
        title: `Observation at ${locationName}`,
        content: `# Telemetry Log: ${locationName}\nCaptured from 3D Globe telemetry.${stamp}`,
        tags: [dataBranch, 'globe-capture'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        branch: dataBranch,
        telemetrySnapshot: {
          locationName,
          lat,
          lng,
          year: currentYear,
          month: currentMonth,
          primaryValue,
          anomaly,
          branch: dataBranch,
        },
      };
      setNotes([newNote, ...notes]);
      setActiveNoteId(newNote.id);
    }
  };

  // What this does: Updates the title, content, or tags of the active note and refreshes its updated timestamp.
  // On the website: Saves every keystroke live as the user types in the title, tag bar, or body box.
  // Used as: A partial state updater for editing the selected note.
  const handleUpdateNote = (fields: Partial<FieldNote>) => {
    if (!activeNote) return;
    const updated = {
      ...activeNote,
      ...fields,
      updatedAt: new Date().toISOString(),
    };
    setNotes(notes.map((n) => (n.id === activeNote.id ? updated : n)));
  };

  // What this does: Removes a note from the notebook and selects the next remaining note if needed.
  // On the website: Runs when the user clicks the red trash button in the note toolbar.
  // Used as: The note deletion handler.
  const handleDeleteNote = (id: string) => {
    soundFx.playTick();
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (activeNoteId === id) {
      setActiveNoteId(remaining[0]?.id || '');
    }
  };

  // What this does: Turns a note's pinned status on or off so important notes stay at the top of the list.
  // On the website: Lights up the gold pin icon on the note card and toolbar button.
  // Used as: The pin toggle button handler.
  const handleTogglePin = (id: string) => {
    soundFx.playTick();
    setNotes(
      notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  // What this does: Copies the active note's title, tags, date, and body text to the user's clipboard.
  // On the website: Shows a green checkmark briefly on the copy icon button so the user knows it worked.
  // Used as: The clipboard copy handler in the editor toolbar.
  const handleCopyNote = (note: FieldNote) => {
    soundFx.playTick();
    const fullText = `# ${note.title}\nTags: ${note.tags.join(', ')}\nCreated: ${new Date(
      note.createdAt
    ).toLocaleDateString()}\n\n${note.content}`;
    navigator.clipboard.writeText(fullText);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // What this does: Bundles every saved note into a formatted Markdown (.md) document and starts a browser download.
  // On the website: Powers the Download button in the notebook header so users can save all notes to their device.
  // Used as: The Markdown export handler.
  const handleExportAllMarkdown = () => {
    soundFx.playChime();
    let md = `# NASA Earth Trend Detective - Field Observations Notebook\nExported on: ${new Date().toISOString()}\nTotal Notes: ${notes.length}\n\n---\n\n`;
    notes.forEach((n, idx) => {
      md += `## ${idx + 1}. ${n.title}\n`;
      md += `- **Date:** ${new Date(n.createdAt).toLocaleDateString()}\n`;
      md += `- **Branch:** ${n.branch}\n`;
      md += `- **Tags:** ${n.tags.join(', ')}\n`;
      if (n.telemetrySnapshot) {
        md += `- **Telemetry Target:** ${n.telemetrySnapshot.locationName} (${n.telemetrySnapshot.year}.M${n.telemetrySnapshot.month || 7})\n`;
      }
      md += `\n${n.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nasa_earth_field_notebook_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[86vh] bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 flex flex-col text-slate-100 overflow-hidden">
        {/* Header Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-amber-950/50 shrink-0">
              <BookOpen className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60 font-bold uppercase tracking-wider">
                  Scientific Notebook
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {notes.length} {notes.length === 1 ? 'Entry' : 'Entries'} Logged
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-white">
                Earth Trend Field Notebook
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Capture Globe Telemetry Button */}
            <button
              onClick={handleCaptureGlobeTelemetry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md cursor-pointer"
              title="One-click stamp active 3D globe telemetry into notebook"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Capture Globe State</span>
            </button>

            {/* Export Markdown Button */}
            <button
              onClick={handleExportAllMarkdown}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Export all notes as Markdown file (.md)"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                soundFx.playTick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Close Notebook"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body (Left Sidebar: Notes List; Right Pane: Editor & Telemetry) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT SIDEBAR: Notes Directory */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/70 flex flex-col shrink-0">
            {/* Search & Actions Bar */}
            <div className="p-3 border-b border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes or tags..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <button
                  onClick={handleCreateNewNote}
                  className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer shrink-0"
                  title="Create New Field Note"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Branch Filter Pills */}
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <button
                  onClick={() => setBranchFilter('all')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    branchFilter === 'all'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setBranchFilter('temperature')}
                  className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                    branchFilter === 'temperature'
                      ? 'bg-amber-950 text-amber-300 border border-amber-600/50 font-bold'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <Thermometer className="w-2.5 h-2.5" />
                  <span>Temp</span>
                </button>
                <button
                  onClick={() => setBranchFilter('humidity')}
                  className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                    branchFilter === 'humidity'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50 font-bold'
                      : 'text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  <Droplets className="w-2.5 h-2.5" />
                  <span>Humidity</span>
                </button>
              </div>

              {/* Tag filters */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[9px] font-mono">
                  <button
                    onClick={() => setSelectedTag('all')}
                    className={`px-1.5 py-0.5 rounded shrink-0 ${
                      selectedTag === 'all'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    #all
                  </button>
                  {allTags.slice(0, 8).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTag(t)}
                      className={`px-1.5 py-0.5 rounded shrink-0 ${
                        selectedTag === t
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Note Item List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredNotes.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs font-mono">
                  No field notes match your filter.
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isActive = note.id === activeNote?.id;
                  return (
                    <button
                      key={note.id}
                      onClick={() => {
                        soundFx.playTick();
                        setActiveNoteId(note.id);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-slate-900 border-cyan-500/60 shadow-md text-white'
                          : 'bg-slate-950/60 hover:bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-bold text-xs truncate flex-1 group-hover:text-cyan-300 transition-colors">
                          {note.title || 'Untitled Note'}
                        </span>
                        {note.isPinned && (
                          <Pin className="w-3 h-3 text-amber-400 shrink-0 fill-amber-400" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 font-sans mb-1.5">
                        {note.content.replace(/^#+\s/gm, '').slice(0, 100) || 'Empty note...'}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1">
                          {note.branch === 'humidity' ? (
                            <span className="text-cyan-400 flex items-center gap-0.5">
                              <Droplets className="w-2.5 h-2.5" />
                              <span>RH</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 flex items-center gap-0.5">
                              <Thermometer className="w-2.5 h-2.5" />
                              <span>°C</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANE: Editor & Telemetry Viewer */}
          {activeNote ? (
            <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
              {/* Note Header & Toolbar */}
              <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2 flex-wrap">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateNote({ title: e.target.value })}
                  placeholder="Note Title..."
                  className="text-base font-bold font-heading text-white bg-transparent border-none focus:outline-none flex-1 min-w-[200px]"
                />

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Pin Toggle */}
                  <button
                    onClick={() => handleTogglePin(activeNote.id)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      activeNote.isPinned
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                        : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                    }`}
                    title={activeNote.isPinned ? 'Unpin Note' : 'Pin Note to Top'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${activeNote.isPinned ? 'fill-amber-400' : ''}`} />
                  </button>

                  {/* Copy Note */}
                  <button
                    onClick={() => handleCopyNote(activeNote)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                    title="Copy note to clipboard"
                  >
                    {copiedId === activeNote.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Markdown Preview Toggle */}
                  <button
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                      isPreviewMode
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60'
                        : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                    }`}
                  >
                    {isPreviewMode ? 'Edit Mode' : 'Markdown View'}
                  </button>

                  {/* Delete Note */}
                  <button
                    onClick={() => handleDeleteNote(activeNote.id)}
                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-600/40 transition-colors cursor-pointer"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tags Editor Bar */}
              <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 text-xs font-mono">
                <Tag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-400 text-[11px] shrink-0">Tags:</span>
                <input
                  type="text"
                  value={activeNote.tags.join(', ')}
                  onChange={(e) =>
                    handleUpdateNote({
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim().replace(/^#/, ''))
                        .filter(Boolean),
                    })
                  }
                  placeholder="comma separated tags (e.g. humidity, airs, heatwave)..."
                  className="flex-1 bg-transparent border-none text-xs font-mono text-cyan-300 focus:outline-none placeholder-slate-600"
                />
              </div>

              {/* Attached Telemetry Snapshot Pill if available */}
              {activeNote.telemetrySnapshot && (
                <div className="mx-4 mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2 truncate">
                    <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-bold text-white truncate">
                      {activeNote.telemetrySnapshot.locationName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({activeNote.telemetrySnapshot.lat.toFixed(1)}°, {activeNote.telemetrySnapshot.lng.toFixed(1)}°)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {activeNote.telemetrySnapshot.primaryValue}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                      {activeNote.telemetrySnapshot.anomaly}
                    </span>
                  </div>
                </div>
              )}

              {/* Main Note Editor / Preview Area */}
              <div className="flex-1 p-4 overflow-y-auto">
                {isPreviewMode ? (
                  <div className="prose prose-invert max-w-none text-xs font-sans leading-relaxed space-y-2 text-slate-200">
                    {activeNote.content ? (
                      activeNote.content.split('\n\n').map((block, bIdx) => {
                        if (block.startsWith('## ')) {
                          return (
                            <h3 key={bIdx} className="text-base font-bold text-white font-heading mt-3 border-b border-slate-800 pb-1">
                              {block.replace(/^##\s*/, '')}
                            </h3>
                          );
                        }
                        if (block.startsWith('# ')) {
                          return (
                            <h2 key={bIdx} className="text-lg font-bold text-white font-heading mt-2">
                              {block.replace(/^#\s*/, '')}
                            </h2>
                          );
                        }
                        if (block.startsWith('> ')) {
                          return (
                            <blockquote key={bIdx} className="border-l-2 border-cyan-500 pl-3 py-1 bg-cyan-950/30 rounded-r text-cyan-200 font-mono text-[11px]">
                              {block.replace(/^>\s*/gm, '')}
                            </blockquote>
                          );
                        }
                        if (block.startsWith('- ')) {
                          return (
                            <ul key={bIdx} className="space-y-1 list-disc pl-4">
                              {block.split('\n').map((l, lIdx) => (
                                <li key={lIdx}>{l.replace(/^-\s*/, '')}</li>
                              ))}
                            </ul>
                          );
                        }
                        return <p key={bIdx}>{block}</p>;
                      })
                    ) : (
                      <p className="text-slate-500 italic">No note contents yet. Switch to Edit Mode to begin typing.</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={activeNote.content}
                    onChange={(e) => handleUpdateNote({ content: e.target.value })}
                    placeholder="Write your research notes, field equations, satellite observations, or hypothesis here... Supports Markdown headings (##), bullets (-), and blockquotes (>)."
                    className="w-full h-full bg-transparent border-none text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
                  />
                )}
              </div>

              {/* Status bar */}
              <div className="p-2.5 px-4 bg-slate-950/80 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>
                  Words: {activeNote.content.trim() ? activeNote.content.trim().split(/\s+/).length : 0} • Chars: {activeNote.content.length}
                </span>
                <span>Auto-saved to local memory</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3 font-mono text-xs">
              <BookOpen className="w-8 h-8 text-slate-600" />
              <p>No active note selected.</p>
              <button
                onClick={handleCreateNewNote}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors cursor-pointer"
              >
                + Create New Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
