import React, { useState, useEffect } from 'react';
import { 
  X, 
  HardDrive, 
  MapPin, 
  FolderOpen, 
  Cloud, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Link,
  Layers,
  Database,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../../types';

interface StorageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  projects: Project[];
  existingDrives: string[];
  existingLocations: string[];
  onSave: (projectId: string, updates: Partial<Project>) => Promise<void>;
}

export default function StorageEditModal({
  isOpen,
  onClose,
  project,
  projects,
  existingDrives,
  existingLocations,
  onSave
}: StorageEditModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [hardDiskName, setHardDiskName] = useState('');
  const [dataSize, setDataSize] = useState('');
  const [location, setLocation] = useState('');
  const [rawDataFolder, setRawDataFolder] = useState('');
  const [deliveryFolder, setDeliveryFolder] = useState('');
  const [finalExportFolder, setFinalExportFolder] = useState('');
  const [googleDriveLink, setGoogleDriveLink] = useState('');
  const [backupStatus, setBackupStatus] = useState<'pending' | 'backed_up'>('pending');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setSelectedProjectId(project.id);
      setHardDiskName(project.hardDiskName || '');
      setDataSize(project.dataSize || '');
      setLocation(project.location || '');
      setRawDataFolder(project.rawDataFolder || '');
      setDeliveryFolder(project.deliveryFolder || '');
      setFinalExportFolder(project.finalExportFolder || '');
      setGoogleDriveLink(project.googleDriveLink || '');
      setBackupStatus(project.backupStatus || 'pending');
    } else {
      setSelectedProjectId('');
      setHardDiskName('');
      setDataSize('');
      setLocation('');
      setRawDataFolder('');
      setDeliveryFolder('');
      setFinalExportFolder('');
      setGoogleDriveLink('');
      setBackupStatus('pending');
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSelectProjectChange = (projId: string) => {
    setSelectedProjectId(projId);
    const found = projects.find(p => p.id === projId);
    if (found) {
      setHardDiskName(found.hardDiskName || '');
      setDataSize(found.dataSize || '');
      setLocation(found.location || '');
      setRawDataFolder(found.rawDataFolder || '');
      setDeliveryFolder(found.deliveryFolder || '');
      setFinalExportFolder(found.finalExportFolder || '');
      setGoogleDriveLink(found.googleDriveLink || '');
      setBackupStatus(found.backupStatus || 'pending');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = project ? project.id : selectedProjectId;
    if (!targetId) {
      alert('Please select a project to configure storage.');
      return;
    }

    setSaving(true);
    try {
      const updates: Partial<Project> = {
        hardDiskName: hardDiskName.trim(),
        dataSize: dataSize.trim(),
        location: location.trim(),
        rawDataFolder: rawDataFolder.trim(),
        deliveryFolder: deliveryFolder.trim(),
        finalExportFolder: finalExportFolder.trim(),
        googleDriveLink: googleDriveLink.trim(),
        backupStatus,
      };

      await onSave(targetId, updates);
      onClose();
    } catch (err) {
      console.error('Error saving storage specifications:', err);
      alert('Failed to save storage specifications.');
    } finally {
      setSaving(false);
    }
  };

  const sizePresets = ['450 GB', '800 GB', '1.2 TB', '1.8 TB', '2.5 TB', '4.0 TB'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-2xl bg-charcoal-900 border border-gold-500/30 rounded-3xl p-6 md:p-8 overflow-y-auto max-h-[90vh] shadow-2xl space-y-6 custom-scrollbar"
        >
          {/* Top Decorative Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-luxury-green-800/20 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-luxury-green-800/30 border border-gold-500/30 rounded-2xl">
                <HardDrive className="w-6 h-6 text-gold-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-white">
                  {project ? 'Edit Storage & HDD Registry' : 'Add New Storage Log'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {project 
                    ? `Configuring physical and cloud storage paths for ${project.coupleName}`
                    : 'Map wedding footage to physical hard drives, directory paths & cloud links'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-charcoal-800/80 border border-white/5 hover:border-white/15 hover:bg-charcoal-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Project Selection */}
            {!project ? (
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">
                  Select Target Wedding Film *
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleSelectProjectChange(e.target.value)}
                  required
                  className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-gold-500/40 font-medium"
                >
                  <option value="" disabled>-- Choose Wedding Film Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-charcoal-950 text-white">
                      [{p.id}] {p.coupleName} • {p.studioName} ({p.eventType})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3.5 bg-charcoal-950/80 border border-luxury-green-800/20 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-gold-400 uppercase font-bold">
                    Target Project ID: {project.id}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{project.coupleName}</h4>
                  <p className="text-xs text-gray-400">{project.studioName} • {project.eventType}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase border ${
                  project.backupStatus === 'backed_up'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                }`}>
                  {project.backupStatus === 'backed_up' ? 'Backed Up' : 'Backup Pending'}
                </span>
              </div>
            )}

            {/* 2. Physical Storage & HDD Specs */}
            <div className="p-4 bg-charcoal-950/40 rounded-2xl border border-luxury-green-800/20 space-y-4">
              <div className="flex items-center space-x-2 text-gold-400 font-mono text-xs uppercase font-bold border-b border-luxury-green-800/20 pb-2">
                <Database className="w-4 h-4" />
                <span>Physical Disk & Location Specifications</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* HDD Name */}
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                    Hard Disk Name / Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDD-01 (4TB) or LA-PRO-02"
                    value={hardDiskName}
                    onChange={(e) => setHardDiskName(e.target.value)}
                    className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500/40 font-medium placeholder-gray-600"
                  />
                  {existingDrives.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {existingDrives.slice(0, 3).map(drive => (
                        <button
                          key={drive}
                          type="button"
                          onClick={() => setHardDiskName(drive)}
                          className="text-[9px] font-mono px-1.5 py-0.5 bg-charcoal-800 hover:bg-charcoal-700 text-gold-300 rounded cursor-pointer"
                        >
                          {drive}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footage Size */}
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                    Footage / Data Size
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1.5 TB or 850 GB"
                    value={dataSize}
                    onChange={(e) => setDataSize(e.target.value)}
                    className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500/40 font-medium placeholder-gray-600"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {sizePresets.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDataSize(s)}
                        className="text-[9px] font-mono px-1.5 py-0.5 bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 rounded cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Physical Location */}
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gold-400" /> Physical Rack/Shelf
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shelf A-3, Main Vault"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500/40 font-medium placeholder-gray-600"
                  />
                  {existingLocations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {existingLocations.slice(0, 3).map(loc => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setLocation(loc)}
                          className="text-[9px] font-mono px-1.5 py-0.5 bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 rounded cursor-pointer"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Directory File Paths */}
            <div className="p-4 bg-charcoal-950/40 rounded-2xl border border-luxury-green-800/20 space-y-3">
              <div className="flex items-center space-x-2 text-gold-400 font-mono text-xs uppercase font-bold border-b border-luxury-green-800/20 pb-2">
                <FolderOpen className="w-4 h-4" />
                <span>Internal System Directory Paths</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                    Raw Footage Folder
                  </label>
                  <input
                    type="text"
                    placeholder="D:/RAW/2026/CoupleName"
                    value={rawDataFolder}
                    onChange={(e) => setRawDataFolder(e.target.value)}
                    className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500/40 font-mono placeholder-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                    Delivery Master Folder
                  </label>
                  <input
                    type="text"
                    placeholder="E:/DELIVERY/CoupleName"
                    value={deliveryFolder}
                    onChange={(e) => setDeliveryFolder(e.target.value)}
                    className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500/40 font-mono placeholder-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                    Final Render / Teasers Path
                  </label>
                  <input
                    type="text"
                    placeholder="F:/EXPORTS/Final_Cuts"
                    value={finalExportFolder}
                    onChange={(e) => setFinalExportFolder(e.target.value)}
                    className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500/40 font-mono placeholder-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* 4. Google Drive Cloud Workspace Link */}
            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-blue-400" />
                  Google Drive / Cloud Workspace Share Link
                </span>
                {googleDriveLink && (
                  <a
                    href={googleDriveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-mono text-gold-400 hover:underline flex items-center gap-1"
                  >
                    <span>Test Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={googleDriveLink}
                onChange={(e) => setGoogleDriveLink(e.target.value)}
                className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-gold-500/40 font-mono placeholder-gray-600"
              />
            </div>

            {/* 5. Backup Verification Status */}
            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">
                Physical Backup Verification
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBackupStatus('pending')}
                  className={`p-3 rounded-2xl border text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    backupStatus === 'pending'
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 shadow-md shadow-amber-500/5'
                      : 'bg-charcoal-950 border-white/5 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>Backup Pending (Raw on Primary Only)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBackupStatus('backed_up')}
                  className={`p-3 rounded-2xl border text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    backupStatus === 'backed_up'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-md shadow-emerald-500/5'
                      : 'bg-charcoal-950 border-white/5 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified Backed Up (Redundant Safe)</span>
                </button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end items-center gap-3 border-t border-luxury-green-800/20 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-charcoal-800 hover:bg-charcoal-750 text-gray-300 hover:text-white font-medium text-xs rounded-2xl border border-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:opacity-50 text-charcoal-950 font-bold text-xs rounded-2xl shadow-lg shadow-gold-500/10 transition-all cursor-pointer flex items-center space-x-2"
              >
                {saving ? (
                  <span>Saving Storage Specifications...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Save Storage Log</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
