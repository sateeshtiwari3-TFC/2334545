import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  UserCheck, 
  Repeat, 
  Film, 
  Building2, 
  Download, 
  Plus, 
  X, 
  AlertCircle, 
  Sparkles, 
  HardDrive, 
  ShieldCheck, 
  Layers, 
  Trash2, 
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Table as TableIcon,
  ListFilter,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Studio, Editor, Revision, UserProfile, AuditLogCategory, AuditLogType } from '../types';

interface AuditLogViewProps {
  revisions: Revision[];
  projects: Project[];
  studios: Studio[];
  editors: Editor[];
  currentUser: UserProfile | null;
  onAddRevision: (rev: Omit<Revision, 'id' | 'createdAt'>) => Promise<void>;
  onResolveRevision: (revId: string) => Promise<void>;
  onDeleteRevision: (revId: string) => Promise<void>;
  onUpdateProject?: (id: string, updates: Partial<Project>) => Promise<void>;
  onNavigateToProject?: (projectId: string) => void;
}

export default function AuditLogView({
  revisions,
  projects,
  studios,
  editors,
  currentUser,
  onAddRevision,
  onResolveRevision,
  onDeleteRevision,
  onNavigateToProject
}: AuditLogViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedStudioId, setSelectedStudioId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Manual Log Modal State
  const [modalProjectId, setModalProjectId] = useState(projects[0]?.id || '');
  const [modalCategory, setModalCategory] = useState<AuditLogCategory>('general');
  const [modalType, setModalType] = useState<AuditLogType>('general');
  const [modalNotes, setModalNotes] = useState('');
  const [modalFieldName, setModalFieldName] = useState('');
  const [modalOldValue, setModalOldValue] = useState('');
  const [modalNewValue, setModalNewValue] = useState('');
  const [modalIsRevision, setModalIsRevision] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper map for fast lookups
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach(p => map.set(p.id, p));
    return map;
  }, [projects]);

  const studioMap = useMemo(() => {
    const map = new Map<string, Studio>();
    studios.forEach(s => map.set(s.id, s));
    return map;
  }, [studios]);

  // Derive and enrich audit entries
  const enrichedEntries = useMemo(() => {
    return revisions.map(rev => {
      const proj = projectMap.get(rev.projectId);
      const coupleName = rev.projectCoupleName || proj?.coupleName || proj?.projectName || 'General Audit';
      const studioName = rev.studioName || proj?.studioName || 'Studio Client';
      const category: AuditLogCategory = rev.category || (rev.revisionNumber ? 'revision' : (rev.type === 'status_change' ? 'status' : rev.type === 'amount_change' ? 'financial' : rev.type === 'assignment_change' ? 'assignment' : 'general'));
      
      // Parse date
      let dateObj: Date;
      if (rev.createdAt?.toDate) {
        dateObj = rev.createdAt.toDate();
      } else if (rev.createdAt?.seconds) {
        dateObj = new Date(rev.createdAt.seconds * 1000);
      } else if (rev.date) {
        dateObj = new Date(rev.date);
      } else {
        dateObj = new Date();
      }

      return {
        ...rev,
        projectCoupleName: coupleName,
        studioName,
        category,
        dateObj,
        timestamp: dateObj.getTime(),
        formattedDate: dateObj.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        formattedTime: dateObj.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      };
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [revisions, projectMap]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = enrichedEntries.length;
    const statusChanges = enrichedEntries.filter(e => e.category === 'status' || e.type === 'status_change').length;
    const financialChanges = enrichedEntries.filter(e => e.category === 'financial' || e.type === 'amount_change').length;
    const assignmentChanges = enrichedEntries.filter(e => e.category === 'assignment' || e.type === 'assignment_change').length;
    const clientRevisions = enrichedEntries.filter(e => e.category === 'revision' || !!e.revisionNumber);
    const pendingRevisions = clientRevisions.filter(e => e.status === 'pending').length;
    const resolvedRevisions = clientRevisions.filter(e => e.status === 'resolved').length;

    return {
      total,
      statusChanges,
      financialChanges,
      assignmentChanges,
      totalRevisions: clientRevisions.length,
      pendingRevisions,
      resolvedRevisions
    };
  }, [enrichedEntries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return enrichedEntries.filter(entry => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'revision') {
          if (entry.category !== 'revision' && !entry.revisionNumber) return false;
        } else if (entry.category !== selectedCategory) {
          return false;
        }
      }

      // Project filter
      if (selectedProjectId !== 'all' && entry.projectId !== selectedProjectId) {
        return false;
      }

      // Studio filter
      if (selectedStudioId !== 'all') {
        const proj = projectMap.get(entry.projectId);
        if (proj?.studioId !== selectedStudioId) return false;
      }

      // Date preset filter
      if (dateFilter === 'today') {
        if (now - entry.timestamp > oneDay) return false;
      } else if (dateFilter === 'week') {
        if (now - entry.timestamp > 7 * oneDay) return false;
      } else if (dateFilter === 'month') {
        if (now - entry.timestamp > 30 * oneDay) return false;
      }

      // Search text filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const couple = (entry.projectCoupleName || '').toLowerCase();
        const studio = (entry.studioName || '').toLowerCase();
        const notes = (entry.notes || '').toLowerCase();
        const user = (entry.performedBy || '').toLowerCase();
        const field = (entry.changedField || '').toLowerCase();
        const oldVal = String(entry.previousValue || '').toLowerCase();
        const newVal = String(entry.newValue || '').toLowerCase();
        const pId = (entry.projectId || '').toLowerCase();

        return (
          couple.includes(q) ||
          studio.includes(q) ||
          notes.includes(q) ||
          user.includes(q) ||
          field.includes(q) ||
          oldVal.includes(q) ||
          newVal.includes(q) ||
          pId.includes(q)
        );
      }

      return true;
    });
  }, [enrichedEntries, selectedCategory, selectedProjectId, selectedStudioId, dateFilter, searchQuery, projectMap]);

  // Export to CSV
  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const headers = ['Date', 'Time', 'Project ID', 'Couple / Project', 'Studio', 'Category', 'Type', 'Field Changed', 'Old Value', 'New Value', 'Notes', 'Performed By', 'Status'];
      const rows = filteredEntries.map(e => [
        `"${e.formattedDate}"`,
        `"${e.formattedTime}"`,
        `"${e.projectId}"`,
        `"${(e.projectCoupleName || '').replace(/"/g, '""')}"`,
        `"${(e.studioName || '').replace(/"/g, '""')}"`,
        `"${e.category || 'general'}"`,
        `"${e.type || 'general'}"`,
        `"${e.changedField || ''}"`,
        `"${String(e.previousValue ?? '').replace(/"/g, '""')}"`,
        `"${String(e.newValue ?? '').replace(/"/g, '""')}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
        `"${(e.performedBy || 'System').replace(/"/g, '""')}"`,
        `"${e.status || 'logged'}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `FrameCut_Audit_Revision_Log_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Submit manual log entry
  const handleSubmitManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalNotes.trim() || !modalProjectId) return;

    setIsSubmitting(true);
    try {
      const selectedProj = projectMap.get(modalProjectId);
      const isRev = modalIsRevision || modalCategory === 'revision';
      
      const payload: Omit<Revision, 'id' | 'createdAt'> = {
        projectId: modalProjectId,
        projectCoupleName: selectedProj?.coupleName || 'Wedding Project',
        studioName: selectedProj?.studioName || 'Partner Studio',
        notes: modalNotes.trim(),
        date: new Date().toISOString().slice(0, 10),
        status: isRev ? 'pending' : 'logged',
        category: isRev ? 'revision' : modalCategory,
        type: isRev ? 'revision' : modalType,
        performedBy: currentUser?.name || 'Administrator',
        performedByRole: currentUser?.role || 'admin',
        performedByEmail: currentUser?.email || '',
        changedField: modalFieldName.trim() || undefined,
        previousValue: modalOldValue.trim() || undefined,
        newValue: modalNewValue.trim() || undefined,
        revisionNumber: isRev ? (metrics.totalRevisions + 1) : undefined
      };

      await onAddRevision(payload);
      setModalNotes('');
      setModalFieldName('');
      setModalOldValue('');
      setModalNewValue('');
      setIsLogModalOpen(false);
    } catch (err) {
      console.error('Error adding audit log record:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper badge renderers
  const getCategoryBadge = (category?: AuditLogCategory, type?: AuditLogType) => {
    switch (category) {
      case 'status':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <RefreshCw className="w-3 h-3 text-blue-400" />
            Status Transition
          </span>
        );
      case 'financial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            Financial / Amount
          </span>
        );
      case 'assignment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <UserCheck className="w-3 h-3 text-purple-400" />
            Assignment Update
          </span>
        );
      case 'revision':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Repeat className="w-3 h-3 text-amber-400" />
            Client Revision
          </span>
        );
      case 'delivery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Calendar className="w-3 h-3 text-cyan-400" />
            Delivery Schedule
          </span>
        );
      case 'data_manager':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <HardDrive className="w-3 h-3 text-rose-400" />
            Physical Storage
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-gray-500/15 text-gray-300 border border-gray-500/30">
            <History className="w-3 h-3 text-gray-400" />
            Audit Note
          </span>
        );
    }
  };

  const formatValueDisplay = (val: any) => {
    if (val === undefined || val === null || val === '') return '—';
    if (typeof val === 'number') {
      return `₹${val.toLocaleString('en-IN')}`;
    }
    if (typeof val === 'string') {
      const cleaned = val.replace(/_/g, ' ');
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    return String(val);
  };

  return (
    <div id="audit-log-view-root" className="space-y-6">
      {/* Top Banner / Header Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-900/90 border border-gold-500/20 backdrop-blur-xl shadow-2xl">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-br from-gold-500/20 to-luxury-green-950 border border-gold-500/30 text-gold-400 shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black font-display tracking-wider text-white uppercase">
                System Audit & Revision Log
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                Firestore revisionHistory Active
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Comprehensive immutable tracking of project status transitions, contract amounts, and editor assignments.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* View mode toggle */}
          <div className="flex items-center p-1 rounded-xl bg-charcoal-950 border border-white/10 text-xs font-mono">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'timeline'
                  ? 'bg-gold-500/20 text-gold-400 font-bold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              Timeline
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-gold-500/20 text-gold-400 font-bold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Ledger Table
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            disabled={isExporting || filteredEntries.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 hover:text-white border border-white/10 text-xs font-mono transition-all disabled:opacity-50"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-gold-400" />
            Export CSV
          </button>

          {/* Manual Entry Modal Trigger */}
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-charcoal-950 font-bold text-xs font-mono tracking-wide shadow-lg shadow-gold-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Record Audit Entry
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-charcoal-900/80 border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total Logs</span>
            <History className="w-3.5 h-3.5 text-gold-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">{metrics.total}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Recorded events</div>
        </div>

        <div className="p-3.5 rounded-xl bg-charcoal-900/80 border border-blue-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-blue-400 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Status Updates</span>
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-300">{metrics.statusChanges}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Workflow stages</div>
        </div>

        <div className="p-3.5 rounded-xl bg-charcoal-900/80 border border-emerald-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Financial Revisions</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300">{metrics.financialChanges}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Amount / advances</div>
        </div>

        <div className="p-3.5 rounded-xl bg-charcoal-900/80 border border-purple-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-purple-400 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Assignments</span>
            <UserCheck className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-300">{metrics.assignmentChanges}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Editor allocations</div>
        </div>

        <div className="p-3.5 rounded-xl bg-charcoal-900/80 border border-amber-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Client Revisions</span>
            <Repeat className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">{metrics.totalRevisions}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Total logged</div>
        </div>

        <div className="p-3.5 rounded-xl bg-charcoal-900/80 border border-red-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-red-400 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Pending Tasks</span>
            <Clock className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-xl font-bold font-mono text-red-300">{metrics.pendingRevisions}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Awaiting resolution</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-charcoal-900/90 border border-white/10 backdrop-blur-md space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project, couple, studio, notes, user, or old/new value..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-charcoal-950/80 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Project Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-charcoal-950/80 border border-white/10 text-xs text-gray-300 focus:outline-none focus:border-gold-500/50 font-mono"
            >
              <option value="all">📁 All Projects ({projects.length})</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.coupleName || p.projectName} ({p.id})
                </option>
              ))}
            </select>
          </div>

          {/* Studio Filter */}
          <div className="w-full md:w-52">
            <select
              value={selectedStudioId}
              onChange={(e) => setSelectedStudioId(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-charcoal-950/80 border border-white/10 text-xs text-gray-300 focus:outline-none focus:border-gold-500/50 font-mono"
            >
              <option value="all">🏢 All Studios ({studios.length})</option>
              {studios.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter Preset */}
          <div className="flex items-center p-1 rounded-xl bg-charcoal-950 border border-white/10 text-xs font-mono shrink-0">
            {(['all', 'today', 'week', 'month'] as const).map(preset => (
              <button
                key={preset}
                onClick={() => setDateFilter(preset)}
                className={`px-2.5 py-1.5 rounded-lg capitalize transition-all ${
                  dateFilter === preset
                    ? 'bg-gold-500/20 text-gold-400 font-bold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {preset === 'all' ? 'All Time' : preset === 'today' ? 'Today' : preset === 'week' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
          <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mr-1 hidden sm:inline">
            Category:
          </span>
          {[
            { id: 'all', label: `All Events (${metrics.total})` },
            { id: 'status', label: `Status Changes (${metrics.statusChanges})` },
            { id: 'financial', label: `Financial & Amounts (${metrics.financialChanges})` },
            { id: 'assignment', label: `Editor Assignments (${metrics.assignmentChanges})` },
            { id: 'revision', label: `Client Revisions (${metrics.totalRevisions})` },
            { id: 'general', label: 'General Logs' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gold-500/15 border-gold-500/40 text-gold-300 font-bold shadow-sm'
                  : 'bg-charcoal-950/60 border-white/5 text-gray-400 hover:text-gray-200 hover:border-white/15'
              }`}
            >
              {cat.label}
            </button>
          ))}

          {(searchQuery || selectedCategory !== 'all' || selectedProjectId !== 'all' || selectedStudioId !== 'all' || dateFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedProjectId('all');
                setSelectedStudioId('all');
                setDateFilter('all');
              }}
              className="ml-auto px-2.5 py-1 text-[11px] text-red-400 hover:text-red-300 font-mono flex items-center gap-1 underline underline-offset-4"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Timeline or Table */}
      {filteredEntries.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-charcoal-900/60 border border-white/10 backdrop-blur-md">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-charcoal-800 flex items-center justify-center text-gray-500">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-300 font-mono">No Audit Trail Records Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            {searchQuery || selectedCategory !== 'all'
              ? 'No logged events match the selected filter criteria. Try resetting filters.'
              : 'Audit trail entries will automatically appear here whenever project statuses, amounts, or editor assignments are modified.'}
          </p>
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-500/15 border border-gold-500/30 text-gold-400 text-xs font-mono font-bold hover:bg-gold-500/25 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Manual Audit Entry
          </button>
        </div>
      ) : viewMode === 'timeline' ? (
        /* Timeline View */
        <div className="relative pl-6 md:pl-8 space-y-6 before:absolute before:left-3 md:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-gold-500/40 before:via-luxury-green-800/30 before:to-charcoal-800">
          {filteredEntries.map((entry) => {
            const hasDiff = entry.previousValue !== undefined && entry.newValue !== undefined;
            const isRevision = entry.category === 'revision' || !!entry.revisionNumber;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="relative group"
              >
                {/* Node icon indicator */}
                <div className={`absolute -left-6 md:-left-8 top-3.5 w-6 md:w-7 h-6 md:h-7 rounded-full border flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                  entry.category === 'status'
                    ? 'bg-blue-950 border-blue-500 text-blue-400'
                    : entry.category === 'financial'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                    : entry.category === 'assignment'
                    ? 'bg-purple-950 border-purple-500 text-purple-400'
                    : isRevision
                    ? 'bg-amber-950 border-amber-500 text-amber-400'
                    : 'bg-charcoal-900 border-gold-500/60 text-gold-400'
                }`}>
                  {entry.category === 'status' ? (
                    <RefreshCw className="w-3 h-3" />
                  ) : entry.category === 'financial' ? (
                    <DollarSign className="w-3 h-3" />
                  ) : entry.category === 'assignment' ? (
                    <UserCheck className="w-3 h-3" />
                  ) : isRevision ? (
                    <Repeat className="w-3 h-3" />
                  ) : (
                    <ShieldCheck className="w-3 h-3" />
                  )}
                </div>

                {/* Audit Card Body */}
                <div className="p-4 md:p-5 rounded-2xl bg-charcoal-900/90 border border-white/10 hover:border-gold-500/30 backdrop-blur-xl shadow-xl transition-all space-y-3">
                  {/* Top line metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getCategoryBadge(entry.category, entry.type)}

                      {/* Project badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-md bg-charcoal-950 border border-white/10 text-gray-200">
                        <Film className="w-3 h-3 text-gold-400" />
                        {entry.projectCoupleName}
                      </span>

                      {/* Studio badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-gray-400 rounded-md bg-charcoal-950/60 border border-white/5">
                        <Building2 className="w-2.5 h-2.5 text-gray-500" />
                        {entry.studioName}
                      </span>
                    </div>

                    {/* Date / Time */}
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-mono shrink-0">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>{entry.formattedDate}</span>
                      <span className="text-gray-600">•</span>
                      <span>{entry.formattedTime}</span>
                    </div>
                  </div>

                  {/* Value diff highlight box if old and new values exist */}
                  {hasDiff && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-charcoal-950/90 border border-white/10 font-mono text-xs overflow-x-auto">
                      <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider shrink-0">
                        {entry.changedField ? entry.changedField.replace(/([A-Z])/g, ' $1').trim() : 'Attribute'}:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 line-through border border-red-500/20">
                          {formatValueDisplay(entry.previousValue)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                          {formatValueDisplay(entry.newValue)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Notes / Description */}
                  <p className="text-xs text-gray-200 leading-relaxed font-sans font-medium">
                    {entry.notes}
                  </p>

                  {/* Footer metadata & Action controls */}
                  <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-gray-400">
                    <div className="flex items-center gap-2">
                      <span>Logged by:</span>
                      <span className="font-bold text-gold-400">
                        {entry.performedBy || 'System Automated Sync'}
                      </span>
                      {entry.performedByRole && (
                        <span className="px-1.5 py-0.2 text-[9px] uppercase rounded bg-charcoal-800 text-gray-400 border border-white/5">
                          {entry.performedByRole}
                        </span>
                      )}
                    </div>

                    {/* Quick revision resolve or delete */}
                    <div className="flex items-center gap-2">
                      {isRevision && entry.status === 'pending' && (
                        <button
                          onClick={() => onResolveRevision(entry.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 text-[10px] font-bold transition-all"
                        >
                          <Check className="w-3 h-3" />
                          Mark Resolved
                        </button>
                      )}
                      {isRevision && entry.status === 'resolved' && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Resolved
                        </span>
                      )}

                      {/* Delete log entry */}
                      <button
                        onClick={() => {
                          if (confirm(`Permanently remove this audit log entry?`)) {
                            onDeleteRevision(entry.id);
                          }
                        }}
                        className="p-1 text-gray-600 hover:text-red-400 transition-colors rounded"
                        title="Delete log document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Dense Ledger Table View */
        <div className="overflow-hidden rounded-2xl bg-charcoal-900/90 border border-white/10 backdrop-blur-xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-charcoal-950/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Project & Studio</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Attribute / Diff</th>
                  <th className="py-3.5 px-4">Audit Note / Description</th>
                  <th className="py-3.5 px-4">Operator</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-200">
                {filteredEntries.map(entry => {
                  const hasDiff = entry.previousValue !== undefined && entry.newValue !== undefined;
                  const isRevision = entry.category === 'revision' || !!entry.revisionNumber;

                  return (
                    <tr key={entry.id} className="hover:bg-charcoal-800/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-white font-bold">{entry.formattedDate}</div>
                        <div className="text-[10px] text-gray-500">{entry.formattedTime}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-gold-400">{entry.projectCoupleName}</div>
                        <div className="text-[10px] text-gray-400">{entry.studioName} ({entry.projectId})</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getCategoryBadge(entry.category, entry.type)}
                      </td>

                      <td className="py-3 px-4">
                        {hasDiff ? (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-gray-400 line-through">
                              {formatValueDisplay(entry.previousValue)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-gray-500" />
                            <span className="text-emerald-300 font-bold">
                              {formatValueDisplay(entry.newValue)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs font-sans text-xs">
                        <div className="line-clamp-2 text-gray-300">{entry.notes}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-gray-300">{entry.performedBy || 'System'}</div>
                        {entry.performedByRole && (
                          <div className="text-[9px] uppercase text-gray-500">{entry.performedByRole}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isRevision && entry.status === 'pending' && (
                            <button
                              onClick={() => onResolveRevision(entry.id)}
                              className="p-1 px-2 rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-[10px] font-bold border border-emerald-500/30"
                            >
                              Resolve
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Permanently remove this audit log entry?`)) {
                                onDeleteRevision(entry.id);
                              }
                            }}
                            className="p-1 text-gray-500 hover:text-red-400"
                            title="Delete log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Audit / Revision Entry Modal */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-charcoal-900 border border-gold-500/30 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 px-6 bg-charcoal-950 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-gold-500/20 text-gold-400">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display tracking-wider text-white uppercase">
                      Record Manual Audit Event
                    </h3>
                    <p className="text-[10px] font-mono text-gray-400">
                      Directly persist update record in Firestore revisionHistory
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLogModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitManualLog} className="p-6 space-y-4 text-xs font-mono">
                {/* Target Project */}
                <div>
                  <label className="block text-gray-400 mb-1.5 uppercase text-[10px] tracking-wider">
                    Associated Project *
                  </label>
                  <select
                    value={modalProjectId}
                    onChange={(e) => setModalProjectId(e.target.value)}
                    required
                    className="w-full py-2 px-3 rounded-xl bg-charcoal-950 border border-white/10 text-white focus:outline-none focus:border-gold-500"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.coupleName || p.projectName} — {p.studioName} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category & Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1.5 uppercase text-[10px] tracking-wider">
                      Event Category
                    </label>
                    <select
                      value={modalCategory}
                      onChange={(e) => {
                        const cat = e.target.value as AuditLogCategory;
                        setModalCategory(cat);
                        if (cat === 'status') setModalType('status_change');
                        else if (cat === 'financial') setModalType('amount_change');
                        else if (cat === 'assignment') setModalType('assignment_change');
                        else if (cat === 'revision') {
                          setModalType('revision');
                          setModalIsRevision(true);
                        }
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-charcoal-950 border border-white/10 text-white focus:outline-none focus:border-gold-500"
                    >
                      <option value="general">General Audit Note</option>
                      <option value="status">Status Transition</option>
                      <option value="financial">Financial / Contract Amount</option>
                      <option value="assignment">Editor Assignment</option>
                      <option value="revision">Client Revision Request</option>
                      <option value="delivery">Delivery Timeline</option>
                      <option value="data_manager">Storage & Backup</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1.5 uppercase text-[10px] tracking-wider">
                      Field Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={modalFieldName}
                      onChange={(e) => setModalFieldName(e.target.value)}
                      placeholder="e.g. projectAmount, status"
                      className="w-full py-2 px-3 rounded-xl bg-charcoal-950 border border-white/10 text-white focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                {/* Old vs New Value Diffs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1.5 uppercase text-[10px] tracking-wider">
                      Previous Value (Optional)
                    </label>
                    <input
                      type="text"
                      value={modalOldValue}
                      onChange={(e) => setModalOldValue(e.target.value)}
                      placeholder="e.g. ₹2,00,000 or Editing"
                      className="w-full py-2 px-3 rounded-xl bg-charcoal-950 border border-white/10 text-white focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1.5 uppercase text-[10px] tracking-wider">
                      New Value (Optional)
                    </label>
                    <input
                      type="text"
                      value={modalNewValue}
                      onChange={(e) => setModalNewValue(e.target.value)}
                      placeholder="e.g. ₹2,41,000 or Review"
                      className="w-full py-2 px-3 rounded-xl bg-charcoal-950 border border-white/10 text-white focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                {/* Audit Description / Reason */}
                <div>
                  <label className="block text-gray-400 mb-1.5 uppercase text-[10px] tracking-wider">
                    Log Description / Reason *
                  </label>
                  <textarea
                    rows={3}
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    required
                    placeholder="Enter thorough details about what changed, who approved it, or specific notes..."
                    className="w-full py-2 px-3 rounded-xl bg-charcoal-950 border border-white/10 text-white font-sans text-xs focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Operator info preview */}
                <div className="p-3 rounded-xl bg-charcoal-950/60 border border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                  <span>Operator Signature:</span>
                  <span className="text-gold-400 font-bold">
                    {currentUser?.name || 'Administrator'} ({currentUser?.role || 'admin'})
                  </span>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLogModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-charcoal-800 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !modalNotes.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-charcoal-950 font-bold transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Save Audit Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
