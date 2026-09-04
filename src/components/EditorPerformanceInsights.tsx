import React, { useState, useMemo } from 'react';
import { 
  IndianRupee, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ArrowUpDown, 
  Download, 
  SlidersHorizontal, 
  Sparkles, 
  Wallet, 
  Briefcase, 
  CheckCheck, 
  ArrowUpRight, 
  BarChart3, 
  ChevronRight,
  ChevronDown,
  Layers,
  Award,
  CreditCard,
  Percent,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Editor, Project, PaymentHistory } from '../types';

export interface EditorPerformanceStats {
  editor: Editor;
  totalWorkAssigned: number;
  totalPaidWages: number;
  pendingBalance: number;
  settlementRate: number; // 0 to 100
  totalProjectsCount: number;
  activeProjectsCount: number;
  completedProjectsCount: number;
  paymentsCount: number;
  lastPaymentDate: string | null;
  avgProjectWorkload: number;
  statusCategory: 'settled' | 'pending' | 'surplus';
}

interface EditorPerformanceInsightsProps {
  editors: Editor[];
  projects: Project[];
  payments: PaymentHistory[];
  onSelectEditor: (editor: Editor) => void;
  onQuickSettlePayment?: (editor: Editor) => void;
}

type SortField = 'workAssigned' | 'paidWages' | 'pendingBalance' | 'rating' | 'projectsCount' | 'settlementRate';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'pending' | 'settled' | 'active_load';

