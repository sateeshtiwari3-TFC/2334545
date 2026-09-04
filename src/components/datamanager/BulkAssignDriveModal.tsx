import React, { useState } from 'react';
import { 
  FolderLock, 
  MapPin, 
  HardDrive, 
  CheckCircle2, 
  Clock, 
  X, 
  Sparkles,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../../types';

interface BulkAssignDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProjects: Project[];
  existingDrives: string[];
  existingLocations: string[];
  onAssign: (updates: {
    hardDiskName?: string;
    location?: string;
    backupStatus?: 'pending' | 'backed_up';
  }) => Promise<void>;
}

export default function BulkAssignDriveModal({
  isOpen,
  onClose,
  selectedProjects,
  existingDrives,
  existingLocations,
  onAssign
}: BulkAssignDriveModalProps) {
  const [hardDiskName, setHardDiskName] = useState('');
  const [location, setLocation] = useState('');
  const [backupStatus, setBackupStatus] = useState<'pending' | 'backed_up' | 'keep'>('keep');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hardDiskName && !location && backupStatus === 'keep') {
      alert('Please specify at least one field to update for the selected projects.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updates: {
        hardDiskName?: string;
        location?: string;
        backupStatus?: 'pending' | 'backed_up';
      } = {};

      if (hardDiskName.trim()) updates.hardDiskName = hardDiskName.trim();
      if (location.trim()) updates.location = location.trim();
      if (backupStatus !== 'keep') updates.backupStatus = backupStatus;

      await onAssign(updates);
      onClose();
    } catch (err) {
      console.error('Error applying bulk drive assignment:', err);
      alert('Failed to update selected projects. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-xl bg-charcoal-900 border border-gold-500/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 overflow-hidden"
        >
          {/* Top Decorative Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between border-b border-luxury-green-800/20 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-luxury-green-800/30 border border-gold-500/30 rounded-2xl">
                <Layers className="w-6 h-6 text-gold-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-white">
                  Bulk Assign Hard Disk & Storage
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Updating storage registry for <span className="text-gold-400 font-bold font-mono">{selectedProjects.length} selected wedding film{selectedProjects.length > 1 ? 's' : ''}</span>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Selected Projects Pill Strip */}
            <div>
              <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">
                Target Projects Scope ({selectedProjects.length})
              </span>
              <div className="max-h-24 overflow-y-auto p-2.5 bg-charcoal-950/80 border border-luxury-green-800/20 rounded-2xl flex flex-wrap gap-1.5 custom-scrollbar">
                {selectedProjects.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-charcoal-900 border border-gold-500/20 rounded-xl text-[11px] text-gray-300 font-mono"
                  >
                    <span className="text-gold-400 font-bold">{p.id}</span>
                    <span>• {p.coupleName}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Hard Disk Input with Quick Suggestions */}
            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Target Physical Hard Disk Name</span>
                <span className="text-gray-500 lowercase">(leave blank to keep current)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. HDD-01 (4TB) or SEAGATE-BACKUP-02"
                  value={hardDiskName}
                  onChange={(e) => setHardDiskName(e.target.value)}
                  className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-gold-500/50 font-medium placeholder-gray-600"
                />
              </div>

              {/* Quick Drive Suggestions */}
              {existingDrives.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] font-mono text-gray-500">Existing Disks:</span>
                  {existingDrives.slice(0, 5).map((drive) => (
                    <button
                      key={drive}
                      type="button"
                      onClick={() => setHardDiskName(drive)}
                      className="px-2 py-0.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 border border-white/5 text-[10px] font-mono text-gold-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {drive}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Storage Location Input with Suggestions */}
            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Physical Storage Location / Rack</span>
                <span className="text-gray-500 lowercase">(leave blank to keep current)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Shelf A-3, Studio Vault Mumbai"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-gold-500/50 font-medium placeholder-gray-600"
                />
              </div>

              {/* Quick Location Suggestions */}
              {existingLocations.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] font-mono text-gray-500">Racks/Shelves:</span>
                  {existingLocations.slice(0, 4).map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className="px-2 py-0.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 border border-white/5 text-[10px] font-mono text-gray-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Backup Status Option */}
            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">
                Bulk Backup Status Update
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setBackupStatus('keep')}
                  className={`p-3 rounded-2xl border text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    backupStatus === 'keep'
                      ? 'bg-charcoal-800 border-gold-500/40 text-white shadow-md'
                      : 'bg-charcoal-950 border-white/5 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span>Do Not Change</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBackupStatus('backed_up')}
                  className={`p-3 rounded-2xl border text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    backupStatus === 'backed_up'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-md shadow-emerald-500/5'
                      : 'bg-charcoal-950 border-white/5 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Backed Up</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBackupStatus('pending')}
                  className={`p-3 rounded-2xl border text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    backupStatus === 'pending'
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 shadow-md shadow-amber-500/5'
                      : 'bg-charcoal-950 border-white/5 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Mark Pending</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-luxury-green-800/20">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-charcoal-800 hover:bg-charcoal-750 text-gray-300 hover:text-white font-medium text-xs rounded-2xl border border-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:opacity-50 text-charcoal-950 font-bold text-xs rounded-2xl shadow-lg shadow-gold-500/10 transition-all cursor-pointer flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <span>Applying Batch Updates...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply to {selectedProjects.length} Projects</span>
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
