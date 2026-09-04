import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Filter, 
  HelpCircle,
  FileCheck,
  Check,
  X,
  IndianRupee,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, PaymentHistory } from '../../types';

export interface AuditReportItem {
  project: Project;
  contractAmount: number;
  storedAdvance: number;
  storedRemaining: number;
  totalLoggedPayments: number;
  expectedAdvance: number;
  expectedRemaining: number;
  paymentLogsCount: number;
  hasDiscrepancy: boolean;
  issues: string[];
}

export interface AuditReport {
  auditedProjects: AuditReportItem[];
  discrepancyCount: number;
  totalDiscrepancyAmount: number;
  totalProjectsCount: number;
  cleanProjectsCount: number;
}

interface LedgerAuditUtilityProps {
  auditReport: AuditReport;
  isReconciling: boolean;
  auditToast: string;
  auditError: string;
  onReconcileProject: (item: AuditReportItem) => Promise<void>;
  onReconcileAll: () => Promise<void>;
}

export default function LedgerAuditUtility({
  auditReport,
  isReconciling,
  auditToast,
  auditError,
  onReconcileProject,
  onReconcileAll
}: LedgerAuditUtilityProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'discrepancies' | 'clean'>('discrepancies');
  const [search, setSearch] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAuditGuide, setShowAuditGuide] = useState(false);

  const filteredItems = auditReport.auditedProjects.filter(item => {
    if (filterMode === 'discrepancies' && !item.hasDiscrepancy) return false;
    if (filterMode === 'clean' && item.hasDiscrepancy) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (item.project.coupleName || item.project.projectName || '').toLowerCase().includes(q);
      const matchStudio = (item.project.studioName || '').toLowerCase().includes(q);
      const matchIssues = item.issues.some(issue => issue.toLowerCase().includes(q));
      return matchName || matchStudio || matchIssues;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast and Error Notifications */}
      <AnimatePresence>
        {auditToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{auditToast}</span>
            </div>
          </motion.div>
        )}

        {auditError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{auditError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-charcoal-900 via-charcoal-900/95 to-luxury-green-950 p-6 rounded-3xl border border-luxury-green-800/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-gold-400" />
            <h2 className="text-xl font-bold text-white font-display">Automated Audit & Reconciliation Utility</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20">
              Live Database Verification
            </span>
          </div>
          <p className="text-xs text-gray-400 max-w-2xl">
            Cross-verifies project-level stored advances against actual itemized transaction ledger logs in Firestore to identify and fix balance drift.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setShowAuditGuide(!showAuditGuide)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono flex items-center space-x-1.5 border border-white/10 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-gold-400" />
            <span>Audit Guide</span>
          </button>

          {auditReport.discrepancyCount > 0 && (
            <button
              onClick={() => setShowBatchModal(true)}
              disabled={isReconciling}
              className="px-5 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
              <span>Auto-Reconcile All ({auditReport.discrepancyCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Audit Guide Explanation Box */}
      <AnimatePresence>
        {showAuditGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 rounded-3xl bg-charcoal-900/95 border border-gold-500/30 text-xs text-gray-300 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gold-400 font-mono text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4" /> How Audit & Reconciliation Works:
              </h4>
              <button onClick={() => setShowAuditGuide(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-400 text-[11px] leading-relaxed">
              <div className="p-3 bg-charcoal-950 rounded-2xl border border-white/5 space-y-1">
                <strong className="text-white block font-sans text-xs">1. Advance Mismatch Detection:</strong>
                Detects if a project has stored advance value (e.g. ₹20,000) that doesn't match the sum of logged studio payment history entries (e.g. ₹25,000).
              </div>
              <div className="p-3 bg-charcoal-950 rounded-2xl border border-white/5 space-y-1">
                <strong className="text-white block font-sans text-xs">2. Remaining Balance Sync:</strong>
                Calculates Contract Total minus Total Real Advance to ensure remaining balance reflects exact math.
              </div>
              <div className="p-3 bg-charcoal-950 rounded-2xl border border-white/5 space-y-1">
                <strong className="text-white block font-sans text-xs">3. Missing Logs Auto-Backfill:</strong>
                If a project had an initial advance recorded during creation without a payment history transaction, reconciliation creates a backfilled ledger entry.
              </div>
              <div className="p-3 bg-charcoal-950 rounded-2xl border border-white/5 space-y-1">
                <strong className="text-white block font-sans text-xs">4. 100% Non-Destructive:</strong>
                Reconciliation updates project metadata and syncs balances with your real transaction receipts without deleting data.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audit KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Audited */}
        <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-white/10 shadow">
          <span className="text-[10px] font-mono uppercase text-gray-400 font-semibold block">Total Projects Audited</span>
          <span className="text-2xl font-bold font-sans text-white mt-1 block">{auditReport.totalProjectsCount}</span>
          <span className="text-[10px] font-mono text-gray-500">100% database coverage</span>
        </div>

        {/* Discrepancies Found */}
        <div className={`p-4 rounded-2xl border shadow ${
          auditReport.discrepancyCount > 0 
            ? 'bg-amber-500/10 border-amber-500/30' 
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <span className={`text-[10px] font-mono uppercase font-semibold block ${
            auditReport.discrepancyCount > 0 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            Discrepancies Detected
          </span>
          <span className={`text-2xl font-bold font-sans mt-1 block ${
            auditReport.discrepancyCount > 0 ? 'text-amber-300' : 'text-emerald-300'
          }`}>
            {auditReport.discrepancyCount}
          </span>
          <span className="text-[10px] font-mono text-gray-400">
            {auditReport.discrepancyCount > 0 ? 'Action needed to sync balances' : 'All project balances verified clean'}
          </span>
        </div>

        {/* Clean Projects */}
        <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-emerald-500/20 shadow">
          <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold block">Verified In-Sync</span>
          <span className="text-2xl font-bold font-sans text-emerald-300 mt-1 block">{auditReport.cleanProjectsCount}</span>
          <span className="text-[10px] font-mono text-gray-400">Exact ledger & project match</span>
        </div>

        {/* Total Variance Value */}
        <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-gold-500/20 shadow">
          <span className="text-[10px] font-mono uppercase text-gold-400 font-semibold block">Audit Status</span>
          <span className="text-sm font-bold font-sans text-white mt-2 block flex items-center gap-1.5">
            {auditReport.discrepancyCount === 0 ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Ledger 100% Balanced</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400">{auditReport.discrepancyCount} Drift Alert(s)</span>
              </>
            )}
          </span>
          <span className="text-[10px] font-mono text-gray-500">Live background sync active</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-charcoal-900/80 rounded-2xl border border-white/5">
        <div className="flex items-center p-1 bg-charcoal-950 rounded-2xl border border-white/10">
          <button
            onClick={() => setFilterMode('discrepancies')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              filterMode === 'discrepancies'
                ? 'bg-amber-500 text-charcoal-950 shadow'
                : 'text-gray-400 hover:text-amber-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Discrepancies ({auditReport.discrepancyCount})</span>
          </button>
          <button
            onClick={() => setFilterMode('clean')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              filterMode === 'clean'
                ? 'bg-emerald-500 text-charcoal-950 shadow'
                : 'text-gray-400 hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Clean Projects ({auditReport.cleanProjectsCount})</span>
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              filterMode === 'all'
                ? 'bg-charcoal-800 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All ({auditReport.totalProjectsCount})</span>
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audited projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-charcoal-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Audited Projects List */}
      <div className="space-y-3">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const { project, contractAmount, storedAdvance, storedRemaining, totalLoggedPayments, expectedAdvance, expectedRemaining, paymentLogsCount, hasDiscrepancy, issues } = item;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-3xl border transition-all ${
                  hasDiscrepancy
                    ? 'bg-charcoal-900/95 border-amber-500/30 hover:border-amber-400/50 shadow-xl'
                    : 'bg-charcoal-900/60 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h4 className="text-base font-bold text-white font-sans">{project.coupleName || project.projectName}</h4>
                      <span className="text-xs font-mono text-gray-400">• {project.studioName || 'Studio Partner'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        hasDiscrepancy 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {hasDiscrepancy ? 'Discrepancy Detected' : 'Verified In-Sync'}
                      </span>
                    </div>

                    {/* Issue Bullet Points */}
                    {hasDiscrepancy && (
                      <div className="mt-2 space-y-1">
                        {issues.map((issue, idx) => (
                          <div key={idx} className="text-xs font-mono text-amber-300/90 flex items-start space-x-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{issue}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Financial Comparison Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="px-3 py-1.5 rounded-xl bg-charcoal-950 border border-white/10 text-xs font-mono">
                      <span className="text-[9px] uppercase text-gray-400 block">Contract</span>
                      <span className="font-bold text-white">₹{contractAmount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-charcoal-950 border border-white/10 text-xs font-mono">
                      <span className="text-[9px] uppercase text-gray-400 block">Stored Adv vs Logged</span>
                      <span className="font-bold text-gray-200">
                        ₹{storedAdvance.toLocaleString('en-IN')} / <span className="text-emerald-400">₹{totalLoggedPayments.toLocaleString('en-IN')}</span>
                      </span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-charcoal-950 border border-white/10 text-xs font-mono">
                      <span className="text-[9px] uppercase text-gray-400 block">Stored Rem vs Expected</span>
                      <span className="font-bold text-gray-200">
                        ₹{storedRemaining.toLocaleString('en-IN')} / <span className="text-amber-300">₹{expectedRemaining.toLocaleString('en-IN')}</span>
                      </span>
                    </div>

                    {/* Reconcile Action Button */}
                    {hasDiscrepancy && (
                      <button
                        onClick={() => onReconcileProject(item)}
                        disabled={isReconciling}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md cursor-pointer transition-all disabled:opacity-50 ml-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
                        <span>Reconcile Project</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-charcoal-950/40 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center p-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
            <h4 className="text-base font-bold text-white">All Clear! No Discrepancies Found</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-md">
              Every project advance and remaining balance in your database is in 100% mathematical synchronization with the itemized payment ledger.
            </p>
          </div>
        )}
      </div>

      {/* Batch Reconciliation Confirmation Modal */}
      <AnimatePresence>
        {showBatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-charcoal-900 border border-gold-500/30 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Confirm Batch Reconciliation</h3>
                  <p className="text-xs text-gray-400">Sync all {auditReport.discrepancyCount} detected balance drift(s)</p>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                This will automatically update the stored advance payment and recalculate the remaining balance for all <strong>{auditReport.discrepancyCount}</strong> projects to match their verified transaction history.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 bg-charcoal-800 text-gray-300 text-xs font-medium rounded-xl hover:bg-charcoal-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowBatchModal(false);
                    await onReconcileAll();
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-charcoal-950 font-bold text-xs rounded-xl hover:from-gold-500 hover:to-gold-400 transition-all cursor-pointer shadow-lg"
                >
                  Run Batch Sync
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
