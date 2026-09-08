import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Project, QuickNote } from '../../types';
import { 
  StickyNote, 
  X, 
  Plus, 
  Search, 
  Pin, 
  Check, 
  Trash2, 
  Copy, 
  Film, 
  Sparkles, 
  CalendarPlus, 
  Clock, 
  AlertCircle,
  Tag as TagIcon,
  ChevronDown
} from 'lucide-react';

interface QuickNotesDrawerProps {
  projects?: Project[];
  onOpenCalendarReminder?: (initialTitle?: string, projectId?: string) => void;
  onNavigateTab?: (tab: string, subAction?: string) => void;
}

const LOCAL_STORAGE_KEY = 'tfc_quick_notes_cache';

const NOTE_TAGS: { key: QuickNote['tag']; label: string; color: string; bg: string; border: string }[] = [
  { key: 'general', label: 'General', color: '#E2E8F0', bg: 'bg-zinc-800/80', border: 'border-zinc-700' },
  { key: 'client', label: 'Client Request', color: '#F472B6', bg: 'bg-pink-500/15', border: 'border-pink-500/30' },
  { key: 'editing', label: 'Edit / Grade', color: '#38BDF8', bg: 'bg-sky-500/15', border: 'border-sky-500/30' },
  { key: 'audio', label: 'Music & Sound', color: '#A78BFA', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
  { key: 'gear', label: 'Media & SSD', color: '#34D399', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  { key: 'urgent', label: 'Urgent', color: '#F87171', bg: 'bg-rose-500/15', border: 'border-rose-500/30' },
];

export default function QuickNotesDrawer({
  projects = [],
  onOpenCalendarReminder,
  onNavigateTab
}: QuickNotesDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<QuickNote[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading quick notes cache:', e);
    }
    return [
      {
        id: 'sample-1',
        content: 'Client requested warmer cinematic color tones on the Varmala and Mandap sequences.',
        tag: 'client',
        isPinned: true,
        isCompleted: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'sample-2',
        content: 'SSD Drive #4 raw backup completed on local NAS. Handover card to primary editor tomorrow.',
        tag: 'gear',
        isPinned: false,
        isCompleted: false,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];
  });

  // New Note Form States
  const [newContent, setNewContent] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTag, setSelectedTag] = useState<QuickNote['tag']>('general');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'pinned' | 'completed'>('all');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // 1. Subscribe to Firestore collection with fallback
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const q = query(collection(db, 'quick_notes'));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: QuickNote[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<QuickNote, 'id'>)
            }));
            setNotes(list);
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
            } catch (err) {
              console.warn('Could not cache notes to localStorage:', err);
            }
          }
        },
        (err) => {
          console.warn('Firestore quick_notes subscription fallback to local cache:', err);
        }
      );
    } catch (e) {
      console.warn('Failed to subscribe to quick_notes:', e);
    }

    return () => unsubscribe();
  }, []);

  // Update local storage when notes change
  const saveNotesLocally = (updated: QuickNote[]) => {
    setNotes(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save notes to local storage', e);
    }
  };

  // Add new note
  const handleAddNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newContent.trim()) return;

    setIsSubmitting(true);
    const linkedProject = projects.find((p) => p.id === selectedProjectId);

    const notePayload: Omit<QuickNote, 'id'> = {
      content: newContent.trim(),
      projectId: selectedProjectId || undefined,
      projectName: linkedProject ? (linkedProject.coupleName || linkedProject.projectName) : undefined,
      tag: selectedTag,
      isPinned: isPinned,
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    // Optimistic local state update
    const tempId = `temp-${Date.now()}`;
    const optimisticNote: QuickNote = { id: tempId, ...notePayload };
    const updatedList = [optimisticNote, ...notes];
    saveNotesLocally(updatedList);

    // Reset input fields
    setNewContent('');
    setSelectedProjectId('');
    setSelectedTag('general');
    setIsPinned(false);

    try {
      const docRef = await addDoc(collection(db, 'quick_notes'), {
        ...notePayload,
        createdAt: serverTimestamp()
      });
      // Replace temporary ID with Firestore ID
      setNotes((prev) => prev.map((n) => (n.id === tempId ? { ...n, id: docRef.id } : n)));
    } catch (err) {
      console.warn('Firestore add note fallback to local storage:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle complete state
  const handleToggleComplete = async (note: QuickNote) => {
    const updatedState = !note.isCompleted;
    const updated = notes.map((n) => (n.id === note.id ? { ...n, isCompleted: updatedState } : n));
    saveNotesLocally(updated);

    try {
      if (!note.id.startsWith('temp-') && !note.id.startsWith('sample-')) {
        await updateDoc(doc(db, 'quick_notes', note.id), {
          isCompleted: updatedState,
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.warn('Firestore update note status error:', err);
    }
  };

  // Toggle pin state
  const handleTogglePin = async (note: QuickNote) => {
    const updatedPin = !note.isPinned;
    const updated = notes.map((n) => (n.id === note.id ? { ...n, isPinned: updatedPin } : n));
    saveNotesLocally(updated);

    try {
      if (!note.id.startsWith('temp-') && !note.id.startsWith('sample-')) {
        await updateDoc(doc(db, 'quick_notes', note.id), {
          isPinned: updatedPin,
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.warn('Firestore update note pin error:', err);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    saveNotesLocally(updated);

    try {
      if (!noteId.startsWith('temp-') && !noteId.startsWith('sample-')) {
        await deleteDoc(doc(db, 'quick_notes', noteId));
      }
    } catch (err) {
      console.warn('Firestore delete note error:', err);
    }
  };

  // Clear completed notes
  const handleClearCompleted = async () => {
    const completedNotes = notes.filter((n) => n.isCompleted);
    const remaining = notes.filter((n) => !n.isCompleted);
    saveNotesLocally(remaining);

    for (const note of completedNotes) {
      try {
        if (!note.id.startsWith('temp-') && !note.id.startsWith('sample-')) {
          await deleteDoc(doc(db, 'quick_notes', note.id));
        }
      } catch (err) {
        console.warn('Error clearing completed note:', err);
      }
    }
  };

  // Copy note text
  const handleCopyNote = (note: QuickNote) => {
    const textToCopy = `${note.projectName ? `[${note.projectName}] ` : ''}${note.content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  // Convert to calendar reminder
  const handleConvertToCalendar = (note: QuickNote) => {
    if (onOpenCalendarReminder) {
      onOpenCalendarReminder(note.content, note.projectId);
      setIsOpen(false);
    } else if (onNavigateTab) {
      onNavigateTab('calendar');
      setIsOpen(false);
    }
  };

  // Filtered & Sorted Notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchContent = note.content.toLowerCase().includes(q);
          const matchProject = note.projectName?.toLowerCase().includes(q);
          const matchTag = note.tag?.toLowerCase().includes(q);
          if (!matchContent && !matchProject && !matchTag) return false;
        }

        // Tab filter
        if (filterTab === 'active') return !note.isCompleted;
        if (filterTab === 'pinned') return note.isPinned && !note.isCompleted;
        if (filterTab === 'completed') return note.isCompleted;
        return true;
      })
      .sort((a, b) => {
        // Pinned notes come first if not completed
        if (a.isPinned && !b.isPinned && !a.isCompleted) return -1;
        if (!a.isPinned && b.isPinned && !b.isCompleted) return 1;
        // Completed notes sink to bottom
        if (a.isCompleted && !b.isCompleted) return 1;
        if (!a.isCompleted && b.isCompleted) return -1;
        return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
      });
  }, [notes, searchQuery, filterTab]);

  const activeNotesCount = useMemo(() => {
    return notes.filter((n) => !n.isCompleted).length;
  }, [notes]);

  const pinnedNotesCount = useMemo(() => {
    return notes.filter((n) => n.isPinned && !n.isCompleted).length;
  }, [notes]);

  const completedNotesCount = useMemo(() => {
    return notes.filter((n) => n.isCompleted).length;
  }, [notes]);

  return (
    <>
      {/* ================= FLOATING 'QUICK NOTES' BUTTON (STICKY TOP FLOATING) ================= */}
      <motion.div 
        className="fixed top-2.5 sm:top-3.5 right-2.5 sm:right-6 md:right-8 z-50"
        initial={{ y: -30, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Open Quick Notes & Scratchpad (Top Floating • Press ⌘J)"
          className="group relative flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-charcoal-950/95 hover:bg-charcoal-900 border-2 border-amber-500/70 hover:border-amber-400 text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_8px_35px_rgba(245,158,11,0.55)] backdrop-blur-xl transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 ring-1 ring-amber-400/30"
        >
          {/* Glowing pulse aura */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-gold-500/40 to-amber-500/40 blur-sm opacity-50 group-hover:opacity-100 transition-opacity" />

          {/* Button Icon with warm amber-gold badge */}
          <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center text-charcoal-950 font-bold shadow-sm shrink-0">
            <StickyNote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>

          {/* Label */}
          <div className="relative flex flex-col text-left pr-1">
            <span className="text-xs font-bold font-display tracking-wide text-white group-hover:text-gold-200 transition-colors leading-tight">
              Quick Notes
            </span>
            <span className="text-[9px] font-mono text-gray-400 -mt-0.5 leading-tight">
              Scratchpad
            </span>
          </div>

          {/* Live uncompleted notes count pill */}
          {activeNotesCount > 0 && (
            <span className="relative px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold-500 text-charcoal-950 shadow-sm animate-pulse shrink-0">
              {activeNotesCount}
            </span>
          )}
        </button>
      </motion.div>

      {/* ================= SIDE-DRAWER (MODAL OVERLAY & SLIDE-OUT) ================= */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-xs cursor-pointer"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="relative w-full max-w-md sm:max-w-lg h-full bg-charcoal-950/95 border-l border-luxury-green-800/20 text-white shadow-2xl flex flex-col z-10 backdrop-blur-xl"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-luxury-green-800/20 flex items-center justify-between bg-charcoal-900/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gold-500/15 border border-gold-500/40 flex items-center justify-center text-gold-400 shadow-md">
                    <StickyNote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold font-display text-white">Quick Notes</h2>
                      <span className="px-2 py-0.5 rounded-md bg-gold-500/20 border border-gold-500/40 text-[10px] font-mono text-gold-300 font-bold">
                        {activeNotesCount} Active
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      Temporary reminders, observations & punch-lists
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Close Drawer (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Add Note Form */}
              <div className="p-4 border-b border-luxury-green-800/15 bg-charcoal-900/30">
                <form onSubmit={handleAddNote} className="space-y-3">
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNote();
                        }
                      }}
                      placeholder="Write observation, client note, song idea, SSD drive status... (Ctrl+Enter to save)"
                      className="w-full bg-charcoal-950/80 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/30 resize-none font-sans leading-relaxed"
                    />
                  </div>

                  {/* Form Controls: Project link, Tag, Pin */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Project Link Dropdown */}
                      {projects.length > 0 && (
                        <div className="relative">
                          <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="bg-charcoal-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-gray-300 focus:outline-none focus:border-gold-500/50 appearance-none cursor-pointer pr-6 max-w-[140px] truncate"
                          >
                            <option value="">No Project Link</option>
                            {projects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.coupleName || p.projectName}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-2 pointer-events-none" />
                        </div>
                      )}

                      {/* Tag Selector */}
                      <div className="relative">
                        <select
                          value={selectedTag}
                          onChange={(e) => setSelectedTag(e.target.value as QuickNote['tag'])}
                          className="bg-charcoal-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-gray-300 focus:outline-none focus:border-gold-500/50 appearance-none cursor-pointer pr-6"
                        >
                          {NOTE_TAGS.map((t) => (
                            <option key={t.key} value={t.key}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-2 pointer-events-none" />
                      </div>

                      {/* Pin Toggle */}
                      <button
                        type="button"
                        onClick={() => setIsPinned(!isPinned)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                          isPinned
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'border-white/10 text-gray-400 hover:text-white'
                        }`}
                        title="Pin this note to the top"
                      >
                        <Pin className={`w-3 h-3 ${isPinned ? 'fill-amber-300' : ''}`} />
                        <span>Pin</span>
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || !newContent.trim()}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-charcoal-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all cursor-pointer ml-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Saving...' : 'Add Note'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Search & Filter Tabs */}
              <div className="p-3 border-b border-luxury-green-800/15 space-y-2 bg-charcoal-900/20">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search scratchpad notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-charcoal-950/70 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 font-mono"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-gray-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center space-x-1.5 text-[11px] font-mono overflow-x-auto pb-0.5">
                  <button
                    type="button"
                    onClick={() => setFilterTab('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      filterTab === 'all'
                        ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    All ({notes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('active')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      filterTab === 'active'
                        ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Active ({activeNotesCount})
                  </button>
                  {pinnedNotesCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterTab('pinned')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                        filterTab === 'pinned'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Pinned ({pinnedNotesCount})
                    </button>
                  )}
                  {completedNotesCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterTab('completed')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                        filterTab === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Completed ({completedNotesCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Notes List (Scrollable Area) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                {filteredNotes.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-charcoal-900 border border-luxury-green-800/30 flex items-center justify-center text-gray-500 mx-auto">
                      <StickyNote className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-mono font-bold text-gray-400">
                        {searchQuery ? 'No notes matching your search' : 'No notes in this view'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto">
                        Type observations or punch-lists in the box above to capture temporary thoughts quickly.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredNotes.map((note) => {
                    const tagMeta = NOTE_TAGS.find((t) => t.key === note.tag) || NOTE_TAGS[0];

                    return (
                      <motion.div
                        key={note.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-3.5 rounded-2xl border transition-all relative group ${
                          note.isCompleted
                            ? 'bg-charcoal-950/40 border-white/5 opacity-60'
                            : note.isPinned
                            ? 'bg-charcoal-900/90 border-amber-500/40 shadow-sm ring-1 ring-amber-500/20'
                            : 'bg-charcoal-900/70 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Top Bar: Checkbox, Project, Tag, Pin */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => handleToggleComplete(note)}
                              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                note.isCompleted
                                  ? 'bg-emerald-500 border-emerald-400 text-charcoal-950'
                                  : 'border-gray-500 hover:border-gold-400 bg-black/30'
                              }`}
                              title={note.isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                            >
                              {note.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>

                            {/* Tag Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border ${tagMeta.bg} ${tagMeta.border}`}
                              style={{ color: tagMeta.color }}
                            >
                              {tagMeta.label}
                            </span>

                            {/* Linked Project Chip */}
                            {note.projectName && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold-500/10 border border-gold-500/20 text-[10px] font-mono text-gold-300 truncate max-w-[150px]">
                                <Film className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{note.projectName}</span>
                              </span>
                            )}
                          </div>

                          {/* Pinned Indicator or Toggle */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleTogglePin(note)}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                note.isPinned
                                  ? 'text-amber-400 hover:text-amber-300'
                                  : 'text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100'
                              }`}
                              title={note.isPinned ? 'Unpin note' : 'Pin to top'}
                            >
                              <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-amber-400' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Note Content */}
                        <p
                          className={`text-xs text-gray-200 whitespace-pre-wrap font-sans leading-relaxed break-words ${
                            note.isCompleted ? 'line-through text-gray-500' : ''
                          }`}
                        >
                          {note.content}
                        </p>

                        {/* Bottom Actions Bar */}
                        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-gray-500" />
                            {note.createdAt ? new Date(note.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Recently'}
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Copy Note */}
                            <button
                              type="button"
                              onClick={() => handleCopyNote(note)}
                              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                              title="Copy note text"
                            >
                              {copiedNoteId === note.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>

                            {/* Promote to Calendar Reminder */}
                            {onOpenCalendarReminder && !note.isCompleted && (
                              <button
                                type="button"
                                onClick={() => handleConvertToCalendar(note)}
                                className="px-1.5 py-0.5 rounded-md text-gold-400 hover:text-gold-300 hover:bg-gold-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Promote this note to a Calendar Reminder"
                              >
                                <CalendarPlus className="w-3 h-3" />
                                <span className="hidden sm:inline text-[9.5px]">To Calendar</span>
                              </button>
                            )}

                            {/* Delete Note */}
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 rounded-md text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete note"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-3 border-t border-luxury-green-800/20 bg-charcoal-900/60 flex items-center justify-between text-xs font-mono text-gray-400">
                <span className="text-[11px]">
                  Total: <strong className="text-white">{notes.length}</strong> notes
                </span>

                {completedNotesCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCompleted}
                    className="text-[11px] text-gray-400 hover:text-rose-300 hover:underline transition-colors cursor-pointer"
                  >
                    Clear {completedNotesCount} completed
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
