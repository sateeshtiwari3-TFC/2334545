import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { SafeChartContainer } from '../common/SafeChartContainer';
import { 
  HardDrive, 
  CheckCircle2, 
  Clock, 
  Cloud, 
  Database, 
  TrendingUp, 
  Building, 
  Film,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Project } from '../../types';

interface StorageAnalyticsProps {
  projects: Project[];
}

export default function StorageAnalytics({ projects }: StorageAnalyticsProps) {
  // Helper to parse size
  const parseSizeInGb = (sizeStr?: string): number => {
    if (!sizeStr) return 0;
    const num = parseFloat(sizeStr);
    if (isNaN(num)) return 0;
    if (sizeStr.toLowerCase().includes('tb')) return num * 1024;
    return num;
  };

  const totalProjects = projects.length;
  const totalSizeGb = projects.reduce((sum, p) => sum + parseSizeInGb(p.dataSize), 0);
  const totalSizeTb = (totalSizeGb / 1024).toFixed(2);

  const backedUpProjects = projects.filter(p => p.backupStatus === 'backed_up');
  const pendingProjects = projects.filter(p => !p.backupStatus || p.backupStatus === 'pending');
  const backedUpSizeGb = backedUpProjects.reduce((sum, p) => sum + parseSizeInGb(p.dataSize), 0);
  const backedUpSizeTb = (backedUpSizeGb / 1024).toFixed(2);
  const backupRate = totalProjects > 0 ? Math.round((backedUpProjects.length / totalProjects) * 100) : 0;

  // Cloud synced count
  const cloudSynced = projects.filter(p => !!p.googleDriveLink && p.googleDriveLink.trim() !== '');
  const cloudRate = totalProjects > 0 ? Math.round((cloudSynced.length / totalProjects) * 100) : 0;

  // Distinct Drives
  const distinctDrives = new Set(projects.map(p => p.hardDiskName).filter(Boolean)).size;

  // 1. Storage by Studio
  const studioMap: Record<string, number> = {};
  projects.forEach(p => {
    const studio = p.studioName || 'Direct Clients';
    studioMap[studio] = (studioMap[studio] || 0) + parseSizeInGb(p.dataSize);
  });

  const studioData = Object.entries(studioMap)
    .map(([name, sizeGb]) => ({
      name,
      tb: parseFloat((sizeGb / 1024).toFixed(2)),
      gb: Math.round(sizeGb)
    }))
    .sort((a, b) => b.gb - a.gb)
    .slice(0, 6);

  // 2. Storage by Event Type
  const eventMap: Record<string, number> = {};
  projects.forEach(p => {
    const evt = p.eventType || 'Wedding Film';
    eventMap[evt] = (eventMap[evt] || 0) + parseSizeInGb(p.dataSize);
  });

  const eventData = Object.entries(eventMap)
    .map(([name, sizeGb]) => ({
      name,
      value: parseFloat((sizeGb / 1024).toFixed(2))
    }))
    .sort((a, b) => b.value - a.value);

  // 3. Storage by Physical Location
  const locationMap: Record<string, number> = {};
  projects.forEach(p => {
    const loc = p.location || 'Unassigned Rack';
    locationMap[loc] = (locationMap[loc] || 0) + 1;
  });

  const locationData = Object.entries(locationMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const COLORS = ['#D4AF37', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Ingested Storage */}
        <div className="p-5 rounded-3xl glass-panel border border-luxury-green-800/25 bg-gradient-to-b from-charcoal-900/90 to-charcoal-950/90 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span className="uppercase tracking-wider">Total Storage Ingested</span>
            <Database className="w-4 h-4 text-gold-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">{totalSizeTb}</span>
            <span className="text-sm font-mono text-gold-400">TB</span>
          </div>
          <p className="text-[11px] text-gray-500 font-mono">
            Across {totalProjects} wedding film projects
          </p>
        </div>

        {/* Backed Up Storage */}
        <div className="p-5 rounded-3xl glass-panel border border-luxury-green-800/25 bg-gradient-to-b from-charcoal-900/90 to-charcoal-950/90 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span className="uppercase tracking-wider">Redundant Safe Backup</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{backedUpSizeTb}</span>
            <span className="text-sm font-mono text-gray-400">TB ({backupRate}%)</span>
          </div>
          <p className="text-[11px] text-emerald-400/80 font-mono">
            {backedUpProjects.length} Verified Backed Up
          </p>
        </div>

        {/* Hard Drives Engaged */}
        <div className="p-5 rounded-3xl glass-panel border border-luxury-green-800/25 bg-gradient-to-b from-charcoal-900/90 to-charcoal-950/90 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span className="uppercase tracking-wider">Physical Hard Drives</span>
            <HardDrive className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">{distinctDrives}</span>
            <span className="text-sm font-mono text-gray-400">Drives</span>
          </div>
          <p className="text-[11px] text-gray-500 font-mono">
            Logged in studio vault racks
          </p>
        </div>

        {/* Cloud Workspace Synced */}
        <div className="p-5 rounded-3xl glass-panel border border-luxury-green-800/25 bg-gradient-to-b from-charcoal-900/90 to-charcoal-950/90 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span className="uppercase tracking-wider">Google Drive Synced</span>
            <Cloud className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-blue-400">{cloudRate}%</span>
            <span className="text-sm font-mono text-gray-400">({cloudSynced.length}/{totalProjects})</span>
          </div>
          <p className="text-[11px] text-blue-400/80 font-mono">
            Active cloud collaboration
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Studio Storage Volume Bar Chart */}
        <div className="p-6 rounded-3xl glass-panel border border-luxury-green-800/25 bg-gradient-to-b from-charcoal-900/90 to-charcoal-950/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-luxury-green-800/20 pb-3">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-gold-400" />
              <h4 className="text-sm font-bold text-white font-display">Storage Volume by Studio (TB)</h4>
            </div>
            <span className="text-[10px] font-mono text-gray-400">Top Studios</span>
          </div>

          <SafeChartContainer height={260} minHeight={240}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
              <BarChart data={studioData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" stroke="#6B7280" fontSize={10} fontStyle="italic" unit=" TB" />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={11} width={100} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#D4AF37', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} TB`, 'Storage Size']}
                />
                <Bar dataKey="tb" fill="#D4AF37" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SafeChartContainer>
        </div>

        {/* Event Type Storage Breakdown */}
        <div className="p-6 rounded-3xl glass-panel border border-luxury-green-800/25 bg-gradient-to-b from-charcoal-900/90 to-charcoal-950/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-luxury-green-800/20 pb-3">
            <div className="flex items-center space-x-2">
              <Film className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white font-display">Storage Distribution by Event Type</h4>
            </div>
            <span className="text-[10px] font-mono text-gray-400">Share Ratio</span>
          </div>

          <SafeChartContainer height={260} minHeight={240} className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
              <PieChart>
                <Pie
                  data={eventData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {eventData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#10B981', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} TB`, 'Footage Size']}
                />
              </PieChart>
            </ResponsiveContainer>
          </SafeChartContainer>
        </div>
      </div>

      {/* Storage Physical Locations Distribution Table */}
      <div className="p-6 rounded-3xl glass-panel border border-luxury-green-800/25 bg-gradient-to-b from-charcoal-900/90 to-charcoal-950/90 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-luxury-green-800/20 pb-3">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gold-400" />
            <h4 className="text-sm font-bold text-white font-display">Storage Shelves & Physical Location Index</h4>
          </div>
          <span className="text-[10px] font-mono text-gray-400">Hardware Allocation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {locationData.map((loc, idx) => (
            <div
              key={loc.name}
              className="p-3.5 rounded-2xl bg-charcoal-950/80 border border-luxury-green-800/20 flex items-center justify-between font-mono"
            >
              <div className="truncate pr-2">
                <span className="text-[10px] text-gray-500 block uppercase">Rack / Shelf</span>
                <span className="text-xs font-bold text-white truncate block">{loc.name}</span>
              </div>
              <span className="px-2.5 py-1 bg-charcoal-800 rounded-xl text-gold-400 font-bold text-xs">
                {loc.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
