import React from 'react';
import { HardDrive, Link2, FolderClosed, Database, MapPin, CheckCircle2, Clock } from 'lucide-react';

interface IntakeTabStorageProps {
  hardDiskName: string;
  setHardDiskName: (val: string) => void;
  dataSize: string;
  setDataSize: (val: string) => void;
  backupStatus: 'pending' | 'backed_up';
  setBackupStatus: (val: 'pending' | 'backed_up') => void;
  location: string;
  setLocation: (val: string) => void;
  googleDriveLink: string;
  setGoogleDriveLink: (val: string) => void;
  rawDataFolder: string;
  setRawDataFolder: (val: string) => void;
  deliveryFolder: string;
  setDeliveryFolder: (val: string) => void;
  finalExportFolder: string;
  setFinalExportFolder: (val: string) => void;
}

export default function IntakeTabStorage({
  hardDiskName,
  setHardDiskName,
  dataSize,
  setDataSize,
  backupStatus,
  setBackupStatus,
  location,
  setLocation,
  googleDriveLink,
  setGoogleDriveLink,
  rawDataFolder,
  setRawDataFolder,
  deliveryFolder,
  setDeliveryFolder,
  finalExportFolder,
  setFinalExportFolder
}: IntakeTabStorageProps) {

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 bg-gold-500/10 border border-gold-500/20 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold">
            💾
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-display uppercase tracking-wider">Step 5: Physical Storage, Cloud & Backups</h4>
            <p className="text-xs text-gray-400 font-mono">Track hard drive serials, shelf locations, raw footage size, backup integrity, and Google Drive links.</p>
          </div>
        </div>
      </div>

      {/* Storage Hardware Info */}
      <div className="p-5 bg-charcoal-900/60 rounded-2xl border border-white/10 space-y-4">
        <h5 className="text-xs font-semibold text-gray-400 font-mono uppercase tracking-wider">
          Physical Drive & Media Specs
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-mono text-gray-400 mb-1.5 uppercase font-bold">HDD Reference Name / ID</label>
            <div className="relative">
              <HardDrive className="absolute left-3 top-3 w-4 h-4 text-gold-400" />
              <input 
                type="text" 
                placeholder="e.g. WD BLACK 4TB - #08" 
                value={hardDiskName} 
                onChange={(e) => setHardDiskName(e.target.value)} 
                className="w-full bg-charcoal-950 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500/50 font-mono" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-gray-400 mb-1.5 uppercase font-bold">Shelf / Rack Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-sky-400" />
              <input 
                type="text" 
                placeholder="e.g. Rack A - Shelf 2" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                className="w-full bg-charcoal-950 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500/50 font-mono" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-gray-400 mb-1.5 uppercase font-bold">Raw Footage Size</label>
            <div className="relative">
              <Database className="absolute left-3 top-3 w-4 h-4 text-amber-400" />
              <input 
                type="text" 
                placeholder="e.g. 1.8 TB (4 Cards)" 
                value={dataSize} 
                onChange={(e) => setDataSize(e.target.value)} 
                className="w-full bg-charcoal-950 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500/50 font-mono" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-gray-400 mb-1.5 uppercase font-bold">Backup Integrity Status</label>
            <select 
              value={backupStatus} 
              onChange={(e) => setBackupStatus(e.target.value as 'pending' | 'backed_up')} 
              className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold focus:outline-none cursor-pointer ${
                backupStatus === 'backed_up'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-charcoal-950 border-white/10 text-amber-300'
              }`}
            >
              <option value="pending" className="bg-charcoal-950 text-amber-300">⏳ Pending Backup</option>
              <option value="backed_up" className="bg-charcoal-950 text-emerald-300">✅ Backed Up Safely</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cloud & Directory Folder Structure */}
      <div className="p-5 bg-charcoal-900/60 rounded-2xl border border-white/10 space-y-4">
        <h5 className="text-xs font-semibold text-gray-400 font-mono uppercase tracking-wider">
          Cloud Link & Folder Taxonomy
        </h5>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
            Google Drive / Cloud Asset Link
          </label>
          <div className="relative">
            <Link2 className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
            <input 
              type="url" 
              placeholder="https://drive.google.com/drive/folders/..." 
              value={googleDriveLink} 
              onChange={(e) => setGoogleDriveLink(e.target.value)} 
              className="w-full bg-charcoal-950 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-xs md:text-sm text-white focus:outline-none focus:border-gold-500/50 placeholder-gray-600 font-mono" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-[11px] text-gray-500 font-semibold mb-1 font-mono uppercase tracking-wider">Raw Footage Folder</label>
            <div className="relative">
              <FolderClosed className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
              <input 
                type="text" 
                placeholder="01_Raw_Footage" 
                value={rawDataFolder} 
                onChange={(e) => setRawDataFolder(e.target.value)} 
                className="w-full bg-charcoal-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500/50 font-mono" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 font-semibold mb-1 font-mono uppercase tracking-wider">Deliveries Folder</label>
            <div className="relative">
              <FolderClosed className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gold-500" />
              <input 
                type="text" 
                placeholder="02_Edited_Deliveries" 
                value={deliveryFolder} 
                onChange={(e) => setDeliveryFolder(e.target.value)} 
                className="w-full bg-charcoal-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500/50 font-mono" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 font-semibold mb-1 font-mono uppercase tracking-wider">Final Archive Folder</label>
            <div className="relative">
              <FolderClosed className="absolute left-3 top-2.5 w-3.5 h-3.5 text-emerald-500" />
              <input 
                type="text" 
                placeholder="03_Final_Master_Archives" 
                value={finalExportFolder} 
                onChange={(e) => setFinalExportFolder(e.target.value)} 
                className="w-full bg-charcoal-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500/50 font-mono" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
