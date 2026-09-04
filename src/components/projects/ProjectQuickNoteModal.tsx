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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="inline-block w-full max-w-lg overflow-hidden rounded-3xl bg-charcoal-950 border border-gold-500/30 p-6 relative z-10 shadow-2xl space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
                <StickyNote className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display text-white">Production Quick Note</h3>
                <p className="text-[10px] text-gray-400 font-mono">{project.id} • {project.coupleName}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-charcoal-900 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
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
