import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  StickyNote, 
  X, 
  Send, 
  Copy, 
  Check, 
  Clock, 
  ChevronDown, 
  Sparkles, 
  Maximize2, 
  Minimize2,
  Trash2
} from 'lucide-react';
import { Project } from '../../types';

interface FloatingTopQuickNoteProps {
  projects?: Project[];
  onSaveProjectNote?: (projectId: string, noteContent: string) => Promise<void>;
}

export const FloatingTopQuickNote: React.FC<FloatingTopQuickNoteProps> = ({
  projects = [],
  onSaveProjectNote
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('general');
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // General scratchpad stored in localStorage
  const [generalScratchpad, setGeneralScratchpad] = useState<string>(() => {
    try {
      return localStorage.getItem('tfc_floating_quick_notes') || '';
    } catch {
      return '';
    }
  });

  // Global Keyboard Shortcut: Ctrl+J or Cmd+J toggles floating quick note
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;

    setIsSaving(true);
    const timestamp = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    const formattedEntry = `[${timestamp}] ${noteContent.trim()}`;

    try {
      if (selectedProjectId === 'general' || !selectedProject) {
        // Save to general studio scratchpad
        const updated = generalScratchpad ? `${generalScratchpad}\n\n${formattedEntry}` : formattedEntry;
        setGeneralScratchpad(updated);
        try {
          localStorage.setItem('tfc_floating_quick_notes', updated);
        } catch (e) {
          console.error(e);
        }
      } else {
        // Save to selected project
        const existing = selectedProject.notes ? `${selectedProject.notes}\n\n${formattedEntry}` : formattedEntry;
        if (onSaveProjectNote) {
          await onSaveProjectNote(selectedProject.id, existing);
        }
      }

      setSaveSuccess(true);
      setNoteContent('');
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save quick note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyRecent = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearGeneralNotes = () => {
    if (window.confirm("Clear general scratchpad notes?")) {
      setGeneralScratchpad('');
      try {
        localStorage.removeItem('tfc_floating_quick_notes');
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <>
      {/* FLOATING TOP TRIGGER PILL */}
      <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-40 flex items-center">
        <motion.button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all backdrop-blur-md cursor-pointer border shadow-lg ${
            isOpen 
              ? 'bg-amber-500 text-charcoal-950 border-amber-400 shadow-amber-500/20 ring-2 ring-amber-400/40' 
              : 'bg-charcoal-900/90 text-amber-300 border-amber-500/40 hover:border-amber-400 hover:bg-charcoal-900 shadow-black/60'
          }`}
          title="Quick Note (Press ⌘J or Ctrl+J)"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <StickyNote className="w-3.5 h-3.5 text-amber-400" />
          <span className="tracking-wide">Quick Note</span>
          <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono bg-charcoal-950/60 border border-white/10 text-gray-400">
            ⌘J
          </span>
        </motion.button>
      </div>

      {/* FLOATING TOP NOTE DRAWER / MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            />

            {/* Top Floating Panel */}
            <div className={`fixed top-3 md:top-4 left-1/2 -translate-x-1/2 w-full px-3 sm:px-4 pointer-events-auto z-50 transition-all ${
              isExpanded ? 'max-w-2xl' : 'max-w-xl'
            }`}>
              <motion.div
                initial={{ opacity: 0, y: -45, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -35, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 450, damping: 28 }}
                className="w-full rounded-3xl bg-charcoal-950/95 border-2 border-amber-500/60 p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.25)] backdrop-blur-2xl space-y-3.5 ring-1 ring-amber-400/30"
              >
                {/* Drag / Floating Badge Handle */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shadow-inner">
                      <StickyNote className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
                        <span>Top Floating Quick Note</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Active
                        </span>
                      </h4>
                      <p className="text-[10px] text-gray-400 font-mono">
                        Jot thoughts instantly • Auto time-stamped
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsExpanded(prev => !prev)}
                      className="p-1.5 rounded-lg bg-charcoal-900 text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/5"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 rounded-lg bg-charcoal-900 text-gray-400 hover:text-red-400 transition-colors cursor-pointer border border-white/5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Target Destination Selector (General Scratchpad vs Specific Project) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-gray-400 shrink-0">Attach to:</span>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="flex-1 bg-charcoal-900 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono cursor-pointer"
                  >
                    <option value="general">📌 General Studio Scratchpad</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        🎬 {p.id} • {p.coupleName} ({p.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Text Composer */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    rows={isExpanded ? 5 : 3}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder={
                      selectedProjectId === 'general'
                        ? "Jot down a fast phone memo, editor reminder, or client message..."
                        : `Add instant note for ${selectedProject?.coupleName || 'selected project'}...`
                    }
                    className="w-full bg-charcoal-900/90 border border-white/10 focus:border-amber-400 rounded-2xl p-3 text-xs text-white focus:outline-none transition-colors font-mono custom-scrollbar resize-none placeholder-gray-500 leading-relaxed"
                  />
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {saveSuccess && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Saved!
                      </motion.span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNoteContent('')}
                      disabled={!noteContent.trim()}
                      className="px-2.5 py-1.5 rounded-xl bg-charcoal-900 text-gray-400 hover:text-white text-xs font-mono disabled:opacity-40 transition-colors cursor-pointer border border-white/5"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      disabled={!noteContent.trim() || isSaving}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs font-mono transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Append Note</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* History Stream for Selected Destination */}
                <div className="border-t border-white/10 pt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>
                        {selectedProjectId === 'general' ? 'General Scratchpad History' : `${selectedProject?.coupleName || 'Project'} Notes`}
                      </span>
                    </span>

                    <div className="flex items-center gap-2">
                      {selectedProjectId === 'general' && generalScratchpad && (
                        <button
                          type="button"
                          onClick={handleClearGeneralNotes}
                          className="text-[10px] font-mono text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear All</span>
                        </button>
                      )}
                      {((selectedProjectId === 'general' && generalScratchpad) || (selectedProject && selectedProject.notes)) && (
                        <button
                          type="button"
                          onClick={() => handleCopyRecent(selectedProjectId === 'general' ? generalScratchpad : (selectedProject?.notes || ''))}
                          className="text-[10px] font-mono text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1"
                        >
                          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copied ? 'Copied' : 'Copy All'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-32 overflow-y-auto bg-charcoal-900/80 rounded-2xl p-2.5 border border-white/5 text-[11px] font-mono text-gray-300 whitespace-pre-wrap custom-scrollbar leading-relaxed">
                    {selectedProjectId === 'general' 
                      ? (generalScratchpad || <span className="text-gray-500 italic">Scratchpad empty. Write a quick note above!</span>)
                      : (selectedProject?.notes || <span className="text-gray-500 italic">No notes logged for this project yet.</span>)
                    }
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
