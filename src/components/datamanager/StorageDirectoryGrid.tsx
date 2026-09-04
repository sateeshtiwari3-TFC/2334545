import React, { useState } from 'react';
import { 
  Search, 
  HardDrive, 
  MapPin, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  FolderOpen, 
  Cloud, 
  Edit2, 
  Plus, 
  CheckSquare, 
  Square, 
  MinusSquare, 
  X, 
  Download, 
  FileSpreadsheet, 
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Layers,
  RefreshCw,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../../types';

interface StorageDirectoryGridProps {
  projects: Project[];
  selectedProjectIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAllFiltered: () => void;
  onSelectAllProjects: () => void;
  onClearSelection: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (project: Project) => void;
  onToggleBackup: (project: Project) => Promise<void>;
  onBulkUpdateBackupStatus: (status: 'backed_up' | 'pending') => Promise<void>;
  onOpenBulkAssignModal: () => void;
  onExportCsv: (scope: 'selected' | 'filtered' | 'all') => void;
  isExporting: boolean;
  exportSuccess: boolean;
  isBulkUpdating: boolean;
}

export default function StorageDirectoryGrid({
  projects,
  selectedProjectIds,
  onToggleSelect,
  onSelectAllFiltered,
  onSelectAllProjects,
  onClearSelection,
  onOpenAddModal,
  onOpenEditModal,
  onToggleBackup,
  onBulkUpdateBackupStatus,
  onOpenBulkAssignModal,
  onExportCsv,
  isExporting,
  exportSuccess,
  isBulkUpdating
}: StorageDirectoryGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'backed_up' | 'pending' | 'missing_hdd' | 'cloud_synced'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'date_desc' | 'name_asc' | 'size_desc' | 'backup_status' | 'hdd_name'>('date_desc');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Copy helper with visual feedback
  const handleCopyPath = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Helper to parse size in GB for sorting
  const parseSizeInGb = (sizeStr?: string): number => {
    if (!sizeStr) return 0;
    const num = parseFloat(sizeStr);
    if (isNaN(num)) return 0;
    if (sizeStr.toLowerCase().includes('tb')) return num * 1024;
    return num;
  };

  // Filter & Search
  const filteredProjects = projects.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      (p.coupleName && p.coupleName.toLowerCase().includes(q)) ||
      (p.projectName && p.projectName.toLowerCase().includes(q)) ||
      (p.studioName && p.studioName.toLowerCase().includes(q)) ||
      (p.hardDiskName && p.hardDiskName.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q)) ||
      (p.rawDataFolder && p.rawDataFolder.toLowerCase().includes(q)) ||
      (p.deliveryFolder && p.deliveryFolder.toLowerCase().includes(q));

    let matchesFilter = true;
    if (activeFilter === 'backed_up') {
      matchesFilter = p.backupStatus === 'backed_up';
    } else if (activeFilter === 'pending') {
      matchesFilter = !p.backupStatus || p.backupStatus === 'pending';
    } else if (activeFilter === 'missing_hdd') {
      matchesFilter = !p.hardDiskName || p.hardDiskName.trim() === '';
    } else if (activeFilter === 'cloud_synced') {
      matchesFilter = !!p.googleDriveLink && p.googleDriveLink.trim() !== '';
    }

    return matchesSearch && matchesFilter;
  });

  // Sort
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'name_asc') {
      return (a.coupleName || '').localeCompare(b.coupleName || '');
    }
    if (sortBy === 'size_desc') {
      return parseSizeInGb(b.dataSize) - parseSizeInGb(a.dataSize);
    }
    if (sortBy === 'backup_status') {
      const aVal = a.backupStatus === 'backed_up' ? 1 : 0;
      const bVal = b.backupStatus === 'backed_up' ? 1 : 0;
      return aVal - bVal;
    }
    if (sortBy === 'hdd_name') {
      return (a.hardDiskName || 'ZZZ').localeCompare(b.hardDiskName || 'ZZZ');
    }
    // Default: date_desc
    return (b.shootDate || b.deliveryDate || '').localeCompare(a.shootDate || a.deliveryDate || '');
  });

  // Counts for pills
  const totalBackedUp = projects.filter(p => p.backupStatus === 'backed_up').length;
  const totalPending = projects.length - totalBackedUp;
  const totalMissingHdd = projects.filter(p => !p.hardDiskName || p.hardDiskName.trim() === '').length;
  const totalCloudSynced = projects.filter(p => !!p.googleDriveLink && p.googleDriveLink.trim() !== '').length;

  const isAllFilteredSelected = filteredProjects.length > 0 && 
    filteredProjects.every(p => selectedProjectIds.includes(p.id));
  const isSomeFilteredSelected = filteredProjects.some(p => selectedProjectIds.includes(p.id)) && !isAllFilteredSelected;

  return (
    <div className="space-y-6">
      {/* Top Search, Filter & Layout Controls */}
      <div className="p-6 rounded-3xl glass-panel space-y-4 relative border border-luxury-green-800/25 bg-gradient-to-b from-charcoal-900/90 to-charcoal-950/90 shadow-xl">
        
        {/* Row 1: Search, Sort & Action Buttons */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-gold-400" />
            <input
              type="text"
              placeholder="Search by Couple Name, Studio, Hard Disk, Storage Rack, Project ID, Path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-charcoal-950 border border-luxury-green-800/30 rounded-2xl text-sm focus:outline-none focus:border-gold-500/50 text-gray-200 placeholder-gray-500 transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controls: Sort, View Switch, Export & Add Button */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            
            {/* Sort Selector */}
            <div className="flex items-center space-x-1.5 bg-charcoal-950 border border-luxury-green-800/30 px-3 py-2 rounded-2xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-gold-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-gray-300 focus:outline-none font-mono cursor-pointer"
              >
                <option value="date_desc" className="bg-charcoal-950">Sort: Shoot Date</option>
                <option value="name_asc" className="bg-charcoal-950">Sort: Couple Name</option>
                <option value="size_desc" className="bg-charcoal-950">Sort: Footage Size</option>
                <option value="backup_status" className="bg-charcoal-950">Sort: Backup Status</option>
                <option value="hdd_name" className="bg-charcoal-950">Sort: Hard Disk</option>
              </select>
            </div>

            {/* View Mode Toggle (Grid vs Table) */}
            <div className="flex items-center bg-charcoal-950 border border-luxury-green-800/30 p-1 rounded-2xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-luxury-green-800 to-luxury-green-700 text-gold-300 shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-gradient-to-r from-luxury-green-800 to-luxury-green-700 text-gold-300 shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Matrix Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={() => onExportCsv(selectedProjectIds.length > 0 ? 'selected' : 'filtered')}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-charcoal-950 hover:bg-charcoal-800 border border-gold-500/30 hover:border-gold-500/60 text-gold-400 font-medium text-xs rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              title="Export complete storage and financial CSV report"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                  <span className="text-emerald-400 font-bold">CSV Exported!</span>
                </>
              ) : isExporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-gold-400" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-gold-400" />
                  <span className="hidden sm:inline">
                    {selectedProjectIds.length > 0 
                      ? `Export Selected (${selectedProjectIds.length})` 
                      : `Export CSV (${filteredProjects.length})`
                    }
                  </span>
                  <span className="sm:hidden">CSV</span>
                </>
              )}
            </button>

            {/* Add Storage Log Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs rounded-2xl shadow-lg shadow-gold-500/15 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Storage Log</span>
            </button>
          </div>
        </div>

        {/* Row 2: Smart Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 border ${
              activeFilter === 'all'
                ? 'bg-gold-500/20 border-gold-500 text-gold-300 shadow-sm'
                : 'bg-charcoal-950/80 border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <span>All Projects</span>
            <span className="px-1.5 py-0.2 bg-black/40 rounded-full text-[10px]">{projects.length}</span>
          </button>

          <button
            onClick={() => setActiveFilter('backed_up')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 border ${
              activeFilter === 'backed_up'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                : 'bg-charcoal-950/80 border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Backed Up</span>
            <span className="px-1.5 py-0.2 bg-black/40 rounded-full text-[10px] text-emerald-400">{totalBackedUp}</span>
          </button>

          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 border ${
              activeFilter === 'pending'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                : 'bg-charcoal-950/80 border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Backup Pending</span>
            <span className="px-1.5 py-0.2 bg-black/40 rounded-full text-[10px] text-amber-400">{totalPending}</span>
          </button>

          <button
            onClick={() => setActiveFilter('missing_hdd')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 border ${
              activeFilter === 'missing_hdd'
                ? 'bg-red-500/20 border-red-500 text-red-300 shadow-sm'
                : 'bg-charcoal-950/80 border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Unlogged / Missing HDD</span>
            <span className="px-1.5 py-0.2 bg-black/40 rounded-full text-[10px] text-red-400">{totalMissingHdd}</span>
          </button>

          <button
            onClick={() => setActiveFilter('cloud_synced')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 border ${
              activeFilter === 'cloud_synced'
                ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-sm'
                : 'bg-charcoal-950/80 border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Google Drive Connected</span>
            <span className="px-1.5 py-0.2 bg-black/40 rounded-full text-[10px] text-blue-400">{totalCloudSynced}</span>
          </button>
        </div>

        {/* Row 3: Selection and Bulk Operations Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-luxury-green-800/20 text-xs">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {/* Master Select / Deselect Filtered Checkbox */}
            <button
              onClick={onSelectAllFiltered}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-charcoal-950 border border-white/10 hover:border-gold-500/30 text-gray-300 hover:text-white transition-colors cursor-pointer text-xs"
            >
              {isAllFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-gold-400" />
              ) : isSomeFilteredSelected ? (
                <MinusSquare className="w-4 h-4 text-gold-400" />
              ) : (
                <Square className="w-4 h-4 text-gray-500" />
              )}
              <span className="font-mono text-[11px]">
                {isAllFilteredSelected ? 'Deselect Filtered' : 'Select All Filtered'}
              </span>
            </button>

            {/* Select All Total */}
            <button
              onClick={onSelectAllProjects}
              className="px-2.5 py-1.5 rounded-xl bg-charcoal-950 border border-white/5 hover:border-white/15 text-gray-400 hover:text-gray-200 transition-colors text-[11px] font-mono cursor-pointer"
            >
              {selectedProjectIds.length === projects.length ? 'Clear All' : `Select All (${projects.length})`}
            </button>

            {/* Selection Counter Badge */}
            {selectedProjectIds.length > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-gold-500/20 text-gold-300 border border-gold-500/40 font-mono text-[11px] font-bold flex items-center space-x-1.5">
                <span>{selectedProjectIds.length} project{selectedProjectIds.length > 1 ? 's' : ''} selected</span>
              </span>
            )}
          </div>

          {/* Bulk Operations Toolbar */}
          {selectedProjectIds.length > 0 ? (
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Bulk Actions:</span>

              {/* Bulk Assign Drive & Location Modal Trigger */}
              <button
                onClick={onOpenBulkAssignModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-luxury-green-800/80 hover:bg-luxury-green-700 border border-gold-500/40 text-gold-300 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
                title="Assign Hard Disk, Storage Rack & Backup for all selected"
              >
                <Layers className="w-3.5 h-3.5 text-gold-400" />
                <span>Bulk Assign HDD / Rack</span>
              </button>

              {/* Bulk Mark as Backed Up */}
              <button
                onClick={() => onBulkUpdateBackupStatus('backed_up')}
                disabled={isBulkUpdating}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold transition-all cursor-pointer disabled:opacity-50"
                title="Mark all selected projects as Backed Up"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Backed Up</span>
              </button>

              {/* Bulk Mark as Pending */}
              <button
                onClick={() => onBulkUpdateBackupStatus('pending')}
                disabled={isBulkUpdating}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 text-xs font-mono font-bold transition-all cursor-pointer disabled:opacity-50"
                title="Mark all selected projects as Backup Pending"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Mark Pending</span>
              </button>

              {/* Clear Selection */}
              <button
                onClick={onClearSelection}
                className="p-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Clear selected projects"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-400 font-mono text-[11px]">
              <span>Showing {sortedProjects.length} of {projects.length} directories</span>
            </div>
          )}
        </div>
      </div>

      {/* ===================== VIEW MODE: GRID CARDS ===================== */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedProjects.map((p) => {
            const isSelected = selectedProjectIds.includes(p.id);

            return (
              <motion.div
                key={p.id}
                layout
                className={`p-6 rounded-3xl transition-all space-y-4 relative border ${
                  isSelected 
                    ? 'glass-panel bg-gold-500/[0.04] border-gold-500/60 shadow-[0_0_30px_rgba(212,175,55,0.18)] ring-1 ring-gold-500/40' 
                    : 'glass-panel bg-gradient-to-br from-charcoal-900/90 via-charcoal-950/80 to-charcoal-950 border-luxury-green-800/20 hover:border-gold-500/40 shadow-lg'
                }`}
              >
                {/* Top Card Bar: Checkbox, Project Info & Actions */}
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(p.id);
                      }}
                      className="mt-0.5 p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gold-400 transition-colors cursor-pointer"
                      title={isSelected ? 'Deselect project' : 'Select project for batch operations'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-gold-400" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-500 hover:text-gray-300" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-gold-400 font-bold tracking-wider">{p.id}</span>
                        <span className="text-[10px] font-mono text-gray-400">• {p.studioName || 'Direct Client'}</span>
                      </div>
                      <h4 className="text-base font-bold text-white font-display mt-0.5">{p.coupleName}</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {p.eventType} {p.shootDate ? `• Date: ${p.shootDate}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Backup Status Toggle */}
                  <div className="flex items-center space-x-2">
                    {/* Edit Storage Specs */}
                    <button
                      onClick={() => onOpenEditModal(p)}
                      className="p-2 rounded-xl bg-charcoal-800/80 border border-white/5 hover:border-gold-500/30 hover:bg-charcoal-700 text-gray-400 hover:text-gold-400 transition-colors cursor-pointer"
                      title="Edit Storage & Hard Disk Specs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Interactive Backup Status Pill */}
                    <button
                      onClick={() => onToggleBackup(p)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold border flex items-center space-x-1.5 transition-all cursor-pointer ${
                        p.backupStatus === 'backed_up' 
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 shadow-sm' 
                          : 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25 shadow-sm'
                      }`}
                      title="Click to toggle backup status"
                    >
                      {p.backupStatus === 'backed_up' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Backed Up</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                          <span>Backup Pending</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Storage Specifications Meter: HDD, Footage Size, Physical Location */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-charcoal-950/60 rounded-2xl border border-luxury-green-800/15 text-xs font-mono">
                  {/* Hard Disk Code */}
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase tracking-wider flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-gold-400" /> HARD DISK
                    </span>
                    <span className={`font-sans font-bold mt-1 block truncate text-xs ${
                      p.hardDiskName ? 'text-white' : 'text-red-400 italic'
                    }`} title={p.hardDiskName || 'Unlogged HDD'}>
                      {p.hardDiskName || '⚠️ Unlogged'}
                    </span>
                  </div>

                  {/* Data Size */}
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase tracking-wider">FOOTAGE SIZE</span>
                    <span className={`font-sans font-bold mt-1 block truncate text-xs ${
                      p.dataSize ? 'text-emerald-400' : 'text-gray-500 italic'
                    }`} title={p.dataSize || 'Unmeasured'}>
                      {p.dataSize || 'Unmeasured'}
                    </span>
                  </div>

                  {/* Physical Location */}
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gold-400" /> LOCATION
                    </span>
                    <span className="text-gray-300 font-sans font-medium mt-1 block truncate text-xs" title={p.location || 'Not Specified'}>
                      {p.location || 'Not Specified'}
                    </span>
                  </div>
                </div>

                {/* Directory Storage Paths Box with Copy Buttons */}
                <div className="space-y-2 text-xs">
                  {p.rawDataFolder && (
                    <div className="p-2.5 bg-charcoal-950/50 hover:bg-charcoal-950 rounded-xl border border-luxury-green-800/10 flex items-center justify-between group transition-colors">
                      <div className="flex items-center space-x-2 overflow-hidden pr-2">
                        <span className="text-[9px] font-mono text-gray-500 uppercase shrink-0 font-bold">RAW:</span>
                        <span className="font-mono text-gray-300 text-[11px] truncate" title={p.rawDataFolder}>
                          {p.rawDataFolder}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleCopyPath(p.rawDataFolder!, `raw-${p.id}`, e)}
                        className="p-1 rounded-lg bg-charcoal-800/80 hover:bg-charcoal-700 text-gray-400 hover:text-gold-300 transition-colors shrink-0 cursor-pointer"
                        title="Copy Raw Footage Path"
                      >
                        {copiedKey === `raw-${p.id}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {p.deliveryFolder && (
                    <div className="p-2.5 bg-charcoal-950/50 hover:bg-charcoal-950 rounded-xl border border-luxury-green-800/10 flex items-center justify-between group transition-colors">
                      <div className="flex items-center space-x-2 overflow-hidden pr-2">
                        <span className="text-[9px] font-mono text-gray-500 uppercase shrink-0 font-bold">DELIVERY:</span>
                        <span className="font-mono text-gray-300 text-[11px] truncate" title={p.deliveryFolder}>
                          {p.deliveryFolder}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleCopyPath(p.deliveryFolder!, `del-${p.id}`, e)}
                        className="p-1 rounded-lg bg-charcoal-800/80 hover:bg-charcoal-700 text-gray-400 hover:text-gold-300 transition-colors shrink-0 cursor-pointer"
                        title="Copy Delivery Master Path"
                      >
                        {copiedKey === `del-${p.id}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {p.finalExportFolder && (
                    <div className="p-2.5 bg-charcoal-950/50 hover:bg-charcoal-950 rounded-xl border border-luxury-green-800/10 flex items-center justify-between group transition-colors">
                      <div className="flex items-center space-x-2 overflow-hidden pr-2">
                        <span className="text-[9px] font-mono text-gray-500 uppercase shrink-0 font-bold">EXPORTS:</span>
                        <span className="font-mono text-gray-300 text-[11px] truncate" title={p.finalExportFolder}>
                          {p.finalExportFolder}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleCopyPath(p.finalExportFolder!, `exp-${p.id}`, e)}
                        className="p-1 rounded-lg bg-charcoal-800/80 hover:bg-charcoal-700 text-gray-400 hover:text-gold-300 transition-colors shrink-0 cursor-pointer"
                        title="Copy Final Export Path"
                      >
                        {copiedKey === `exp-${p.id}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Google Drive Workspace Banner */}
                {p.googleDriveLink ? (
                  <div className="flex items-center justify-between p-3 bg-charcoal-950 hover:bg-charcoal-900 rounded-2xl text-xs text-gold-400 border border-luxury-green-800/30 transition-all">
                    <div className="flex items-center space-x-2 truncate">
                      <Cloud className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="truncate font-mono text-[11px]">Google Drive Cloud Workspace</span>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={(e) => handleCopyPath(p.googleDriveLink!, `gdrive-${p.id}`, e)}
                        className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Copy Google Drive URL"
                      >
                        {copiedKey === `gdrive-${p.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={p.googleDriveLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 hover:text-white transition-colors cursor-pointer"
                        title="Open in Google Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 bg-charcoal-950/40 rounded-xl text-xs text-gray-500 border border-white/5 font-mono text-[10px]">
                    <span>Cloud Workspace: Not Linked</span>
                    <button
                      onClick={() => onOpenEditModal(p)}
                      className="text-gold-400 hover:underline cursor-pointer"
                    >
                      + Add Drive Link
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}

          {sortedProjects.length === 0 && (
            <div className="col-span-2 text-center py-20 bg-charcoal-950/40 rounded-3xl border border-white/5 space-y-3">
              <HardDrive className="w-12 h-12 text-gray-600 mx-auto animate-pulse" />
              <h4 className="text-sm font-bold text-gray-300">No Storage Directories Matched</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto font-mono">
                Try adjusting your search criteria or switch filter tabs to view other storage logs.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ===================== VIEW MODE: MATRIX TABLE ===================== */
        <div className="rounded-3xl glass-panel border border-luxury-green-800/25 overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-charcoal-950 border-b border-luxury-green-800/30 text-[10px] text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-10">
                    <button
                      onClick={onSelectAllFiltered}
                      className="p-1 rounded hover:bg-white/10 text-gray-400 cursor-pointer"
                    >
                      {isAllFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-gold-400" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Project ID & Title</th>
                  <th className="p-4">Studio / Event</th>
                  <th className="p-4">Hard Disk Log</th>
                  <th className="p-4">Data Size</th>
                  <th className="p-4">Storage Location</th>
                  <th className="p-4">Backup State</th>
                  <th className="p-4">Cloud Drive</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-green-800/10">
                {sortedProjects.map((p) => {
                  const isSelected = selectedProjectIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-luxury-green-800/10 transition-colors ${
                        isSelected ? 'bg-gold-500/[0.04]' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4">
                        <button
                          onClick={() => onToggleSelect(p.id)}
                          className="p-1 rounded hover:bg-white/10 text-gray-400 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-gold-400" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </td>

                      {/* Project ID & Couple */}
                      <td className="p-4">
                        <div className="font-bold text-white font-sans text-sm">{p.coupleName}</div>
                        <div className="text-[10px] text-gold-400 font-mono">{p.id}</div>
                      </td>

                      {/* Studio & Event */}
                      <td className="p-4">
                        <div className="text-gray-300">{p.studioName || 'Direct'}</div>
                        <div className="text-[10px] text-gray-500">{p.eventType}</div>
                      </td>

                      {/* Hard Disk */}
                      <td className="p-4">
                        {p.hardDiskName ? (
                          <span className="px-2 py-0.5 bg-charcoal-800 border border-luxury-green-800/30 text-white rounded-lg font-bold text-[11px]">
                            {p.hardDiskName}
                          </span>
                        ) : (
                          <span className="text-red-400 italic text-[11px]">⚠️ Missing HDD</span>
                        )}
                      </td>

                      {/* Size */}
                      <td className="p-4 text-emerald-400 font-bold">
                        {p.dataSize || <span className="text-gray-500 font-normal">--</span>}
                      </td>

                      {/* Location */}
                      <td className="p-4 text-gray-300">
                        {p.location || <span className="text-gray-600">Not Specified</span>}
                      </td>

                      {/* Backup State Toggle */}
                      <td className="p-4">
                        <button
                          onClick={() => onToggleBackup(p)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border flex items-center space-x-1 transition-all cursor-pointer ${
                            p.backupStatus === 'backed_up'
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                              : 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
                          }`}
                        >
                          {p.backupStatus === 'backed_up' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Backed Up</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Cloud Link */}
                      <td className="p-4">
                        {p.googleDriveLink ? (
                          <a
                            href={p.googleDriveLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 inline-flex items-center space-x-1 bg-charcoal-800 hover:bg-charcoal-700 text-gold-400 rounded-lg text-[10px]"
                            title="Open Google Drive link"
                          >
                            <Cloud className="w-3 h-3 text-blue-400" />
                            <span>Drive</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-gray-600 text-[10px]">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <button
                          onClick={() => onOpenEditModal(p)}
                          className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 hover:text-gold-400 transition-colors cursor-pointer"
                          title="Edit Storage Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
