import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Film, 
  IndianRupee, 
  CheckCircle, 
  Clock, 
  Plus, 
  Sparkles, 
  Building2, 
  User, 
  ChevronRight, 
  FileText,
  FileCheck,
  Calendar,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Editor, Project, PaymentHistory, Studio } from '../types';

interface EditorInvoicesHubProps {
  editors: Editor[];
  projects: Project[];
  payments: PaymentHistory[];
  studios?: Studio[];
  userRole?: string;
  currentEditor?: Editor | null;
  onOpenPdfModal: (editor: Editor, defaultTab: 'profile' | 'invoice', e?: React.MouseEvent, projectId?: string) => void;
  onLogPayment?: (payment: any) => Promise<void>;
}

export default function EditorInvoicesHub({
  editors,
  projects,
  payments,
  studios = [],
  userRole = 'admin',
  currentEditor,
  onOpenPdfModal,
  onLogPayment
}: EditorInvoicesHubProps) {
  // If editor role, locked to currentEditor; if admin, allow selecting any editor or "all"
  const [selectedEditorId, setSelectedEditorId] = useState<string>(
    userRole === 'editor' && currentEditor ? currentEditor.id : (editors.length > 0 ? editors[0].id : 'all')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'in_progress' | 'unpaid'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'works' | 'payments' | 'quick_create'>('works');

  // Active target editor
  const targetEditor = useMemo(() => {
    if (selectedEditorId === 'all') return null;
    return editors.find(e => e.id === selectedEditorId) || (currentEditor || null);
  }, [selectedEditorId, editors, currentEditor]);

  // Filtered projects for the selected editor (or all editors if 'all')
  const relevantProjects = useMemo(() => {
    let projs = projects;
    if (selectedEditorId !== 'all') {
      projs = projs.filter(p => p.assignedEditorId === selectedEditorId || (p.isSplitProject && p.secondEditorId === selectedEditorId));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      projs = projs.filter(p => 
        p.coupleName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.studioName?.toLowerCase().includes(q) ||
        p.eventType?.toLowerCase().includes(q) ||
        p.assignedEditorName?.toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'delivered') {
      projs = projs.filter(p => p.status === 'delivered' || p.status === 'closed');
    } else if (statusFilter === 'in_progress') {
      projs = projs.filter(p => p.status !== 'delivered' && p.status !== 'closed');
    }

    return projs;
  }, [projects, selectedEditorId, searchQuery, statusFilter]);

  // Calculate Financials for the active scope
  const financialStats = useMemo(() => {
    const projs = selectedEditorId === 'all'
      ? projects
      : projects.filter(p => p.assignedEditorId === selectedEditorId || (p.isSplitProject && p.secondEditorId === selectedEditorId));

    const totalContracted = projs.reduce((sum, p) => {
      if (selectedEditorId === 'all') {
        return sum + (p.editorPayment || 0);
      }
      if (p.isSplitProject) {
        if (p.assignedEditorId === selectedEditorId) {
          return sum + (p.firstEditorShare || 0);
        } else if (p.secondEditorId === selectedEditorId) {
          return sum + (p.secondEditorShare || 0);
        }
      }
      return sum + (p.editorPayment || 0);
    }, 0);

    const targetPayments = selectedEditorId === 'all'
      ? payments.filter(pay => pay.entityType === 'editor')
      : payments.filter(pay => pay.entityId === selectedEditorId && pay.entityType === 'editor');

    const totalPaid = targetPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
    const balanceDue = totalContracted - totalPaid;
    const completedCount = projs.filter(p => p.status === 'delivered' || p.status === 'closed').length;

    return {
      totalContracted,
      totalPaid,
      balanceDue,
      totalWorks: projs.length,
      completedCount,
      activeCount: projs.length - completedCount
    };
  }, [projects, payments, selectedEditorId]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Editor Invoice Hub Control & Editor Selector */}
      <div className="p-6 rounded-3xl glass-panel border border-gold-500/20 bg-gradient-to-r from-charcoal-950 via-charcoal-900 to-charcoal-950 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold font-display text-white">Editor Work Invoices & Payouts Hub</h3>
                <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 font-mono text-[10px] font-bold border border-gold-500/30">
                  Post-Production Billing
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Generate single-work invoices, custom itemized task bills, or full payout statements with 1-click PDF export.
              </p>
            </div>
          </div>

          {/* Action Buttons: Full Statement & Custom Task Invoice */}
          <div className="flex flex-wrap items-center gap-2">
            {targetEditor ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenPdfModal(targetEditor, 'invoice', undefined, 'all')}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-gold-600 to-amber-600 hover:from-gold-500 hover:to-amber-500 text-charcoal-950 font-bold text-xs rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  title="Generate consolidated invoice for all works of this editor"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Full Editor Statement</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenPdfModal(targetEditor, 'invoice', undefined, 'custom')}
                  className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-charcoal-900 hover:bg-charcoal-800 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                  title="Build custom line item bill (e.g. Teasers, Extra Reels, Color Grading)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Custom Task Bill</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (editors.length > 0) {
                    onOpenPdfModal(editors[0], 'invoice');
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gold-500 text-charcoal-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Editor Invoice</span>
              </button>
            )}
          </div>
        </div>

        {/* Editor Selection Dropdown & Quick Filter (for Admin) */}
        {userRole === 'admin' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-luxury-green-800/20">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-gray-400">Select Editor:</span>
              <select
                value={selectedEditorId}
                onChange={(e) => setSelectedEditorId(e.target.value)}
                className="bg-charcoal-900 border border-gold-500/40 text-white rounded-xl px-3 py-1.5 text-xs font-medium outline-none focus:ring-1 focus:ring-gold-400 cursor-pointer"
              >
                <option value="all">🌐 All Editors ({editors.length} Partners)</option>
                {editors.map(ed => (
                  <option key={ed.id} value={ed.id}>
                    {ed.name} • {ed.phone || ed.email} (★ {ed.rating.toFixed(1)})
                  </option>
                ))}
              </select>
            </div>

            {targetEditor && (
              <div className="flex items-center space-x-3 text-xs text-gray-400 font-mono">
                <span className="flex items-center space-x-1 text-gold-400">
                  <User className="w-3.5 h-3.5" />
                  <strong className="text-white">{targetEditor.name}</strong>
                </span>
                <span>•</span>
                <span>{targetEditor.email}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">★ {targetEditor.rating.toFixed(1)} Index</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Financial Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel bg-charcoal-950/60 border border-luxury-green-800/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Total Work Contracts</span>
            <span className="text-2xl font-bold text-white font-mono mt-1 block">
              ₹{financialStats.totalContracted.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">
              {financialStats.totalWorks} Assigned Wedding Works
            </span>
          </div>
          <div className="p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400">
            <Film className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel bg-charcoal-950/60 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Total Disbursed</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono mt-1 block">
              ₹{financialStats.totalPaid.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">
              Paid across ledger records
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel bg-charcoal-950/60 border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Net Payable Due</span>
            <span className="text-2xl font-bold text-amber-400 font-mono mt-1 block">
              ₹{Math.max(0, financialStats.balanceDue).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">
              {financialStats.activeCount} Pending Delivery / Audit
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel bg-charcoal-950/60 border border-sky-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider block">Delivered Cuts</span>
            <span className="text-2xl font-bold text-sky-300 font-mono mt-1 block">
              {financialStats.completedCount} / {financialStats.totalWorks}
            </span>
            <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">
              {financialStats.totalWorks > 0 ? Math.round((financialStats.completedCount / financialStats.totalWorks) * 100) : 0}% completion rate
            </span>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Works & Invoices List Section */}
      <div className="p-6 rounded-3xl glass-panel border border-luxury-green-800/20 space-y-4">
        {/* Search, Status Filter & Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search wedding couple, studio, project ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-gold-500/50"
            />
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-charcoal-900 p-1 rounded-xl border border-luxury-green-800/30 flex items-center text-xs font-mono">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-gold-500 text-charcoal-950 font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                All ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('delivered')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'delivered' ? 'bg-gold-500 text-charcoal-950 font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Delivered
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'in_progress' ? 'bg-gold-500 text-charcoal-950 font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Active
              </button>
            </div>
          </div>
        </div>

        {/* Works Table */}
        <div className="overflow-x-auto rounded-2xl border border-luxury-green-800/20 bg-charcoal-950/40">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-charcoal-900/80 text-gray-400 font-mono text-[10px] uppercase border-b border-luxury-green-800/20">
                <th className="p-3.5">#</th>
                <th className="p-3.5">Wedding / Project</th>
                <th className="p-3.5">Studio Partner</th>
                <th className="p-3.5">Assigned Editor</th>
                <th className="p-3.5">Event Type</th>
                <th className="p-3.5">Agreed Share</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Invoice Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-green-800/10">
              {relevantProjects.length > 0 ? (
                relevantProjects.map((proj, idx) => {
                  const assignedEd = editors.find(e => e.id === proj.assignedEditorId) || targetEditor;
                  const actualShare = proj.isSplitProject 
                    ? (proj.assignedEditorId === selectedEditorId ? proj.firstEditorShare : proj.secondEditorShare)
                    : proj.editorPayment;

                  return (
                    <tr key={proj.id} className="hover:bg-luxury-green-800/10 transition-colors group">
                      <td className="p-3.5 font-mono text-gray-500">{idx + 1}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-white group-hover:text-gold-400 transition-colors">
                          {proj.coupleName}
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 block">{proj.id}</span>
                      </td>
                      <td className="p-3.5 text-gray-300">
                        <span className="flex items-center space-x-1">
                          <Building2 className="w-3 h-3 text-gray-500" />
                          <span>{proj.studioName || 'Direct Client'}</span>
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-gray-200">
                          {proj.assignedEditorName || (assignedEd ? assignedEd.name : 'Unassigned')}
                        </span>
                        {proj.isSplitProject && (
                          <span className="block text-[9px] font-mono text-amber-400 font-bold">Split Edit Cut</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-gray-400">{proj.eventType || 'Wedding Film'}</td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400">
                        ₹{(actualShare || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${
                          proj.status === 'delivered' || proj.status === 'closed'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {proj.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            if (assignedEd) {
                              onOpenPdfModal(assignedEd, 'invoice', e, proj.id);
                            } else if (editors.length > 0) {
                              onOpenPdfModal(editors[0], 'invoice', e, proj.id);
                            }
                          }}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-luxury-green-800 to-luxury-green-700 hover:from-gold-600 hover:to-gold-500 text-white hover:text-charcoal-950 font-bold rounded-xl border border-gold-500/30 text-[10px] font-mono shadow-sm transition-all cursor-pointer active:scale-95"
                          title="Generate Single Work Invoice PDF for this project"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Generate Work Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 font-mono">
                    No wedding works found matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
