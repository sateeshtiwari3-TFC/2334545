import React, { useState, useMemo } from 'react';
import { 
  HardDrive, 
  Database, 
  MapPin, 
  Cloud, 
  CheckCircle2, 
  Clock, 
  Layers, 
  BarChart3, 
  ShieldCheck, 
  Plus, 
  Download, 
  Sparkles, 
  FolderLock,
  ArrowRight,
  AlertTriangle,
  FolderOpen,
  RefreshCw,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Studio, Editor, Expense, PaymentHistory } from '../types';
import StorageDirectoryGrid from './datamanager/StorageDirectoryGrid';
import HardDiskInventory from './datamanager/HardDiskInventory';
import StorageAnalytics from './datamanager/StorageAnalytics';
import SystemBackupHub from './datamanager/SystemBackupHub';
import StorageEditModal from './datamanager/StorageEditModal';
import BulkAssignDriveModal from './datamanager/BulkAssignDriveModal';

interface DataManagerViewProps {
  projects: Project[];
  allProjects?: Project[];
  studios?: Studio[];
  editors?: Editor[];
  expenses?: Expense[];
  payments?: PaymentHistory[];
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  onDeleteProject?: (id: string) => Promise<void>;
  onTriggerWeeklyBackup?: () => void;
  lastWeeklyBackupDate?: Date | null;
  isWeeklyBackupDue?: boolean;
  userRole?: string;
}

