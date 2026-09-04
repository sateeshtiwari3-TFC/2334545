import React, { useState } from 'react';
import { 
  HardDrive, 
  MapPin, 
  Database, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet, 
  Plus, 
  Edit2, 
  AlertTriangle,
  FolderOpen,
  Sparkles,
  Layers,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../../types';

interface HardDiskInventoryProps {
  projects: Project[];
  onOpenEditModal: (project: Project) => void;
  onToggleBackup: (project: Project) => Promise<void>;
  onOpenBulkAssignModal: () => void;
  onFilterByDrive?: (driveName: string) => void;
}

interface DriveGroup {
  name: string;
  location: string;
  projects: Project[];
  totalSizeGb: number;
  backedUpCount: number;
  pendingCount: number;
}

export default function HardDiskInventory({
  projects,
  onOpenEditModal,
  onToggleBackup,
  onOpenBulkAssignModal,
  onFilterByDrive
}: HardDiskInventoryProps) {
  const [expandedDrive, setExpandedDrive] = useState<string | null>(null);
  const [driveSearch, setDriveSearch] = useState('');

  // Helper to parse size to GB
  const parseSizeInGb = (sizeStr?: string): number => {
    if (!sizeStr) return 0;
    const num = parseFloat(sizeStr);
    if (isNaN(num)) return 0;
    if (sizeStr.toLowerCase().includes('tb')) return num * 1024;
    return num;
  };

  // Group projects by hardDiskName
  const driveMap: Record<string, DriveGroup> = {};
  const unassignedProjects: Project[] = [];

  projects.forEach(p => {
    const rawDrive = p.hardDiskName ? p.hardDiskName.trim() : '';
    if (!rawDrive) {
      unassignedProjects.push(p);
      return;
    }

    if (!driveMap[rawDrive]) {
      driveMap[rawDrive] = {
        name: rawDrive,
        location: p.location || 'Not Specified',
        projects: [],
        totalSizeGb: 0,
        backedUpCount: 0,
        pendingCount: 0
      };
    }

    driveMap[rawDrive].projects.push(p);
    driveMap[rawDrive].totalSizeGb += parseSizeInGb(p.dataSize);
    if (p.backupStatus === 'backed_up') {
      driveMap[rawDrive].backedUpCount += 1;
    } else {
      driveMap[rawDrive].pendingCount += 1;
    }

    // Keep best location info if available
    if (p.location && driveMap[rawDrive].location === 'Not Specified') {
      driveMap[rawDrive].location = p.location;
    }
  });

  const allDrives = Object.values(driveMap).sort((a, b) => b.totalSizeGb - a.totalSizeGb);

  const filteredDrives = allDrives.filter(d => 
    !driveSearch || 
    d.name.toLowerCase().includes(driveSearch.toLowerCase()) ||
    d.location.toLowerCase().includes(driveSearch.toLowerCase()) ||
    d.projects.some(p => p.coupleName.toLowerCase().includes(driveSearch.toLowerCase()))
  );

  const totalDisksCount = allDrives.length;
  const totalVolumeGb = allDrives.reduce((sum, d) => sum + d.totalSizeGb, 0);
  const totalVolumeTb = totalVolumeGb / 1024;

  const toggleExpand = (driveName: string) => {
    setExpandedDrive(prev => prev === driveName ? null : driveName);
  };

  // Export Manifest for a single drive
  const handleExportDriveManifest = (drive: DriveGroup) => {
    const headers = ['Project ID', 'Couple Name', 'Studio Name', 'Event Type', 'Data Size', 'Backup Status', 'Raw Path', 'Location'];
    const rows = drive.projects.map(p => [
      `"${p.id}"`,
      `"${p.coupleName}"`,
      `"${p.studioName || ''}"`,
      `"${p.eventType}"`,
      `"${p.dataSize || ''}"`,
      `"${p.backupStatus === 'backed_up' ? 'BACKED UP' : 'PENDING'}"`,
      `"${p.rawDataFolder || ''}"`,
      `"${p.location || drive.location}"`
    ]);

    const csvContent = [
      `# PHYSICAL HARD DISK ASSET MANIFEST: ${drive.name}`,
      `# Storage Location: ${drive.location}`,
      `# Total Projects: ${drive.projects.length} | Volume: ${(drive.totalSizeGb / 1024).toFixed(2)} TB`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HDD_Manifest_${drive.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Search */}
      <div className="p-6 rounded-3xl glass-panel border border-luxury-green-800/25 bg-gradient-to-b from-charcoal-900/90 to-charcoal-950/90 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3.5 bg-luxury-green-800/30 border border-gold-500/30 rounded-2xl">
              <HardDrive className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white">
                Physical Hard Drive Asset Inventory
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Monitoring <span className="text-gold-400 font-bold font-mono">{totalDisksCount} active hard disk units</span> containing {projects.length - unassignedProjects.length} archived wedding productions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3.5 top-3 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search Hard Disks or Racks..."
                value={driveSearch}
                onChange={(e) => setDriveSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-charcoal-950 border border-luxury-green-800/30 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/50"
              />
            </div>

            {/* Quick Bulk Assign Action */}
            <button
              onClick={onOpenBulkAssignModal}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Bulk Offload to HDD</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unassigned Warning Card (If any projects lack HDD) */}
      {unassignedProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-red-950/20 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-red-500/15 border border-red-500/40 rounded-xl text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-400 font-sans">
                {unassignedProjects.length} Wedding Film{unassignedProjects.length > 1 ? 's' : ''} Missing Hard Disk Tag
              </h4>
              <p className="text-xs text-gray-300 mt-0.5">
                These projects have not been assigned to a physical hard drive in the studio vault.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {unassignedProjects.slice(0, 4).map(p => (
                  <span key={p.id} className="text-[10px] font-mono px-2 py-0.5 bg-charcoal-900 border border-red-500/30 text-gray-300 rounded-lg">
                    {p.coupleName} ({p.id})
                  </span>
                ))}
                {unassignedProjects.length > 4 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-charcoal-900 text-gray-400 rounded-lg">
                    +{unassignedProjects.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onOpenBulkAssignModal}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer shrink-0"
          >
            Fix & Assign HDD Now
          </button>
        </motion.div>
      )}

      {/* Grid of Hard Drive Units */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrives.map((drive) => {
          const isExpanded = expandedDrive === drive.name;
          const driveSizeTb = (drive.totalSizeGb / 1024).toFixed(2);
          const backupPercent = drive.projects.length > 0 
            ? Math.round((drive.backedUpCount / drive.projects.length) * 100) 
            : 0;

          return (
            <motion.div
              key={drive.name}
              layout
              className={`p-6 rounded-3xl transition-all space-y-4 border ${
                isExpanded 
                  ? 'glass-panel bg-charcoal-900 border-gold-500/40 shadow-xl col-span-1 md:col-span-2 lg:col-span-3' 
                  : 'glass-panel bg-gradient-to-b from-charcoal-900/90 to-charcoal-950/90 border-luxury-green-800/20 hover:border-gold-500/30 shadow-lg'
              }`}
            >
              {/* Drive Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-3 bg-charcoal-950 border border-luxury-green-800/40 rounded-2xl text-gold-400 shrink-0">
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-white font-display">{drive.name}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 font-mono">
                      <MapPin className="w-3 h-3 text-gold-400" />
                      <span>{drive.location}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-bold text-emerald-400 font-mono block">
                    {driveSizeTb} TB
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono block">
                    {drive.projects.length} Wedding Film{drive.projects.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Progress and Backup Health Meter */}
              <div className="space-y-1.5 p-3 bg-charcoal-950/70 rounded-2xl border border-luxury-green-800/15">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-gray-400 uppercase">Backup Redundancy</span>
                  <span className={backupPercent === 100 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {drive.backedUpCount} / {drive.projects.length} Backed Up ({backupPercent}%)
                  </span>
                </div>
                <div className="w-full bg-charcoal-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      backupPercent === 100 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                        : 'bg-gradient-to-r from-amber-500 to-gold-400'
                    }`}
                    style={{ width: `${backupPercent}%` }}
                  />
                </div>
              </div>

              {/* Quick Actions Footer on Card */}
              <div className="flex items-center justify-between pt-2 border-t border-luxury-green-800/15">
                <button
                  onClick={() => handleExportDriveManifest(drive)}
                  className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-gold-400 hover:text-white transition-colors text-[11px] font-mono flex items-center space-x-1 cursor-pointer"
                  title="Export Hard Disk Asset Manifest CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Manifest</span>
                </button>

                <button
                  onClick={() => toggleExpand(drive.name)}
                  className="px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 hover:text-white transition-colors text-xs font-mono font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <span>{isExpanded ? 'Hide Projects' : `View ${drive.projects.length} Projects`}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded Project List for this Hard Disk */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-luxury-green-800/20 space-y-3"
                  >
                    <h5 className="text-xs font-bold text-gold-400 uppercase font-mono tracking-wider">
                      Archived Films on {drive.name} ({drive.projects.length})
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {drive.projects.map((p) => (
                        <div
                          key={p.id}
                          className="p-3.5 rounded-2xl bg-charcoal-950 border border-luxury-green-800/20 space-y-2 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-gold-400 font-bold">{p.id}</span>
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono uppercase font-bold border ${
                                p.backupStatus === 'backed_up'
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              }`}>
                                {p.backupStatus === 'backed_up' ? 'Backed Up' : 'Pending'}
                              </span>
                            </div>
                            <h6 className="text-xs font-bold text-white font-sans mt-1">{p.coupleName}</h6>
                            <p className="text-[11px] text-gray-400">{p.studioName} • {p.eventType}</p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono">
                            <span className="text-emerald-400 font-bold">{p.dataSize || 'Unmeasured'}</span>
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => onToggleBackup(p)}
                                className="p-1 rounded bg-charcoal-800 hover:bg-charcoal-700 text-gray-400 hover:text-white cursor-pointer"
                                title="Toggle Backup State"
                              >
                                {p.backupStatus === 'backed_up' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                                )}
                              </button>
                              <button
                                onClick={() => onOpenEditModal(p)}
                                className="p-1 rounded bg-charcoal-800 hover:bg-charcoal-700 text-gray-400 hover:text-gold-300 cursor-pointer"
                                title="Edit Project Specs"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {filteredDrives.length === 0 && (
          <div className="col-span-3 text-center py-20 bg-charcoal-950/40 rounded-3xl border border-white/5 space-y-3">
            <HardDrive className="w-12 h-12 text-gray-600 mx-auto animate-pulse" />
            <h4 className="text-sm font-bold text-gray-300">No Physical Hard Drives Matched</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto font-mono">
              All search filters resulted in empty drive logs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
