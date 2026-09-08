import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Film, 
  Clock, 
  AlertTriangle,
  Info,
  Plus,
  Edit,
  Trash2,
  X,
  Camera,
  Scissors,
  CheckCircle2,
  Users,
  RotateCcw,
  Sparkles,
  Tag,
  CalendarCheck,
  Check,
  Bell,
  Palette,
  IndianRupee
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, CalendarEvent, Studio } from '../types';
import CalendarReminderModal from './calendar/CalendarReminderModal';

export interface EventTypeMeta {
  type: string;
  label: string;
  shortLabel: string;
  defaultColor: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  bgClass: string;
  borderClass: string;
  textClass: string;
  glowClass: string;
  description: string;
}

export const EVENT_TYPE_CONFIG: Record<string, EventTypeMeta> = {
  shoot: {
    type: 'shoot',
    label: 'Shoot / Production',
    shortLabel: 'Shoot',
    defaultColor: '#D4AF37', // Gold / Amber
    icon: Camera,
    bgClass: 'bg-amber-500/15',
    borderClass: 'border-amber-500/50',
    textClass: 'text-amber-300',
    glowClass: 'shadow-[0_0_12px_rgba(212,175,55,0.3)]',
    description: 'Filming, wedding coverage & live production'
  },
  meeting: {
    type: 'meeting',
    label: 'Meeting / Call',
    shortLabel: 'Meeting',
    defaultColor: '#10B981', // Green / Emerald
    icon: Users,
    bgClass: 'bg-emerald-500/15',
    borderClass: 'border-emerald-500/50',
    textClass: 'text-emerald-300',
    glowClass: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    description: 'Studio briefing, client consultation & review calls'
  },
  delivery: {
    type: 'delivery',
    label: 'Delivery / Output',
    shortLabel: 'Delivery',
    defaultColor: '#0284C7', // Blue / Sky
    icon: CheckCircle2,
    bgClass: 'bg-sky-500/15',
    borderClass: 'border-sky-500/50',
    textClass: 'text-sky-300',
    glowClass: 'shadow-[0_0_12px_rgba(2,132,199,0.3)]',
    description: 'Film export, client drive handover & deliverables'
  },
  edit: {
    type: 'edit',
    label: 'Edit / Cut Session',
    shortLabel: 'Edit',
    defaultColor: '#8B5CF6', // Purple-500
    icon: Scissors,
    bgClass: 'bg-purple-500/15',
    borderClass: 'border-purple-500/50',
    textClass: 'text-purple-300',
    glowClass: 'shadow-[0_0_12px_rgba(139,92,246,0.25)]',
    description: 'Post-production, rough cuts & color grading'
  },
  revision: {
    type: 'revision',
    label: 'Revision / Changes',
    shortLabel: 'Revision',
    defaultColor: '#EF4444', // Red-500
    icon: RotateCcw,
    bgClass: 'bg-red-500/15',
    borderClass: 'border-red-500/50',
    textClass: 'text-red-300',
    glowClass: 'shadow-[0_0_12px_rgba(239,68,68,0.25)]',
    description: 'Edits, music changes, client feedback & re-exports'
  },
  payment_reminder: {
    type: 'payment_reminder',
    label: 'Payment Reminder (Blinks on Dashboard)',
    shortLabel: 'Payment Due',
    defaultColor: '#EF4444', // Red-500
    icon: IndianRupee,
    bgClass: 'bg-rose-500/20',
    borderClass: 'border-rose-500/60',
    textClass: 'text-rose-300',
    glowClass: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    description: 'Collect client balance, studio dues & vendor payments'
  },
  project_reminder: {
    type: 'project_reminder',
    label: 'Project Milestone Reminder (Blinks on Dashboard)',
    shortLabel: 'Project Alert',
    defaultColor: '#F59E0B', // Amber / Orange
    icon: Bell,
    bgClass: 'bg-amber-500/20',
    borderClass: 'border-amber-500/60',
    textClass: 'text-amber-300',
    glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.35)]',
    description: 'Critical teaser cuts, raw footage review & deliverables'
  },
  reminder: {
    type: 'reminder',
    label: 'Reminder / Alert',
    shortLabel: 'Reminder',
    defaultColor: '#F59E0B', // Amber / Orange
    icon: Bell,
    bgClass: 'bg-amber-500/15',
    borderClass: 'border-amber-500/50',
    textClass: 'text-amber-300',
    glowClass: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    description: 'Payment reminders, shoot prep & client follow-ups'
  }
};

/**
 * Resolves the EventTypeMeta based on explicit type or title content
 */
