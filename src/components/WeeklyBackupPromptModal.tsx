import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, ShieldCheck, Clock, X, Database, Check, Film, Wallet } from 'lucide-react';

interface WeeklyBackupPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onSnooze: (days?: number) => void;
  lastBackupDate: Date | null;
  downloadSuccess: boolean;
  totalRecords: {
    projects: number;
    runningProjects: number;
    totalDueBalance: number;
    studios: number;
    editors: number;
    expenses: number;
    payments: number;
  };
}

export default function WeeklyBackupPromptModal({
  isOpen,
  onClose,
  onDownload,
  onSnooze,
  lastBackupDate,
  downloadSuccess,
  totalRecords
}: WeeklyBackupPromptModalProps) {
  if (!isOpen) return null;

  const grandTotal = 
    totalRecords.projects + 
    totalRecords.studios + 
    totalRecords.editors + 
    totalRecords.expenses + 
    totalRecords.payments;

  const formatDate = (d: Date | null) => {
    if (!d) return 'Never Backed Up';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg p-6 rounded-3xl bg-charcoal-900 border border-gold-500/40 shadow-2xl space-y-5 gold-glow overflow-hidden"
        >
          {/* Subtle Ambient Light Glow */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-start space-x-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-gold-500/20 to-amber-500/10 border border-gold-500/30 text-gold-400 shrink-0 shadow-inner">
              <ShieldCheck className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold font-display text-white">Weekly Data Protection Backup</h3>
                <span className="px-2 py-0.5 text-[9px] font-mono uppercase font-bold tracking-wider rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Prompt Due
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Weekly JSON backup to preserve local copies of your active wedding studio projects and due balances.
              </p>
            </div>
          </div>

          {/* Key ERP Highlight Cards: Running Projects & Total Due Balance */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-charcoal-950 border border-amber-500/25">
              <div className="flex items-center justify-between text-amber-400 text-xs font-mono mb-1">
                <span className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider">
                  <Film className="w-3.5 h-3.5" />
                  Running Projects
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              </div>
              <p className="text-xl font-black font-sans text-white">
                {totalRecords.runningProjects} <span className="text-xs font-normal text-amber-300/70">Active</span>
              </p>
              <p className="text-[9px] font-mono text-gray-400 mt-0.5">
                Out of {totalRecords.projects} total registered
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-gold-500/10 to-charcoal-950 border border-gold-500/25">
              <div className="flex items-center justify-between text-gold-400 text-xs font-mono mb-1">
                <span className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider">
                  <Wallet className="w-3.5 h-3.5" />
                  Total Due Balance
                </span>
              </div>
              <p className="text-xl font-black font-sans text-gold-300">
                ₹{totalRecords.totalDueBalance.toLocaleString('en-IN')}
              </p>
              <p className="text-[9px] font-mono text-gray-400 mt-0.5">
                Outstanding client dues
              </p>
            </div>
          </div>

          {/* Download Success Banner */}
          {downloadSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center space-x-3 animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold font-mono">Backup Complete!</p>
                <p className="text-[11px] text-emerald-400/80">JSON file downloaded to your local device. Next prompt in 7 days.</p>
              </div>
            </div>
          ) : (
            /* Records Summary Breakdown */
            <div className="p-3.5 rounded-2xl bg-charcoal-950/80 border border-white/5 space-y-2.5">
              <div className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-2">
                <span className="text-gray-400 flex items-center gap-1.5 text-[11px]">
                  <Database className="w-3.5 h-3.5 text-gold-400" />
                  Total Active ERP Data Collections
                </span>
                <span className="font-bold text-gold-300 text-xs">{grandTotal} Records</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-gray-400 uppercase block text-[9px]">Total Projects</span>
                  <span className="text-xs font-bold text-white">{totalRecords.projects}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-gray-400 uppercase block text-[9px]">Studios</span>
                  <span className="text-xs font-bold text-white">{totalRecords.studios}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-gray-400 uppercase block text-[9px]">Editors</span>
                  <span className="text-xs font-bold text-white">{totalRecords.editors}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-gray-400 uppercase block text-[9px]">Payments</span>
                  <span className="text-xs font-bold text-white">{totalRecords.payments}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 col-span-2 sm:col-span-2">
                  <span className="text-gray-400 uppercase block text-[9px]">Operating Expenses</span>
                  <span className="text-xs font-bold text-white">{totalRecords.expenses}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono text-gray-400 pt-1">
                <span className="flex items-center gap-1 text-[10px]">
                  <Clock className="w-3 h-3 text-amber-400" /> Last Local Download:
                </span>
                <span className="font-bold text-gray-200 text-[10px]">{formatDate(lastBackupDate)}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => onSnooze(1)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 hover:text-white border border-white/10 font-bold text-xs transition-all cursor-pointer"
            >
              Remind Me Tomorrow
            </button>

            <button
              type="button"
              onClick={onDownload}
              disabled={downloadSuccess}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-charcoal-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-charcoal-950" />
              <span>{downloadSuccess ? 'Downloaded!' : 'Download JSON Backup Now'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
