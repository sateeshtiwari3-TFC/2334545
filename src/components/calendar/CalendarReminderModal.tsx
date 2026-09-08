import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  IndianRupee, 
  Film, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Project, Studio, CalendarEvent } from '../../types';

interface CalendarReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminderData: Omit<CalendarEvent, 'id'>) => Promise<void>;
  onUpdate?: (id: string, reminderData: Partial<CalendarEvent>) => Promise<void>;
  editingReminder?: CalendarEvent | null;
  projects?: Project[];
  studios?: Studio[];
  initialCategory?: 'payment' | 'project' | 'general';
  initialDate?: string;
}

export default function CalendarReminderModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editingReminder,
  projects = [],
  studios = [],
  initialCategory = 'payment',
  initialDate
}: CalendarReminderModalProps) {
  const [category, setCategory] = useState<'payment' | 'project' | 'general'>(initialCategory);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedStudioName, setSelectedStudioName] = useState<string>('');
  const [coupleName, setCoupleName] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingReminder) {
      setCategory(
        editingReminder.reminderCategory === 'general'
          ? 'general'
          : editingReminder.reminderCategory === 'project'
          ? 'project'
          : 'payment'
      );
      setTitle(editingReminder.title || '');
      setDate(editingReminder.start || '');
      setAmount(editingReminder.amount ? String(editingReminder.amount) : '');
      setSelectedProjectId(editingReminder.projectId || '');
      setSelectedStudioName(editingReminder.studioName || '');
      setCoupleName(editingReminder.coupleName || '');
      setNotes(editingReminder.notes || '');
    } else {
      setCategory(initialCategory || 'payment');
      setTitle('');
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setAmount('');
      setSelectedProjectId('');
      setSelectedStudioName('');
      setCoupleName('');
      setNotes('');
    }
  }, [editingReminder, isOpen, initialCategory, initialDate]);

  if (!isOpen) return null;

  // Handle project selection to autofill fields
  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    const proj = projects.find(p => p.id === projId);
    if (proj) {
      setCoupleName(proj.coupleName || `${proj.brideName || ''} & ${proj.groomName || ''}`);
      if (proj.studioName) {
        setSelectedStudioName(proj.studioName);
      }
      
      // Auto-suggest amount if payment reminder & balance remains
      const balance = proj.remainingBalance ?? ((proj.projectAmount || 0) - (proj.advancePayment || 0));
      if (category === 'payment') {
        if (balance > 0 && !amount) {
          setAmount(String(balance));
        }
        if (!title) {
          setTitle(`Payment Due: ${proj.coupleName || 'Wedding Film'} (₹${balance > 0 ? balance.toLocaleString('en-IN') : 'Balance'})`);
        }
      } else if (category === 'project') {
        if (!title) {
          setTitle(`Milestone Reminder: ${proj.coupleName || 'Wedding Film'}`);
        }
      }
    }
  };

  const handleStudioSelect = (studioName: string) => {
    setSelectedStudioName(studioName);
    if (category === 'payment' && !title) {
      setTitle(`Payment Collection: ${studioName}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    setIsSubmitting(true);
    try {
      const isPayment = category === 'payment';
      const isProject = category === 'project';
      const parsedAmount = isPayment && amount ? Number(amount) : undefined;
      
      const payload: Omit<CalendarEvent, 'id'> = {
        title: title.trim(),
        start: date,
        type: isPayment ? 'payment_reminder' : isProject ? 'project_reminder' : 'reminder',
        color: isPayment ? '#EF4444' : isProject ? '#F59E0B' : '#38BDF8',
        isReminder: true,
        reminderCategory: category,
        amount: parsedAmount,
        projectId: selectedProjectId || undefined,
        studioName: selectedStudioName || undefined,
        coupleName: coupleName || undefined,
        notes: notes.trim() || undefined,
        completed: editingReminder?.completed || false,
        priority: 'urgent'
      };

      if (editingReminder && onUpdate) {
        await onUpdate(editingReminder.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save reminder:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = date ? (() => {
    try {
      return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return date;
    }
  })() : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-charcoal-900 border border-rose-500/40 rounded-3xl w-full max-w-lg p-5 sm:p-6 space-y-4 text-white shadow-[0_0_35px_rgba(244,63,94,0.25)] relative my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-md">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-white">
                  {editingReminder ? 'Edit Reminder' : 'Set Calendar Reminder'}
                </h3>
                {formattedDate && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold">
                    📅 {formattedDate}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                Blinks in red at the top of the dashboard until marked done
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reminder Category Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 text-center">
          <button
            type="button"
            onClick={() => {
              setCategory('payment');
              if (!title || title.includes('Milestone') || title.includes('Meeting') || title.includes('Prep')) {
                setTitle(coupleName ? `Payment Due: ${coupleName}` : 'Payment Due Reminder');
              }
            }}
            className={`py-2 px-2 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              category === 'payment'
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md border border-rose-400/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">Payment</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategory('project');
              if (!title || title.includes('Payment') || title.includes('Meeting')) {
                setTitle(coupleName ? `Milestone: ${coupleName}` : 'Project Milestone Reminder');
              }
            }}
            className={`py-2 px-2 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              category === 'project'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md border border-amber-400/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span className="truncate">Milestone</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategory('general');
              if (!title || title.includes('Payment') || title.includes('Milestone')) {
                setTitle(coupleName ? `Reminder: ${coupleName}` : 'General Reminder');
              }
            }}
            className={`py-2 px-2 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              category === 'general'
                ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-md border border-sky-400/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            <span className="truncate">General</span>
          </button>
        </div>

        {/* Dashboard Alert Notice Banner */}
        <div className="p-2.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-2.5 text-xs text-rose-200 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span>
            <strong>Dashboard Alert:</strong> Reminders for <em>{date || 'this date'}</em> will flash on the dashboard.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-mono">
          
          {/* Link to Existing Project (Optional) */}
          {projects.length > 0 && (
            <div>
              <label className="text-zinc-300 block mb-1 font-semibold flex items-center justify-between">
                <span>Link with Project (Optional)</span>
                <span className="text-[10px] text-zinc-500">Auto-fills couple & balance</span>
              </label>
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  className="w-full bg-charcoal-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500/60 appearance-none cursor-pointer pr-8"
                >
                  <option value="">-- Choose Project or Enter Manually below --</option>
                  {projects.map((p) => {
                    const balance = p.remainingBalance ?? ((p.projectAmount || 0) - (p.advancePayment || 0));
                    return (
                      <option key={p.id} value={p.id}>
                        {p.coupleName || p.projectName} {p.studioName ? `(${p.studioName})` : ''} {balance > 0 ? `• ₹${balance.toLocaleString('en-IN')} Bal` : ''}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Quick presets for Title based on category */}
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">Quick Title Presets</span>
            <div className="flex flex-wrap gap-1.5">
              {(category === 'payment' ? [
                'Collect 50% Balance Payment',
                'Collect Final Settlement',
                'Payment Advance Due',
                'Editor Payout Reminder',
                'Client Invoice Follow-up'
              ] : category === 'project' ? [
                'Deliver 4K Teaser Cut',
                'Send Rough Cut for Approval',
                'Wedding Full Film Export',
                'Client Revision Follow-up',
                'Raw Footage Drive Dispatch'
              ] : [
                'Wedding Shoot Prep & Gear Check',
                'Client Planning Meeting',
                'Client Follow-up Call',
                'Raw Footage Backup Reminder',
                'Album Selection Deadline'
              ]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTitle(coupleName ? `${preset} - ${coupleName}` : preset)}
                  className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-[10px] text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Title Field */}
          <div>
            <label className="text-zinc-300 block mb-1 font-semibold">
              Reminder Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={category === 'payment' ? "e.g. Collect ₹45,000 Balance from Royal Studio" : "e.g. Deliver 4K Teaser to Raghav & Ananya"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-charcoal-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500/60"
            />
          </div>

          {/* Row: Date & Amount (if Payment) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-300 block mb-1 font-semibold">
                Due Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-charcoal-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500/60 cursor-pointer"
              />
            </div>

            {category === 'payment' ? (
              <div>
                <label className="text-zinc-300 block mb-1 font-semibold flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-gold-400" />
                  <span>Amount Due (₹)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-charcoal-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold-500/60 font-mono"
                />
              </div>
            ) : (
              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">
                  Couple / Client Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Raghav & Ananya"
                  value={coupleName}
                  onChange={(e) => setCoupleName(e.target.value)}
                  className="w-full bg-charcoal-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white/40"
                />
              </div>
            )}
          </div>

          {/* Row: Studio Name or Additional details */}
          {category === 'payment' && (
            <div>
              <label className="text-zinc-300 block mb-1 font-semibold flex items-center justify-between">
                <span>Studio or Client Name</span>
                {studios.length > 0 && <span className="text-[10px] text-zinc-500">or pick studio below</span>}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Studio DreamCraft / Direct Client"
                  value={selectedStudioName}
                  onChange={(e) => setSelectedStudioName(e.target.value)}
                  className="w-full bg-charcoal-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white/40"
                />
              </div>
              {studios.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {studios.slice(0, 5).map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleStudioSelect(st.name)}
                      className="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 cursor-pointer"
                    >
                      {st.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-zinc-300 block mb-1 font-semibold">
              Notes & Follow-up Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Call studio manager at 11 AM; client agreed to pay remaining 50% via RTGS on final export delivery"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-charcoal-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white/40 resize-none text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title || !date}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer font-sans text-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : editingReminder ? 'Update Reminder' : 'Set Active Reminder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