export function getEventTypeMeta(type?: string, title?: string, customColor?: string): EventTypeMeta {
  const normType = (type || '').toLowerCase().trim();
  const normTitle = (title || '').toLowerCase();
  
  if (normType === 'payment_reminder' || (normTitle.includes('payment') && (normTitle.includes('remind') || normTitle.includes('due') || normTitle.includes('₹') || normTitle.includes('bal')))) {
    const meta = EVENT_TYPE_CONFIG.payment_reminder;
    return customColor ? { ...meta, defaultColor: customColor } : meta;
  }

  if (normType === 'project_reminder') {
    const meta = EVENT_TYPE_CONFIG.project_reminder;
    return customColor ? { ...meta, defaultColor: customColor } : meta;
  }

  if (EVENT_TYPE_CONFIG[normType]) {
    const meta = EVENT_TYPE_CONFIG[normType];
    return customColor ? { ...meta, defaultColor: customColor } : meta;
  }

  // Fallback: Infer from event title
  if (normTitle.includes('remind') || normTitle.includes('alert') || normTitle.includes('follow') || normTitle.includes('due') || normTitle.includes('todo') || normTitle.includes('note')) {
    const meta = EVENT_TYPE_CONFIG.reminder;
    return customColor ? { ...meta, defaultColor: customColor } : meta;
  }
  if (normTitle.includes('shoot') || normTitle.includes('film') || normTitle.includes('photo') || normTitle.includes('wedding')) {
    const meta = EVENT_TYPE_CONFIG.shoot;
    return customColor ? { ...meta, defaultColor: customColor } : meta;
  }
  if (normTitle.includes('edit') || normTitle.includes('cut') || normTitle.includes('grade') || normTitle.includes('render') || normTitle.includes('teaser') || normTitle.includes('trailer')) {
    const meta = EVENT_TYPE_CONFIG.edit;
    return customColor ? { ...meta, defaultColor: customColor } : meta;
  }
  if (normTitle.includes('deliver') || normTitle.includes('dispatch') || normTitle.includes('output') || normTitle.includes('export') || normTitle.includes('handover')) {
    const meta = EVENT_TYPE_CONFIG.delivery;
    return customColor ? { ...meta, defaultColor: customColor } : meta;
  }
  if (normTitle.includes('meet') || normTitle.includes('call') || normTitle.includes('brief') || normTitle.includes('consult') || normTitle.includes('zoom')) {
    const meta = EVENT_TYPE_CONFIG.meeting;
    return customColor ? { ...meta, defaultColor: customColor } : meta;
  }
  if (normTitle.includes('revis') || normTitle.includes('change') || normTitle.includes('fix') || normTitle.includes('retake') || normTitle.includes('redo')) {
    const meta = EVENT_TYPE_CONFIG.revision;
    return customColor ? { ...meta, defaultColor: customColor } : meta;
  }

  // Generic fallback
  return {
    type: normType || 'event',
    label: 'Scheduled Event',
    shortLabel: 'Event',
    defaultColor: customColor || '#D4AF37',
    icon: CalendarCheck,
    bgClass: 'bg-gold-500/15',
    borderClass: 'border-gold-500/40',
    textClass: 'text-gold-300',
    glowClass: 'shadow-[0_0_12px_rgba(212,175,55,0.25)]',
    description: 'General calendar milestone'
  };
}

interface CalendarViewProps {
  projects: Project[];
  studios?: Studio[];
  events: CalendarEvent[];
  onAddEvent?: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  onUpdateEvent?: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  onDeleteEvent?: (id: string) => Promise<void>;
}

