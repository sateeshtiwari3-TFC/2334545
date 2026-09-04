import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  HardDrive, 
  Database, 
  FileJson, 
  Check, 
  Sparkles,
  ExternalLink,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Studio, Editor, Expense, PaymentHistory } from '../../types';

interface SystemBackupHubProps {
  projects: Project[];
  studios?: Studio[];
  editors?: Editor[];
  expenses?: Expense[];
  payments?: PaymentHistory[];
  onTriggerSystemBackup?: () => void;
  lastBackupDate?: Date | null;
  isBackupDue?: boolean;
  onOpenEditModal: (project: Project) => void;
}

export default function SystemBackupHub({
  projects,
  studios = [],
  editors = [],
  expenses = [],
  payments = [],
  onTriggerSystemBackup,
  lastBackupDate,
  isBackupDue,
  onOpenEditModal
}: SystemBackupHubProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [importedJsonPreview, setImportedJsonPreview] = useState<any | null>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);

  // Manual 1-Click Database JSON Backup Generator
  const handleDownloadFullDatabaseJson = () => {
    const dateStamp = new Date().toISOString().split('T')[0];
    const backupPayload = {
      meta: {
        app: "Frame Cut Studio OS",
        version: "2.5.0-Enterprise",
        backupGeneratedAt: new Date().toISOString(),
        totalEntities: projects.length + studios.length + editors.length + expenses.length + payments.length
      },
      counts: {
        projects: projects.length,
        studios: studios.length,
        editors: editors.length,
        expenses: expenses.length,
        payments: payments.length
      },
      data: {
        projects,
        studios,
        editors,
        expenses,
        payments
      }
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TFC_Full_System_Backup_${dateStamp}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    if (onTriggerSystemBackup) {
      onTriggerSystemBackup();
    }
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 4000);
  };

  // Handle JSON File selection for restore validation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        setImportedJsonPreview(parsed);
      } catch (err) {
        alert('Invalid JSON file format. Please upload a valid Frame Cut Studio ERP backup.');
      }
    };
    reader.readAsText(file);
  };

  // Storage Health Integrity Auditor
  const missingHdd = projects.filter(p => !p.hardDiskName || p.hardDiskName.trim() === '');
  const missingSize = projects.filter(p => !p.dataSize || p.dataSize.trim() === '');
  const missingLocation = projects.filter(p => !p.location || p.location.trim() === '');
  const missingDriveLink = projects.filter(p => !p.googleDriveLink || p.googleDriveLink.trim() === '');
  const missingRawPath = projects.filter(p => !p.rawDataFolder || p.rawDataFolder.trim() === '');

  // Calculate Health Score (0 - 100)
  const totalChecks = projects.length * 5;
  const passedChecks = (projects.length - missingHdd.length) +
                       (projects.length - missingSize.length) +
                       (projects.length - missingLocation.length) +
                       (projects.length - missingDriveLink.length) +
                       (projects.length - missingRawPath.length);
  const healthScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

  return (
    <div className="space-y-6">
      
      {/* 1. Main System Disaster Recovery Action Panel */}
      <div className="p-6 md:p-8 rounded-3xl glass-panel border border-gold-500/30 bg-gradient-to-r from-charcoal-900 via-charcoal-950 to-charcoal-900 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="p-4 bg-luxury-green-800/40 border border-gold-500/40 rounded-2xl text-gold-400 shrink-0 shadow-lg">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/40 font-bold">
                  Enterprise Disaster Recovery
                </span>
                {isBackupDue && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse font-bold">
                    Backup Recommended
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold font-display text-white mt-1">
                Full Database JSON Snapshot Engine
              </h3>
              <p className="text-xs text-gray-300 max-w-xl mt-1">
                Generate an encrypted-ready offline snapshot of your complete studio ERP database: Projects, Hard Disk logs, Studios directory, Editor ledgers, and Payment balances.
              </p>
            </div>
          </div>

          {/* Big Download Backup Button */}
          <button
            onClick={handleDownloadFullDatabaseJson}
            className="flex items-center space-x-2.5 px-6 py-3.5 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-charcoal-950 font-bold text-sm rounded-2xl shadow-xl shadow-gold-500/20 transition-all cursor-pointer shrink-0"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-5 h-5 text-charcoal-950 animate-bounce" />
                <span>Backup Generated & Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Export Full System JSON</span>
              </>
            )}
          </button>
        </div>

        {/* Live Snapshot Entities Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-luxury-green-800/20 text-center font-mono">
          <div className="p-3 bg-charcoal-950/80 rounded-2xl border border-luxury-green-800/20">
            <span className="text-[10px] text-gray-500 uppercase block">Projects</span>
            <span className="text-base font-bold text-white mt-0.5 block">{projects.length}</span>
          </div>
          <div className="p-3 bg-charcoal-950/80 rounded-2xl border border-luxury-green-800/20">
            <span className="text-[10px] text-gray-500 uppercase block">Studios</span>
            <span className="text-base font-bold text-gold-400 mt-0.5 block">{studios.length}</span>
          </div>
          <div className="p-3 bg-charcoal-950/80 rounded-2xl border border-luxury-green-800/20">
            <span className="text-[10px] text-gray-500 uppercase block">Editors</span>
            <span className="text-base font-bold text-emerald-400 mt-0.5 block">{editors.length}</span>
          </div>
          <div className="p-3 bg-charcoal-950/80 rounded-2xl border border-luxury-green-800/20">
            <span className="text-[10px] text-gray-500 uppercase block">Ledger Records</span>
            <span className="text-base font-bold text-blue-400 mt-0.5 block">{payments.length}</span>
          </div>
          <div className="p-3 bg-charcoal-950/80 rounded-2xl border border-luxury-green-800/20 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-gray-500 uppercase block">Last Backup</span>
            <span className="text-xs font-bold text-gray-300 mt-1 block">
              {lastBackupDate ? lastBackupDate.toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Storage Data Integrity & Health Auditor */}
      <div className="p-6 md:p-8 rounded-3xl glass-panel border border-luxury-green-800/25 bg-gradient-to-b from-charcoal-900/90 to-charcoal-950/90 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-luxury-green-800/20 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-charcoal-950 border border-luxury-green-800/30 rounded-2xl text-gold-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold font-display text-white">
                Storage Data Integrity & Health Auditor
              </h4>
              <p className="text-xs text-gray-400">
                Automated detection of incomplete hard drive records and missing file paths
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-gray-400">Health Index:</span>
            <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
              healthScore >= 90 
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                : healthScore >= 70 
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-red-500/15 border-red-500/40 text-red-400'
            }`}>
              {healthScore}% Optimal
            </span>
          </div>
        </div>

        {/* 5 Integrity Check Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Missing HDD */}
          <div className={`p-4 rounded-2xl border transition-all ${
            missingHdd.length === 0 
              ? 'bg-charcoal-950/60 border-emerald-500/20' 
              : 'bg-red-950/20 border-red-500/30'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-gray-400 uppercase text-[10px]">Hard Disk Code</span>
              {missingHdd.length === 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              )}
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {projects.length - missingHdd.length} / {projects.length}
            </div>
            <p className="text-[10px] text-gray-500 font-mono mt-1">
              {missingHdd.length === 0 ? 'All mapped to disk' : `${missingHdd.length} unassigned`}
            </p>
          </div>

          {/* Missing Footage Size */}
          <div className={`p-4 rounded-2xl border transition-all ${
            missingSize.length === 0 
              ? 'bg-charcoal-950/60 border-emerald-500/20' 
              : 'bg-amber-950/20 border-amber-500/30'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-gray-400 uppercase text-[10px]">Footage Size</span>
              {missingSize.length === 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {projects.length - missingSize.length} / {projects.length}
            </div>
            <p className="text-[10px] text-gray-500 font-mono mt-1">
              {missingSize.length === 0 ? 'All sizes logged' : `${missingSize.length} unmeasured`}
            </p>
          </div>

          {/* Missing Location */}
          <div className={`p-4 rounded-2xl border transition-all ${
            missingLocation.length === 0 
              ? 'bg-charcoal-950/60 border-emerald-500/20' 
              : 'bg-amber-950/20 border-amber-500/30'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-gray-400 uppercase text-[10px]">Physical Shelf</span>
              {missingLocation.length === 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {projects.length - missingLocation.length} / {projects.length}
            </div>
            <p className="text-[10px] text-gray-500 font-mono mt-1">
              {missingLocation.length === 0 ? 'All shelves mapped' : `${missingLocation.length} missing shelf`}
            </p>
          </div>

          {/* Missing Google Drive Link */}
          <div className={`p-4 rounded-2xl border transition-all ${
            missingDriveLink.length === 0 
              ? 'bg-charcoal-950/60 border-emerald-500/20' 
              : 'bg-blue-950/20 border-blue-500/30'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-gray-400 uppercase text-[10px]">Cloud Link</span>
              {missingDriveLink.length === 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-blue-400" />
              )}
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {projects.length - missingDriveLink.length} / {projects.length}
            </div>
            <p className="text-[10px] text-gray-500 font-mono mt-1">
              {missingDriveLink.length === 0 ? 'All cloud linked' : `${missingDriveLink.length} unlinked`}
            </p>
          </div>

          {/* Missing Raw Path */}
          <div className={`p-4 rounded-2xl border transition-all ${
            missingRawPath.length === 0 
              ? 'bg-charcoal-950/60 border-emerald-500/20' 
              : 'bg-amber-950/20 border-amber-500/30'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-gray-400 uppercase text-[10px]">RAW Directory</span>
              {missingRawPath.length === 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {projects.length - missingRawPath.length} / {projects.length}
            </div>
            <p className="text-[10px] text-gray-500 font-mono mt-1">
              {missingRawPath.length === 0 ? 'All paths indexed' : `${missingRawPath.length} missing path`}
            </p>
          </div>
        </div>

        {/* Direct Action List to Fix Next Project */}
        {missingHdd.length > 0 && (
          <div className="p-4 rounded-2xl bg-charcoal-950/80 border border-luxury-green-800/20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-4 h-4 text-gold-400 shrink-0" />
              <span className="text-xs text-gray-300 font-mono">
                Suggested Action: Configure storage for <strong className="text-white">{missingHdd[0].coupleName}</strong> ({missingHdd[0].id})
              </span>
            </div>
            <button
              onClick={() => onOpenEditModal(missingHdd[0])}
              className="px-3 py-1.5 bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 font-mono text-xs font-bold rounded-xl border border-gold-500/40 transition-colors cursor-pointer flex items-center space-x-1"
            >
              <span>Fix Record</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* 3. JSON Backup Import & Restore Inspector */}
      <div className="p-6 md:p-8 rounded-3xl glass-panel border border-luxury-green-800/25 bg-gradient-to-b from-charcoal-900/90 to-charcoal-950/90 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-luxury-green-800/20 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-charcoal-950 border border-luxury-green-800/30 rounded-2xl text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold font-display text-white">
                JSON Backup Schema & Snapshot Inspector
              </h4>
              <p className="text-xs text-gray-400">
                Inspect and verify offline backup files before performing disaster restorations
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label className="flex-1 w-full flex items-center justify-center p-6 border-2 border-dashed border-luxury-green-800/40 hover:border-gold-500/40 rounded-2xl cursor-pointer bg-charcoal-950/40 hover:bg-charcoal-950/80 transition-all">
            <div className="text-center space-y-1">
              <FileJson className="w-8 h-8 text-gold-400 mx-auto" />
              <div className="text-xs font-bold text-gray-200">
                {importFileName ? importFileName : 'Click or Drag JSON Backup to Inspect'}
              </div>
              <p className="text-[10px] font-mono text-gray-500">Supports .json TFC ERP Database Snapshots</p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* Snapshot Preview Card */}
        {importedJsonPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-charcoal-950 border border-gold-500/30 space-y-3 font-mono text-xs"
          >
            <div className="flex items-center justify-between text-gold-400 font-bold border-b border-luxury-green-800/20 pb-2">
              <span>Verified Backup Snapshot: {importFileName}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-gray-300">
              <div>Version: <span className="text-white">{importedJsonPreview.meta?.version || 'Legacy'}</span></div>
              <div>Created: <span className="text-white">{importedJsonPreview.meta?.backupGeneratedAt ? new Date(importedJsonPreview.meta.backupGeneratedAt).toLocaleDateString() : 'N/A'}</span></div>
              <div>Projects: <span className="text-emerald-400 font-bold">{importedJsonPreview.counts?.projects || importedJsonPreview.data?.projects?.length || 0}</span></div>
              <div>Total Records: <span className="text-gold-400 font-bold">{importedJsonPreview.meta?.totalEntities || 0}</span></div>
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
}