export const EditorPerformanceInsights: React.FC<EditorPerformanceInsightsProps> = ({
  editors,
  projects,
  payments,
  onSelectEditor,
  onQuickSettlePayment
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('workAssigned');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isExpanded, setIsExpanded] = useState(true);

  // Compute stats for each editor
  const editorStatsList: EditorPerformanceStats[] = useMemo(() => {
    return editors.map((editor) => {
      // Find all projects where this editor is assigned as lead or secondary editor
      const editorProjects = projects.filter(
        (p) => p.assignedEditorId === editor.id || (p.isSplitProject && p.secondEditorId === editor.id)
      );

      const completedProjects = editorProjects.filter(
        (p) => p.status === 'delivered' || p.status === 'closed'
      );
      const activeProjects = editorProjects.filter(
        (p) => p.status !== 'delivered' && p.status !== 'closed'
      );

      // Calculate total work assigned (in INR)
      const totalWorkAssigned = editorProjects.reduce((sum, p) => {
        if (p.isSplitProject) {
          if (p.assignedEditorId === editor.id) {
            return sum + (Number(p.firstEditorShare) || 0);
          } else if (p.secondEditorId === editor.id) {
            return sum + (Number(p.secondEditorShare) || 0);
          }
        }
        return sum + (Number(p.editorPayment) || 0);
      }, 0);

      // Find all payments made to this editor
      const editorPayments = payments.filter(
        (pay) => pay.entityId === editor.id && pay.entityType === 'editor'
      );

      const totalPaidWages = editorPayments.reduce(
        (sum, pay) => sum + (Number(pay.amount) || 0),
        0
      );

      const pendingBalance = totalWorkAssigned - totalPaidWages;

      let settlementRate = 0;
      if (totalWorkAssigned > 0) {
        settlementRate = Math.min(100, Math.round((totalPaidWages / totalWorkAssigned) * 100));
      } else if (totalPaidWages > 0) {
        settlementRate = 100;
      }

      // Find last payment date
      let lastPaymentDate: string | null = null;
      if (editorPayments.length > 0) {
        const sortedDates = editorPayments
          .map((p) => p.date)
          .filter(Boolean)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        if (sortedDates.length > 0) {
          lastPaymentDate = sortedDates[0];
        }
      }

      const avgProjectWorkload =
        editorProjects.length > 0 ? Math.round(totalWorkAssigned / editorProjects.length) : 0;

      let statusCategory: 'settled' | 'pending' | 'surplus' = 'settled';
      if (pendingBalance > 0) {
        statusCategory = 'pending';
      } else if (pendingBalance < 0) {
        statusCategory = 'surplus';
      }

      return {
        editor,
        totalWorkAssigned,
        totalPaidWages,
        pendingBalance,
        settlementRate,
        totalProjectsCount: editorProjects.length,
        activeProjectsCount: activeProjects.length,
        completedProjectsCount: completedProjects.length,
        paymentsCount: editorPayments.length,
        lastPaymentDate,
        avgProjectWorkload,
        statusCategory
      };
    });
  }, [editors, projects, payments]);

  // Studio-wide aggregate calculations
  const studioSummary = useMemo(() => {
    const totalAssignedWork = editorStatsList.reduce((sum, e) => sum + e.totalWorkAssigned, 0);
    const totalWagesPaid = editorStatsList.reduce((sum, e) => sum + e.totalPaidWages, 0);
    const totalOutstandingDue = editorStatsList.reduce(
      (sum, e) => sum + (e.pendingBalance > 0 ? e.pendingBalance : 0),
      0
    );
    const overallSettlementRate =
      totalAssignedWork > 0
        ? Math.min(100, Math.round((totalWagesPaid / totalAssignedWork) * 100))
        : 0;

    const editorsWithPendingPayouts = editorStatsList.filter((e) => e.pendingBalance > 0).length;
    const fullySettledEditors = editorStatsList.filter((e) => e.pendingBalance <= 0).length;
    const totalActiveCuts = editorStatsList.reduce((sum, e) => sum + e.activeProjectsCount, 0);

    // Find top earner & highest active cuts editor
    const topEarner = [...editorStatsList].sort((a, b) => b.totalWorkAssigned - a.totalWorkAssigned)[0];
    const mostActive = [...editorStatsList].sort((a, b) => b.activeProjectsCount - a.activeProjectsCount)[0];

    return {
      totalAssignedWork,
      totalWagesPaid,
      totalOutstandingDue,
      overallSettlementRate,
      editorsWithPendingPayouts,
      fullySettledEditors,
      totalActiveCuts,
      topEarner,
      mostActive,
      totalEditorsCount: editors.length
    };
  }, [editorStatsList, editors.length]);

  // Filtering & Sorting
  const filteredAndSortedStats = useMemo(() => {
    return editorStatsList
      .filter((item) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = item.editor.name.toLowerCase().includes(q);
          const matchesEmail = (item.editor.email || '').toLowerCase().includes(q);
          const matchesPhone = (item.editor.phone || '').toLowerCase().includes(q);
          if (!matchesName && !matchesEmail && !matchesPhone) return false;
        }

        // Status filter
        if (filterStatus === 'pending') {
          return item.pendingBalance > 0;
        }
        if (filterStatus === 'settled') {
          return item.pendingBalance <= 0;
        }
        if (filterStatus === 'active_load') {
          return item.activeProjectsCount > 0;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;

        switch (sortField) {
          case 'workAssigned':
            valA = a.totalWorkAssigned;
            valB = b.totalWorkAssigned;
            break;
          case 'paidWages':
            valA = a.totalPaidWages;
            valB = b.totalPaidWages;
            break;
          case 'pendingBalance':
            valA = a.pendingBalance;
            valB = b.pendingBalance;
            break;
          case 'rating':
            valA = a.editor.rating || 0;
            valB = b.editor.rating || 0;
            break;
          case 'projectsCount':
            valA = a.totalProjectsCount;
            valB = b.totalProjectsCount;
            break;
          case 'settlementRate':
            valA = a.settlementRate;
            valB = b.settlementRate;
            break;
          default:
            valA = a.totalWorkAssigned;
            valB = b.totalWorkAssigned;
        }

        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
  }, [editorStatsList, searchQuery, filterStatus, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (editorStatsList.length === 0) return;

    const headers = [
      'Editor Name',
      'Email',
      'Phone',
      'Performance Rating',
      'Total Projects Assigned',
      'Active Cuts',
      'Completed Cuts',
      'Total Work Assigned (INR)',
      'Total Paid Wages (INR)',
      'Pending Balance (INR)',
      'Settlement Rate (%)',
      'Payments Logged',
      'Last Payment Date',
      'Settlement Status'
    ];

    const rows = editorStatsList.map((stat) => [
      `"${stat.editor.name.replace(/"/g, '""')}"`,
      `"${stat.editor.email || ''}"`,
      `"${stat.editor.phone || ''}"`,
      stat.editor.rating.toFixed(1),
      stat.totalProjectsCount,
      stat.activeProjectsCount,
      stat.completedProjectsCount,
      stat.totalWorkAssigned,
      stat.totalPaidWages,
      stat.pendingBalance,
      `${stat.settlementRate}%`,
      stat.paymentsCount,
      stat.lastPaymentDate || 'None',
      stat.statusCategory.toUpperCase()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `editor_performance_insights_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="editor-performance-insights-card"
      className="p-6 rounded-3xl bg-charcoal-900 border border-gold-500/30 space-y-6 shadow-2xl relative overflow-hidden transition-all duration-300"
    >
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-br from-gold-500/10 via-luxury-green-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-gold-500 via-luxury-green-500 to-amber-500" />

      {/* Card Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-luxury-green-800/20 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-gold-500/20 to-luxury-green-500/20 border border-gold-500/30 rounded-2xl text-gold-400 shadow-md">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold font-display text-white tracking-wide">
                Performance Insights
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-300">
                Workload & Wages Ledger
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Real-time audit of total work assigned (₹) vs. disbursed wages to date across all editors.
            </p>
          </div>
        </div>

        {/* Action Controls & Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-charcoal-950 p-1 rounded-xl border border-gray-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-gold-500/20 text-gold-300 font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-gold-500/20 text-gold-300 font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Table
            </button>
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-gray-200 border border-gray-700 hover:border-gold-500/40 text-xs font-medium rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
            title="Download full editor performance & wage summary as CSV"
          >
            <Download className="w-3.5 h-3.5 text-luxury-green-400" />
            <span>Export CSV</span>
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-charcoal-800 hover:bg-charcoal-700 text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Insights' : 'Expand Insights'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* EXECUTIVE METRICS BENTO CARDS                                             */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Work Assigned */}
            <div className="p-4 rounded-2xl bg-charcoal-950/90 border border-luxury-green-800/20 relative overflow-hidden flex flex-col justify-between group hover:border-gold-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-semibold flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-gold-400" />
                  <span>Total Work Assigned</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-300 border border-gold-500/20">
                  {projects.length} Projs
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-black font-display text-white tracking-tight flex items-baseline gap-1">
                  <span className="text-gold-400 font-sans font-medium text-lg">₹</span>
                  <span>{studioSummary.totalAssignedWork.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 font-mono">
                  Allocated across {studioSummary.totalEditorsCount} registered editors
                </p>
              </div>
            </div>

            {/* Total Wages Disbursed */}
            <div className="p-4 rounded-2xl bg-charcoal-950/90 border border-luxury-green-800/20 relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Total Wages Paid</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {payments.filter((p) => p.entityType === 'editor').length} Logs
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-black font-display text-emerald-400 tracking-tight flex items-baseline gap-1">
                  <span className="font-sans font-medium text-lg">₹</span>
                  <span>{studioSummary.totalWagesPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] font-mono text-gray-400">
                  <span>Settlement: {studioSummary.overallSettlementRate}%</span>
                  <span className="text-emerald-400/80">{studioSummary.fullySettledEditors} settled</span>
                </div>
              </div>
            </div>

            {/* Outstanding Due */}
            <div className="p-4 rounded-2xl bg-charcoal-950/90 border border-luxury-green-800/20 relative overflow-hidden flex flex-col justify-between group hover:border-rose-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-rose-400 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Outstanding Payables</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  {studioSummary.editorsWithPendingPayouts} Pending
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-black font-display text-rose-400 tracking-tight flex items-baseline gap-1">
                  <span className="font-sans font-medium text-lg">₹</span>
                  <span>{studioSummary.totalOutstandingDue.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 font-mono">
                  {studioSummary.totalActiveCuts} active cuts in pipeline
                </p>
              </div>
            </div>

            {/* Top Producer & Load Metrics */}
            <div className="p-4 rounded-2xl bg-charcoal-950/90 border border-luxury-green-800/20 relative overflow-hidden flex flex-col justify-between group hover:border-luxury-green-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-gold-400 font-semibold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-gold-400" />
                  <span>Lead Production</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-luxury-green-500/10 text-luxury-green-300 border border-luxury-green-500/20">
                  Highest Vol
                </span>
              </div>
              <div className="mt-2.5">
                {studioSummary.topEarner ? (
                  <div>
                    <div className="text-sm font-bold text-white truncate flex items-center space-x-1.5">
                      <span>{studioSummary.topEarner.editor.name}</span>
                      <span className="text-[10px] font-mono text-gold-400">
                        ★ {studioSummary.topEarner.editor.rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex justify-between">
                      <span>Assigned: ₹{studioSummary.topEarner.totalWorkAssigned.toLocaleString('en-IN')}</span>
                      <span>({studioSummary.topEarner.totalProjectsCount} cuts)</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 font-mono">No editors active</span>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SEARCH, FILTER TABS & SORT TOOLBAR                                       */}
          {/* ========================================================================= */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-gold-500/20 border border-gold-500 text-gold-300'
                    : 'bg-charcoal-950 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                All Editors ({editorStatsList.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1 ${
                  filterStatus === 'pending'
                    ? 'bg-rose-500/20 border border-rose-500 text-rose-300'
                    : 'bg-charcoal-950 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span>Payouts Due ({studioSummary.editorsWithPendingPayouts})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('settled')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1 ${
                  filterStatus === 'settled'
                    ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                    : 'bg-charcoal-950 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Fully Settled ({studioSummary.fullySettledEditors})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('active_load')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1 ${
                  filterStatus === 'active_load'
                    ? 'bg-amber-500/20 border border-amber-500 text-amber-300'
                    : 'bg-charcoal-950 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Active Load ({editorStatsList.filter((e) => e.activeProjectsCount > 0).length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search editor by name/email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-charcoal-950 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VIEW: CARDS MODE                                                          */}
          {/* ========================================================================= */}
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAndSortedStats.length === 0 ? (
                <div className="col-span-full py-12 text-center rounded-2xl bg-charcoal-950/60 border border-gray-800 space-y-2">
                  <Users className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-sm font-bold text-gray-300">No Editors Match Criteria</p>
                  <p className="text-xs text-gray-500 font-mono">Try adjusting search or filter options.</p>
                </div>
              ) : (
                filteredAndSortedStats.map((stat) => {
                  const isSettled = stat.pendingBalance <= 0;
                  const isAdvance = stat.pendingBalance < 0;

                  return (
                    <motion.div
                      key={stat.editor.id}
                      layout
                      onClick={() => onSelectEditor(stat.editor)}
                      className="p-5 rounded-2xl bg-charcoal-950/80 border border-luxury-green-800/30 hover:border-gold-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group hover:shadow-xl relative overflow-hidden"
                    >
                      {/* Top Row: Avatar, Name, Rating & Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="relative z-10 shrink-0">
                            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-md group-hover:ring-2 group-hover:ring-gold-500/50 transition-all">
                              <img
                                src={
                                  stat.editor.photo ||
                                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
                                }
                                alt={stat.editor.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white group-hover:text-gold-400 transition-colors truncate">
                              {stat.editor.name}
                            </h4>
                            <div className="flex items-center space-x-1.5 text-xs text-gray-400 mt-0.5">
                              <span className="text-[10px] font-mono text-gold-400 font-bold">
                                ★ {stat.editor.rating.toFixed(1)}
                              </span>
                              <span className="text-gray-600">•</span>
                              <span className="text-[10px] font-mono text-gray-400 truncate">
                                {stat.totalProjectsCount} projects
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isAdvance ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-[10px] font-semibold whitespace-nowrap">
                              Surplus ₹{Math.abs(stat.pendingBalance).toLocaleString('en-IN')}
                            </span>
                          ) : isSettled ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-semibold flex items-center space-x-1 whitespace-nowrap">
                              <CheckCheck className="w-3 h-3" />
                              <span>Settled</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-[10px] font-semibold whitespace-nowrap">
                              Due ₹{stat.pendingBalance.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Financial Figures Bento Grid */}
                      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-charcoal-900/90 border border-gray-800/80 font-mono text-xs">
                        {/* Work Assigned */}
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                            Work Assigned
                          </span>
                          <span className="text-sm font-bold text-white mt-0.5 block">
                            ₹{stat.totalWorkAssigned.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5 block">
                            {stat.activeProjectsCount} active / {stat.completedProjectsCount} done
                          </span>
                        </div>

                        {/* Paid Wages */}
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                            Paid Wages
                          </span>
                          <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                            ₹{stat.totalPaidWages.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5 block">
                            {stat.paymentsCount} payments logged
                          </span>
                        </div>
                      </div>

                      {/* Settlement Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-gray-400">Payout Settlement</span>
                          <span
                            className={
                              stat.settlementRate >= 100
                                ? 'text-emerald-400 font-bold'
                                : stat.settlementRate >= 50
                                ? 'text-amber-400 font-bold'
                                : 'text-rose-400 font-bold'
                            }
                          >
                            {stat.settlementRate}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-charcoal-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              stat.settlementRate >= 100
                                ? 'bg-gradient-to-r from-emerald-500 to-luxury-green-400'
                                : stat.settlementRate >= 50
                                ? 'bg-gradient-to-r from-amber-500 to-gold-400'
                                : 'bg-gradient-to-r from-rose-500 to-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, stat.settlementRate))}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Controls */}
                      <div className="flex items-center justify-between pt-1 text-xs border-t border-gray-800/60">
                        <span className="text-[10px] font-mono text-gray-400 truncate">
                          {stat.lastPaymentDate
                            ? `Last paid: ${stat.lastPaymentDate}`
                            : 'No payments recorded'}
                        </span>

                        <div className="flex items-center space-x-2 shrink-0">
                          {onQuickSettlePayment && stat.pendingBalance > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickSettlePayment(stat.editor);
                              }}
                              className="px-2.5 py-1 bg-gold-500/15 hover:bg-gold-500/25 text-gold-300 border border-gold-500/30 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer flex items-center space-x-1"
                              title="Record payment settlement for this editor"
                            >
                              <Wallet className="w-3 h-3 text-gold-400" />
                              <span>Settle</span>
                            </button>
                          )}
                          <span className="text-gray-500 group-hover:text-gold-400 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* VIEW: DETAILED TABLE MODE                                                 */
            /* ========================================================================= */
            <div className="rounded-2xl border border-luxury-green-800/30 bg-charcoal-950/80 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-800 bg-charcoal-900/60 text-gray-400 font-mono text-[10px] uppercase">
                    <th className="py-3 px-4">Editor Partner</th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                      onClick={() => toggleSort('workAssigned')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Work Assigned (₹)</span>
                        <ArrowUpDown className="w-3 h-3 text-gold-400" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                      onClick={() => toggleSort('paidWages')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Paid Wages (₹)</span>
                        <ArrowUpDown className="w-3 h-3 text-emerald-400" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                      onClick={() => toggleSort('pendingBalance')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Pending Due (₹)</span>
                        <ArrowUpDown className="w-3 h-3 text-rose-400" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                      onClick={() => toggleSort('settlementRate')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Settled %</span>
                        <ArrowUpDown className="w-3 h-3 text-gold-400" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-white transition-colors hidden md:table-cell"
                      onClick={() => toggleSort('projectsCount')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Projects</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono text-xs">
                  {filteredAndSortedStats.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 font-mono">
                        No editors match your search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedStats.map((stat) => {
                      const isSettled = stat.pendingBalance <= 0;
                      const isAdvance = stat.pendingBalance < 0;

                      return (
                        <tr
                          key={stat.editor.id}
                          onClick={() => onSelectEditor(stat.editor)}
                          className="hover:bg-charcoal-900/50 transition-colors cursor-pointer group"
                        >
                          {/* Editor Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                                <img
                                  src={
                                    stat.editor.photo ||
                                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'
                                  }
                                  alt={stat.editor.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="min-w-0 font-sans">
                                <div className="font-bold text-white group-hover:text-gold-400 transition-colors truncate">
                                  {stat.editor.name}
                                </div>
                                <div className="text-[11px] text-gray-400 font-mono">
                                  ★ {stat.editor.rating.toFixed(1)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Work Assigned */}
                          <td className="py-3 px-3 text-white font-bold">
                            ₹{stat.totalWorkAssigned.toLocaleString('en-IN')}
                          </td>

                          {/* Paid Wages */}
                          <td className="py-3 px-3 text-emerald-400 font-bold">
                            ₹{stat.totalPaidWages.toLocaleString('en-IN')}
                          </td>

                          {/* Pending Balance */}
                          <td className="py-3 px-3">
                            {isAdvance ? (
                              <span className="text-blue-400 font-bold">
                                +₹{Math.abs(stat.pendingBalance).toLocaleString('en-IN')} (Surplus)
                              </span>
                            ) : isSettled ? (
                              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>₹0 (Settled)</span>
                              </span>
                            ) : (
                              <span className="text-rose-400 font-bold">
                                ₹{stat.pendingBalance.toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>

                          {/* Settlement Progress */}
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 h-1.5 bg-charcoal-900 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    stat.settlementRate >= 100
                                      ? 'bg-emerald-400'
                                      : stat.settlementRate >= 50
                                      ? 'bg-gold-400'
                                      : 'bg-rose-400'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(0, stat.settlementRate))}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-gray-300 font-bold">{stat.settlementRate}%</span>
                            </div>
                          </td>

                          {/* Projects Count */}
                          <td className="py-3 px-3 text-gray-300 hidden md:table-cell">
                            <span>{stat.totalProjectsCount}</span>
                            <span className="text-[10px] text-gray-500 ml-1">
                              ({stat.activeProjectsCount} active)
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                              {onQuickSettlePayment && stat.pendingBalance > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onQuickSettlePayment(stat.editor)}
                                  className="px-2.5 py-1 bg-gold-500/15 hover:bg-gold-500/25 text-gold-300 border border-gold-500/30 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                                >
                                  Settle
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onSelectEditor(stat.editor)}
                                className="px-2.5 py-1 bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 rounded-lg text-[10px] transition-colors cursor-pointer"
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EditorPerformanceInsights;