export default function DataManagerView({
  projects,
  allProjects,
  studios = [],
  editors = [],
  expenses = [],
  payments = [],
  onUpdateProject,
  onDeleteProject,
  onTriggerWeeklyBackup,
  lastWeeklyBackupDate,
  isWeeklyBackupDue
}: DataManagerViewProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'vault' | 'drives' | 'analytics' | 'backup'>('vault');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);

  // Selection state for bulk operations
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // CSV Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Helper to parse size to GB
  const parseSizeInGb = (sizeStr?: string): number => {
    if (!sizeStr) return 0;
    const num = parseFloat(sizeStr);
    if (isNaN(num)) return 0;
    if (sizeStr.toLowerCase().includes('tb')) return num * 1024;
    return num;
  };

  // Master KPI computations
  const totalProjectsCount = projects.length;
  const totalSizeGb = projects.reduce((sum, p) => sum + parseSizeInGb(p.dataSize), 0);
  const totalSizeTb = (totalSizeGb / 1024).toFixed(2);

  const backedUpCount = projects.filter(p => p.backupStatus === 'backed_up').length;
  const pendingCount = totalProjectsCount - backedUpCount;
  const backupPercent = totalProjectsCount > 0 ? Math.round((backedUpCount / totalProjectsCount) * 100) : 0;

  const existingDrives = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (p.hardDiskName && p.hardDiskName.trim()) {
        set.add(p.hardDiskName.trim());
      }
    });
    return Array.from(set).sort();
  }, [projects]);

  const existingLocations = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (p.location && p.location.trim()) {
        set.add(p.location.trim());
      }
    });
    return Array.from(set).sort();
  }, [projects]);

  // Handle single selection toggle
  const handleToggleSelect = (id: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Select all filtered (or visible)
  const handleSelectAllFiltered = () => {
    if (selectedProjectIds.length === projects.length) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(projects.map(p => p.id));
    }
  };

  const handleSelectAllProjects = () => {
    if (selectedProjectIds.length === projects.length) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(projects.map(p => p.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedProjectIds([]);
  };

  // Modal Openers
  const handleOpenAddModal = () => {
    setEditingProject(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (proj: Project) => {
    setEditingProject(proj);
    setIsEditModalOpen(true);
  };

  // Single project backup toggle
  const handleToggleBackup = async (project: Project) => {
    const newStatus = project.backupStatus === 'backed_up' ? 'pending' : 'backed_up';
    try {
      await onUpdateProject(project.id, { backupStatus: newStatus });
      showToast(`${project.coupleName} marked as ${newStatus === 'backed_up' ? 'Backed Up' : 'Backup Pending'}`);
    } catch (err) {
      console.error('Failed to toggle backup status:', err);
      alert('Failed to update backup status.');
    }
  };

  // Bulk backup update
  const handleBulkUpdateBackupStatus = async (status: 'backed_up' | 'pending') => {
    if (selectedProjectIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      for (const id of selectedProjectIds) {
        await onUpdateProject(id, { backupStatus: status });
      }
      showToast(`${selectedProjectIds.length} projects updated to ${status === 'backed_up' ? 'Backed Up' : 'Backup Pending'}`);
      setSelectedProjectIds([]);
    } catch (err) {
      console.error('Bulk update error:', err);
      alert('Failed to complete bulk backup update.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Bulk assign drive & location
  const handleBulkAssignDrive = async (updates: {
    hardDiskName?: string;
    location?: string;
    backupStatus?: 'pending' | 'backed_up';
  }) => {
    if (selectedProjectIds.length === 0) return;
    for (const id of selectedProjectIds) {
      await onUpdateProject(id, updates);
    }
    showToast(`Storage metadata applied to ${selectedProjectIds.length} projects`);
    setSelectedProjectIds([]);
  };

  // Export Comprehensive CSV
  const handleExportCsv = (scope: 'selected' | 'filtered' | 'all') => {
    setIsExporting(true);

    let targetProjects = projects;
    if (scope === 'selected' && selectedProjectIds.length > 0) {
      targetProjects = projects.filter(p => selectedProjectIds.includes(p.id));
    }

    try {
      const headers = [
        'Project ID',
        'Couple Name',
        'Studio Name',
        'Event Type',
        'Shoot Date',
        'Delivery Date',
        'Hard Disk Code',
        'Footage Size',
        'Storage Location',
        'Backup Status',
        'Google Drive Link',
        'Raw Footage Path',
        'Delivery Master Path',
        'Final Export Path',
        'Project Amount (INR)',
        'Editor Share (INR)',
        'Status'
      ];

      const rows = targetProjects.map(p => [
        `"${p.id}"`,
        `"${p.coupleName}"`,
        `"${p.studioName || 'Direct Client'}"`,
        `"${p.eventType}"`,
        `"${p.shootDate || ''}"`,
        `"${p.deliveryDate || ''}"`,
        `"${p.hardDiskName || 'Unassigned'}"`,
        `"${p.dataSize || 'Unmeasured'}"`,
        `"${p.location || 'Not Specified'}"`,
        `"${p.backupStatus === 'backed_up' ? 'BACKED UP' : 'PENDING'}"`,
        `"${p.googleDriveLink || ''}"`,
        `"${p.rawDataFolder || ''}"`,
        `"${p.deliveryFolder || ''}"`,
        `"${p.finalExportFolder || ''}"`,
        p.projectAmount || 0,
        p.editorPayment || 0,
        `"${p.status}"`
      ]);

      // Summary calculations
      const totalAmt = targetProjects.reduce((sum, p) => sum + (p.projectAmount || 0), 0);
      const totalEditorAmt = targetProjects.reduce((sum, p) => sum + (p.editorPayment || 0), 0);
      const totalGb = targetProjects.reduce((sum, p) => sum + parseSizeInGb(p.dataSize), 0);
      const totalTb = (totalGb / 1024).toFixed(2);

      const summaryRow = [
        `"TOTAL (${targetProjects.length} Projects)"`,
        '""',
        '""',
        '""',
        '""',
        '""',
        '""',
        `"${totalTb} TB Total"`,
        '""',
        `"${targetProjects.filter(p => p.backupStatus === 'backed_up').length} Backed Up"`,
        '""',
        '""',
        '""',
        '""',
        totalAmt,
        totalEditorAmt,
        '""'
      ];

      const csvContent = [
        '# FRAME CUT STUDIO OS - STORAGE & HARD DISK MASTER REGISTRY',
        `# Generated At: ${new Date().toLocaleString('en-IN')}`,
        `# Scope: ${targetProjects.length} Wedding Film Records`,
        '',
        headers.join(','),
        ...rows.map(r => r.join(',')),
        '',
        summaryRow.join(',')
      ].join('\r\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TFC_Storage_Registry_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      showToast('Storage registry CSV exported successfully!');
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Export CSV error:', err);
      alert('Failed to export CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));

  return (
    <div className="space-y-8 pb-16">
      
      {/* ===================== LUXURY TOP HERO & MASTER STATS HEADER ===================== */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-luxury-green-800/30 bg-gradient-to-r from-charcoal-950 via-charcoal-900 to-charcoal-950 p-6 md:p-8 shadow-2xl space-y-6">
        
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Title Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-luxury-green-800 to-luxury-green-900 border border-gold-500/40 rounded-2xl shadow-lg shadow-gold-500/10">
                <HardDrive className="w-7 h-7 text-gold-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-gold-400 uppercase tracking-widest font-bold block">
                  Studio Post-Production Storage OS
                </span>
                <h1 className="text-2xl md:text-3xl font-bold font-display text-white">
                  Data Manager & Storage Vault
                </h1>
              </div>
            </div>
            <p className="text-xs text-gray-300 max-w-2xl font-light">
              Live physical hard disk inventory, raw footage indexing, Google Drive cloud integration, and disaster recovery data protection.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* 1-Click Export CSV */}
            <button
              onClick={() => handleExportCsv('all')}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2.5 bg-charcoal-950 hover:bg-charcoal-800 border border-gold-500/30 hover:border-gold-500/60 text-gold-400 font-mono text-xs rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export Master CSV</span>
            </button>

            {/* Add Storage Log */}
            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs rounded-2xl shadow-xl shadow-gold-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Storage Log</span>
            </button>
          </div>
        </div>

        {/* Master High-Tech KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-luxury-green-800/20 relative z-10">
          
          {/* Storage Volume */}
          <div className="p-4 rounded-2xl bg-charcoal-950/70 border border-luxury-green-800/20 flex items-center space-x-3">
            <div className="p-2.5 bg-charcoal-900 border border-luxury-green-800/30 rounded-xl text-gold-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase block">Active Storage</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-white">{totalSizeTb}</span>
                <span className="text-xs font-mono text-gold-400">TB</span>
              </div>
            </div>
          </div>

          {/* Backup Redundancy Gauge */}
          <div className="p-4 rounded-2xl bg-charcoal-950/70 border border-luxury-green-800/20 flex items-center space-x-3">
            <div className="p-2.5 bg-charcoal-900 border border-luxury-green-800/30 rounded-xl text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase block">Backup Health</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-emerald-400">{backupPercent}%</span>
                <span className="text-[10px] font-mono text-gray-400">({backedUpCount}/{totalProjectsCount})</span>
              </div>
            </div>
          </div>

          {/* Physical Hard Disks */}
          <div className="p-4 rounded-2xl bg-charcoal-950/70 border border-luxury-green-800/20 flex items-center space-x-3">
            <div className="p-2.5 bg-charcoal-900 border border-luxury-green-800/30 rounded-xl text-blue-400 shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase block">Hardware HDDs</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-white">{existingDrives.length}</span>
                <span className="text-xs font-mono text-gray-400">Units</span>
              </div>
            </div>
          </div>

          {/* Cloud Workspace Connections */}
          <div className="p-4 rounded-2xl bg-charcoal-950/70 border border-luxury-green-800/20 flex items-center space-x-3">
            <div className="p-2.5 bg-charcoal-900 border border-luxury-green-800/30 rounded-xl text-purple-400 shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase block">Cloud Workspaces</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-purple-400">
                  {projects.filter(p => !!p.googleDriveLink && p.googleDriveLink.trim()).length}
                </span>
                <span className="text-xs font-mono text-gray-400">Linked</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ===================== SUB-TAB NAVIGATION PILLS ===================== */}
      <div className="flex items-center gap-2 border-b border-luxury-green-800/20 pb-4 overflow-x-auto custom-scrollbar">
        
        {/* Tab 1: Storage & HDD Vault */}
        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
            activeTab === 'vault'
              ? 'bg-gradient-to-r from-luxury-green-800 to-luxury-green-700 border-gold-500/50 text-gold-300 shadow-lg shadow-gold-500/10'
              : 'bg-charcoal-900/60 border-white/5 text-gray-400 hover:text-white hover:bg-charcoal-800/80'
          }`}
        >
          <FolderLock className="w-4 h-4 text-gold-400" />
          <span>Storage & HDD Directory</span>
          <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px]">{projects.length}</span>
        </button>

        {/* Tab 2: Physical Hard Disk Inventory */}
        <button
          onClick={() => setActiveTab('drives')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
            activeTab === 'drives'
              ? 'bg-gradient-to-r from-luxury-green-800 to-luxury-green-700 border-gold-500/50 text-gold-300 shadow-lg shadow-gold-500/10'
              : 'bg-charcoal-900/60 border-white/5 text-gray-400 hover:text-white hover:bg-charcoal-800/80'
          }`}
        >
          <HardDrive className="w-4 h-4 text-gold-400" />
          <span>Physical HDD Inventory</span>
          <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px]">{existingDrives.length}</span>
        </button>

        {/* Tab 3: Storage Analytics */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-luxury-green-800 to-luxury-green-700 border-gold-500/50 text-gold-300 shadow-lg shadow-gold-500/10'
              : 'bg-charcoal-900/60 border-white/5 text-gray-400 hover:text-white hover:bg-charcoal-800/80'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-gold-400" />
          <span>Storage Analytics</span>
        </button>

        {/* Tab 4: System Backup & Disaster Recovery */}
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
            activeTab === 'backup'
              ? 'bg-gradient-to-r from-luxury-green-800 to-luxury-green-700 border-gold-500/50 text-gold-300 shadow-lg shadow-gold-500/10'
              : 'bg-charcoal-900/60 border-white/5 text-gray-400 hover:text-white hover:bg-charcoal-800/80'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-gold-400" />
          <span>System Backup & Recovery</span>
          {isWeeklyBackupDue && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

      </div>

      {/* ===================== TAB CONTENT PANELS ===================== */}
      <div>
        {activeTab === 'vault' && (
          <StorageDirectoryGrid
            projects={projects}
            selectedProjectIds={selectedProjectIds}
            onToggleSelect={handleToggleSelect}
            onSelectAllFiltered={handleSelectAllFiltered}
            onSelectAllProjects={handleSelectAllProjects}
            onClearSelection={handleClearSelection}
            onOpenAddModal={handleOpenAddModal}
            onOpenEditModal={handleOpenEditModal}
            onToggleBackup={handleToggleBackup}
            onBulkUpdateBackupStatus={handleBulkUpdateBackupStatus}
            onOpenBulkAssignModal={() => setIsBulkAssignModalOpen(true)}
            onExportCsv={handleExportCsv}
            isExporting={isExporting}
            exportSuccess={exportSuccess}
            isBulkUpdating={isBulkUpdating}
          />
        )}

        {activeTab === 'drives' && (
          <HardDiskInventory
            projects={projects}
            onOpenEditModal={handleOpenEditModal}
            onToggleBackup={handleToggleBackup}
            onOpenBulkAssignModal={() => setIsBulkAssignModalOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <StorageAnalytics projects={projects} />
        )}

        {activeTab === 'backup' && (
          <SystemBackupHub
            projects={projects}
            studios={studios}
            editors={editors}
            expenses={expenses}
            payments={payments}
            onTriggerSystemBackup={onTriggerWeeklyBackup}
            lastBackupDate={lastWeeklyBackupDate}
            isBackupDue={isWeeklyBackupDue}
            onOpenEditModal={handleOpenEditModal}
          />
        )}
      </div>

      {/* ===================== STORAGE EDIT MODAL ===================== */}
      <StorageEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
        projects={projects}
        existingDrives={existingDrives}
        existingLocations={existingLocations}
        onSave={async (projectId, updates) => {
          await onUpdateProject(projectId, updates);
          showToast('Storage specifications saved successfully!');
        }}
      />

      {/* ===================== BULK ASSIGN DRIVE MODAL ===================== */}
      <BulkAssignDriveModal
        isOpen={isBulkAssignModalOpen}
        onClose={() => setIsBulkAssignModalOpen(false)}
        selectedProjects={selectedProjects.length > 0 ? selectedProjects : projects}
        existingDrives={existingDrives}
        existingLocations={existingLocations}
        onAssign={handleBulkAssignDrive}
      />

      {/* ===================== TOAST NOTIFICATION ===================== */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-charcoal-900/95 border border-gold-500/40 text-gold-300 font-mono text-xs shadow-2xl flex items-center space-x-2 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
