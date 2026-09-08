import React, { useState } from 'react';
import { X, StickyNote, Plus, Clock, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Project } from '../../types';

interface ProjectQuickNoteModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNote: (projectId: string, noteContent: string) => Promise<void>;
}

export const ProjectQuickNoteModal: React.FC<ProjectQuickNoteModalProps> = ({
  project,
  isOpen,
  onClose,
  onSaveNote
}) => {
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !project) return null;

  const handleAppend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const timestamp = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      const formattedEntry = `[${timestamp}] ${newNote.trim()}`;
      const existing = project.notes ? `${project.notes}\n\n${formattedEntry}` : formattedEntry;

      await onSaveNote(project.id, existing);
      setNewNote('');
      onClose();
    } catch (err) {
      console.error('Failed to append note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto transition-opacity" 
        onClick={onClose} 
      />

      <div className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 pointer-events-auto z-50">
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
          className="w-full overflow-hidden rounded-3xl bg-charcoal-950/95 border-2 border-amber-500/60 p-5 md:p-6 relative shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(245,158,11,0.3)] backdrop-blur-2xl space-y-4 ring-1 ring-amber-400/20"
        >
          {/* Top Floating Handle Pill */}
          <div className="flex justify-center -mt-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-300 uppercase tracking-widest shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Floating Top Quick Note
            </span>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shadow-inner">
                <StickyNote className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display text-white">Production Quick Note</h3>
                <p className="text-[10px] text-amber-300/80 font-mono font-semibold">{project.id} • {project.coupleName}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-charcoal-900/90 text-gray-400 hover:text-white hover:bg-charcoal-800 flex items-center justify-center cursor-pointer transition-colors border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Existing Notes History */}
          {project.notes && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-gray-500">History Log:</span>
              <div className="p-3 bg-charcoal-900/80 rounded-2xl border border-white/5 text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar leading-relaxed">
                {project.notes}
              </div>
            </div>
          )}

          {/* New Note Composer */}
          <form onSubmit={handleAppend} className="space-y-3">
            <span className="text-[10px] font-mono uppercase text-gold-400 block">
              + Append New Time-Stamped Entry
            </span>
            <textarea
              rows={3}
              placeholder="e.g. 'Client called: wants to change Teaser BGM. Sent 3 audio samples on WhatsApp'..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full bg-charcoal-900 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/40"
              autoFocus
            />

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-charcoal-900 text-gray-400 hover:text-white text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!newNote.trim() || isSaving}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-charcoal-950 font-bold font-mono text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>{isSaving ? 'Saving...' : 'Append Entry'}</span>
              </button>
            </div>
          </form>

        </motion.div>
      </div>
    </div>
  );
};