export default function CalendarView({ projects, studios = [], events, onAddEvent, onUpdateEvent, onDeleteEvent }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<'all' | 'shoot' | 'edit' | 'delivery' | 'meeting' | 'revision' | 'reminder'>('all');

  // Event modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);

  // Dedicated Reminder Modal states (Payment & Project Reminders)
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<CalendarEvent | null>(null);
  const [reminderInitialCategory, setReminderInitialCategory] = useState<'payment' | 'project' | 'general'>('payment');
  const [reminderInitialDate, setReminderInitialDate] = useState<string>('');

  const handleOpenReminderModal = (cat: 'payment' | 'project' | 'general' = 'payment') => {
    setReminderInitialCategory(cat);
    setReminderInitialDate(new Date().toISOString().split('T')[0]);
    setEditingReminder(null);
    setIsReminderModalOpen(true);
  };

  const handleOpenReminderModalForDate = (dateStr: string, cat: 'payment' | 'project' | 'general' = 'payment') => {
    setReminderInitialCategory(cat);
    setReminderInitialDate(dateStr);
    setEditingReminder(null);
    setIsReminderModalOpen(true);
  };

  const handleSaveReminder = async (reminderData: Omit<CalendarEvent, 'id'>) => {
    if (onAddEvent) {
      await onAddEvent(reminderData);
    }
  };

  const handleUpdateReminder = async (id: string, reminderData: Partial<CalendarEvent>) => {
    if (onUpdateEvent) {
      await onUpdateEvent(id, reminderData);
    }
  };

  const handleToggleReminderDone = async (e: React.MouseEvent, evt: CalendarEvent) => {
    e.stopPropagation();
    if (!onUpdateEvent) return;
    await onUpdateEvent(evt.id, {
      completed: !evt.completed,
      completedAt: !evt.completed ? new Date().toISOString() : null
    });
  };

  // Form fields
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtType, setEvtType] = useState<string>('shoot');
  const [evtColor, setEvtColor] = useState('#D4AF37');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Compile calendar events from database calendar + project due dates
  const compiledEvents: CalendarEvent[] = [
    // Database events with auto color fallback if not explicitly set
    ...events.map(evt => {
      const meta = getEventTypeMeta(evt.type, evt.title, evt.color);
      return {
        ...evt,
        color: evt.color || meta.defaultColor
      };
    }),
    // Auto-generate shoot date events
    ...projects.map(p => ({
      id: `shoot-${p.id}`,
      title: `Shoot: ${p.coupleName}`,
      start: p.shootDate,
      type: 'shoot' as const,
      projectId: p.id,
      coupleName: p.coupleName,
      color: EVENT_TYPE_CONFIG.shoot.defaultColor
    })),
    // Auto-generate delivery deadline events
    ...projects.map(p => ({
      id: `deliv-${p.id}`,
      title: `Deliver: ${p.coupleName}`,
      start: p.deliveryDate,
      type: 'delivery' as const,
      projectId: p.id,
      coupleName: p.coupleName,
      color: EVENT_TYPE_CONFIG.delivery.defaultColor
    }))
  ].filter(evt => evt.start); // filter out empty dates

  // Filter calendar list
  const filteredEvents = compiledEvents.filter(evt => {
    if (filterType === 'all') return true;
    const meta = getEventTypeMeta(evt.type, evt.title);
    if (filterType === 'reminder') {
      return meta.type === 'reminder' || meta.type === 'payment_reminder' || meta.type === 'project_reminder' || evt.isReminder;
    }
    return meta.type === filterType || evt.type === filterType;
  });

  // Calculate counts for each event type filter tab
  const eventCounts = {
    all: compiledEvents.length,
    shoot: compiledEvents.filter(e => getEventTypeMeta(e.type, e.title).type === 'shoot').length,
    edit: compiledEvents.filter(e => getEventTypeMeta(e.type, e.title).type === 'edit').length,
    delivery: compiledEvents.filter(e => getEventTypeMeta(e.type, e.title).type === 'delivery').length,
    meeting: compiledEvents.filter(e => getEventTypeMeta(e.type, e.title).type === 'meeting').length,
    revision: compiledEvents.filter(e => getEventTypeMeta(e.type, e.title).type === 'revision').length,
    reminder: compiledEvents.filter(e => {
      const meta = getEventTypeMeta(e.type, e.title);
      return meta.type === 'reminder' || meta.type === 'payment_reminder' || meta.type === 'project_reminder' || e.isReminder;
    }).length,
  };

  // Calculate calendar grid days
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Pre-padding empty blocks
  const paddingBlocks = Array.from({ length: firstDayIndex }, (_, i) => null);
  const calendarBlocks = [...paddingBlocks, ...daysArray];

  // Helper to find events on a given date
  const getEventsForDay = (day: number) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(evt => evt.start === dStr);
  };

  // Handler when user selects a type in the modal
  const handleSelectEventType = (typeKey: string) => {
    setEvtType(typeKey);
    const meta = EVENT_TYPE_CONFIG[typeKey];
    if (meta) {
      setEvtColor(meta.defaultColor);
    }
  };

  const activeMeta = getEventTypeMeta(evtType, evtTitle, evtColor);
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="space-y-6">
      
      {/* Filters & Navigation */}
      <div className="p-6 rounded-3xl glass-panel flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 bg-charcoal-900 border border-luxury-green-800/30 p-1.5 rounded-2xl">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-luxury-green-800/40 hover:text-gold-400 rounded-xl transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold font-display text-white px-3 min-w-[140px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-luxury-green-800/40 hover:text-gold-400 rounded-xl transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 bg-charcoal-900/80 hover:bg-charcoal-800 border border-white/10 hover:border-gold-500/30 text-gray-300 hover:text-white rounded-xl text-xs font-mono transition-all cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* Dynamic Type Filter Tabs with Auto-Assigned Icons & Colors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* All */}
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center space-x-1.5 cursor-pointer ${
              filterType === 'all' 
                ? 'bg-luxury-green-800 text-gold-400 font-bold border border-gold-500/40 shadow-sm' 
                : 'bg-charcoal-900 text-gray-400 hover:text-gray-200 border border-white/5'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>All ({eventCounts.all})</span>
          </button>

          {/* Shoot (Gold) */}
          <button
            onClick={() => setFilterType('shoot')}
            className={`px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center space-x-1.5 cursor-pointer ${
              filterType === 'shoot' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold shadow-[0_0_12px_rgba(212,175,55,0.35)]' 
                : 'bg-charcoal-900 text-gray-400 hover:text-amber-400 border border-white/5'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>Shoots ({eventCounts.shoot})</span>
          </button>

          {/* Meeting (Green) */}
          <button
            onClick={() => setFilterType('meeting')}
            className={`px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center space-x-1.5 cursor-pointer ${
              filterType === 'meeting' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold shadow-[0_0_12px_rgba(16,185,129,0.35)]' 
                : 'bg-charcoal-900 text-gray-400 hover:text-emerald-400 border border-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Meetings ({eventCounts.meeting})</span>
          </button>

          {/* Delivery (Blue) */}
          <button
            onClick={() => setFilterType('delivery')}
            className={`px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center space-x-1.5 cursor-pointer ${
              filterType === 'delivery' 
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold shadow-[0_0_12px_rgba(2,132,199,0.35)]' 
                : 'bg-charcoal-900 text-gray-400 hover:text-sky-400 border border-white/5'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Deliveries ({eventCounts.delivery})</span>
          </button>

          {/* Edit (Purple) */}
          <button
            onClick={() => setFilterType('edit')}
            className={`px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center space-x-1.5 cursor-pointer ${
              filterType === 'edit' 
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 font-bold shadow-[0_0_12px_rgba(139,92,246,0.35)]' 
                : 'bg-charcoal-900 text-gray-400 hover:text-purple-400 border border-white/5'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-purple-400" />
            <span>Edits ({eventCounts.edit})</span>
          </button>

          {/* Revision (Red) */}
          <button
            onClick={() => setFilterType('revision')}
            className={`px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center space-x-1.5 cursor-pointer ${
              filterType === 'revision' 
                ? 'bg-red-500/20 text-red-300 border border-red-500/50 font-bold shadow-[0_0_12px_rgba(239,68,68,0.35)]' 
                : 'bg-charcoal-900 text-gray-400 hover:text-red-400 border border-white/5'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            <span>Revisions ({eventCounts.revision})</span>
          </button>

          {/* Reminder (Amber / Orange) */}
          <button
            onClick={() => setFilterType('reminder')}
            className={`px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center space-x-1.5 cursor-pointer ${
              filterType === 'reminder' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold shadow-[0_0_12px_rgba(245,158,11,0.35)]' 
                : 'bg-charcoal-900 text-gray-400 hover:text-amber-400 border border-white/5'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Reminders ({eventCounts.reminder})</span>
          </button>

          {/* Set Reminder Action (Payment or Project) */}
          <button
            id="set-calendar-reminder-btn"
            onClick={() => handleOpenReminderModal('payment')}
            className="px-3.5 py-2 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.35)] hover:scale-105 transition-all ml-1 border border-rose-400/40"
          >
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            <span>+ Set Reminder</span>
          </button>

          {/* Schedule Event Action */}
          <button
            id="schedule-calendar-event-btn"
            onClick={() => {
              setEvtTitle('');
              setEvtDate(new Date().toISOString().split('T')[0]);
              setEvtType('shoot');
              setEvtColor(EVENT_TYPE_CONFIG.shoot.defaultColor);
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-charcoal-950 font-bold rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105 transition-all ml-1"
          >
            <Plus className="w-4 h-4" /> Schedule Event
          </button>
        </div>
      </div>

      {/* Category Color Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-charcoal-950/80 border border-white/5 text-xs">
        <div className="flex items-center gap-2 text-gray-400 text-[11px] font-mono">
          <Tag className="w-3.5 h-3.5 text-gold-400" />
          <span>Category Color Coding:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.7)]" />
            <span className="text-amber-300 font-semibold">Shoot: Gold</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
            <span className="text-emerald-300 font-semibold">Meeting: Green</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] shadow-[0_0_8px_rgba(2,132,199,0.7)]" />
            <span className="text-sky-300 font-semibold">Delivery: Blue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_rgba(139,92,246,0.7)]" />
            <span className="text-purple-300 font-semibold">Edit: Purple</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
            <span className="text-red-300 font-semibold">Revision: Red</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
            <span className="text-amber-400 font-semibold">Reminder: Amber</span>
          </div>
        </div>
      </div>

      {/* Main Grid & Sidemenu */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Calendar Grid */}
        <div className="xl:col-span-3 p-6 rounded-3xl glass-panel overflow-x-auto custom-scrollbar">
          <div className="min-w-[580px]">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono text-gray-400 mb-4 border-b border-luxury-green-800/20 pb-3 font-bold">
            <span className="text-red-400/80">SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span className="text-sky-400/80">SAT</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarBlocks.map((day, idx) => {
              if (day === null) {
                return (
                  <div key={`empty-${idx}`} className="h-28 bg-charcoal-950/20 rounded-2xl border border-dashed border-luxury-green-800/5 opacity-40" />
                );
              }

              const dayEvents = getEventsForDay(day);
              const today = new Date();
              const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              const primaryEvent = dayEvents.length > 0 ? dayEvents[0] : null;
              const primaryMeta = primaryEvent ? getEventTypeMeta(primaryEvent.type, primaryEvent.title, primaryEvent.color) : null;

              const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

              return (
                <div 
                  key={`day-${day}`} 
                  onClick={() => handleOpenReminderModalForDate(dStr, 'payment')}
                  className={`h-28 p-2 rounded-2xl border transition-all flex flex-col justify-between group/day relative overflow-hidden cursor-pointer hover:border-gold-500/80 hover:shadow-[0_0_20px_rgba(212,175,55,0.18)] ${
                    isToday 
                      ? 'bg-charcoal-900 border-gold-500/80 shadow-[0_0_15px_rgba(212,175,55,0.2)] ring-1 ring-gold-500/40' 
                      : dayEvents.length > 0
                      ? 'bg-charcoal-900/80 hover:bg-charcoal-900 hover:border-gold-500/50 shadow-sm'
                      : 'bg-charcoal-900/60 border-luxury-green-800/10 hover:border-gold-500/40 hover:bg-charcoal-900/90'
                  }`}
                  style={
                    !isToday && primaryMeta ? {
                      borderColor: `${primaryMeta.defaultColor}44`,
                      borderLeftWidth: '3.5px',
                      borderLeftColor: primaryMeta.defaultColor
                    } : {}
                  }
                  title={`Click date ${dStr} to set a reminder or view events`}
                >
                  <div className="flex items-center justify-between w-full">
                    {isToday ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-gold-500 text-charcoal-950 text-[9px] font-mono font-bold">
                        TODAY
                      </span>
                    ) : (
                      /* Color-coded category indicator dots */
                      <div className="flex items-center gap-1">
                        {dayEvents.slice(0, 3).map((evt, dIdx) => {
                          const meta = getEventTypeMeta(evt.type, evt.title, evt.color);
                          return (
                            <span 
                              key={`${evt.id}-dot-${dIdx}`}
                              className="w-2 h-2 rounded-full inline-block shrink-0 ring-1 ring-black/50"
                              style={{ 
                                backgroundColor: meta.defaultColor,
                                boxShadow: `0 0 6px ${meta.defaultColor}`
                              }}
                              title={`${meta.shortLabel}: ${evt.title}`}
                            />
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <span className="text-[8px] font-mono text-gray-400 font-bold">
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      {/* Hover action prompt: + Reminder */}
                      <span className="opacity-0 group-hover/day:opacity-100 transition-opacity text-[8px] font-mono text-rose-300 font-bold bg-rose-500/20 border border-rose-500/40 px-1 py-0.5 rounded-md flex items-center gap-1">
                        <Bell className="w-2.5 h-2.5 animate-bounce text-rose-400" />
                        <span>+ Reminder</span>
                      </span>
                      <span className={`text-xs font-mono font-bold ${isToday ? 'text-gold-400' : dayEvents.length > 0 ? 'text-white' : 'text-gray-400'}`}>
                        {day}
                      </span>
                    </div>
                  </div>
                  
                  {/* Event Badges with Color-Coded Dots and Border Highlights */}
                  <div className="space-y-1 overflow-y-auto max-h-[72px] pr-0.5 custom-scrollbar">
                    {dayEvents.map((evt) => {
                      const meta = getEventTypeMeta(evt.type, evt.title, evt.color);
                      const IconComponent = meta.icon;

                      return (
                        <div 
                          key={evt.id} 
                          className="px-1.5 py-1 rounded-lg text-[9px] font-mono font-medium truncate flex items-center space-x-1.5 cursor-pointer transition-all hover:scale-[1.02] hover:brightness-110 shadow-xs border border-l-[3px]"
                          style={{ 
                            backgroundColor: `${meta.defaultColor}22`,
                            borderColor: `${meta.defaultColor}66`,
                            borderLeftColor: meta.defaultColor,
                            color: '#FFFFFF'
                          }}
                          title={`${meta.label}: ${evt.title} (${evt.start})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (evt.isReminder || meta.type === 'payment_reminder' || meta.type === 'project_reminder') {
                              setEditingReminder(evt);
                              setReminderInitialDate(evt.start);
                              setIsReminderModalOpen(true);
                            } else {
                              setEditingEvent(evt);
                              setEvtTitle(evt.title);
                              setEvtDate(evt.start);
                              setEvtType(meta.type);
                              setEvtColor(evt.color || meta.defaultColor);
                            }
                          }}
                        >
                          {/* Color-Coded Category Dot / Alert Beacon */}
                          <span 
                            className={`w-1.5 h-1.5 rounded-full shrink-0 shadow-xs ${
                              (evt.isReminder || meta.type === 'payment_reminder') && !evt.completed
                                ? 'animate-ping bg-rose-500'
                                : ''
                            }`}
                            style={{ 
                              backgroundColor: meta.defaultColor,
                              boxShadow: `0 0 5px ${meta.defaultColor}`
                            }}
                          />
                          <div 
                            className="w-3.5 h-3.5 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: meta.defaultColor }}
                          >
                            <IconComponent className="w-2.5 h-2.5 text-charcoal-950 font-bold" />
                          </div>
                          <span className={`truncate font-semibold text-[9.5px] leading-tight ${evt.completed ? 'line-through text-zinc-400' : ''}`}>
                            {evt.title}
                          </span>
                          {evt.amount && (
                            <span className="shrink-0 text-[8.5px] font-mono text-amber-300 font-bold ml-auto">
                              ₹{evt.amount >= 1000 ? `${(evt.amount / 1000).toFixed(0)}k` : evt.amount}
                            </span>
                          )}
                          {evt.completed && (
                            <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0 ml-auto" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* Deliveries Timeline sidebar panel */}
        <div className="p-6 rounded-3xl glass-panel space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-luxury-green-800/20 pb-3">
              <div>
                <h3 className="text-sm font-bold font-display text-white">Milestone Timeline</h3>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">Chronological events sorted by date</p>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-charcoal-900 border border-white/10 text-[10px] font-mono text-gold-400">
                {filteredEvents.length} Items
              </span>
            </div>
            
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredEvents.length > 0 ? (
                filteredEvents
                  .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                  .slice(0, 15)
                  .map((evt) => {
                    const meta = getEventTypeMeta(evt.type, evt.title, evt.color);
                    const IconComponent = meta.icon;
                    const isReminderType = evt.isReminder || meta.type === 'payment_reminder' || meta.type === 'project_reminder';

                    return (
                      <div 
                        key={evt.id} 
                        className={`p-3 bg-charcoal-950/80 border rounded-2xl space-y-1.5 relative overflow-hidden flex items-center justify-between gap-2.5 group transition-all ${
                          isReminderType && !evt.completed
                            ? 'border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:border-rose-400/60'
                            : 'border-luxury-green-800/15 hover:border-gold-500/30'
                        }`}
                      >
                        <div 
                          className="absolute top-0 left-0 bottom-0 w-1.5" 
                          style={{ backgroundColor: meta.defaultColor }} 
                        />

                        <div className="pl-2 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span 
                              className="w-2 h-2 rounded-full inline-block shrink-0 shadow-xs" 
                              style={{ 
                                backgroundColor: meta.defaultColor, 
                                boxShadow: `0 0 6px ${meta.defaultColor}` 
                              }} 
                            />
                            <div 
                              className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${meta.defaultColor}33`, color: meta.defaultColor }}
                            >
                              <IconComponent className="w-2.5 h-2.5" />
                            </div>
                            <span 
                              className="text-[9px] font-mono font-bold uppercase tracking-wider"
                              style={{ color: meta.defaultColor }}
                            >
                              {meta.shortLabel}
                            </span>
                            <span className="text-[9px] font-mono text-gray-500">• {evt.start}</span>

                            {/* Live Alert on Dashboard Badge */}
                            {isReminderType && (
                              <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                                evt.completed
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                              }`}>
                                {evt.completed ? (
                                  <>✓ Completed</>
                                ) : (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping inline-block" />
                                    <span>Dashboard Alert</span>
                                  </>
                                )}
                              </span>
                            )}
                          </div>

                          <h4 className={`text-xs font-semibold truncate mt-1 ${evt.completed ? 'line-through text-zinc-500' : 'text-gray-100'}`}>
                            {evt.title}
                          </h4>
                          
                          <div className="flex items-center gap-2 mt-0.5">
                            {evt.coupleName && (
                              <p className="text-[10px] text-gray-400 truncate">{evt.coupleName}</p>
                            )}
                            {evt.amount && (
                              <span className="text-[10px] font-mono font-bold text-amber-400">
                                ₹{evt.amount.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          {/* Quick Toggle Done for Reminders */}
                          {isReminderType && (
                            <button
                              onClick={(e) => handleToggleReminderDone(e, evt)}
                              title={evt.completed ? "Mark Incomplete" : "Mark Done"}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                evt.completed
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                                  : 'bg-charcoal-900 text-zinc-400 border-white/5 hover:text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                            >
                              <Check className="w-3 h-3 font-bold" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (isReminderType) {
                                setEditingReminder(evt);
                                setIsReminderModalOpen(true);
                              } else {
                                setEditingEvent(evt);
                                setEvtTitle(evt.title);
                                setEvtDate(evt.start);
                                setEvtType(meta.type);
                                setEvtColor(evt.color || meta.defaultColor);
                              }
                            }}
                            title="Edit Event"
                            className="p-1.5 rounded-lg bg-charcoal-900 hover:bg-gold-500/20 text-gold-400 border border-white/5 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEventToDeleteId(evt.id)}
                            title="Delete Event"
                            className="p-1.5 rounded-lg bg-charcoal-900 hover:bg-red-500/20 text-red-400 border border-white/5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-12 text-xs text-gray-500 font-mono bg-charcoal-950/40 rounded-2xl border border-white/5 p-4">
                  <CalendarIcon className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <span>No actions scheduled in this filter category.</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Legend Bar */}
          <div className="pt-3 border-t border-luxury-green-800/20">
            <span className="text-[10px] font-mono text-gray-500 block mb-2 uppercase tracking-wider">Event Types Legend</span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
              {Object.values(EVENT_TYPE_CONFIG).map((cfg) => {
                const Icon = cfg.icon;
                return (
                  <div key={cfg.type} className="flex items-center space-x-1.5 text-gray-300">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.defaultColor }} />
                    <Icon className="w-3 h-3" style={{ color: cfg.defaultColor }} />
                    <span className="truncate">{cfg.shortLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SCHEDULE / EDIT EVENT MODAL */}
      {(isAddModalOpen || editingEvent) && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-gold-500/30 rounded-3xl w-full max-w-lg p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
                  style={{ backgroundColor: `${evtColor}33`, border: `1px solid ${evtColor}66` }}
                >
                  <ActiveIcon className="w-4 h-4" style={{ color: evtColor }} />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-white">
                    {editingEvent ? 'Edit Scheduled Event' : 'Schedule New Production Event'}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    Automatically styled by event category
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingEvent(null); }}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!evtTitle || !evtDate) return;

                if (editingEvent && onUpdateEvent) {
                  await onUpdateEvent(editingEvent.id, {
                    title: evtTitle,
                    start: evtDate,
                    type: evtType,
                    color: evtColor
                  });
                } else if (onAddEvent) {
                  await onAddEvent({
                    title: evtTitle,
                    start: evtDate,
                    type: evtType,
                    color: evtColor
                  });
                }

                setIsAddModalOpen(false);
                setEditingEvent(null);
              }}
              className="space-y-4 text-xs font-mono"
            >
              {/* Event Type Selector Cards (Automatic Icon & Color Assignment) */}
              <div>
                <label className="text-gray-300 block mb-2 font-semibold">
                  Event Category / Type <span className="text-gold-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.values(EVENT_TYPE_CONFIG).map((cfg) => {
                    const Icon = cfg.icon;
                    const isSelected = evtType === cfg.type;

                    return (
                      <button
                        key={cfg.type}
                        type="button"
                        onClick={() => handleSelectEventType(cfg.type)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'ring-2 ring-white/80 shadow-lg scale-[1.02]'
                            : 'opacity-70 hover:opacity-100 bg-charcoal-950/60 border-white/10'
                        }`}
                        style={{
                          backgroundColor: isSelected ? `${cfg.defaultColor}22` : undefined,
                          borderColor: isSelected ? cfg.defaultColor : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div 
                            className="w-6 h-6 rounded-lg flex items-center justify-center shadow-xs"
                            style={{ backgroundColor: cfg.defaultColor }}
                          >
                            <Icon className="w-3.5 h-3.5 text-charcoal-950 font-bold" />
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                        <span className="font-bold text-white text-[11px] block">{cfg.shortLabel}</span>
                        <span className="text-[9px] text-gray-400 line-clamp-1 mt-0.5">{cfg.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Event Title */}
              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Event Title <span className="text-gold-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding Shoot: Raghav & Ananya / Teaser Edit / Client Call"
                  value={evtTitle}
                  onChange={(e) => setEvtTitle(e.target.value)}
                  className="w-full bg-charcoal-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-gold-500/60 text-xs"
                />
              </div>

              {/* Date & Quick Type Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 block mb-1 font-semibold">Scheduled Date <span className="text-gold-400">*</span></label>
                  <input
                    type="date"
                    required
                    value={evtDate}
                    onChange={(e) => setEvtDate(e.target.value)}
                    className="w-full bg-charcoal-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-gold-500/60 cursor-pointer text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray-300 font-semibold flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-gold-400" />
                      <span>Color Coding</span>
                    </label>
                    <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">{evtColor}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    {[
                      { name: 'Gold (Shoot)', color: '#D4AF37' },
                      { name: 'Amber (Reminder)', color: '#F59E0B' },
                      { name: 'Emerald (Meeting)', color: '#10B981' },
                      { name: 'Sky Blue (Delivery)', color: '#0284C7' },
                      { name: 'Royal Purple (Edit)', color: '#8B5CF6' },
                      { name: 'Crimson (Revision)', color: '#EF4444' },
                      { name: 'Cyan Neon', color: '#06B6D4' },
                      { name: 'Pink Rose', color: '#EC4899' },
                    ].map((item) => (
                      <button
                        key={item.color}
                        type="button"
                        title={item.name}
                        onClick={() => setEvtColor(item.color)}
                        className={`w-6 h-6 rounded-full transition-all cursor-pointer relative shrink-0 ${
                          evtColor.toLowerCase() === item.color.toLowerCase() ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                        style={{ backgroundColor: item.color }}
                      />
                    ))}

                    {/* Custom Hex Color Picker */}
                    <label 
                      title="Choose Custom Color"
                      className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center cursor-pointer hover:border-gold-400 overflow-hidden relative group bg-charcoal-800"
                    >
                      <input
                        type="color"
                        value={evtColor}
                        onChange={(e) => setEvtColor(e.target.value)}
                        className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                      />
                      <Palette className="w-3 h-3 text-gold-400 group-hover:scale-110 transition-transform" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Live Preview Banner */}
              <div className="p-3 rounded-2xl bg-charcoal-950 border border-white/10 space-y-1">
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">Live Calendar Badge Preview</span>
                <div 
                  className="px-2.5 py-1.5 rounded-xl border flex items-center space-x-2 w-fit max-w-full"
                  style={{
                    backgroundColor: `${evtColor}22`,
                    borderColor: `${evtColor}66`,
                    color: '#FFFFFF'
                  }}
                >
                  <div 
                    className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: evtColor }}
                  >
                    <ActiveIcon className="w-2.5 h-2.5 text-charcoal-950 font-bold" />
                  </div>
                  <span className="font-bold text-[10px] truncate">
                    {evtTitle || 'Event Title Preview'}
                  </span>
                  <span className="text-[9px] opacity-75 font-mono">
                    ({evtDate || 'No Date'})
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingEvent(null); }}
                  className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-charcoal-950 font-bold rounded-xl shadow-lg transition-all cursor-pointer font-sans text-xs"
                >
                  {editingEvent ? 'Update Event' : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE EVENT CONFIRMATION MODAL */}
      {eventToDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-red-500/30 rounded-3xl w-full max-w-sm p-6 space-y-4 text-center text-white">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white">Delete Calendar Event</h3>
              <p className="text-xs text-gray-400 font-mono mt-1">Are you sure you want to delete this event from the timeline calendar?</p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEventToDeleteId(null)}
                className="px-4 py-2 rounded-xl bg-charcoal-800 text-gray-300 hover:text-white text-xs font-mono font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onDeleteEvent && eventToDeleteId) {
                    await onDeleteEvent(eventToDeleteId);
                  }
                  setEventToDeleteId(null);
                }}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs font-mono shadow-lg cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SET / EDIT REMINDER MODAL (Payment & Project alerts) */}
      <CalendarReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setEditingReminder(null);
        }}
        onSave={handleSaveReminder}
        onUpdate={handleUpdateReminder}
        editingReminder={editingReminder}
        projects={projects}
        studios={studios}
        initialCategory={reminderInitialCategory}
        initialDate={reminderInitialDate}
      />
    </div>
  );
}

