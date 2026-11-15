/**
 * NASA Earth Trend Detective - Feedback Modal
 * Captures user comments on visualization, data, and predictions
 * with active telemetry context (region, year, AI state).
 */

import React, { useState } from 'react';
import {
  MessageSquare,
  X,
  Send,
  CheckCircle2,
  Sparkles,
  MapPin,
  Calendar,
  Star,
  Terminal,
} from 'lucide-react';
import { ClimateRegion, UserFeedbackPayload } from '../types/climate';
import { soundFx } from '../utils/audioSynth';

// What this does: Lists the props passed into the Research Feedback popup.
// On the website: Captures the currently selected region, year, and AI prediction state along with the user's feedback.
// Used as: The TypeScript props contract for FeedbackModal.
interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRegion: ClimateRegion | null;
  currentYear: number;
  isAiPrediction: boolean;
}

// What this does: Displays a star-rating and comment form where users can submit feedback on the app's data and visuals.
// On the website: Attaches the current globe region and year, logs the feedback payload, and shows a confirmation card.
// Used as: The user feedback modal opened from the Mission menu.
export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  selectedRegion,
  currentYear,
  isAiPrediction,
}) => {
  const [category, setCategory] = useState<'visualization' | 'data' | 'predictions' | 'general'>(
    'visualization'
  );
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [loggedPayload, setLoggedPayload] = useState<UserFeedbackPayload | null>(null);

  if (!isOpen) return null;

  // What this does: Builds a feedback report with the user's rating, comment, and current globe context, logs it, and shows success.
  // On the website: Switches the modal to the green "Feedback Transmitted Successfully!" summary screen.
  // Used as: The form onSubmit handler.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const payload: UserFeedbackPayload = {
      id: `NASA-FB-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      region: selectedRegion
        ? {
            id: selectedRegion.id,
            name: selectedRegion.name,
            coordinates: `${selectedRegion.lat.toFixed(2)}°, ${selectedRegion.lng.toFixed(2)}°`,
          }
        : null,
      year: currentYear,
      isAiPrediction,
      category,
      rating,
      comment: comment.trim(),
    };

    // Log feedback to browser's console as requested
    console.log(
      '%c[NASA Earth Trend Detective]%c User Feedback Received:',
      'color: #38bdf8; font-weight: bold;',
      'color: #f43f5e; font-weight: bold;',
      payload
    );

    setLoggedPayload(payload);
    setIsSubmitted(true);
    soundFx.playTourChime();
  };

  // What this does: Clears the typed comment, resets the submitted screen, and closes the feedback popup.
  // On the website: Runs when clicking the top X button or "Return to 3D Globe".
  // Used as: The modal close and reset handler.
  const handleResetAndClose = () => {
    soundFx.playTick();
    setIsSubmitted(false);
    setComment('');
    onClose();
  };

  const quickPrompts = [
    'Ice retreat rate aligns with literature',
    '3D Earth rotation is smooth and responsive',
    'Mann-Kendall p-value badge provides great statistical clarity',
    'Heatmap anomaly glow renders clearly',
    'Suggestion for AI confidence band projection',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/50 flex flex-col text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-white">
                Submit Research Feedback
              </h2>
              <p className="text-xs font-mono text-slate-400">
                NASA Space Apps Challenge Review
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {isSubmitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold font-heading text-white">
                Feedback Transmitted Successfully!
              </h3>
              <p className="text-xs font-mono text-emerald-400 mt-1">
                Captured with active telemetry and logged to browser console.
              </p>
            </div>

            {/* Console Log Preview Badge */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs font-mono space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] pb-1 border-b border-slate-800">
                <Terminal className="w-3.5 h-3.5" />
                <span>Console Payload Reference: {loggedPayload?.id}</span>
              </div>
              <div className="text-slate-300">
                <span className="text-slate-500">Region:</span>{' '}
                {loggedPayload?.region ? loggedPayload.region.name : 'Global View'}
              </div>
              <div className="text-slate-300">
                <span className="text-slate-500">Simulation Year:</span> {loggedPayload?.year} (
                {loggedPayload?.isAiPrediction ? 'AI Prediction Mode' : 'Historical NASA Era'})
              </div>
              <div className="text-slate-300">
                <span className="text-slate-500">Category:</span> {loggedPayload?.category} |{' '}
                <span className="text-slate-500">Rating:</span> {loggedPayload?.rating}/5
              </div>
              <div className="text-slate-400 text-[11px] truncate">
                &quot;{loggedPayload?.comment}&quot;
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-2 px-4 rounded-xl font-mono text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white transition-colors"
            >
              Return to 3D Globe
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-mono">
            {/* Captured Telemetry Context Card */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Captured Telemetry Context
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">
                    {selectedRegion ? selectedRegion.name : 'Global (No Region)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>
                    Year: <strong className="text-white">{currentYear}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] pt-1">
                <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>
                  Simulation State:{' '}
                  {isAiPrediction ? (
                    <strong className="text-rose-400">AI Prediction Mode Active</strong>
                  ) : (
                    <strong className="text-cyan-300">NASA Satellite Observed Era</strong>
                  )}
                </span>
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="text-[11px] text-slate-300 block mb-1.5 font-semibold">
                Feedback Focus Area
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'visualization', label: 'Visualization' },
                  { id: 'data', label: 'NASA Data' },
                  { id: 'predictions', label: 'AI Prediction' },
                  { id: 'general', label: 'General' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      soundFx.playTick();
                      setCategory(item.id as typeof category);
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-colors text-[10px] uppercase font-bold tracking-wider ${
                      category === item.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Stars */}
            <div>
              <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                Overall Experience Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      soundFx.playTick();
                      setRating(star);
                    }}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-[10px] text-slate-400 ml-2 font-mono">
                  {rating === 5
                    ? 'Exceptional'
                    : rating === 4
                    ? 'Very Good'
                    : rating === 3
                    ? 'Satisfactory'
                    : 'Needs Improvement'}
                </span>
              </div>
            </div>

            {/* Freeform Comment */}
            <div>
              <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                Detailed Feedback &amp; Observations
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your observations regarding the 3D globe rendering, Mann-Kendall trend detection, or predictive climate simulation..."
                rows={4}
                required
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-colors resize-none"
              />
            </div>

            {/* Quick Prompt Tags */}
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Quick Add Tags:</span>
              <div className="flex flex-wrap gap-1">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      soundFx.playTick();
                      setComment((prev) => (prev ? `${prev} | ${p}` : p));
                    }}
                    className="px-2 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-750 transition-colors border border-slate-700/60"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500">Logs directly to browser console</span>
              <button
                type="submit"
                disabled={!comment.trim()}
                className="py-2 px-4 rounded-xl font-mono text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Feedback</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
